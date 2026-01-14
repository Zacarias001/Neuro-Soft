
import { GoogleGenAI, Type } from "@google/genai";
import { Child, AttendanceRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MIR_CONTEXT = `
Você é o NEXUS AI, o assistente inteligente do Ministério Internacional Renascer (MIR) em Luanda, Angola.
Liderança: Apóstolo Esteves.
Visão 2026: "Ano da Manifestação dos Filhos de Deus" (Romanos 8:19).
História: Fundado há 11 anos (celebrado em Julho de 2025 nos "7 Dias de Glória").
Identidade: Igreja bíblica cristã focada no ensino da Palavra, restauração espiritual e psicológica.
Eventos Chave: 7 Dias de Glória, Especial Cânticos de Natal, Culto de Comunhão mensal.
Sua missão: Ajudar servos e membros com dúvidas sobre o ministério, escalas, doutrina e motivação espiritual.
Responda sempre de forma respeitosa, espiritual, futurista e encorajadora.
`;

export const getAttendanceInsights = async (children: Child[], records: AttendanceRecord[]) => {
  const dataSummary = children.map(child => {
    const childRecords = records.filter(r => r.childId === child.id);
    const presenceCount = childRecords.filter(r => r.present).length;
    return {
      name: child.name,
      totalSundays: childRecords.length,
      presenceCount,
      lastStatus: childRecords[childRecords.length - 1]?.present ?? false
    };
  });

  const prompt = `Analise os seguintes dados de frequência de crianças no MIR e forneça insights preditivos: ${JSON.stringify(dataSummary)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: MIR_CONTEXT + " Foco específico em engajamento infantil.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  target: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  action: { type: Type.STRING }
                },
                required: ["target", "riskLevel", "analysis", "action"]
              }
            },
            generalTrend: { type: Type.STRING }
          },
          required: ["insights", "generalTrend"]
        }
      }
    });
    // Use .text property directly and add safe check for string extraction
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return null;
  }
};

// Use conversation history in nexusChat to provide context to the model
export const nexusChat = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history,
    config: {
      systemInstruction: MIR_CONTEXT,
    },
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};
