import { useState } from 'react';
import api from '../services/api'; // Importa o cliente centralizado que deteta o ambiente (Local ou Render)

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Utiliza o cliente centralizado que aponta automaticamente para a API correta
      const data = await api.post('/login', { email, password });

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_email', data.email);
      onLogin(data.email);

    } catch (err) {
      setError(err.message || 'Erro de conexão. Verifique sua internet.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>🔒 Guia da Cidade - Admin</h2>
        <p>Entre com suas credenciais para gerenciar os locais</p>

        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label>E-mail</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Senha</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}