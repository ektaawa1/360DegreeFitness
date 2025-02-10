from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError

from backend.models.userFitnessProfile import UserFitnessProfile
from backend.models.userFitnessProfileUpdate import UserFitnessProfileUpdate

profile_router = APIRouter()

# create user fitness profile
@profile_router.post("/v1/360_degree_fitness/create_fitness_profile")
async def create_fitness_profile(user_profile: UserFitnessProfile):
    # Convert Pydantic model to a dictionary for MongoDB
    # Insert the profile into MongoDB
    try:
        result = await fitness_profiles_collection.insert_one(user_profile.dict())
        return {"message": "User fitness profile created successfully!", "profile_id": str(result.inserted_id)}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating profile: {str(e)}")

# retrieve user fitness profile
@profile_router.get("/v1/360_degree_fitness/get_fitness_profile/{user_id}")
async def get_fitness_profile(user_id: str):
    try:
        user_profile = await fitness_profile_collection.find_one({"user_id": user_id})
        if user_profile is None:
            raise HTTPException(status_code=404, detail="Profile not found")
        return user_profile
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")

#edit user fitness profile
@profile_router.put("/v1/360_degree_fitness/edit_fitness_profile/{user_id}")
async def edit_fitness_profile(user_id: str, updated_profile: UserFitnessProfileUpdate):
    try:
        #Fetching user's existing profile
        existing_profile = await fitness_profile_collection.find_one({"user_id": user_id})
        if not existing_profile:
            raise HTTPException(status_code=404, detail="Profile not found")

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

        # Perform the partial update in the database
        result = await fitness_profile_collection.update_one(
            {"user_id": user_id}, {"$set": updated_data}
        )

        if result.modified_count > 0:
            return {"message": "Profile updated successfully"}
        else:
            return {"message": "No changes were made"}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error encountered with profile update: {str(e)}")

# delete user fitness profile
@profile_router.delete("/v1/360_degree_fitness/delete_fitness_profile/{user_id}")
async def delete_fitness_profile(user_id: str):
    try:
        # MongoDB access to delete the fitness profile
        result = await fitness_profile_collection.delete_one({"user_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {"message": "Profile deleted successfully"}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user profile: {str(e)}")

# is user fitness profile created & completed?
@profile_router.get("/v1/360_degree_fitness/check_profile_completion/{user_id}")
async def check_profile_complete(user_id: str):
    try:
        user_profile = await fitness_profile_collection.find_one({"user_id": user_id})
        if user_profile is None:
            raise HTTPException(status_code=404, detail="User Profile not found")

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
                break

        return {"profile_complete": is_complete}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")