import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Calendar, CalendarDays, Clock, MapPin, Search, Plus, Star, Repeat, Trash2,
  Edit3, X, Check, CheckSquare, Square, LayoutGrid, List as ListIcon,
  AlertTriangle, Loader2, RotateCcw, Bookmark, Eye, Ticket, Link as LinkIcon,
  Phone, MessageCircle, Image as ImageIcon, ArrowUpDown, Inbox, RefreshCw,
  CheckCircle2, Info, ChevronRight, Filter, Palette, UtensilsCrossed, Church,
  Trophy, Landmark, ShoppingBasket, GraduationCap, Sparkles, Save
} from 'lucide-react';
import EventoForm from '../components/EventoForm';

const API_BASE = import.meta.env.PROD
  ? 'https://turismo-api-vv62.onrender.com/api'
  : 'http://localhost:3000/api';

const TZ = 'America/Sao_Paulo';
const VISOES_KEY = '@eventos_visoes_salvas';
const UNDO_MS = 7000;

const CATEGORIAS = {
  cultural:     { label: 'Cultural',       cor: '#a855f7', bg: '#faf5ff', borda: '#e9d5ff', Icon: Palette },
  gastronomico: { label: 'Gastronômico',   cor: '#f59e0b', bg: '#fffbeb', borda: '#fde68a', Icon: UtensilsCrossed },
  religioso:    { label: 'Religioso',      cor: '#6366f1', bg: '#eef2ff', borda: '#c7d2fe', Icon: Church },
  esportivo:    { label: 'Esportivo',      cor: '#0ea5e9', bg: '#f0f9ff', borda: '#bae6fd', Icon: Trophy },
  civico:       { label: 'Cívico',         cor: '#10b981', bg: '#ecfdf5', borda: '#a7f3d0', Icon: Landmark },
  feira:        { label: 'Feira / Mercado',cor: '#84cc16', bg: '#f7fee7', borda: '#d9f99d', Icon: ShoppingBasket },
  educativo:    { label: 'Educativo',      cor: '#06b6d4', bg: '#ecfeff', borda: '#a5f3fc', Icon: GraduationCap },
  outro:        { label: 'Outro',          cor: '#64748b', bg: '#f8fafc', borda: '#e2e8f0', Icon: Sparkles }
};

const cat = (id) => CATEGORIAS[id] || CATEGORIAS.outro;

const STATUS = [
  { id: 'todos',       label: 'Todos' },
  { id: 'acontecendo', label: 'Acontecendo agora' },
  { id: 'proximos',    label: 'Próximos' },
  { id: 'recorrentes', label: 'Recorrentes' },
  { id: 'destaques',   label: 'Destaques' },
  { id: 'encerrados',  label: 'Encerrados' }
];

const ORDENS = [
  { id: 'data_asc',   label: 'Data ↑ (mais próximo)' },
  { id: 'data_desc',  label: 'Data ↓ (mais distante)' },
  { id: 'titulo',     label: 'Título (A–Z)' },
  { id: 'recentes',   label: 'Cadastro mais recente' }
];

const VISOES_PADRAO = [
  { id: 'v-destaques', nome: 'Vitrine da home', busca: '', categoria: 'todas', status: 'destaques', ordem: 'data_asc', fixa: true },
  { id: 'v-semana',    nome: 'Programação semanal', busca: '', categoria: 'todas', status: 'recorrentes', ordem: 'data_asc', fixa: true },
  { id: 'v-agenda',    nome: 'Agenda completa', busca: '', categoria: 'todas', status: 'proximos', ordem: 'data_asc', fixa: true }
];

/* ---------- datas ---------- */

const diaBRT = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

const fmtDia = (iso) => {
  const s = diaBRT(iso);
  return s ? s.slice(8, 10) : '--';
};
const fmtMes = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', timeZone: TZ }).replace('.', '').toUpperCase();
};
const fmtData = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: TZ });
};
const fmtHora = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
};

const diasAte = (iso) => {
  const alvo = diaBRT(iso);
  const hoje = diaBRT(new Date().toISOString());
  if (!alvo || !hoje) return null;
  const a = Date.parse(`${alvo}T00:00:00Z`);
  const h = Date.parse(`${hoje}T00:00:00Z`);
  return Math.round((a - h) / 86400000);
};

const rotuloRelativo = (ev) => {
  if (ev.encerrado) return { texto: 'Encerrado', tom: '#64748b' };
  if (ev.acontecendoAgora) return { texto: 'Acontecendo agora', tom: '#e11d48' };
  const d = diasAte(ev.proximaOcorrencia?.inicio);
  if (d === null) return { texto: 'Sem data', tom: '#64748b' };
  if (d === 0) return { texto: 'Hoje', tom: '#f59e0b' };
  if (d === 1) return { texto: 'Amanhã', tom: '#f59e0b' };
  if (d < 0) return { texto: 'Encerrado', tom: '#64748b' };
  if (d <= 7) return { texto: `Em ${d} dias`, tom: '#0ea5e9' };
  if (d <= 30) return { texto: `Em ${Math.ceil(d / 7)} semanas`, tom: '#0d9488' };
  return { texto: `Em ${Math.round(d / 30)} meses`, tom: '#0d9488' };
};

const mesmoDia = (a, b) => diaBRT(a) && diaBRT(a) === diaBRT(b);

const faixaHorario = (ev) => {
  const o = ev.proximaOcorrencia;
  if (!o) return ev.dataInicio ? `${fmtData(ev.dataInicio)} · ${fmtHora(ev.dataInicio)}` : 'Sem ocorrência ativa';
  const ini = fmtHora(o.inicio);
  const fim = fmtHora(o.fim);
  if (mesmoDia(o.inicio, o.fim)) {
    return ini === fim ? `${fmtData(o.inicio)} · ${ini}` : `${fmtData(o.inicio)} · ${ini} às ${fim}`;
  }
  return `${fmtData(o.inicio)} ${ini} → ${fmtData(o.fim)} ${fim}`;
};

