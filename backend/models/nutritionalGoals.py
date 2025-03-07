from pydantic import BaseModel, condecimal


class NutritionalGoals(BaseModel):  # decide where to add this class or create it separately?
    total_calories_goal: condecimal(ge=0)
    total_fat_goal: condecimal(ge=0)
    total_carbs_goal: condecimal(ge=0)
    total_protein_goal: condecimal(ge=0)