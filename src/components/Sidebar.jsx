import React from 'react';
import { MapPin, Utensils, Home, LogOut, Compass } from 'lucide-react';

export default function Sidebar({ ativo, setAtivo, onLogout }) {
  const menuItems = [
    { id: 'pontos-turisticos', label: 'Pontos Turísticos', icon: MapPin },
    { id: 'restaurantes', label: 'Restaurantes', icon: Utensils },
    { id: 'acomodacoes', label: 'Acomodações', icon: Home },
  ];

  return (
    <aside className="group relative w-20 hover:w-64 bg-emerald-950 text-emerald-100 flex flex-col justify-between hidden md:flex border-r border-emerald-900/50 transition-all duration-300 ease-in-out z-30 shrink-0">
      
      {/* Topo / Logo */}
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-emerald-900/50 overflow-hidden">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-900/40 shrink-0">
            <Compass size={22} />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            <h1 className="font-bold text-white text-base tracking-wide">Guia da Cidade</h1>
            <p className="text-xs text-emerald-300 font-medium">Turismo Riozinho</p>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="p-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = ativo === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAtivo(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                    : 'hover:bg-emerald-900/60 text-emerald-200/80 hover:text-white'
                }`}
              >
                <div className="shrink-0">
                  <Icon size={20} />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Rodapé da Sidebar / Sair */}
      <div className="p-3 border-t border-emerald-900/50">
        <button
          onClick={onLogout}
          title="Sair do Sistema"
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer overflow-hidden"
        >
          <div className="shrink-0">
            <LogOut size={20} />
          </div>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            Sair do Sistema
          </span>
        </button>
      </div>

    </aside>
  );
}