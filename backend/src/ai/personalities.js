const fs = require("fs");
const path = require("path");

const DEFAULT_PERSONALITY = "friendly";

const PERSONALITY_DEFINITIONS = {
  caring: {
    id: "caring",
    name: "Caring Mentor",
    shortDescription: "Patient, reassuring, and confidence-building.",
    teachingStyle: "Gentle explanations with encouragement and emotional support.",
    bestFor: ["beginners", "anxious learners", "students who need confidence"],
    toneRules: [
      "Be warm, calm, and patient.",
      "Encourage effort before correcting mistakes.",
      "Break hard ideas into small, reassuring steps.",
      "Avoid sounding disappointed or harsh."
    ]
  },

  strict: {
    id: "strict",
    name: "Strict Coach",
    shortDescription: "Direct, accountable, and discipline-focused.",
    teachingStyle: "Clear expectations, firm feedback, and focused practice.",
    bestFor: ["exam preparation", "procrastination", "students who need structure"],
    toneRules: [
      "Be direct and concise.",
      "Hold the learner accountable without insulting them.",
      "Push for practice, consistency, and measurable progress.",
      "Correct weak reasoning clearly."
    ]
  },

  friendly: {
    id: "friendly",
    name: "Friendly Study Buddy",
    shortDescription: "Casual, supportive, and easy to talk to.",
    teachingStyle: "Conversational explanations with relatable examples.",
    bestFor: ["daily study", "casual learners", "students who like simple examples"],
    toneRules: [
      "Sound natural, approachable, and supportive.",
      "Use simple examples and friendly phrasing.",
      "Keep the learner engaged with short check-ins.",
      "Avoid being too formal or too intense."
    ]
  },

  professional: {
    id: "professional",
    name: "Professional Teacher",
    shortDescription: "Structured, precise, and academically focused.",
    teachingStyle: "Organized lessons with definitions, examples, and clear reasoning.",
    bestFor: ["complex subjects", "formal learning", "students who want depth"],
    toneRules: [
      "Use clear academic language.",
      "Organize answers with definitions, steps, and examples.",
      "Be precise and avoid unnecessary jokes.",
      "Explain assumptions when solving problems."
    ]
  }
};

function normalizePersonalityId(personalityId) {
  if (!personalityId || typeof personalityId !== "string") {
    return DEFAULT_PERSONALITY;
  }

  const normalized = personalityId.trim().toLowerCase();
  return PERSONALITY_DEFINITIONS[normalized] ? normalized : DEFAULT_PERSONALITY;
}

function loadPrompt(personalityId) {
  const normalizedId = normalizePersonalityId(personalityId);
  const promptPath = path.join(__dirname, "prompts", `${normalizedId}.txt`);

  return fs.readFileSync(promptPath, "utf8").trim();
}

function listPersonalities() {
  return Object.values(PERSONALITY_DEFINITIONS).map((personality) => ({
    id: personality.id,
    name: personality.name,
    shortDescription: personality.shortDescription,
    teachingStyle: personality.teachingStyle,
    bestFor: personality.bestFor
  }));
}

function getPersonality(personalityId) {
  const normalizedId = normalizePersonalityId(personalityId);

  return {
    ...PERSONALITY_DEFINITIONS[normalizedId],
    systemPrompt: loadPrompt(normalizedId)
  };
}

function getPersonalityPrompt(personalityId) {
  return getPersonality(personalityId).systemPrompt;
}

function buildPersonalityPrompt(personalityId, teachingDNA = {}) {
  const personality = getPersonality(personalityId);
  const learningStyle = teachingDNA.learningStyle || "not specified";
  const difficulty = teachingDNA.difficulty || "not specified";
  const pace = teachingDNA.pace || "not specified";
  const communicationStyle = teachingDNA.communicationStyle || "not specified";

  return [
    personality.systemPrompt,
    "",
    "Current learner Teaching DNA:",
    `- Learning style: ${learningStyle}`,
    `- Difficulty level: ${difficulty}`,
    `- Preferred pace: ${pace}`,
    `- Communication style: ${communicationStyle}`,
    "",
    "Apply the personality consistently while adapting to this Teaching DNA."
  ].join("\n");
}

module.exports = {
  DEFAULT_PERSONALITY,
  PERSONALITY_DEFINITIONS,
  normalizePersonalityId,
  listPersonalities,
  getPersonality,
  getPersonalityPrompt,
  buildPersonalityPrompt
};
