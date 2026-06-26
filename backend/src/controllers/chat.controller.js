const { sendChatMessage } = require("../ai/geminiClient");
const supabase = require("../config/supabase");

exports.chat = async (req, res) => {
  try {
    const { message, personality, user_id } = req.body;

    if (!message || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Message and user_id are required",
      });
    }

    // 1. GET CHAT HISTORY
    const { data: history, error: historyError } = await supabase
      .from("chat_history")
      .select("message, reply")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (historyError) {
      console.error("History fetch error:", historyError);
    }

    // 2. FORMAT HISTORY
    const formattedHistory = (history || [])
      .reverse()
      .map((chat) => `User: ${chat.message}\nAI: ${chat.reply}`)
      .join("\n");

    // 3. SEND TO GEMINI
    const response = await sendChatMessage({
      message: `
Previous conversation:
${formattedHistory}

Current user message:
${message}
      `,
      personalityId: personality || "friendly",
    });

    // 🔍 DEBUG AI RESPONSE (IMPORTANT)
    console.log("AI RESPONSE RAW:", response);

    const aiText = response?.text;

    if (!aiText) {
      console.error("AI returned empty response");
    }

    // 4. SAVE TO SUPABASE
    const { data, error } = await supabase
      .from("chat_history")
      .insert([
        {
          user_id,
          message,
          reply: aiText,
          personality: personality || "friendly",
        },
      ])
      .select();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
    } else {
      console.log("SUPABASE INSERT SUCCESS:", data);
    }

    // 5. RESPONSE
    res.json({
      success: true,
      reply: aiText,
    });

  } catch (err) {
    console.error("CHAT CONTROLLER ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};