export type DateRangeOption = '1W' | '1M' | '3M' | '6M' | '1Y';

export interface NutritionData {
    dailyCalories: number[];
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    meals: Array<{
        time: string;
        name: string;
        calories: number;
    }>;
}

export interface ExerciseData {
    weeklyWorkouts: number[];
    caloriesBurned: number[];
    lastWorkouts: Array<{
        type: string;
        duration: number;
        calories: number;
    }>;
}

export interface WeightData {
    trend: number[];
    goal: number;
}

export interface DashboardState {
    nutrition: NutritionData | null;
    exercise: ExerciseData | null;
    weight: WeightData | null;
    loading: boolean;
}