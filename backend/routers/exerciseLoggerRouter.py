import json
import os
from datetime import date
from typing import Dict

import httpx
from bson import ObjectId
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from ..models.userExerciseLogger import UserExerciseDiary
from ..db.database import exercise_diary_collection

exercise_log_router = APIRouter()

#  External API to fetch exercise details
NUTRITIONIX_API_URL = os.getenv("NUTRITIONIX_API_URL")
NUTRITIONIX_APP_ID = os.getenv("NUTRITIONIX_APP_ID")
NUTRITIONIX_API_KEY = os.getenv("NUTRITIONIX_API_KEY")



# Update the encoder to handle both Decimal and date objects
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, float):
            return obj
        elif isinstance(obj, date):
            return obj.isoformat()
        elif isinstance(obj, ObjectId):
            return str(obj)
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

@exercise_log_router.get("/v1/360_degree_fitness/getMyExerciseDiary")
async def get_exercise_diary(user_id: str, exercise_date: date):
    try:
        # Convert date to ISO format string
        exercise_date_str = exercise_date.isoformat()

        # Fetch the existing exercise diary from MongoDB
        exercise_diary = await exercise_diary_collection.find_one(
            {"user_id": user_id, "date": exercise_date_str}
        )

        # If no exercise diary is found, return a 404 error
        if not exercise_diary:
            return JSONResponse(status_code=404,
                                content={"message": "No exercise diary found for this user on the given date"}
                                )

        # Serialize the MongoDB document before returning
        serialized_exercise_diary = serialize_mongo_doc(exercise_diary)

        # Return the exercise diary along with the user_id
        return {
            "user_id": user_id,
            "exercise_diary": serialized_exercise_diary
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})


#  Update the exercise diary summary
def update_exercise_summary(exercise_diary):
    total_calories_burnt = 0.0
    total_duration = 0

    for exercise in exercise_diary.get("exercises", []):
        total_calories_burnt += float(exercise.get("calories_burnt", 0))
        total_duration += exercise.get("duration_minutes", 0)

    exercise_diary["daily_exercise_summary"] = {
        "total_calories_burnt": total_calories_burnt,
        "total_duration": total_duration,
    }
    return exercise_diary

@exercise_log_router.post("/v1/360_degree_fitness/addExerciseLog")
async def add_exercise_log(exercise_log_request: UserExerciseDiary):
    print("Inside add exercise Log function")
    user_id = exercise_log_request.user_id
    exercise_log_date = exercise_log_request.date.isoformat()
    user_exercise_log = exercise_log_request.exercises[0] if exercise_log_request.exercises else None

    if not user_id or not exercise_log_date or not user_exercise_log:
        return JSONResponse(status_code=400, content={"message": "Missing required fields."})

    print(f"user_id is: {user_id}")
    print(f"exercise log date: {exercise_log_date}")
    print(f"exercise log details: {user_exercise_log}")
    try:
        # Fetch the existing exercise diary from MongoDB
        existing_exercise_diary = await exercise_diary_collection.find_one(
            {"user_id": user_id, "date": exercise_log_date}
        )

        # If the exercise diary doesn't exist, create a new one
        if not existing_exercise_diary:
            exercise_diary_data = {
                "user_id": user_id,
                "date": exercise_log_date,
                "exercises": [],
                "daily_exercise_summary": {
                    "total_calories_burnt": 0.0,
                    "total_duration": 0
                }
            }
            await exercise_diary_collection.insert_one(exercise_diary_data)
            # Get the inserted document to work with it
            existing_exercise_diary = exercise_diary_data

        # Convert exercise log to dict and handle Decimal and date values
        exercise_log_dict = json.loads(json.dumps(user_exercise_log.dict(), cls=CustomEncoder))

        # Ensure that calories_burnt is converted to float before saving
        exercise_log_dict['calories_burnt'] = float(exercise_log_dict.get('calories_burnt', 0))

        # Step 4: Append the exercise log to the exercise diary's exercise list
        update_result = await exercise_diary_collection.update_one(
            {"user_id": user_id, "date": exercise_log_date},
            {
                "$push": {"exercises": exercise_log_dict}
            }
        )

        # Step 5: After adding the exercise log, recalculate the daily exercise summary
        updated_exercise_diary = await exercise_diary_collection.find_one(
            {"user_id": user_id, "date": exercise_log_date}
        )

        # Call update_exercise_summary to recalculate totals
        updated_exercise_diary = update_exercise_summary(updated_exercise_diary)

        # Step 6: Update the exercise diary with the new daily summary
        await exercise_diary_collection.update_one(
            {"user_id": user_id, "date": exercise_log_date},
            {
                "$set": {"daily_exercise_summary": updated_exercise_diary["daily_exercise_summary"]}
            }
        )

        # Serialize the MongoDB document before returning
        serialized_exercise_diary = json.loads(json.dumps(updated_exercise_diary, cls=CustomEncoder))

        return {
            "message": "Exercise log added successfully",
            "exercise_diary": serialized_exercise_diary
        }

    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})

