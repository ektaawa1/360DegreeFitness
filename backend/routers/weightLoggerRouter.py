import json
from datetime import date
from decimal import Decimal

from bson import ObjectId
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from backend.models.userWeightLogger import UserWeightLogger
from backend.db.database import weight_diary_collection

weight_log_router = APIRouter()

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

        weight_log_dict = json.loads(json.dumps(user_weight_log.dict(), cls=CustomEncoder))

        #Append the new weight log to the weight diary's weight logs list
        update_result = await weight_diary_collection.update_one(
            {"user_id": user_id, "date": weight_log_date.isoformat()},
            {
                "$push": {"weights": {"$each": weight_log_dict["weights"]}}
             }
        )

        if update_result.modified_count == 0:
            return JSONResponse(status_code=500, content={"message": "Failed to add weight log"})

        # Fetch the updated weight diary
        updated_weight_diary = await weight_diary_collection.find_one(
            {"user_id": user_id, "date": weight_log_date.isoformat()}
        )

        # Serialize the MongoDB document before returning it
        serialized_weight_diary = serialize_mongo_doc(updated_weight_diary)

        return {
            "message": "Weight log added successfully",
            "weight_diary": serialized_weight_diary
        }
    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})

    except Exception as e:
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