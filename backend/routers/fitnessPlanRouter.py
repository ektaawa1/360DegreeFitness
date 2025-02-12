from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError
import logging

from backend.db.connection import get_fitness_plan_collection

# Note-
# Install pymongo- pip install pymongo

plan_router = APIRouter()
logger = logging.getLogger(__name__)

@plan_router.post("/v1/360_degree_fitness/create_fitness_plan/{user_id}")
async def create_fitness_plan(user_id: str): #Next Stage: Create this dynamically
    # It is a static fitness plan

    fitness_plan = {
        "user_id": user_id,
        "plan_duration": "7 days",
        "meal_plan": {
            "day_1": {
                "breakfast": "Oats with almond milk, chia seeds, and fruits",
                "lunch": "Grilled chicken with quinoa",
                "dinner": "Salmon with steamed broccoli",
                "snack": "Nuts and Greek yogurt"
            },
            "day_2": {
                "breakfast": "Whole wheat toast with avocado",
                "lunch": "Turkey sandwich",
                "dinner": "Stir-fried tofu with veggies",
                "snack": "Apple slices with almond butter"
            },
            "day_3": {
                "breakfast": "Smoothie with spinach, banana, protein powder, and almond milk",
                "lunch": "Vegetable soup with a side of whole grain bread",
                "dinner": "Grilled shrimp with quinoa and roasted vegetables",
                "snack": "Carrot sticks with hummus"
            },
            "day_4": {
                "breakfast": "Greek yogurt with granola and berries",
                "lunch": "Chicken salad with mixed greens, olive oil, and balsamic vinegar",
                "dinner": "Beef stir-fry with bell peppers and brown rice",
                "snack": "Cottage cheese with pineapple"
            },
            "day_5": {
                "breakfast": "Scrambled eggs with spinach and whole wheat toast",
                "lunch": "Grilled salmon with quinoa and kale",
                "dinner": "Vegetable curry with chickpeas and basmati rice",
                "snack": "Mixed nuts"
            },
            "day_6": {
                "breakfast": "Pancakes with a side of berries and honey",
                "lunch": "Chicken breast with roasted sweet potatoes and vegetables",
                "dinner": "Baked cod with steamed asparagus and quinoa",
                "snack": "Protein bar"
            },
            "day_7": {
                "breakfast": "Chia pudding with almond milk, topped with strawberries",
                "lunch": "Grilled shrimp with avocado and tomato salad",
                "dinner": "Grilled chicken with steamed broccoli and brown rice",
                "snack": "Rice cakes with almond butter"
            }
        },
        "workout_plan": {
            "day_1": "30-minute full-body workout: Push-ups, squats",
            "day_2": "Cardio: 30-minute jog",
            "day_3": "Strength training: 40-minute session with dumbbells",
            "day_4": "Rest day or light yoga/stretching",
            "day_5": "HIIT (High-Intensity Interval Training) workout for 30 minutes",
            "day_6": "Core workout: Sit-ups, crunches, leg raises, planks",
            "day_7": "Active recovery: Light walk or swim for 30 minutes"
        },
        "sleep_and_lifestyle_suggestions": {
            "sleep_duration": "7-9 hours",
            "sleep_tips": "Maintain a consistent sleep schedule, avoid screens before bed, keep the bedroom cool and dark.",
            "stress_management": "Practice deep breathing exercises, take breaks during work, and try journaling your thoughts. Engage in hobbies you enjoy."
        }
    }
    # Get collection inside the handler
    fitness_plans_collection = get_fitness_plan_collection()

    # saving the static plan in MongoDB
    try:
        result = await fitness_plans_collection.insert_one(fitness_plan)
        return {"plan_id": str(result.inserted_id), "fitness_plan": fitness_plan}

    except PyMongoError as e:
        logger.error(f"MongoDB error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# Fetch the fitness plan from the database
@plan_router.get("/v1/360_degree_fitness/retrieve_fitness_plan/{user_id}")
async def get_user_fitness_plan(user_id: str):
    # Get collection inside the handler
    fitness_plans_collection = get_fitness_plan_collection()
    try:
        # MongoDB query to fetch the plan for a user with the given user_id
        fitness_plan = await fitness_plans_collection.find_one({"user_id": user_id})
        if fitness_plan is None:
            raise HTTPException(status_code=404, detail="Fitness Plan not found")
        return fitness_plan
    except PyMongoError as e:
        logger.error(f"MongoDB error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# delete fitness plan ---> soft delete or hard delete?? for historical reference
@plan_router.delete("/v1/360_degree_fitness/delete_fitness_plan/{user_id}")
async def delete_user_fitness_plan(user_id: str):
    # Get collection inside the handler
    fitness_plans_collection = get_fitness_plan_collection()
    try:
        #mongoDB logic to delete the fitness plan
        result = await fitness_plans_collection.delete_one({"user_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, details="Fitness Plan not found")
        return {"message": "Fitness Plan deleted successfully"}
    except PyMongoError as e:
        # Handle database-related errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        # Catch any other exceptions
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

#update fitness plan ---> once we integrate AI/ML
#Use Pydantic Model Class for plan creation & validation- fitnessPlan.py
#generate button for generating fitness plan using AI/ML model n number of times
#try adding loggers to get details of errors