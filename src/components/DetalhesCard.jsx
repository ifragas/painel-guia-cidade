import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

export default function DetalhesCard({ item, tipo, onVoltar, onEdit, onDelete }) {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({ ...item });
  const [novasImagensPreviews, setNovasImagensPreviews] = useState([]);
  const [arquivosNovos, setArquivosNovos] = useState([]);

  const indiceRef = useRef(0);
  const [indiceImagem, setIndiceImagem] = useState(0);

  useEffect(() => {
    indiceRef.current = indiceImagem;
  }, [indiceImagem]);

  const rawImagens = editando ? formData.imagens : item.imagens;
  const imagens = Array.isArray(rawImagens)
    ? rawImagens
        .map(url => url?.replace(/\s+/g, '').trim())
        .filter(url => url && url.startsWith('http'))
    : [];

  const imagemAtual = imagens[indiceRef.current] || item.imagem?.replace(/\s+/g, '').trim() || '/placeholder.jpg';

  const proximaImagem = () => {
    const nextIndex = (indiceRef.current + 1) % imagens.length;
    setIndiceImagem(nextIndex);
  };

  const imagemAnterior = () => {
    const prevIndex = (indiceRef.current - 1 + imagens.length) % imagens.length;
    setIndiceImagem(prevIndex);
  };

  const pularParaImagem = (index) => {
    setIndiceImagem(index);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const adicionarImagens = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Cria previews locais para exibição imediata
    const previews = files.map(file => URL.createObjectURL(file));
    setArquivosNovos(prev => [...prev, ...files]);
    setNovasImagensPreviews(prev => [...prev, ...previews]);
    e.target.value = '';
  };

  const removerImagemExistente = (index) => {
    if (!window.confirm('🗑️ Deseja remover esta imagem?')) return;
    const novas = [...formData.imagens];
    novas.splice(index, 1);
    setFormData({ ...formData, imagens: novas });
  };

  const removerNovaImagemPrevia = (index) => {
    setNovasImagensPreviews(prev => prev.filter((_, i) => i !== index));
    setArquivosNovos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Monta o FormData para enviar texto e arquivos via Multipart/form-data para a API do Render
      const dataForm = new FormData();
      dataForm.append('nome', formData.nome || '');
      dataForm.append('descricao', formData.descricao || '');
      dataForm.append('endereco', formData.endereco || '');
      dataForm.append('horario', formData.horario || '');
      
      if (formData.latitude !== null && formData.latitude !== undefined) {
        dataForm.append('latitude', formData.latitude);
      }
      if (formData.longitude !== null && formData.longitude !== undefined) {
        dataForm.append('longitude', formData.longitude);
      }

      // Envia as URLs das imagens que já existiam e foram mantidas
      if (Array.isArray(formData.imagens)) {
        formData.imagens.forEach(url => {
          dataForm.append('imagensExistentes', url);
        });
      }

      // Adiciona os novos arquivos binários para o backend fazer o upload seguro
      arquivosNovos.forEach(file => {
        dataForm.append('imagens', file);
      });

      console.log('📦 Enviando atualização via API...');

      // Como a api.js padrão usa JSON, vamos usar fetch com o token do localStorage para suportar FormData
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.PROD ? 'https://turismo-api-vv62.onrender.com/api' : 'http://localhost:3000/api'}/${tipo}/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Não definir Content-Type ao usar FormData, o browser faz isso automaticamente com o boundary
        },
        body: dataForm
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar item');
      }

      alert('✅ Item atualizado com sucesso!');
      setEditando(false);
      setNovasImagensPreviews([]);
      setArquivosNovos([]);
      onEdit(result);

    } catch (error) {
      alert('❌ Erro ao atualizar: ' + error.message);
      console.error('Erro na API:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`🗑️ Tem certeza que deseja EXCLUIR "${item.nome}"?`)) return;

    try {
      await api.delete(`/${tipo}/${item.id}`);
      alert('✅ Item excluído com sucesso!');
      onDelete(item.id);
      onVoltar();
    } catch (error) {
      alert('❌ Erro ao excluir: ' + error.message);
    }
  };

  return (
    <div className="detalhes-container">
      <div className="detalhes-header-nav">
        <button className="btn-voltar-slim" onClick={onVoltar}>
          ← Voltar para Lista
        </button>
        {!editando && (
          <div className="detalhes-acoes-topo">
            <button className="btn-acao-moderno btn-editar" onClick={() => setEditando(true)}>
              ✏️ Editar Item
            </button>
            <button className="btn-acao-moderno btn-excluir" onClick={handleDelete}>
              🗑️ Excluir
            </button>
          </div>
        )}
      </div>

      <div className="detalhes-card-box">
        <h2 className="detalhes-titulo">📍 {item.nome}</h2>

        {!editando ? (
          <>
            {imagens.length > 0 ? (
              <div className="detalhes-carousel">
                <img
                  src={imagemAtual}
                  alt={item.nome}
                  className="detalhes-imagem-principal"
                  onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                />
                {imagens.length > 1 && (
                  <>
                    <button className="carousel-btn prev" onClick={imagemAnterior}>‹</button>
                    <button className="carousel-btn next" onClick={proximaImagem}>›</button>
                    <div className="carousel-indicators">
                      {imagens.map((_, index) => (
                        <span
                          key={index}
                          className={`indicator-dot ${index === indiceImagem ? 'active' : ''}`}
                          onClick={() => pularParaImagem(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="detalhes-sem-imagem">Sem imagem disponível</div>
            )}

            <div className="detalhes-info-grid">
              <div className="info-item">
                <span className="info-label">Tipo</span>
                <span className="info-value">{item.tipo || 'Ponto Turístico'}</span>
              </div>

              <div className="info-item full-width">
                <span className="info-label">Descrição</span>
                <p className="info-value descricao-texto">{item.descricao}</p>
              </div>

              {item.endereco && (
                <div className="info-item">
                  <span className="info-label">Endereço</span>
                  <span className="info-value">📍 {item.endereco}</span>
                </div>
              )}

              {item.horario && (
                <div className="info-item">
                  <span className="info-label">Horário de Funcionamento</span>
                  <span className="info-value">⏰ {item.horario}</span>
                </div>
              )}

              {(item.latitude && item.longitude) && (
                <div className="info-item">
                  <span className="info-label">Coordenadas Geográficas</span>
                  <span className="info-value">🧭 {item.latitude}, {item.longitude}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="form-edicao-moderno">
            <div className="form-group">
              <label>Nome do Local *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Descrição Completa *</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Endereço</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Horário</label>
              <input
                type="text"
                name="horario"
                value={formData.horario || ''}
                onChange={handleChange}
              />
            </div>

            <div className="coord-grid">
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Gerenciar Galeria de Imagens</label>
              <div className="galeria-miniaturas">
                {formData.imagens?.map((url, index) => (
                  <div key={`existente-${index}`} className="miniatura-container">
                    <img src={url} alt={`Miniatura ${index + 1}`} className="miniatura-imagem" />
                    <button
                      type="button"
                      className="btn-remover-miniatura"
                      onClick={() => removerImagemExistente(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {novasImagensPreviews.map((url, index) => (
                  <div key={`nova-${index}`} className="miniatura-container">
                    <img src={url} alt={`Nova Prévia ${index + 1}`} className="miniatura-imagem" />
                    <button
                      type="button"
                      className="btn-remover-miniatura"
                      onClick={() => removerNovaImagemPrevia(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="upload-box-container">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={adicionarImagens}
                  id="file-upload-edit"
                  className="input-file-oculto"
                />
                <label htmlFor="file-upload-edit" className="btn-upload-personalizado">
                  📷 Adicionar novas imagens
                </label>
              </div>
            </div>

            <div className="form-botoes-acao">
              <button type="submit" className="btn-acao-moderno btn-salvar">
                💾 Salvar Alterações
              </button>
              <button
                type="button"
                className="btn-acao-moderno btn-cancelar"
                onClick={() => setEditando(false)}
              >
                ✖ Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}