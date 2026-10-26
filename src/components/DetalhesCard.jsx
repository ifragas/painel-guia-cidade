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

const DIAS_SEMANA = [
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' }
];

export default function DetalhesCard({ item, tipo, onVoltar, onEdit, onDelete }) {
  const [editando, setEditando] = useState(false);
  
  // 🔹 Inicializa o formData garantindo que as coordenadas venham preenchidas corretamente
  const [formData, setFormData] = useState({
    ...item,
    coordenadas: item.coordenadas || (item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : '')
  });
  
  // Estado para controlar a opção "Sempre Aberto"
  const [sempreAberto, setSempreAberto] = useState(Boolean(item.sempreAberto));
  
  // Inicializa o estado de horários para edição com base no que já vem do item (ou padrão vazio)
  const [horariosPorDia, setHorariosPorDia] = useState(() => {
    const initialHorarios = item.horarios && typeof item.horarios === 'object' ? item.horarios : {};
    return DIAS_SEMANA.reduce((acc, dia) => {
      acc[dia.id] = {
        ativo: !!initialHorarios[dia.id],
        abertura: initialHorarios[dia.id]?.abertura || '08:00',
        fecho: initialHorarios[dia.id]?.fecho || '18:00'
      };
      return acc;
    }, {});
  });

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

  const handleToggleDia = (diaId) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        ativo: !prev[diaId].ativo
      }
    }));
  };

  const handleHorarioChange = (diaId, campo, valor) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        [campo]: valor
      }
    }));
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
      dataForm.append('coordenadas', formData.coordenadas || '');
      dataForm.append('sempreAberto', sempreAberto);
      
      // Monta o objeto de horários ativos (somente se não for sempre aberto)
      const horariosPayload = {};
      if (!sempreAberto) {
        Object.keys(horariosPorDia).forEach((dia) => {
          if (horariosPorDia[dia].ativo) {
            horariosPayload[dia] = {
              abertura: horariosPorDia[dia].abertura,
              fecho: horariosPorDia[dia].fecho
            };
          }
        });
      }
      dataForm.append('horarios', JSON.stringify(horariosPayload));

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

              {/* Horários de Funcionamento ou Sempre Aberto */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <Clock size={14} className="text-emerald-600" /> Horário de Funcionamento
                </span>
                
                {item.sempreAberto ? (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl text-xs font-bold">
                    <span>● Sempre Aberto (Acesso Livre)</span>
                  </div>
                ) : item.horarios && typeof item.horarios === 'object' && Object.keys(item.horarios).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                    {DIAS_SEMANA.map((dia) => {
                      const h = item.horarios[dia.id];
                      if (!h) return null;
                      return (
                        <div key={dia.id} className="bg-white px-3 py-2 rounded-xl border border-slate-200/80 text-xs flex justify-between items-center">
                          <span className="font-semibold text-slate-700">{dia.label}:</span>
                          <span className="text-emerald-700 font-medium">{h.abertura} às {h.fecho}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-sm font-medium text-slate-600">
                    {typeof item.horarios === 'string' ? item.horarios : (item.horario || 'Não informado')}
                  </span>
                )}
              </div>

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

              {item.coordenadas && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Globe size={14} /> Coordenadas Geográficas
                  </span>
                  <span className="text-sm font-medium text-slate-800 font-mono">
                    {item.coordenadas}
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Gestor de Horários de Funcionamento & Opção Sempre Aberto */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock size={18} className="text-emerald-600" />
                  <h4 className="text-sm font-bold">
                    Horário de Funcionamento
                  </h4>
                </div>

                {/* Checkbox "Sempre Aberto" */}
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={sempreAberto}
                    onChange={(e) => setSempreAberto(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    Sempre Aberto
                  </span>
                </label>
              </div>

              <p className="text-xs text-slate-500">
                {sempreAberto
                  ? 'Local configurado como sempre aberto (acesso livre sem restrição de horários).'
                  : 'Ative os dias em que o local funciona e configure o intervalo de atendimento.'}
              </p>

              {!sempreAberto && (
                <div className="space-y-3 pt-2">
                  {DIAS_SEMANA.map((dia) => {
                    const itemDia = horariosPorDia[dia.id] || { ativo: false, abertura: '08:00', fecho: '18:00' };
                    return (
                      <div
                        key={dia.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                          itemDia.ativo
                            ? 'bg-white border-emerald-200 shadow-sm'
                            : 'bg-slate-100/60 border-slate-200/60 opacity-70'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={itemDia.ativo}
                            onChange={() => handleToggleDia(dia.id)}
                            className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-slate-800 min-w-[110px]">
                            {dia.label}
                          </span>
                        </label>

                        {itemDia.ativo ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 font-medium">Das</span>
                            <input
                              type="time"
                              value={itemDia.abertura}
                              onChange={(e) => handleHorarioChange(dia.id, 'abertura', e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
                            />
                            <span className="text-slate-500 font-medium">às</span>
                            <input
                              type="time"
                              value={itemDia.fecho}
                              onChange={(e) => handleHorarioChange(dia.id, 'fecho', e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium px-2">
                            Fechado / Não informado
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Coordenadas Geográficas (Latitude e Longitude)
              </label>
              <input
                type="text"
                name="coordenadas"
                value={formData.coordenadas || ''}
                onChange={handleChange}
                placeholder="Ex: -29.6288, -50.4533"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Dica: Pode colar diretamente do Google Maps (ex: <code className="text-slate-600">-29.6288, -50.4533</code>).
              </p>
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
                  <div key={`nova-${index}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-emerald-300 bg-emerald-50">
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
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 transition-all relative group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={adicionarImagens}
                  id="file-upload-edit"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-white p-3 rounded-2xl shadow-xs text-emerald-600">
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
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-70"
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