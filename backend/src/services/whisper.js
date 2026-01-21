/**
 * Serviço Whisper (Transcrição Local)
 *
 * Função do arquivo:
 * - Transcrever áudios localmente usando o Whisper via Python.
 *
 * Objetivos:
 * - Garantir transcrição 100% local e gratuita.
 * - Evitar dependência de serviços externos para áudio.
 * - Prover integração simples para o webhook do WhatsApp.
 *
 * Fluxo interno:
 * 1) Salva o buffer de áudio em um arquivo temporário.
 * 2) Executa o Whisper via Python (modelo "base", idioma "pt").
 * 3) Captura o texto retornado no stdout.
 * 4) Remove arquivos temporários e retorna a transcrição.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

/**
 * Mapeia MIME type para extensão de arquivo.
 *
 * Objetivo:
 * - Manter uma extensão coerente para o Whisper/ffmpeg.
 *
 * @param {string|null} mimeType - MIME type do áudio.
 * @returns {string} Extensão de arquivo (com ponto).
 */
const resolveAudioExtension = (mimeType) => {
  const normalized = typeof mimeType === "string" ? mimeType.toLowerCase() : "";

  if (normalized.includes("ogg")) {
    return ".ogg";
  }
  if (normalized.includes("wav")) {
    return ".wav";
  }
  if (normalized.includes("mp3") || normalized.includes("mpeg")) {
    return ".mp3";
  }
  if (normalized.includes("m4a")) {
    return ".m4a";
  }

  return ".ogg";
};

/**
 * Ajusta o PATH para o processo do Python.
 *
 * Objetivos:
 * - Permitir encontrar o ffmpeg quando instalado via winget.
 * - Evitar alteração permanente do PATH do sistema.
 *
 * @returns {Object} Variáveis de ambiente a serem usadas no processo.
 */
const buildPythonEnv = () => {
  const env = { ...process.env };
  const currentPath = String(env.Path || env.PATH || "");

  // Caminho padrão do ffmpeg instalado via winget (Gyan.FFmpeg).
  const wingetFfmpegBin = "C:\\Users\\Leandro\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin";

  if (fs.existsSync(path.join(wingetFfmpegBin, "ffmpeg.exe"))) {
    if (!currentPath.toLowerCase().includes(wingetFfmpegBin.toLowerCase())) {
      env.Path = `${wingetFfmpegBin};${currentPath}`;
    }
  }

  return env;
};

/**
 * Executa o Whisper via Python.
 *
 * Objetivos:
 * - Usar o modelo "base" (gratuito e leve).
 * - Forçar idioma português para melhor precisão.
 * - Retornar somente o texto transcrito.
 *
 * @param {string} audioPath - Caminho do arquivo de áudio.
 * @returns {Promise<string>} Texto transcrito.
 */
const runWhisper = (audioPath) => new Promise((resolve, reject) => {
  const pythonBin = process.env.WHISPER_PYTHON_PATH || "python";

  const script = [
    "import sys",
    "import whisper",
    "model = whisper.load_model('base')",
    "result = model.transcribe(sys.argv[1], language='pt')",
    "text = (result.get('text') or '').strip()",
    "print(text)",
  ].join("\n");

  execFile(
    pythonBin,
    ["-X", "utf8", "-c", script, audioPath],
    {
      env: buildPythonEnv(),
      windowsHide: true,
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 5,
    },
    (error, stdout, stderr) => {
      if (error) {
        const details = stderr ? ` ${stderr}` : "";
        return reject(new Error(`Falha ao executar Whisper.${details}`));
      }

      const text = typeof stdout === "string" ? stdout.trim() : "";
      return resolve(text);
    }
  );
});

/**
 * Transcreve áudio localmente usando Whisper.
 *
 * Objetivos:
 * - Receber o buffer vindo do webhook.
 * - Salvar temporariamente o áudio para o Whisper ler.
 * - Garantir limpeza do arquivo temporário.
 *
 * @param {Buffer} audioBuffer - Buffer do áudio recebido.
 * @param {string|null} mimeType - MIME type do áudio (quando disponível).
 * @returns {Promise<string>} Texto transcrito (pode ser vazio).
 */
const transcribeAudioBuffer = async (audioBuffer, mimeType = null) => {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
    throw new Error("Buffer de áudio inválido ou vazio");
  }

  const extension = resolveAudioExtension(mimeType);
  const tempFileName = `whisper-audio-${Date.now()}${extension}`;
  const tempFilePath = path.join(os.tmpdir(), tempFileName);

  try {
    await fs.promises.writeFile(tempFilePath, audioBuffer);
    const text = await runWhisper(tempFilePath);
    return text;
  } finally {
    try {
      await fs.promises.unlink(tempFilePath);
    } catch (error) {
      console.warn("⚠️ Não foi possível remover arquivo temporário:", error.message || error);
    }
  }
};

module.exports = {
  transcribeAudioBuffer,
};
