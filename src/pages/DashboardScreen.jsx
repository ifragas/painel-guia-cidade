// src/pages/DashboardScreen.jsx
import { useState } from 'react';
import Layout from '../components/Layout';
import ActionBar from '../components/ActionBar';
import CadastroForm from '../components/CadastroForm';
import ListaCards from '../components/ListaCards';
import DetalhesCard from '../components/DetalhesCard';
import EventosScreen from '../components/EventosScreen';
import CidadesScreen from '../components/CidadesScreen'; 
import UsuariosScreen from '../components/UsuariosScreen'; // <-- Importado
import { useAuth } from '../context/AuthContext';
import { getUserInfo } from '../utils/getUserInfo'; 

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { role } = getUserInfo(); 
  
  // Debug para garantir que a role está chegando corretamente
  console.log('🔍 DEBUG Dashboard - Role extraída do token:', role);

  const [aba, setAba] = useState('lista');
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [tipo, setTipo] = useState('pontos-turisticos');
  const [versaoLista, setVersaoLista] = useState(0);

  const handleEdit = (item) => {
    setItemSelecionado(item);
  };

  const handleAtualizarItem = (itemAtualizado) => {
    setItemSelecionado(itemAtualizado);
    setVersaoLista((versao) => versao + 1);
  };

  const handleDelete = () => {
    setItemSelecionado(null);
    setAba('lista');
    setVersaoLista((versao) => versao + 1);
  };

  const handleVoltar = () => {
    setItemSelecionado(null);
    setAba('lista');
  };

  const handleMudarTipo = (novoTipo) => {
    setTipo(novoTipo);
    setItemSelecionado(null);
    setAba('lista');
  };

  // 🚨 DECLARAÇÕES DAS CONDIÇÕES DE TELA
  const ehEventos = tipo === 'eventos';
  const ehCidades = tipo === 'admin-cidades';
  const ehUsuarios = tipo === 'admin-usuarios'; // <-- CORREÇÃO: Declarado aqui!

  return (
    <Layout
      ativo={tipo}
      setAtivo={handleMudarTipo}
      onLogout={logout}
      userEmail={user?.email}
      userRole={role} // Passa a role para o Layout/Sidebar
    >
      {ehEventos ? (
        <EventosScreen key="eventos" />
      ) : ehCidades ? (
        <CidadesScreen key="cidades" /> 
      ) : ehUsuarios ? (
        <UsuariosScreen key="usuarios" /> 
      ) : (
        <>
          {!itemSelecionado && (
            <ActionBar tipo={tipo} aba={aba} setAba={setAba} />
          )}

          {itemSelecionado ? (
            <DetalhesCard
              key={`${tipo}-${itemSelecionado.id}`}
              item={itemSelecionado}
              tipo={tipo}
              onVoltar={handleVoltar}
              onEdit={handleAtualizarItem}
              onDelete={handleDelete}
            />
          ) : aba === 'cadastro' ? (
            <CadastroForm
              tipo={tipo}
              onSucesso={() => {
                setAba('lista');
                setVersaoLista((versao) => versao + 1);
              }}
            />
          ) : (
            <ListaCards
              key={`${tipo}-${versaoLista}`}
              tipo={tipo}
              onEdit={handleEdit}
            />
          )}
        </>
      )}
    </Layout>
  );
}