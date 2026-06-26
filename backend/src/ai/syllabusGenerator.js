const { sendChatMessage } = require("./geminiClient");
const {
  buildTeachingDNAContext,
  getTeachingRecommendations,
  normalizeTeachingDNA
} = require("./teachingDNA");
const { normalizePersonalityId } = require("./personalities");

const DEFAULT_DURATION_WEEKS = Number(process.env.AI_SYLLABUS_DEFAULT_DURATION_WEEKS) || 4;
const DEFAULT_MAX_MODULES = Number(process.env.AI_SYLLABUS_MAX_MODULES) || 8;
const DEFAULT_LESSONS_PER_MODULE = 3;
const DEFAULT_HOURS_PER_WEEK = 5;

const DEFAULT_SYLLABUS_OPTIONS = Object.freeze({
  durationWeeks: DEFAULT_DURATION_WEEKS,
  maxModules: DEFAULT_MAX_MODULES,
  lessonsPerModule: DEFAULT_LESSONS_PER_MODULE,
  hoursPerWeek: DEFAULT_HOURS_PER_WEEK,
  includeAssessments: true,
  includeOfflineTasks: true,
  lowBandwidthMode: process.env.AI_ENABLE_LOW_BANDWIDTH_MODE !== "false"
});

class SyllabusGeneratorError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "SyllabusGeneratorError";
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

function toPositiveInteger(value, fallback, min = 1, max = 52) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
}

