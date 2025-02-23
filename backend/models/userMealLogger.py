from typing import Literal, List
from pydantic import BaseModel, condecimal
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

class UserMealDiary(BaseModel):
    date: date
    breakfast: List[UserMealLogger] = []  # A List of breakfast logs
    lunch: List[UserMealLogger] = []      # A List of lunch logs
    dinner: List[UserMealLogger] = []     # A List of dinner logs
    snacks: List[UserMealLogger] = []     # A List of snacks logs

