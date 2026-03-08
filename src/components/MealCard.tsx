'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Meal } from '@/lib/types';
import { formatTimeIST } from '@/lib/date-utils';
import { blobToUrl } from '@/lib/image-utils';

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const mealTypeEmojis: Record<string, string> = {
  breakfast: '\u2600\uFE0F',
  lunch: '\uD83C\uDF1E',
  dinner: '\uD83C\uDF19',
  snack: '\uD83C\uDF7F',
};

export default function MealCard({ meal }: { meal: Meal }) {
  const [thumbUrl, setThumbUrl] = useState<string>('');

  useEffect(() => {
    if (meal.photoThumbnail) {
      const url = blobToUrl(meal.photoThumbnail);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [meal.photoThumbnail]);

  const topItems = meal.items.slice(0, 2).map(i => i.name).join(', ');

  return (
    <Link href={`/meal/${meal.id}`} className="block">
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-primary-100 active:scale-[0.98]">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-primary-50">
          {thumbUrl ? (
            <img src={thumbUrl} alt="Meal" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {mealTypeEmojis[meal.mealType] || '🍽️'}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{mealTypeEmojis[meal.mealType]}</span>
            <span className="font-semibold text-stone-800">
              {mealTypeLabels[meal.mealType]}
            </span>
            <span className="text-sm text-stone-400">
              {formatTimeIST(meal.timestamp)}
            </span>
          </div>
          <p className="text-sm text-stone-500 truncate mt-0.5">{topItems}</p>
          <p className="text-sm font-medium text-primary-600 mt-0.5">
            {Math.round(meal.nutrients.calories)} kcal
          </p>
        </div>

        {/* Score badge */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
          meal.score >= 70 ? 'bg-score-great' :
          meal.score >= 50 ? 'bg-score-ok' :
          'bg-score-poor'
        }`}>
          {Math.round(meal.score)}
        </div>
      </div>
    </Link>
  );
}

export function MealCardSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-primary-100">
      <div className="w-16 h-16 rounded-xl skeleton flex-shrink-0" />
      <div className="flex-1">
        <div className="h-5 w-24 skeleton mb-2" />
        <div className="h-4 w-40 skeleton mb-1" />
        <div className="h-4 w-16 skeleton" />
      </div>
      <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
    </div>
  );
}