@exercise_log_router.delete("/v1/360_degree_fitness/delete_exercise_log")
async def delete_user_exercise_log(delete_exercise_request: Dict):
    try:
        user_id = delete_exercise_request.get("user_id")
        exercise_log_date = delete_exercise_request.get("date")
        exercise_type = delete_exercise_request.get("exercise_type")
        index = int(delete_exercise_request.get("index"))

        if not user_id or not exercise_log_date or not exercise_type or index is None:
            return JSONResponse(status_code=400, content={"message": "user_id, date, exercise_type, and index are required"})

        # Check if the exercise diary exists for the user and date
        existing_exercise_diary = await exercise_diary_collection.find_one(
            {"user_id": user_id, "date": exercise_log_date}
        )
        if not existing_exercise_diary:
            return JSONResponse(status_code=404, content={"message": f"No exercise diary found for {user_id} on {exercise_log_date}"})

        # Check if the exercise type is valid
        existing_exercises = existing_exercise_diary.get("exercises", [])
        if existing_exercises is None:
            return JSONResponse(status_code=400, content={"message": "No exercises found for this user on this date"})

        # Log the current exercises before deletion
        print(f"Existing exercises before deletion: {existing_exercises}")
        print(f"Index to delete: {index}")

        # Validate the index
        if index < 0 or index >= len(existing_exercises):
            return JSONResponse(status_code=400, content={"message": f"Invalid index: {index}"})

        #Validate exercise type before deleting the log
        exercise_to_delete = existing_exercises[index]
        print(f"Exercise Log to be deleted is: {exercise_to_delete}")
        if exercise_to_delete["exercise_type"] != exercise_type:
            return JSONResponse(status_code=400, content={"message":"Exercise type is not matching"})

        # Remove the exercise from the list
        deleted_exercise = existing_exercises.pop(index)
        print(f"Deleted exercise: {deleted_exercise}")

        # Recalculate the Exercise Summary
        # updated_exercise_diary = update_exercise_summary(existing_exercise_diary)
        # Recalculate the Exercise Summary **after** modifying the exercises list
        updated_exercise_diary = update_exercise_summary({
            "exercises": existing_exercises,  # Only pass the updated exercises list
            "daily_exercise_summary": existing_exercise_diary.get("daily_exercise_summary", {})
        })

        # Log the updated exercise summary
        print(f"Updated exercise summary: {updated_exercise_diary['daily_exercise_summary']}")

        # Save the updated exercise diary back to MongoDB
        update_result = await exercise_diary_collection.update_one(
            {"user_id": user_id, "date": exercise_log_date},
            {
                "$set": {
                    "exercises": existing_exercises,
                    "daily_exercise_summary": updated_exercise_diary["daily_exercise_summary"]
                }
            }
        )

        # Log the result of the update operation
        print(f"Update result: {update_result.modified_count}")

        if update_result.modified_count == 0:
            return JSONResponse(status_code=500, content={"message": "Failed to update exercise diary"})

        # Fetch the updated exercise diary (optional, if you want to return it)
        updated_exercise_diary = await exercise_diary_collection.find_one(
            {"user_id": user_id, "date": exercise_log_date}
        )

        # Serialize the MongoDB document before returning
        serialized_exercise_diary = serialize_mongo_doc(updated_exercise_diary)

        return JSONResponse(status_code=200, content={
            "message": "Exercise log deleted successfully",
            "exercise_diary": serialized_exercise_diary
        })

    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error deleting exercise log: {str(e)}"})


#  Adjust the calories burnt based on the intensity type entered by the user
def adjust_calories_burnt(calories_burnt, intensity_type):
    intensity_factors = {
        "low": 0.9, #  10% reduction in calories burnt
        "moderate": 1, #  No change
        "high": 1.2 #  20% increase in calories burnt
    }

    exercise_intensity_factor = intensity_factors.get(intensity_type, 1) #  Default value is 1 if intensity_type is unknown
    adjusted_calories_burnt = calories_burnt * exercise_intensity_factor

    return adjusted_calories_burnt


@exercise_log_router.post("/v1/360_degree_fitness/calculateCaloriesBurnt")
async def calculate_calories_burnt(exercise_info_req: Dict):
    try:
        exercise_type = exercise_info_req.get("exercise_type")
        duration_minutes = exercise_info_req.get("duration_minutes")
        user_id = exercise_info_req.get("user_id")
        date_logged = exercise_info_req.get("date")
        intensity_type = exercise_info_req.get("intensity_type")

        if not exercise_type or not duration_minutes:
            return JSONResponse(status_code=400, content={"message": "exercise_type and duration_minutes are required"})

        # Make the external call to the Nutritionix API
        async with httpx.AsyncClient() as client:
            exercise_response = await client.post(
                NUTRITIONIX_API_URL,
                json={"query": f"{exercise_type} for {duration_minutes} minutes"},  # Body with exercise description
                headers={
                    "x-app-id": NUTRITIONIX_APP_ID,  # app_id header
                    "x-app-key": NUTRITIONIX_API_KEY,  # app_key header
                    "Content-Type": "application/json"  # Content-Type header
                }
            )

        # Check if the response status is successful
        if exercise_response.status_code != 200:
            return JSONResponse(status_code=500, content={"message": "Error calling Nutritionix API"})

        # Parse the response data
        exercise_data = exercise_response.json()

        # Check if the response contains the exercise data
        if "exercises" not in exercise_data or len(exercise_data["exercises"]) == 0:
            return JSONResponse(status_code=404, content={"message": "No exercise data found"})

        exercise = exercise_data["exercises"][0]

        final_calories_burnt = adjust_calories_burnt(exercise["nf_calories"], intensity_type)

        # Return the calories burnt info from the response
        return JSONResponse(status_code=200, content={
            "message": "Calories burnt calculated successfully",
            "data": {
            "user_id": user_id,
            "date": date_logged,
            "exercise_type": exercise_type,
            "duration_minutes": duration_minutes,
            "intensity_type": intensity_type,
            "calories_burnt": round(final_calories_burnt, 2)
        }
    })

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error calculating calories: {str(e)}"})