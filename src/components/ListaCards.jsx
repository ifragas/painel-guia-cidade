import React, { useState, useEffect } from 'react';

export default function ListaCards({ tipo, onEdit }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscarItens = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`https://turismo-api-vv62.onrender.com/api/${tipo}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Erro na API');
      const data = await response.json();
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
      <div className="lista-container">
        <h2>Carregando...</h2>
        <p>🔄 Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="lista-container">
      <h2>📋 {tipo === 'pontos-turisticos' ? 'Pontos Turísticos' : tipo === 'restaurantes' ? 'Restaurantes' : 'Acomodações'}</h2>

      <div className="lista-wrapper">
        <div className="cards-grid">
          {itens.length === 0 ? (
            <p>📭 Nenhum item cadastrado ainda.</p>
          ) : (
            itens.map(item => (
              <div
                key={item.id}
                className="card-item clicavel"
                onClick={() => onEdit(item)}
              >
                <img
                  src={item.imagem || item.imagens?.[0] || '/placeholder.jpg'}
                  alt={item.nome}
                  className="card-imagem"
                  onError={(e) => {
                    e.target.src = '/placeholder.jpg';
                  }}
                />
                <div className="card-conteudo">
                  <h3 className="card-nome">{item.nome}</h3>
                  <p className="card-descricao">{item.descricao.substring(0, 100)}...</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}