/* ---------- api ---------- */

const token = () => localStorage.getItem('admin_token');

const apiGet = async () => {
  const r = await fetch(`${API_BASE}/eventos?incluirPassados=true`, {
    headers: { Authorization: `Bearer ${token()}` }
  });
  if (!r.ok) throw new Error(`Falha ao carregar eventos (${r.status})`);
  const j = await r.json();
  return Array.isArray(j) ? j : [];
};

const apiDelete = async (id) => {
  const r = await fetch(`${API_BASE}/eventos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token()}` }
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || `Falha ao excluir (${r.status})`);
  }
};

const montarFormData = (ev, overrides = {}) => {
  const d = { ...ev, ...overrides };
  const fd = new FormData();
  fd.append('titulo', d.titulo || '');
  fd.append('descricao', d.descricao || '');
  fd.append('categoria', d.categoria || 'outro');
  fd.append('dataInicio', d.dataInicio || '');
  fd.append('dataFim', d.dataFim || '');
  fd.append('dataFimRecorrencia', d.dataFimRecorrencia || '');
  fd.append('recorrencia', d.recorrencia || 'nenhuma');
  fd.append('diasSemana', JSON.stringify(d.diasSemana || []));
  fd.append('localVinculado', d.localVinculado ? JSON.stringify(d.localVinculado) : '');
  fd.append('local', d.local || '');
  fd.append('endereco', d.endereco || '');
  fd.append('coordenadas', d.coordenadas || '');
  if (d.latitude != null) fd.append('latitude', d.latitude);
  if (d.longitude != null) fd.append('longitude', d.longitude);
  fd.append('gratuito', d.gratuito !== false);
  fd.append('preco', d.preco || '');
  fd.append('linkExterno', d.linkExterno || '');
  fd.append('telefone', d.telefone || '');
  fd.append('whatsapp', d.whatsapp || '');
  fd.append('destaque', Boolean(d.destaque));
  fd.append('cidade', d.cidade || 'rolante');
  (Array.isArray(d.imagens) ? d.imagens : []).forEach(u => u && fd.append('imagensExistentes', u));
  return fd;
};

const apiPut = async (ev, overrides) => {
  const r = await fetch(`${API_BASE}/eventos/${ev.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token()}` },
    body: montarFormData(ev, overrides)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.detalhes?.join(' | ') || j.error || 'Falha ao atualizar');
  return j;
};

/* ---------- estilos ---------- */

const CSS = `
.ev-scroll::-webkit-scrollbar{width:10px;height:10px}
.ev-scroll::-webkit-scrollbar-track{background:#e7f6ef;border-radius:9px}
.ev-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#059669,#0d9488);border-radius:9px;border:2px solid #e7f6ef}
.ev-scroll::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#047857,#0f766e)}
.ev-scroll{scrollbar-width:thin;scrollbar-color:#059669 #e7f6ef}
.ev-dark-scroll::-webkit-scrollbar-track{background:#052e26}
.ev-dark-scroll::-webkit-scrollbar-thumb{border-color:#052e26}
@keyframes evEntra{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.ev-entra{animation:evEntra .42s cubic-bezier(.22,1,.36,1) both}
@keyframes evDrawer{from{transform:translateX(100%)}to{transform:none}}
.ev-drawer{animation:evDrawer .34s cubic-bezier(.22,1,.36,1) both}
@keyframes evFade{from{opacity:0}to{opacity:1}}
.ev-fade{animation:evFade .24s ease both}
@keyframes evToast{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
.ev-toast{animation:evToast .3s cubic-bezier(.22,1,.36,1) both}
@keyframes evShimmer{100%{transform:translateX(100%)}}
.ev-skel{position:relative;overflow:hidden;background:#eef2f0}
.ev-skel::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);animation:evShimmer 1.5s infinite}
@keyframes evPulse{0%,100%{opacity:1}50%{opacity:.35}}
.ev-pulse{animation:evPulse 1.6s ease-in-out infinite}
@keyframes evDrift{0%{transform:translate3d(0,0,0)}50%{transform:translate3d(-3%,4%,0)}100%{transform:translate3d(0,0,0)}}
.ev-drift{animation:evDrift 22s ease-in-out infinite}
.ev-card{transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s,border-color .2s}
.ev-card:hover{transform:translateY(-3px)}
.ev-grain{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E")}
.ev-line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ev-line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
`;

/* ---------- átomos ---------- */

