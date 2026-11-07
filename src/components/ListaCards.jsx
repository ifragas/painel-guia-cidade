import React, { useState, useEffect } from 'react';
import { Loader2, Inbox, MapPin, Clock } from 'lucide-react';
import api from '../services/api'; // Importa o nosso serviço centralizado
import { funcionamento24hAtivo, metaTipoServico } from '../constants/servicos';

const ROTULO_CATEGORIA = {
  'pontos-turisticos': 'Ponto Turístico',
  restaurantes: 'Restaurante',
  acomodacoes: 'Acomodação',
  servicos: 'Serviço Essencial'
};

export default function ListaCards({ tipo, onEdit }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscarItens = async () => {
    try {
      setLoading(true);
      // Utiliza o serviço unificado (ele já injeta a URL base e o token automaticamente)
      const data = await api.get(`/${tipo}`);
      setItens(data);
    } catch (error) {
      alert('❌ Erro ao buscar itens: ' + error.message);
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarItens();
  }, [tipo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid de Cards Moderno com Tailwind */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itens.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
            <Inbox className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Nenhum item cadastrado ainda.</p>
            <p className="text-xs text-slate-400 mt-1">Utilize o botão superior para adicionar novos registros.</p>
          </div>
        ) : (
          itens.map(item => {
            const tipoServico = tipo === 'servicos' ? metaTipoServico(item.tipoServico) : null;
            const aberto24h = funcionamento24hAtivo(item.funcionamento24h);
            const IconeTipo = tipoServico?.Icon;

            return (
            <div
              key={item.id}
              onClick={() => onEdit(item)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 cursor-pointer flex flex-col group"
            >
              {/* Imagem do Card */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={item.imagem || item.imagens?.[0] || '/placeholder.jpg'}
                  alt={item.nome}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = '/placeholder.jpg';
                  }}
                />
                <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                  {ROTULO_CATEGORIA[tipo] || 'Local'}
                </div>
                {tipo === 'servicos' && (
                  <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                    <div className="inline-flex items-center gap-1 bg-white/95 text-slate-800 text-[11px] font-semibold px-2 py-1 rounded-lg shadow-sm">
                      {IconeTipo && <IconeTipo size={13} className="text-emerald-700 shrink-0" />}
                      <span>{tipoServico?.label || 'Serviço'}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg shadow-sm ${
                      aberto24h
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-white/95 text-slate-600'
                    }`}>
                      <Clock size={12} />
                      <span>{aberto24h ? '24h' : 'Horário regular'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Conteúdo do Card */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {item.nome}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-4">
                    {item.descricao}
                  </p>
                </div>

                {/* Detalhes extras se houver (Endereço ou Horário) */}
                <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  {item.endereco && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.endereco}</span>
                    </div>
                  )}
                  {item.horario && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.horario}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}