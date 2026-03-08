// ICMR-NIN 2024 Recommended Dietary Allowances for Indians
export const ICMR_RDA = {
  male: {
    sedentary: { calories: 2110, protein: 54, fat: 25, fiber: 30 },
    moderate: { calories: 2710, protein: 54, fat: 32, fiber: 30 },
    active: { calories: 3470, protein: 54, fat: 40, fiber: 30 },
  },
  female: {
    sedentary: { calories: 1660, protein: 46, fat: 20, fiber: 25 },
    moderate: { calories: 2130, protein: 46, fat: 25, fiber: 25 },
    active: { calories: 2720, protein: 46, fat: 30, fiber: 25 },
  },
  micronutrients: {
    calcium: 1000,
    iron_male: 19,
    iron_female: 29,
    vitaminA: 1000,
    vitaminC: 80,
    vitaminD: 600,
    sodium_max: 2000,
    omega3: 2.2,
    omega6: 6.6,
  },
} as const;

export function getRDA(gender: 'male' | 'female', activityLevel: 'sedentary' | 'moderate' | 'active') {
  const macros = ICMR_RDA[gender][activityLevel];
  const micros = ICMR_RDA.micronutrients;
  return {
    ...macros,
    calcium: micros.calcium,
    iron: gender === 'male' ? micros.iron_male : micros.iron_female,
    vitaminA: micros.vitaminA,
    vitaminC: micros.vitaminC,
    vitaminD: micros.vitaminD,
    sodium: micros.sodium_max,
    omega3: micros.omega3,
    omega6: micros.omega6,
  };
}

// Food groups for variety scoring
export const FOOD_GROUPS = [
  'cereals_grains',
  'pulses_legumes',
  'vegetables',
  'fruits',
  'dairy',
  'meat_fish_eggs',
  'nuts_seeds',
  'fats_oils',
] as const;

export type FoodGroup = typeof FOOD_GROUPS[number];

// Map common Indian foods to food groups
export const FOOD_GROUP_KEYWORDS: Record<FoodGroup, string[]> = {
  cereals_grains: ['rice', 'roti', 'dosa', 'idli', 'chapati', 'paratha', 'neer dosa', 'bread', 'upma', 'poha', 'pongal', 'wheat', 'ragi', 'jowar', 'bajra', 'oats', 'kori rotti', 'pundi', 'naan', 'puri'],
  pulses_legumes: ['dal', 'sambar', 'rasam', 'rajma', 'chole', 'chana', 'moong', 'toor', 'urad', 'lentil', 'beans', 'sprouts', 'chickpea'],
  vegetables: ['sabzi', 'palya', 'curry', 'gourd', 'bhaji', 'salad', 'carrot', 'beans', 'cabbage', 'spinach', 'brinjal', 'potato', 'onion', 'tomato', 'capsicum', 'drumstick', 'pathrade', 'colocasia', 'pumpkin', 'beetroot'],
  fruits: ['banana', 'apple', 'mango', 'papaya', 'orange', 'guava', 'watermelon', 'grapes', 'pomegranate', 'jackfruit', 'coconut water', 'lime', 'fruit'],
  dairy: ['curd', 'yogurt', 'milk', 'buttermilk', 'majjige', 'paneer', 'ghee', 'cheese', 'lassi', 'raita', 'payasam'],
  meat_fish_eggs: ['chicken', 'kori', 'fish', 'egg', 'mutton', 'prawn', 'bangude', 'kane', 'mackerel', 'pomfret', 'surmai', 'meat', 'ghassi', 'sukka'],
  nuts_seeds: ['almond', 'cashew', 'peanut', 'walnut', 'sesame', 'flax', 'chia', 'coconut', 'pistachio'],
  fats_oils: ['oil', 'ghee', 'butter', 'coconut oil', 'mustard oil'],
};
