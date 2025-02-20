from typing import Literal
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
