const { sendChatMessage } = require("./geminiClient");
const {
  buildTeachingDNAContext,
  getTeachingRecommendations,
  normalizeTeachingDNA
} = require("./teachingDNA");
const { normalizePersonalityId } = require("./personalities");

const DEFAULT_RECOMMENDATION_LIMIT =
  Number(process.env.AI_RESOURCE_RECOMMENDATION_LIMIT) || 6;
const DEFAULT_LOW_BANDWIDTH_MODE =
  process.env.AI_ENABLE_LOW_BANDWIDTH_MODE !== "false";

const RESOURCE_TYPES = Object.freeze({
  video: {
    label: "Video",
    lowBandwidth: false,
    offlineFriendly: false,
    bestFor: ["visual", "mixed"]
  },
  article: {
    label: "Article",
    lowBandwidth: true,
    offlineFriendly: true,
    bestFor: ["reading", "mixed", "stepByStep"]
  },
  quiz: {
    label: "Quiz",
    lowBandwidth: true,
    offlineFriendly: true,
    bestFor: ["practiceFirst", "interactive"]
  },
  flashcards: {
    label: "Flashcards",
    lowBandwidth: true,
    offlineFriendly: true,
    bestFor: ["practiceFirst", "interactive", "mixed"]
  },
  summary: {
    label: "Summary",
    lowBandwidth: true,
    offlineFriendly: true,
    bestFor: ["reading", "stepByStep", "mixed"]
  },
  project: {
    label: "Project",
    lowBandwidth: true,
    offlineFriendly: true,
    bestFor: ["practical", "advanced"]
  },
  diagram: {
    label: "Diagram",
    lowBandwidth: true,
    offlineFriendly: true,
    bestFor: ["visual", "stepByStep"]
  }
});

const DEFAULT_RESOURCE_OPTIONS = Object.freeze({
  limit: DEFAULT_RECOMMENDATION_LIMIT,
  lowBandwidthMode: DEFAULT_LOW_BANDWIDTH_MODE,
  includeOfflineResources: true,
  source: "gemini"
});

class ResourceRecommendationError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ResourceRecommendationError";
    this.details = options.details;

    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

function toPlainText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map(toPlainText).filter(Boolean).join(", ").trim();
  }

  return String(value).trim();
}

