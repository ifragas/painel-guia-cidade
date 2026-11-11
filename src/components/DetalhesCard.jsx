// src/components/DetalhesCard.jsx
import { useState } from 'react';
import { api } from '../services/api';
import EditarCardForm from './EditarCardForm';
import EditarServicoForm from './EditarServicoForm';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  MapPin, 
  Clock, 
  Globe, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  MessageCircle,
  Share2,
  Link as LinkIcon,
  Phone // ✅ Ícone do telefone adicionado
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
  const [indiceImagem, setIndiceImagem] = useState(0);

  const imagens = Array.isArray(item.imagens)
    ? item.imagens
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

  const listaWhatsVisualizacao = Array.isArray(item.whatsapp) 
    ? item.whatsapp.filter(Boolean) 
    : (typeof item.whatsapp === 'string' && item.whatsapp.trim() ? [item.whatsapp] : []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        
        {!editando ? (
          <div className="space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {item.nome}
              </h2>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Categoria
                </span>
                <span className="text-sm font-semibold text-slate-800 capitalize">
                  {item.tipo || tipo.replace('-', ' ')}
                </span>
              </div>

              {/* ✅ EXIBIÇÃO DO TELEFONE FIXO */}
              {item.telefone && item.telefone.trim() !== '' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Phone size={14} className="text-emerald-600" /> Telefone Fixo
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {item.telefone}
                  </span>
                </div>
              )}

              {listaWhatsVisualizacao.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <MessageCircle size={14} className="text-emerald-600" /> WhatsApp
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {listaWhatsVisualizacao.map((num, i) => (
                      <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-medium">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item?.linkExterno && item.linkExterno.trim() !== '' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <LinkIcon size={14} className="text-emerald-600" /> Link Externo / Site Institucional
                  </span>
                  <a 
                    href={item.linkExterno} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-sm font-medium text-emerald-700 hover:underline break-all"
                  >
                    {item.linkExterno} ↗
                  </a>
                </div>
              )}

              {item.redesSociais && (item.redesSociais.instagram || item.redesSociais.facebook || item.redesSociais.tiktok) && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Share2 size={14} className="text-emerald-600" /> Redes Sociais
                  </span>
                  <div className="flex flex-wrap gap-3 text-xs font-medium">
                    {item.redesSociais.instagram && (
                      <a href={item.redesSociais.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-100">
                        Instagram ↗
                      </a>
                    )}
                    {item.redesSociais.facebook && (
                      <a href={item.redesSociais.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                        Facebook ↗
                      </a>
                    )}
                    {item.redesSociais.tiktok && (
                      <a href={item.redesSociais.tiktok} target="_blank" rel="noreferrer" className="text-slate-900 hover:underline bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        TikTok ↗
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <Clock size={14} className="text-emerald-600" /> Horário de Funcionamento
                </span>
                
                {item.funcionamento24h || item.sempreAberto ? (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl text-xs font-bold">
                    <span>● Sempre Aberto (24 Horas)</span>
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
                    {item.horario || 'Não informado'}
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

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 md:col-span-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <FileText size={14} /> Descrição Completa
                </span>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
                  {item.descricao}
                </p>
              </div>

            </div>

          </div>
        ) : (
          tipo === 'servicos' ? (
            <EditarServicoForm 
              item={item}
              tipo={tipo}
              onCancel={() => setEditando(false)}
              onSuccess={(updatedItem) => {
                setEditando(false);
                onEdit(updatedItem);
              }}
            />
          ) : (
            <EditarCardForm 
              item={item}
              tipo={tipo}
              onCancel={() => setEditando(false)}
              onSuccess={(updatedItem) => {
                setEditando(false);
                onEdit(updatedItem);
              }}
            />
          )
        )}

      </div>
    </div>
  );
}