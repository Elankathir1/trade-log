
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

/* Always use process.env.API_KEY directly for initialization as per guidelines */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async analyzeJournal(trades: Trade[]): Promise<string> {
    const tradeSummary = trades.map(t => ({
      symbol: t.symbol,
      side: t.side,
      pnl: t.pnl,
      strategy: t.strategy,
      notes: t.notes,
      date: t.entryDate
    }));

    const prompt = `
      Act as a professional trading coach and quantitative analyst. 
      Analyze the following trade history from my journal:
      ${JSON.stringify(tradeSummary)}

      Provide a concise, professional analysis including:
      1. Overall Performance Review (Identify strengths/weaknesses).
      2. Strategy Efficacy (Which strategies are working best?).
      3. Psychological/Behavioral Insights (Based on notes/outcome).
      4. Actionable Advice (3 specific things to improve in the next 10 trades).
      
      Keep the formatting clean with Markdown. Use professional trading terminology.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      /* Access text property directly from the response object as per guidelines */
      return response.text || "Unable to generate analysis at this time.";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "An error occurred while analyzing your trades. Please check your network or API configuration.";
    }
  }
};
