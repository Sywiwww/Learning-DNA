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

    async saveChat(chat: any) {
    try {
        db.runSync(
        `INSERT INTO chats
        (question, answer, subject, personality, createdAt, isSynced)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            chat.question,
            chat.answer,
            chat.subject,
            chat.personality,
            new Date().toISOString(),
            0,
        ]
        );

        console.log("✅ Chat saved locally.");
        } catch (error) {
            console.error("❌ Failed to save chat:", error);
        }
    }

    async getChats() {
        try {
            return db.getAllSync(
            `SELECT * FROM chats ORDER BY id DESC`
            );
        } catch (error) {
            console.error("❌ Failed to load chats:", error);
            return [];
        }
    }

  async saveTeachingDNA(dna: any) {}

  async getTeachingDNA() {}

  async saveLearningJourney(journey: any) {}

  async getLearningJourney() {}

  async saveQuizResult(result: any) {}

  async getQuizResults() {}

  async clearLocalData() {}
}

export default new SQLiteService();