import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from datetime import date

from ..db.database import meal_diary_collection, exercise_diary_collection

#  get calories consumed from the Meal Logger
#  get calories burnt from the Exercise Logger
#  calculate caloric balance or surplus or deficit

calorie_tracker_router = APIRouter()

# assumption
NUTRITION_GOAL_API_URL = "http://localhost:8000/v1/360_degree_fitness/calculate_nutritional_goals/{user_id}"

@calorie_tracker_router.get("/v1/360_degree_fitness/calorie_intake_vs_burnt")
async def calorie_intake_vs_burnt(user_id: str, date: date):
    try:
        date_str = date.isoformat()

        # Log the input date and the formatted date string for debugging
        print(f"Received Date: {date}, Date String: {date_str}")

        # Step 1: Get Calories Consumed
        user_meal_diary = await meal_diary_collection.find_one({"user_id": user_id, "date": date_str})

        if not user_meal_diary:
            return JSONResponse(status_code=404,
                                content={"message": "Meal diary not found for this user on the given date"})

        total_calories_consumed = user_meal_diary.get("daily_nutrition_summary", {}).get("total_calories", 0)

        # Step 2: Get Calories Burnt
        user_exercise_diary = await exercise_diary_collection.find_one({"user_id": user_id, "date": date_str})

        if not user_exercise_diary:
            return JSONResponse(status_code=404,
                                content={"message": "Exercise diary not found for this user on the given date"})

        total_calories_burnt = user_exercise_diary.get("daily_exercise_summary", {}).get("total_calories_burnt", 0)

        # Step 3: Fetch User's Daily Caloric Requirement from Nutrition Goals API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(NUTRITION_GOAL_API_URL.format(user_id=user_id))
                response.raise_for_status()  # Raise an error for non-2xx responses
                nutrition_goals = response.json()
                daily_calories_requirement = int(nutrition_goals["total_calories_goal"])

        except httpx.RequestError as e:
            return JSONResponse(status_code=500, content={"message": f"Error fetching nutrition goals: {str(e)}"})
        except KeyError:
            return JSONResponse(status_code=500, content={"message": "Error: Missing daily_calories_goal in the response"})

        # Step 4: Calculate Caloric Balance
        calories_diff = total_calories_consumed - total_calories_burnt
        if calories_diff > 0:
            caloric_balance = {"status": "surplus", "calories_diff": calories_diff}
        elif calories_diff < 0:
            caloric_balance = {"status": "deficit", "calories_diff": abs(calories_diff)}
        else:
            caloric_balance = {"status": "balanced", "calories_diff": 0}

        # Step 5: Return the result
        return {
            "user_id": user_id,
            "date": date_str,
            "daily_calories_requirement": daily_calories_requirement,
            "total_calories_intake": total_calories_consumed,
            "total_calories_burnt": total_calories_burnt,
            "caloric_balance": caloric_balance
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error fetching data: {str(e)}"})
