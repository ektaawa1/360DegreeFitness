import os
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from ..db.database import update_latest_profile, log_profile_change
from ..models.userFitnessProfile import UserFitnessProfile
from ..models.userFitnessProfileUpdate import UserFitnessProfileUpdate
from ..db.connection import get_fitness_profile_collection
from decimal import Decimal
import json
import httpx

# Get the backend service URL from environment variable, default to localhost for development
BACKEND_SERVICE_URL = os.getenv('BACKEND_SERVICE_URL', 'http://localhost:8000')

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
        # Make sure that user_id is passed correctly from the upstream
        if not profile_dict.get("user_id"):
            return JSONResponse(status_code=400, content={"message": "user_id is required"})

        # Insert the profile
        result = await fitness_profiles_collection.insert_one(profile_dict)
        
        # Check if the profile is complete
        required_fields = [
            "user_basic_details",
            "user_initial_measurements",
            "user_health_details",
            "user_habits_assessment",
            "user_routine_assessment",
            "user_fitness_goals"
        ]
        
        is_complete = all(field in profile_dict for field in required_fields)
        
        # If profile is complete, trigger fitness plan generation
        if is_complete:
            try:
                async with httpx.AsyncClient() as client:
                    # Call the create_fitness_plan endpoint using environment variable
                    plan_response = await client.post(
                        f"{BACKEND_SERVICE_URL}/v1/360_degree_fitness/create_fitness_plan/{user_profile.user_id}"
                    )
                    if plan_response.status_code == 200:
                        return {
                            "message": "User fitness profile created successfully and fitness plan generated!",
                            "profile_id": str(result.inserted_id),
                            "fitness_plan": plan_response.json()
                        }
            except Exception as e:
                print(f"Error generating fitness plan: {str(e)}")
                # Continue even if plan generation fails
                pass
        
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
        user_profile = await fitness_profiles_collection.find_one({"user_id": user_id})
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
async def edit_fitness_profile(user_id: str, data: UserFitnessProfileUpdate):
    try:
        # Convert the Pydantic model to a dictionary, excluding unset fields
        update_data = data.dict(exclude_unset=True)
        
        # Update the latest profile
        await update_latest_profile(user_id, update_data)
        
        # Log the changes
        await log_profile_change(user_id, update_data)
        
        # Get the updated profile to check completeness
        fitness_profiles_collection = get_fitness_profile_collection()
        updated_profile = await fitness_profiles_collection.find_one({"user_id": user_id})
        
        if updated_profile:
            # Check if the profile is complete
            required_fields = [
                "user_basic_details",
                "user_initial_measurements",
                "user_health_details",
                "user_habits_assessment",
                "user_routine_assessment",
                "user_fitness_goals"
            ]
            
            is_complete = all(field in updated_profile for field in required_fields)
            
            # If profile is complete, trigger fitness plan generation
            if is_complete:
                try:
                    async with httpx.AsyncClient() as client:
                        # Call the create_fitness_plan endpoint
                        plan_response = await client.post(
                            f"{BACKEND_SERVICE_URL}/v1/360_degree_fitness/create_fitness_plan/{user_id}"
                        )
                        if plan_response.status_code == 200:
                            return {
                                "message": "Profile updated successfully and fitness plan generated!",
                                "fitness_plan": plan_response.json()
                            }
                except Exception as e:
                    print(f"Error generating fitness plan: {str(e)}")
                    # Continue even if plan generation fails
                    pass
        
        return {"status": "Profile updated successfully"}
    except Exception as e:
        print(f"Error updating profile: {str(e)}")  # Add debug logging
        raise HTTPException(status_code=500, detail=str(e))

# delete user fitness profile
@profile_router.delete("/v1/360_degree_fitness/delete_fitness_profile/{user_id}")
async def delete_fitness_profile(user_id: str):
    # Get collection inside the handler
    fitness_profiles_collection = get_fitness_profile_collection()

    try:
        print("----Attempting to delete profile with user_id:----:", user_id)

        # MongoDB access to delete the fitness profile
        result = await fitness_profiles_collection.delete_one({"user_id": user_id})
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
        # Fetch User Profile from DB
        user_profile = await fitness_profiles_collection.find_one({"user_id": user_id})
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

@profile_router.get("/v1/360_degree_fitness/get_weight_goal/{user_id}")
async def get_user_weight_goal(user_id: str):
    # Get collection inside the handler
    fitness_profiles_collection = get_fitness_profile_collection()
    try:
        user_profile = await fitness_profiles_collection.find_one({"user_id": user_id})

        if not user_profile:
            return JSONResponse(status_code=404, content={"message": "User profile not found"})

        # Extract the weight goal from the user profile
        user_weight_goal = user_profile.get("user_basic_details", {}).get("weight_goal_in_kg")

        if user_weight_goal is None:
            return JSONResponse(status_code=400, content={"message": "Weight goal not set for the user"})

        return {
            "user_id": user_id,
            "weight_goal_in_kg": user_weight_goal
        }

    except PyMongoError as e:
        return JSONResponse(status_code=500, content={"message":f"Database error: {str(e)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Unexpected error: {str(e)}"})