function clamp(value, min, max, fallback) {
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

function assertSubject(subject) {
  if (!toPlainText(subject)) {
    throw new SyllabusGeneratorError("A subject or skill is required to generate a syllabus.");
  }
}

function normalizeGenerationOptions(options = {}) {
  assertSubject(options.subject || options.topic || options.skill);

  const teachingDNA = normalizeTeachingDNA(options.teachingDNA || {});
  const durationWeeks = toPositiveInteger(
    options.durationWeeks,
    DEFAULT_SYLLABUS_OPTIONS.durationWeeks,
    1,
    24
  );
  const maxModules = toPositiveInteger(
    options.maxModules,
    Math.min(DEFAULT_SYLLABUS_OPTIONS.maxModules, durationWeeks + 2),
    1,
    12
  );
  const lessonsPerModule = toPositiveInteger(
    options.lessonsPerModule,
    DEFAULT_SYLLABUS_OPTIONS.lessonsPerModule,
    1,
    6
  );

  return {
    subject: toPlainText(options.subject || options.topic || options.skill),
    goal: toPlainText(options.goal || options.learningGoal || options.objective),
    gradeLevel: toPlainText(options.gradeLevel || teachingDNA.gradeLevel),
    educationLevel: toPlainText(options.educationLevel || teachingDNA.educationLevel),
    targetLevel: toPlainText(options.targetLevel || options.targetDifficulty || teachingDNA.difficulty),
    durationWeeks,
    maxModules,
    lessonsPerModule,
    hoursPerWeek: clamp(
      options.hoursPerWeek || options.availableHoursPerWeek,
      1,
      40,
      DEFAULT_SYLLABUS_OPTIONS.hoursPerWeek
    ),
    includeAssessments: options.includeAssessments !== false,
    includeOfflineTasks: options.includeOfflineTasks !== false,
    lowBandwidthMode:
      options.lowBandwidthMode === undefined
        ? DEFAULT_SYLLABUS_OPTIONS.lowBandwidthMode
        : Boolean(options.lowBandwidthMode),
    teachingDNA,
    personalityId: normalizePersonalityId(options.personalityId || teachingDNA.personalityId),
    existingKnowledge: uniqueList(options.existingKnowledge || options.prerequisites),
    requiredTopics: uniqueList(options.requiredTopics || options.topics),
    deadlines: uniqueList(options.deadlines || options.examDates),
    constraints: uniqueList(options.constraints),
    source: options.source || "gemini"
  };
}

function buildSyllabusContext(options = {}) {
  const normalizedOptions = normalizeGenerationOptions(options);
  const teachingDNAContext = buildTeachingDNAContext(normalizedOptions.teachingDNA);

  return {
    subject: normalizedOptions.subject,
    goal: normalizedOptions.goal,
    gradeLevel: normalizedOptions.gradeLevel,
    educationLevel: normalizedOptions.educationLevel,
    targetLevel: normalizedOptions.targetLevel,
    durationWeeks: normalizedOptions.durationWeeks,
    hoursPerWeek: normalizedOptions.hoursPerWeek,
    requiredTopics: normalizedOptions.requiredTopics,
    existingKnowledge: normalizedOptions.existingKnowledge,
    deadlines: normalizedOptions.deadlines,
    constraints: normalizedOptions.constraints,
    lowBandwidthMode: normalizedOptions.lowBandwidthMode,
    teachingDNA: teachingDNAContext,
    teachingRecommendations: getTeachingRecommendations(normalizedOptions.teachingDNA)
  };
}

function buildSyllabusPrompt(options = {}) {
  const normalizedOptions = normalizeGenerationOptions(options);
  const context = buildSyllabusContext(normalizedOptions);

  return [
    "Create a personalized Learning DNA learning journey / syllabus.",
    "",
    "Return only valid JSON. Do not wrap it in markdown.",
    "",
    "Required JSON shape:",
    "{",
    '  "title": "string",',
    '  "subject": "string",',
    '  "goal": "string",',
    '  "durationWeeks": number,',
    '  "estimatedHours": number,',
    '  "level": "beginner | intermediate | advanced",',
    '  "language": "English | Filipino | Taglish",',
    '  "overview": "short mobile-friendly summary",',
    '  "modules": [',
    "    {",
    '      "id": "module-1",',
    '      "week": number,',
    '      "title": "string",',
    '      "objectives": ["string"],',
    '      "lessons": [{"title": "string", "summary": "string", "activity": "string"}],',
    '      "practice": ["string"],',
    '      "assessment": {"type": "quiz | project | reflection", "description": "string"},',
    '      "offlineTasks": ["string"],',
    '      "resources": [{"type": "video | article | quiz | flashcards | summary | project", "query": "string", "lowBandwidth": boolean}]',
    "    }",
    "  ],",
    '  "milestones": [{"week": number, "title": "string", "successCriteria": ["string"]}],',
    '  "reviewPlan": ["string"],',
    '  "adaptiveNotes": ["string"]',
    "}",
    "",
    "Project requirements:",
    "- Optimize for Filipino learners and mobile use.",
    "- Support English, Filipino, and Taglish preferences.",
    "- Adapt to Teaching DNA: learning style, difficulty, pace, weak areas, resource preferences, daily routine, and burnout risk.",
    "- Include practice exercises, quizzes or flashcards, review sessions, and offline-friendly tasks.",
    "- Keep each lesson concise enough for a mobile learning session.",
    "- Prefer low-bandwidth resources when lowBandwidthMode is true.",
    "",
    `Syllabus context: ${JSON.stringify(context)}`
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

function normalizeLesson(lesson, index) {
  if (typeof lesson === "string") {
    return {
      title: lesson,
      summary: "",
      activity: "Study the concept, then explain it in your own words."
    };
  }

  return {
    title: toPlainText(lesson && lesson.title) || `Lesson ${index + 1}`,
    summary: toPlainText(lesson && lesson.summary),
    activity:
      toPlainText(lesson && lesson.activity) ||
      "Answer one quick check question and write a short takeaway."
  };
}

function normalizeAssessment(assessment, moduleTitle) {
  if (!assessment) {
    return {
      type: "quiz",
      description: `Short mastery check for ${moduleTitle}.`
    };
  }

  if (typeof assessment === "string") {
    return {
      type: "quiz",
      description: assessment
    };
  }

  return {
    type: toPlainText(assessment.type) || "quiz",
    description:
      toPlainText(assessment.description) ||
      toPlainText(assessment.prompt) ||
      `Short mastery check for ${moduleTitle}.`
  };
}

function normalizeResourceType(type) {
  const normalizedType = toPlainText(type).toLowerCase();
  const aliases = {
    videos: "video",
    video: "video",
    articles: "article",
    article: "article",
    quizzes: "quiz",
    quiz: "quiz",
    drills: "quiz",
    flashcard: "flashcards",
    flashcards: "flashcards",
    summaries: "summary",
    summary: "summary",
    projects: "project",
    project: "project"
  };

  return aliases[normalizedType] || normalizedType || "summary";
}

function normalizeResource(resource, fallbackType = "summary") {
  const normalizedFallbackType = normalizeResourceType(fallbackType);

  if (typeof resource === "string") {
    return {
      type: normalizedFallbackType,
      query: resource,
      lowBandwidth: normalizedFallbackType !== "video"
    };
  }

  const type = normalizeResourceType(resource && resource.type) || normalizedFallbackType;

  return {
    type,
    query: toPlainText(resource && (resource.query || resource.title || resource.url)),
    lowBandwidth: resource && resource.lowBandwidth !== undefined
      ? Boolean(resource.lowBandwidth)
      : type !== "video"
  };
}

function normalizeModule(module, index, options) {
  const title = toPlainText(module && module.title) || `Module ${index + 1}`;
  const lessons = toArray(module && module.lessons)
    .slice(0, options.lessonsPerModule)
    .map(normalizeLesson);

  return {
    id: toPlainText(module && module.id) || `module-${index + 1}`,
    week: toPositiveInteger(module && module.week, Math.min(index + 1, options.durationWeeks), 1, options.durationWeeks),
    title,
    objectives: uniqueList(module && module.objectives, 5),
    lessons: lessons.length > 0 ? lessons : buildFallbackLessons(title, options),
    practice: uniqueList(module && module.practice, 6),
    assessment: normalizeAssessment(module && module.assessment, title),
    offlineTasks: uniqueList(module && module.offlineTasks, 5),
    resources: toArray(module && module.resources)
      .slice(0, 5)
      .map((resource) => normalizeResource(resource))
      .filter((resource) => resource.query)
  };
}

function buildFallbackTopicList(options) {
  const requiredTopics = uniqueList(options.requiredTopics);

  if (requiredTopics.length > 0) {
    return requiredTopics;
  }

  const subject = options.subject;

  return [
    `${subject} foundations`,
    `Core concepts in ${subject}`,
    `Guided examples for ${subject}`,
    `${subject} practice and problem solving`,
    `Common mistakes in ${subject}`,
    `${subject} review and mastery`
  ];
}

function buildFallbackLessons(moduleTitle, options) {
  const templates = [
    {
      title: `${moduleTitle}: key idea`,
      summary: "Understand the most important concept in plain language.",
      activity: "Write a one-sentence explanation and one example."
    },
    {
      title: `${moduleTitle}: worked example`,
      summary: "Study a guided example and identify each step.",
      activity: "Solve a similar example with notes."
    },
    {
      title: `${moduleTitle}: practice`,
      summary: "Use practice to check understanding and reveal weak spots.",
      activity: "Complete a short drill, then review mistakes."
    }
  ];

  return templates.slice(0, options.lessonsPerModule);
}

function getResourceTypes(options) {
  const resources = uniqueList(options.teachingDNA.resourcePreferences || ["summaries", "quizzes"]);

  if (options.lowBandwidthMode) {
    return uniqueList(["summaries", "articles", "quizzes", "flashcards", resources].flat(), 5);
  }

  return uniqueList([resources, "videos", "articles", "quizzes"].flat(), 5);
}

function buildFallbackModule(topic, index, options) {
  const resourceTypes = getResourceTypes(options);
  const isFinalModule = index === (options.moduleCount || options.maxModules) - 1;

  return {
    id: `module-${index + 1}`,
    week: Math.min(index + 1, options.durationWeeks),
    title: topic,
    objectives: [
      `Explain ${topic} clearly.`,
      `Apply ${topic} in a short practice task.`,
      `Identify common mistakes related to ${topic}.`
    ],
    lessons: buildFallbackLessons(topic, options),
    practice: [
      `Answer 5 quick questions about ${topic}.`,
      `Create 3 flashcards for important terms.`,
      `Teach ${topic} back in ${options.teachingDNA.language || "English"}.`
    ],
    assessment: {
      type: isFinalModule ? "project" : "quiz",
      description:
        isFinalModule
          ? `Complete a mini project or final review task for ${options.subject}.`
          : `Take a short quiz and review mistakes before moving on.`
    },
    offlineTasks: [
      `Save notes for ${topic} for offline review.`,
      `Write a summary without opening online resources.`,
      "Mark confusing points for the next AI chat session."
    ],
    resources: resourceTypes.slice(0, 3).map((type) => ({
      type: normalizeResourceType(type),
      query: `${options.subject} ${topic} ${type}`,
      lowBandwidth: options.lowBandwidthMode || normalizeResourceType(type) !== "video"
    }))
  };
}

function buildFallbackSyllabus(options = {}) {
  const normalizedOptions = normalizeGenerationOptions({
    ...options,
    source: "fallback"
  });
  const topics = buildFallbackTopicList(normalizedOptions).slice(0, normalizedOptions.maxModules);
  const moduleOptions = {
    ...normalizedOptions,
    moduleCount: topics.length
  };
  const modules = topics.map((topic, index) => buildFallbackModule(topic, index, moduleOptions));

  return normalizeSyllabus(
    {
      title: `${normalizedOptions.subject} Learning Journey`,
      subject: normalizedOptions.subject,
      goal:
        normalizedOptions.goal ||
        `Build a practical understanding of ${normalizedOptions.subject}.`,
      durationWeeks: normalizedOptions.durationWeeks,
      estimatedHours: normalizedOptions.durationWeeks * normalizedOptions.hoursPerWeek,
      level: normalizedOptions.targetLevel,
      language: normalizedOptions.teachingDNA.language,
      overview: `A ${normalizedOptions.durationWeeks}-week adaptive syllabus for ${normalizedOptions.subject}, tuned to the learner's Teaching DNA.`,
      modules,
      milestones: modules.map((module) => ({
        week: module.week,
        title: `Complete ${module.title}`,
        successCriteria: [
          "Finish lessons and practice.",
          "Score at least 70% on the module check.",
          "List one weak area to review."
        ]
      })),
      reviewPlan: [
        "Review weak areas after every quiz.",
        "Use spaced review at the end of each week.",
        "Ask the AI tutor for a simpler explanation when mastery is below 70%."
      ],
      adaptiveNotes: getTeachingRecommendations(normalizedOptions.teachingDNA)
    },
    normalizedOptions
  );
}

function normalizeSyllabus(rawSyllabus = {}, options = {}) {
  const normalizedOptions = normalizeGenerationOptions(options);
  const modules = toArray(rawSyllabus.modules)
    .slice(0, normalizedOptions.maxModules)
    .map((module, index) => normalizeModule(module, index, normalizedOptions));
  const safeModules = modules.length > 0
    ? modules
    : buildFallbackTopicList(normalizedOptions)
        .slice(0, normalizedOptions.maxModules)
        .map((topic, index, topics) =>
          buildFallbackModule(topic, index, {
            ...normalizedOptions,
            moduleCount: topics.length
          })
        );
  const milestones = toArray(rawSyllabus.milestones).map((milestone, index) => ({
    week: toPositiveInteger(milestone && milestone.week, Math.min(index + 1, normalizedOptions.durationWeeks), 1, normalizedOptions.durationWeeks),
    title: toPlainText(milestone && milestone.title) || `Milestone ${index + 1}`,
    successCriteria: uniqueList(milestone && milestone.successCriteria, 5)
  }));
  const fallbackMilestones = safeModules.map((module) => ({
    week: module.week,
    title: `Complete ${module.title}`,
    successCriteria: [
      "Finish lessons and practice.",
      "Complete the module assessment.",
      "Identify one concept to review."
    ]
  }));
  const reviewPlan = uniqueList(rawSyllabus.reviewPlan, 8);
  const adaptiveNotes = uniqueList(rawSyllabus.adaptiveNotes, 10);

  return {
    id: rawSyllabus.id || `journey-${slugify(normalizedOptions.subject) || "learning"}`,
    title: toPlainText(rawSyllabus.title) || `${normalizedOptions.subject} Learning Journey`,
    subject: toPlainText(rawSyllabus.subject) || normalizedOptions.subject,
    goal:
      toPlainText(rawSyllabus.goal) ||
      normalizedOptions.goal ||
      `Learn ${normalizedOptions.subject} with a personalized plan.`,
    durationWeeks: toPositiveInteger(
      rawSyllabus.durationWeeks,
      normalizedOptions.durationWeeks,
      1,
      24
    ),
    estimatedHours: clamp(
      rawSyllabus.estimatedHours,
      1,
      500,
      normalizedOptions.durationWeeks * normalizedOptions.hoursPerWeek
    ),
    level: toPlainText(rawSyllabus.level) || normalizedOptions.targetLevel,
    language: toPlainText(rawSyllabus.language) || normalizedOptions.teachingDNA.language,
    overview:
      toPlainText(rawSyllabus.overview) ||
      `Personalized syllabus for ${normalizedOptions.subject}.`,
    modules: safeModules,
    milestones: milestones.length > 0 ? milestones : fallbackMilestones,
    reviewPlan: reviewPlan.length > 0
      ? reviewPlan
      : [
          "Review weak areas after every quiz.",
          "Use spaced review at the end of each week.",
          "Ask the AI tutor for another explanation when a concept is unclear."
        ],
    adaptiveNotes: adaptiveNotes.length > 0
      ? adaptiveNotes
      : getTeachingRecommendations(normalizedOptions.teachingDNA),
    teachingDNA: buildTeachingDNAContext(normalizedOptions.teachingDNA),
    metadata: {
      generatedAt: new Date().toISOString(),
      source: normalizedOptions.source,
      lowBandwidthMode: normalizedOptions.lowBandwidthMode,
      personalityId: normalizedOptions.personalityId
    }
  };
}

async function generateSyllabus(options = {}) {
  const normalizedOptions = normalizeGenerationOptions(options);

  if (options.useGemini === false || options.useAI === false) {
    return buildFallbackSyllabus(normalizedOptions);
  }

  try {
    const response = await sendChatMessage({
      apiKey: options.apiKey,
      fetch: options.fetch,
      model: options.model,
      timeoutMs: options.timeoutMs,
      message: buildSyllabusPrompt(normalizedOptions),
      personalityId: normalizedOptions.personalityId,
      teachingDNA: normalizedOptions.teachingDNA,
      context: {
        feature: "Learning Journey Generator",
        subject: normalizedOptions.subject,
        durationWeeks: normalizedOptions.durationWeeks,
        lowBandwidthMode: normalizedOptions.lowBandwidthMode
      },
      generationConfig: {
        temperature: options.temperature === undefined ? 0.4 : options.temperature,
        maxOutputTokens: options.maxOutputTokens || 4000,
        response_mime_type: "application/json"
      }
    });
    const parsed = extractJson(response.text);

    if (!parsed) {
      throw new SyllabusGeneratorError("Gemini returned a syllabus that was not valid JSON.", {
        details: response.text
      });
    }

    return normalizeSyllabus(parsed, {
      ...normalizedOptions,
      source: "gemini"
    });
  } catch (error) {
    if (options.fallbackOnError === false) {
      throw error;
    }

    const fallback = buildFallbackSyllabus({
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

async function generateLearningJourney(options = {}) {
  return generateSyllabus(options);
}

function createSyllabusGenerator(defaultOptions = {}) {
  return {
    generateSyllabus(options = {}) {
      return generateSyllabus({
        ...defaultOptions,
        ...options
      });
    },

    generateLearningJourney(options = {}) {
      return generateLearningJourney({
        ...defaultOptions,
        ...options
      });
    },

    buildPrompt(options = {}) {
      return buildSyllabusPrompt({
        ...defaultOptions,
        ...options
      });
    }
  };
}

module.exports = {
  DEFAULT_SYLLABUS_OPTIONS,
  SyllabusGeneratorError,
  createSyllabusGenerator,
  generateSyllabus,
  generateLearningJourney,
  buildSyllabusPrompt,
  buildSyllabusContext,
  buildFallbackSyllabus,
  normalizeSyllabus,
  extractJson
};
