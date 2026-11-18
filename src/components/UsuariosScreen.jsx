// src/components/UsuariosScreen.jsx
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, User, X, Shield, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'city_admin',
    cidadeId: ''
  });

  // Carrega usuários e cidades ao montar o componente
  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      setCarregando(true);
      const [usuariosData, cidadesData] = await Promise.all([
        api.get('/admin/usuarios'),
        api.get('/admin/cidades')
      ]);
      setUsuarios(usuariosData);
      setCidades(cidadesData);
    } catch (error) {
      setErro('Erro ao carregar dados.');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const handleOpenModal = (usuario = null) => {
    if (usuario) {
      setEditando(usuario);
      setFormData({
        email: usuario.email,
        password: '', // Senha não é editada por aqui, apenas redefinida se necessário (futuro)
        displayName: usuario.displayName === 'Sem nome' ? '' : usuario.displayName,
        role: usuario.role === 'sem_role' ? 'city_admin' : usuario.role,
        cidadeId: usuario.cidadeId || ''
      });
    } else {
      setEditando(null);
      setFormData({
        email: '',
        password: '',
        displayName: '',
        role: 'city_admin',
        cidadeId: ''
      });
    }
    setModalAberto(true);
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      const payload = {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        cidadeId: formData.role === 'super_admin' ? null : formData.cidadeId
      };

      if (!editando && !formData.password) {
        throw new Error('A senha é obrigatória para novos usuários.');
      }
      if (!editando) {
        payload.password = formData.password;
      }

      if (editando) {
        await api.put(`/admin/usuarios/${editando.uid}`, payload);
      } else {
        await api.post('/admin/usuarios', payload);
      }
      
      setModalAberto(false);
      fetchDados();
    } catch (error) {
      setErro(error.message || 'Erro ao salvar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (uid, email) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${email}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await api.delete(`/admin/usuarios/${uid}`);
      fetchDados();
    } catch (error) {
      alert(error.message || 'Erro ao excluir usuário.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold"><ShieldAlert size={12} /> Super Admin</span>;
      case 'city_admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold"><Shield size={12} /> City Admin</span>;
      case 'editor':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Editor</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">Sem Role</span>;
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <span className="ml-3 text-slate-600">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Usuários</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie os administradores e suas permissões por cidade.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Cidade Vinculada</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{user.displayName !== 'Sem nome' ? user.displayName : user.email}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {user.cidadeId ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-100">
                          {user.cidadeId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Global (Todas)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar Permissões"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.uid, user.email)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editando ? 'Editar Permissões do Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {erro && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">E-mail *</label>
                <input
                  type="email"
                  required
                  disabled={!!editando} // Não permite mudar o email na edição por segurança do Firebase Auth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${editando ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="exemplo@cidade.rs.gov.br"
                />
              </div>

              {!editando && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Senha Inicial *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nome de Exibição</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Ex: Prefeito de Riozinho"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nível de Acesso *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value, cidadeId: e.target.value === 'super_admin' ? '' : formData.cidadeId })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="city_admin">City Admin</option>
                    <option value="editor">Editor</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Cidade *</label>
                  <select
                    required={formData.role !== 'super_admin'}
                    disabled={formData.role === 'super_admin'}
                    value={formData.cidadeId}
                    onChange={(e) => setFormData({ ...formData, cidadeId: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${formData.role === 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Selecione a cidade...</option>
                    {cidades.map((cidade) => (
                      <option key={cidade.slug} value={cidade.slug}>{cidade.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-70"
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <User size={16} />}
                  <span>{editando ? 'Salvar Alterações' : 'Criar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}