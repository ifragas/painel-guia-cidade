import { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { api } from '../services/api';

const extractFilePath = (url) => {
  if (!url) return null;
  const regex = /o\/(.+?)\?/;
  const match = url.match(regex);
  return match ? decodeURIComponent(match[1]) : null;
};

export default function DetalhesCard({ item, tipo, onVoltar, onEdit, onDelete }) {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({ ...item });
  const [novasImagens, setNovasImagens] = useState([]);
  const [arquivos, setArquivos] = useState([]);

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

  const cleanFileName = (originalName) => {
    return originalName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const uploadImages = async () => {
    if (arquivos.length === 0) return [];
    const urls = [];
    try {
      for (let file of arquivos) {
        if (!file) continue;
        const cleanedName = cleanFileName(file.name);
        const fileName = Date.now() + '_' + cleanedName;
        const storageRef = ref(storage, `imagens/${tipo}/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        urls.push(downloadURL.replace(/\s+/g, '').trim());
      }
      return urls;
    } catch (error) {
      alert('Erro ao fazer upload das imagens: ' + error.message);
      throw error;
    }
  };

  const removerImagem = async (index) => {
    const url = formData.imagens[index];
    if (!url) return;

    if (!window.confirm(`🗑️ Deseja REMOVER esta imagem?`)) return;

    try {
      const filePath = extractFilePath(url);
      if (filePath) {
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      }
      const novas = [...formData.imagens];
      novas.splice(index, 1);
      setFormData({ ...formData, imagens: novas });
    } catch (error) {
      alert('❌ Erro ao remover imagem: ' + error.message);
    }
  };

  const adicionarImagens = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(file => URL.createObjectURL(file));
    setArquivos(files);
    setNovasImagens(urls);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let novasUrls = [];
    try {
      novasUrls = await uploadImages();
    } catch (error) {
      return;
    }

    const todasUrls = [...formData.imagens, ...novasUrls];
    const { id, _id, tipo: _tipo, createdAt, updatedAt, ...dadosLimpos } = formData;

    const payload = {
      nome: dadosLimpos.nome,
      descricao: dadosLimpos.descricao,
      endereco: dadosLimpos.endereco || '',
      horario: dadosLimpos.horario || '',
      imagem: dadosLimpos.imagem || '',
      imagens: todasUrls,
      latitude: dadosLimpos.latitude ? parseFloat(dadosLimpos.latitude) : null,
      longitude: dadosLimpos.longitude ? parseFloat(dadosLimpos.longitude) : null
    };

    try {
      const result = await api.put(`/${tipo}/${item.id}`, payload);
      alert('✅ Item atualizado com sucesso!');
      setEditando(false);
      setNovasImagens([]);
      setArquivos([]);
      onEdit(result);
    } catch (error) {
      alert('❌ Erro ao atualizar: ' + error.message);
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
                  <div key={index} className="miniatura-container">
                    <img src={url} alt={`Miniatura ${index + 1}`} className="miniatura-imagem" />
                    <button
                      type="button"
                      className="btn-remover-miniatura"
                      onClick={() => removerImagem(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {novasImagens.map((url, index) => (
                  <div key={`nova-${index}`} className="miniatura-container">
                    <img src={url} alt={`Nova Imagem ${index + 1}`} className="miniatura-imagem" />
                    <button
                      type="button"
                      className="btn-remover-miniatura"
                      onClick={() => {
                        setNovasImagens(prev => prev.filter((_, i) => i !== index));
                        setArquivos(prev => prev.filter((_, i) => i !== index));
                      }}
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