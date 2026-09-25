import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('API Key ends with:', apiKey ? apiKey.slice(-6) : 'none');

  const ai = new GoogleGenAI({ apiKey });

  const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  for (const m of modelsToTest) {
    try {
      console.log(`Testing model: ${m}...`);
      const response = await ai.models.generateContent({
        model: m,
        contents: 'Xin chào, bạn là model nào?'
      });
      console.log(`✅ Model ${m} SUCCESS! Response:`, response.text.slice(0, 100));
      break;
    } catch (err) {
      console.log(`❌ Model ${m} error:`, err.message);
    }
  }
}

test();
