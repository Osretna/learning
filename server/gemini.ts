import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const ai = getGenAI();
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} returned error, checking if retry/fallback is appropriate:`, err.message || err);
      lastError = err;
      // If 503 or 429, wait a bit and try next model
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  throw lastError;
}
