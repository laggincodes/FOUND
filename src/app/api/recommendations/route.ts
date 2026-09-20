import { NextRequest, NextResponse } from 'next/server';
import { getGroceryRecommendations } from '@/lib/recommendationEngine';
import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import { searchFoodLibrary, matchFoodLibrary } from '@/lib/food-library/normalizer';
import { RECIPES_DATA } from '@/lib/recipes-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId') || 'demo-user-001';
  const query = searchParams.get('q');

  // If search query is provided, return library search results
  if (query) {
    const results = searchFoodLibrary(query, FOOD_LIBRARY_CATALOG, 8);
    const matched = matchFoodLibrary(query, FOOD_LIBRARY_CATALOG);
    return NextResponse.json({
      query,
      matchedCanonical: matched,
      results,
    });
  }

  // Sample scenario check for Section 31
  if (userId === 'demo-user-001') {
    const samplePantry = [
      { id: '1', name: 'Whole Milk', category: 'Dairy & Eggs' as const, quantity: 0.2, unit: 'L', opened: true, storageLocation: 'Fridge' as const, createdAt: '', updatedAt: '' },
      { id: '2', name: 'Fresh Paneer', category: 'Dairy & Eggs' as const, quantity: 100, unit: 'g', opened: true, storageLocation: 'Fridge' as const, createdAt: '', updatedAt: '' },
      { id: '3', name: 'Vine Tomatoes', category: 'Produce' as const, quantity: 2, unit: 'pcs', opened: false, storageLocation: 'Fridge' as const, createdAt: '', updatedAt: '' },
      { id: '4', name: 'Fresh Curd', category: 'Dairy & Eggs' as const, quantity: 500, unit: 'g', opened: false, storageLocation: 'Fridge' as const, createdAt: '', updatedAt: '' },
      { id: '5', name: 'Wholewheat Bread', category: 'Bakery' as const, quantity: 0.5, unit: 'loaf', opened: true, storageLocation: 'Countertop' as const, createdAt: '', updatedAt: '' },
    ];

    const sampleStats = [
      { userId, foodId: 'food-milk-cow', purchaseCount: 14, lastPurchasedAt: new Date(Date.now() - 7 * 86400000).toISOString(), averageDaysBetweenPurchases: 7, averageQuantity: 1, lastUpdatedAt: '' },
      { userId, foodId: 'food-paneer', purchaseCount: 8, lastPurchasedAt: new Date(Date.now() - 10 * 86400000).toISOString(), averageDaysBetweenPurchases: 10, averageQuantity: 250, lastUpdatedAt: '' },
      { userId, foodId: 'food-tomato', purchaseCount: 15, lastPurchasedAt: new Date(Date.now() - 5 * 86400000).toISOString(), averageDaysBetweenPurchases: 5, averageQuantity: 500, lastUpdatedAt: '' },
      { userId, foodId: 'food-curd', purchaseCount: 10, lastPurchasedAt: new Date(Date.now() - 2 * 86400000).toISOString(), averageDaysBetweenPurchases: 7, averageQuantity: 500, lastUpdatedAt: '' },
      { userId, foodId: 'food-bread-wheat', purchaseCount: 9, lastPurchasedAt: new Date(Date.now() - 5 * 86400000).toISOString(), averageDaysBetweenPurchases: 6, averageQuantity: 1, lastUpdatedAt: '' },
    ];

    const recommendations = getGroceryRecommendations({
      userId,
      pantryItems: samplePantry,
      groceryItems: [],
      purchaseStats: sampleStats,
      purchaseHistory: [],
      userProfile: { userId, householdSize: 4, dietaryPreferences: ['Vegetarian'], createdAt: '', updatedAt: '' },
      activeRecipes: RECIPES_DATA,
      foodCatalog: FOOD_LIBRARY_CATALOG,
    });

    return NextResponse.json({
      userId,
      household: "Aarav's Household",
      recommendationsCount: recommendations.length,
      recommendations: recommendations.map((r) => ({
        name: r.name,
        suggested: `${r.suggestedQuantity} ${r.suggestedUnit}`,
        reason: r.reason,
        explanation: r.explanation,
        score: r.score,
      })),
    });
  }

  // Return isolated profile for demo-user-002
  return NextResponse.json({
    userId,
    household: "Priya's Studio",
    recommendationsCount: 0,
    recommendations: [],
  });
}
