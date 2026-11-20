export function getUserInfo() {
  const token = localStorage.getItem('admin_token');
  
  if (!token) return { role: 'city_admin', cidadeId: null };

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    
    return {
      // 🚨 LIMPEZA GARANTIDA: minúsculas e sem espaços
      role: (payload.role || 'city_admin').toLowerCase().trim(),
      cidadeId: payload.cidadeId ? String(payload.cidadeId).toLowerCase().trim() : null
    };
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return { role: 'city_admin', cidadeId: null };
  }
}