import json
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict

from bson import ObjectId
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from ..models.userWeightLogger import UserWeightLogger
from ..db.database import weight_diary_collection, profiles_collection, changes_collection

weight_log_router = APIRouter()

# Update the encoder to handle both Decimal and date objects
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, date):
            return obj.isoformat()
        elif isinstance(obj, datetime):
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

@weight_log_router.get("/v1/360_degree_fitness/getMyWeightDiary")
async def get_weight_diary(user_id: str, weight_log_date: date):
    try:
        weight_diary = await weight_diary_collection.find_one(
            {"user_id": user_id, "date": weight_log_date.isoformat()}
        )
        if not weight_diary:
            return JSONResponse(status_code=404, content=
            {
                "message": "Weight diary not found for this user on the given date"
            })

        serialized_weight_diary = serialize_mongo_doc(weight_diary)

        # Return the exercise diary along with the user_id
        return {
            "user_id": user_id,
            "weight_diary": serialized_weight_diary
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})

@weight_log_router.post("/v1/360_degree_fitness/addWeightLog")
async def add_weight_log(user_weight_log: UserWeightLogger):
    user_id = user_weight_log.user_id
    weight_log_date = user_weight_log.date
    
    # Debug print
    print(f"Processing weight log for user {user_id} on date {weight_log_date}")
    print(f"Weight entries: {user_weight_log.weights}")
    
    try:
        existing_weight_diary = await weight_diary_collection.find_one(
            {"user_id": user_id, "date": weight_log_date.isoformat()}
        )

        # If the weight diary doesn't exist, create a new one
        if not existing_weight_diary:
            weight_diary_data = {
                "user_id": user_id,
                "date": weight_log_date.isoformat(),
                "weights": []
            }
            await weight_diary_collection.insert_one(weight_diary_data)
            print(f"Created new weight diary for user {user_id} on date {weight_log_date}")

        # Convert the model to a dictionary and handle date/time serialization
        weight_log_dict = json.loads(json.dumps(user_weight_log.dict(), cls=CustomEncoder))
        
        # Debug print
        print(f"Converted weight log: {weight_log_dict}")

        # Append the new weight log to the weight diary's weight logs list
        update_result = await weight_diary_collection.update_one(
            {"user_id": user_id, "date": weight_log_date.isoformat()},
            {
                "$push": {"weights": {"$each": weight_log_dict["weights"]}}
             }
        )
        
        print(f"Weight diary update result: {update_result.modified_count} documents modified")

        if update_result.modified_count == 0:
            return JSONResponse(status_code=500, content={"message": "Failed to add weight log"})

        # Fetch the updated weight diary
        updated_weight_diary = await weight_diary_collection.find_one(
            {"user_id": user_id, "date": weight_log_date.isoformat()}
        )
        
        print(f"Updated weight diary: {updated_weight_diary}")

        # # Get the latest weight value from the weights array
        # if updated_weight_diary and "weights" in updated_weight_diary and updated_weight_diary["weights"]:
        #     latest_weight = updated_weight_diary["weights"][-1]  # Get the most recently added weight
        #     weight_value = latest_weight.get("weight", None)
        #
        #     print(f"Latest weight value: {weight_value}")
        #
        #     if weight_value is not None:
        #         # Get the current profile to retrieve the old weight value and copy its structure
        #         user_profile = await profiles_collection.find_one({"user_id": user_id})
        #
        #         print(f"User profile found: {user_profile is not None}")
        #
        #         if user_profile:
        #             # Get the old weight value for logging the change
        #             old_weight = user_profile.get("user_basic_details", {}).get("weight_in_kg", None)
        #
        #             print(f"Old weight: {old_weight}, New weight: {weight_value}")
        #
        #             # Only update the weight field in the fitness profile
        #             update_data = {
        #                 "user_basic_details.weight_in_kg": weight_value,
        #                 "user_basic_details.last_weight_update": weight_log_date.isoformat()
        #             }
        #
        #             # Update only the weight field in the profile
        #             profile_update_result = await profiles_collection.update_one(
        #                 {"user_id": user_id},
        #                 {"$set": update_data}
        #             )
        #
        #             print(f"Profile update result: {profile_update_result.modified_count} documents modified")
        #
        #             # Create a copy of the user profile for the change log
        #             # This ensures the change log has the same structure as the profile
        #             profile_copy = dict(user_profile)
        #
        #             # Remove the _id field from the copy
        #             if "_id" in profile_copy:
        #                 del profile_copy["_id"]
        #
        #             # Update the weight in the copy to the new value
        #             if "user_basic_details" in profile_copy:
        #                 profile_copy["user_basic_details"]["weight_in_kg"] = weight_value
        #
        #             # Add metadata fields
        #             profile_copy["change_type"] = "weight_update"
        #             profile_copy["source"] = "weight_logger"
        #             profile_copy["date"] = weight_log_date.isoformat()
        #             profile_copy["timestamp"] = datetime.utcnow()
        #
        #             # Insert the change record with the full profile structure
        #             change_result = await changes_collection.insert_one(profile_copy)
        #             print(f"Change record inserted with ID: {change_result.inserted_id}")

        # Serialize the MongoDB document before returning it
        serialized_weight_diary = serialize_mongo_doc(updated_weight_diary)

        return {
            "message": "Weight log added successfully",
            "weight_diary": serialized_weight_diary
        }
    except PyMongoError as e:
        print(f"MongoDB error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Internal Server Error: {str(e)}"})


