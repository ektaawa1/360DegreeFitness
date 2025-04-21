export interface NutritionData {
    dailyCalories: number[];
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    meals: Array<{
        date: string;
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


export interface DashboardState {
    nutrition: NutritionData | null;
    exercise: ExerciseData | null;
    weightData: any;
    targetWeight: number | null;
    loading: boolean;
}