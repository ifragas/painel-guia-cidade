import React, { useState, useRef, useEffect } from 'react';
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
    if (arquivos.length === 0) {
      console.log('⚠️ Nenhuma imagem selecionada');
      return [];
    }

    const urls = [];

    try {
      for (let file of arquivos) {
        if (!file) continue;

        const cleanedName = cleanFileName(file.name);
        const fileName = Date.now() + '_' + cleanedName;
        const storageRef = ref(storage, `imagens/${tipo}/${fileName}`);

        console.log('📤 Enviando:', file.name, '→', fileName);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const cleanedURL = downloadURL.replace(/\s+/g, '').trim();
        urls.push(cleanedURL);
        console.log('✅ URL gerada:', cleanedURL);
      }

      return urls;
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      alert('Erro ao fazer upload das imagens: ' + error.message);
      throw error;
    }
  };

  const removerImagem = async (index) => {
    const url = formData.imagens[index];
    if (!url) return;

    if (!window.confirm(`🗑️ Tem certeza que deseja REMOVER esta imagem?`)) return;
    if (!window.confirm(`⚠️ Esta ação NÃO pode ser desfeita. Confirmar remoção de imagem?`)) return;

    try {
      const filePath = extractFilePath(url);
      if (filePath) {
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
        console.log('✅ Imagem excluída do Storage:', filePath);
      }

      const novas = [...formData.imagens];
      novas.splice(index, 1);
      setFormData({ ...formData, imagens: novas });

      alert('✅ Imagem removida com sucesso!');
    } catch (error) {
      alert('❌ Erro ao remover imagem: ' + error.message);
      console.error('Erro:', error);
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

    // Removemos campos internos e extras que o Joi rejeita no body
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

    console.log('📦 Payload limpo enviado:', payload);

    try {
      const result = await api.put(`/${tipo}/${item.id}`, payload);

      alert('✅ Item atualizado com sucesso!');
      setEditando(false);
      setNovasImagens([]);
      setArquivos([]);
      onEdit(result);
    } catch (error) {
      alert('❌ Erro ao atualizar: ' + error.message);
      console.error('Erro na API:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`🗑️ Tem certeza que deseja EXCLUIR "${item.nome}"?`)) return;
    if (!window.confirm(`⚠️ Esta ação NÃO pode ser desfeita. Confirmar exclusão de "${item.nome}"?`)) return;

    try {
      // Usando o serviço centralizado api.delete
      await api.delete(`/${tipo}/${item.id}`);

      alert('✅ Item excluído com sucesso!');
      onDelete(item.id);
      onVoltar();
    } catch (error) {
      alert('❌ Erro ao excluir: ' + error.message);
      console.error('Erro na API:', error);
    }
  };

  return (
    <div className="detalhes-container">
      <button className="btn-voltar" onClick={onVoltar}>
        ⬅️ Voltar
      </button>

      <h2>📍 {item.nome}</h2>

      {!editando ? (
        <>
          {imagens.length > 0 ? (
            <div className="carousel-container">
              <button className="carousel-btn esquerda" onClick={imagemAnterior}>
                ‹
              </button>

              <img
                src={imagemAtual}
                alt={item.nome}
                className="carousel-imagem"
                onError={(e) => {
                  e.target.src = '/placeholder.jpg';
                }}
              />

              <button className="carousel-btn direita" onClick={proximaImagem}>
                ›
              </button>

              <div className="carousel-indicadores">
                {imagens.map((_, index) => (
                  <span
                    key={index}
                    className={`indicador ${index === indiceImagem ? 'ativo' : ''}`}
                    onClick={() => pularParaImagem(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <img
              src={item.imagem?.replace(/\s+/g, '').trim() || '/placeholder.jpg'}
              alt={item.nome}
              className="detalhes-imagem"
              onError={(e) => {
                e.target.src = '/placeholder.jpg';
              }}
            />
          )}

          <div className="detalhes-info">
            <p><strong>📌 Tipo:</strong> {item.tipo}</p>
            <p><strong>📝 Descrição:</strong> {item.descricao}</p>
            {item.endereco && <p><strong>🏠 Endereço:</strong> {item.endereco}</p>}
            {item.horario && <p><strong>🕒 Horário:</strong> {item.horario}</p>}
            {item.latitude && item.longitude && (
              <p><strong>📍 Coordenadas:</strong> {item.latitude}, {item.longitude}</p>
            )}
          </div>

          <div className="detalhes-botoes">
            <button className="btn-editar" onClick={() => setEditando(true)}>
              ✏️ Editar
            </button>
            <button className="btn-excluir" onClick={handleDelete}>
              🗑️ Excluir
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="form-edicao">
          <div className="form-group">
            <label>Nome *</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Descrição *</label>
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
              placeholder="Ex: Segunda a Sexta, 8h às 18h"
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
                placeholder="-23.5505"
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude || ''}
                onChange={handleChange}
                placeholder="-46.6333"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Galeria de Imagens</label>
            <div className="galeria-miniaturas">
              {formData.imagens?.map((url, index) => (
                <div key={index} className="miniatura-container">
                  <img
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    className="miniatura-imagem"
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                  <button
                    type="button"
                    className="btn-remover-miniatura"
                    onClick={() => removerImagem(index)}
                  >
                    ✖
                  </button>
                </div>
              ))}

              {novasImagens.map((url, index) => (
                <div key={`nova-${index}`} className="miniatura-container">
                  <img
                    src={url}
                    alt={`Nova Imagem ${index + 1}`}
                    className="miniatura-imagem"
                  />
                  <button
                    type="button"
                    className="btn-remover-miniatura"
                    onClick={() => {
                      setNovasImagens(prev => prev.filter((_, i) => i !== index));
                      setArquivos(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Adicionar mais imagens</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={adicionarImagens}
              />
            </div>
          </div>

          <div className="form-botoes">
            <button type="submit" className="btn-salvar">
              💾 Salvar Alterações
            </button>
            <button
              type="button"
              className="btn-cancelar"
              onClick={() => setEditando(false)}
            >
              ❌ Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}