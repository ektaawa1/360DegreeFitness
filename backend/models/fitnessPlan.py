from pydantic import BaseModel
from typing import Dict

class MealPlan(BaseModel):
    day_1: Dict[str, str]
    day_2: Dict[str, str]
    day_3: Dict[str, str]
    day_4: Dict[str, str]
    day_5: Dict[str, str]
    day_6: Dict[str, str]
    day_7: Dict[str, str]

class WorkoutPlan(BaseModel):
    day_1: str
    day_2: str
    day_3: str
    day_4: str
    day_5: str
    day_6: str
    day_7: str

class FitnessPlan(BaseModel):
    user_id: str
    plan_duration: str #Duration of the fitness plan
    user_meal_plan: MealPlan #User's 1 week meal plan
    user_workout_plan: WorkoutPlan #User's 1 week exercise plan
    user_sleep_and_lifestyle_suggestions: Dict[str, str]