import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiModel = "gemini-3-flash-preview";

export async function summarizeText(text: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Summarize the following text concisely, focusing on key takeaways:\n\n${text}`,
  });
  return response.text;
}

export async function explainParagraph(text: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Explain this paragraph in simple terms for a student:\n\n${text}`,
  });
  return response.text;
}

export async function extractTextFromImage(base64Image: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: {
      parts: [
        { text: "Extract all text from this image. Maintain the layout as much as possible." },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(",")[1] || base64Image,
          },
        },
      ],
    },
  });
  return response.text;
}

export async function answerQuestion(context: string, question: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Based on the following context, answer the question: "${question}"\n\nContext:\n${context}`,
  });
  return response.text;
}
