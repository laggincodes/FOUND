import { FoodItem, UsageEvent } from '@/types';

export interface PantryRepository {
  getItems(): Promise<FoodItem[]> | FoodItem[];
  saveItems(items: FoodItem[]): Promise<void> | void;
  getEvents(): Promise<UsageEvent[]> | UsageEvent[];
  saveEvents(events: UsageEvent[]): Promise<void> | void;
}

const STORAGE_KEY_ITEMS = 'use_it_first_items_v1';
const STORAGE_KEY_EVENTS = 'use_it_first_events_v1';

/**
 * LocalStoragePantryRepository implements PantryRepository using the browser's persistent storage.
 */
export class LocalStoragePantryRepository implements PantryRepository {
  getItems(): FoodItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveItems(items: FoodItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save pantry items:', e);
    }
  }

  getEvents(): UsageEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_EVENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveEvents(events: UsageEvent[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save usage events:', e);
    }
  }
}

/**
 * PantryService provides a unified interface for pantry data operations.
 */
export class PantryService {
  private repository: PantryRepository;

  constructor(repository: PantryRepository = new LocalStoragePantryRepository()) {
    this.repository = repository;
  }

  fetchItems(): Promise<FoodItem[]> | FoodItem[] {
    return this.repository.getItems();
  }

  persistItems(items: FoodItem[]): Promise<void> | void {
    return this.repository.saveItems(items);
  }

  fetchEvents(): Promise<UsageEvent[]> | UsageEvent[] {
    return this.repository.getEvents();
  }

  persistEvents(events: UsageEvent[]): Promise<void> | void {
    return this.repository.saveEvents(events);
  }
}
