'use client';

import type { NutrientBreakdown } from '@/lib/types';

interface Props {
  nutrients: NutrientBreakdown;
}

export default function NutritionBreakdown({ nutrients }: Props) {
  const totalMacroCals = (nutrients.protein * 4) + (nutrients.carbs * 4) + (nutrients.fat * 9);
  const proteinPct = totalMacroCals > 0 ? ((nutrients.protein * 4) / totalMacroCals) * 100 : 0;
  const carbsPct = totalMacroCals > 0 ? ((nutrients.carbs * 4) / totalMacroCals) * 100 : 0;
  const fatPct = totalMacroCals > 0 ? ((nutrients.fat * 9) / totalMacroCals) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Calorie header */}
      <div className="text-center">
        <span className="text-3xl font-bold text-stone-800">
          {Math.round(nutrients.calories)}
        </span>
        <span className="text-lg text-stone-500 ml-1">kcal</span>
      </div>

      {/* Macro bars */}
      <div className="space-y-3">
        <MacroBar
          label="Protein"
          grams={nutrients.protein}
          percent={proteinPct}
          color="bg-emerald-500"
        />
        <MacroBar
          label="Carbs"
          grams={nutrients.carbs}
          percent={carbsPct}
          color="bg-amber-400"
        />
        <MacroBar
          label="Fat"
          grams={nutrients.fat}
          percent={fatPct}
          color="bg-orange-500"
        />
        <MacroBar
          label="Fiber"
          grams={nutrients.fiber}
          percent={0}
          color="bg-green-600"
          showGramsOnly
        />
      </div>

      {/* Micronutrients */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <MicroRow label="Calcium" value={nutrients.calcium} unit="mg" />
        <MicroRow label="Iron" value={nutrients.iron} unit="mg" />
        <MicroRow label="Vitamin C" value={nutrients.vitaminC} unit="mg" />
        <MicroRow label="Sodium" value={nutrients.sodium} unit="mg" />
        <MicroRow label="Omega-3" value={nutrients.omega3} unit="g" />
        <MicroRow label="Vitamin A" value={nutrients.vitaminA} unit="mcg" />
      </div>
    </div>
  );
}

function MacroBar({ label, grams, percent, color, showGramsOnly }: {
  label: string;
  grams: number;
  percent: number;
  color: string;
  showGramsOnly?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-stone-600">{label}</span>
        <span className="text-sm text-stone-500">
          {Math.round(grams)}g
          {!showGramsOnly && ` (${Math.round(percent)}%)`}
        </span>
      </div>
      {!showGramsOnly && (
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${Math.min(percent, 100)}%`, transition: 'width 0.5s ease-out' }}
          />
        </div>
      )}
      {showGramsOnly && (
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${Math.min((grams / 30) * 100, 100)}%`, transition: 'width 0.5s ease-out' }}
          />
        </div>
      )}
    </div>
  );
}

function MicroRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex justify-between items-center bg-stone-50 rounded-lg px-3 py-2">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm font-medium text-stone-700">
        {value < 1 ? value.toFixed(1) : Math.round(value)} {unit}
      </span>
    </div>
  );
}
