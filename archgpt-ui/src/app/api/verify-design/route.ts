import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, archetype, plot, facing, storeys, bedrooms, modifiers } = body;

    const systemPrompt = `
      You are an expert senior architect and structural engineer. 
      Your task is to verify and critique a user's house design requirements and generate a detailed HouseSpec.
      
      User Requirements:
      - Intent: ${prompt}
      - Archetype: ${archetype}
      - Plot Size: ${plot} ft
      - Road Facing: ${facing}
      - Storeys: ${storeys}
      - Bedrooms: ${bedrooms}
      - Special Features: ${modifiers?.join(', ') || 'None'}

      Instructions:
      1. Analyze the feasibility of the design. (e.g., Is the bedroom count realistic for the plot size? Is the number of storeys allowed for this archetype?)
      2. Provide a constructive critique (max 3-4 sentences).
      3. Generate a refined HouseSpec JSON object that matches the architectural standards.
      
      Guidelines for HouseSpec:
      - Set "style" to "${archetype === 'villa' ? 'villa' : 'modern'}" or the style most appropriate for the intent.
      - Ensure "totalStoreys" matches the user's request (${storeys}).
      - The "floors" array MUST contain exactly ${storeys} floor objects if no basement is requested, or ${Number(storeys) + 1} if a basement is requested.
      - Each floor object must have:
        - "level": e.g., "Basement", "Ground floor", "First floor", "Second floor".
        - "spaces": An array of at least 4-6 room names appropriate for that floor and the BHK count.
      - Set "hasBasement" and "hasLift" booleans based on the user's request.
      
      Return ONLY a JSON object with this shape:
      {
        "critique": "Your architectural analysis...",
        "spec": {
          "status": "ready",
          "request": "${prompt}",
          "site": { "plotWidthFt": ${plot.split('x')[0]}, "plotDepthFt": ${plot.split('x')[1]}, "roadFacing": "${facing}" },
          "building": { "totalStoreys": ${storeys}, "style": "villa", "hasBasement": true, "hasLift": true },
          "floors": [
            { "level": "Ground floor", "spaces": ["Living Room", "Kitchen", "Dining", "Guest Bedroom", "Bathroom"] },
            ...
          ],
          "notes": [ "Actionable architectural notes..." ]
        }
      }

      Be very realistic. A 5 BHK villa needs enough space. If the plot is 100x80, it's a large plot, so the rooms can be spacious.
    `;

    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    const endpoint = process.env.LLM_ENDPOINT || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: "You are a helpful architecture assistant that output only JSON." },
          { role: "user", content: systemPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `AI API error: ${error}` }, { status: 500 });
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
