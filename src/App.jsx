// src/App.js
import { useState, useEffect } from 'react';
import Login from './components/Login';
import CadastroForm from './components/CadastroForm';
import ListaCards from './components/ListaCards';
import DetalhesCard from './components/DetalhesCard';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('cadastro');
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [tipo, setTipo] = useState('pontos-turisticos');

  // Verifica se o usuário já está logado
  useEffect(() => {
    const saved = localStorage.getItem('admin_logged_in');
    if (saved === 'true') {
      setUser({ email: localStorage.getItem('admin_email') });
    }
    setLoading(false);
  }, []);

  const handleLogin = (email) => {
    localStorage.setItem('admin_logged_in', 'true');
    localStorage.setItem('admin_email', email);
    setUser({ email });
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_email');
    setUser(null);
  };

  const handleEdit = (item) => {
    setItemSelecionado(item);
  };

  const handleDelete = (id) => {
    // Atualiza a lista após exclusão
    setItemSelecionado(null);
  };

  const handleVoltar = () => {
    setItemSelecionado(null);
  };

  if (loading) return <div className="App">Carregando...</div>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-top">
                   
            <h1>🏨 Guia da Cidade - Painel Administrativo</h1>
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="btn-logout">
                Sair
              </button>
            </div>
          
        </div>

        {/* Menu de abas */}
        <nav className="nav-abas">
          <div className="abas-container">
            <button
              className={aba === 'cadastro' ? 'aba ativa' : 'aba'}
              onClick={() => {
                setAba('cadastro');
                setItemSelecionado(null);
              }}
            >
              ➕ Cadastrar
            </button>
            <button
              className={aba === 'lista' ? 'aba ativa' : 'aba'}
              onClick={() => {
                setAba('lista');
                setItemSelecionado(null);
              }}
            >
              📋 Listas
            </button>
          </div>
        </nav>
      </header>

      {/* Conteúdo principal */}
      <main className="main">
        {itemSelecionado ? (
          <DetalhesCard
            item={itemSelecionado}
            tipo={tipo}
            onVoltar={handleVoltar}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : aba === 'cadastro' ? (
          <CadastroForm />
        ) : (
          <>
            {/* Selector de tipo */}
            <div className="tipo-selector">
              <label>Tipo:</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="pontos-turisticos">Ponto Turístico</option>
                <option value="restaurantes">Restaurante</option>
                <option value="acomodacoes">Acomodação</option>
              </select>
            </div>

            {/* Lista de cards */}
            <ListaCards
              tipo={tipo}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Guia da Cidade - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}