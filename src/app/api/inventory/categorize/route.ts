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
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';

    if (!rawName || rawName.length < 2) {
      return NextResponse.json({ success: false });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        suggestedName: rawName,
        category: 'Other',
        aliases: [],
      });
    }

    const prompt = `You are an item categorization assistant for FOUND.
A student is adding a durable personal or household item: "${rawName}".

Suggest:
1. "suggestedName": Clean, standard title-cased item name (e.g. "type c charger cable" -> "USB-C Cable", "ruled notebook 200 pages" -> "Ruled Notebook").
2. "category": EXACTLY ONE OF: 'Electronics', 'Stationery', 'Tools', 'Kitchenware', 'Books', 'Clothing', 'Personal Care', 'Household', 'Other'.
3. "aliases": Array of 2 to 3 common synonyms/naming variations for future search (e.g. ["Type C cable", "USB-C charging cable"]).

Return JSON only.`;

    const geminiPayload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        responseSchema: {
          type: 'OBJECT',
          properties: {
            suggestedName: { type: 'STRING' },
            category: {
              type: 'STRING',
              enum: [
                'Electronics',
                'Stationery',
                'Tools',
                'Kitchenware',
                'Books',
                'Clothing',
                'Personal Care',
                'Household',
                'Other',
              ],
            },
            aliases: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
          required: ['suggestedName', 'category', 'aliases'],
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
        // Try next
      }
    }

    if (!rawText) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        suggestedName: rawName,
        category: 'Other',
        aliases: [],
      });
    }

    const parsed = JSON.parse(rawText);
    return NextResponse.json({
      success: true,
      source: 'gemini',
      suggestedName: parsed.suggestedName || rawName,
      category: parsed.category || 'Other',
      aliases: Array.isArray(parsed.aliases) ? parsed.aliases : [],
    });
  } catch (err) {
    console.warn('[Categorize API] Error:', err);
    return NextResponse.json({ success: false });
  }
}
