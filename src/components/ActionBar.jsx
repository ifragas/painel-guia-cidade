
import { Plus, List } from 'lucide-react';

const TITULOS = {
  'pontos-turisticos': 'Pontos Turísticos',
  restaurantes: 'Restaurantes',
  acomodacoes: 'Acomodações',
  servicos: 'Serviços Essenciais'
};

export default function ActionBar({ tipo, aba, setAba }) {
  const titulo = TITULOS[tipo] || tipo;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
      
      <div>
        <h3 className="text-lg font-bold text-slate-800">
          {titulo}
        </h3>

        <p className="text-sm text-slate-500">
          Gerencie os cadastros e informações exibidas no aplicativo.
        </p>
      </div>

      <div className="flex items-center gap-2">
        
        <button
          type="button"
          onClick={() => setAba('lista')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
            aba === 'lista'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'
          }`}
        >
          <List size={18} />
          <span>Ver Lista</span>
        </button>

        <button
          type="button"
          onClick={() => setAba('cadastro')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
            aba === 'cadastro'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'
          }`}
        >
          <Plus size={18} />
          <span>Novo Cadastro</span>
        </button>

      </div>
    </div>
  );
}
