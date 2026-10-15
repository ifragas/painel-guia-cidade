# 🏨 Guia da Cidade — Painel Administrativo Web

Um painel de controle administrativo minimalista, moderno e responsivo (estilo e-commerce/SaaS) para gestão de conteúdos turísticos locais (Pontos Turísticos, Restaurantes e Acomodações).

Desenvolvido com **React**, **Vite** e estilização customizada de alta performance, este painel conecta-se de forma segura a uma API RESTful (Node.js/Express) hospedada no Render e integrada com serviços do **Firebase**.

---

## 🚀 Demonstração & Links

* **Aplicação Web (Vercel):** `https://painel-guia-cidade.vercel.app` 
* **API REST (Render):** `https://turismo-api-vv62.onrender.com/api`

---

## ✨ Funcionalidades Principais

* **🔐 Autenticação Segura:** Login administrativo com validação JWT via Firebase Auth e persistência de sessão.
* **🎨 Design Minimalista & Slim:** Interface de largura total (*full-width*) limpa, com cabeçalho fino de linha única, carrossel de imagens e suporte a layouts responsivos.
* **📂 Gestão Completa (CRUD):**
  * **Cadastrar:** Formulário intuitivo para upload de imagens, coordenadas geográficas, descrição e dados de contato.
  * **Listar & Filtrar:** Visualização em grade de cartões (*cards*) categorizados por *Pontos Turísticos*, *Restaurantes* e *Acomodações*.
  * **Editar & Excluir:** Gestão em tempo real de locais com atualização e remoção de imagens em miniatura.
* **📷 Upload de Múltiplas Imagens:** Suporte para envio de arquivos diretamente para o serviço de armazenamento na nuvem (Firebase Storage).

---

## 🛠️ Tecnologias Utilizadas

### Frontend Web
* **[React 18](https://react.dev/):** Biblioteca principal para construção da interface.
* **[Vite](https://vitejs.dev/):** Ferramenta de build ultra-rápida.
* **CSS3 Customizado:** Design moderno, minimalista e totalmente responsivo, sem dependência de bibliotecas de UI pesadas.
* **Fetch API:** Camada de serviço de rede otimizada com suporte a envio de `FormData` e injeção automática de tokens JWT (`Bearer Token`).

---

## 📦 Estrutura do Projeto

```text
src/
├── components/          # Componentes reutilizáveis da aplicação
│   ├── Login.jsx        # Formulário de login administrativo
│   ├── CadastroForm.jsx # Formulário de criação/edição de locais
│   ├── ListaCards.jsx   # Grade de visualização de cartões
│   └── DetalhesCard.jsx # Carrossel e visualização detalhada
├── services/
│   └── api.js           # Cliente HTTP centralizado (Altera entre Local e Render)
├── App.jsx              # Estrutura do layout (Header Slim, Main e Footer)
├── App.css              # Estilos globais e componentes do painel
├── index.css            # Reset global e configurações base
└── main.jsx             # Ponto de entrada da aplicação React