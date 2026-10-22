import { useState } from 'react';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  MapPin, 
  Clock, 
  Globe, 
  FileText, 
  UploadCloud, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export default function DetalhesCard({ item, tipo, onVoltar, onEdit, onDelete }) {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({ ...item });
  const [novasImagensPreviews, setNovasImagensPreviews] = useState([]);
  const [arquivosNovos, setArquivosNovos] = useState([]);
  const [salvando, setSalvando] = useState(false);

  // Estado reativo para controlar instantaneamente a imagem do carrossel
  const [indiceImagem, setIndiceImagem] = useState(0);

  const rawImagens = editando ? formData.imagens : item.imagens;
  const imagens = Array.isArray(rawImagens)
    ? rawImagens
        .map(url => url?.replace(/\s+/g, '').trim())
        .filter(url => url && url.startsWith('http'))
    : [];

  const imagemAtual = imagens[indiceImagem] || item.imagem?.replace(/\s+/g, '').trim() || '/placeholder.jpg';

  const proximaImagem = () => {
    setIndiceImagem((prevIndex) => (prevIndex + 1) % imagens.length);
  };

  const imagemAnterior = () => {
    setIndiceImagem((prevIndex) => (prevIndex - 1 + imagens.length) % imagens.length);
  };

  const pularParaImagem = (index) => {
    setIndiceImagem(index);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const adicionarImagens = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const previews = files.map(file => URL.createObjectURL(file));
    setArquivosNovos(prev => [...prev, ...files]);
    setNovasImagensPreviews(prev => [...prev, ...previews]);
    e.target.value = '';
  };

  const removerImagemExistente = (index) => {
    if (!window.confirm('🗑️ Deseja remover esta imagem?')) return;
    const novas = [...formData.imagens];
    novas.splice(index, 1);
    setFormData({ ...formData, imagens: novas });
  };

  const removerNovaImagemPrevia = (index) => {
    setNovasImagensPreviews(prev => prev.filter((_, i) => i !== index));
    setArquivosNovos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const dataForm = new FormData();
      dataForm.append('nome', formData.nome || '');
      dataForm.append('descricao', formData.descricao || '');
      dataForm.append('endereco', formData.endereco || '');
      dataForm.append('horario', formData.horario || '');
      
      if (formData.latitude !== null && formData.latitude !== undefined) {
        dataForm.append('latitude', formData.latitude);
      }
      if (formData.longitude !== null && formData.longitude !== undefined) {
        dataForm.append('longitude', formData.longitude);
      }

      if (Array.isArray(formData.imagens)) {
        formData.imagens.forEach(url => {
          dataForm.append('imagensExistentes', url);
        });
      }

      arquivosNovos.forEach(file => {
        dataForm.append('imagens', file);
      });

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.PROD ? 'https://turismo-api-vv62.onrender.com/api' : 'http://localhost:3000/api'}/${tipo}/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: dataForm
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar item');
      }

      alert('✅ Item atualizado com sucesso!');
      setEditando(false);
      setNovasImagensPreviews([]);
      setArquivosNovos([]);
      onEdit(result);

    } catch (error) {
      alert('❌ Erro ao atualizar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`🗑️ Tem certeza que deseja EXCLUIR "${item.nome}"?`)) return;

    try {
      await api.delete(`/${tipo}/${item.id}`);
      alert('✅ Item excluído com sucesso!');
      onDelete(item.id);
      onVoltar();
    } catch (error) {
      alert('❌ Erro ao excluir: ' + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Barra de Navegação Superior */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onVoltar}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Voltar para Lista</span>
        </button>

        {!editando && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Edit3 size={16} />
              <span>Editar</span>
            </button>
            <button 
              onClick={handleDelete}
              className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-xl border border-rose-200 text-sm font-medium transition-all cursor-pointer"
            >
              <Trash2 size={16} />
              <span>Excluir</span>
            </button>
          </div>
        )}
      </div>

      {/* Caixa Principal */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        
        {!editando ? (
          <div className="space-y-6">
            
            {/* Título */}
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {item.nome}
              </h2>
            </div>

            {/* Carrossel de Imagens */}
            {imagens.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video max-h-[400px] flex items-center justify-center shadow-inner">
                <img
                  key={imagemAtual}
                  src={imagemAtual}
                  alt={item.nome}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                />

                {imagens.length > 1 && (
                  <>
                    <button 
                      onClick={imagemAnterior}
                      className="absolute left-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={proximaImagem}
                      className="absolute right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Indicadores */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-xs">
                      {imagens.map((_, index) => (
                        <span
                          key={index}
                          onClick={() => pularParaImagem(index)}
                          className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                            index === indiceImagem ? 'bg-white w-4' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
                Nenhuma imagem disponível
              </div>
            )}

            {/* Informações Detalhadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Categoria
                </span>
                <span className="text-sm font-semibold text-slate-800 capitalize">
                  {item.tipo || tipo.replace('-', ' ')}
                </span>
              </div>

              {item.horario && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Clock size={14} /> Horário de Funcionamento
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {item.horario}
                  </span>
                </div>
              )}

              {item.endereco && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin size={14} /> Endereço
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {item.endereco}
                  </span>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <FileText size={14} /> Descrição Completa
                </span>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
                  {item.descricao}
                </p>
              </div>

              {(item.latitude && item.longitude) && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Globe size={14} /> Coordenadas Geográficas
                  </span>
                  <span className="text-sm font-medium text-slate-800 font-mono">
                    Latitude: {item.latitude}, Longitude: {item.longitude}
                  </span>
                </div>
              )}

            </div>

          </div>
        ) : (
          
          /* Formulário de Edição */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Editando Registro
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Nome do Local *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Descrição Completa *
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="4"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-600 transition-all resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Horário
                </label>
                <input
                  type="text"
                  name="horario"
                  value={formData.horario || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Latitude
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Gerenciamento de Galeria */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                Gerenciar Galeria de Imagens
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {formData.imagens?.map((url, index) => (
                  <div key={`existente-${index}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={url} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removerImagemExistente(index)}
                      className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {novasImagensPreviews.map((url, index) => (
                  <div key={`nova-${index}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-blue-300 bg-blue-50">
                    <img src={url} alt={`Nova Prévia ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removerNovaImagemPrevia(index)}
                      className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Upload de novas imagens */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50 transition-all relative group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={adicionarImagens}
                  id="file-upload-edit"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-white p-3 rounded-2xl shadow-xs text-blue-600">
                    <UploadCloud size={24} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    Clique para adicionar novas imagens
                  </span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-70"
              >
                <Save size={16} />
                <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}