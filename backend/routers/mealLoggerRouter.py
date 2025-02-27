import os
from datetime import date
from typing import Optional
import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
import json
from decimal import Decimal
from bson import ObjectId

from ..db.database import meal_diary_collection, get_meal, update_meal_log, delete_meal_log
from ..models.userMealLogger import UserMealLogger
from ..core.oauth2 import FatSecretAuthorization

meal_log_router = APIRouter()


class FatSecretAPI:  # Utility class for making requests to FatSecret API.
    BASE_URL = os.getenv("FATSECRET_BASE_URL")
    HEADERS = {"Connection": "keep-alive"}

    @staticmethod
    def make_request(endpoint, params):
        access_token = FatSecretAuthorization.get_access_token()

        headers = {
            **FatSecretAPI.HEADERS,  # for unpacking dictionaries
            "Authorization": f"Bearer {access_token}",
        }

        auth_response = requests.get(f"{FatSecretAPI.BASE_URL}/{endpoint}", params=params, headers=headers)

        if auth_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch data from FatSecret API")

        return auth_response.json()


@meal_log_router.get("/v1/360_degree_fitness/search_food/{food_name}")
async def search_food_item_by_name(food_name: str):
    if not food_name or food_name.strip() == "":
        return JSONResponse(status_code=400, content={"message": "Food name cannot be empty."})

    try:
        # Retrieve food details from external API (FatSecret)
        food_data = FatSecretAPI.make_request(
            endpoint="foods/search/v1",
            params={
                "search_expression": food_name,
                "format": "json",
                "page_number": 0,
                "max_results": 10,
                "oauth_token": FatSecretAuthorization.get_access_token()
            }
        )

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
    if not food_id or food_id.strip() == "":
        return JSONResponse(status_code=400, content={"message": "Food ID cannot be empty."})

    try:
        food_data = FatSecretAPI.make_request(
            endpoint="food/v4",
            params={
                "food_id": food_id,
                "format": "json"}
        )
        return JSONResponse(content=food_data)

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": "Internal Server Error"})


@meal_log_router.get("/v1/360_degree_fitness/getMyMealDiary")
async def get_meal_diary(user_id: str, meal_date: date):
    try:
        # Convert date to ISO format string
        meal_date_str = meal_date.isoformat()
        
        meal_diary = await meal_diary_collection.find_one(
            {"user_id": user_id, "date": meal_date_str}
        )

        # If no meal diary is found, return a 404 error
        if not meal_diary:
            return JSONResponse(status_code=404,
                                content={"message": "No meal diary found for this user on the given date"}
                                )

        # Serialize the MongoDB document before returning
        serialized_meal_diary = serialize_mongo_doc(meal_diary)

        # Return the meal diary along with the user_id
        return {
            "user_id": user_id,
            "meal_diary": serialized_meal_diary
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})


# Update the encoder to handle both Decimal and date objects
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, date):
            return obj.isoformat()
        return super(CustomEncoder, self).default(obj)


