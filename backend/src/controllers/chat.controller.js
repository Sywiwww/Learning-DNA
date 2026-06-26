const { sendChatMessage } = require("../ai/geminiClient");

exports.chat = async (req, res) => {
  try {
    const { message, personality, teachingDNA } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const response = await sendChatMessage({
      message,
      personalityId: personality || "friendly",
      teachingDNA: teachingDNA || {},
    });

    res.json({
      success: true,
      reply: response.text,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};