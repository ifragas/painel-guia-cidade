import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import api from '../services/api'; // 👈 Importe o serviço centralizado

export default function CadastroForm() {
  const [tipo, setTipo] = useState('pontos-turisticos');
  const [dados, setDados] = useState({
    nome: '',
    descricao: '',
    endereco: '',
    horario: '',
    latitude: '',
    longitude: ''
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setDados({ ...dados, [e.target.name]: e.target.value });
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
    if (files.length === 0) {
      console.log('⚠️ Nenhuma imagem selecionada');
      return [];
    }

    setUploading(true);
    const urls = [];

    try {
      for (let file of files) {
        if (!file) continue;

        const cleanedName = cleanFileName(file.name);
        const fileName = Date.now() + '_' + cleanedName;
        const storageRef = ref(storage, `imagens/${tipo}/${fileName}`);

        console.log('📤 Enviando:', file.name, '→', fileName);
        await uploadBytes(storageRef, file);

        let downloadURL = await getDownloadURL(storageRef);
        urls.push(downloadURL);
        console.log('✅ URL gerada:', downloadURL);
      }

      setUploading(false);
      return urls;
    } catch (error) {
      setUploading(false);
      console.error('❌ Erro no upload:', error);
      alert('Erro ao fazer upload das imagens: ' + error.message);
      throw error;
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();

    setUploading(true);
    const formData = new FormData();
    
    // Adiciona os campos de texto
    formData.append('nome', dados.nome);
    formData.append('descricao', dados.descricao);
    formData.append('endereco', dados.endereco);
    formData.append('horario', dados.horario);
    formData.append('latitude', dados.latitude);
    formData.append('longitude', dados.longitude);

    // Adiciona os ficheiros selecionados
    files.forEach((file) => {
      formData.append('imagens', file); // 'imagens' deve coincidir com o upload.array('imagens') do backend
    });

    try {
      // Envia diretamente para o nosso serviço centralizado api.js
      // Nota: o axios ajusta automaticamente o Content-Type para multipart/form-data ao receber um FormData
      const result = await api.post(`/${tipo}`, formData);

      alert('✅ Cadastrado com sucesso!');
      setDados({
        nome: '',
        descricao: '',
        endereco: '',
        horario: '',
        latitude: '',
        longitude: ''
      });
      setFiles([]);
      setUploading(false);
    } catch (error) {
      setUploading(false);
      alert('❌ Erro: ' + (error.response?.data?.error || error.message));
      console.error('Erro na API:', error);
    }
  };

  return (
    <div className="form-container">
      <h2>➕ Cadastrar Novo Local</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="pontos-turisticos">Ponto Turístico</option>
            <option value="restaurantes">Restaurante</option>
            <option value="acomodacoes">Acomodação</option>
          </select>
        </div>

        <div className="form-group">
          <label>Nome *</label>
          <input
            type="text"
            name="nome"
            value={dados.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Descrição *</label>
          <textarea
            name="descricao"
            value={dados.descricao}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>

        <div className="form-group">
          <label>Endereço</label>
          <input
            type="text"
            name="endereco"
            value={dados.endereco}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Horário</label>
          <input
            type="text"
            name="horario"
            value={dados.horario}
            onChange={handleChange}
            placeholder="Ex: Segunda a Sexta, 8h às 18h"
          />
        </div>

        <div className="form-group">
          <label>Fotos (Upload múltiplo)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
        </div>

        {files.length > 0 && (
          <div style={{ margin: '1rem 0' }}>
            <p>📎 {files.length} imagem(ns) selecionada(s)</p>
          </div>
        )}

        {uploading && (
          <p style={{ color: '#0066cc', fontWeight: '500' }}>
            📤 Enviando imagens...
          </p>
        )}

        <div className="coord-grid">
          <div className="form-group">
            <label>Latitude</label>
            <input
              type="text"
              name="latitude"
              value={dados.latitude}
              onChange={handleChange}
              placeholder="-23.5505"
            />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input
              type="text"
              name="longitude"
              value={dados.longitude}
              onChange={handleChange}
              placeholder="-46.6333"
            />
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={uploading}>
          {uploading ? 'Enviando...' : '🚀 Cadastrar'}
        </button>
      </form>
    </div>
  );
}