# Add this function to handle MongoDB document serialization
def serialize_mongo_doc(doc):
    if doc is None:
        return None
    
    if isinstance(doc, dict):
        return {k: serialize_mongo_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc


@meal_log_router.post("/v1/360_degree_fitness/add_meal_log")
async def add_meal_log(user_meal_log: UserMealLogger):
    user_id = user_meal_log.user_id
    meal_log_date = user_meal_log.meal_log_date.isoformat()  # Convert date to ISO format string
    meal_type = user_meal_log.meal_type

    try:
        # Step 1: Check if the meal diary already exists for the user and date
        existing_meal_diary = await meal_diary_collection.find_one(
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
                "daily_nutrition_summary": {
                    "total_calories": 0,
                    "total_fat": 0,
                    "total_carbs": 0,
                    "total_protein": 0
                }
            }
            await meal_diary_collection.insert_one(meal_diary_data)

        # Convert meal log to dict and handle Decimal and date values
        meal_log_dict = json.loads(json.dumps(user_meal_log.dict(), cls=CustomEncoder))
        
        # Get the computed totals (these are calculated automatically)
        total_calories = user_meal_log.total_calories
        total_fat = user_meal_log.total_fat
        total_carbs = user_meal_log.total_carbs
        total_protein = user_meal_log.total_protein

        # Step 4: Append the meal log to a particular meal type
        update_result = await meal_diary_collection.update_one(
            {"user_id": user_id, "date": meal_log_date},
            {
                "$push": {meal_type: meal_log_dict},  # Use the updated dict
                "$inc": {
                    "daily_nutrition_summary.total_calories": total_calories,
                    "daily_nutrition_summary.total_fat": total_fat,
                    "daily_nutrition_summary.total_carbs": total_carbs,
                    "daily_nutrition_summary.total_protein": total_protein
                }
            }
        )

        # Check if the update was successful
        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update meal diary")

        # Step 5: Return the updated meal diary with the new meal log
        updated_meal_diary = await meal_diary_collection.find_one(
            {"user_id": user_id, "date": meal_log_date}
        )

        # Serialize the MongoDB document before returning
        serialized_meal_diary = serialize_mongo_doc(updated_meal_diary)

        return {
            "message": "Meal log added successfully",
            "meal_diary": serialized_meal_diary
        }
    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})

#  Get User Meal Log History API (GET /v1/360_degree_fitness/get_meal_log)
@meal_log_router.get("/v1/360_degree_fitness/get_meal_log")
async def get_user_meal_log(user_id: str, date: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    if not user_id:
        return JSONResponse(status_code=400, content={"message": "User Id is required"})
    try:
        meal_logs = await get_meal(user_id, date, start_date, end_date)

        if not meal_logs:
            return JSONResponse(status_code=404, content={"message": "No meal logs found..."})

        # Serialize the MongoDB documents before returning
        serialized_meal_logs = serialize_mongo_doc(meal_logs)
        
        return JSONResponse(status_code=200, content={"message": "Meal retrieved successfully", "meal_logs": serialized_meal_logs})
    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error getting meal: {str(e)}"})

# Note: Need to discuss the below APIs
#  Update Meal Log API (PUT /v1/360_degree_fitness/update_meal_log)
@meal_log_router.put("/v1/360_degree_fitness/update_meal_log/{meal_log_id}")
async def update_user_meal_log(meal_log_id: str, user_meal: UserMealLogger):
    try:
        if not meal_log_id:
            return JSONResponse(status_code=400, content={"message": "meal_log_id is required for updating meal"})

        updated_data = user_meal.dict(exclude_unset=True)  # Only send the fields that are provided by the user

        await update_meal_log(meal_log_id, updated_data)

        return JSONResponse(status_code=200,
                            content={"message": "Meal log updated successfully", "log_id": meal_log_id})

    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error updating meal log: {str(e)}"})


#  Delete Meal Log API (DELETE /v1/360_degree_fitness/delete_meal_log)
@meal_log_router.delete("/v1/360_degree_fitness/delete_meal_log/{meal_log_id}")
async def delete_user_meal_log(meal_log_id: str):
    try:
        if not meal_log_id:
            return JSONResponse(status_code=400, content={"message": "meal_log_id is required for deleting a meal"})

        await delete_meal_log(meal_log_id)

        return JSONResponse(status_code=200,
                            content={"message": "Meal log deleted successfully", "log_id": meal_log_id})

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
        
        # Serialize the MongoDB documents
        serialized_meal_logs = serialize_mongo_doc(user_meal_logs)

        # Initializing the total nutritional values
        tot_calories = 0
        tot_fat = 0
        tot_carbs = 0
        tot_protein = 0

        for log in serialized_meal_logs:
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
        user_meal_logs = await get_meal(user_id, date, date)  # fetching meal log for a particular day

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