function toArray(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function uniqueList(values, limit = 12) {
  const seen = new Set();
  const result = [];

  toArray(values).flat().forEach((value) => {
    const text = toPlainText(value);
    const key = text.toLowerCase();

    if (text && !seen.has(key)) {
      seen.add(key);
      result.push(text);
    }
  });

  return result.slice(0, limit);
}

function clamp(value, min, max, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

function slugify(value) {
  return toPlainText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeResourceType(type, fallback = "summary") {
  const normalized = toPlainText(type).toLowerCase().replace(/[\s_-]+/g, "");
  const aliases = {
    videos: "video",
    video: "video",
    youtube: "video",
    article: "article",
    articles: "article",
    reading: "article",
    readings: "article",
    quiz: "quiz",
    quizzes: "quiz",
    drill: "quiz",
    drills: "quiz",
    exercise: "quiz",
    exercises: "quiz",
    flashcard: "flashcards",
    flashcards: "flashcards",
    note: "summary",
    notes: "summary",
    summary: "summary",
    summaries: "summary",
    project: "project",
    projects: "project",
    casestudy: "project",
    diagram: "diagram",
    diagrams: "diagram",
    infographic: "diagram",
    infographics: "diagram"
  };

  return aliases[normalized] || (RESOURCE_TYPES[normalized] ? normalized : fallback);
}

function assertSubject(subject) {
  if (!toPlainText(subject)) {
    throw new ResourceRecommendationError(
      "A subject, topic, or skill is required to recommend resources."
    );
  }
}

function normalizeRecommendationOptions(options = {}) {
  assertSubject(options.subject || options.topic || options.skill);

  const teachingDNA = normalizeTeachingDNA(options.teachingDNA || {});
  const subject = toPlainText(options.subject || options.topic || options.skill);
  const topic = toPlainText(options.topic || options.lesson || options.focusTopic || subject);

  return {
    subject,
    topic,
    goal: toPlainText(options.goal || options.learningGoal || options.objective),
    gradeLevel: toPlainText(options.gradeLevel || teachingDNA.gradeLevel),
    educationLevel: toPlainText(options.educationLevel || teachingDNA.educationLevel),
    difficulty: toPlainText(options.difficulty || teachingDNA.difficulty),
    language: toPlainText(options.language || teachingDNA.language),
    limit: Math.round(clamp(options.limit, 1, 12, DEFAULT_RESOURCE_OPTIONS.limit)),
    lowBandwidthMode:
      options.lowBandwidthMode === undefined
        ? DEFAULT_RESOURCE_OPTIONS.lowBandwidthMode
        : Boolean(options.lowBandwidthMode),
    includeOfflineResources: options.includeOfflineResources !== false,
    teachingDNA,
    personalityId: normalizePersonalityId(options.personalityId || teachingDNA.personalityId),
    weakAreas: uniqueList(options.weakAreas || teachingDNA.weakAreas),
    preferredTypes: uniqueList(options.preferredTypes || teachingDNA.resourcePreferences),
    excludedTypes: uniqueList(options.excludedTypes).map((type) => normalizeResourceType(type)),
    availableResources: toArray(options.availableResources),
    source: options.source || "gemini"
  };
}

function buildRecommendationContext(options = {}) {
  const normalizedOptions = normalizeRecommendationOptions(options);
  const teachingDNAContext = buildTeachingDNAContext(normalizedOptions.teachingDNA);

  return {
    subject: normalizedOptions.subject,
    topic: normalizedOptions.topic,
    goal: normalizedOptions.goal,
    gradeLevel: normalizedOptions.gradeLevel,
    educationLevel: normalizedOptions.educationLevel,
    difficulty: normalizedOptions.difficulty,
    language: normalizedOptions.language,
    limit: normalizedOptions.limit,
    lowBandwidthMode: normalizedOptions.lowBandwidthMode,
    includeOfflineResources: normalizedOptions.includeOfflineResources,
    weakAreas: normalizedOptions.weakAreas,
    preferredTypes: normalizedOptions.preferredTypes,
    availableResources: normalizedOptions.availableResources.map((resource) =>
      normalizeCandidateResource(resource, normalizedOptions)
    ),
    teachingDNA: teachingDNAContext,
    teachingRecommendations: getTeachingRecommendations(normalizedOptions.teachingDNA)
  };
}

function buildResourcePrompt(options = {}) {
  const normalizedOptions = normalizeRecommendationOptions(options);
  const context = buildRecommendationContext(normalizedOptions);

  return [
    "Create personalized Learning DNA resource recommendations.",
    "",
    "Return only valid JSON. Do not wrap it in markdown.",
    "",
    "Important safety rule:",
    "- Do not invent URLs. Use a URL only when it appears in availableResources.",
    "- If no verified URL is available, set url to null and provide a useful searchQuery.",
    "",
    "Required JSON shape:",
    "{",
    '  "subject": "string",',
    '  "topic": "string",',
    '  "language": "English | Filipino | Taglish",',
    '  "recommendations": [',
    "    {",
    '      "type": "video | article | quiz | flashcards | summary | project | diagram",',
    '      "title": "string",',
    '      "description": "string",',
    '      "url": null,',
    '      "searchQuery": "string",',
    '      "difficulty": "beginner | intermediate | advanced",',
    '      "estimatedMinutes": number,',
    '      "lowBandwidth": boolean,',
    '      "offlineAvailable": boolean,',
    '      "reason": "why this helps this learner",',
    '      "tags": ["string"]',
    "    }",
    "  ],",
    '  "studyActions": ["short action the learner can do after using the resource"],',
    '  "reviewPlan": ["short review step"]',
    "}",
    "",
    "Project requirements:",
    "- Optimize for Filipino learners on mobile devices.",
    "- Respect English, Filipino, and Taglish language preferences.",
    "- Adapt to Teaching DNA, grade level, weak areas, resource preferences, daily routine, and burnout risk.",
    "- Prefer low-bandwidth, offline-friendly resources when lowBandwidthMode is true.",
    "- Include practice resources such as quizzes or flashcards when the learner needs mastery checks.",
    "",
    `Recommendation context: ${JSON.stringify(context)}`
  ].join("\n");
}

function extractJson(text) {
  const content = toPlainText(text);

  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fencedMatch) {
      try {
        return JSON.parse(fencedMatch[1]);
      } catch (innerError) {
        return null;
      }
    }

    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(content.slice(firstBrace, lastBrace + 1));
      } catch (innerError) {
        return null;
      }
    }
  }

  return null;
}

