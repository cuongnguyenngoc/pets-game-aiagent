import mongoose from "mongoose";
import { config } from "dotenv";
config();

console.log("process.env.MONGO_URI", process.env.MONGO_URI);
// 🗄️ Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/petsDB"
    );
    console.log("✅ MongoDB Connected!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1); // Stop the app if DB connection fails
  }
}

// Ensure connection before queries
connectDB();

// 🐾 Define Pet Schema
const petSchema = new mongoose.Schema({
  name: String,
  traits: String,
  personality: String,
  behavior: String,
  quirks: String,
  imageUrl: String,
  stats: {
    hunger: Number,
    cleanliness: Number,
    energy: Number,
    affection: Number,
  },
  lastUpdated: { type: Date, default: Date.now },
});

// 📌 Create Model
export const Pet = mongoose.model("Pet", petSchema);

// 🚀 Store Pet Personality in DB
export async function savePetData(name: string, personalityData: any) {
  console.log("personalityData", personalityData);
  const pet = await Pet.findOneAndUpdate(
    { name },
    { ...personalityData, lastUpdated: new Date() },
    { upsert: true, new: true }
  );

  console.log(`📁 Saved personality for ${name}:`, pet);
}
