from typing import Literal, List
from pydantic import BaseModel, condecimal, computed_field
from datetime import date


class UserMealLogger(BaseModel):
    user_id: str
    meal_type: Literal[
        "breakfast",
        "lunch",
        "snacks",
        "dinner"
    ]
    food_id: str  # Food ID from the external API
    food_name: str
    quantity_consumed: condecimal(ge=0.1)  # Quantity must be greater than 0
    food_description: str  # Nutrition Details
    calories_per_serving: condecimal(ge=0)
    fat_per_serving: condecimal(ge=0)
    carbs_per_serving: condecimal(ge=0)
    protein_per_serving: condecimal(ge=0)
    meal_log_date: date

    # Computed total fields based on number of servings consumed
    @computed_field
    @property
    def total_calories(self) -> float:
        return float(self.calories_per_serving * self.quantity_consumed)  # Total calories for all servings

    @computed_field
    @property
    def total_fat(self) -> float:
        return float(self.fat_per_serving * self.quantity_consumed)  # Total fat for all servings

    @computed_field
    @property
    def total_carbs(self) -> float:
        return float(self.carbs_per_serving * self.quantity_consumed)  # Total carbs for all servings

    @computed_field
    @property
    def total_protein(self) -> float:
        return float(self.protein_per_serving * self.quantity_consumed)  # Total protein for all servings

class UserMealDiary(BaseModel):
    user_id: str
    date: date
    breakfast: List[UserMealLogger] = []  # A List of breakfast logs
    lunch: List[UserMealLogger] = []      # A List of lunch logs
    dinner: List[UserMealLogger] = []     # A List of dinner logs
    snacks: List[UserMealLogger] = []     # A List of snacks logs
    daily_nutrition_summary: dict = {
        "total_calories": 0, # daily_calories_summary
        "total_fat": 0,
        "total_carbs": 0,
        "total_protein": 0
    }
