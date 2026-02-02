# 📱 TodoWhats

<div align="center">

![TCC](https://img.shields.io/badge/TCC-Engenharia%20de%20Software-blue)
![UNINTER](https://img.shields.io/badge/UNINTER-Centro%20Universitário-orange)
![Status](https://img.shields.io/badge/Status-MVP-green)
![Node](https://img.shields.io/badge/Node.js-18%2B-brightgreen)
![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)
![License](https://img.shields.io/badge/License-Acadêmico-lightgrey)

**Sistema de Gerenciamento de Tarefas Integrado com WhatsApp e Processamento de Linguagem Natural**

*Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC) em Engenharia de Software - UNINTER*

[Funcionalidades](#-funcionalidades) • [Tecnologias](#-tecnologias-utilizadas) • [Instalação](#-instalação-e-configuração) • [Documentação](#-documentação-adicional)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Como Executar](#-como-executar)
- [Como Usar](#-como-usar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API - Endpoints](#-api---endpoints)
- [Fluxo de Dados](#-fluxo-de-dados)
- [Decisões Técnicas](#-decisões-técnicas)
- [Limitações do MVP](#-limitações-do-mvp)
- [Documentação Adicional](#-documentação-adicional)
- [Licença](#-licença)
- [Autor e Agradecimentos](#-autor-e-agradecimentos)

---

## 🎓 Sobre o Projeto

**TodoWhats** é um sistema completo de gerenciamento de tarefas que integra múltiplas tecnologias modernas para oferecer uma experiência única ao usuário. O projeto foi desenvolvido como **MVP (Minimum Viable Product)** para apresentação como **Trabalho de Conclusão de Curso (TCC)** em **Engenharia de Software** no **Centro Universitário Internacional UNINTER**.

### Objetivo Acadêmico

Este projeto demonstra a aplicação prática de conceitos de engenharia de software, incluindo:
- Arquitetura de sistemas distribuídos
- Integração de APIs externas
- Processamento de Linguagem Natural (NLP)
- Desenvolvimento mobile multiplataforma
- Sincronização de dados bidirecional
- Notificações push em tempo real

### O Problema que Resolve

O TodoWhats permite que usuários gerenciem suas tarefas através de múltiplas interfaces:
- **Aplicativo Mobile**: Interface nativa para gerenciamento completo
- **WhatsApp**: Criação de tarefas via mensagens de texto
- **Comandos de Voz**: Criação de tarefas através de processamento de voz

### Diferenciais

- ✅ **Integração WhatsApp**: Crie tarefas diretamente pelo WhatsApp usando comandos em linguagem natural
- ✅ **Processamento de Voz**: Utilize comandos de voz para criar tarefas rapidamente
- ✅ **Sincronização Bidirecional**: Dados sincronizados entre app e backend em tempo real
- ✅ **Funcionamento Offline**: Armazenamento local permite uso sem conexão com internet
- ✅ **Notificações Push**: Receba notificações sobre suas tarefas em tempo real

---

## ✨ Funcionalidades

### 📱 Aplicativo Mobile

- ✅ **CRUD Completo de Tarefas**: Criar, visualizar, editar e excluir tarefas
- ✅ **Armazenamento Local**: Banco de dados SQLite para funcionamento offline
- ✅ **Sincronização Automática**: Sincronização a cada 30 segundos + sincronização manual (pull-to-refresh)
- ✅ **Notificações Locais**: Agendamento de lembretes para tarefas com data/hora
- ✅ **Interface Intuitiva**: Design limpo e fácil de usar

### 💬 Integração WhatsApp

- ✅ **Criação via Mensagem**: Envie mensagens no WhatsApp para criar tarefas automaticamente
- ✅ **Processamento de Linguagem Natural**: Sistema interpreta comandos em português natural
- ✅ **Respostas Automáticas**: Receba confirmações e listas de tarefas via WhatsApp
- ✅ **Suporte a Datas e Horários**: Crie tarefas com lembretes agendados

### 🎤 Processamento de Voz

- ✅ **Gravação de Áudio**: Grave comandos de voz diretamente no app
- ✅ **Processamento com Wit.ai**: Conversão de voz em texto e interpretação de comandos
- ✅ **Criação Automática**: Tarefas criadas automaticamente a partir dos comandos de voz

### 🔔 Notificações Push

- ✅ **Firebase Cloud Messaging**: Notificações push em tempo real
- ✅ **Notificações de Criação**: Receba notificações quando tarefas são criadas via WhatsApp
- ✅ **Lembretes Agendados**: Notificações locais para tarefas com data/hora

---

## 🛠️ Tecnologias Utilizadas

### Frontend Mobile

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React Native** | 0.81.5 | Framework para desenvolvimento mobile multiplataforma |
| **Expo** | ^54.0.0 | Plataforma e ferramentas para React Native |
| **React Navigation** | ^6.4.1 | Navegação entre telas |
| **Expo SQLite** | ~16.0.10 | Banco de dados local embarcado |
| **Expo Notifications** | ~0.32.15 | Gerenciamento de notificações push |
| **Expo AV** | ~16.0.8 | Gravação e reprodução de áudio |
| **Expo Speech** | ~14.0.8 | Síntese de voz |
| **Axios** | ^1.6.0 | Cliente HTTP para requisições à API |

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express.js** | ^4.18.2 | Framework web minimalista |
| **Wit.ai SDK** | ^6.0.1 | Processamento de linguagem natural |
| **Firebase Admin SDK** | ^11.11.0 | Envio de notificações push |
| **Axios** | ^1.6.0 | Cliente HTTP para APIs externas |
| **Multer** | ^1.4.5 | Upload de arquivos (áudio) |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing |
| **dotenv** | ^16.3.1 | Gerenciamento de variáveis de ambiente |

### Serviços Externos

| Serviço | Descrição | Documentação |
|---------|-----------|--------------|
| **Wit.ai** | Processamento de linguagem natural (NLP) | [wit.ai/docs](https://wit.ai/docs) |
| **Firebase Cloud Messaging** | Notificações push | [firebase.google.com/docs](https://firebase.google.com/docs) |
| **Ultramsg** | Gateway para WhatsApp API | [ultramsg.com](https://ultramsg.com) |
| **CallMeBot** | Alternativa para WhatsApp API | [callmebot.com](https://www.callmebot.com) |

---

## 🏗️ Arquitetura do Sistema

O sistema é composto por três camadas principais:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                    │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  App Mobile      │         │    WhatsApp       │         │
│  │  (React Native)  │         │   (Interface)    │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                             │                    │
└───────────┼─────────────────────────────┼────────────────────┘
            │                             │
            │                             │
┌───────────┼─────────────────────────────┼────────────────────┐
│           │                             │                    │
│  ┌────────▼─────────────────────────────▼─────────┐         │
│  │         CAMADA DE APLICAÇÃO (Backend)          │         │
│  │                                                 │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │         │
│  │  │   API    │  │  Wit.ai  │  │   FCM    │     │         │
│  │  │  Routes  │  │ Service  │  │ Service  │     │         │
│  │  └──────────┘  └──────────┘  └──────────┘     │         │
│  │                                                 │         │
│  │  ┌──────────────────────────────────────┐      │         │
│  │  │      Armazenamento (JSON File)      │      │         │
│  │  └──────────────────────────────────────┘      │         │
│  └─────────────────────────────────────────────────┘         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
            │
            │
┌───────────▼──────────────────────────────────────────────────┐
│              CAMADA DE SERVIÇOS EXTERNOS                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Wit.ai     │  │   Firebase    │  │   Ultramsg   │     │
│  │    (NLP)     │  │     (FCM)     │  │  (WhatsApp)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Componentes Principais

#### 📱 Frontend Mobile (React Native + Expo)
- **Telas**: Home, AddTask, EditTask, Settings
- **Componentes**: TaskItem, VoiceInput
- **Serviços**: API Service, Sync Service, FCM Service
- **Armazenamento**: SQLite local (expo-sqlite)

#### 🖥️ Backend (Node.js + Express)
- **Rotas**: `/api/tasks`, `/api/whatsapp`, `/api/fcm`, `/api/wit`
- **Serviços**: WhatsApp Service, Wit.ai Service, FCM Service
- **Armazenamento**: Arquivo JSON (tasks.json)
- **Modelos**: Task Model (estrutura de dados)

#### ☁️ Serviços Externos
- **Wit.ai**: Processamento de linguagem natural
- **Firebase FCM**: Notificações push
- **Ultramsg/CallMeBot**: Gateway WhatsApp

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18 ou superior ([Download](https://nodejs.org/))
- **npm** ou **yarn** (vem com Node.js)
- **Expo CLI** instalado globalmente:
  ```bash
  npm install -g expo-cli
  ```
- **Git** (opcional, para clonar o repositório)
- **Conta no Expo** ([expo.dev](https://expo.dev))
- **Contas nos serviços externos**:
  - [Wit.ai](https://wit.ai) (gratuito)
  - [Firebase](https://firebase.google.com) (gratuito)
  - [Ultramsg](https://ultramsg.com) ou [CallMeBot](https://www.callmebot.com) (trial gratuito)

---

## 🚀 Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/todowhats.git
cd todowhats
```

### 2. Configuração do Backend

#### 2.1. Instalar Dependências

```bash
cd backend
npm install
```

#### 2.2. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
   ```bash
   # Windows PowerShell
   copy env.example.txt .env
   
   # Linux/Mac
   cp env.example.txt .env
   ```

2. Edite o arquivo `.env` com suas credenciais:

   ```env
   # Porta do servidor
   PORT=3000

   # Wit.ai - Token de acesso
   WIT_AI_TOKEN=seu_token_wit_ai_aqui

   # Firebase Cloud Messaging - Server Key
   FCM_SERVER_KEY=sua_chave_fcm_aqui

   # WhatsApp - Ultramsg
   WHATSAPP_API_KEY=sua_api_key_aqui
   WHATSAPP_INSTANCE_ID=seu_instance_id_aqui

   # Ou WhatsApp - CallMeBot (alternativa)
   # CALLMEBOT_API_KEY=sua_chave_aqui
   # CALLMEBOT_PHONE=seu_numero_aqui
   ```

   **Como obter as credenciais:**

   - **Wit.ai Token**: 
     1. Acesse [wit.ai](https://wit.ai)
     2. Crie uma conta gratuita
     3. Crie um novo app
     4. Vá em Settings > API Details
     5. Copie o Server Access Token

   - **Firebase FCM Server Key**:
     1. Acesse [Firebase Console](https://console.firebase.google.com)
     2. Crie um projeto ou selecione existente
     3. Vá em Project Settings > Cloud Messaging
     4. Copie a Server Key

   - **Ultramsg Credentials**:
     1. Acesse [ultramsg.com](https://ultramsg.com)
     2. Crie uma conta (trial gratuito disponível)
     3. Obtenha API Key e Instance ID no dashboard

### 3. Configuração do Mobile

#### 3.1. Instalar Dependências

```bash
cd ../mobile
npm install
```

#### 3.2. Configurar URL da API

Edite o arquivo `mobile/src/utils/constants.js`:

```javascript
export const API_BASE_URL = 'http://SEU_IP_LOCAL:3000';
// Exemplo: 'http://192.168.1.100:3000'
// ⚠️ IMPORTANTE: Use o IP local da sua máquina, não localhost
```

**Como descobrir seu IP local:**

- **Windows**: Execute `ipconfig` no PowerShell e procure por "IPv4"
- **Linux/Mac**: Execute `ifconfig` ou `ip addr`

#### 3.3. Configurar Firebase no Expo

1. Acesse [expo.dev](https://expo.dev) e crie uma conta
2. Crie um novo projeto Expo
3. Copie o `google-services.json` para a raiz do projeto mobile
4. Configure o Project ID no arquivo `mobile/src/services/fcm.js` (se necessário)

---

## ▶️ Como Executar

### Backend

1. Abra um terminal e navegue até a pasta do backend:
   ```bash
   cd backend
   ```

2. Inicie o servidor:
   ```bash
   # Modo produção
   npm start
   
   # Modo desenvolvimento (com auto-reload)
   npm run dev
   ```

3. O servidor estará rodando em `http://localhost:3000`

### Mobile

1. Abra outro terminal e navegue até a pasta do mobile:
   ```bash
   cd mobile
   ```

2. Inicie o Expo:
   ```bash
   npm start
   ```

3. Escaneie o QR Code:
   - **Android**: Abra o app Expo Go e toque em "Scan QR Code"
   - **iOS**: Abra a câmera e escaneie o QR code
   - **Emulador**: Pressione `a` (Android) ou `i` (iOS)
   - **Web**: Pressione `w`

---

## 📖 Como Usar

### Criar Tarefa no App Mobile

1. Abra o aplicativo TodoWhats
2. Toque no botão `+` na tela inicial
3. Preencha:
   - **Título**: Nome da tarefa
   - **Descrição**: Detalhes (opcional)
   - **Status**: Pendente/Concluída
   - **Data/Hora**: Para agendar lembrete (opcional)
4. Toque em "Salvar Tarefa"
5. A tarefa será salva localmente e sincronizada automaticamente

### Criar Tarefa via WhatsApp

1. Envie uma mensagem para o número configurado no Ultramsg/CallMeBot
2. Exemplos de comandos:
   - `Criar tarefa comprar leite`
   - `Adicionar tarefa estudar matemática amanhã às 14h`
   - `Criar tarefa fazer exercícios hoje às 18h`
3. O sistema processará o comando usando Wit.ai
4. Você receberá uma confirmação via WhatsApp
5. O app mobile receberá uma notificação push
6. A tarefa aparecerá no app após sincronização

### Criar Tarefa via Voz

1. No app mobile, vá para a tela de criar tarefa
2. Toque no botão de gravação de voz
3. Fale o comando, por exemplo: "Criar tarefa estudar português"
4. Pare a gravação
5. O áudio será processado e a tarefa criada automaticamente

### Sincronização

- **Automática**: O app sincroniza a cada 30 segundos quando aberto
- **Manual**: Puxe a lista para baixo (pull-to-refresh) na tela Home

---

## 📁 Estrutura do Projeto

```
todowhats/
│
├── 📱 mobile/                    # Aplicativo React Native
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   │   └── TaskItem.js      # Componente de item de tarefa
│   │   ├── database/            # Camada de dados
│   │   │   ├── db.js            # Configuração SQLite
│   │   │   └── tasks.js          # Operações CRUD
│   │   ├── screens/             # Telas do aplicativo
│   │   │   ├── Home.js          # Tela principal (lista de tarefas)
│   │   │   ├── AddTask.js       # Tela de criar tarefa
│   │   │   ├── EditTask.js      # Tela de editar tarefa
│   │   │   └── Settings.js      # Tela de configurações
│   │   ├── services/            # Serviços de integração
│   │   │   ├── api.js           # Cliente HTTP para API
│   │   │   ├── fcm.js           # Gerenciamento de notificações
│   │   │   ├── sync.js          # Sincronização com backend
│   │   │   └── overlayPermission.js  # Permissões de overlay
│   │   └── utils/               # Utilitários
│   │       └── constants.js     # Constantes e configurações
│   ├── assets/                  # Imagens e recursos
│   ├── App.js                   # Componente raiz
│   └── package.json             # Dependências do mobile
│
├── 🖥️ backend/                  # Servidor Node.js
│   ├── src/
│   │   ├── config/              # Configurações
│   │   │   └── database.js      # Configuração de armazenamento
│   │   ├── models/              # Modelos de dados
│   │   │   └── Task.js          # Modelo de tarefa
│   │   ├── routes/              # Rotas da API
│   │   │   ├── tasks.js        # Rotas CRUD de tarefas
│   │   │   ├── whatsapp.js     # Rotas WhatsApp
│   │   │   ├── fcm.js          # Rotas de notificações
│   │   │   └── wit.js          # Rotas de processamento NLP
│   │   ├── services/            # Serviços de negócio
│   │   │   ├── whatsapp.js     # Integração WhatsApp
│   │   │   ├── fcm.js          # Envio de notificações push
│   │   │   ├── wit.js          # Processamento Wit.ai
│   │   │   └── whisper.js      # Processamento de áudio
│   │   └── utils/              # Utilitários
│   │       ├── dateParser.js   # Parser de datas
│   │       └── logger.js       # Sistema de logs
│   ├── data/                    # Armazenamento de dados
│   │   └── tasks.json          # Arquivo JSON com tarefas
│   ├── server.js                # Servidor Express principal
│   ├── env.example.txt         # Exemplo de variáveis de ambiente
│   └── package.json            # Dependências do backend
│
├── 📚 diagramas/                # Diagramas do sistema
│   ├── arquitetura-geral.mmd   # Diagrama Mermaid
│   ├── whatsapp-flow.mmd       # Fluxo WhatsApp
│   └── README.md               # Documentação dos diagramas
│
├── 📄 Documentação
│   ├── APRESENTACAO_TCC.md     # Guia de apresentação
│   ├── DIAGRAMA_BLOCOS_SISTEMA.md  # Diagrama de blocos
│   ├── INSTALACAO.md           # Guia de instalação detalhado
│   ├── GUIA_TESTE_WHATSAPP_SYNC.md  # Guia de testes
│   └── EXECUTAR_EXPO_GO.md     # Guia Expo Go
│
└── README.md                    # Este arquivo
```

---

## 🔌 API - Endpoints

### Tarefas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/tasks` | Listar todas as tarefas |
| `POST` | `/api/tasks` | Criar nova tarefa |
| `GET` | `/api/tasks/:id` | Obter tarefa específica |
| `PUT` | `/api/tasks/:id` | Atualizar tarefa |
| `DELETE` | `/api/tasks/:id` | Deletar tarefa |
| `POST` | `/api/tasks/sync` | Sincronizar tarefas (bidirecional) |

**Exemplo de requisição - Criar tarefa:**

```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "Comprar leite",
  "description": "Comprar leite no supermercado",
  "status": "pending",
  "scheduled_at": "2025-02-03T14:00:00Z"
}
```

### WhatsApp

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/whatsapp/send` | Enviar mensagem via WhatsApp |
| `POST` | `/api/whatsapp/webhook` | Webhook para receber mensagens |

**Exemplo de webhook:**

```bash
POST /api/whatsapp/webhook
Content-Type: application/json

{
  "from": "5511999999999",
  "message": "Criar tarefa estudar matemática",
  "timestamp": "2025-02-02T10:00:00Z"
}
```

### Wit.ai (NLP)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/wit/interpret` | Interpretar texto/comando |
| `POST` | `/api/wit/audio` | Processar áudio |

**Exemplo de interpretação:**

```bash
POST /api/wit/interpret
Content-Type: application/json

{
  "text": "Criar tarefa comprar leite amanhã às 14h"
}
```

### FCM (Notificações)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/fcm/register` | Registrar token FCM do dispositivo |
| `POST` | `/api/fcm/send` | Enviar notificação push |

---

## 🔄 Fluxo de Dados

### 1. Criação de Tarefa no App Mobile

```
Usuário → App Mobile → SQLite Local → Sync Service → Backend API → JSON File
                                                              ↓
                                                      Confirmação → App Mobile
```

### 2. Criação de Tarefa via WhatsApp

```
WhatsApp → Webhook → Backend → Wit.ai (NLP) → Interpretação
                                              ↓
                                    Criação de Tarefa → JSON File
                                              ↓
                                    FCM → Notificação Push → App Mobile
                                              ↓
                                    Resposta → WhatsApp
```

### 3. Criação de Tarefa via Voz

```
Usuário → Gravação de Áudio → App Mobile → Backend → Wit.ai (Áudio)
                                                          ↓
                                                    Processamento NLP
                                                          ↓
                                                    Criação de Tarefa → JSON File
                                                          ↓
                                                    Sync → App Mobile → SQLite
```

### 4. Sincronização Bidirecional

```
App Mobile (SQLite) ←→ Sync Service ←→ Backend API ←→ JSON File
     ↓                      ↓              ↓
  Offline              Last-Write-Wins   Online
```

**Estratégia de Sincronização:**
- **Last-Write-Wins**: Em caso de conflito, a última atualização prevalece
- **Timestamps**: Cada tarefa possui `created_at` e `updated_at`
- **Campo `synced`**: Indica se a tarefa foi sincronizada
- **Frequência**: Automática a cada 30s + manual (pull-to-refresh)

---

## 🎯 Decisões Técnicas

### Por que React Native + Expo?

- ✅ **Multiplataforma**: Um único código para iOS e Android
- ✅ **Desenvolvimento Rápido**: Hot reload e ferramentas integradas
- ✅ **Acesso a APIs Nativas**: Câmera, áudio, notificações sem configuração complexa
- ✅ **Comunidade Ativa**: Grande ecossistema e suporte

### Por que SQLite no Mobile?

- ✅ **Offline First**: Funciona sem conexão com internet
- ✅ **Performance**: Armazenamento local rápido e eficiente
- ✅ **Sem Custos**: Não requer servidor de banco de dados
- ✅ **Padrão da Indústria**: Usado por grandes aplicativos

### Por que JSON no Backend?

- ✅ **Simplicidade**: Não requer configuração de banco de dados
- ✅ **Debugging**: Fácil visualizar e editar dados manualmente
- ✅ **MVP**: Suficiente para demonstração e prototipagem
- ✅ **Migração Fácil**: Pode migrar para PostgreSQL/MySQL depois

### Por que APIs Gratuitas?

- ✅ **Viabilidade**: Mantém o projeto sem custos para TCC
- ✅ **Suficiente**: Planos gratuitos atendem necessidades do MVP
- ✅ **Escalável**: Pode migrar para planos pagos em produção
- ✅ **Demonstração**: Apropriado para apresentação acadêmica

**Serviços Utilizados:**
- **Wit.ai**: Plano gratuito com limite suficiente para MVP
- **Firebase FCM**: Gratuito para sempre
- **Ultramsg/CallMeBot**: Trial gratuito disponível

---

## ⚠️ Limitações do MVP

Este projeto foi desenvolvido como **MVP (Minimum Viable Product)** para fins acadêmicos. As seguintes limitações são conhecidas e intencionais:

1. **Armazenamento Backend**: Arquivo JSON não é ideal para produção em larga escala
2. **APIs Gratuitas**: Podem ter limites de requisições diárias
3. **WhatsApp**: APIs gratuitas podem ter restrições de uso
4. **Segurança**: MVP focado em funcionalidade, não em segurança avançada (autenticação, autorização)
5. **Lembretes via WhatsApp**: Lembretes só são agendados quando o app executa sincronização antes do horário
6. **Escalabilidade**: Sistema não otimizado para múltiplos usuários simultâneos

**Nota**: Estas limitações são apropriadas para um MVP acadêmico. Em produção, seria necessário:
- Migrar para banco de dados relacional (PostgreSQL/MySQL)
- Implementar autenticação e autorização robustas
- Usar APIs pagas para maior confiabilidade
- Implementar cache e otimizações de performance
- Adicionar testes automatizados

---

## 📚 Documentação Adicional

O projeto inclui documentação detalhada em português:

- 📖 [Guia de Instalação Detalhado](INSTALACAO.md)
- 🎓 [Guia de Apresentação para TCC](APRESENTACAO_TCC.md)
- 📊 [Diagrama de Blocos do Sistema](DIAGRAMA_BLOCOS_SISTEMA.md)
- 🔄 [Guia de Teste WhatsApp Sync](GUIA_TESTE_WHATSAPP_SYNC.md)
- 📱 [Como Executar no Expo Go](EXECUTAR_EXPO_GO.md)
- 🏗️ [Diagramas de Arquitetura](diagramas/README.md)

---

## 📄 Licença

Este projeto foi desenvolvido para **fins acadêmicos** como Trabalho de Conclusão de Curso (TCC) em Engenharia de Software no **Centro Universitário Internacional UNINTER**.

O código é fornecido "como está", sem garantias. Sinta-se livre para usar como referência para seus próprios projetos acadêmicos.

---

## 👨‍💻 Autor e Agradecimentos

### Autor

**Desenvolvedor** - Projeto desenvolvido como TCC em Engenharia de Software

### Agradecimentos

- 🎓 **Centro Universitário Internacional UNINTER** - Pela oportunidade de desenvolver este projeto como TCC
- 🤖 **Wit.ai** - Plataforma de processamento de linguagem natural
- 🔥 **Firebase** - Serviço de notificações push (FCM)
- 💬 **Ultramsg/CallMeBot** - Gateway para integração WhatsApp
- 📱 **Expo** - Plataforma para desenvolvimento React Native
- 🌐 **Comunidade Open Source** - Pelas ferramentas e bibliotecas utilizadas

### Tecnologias e Bibliotecas

Este projeto utiliza diversas tecnologias e bibliotecas open source. Agradecemos a todos os desenvolvedores que contribuíram para essas ferramentas.

---

<div align="center">

**Desenvolvido com ❤️ para o TCC em Engenharia de Software - UNINTER**

[⬆ Voltar ao topo](#-todowhats)

</div>
