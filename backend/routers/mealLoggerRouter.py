import os
from datetime import date
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from ..db.database import add_meal, get_meal, update_meal, delete_meal
from ..models.userMealLogger import UserMealLogger, UserMealDiary

meal_log_router = APIRouter()


# Getting the food list from the external api
def get_food_list_from_fatsecret_api(food_name: str):
    fatsecret_api_url = "https://platform.fatsecret.com/rest/foods/search/v1"
    my_oauth_token = os.getenv("EXTERNAL_API_FATSECRET_OAUTH_TOKEN")

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


@meal_log_router.get("/v1/360_degree_fitness/search_food/{food_name}")
async def search_food_item_by_name(food_name: str):
    if not food_name or food_name.strip() == "":
        return JSONResponse(status_code=400, content={"message": "Food name cannot be empty."})
    try:
        # Retrieve food details from external API (FatSecret)
        food_data = get_food_list_from_fatsecret_api(food_name)

        if not food_data.get("foods") or len(food_data["foods"]["food"]) == 0:
            return JSONResponse(status_code=400, content={"message": "Food not found in external database."})

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


@meal_log_router.get("/v1/360_degree_fitness/getDetailsByFoodId")
async def get_details_by_food_id(food_id: str):
    # external api url
    fatsecret_api_url = "https://platform.fatsecret.com/rest/food/v4"
    my_oauth_token = os.getenv("EXTERNAL_API_FATSECRET_OAUTH_TOKEN")
    query_params = {
        "food_id": food_id,  # The food ID to search for
        "format": "json",    # Response format as JSON
        "oauth_token": my_oauth_token  # OAuth token for authorization
    }

    try:
        # GET request to fetch food details by food_id
        external_response = requests.get(fatsecret_api_url, params=query_params)

        # Raise an HTTP exception if the external api call fails
        if external_response.status_code != 200:
            raise HTTPException(status_code=404, detail="Food not found")

        # Return the raw response from the external API
        return JSONResponse(content=external_response.json())

    except Exception as e:
        return JSONResponse(status_code=500, content={"message":"Internal Server Error"})


@meal_log_router.get("/v1/360_degree_fitness/getMyMealDiary")
async def get_meal_diary(user_id: str, meal_date: date):
    try:
        meal_diary = meal_diary_collection.find_one(
            {"user_id": user_id, "date": meal_date}
        )

        # If no meal diary is found, return a 404 error
        if not meal_diary:
            return JSONResponse(status_code=404, content={"message": "No meal diary found for this user on the given date"}
            )

        # Return the meal diary along with the user_id
        return {
            "user_id": user_id,
            "meal_diary": meal_diary
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})

@meal_log_router.post("/v1/360_degree_fitness/add_meal_log")
async def add_meal_log(user_meal_log: UserMealLogger):
    user_id = user_meal_log.user_id
    meal_log_date = user_meal_log.meal_log_date
    meal_type = user_meal_log.meal_type

    try:

        # Step 1: Check if the meal diary already exists for the user and date
        existing_meal_diary = meal_diary_collection.find_one(
            {"user_id": user_id, "date": meal_log_date}
        )

        # If the meal diary doesn't exist, create a new one
        if not existing_meal_diary:
            meal_diary_data = {
                "user_id": user_id,
                "date": meal_log_date,
                "breakfast": [],
                "lunch": [],
                "dinner": [],
                "snacks": [],
            }
            meal_diary_collection.insert_one(meal_diary_data)

        # Step 2: Calculate total nutrition based on quantity consumed
        total_calories = user_meal_log.calories_per_serving * user_meal_log.quantity_consumed
        total_fat = user_meal_log.fat_per_serving * user_meal_log.quantity_consumed
        total_carbs = user_meal_log.carbs_per_serving * user_meal_log.quantity_consumed
        total_protein = user_meal_log.protein_per_serving * user_meal_log.quantity_consumed

        # Step 3: Update User Meal Logger with total values
        user_meal_log.total_calories = total_calories
        user_meal_log.total_fat = total_fat
        user_meal_log.total_carbs = total_carbs
        user_meal_log.total_protein = total_protein

        # Step 4: Append the meal log to a particular meal type
        update_result = meal_diary_collection.update_one(
            {"user_id": user_id, "date": meal_log_date},
            {"$push": {meal_type: user_meal_log.dict()}}
        )

        #Check if the update was successful
        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update meal diary")

        # Step 5: Return the updated meal diary with the new meal log
        updated_meal_diary = meal_diary_collection.find_one(
            {"user_id": user_id, "date": meal_log_date}
        )

        return {
            "message": "Meal log added successfully",
            "meal_diary": updated_meal_diary
        }
    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})

