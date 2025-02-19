import { Pet } from "./Pet";

async function main() {
  const pet1 = new Pet("Max", ["tsundere", "independent"]);
  const pet2 = new Pet("Buddy", ["hyperactive", "friendly"]);

  // Generate Pet Personalities
  await pet1.generatePersonality();
  await pet2.generatePersonality();
  console.log(`🐱 ${pet1.name} Personality: ${pet1.personality}`);
  console.log(`🐶 ${pet2.name} Personality: ${pet2.personality}`);

  // First Interaction
  console.log(`🔄 Interaction: ${await pet1.interact(pet2)}`);

  // Second Interaction (history-aware)
  console.log(`🔄 Next Interaction: ${await pet1.interact(pet2)}`);
}

main();