function getPreferredTypeScore(type, options) {
  const resourceType = normalizeResourceType(type);
  const preferredTypes = uniqueList(options.preferredTypes).map((item) =>
    normalizeResourceType(item)
  );
  const teachingDNA = options.teachingDNA || {};
  const preferredResources = teachingDNA.preferredResources || {};
  const scoreKeys = {
    video: ["videos", "video"],
    article: ["articles", "article"],
    quiz: ["quizzes", "quiz"],
    flashcards: ["flashcards", "flashcard"],
    summary: ["summaries", "summary"],
    project: ["projects", "project"],
    diagram: ["diagrams", "diagram", "infographics"]
  };
  const matchedKey = (scoreKeys[resourceType] || [resourceType]).find(
    (key) => preferredResources[key] !== undefined
  );

  if (matchedKey) {
    return Number(preferredResources[matchedKey]) || 0;
  }

  return preferredTypes.includes(resourceType) ? 0.8 : 0.5;
}

function getRecommendedTypes(options = {}) {
  const normalizedOptions = normalizeRecommendationOptions(options);
  const style = normalizedOptions.teachingDNA.learningStyle;
  const typeScores = Object.keys(RESOURCE_TYPES).map((type) => {
    const metadata = RESOURCE_TYPES[type];
    let score = getPreferredTypeScore(type, normalizedOptions);

    if (metadata.bestFor.includes(style)) {
      score += 0.2;
    }

    if (normalizedOptions.lowBandwidthMode && metadata.lowBandwidth) {
      score += 0.15;
    }

    if (normalizedOptions.includeOfflineResources && metadata.offlineFriendly) {
      score += 0.1;
    }

    if (normalizedOptions.excludedTypes.includes(type)) {
      score = -1;
    }

    return { type, score };
  });

  return typeScores
    .filter((item) => item.score >= 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.type);
}

function estimateMinutes(type, difficulty) {
  const baseMinutes = {
    video: 12,
    article: 10,
    quiz: 8,
    flashcards: 7,
    summary: 6,
    project: 25,
    diagram: 5
  };
  const multiplier = difficulty === "advanced" ? 1.4 : difficulty === "intermediate" ? 1.15 : 1;

  return Math.round((baseMinutes[type] || 10) * multiplier);
}

function buildSearchQuery(options, type) {
  const grade = options.gradeLevel || options.educationLevel;
  const languageHint = options.language === "English" ? "English" : `${options.language} Filipino`;

  return uniqueList([
    options.subject,
    options.topic,
    grade,
    options.difficulty,
    RESOURCE_TYPES[type] ? RESOURCE_TYPES[type].label : type,
    languageHint
  ])
    .filter(Boolean)
    .join(" ");
}

function buildFallbackRecommendation(type, index, options) {
  const metadata = RESOURCE_TYPES[type] || RESOURCE_TYPES.summary;
  const titleTopic = options.topic || options.subject;
  const offlineAvailable = options.includeOfflineResources && metadata.offlineFriendly;

  return {
    id: `resource-${index + 1}-${slugify(type)}`,
    type,
    title: `${metadata.label}: ${titleTopic}`,
    description: `Use this ${metadata.label.toLowerCase()} to study ${titleTopic} at a ${options.difficulty} level.`,
    url: null,
    searchQuery: buildSearchQuery(options, type),
    provider: "search",
    difficulty: options.difficulty,
    estimatedMinutes: estimateMinutes(type, options.difficulty),
    lowBandwidth: options.lowBandwidthMode || metadata.lowBandwidth,
    offlineAvailable,
    reason: buildRecommendationReason(type, options),
    tags: uniqueList([options.subject, options.topic, options.difficulty, options.language, type], 6),
    score: Number((0.95 - index * 0.05).toFixed(2))
  };
}

