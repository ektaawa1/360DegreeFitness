from bson import ObjectId
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from ..models.userFitnessProfile import UserFitnessProfile
from ..models.userFitnessProfileUpdate import UserFitnessProfileUpdate
from ..db.connection import get_fitness_profile_collection
from decimal import Decimal
import json

profile_router = APIRouter()

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# create user fitness profile
@profile_router.post("/v1/360_degree_fitness/create_fitness_profile")
async def create_fitness_profile(user_profile: UserFitnessProfile):
    # Get collection inside the handler
    fitness_profiles_collection = get_fitness_profile_collection()
    
    try:
        # Convert Pydantic model to dict and handle Decimal conversion
        profile_dict = json.loads(
            json.dumps(user_profile.dict(), cls=DecimalEncoder)
        )
        
        result = await fitness_profiles_collection.insert_one(profile_dict)
        return {"message": "User fitness profile created successfully!", "profile_id": str(result.inserted_id)}
    except PyMongoError as e:
        return JSONResponse(status_code=500, content= {"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content= {"message": f"Error creating profile: {str(e)}"})

# retrieve user fitness profile
@profile_router.get("/v1/360_degree_fitness/get_fitness_profile/{user_id}")
async def get_fitness_profile(user_id: str):
    # Get collection inside the handler
    fitness_profiles_collection = get_fitness_profile_collection()

    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        return JSONResponse(status_code=400, content= {"message": "Invalid user id format"})
    try:
        user_profile = await fitness_profiles_collection.find_one({"_id": user_id})
        print("----User Profile----:", user_profile)

        if user_profile is None:
            print("Profile does not exist.") # debug
            return JSONResponse(status_code=200, content={"message": "User Profile does not exist"})

        user_profile["_id"] = str(user_profile["_id"])
        return user_profile
    except PyMongoError as e:
        return JSONResponse(status_code=500, content= {"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content= {"message": f"Error fetching user profile: {str(e)}"})

#edit user fitness profile
@profile_router.put("/v1/360_degree_fitness/edit_fitness_profile/{user_id}")
async def edit_fitness_profile(user_id: str, updated_profile: UserFitnessProfileUpdate):
    # Get collection inside the handler
    fitness_profiles_collection = get_fitness_profile_collection()

    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        return JSONResponse(status_code=400, content= {"message": "Invalid user id format"})
    try:
        #Fetching user's existing profile
        existing_profile = await fitness_profiles_collection.find_one({"_id": user_id})

        print("----Existing User Profile----:", existing_profile)
        if not existing_profile:
            #do we need to throw an exception??
            return JSONResponse(status_code=404, content= {"message": "Profile not found"})

        # Preparing the data to be updated by checking which fields were provided
        updated_data = {}
        if updated_profile.user_basic_details:
            updated_data["user_basic_details"] = updated_profile.user_basic_details.dict(exclude_unset=True)
        if updated_profile.user_fitness_goals:
            updated_data["user_fitness_goals"] = updated_profile.user_fitness_goals
        if updated_profile.user_initial_measurements:
            updated_data["user_initial_measurements"] = updated_profile.user_initial_measurements.dict(exclude_unset=True)
        if updated_profile.user_health_details:
            updated_data["user_health_details"] = updated_profile.user_health_details.dict(exclude_unset=True)
        if updated_profile.user_habits_assessment:
            updated_data["user_habits_assessment"] = updated_profile.user_habits_assessment.dict(exclude_unset=True)
        if updated_profile.user_routine_assessment:
            updated_data["user_routine_assessment"] = updated_profile.user_routine_assessment.dict(exclude_unset=True)

        # It converts Decimal fields to float using DecimalEncoder
        updated_data = json.loads(json.dumps(updated_data, cls=DecimalEncoder))

        # Perform the partial update in the database
        result = await fitness_profiles_collection.update_one(
            {"_id": user_id}, {"$set": updated_data}
        )

        if result.modified_count > 0:
            return {"message": "Profile updated successfully"}
        else:
            return {"message": "No changes were made"}
    except PyMongoError as e:
        return JSONResponse(status_code=500, content= {"message": f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content= {"message": f"Error encountered with profile update: {str(e)}"})

# delete user fitness profile
@profile_router.delete("/v1/360_degree_fitness/delete_fitness_profile/{user_id}")
async def delete_fitness_profile(user_id: str):
    # Get collection inside the handler
    fitness_profiles_collection = get_fitness_profile_collection()

    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        return JSONResponse(status_code=400, content={"message": "Invalid user id format"})
    try:
        print("----Attempting to delete profile with user_id:----:", user_id)
        #do we need to check here if the user profile exists or not?
        # MongoDB access to delete the fitness profile
        result = await fitness_profiles_collection.delete_one({"_id": user_id})
        print("----Delete result----", {result.deleted_count})
        if result.deleted_count == 0:
            print("Profile not found for user_id:", user_id)
            return JSONResponse(status_code=200, content={"message": "Profile not found"})

        return {"message": "Profile deleted successfully"}
    except PyMongoError as e:
        print("Database error encountered")
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        print("Something went wrong... Error deleting user profile")

        return JSONResponse(status_code=500, content={"message": f"Error deleting user profile: {str(e)}"})

# is user fitness profile created & completed?
@profile_router.get("/v1/360_degree_fitness/check_profile_completion/{user_id}")
async def check_profile_complete(user_id: str):
    # Get collection inside the handler
    fitness_profiles_collection = get_fitness_profile_collection()
    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        return JSONResponse(status_code=400, content= {"message": "Invalid user id format"})
    try:
        # Fetch User Profile from DB
        user_profile = await fitness_profiles_collection.find_one({"_id": user_id})
        print("----User Profile----:", user_profile)

        # If user profile doesn't exist then return False
        if user_profile is None:
            print("Profile does not exist.") # debug log
            return {"profile_exists": False, "profile_complete": False}

        # Check if the user profile contains all necessary fields
        is_complete = True
        required_fields = [
            "user_basic_details",
            "user_initial_measurements",
            "user_health_details",
            "user_habits_assessment",
            "user_routine_assessment",
            "user_fitness_goals"
        ]

        for field in required_fields:
            if field not in user_profile:
                is_complete = False
                print(f"Missing field: {field}")  # debug log
                break

        return {"profile_exists": True, "profile_complete": is_complete,}
    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message":f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Unexpected error: {str(e)}"})