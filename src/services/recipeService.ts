import { FoodItem, Recipe } from '@/types';
import { RECIPES_DATA } from '@/lib/recipes-data';
import { PriorityService } from './priorityService';

export interface RankedRecipeResult {
  recipe: Recipe;
  score: number;
  pantryMatchCount: number;
  priorityMatchCount: number;
  missingCount: number;
  matchRatio: number;
}

/**
 * RecipeService encapsulates pantry-aware recipe matching and scoring.
 * Integration Boundary: Replaceable by database query or remote recipe API.
 */
export class RecipeService {
  /**
   * Retrieves all available recipes.
   */
  static getAllRecipes(): Recipe[] {
    return RECIPES_DATA;
  }

  /**
   * Retrieves a recipe by its slug.
   */
  static getRecipeBySlug(slug: string): Recipe | undefined {
    return RECIPES_DATA.find((r) => r.slug === slug);
  }

  /**
   * Scores and ranks recipes against the user's pantry contents.
   */
  static rankRecipes(
    pantryItems: FoodItem[],
    recipes: Recipe[] = RECIPES_DATA
  ): RankedRecipeResult[] {
    const priorityItems = pantryItems.filter((item) => {
      const assess = PriorityService.assess(item);
      return assess.tier === 'USE_FIRST' || assess.tier === 'USE_SOON';
    });

    const priorityNames = priorityItems.map((p) => p.name.toLowerCase());

    return recipes
      .map((recipe) => {
        let pantryMatchCount = 0;
        let priorityMatchCount = 0;

        recipe.ingredients.forEach((ing) => {
          const hasMatch = pantryItems.some(
            (p) =>
              p.name.toLowerCase().includes(ing.name.toLowerCase()) ||
              ing.name.toLowerCase().includes(p.name.toLowerCase())
          );

          if (hasMatch) {
            pantryMatchCount++;
            const isPriority = priorityNames.some(
              (pName) =>
                pName.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(pName)
            );
            if (isPriority) priorityMatchCount++;
          }
        });

        const totalIngredients = recipe.ingredients.length;
        const missingCount = Math.max(0, totalIngredients - pantryMatchCount);
        const matchRatio = totalIngredients > 0 ? pantryMatchCount / totalIngredients : 0;

        // Architectural ranking formula:
        // recipeScore = pantryMatch + priorityMatch - missingPenalty - complexityPenalty
        const pantryMatchScore = matchRatio * 50;
        const priorityMatchScore = priorityMatchCount * 25;
        const missingPenalty = missingCount * 5;
        const complexityPenalty = recipe.difficulty === 'Intermediate' ? 6 : recipe.difficulty === 'Medium' ? 3 : 0;

        const score = Math.max(0, pantryMatchScore + priorityMatchScore - missingPenalty - complexityPenalty);

        return {
          recipe,
          score,
          pantryMatchCount,
          priorityMatchCount,
          missingCount,
          matchRatio,
        };
      })
      .sort((a, b) => {
        // Priority rescue takes top precedence, followed by match score, then shorter time
        if (b.priorityMatchCount !== a.priorityMatchCount) {
          return b.priorityMatchCount - a.priorityMatchCount;
        }
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.recipe.timeMinutes - b.recipe.timeMinutes;
      });
  }
}
