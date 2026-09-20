import { DetectedPantryItem } from '@/types';
import { scanPantryImage, SAMPLE_PANTRY_IMAGES, PantrySampleImage } from '@/lib/scanner';

/**
 * ScanService abstracts the vision/scanning integration boundary.
 * Future backends (e.g. Gemini Vision API, Google Cloud Vision, barcode lookups)
 * can plug directly into this service without changing UI components.
 */
export class ScanService {
  /**
   * Retrieves predefined sample images for testing.
   */
  static getSampleImages(): PantrySampleImage[] {
    return SAMPLE_PANTRY_IMAGES;
  }

  /**
   * Scans a pantry image to produce structured candidate food items.
   * Enforces user review before any item enters the pantry.
   */
  static async scanImage(
    imageSrc: string,
    sampleId?: string
  ): Promise<{ success: boolean; items: DetectedPantryItem[]; message: string }> {
    return scanPantryImage(imageSrc, sampleId);
  }
}