function buildRecommendationReason(type, options) {
  const style = options.teachingDNA.learningStyle;
  const weakAreas = uniqueList(options.weakAreas, 3);

  if (type === "quiz" || type === "flashcards") {
    return weakAreas.length > 0
      ? `Helps check mastery and review weak areas: ${weakAreas.join(", ")}.`
      : "Helps the learner practice and check understanding quickly.";
  }

  if (type === "video" && style === "visual") {
    return "Matches the learner's visual Teaching DNA preference.";
  }

  if (type === "diagram") {
    return "Supports visual learning with a quick low-bandwidth reference.";
  }

  if (type === "article" || type === "summary") {
    return "Works well for low-bandwidth review and saved offline notes.";
  }

  if (type === "project") {
    return "Builds practical understanding through hands-on application.";
  }

  return "Matches the learner's Teaching DNA and current study goal.";
}

function normalizeCandidateResource(resource = {}, options = {}) {
  const type = normalizeResourceType(resource.type || resource.kind || resource.category);
  const metadata = RESOURCE_TYPES[type] || RESOURCE_TYPES.summary;
  const title = toPlainText(resource.title || resource.name) || `${metadata.label} resource`;
  const tags = uniqueList(resource.tags || resource.topics || resource.keywords, 8);

  return {
    id: toPlainText(resource.id) || `candidate-${slugify(title) || slugify(type)}`,
    type,
    title,
    description: toPlainText(resource.description || resource.summary),
    url: toPlainText(resource.url || resource.link) || null,
    searchQuery:
      toPlainText(resource.searchQuery || resource.query) ||
      buildSearchQuery(
        {
          ...options,
          topic: toPlainText(resource.topic) || options.topic
        },
        type
      ),
    provider: toPlainText(resource.provider || resource.source) || "provided",
    difficulty: toPlainText(resource.difficulty || options.difficulty) || "beginner",
    estimatedMinutes: Math.round(
      clamp(resource.estimatedMinutes || resource.minutes, 1, 180, estimateMinutes(type, options.difficulty))
    ),
    lowBandwidth:
      resource.lowBandwidth === undefined ? metadata.lowBandwidth : Boolean(resource.lowBandwidth),
    offlineAvailable:
      resource.offlineAvailable === undefined
        ? Boolean(resource.cached || metadata.offlineFriendly)
        : Boolean(resource.offlineAvailable),
    reason: toPlainText(resource.reason || resource.whyRecommended),
    tags,
    score: clamp(resource.score, 0, 1, null)
  };
}

function scoreCandidateResource(resource, options) {
  const normalizedResource = normalizeCandidateResource(resource, options);
  const originalSearchQuery = toPlainText(resource && (resource.searchQuery || resource.query));
  const searchableText = [
    normalizedResource.title,
    normalizedResource.description,
    normalizedResource.tags.join(" "),
    originalSearchQuery
  ]
    .join(" ")
    .toLowerCase();
  let score = normalizedResource.score === null ? 0.35 : normalizedResource.score;

  if (searchableText.includes(options.subject.toLowerCase())) {
    score += 0.2;
  }

  if (searchableText.includes(options.topic.toLowerCase())) {
    score += 0.2;
  }

  if (getRecommendedTypes(options).includes(normalizedResource.type)) {
    score += 0.15;
  }

  if (options.lowBandwidthMode && normalizedResource.lowBandwidth) {
    score += 0.1;
  }

  if (options.includeOfflineResources && normalizedResource.offlineAvailable) {
    score += 0.1;
  }

  if (options.excludedTypes.includes(normalizedResource.type)) {
    score = -1;
  }

  return {
    ...normalizedResource,
    reason:
      normalizedResource.reason ||
      buildRecommendationReason(normalizedResource.type, options),
    score: Number(Math.min(1, score).toFixed(2))
  };
}

