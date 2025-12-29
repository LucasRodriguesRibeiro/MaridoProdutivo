
import { GoogleGenAI, Type } from "@google/genai";

const geniusKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: geniusKey });

export async function transformTextToTask(text: string) {
  if (!geniusKey) return null;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Transforme o seguinte pensamento de planejamento diário em uma tarefa clara e concisa. Texto: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          area: {
            type: Type.STRING,
            description: "Escolha uma: Casamento, Trabalho, Espiritual, Saúde, Financeiro, Casa"
          }
        },
        required: ["title", "area"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Falha ao processar resposta do Gemini", e);
    return null;
  }
}
export async function transformTextToSchedule(text: string) {
  if (!geniusKey) return null;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Transforme o seguinte texto em uma lista de horários e atividades para um cronograma diário. Tente extrair o máximo de detalhes possível. Retorne uma lista de objetos com 'time' (formato HH:MM) e 'task' (descrição concisa). Texto: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            task: { type: Type.STRING }
          },
          required: ["time", "task"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Falha ao processar resposta do Gemini", e);
    return null;
  }
}
