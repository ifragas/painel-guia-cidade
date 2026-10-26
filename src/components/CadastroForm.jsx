import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  UploadCloud,
  MapPin,
  Clock,
  FileText,
  Tag,
  Globe,
  Loader2,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Image as ImageIcon
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

export default function CadastroForm({ tipo: tipoProp, onSucesso }) {
  const [tipo, setTipo] = useState(tipoProp || 'pontos-turisticos');

  const [dados, setDados] = useState({
    nome: '',
    descricao: '',
    endereco: '',
    coordenadas: ''
  });

  // Estado para gerenciar os horários por dia da semana
  const [horariosPorDia, setHorariosPorDia] = useState(
    DIAS_SEMANA.reduce((acc, dia) => {
      acc[dia.id] = { ativo: false, abertura: '08:00', fecho: '18:00' };
      return acc;
    }, {})
  );

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  // Sincroniza a categoria com a Sidebar.
  useEffect(() => {
    if (tipoProp) {
      setTipo(tipoProp);
    }
  }, [tipoProp]);

  // Atualiza os campos do formulário.
  const handleChange = (e) => {
    setDados((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Alterna o dia ativo no gestor de horários
  const handleToggleDia = (diaId) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        ativo: !prev[diaId].ativo
      }
    }));
  };

  // Atualiza o horário de abertura ou fecho de um dia específico
  const handleHorarioChange = (diaId, campo, valor) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        [campo]: valor
      }
    }));
  };

  // Realiza o cadastro.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setUploading(true);
    setSucesso(false);
    setErro('');

    const formData = new FormData();

    formData.append('nome', dados.nome);
    formData.append('descricao', dados.descricao);
    formData.append('endereco', dados.endereco);
    formData.append('coordenadas', dados.coordenadas);

    // Filtra apenas os dias ativos e envia o objeto de horários estruturado
    const horariosPayload = {};
    Object.keys(horariosPorDia).forEach((dia) => {
      if (horariosPorDia[dia].ativo) {
        horariosPayload[dia] = {
          abertura: horariosPorDia[dia].abertura,
          fecho: horariosPorDia[dia].fecho
        };
      }
    });
    formData.append('horarios', JSON.stringify(horariosPayload));

    files.forEach((file) => {
      formData.append('imagens', file);
    });

    try {
      await api.post(`/${tipo}`, formData);

      setSucesso(true);

      setDados({
        nome: '',
        descricao: '',
        endereco: '',
        coordenadas: ''
      });

      setHorariosPorDia(
        DIAS_SEMANA.reduce((acc, dia) => {
          acc[dia.id] = { ativo: false, abertura: '08:00', fecho: '18:00' };
          return acc;
        }, {})
      );

      setFiles([]);

      // Retorna para a listagem após o sucesso.
      if (onSucesso) {
        setTimeout(() => {
          onSucesso();
        }, 1500);
      }
    } catch (error) {
      console.error('Erro na API:', error);

      setErro(
        error.response?.data?.error ||
        error.message ||
        'Erro ao realizar cadastro.'
      );
    } finally {
      setUploading(false);
    }
  };

  // Remove uma imagem selecionada.
  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // Nome amigável da categoria.
  const getNomeCategoria = () => {
    switch (tipo) {
      case 'pontos-turisticos':
        return 'Ponto Turístico';

      case 'restaurantes':
        return 'Restaurante';

      case 'acomodacoes':
        return 'Acomodação';

      default:
        return 'Local';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-4xl mx-auto">

      {/* Cabeçalho do formulário */}
      <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Cadastrar Novo Local
          </h2>

          <p className="text-slate-500 text-sm mt-0.5">
            Preencha as informações para adicionar um novo registro.
          </p>
        </div>

        {/* Categoria ativa */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl border border-emerald-100 text-xs font-semibold self-start sm:self-auto">
          <Tag size={14} />
          <span>Categoria: {getNomeCategoria()}</span>
        </div>
      </div>

      {/* Alerta de sucesso */}
      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-2xl mb-6 flex items-center gap-3">
          <CheckCircle2
            className="text-emerald-600 shrink-0"
            size={20}
          />

          <div>
            <p className="font-semibold">
              Cadastro realizado com sucesso!
            </p>

            <p className="text-xs text-emerald-700">
              Redirecionando para a listagem...
            </p>
          </div>
        </div>
      )}

      {/* Alerta de erro */}
      {erro && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-2xl mb-6 flex items-center gap-3">
          <X
            className="text-rose-600 shrink-0"
            size={20}
          />

          <div>
            <p className="font-semibold">
              Erro ao salvar cadastro
            </p>

            <p className="text-xs text-rose-700">
              {erro}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Nome do local */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Nome do Local *
          </label>

          <input
            type="text"
            name="nome"
            value={dados.nome}
            onChange={handleChange}
            required
            placeholder="Ex: Cascata do Chuvisqueiro"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
            <FileText size={14} className="text-slate-400" />
            Descrição Completa *
          </label>

          <textarea
            name="descricao"
            value={dados.descricao}
            onChange={handleChange}
            rows="4"
            required
            placeholder="Descreva as atratividades, diferenciais e informações úteis para os visitantes..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all resize-y"
          />
        </div>

        {/* Endereço */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400" />
            Endereço
          </label>

          <input
            type="text"
            name="endereco"
            value={dados.endereco}
            onChange={handleChange}
            placeholder="Ex: Localidade de Linha 5, Riozinho - RS"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all"
          />
        </div>

        {/* Gestor de Horários de Funcionamento */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock size={18} className="text-emerald-600" />
            <h4 className="text-sm font-bold">
              Horário de Funcionamento por Dia da Semana
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Ative os dias em que o local funciona e configure o intervalo de atendimento.
          </p>

          <div className="space-y-3 pt-2">
            {DIAS_SEMANA.map((dia) => {
              const item = horariosPorDia[dia.id];
              return (
                <div
                  key={dia.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                    item.ativo
                      ? 'bg-white border-emerald-200 shadow-sm'
                      : 'bg-slate-100/60 border-slate-200/60 opacity-70'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.ativo}
                      onChange={() => handleToggleDia(dia.id)}
                      className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-800 min-w-[110px]">
                      {dia.label}
                    </span>
                  </label>

                  {item.ativo ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Das</span>
                      <input
                        type="time"
                        value={item.abertura}
                        onChange={(e) => handleHorarioChange(dia.id, 'abertura', e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
                      />
                      <span className="text-slate-500 font-medium">às</span>
                      <input
                        type="time"
                        value={item.fecho}
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
        </div>

        {/* Upload de imagens */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Fotos do Local (Upload Múltiplo)
          </label>

          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-emerald-50/30 transition-all cursor-pointer relative group">

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const selecionadas = Array.from(e.target.files || []);

                setFiles((prev) => [
                  ...prev,
                  ...selecionadas
                ]);

                e.target.value = '';
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="bg-white p-3 rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                <UploadCloud size={28} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Clique ou arraste imagens aqui
                </p>

                <p className="text-xs text-slate-400 mt-0.5">
                  PNG, JPG ou JPEG — máximo recomendado de 10 MB por arquivo
                </p>
              </div>
            </div>
          </div>

          {/* Imagens selecionadas */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase text-slate-500">
                {files.length}{' '}
                {files.length === 1
                  ? 'imagem selecionada'
                  : 'imagens selecionadas'}
              </p>

              <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${file.size}-${idx}`}
                    className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl"
                  >
                    <ImageIcon
                      size={14}
                      className="text-slate-400 shrink-0"
                    />

                    <span className="truncate max-w-[180px] font-medium">
                      {file.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      aria-label={`Remover imagem ${file.name}`}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coordenadas geográficas unificadas */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">

          <div className="flex items-center gap-2 text-slate-700">
            <Globe size={18} className="text-emerald-600" />

            <h4 className="text-sm font-bold">
              Localização no Mapa (Coordenadas)
            </h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Latitude e Longitude (Separadas por vírgula)
            </label>

            <input
              type="text"
              name="coordenadas"
              value={dados.coordenadas}
              onChange={handleChange}
              placeholder="Ex: -29.6288, -50.4533"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Dica: Pode copiar diretamente do Google Maps (ex: <code className="text-slate-600">-29.6288, -50.4533</code>).
            </p>
          </div>

        </div>

        {/* Botão de envio */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Cadastrando local...</span>
              </>
            ) : (
              <span>Cadastrar Local</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}