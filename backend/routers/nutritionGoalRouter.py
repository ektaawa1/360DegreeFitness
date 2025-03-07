from typing import Dict
from fastapi import APIRouter, HTTPException
from backend.db.connection import get_fitness_profile_collection
from backend.models.nutritionalGoals import NutritionalGoals

nutrition_goal_router = APIRouter()

# Activity Level to Activity Factor mapping
activity_level_factors = {
    "Sedentary": 1.2,
    "Lightly active": 1.375,
    "Moderately active": 1.55,
    "Very active": 1.725,
    "Super active": 1.9
}


# BMR Calculator function
def bmr_calculator(age: int, gender: str, weight_in_kg: float, height_in_cm: float) -> float:
    if gender.lower() == "male":
        # Harris-Benedict equation for men
        bmr = 66.5 + (13.75 * weight_in_kg) + (5.003 * height_in_cm) - (6.75 * age)
    elif gender.lower() == "female":
        # Harris-Benedict equation for women
        bmr = 655 + (9.563 * weight_in_kg) + (1.850 * height_in_cm) - (4.676 * age)
    else:
        raise ValueError("Invalid gender")
    return bmr


def nutritional_goals_calculator(age: int, gender: str, weight: float, height: float, activity_level: str) -> Dict[str, float]:
    # Calculate BMR using the user's details
    bmr = bmr_calculator(age, gender, weight, height)

    # Get the activity level factor
    activity_factor = activity_level_factors.get(activity_level)
    if not activity_factor:
        raise ValueError("Invalid activity level")

    # Calculate TDEE/ daily calories required for the day
    tdee = bmr * activity_factor

    # Macronutrient Goals Calculation
    protein_goal = weight  # 1g of protein per kg of body weight
    fat_goal = (tdee * 0.25) / 9  # 25% of TDEE from fat (fat has 9 calories per gram)
    carbs_goal = (tdee - (protein_goal * 4 + fat_goal * 9)) / 4  # Remaining calories from carbs (carbs have 4
    # calories per gram)

    return {
        "total_calories_goal": round(tdee),
        "total_fat_goal": round(fat_goal, 2),
        "total_carbs_goal": round(carbs_goal, 2),
        "total_protein_goal": round(protein_goal, 2)
    }


@nutrition_goal_router.get("/v1/360_degree_fitness/calculate_nutritional_goals/{user_id}")
async def calculate_nutritional_goals(user_id: str):
    try:
        fitness_profiles_collection = get_fitness_profile_collection()
        user_details = await fitness_profiles_collection.find_one({"user_id": user_id})
        if not user_details:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Get details from user profile
        weight = user_details['user_basic_details']['weight_in_kg']
        height = user_details['user_basic_details']['height_in_cm']
        age = user_details['user_basic_details']['age']
        gender = user_details['user_basic_details']['gender'].lower()
        activity_level = user_details['user_habits_assessment']['activity_level']

        # Calculate the nutritional goals based on the user profile details
        nutrition_goals = nutritional_goals_calculator(age, gender, weight, height, activity_level)
        return NutritionalGoals(**nutrition_goals)
        # where to save this data? which collection??
    except ValueError as e:
        return HTTPException(status_code=400, detail=str(e))

    # modify the exceptions later
