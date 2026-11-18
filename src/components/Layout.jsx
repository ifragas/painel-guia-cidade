// src/components/Layout.jsx
import React from 'react';
import Sidebar from './Sidebar';

const TITULOS = {
  'pontos-turisticos': 'Pontos Turísticos',
  restaurantes: 'Restaurantes',
  acomodacoes: 'Acomodações',
  servicos: 'Serviços Essenciais',
  'eventos': 'Eventos',
  'admin-cidades': 'Cidades',
  'admin-usuarios': 'Usuários'
};

export default function Layout({ ativo, setAtivo, onLogout, userEmail, children, userRole }) {
  const titulo = TITULOS[ativo] || ativo;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Lateral - 🚨 CORREÇÃO: Repassando userRole para o Sidebar */}
      <Sidebar 
        ativo={ativo} 
        setAtivo={setAtivo} 
        onLogout={onLogout} 
        userRole={userRole} 
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Superior */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              Gerenciamento de {titulo}
            </h2>
            <p className="text-xs text-slate-500">Painel Administrativo - Secretaria de Turismo</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
                {userEmail || 'Administrador'}
              </span>
              {/* 🚨 DEBUG: Mostra a role atual no header para você validar */}
              <span className="text-[10px] text-emerald-600 font-mono mt-1">
                Role: {userRole || 'não definida'}
              </span>
            </div>
          </div>
        </header>

        {/* Área Dinâmica com o Conteúdo */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}