function rankAvailableResources(options = {}) {
  const normalizedOptions = normalizeRecommendationOptions(options);

  return normalizedOptions.availableResources
    .map((resource) => scoreCandidateResource(resource, normalizedOptions))
    .filter((resource) => resource.score >= 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, normalizedOptions.limit);
}

function buildFallbackRecommendations(options = {}) {
  const normalizedOptions = normalizeRecommendationOptions({
    ...options,
    source: "fallback"
  });
  const rankedResources = rankAvailableResources(normalizedOptions);
  const recommendedTypes = getRecommendedTypes(normalizedOptions);
  const generatedResources = recommendedTypes
    .slice(0, normalizedOptions.limit)
    .map((type, index) => buildFallbackRecommendation(type, index, normalizedOptions));
  const recommendations = [...rankedResources, ...generatedResources]
    .sort((left, right) => right.score - left.score)
    .slice(0, normalizedOptions.limit);

  return normalizeResourceRecommendationResult(
    {
      subject: normalizedOptions.subject,
      topic: normalizedOptions.topic,
      language: normalizedOptions.language,
      recommendations,
      studyActions: buildStudyActions(normalizedOptions),
      reviewPlan: buildReviewPlan(normalizedOptions)
    },
    normalizedOptions
  );
}

function buildStudyActions(options) {
  return [
    `Use one resource for ${options.topic}, then write a 3-sentence summary.`,
    "Answer a short practice check after studying.",
    "Save useful notes for offline review."
  ];
}

function buildReviewPlan(options) {
  const weakAreaStep = options.weakAreas.length > 0
    ? `Review weak areas first: ${options.weakAreas.slice(0, 3).join(", ")}.`
    : `Review ${options.topic} again after 24 hours.`;

  return [
    weakAreaStep,
    "Use flashcards or a quick quiz for spaced recall.",
    "Ask the AI tutor to explain any missed question."
  ];
}

function normalizeResourceRecommendation(resource, index, options) {
  const normalizedResource = normalizeCandidateResource(resource, options);
  const type = normalizeResourceType(normalizedResource.type);
  const metadata = RESOURCE_TYPES[type] || RESOURCE_TYPES.summary;

  return {
    id: normalizedResource.id || `resource-${index + 1}-${slugify(type)}`,
    type,
    title: normalizedResource.title || `${metadata.label}: ${options.topic}`,
    description:
      normalizedResource.description ||
      `Recommended ${metadata.label.toLowerCase()} for ${options.topic}.`,
    url: normalizedResource.url,
    searchQuery: normalizedResource.searchQuery || buildSearchQuery(options, type),
    provider: normalizedResource.provider || "search",
    difficulty: normalizedResource.difficulty || options.difficulty,
    estimatedMinutes:
      normalizedResource.estimatedMinutes || estimateMinutes(type, options.difficulty),
    lowBandwidth:
      normalizedResource.lowBandwidth === undefined
        ? metadata.lowBandwidth
        : Boolean(normalizedResource.lowBandwidth),
    offlineAvailable:
      normalizedResource.offlineAvailable === undefined
        ? metadata.offlineFriendly
        : Boolean(normalizedResource.offlineAvailable),
    reason: normalizedResource.reason || buildRecommendationReason(type, options),
    tags: uniqueList([normalizedResource.tags, options.subject, options.topic, type].flat(), 8),
    score: clamp(normalizedResource.score, 0, 1, Number((0.9 - index * 0.04).toFixed(2)))
  };
}

