const {
  DEFAULT_PERSONALITY,
  normalizePersonalityId
} = require("./personalities");

const DEFAULT_LANGUAGE = "English";
const DEFAULT_COMMUNICATION_STYLE = "friendly";
const DEFAULT_LEARNING_STYLE = "mixed";
const DEFAULT_DIFFICULTY = "beginner";
const DEFAULT_PACE = "moderate";

const LEARNING_STYLES = Object.freeze({
  visual: {
    id: "visual",
    label: "Visual",
    description: "Learns best with diagrams, mental images, charts, and spatial examples.",
    teachingHints: [
      "Use visual analogies and describe diagrams clearly.",
      "Break abstract ideas into visible parts or flows.",
      "Recommend videos, diagrams, and infographics when useful."
    ],
    resourcePreferences: ["videos", "diagrams", "infographics"]
  },
  stepByStep: {
    id: "stepByStep",
    label: "Step-by-step",
    description: "Learns best when procedures are explained in a clear sequence.",
    teachingHints: [
      "Explain one step at a time.",
      "Show the reasoning between steps.",
      "Use numbered solutions for processes and problems."
    ],
    resourcePreferences: ["worked examples", "guided exercises", "checklists"]
  },
  practical: {
    id: "practical",
    label: "Practical",
    description: "Learns best with real-world use cases and hands-on application.",
    teachingHints: [
      "Connect concepts to real-life situations.",
      "Use practical examples before theory when possible.",
      "Suggest small projects or applied exercises."
    ],
    resourcePreferences: ["projects", "case studies", "hands-on exercises"]
  },
  storytelling: {
    id: "storytelling",
    label: "Storytelling",
    description: "Learns best through narratives, analogies, and memorable scenarios.",
    teachingHints: [
      "Use short stories or analogies to introduce hard concepts.",
      "Make examples memorable without sacrificing accuracy.",
      "Summarize the lesson as a simple mental model."
    ],
    resourcePreferences: ["explainers", "examples", "analogies"]
  },
  interactive: {
    id: "interactive",
    label: "Interactive",
    description: "Learns best through questions, checks for understanding, and dialogue.",
    teachingHints: [
      "Ask focused follow-up questions when helpful.",
      "Use quick knowledge checks.",
      "Invite the learner to try the next step."
    ],
    resourcePreferences: ["practice prompts", "quizzes", "discussion questions"]
  },
  practiceFirst: {
    id: "practiceFirst",
    label: "Practice-first",
    description: "Learns best by attempting problems first, then reviewing mistakes.",
    teachingHints: [
      "Give a short practice task before lengthy explanation.",
      "Correct mistakes directly and explain the pattern.",
      "Recommend drills, flashcards, and spaced review."
    ],
    resourcePreferences: ["quizzes", "flashcards", "drills"]
  },
  reading: {
    id: "reading",
    label: "Reading",
    description: "Learns best through written explanations, notes, and structured summaries.",
    teachingHints: [
      "Use concise written explanations.",
      "Provide summaries and key terms.",
      "Recommend articles, notes, and references."
    ],
    resourcePreferences: ["articles", "notes", "summaries"]
  },
  mixed: {
    id: "mixed",
    label: "Mixed",
    description: "Uses a balanced blend of explanation, examples, and practice.",
    teachingHints: [
      "Combine explanation, examples, and practice.",
      "Adjust based on learner feedback.",
      "Offer different formats when the learner seems stuck."
    ],
    resourcePreferences: ["videos", "articles", "practice exercises"]
  }
});

const DIFFICULTY_LEVELS = Object.freeze(["beginner", "intermediate", "advanced"]);
const PACE_LEVELS = Object.freeze(["slow", "moderate", "fast"]);
const LANGUAGES = Object.freeze(["English", "Filipino", "Taglish"]);
const COMMUNICATION_STYLES = Object.freeze([
  "formal",
  "casual",
  "genZ",
  "professional",
  "friendly",
  "motivational"
]);

const DEFAULT_DAILY_ROUTINE = Object.freeze({
  preferredStudyTime: null,
  energyPattern: "unknown",
  sleepTime: null,
  wakeTime: null,
  availableHours: [],
  routines: [],
  timezone: null
});

const DEFAULT_MOTIVATION_PROFILE = Object.freeze({
  motivationLevel: "unknown",
  burnoutRisk: "unknown",
  inactivityDays: 0,
  lastEncouragementAt: null,
  lastMilestone: null,
  milestones: [],
  decliningPerformance: false
});

const DEFAULT_RESOURCE_SCORES = Object.freeze({
  videos: 0.5,
  articles: 0.5,
  quizzes: 0.5,
  flashcards: 0.5,
  projects: 0.5,
  summaries: 0.5
});

const DEFAULT_TEACHING_DNA = Object.freeze({
  learningStyle: DEFAULT_LEARNING_STYLE,
  difficulty: DEFAULT_DIFFICULTY,
  pace: DEFAULT_PACE,
  language: DEFAULT_LANGUAGE,
  communicationStyle: DEFAULT_COMMUNICATION_STYLE,
  gradeLevel: null,
  educationLevel: null,
  personalityId: DEFAULT_PERSONALITY,
  motivationStyle: "encouraging",
  focusMode: "balanced",
  goals: [],
  subjects: [],
  strengths: [],
  weakAreas: [],
  resourcePreferences: LEARNING_STYLES[DEFAULT_LEARNING_STYLE].resourcePreferences,
  preferredResources: DEFAULT_RESOURCE_SCORES,
  schedulePreferences: {},
  dailyRoutine: DEFAULT_DAILY_ROUTINE,
  motivationProfile: DEFAULT_MOTIVATION_PROFILE,
  performance: {
    quizAverage: null,
    masteryLevel: "unknown",
    consistency: "unknown",
    streakDays: 0,
    completedSessions: 0,
    missedSessions: 0
  },
  profileConfidence: 0.35,
  adaptationHistory: [],
  revision: 1
});

