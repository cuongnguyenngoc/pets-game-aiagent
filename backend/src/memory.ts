import { BufferMemory } from "langchain/memory";

// 🕒 Set memory lifespan (e.g., 24 hours)
const MEMORY_LIFESPAN_MS = 24 * 60 * 60 * 1000;

// 🧠 Extended BufferMemory to handle decay
export class DecayingMemory extends BufferMemory {
  async loadMemoryVariables(_context: any) {
    const now = Date.now();
    const allMemories = await super.loadMemoryVariables(_context);
    console.log("allMemories", allMemories);
    if (!allMemories || !allMemories.history) {
      return { history: "" };
    }

    // 🛑 Filter out expired memories
    const filteredHistory = allMemories.history
      .split("\n")
      .filter((entry: string) => {
        const match = entry.match(/\[(\d+)\]/); // Extract timestamp
        if (!match) return true;
        const timestamp = parseInt(match[1], 10);
        return now - timestamp < MEMORY_LIFESPAN_MS; // Keep only recent memories
      })
      .join("\n");

    return { history: filteredHistory };
  }

  async saveContext(input: any, response: any) {
    const timestamp = Date.now();
    const entry = `[${timestamp}] ${input.input}: ${response.response}`;
    await super.saveContext({ input: entry }, { response: "" });
  }
}
