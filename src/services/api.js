// src/services/api.js

const API_BASE_URL = import.meta.env.PROD
  ? 'https://turismo-api-vv62.onrender.com/api' // URL de produção no Render
  : 'http://localhost:3000/api';               // URL local para desenvolvimento

/**
 * Função auxiliar genérica para requisições HTTP
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token');

  // Detecção ultra-robusta de FormData (funciona em qualquer contexto de bundler/Vite)
  const isFormData = options.body && typeof options.body.append === 'function';

  const headers = {};

  // Se NÃO for FormData, adicionamos o Content-Type de JSON
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Adiciona o token de autorização se existir
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Mescla com quaisquer headers extras passados na opção
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Se a resposta for 204 No Content (ex: DELETE bem-sucedido)
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Ocorreu um erro na requisição.');
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

// Objeto com os métodos HTTP organizados
export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body: (body && typeof body.append === 'function') ? body : JSON.stringify(body),
  }),
  
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body: (body && typeof body.append === 'function') ? body : JSON.stringify(body),
  }),
  
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;