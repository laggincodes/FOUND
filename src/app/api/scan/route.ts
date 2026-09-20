import { NextResponse } from 'next/server';
import { ScanService } from '@/services/scanService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageSrc = body.imageSrc || '';
    const sampleId = body.sampleId;

    const result = await ScanService.scanImage(imageSrc, sampleId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to scan image', items: [] },
      { status: 500 }
    );
  }
}
