export interface FoodItem {
  name: string;
  nameKannada?: string;
  quantity: string;
  estimatedGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isEstimated: boolean;
}

export interface NutrientBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  saturatedFat: number;
  sugar: number;
  sodium: number;
  calcium: number;
  iron: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  omega3: number;
  omega6: number;
}

export interface Meal {
  id: string;
  photo: Blob;
  photoThumbnail: Blob;
  timestamp: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: FoodItem[];
  nutrients: NutrientBreakdown;
  notes: string;
  feelingNotes: string;
  score: number;
  scoreExplanation: string;
  suggestions: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  unit: string;
  current: number;
  period: 'daily' | 'weekly';
  createdAt: number;
  category: 'nutrient' | 'habit' | 'custom';
  nutrientKey?: keyof NutrientBreakdown;
}

export interface NutritionScoreRecord {
  date: string;
  score: number;
  mealsLogged: number;
  breakdown: {
    variety: number;
    balance: number;
    consistency: number;
    micronutrients: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UserSettings {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'moderate' | 'active';
  dietaryPreferences: string[];
  healthConditions: string[];
}

export type MealType = Meal['mealType'];

export interface AnalysisResponse {
  items: FoodItem[];
  totalNutrients: NutrientBreakdown;
  mealScore: number;
  scoreExplanation: string;
  suggestions: string;
  confidence: 'high' | 'medium' | 'low';
}
