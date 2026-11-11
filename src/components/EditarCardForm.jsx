import { useState } from 'react';
import { 
  UploadCloud, 
  Save, 
  X, 
  MessageCircle,
  Share2,
  Link as LinkIcon,
  Plus,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

const DIAS_SEMANA = [
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' }
];

export default function EditarCardForm({ item, tipo, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    ...item,
    linkExterno: item.linkExterno || '',
    coordenadas: item.coordenadas || (item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : ''),
    telefone: item.telefone || '' // ✅ ADICIONADO: Telefone Fixo
  });
  
  const [whatsappList, setWhatsappList] = useState(() => {
    if (Array.isArray(item.whatsapp)) return item.whatsapp;
    if (typeof item.whatsapp === 'string' && item.whatsapp.trim()) return [item.whatsapp];
    return [''];
  });

  const [redesSociais, setRedesSociais] = useState({
    instagram: item.redesSociais?.instagram || '',
    facebook: item.redesSociais?.facebook || '',
    tiktok: item.redesSociais?.tiktok || ''
  });

  const [sempreAberto, setSempreAberto] = useState(Boolean(item.sempreAberto));
  
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRedesChange = (e) => {
    setRedesSociais({ ...redesSociais, [e.target.name]: e.target.value });
  };

  const handleAddWhatsapp = () => {
    setWhatsappList(prev => [...prev, '']);
  };

  const handleWhatsappChange = (index, value) => {
    setWhatsappList(prev => {
      const nova = [...prev];
      nova[index] = value;
      return nova;
    });
  };

  const handleRemoveWhatsapp = (index) => {
    setWhatsappList(prev => prev.filter((_, i) => i !== index));
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
      dataForm.append('linkExterno', formData.linkExterno || '');
      dataForm.append('telefone', formData.telefone || ''); // ✅ ADICIONADO: Envio do telefone
      dataForm.append('sempreAberto', sempreAberto);
      
      const whatsappFiltrado = whatsappList.map(w => w.trim()).filter(Boolean);
      dataForm.append('whatsapp', JSON.stringify(whatsappFiltrado));

      dataForm.append('redesSociais', JSON.stringify(redesSociais));
      
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
      onSuccess(result);

    } catch (error) {
      alert('❌ Erro ao atualizar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Editando Registro</h2>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Nome do Local *</label>
        <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all" />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Descrição Completa *</label>
        <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows="4" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all resize-y" />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Endereço</label>
        <input type="text" name="endereco" value={formData.endereco || ''} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all" />
      </div>

      {/* ✅ NOVO: Telefone Fixo na Edição */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
          <MessageCircle size={14} className="text-slate-400" /> Telefone Fixo
        </label>
        <input
          type="text"
          name="telefone"
          value={formData.telefone || ''}
          onChange={handleChange}
          placeholder="Ex: 5135430000"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
          <LinkIcon size={14} className="text-slate-400" /> Link Externo (Cardápio Digital / Site)
        </label>
        <input type="url" name="linkExterno" value={formData.linkExterno || ''} onChange={handleChange} placeholder="Ex: https://cardapio.com/seurestaurante" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all" />
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <MessageCircle size={18} className="text-emerald-600" />
            <h4 className="text-sm font-bold">Números de WhatsApp</h4>
          </div>
          <button type="button" onClick={handleAddWhatsapp} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer">
            <Plus size={14} /><span>Adicionar Número</span>
          </button>
        </div>
        <div className="space-y-2 pt-1">
          {whatsappList.map((whats, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="text" value={whats} onChange={(e) => handleWhatsappChange(index, e.target.value)} placeholder="Ex: 51999999999" className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600" />
              {whatsappList.length > 1 && (
                <button type="button" onClick={() => handleRemoveWhatsapp(index)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Share2 size={18} className="text-emerald-600" />
          <h4 className="text-sm font-bold">Redes Sociais</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Instagram (URL)</label>
            <input type="url" name="instagram" value={redesSociais.instagram} onChange={handleRedesChange} placeholder="https://instagram.com/..." className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Facebook (URL)</label>
            <input type="url" name="facebook" value={redesSociais.facebook} onChange={handleRedesChange} placeholder="https://facebook.com/..." className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">TikTok (URL)</label>
            <input type="url" name="tiktok" value={redesSociais.tiktok} onChange={handleRedesChange} placeholder="https://tiktok.com/@..." className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock size={18} className="text-emerald-600" />
            <h4 className="text-sm font-bold">Horário de Funcionamento</h4>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <input type="checkbox" checked={sempreAberto} onChange={(e) => setSempreAberto(e.target.checked)} className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded focus:ring-emerald-500 cursor-pointer" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Sempre Aberto</span>
          </label>
        </div>
        <p className="text-xs text-slate-500">{sempreAberto ? 'Local configurado como sempre aberto (acesso livre sem restrição de horários).' : 'Ative os dias em que o local funciona e configure o intervalo de atendimento.'}</p>
        {!sempreAberto && (
          <div className="space-y-3 pt-2">
            {DIAS_SEMANA.map((dia) => {
              const itemDia = horariosPorDia[dia.id] || { ativo: false, abertura: '08:00', fecho: '18:00' };
              return (
                <div key={dia.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${itemDia.ativo ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-100/60 border-slate-200/60 opacity-70'}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={itemDia.ativo} onChange={() => handleToggleDia(dia.id)} className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded focus:ring-emerald-500 cursor-pointer" />
                    <span className="text-sm font-semibold text-slate-800 min-w-[110px]">{dia.label}</span>
                  </label>
                  {itemDia.ativo ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Das</span>
                      <input type="time" value={itemDia.abertura} onChange={(e) => handleHorarioChange(dia.id, 'abertura', e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600" />
                      <span className="text-slate-500 font-medium">às</span>
                      <input type="time" value={itemDia.fecho} onChange={(e) => handleHorarioChange(dia.id, 'fecho', e.target.value)} className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600" />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-medium px-2">Fechado / Não informado</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Coordenadas Geográficas (Latitude e Longitude)</label>
        <input type="text" name="coordenadas" value={formData.coordenadas || ''} onChange={handleChange} placeholder="Ex: -29.6288, -50.4533" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all font-mono" />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Gerenciar Galeria de Imagens</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {formData.imagens?.map((url, index) => (
            <div key={`existente-${index}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={url} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removerImagemExistente(index)} className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
          ))}
          {novasImagensPreviews.map((url, index) => (
            <div key={`nova-${index}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-emerald-300 bg-emerald-50">
              <img src={url} alt={`Nova Prévia ${index + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removerNovaImagemPrevia(index)} className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 transition-all relative group cursor-pointer">
          <input type="file" accept="image/*" multiple onChange={adicionarImagens} id="file-upload-edit" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-3 rounded-2xl shadow-xs text-emerald-600">
              <UploadCloud size={24} />
            </div>
            <span className="text-sm font-semibold text-slate-700">Clique para adicionar novas imagens</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition-all cursor-pointer">Cancelar</button>
        <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-70">
          <Save size={16} />
          <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>
    </form>
  );
}