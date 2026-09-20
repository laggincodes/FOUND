import { NextResponse } from 'next/server';
import { RECIPES_DATA } from '@/lib/recipes-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');

  let results = RECIPES_DATA;
  if (tag && tag !== 'All') {
    results = results.filter((r) => r.tags.includes(tag));
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
  });
}
