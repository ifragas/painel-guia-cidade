// src/components/CidadesScreen.jsx
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Building2, X } from 'lucide-react';
import { api } from '../services/api';

export default function CidadesScreen() {
  const [cidades, setCidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    slug: '',
    nome: '',
    estado: '',
    corPrimaria: '#10B981',
    corSecundaria: '#F59E0B',
    temAppProprio: false,
    publicaNoSmartTurismo: true
  });

  const fetchCidades = async () => {
    try {
      setCarregando(true);
      const data = await api.get('/admin/cidades');
      setCidades(data);
    } catch (error) {
      setErro('Erro ao carregar cidades.');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchCidades();
  }, []);

  const handleOpenModal = (cidade = null) => {
    if (cidade) {
      setEditando(cidade);
      setFormData({
        slug: cidade.slug,
        nome: cidade.nome,
        estado: cidade.estado,
        corPrimaria: cidade.corPrimaria || '#10B981',
        corSecundaria: cidade.corSecundaria || '#F59E0B',
        temAppProprio: cidade.temAppProprio || false,
        publicaNoSmartTurismo: cidade.publicaNoSmartTurismo !== false
      });
    } else {
      setEditando(null);
      setFormData({
        slug: '',
        nome: '',
        estado: '',
        corPrimaria: '#10B981',
        corSecundaria: '#F59E0B',
        temAppProprio: false,
        publicaNoSmartTurismo: true
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
      if (editando) {
        await api.put(`/admin/cidades/${editando.slug}`, formData);
      } else {
        await api.post('/admin/cidades', formData);
      }
      setModalAberto(false);
      fetchCidades();
    } catch (error) {
      setErro(error.message || 'Erro ao salvar cidade.');
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm(`Tem certeza que deseja excluir a cidade "${slug}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await api.delete(`/admin/cidades/${slug}`);
      fetchCidades();
    } catch (error) {
      alert(error.message || 'Erro ao excluir cidade.');
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <span className="ml-3 text-slate-600">Carregando cidades...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Cidades</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie os municípios participantes do ecossistema.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Nova Cidade</span>
        </button>
      </div>

      {/* Tabela de Cidades */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Cidade</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4 text-center">App Próprio</th>
                <th className="px-6 py-4 text-center">Smart Turismo</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cidades.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Nenhuma cidade cadastrada ainda.
                  </td>
                </tr>
              ) : (
                cidades.map((cidade) => (
                  <tr key={cidade.slug} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: cidade.corPrimaria }}>
                          {cidade.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{cidade.nome}</div>
                          <div className="text-xs text-slate-500">{cidade.estado}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs">
                        {cidade.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cidade.temAppProprio ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Sim</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cidade.publicaNoSmartTurismo ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Sim</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(cidade)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(cidade.slug)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
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
                {editando ? 'Editar Cidade' : 'Nova Cidade'}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nome da Cidade *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Ex: Rolante"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Slug (ID) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editando}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 font-mono ${editando ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Ex: rolante"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Estado *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 uppercase"
                    placeholder="Ex: RS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Cor Primária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.corPrimaria}
                      onChange={(e) => setFormData({ ...formData, corPrimaria: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 font-mono">{formData.corPrimaria}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Cor Secundária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.corSecundaria}
                      onChange={(e) => setFormData({ ...formData, corSecundaria: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 font-mono">{formData.corSecundaria}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.temAppProprio}
                    onChange={(e) => setFormData({ ...formData, temAppProprio: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Possui App Próprio</div>
                    <div className="text-xs text-slate-500">Marca este município como tendo um aplicativo white-label dedicado.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.publicaNoSmartTurismo}
                    onChange={(e) => setFormData({ ...formData, publicaNoSmartTurismo: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Publicar no Smart Turismo</div>
                    <div className="text-xs text-slate-500">Os dados desta cidade aparecerão no aplicativo agregador regional.</div>
                  </div>
                </label>
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
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                  <span>{editando ? 'Salvar Alterações' : 'Criar Cidade'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}