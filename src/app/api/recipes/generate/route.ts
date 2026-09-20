import { NextResponse } from 'next/server';
import { Recipe } from '@/types';
import { RECIPES_DATA } from '@/lib/recipes-data';

// Realistic culinary food imagery mapped to keywords
const FOOD_IMAGES: Record<string, string> = {
  paneer: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  dal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  lentil: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  rice: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  egg: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  oats: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
  curry: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
};

function pickRecipeImage(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGES)) {
    if (text.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80';
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

import { extractFoodNameFromIngredient } from '@/lib/food-library/normalizer';

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pantryItems: Array<{ name: string; quantity?: number; unit?: string; priority?: string }> =
      body.pantryItems || [];

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback if API key is not configured
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        message: 'Gemini API key is not configured. Displaying curated student recipes.',
        recipes: RECIPES_DATA,
      });
    }

    // Build concise pantry summary for Gemini
    const pantrySummary =
      pantryItems.length > 0
        ? pantryItems
            .map((i) => {
              const urgency =
                i.priority && i.priority !== 'SAFE_FOR_NOW' ? ` [Priority: ${i.priority}]` : '';
              const qty = i.quantity ? ` (${i.quantity} ${i.unit || 'unit'})` : '';
              return `${i.name}${qty}${urgency}`;
            })
            .join(', ')
        : 'No ingredients currently in pantry; suggest everyday versatile student staples.';

    const prompt = `You are the recipe engine for FOUND.

Generate 8 to 12 distinct recipes based primarily on the ingredients provided by the user.

The user's pantry ingredients are:
${pantrySummary}

Prefer recipes that use multiple pantry ingredients.
Include:
1. Recipes that use ONLY the provided pantry ingredients (easy to cook right now).
2. Recipes that use the pantry ingredients plus 1 or 2 common kitchen staples (onion, garlic, oil, spices).
3. Recipes with creative variations.

Return recipes using simple ingredient names such as:
paneer, tomato, onion, potato, rice, milk, spinach.

Do not put quantities inside the ingredient name.

Return structured JSON containing 8 to 12 recipes matching the provided schema.

Do not claim that missing ingredients are available.`;

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        responseSchema: {
          type: 'OBJECT',
          properties: {
            recipes: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  description: { type: 'STRING' },
                  ingredients: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        name: { type: 'STRING' },
                        quantity: { type: 'STRING' },
                        unit: { type: 'STRING' },
                      },
                      required: ['name'],
                    },
                  },
                  steps: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                  },
                  cookingTimeMinutes: { type: 'INTEGER' },
                  servings: { type: 'INTEGER' },
                  vegetarian: { type: 'BOOLEAN' },
                },
                required: ['name', 'description', 'ingredients', 'steps', 'cookingTimeMinutes'],
              },
            },
          },
          required: ['recipes'],
        },
      },
    };

    let rawText: string | null = null;
    let selectedModel = '';

    // Iterate through candidate models for resilient generation
    for (const model of CANDIDATE_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

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
          if (text && text.trim().length > 0) {
            rawText = text;
            selectedModel = model;
            break;
          }
        } else {
          console.warn(`[Gemini API] Model ${model} returned HTTP ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`[Gemini API] Error contacting model ${model}:`, err?.message);
      }
    }

    if (!rawText) {
      console.warn('[Gemini API] No content received from any candidate model. Using curated recipes.');
      return NextResponse.json({
        success: true,
        source: 'fallback',
        message: 'Could not connect to Gemini service. Displaying curated recipes.',
        recipes: RECIPES_DATA,
      });
    }

    let parsedList: any[] = [];
    try {
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed)) {
        parsedList = parsed;
      } else if (Array.isArray(parsed?.recipes)) {
        parsedList = parsed.recipes;
      }
    } catch {
      console.warn('[Gemini API] Failed to parse JSON response from Gemini.');
      return NextResponse.json({
        success: true,
        source: 'fallback',
        message: 'Invalid response format from Gemini. Displaying curated recipes.',
        recipes: RECIPES_DATA,
      });
    }

    if (!Array.isArray(parsedList) || parsedList.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        recipes: RECIPES_DATA,
      });
    }

    // Validate and normalize Gemini recipes into FOUND standard Recipe format
    const validatedRecipes: Recipe[] = parsedList
      .filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0 && Array.isArray(item.ingredients))
      .map((item, index) => {
        const cleanName = item.name.trim();
        const slug = `${slugify(cleanName)}-${index + 1}`;
        const timeMinutes =
          typeof item.cookingTimeMinutes === 'number' && item.cookingTimeMinutes > 0
            ? Math.min(120, item.cookingTimeMinutes)
            : 20;

        const isVegetarian = typeof item.vegetarian === 'boolean' ? item.vegetarian : true;

        const ingredients = item.ingredients.map((ing: any) => {
          const rawIngName = typeof ing.name === 'string' ? ing.name.trim() : 'Ingredient';
          // Clean out inadvertent quantities or prep words
          const cleanIngName = extractFoodNameFromIngredient(rawIngName) || rawIngName;
          const qty = ing.quantity ? String(ing.quantity).trim() : '';
          const unit = ing.unit ? String(ing.unit).trim() : '';
          const amount = [qty, unit].filter(Boolean).join(' ') || '1 unit';
          return {
            name: cleanIngName,
            amount: amount,
          };
        });

        const steps =
          Array.isArray(item.steps) && item.steps.length > 0
            ? item.steps.map((s: any) => String(s).trim()).filter(Boolean)
            : ['Combine prepared ingredients in a pan.', 'Cook over medium heat until tender.', 'Serve hot.'];

        return {
          id: `gemini-${slug}`,
          slug: slug,
          name: cleanName,
          description:
            typeof item.description === 'string'
              ? item.description.trim()
              : `Nutritious, easy homecooked ${cleanName}.`,
          image: pickRecipeImage(cleanName, item.description || ''),
          timeMinutes: timeMinutes,
          difficulty: timeMinutes <= 20 ? 'Easy' : timeMinutes <= 35 ? 'Medium' : 'Intermediate',
          servings: typeof item.servings === 'number' && item.servings > 0 ? item.servings : 2,
          category: isVegetarian ? 'Vegetarian' : 'Quick Meal',
          isVegetarian: isVegetarian,
          ingredients: ingredients,
          steps: steps,
          tags: [
            'AI Suggested',
            isVegetarian ? 'Vegetarian' : 'Hearty',
            timeMinutes <= 25 ? 'Quick' : 'Under 35 min',
          ],
        };
      });

    if (validatedRecipes.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        recipes: RECIPES_DATA,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'gemini',
      model: selectedModel,
      count: validatedRecipes.length,
      recipes: validatedRecipes,
    });
  } catch (err: any) {
    console.warn('[Gemini API] Unexpected exception in recipe generation:', err?.message || 'Unknown error');
    return NextResponse.json({
      success: true,
      source: 'fallback',
      message: 'Temporary connection issue. Displaying curated recipes.',
      recipes: RECIPES_DATA,
    });
  }
}

