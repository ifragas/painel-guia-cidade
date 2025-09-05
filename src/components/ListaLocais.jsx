// src/components/ListaLocais.jsx
import { useState, useEffect } from 'react';

export default function ListaLocais() {
  const [tipo, setTipo] = useState('pontos-turisticos');
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscarLocais = async () => {
    try {
      const response = await fetch(`https://turismo-api-vv62.onrender.com/api/${tipo}`);
      if (!response.ok) throw new Error('Erro na API');
      const data = await response.json();
      setLocais(data);
    } catch (error) {
      alert('❌ Erro ao buscar locais: ' + error.message);
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const excluirLocal = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este local?')) return;

    try {
      const response = await fetch(`https://turismo-api-vv62.onrender.com/api/${tipo}/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('✅ Excluído com sucesso!');
        buscarLocais(); // Recarrega a lista
      } else {
        alert('❌ Erro ao excluir');
      }
    } catch (error) {
      alert('❌ Erro de conexão');
      console.error('Erro:', error);
    }
  };

  useEffect(() => {
    buscarLocais();
  }, [tipo]);

  return (
    <div className="lista-container">
      <h2>📋 Gerenciar Locais</h2>

      <div className="form-group">
        <label>Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="pontos-turisticos">Pontos Turísticos</option>
          <option value="restaurantes">Restaurantes</option>
          <option value="acomodacoes">Acomodações</option>
        </select>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table className="tabela-locais">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {locais.map(local => (
              <tr key={local.id}>
                <td>{local.nome}</td>
                <td>{local.descricao.substring(0, 50)}...</td>
                <td>
                  <button onClick={() => alert('Editar ainda não implementado')}>
                    ✏️ 
                  </button>
                  <button onClick={() => excluirLocal(local.id)} style={{ marginLeft: 10 }}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}