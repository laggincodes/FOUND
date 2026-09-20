import { NextResponse } from 'next/server';
import { PriorityService } from '@/services/priorityService';
import { FoodItem } from '@/types';

export async function GET() {
  const sampleItems: FoodItem[] = [
    {
      id: 'item-spinach',
      name: 'Fresh Spinach',
      category: 'Produce',
      quantity: 250,
      unit: 'g',
      bestBefore: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      opened: true,
      storageLocation: 'Fridge',
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
      id: 'item-rice',
      name: 'Basmati Rice',
      category: 'Pantry & Grains',
      quantity: 2,
      unit: 'kg',
      bestBefore: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      opened: false,
      storageLocation: 'Cupboard / Pantry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const analyzed = sampleItems.map((item) => ({
    item,
    assessment: PriorityService.assess(item),
  }));

  return NextResponse.json({
    success: true,
    data: {
      useFirst: analyzed.filter((a) => a.assessment.tier === 'USE_FIRST'),
      useSoon: analyzed.filter((a) => a.assessment.tier === 'USE_SOON'),
      safeForNow: analyzed.filter((a) => a.assessment.tier === 'SAFE_FOR_NOW'),
    },
  });
}
