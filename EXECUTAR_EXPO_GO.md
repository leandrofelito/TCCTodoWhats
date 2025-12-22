# 🚀 Guia Rápido - Executar no Expo Go

Este guia mostra como executar o app TodoWhats no Expo Go de forma simples e rápida.

## ✅ Pré-requisitos

1. **Expo Go instalado no celular:**
   - [Android - Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Celular e computador na mesma rede Wi-Fi**

## 📝 Passo a Passo

### 1️⃣ Iniciar o Backend

Abra um terminal PowerShell e execute:

```powershell
cd "c:\Users\Leandro\Desktop\Projeto Todowhats novo\backend"
npm start
```

**Aguarde até ver:** `Servidor rodando na porta 3000` ou similar.

> ⚠️ **IMPORTANTE:** Mantenha este terminal aberto enquanto usar o app!

### 2️⃣ Iniciar o Expo (Mobile)

Abra **OUTRO** terminal PowerShell e execute:

```powershell
cd "c:\Users\Leandro\Desktop\Projeto Todowhats novo\mobile"
npm start
```

**O que vai acontecer:**
- O Expo vai iniciar e mostrar um QR Code no terminal
- Uma página web também pode abrir no navegador com o QR Code

### 3️⃣ Conectar no Expo Go

**No seu celular:**

1. Abra o app **Expo Go**
2. Toque em **"Scan QR Code"** (Android) ou use a **câmera** (iOS)
3. Escaneie o QR Code que apareceu no terminal ou navegador
4. Aguarde o app carregar (pode demorar alguns segundos na primeira vez)

### 4️⃣ Verificar Conexão

Se o app carregar normalmente, está tudo funcionando! 🎉

Se aparecer erro de conexão:
- Verifique se o backend está rodando (passo 1)
- Verifique se o celular está na mesma rede Wi-Fi do computador
- Verifique se o firewall do Windows não está bloqueando a porta 3000

## 🔧 Comandos Úteis no Terminal do Expo

Quando o Expo estiver rodando, você pode pressionar:

- **`r`** - Recarregar o app
- **`m`** - Abrir menu de desenvolvedor
- **`a`** - Abrir no Android Emulator (se tiver instalado)
- **`i`** - Abrir no iOS Simulator (se tiver instalado)
- **`w`** - Abrir no navegador web
- **`Ctrl+C`** - Parar o servidor Expo

## 🐛 Problemas Comuns

### App não conecta ao backend

**Solução:**
1. Verifique se o backend está rodando na porta 3000
2. Verifique o IP no arquivo `mobile/src/utils/constants.js`
3. Teste acessando `http://192.168.0.151:3000/api/tasks` no navegador do celular

### QR Code não aparece

**Solução:**
1. Feche o terminal e abra novamente
2. Execute `npm start` novamente
3. Se ainda não aparecer, tente `npx expo start --clear`

### App carrega mas mostra erro

**Solução:**
1. Verifique os logs no terminal do Expo
2. Verifique os logs no terminal do Backend
3. Certifique-se de que todas as dependências estão instaladas

## 📱 Testando o App

Após conectar:

1. **Criar uma tarefa:** Toque no botão `+` na tela inicial
2. **Editar tarefa:** Toque em uma tarefa da lista
3. **Deletar tarefa:** Deslize a tarefa para a esquerda ou use o botão de deletar
4. **Sincronizar:** Puxe a lista para baixo (pull-to-refresh)

## 🎯 Próximos Passos

- Configure as variáveis de ambiente do backend (`.env`) se ainda não fez
- Teste a integração com WhatsApp (se configurado)
- Teste as notificações FCM (se configurado)

---

**Dúvidas?** Consulte o arquivo `INSTALACAO.md` para mais detalhes.
