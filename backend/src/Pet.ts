import { callOpenAILLM } from "./aiagent";

type Mood = "happy" | "grumpy" | "neutral" | "excited";

interface PetData {
  name: string;
  traits: string[];
  personality: string;
  mood: Mood;
  historyWith: Record<string, string[]>;
}

export class Pet implements PetData {
  name: string;
  traits: string[];
  personality: string;
  mood: Mood;
  historyWith: Record<string, string[]>;

  constructor(name: string, traits: string[]) {
    this.name = name;
    this.traits = traits;
    this.mood = "neutral";
    this.historyWith = {};
    this.personality = "";
  }

  async generatePersonality(): Promise<void> {
    const prompt = `
      Describe a pet with the following traits: ${this.traits.join(", ")}.
      Include:
      - Typical behavior
      - How they express emotions
      - How they interact with others
      - A short backstory
    `;
    this.personality = await callOpenAILLM(prompt);
  }

  async interact(otherPet: Pet): Promise<string> {
    const history =
      this.historyWith[otherPet.name]?.join(" ") || "No prior interactions.";

    const prompt = `
      Pet 1: ${this.name} (Traits: ${this.traits.join(", ")}, Mood: ${
      this.mood
    })  
      Pet 2: ${otherPet.name} (Traits: ${otherPet.traits.join(", ")}, Mood: ${
      otherPet.mood
    })  
      Past Interactions: ${history}  
      
      Describe their interaction in a fun and engaging way, including their emotions, dialogue, and actions.
    `;

    const response = await callOpenAILLM(prompt);
    this.updateHistory(otherPet, response);
    return response;
  }

  private updateHistory(otherPet: Pet, interaction: string): void {
    if (!this.historyWith[otherPet.name]) {
      this.historyWith[otherPet.name] = [];
    }
    this.historyWith[otherPet.name].push(interaction);
  }
}
