import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST() {
  try {
    if (!BOT_TOKEN || BOT_TOKEN === "paste_your_bot_token_here_and_restart_server") {
      return NextResponse.json({ error: "Please add your real Telegram Bot Token to the .env file and restart the server." }, { status: 400 });
    }

    await connectToDatabase();
    
    // Fetch updates from Telegram API
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: "Failed to fetch from Telegram." }, { status: 500 });
    }

    // Look for a /start message from the user
    let chatId = null;
    for (const update of data.result) {
      if (update.message?.text === "/start") {
        chatId = update.message.chat.id;
        break; // Grab the most recent one for our single-user local app
      }
    }

    if (!chatId) {
      return NextResponse.json({ error: "No /start message found. Please message the bot first." }, { status: 404 });
    }

    // Save to User profile
    const userId = "default-user";
    await User.findOneAndUpdate(
      { userId },
      { telegramChatId: chatId },
      { upsert: true, new: true }
    );

    // Send a welcome message
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Successfully linked! I will now remind you every 3 hours if you have incomplete tasks."
      })
    });

    return NextResponse.json({ success: true, chatId });
  } catch (error: any) {
    console.error("Telegram link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