function Pill({ cor, bg, borda, children, Icon, size = 'sm' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-bold border whitespace-nowrap ${
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      }`}
      style={{ color: cor, backgroundColor: bg, borderColor: borda }}
    >
      {Icon && <Icon size={size === 'xs' ? 10 : 12} />}
      {children}
    </span>
  );
}

function CategoriaPill({ id, size }) {
  const c = cat(id);
  return <Pill cor={c.cor} bg={c.bg} borda={c.borda} Icon={c.Icon} size={size}>{c.label}</Pill>;
}

function Stat({ Icon, valor, rotulo, cor, ativo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer ${
        ativo ? 'border-transparent shadow-md' : 'border-white/15 hover:border-white/35'
      }`}
      style={{
        backgroundColor: ativo ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.05)',
        borderColor: ativo ? cor : undefined
      }}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${cor}26`, color: cor }}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-bold leading-none text-white tabular-nums">{valor}</span>
        <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-emerald-200/70">
          {rotulo}
        </span>
      </span>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="ev-skel h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2.5 py-1">
            <div className="ev-skel h-4 w-2/5 rounded" />
            <div className="ev-skel h-3 w-3/5 rounded" />
            <div className="ev-skel h-3 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- card em lista ---------- */

function EventoLinha({ ev, index, selecionado, onSelecionar, onAbrir, onEditar, onExcluir, onDestaque, busy }) {
  const c = cat(ev.categoria);
  const rel = rotuloRelativo(ev);
  const capa = ev.imagem || ev.imagens?.[0] || ev.localVinculadoDados?.imagem || '';
  const o = ev.proximaOcorrencia;

  return (
    <article
      className="ev-card ev-entra group relative flex gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm"
      style={{
        animationDelay: `${Math.min(index, 12) * 40}ms`,
        borderColor: selecionado ? c.cor : '#e2e8f0',
        boxShadow: selecionado ? `0 0 0 2px ${c.cor}33` : undefined
      }}
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: c.cor }} />

      <button
        type="button"
        onClick={onSelecionar}
        aria-label={selecionado ? 'Desmarcar' : 'Selecionar'}
        className="ml-1 mt-1 shrink-0 cursor-pointer self-start transition-colors"
        style={{ color: selecionado ? c.cor : '#cbd5e1' }}
      >
        {selecionado ? <CheckSquare size={19} /> : <Square size={19} />}
      </button>

      <div
        className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border text-center"
        style={{ backgroundColor: c.bg, borderColor: c.borda }}
      >
        <span className="block text-2xl font-bold leading-none tabular-nums" style={{ color: c.cor }}>
          {fmtDia(o?.inicio || ev.dataInicio)}
        </span>
        <span className="mt-0.5 block text-[10px] font-bold tracking-wider" style={{ color: c.cor }}>
          {fmtMes(o?.inicio || ev.dataInicio)}
        </span>
      </div>

      {capa && (
        <button
          type="button"
          onClick={onAbrir}
          className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:block cursor-pointer"
        >
          <img
            src={capa}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAbrir}
            className="truncate text-left text-[15px] font-bold text-slate-800 hover:text-emerald-700 cursor-pointer"
          >
            {ev.titulo}
          </button>
          {ev.destaque && <Pill cor="#b45309" bg="#fffbeb" borda="#fde68a" Icon={Star} size="xs">Destaque</Pill>}
          {ev.acontecendoAgora && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              <span className="ev-pulse h-1.5 w-1.5 rounded-full bg-rose-600" /> AO VIVO
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Clock size={12} />{faixaHorario(ev)}</span>
          {(ev.local || ev.localVinculadoDados?.nome) && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{ev.local || ev.localVinculadoDados?.nome}</span>
            </span>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <CategoriaPill id={ev.categoria} size="xs" />
          {ev.recorrencia && ev.recorrencia !== 'nenhuma' && (
            <Pill cor="#0f766e" bg="#f0fdfa" borda="#99f6e4" Icon={Repeat} size="xs">
              {ev.recorrenciaDescricao || 'Recorrente'}
            </Pill>
          )}
          <Pill cor={rel.tom} bg={`${rel.tom}12`} borda={`${rel.tom}33`} size="xs">{rel.texto}</Pill>
          <Pill
            cor={ev.gratuito !== false ? '#047857' : '#b45309'}
            bg={ev.gratuito !== false ? '#ecfdf5' : '#fffbeb'}
            borda={ev.gratuito !== false ? '#a7f3d0' : '#fde68a'}
            Icon={Ticket}
            size="xs"
          >
            {ev.gratuito !== false ? 'Gratuito' : (ev.preco || 'Pago')}
          </Pill>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDestaque}
            disabled={busy}
            title={ev.destaque ? 'Remover da vitrine' : 'Destacar na home'}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white transition-colors hover:bg-amber-50 disabled:opacity-40 cursor-pointer"
            style={{ color: ev.destaque ? '#f59e0b' : '#94a3b8' }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} fill={ev.destaque ? '#f59e0b' : 'none'} />}
          </button>
          <button
            type="button"
            onClick={onEditar}
            title="Editar"
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={onExcluir}
            title="Excluir"
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={onAbrir}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
        >
          Detalhes <ChevronRight size={13} />
        </button>
      </div>
    </article>
  );
}

/* ---------- card em grade ---------- */

function EventoGrade({ ev, index, selecionado, onSelecionar, onAbrir, onEditar, onExcluir }) {
  const c = cat(ev.categoria);
  const rel = rotuloRelativo(ev);
  const capa = ev.imagem || ev.imagens?.[0] || ev.localVinculadoDados?.imagem || '';
  const o = ev.proximaOcorrencia;

  return (
    <article
      className="ev-card ev-entra group relative overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{
        animationDelay: `${Math.min(index, 12) * 45}ms`,
        borderColor: selecionado ? c.cor : '#e2e8f0',
        boxShadow: selecionado ? `0 0 0 2px ${c.cor}33` : undefined
      }}
    >
      <button type="button" onClick={onAbrir} className="block w-full cursor-pointer text-left">
        <div className="relative h-36 overflow-hidden" style={{ background: `linear-gradient(135deg,${c.cor}22,${c.cor}05)` }}>
          {capa ? (
            <img
              src={capa}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <span className="grid h-full w-full place-items-center" style={{ color: `${c.cor}66` }}>
              <c.Icon size={44} />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
          <span
            className="absolute bottom-2.5 left-2.5 grid h-12 w-12 place-items-center rounded-xl border-2 border-white text-center shadow-lg"
            style={{ backgroundColor: c.cor }}
          >
            <span className="block text-base font-bold leading-none text-white tabular-nums">{fmtDia(o?.inicio || ev.dataInicio)}</span>
            <span className="block text-[9px] font-bold tracking-wider text-white/90">{fmtMes(o?.inicio || ev.dataInicio)}</span>
          </span>
          {ev.acontecendoAgora && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
              <span className="ev-pulse h-1.5 w-1.5 rounded-full bg-white" /> AO VIVO
            </span>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={onSelecionar}
        aria-label={selecionado ? 'Desmarcar' : 'Selecionar'}
        className="absolute left-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-lg bg-white/90 shadow backdrop-blur cursor-pointer"
        style={{ color: selecionado ? c.cor : '#94a3b8' }}
      >
        {selecionado ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>

      {ev.destaque && (
        <span className="absolute right-2.5 bottom-2.5 grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-white shadow-lg">
          <Star size={14} fill="white" />
        </span>
      )}

      <div className="space-y-2.5 p-4">
        <button
          type="button"
          onClick={onAbrir}
          className="ev-line-clamp-2 text-left text-[15px] font-bold leading-snug text-slate-800 hover:text-emerald-700 cursor-pointer"
        >
          {ev.titulo}
        </button>

        <div className="flex flex-wrap gap-1.5">
          <CategoriaPill id={ev.categoria} size="xs" />
          <Pill cor={rel.tom} bg={`${rel.tom}12`} borda={`${rel.tom}33`} size="xs">{rel.texto}</Pill>
        </div>

        <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-500">
          <Clock size={12} className="mt-0.5 shrink-0" />
          <span className="ev-line-clamp-2">{faixaHorario(ev)}</span>
        </p>

        {ev.recorrencia && ev.recorrencia !== 'nenhuma' && (
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700">
            <Repeat size={12} /> <span className="truncate">{ev.recorrenciaDescricao}</span>
          </p>
        )}

        <div className="flex items-center gap-1 border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={onAbrir}
            className="flex-1 rounded-lg bg-slate-50 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
          >
            Ver detalhes
          </button>
          <button
            type="button"
            onClick={onEditar}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
          >
            <Edit3 size={13} />
          </button>
          <button
            type="button"
            onClick={onExcluir}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------- drawer ---------- */

function Drawer({ ev, onClose, onEditar, onExcluir, onDestaque, busy }) {
  const c = cat(ev.categoria);
  const rel = rotuloRelativo(ev);
  const imagens = Array.isArray(ev.imagens) ? ev.imagens.filter(Boolean) : [];
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const o = ev.proximaOcorrencia;

  useEffect(() => { setFotoAtiva(0); }, [ev.id]);

  const capa = imagens[fotoAtiva] || ev.imagem || ev.localVinculadoDados?.imagem || '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fechar" onClick={onClose} className="ev-fade absolute inset-0 bg-slate-950/55 backdrop-blur-sm cursor-pointer" />
      <aside className="ev-drawer relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="relative shrink-0 overflow-hidden px-6 pb-5 pt-6" style={{ background: `linear-gradient(135deg,#052e26,#064e3b 45%,${c.cor}55)` }}>
          <span className="ev-grain pointer-events-none absolute inset-0 opacity-[0.07]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">Evento municipal</span>
              <h2 className="mt-1.5 text-xl font-bold leading-snug text-white">{ev.titulo}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <CategoriaPill id={ev.categoria} size="xs" />
                <Pill cor="#fff" bg={`${rel.tom}cc`} borda="transparent" size="xs">{rel.texto}</Pill>
                {ev.destaque && <Pill cor="#78350f" bg="#fde68a" borda="#fcd34d" Icon={Star} size="xs">Vitrine</Pill>}
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/25 cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="ev-scroll flex-1 overflow-y-auto px-6 py-5">
          {capa && (
            <div className="mb-5">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                <img src={capa} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
              </div>
              {imagens.length > 1 && (
                <div className="ev-scroll mt-2.5 flex gap-2 overflow-x-auto pb-1">
                  {imagens.map((u, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFotoAtiva(i)}
                      className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer"
                      style={{ borderColor: i === fotoAtiva ? c.cor : '#e2e8f0', opacity: i === fotoAtiva ? 1 : 0.6 }}
                    >
                      <img src={u} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <section className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: c.bg, borderColor: c.borda }}>
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: c.cor }}>
              <CalendarDays size={14} /> Programação
            </h3>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">Próxima ocorrência</dt>
                <dd className="text-right font-bold text-slate-800">{o ? fmtData(o.inicio) : '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">Horário</dt>
                <dd className="text-right font-bold text-slate-800">
                  {o ? (mesmoDia(o.inicio, o.fim) ? `${fmtHora(o.inicio)}${fmtHora(o.fim) !== fmtHora(o.inicio) ? ` às ${fmtHora(o.fim)}` : ''}` : `${fmtHora(o.inicio)} → ${fmtData(o.fim)} ${fmtHora(o.fim)}`) : fmtHora(ev.dataInicio) || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">Repetição</dt>
                <dd className="text-right font-bold text-slate-800">{ev.recorrenciaDescricao || 'Evento único'}</dd>
              </div>
              {ev.dataFimRecorrencia && (
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-slate-500">Repete até</dt>
                  <dd className="text-right font-bold text-slate-800">{fmtData(ev.dataFimRecorrencia)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-500">Situação</dt>
                <dd className="text-right font-bold" style={{ color: rel.tom }}>{rel.texto}</dd>
              </div>
            </dl>
          </section>

          {(ev.local || ev.endereco || ev.localVinculadoDados) && (
            <section className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <MapPin size={14} /> Local
              </h3>
              <p className="text-[14px] font-bold text-slate-800">{ev.local || ev.localVinculadoDados?.nome}</p>
              {ev.endereco && <p className="mt-1 text-[13px] text-slate-600">{ev.endereco}</p>}
              {ev.coordenadas && <p className="mt-2 font-mono text-[11px] text-slate-400">{ev.coordenadas}</p>}
              {ev.localVinculadoDados && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10.5px] font-bold text-teal-700">
                  <LinkIcon size={11} /> Vinculado a {ev.localVinculadoDados.nome}
                </p>
              )}
            </section>
          )}

          <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Ticket size={14} /> Ingressos e contato
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <Pill
                cor={ev.gratuito !== false ? '#047857' : '#b45309'}
                bg={ev.gratuito !== false ? '#ecfdf5' : '#fffbeb'}
                borda={ev.gratuito !== false ? '#a7f3d0' : '#fde68a'}
                Icon={Ticket}
              >
                {ev.gratuito !== false ? 'Entrada gratuita' : (ev.preco || 'Pago')}
              </Pill>
              {ev.telefone && <Pill cor="#0f766e" bg="#f0fdfa" borda="#99f6e4" Icon={Phone}>{ev.telefone}</Pill>}
              {ev.whatsapp && <Pill cor="#047857" bg="#ecfdf5" borda="#a7f3d0" Icon={MessageCircle}>{ev.whatsapp}</Pill>}
            </div>
            {ev.linkExterno && (
              <a
                href={ev.linkExterno}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                <LinkIcon size={13} className="shrink-0" />
                <span className="truncate">{ev.linkExterno}</span>
              </a>
            )}
          </section>

          {ev.descricao && (
            <section className="mb-4">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Descrição</h3>
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-slate-700">{ev.descricao}</p>
            </section>
          )}

          <p className="text-[10.5px] text-slate-400">
            Criado em {ev.createdAt ? fmtData(ev.createdAt) : '—'}
            {ev.updatedAt ? ` · Atualizado em ${fmtData(ev.updatedAt)}` : ''}
          </p>
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onDestaque}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
            style={{
              color: ev.destaque ? '#b45309' : '#475569',
              backgroundColor: ev.destaque ? '#fffbeb' : '#fff',
              borderColor: ev.destaque ? '#fde68a' : '#e2e8f0'
            }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} fill={ev.destaque ? '#f59e0b' : 'none'} />}
            {ev.destaque ? 'Na vitrine' : 'Destacar'}
          </button>
          <button
            type="button"
            onClick={onExcluir}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12px] font-bold text-rose-700 transition-colors hover:bg-rose-100 cursor-pointer"
          >
            <Trash2 size={14} /> Excluir
          </button>
          <button
            type="button"
            onClick={onEditar}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[12px] font-bold text-white shadow-md shadow-emerald-600/25 transition-colors hover:bg-emerald-700 cursor-pointer"
          >
            <Edit3 size={14} /> Editar evento
          </button>
        </footer>
      </aside>
    </div>
  );
}

/* ---------- principal ---------- */

export default function EventosScreen() {
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [status, setStatus] = useState('todos');
  const [ordem, setOrdem] = useState('data_asc');
  const [visual, setVisual] = useState('lista');

  const [selecionados, setSelecionados] = useState([]);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [toast, setToast] = useState(null);
  const [busyIds, setBusyIds] = useState([]);
  const [salvandoVisao, setSalvandoVisao] = useState(false);
  const [nomeVisao, setNomeVisao] = useState('');
  const [visoes, setVisoes] = useState(() => {
    try {
      const raw = localStorage.getItem(VISOES_KEY);
      const salvas = raw ? JSON.parse(raw) : [];
      return [...VISOES_PADRAO, ...(Array.isArray(salvas) ? salvas : [])];
    } catch { return VISOES_PADRAO; }
  });

  const pendingRef = useRef(null);
  const toastTimer = useRef(null);

  const avisar = useCallback((t) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (t?.tipo !== 'undo') {
      toastTimer.current = setTimeout(() => setToast(null), 4200);
    }
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setEventos(await apiGet());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  /* commit das exclusões pendentes */
  const commitPendente = useCallback(async () => {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    if (p.timer) clearTimeout(p.timer);
    try {
      await Promise.all(p.ids.map(apiDelete));
      avisar({ tipo: 'ok', texto: p.ids.length > 1 ? `${p.ids.length} eventos excluídos.` : 'Evento excluído.' });
    } catch (e) {
      setEventos(prev => [...prev, ...p.removidos]);
      avisar({ tipo: 'erro', texto: `Não foi possível excluir: ${e.message}` });
    }
  }, [avisar]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    const p = pendingRef.current;
    if (p) {
      if (p.timer) clearTimeout(p.timer);
      p.ids.forEach(id => { apiDelete(id).catch(() => {}); });
      pendingRef.current = null;
    }
  }, []);

  const excluir = useCallback(async (ids) => {
    await commitPendente();
    const removidos = eventos.filter(e => ids.includes(e.id));
    if (!removidos.length) return;
    setEventos(prev => prev.filter(e => !ids.includes(e.id)));
    setSelecionados(prev => prev.filter(id => !ids.includes(id)));
    if (detalhe && ids.includes(detalhe.id)) setDetalhe(null);

    const timer = setTimeout(() => { commitPendente(); }, UNDO_MS);
    pendingRef.current = { ids, removidos, timer };
    setToast({
      tipo: 'undo',
      texto: ids.length > 1 ? `${ids.length} eventos removidos` : `“${removidos[0].titulo}” removido`
    });
  }, [eventos, detalhe, commitPendente]);

  const desfazer = useCallback(() => {
    const p = pendingRef.current;
    if (!p) return;
    if (p.timer) clearTimeout(p.timer);
    pendingRef.current = null;
    setEventos(prev => [...prev, ...p.removidos]);
    setToast(null);
    avisar({ tipo: 'ok', texto: 'Exclusão cancelada.' });
  }, [avisar]);

  const alternarDestaque = useCallback(async (alvos) => {
    const lista = Array.isArray(alvos) ? alvos : [alvos];
    const ids = lista.map(e => e.id);
    setBusyIds(prev => [...prev, ...ids]);
    const anterior = new Map(lista.map(e => [e.id, e.destaque]));
    const novoValor = !lista.every(e => e.destaque);

    setEventos(prev => prev.map(e => ids.includes(e.id) ? { ...e, destaque: novoValor } : e));
    setDetalhe(d => d && ids.includes(d.id) ? { ...d, destaque: novoValor } : d);

    try {
      await Promise.all(lista.map(e => apiPut(e, { destaque: novoValor })));
      avisar({
        tipo: 'ok',
        texto: novoValor
          ? `${ids.length > 1 ? `${ids.length} eventos adicionados` : 'Evento adicionado'} à vitrine da home.`
          : `${ids.length > 1 ? `${ids.length} eventos removidos` : 'Evento removido'} da vitrine.`
      });
    } catch (e) {
      setEventos(prev => prev.map(ev => ids.includes(ev.id) ? { ...ev, destaque: anterior.get(ev.id) } : ev));
      setDetalhe(d => d && ids.includes(d.id) ? { ...d, destaque: anterior.get(d.id) } : d);
      avisar({ tipo: 'erro', texto: e.message });
    } finally {
      setBusyIds(prev => prev.filter(id => !ids.includes(id)));
    }
  }, [avisar]);

  /* teclas */
  useEffect(() => {
    const h = (e) => {
      if (e.key !== 'Escape') return;
      if (confirmar) setConfirmar(null);
      else if (detalhe) setDetalhe(null);
      else if (form) setForm(null);
      else if (selecionados.length) setSelecionados([]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [confirmar, detalhe, form, selecionados]);

  /* derivados */
  const stats = useMemo(() => ({
    total: eventos.length,
    acontecendo: eventos.filter(e => e.acontecendoAgora).length,
    proximos: eventos.filter(e => !e.encerrado && !e.acontecendoAgora).length,
    recorrentes: eventos.filter(e => e.recorrencia && e.recorrencia !== 'nenhuma').length,
    destaques: eventos.filter(e => e.destaque).length,
    encerrados: eventos.filter(e => e.encerrado).length
  }), [eventos]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let out = eventos.filter(ev => {
      if (categoria !== 'todas' && ev.categoria !== categoria) return false;
      if (status === 'acontecendo' && !ev.acontecendoAgora) return false;
      if (status === 'proximos' && (ev.encerrado || ev.acontecendoAgora)) return false;
      if (status === 'recorrentes' && (!ev.recorrencia || ev.recorrencia === 'nenhuma')) return false;
      if (status === 'destaques' && !ev.destaque) return false;
      if (status === 'encerrados' && !ev.encerrado) return false;
      if (q) {
        const alvo = `${ev.titulo} ${ev.descricao || ''} ${ev.local || ''} ${ev.endereco || ''} ${ev.localVinculadoDados?.nome || ''}`.toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      return true;
    });

    const t = (ev) => {
      const iso = ev.proximaOcorrencia?.inicio || ev.dataInicio;
      const v = iso ? new Date(iso).getTime() : NaN;
      return isNaN(v) ? Infinity : v;
    };

    out = [...out].sort((a, b) => {
      if (ordem === 'data_asc') return t(a) - t(b);
      if (ordem === 'data_desc') return t(b) - t(a);
      if (ordem === 'titulo') return (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return out;
  }, [eventos, busca, categoria, status, ordem]);

  const todosMarcados = filtrados.length > 0 && filtrados.every(e => selecionados.includes(e.id));
  const filtroAtivo = busca || categoria !== 'todas' || status !== 'todos' || ordem !== 'data_asc';

  const limparFiltros = () => { setBusca(''); setCategoria('todas'); setStatus('todos'); setOrdem('data_asc'); };

  const aplicarVisao = (v) => {
    setBusca(v.busca || ''); setCategoria(v.categoria || 'todas');
    setStatus(v.status || 'todos'); setOrdem(v.ordem || 'data_asc');
  };

  const salvarVisao = () => {
    const nome = nomeVisao.trim();
    if (!nome) return;
    const nova = { id: `v-${Date.now()}`, nome, busca, categoria, status, ordem };
    const custom = [...visoes.filter(v => !v.fixa), nova];
    setVisoes([...VISOES_PADRAO, ...custom]);
    try { localStorage.setItem(VISOES_KEY, JSON.stringify(custom)); } catch {}
    setNomeVisao(''); setSalvandoVisao(false);
    avisar({ tipo: 'ok', texto: `Visão “${nome}” salva.` });
  };

  const removerVisao = (id) => {
    const custom = visoes.filter(v => !v.fixa && v.id !== id);
    setVisoes([...VISOES_PADRAO, ...custom]);
    try { localStorage.setItem(VISOES_KEY, JSON.stringify(custom)); } catch {}
  };

  const aoSalvarEvento = () => {
    const editando = form?.modo === 'editar';
    setForm(null);
    carregar();
    avisar({ tipo: 'ok', texto: editando ? 'Evento atualizado com sucesso.' : 'Evento publicado no calendário.' });
  };

  /* ---------- render: formulário ---------- */
  if (form) {
    return (
      <div className="ev-fade mx-auto max-w-4xl space-y-4">
        <style>{CSS}</style>
        <button
          type="button"
          onClick={() => setForm(null)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <X size={16} /> Cancelar e voltar para a agenda
        </button>
        <EventoForm
          eventoInicial={form.modo === 'editar' ? form.evento : null}
          onSucesso={aoSalvarEvento}
          onCancel={() => setForm(null)}
        />
      </div>
    );
  }

  /* ---------- render: agenda ---------- */
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <style>{CSS}</style>

      {/* cabeçalho */}
      <header className="relative overflow-hidden rounded-3xl border border-emerald-900/40 px-6 py-6 shadow-lg md:px-8">
        <span className="absolute inset-0" style={{ background: 'linear-gradient(125deg,#04231d 0%,#064e3b 38%,#0f766e 68%,#1e1b4b 100%)' }} />
        <span className="ev-drift absolute -right-24 -top-28 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle,#a855f7,transparent 68%)' }} />
        <span className="ev-drift absolute -bottom-32 left-1/4 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle,#f59e0b,transparent 70%)', animationDelay: '-8s' }} />
        <span className="ev-grain pointer-events-none absolute inset-0 opacity-[0.06]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              <CalendarDays size={12} /> Exclusivo Rolante
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">Calendário Municipal</h1>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-emerald-100/70">
              Festas, feiras, missas e atividades cívicas. Eventos recorrentes calculam a próxima
              ocorrência automaticamente e nunca saem do app.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ modo: 'novo' })}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-900 shadow-xl transition-transform hover:scale-[1.03] cursor-pointer"
          >
            <Plus size={18} /> Novo evento
          </button>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <Stat Icon={Calendar} valor={stats.total} rotulo="No calendário" cor="#34d399" ativo={status === 'todos'} onClick={() => setStatus('todos')} />
          <Stat Icon={Clock} valor={stats.acontecendo} rotulo="Ao vivo" cor="#fb7185" ativo={status === 'acontecendo'} onClick={() => setStatus('acontecendo')} />
          <Stat Icon={CalendarDays} valor={stats.proximos} rotulo="Próximos" cor="#38bdf8" ativo={status === 'proximos'} onClick={() => setStatus('proximos')} />
          <Stat Icon={Repeat} valor={stats.recorrentes} rotulo="Recorrentes" cor="#2dd4bf" ativo={status === 'recorrentes'} onClick={() => setStatus('recorrentes')} />
          <Stat Icon={Star} valor={stats.destaques} rotulo="Na vitrine" cor="#fbbf24" ativo={status === 'destaques'} onClick={() => setStatus('destaques')} />
        </div>
      </header>

      {/* visões salvas */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Bookmark size={12} /> Visões
        </span>
        {visoes.map(v => (
          <span key={v.id} className="group inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => aplicarVisao(v)}
              className="px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
            >
              {v.nome}
            </button>
            {!v.fixa && (
              <button
                type="button"
                onClick={() => removerVisao(v.id)}
                aria-label={`Remover visão ${v.nome}`}
                className="border-l border-slate-100 px-1.5 py-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {salvandoVisao ? (
          <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-white p-1 shadow-sm">
            <input
              autoFocus
              value={nomeVisao}
              onChange={(e) => setNomeVisao(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') salvarVisao(); if (e.key === 'Escape') setSalvandoVisao(false); }}
              placeholder="Nome da visão"
              className="w-36 bg-transparent px-2 text-[11.5px] text-slate-700 outline-none"
            />
            <button type="button" onClick={salvarVisao} className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-600 text-white cursor-pointer"><Check size={13} /></button>
            <button type="button" onClick={() => setSalvandoVisao(false)} className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 cursor-pointer"><X size={13} /></button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setSalvandoVisao(true)}
            disabled={!filtroAtivo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-[11.5px] font-semibold text-slate-500 transition-colors hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-40 cursor-pointer"
          >
            <Save size={12} /> Salvar visão atual
          </button>
        )}
      </div>

      {/* toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título, descrição ou local…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-8 text-[12.5px] font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="todas">Todas as categorias</option>
                {Object.entries(CATEGORIAS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
              </select>
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <div className="relative">
              <ArrowUpDown size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-8 text-[12.5px] font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                {ORDENS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>

            <div className="flex overflow-hidden rounded-xl border border-slate-200">
              {[['lista', ListIcon], ['grade', LayoutGrid]].map(([id, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVisual(id)}
                  aria-label={id === 'lista' ? 'Ver em lista' : 'Ver em grade'}
                  className="grid h-10 w-10 place-items-center transition-colors cursor-pointer"
                  style={{ backgroundColor: visual === id ? '#059669' : '#f8fafc', color: visual === id ? '#fff' : '#64748b' }}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={carregar}
              disabled={carregando}
              title="Recarregar"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {filtroAtivo && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <p className="text-[12px] text-slate-500">
              <strong className="text-slate-800">{filtrados.length}</strong> de {eventos.length} eventos
            </p>
            <button type="button" onClick={limparFiltros} className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <RotateCcw size={12} /> Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* barra de seleção */}
      {selecionados.length > 0 && (
        <div className="ev-fade flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={() => setSelecionados(todosMarcados ? [] : filtrados.map(e => e.id))}
            className="inline-flex items-center gap-2 text-[12.5px] font-bold text-emerald-800 cursor-pointer"
          >
            {todosMarcados ? <CheckSquare size={17} /> : <Square size={17} />}
            {selecionados.length} selecionado{selecionados.length > 1 ? 's' : ''}
          </button>
          <span className="hidden h-5 w-px bg-emerald-300 sm:block" />
          <button
            type="button"
            onClick={() => alternarDestaque(eventos.filter(e => selecionados.includes(e.id)))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11.5px] font-bold text-amber-700 transition-colors hover:bg-amber-50 cursor-pointer"
          >
            <Star size={13} /> Alternar vitrine
          </button>
          <button
            type="button"
            onClick={() => setConfirmar({ ids: selecionados, titulos: eventos.filter(e => selecionados.includes(e.id)).map(e => e.titulo) })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-[11.5px] font-bold text-rose-700 transition-colors hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 size={13} /> Excluir selecionados
          </button>
          <button type="button" onClick={() => setSelecionados([])} className="ml-auto text-[11.5px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer">
            Cancelar seleção
          </button>
        </div>
      )}

      {/* conteúdo */}
      {carregando ? (
        <Skeleton />
      ) : erro ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600"><AlertTriangle size={26} /></span>
          <h3 className="mt-4 text-base font-bold text-rose-900">Não foi possível carregar a agenda</h3>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] text-rose-700">{erro}</p>
          <button type="button" onClick={carregar} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-[12.5px] font-bold text-white hover:bg-rose-700 cursor-pointer">
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      ) : eventos.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: 'linear-gradient(90deg,#a855f7,#f59e0b,#0ea5e9,#10b981,#84cc16)' }} />
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Inbox size={30} /></span>
          <h3 className="mt-5 text-lg font-bold text-slate-800">O calendário está vazio</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-slate-500">
            Cadastre a primeira festa, feira ou atividade cívica. Eventos recorrentes aparecem
            sempre com a próxima data calculada — você cadastra uma vez e o app mantém atualizado.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {Object.entries(CATEGORIAS).slice(0, 6).map(([id]) => <CategoriaPill key={id} id={id} size="xs" />)}
          </div>
          <button
            type="button"
            onClick={() => setForm({ modo: 'novo' })}
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-transform hover:scale-[1.03] cursor-pointer"
          >
            <Plus size={17} /> Cadastrar primeiro evento
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Search size={26} /></span>
          <h3 className="mt-4 text-base font-bold text-slate-800">Nenhum evento com esses filtros</h3>
          <p className="mt-1.5 text-[13px] text-slate-500">Ajuste a busca ou volte para a agenda completa.</p>
          <button type="button" onClick={limparFiltros} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-[12.5px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
            <RotateCcw size={14} /> Limpar filtros
          </button>
        </div>
      ) : visual === 'lista' ? (
        <div className="space-y-3">
          {filtrados.map((ev, i) => (
            <EventoLinha
              key={ev.id}
              ev={ev}
              index={i}
              selecionado={selecionados.includes(ev.id)}
              busy={busyIds.includes(ev.id)}
              onSelecionar={() => setSelecionados(p => p.includes(ev.id) ? p.filter(x => x !== ev.id) : [...p, ev.id])}
              onAbrir={() => setDetalhe(ev)}
              onEditar={() => { setDetalhe(null); setForm({ modo: 'editar', evento: ev }); }}
              onExcluir={() => setConfirmar({ ids: [ev.id], titulos: [ev.titulo] })}
              onDestaque={() => alternarDestaque(ev)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((ev, i) => (
            <EventoGrade
              key={ev.id}
              ev={ev}
              index={i}
              selecionado={selecionados.includes(ev.id)}
              onSelecionar={() => setSelecionados(p => p.includes(ev.id) ? p.filter(x => x !== ev.id) : [...p, ev.id])}
              onAbrir={() => setDetalhe(ev)}
              onEditar={() => { setDetalhe(null); setForm({ modo: 'editar', evento: ev }); }}
              onExcluir={() => setConfirmar({ ids: [ev.id], titulos: [ev.titulo] })}
            />
          ))}
        </div>
      )}

      {/* drawer */}
      {detalhe && (
        <Drawer
          ev={eventos.find(e => e.id === detalhe.id) || detalhe}
          busy={busyIds.includes(detalhe.id)}
          onClose={() => setDetalhe(null)}
          onEditar={() => { const ev = eventos.find(e => e.id === detalhe.id) || detalhe; setDetalhe(null); setForm({ modo: 'editar', evento: ev }); }}
          onExcluir={() => setConfirmar({ ids: [detalhe.id], titulos: [detalhe.titulo] })}
          onDestaque={() => alternarDestaque(eventos.find(e => e.id === detalhe.id) || detalhe)}
        />
      )}

      {/* confirmação */}
      {confirmar && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button type="button" aria-label="Cancelar" onClick={() => setConfirmar(null)} className="ev-fade absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer" />
          <div className="ev-toast relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 to-amber-500" />
            <div className="p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600"><AlertTriangle size={24} /></span>
              <h3 className="mt-4 text-lg font-bold text-slate-800">
                {confirmar.ids.length > 1 ? `Excluir ${confirmar.ids.length} eventos?` : 'Excluir este evento?'}
              </h3>
              <div className="ev-scroll mt-3 max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                {confirmar.titulos.map((t, i) => (
                  <p key={i} className="truncate text-[12.5px] font-semibold text-slate-700">• {t}</p>
                ))}
              </div>
              <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-slate-500">
                <Info size={14} className="mt-0.5 shrink-0 text-sky-500" />
                Você terá {UNDO_MS / 1000} segundos para desfazer. Depois disso o evento e suas imagens são removidos definitivamente.
              </p>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setConfirmar(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                  Manter
                </button>
                <button
                  type="button"
                  onClick={() => { const ids = confirmar.ids; setConfirmar(null); excluir(ids); }}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-[12.5px] font-bold text-white shadow-md shadow-rose-600/25 hover:bg-rose-700 cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
          <div
            className="ev-toast pointer-events-auto flex w-full max-w-lg items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 shadow-2xl"
            style={{
              backgroundColor: toast.tipo === 'erro' ? '#4c0519' : toast.tipo === 'undo' ? '#1e1b4b' : '#052e26',
              border: `1px solid ${toast.tipo === 'erro' ? '#9f1239' : toast.tipo === 'undo' ? '#4c1d95' : '#065f46'}`
            }}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
              style={{
                backgroundColor: toast.tipo === 'erro' ? '#9f123955' : toast.tipo === 'undo' ? '#6d28d955' : '#05966955',
                color: toast.tipo === 'erro' ? '#fda4af' : toast.tipo === 'undo' ? '#c4b5fd' : '#6ee7b7'
              }}
            >
              {toast.tipo === 'erro' ? <AlertTriangle size={16} /> : toast.tipo === 'undo' ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}
            </span>
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{toast.texto}</p>
            {toast.tipo === 'undo' ? (
              <>
                <button
                  type="button"
                  onClick={desfazer}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12px] font-bold text-violet-900 hover:bg-violet-50 cursor-pointer"
                >
                  <RotateCcw size={13} /> Desfazer
                </button>
                <button
                  type="button"
                  onClick={() => { commitPendente(); }}
                  className="shrink-0 text-white/50 hover:text-white cursor-pointer"
                  aria-label="Confirmar exclusão agora"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setToast(null)} className="shrink-0 text-white/50 hover:text-white cursor-pointer" aria-label="Fechar aviso">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* progresso do undo */}
      {toast?.tipo === 'undo' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[69] flex justify-center px-4">
          <div className="h-1 w-full max-w-lg overflow-hidden rounded-t-full bg-violet-900/40">
            <div
              className="h-full rounded-t-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
              style={{ animation: `evUndo ${UNDO_MS}ms linear forwards` }}
            />
          </div>
          <style>{`@keyframes evUndo{from{width:100%}to{width:0%}}`}</style>
        </div>
      )}
    </div>
  );
}