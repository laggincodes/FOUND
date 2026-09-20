import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      itemsUsedBeforePriority: 12,
      estimatedFoodRescuedKg: 3.4,
      estimatedFoodValueINR: 640,
      mealsMadeFromPantry: 9,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(
      {
        success: true,
        message: 'Impact usage event recorded.',
        event: {
          id: `evt-${Date.now()}`,
          ...body,
          recordedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid usage payload' },
      { status: 400 }
    );
  }
}
