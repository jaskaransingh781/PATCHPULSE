import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function findWorkingModel() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const modelsToTest = [
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro'
  ];

  for (const model of modelsToTest) {
    console.log(`\nTesting model: ${model}...`);
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: "Respond with 'Hello'." }] }],
      });
      console.log(`SUCCESS! Model ${model} works. Response:`, response.text);
    } catch (error) {
      console.error(`FAILED ${model}:`, error.message);
    }
  }
}

findWorkingModel();
