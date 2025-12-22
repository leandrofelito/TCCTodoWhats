# Guia de Apresentação - TodoWhats MVP para TCC

Este documento fornece explicações técnicas e pontos de apresentação para o TCC.

## 🎯 Objetivo do Projeto

TodoWhats é um sistema de gerenciamento de tarefas que integra múltiplas tecnologias para oferecer uma experiência completa ao usuário, permitindo criar e gerenciar tarefas através de diferentes interfaces: aplicativo mobile, comandos de voz e mensagens de WhatsApp.

## 🏗️ Arquitetura do Sistema

### Visão Geral

O sistema é dividido em duas partes principais:

1. **Frontend Mobile (React Native + Expo)**
   - Interface do usuário
   - Armazenamento local (SQLite)
   - Sincronização com backend

2. **Backend (Node.js + Express)**
   - API REST
   - Integração com serviços externos
   - Processamento de comandos

### Fluxo de Dados

```
┌─────────────┐
│   Mobile    │
│  (SQLite)   │
└──────┬──────┘
       │ Sync
       ▼
┌─────────────┐     ┌──────────────┐
│   Backend    │────▶│   Wit.ai     │
│   (Express)  │     │    (NLP)     │
└──────┬───────┘     └──────────────┘
       │
       ├──▶ WhatsApp API
       │
       └──▶ Firebase FCM
```

## 🔧 Decisões Técnicas

### Por que React Native + Expo?

**Vantagens:**
- Desenvolvimento multiplataforma (iOS e Android)
- Expo simplifica o desenvolvimento e deploy
- Hot reload para desenvolvimento rápido
- Acesso fácil a APIs nativas (câmera, áudio, notificações)

**Justificativa para TCC:**
- Demonstra conhecimento em desenvolvimento mobile moderno
- Mostra capacidade de criar aplicações multiplataforma
- Expo facilita demonstração sem necessidade de configuração complexa

### Por que SQLite no Mobile?

**Vantagens:**
- Armazenamento local rápido e confiável
- Funciona offline (sem necessidade de internet constante)
- Não requer servidor de banco de dados
- Ideal para MVP sem custos adicionais

**Justificativa para TCC:**
- Demonstra conhecimento em bancos de dados embarcados
- Mostra preocupação com experiência offline do usuário
- Reduz complexidade e custos do projeto

### Por que JSON no Backend?

**Vantagens:**
- Não requer instalação de PostgreSQL/MySQL
- Fácil de debugar e visualizar dados
- Pode migrar facilmente para banco real depois
- Suficiente para demonstração

**Justificativa para TCC:**
- Foca em funcionalidades principais, não em infraestrutura
- Facilita demonstração e explicação
- Mostra que entende quando simplificar é apropriado

### Por que APIs Gratuitas?

**WhatsApp:**
- WhatsApp Business API oficial é paga
- Ultramsg/CallMeBot oferecem trial gratuito
- Suficiente para demonstração em TCC

**Wit.ai:**
- Plano gratuito disponível
- Suporta português brasileiro
- Fácil de configurar e usar

**Firebase FCM:**
- Gratuito para sempre
- Suportado nativamente pelo Expo
- Padrão da indústria para notificações push

**Justificativa para TCC:**
- Demonstra capacidade de encontrar soluções viáveis
- Mostra consciência de custos e viabilidade
- Apropriado para um MVP acadêmico

## 📱 Funcionalidades Implementadas

### 1. CRUD de Tarefas

**O que faz:**
- Criar, ler, atualizar e deletar tarefas
- Armazenamento local no SQLite
- Sincronização com backend

**Como funciona tecnicamente:**
- SQLite armazena dados localmente
- Backend mantém cópia sincronizada
- Estratégia "last-write-wins" para resolução de conflitos

**Pontos para apresentação:**
- Mostrar criação de tarefa no app
- Explicar sincronização bidirecional
- Demonstrar funcionamento offline

### 2. Integração WhatsApp

**O que faz:**
- Recebe comandos via WhatsApp
- Processa comandos usando Wit.ai
- Cria tarefas automaticamente
- Envia respostas

**Como funciona tecnicamente:**
- Webhook recebe mensagens do WhatsApp
- Wit.ai interpreta intenção do usuário
- Backend cria tarefa baseado no comando
- Notificação FCM é enviada ao app

**Pontos para apresentação:**
- Demonstrar envio de mensagem WhatsApp
- Mostrar criação automática de tarefa
- Explicar processamento de linguagem natural

### 3. Processamento de Voz (Wit.ai)

**O que faz:**
- Grava áudio do usuário
- Envia para backend/Wit.ai
- Processa comando de voz
- Cria tarefa automaticamente

**Como funciona tecnicamente:**
- Expo AV grava áudio
- Áudio é enviado para backend
- Backend processa com Wit.ai
- Tarefa é criada baseada no resultado

**Pontos para apresentação:**
- Demonstrar gravação de áudio
- Mostrar processamento em tempo real
- Explicar como NLP funciona

