# 🏢 FF Tech Lab - Painel Administrativo Multi-Tenant

Painel de controle administrativo moderno, responsivo e seguro para gestão do ecossistema de turismo digital (Guia da Cidade / Smart Turismo). Evoluído de uma aplicação de cidade única para uma **arquitetura SaaS Multi-Tenant**, adaptando-se dinamicamente às permissões do usuário logado.

Desenvolvido com **React**, **Vite** e **Tailwind CSS**, este painel conecta-se de forma segura a uma API RESTful (Node.js/Express) hospedada no Render, utilizando o **Firebase** para autenticação e armazenamento.

---

## 🚀 Demonstração & Links

* **Aplicação Web (Vercel):** `https://guiadacidade.vercel.app` 
* **API REST (Render):** `https://turismo-api-vv62.onrender.com/api`

---

## ✨ Funcionalidades Principais

### 🔐 Segurança e Controle de Acesso (RBAC)
* **Autenticação Robusta:** Login com validação JWT via Firebase Auth e persistência de sessão segura.
* **Interface Dinâmica por Role:** A sidebar e as telas disponíveis se adaptam automaticamente ao nível de acesso do usuário (`super_admin`, `city_admin` ou `editor`).
* **Injeção Segura de Tenant:** O `cidadeId` é extraído do token JWT e injetado automaticamente em todos os formulários, impedindo que um administrador cadastre ou edite dados de uma cidade que não seja a sua.

### 📂 Gestão de Conteúdo (CRUD Completo)
* **Categorias:** Pontos Turísticos, Restaurantes, Acomodações e Serviços Essenciais.
* **Formulários Inteligentes:** Suporte a upload de múltiplas imagens, coordenadas geográficas, horários de funcionamento, redes sociais e WhatsApp.
* **Visualização em Grade:** Listagem organizada em cartões (*cards*) com filtros e atualização em tempo real.

### 🏗️ Módulos de Infraestrutura (Exclusivo para Super Admin)
* **Gestão de Cidades:** Cadastro e configuração de novos municípios (slug, cores primárias/secundárias, flags de app próprio e Smart Turismo).
* **Gestão de Usuários:** Criação, edição de permissões e vinculação de administradores a cidades específicas.

### 🛡️ Resiliência e Tratamento de Erros
* **Cliente API Blindado:** O serviço de rede detecta e trata respostas não-JSON (ex: erros 500 em HTML do servidor), prevenindo crashes silenciosos na interface.

---

## 🛠️ Tecnologias Utilizadas

* **[React 18](https://react.dev/):** Biblioteca principal para construção da interface com Hooks e Context API.
* **[Vite](https://vitejs.dev/):** Ferramenta de build e desenvolvimento ultra-rápida.
* **[Tailwind CSS](https://tailwindcss.com/):** Estilização utility-first para um design moderno, limpo e totalmente responsivo.
* **[Lucide React](https://lucide.dev/):** Biblioteca de ícones leves e consistentes.
* **Fetch API:** Camada de serviço de rede customizada com suporte nativo a `FormData`, injeção automática de tokens `Bearer` e tratamento robusto de erros.

---

## 📦 Estrutura do Projeto

```text
src/
├── components/          # Componentes reutilizáveis da aplicação
│   ├── Layout.jsx       # Estrutura principal (Sidebar + Header + Main)
│   ├── Sidebar.jsx      # Menu lateral dinâmico baseado na role do usuário
│   ├── CadastroForm.jsx # Formulário de criação de locais com injeção de cidadeId
│   ├── EditarCardForm.jsx
│   ├── ListaCards.jsx   # Grade de visualização de cartões
│   ├── CidadesScreen.jsx# Tela de gestão de cidades (Super Admin)
│   └── UsuariosScreen.jsx# Tela de gestão de usuários (Super Admin)
├── context/
│   └── AuthContext.jsx  # Gerenciamento global de estado de autenticação
├── pages/
│   └── DashboardScreen.jsx # Roteamento por estado das telas principais
├── services/
│   └── api.js           # Cliente HTTP centralizado com tratamento de erros robusto
├── utils/
│   └── getUserInfo.js   # Decodificação segura do JWT para extrair role e cidadeId
├── App.jsx              # Ponto de entrada e provedor de contexto
└── main.jsx             # Renderização do React no DOM

🔒 Notas de Segurança e Arquitetura
Padrão Gateway: O frontend nunca escreve diretamente no banco de dados. Todas as mutações passam pela API, que valida as Custom Claims do token antes de permitir a operação.
Defesa em Profundidade: Mesmo que a UI oculte botões de usuários sem permissão, o backend possui middleware requireRole que bloqueia qualquer tentativa de acesso direto a rotas de administração.
Zero Credenciais no Código: Nenhuma chave de API, senha ou token de serviço está hardcoded no repositório.