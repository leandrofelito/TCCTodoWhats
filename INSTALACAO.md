# Guia de Instalação - TodoWhats MVP

Este guia explica passo a passo como configurar e executar o projeto TodoWhats.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18 ou superior ([Download](https://nodejs.org/))
- **npm** ou **yarn** (vem com Node.js)
- **Expo CLI** (instalar globalmente): `npm install -g expo-cli`
- **Git** (opcional, para clonar repositório)

## 🔧 Configuração Inicial

### 1. Clonar/Baixar o Projeto

Se você já tem o projeto, pule esta etapa.

### 2. Instalar Dependências do Backend

```bash
cd backend
npm install
```

### 3. Configurar Variáveis de Ambiente do Backend

1. Copie o arquivo `env.example.txt` para `.env`:
   ```bash
   copy env.example.txt .env
   ```
   (No Linux/Mac: `cp env.example.txt .env`)

2. Edite o arquivo `.env` e preencha com suas credenciais:

   **Wit.ai:**
   - Acesse https://wit.ai
   - Crie uma conta gratuita
   - Crie um novo app
   - Copie o Server Access Token
   - Cole em `WIT_AI_TOKEN`

   **Firebase Cloud Messaging:**
   - Acesse https://firebase.google.com
   - Crie um projeto
   - Vá em Project Settings > Cloud Messaging
   - Copie a Server Key
   - Cole em `FCM_SERVER_KEY`

   **WhatsApp API (Ultramsg):**
   - Acesse https://ultramsg.com
   - Crie uma conta (trial gratuito disponível)
   - Obtenha API Key e Instance ID
   - Cole em `WHATSAPP_API_KEY` e `WHATSAPP_INSTANCE_ID`

   **Alternativa - CallMeBot:**
   - Se preferir usar CallMeBot, descomente as linhas no `.env`
   - Configure `CALLMEBOT_API_KEY` e `CALLMEBOT_PHONE`

### 4. Instalar Dependências do Mobile

```bash
cd ../mobile
npm install
```

### 5. Configurar Expo no Mobile

1. Instale o app **Expo Go** no seu celular:
   - [Android - Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. No arquivo `mobile/src/services/fcm.js`, linha 30, substitua `"your-project-id"` pelo ID do seu projeto Expo:
   - Acesse https://expo.dev
   - Crie uma conta
   - Crie um projeto
   - Copie o Project ID

3. No arquivo `mobile/src/utils/constants.js`, ajuste a URL da API:
   - Para desenvolvimento local, use o IP da sua máquina na rede local
   - Exemplo: `http://192.168.1.100:3000`
   - **Importante**: Use o IP local, não `localhost` ou `127.0.0.1`

## 🚀 Executando o Projeto

### Backend

1. Abra um terminal e entre na pasta `backend`:
   ```bash
   cd backend
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```
   
   Ou para desenvolvimento com auto-reload:
   ```bash
   npm run dev
   ```

3. O servidor estará rodando em `http://localhost:3000`

### Mobile

1. Abra outro terminal e entre na pasta `mobile`:
   ```bash
   cd mobile
   ```

2. Inicie o Expo:
   ```bash
   npm start
   ```

3. Escaneie o QR code com o app Expo Go:
   - **Android**: Abra o Expo Go e toque em "Scan QR Code"
   - **iOS**: Abra a câmera e escaneie o QR code

4. Ou pressione:
   - `a` para abrir no Android Emulator
   - `i` para abrir no iOS Simulator
   - `w` para abrir no navegador

## 🧪 Testando o Projeto

### Testar CRUD de Tarefas

1. No app mobile, toque no botão `+` para criar uma tarefa
2. Preencha título, descrição e status
3. Toque em "Salvar Tarefa"
4. A tarefa deve aparecer na lista
5. Toque em uma tarefa para editar
6. Deslize ou use o botão de deletar para remover

### Testar Sincronização

1. Crie uma tarefa no app
2. Puxe a lista para baixo (pull-to-refresh)
3. A tarefa deve ser sincronizada com o backend
4. Verifique no arquivo `backend/data/tasks.json`

### Testar WhatsApp

1. Configure o webhook no Ultramsg/CallMeBot apontando para:
   `http://seu-servidor:3000/api/whatsapp/webhook`

2. Envie uma mensagem para o número configurado:
   - "Criar tarefa comprar leite"
   - "Mostrar minhas tarefas"

3. O bot deve responder e criar/listar tarefas

### Testar Wit.ai

1. No app mobile, vá para a tela de criar tarefa
2. Use o componente de voz (se implementado)
3. Grave um comando como "Criar tarefa estudar matemática"
4. O áudio será processado e a tarefa criada

### Testar Notificações FCM

1. Crie uma tarefa via WhatsApp
2. O app mobile deve receber uma notificação push
3. Verifique se o token FCM foi registrado no backend

## 🐛 Solução de Problemas

### Backend não inicia

- Verifique se a porta 3000 está livre
- Verifique se todas as dependências foram instaladas
- Verifique se o arquivo `.env` está configurado corretamente

### App mobile não conecta ao backend

- Verifique se o backend está rodando
- Verifique se a URL em `constants.js` está correta
- Use o IP local da sua máquina, não `localhost`
- Verifique se o firewall não está bloqueando a porta 3000

### WhatsApp não funciona

- Verifique se as credenciais estão corretas no `.env`
- Verifique se o webhook está configurado corretamente
- Teste a API diretamente usando Postman ou curl

### Wit.ai não funciona

- Verifique se o token está correto
- Verifique se os intents estão configurados no Wit.ai
- Teste a API diretamente

### FCM não funciona

- Verifique se a Server Key está correta
- Verifique se o token foi registrado no backend
- Verifique os logs do Firebase Console

## 📚 Próximos Passos

1. Configure os intents no Wit.ai para melhorar reconhecimento
2. Personalize as mensagens do WhatsApp
3. Adicione mais funcionalidades conforme necessário
4. Prepare apresentação para TCC

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação do Expo: https://docs.expo.dev
- Documentação do Express: https://expressjs.com
- Documentação do Wit.ai: https://wit.ai/docs
- Documentação do Firebase: https://firebase.google.com/docs