function normalizeResourceRecommendationResult(rawResult = {}, options = {}) {
  const normalizedOptions = normalizeRecommendationOptions(options);
  const recommendations = toArray(rawResult.recommendations || rawResult.resources)
    .map((resource, index) => normalizeResourceRecommendation(resource, index, normalizedOptions))
    .filter((resource) => resource.title && (resource.url || resource.searchQuery))
    .sort((left, right) => right.score - left.score)
    .slice(0, normalizedOptions.limit);
  const safeRecommendations = recommendations.length > 0
    ? recommendations
    : getRecommendedTypes(normalizedOptions)
        .slice(0, normalizedOptions.limit)
        .map((type, index) => buildFallbackRecommendation(type, index, normalizedOptions));
  const studyActions = uniqueList(rawResult.studyActions, 6);
  const reviewPlan = uniqueList(rawResult.reviewPlan, 6);

  return {
    subject: toPlainText(rawResult.subject) || normalizedOptions.subject,
    topic: toPlainText(rawResult.topic) || normalizedOptions.topic,
    goal: normalizedOptions.goal,
    language: toPlainText(rawResult.language) || normalizedOptions.language,
    recommendations: safeRecommendations,
    studyActions: studyActions.length > 0 ? studyActions : buildStudyActions(normalizedOptions),
    reviewPlan: reviewPlan.length > 0 ? reviewPlan : buildReviewPlan(normalizedOptions),
    teachingDNA: buildTeachingDNAContext(normalizedOptions.teachingDNA),
    metadata: {
      generatedAt: new Date().toISOString(),
      source: normalizedOptions.source,
      lowBandwidthMode: normalizedOptions.lowBandwidthMode,
      personalityId: normalizedOptions.personalityId,
      availableResourceCount: normalizedOptions.availableResources.length
    }
  };
}

async function generateResourceRecommendations(options = {}) {
  const normalizedOptions = normalizeRecommendationOptions(options);

  if (options.useGemini === false || options.useAI === false) {
    return buildFallbackRecommendations(normalizedOptions);
  }

  try {
    const response = await sendChatMessage({
      apiKey: options.apiKey,
      fetch: options.fetch,
      model: options.model,
      timeoutMs: options.timeoutMs,
      message: buildResourcePrompt(normalizedOptions),
      personalityId: normalizedOptions.personalityId,
      teachingDNA: normalizedOptions.teachingDNA,
      context: {
        feature: "Resource Recommendation Engine",
        subject: normalizedOptions.subject,
        topic: normalizedOptions.topic,
        lowBandwidthMode: normalizedOptions.lowBandwidthMode
      },
      generationConfig: {
        temperature: options.temperature === undefined ? 0.35 : options.temperature,
        maxOutputTokens: options.maxOutputTokens || 3000,
        response_mime_type: "application/json"
      }
    });
    const parsed = extractJson(response.text);

    if (!parsed) {
      throw new ResourceRecommendationError(
        "Gemini returned recommendations that were not valid JSON.",
        { details: response.text }
      );
    }

    return normalizeResourceRecommendationResult(parsed, {
      ...normalizedOptions,
      source: "gemini"
    });
  } catch (error) {
    if (options.fallbackOnError === false) {
      throw error;
    }

    const fallback = buildFallbackRecommendations({
      ...normalizedOptions,
      source: "fallback"
    });

    return {
      ...fallback,
      metadata: {
        ...fallback.metadata,
        fallbackReason: error.message
      }
    };
  }
}

async function recommendResources(options = {}) {
  return generateResourceRecommendations(options);
}

function createResourceRecommendationEngine(defaultOptions = {}) {
  return {
    recommendResources(options = {}) {
      return recommendResources({
        ...defaultOptions,
        ...options
      });
    },

    generateResourceRecommendations(options = {}) {
      return generateResourceRecommendations({
        ...defaultOptions,
        ...options
      });
    },

    rankAvailableResources(options = {}) {
      return rankAvailableResources({
        ...defaultOptions,
        ...options
      });
    },

    buildPrompt(options = {}) {
      return buildResourcePrompt({
        ...defaultOptions,
        ...options
      });
    }
  };
}

module.exports = {
  RESOURCE_TYPES,
  DEFAULT_RESOURCE_OPTIONS,
  ResourceRecommendationError,
  createResourceRecommendationEngine,
  generateResourceRecommendations,
  recommendResources,
  buildResourcePrompt,
  buildRecommendationContext,
  buildFallbackRecommendations,
  normalizeResourceRecommendationResult,
  normalizeResourceType,
  getRecommendedTypes,
  rankAvailableResources,
  extractJson
};