### 4. Notificações Push (FCM)

**O que faz:**
- Envia notificações quando tarefas são criadas
- Notifica sobre atualizações
- Funciona mesmo com app fechado

**Como funciona tecnicamente:**
- App registra token FCM
- Backend armazena tokens
- Firebase Admin SDK envia notificações
- Sistema operacional exibe notificação

**Pontos para apresentação:**
- Demonstrar notificação recebida
- Explicar funcionamento do FCM
- Mostrar integração completa

## 🔄 Sincronização

### Estratégia Implementada

**Last-Write-Wins:**
- Em caso de conflito, última atualização vence
- Timestamps determinam ordem
- Campo `synced` marca sincronização

**Fluxo:**
1. Tarefa criada no mobile → SQLite local
2. Sync envia para backend
3. Backend salva e retorna confirmação
4. Mobile marca como sincronizada

**Pontos para apresentação:**
- Explicar estratégia de sincronização
- Demonstrar funcionamento offline
- Mostrar resolução de conflitos

## 🎓 Explicações para Banca

### Pergunta: "Por que não usou PostgreSQL/MySQL?"

**Resposta:**
"Para um MVP acadêmico, escolhi JSON file para focar nas funcionalidades principais. Isso reduz complexidade de setup e é suficiente para demonstração. O sistema foi projetado para facilitar migração futura para um banco de dados relacional se necessário."

### Pergunta: "Como funciona a sincronização?"

**Resposta:**
"Implementei sincronização bidirecional com estratégia last-write-wins. Cada tarefa tem timestamps de criação e atualização. Quando há conflito, a última atualização prevalece. O campo 'synced' marca se a tarefa foi sincronizada, permitindo identificar pendências."

### Pergunta: "Por que APIs gratuitas?"

**Resposta:**
"Escolhi APIs gratuitas para manter o projeto sem custos, apropriado para um TCC. Wit.ai oferece plano gratuito suficiente para MVP. Ultramsg tem trial gratuito. FCM é gratuito para sempre. Todas são soluções viáveis para demonstração e podem ser escaladas depois."

### Pergunta: "Como o Wit.ai funciona?"

**Resposta:**
"Wit.ai é uma plataforma de NLP que processa texto ou áudio e extrai intents (intenções) e entities (entidades). Configurei intents como 'create_task' e 'list_tasks', e entities como 'title' e 'description'. Quando o usuário envia um comando, o Wit.ai identifica a intenção e extrai os dados necessários para criar a tarefa."

### Pergunta: "Qual a arquitetura de sincronização?"

**Resposta:**
"O mobile usa SQLite local para armazenamento rápido e offline. O backend mantém uma cópia sincronizada. A sincronização é bidirecional: tarefas criadas no mobile são enviadas ao backend, e tarefas criadas via WhatsApp são baixadas pelo mobile. Usei timestamps para determinar ordem e last-write-wins para conflitos."

## 📊 Diagramas para Apresentação

### Fluxo de Criação de Tarefa via WhatsApp

```
Usuário → WhatsApp → Webhook → Backend
                                    │
                                    ├─→ Wit.ai (interpreta)
                                    │
                                    ├─→ Cria Tarefa
                                    │
                                    ├─→ FCM (notifica app)
                                    │
                                    └─→ Responde WhatsApp
```

### Fluxo de Sincronização

```
Mobile (SQLite) ←─── Sync ───→ Backend (JSON)
     │                              │
     │                              │
  Offline                       Online
```

## 🎯 Pontos Fortes para Destacar

1. **Integração Completa**: Múltiplas tecnologias trabalhando juntas
2. **Funcionamento Offline**: SQLite permite uso sem internet
3. **Processamento de Linguagem Natural**: Wit.ai demonstra IA aplicada
4. **Notificações Push**: FCM mostra integração com serviços cloud
5. **Arquitetura Escalável**: Fácil migração para produção

## ⚠️ Limitações Conhecidas

Seja transparente sobre limitações:

1. **APIs Gratuitas**: Podem ter limites de requisições
2. **JSON File**: Não é ideal para produção em larga escala
3. **WhatsApp**: APIs gratuitas podem ter restrições
4. **Segurança**: MVP focado em funcionalidade, não segurança avançada

**Como apresentar:**
"Estas são limitações conhecidas e apropriadas para um MVP. Em produção, migraria para APIs pagas, banco de dados relacional e implementaria autenticação robusta."

## 📝 Conclusão

O TodoWhats demonstra:
- Conhecimento em desenvolvimento mobile moderno
- Capacidade de integrar múltiplas tecnologias
- Entendimento de arquitetura de sistemas
- Consciência de viabilidade e custos
- Habilidade de criar soluções funcionais

**Mensagem Final:**
"Este MVP demonstra que é possível criar um sistema completo e funcional usando tecnologias modernas e gratuitas, apropriado para um projeto acadêmico e com potencial para evolução para produção."

