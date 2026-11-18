// src/utils/getUserCity.js

/**
 * Extrai o cidadeId do token JWT do usuário logado.
 * Se for super_admin, pode retornar null ou uma cidade padrão, 
 * mas para city_admin, retorna a cidade travada dele.
 */
export function getCidadeIdDoUsuario() {
  const token = localStorage.getItem('admin_token');
  
  if (!token) return 'rolante'; // Fallback de segurança para MVP

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
    
    // Retorna o cidadeId se existir, senão fallback
    return payload.cidadeId || 'rolante';
  } catch (error) {
    console.error('Erro ao decodificar token para obter cidadeId:', error);
    return 'rolante'; // Fallback
  }
}