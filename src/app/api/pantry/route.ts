import { NextResponse } from 'next/server';
import { FoodItem } from '@/types';

// In-memory reference for API demonstration
let pantryStore: FoodItem[] = [
  {
    id: 'item-spinach',
    name: 'Fresh Spinach',
    category: 'Produce',
    quantity: 250,
    unit: 'g',
    bestBefore: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    opened: true,
    storageLocation: 'Fridge',
    notes: 'Crisp baby leaves',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-milk',
    name: 'Whole Milk',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'L',
    bestBefore: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    opened: true,
    storageLocation: 'Fridge',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-paneer',
    name: 'Fresh Paneer',
    category: 'Dairy & Eggs',
    quantity: 200,
    unit: 'g',
    bestBefore: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    opened: false,
    storageLocation: 'Fridge',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: pantryStore.length,
    data: pantryStore,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Please enter a food name.' },
        { status: 400 }
      );
    }

    const newItem: FoodItem = {
      id: `item-${Date.now()}`,
      name: body.name,
      quantity: body.quantity || 1,
      unit: body.unit || 'pcs',
      category: body.category || 'Produce',
      storageLocation: body.storageLocation || 'Fridge',
      bestBefore: body.bestBefore,
      opened: Boolean(body.opened),
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    pantryStore.unshift(newItem);

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
}
