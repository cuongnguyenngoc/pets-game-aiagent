import express, { response } from "express";
import cors from "cors";
import { ChatOpenAI } from "@langchain/openai";
// import { Ollama } from "@langchain/community/llms/ollama";
// import { HuggingFaceInference } from "@langchain/community/llms/hf";
import OpenAI from "openai";

import { PromptTemplate } from "@langchain/core/prompts";
import { ConversationChain } from "langchain/chains";
import { config } from "dotenv";
import { DecayingMemory } from "./src/memory";
import { Pet, savePetData } from "./src/db";

config();

const app = express();
app.use(express.json());
app.use(cors());

// const ollamaModel = new Ollama({
//   baseUrl: "http://localhost:11434",
//   model: "mistral",
// });
// const huggingfaceModel = new HuggingFaceInference({
//   model: "mistral-7b",
//   apiKey: process.env.HUGGINGFACE_API_KEY,
// });

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4",
  temperature: 0.8,
});

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 Add Memory for Persistent Conversations
const memory = new DecayingMemory();

// 🎯 Create a Conversation Chain (LLM + Memory)
const conversation = new ConversationChain({ llm, memory });

// 📝 Prompt Template (Pet Personality + Memory)
const petPersonalityPrompt = new PromptTemplate({
  inputVariables: ["name", "trait", "stats", "history"],
  template: `
  You are an AI generating unique pet personalities for a game.

    Pet Details:
    - Name: {name}
    - Personality Trait: {trait}
    - Stats: {stats}

    Previous interactions: {history}

    Based on past interactions, update the pet’s personality, behavior, and quirks.

    🎙️ What would {name} say in response to the player? Use first-person speech.

    Return only a JSON object with the following structure:
    \`\`\`json
    {{
      "personality": "A short description of the pet’s personality",
      "behavior": "How it behaves daily",
      "quirks": "Funny or unique habits",
      "response": "First-person dialogue from {name}"
    }}
    \`\`\`

    Ensure the response is a valid JSON object. Do not include any extra text, explanations, or formatting.
  `,
});

// 📌 Function to Generate Pet Personality with Memory
async function generatePetPersonality(
  name: string,
  trait: string,
  stats: string
) {
  const pastInteractions = await memory.loadMemoryVariables({}); // Retrieve past interactions

  const formattedPrompt = await petPersonalityPrompt.format({
    name,
    trait,
    stats,
    history: pastInteractions?.history || "No past interactions.",
  });

  const response = await conversation.call({ input: formattedPrompt });
  console.log("response", response.response);
  try {
    return JSON.parse(response.response);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

// Get All Pets
app.get("/pets", async (req, res) => {
  const pets = await Pet.find();
  res.json(pets);
});

// Get Single Pet
app.get("/pets/:id", async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.status(404).json({ error: "Pet not found" });
  res.json(pet);
});

// Delete Pet
app.delete("/pets/:id", async (req, res) => {
  const deletedPet = await Pet.findByIdAndDelete(req.params.id);
  if (!deletedPet) return res.status(404).json({ error: "Pet not found" });
  res.json({ message: "Pet deleted" });
});

// Update Pet
app.put("/pets/:id", async (req, res) => {
  const updatedPet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!updatedPet) return res.status(404).json({ error: "Pet not found" });
  res.json(updatedPet);
});

// 🚀 API Route for Generating Pet Personality
app.post("/pets/generate-pet", async (req, res) => {
  const { name, traits, stats } = req.body;

  if (!name || !traits || !stats) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const personalityData = await generatePetPersonality(
    name,
    traits,
    JSON.stringify(stats)
  );

  if (!personalityData) {
    return res.status(500).json({ error: "Failed to generate personality" });
  }

  await savePetData(name, {
    ...personalityData,
    traits: traits.join(", "),
    stats,
  });

  res.json(personalityData);
});

// 🚀 API Route for Storing User Interaction (Feeding, Ignoring, Playing)
app.post("/pets/:id/interact", async (req, res) => {
  const id = req.params.id;
  const { action } = req.body;

  if (!id || !action) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const pet = await Pet.findById(req.params.id);
  if (!pet || !pet.name) {
    return res.status(404).json({ error: "Pet not found" });
  }
  if (!pet.traits) {
    return res.status(404).json({ error: "Pet has no traits" });
  }

  await memory.saveContext(
    { input: `Player ${action} the pet ${pet.name}` },
    { response: `Noted: ${pet.name} was ${action}.` }
  );

  const personalityData = await generatePetPersonality(
    pet.name,
    pet.traits,
    JSON.stringify(pet.stats)
  );

  if (!personalityData) {
    return res.status(500).json({ error: "Failed to generate personality" });
  }

  // const personalityData = {
  //   personality:
  //     "Mochi is a tsundere, often acting aloof and uninterested, but deep down, she values her owner's affection and company quite a lot.",
  //   behavior:
  //     "Mochi tends to be picky about food and clean surroundings. She likes to sleep, but also enjoys energetic play sessions when in the mood.",
  //   quirks:
  //     "Though Mochi often plays hard-to-get and doesn't show her affection outright, she has the unique habit of sleeping near her owner's belongings when she misses them.",
  //   response:
  //     "Hmph! It's not like I enjoyed playing with you or anything... But we can... maybe... do it again sometime...",
  // };

  const response = await openai.images.generate({
    model: "dall-e-2",
    prompt: `A pet with whole body, named ${pet.name}, personality: ${pet.personality}, traits: ${pet.traits}, with response ${personalityData.response}
    The image is in pixel format.`,
    n: 1,
    size: "256x256",
  });

  const imageUrl = response.data[0].url;

  const updatedPet = await Pet.findByIdAndUpdate(
    req.params.id,
    { ...personalityData, imageUrl, lastUpdated: new Date() },
    { upsert: true, new: true }
  );

  const petWithResponse = {
    _id: updatedPet._id,
    name: updatedPet.name,
    personality: updatedPet.personality,
    behavior: updatedPet.behavior,
    imageUrl,
    quirks: updatedPet.quirks,
    stats: updatedPet.stats,
    response: personalityData.response,
  };

  res.json(petWithResponse);
});

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