function nowIso(now = new Date()) {
  if (now instanceof Date) {
    return now.toISOString();
  }

  return new Date(now).toISOString();
}

function toArray(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined && item !== null && item !== "");
  }

  return [value];
}

function uniqueList(values, limit = 12) {
  const seen = new Set();
  const result = [];

  toArray(values).forEach((value) => {
    const text = String(value).trim();
    const key = text.toLowerCase();

    if (text && !seen.has(key)) {
      seen.add(key);
      result.push(text);
    }
  });

  return result.slice(0, limit);
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function clamp(value, min, max) {
  const number = toNumber(value);

  if (number === null) {
    return null;
  }

  return Math.min(max, Math.max(min, number));
}

function average(values) {
  const numbers = values.map(toNumber).filter((value) => value !== null);

  if (numbers.length === 0) {
    return null;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeNullableText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function normalizeGradeLevel(source = {}, fallback = null) {
  return normalizeNullableText(
    pickFirst(
      source.gradeLevel,
      source.yearLevel,
      source.grade,
      source.schoolYear,
      source.academicYear,
      fallback
    )
  );
}

function normalizeEducationLevel(source = {}, fallback = null) {
  const value = pickFirst(
    source.educationLevel,
    source.studentLevel,
    source.academicLevel,
    source.schoolLevel,
    fallback
  );
  const key = normalizeKey(value);
  const aliases = {
    elementary: "Elementary",
    gradeschool: "Elementary",
    highschool: "High School",
    juniorhighschool: "Junior High School",
    seniorhighschool: "Senior High School",
    shs: "Senior High School",
    college: "College",
    university: "College",
    undergraduate: "College",
    professional: "Professional",
    certification: "Certification",
    selflearner: "Self-learner",
    selflearning: "Self-learner"
  };

  return aliases[key] || normalizeNullableText(value);
}

function normalizeEnergyPattern(value, fallback = "unknown") {
  const key = normalizeKey(value);
  const aliases = {
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
    lateNight: "night",
    latenight: "night",
    variable: "variable",
    varies: "variable",
    low: "low",
    high: "high",
    unknown: "unknown"
  };

  return aliases[key] || fallback;
}

function normalizeDailyRoutine(source = {}, fallback = DEFAULT_DAILY_ROUTINE) {
  const directRoutine = isPlainObject(source.dailyRoutine) ? source.dailyRoutine : {};
  const routine = isPlainObject(source.routine) ? source.routine : {};
  const schedulePreferences = isPlainObject(source.schedulePreferences)
    ? source.schedulePreferences
    : {};
  const schedule = isPlainObject(source.schedule) ? source.schedule : {};
  const merged = {
    ...fallback,
    ...schedulePreferences,
    ...schedule,
    ...routine,
    ...directRoutine
  };

  return {
    preferredStudyTime: normalizeNullableText(
      pickFirst(
        merged.preferredStudyTime,
        merged.studyTime,
        source.preferredStudyTime,
        source.studyTime
      )
    ),
    energyPattern: normalizeEnergyPattern(
      pickFirst(merged.energyPattern, merged.energyLevel, source.energyPattern, source.energyLevel),
      fallback.energyPattern || "unknown"
    ),
    sleepTime: normalizeNullableText(pickFirst(merged.sleepTime, source.sleepTime)),
    wakeTime: normalizeNullableText(pickFirst(merged.wakeTime, source.wakeTime)),
    availableHours: uniqueList(
      pickFirst(merged.availableHours, merged.freeTime, source.availableHours, source.freeTime)
    ),
    routines: uniqueList(pickFirst(merged.routines, merged.dailyRoutines, source.routines)),
    timezone: normalizeNullableText(pickFirst(merged.timezone, source.timezone))
  };
}

function normalizeMotivationLevel(value, fallback = "unknown") {
  const key = normalizeKey(value);
  const aliases = {
    low: "low",
    down: "low",
    tired: "low",
    medium: "medium",
    normal: "medium",
    okay: "medium",
    high: "high",
    motivated: "high",
    strong: "high",
    unknown: "unknown"
  };

  return aliases[key] || fallback;
}

function calculateBurnoutRisk(source = {}, performance = {}, fallback = "unknown") {
  const explicitRisk = normalizeKey(source.burnoutRisk);

  if (["low", "medium", "high"].includes(explicitRisk)) {
    return explicitRisk;
  }

  const stressLevel = clamp(source.stressLevel, 0, 10);
  const inactivityDays = toNumber(source.inactivityDays) || 0;
  const completedSessions = toNumber(performance.completedSessions) || 0;
  const missedSessions = toNumber(performance.missedSessions) || 0;
  const totalSessions = completedSessions + missedSessions;
  const missedRate = totalSessions > 0 ? missedSessions / totalSessions : 0;

  if (stressLevel >= 8 || inactivityDays >= 7 || missedRate >= 0.6) {
    return "high";
  }

  if (stressLevel >= 5 || inactivityDays >= 3 || missedRate >= 0.35) {
    return "medium";
  }

  if (stressLevel !== null || inactivityDays > 0 || totalSessions > 0) {
    return "low";
  }

  return fallback;
}

function normalizeMotivationProfile(source = {}, performance = {}, fallback = DEFAULT_MOTIVATION_PROFILE) {
  const directProfile = isPlainObject(source.motivationProfile)
    ? source.motivationProfile
    : {};
  const merged = {
    ...fallback,
    ...directProfile,
    ...source
  };

  return {
    motivationLevel: normalizeMotivationLevel(
      pickFirst(merged.motivationLevel, merged.motivation, merged.mood),
      fallback.motivationLevel || "unknown"
    ),
    burnoutRisk: calculateBurnoutRisk(merged, performance, fallback.burnoutRisk || "unknown"),
    inactivityDays: toNumber(merged.inactivityDays) || 0,
    lastEncouragementAt: normalizeNullableText(merged.lastEncouragementAt),
    lastMilestone: normalizeNullableText(pickFirst(merged.lastMilestone, merged.latestMilestone)),
    milestones: uniqueList(pickFirst(merged.milestones, merged.achievements)),
    decliningPerformance: Boolean(merged.decliningPerformance)
  };
}

function normalizeResourceName(resource) {
  const key = normalizeKey(resource);
  const aliases = {
    video: "videos",
    videos: "videos",
    diagram: "videos",
    diagrams: "videos",
    infographic: "videos",
    infographics: "videos",
    article: "articles",
    articles: "articles",
    reading: "articles",
    readings: "articles",
    notes: "summaries",
    summary: "summaries",
    summaries: "summaries",
    quiz: "quizzes",
    quizzes: "quizzes",
    drill: "quizzes",
    drills: "quizzes",
    exercise: "quizzes",
    exercises: "quizzes",
    flashcard: "flashcards",
    flashcards: "flashcards",
    project: "projects",
    projects: "projects",
    casestudy: "projects",
    casestudies: "projects"
  };

  return aliases[key] || key || null;
}

function normalizeResourceScores(value = {}, fallback = DEFAULT_RESOURCE_SCORES) {
  const scores = { ...fallback };

  if (Array.isArray(value)) {
    value.forEach((resource, index) => {
      const name = normalizeResourceName(resource);

      if (name) {
        scores[name] = Math.max(scores[name] || 0, Number((0.9 - index * 0.08).toFixed(2)));
      }
    });

    return scores;
  }

  if (!isPlainObject(value)) {
    return scores;
  }

  Object.entries(value).forEach(([resource, score]) => {
    const name = normalizeResourceName(resource);
    const normalizedScore = clamp(score, 0, 1);

    if (name && normalizedScore !== null) {
      scores[name] = Number(normalizedScore.toFixed(2));
    }
  });

  return scores;
}

function rankedResourcePreferences(scores = {}, limit = 6) {
  return Object.entries(scores)
    .sort((left, right) => right[1] - left[1])
    .map(([resource]) => resource)
    .slice(0, limit);
}

function buildInitialResourceScores(assessment = {}, learningStyle = DEFAULT_LEARNING_STYLE) {
  const styleResources = LEARNING_STYLES[learningStyle].resourcePreferences;
  const scores = normalizeResourceScores(
    assessment.preferredResources || assessment.resourceScores,
    DEFAULT_RESOURCE_SCORES
  );

  uniqueList(assessment.resourcePreferences || styleResources).forEach((resource) => {
    const name = normalizeResourceName(resource);

    if (name) {
      scores[name] = Math.max(scores[name] || 0, 0.75);
    }
  });

  return scores;
}

function updateResourceScores(currentScores = {}, signals = {}) {
  const scores = normalizeResourceScores(currentScores, DEFAULT_RESOURCE_SCORES);
  const explicitScores = signals.preferredResources || signals.resourceScores;

  if (explicitScores) {
    return normalizeResourceScores(explicitScores, scores);
  }

  const likedResources = uniqueList(
    [signals.likedResources, signals.completedResources, signals.helpfulResources].flat()
  );
  const dislikedResources = uniqueList(
    [signals.dislikedResources, signals.skippedResources, signals.unhelpfulResources].flat()
  );

  likedResources.forEach((resource) => {
    const name = normalizeResourceName(resource);

    if (name) {
      scores[name] = Number(Math.min(1, (scores[name] || 0.5) + 0.1).toFixed(2));
    }
  });

  dislikedResources.forEach((resource) => {
    const name = normalizeResourceName(resource);

    if (name) {
      scores[name] = Number(Math.max(0, (scores[name] || 0.5) - 0.12).toFixed(2));
    }
  });

  return scores;
}

function normalizeLearningStyle(value, fallback = DEFAULT_LEARNING_STYLE) {
  const key = normalizeKey(value);
  const aliases = {
    visual: "visual",
    diagram: "visual",
    diagrams: "visual",
    video: "visual",
    videos: "visual",
    stepbystep: "stepByStep",
    sequential: "stepByStep",
    procedural: "stepByStep",
    practical: "practical",
    realworld: "practical",
    handson: "practical",
    applied: "practical",
    storytelling: "storytelling",
    story: "storytelling",
    analogy: "storytelling",
    analogies: "storytelling",
    interactive: "interactive",
    socratic: "interactive",
    discussion: "interactive",
    practice: "practiceFirst",
    practicefirst: "practiceFirst",
    drills: "practiceFirst",
    quiz: "practiceFirst",
    quizzes: "practiceFirst",
    reading: "reading",
    read: "reading",
    articles: "reading",
    notes: "reading",
    mixed: "mixed",
    balanced: "mixed"
  };

  return aliases[key] || fallback;
}

function normalizeDifficulty(value, fallback = DEFAULT_DIFFICULTY) {
  const key = normalizeKey(value);
  const aliases = {
    easy: "beginner",
    basic: "beginner",
    beginner: "beginner",
    novice: "beginner",
    medium: "intermediate",
    normal: "intermediate",
    intermediate: "intermediate",
    hard: "advanced",
    difficult: "advanced",
    advanced: "advanced",
    expert: "advanced"
  };

  return aliases[key] || fallback;
}

function normalizePace(value, fallback = DEFAULT_PACE) {
  const key = normalizeKey(value);
  const aliases = {
    slow: "slow",
    slower: "slow",
    careful: "slow",
    moderate: "moderate",
    normal: "moderate",
    balanced: "moderate",
    medium: "moderate",
    fast: "fast",
    faster: "fast",
    quick: "fast",
    rapid: "fast"
  };

  return aliases[key] || fallback;
}

function normalizeLanguage(value, fallback = DEFAULT_LANGUAGE) {
  const key = normalizeKey(value);
  const aliases = {
    english: "English",
    en: "English",
    filipino: "Filipino",
    tagalog: "Filipino",
    fil: "Filipino",
    tl: "Filipino",
    taglish: "Taglish"
  };

  return aliases[key] || fallback;
}

function normalizeCommunicationStyle(value, fallback = DEFAULT_COMMUNICATION_STYLE) {
  const key = normalizeKey(value);
  const aliases = {
    formal: "formal",
    casual: "casual",
    genz: "genZ",
    genzstyle: "genZ",
    professional: "professional",
    friendly: "friendly",
    motivational: "motivational",
    motivating: "motivational"
  };

  return aliases[key] || fallback;
}

function flattenAssessment(assessment = {}) {
  return {
    ...assessment,
    ...(assessment.preferences || {}),
    ...(assessment.learningPreferences || {}),
    ...(assessment.communicationPreferences || {}),
    ...(assessment.answers || {})
  };
}

function scoreLearningStyles(source = {}) {
  const flattened = flattenAssessment(source);
  const scores = Object.keys(LEARNING_STYLES).reduce((result, style) => {
    result[style] = 0;
    return result;
  }, {});

  Object.entries(flattened).forEach(([key, value]) => {
    const normalizedKey = normalizeKey(key);
    const numericValue = clamp(value, 0, 10);
    const weight = numericValue === null ? (value ? 1 : 0) : numericValue;

    if (/(visual|diagram|image|video|chart|map)/.test(normalizedKey)) {
      scores.visual += weight;
    }

    if (/(step|sequence|procedure|logical|organized)/.test(normalizedKey)) {
      scores.stepByStep += weight;
    }

    if (/(practical|realworld|handson|project|application)/.test(normalizedKey)) {
      scores.practical += weight;
    }

    if (/(story|analogy|scenario|memorable)/.test(normalizedKey)) {
      scores.storytelling += weight;
    }

    if (/(interactive|question|discussion|talk|socratic)/.test(normalizedKey)) {
      scores.interactive += weight;
    }

    if (/(practice|quiz|drill|flashcard|exercise)/.test(normalizedKey)) {
      scores.practiceFirst += weight;
    }

    if (/(read|article|note|summary|text)/.test(normalizedKey)) {
      scores.reading += weight;
    }
  });

  return scores;
}

function inferLearningStyle(assessment = {}) {
  const explicitStyle = pickFirst(
    assessment.learningStyle,
    assessment.preferredLearningStyle,
    assessment.style
  );

  if (explicitStyle) {
    return normalizeLearningStyle(explicitStyle);
  }

  const scores = scoreLearningStyles(assessment);
  const sortedStyles = Object.entries(scores).sort((left, right) => right[1] - left[1]);

  if (!sortedStyles[0] || sortedStyles[0][1] <= 0) {
    return DEFAULT_LEARNING_STYLE;
  }

  return sortedStyles[0][0];
}

function normalizeScore(score, maxScore) {
  const numericScore = toNumber(score);

  if (numericScore === null) {
    return null;
  }

  const numericMax = toNumber(maxScore);

  if (numericMax && numericMax > 0) {
    return clamp((numericScore / numericMax) * 100, 0, 100);
  }

  return numericScore <= 1 ? clamp(numericScore * 100, 0, 100) : clamp(numericScore, 0, 100);
}

function extractQuizScores(input = {}) {
  const quizResults = toArray(input.quizResults || input.quizzes || input.results);

  return quizResults
    .map((result) => {
      if (typeof result === "number" || typeof result === "string") {
        return normalizeScore(result);
      }

      if (!result || typeof result !== "object") {
        return null;
      }

      return normalizeScore(
        pickFirst(result.score, result.percentage, result.grade, result.value),
        pickFirst(result.maxScore, result.total, result.outOf)
      );
    })
    .filter((score) => score !== null);
}

function inferDifficulty(assessment = {}) {
  const explicitDifficulty = pickFirst(
    assessment.difficulty,
    assessment.currentLevel,
    assessment.skillLevel,
    assessment.level
  );

  if (explicitDifficulty) {
    return normalizeDifficulty(explicitDifficulty);
  }

  const quizAverage = average([
    ...extractQuizScores(assessment),
    pickFirst(assessment.quizAverage, assessment.averageScore, assessment.performanceScore)
  ]);
  const confidence = clamp(assessment.confidence, 0, 10);

  if (quizAverage !== null) {
    if (quizAverage >= 85 && (confidence === null || confidence >= 7)) {
      return "advanced";
    }

    if (quizAverage >= 65) {
      return "intermediate";
    }

    return "beginner";
  }

  if (confidence !== null) {
    if (confidence >= 8) {
      return "advanced";
    }

    if (confidence >= 5) {
      return "intermediate";
    }
  }

  return DEFAULT_DIFFICULTY;
}

function inferPace(assessment = {}) {
  const explicitPace = pickFirst(
    assessment.pace,
    assessment.preferredPace,
    assessment.learningPace
  );

  if (explicitPace) {
    return normalizePace(explicitPace);
  }

  const flattened = flattenAssessment(assessment);
  const quizAverage = average(extractQuizScores(assessment));
  const confidence = clamp(assessment.confidence, 0, 10);

  if (flattened.tooFast || flattened.overwhelmed || flattened.needsMoreTime) {
    return "slow";
  }

  if (flattened.tooSlow || flattened.bored || flattened.wantsChallenge) {
    return "fast";
  }

  if (quizAverage !== null && quizAverage < 60) {
    return "slow";
  }

  if (quizAverage !== null && quizAverage >= 88 && (confidence === null || confidence >= 7)) {
    return "fast";
  }

  return DEFAULT_PACE;
}

function inferCommunicationStyle(assessment = {}) {
  const explicitStyle = pickFirst(
    assessment.communicationStyle,
    assessment.speakingStyle,
    assessment.tone,
    assessment.style
  );

  return normalizeCommunicationStyle(explicitStyle);
}

function inferLanguage(assessment = {}) {
  return normalizeLanguage(pickFirst(assessment.language, assessment.preferredLanguage));
}

function inferMotivationStyle(assessment = {}) {
  const key = normalizeKey(
    pickFirst(
      assessment.motivationStyle,
      assessment.accountabilityPreference,
      assessment.coachingPreference
    )
  );

  if (/(strict|accountability|discipline|push)/.test(key)) {
    return "accountability";
  }

  if (/(celebrate|reward|milestone|motivat)/.test(key)) {
    return "motivational";
  }

  if (/(gentle|support|encourag|calm)/.test(key)) {
    return "encouraging";
  }

  return "encouraging";
}

function inferFocusMode(assessment = {}) {
  const key = normalizeKey(pickFirst(assessment.focusMode, assessment.studyMode));

  if (/(exam|deadline|cram|test)/.test(key)) {
    return "examPrep";
  }

  if (/(deep|mastery|thorough)/.test(key)) {
    return "deepLearning";
  }

  if (/(review|retention|spaced)/.test(key)) {
    return "retention";
  }

  return "balanced";
}

function calculateConsistency(studyBehavior = {}) {
  const completedSessions = toNumber(studyBehavior.completedSessions) || 0;
  const missedSessions = toNumber(studyBehavior.missedSessions) || 0;
  const totalSessions = completedSessions + missedSessions;

  if (totalSessions === 0) {
    return "unknown";
  }

  const completionRate = completedSessions / totalSessions;

  if (completionRate >= 0.8) {
    return "strong";
  }

  if (completionRate >= 0.5) {
    return "uneven";
  }

  return "needs support";
}

function calculateMasteryLevel(quizAverage) {
  if (quizAverage === null || quizAverage === undefined) {
    return "unknown";
  }

  if (quizAverage >= 85) {
    return "strong";
  }

  if (quizAverage >= 65) {
    return "developing";
  }

  return "needs review";
}

function buildPerformanceSnapshot(input = {}) {
  const studyBehavior = input.studyBehavior || input.studyHabits || input;
  const quizAverage = average([
    ...extractQuizScores(input),
    pickFirst(input.quizAverage, input.averageScore, input.performanceScore)
  ]);

  return {
    quizAverage: quizAverage === null ? null : Math.round(quizAverage),
    masteryLevel: calculateMasteryLevel(quizAverage),
    consistency: calculateConsistency(studyBehavior),
    streakDays: toNumber(pickFirst(studyBehavior.streakDays, studyBehavior.streak)) || 0,
    completedSessions: toNumber(studyBehavior.completedSessions) || 0,
    missedSessions: toNumber(studyBehavior.missedSessions) || 0
  };
}

function calculateProfileConfidence(assessment = {}) {
  let score = 0.25;

  if (pickFirst(assessment.learningStyle, assessment.preferredLearningStyle)) {
    score += 0.2;
  }

  if (pickFirst(assessment.language, assessment.preferredLanguage)) {
    score += 0.1;
  }

  if (pickFirst(assessment.communicationStyle, assessment.speakingStyle)) {
    score += 0.1;
  }

  if (extractQuizScores(assessment).length > 0 || assessment.quizAverage !== undefined) {
    score += 0.2;
  }

  if (assessment.studyBehavior || assessment.studyHabits) {
    score += 0.1;
  }

  if (assessment.goals || assessment.subjects || assessment.weakAreas || assessment.strengths) {
    score += 0.05;
  }

  if (normalizeGradeLevel(assessment) || normalizeEducationLevel(assessment)) {
    score += 0.05;
  }

  if (assessment.dailyRoutine || assessment.routine || assessment.schedulePreferences) {
    score += 0.05;
  }

  return Number(Math.min(1, score).toFixed(2));
}

function buildAdaptationHistoryEntry(reason, changed = [], now = new Date(), details = {}) {
  return {
    date: nowIso(now),
    reason,
    changed: uniqueList(changed),
    details
  };
}

function createTeachingDNAProfile(assessment = {}, options = {}) {
  const timestamp = nowIso(options.now);
  const learningStyle = inferLearningStyle(assessment);
  const performance = buildPerformanceSnapshot(assessment);
  const preferredResources = buildInitialResourceScores(assessment, learningStyle);

  return {
    ...DEFAULT_TEACHING_DNA,
    userId: assessment.userId || options.userId || null,
    learningStyle,
    difficulty: inferDifficulty(assessment),
    pace: inferPace(assessment),
    language: inferLanguage(assessment),
    communicationStyle: inferCommunicationStyle(assessment),
    gradeLevel: normalizeGradeLevel(assessment),
    educationLevel: normalizeEducationLevel(assessment),
    personalityId: normalizePersonalityId(
      pickFirst(assessment.personalityId, assessment.preferredTutor, options.personalityId)
    ),
    motivationStyle: inferMotivationStyle(assessment),
    focusMode: inferFocusMode(assessment),
    goals: uniqueList(assessment.goals || assessment.learningGoals),
    subjects: uniqueList(assessment.subjects || assessment.currentSubjects),
    strengths: uniqueList(assessment.strengths),
    weakAreas: uniqueList(assessment.weakAreas || assessment.knowledgeGaps),
    resourcePreferences: rankedResourcePreferences(preferredResources),
    preferredResources,
    schedulePreferences: assessment.schedulePreferences || assessment.schedule || {},
    dailyRoutine: normalizeDailyRoutine(assessment),
    motivationProfile: normalizeMotivationProfile(assessment, performance),
    performance,
    profileConfidence: calculateProfileConfidence(assessment),
    adaptationHistory: [
      buildAdaptationHistoryEntry(
        "Initial Teaching DNA profile created",
        [
          "learningStyle",
          "difficulty",
          "pace",
          "language",
          "communicationStyle",
          "gradeLevel",
          "personalityId"
        ],
        timestamp
      )
    ],
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function normalizeTeachingDNA(teachingDNA = {}) {
  const learningStyle = normalizeLearningStyle(teachingDNA.learningStyle);
  const performance = {
    ...DEFAULT_TEACHING_DNA.performance,
    ...(teachingDNA.performance || {})
  };
  const preferredResources = normalizeResourceScores(
    teachingDNA.preferredResources || teachingDNA.resourceScores,
    buildInitialResourceScores(teachingDNA, learningStyle)
  );
  const profileConfidence = clamp(teachingDNA.profileConfidence, 0, 1);

  return {
    ...DEFAULT_TEACHING_DNA,
    ...teachingDNA,
    learningStyle,
    difficulty: normalizeDifficulty(teachingDNA.difficulty),
    pace: normalizePace(teachingDNA.pace),
    language: normalizeLanguage(teachingDNA.language),
    communicationStyle: normalizeCommunicationStyle(teachingDNA.communicationStyle),
    gradeLevel: normalizeGradeLevel(teachingDNA),
    educationLevel: normalizeEducationLevel(teachingDNA),
    personalityId: normalizePersonalityId(
      pickFirst(teachingDNA.personalityId, teachingDNA.preferredTutor)
    ),
    goals: uniqueList(teachingDNA.goals),
    subjects: uniqueList(teachingDNA.subjects),
    strengths: uniqueList(teachingDNA.strengths),
    weakAreas: uniqueList(teachingDNA.weakAreas),
    preferredResources,
    resourcePreferences: uniqueList(teachingDNA.resourcePreferences || rankedResourcePreferences(preferredResources)),
    schedulePreferences: teachingDNA.schedulePreferences || {},
    dailyRoutine: normalizeDailyRoutine(teachingDNA, teachingDNA.dailyRoutine || DEFAULT_DAILY_ROUTINE),
    motivationProfile: normalizeMotivationProfile(
      teachingDNA,
      performance,
      teachingDNA.motivationProfile || DEFAULT_MOTIVATION_PROFILE
    ),
    performance,
    profileConfidence:
      profileConfidence === null ? DEFAULT_TEACHING_DNA.profileConfidence : profileConfidence,
    adaptationHistory: toArray(teachingDNA.adaptationHistory || teachingDNA.history)
      .filter(isPlainObject)
      .slice(-20),
    revision: toNumber(teachingDNA.revision) || 1
  };
}

function adjustDifficulty(currentDifficulty, performance, feedback = {}) {
  const currentIndex = DIFFICULTY_LEVELS.indexOf(currentDifficulty);

  if (feedback.tooHard || feedback.confused || performance.masteryLevel === "needs review") {
    return DIFFICULTY_LEVELS[Math.max(0, currentIndex - 1)];
  }

  if (feedback.tooEasy || feedback.wantsChallenge) {
    return DIFFICULTY_LEVELS[Math.min(DIFFICULTY_LEVELS.length - 1, currentIndex + 1)];
  }

  if (performance.quizAverage !== null && performance.quizAverage >= 88) {
    return DIFFICULTY_LEVELS[Math.min(DIFFICULTY_LEVELS.length - 1, currentIndex + 1)];
  }

  if (performance.quizAverage !== null && performance.quizAverage < 60) {
    return DIFFICULTY_LEVELS[Math.max(0, currentIndex - 1)];
  }

  return currentDifficulty;
}

function adjustPace(currentPace, performance, feedback = {}) {
  if (feedback.tooFast || feedback.overwhelmed || performance.masteryLevel === "needs review") {
    return "slow";
  }

  if (feedback.tooSlow || feedback.bored || feedback.wantsChallenge) {
    return "fast";
  }

  if (performance.consistency === "needs support") {
    return "slow";
  }

  return currentPace;
}

function extractTopicSignals(signals = {}, predicate) {
  const results = toArray(signals.quizResults || signals.quizzes || signals.results);

  return results
    .filter((result) => result && typeof result === "object")
    .filter(predicate)
    .map((result) => result.topic || result.subject || result.skill)
    .filter(Boolean);
}

function hasDecliningPerformance(currentPerformance = {}, nextPerformance = {}) {
  if (
    currentPerformance.quizAverage === null ||
    currentPerformance.quizAverage === undefined ||
    nextPerformance.quizAverage === null ||
    nextPerformance.quizAverage === undefined
  ) {
    return false;
  }

  return nextPerformance.quizAverage <= currentPerformance.quizAverage - 8;
}

function detectChangedFields(current = {}, next = {}, fields = []) {
  return fields.filter((field) => {
    const currentValue = JSON.stringify(current[field] || null);
    const nextValue = JSON.stringify(next[field] || null);

    return currentValue !== nextValue;
  });
}

function getAdaptationReason(changedFields = [], performance = {}, feedback = {}) {
  if (feedback.tooFast || feedback.tooSlow || feedback.tooHard || feedback.tooEasy) {
    return "Learner feedback changed the Teaching DNA";
  }

  if (changedFields.includes("difficulty") || changedFields.includes("weakAreas")) {
    return "Quiz performance changed the Teaching DNA";
  }

  if (changedFields.includes("pace") || changedFields.includes("dailyRoutine")) {
    return "Study behavior changed the Teaching DNA";
  }

  if (changedFields.includes("preferredResources") || changedFields.includes("resourcePreferences")) {
    return "Resource engagement changed the Teaching DNA";
  }

  if (performance.masteryLevel !== "unknown") {
    return "Learning progress refreshed the Teaching DNA";
  }

  return "Teaching DNA profile updated";
}

function updateTeachingDNA(currentTeachingDNA = {}, signals = {}, options = {}) {
  const current = normalizeTeachingDNA(currentTeachingDNA);
  const feedback = signals.feedback || signals.learnerFeedback || signals;
  const hasScoreSignals =
    extractQuizScores(signals).length > 0 ||
    pickFirst(signals.quizAverage, signals.averageScore, signals.performanceScore) !== undefined;
  const performanceInput = {
    ...signals,
    studyBehavior: {
      ...current.performance,
      ...(signals.studyBehavior || signals.studyHabits || {})
    }
  };

  if (!hasScoreSignals) {
    performanceInput.quizAverage = current.performance.quizAverage;
  }

  const performance = buildPerformanceSnapshot(performanceInput);
  const explicitLearningStyle = pickFirst(
    feedback.learningStyle,
    feedback.preferredLearningStyle,
    signals.learningStyle,
    signals.preferredLearningStyle
  );
  const nextLearningStyle = explicitLearningStyle
    ? normalizeLearningStyle(explicitLearningStyle, current.learningStyle)
    : current.learningStyle;
  const weakAreaSignals = extractTopicSignals(signals, (result) => {
    const score = normalizeScore(
      pickFirst(result.score, result.percentage, result.grade, result.value),
      pickFirst(result.maxScore, result.total, result.outOf)
    );
    return score !== null && score < 70;
  });
  const strengthSignals = extractTopicSignals(signals, (result) => {
    const score = normalizeScore(
      pickFirst(result.score, result.percentage, result.grade, result.value),
      pickFirst(result.maxScore, result.total, result.outOf)
    );
    return score !== null && score >= 85;
  });
  const timestamp = nowIso(options.now);
  const preferredResources = updateResourceScores(current.preferredResources, {
    ...signals,
    ...feedback
  });
  const nextMotivationProfile = normalizeMotivationProfile(
    {
      ...current.motivationProfile,
      ...(signals.motivationProfile || {}),
      ...(feedback.motivationProfile || {}),
      ...signals,
      ...feedback,
      decliningPerformance:
        Boolean(signals.decliningPerformance || feedback.decliningPerformance) ||
        hasDecliningPerformance(current.performance, performance)
    },
    performance,
    current.motivationProfile
  );
  const nextProfile = {
    ...current,
    learningStyle: nextLearningStyle,
    difficulty: normalizeDifficulty(
      pickFirst(signals.difficulty, feedback.difficulty),
      adjustDifficulty(current.difficulty, performance, feedback)
    ),
    pace: normalizePace(
      pickFirst(signals.pace, feedback.pace),
      adjustPace(current.pace, performance, feedback)
    ),
    language: normalizeLanguage(
      pickFirst(signals.language, feedback.language, signals.preferredLanguage),
      current.language
    ),
    communicationStyle: normalizeCommunicationStyle(
      pickFirst(signals.communicationStyle, feedback.communicationStyle, signals.speakingStyle),
      current.communicationStyle
    ),
    gradeLevel: normalizeGradeLevel(
      {
        gradeLevel: pickFirst(signals.gradeLevel, feedback.gradeLevel, signals.yearLevel, feedback.yearLevel)
      },
      current.gradeLevel
    ),
    educationLevel: normalizeEducationLevel(
      {
        educationLevel: pickFirst(
          signals.educationLevel,
          feedback.educationLevel,
          signals.studentLevel,
          feedback.studentLevel
        )
      },
      current.educationLevel
    ),
    personalityId: normalizePersonalityId(
      pickFirst(signals.personalityId, feedback.personalityId, signals.preferredTutor, current.personalityId)
    ),
    motivationStyle: inferMotivationStyle({
      motivationStyle: pickFirst(signals.motivationStyle, feedback.motivationStyle, current.motivationStyle)
    }),
    focusMode: inferFocusMode({
      focusMode: pickFirst(signals.focusMode, feedback.focusMode, current.focusMode)
    }),
    goals: uniqueList([current.goals, signals.goals, signals.learningGoals].flat()),
    subjects: uniqueList([current.subjects, signals.subjects, signals.currentSubjects].flat()),
    strengths: uniqueList([current.strengths, strengthSignals, signals.strengths].flat()),
    weakAreas: uniqueList([current.weakAreas, weakAreaSignals, signals.weakAreas].flat()),
    preferredResources,
    resourcePreferences: rankedResourcePreferences(preferredResources),
    schedulePreferences: {
      ...current.schedulePreferences,
      ...(signals.schedulePreferences || signals.schedule || {})
    },
    dailyRoutine: normalizeDailyRoutine(
      {
        ...signals,
        ...(feedback.dailyRoutine || {}),
        dailyRoutine: {
          ...current.dailyRoutine,
          ...(signals.dailyRoutine || {}),
          ...(feedback.dailyRoutine || {})
        }
      },
      current.dailyRoutine
    ),
    motivationProfile: nextMotivationProfile,
    performance: {
      ...current.performance,
      ...performance
    },
    profileConfidence: Number(Math.min(1, current.profileConfidence + 0.05).toFixed(2)),
    revision: current.revision + 1,
    updatedAt: timestamp
  };
  const changed = detectChangedFields(current, nextProfile, [
    "learningStyle",
    "difficulty",
    "pace",
    "language",
    "communicationStyle",
    "gradeLevel",
    "educationLevel",
    "personalityId",
    "motivationStyle",
    "focusMode",
    "strengths",
    "weakAreas",
    "preferredResources",
    "resourcePreferences",
    "dailyRoutine",
    "motivationProfile",
    "performance"
  ]);
  const historyEntry = buildAdaptationHistoryEntry(
    getAdaptationReason(changed, performance, feedback),
    changed,
    timestamp,
    {
      quizAverage: performance.quizAverage,
      masteryLevel: performance.masteryLevel,
      burnoutRisk: nextMotivationProfile.burnoutRisk
    }
  );

  return {
    ...nextProfile,
    adaptationHistory: [...current.adaptationHistory, historyEntry].slice(-20)
  };
}

function getTeachingRecommendations(teachingDNA = {}) {
  const profile = normalizeTeachingDNA(teachingDNA);
  const style = LEARNING_STYLES[profile.learningStyle] || LEARNING_STYLES.mixed;
  const recommendations = [...style.teachingHints];

  if (profile.difficulty === "beginner") {
    recommendations.push("Define key terms before using them.");
    recommendations.push("Use simple examples before technical detail.");
  }

  if (profile.difficulty === "intermediate") {
    recommendations.push("Connect new ideas to prior knowledge.");
    recommendations.push("Include moderate practice and misconception checks.");
  }

  if (profile.difficulty === "advanced") {
    recommendations.push("Use challenging examples and deeper reasoning.");
    recommendations.push("Invite the learner to justify answers and compare approaches.");
  }

  if (profile.gradeLevel || profile.educationLevel) {
    recommendations.push(
      `Match examples and vocabulary to ${profile.gradeLevel || profile.educationLevel}.`
    );
  }

  if (profile.pace === "slow") {
    recommendations.push("Teach one concept at a time and pause for confirmation.");
  }

  if (profile.pace === "fast") {
    recommendations.push("Keep explanations concise and move quickly into practice.");
  }

  if (profile.weakAreas.length > 0) {
    recommendations.push(`Review weak areas first: ${profile.weakAreas.join(", ")}.`);
  }

  if (profile.dailyRoutine.energyPattern !== "unknown") {
    recommendations.push(`Prefer study suggestions that fit the learner's ${profile.dailyRoutine.energyPattern} energy pattern.`);
  }

  if (profile.motivationProfile.burnoutRisk === "high") {
    recommendations.push("Use lighter study loads, reassurance, and recovery-friendly next steps.");
  }

  return uniqueList(recommendations, 16);
}

function buildTeachingDNAContext(teachingDNA = {}) {
  const profile = normalizeTeachingDNA(teachingDNA);

  return {
    learningStyle: profile.learningStyle,
    difficulty: profile.difficulty,
    pace: profile.pace,
    language: profile.language,
    communicationStyle: profile.communicationStyle,
    gradeLevel: profile.gradeLevel,
    educationLevel: profile.educationLevel,
    personalityId: profile.personalityId,
    motivationStyle: profile.motivationStyle,
    focusMode: profile.focusMode,
    goals: profile.goals,
    subjects: profile.subjects,
    strengths: profile.strengths,
    weakAreas: profile.weakAreas,
    resourcePreferences: profile.resourcePreferences,
    preferredResources: profile.preferredResources,
    dailyRoutine: profile.dailyRoutine,
    motivationProfile: profile.motivationProfile,
    performance: profile.performance,
    adaptationHistory: profile.adaptationHistory.slice(-5),
    teachingRecommendations: getTeachingRecommendations(profile)
  };
}

function buildTeachingDNASummary(teachingDNA = {}) {
  const context = buildTeachingDNAContext(teachingDNA);
  const lines = [
    `Learning style: ${context.learningStyle}`,
    `Difficulty: ${context.difficulty}`,
    `Pace: ${context.pace}`,
    `Language: ${context.language}`,
    `Communication style: ${context.communicationStyle}`
  ];

  if (context.gradeLevel || context.educationLevel) {
    lines.push(`Education context: ${[context.educationLevel, context.gradeLevel].filter(Boolean).join(" - ")}`);
  }

  if (context.personalityId) {
    lines.push(`Selected tutor personality: ${context.personalityId}`);
  }

  if (context.weakAreas.length > 0) {
    lines.push(`Weak areas: ${context.weakAreas.join(", ")}`);
  }

  if (context.strengths.length > 0) {
    lines.push(`Strengths: ${context.strengths.join(", ")}`);
  }

  if (context.performance.masteryLevel !== "unknown") {
    lines.push(`Mastery: ${context.performance.masteryLevel}`);
  }

  if (context.motivationProfile.burnoutRisk !== "unknown") {
    lines.push(`Burnout risk: ${context.motivationProfile.burnoutRisk}`);
  }

  return lines.join("\n");
}

module.exports = {
  DEFAULT_TEACHING_DNA,
  LEARNING_STYLES,
  DIFFICULTY_LEVELS,
  PACE_LEVELS,
  LANGUAGES,
  COMMUNICATION_STYLES,
  DEFAULT_DAILY_ROUTINE,
  DEFAULT_MOTIVATION_PROFILE,
  DEFAULT_RESOURCE_SCORES,
  createTeachingDNAProfile,
  updateTeachingDNA,
  normalizeTeachingDNA,
  normalizeGradeLevel,
  normalizeEducationLevel,
  inferLearningStyle,
  inferDifficulty,
  inferPace,
  inferCommunicationStyle,
  inferLanguage,
  getTeachingRecommendations,
  buildTeachingDNAContext,
  buildTeachingDNASummary,
  rankedResourcePreferences
};
