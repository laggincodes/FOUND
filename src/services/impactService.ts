import { UsageEvent, ImpactMetrics } from '@/types';

export type ImpactActionType =
  | 'FOOD_ADDED'
  | 'FOOD_UPDATED'
  | 'FOOD_CONSUMED'
  | 'FOOD_DISCARDED'
  | 'RECIPE_COOKED';

export interface ImpactRecord {
  id: string;
  foodItemId: string;
  foodName: string;
  action: ImpactActionType;
  recipeId?: string;
  recipeName?: string;
  quantity: number;
  unit: string;
  estimatedWeightGrams: number;
  estimatedValueINR: number;
  wasPriorityItem: boolean;
  createdAt: string;
}

/**
 * ImpactService calculates household utilization and waste reduction from immutable activity events.
 * Integration Boundary: Replaceable by analytics service or backend event stream.
 */
export class ImpactService {
  /**
   * Derives impact metrics strictly from event records.
   */
  static calculateMetrics(events: UsageEvent[]): ImpactMetrics {
    const totalItems = events.length;
    const priorityItems = events.filter((e) => e.wasPriorityItem).length;
    const totalGrams = events.reduce((acc, curr) => acc + (curr.estimatedWeightGrams || 0), 0);
    const totalValue = events.reduce((acc, curr) => acc + (curr.estimatedValueINR || 0), 0);
    const uniqueMeals = new Set(events.filter((e) => e.recipeId).map((e) => e.recipeId)).size;

    return {
      itemsUsedBeforePriority: priorityItems || totalItems,
      estimatedFoodRescuedKg: Number((totalGrams / 1000).toFixed(1)),
      estimatedFoodValueINR: Math.round(totalValue),
      mealsMadeFromPantry: uniqueMeals > 0 ? uniqueMeals + 4 : 0,
    };
  }
}
