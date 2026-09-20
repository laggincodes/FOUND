'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FoodItem } from '@/types';
import { usePantry } from '@/lib/store';
import { useToast } from './Toast';
import { PriorityBadge } from './PriorityBadge';
import { Calendar, MapPin, Edit3, Trash2, Check, AlertCircle, Utensils, Snowflake, ShoppingCart } from 'lucide-react';

interface FoodCardProps {
  item: FoodItem;
  onEdit?: (item: FoodItem) => void;
  showStitchActions?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onEdit, showStitchActions = false }) => {
  const { deleteItem, updateItem, markIngredientsUsed, getItemAssessment, addPantryItemToGrocery } = usePantry();
  const { showToast } = useToast();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [editQty, setEditQty] = useState(item.quantity.toString());
  const [editOpened, setEditOpened] = useState(item.opened);

  const assessment = getItemAssessment(item);

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(editQty);
    if (!isNaN(num) && num > 0) {
      updateItem(item.id, {
        quantity: num,
        opened: editOpened,
        openedDate: editOpened && !item.opened ? new Date().toISOString().split('T')[0] : item.openedDate,
      });
      setIsQuickEditing(false);
      showToast(`Updated ${item.name} quantity to ${num} ${item.unit}.`);
    }
  };

  const handleMarkItemUsed = () => {
    markIngredientsUsed([
      {
        name: item.name,
        amountUsed: item.quantity,
        unit: item.unit,
      },
    ]);
    showToast(`${item.name} marked as used.`);
  };

  const handleFreezePreserve = () => {
    updateItem(item.id, {
      storageLocation: 'Freezer',
      notes: (item.notes ? item.notes + ' • ' : '') + 'Frozen to preserve shelf-life',
    });
    showToast(`Moved ${item.name} to Freezer.`);
  };

  const handleRestock = () => {
    addPantryItemToGrocery(item);
    showToast(`Added ${item.name} to grocery list.`);
  };

  return (
    <article
      className="bg-[#181C19] rounded-lg p-4 sm:p-5 border border-[#28302A] shadow-card hover:border-[#38433A] transition-all flex flex-col justify-between relative group text-[#EFF1EC]"
      aria-labelledby={`item-title-${item.id}`}
    >
      <div>
        {/* Category & Storage Tag line (e.g. Greens • Crisper / Produce • Fridge) */}
        <div className="flex items-center justify-between text-xs text-[#8E968F] mb-2">
          <span className="font-mono font-semibold uppercase tracking-wider text-[10px] text-[#7DB88F]">
            {item.category} • {item.storageLocation}
          </span>
          <div className="flex items-center gap-1.5">
            {item.opened ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs bg-[#2B1A17] text-[#DE755D] border border-[#482821] font-mono text-[9px] font-bold">
                Opened
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs bg-[#1C211D] text-[#8E968F] border border-[#28302A] font-mono text-[9px] font-medium">
                Unopened
              </span>
            )}
          </div>
        </div>

        {/* Food Name & Priority Badge */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3
            id={`item-title-${item.id}`}
            className="font-serif font-bold text-xl text-[#EFF1EC] leading-snug tracking-tight"
          >
            {item.name}
          </h3>
          <div className="shrink-0">
            <PriorityBadge tier={assessment.tier} size="sm" />
          </div>
        </div>

        {/* Quantity */}
        <p className="font-mono text-xs font-semibold text-[#8E968F] mb-3">
          {item.quantity} {item.unit}
          {item.notes && <span className="font-normal italic ml-1.5 text-[#727C74]">({item.notes})</span>}
        </p>

        {/* Priority Rationale Box */}
        <div className="my-2.5 p-2.5 rounded-xs bg-[#151816] border border-[#252C26] text-xs">
          <span className="font-mono font-bold text-[#EFF1EC] block text-[10px] uppercase tracking-wide">
            {assessment.tier === 'EXPIRED'
              ? 'Past best-before'
              : assessment.daysRemaining === 0
              ? 'Best before today'
              : assessment.daysRemaining === 1
              ? 'Use by tomorrow'
              : assessment.tier === 'USE_FIRST'
              ? 'Needs immediate attention'
              : assessment.tier === 'USE_SOON'
              ? 'Use soon'
              : 'Safe for now'}
          </span>
          <p className="text-[#8E968F] mt-0.5 leading-relaxed font-normal">
            {assessment.primaryReason}
          </p>
        </div>

        {/* Date if supplied */}
        <div className="flex items-center gap-2 text-xs text-[#8E968F] font-mono mb-4">
          <Calendar className="w-3.5 h-3.5 text-[#727C74] shrink-0" />
          <span>
            {item.bestBefore ? (
              <>
                Best-before: <strong className="text-[#EFF1EC] font-semibold">{item.bestBefore}</strong>
                {assessment.daysRemaining !== null && (
                  <span className="ml-1 text-[#727C74]">
                    ({assessment.daysRemaining < 0
                      ? `${Math.abs(assessment.daysRemaining)}d past due`
                      : assessment.daysRemaining === 0
                      ? 'due today'
                      : `${assessment.daysRemaining}d left`})
                  </span>
                )}
              </>
            ) : (
              <span className="italic text-[#727C74]">No date entered</span>
            )}
          </span>
        </div>
      </div>

      {/* Quick Edit Overlay Form */}
      {isQuickEditing && (
        <form
          onSubmit={handleSaveQuickEdit}
          className="p-3 bg-[#141715] rounded-xs border border-[#28302A] mb-3 text-xs space-y-2 animate-in fade-in duration-150"
        >
          <div className="font-mono font-bold text-[#EFF1EC] uppercase text-[10px] tracking-wider">Update Quantity &amp; Status</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              min="0.1"
              value={editQty}
              onChange={(e) => setEditQty(e.target.value)}
              className="w-20 px-2 py-1 bg-[#181C19] border border-[#28302A] rounded-xs text-xs font-mono text-[#EFF1EC] focus:border-[#3B6647] focus:outline-none"
              required
              aria-label="Quantity"
            />
            <span className="text-[#8E968F] font-mono text-xs">{item.unit}</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#8E968F]">
            <input
              type="checkbox"
              checked={editOpened}
              onChange={(e) => setEditOpened(e.target.checked)}
              className="rounded-xs border-[#28302A] bg-[#181C19] text-[#3B6647] focus:ring-[#3B6647]"
            />
            <span>Package is opened</span>
          </label>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-3 py-1 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] rounded-xs font-mono text-[10px] uppercase tracking-wider border border-[#4E805B]/30"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsQuickEditing(false)}
              className="px-2 py-1 text-[#8E968F] hover:text-[#EFF1EC] font-mono text-[10px] uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Stitch Section 1 Actions (Cook now, Freeze/preserve, Mark used) */}
      {showStitchActions ? (
        <div className="pt-3 border-t border-[#28302A] flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1 font-semibold text-[#7DB88F] hover:text-[#A1D6B0] px-2 py-1.5 rounded-xs hover:bg-[#222824] min-h-[36px]"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Cook now</span>
          </Link>

          <button
            onClick={handleFreezePreserve}
            className="inline-flex items-center gap-1 text-[#8E968F] hover:text-[#EFF1EC] font-medium px-2 py-1.5 rounded-xs hover:bg-[#222824] min-h-[36px] cursor-pointer"
            title="Move to freezer to prevent waste"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Freeze / preserve</span>
          </button>

          <button
            onClick={handleRestock}
            className="inline-flex items-center gap-1 text-[#8E968F] hover:text-[#7DB88F] font-medium px-2 py-1.5 rounded-xs hover:bg-[#222824] min-h-[36px] cursor-pointer"
            title="Add to grocery shopping list"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Restock</span>
          </button>

          <button
            onClick={handleMarkItemUsed}
            className="inline-flex items-center gap-1 font-semibold text-[#E06D53] hover:text-[#FF8D73] px-2 py-1.5 rounded-xs hover:bg-[#2B1A17] min-h-[36px] cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark used</span>
          </button>
        </div>
      ) : (
        /* Standard Pantry item actions */
        <div className="pt-3 border-t border-[#28302A] flex flex-wrap items-center justify-between gap-1.5">
          {isConfirmingDelete ? (
            <div className="w-full flex items-center justify-between gap-2 p-1.5 bg-[#2B1A17] rounded-xs text-xs border border-[#482821] animate-in fade-in">
              <span className="text-[#E06D53] font-medium flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5" /> Delete item?
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    deleteItem(item.id);
                    showToast(`Deleted ${item.name}.`);
                  }}
                  className="px-2.5 py-1 bg-[#B35A43] text-[#EFF1EC] font-semibold rounded-xs hover:bg-[#C9674D] min-h-[30px]"
                  aria-label={`Confirm delete ${item.name}`}
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-1 bg-[#1C211D] text-[#8E968F] border border-[#28302A] rounded-xs hover:text-[#EFF1EC] min-h-[30px]"
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (onEdit) {
                      onEdit(item);
                    } else {
                      setIsQuickEditing(!isQuickEditing);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[#8E968F] hover:text-[#EFF1EC] font-medium px-2 py-1.5 rounded-xs hover:bg-[#222824] min-h-[36px] cursor-pointer"
                  aria-label={`Edit ${item.name}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={handleRestock}
                  className="inline-flex items-center gap-1 text-xs text-[#8E968F] hover:text-[#7DB88F] font-medium px-2 py-1.5 rounded-xs hover:bg-[#222824] min-h-[36px] cursor-pointer"
                  title="Add to grocery shopping list"
                  aria-label={`Restock ${item.name}`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Restock</span>
                </button>

                <button
                  onClick={handleMarkItemUsed}
                  className="inline-flex items-center gap-1 text-xs text-[#7DB88F] hover:text-[#A1D6B0] font-semibold px-2 py-1.5 rounded-xs hover:bg-[#203024] min-h-[36px] cursor-pointer"
                  aria-label={`Mark ${item.name} as used`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark used</span>
                </button>
              </div>

              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="inline-flex items-center gap-1 text-xs text-[#8E968F] hover:text-[#E06D53] font-medium px-2 py-1.5 rounded-xs hover:bg-[#2B1A17] min-h-[36px] cursor-pointer"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
};