@weight_log_router.delete("/v1/360_degree_fitness/delete_weight_log")
async def delete_user_weight_log(delete_weight_request: Dict):
    try:
        # Getting the relevant data from the request
        user_id = delete_weight_request.get("user_id")
        weight_log_date = delete_weight_request.get("date")
        index = delete_weight_request.get("index")

        if not user_id or not weight_log_date or index is None:
            return JSONResponse(status_code=400, content={"message": "user_id, date, and index are required"})

        # Check if the weight diary exists for the user and date
        existing_weight_diary = await weight_diary_collection.find_one(
            {"user_id": user_id, "date": weight_log_date}
        )
        if not existing_weight_diary:
            return JSONResponse(status_code=404, content=
            {
                "message": f"No weight diary found for {user_id} on {weight_log_date}"
            }
                                )

        # Check if there are any weights for this date
        existing_weights = existing_weight_diary.get("weights", [])

        # Validate the index to ensure it's within the range of the weights list
        if index < 0 or index >= len(existing_weights):
            return JSONResponse(status_code=400, content={"message": f"Invalid index: {index}"})

        # Remove the weight log at the specified index
        existing_weights.pop(index)

        # Update the weight diary in the database with the modified list of weights
        update_result = await weight_diary_collection.update_one(
            {"user_id": user_id, "date": weight_log_date},
            {
                "$set": {
                    "weights": existing_weights
                }
            }
        )

        # If no document was updated, return an error
        if update_result.modified_count == 0:
            return JSONResponse(status_code=500, content={"message": "Failed to delete weight log"})

        # Fetch the updated weight diary
        updated_weight_diary = await weight_diary_collection.find_one(
            {"user_id": user_id, "date": weight_log_date}
        )

        # Serialize the MongoDB document before returning it
        serialized_weight_diary = serialize_mongo_doc(updated_weight_diary)

        # Return the response
        return JSONResponse(status_code=200, content={
            "message": "Weight log deleted successfully",
            "weight_diary": serialized_weight_diary
        })
    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Error deleting weight log: {str(e)}"})


# Helper function to calculate the date range based on the time range
def get_date_range(time_range: str):
    today = datetime.today()  # Get today's date

    if time_range == "1d":
        start_date = today - timedelta(days=1)  # 1 day before today
    elif time_range == "1w":
        start_date = today - timedelta(weeks=1)  # 1 week before today
    elif time_range == "1m":
        start_date = today - timedelta(days=30)  # 30 days before today
    elif time_range == "3m":
        start_date = today - timedelta(days=90)  # 3 months (approx 90 days) before today
    elif time_range == "6m":
        start_date = today - timedelta(days=180)  # 6 months (approx 180 days) before today
    elif time_range == "1y":
        start_date = today - timedelta(days=365)  # 1 year (365 days) before today
    else:
        raise ValueError("Invalid time range")  # Error if time range is unsupported

    # Set the end date as today's date
    end_date = today

    return start_date.date(), end_date.date()  # Return both start and end date as date objects


@weight_log_router.get("/v1/360_degree_fitness/get_weight_logs")
async def get_weight_logs(user_id: str, time_range: str):
    # Validate time range input
    if time_range not in ["1d", "1w", "1m", "3m", "6m", "1y"]:
        return JSONResponse(status_code=400, content={"message": "Invalid time range"})

    try:
        # Calculate start_date and end_date for the given time range
        start_date, end_date = get_date_range(time_range)

        # For Debugging purpose
        print(f"Start Date: {start_date}")
        print(f"End Date: {end_date}")

        # Format the dates as strings for MongoDB
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")

        # Step 1: Retrieve the most recent weight log before the start of the time range
        weight_diary = await weight_diary_collection.find_one(
            {"user_id": user_id, "date": {"$lt": start_date_str}}
        )

        starting_weight = None
        if weight_diary and weight_diary.get("weights"):
            # Get the most recent weight log before the start of the selected time range
            weight_logs = weight_diary["weights"]
            # Get the most recent weight log
            starting_weight = weight_logs[-1]["weight_in_kg"]
        else:
            # Step 2: If no weight log exists before the start of the range, get the starting weight from profile
            user_profile = await profiles_collection.find_one({"user_id": user_id})
            if user_profile:
                starting_weight = user_profile["user_basic_details"].get("weight_in_kg")

        if starting_weight is None:
            return JSONResponse(status_code=404, content={"message": "No starting weight available"})

        # Step 3: Get weight logs within the selected time range (start date to end date)
        weight_logs = []
        async for diary in weight_diary_collection.find(
                {"user_id": user_id, "date": {"$gte": start_date_str, "$lte": end_date_str}}
        ):
            if diary.get("weights"):
                for weight_entry in diary["weights"]:
                    weight_log = {
                        "date": diary["date"],
                        "weight_in_kg": weight_entry.get("weight_in_kg"),
                        "notes": weight_entry.get("notes", None)
                    }
                    weight_logs.append(weight_log)

        # Step 4: Return the response with starting_weight and weight_logs
        print("Weight Logs are", weight_logs)
        return {
            "user_id": user_id,
            "starting_weight": starting_weight,
                "weight_logs": weight_logs
        }

    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Unexpected error: {str(e)}"})