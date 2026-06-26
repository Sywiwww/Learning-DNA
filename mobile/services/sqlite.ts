import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("learning_dna.db");

export class SQLiteService {
  async initializeDatabase() {
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          subject TEXT,
          personality TEXT,
          createdAt TEXT,
          isSynced INTEGER DEFAULT 0
        );
      `);

      console.log("✅ Database initialized successfully.");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
    }
  }

  async saveChat(chat: any) {}

  async getChats() {}

  async saveTeachingDNA(dna: any) {}

  async getTeachingDNA() {}

  async saveLearningJourney(journey: any) {}

  async getLearningJourney() {}

  async saveQuizResult(result: any) {}

  async getQuizResults() {}

  async clearLocalData() {}
}

export default new SQLiteService();