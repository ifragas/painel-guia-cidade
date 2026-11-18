// src/utils/getUserInfo.js

export function getUserInfo() {
  const token = localStorage.getItem('admin_token');
  
  // Fallback seguro caso o token não exista ou seja inválido
  const fallback = { role: 'city_admin', cidadeId: 'rolante' };

  if (!token) return fallback;

  try {
    // Decodifica o payload do JWT (parte do meio do token)
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
      role: payload.role || 'city_admin',
      cidadeId: payload.cidadeId || 'rolante'
    };
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return fallback;
  }
}