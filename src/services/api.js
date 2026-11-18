// src/services/api.js

const API_BASE_URL = import.meta.env.PROD
  ? 'https://turismo-api-vv62.onrender.com/api'
  : 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token');
  const isFormData = options.body && typeof options.body.append === 'function';

  const headers = {};

  // 🚨 CORREÇÃO: Só adiciona Content-Type JSON se houver um body real
  if (!isFormData && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const config = { ...options, headers };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 204) return { success: true };

    // 🚨 CORREÇÃO: Verificar se a resposta é realmente JSON antes de tentar parsear
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Ocorreu um erro na requisição.');
      }
      return data;
    } else {
      // Se o servidor retornou HTML (ex: erro 500 do Express), pegamos o texto para debug
      const text = await response.text();
      console.error('🚨 Resposta não-JSON do servidor (Provável crash no backend):', text.substring(0, 200));
      throw new Error(`Erro no servidor: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

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