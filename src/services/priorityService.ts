import { FoodItem, PriorityAssessment } from '@/types';
import { assessPriority, getPerishabilityScore } from '@/lib/priority';

/**
 * PriorityService encapsulates the deterministic priority assessment logic.
 * Integration Boundary: Allows transparent rule-based scoring and future AI supplements.
 */
export class PriorityService {
  /**
   * Assesses the priority tier, score (0-100), and rationale for a food item.
   */
  static assess(item: FoodItem, referenceDate: Date = new Date()): PriorityAssessment {
    return assessPriority(item, referenceDate);
  }

  /**
   * Computes perishability baseline for an ingredient.
   */
  static getPerishability(name: string, category: string): number {
    return getPerishabilityScore(name, category);
  }
}
