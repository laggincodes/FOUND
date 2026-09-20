import { createClient, isSupabaseConfigured } from './client';
import {
  FoodItem,
  DurableItem,
  GroceryItem,
  PurchaseHistoryItem,
  UsageEvent,
  UserProfile,
} from '@/types';

export class SupabaseSyncService {
  private static getClient() {
    if (!isSupabaseConfigured()) return null;
    return createClient();
  }

  static async fetchUserData(userId: string) {
    const supabase = this.getClient();
    if (!supabase) return null;

    try {
      const [
        pantryRes,
        durablesRes,
        groceriesRes,
        historyRes,
        eventsRes,
        profileRes,
      ] = await Promise.all([
        supabase.from('pantry_items').select('*').eq('user_id', userId),
        supabase.from('durable_items').select('*').eq('user_id', userId),
        supabase.from('grocery_items').select('*').eq('user_id', userId),
        supabase.from('purchase_history').select('*').eq('user_id', userId),
        supabase.from('usage_events').select('*').eq('user_id', userId),
        supabase.from('profiles').select('*').eq('id', userId).single(),
      ]);

      return {
        pantryItems: pantryRes.data
          ? pantryRes.data.map((row) => ({
              id: row.id,
              foodId: row.food_id,
              name: row.name,
              category: row.category,
              quantity: Number(row.quantity),
              unit: row.unit,
              storageLocation: row.storage_location,
              opened: Boolean(row.opened),
              openedDate: row.opened_date,
              purchaseDate: row.purchase_date,
              bestBefore: row.best_before,
              notes: row.notes,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }))
          : null,
        durableItems: durablesRes.data
          ? durablesRes.data.map((row) => ({
              id: row.id,
              name: row.name,
              category: row.category,
              quantity: Number(row.quantity),
              unit: row.unit,
              location: row.location,
              purchaseDate: row.purchase_date,
              purchasePrice: row.purchase_price ? Number(row.purchase_price) : undefined,
              notes: row.notes,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }))
          : null,
        groceryItems: groceriesRes.data
          ? groceriesRes.data.map((row) => ({
              id: row.id,
              foodId: row.food_id,
              name: row.name,
              quantity: Number(row.quantity || 1),
              unit: row.unit,
              category: row.category,
              checked: Boolean(row.checked),
              source: row.source,
              recipeId: row.recipe_id,
              recipeName: row.recipe_name,
              notes: row.notes,
              addedAt: row.added_at,
              checkedAt: row.checked_at,
            }))
          : null,
        purchaseHistory: historyRes.data
          ? historyRes.data.map((row) => ({
              id: row.id,
              userId: row.user_id,
              foodId: row.food_id,
              name: row.name,
              quantity: row.quantity ? Number(row.quantity) : undefined,
              unit: row.unit,
              category: row.category,
              purchasedAt: row.purchased_at,
              estimatedPrice: row.estimated_price ? Number(row.estimated_price) : undefined,
              source: row.source,
            }))
          : null,
        usageEvents: eventsRes.data
          ? eventsRes.data.map((row) => ({
              id: row.id,
              foodItemId: row.food_item_id,
              foodName: row.food_name,
              recipeId: row.recipe_id,
              recipeName: row.recipe_name,
              quantityUsed: Number(row.quantity_used),
              unit: row.unit,
              usedAt: row.used_at,
              estimatedWeightGrams: Number(row.estimated_weight_grams || 0),
              estimatedValueINR: Number(row.estimated_value_inr || 0),
              wasPriorityItem: Boolean(row.was_priority_item),
            }))
          : null,
        profile: profileRes.data
          ? {
              userId: profileRes.data.id,
              householdSize: profileRes.data.household_size,
              preferredUnits: profileRes.data.preferred_units,
              preferredCategories: profileRes.data.preferred_categories || [],
              dietaryPreferences: profileRes.data.dietary_preferences || [],
              dislikedFoods: profileRes.data.disliked_foods || [],
              favoriteFoods: profileRes.data.favorite_foods || [],
              createdAt: profileRes.data.created_at,
              updatedAt: profileRes.data.updated_at,
            }
          : null,
      };
    } catch (e) {
      console.warn('[Supabase] Failed to fetch remote user data:', e);
      return null;
    }
  }

  static async upsertPantryItem(userId: string, item: FoodItem) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from('pantry_items').upsert({
        id: item.id,
        user_id: userId,
        food_id: item.foodId || null,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        storage_location: item.storageLocation,
        opened: item.opened,
        opened_date: item.openedDate || null,
        purchase_date: item.purchaseDate || null,
        best_before: item.bestBefore || null,
        notes: item.notes || null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Supabase] Error upserting pantry item:', e);
    }
  }

  static async deletePantryItem(userId: string, itemId: string) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from('pantry_items').delete().eq('id', itemId).eq('user_id', userId);
    } catch (e) {
      console.warn('[Supabase] Error deleting pantry item:', e);
    }
  }

  static async upsertDurableItem(userId: string, item: DurableItem) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from('durable_items').upsert({
        id: item.id,
        user_id: userId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        location: item.location || null,
        purchase_date: item.purchaseDate || null,
        purchase_price: item.purchasePrice || null,
        notes: item.notes || null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Supabase] Error upserting durable item:', e);
    }
  }

  static async deleteDurableItem(userId: string, itemId: string) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from('durable_items').delete().eq('id', itemId).eq('user_id', userId);
    } catch (e) {
      console.warn('[Supabase] Error deleting durable item:', e);
    }
  }

  static async upsertGroceryItem(userId: string, item: GroceryItem) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from('grocery_items').upsert({
        id: item.id,
        user_id: userId,
        food_id: item.foodId || null,
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        category: item.category || 'Produce',
        checked: Boolean(item.checked),
        source: item.source || 'manual',
        recipe_id: item.recipeId || null,
        recipe_name: item.recipeName || null,
        notes: item.notes || null,
        checked_at: item.checkedAt || null,
      });
    } catch (e) {
      console.warn('[Supabase] Error upserting grocery item:', e);
    }
  }

  static async deleteGroceryItem(userId: string, itemId: string) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from('grocery_items').delete().eq('id', itemId).eq('user_id', userId);
    } catch (e) {
      console.warn('[Supabase] Error deleting grocery item:', e);
    }
  }

  static async insertPurchaseHistory(userId: string, item: PurchaseHistoryItem) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from('purchase_history').insert({
        id: item.id,
        user_id: userId,
        food_id: item.foodId || null,
        name: item.name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        category: item.category || null,
        purchased_at: item.purchasedAt,
        estimated_price: item.estimatedPrice || null,
        source: item.source || 'manual',
      });
    } catch (e) {
      console.warn('[Supabase] Error inserting purchase history:', e);
    }
  }

  static async insertUsageEvent(userId: string, event: UsageEvent) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from('usage_events').insert({
        id: event.id,
        user_id: userId,
        food_item_id: event.foodItemId,
        food_name: event.foodName,
        recipe_id: event.recipeId || null,
        recipe_name: event.recipeName || null,
        quantity_used: event.quantityUsed,
        unit: event.unit,
        used_at: event.usedAt,
        estimated_weight_grams: event.estimatedWeightGrams || 0,
        estimated_value_inr: event.estimatedValueINR || 0,
        was_priority_item: Boolean(event.wasPriorityItem),
      });
    } catch (e) {
      console.warn('[Supabase] Error inserting usage event:', e);
    }
  }
}