# Note: Need to discuss the below APIs

#  Get User Meal Log History API (GET /v1/360_degree_fitness/get_meal_log)
@meal_log_router.get("/v1/360_degree_fitness/get_meal_log")
async def get_user_meal_log(user_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    if not user_id:
        return JSONResponse(status_code=400, content={"message": "User Id is required"})
    try:
        meal_logs = await get_meal(user_id, start_date, end_date)
        return JSONResponse(status_code=200, content={"message": "Meal retrieved successfully", "meal_logs": meal_logs})
    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error getting meal: {str(e)}"})

#  Update Meal Log API (PUT /v1/360_degree_fitness/update_meal_log)
@meal_log_router.put("/v1/360_degree_fitness/update_meal/{log_id}")
async def update_user_meal_log(meal_log_id: str, user_meal: UserMealLogger):
    try:
        if not meal_log_id:
            return JSONResponse(status_code=400, content={"message": "log_id is required for updating meal"})

        updated_data = user_meal.dict(exclude_unset=True)  # Only send the fields that are provided by the user

        await update_meal(meal_log_id, updated_data)

        return JSONResponse(status_code=200, content={"message": "Meal log updated successfully", "log_id": meal_log_id})

    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error updating meal log: {str(e)}"})

#  Delete Meal Log API (DELETE /v1/360_degree_fitness/delete_meal_log)
@meal_log_router.delete("/v1/360_degree_fitness/delete_meal/{log_id}")
async def delete_meal_log(meal_log_id: str):
    try:
        if not meal_log_id:
            return JSONResponse(status_code=400, content={"message": "log_id is required for deleting a meal"})

        await delete_meal(meal_log_id)

        return JSONResponse(status_code=200, content={"message": "Meal log deleted successfully", "log_id": meal_log_id})

    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error deleting meal log: {str(e)}"})


#  Get Daily/Weekly Nutritional Summary API (GET /v1/360_degree_fitness/nutritional_summary)
@meal_log_router.get("/v1/360_degree_fitness/nutritional_summary")
async def get_nutritional_summary(user_id: str, start_date: str, end_date: str, period: Optional[str]):
    try:
        # Query the database to get meal logs for the given user and date range
        user_meal_logs = await get_meal(user_id, start_date, end_date)

        # Initializing the total nutritional values
        tot_calories = 0
        tot_fat = 0
        tot_carbs = 0
        tot_protein = 0

        for log in user_meal_logs:
            tot_calories += log.get("total_calories", 0)
            tot_fat += log.get("total_fat", 0)
            tot_carbs += log.get("total_carbs", 0)
            tot_protein += log.get("total_protein", 0)

        # The nutritional summary is being returned
        return {
            "user_id": user_id,
            "start_date": start_date,
            "end_date": end_date,
            "total_calories": tot_calories,
            "total_fat": tot_fat,
            "total_carbs": tot_carbs,
            "total_protein": tot_protein,
            "period": period
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error fetching nutritional summary: {str(e)}"})

#  Get Calorie Chart for the Day (GET /v1/360_degree_fitness/calorie_chart)
@meal_log_router.get("/v1/360_degree_fitness/calorie_chart")
async def get_calorie_chart(user_id: str, date: str):
    try:
        user_meal_logs = await get_meal(user_id, date, date) # fetching meal log for a particular day

        # Initializing the total calories consumed
        total_calories_consumed = 0
        for log in user_meal_logs:
            total_calories_consumed += log.get("total_calories", 0)

        # Note: Later include this part
        # Retrieve user's exercise data (calories burnt) from an external API (assuming a function exists)
        # total_calories_burnt

        # Retrieve the user's base goal (target calories)
        # How to calculate the base goal of the user?
        user_base_goal = 2000

        # Calculate the remaining calories
        calories_left = user_base_goal - total_calories_consumed

        return {
            "user_id": user_id,
            "date": date,
            "total_calories_consumed": total_calories_consumed,
            "calories_left": calories_left,
            "user_base_goal": user_base_goal
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error fetching calorie chart: {str(e)}"})


#  Get Nutritional Info for Food API (GET /v1/360_degree_fitness/food_nutrition_info)
#  Get Calorie Intake vs Burnt Tracker (GET /v1/360_degree_fitness/calorie_tracker)
#  Set Base Calorie Goal for User (POST /v1/360_degree_fitness/set_base_goal)
#  Get Base Calorie Goal for the User
