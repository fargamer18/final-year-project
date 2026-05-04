import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const systemPrompt = `
      You are an Expert Architectural Design Engine. 
      Your task is to convert a user's house request into a structured Semantic Intermediate Representation (IR).
      
      CRITICAL: You must output ONLY valid JSON that conforms to the schema below.
      Do NOT include any markdown, commentary, or Three.js code.
      
      SCHEMA:
      {
        "styleContext": "string (e.g., tokyo-skinny, mediterranean)",
        "nodes": [
          { 
            "id": "string", 
            "type": "room|wall|opening|core|slab", 
            "dimensions": { "w": number, "h": number, "d": number },
            "position": { "x": number, "y": number, "z": number },
            "tags": ["habitable", "public", "private"],
            "parentId": "string"
          }
        ],
        "relations": [
          { "sourceId": "string", "targetId": "string", "type": "adjacent|on-top-of|inside" }
        ]
      }
      
      ARCHITECTURAL BRAIN REQUIREMENTS (NON-NEGOTIABLE):
      1. Every room MUST have an adjacency relation in the "relations" array to the 'core' or 'staircase'.
      2. If you do not include a 'staircase' node that spans all floors, the design is INVALID.
      3. Habitable rooms (bedroom/living) MUST have a parent-child relationship to at least one 'opening' (window).
      4. Place nodes in a logical vertical sequence: Ground (y=0-10), F1 (y=11-21), etc.
      
      OUTPUT FORMAT: ONLY RAW JSON.
    `;

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON if model included markdown fences
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const ir = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    return NextResponse.json(ir);
  } catch (error) {
    console.error("3D Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate design intent" }, { status: 500 });
  }
}
