import os
from datetime import date
from typing import Optional, Dict
import requests
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
import json
from decimal import Decimal
from bson import ObjectId

from ..db.database import meal_diary_collection, get_meal, update_meal_log, delete_meal_log
from ..models.userMealLogger import UserMealLogger
from ..core.oauth2 import FatSecretAuthorization
from datetime import datetime, timedelta

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
# @meal_log_router.put("/v1/360_degree_fitness/update_meal_log/{meal_log_id}")
# async def update_user_meal_log(meal_log_id: str, user_meal: UserMealLogger):
#     try:
#         if not meal_log_id:
#             return JSONResponse(status_code=400, content={"message": "meal_log_id is required for updating meal"})
#
#         updated_data = user_meal.dict(exclude_unset=True)  # Only send the fields that are provided by the user
#
#         await update_meal_log(meal_log_id, updated_data)
#
#         return JSONResponse(status_code=200,
#                             content={"message": "Meal log updated successfully", "log_id": meal_log_id})

    # except PyMongoError as e:
    #     return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    # except Exception as e:
    #     return JSONResponse(status_code=500, content={"message": f"Error updating meal log: {str(e)}"})


def update_nutrition_summary(meal_diary):
    total_calories = 0
    total_fat = 0
    total_carbs = 0
    total_protein = 0

    for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
        meal_list = meal_diary.get(meal_type, [])
        for meal in meal_list:
            total_calories += meal.get("total_calories", 0)
            total_fat += meal.get("total_fat", 0)
            total_carbs += meal.get("total_carbs", 0)
            total_protein += meal.get("total_protein", 0)

    meal_diary["daily_nutrition_summary"] = {
        "total_calories": total_calories,
        "total_fat": total_fat,
        "total_carbs": total_carbs,
        "total_protein": total_protein,
    }

#  Delete Meal Log API (DELETE /v1/360_degree_fitness/delete_meal_log)
@meal_log_router.delete("/v1/360_degree_fitness/delete_meal_log")
async def delete_user_meal_log(delete_meal_request: Dict):
    try:
        user_id = delete_meal_request.get("user_id")
        meal_log_date = delete_meal_request.get("date")
        meal_type = delete_meal_request.get("meal_type")
        index = delete_meal_request.get("index")

        if not user_id or not meal_log_date or not meal_type or index is None:
            return JSONResponse(status_code=400, content={"message": "user_id, date, meal_type, and index are required"})

        #  Check if the meal diary already exists for the user and date
        existing_meal_diary = await meal_diary_collection.find_one(
            {"user_id": user_id, "date": meal_log_date}
        )
        if not existing_meal_diary:
            return JSONResponse(status_code=404, content={"message": f"No meal diary found for {user_id} on {meal_log_date}"})

        existing_meal_list = existing_meal_diary.get(meal_type)

        if existing_meal_list is None:
            return JSONResponse(status_code=400, content={"message": f"Invalid meal type: {meal_type}"})

        if index < 0 or index >= len(existing_meal_list):
            return JSONResponse(status_code=400, content={"message": f"Invalid index: {index}"})

        deleted_meal = existing_meal_list.pop(index)

        #  Recalculate the Nutrition Summary
        update_nutrition_summary(existing_meal_diary)

        #  Save the updated meal diary back to mongoDB
        update_result = await meal_diary_collection.update_one(
            {"user_id": user_id, "date": meal_log_date},
            {
                "$set": {
                    f"{meal_type}": existing_meal_list,
                    "daily_nutrition_summary": existing_meal_diary["daily_nutrition_summary"]
                }
            }
        )

        if update_result.modified_count == 0:
            return JSONResponse(status_code=500, content={"message": "Failed to update this meal diary"})

        # Fetch the updated meal diary (optional, if you want to return it)
        updated_meal_diary = await meal_diary_collection.find_one(
            {"user_id": user_id, "date": meal_log_date}
        )

        serialized_meal_diary = serialize_mongo_doc(updated_meal_diary)

        return JSONResponse(status_code=200, content={
            "message": "Meal log deleted successfully",
            "meal_diary": serialized_meal_diary
        })

    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error deleting meal log: {str(e)}"})


@meal_log_router.get("/v1/360_degree_fitness/getWeeklyNutritionSummary")
async def get_weekly_nutrition_summary(user_id: str = Query(...)):
    try:
        if not user_id:
            return JSONResponse(status_code=400, content={"message": "User ID is required"})

        # Calculate the last 7 days
        today = datetime.today().date()
        print(f"Today's date (UTC): {today}")

        daily_calories = []
        total_macros = {"protein": 0, "carbs": 0, "fat": 0}
        count = 0
        all_meals = []

        for i in range(6, -1, -1):  # last 7 days from oldest to newest
            log_date = (today - timedelta(days=i)).isoformat()
            print(f"Fetching data for date: {log_date}")

            diary = await meal_diary_collection.find_one({
                "user_id": user_id,
                "date": log_date
            })

            if diary:
                summary = diary.get("daily_nutrition_summary", {})
                daily_calories.append(int(round(summary.get("total_calories", 0))))
                total_macros["protein"] += summary.get("total_protein", 0)
                total_macros["carbs"] += summary.get("total_carbs", 0)
                total_macros["fat"] += summary.get("total_fat", 0)
                count += 1

                for meal_type in ["breakfast", "lunch", "dinner", "snacks"]:
                    for meal in diary.get(meal_type, []):
                        all_meals.append({
                            "name": meal_type.capitalize(),
                            "calories": int(round(meal.get("total_calories", 0))),
                            "timestamp": meal.get("meal_log_date", diary.get("date"))
                        })
            else:
                daily_calories.append(0)

        # Avoid division by zero
        if count > 0:
            avg_macros = {
                "protein": int(round(total_macros["protein"] / count)),
                "carbs": int(round(total_macros["carbs"] / count)),
                "fat": int(round(total_macros["fat"] / count)),
            }
        else:
            avg_macros = {"protein": 0, "carbs": 0, "fat": 0}

        # Last 3 meals
        sorted_meals = sorted(all_meals, key=lambda m: m["timestamp"], reverse=True)

        # Adding Last Breakfast, Lunch & Dinner
        last_meals = {}
        for meal in sorted_meals:
            if meal["name"] not in last_meals:
                last_meals[meal["name"]] = meal
            # We will stop adding meals once we have Breakfast, Lunch, and Dinner
            if len(last_meals) == 3:
                break

        # Return meals sorted as Breakfast, Lunch, Dinner if available
        last_3_meals = [
            last_meals.get("Breakfast", {}),
            last_meals.get("Lunch", {}),
            last_meals.get("Dinner", {})
        ]

        # Filter out any empty meals (in case one type is missing)
        last_3_meals = [meal for meal in last_3_meals if meal]

        return {
            "dailyCalories": daily_calories,
            "macros": avg_macros,
            "meals": last_3_meals
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})
