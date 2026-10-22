
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import CadastroForm from './components/CadastroForm';
import ListaCards from './components/ListaCards';
import DetalhesCard from './components/DetalhesCard';
import { Plus, List } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [aba, setAba] = useState('lista');
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [tipo, setTipo] = useState('pontos-turisticos');

  // Atualiza a lista quando um item é editado ou excluído.
  const [versaoLista, setVersaoLista] = useState(0);

  // Verifica se o usuário já está logado.
  useEffect(() => {
    const saved = localStorage.getItem('admin_logged_in');

    if (saved === 'true') {
      setUser({
        email: localStorage.getItem('admin_email')
      });
    }

    setLoading(false);
  }, []);

  // Login.
  const handleLogin = (email) => {
    localStorage.setItem('admin_logged_in', 'true');
    localStorage.setItem('admin_email', email);

    setUser({ email });
  };

  // Logout.
  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_token');

    setUser(null);
    setItemSelecionado(null);
    setAba('lista');
  };

  // Abre os detalhes do item selecionado.
  const handleEdit = (item) => {
    setItemSelecionado(item);
  };

  // Atualiza os detalhes após salvar uma edição.
  const handleAtualizarItem = (itemAtualizado) => {
    setItemSelecionado(itemAtualizado);
    setVersaoLista((versao) => versao + 1);
  };

  // Após excluir, volta para a lista e atualiza os registros.
  const handleDelete = () => {
    setItemSelecionado(null);
    setAba('lista');
    setVersaoLista((versao) => versao + 1);
  };

  // Volta dos detalhes para a lista.
  const handleVoltar = () => {
    setItemSelecionado(null);
    setAba('lista');
  };

  // Troca a categoria pela Sidebar.
  const handleMudarTipo = (novoTipo) => {
    setTipo(novoTipo);
    setItemSelecionado(null);
    setAba('lista');
  };

  // Exibe carregamento inicial.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-medium">
        Carregando sistema...
      </div>
    );
  }

  // Exibe login.
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      ativo={tipo}
      setAtivo={handleMudarTipo}
      onLogout={handleLogout}
      userEmail={user.email}
    >
      {/* Barra de ações: oculta enquanto os detalhes estão abertos. */}
      {!itemSelecionado && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 capitalize">
              {tipo.replace(/-/g, ' ')}
            </h3>

            <p className="text-sm text-slate-500">
              Gerencie os cadastros e informações exibidas no aplicativo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAba('lista')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                aba === 'lista'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'
              }`}
            >
              <List size={18} />
              <span>Ver Lista</span>
            </button>

            <button
              type="button"
              onClick={() => setAba('cadastro')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                aba === 'cadastro'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'
              }`}
            >
              <Plus size={18} />
              <span>Novo Cadastro</span>
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo principal. */}
      {itemSelecionado ? (
        <DetalhesCard
          key={`${tipo}-${itemSelecionado.id}`}
          item={itemSelecionado}
          tipo={tipo}
          onVoltar={handleVoltar}
          onEdit={handleAtualizarItem}
          onDelete={handleDelete}
        />
      ) : aba === 'cadastro' ? (
        <CadastroForm
          tipo={tipo}
          onSucesso={() => {
            setAba('lista');
            setVersaoLista((versao) => versao + 1);
          }}
        />
      ) : (
        <ListaCards
          key={`${tipo}-${versaoLista}`}
          tipo={tipo}
          onEdit={handleEdit}
        />
      )}
    </Layout>
  );
}
