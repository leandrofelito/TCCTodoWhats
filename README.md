# TodoWhats MVP - Projeto TCC

## 📱 Sobre o Projeto

TodoWhats é um aplicativo de gerenciamento de tarefas que integra WhatsApp, processamento de linguagem natural (Wit.ai) e notificações push (Firebase Cloud Messaging). O projeto foi desenvolvido como MVP para apresentação de TCC.

## 🎯 Objetivo

Criar um sistema completo que permita:
- Gerenciar tarefas localmente no app mobile (SQLite)
- Sincronizar tarefas com o backend
- Criar tarefas via comandos de voz (Wit.ai)
- Criar tarefas via comandos de texto no WhatsApp
- Receber notificações push sobre tarefas
- Enviar tarefas para WhatsApp

## 🏗️ Arquitetura

O projeto é dividido em duas partes principais:

### Frontend Mobile (React Native + Expo)
- **Tecnologia**: React Native com Expo
- **Banco de Dados**: SQLite local (expo-sqlite)
- **Navegação**: React Navigation
- **Notificações**: Expo Notifications + FCM
- **Voz**: Expo Speech + Expo AV

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Banco de Dados**: JSON file (pode migrar para SQLite/PostgreSQL)
- **Integrações**:
  - Wit.ai (NLP)
  - Firebase Cloud Messaging (Push Notifications)
  - WhatsApp API (Ultramsg/CallMeBot)

## 📁 Estrutura do Projeto

```
todowhats/
├── mobile/              # App React Native
│   ├── src/
│   │   ├── database/   # SQLite e CRUD
│   │   ├── screens/    # Telas do app
│   │   ├── components/ # Componentes reutilizáveis
│   │   ├── services/   # Serviços (API, FCM, Sync)
│   │   └── utils/      # Utilitários
│   └── App.js          # Entry point
│
└── backend/            # Backend Node.js
    ├── src/
    │   ├── routes/     # Rotas da API
    │   ├── services/   # Serviços (WhatsApp, FCM, Wit.ai)
    │   ├── models/     # Modelos de dados
    │   └── config/     # Configurações
    └── server.js       # Servidor Express
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- Expo CLI instalado globalmente: `npm install -g expo-cli`
- Contas gratuitas configuradas:
  - Wit.ai (https://wit.ai)
  - Firebase (https://firebase.google.com)
  - Ultramsg ou CallMeBot (para WhatsApp)

### Configuração do Backend

1. Entre na pasta `backend`:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Copie o arquivo .env.example para .env
copy .env.example .env
# (No Linux/Mac: cp .env.example .env)
```

4. Edite o arquivo `.env` com suas credenciais:
   - Token do Wit.ai
   - Chave FCM do Firebase
   - Credenciais da API WhatsApp

5. Inicie o servidor:
```bash
npm start
# ou para desenvolvimento com auto-reload:
npm run dev
```

O backend estará rodando em `http://localhost:3000`

### Configuração do Mobile

1. Entre na pasta `mobile`:
```bash
cd mobile
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a URL do backend em `src/services/api.js`:
   - Desenvolvimento: `http://localhost:3000`
   - Produção: URL do seu servidor

4. Inicie o app:
```bash
npm start
```

5. Escaneie o QR code com o app Expo Go no seu celular ou pressione:
   - `a` para Android
   - `i` para iOS
   - `w` para Web

## 📚 Tecnologias Utilizadas

### Mobile
- **React Native**: Framework para desenvolvimento mobile
- **Expo**: Plataforma e ferramentas para React Native
- **SQLite**: Banco de dados local
- **React Navigation**: Navegação entre telas
- **Axios**: Cliente HTTP para requisições

### Backend
- **Node.js**: Runtime JavaScript
- **Express**: Framework web
- **Wit.ai**: Processamento de linguagem natural
- **Firebase Admin SDK**: Envio de notificações push
- **Axios**: Cliente HTTP para APIs externas

## 🔄 Fluxo de Dados

1. **Criação de Tarefa no App**:
   - Usuário cria tarefa → SQLite local → Sincroniza com backend → Backend salva

2. **Criação via WhatsApp**:
   - Mensagem WhatsApp → Webhook backend → Wit.ai interpreta → Backend cria tarefa → FCM notifica app → App sincroniza

3. **Criação via Voz**:
   - Usuário grava áudio → App envia para backend → Backend envia para Wit.ai → Wit.ai retorna texto → Backend cria tarefa → App sincroniza

4. **Notificações**:
   - Backend envia notificação FCM → App recebe → Exibe notificação local

## 📝 Endpoints da API

### Tarefas
- `GET /api/tasks` - Listar todas as tarefas
- `POST /api/tasks` - Criar nova tarefa
- `GET /api/tasks/:id` - Obter tarefa específica
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Deletar tarefa
- `POST /api/tasks/sync` - Sincronizar tarefas

### WhatsApp
- `POST /api/whatsapp/send` - Enviar mensagem via WhatsApp
- `POST /api/whatsapp/webhook` - Webhook para receber mensagens

### Wit.ai
- `POST /api/wit/interpret` - Interpretar texto/comando
- `POST /api/wit/audio` - Processar áudio

### FCM
- `POST /api/fcm/register` - Registrar token FCM
- `POST /api/fcm/send` - Enviar notificação

## 🎓 Explicações Técnicas para TCC

### Por que SQLite no Mobile?
SQLite é um banco de dados embarcado que permite armazenamento local rápido e confiável. É ideal para MVP porque:
- Funciona offline
- Não requer servidor de banco de dados
- Performance excelente para dados locais
- Fácil migração futura se necessário

### Por que JSON no Backend?
Para MVP, usar arquivo JSON como armazenamento reduz complexidade:
- Não requer configuração de banco de dados
- Fácil de debugar e visualizar dados
- Pode migrar facilmente para PostgreSQL/MySQL depois
- Suficiente para demonstração

### Por que APIs Gratuitas?
- **Wit.ai**: Oferece plano gratuito com limite suficiente para MVP
- **FCM**: Gratuito para sempre
- **Ultramsg/CallMeBot**: Oferecem trial gratuito ou planos básicos gratuitos

### Arquitetura de Sincronização
Implementamos sincronização bidirecional com estratégia "last-write-wins":
- Cada tarefa tem timestamp de criação e atualização
- Em caso de conflito, a última escrita vence
- Sync manual (pull-to-refresh) e automático (a cada 30s)

## ⚠️ Limitações do MVP

1. **APIs Gratuitas**: Podem ter limites de requisições
2. **WhatsApp**: APIs gratuitas podem ter restrições de uso
3. **Escalabilidade**: JSON file não é ideal para produção em larga escala
4. **Segurança**: MVP focado em funcionalidade, não em segurança avançada

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos (TCC).

## 👨‍💻 Desenvolvimento

Projeto desenvolvido seguindo boas práticas de desenvolvimento:
- Código modular e organizado
- Comentários explicativos
- Separação de responsabilidades
- Tratamento de erros
- Validação de dados

