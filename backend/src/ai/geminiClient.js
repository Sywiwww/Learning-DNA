const {
  buildPersonalityPrompt,
  normalizePersonalityId
} = require("./personalities");

const GEMINI_GENERATE_CONTENT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_HISTORY_TURNS = 12;
const DEFAULT_GENERATION_CONFIG = Object.freeze({
  temperature: 0.7,
  maxOutputTokens: 1200
});

class GeminiClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "GeminiClientError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;

    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

function resolveApiKey(apiKey) {
  const resolvedApiKey =
    apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!resolvedApiKey) {
    throw new GeminiClientError(
      "Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY."
    );
  }

  return resolvedApiKey;
}

function resolveModel(model) {
  return model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

function normalizeModelPath(model) {
  const resolvedModel = resolveModel(model).trim();
  return resolvedModel.startsWith("models/")
    ? resolvedModel
    : `models/${resolvedModel}`;
}

function appendApiKey(url, apiKey) {
  if (/[?&]key=/.test(url)) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}key=${encodeURIComponent(apiKey)}`;
}

function buildGenerateContentUrl(options = {}) {
  const baseUrl = (
    options.baseUrl ||
    process.env.GEMINI_API_BASE_URL ||
    GEMINI_GENERATE_CONTENT_BASE_URL
  ).replace(/\/+$/, "");
  const endpoint =
    options.endpoint ||
    `${baseUrl}/${normalizeModelPath(options.model)}:generateContent`;

  return appendApiKey(endpoint, options.apiKey);
}

function assertMessage(message) {
  if (typeof message !== "string" || !message.trim()) {
    throw new GeminiClientError("A non-empty learner message is required.");
  }
}

function compactObject(object) {
  return Object.entries(object || {}).reduce((result, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      result[key] = value;
    }

    return result;
  }, {});
}

function toPlainText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map(toPlainText).filter(Boolean).join("\n").trim();
  }

  if (typeof value === "object") {
    if (typeof value.text === "string") {
      return value.text.trim();
    }

    if (Array.isArray(value.parts)) {
      return toPlainText(value.parts);
    }

    if (Array.isArray(value.content)) {
      return toPlainText(value.content);
    }

    if (typeof value.content === "string") {
      return value.content.trim();
    }

    return "";
  }

  return String(value).trim();
}

function normalizeThinkingLevel(value) {
  const normalized = toPlainText(value).toUpperCase();
  return normalized || undefined;
}

function normalizeGenerationConfig(config = {}) {
  const normalized = {};

  Object.entries(config || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (key === "max_output_tokens") {
      normalized.maxOutputTokens = value;
      return;
    }

    if (key === "top_p") {
      normalized.topP = value;
      return;
    }

    if (key === "top_k") {
      normalized.topK = value;
      return;
    }

    if (key === "stop_sequences") {
      normalized.stopSequences = value;
      return;
    }

    if (key === "response_mime_type") {
      normalized.responseMimeType = value;
      return;
    }

    if (key === "response_schema") {
      normalized.responseSchema = value;
      return;
    }

    if (key === "candidate_count") {
      normalized.candidateCount = value;
      return;
    }

    if (key === "presence_penalty") {
      normalized.presencePenalty = value;
      return;
    }

    if (key === "frequency_penalty") {
      normalized.frequencyPenalty = value;
      return;
    }

    if (key === "thinking_level") {
      normalized.thinkingConfig = {
        ...(normalized.thinkingConfig || {}),
        thinkingLevel: normalizeThinkingLevel(value)
      };
      return;
    }

    normalized[key] = value;
  });

  return compactObject(normalized);
}

function humanizeKey(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function contextValueToText(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(contextValueToText).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return "";
    }
  }

  return String(value).trim();
}

function formatStudyContext(context = {}) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return "";
  }

  const lines = Object.entries(context)
    .map(([key, value]) => {
      const text = contextValueToText(value);
      return text ? `- ${humanizeKey(key)}: ${text}` : null;
    })
    .filter(Boolean);

  return lines.length ? ["Study context:", ...lines].join("\n") : "";
}

function resolveCommunicationPreferences(options = {}) {
  const teachingDNA = options.teachingDNA || {};

  return {
    language: toPlainText(options.language || teachingDNA.language || "English"),
    communicationStyle: toPlainText(
      options.communicationStyle ||
        options.speakingStyle ||
        teachingDNA.communicationStyle ||
        teachingDNA.speakingStyle
    )
  };
}

function buildCommunicationInstruction(options = {}) {
  const preferences = resolveCommunicationPreferences(options);
  const lines = [
    "Language and communication preferences:",
    `- Preferred language: ${preferences.language}.`,
    "- Supported app languages are English, Filipino, and Taglish.",
    "- Respond in the preferred language unless the learner asks for a different language."
  ];

  if (preferences.communicationStyle) {
    lines.push(`- Preferred speaking style: ${preferences.communicationStyle}.`);
  }

  return lines.join("\n");
}

function normalizeHistoryRole(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (["assistant", "ai", "model", "tutor"].includes(normalizedRole)) {
    return "Tutor";
  }

  if (["system", "context"].includes(normalizedRole)) {
    return "Context";
  }

  return "Learner";
}

function normalizeHistoryMessage(message) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const content = toPlainText(
    message.content || message.text || message.message || message.parts
  );

  if (!content) {
    return null;
  }

  return {
    role: normalizeHistoryRole(message.role || message.sender || message.author),
    content
  };
}

function formatConversationHistory(history = [], maxTurns = DEFAULT_HISTORY_TURNS) {
  if (!Array.isArray(history) || history.length === 0 || maxTurns <= 0) {
    return "";
  }

  const recentMessages = history
    .slice(-maxTurns)
    .map(normalizeHistoryMessage)
    .filter(Boolean);

  if (recentMessages.length === 0) {
    return "";
  }

  return [
    "Recent conversation:",
    ...recentMessages.map((message) => `${message.role}: ${message.content}`)
  ].join("\n");
}

function buildSystemInstruction(options = {}) {
  const personalityId = normalizePersonalityId(options.personalityId);
  const basePrompt = buildPersonalityPrompt(personalityId, options.teachingDNA);
  const communicationInstruction = buildCommunicationInstruction(options);
  const extraInstructions = Array.isArray(options.extraInstructions)
    ? options.extraInstructions
    : [options.extraInstructions].filter(Boolean);

  return [
    basePrompt,
    "",
    communicationInstruction,
    "",
    "Learning DNA chat engine rules:",
    "- Teach the learner's current topic clearly before adding extra detail.",
    "- Adapt depth, pacing, examples, and encouragement to the Teaching DNA.",
    "- Ask one focused follow-up question only when needed to teach correctly.",
    "- Give practical next steps when the learner asks for study guidance.",
    "- Do not claim access to grades, schedules, progress, files, or reminders unless they are provided in the request context.",
    "- Keep responses accurate, safe, and useful for a student using a mobile study companion.",
    ...extraInstructions.map((instruction) => `- ${instruction}`)
  ].join("\n");
}

function buildChatInput(options = {}) {
  assertMessage(options.message);

  const sections = [];
  const studyContext = formatStudyContext(options.context);
  const conversationSummary = toPlainText(options.conversationSummary);
  const history = formatConversationHistory(
    options.history,
    options.maxHistoryTurns
  );

  if (studyContext) {
    sections.push(studyContext);
  }

  if (conversationSummary) {
    sections.push(`Conversation summary:\n${conversationSummary}`);
  }

  if (history) {
    sections.push(history);
  }

  sections.push(`Learner message:\n${options.message.trim()}`);

  return sections.join("\n\n");
}

function toGeminiRole(role) {
  return normalizeHistoryRole(role) === "Tutor" ? "model" : "user";
}

function buildGeminiContent(role, text) {
  return {
    role,
    parts: [{ text }]
  };
}

function buildChatContents(options = {}) {
  assertMessage(options.message);

  const maxHistoryTurns =
    options.maxHistoryTurns === undefined
      ? DEFAULT_HISTORY_TURNS
      : options.maxHistoryTurns;
  const history =
    Array.isArray(options.history) && maxHistoryTurns > 0
      ? options.history
          .slice(-maxHistoryTurns)
          .map(normalizeHistoryMessage)
          .filter(Boolean)
      : [];
  const historyContents = history.map((message) =>
    buildGeminiContent(toGeminiRole(message.role), message.content)
  );
  const currentInput = buildChatInput({
    message: options.message,
    context: options.context,
    conversationSummary: options.conversationSummary,
    history: [],
    maxHistoryTurns: 0
  });

  return [...historyContents, buildGeminiContent("user", currentInput)];
}

function buildChatRequest(options = {}) {
  const maxHistoryTurns =
    options.maxHistoryTurns === undefined
      ? DEFAULT_HISTORY_TURNS
      : options.maxHistoryTurns;
  const personalityId = normalizePersonalityId(
    options.personalityId || options.personality
  );
  const model = resolveModel(options.model);
  const generationConfig = normalizeGenerationConfig({
    ...DEFAULT_GENERATION_CONFIG,
    ...(options.generationConfig || {}),
    responseFormat: options.responseFormat
  });

  const payload = compactObject({
    contents: buildChatContents({
      message: options.message,
      context: options.context,
      conversationSummary: options.conversationSummary,
      history: options.history,
      maxHistoryTurns
    }),
    systemInstruction: {
      parts: [
        {
          text: buildSystemInstruction({
            personalityId,
            teachingDNA: options.teachingDNA,
            language: options.language,
            communicationStyle: options.communicationStyle,
            speakingStyle: options.speakingStyle,
            extraInstructions: options.extraInstructions
          })
        }
      ]
    },
    generationConfig,
    store: options.store
  });

  return {
    payload,
    model,
    personalityId
  };
}

async function readResponseBody(response) {
  if (typeof response.text === "function") {
    const bodyText = await response.text();

    if (!bodyText) {
      return {};
    }

    try {
      return JSON.parse(bodyText);
    } catch (error) {
      return { raw: bodyText };
    }
  }

  if (typeof response.json === "function") {
    return response.json();
  }

  return {};
}

function getGeminiErrorMessage(body, status) {
  if (body && body.error && typeof body.error.message === "string") {
    return body.error.message;
  }

  if (body && typeof body.raw === "string" && body.raw.trim()) {
    return body.raw.trim();
  }

  return `Gemini request failed with status ${status}.`;
}

async function postGeminiGenerateContent(payload, options = {}) {
  const apiKey = resolveApiKey(options.apiKey);
  const endpoint = buildGenerateContentUrl({
    apiKey,
    endpoint: options.endpoint,
    baseUrl: options.baseUrl,
    model: options.model
  });
  const fetcher = options.fetch || globalThis.fetch;

  if (typeof fetcher !== "function") {
    throw new GeminiClientError(
      "No fetch implementation is available. Use Node 18+ or pass a fetch function."
    );
  }

  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const controller =
    typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    });
    const body = await readResponseBody(response);

    if (!response.ok) {
      const apiError = body && body.error ? body.error : {};

      throw new GeminiClientError(
        getGeminiErrorMessage(body, response.status),
        {
          status: response.status,
          code: apiError.code,
          details: body
        }
      );
    }

    return body;
  } catch (error) {
    if (error instanceof GeminiClientError) {
      throw error;
    }

    if (error && error.name === "AbortError") {
      throw new GeminiClientError(
        `Gemini request timed out after ${timeoutMs}ms.`,
        { cause: error }
      );
    }

    throw new GeminiClientError("Gemini request failed.", { cause: error });
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function extractTextBlocks(blocks) {
  if (!Array.isArray(blocks)) {
    return "";
  }

  return blocks
    .map((block) => {
      if (!block || typeof block !== "object") {
        return "";
      }

      if (typeof block.text === "string") {
        return block.text;
      }

      if (Array.isArray(block.parts)) {
        return extractTextBlocks(block.parts);
      }

      if (Array.isArray(block.content)) {
        return extractTextBlocks(block.content);
      }

      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractOutputText(response) {
  if (!response || typeof response !== "object") {
    return "";
  }

  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  const stepText = extractTextBlocks(
    (response.steps || [])
      .filter((step) => step && step.type === "model_output")
      .flatMap((step) => step.content || [])
  );

  if (stepText) {
    return stepText;
  }

  const candidateText = extractTextBlocks(
    (response.candidates || []).flatMap((candidate) =>
      candidate && candidate.content ? candidate.content.parts || [] : []
    )
  );

  return candidateText;
}

class GeminiChatEngine {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.endpoint = options.endpoint;
    this.baseUrl =
      options.baseUrl ||
      process.env.GEMINI_API_BASE_URL ||
      GEMINI_GENERATE_CONTENT_BASE_URL;
    this.model = resolveModel(options.model);
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.fetch = options.fetch;
  }

  buildRequest(options = {}) {
    return buildChatRequest({
      ...options,
      model: options.model || this.model
    });
  }

  async sendMessage(options = {}) {
    const request = this.buildRequest(options);
    const rawResponse = await postGeminiGenerateContent(request.payload, {
      apiKey: options.apiKey || this.apiKey,
      endpoint: options.endpoint || this.endpoint,
      baseUrl: options.baseUrl || this.baseUrl,
      model: request.model,
      timeoutMs: options.timeoutMs || this.timeoutMs,
      fetch: options.fetch || this.fetch
    });
    const text = extractOutputText(rawResponse);

    if (!text) {
      throw new GeminiClientError(
        "Gemini response did not include text output.",
        { details: rawResponse }
      );
    }

    return {
      text,
      responseId: rawResponse.responseId || null,
      interactionId: null,
      previousInteractionId: null,
      model: rawResponse.model || request.model,
      personalityId: request.personalityId,
      status: rawResponse.status || null,
      usage: rawResponse.usageMetadata || rawResponse.usage || null,
      raw: rawResponse
    };
  }
}

function createGeminiClient(options = {}) {
  return new GeminiChatEngine(options);
}

async function sendChatMessage(options = {}) {
  const client = createGeminiClient({
    apiKey: options.apiKey,
    endpoint: options.endpoint,
    baseUrl: options.baseUrl,
    model: options.model,
    timeoutMs: options.timeoutMs,
    fetch: options.fetch
  });

  return client.sendMessage(options);
}

module.exports = {
  AIChatEngine: GeminiChatEngine,
  GeminiChatEngine,
  GeminiClientError,
  GEMINI_GENERATE_CONTENT_BASE_URL,
  DEFAULT_MODEL,
  DEFAULT_GENERATION_CONFIG,
  DEFAULT_HISTORY_TURNS,
  createGeminiClient,
  sendChatMessage,
  buildChatRequest,
  buildChatInput,
  buildChatContents,
  buildSystemInstruction,
  buildGenerateContentUrl,
  formatConversationHistory,
  extractOutputText
};
