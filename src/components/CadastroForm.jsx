import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

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

    let imagensURL = [];
    try {
      imagensURL = await uploadImages();
    } catch (error) {
      return;
    }

    if (!Array.isArray(imagensURL)) imagensURL = [];

    const primeiraImagemURL = imagensURL.length > 0 ? imagensURL[0] : null;

    const payload = {
      ...dados,
      imagens: imagensURL,
      imagem: primeiraImagemURL,
      latitude: dados.latitude ? parseFloat(dados.latitude) : null,
      longitude: dados.longitude ? parseFloat(dados.longitude) : null,
      tipo
    };

    console.log('📦 Dados enviados para a API:', payload);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`https://turismo-api-vv62.onrender.com/api/${tipo}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
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
      } else {
        alert('❌ Erro: ' + (result.error || 'Verifique os dados'));
        console.error('Erro na API:', result);
      }
    } catch (error) {
      alert('❌ Erro de conexão. Confira se o servidor está rodando.');
      console.error('Erro de rede:', error);
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