import { NextResponse } from 'next/server';

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';

    if (!query || query.length < 3) {
      return NextResponse.json({ success: true, targetConcepts: [], explanation: '' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({ success: true, targetConcepts: [], explanation: 'API key not configured' });
    }

    const prompt = `You are the semantic search parser for FOUND, an inventory app that helps students check: "Do I already have this?"
User query: "${query}"

Extract 2 to 4 simple, common item keywords the user might be referring to.
Examples:
- "something to write with" -> ["notebook", "pen", "pencil", "stationery"]
- "cables to charge my phone" -> ["usb-c cable", "charging cable", "charger"]
- "do I have toothpaste" -> ["toothpaste", "toothbrush"]
- "something warm to drink" -> ["tea", "coffee", "milk"]

Return JSON matching the schema.`;

    const geminiPayload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        responseSchema: {
          type: 'OBJECT',
          properties: {
            targetConcepts: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            explanation: { type: 'STRING' },
          },
          required: ['targetConcepts'],
        },
      },
    };

    let rawText: string | null = null;
    for (const model of CANDIDATE_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            rawText = text;
            break;
          }
        }
      } catch {
        // Try next candidate
      }
    }

    if (!rawText) {
      return NextResponse.json({ success: true, targetConcepts: [], explanation: 'Offline fallback' });
    }

    const parsed = JSON.parse(rawText);
    const targetConcepts = Array.isArray(parsed?.targetConcepts)
      ? parsed.targetConcepts.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean)
      : [];

    return NextResponse.json({
      success: true,
      targetConcepts,
      explanation: parsed?.explanation || '',
    });
  } catch (err) {
    console.warn('[Semantic Search API] Error:', err);
    return NextResponse.json({ success: true, targetConcepts: [], explanation: 'Fallback' });
  }
}
