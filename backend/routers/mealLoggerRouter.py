import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import condecimal
import requests  # For making external API calls
from pymongo.errors import PyMongoError

from backend.models import userMealLogger

meal_log_router = APIRouter()

#Getting the food details from the external api
def get_food_list_from_fatsecret_api(food_name: str):
    fatsecret_api_url = "https://platform.fatsecret.com/rest/foods/search/v1"
    my_oauth_token = os.getenv("EXTERNAL_API_FATSECRET_OAUTH_TOKEN")#Enter here before pushing code

    query_params = {
        "search_expression": food_name,
        "format": "json",
        "page_number": 0,
        "max_results": 10,
        "oauth_token": my_oauth_token
    }

    external_response = requests.get(fatsecret_api_url, params=query_params)

    if external_response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch food details info from FatSecret API")

    return external_response.json()

@meal_log_router.post("/v1/360_degree_fitness/search_food")
async def search_food_item_by_name(food_name: str):
    if not food_name or food_name.strip() == "":
        return JSONResponse(status_code=400, content={"message": "Food name cannot be empty."})
    try:
        # Retrieve food details from external API (FatSecret)
        food_data = get_food_list_from_fatsecret_api(food_name)

        if not food_data.get("foods") or len(food_data["foods"]["food"]) == 0:
            return JSONResponse(status_code=400, content={"message":"Food not found in external database."})

        # Return the list of foods (id, name, description)
        food_list = [
            {
                "food_id": food["food_id"],
                "food_name": food["food_name"],
                "food_description": food["food_description"]
            }
            for food in food_data["foods"]["food"]
        ]

        return {"food_options": food_list}

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error searching food: {str(e)}"})

@meal_log_router.post("/v1/360_degree_fitness/add_meal")
async def add_meal_log(user_meal: userMealLogger):
    try:
        user_food_data = {
            "food_id": user_meal.food_id,
            "food_name": user_meal.food_name,
            "food_description": user_meal.food_description,
            "calories_per_serving": condecimal(ge=0)(user_meal.food_description.split("Calories: ")[1].split("kcal")[0].strip()),
            "fat_per_serving": condecimal(ge=0)(user_meal.food_description.split("Fat: ")[1].split("g")[0].strip()),
            "carbs_per_serving": condecimal(ge=0)(user_meal.food_description.split("Carbs: ")[1].split("g")[0].strip()),
            "protein_per_serving": condecimal(ge=0)(user_meal.food_description.split("Protein: ")[1].split("g")[0].strip())
        }

        # Calculate the nutrition for the logged quantity
        total_calories = user_food_data["calories_per_serving"] * user_meal.quantity_consumed
        total_fat = user_food_data["fat_per_serving"] * user_meal.quantity_consumed
        total_carbs = user_food_data["carbs_per_serving"] * user_meal.quantity_consumed
        total_protein = user_food_data["protein_per_serving"] * user_meal.quantity_consumed

        # Creating the user meal log for the database
        user_meal_log = {
            "user_id": user_meal.user_id,
            "meal_type": user_meal.meal_type,
            "food_id": user_meal.food_id,
            "food_name": user_meal.food_name,
            "quantity": user_meal.quantity_consumed,
            "food_description": user_meal.food_description,
            "total_calories": total_calories,
            "total_fat": total_fat,
            "total_carbs": total_carbs,
            "total_protein": total_protein,
            "date": user_meal.meal_log_date
        }

        # Save the meal log to the Meal log database
        meals_logging_collection = get_meals_logging_collection()
        result = await meals_logging_collection.insert_one(user_meal_log)
        return JSONResponse(status_code=200, content={
            "message": "Meal added successfully", "meal_entry": user_meal_log, "meal_id": str(result.inserted_id)})

    except PyMongoError as e:
        return JSONResponse(status_code=500, content= {"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content= {"message": f"Error adding meal: {str(e)}"})

#  Get User Meal Log History API (GET /v1/360_degree_fitness/get_meal_log)
#  Update Meal Log API (PUT /v1/360_degree_fitness/update_meal_log)
#  Delete Meal Log API (DELETE /v1/360_degree_fitness/delete_meal_log)

#  Get Nutritional Info for Food API (GET /v1/360_degree_fitness/food_nutrition_info)
#  Get Daily/Weekly Nutritional Summary API (GET /v1/360_degree_fitness/nutritional_summary)

#  Get Calorie Chart for the Day (GET /v1/360_degree_fitness/calorie_chart)
#  Get Calorie Intake vs Burnt Tracker (GET /v1/360_degree_fitness/calorie_tracker)
#  Set Base Calorie Goal for User (POST /v1/360_degree_fitness/set_base_goal)