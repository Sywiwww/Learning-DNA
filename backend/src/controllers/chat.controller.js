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

    // GET USER'S SAVED PERSONALITY
    const { data: user, error: userError } = await supabase
    .from("users")
    .select("preferred_personality")
    .eq("id", user_id)
    .single();

    if (userError) {
    console.error("User fetch error:", userError);
    }

    const personalityToUse =
    personality ||
    user?.preferred_personality ||
    "friendly";

    // 1. GET CHAT HISTORY
    const { data: history, error: historyError } = await supabase
      .from("chat_history")
      .select("message, reply, memory_summary")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(6);

    if (historyError) {
      console.error("History fetch error:", historyError);
    }

    // 2. FORMAT HISTORY
    const formattedHistory = (history || [])
      .reverse()
      .map((chat) => `User: ${chat.message}\nAI: ${chat.reply}`)
      .join("\n");

    // 3. SEND TO GEMINI (MAIN RESPONSE)
    const response = await sendChatMessage({
      message: `
You are an AI tutor for a student.

Long-term memory about the user:
${history?.map(h => h.memory_summary).filter(Boolean).join("\n")}

Recent conversation:
${formattedHistory}

Current user message:
${message}

Use the long-term memory to:
- remember what the student is learning
- maintain personality consistency
- avoid repeating explanations
- adapt teaching style over time
`,
      personalityId: personalityToUse,
    });

    console.log("AI RESPONSE RAW:", response);

    const aiText = response?.text;

    if (!aiText) {
      console.error("AI returned empty response");
      return res.status(500).json({
        success: false,
        message: "AI returned empty response",
      });
    }

    // 4. GENERATE MEMORY SUMMARY
    const summaryResponse = await sendChatMessage({
      message: `
Summarize this conversation in 1-2 sentences for long-term memory.

Conversation:
${formattedHistory}

Latest message:
${message}
      `,
      personalityId: "professional",
    });

    // 5. SAVE TO SUPABASE
    const { data, error } = await supabase.from("chat_history").insert([
      {
        user_id,
        message,
        reply: aiText,
        personality: personalityToUse,
        memory_summary: summaryResponse?.text || "",
      },
    ]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
    } else {
      console.log("SUPABASE INSERT SUCCESS:", data);
    }

    // 6. RETURN RESPONSE
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