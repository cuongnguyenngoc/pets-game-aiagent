import axios from "axios";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// Define API Key and Endpoint
const OPENAI_API_KEY = process.env.OPEN_API_KEY;
console.log("OPENAI_API_KEY", OPENAI_API_KEY);
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // Load API key from environment variables
});

export async function callOpenAILLM(prompt: string): Promise<string> {
  // try {
  //   const response = await axios.post(
  //     OPENAI_URL,
  //     {
  //       model: "gpt-4-0",
  //       messages: [{ role: "user", content: prompt }],
  //       temperature: 0.7,
  //     },
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${OPENAI_API_KEY}`,
  //       },
  //     }
  //   );
  //   return response.data.choices[0].message.content.trim();
  // } catch (error) {
  //   console.log("LLM API Error:", error);
  //   return "Error generating response.";
  // }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Or use "gpt-3.5-turbo"
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    console.log(response.choices[0]?.message?.content);

    return response?.choices[0]?.message?.content?.trim() || "no response";
  } catch (error) {
    console.log("LLM API Error:", error);
    return "Error generating response.";
  }
}
