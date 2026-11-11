import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, FileText, Tag, Link as LinkIcon,
  UploadCloud, X, Loader2, CheckCircle2, Repeat, Star,
  MessageCircle, Ticket, Image as ImageIcon
} from 'lucide-react';

const CATEGORIAS = [
  { id: 'cultural', label: 'Cultural' },
  { id: 'gastronomico', label: 'Gastronômico' },
  { id: 'religioso', label: 'Religioso' },
  { id: 'esportivo', label: 'Esportivo' },
  { id: 'civico', label: 'Cívico' },
  { id: 'feira', label: 'Feira / Mercado' },
  { id: 'educativo', label: 'Educativo' },
  { id: 'outro', label: 'Outro' }
];

const RECORRENCIAS = [
  { id: 'nenhuma', label: 'Evento único (não se repete)' },
  { id: 'diaria', label: 'Todos os dias' },
  { id: 'semanal', label: 'Semanal (dias específicos)' },
  { id: 'mensal', label: 'Mensal (mesmo dia do mês)' },
  { id: 'anual', label: 'Anual (mesma data)' }
];

const DIAS_SEMANA = [
  { id: 'domingo', label: 'Dom' },
  { id: 'segunda', label: 'Seg' },
  { id: 'terca', label: 'Ter' },
  { id: 'quarta', label: 'Qua' },
  { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' },
  { id: 'sabado', label: 'Sáb' }
];

const TIPOS_LOCAL = [
  { id: 'pontos-turisticos', label: 'Pontos Turísticos' },
  { id: 'restaurantes', label: 'Restaurantes' },
  { id: 'acomodacoes', label: 'Acomodações' },
  { id: 'servicos', label: 'Serviços Essenciais' }
];

// Monta ISO com offset de Brasília (evita bug de fuso no servidor UTC)
const montarISO = (data, hora) => {
  if (!data) return '';
  return `${data}T${hora || '00:00'}:00-03:00`;
};

// Extrai data/hora de um ISO existente para preencher os inputs
const extrairDataHora = (iso) => {
  if (!iso) return { data: '', hora: '' };
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? { data: m[1], hora: m[2] } : { data: '', hora: '' };
};

const API_BASE = import.meta.env.PROD
  ? 'https://turismo-api-vv62.onrender.com/api'
  : 'http://localhost:3000/api';

export default function EventoForm({ eventoInicial = null, onSucesso, onCancel }) {
  const editando = Boolean(eventoInicial?.id);

  const inicioInicial = extrairDataHora(eventoInicial?.dataInicio);
  const fimInicial = extrairDataHora(eventoInicial?.dataFim);
  const fimRecInicial = extrairDataHora(eventoInicial?.dataFimRecorrencia);

  const [dados, setDados] = useState({
    titulo: eventoInicial?.titulo || '',
    descricao: eventoInicial?.descricao || '',
    categoria: eventoInicial?.categoria || 'cultural',
    local: eventoInicial?.local || '',
    endereco: eventoInicial?.endereco || '',
    coordenadas: eventoInicial?.coordenadas || '',
    preco: eventoInicial?.preco || '',
    linkExterno: eventoInicial?.linkExterno || '',
    telefone: eventoInicial?.telefone || '',
    whatsapp: eventoInicial?.whatsapp || ''
  });

  const [dataInicio, setDataInicio] = useState(inicioInicial.data);
  const [horaInicio, setHoraInicio] = useState(inicioInicial.hora || '18:00');
  const [dataFim, setDataFim] = useState(fimInicial.data);
  const [horaFim, setHoraFim] = useState(fimInicial.hora || '23:00');

  const [recorrencia, setRecorrencia] = useState(eventoInicial?.recorrencia || 'nenhuma');
  const [diasSemana, setDiasSemana] = useState(eventoInicial?.diasSemana || []);
  const [dataFimRecorrencia, setDataFimRecorrencia] = useState(fimRecInicial.data);

  const [gratuito, setGratuito] = useState(eventoInicial?.gratuito !== false);
  const [destaque, setDestaque] = useState(Boolean(eventoInicial?.destaque));

  const [localVinculado, setLocalVinculado] = useState(
    eventoInicial?.localVinculado
      ? `${eventoInicial.localVinculado.tipo}|${eventoInicial.localVinculado.id}`
      : ''
  );
  const [locaisDisponiveis, setLocaisDisponiveis] = useState([]);
  const [carregandoLocais, setCarregandoLocais] = useState(false);

  const [imagensExistentes, setImagensExistentes] = useState(
    Array.isArray(eventoInicial?.imagens) ? eventoInicial.imagens : []
  );
  const [arquivosNovos, setArquivosNovos] = useState([]);
  const [previewsNovos, setPreviewsNovos] = useState([]);

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  // Carrega todos os locais cadastrados para o seletor de vínculo
  useEffect(() => {
    async function carregarLocais() {
      setCarregandoLocais(true);
      try {
        const resultados = await Promise.allSettled(
          TIPOS_LOCAL.map(t => fetch(`${API_BASE}/${t.id}`).then(r => r.json()))
        );
        const lista = [];
        resultados.forEach((res, i) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            res.value.forEach(item => {
              lista.push({
                chave: `${TIPOS_LOCAL[i].id}|${item.id}`,
                tipo: TIPOS_LOCAL[i].id,
                grupo: TIPOS_LOCAL[i].label,
                id: item.id,
                nome: item.nome || 'Sem nome',
                endereco: item.endereco || '',
                coordenadas: item.coordenadas || (
                  item.latitude && item.longitude
                    ? `${item.latitude}, ${item.longitude}`
                    : ''
                )
              });
            });
          }
        });
        setLocaisDisponiveis(lista);
      } catch (e) {
        console.error('Erro ao carregar locais:', e);
      } finally {
        setCarregandoLocais(false);
      }
    }
    carregarLocais();
  }, []);

  const handleChange = (e) => {
    setDados(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVincularLocal = (e) => {
    const chave = e.target.value;
    setLocalVinculado(chave);
    if (!chave) return;

    const local = locaisDisponiveis.find(l => l.chave === chave);
    if (local) {
      setDados(prev => ({
        ...prev,
        local: local.nome,
        endereco: local.endereco,
        coordenadas: local.coordenadas
      }));
    }
  };

  const toggleDia = (diaId) => {
    setDiasSemana(prev =>
      prev.includes(diaId) ? prev.filter(d => d !== diaId) : [...prev, diaId]
    );
  };

  const adicionarImagens = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setArquivosNovos(prev => [...prev, ...files]);
    setPreviewsNovos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removerImagemExistente = (index) => {
    setImagensExistentes(prev => prev.filter((_, i) => i !== index));
  };

  const removerNovaImagem = (index) => {
    setPreviewsNovos(prev => prev.filter((_, i) => i !== index));
    setArquivosNovos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso(false);

    if (!dataInicio) {
      setErro('Informe a data de início do evento.');
      setSalvando(false);
      return;
    }

    if (recorrencia === 'semanal' && diasSemana.length === 0) {
      setErro('Selecione ao menos um dia da semana para a recorrência semanal.');
      setSalvando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('titulo', dados.titulo);
      formData.append('descricao', dados.descricao);
      formData.append('categoria', dados.categoria);
      formData.append('dataInicio', montarISO(dataInicio, horaInicio));
      formData.append('dataFim', dataFim ? montarISO(dataFim, horaFim) : '');
      formData.append('recorrencia', recorrencia);
      formData.append('diasSemana', JSON.stringify(diasSemana));
      formData.append('dataFimRecorrencia',
        recorrencia !== 'nenhuma' && dataFimRecorrencia
          ? montarISO(dataFimRecorrencia, '23:59')
          : ''
      );

      if (localVinculado) {
        const [tipo, id] = localVinculado.split('|');
        formData.append('localVinculado', JSON.stringify({ tipo, id }));
      } else {
        formData.append('localVinculado', '');
      }

      formData.append('local', dados.local);
      formData.append('endereco', dados.endereco);
      formData.append('coordenadas', dados.coordenadas);
      formData.append('gratuito', gratuito);
      formData.append('preco', gratuito ? '' : dados.preco);
      formData.append('linkExterno', dados.linkExterno);
      formData.append('telefone', dados.telefone);
      formData.append('whatsapp', dados.whatsapp);
      formData.append('destaque', destaque);
      formData.append('cidade', 'rolante');

      imagensExistentes.forEach(url => formData.append('imagensExistentes', url));
      arquivosNovos.forEach(file => formData.append('imagens', file));

      const token = localStorage.getItem('admin_token');
      const url = editando ? `${API_BASE}/eventos/${eventoInicial.id}` : `${API_BASE}/eventos`;

      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        const detalhes = Array.isArray(result.detalhes) ? result.detalhes.join(' | ') : '';
        throw new Error(detalhes || result.error || 'Erro ao salvar evento');
      }

      setSucesso(true);

      if (!editando) {
        setDados({
          titulo: '', descricao: '', categoria: 'cultural', local: '',
          endereco: '', coordenadas: '', preco: '', linkExterno: '',
          telefone: '', whatsapp: ''
        });
        setDataInicio('');
        setDataFim('');
        setRecorrencia('nenhuma');
        setDiasSemana([]);
        setDataFimRecorrencia('');
        setGratuito(true);
        setDestaque(false);
        setLocalVinculado('');
        setImagensExistentes([]);
        setArquivosNovos([]);
        setPreviewsNovos([]);
      }

      if (onSucesso) setTimeout(() => onSucesso(result), 1200);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  const inputBase = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all';
  const labelBase = 'block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-4xl mx-auto">

      <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {editando ? 'Editar Evento' : 'Cadastrar Novo Evento'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Calendário municipal de Rolante
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl border border-emerald-100 text-xs font-semibold self-start sm:self-auto">
          <Calendar size={14} />
          <span>Eventos</span>
        </div>
      </div>

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-2xl mb-6 flex items-center gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
          <div>
            <p className="font-semibold">
              {editando ? 'Evento atualizado com sucesso!' : 'Evento cadastrado com sucesso!'}
            </p>
          </div>
        </div>
      )}

      {erro && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-2xl mb-6 flex items-center gap-3">
          <X className="text-rose-600 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Erro ao salvar evento</p>
            <p className="text-xs text-rose-700">{erro}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Título */}
        <div>
          <label className={labelBase}>Título do Evento *</label>
          <input
            type="text"
            name="titulo"
            value={dados.titulo}
            onChange={handleChange}
            required
            placeholder="Ex: Festa do Colono 2026"
            className={inputBase}
          />
        </div>

        {/* Categoria */}
        <div>
          <label className={`${labelBase} flex items-center gap-1.5`}>
            <Tag size={14} className="text-slate-400" /> Categoria *
          </label>
          <select
            name="categoria"
            value={dados.categoria}
            onChange={handleChange}
            className={inputBase}
          >
            {CATEGORIAS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Descrição */}
        <div>
          <label className={`${labelBase} flex items-center gap-1.5`}>
            <FileText size={14} className="text-slate-400" /> Descrição
          </label>
          <textarea
            name="descricao"
            value={dados.descricao}
            onChange={handleChange}
            rows="4"
            placeholder="Programação, atrações, informações úteis..."
            className={`${inputBase} resize-y`}
          />
        </div>

        {/* Datas */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock size={18} className="text-emerald-600" />
            <h4 className="text-sm font-bold">Data e Horário</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Início *
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                  className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Fim (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  disabled={!dataFim}
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Para eventos de vários dias, preencha o fim. A diferença entre início e fim define a duração,
            que será repetida em cada ocorrência nos eventos recorrentes.
          </p>
        </div>

        {/* Recorrência */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Repeat size={18} className="text-emerald-600" />
            <h4 className="text-sm font-bold">Recorrência</h4>
          </div>

          <select
            value={recorrencia}
            onChange={(e) => setRecorrencia(e.target.value)}
            className={inputBase}
          >
            {RECORRENCIAS.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>

          {recorrencia === 'semanal' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Dias da semana *
              </label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(dia => {
                  const ativo = diasSemana.includes(dia.id);
                  return (
                    <button
                      key={dia.id}
                      type="button"
                      onClick={() => toggleDia(dia.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        ativo
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {recorrencia !== 'nenhuma' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Repetir até (opcional)
              </label>
              <input
                type="date"
                value={dataFimRecorrencia}
                onChange={(e) => setDataFimRecorrencia(e.target.value)}
                className="w-full md:w-auto px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-emerald-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Deixe vazio para repetir indefinidamente. Eventos recorrentes não desaparecem do app.
              </p>
            </div>
          )}
        </div>

        {/* Local */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin size={18} className="text-emerald-600" />
            <h4 className="text-sm font-bold">Local do Evento</h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Vincular a um local já cadastrado
            </label>
            <select
              value={localVinculado}
              onChange={handleVincularLocal}
              disabled={carregandoLocais}
              className={inputBase}
            >
              <option value="">
                {carregandoLocais ? 'Carregando locais...' : 'Não vincular (digitar manualmente)'}
              </option>
              {TIPOS_LOCAL.map(tipo => {
                const doTipo = locaisDisponiveis.filter(l => l.tipo === tipo.id);
                if (!doTipo.length) return null;
                return (
                  <optgroup key={tipo.id} label={tipo.label}>
                    {doTipo.map(l => (
                      <option key={l.chave} value={l.chave}>{l.nome}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Ao vincular, o endereço e as coordenadas acompanham o cadastro original automaticamente.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nome do local
            </label>
            <input
              type="text"
              name="local"
              value={dados.local}
              onChange={handleChange}
              placeholder="Ex: Parque Municipal de Rolante"
              className={inputBase}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Endereço
            </label>
            <input
              type="text"
              name="endereco"
              value={dados.endereco}
              onChange={handleChange}
              placeholder="Ex: Av. Getúlio Vargas, 65 - Centro"
              className={inputBase}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Coordenadas (para rota no mapa)
            </label>
            <input
              type="text"
              name="coordenadas"
              value={dados.coordenadas}
              onChange={handleChange}
              placeholder="Ex: -29.6288, -50.4533"
              className={`${inputBase} font-mono`}
            />
          </div>
        </div>

        {/* Ingressos */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Ticket size={18} className="text-emerald-600" />
              <h4 className="text-sm font-bold">Ingressos</h4>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <input
                type="checkbox"
                checked={gratuito}
                onChange={(e) => setGratuito(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                Gratuito
              </span>
            </label>
          </div>

          {!gratuito && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Valor / Observação
              </label>
              <input
                type="text"
                name="preco"
                value={dados.preco}
                onChange={handleChange}
                placeholder="Ex: R$ 20,00 (meia-entrada R$ 10,00)"
                className={inputBase}
              />
            </div>
          )}

          <div>
            <label className={`${labelBase} flex items-center gap-1.5`}>
              <LinkIcon size={14} className="text-slate-400" /> Link de Ingressos / Mais Informações
            </label>
            <input
              type="url"
              name="linkExterno"
              value={dados.linkExterno}
              onChange={handleChange}
              placeholder="https://..."
              className={inputBase}
            />
          </div>
        </div>

        {/* Contato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`${labelBase} flex items-center gap-1.5`}>
              <MessageCircle size={14} className="text-slate-400" /> Telefone
            </label>
            <input
              type="text"
              name="telefone"
              value={dados.telefone}
              onChange={handleChange}
              placeholder="Ex: 5135471075"
              className={inputBase}
            />
          </div>
          <div>
            <label className={`${labelBase} flex items-center gap-1.5`}>
              <MessageCircle size={14} className="text-emerald-600" /> WhatsApp
            </label>
            <input
              type="text"
              name="whatsapp"
              value={dados.whatsapp}
              onChange={handleChange}
              placeholder="Ex: 51999999999"
              className={inputBase}
            />
          </div>
        </div>

        {/* Destaque */}
        <label className="flex items-center gap-3 cursor-pointer bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
          <input
            type="checkbox"
            checked={destaque}
            onChange={(e) => setDestaque(e.target.checked)}
            className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
          />
          <div className="flex items-center gap-2">
            <Star size={18} className="text-amber-600" />
            <div>
              <span className="text-sm font-bold text-amber-800 block">
                Destacar na tela inicial do app
              </span>
              <span className="text-[11px] text-amber-700">
                Aparece no carrossel "Próximos Eventos" da home
              </span>
            </div>
          </div>
        </label>

        {/* Imagens */}
        <div>
          <label className={`${labelBase} flex items-center gap-1.5`}>
            <ImageIcon size={14} className="text-slate-400" /> Cartaz / Fotos do Evento
          </label>

          {(imagensExistentes.length > 0 || previewsNovos.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {imagensExistentes.map((url, index) => (
                <div key={`ext-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removerImagemExistente(index)}
                    className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {previewsNovos.map((url, index) => (
                <div key={`new-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-emerald-300 bg-emerald-50">
                  <img src={url} alt={`Nova ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removerNovaImagem(index)}
                    className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-emerald-50/30 transition-all cursor-pointer relative group">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={adicionarImagens}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-3 rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                <UploadCloud size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Clique ou arraste imagens aqui
              </p>
              <p className="text-xs text-slate-400">
                PNG, JPG ou JPEG — o cartaz do evento funciona bem aqui
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={salvando}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {salvando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>{editando ? 'Salvar Alterações' : 'Cadastrar Evento'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}