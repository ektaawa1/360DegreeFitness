from bson import ObjectId
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
import httpx
import google.generativeai as genai
import json
from ..db.database import profiles_collection

from ..db.connection import get_fitness_plan_collection

# Note-
# Install pymongo- pip install pymongo

plan_router = APIRouter()

# Initialize the HTTP client
http_client = httpx.AsyncClient()

@plan_router.post("/v1/360_degree_fitness/create_fitness_plan/{user_id}")
async def create_fitness_plan(user_id: str):
    try:
        # First check profile completion (keeping existing validation)
        api_response = await http_client.get(f"http://localhost:8000/v1/360_degree_fitness/check_profile_completion/{user_id}")
        if api_response.status_code != 200:
            return JSONResponse(status_code=api_response.status_code, content=api_response.json())
        
        api_response_data = api_response.json()
        if not api_response_data.get('profile_exists', False):
            return JSONResponse(status_code=400, content={"message": "Fitness Profile does not exist, cannot create fitness plan"})
        if not api_response_data.get('profile_complete', False):
            return JSONResponse(status_code=400, content={"message": "Profile is incomplete, cannot create fitness plan"})

        # Get user's profile data for personalization - using string user_id
        user_profile = await profiles_collection.find_one({"user_id": user_id})
        if not user_profile:
            return JSONResponse(status_code=404, content={"message": "User profile not found"})

        # Extract profile details with safe gets
        basic_details = user_profile.get('user_basic_details', {})
        health_details = user_profile.get('user_health_details', {})
        habits = user_profile.get('user_habits_assessment', {})
        fitness_goals = user_profile.get('user_fitness_goals', '')

        # Create structured prompt for Gemini
        prompt = f"""
        You are a professional fitness trainer and nutritionist. Create a personalized 7-day fitness plan for a user with the following profile:

        User Profile:
        - Age: {basic_details.get('age')} years
        - Weight: {basic_details.get('weight_in_kg')} kg
        - Height: {basic_details.get('height_in_cm')} cm
        - Gender: {basic_details.get('gender')}
        - Weight Goal: {basic_details.get('weight_goal_in_kg')} kg
        - Activity Level: {habits.get('activity_level')}
        - Diet Preference: {habits.get('diet_preference')}
        - Health Conditions: {', '.join(health_details.get('existing_conditions', []))}
        - Fitness Goal: {fitness_goals}
        - Weekly Workout Frequency: {habits.get('weekly_workout_frequency')} times
        - Daily Water Intake: {habits.get('daily_water_intake_in_liter')}
        - Dietary Restrictions: {', '.join(habits.get('uncomfortable_foods', []))}

        Additional Health Context:
        - Family History: {', '.join(health_details.get('family_history', []))}
        - Current Supplements: {', '.join(health_details.get('current_supplements', []))}
        - Habitual Consumption: {', '.join(health_details.get('habitual_consumption', []))}

        Return ONLY a JSON object with EXACTLY this structure (no additional text or explanations):
        {{
            "plan_duration": "7 days",
            "meal_plan": {{
                "day_1": {{
                    "breakfast": "specific meal with portions",
                    "lunch": "specific meal with portions",
                    "dinner": "specific meal with portions",
                    "snack": "specific snack with portions"
                }},
                "day_2": {{same structure as day_1}},
                "day_3": {{same structure as day_1}},
                "day_4": {{same structure as day_1}},
                "day_5": {{same structure as day_1}},
                "day_6": {{same structure as day_1}},
                "day_7": {{same structure as day_1}}
            }},
            "workout_plan": {{
                "day_1": "detailed workout with duration and intensity",
                "day_2": "detailed workout with duration and intensity",
                "day_3": "detailed workout with duration and intensity",
                "day_4": "detailed workout with duration and intensity",
                "day_5": "detailed workout with duration and intensity",
                "day_6": "detailed workout with duration and intensity",
                "day_7": "detailed workout with duration and intensity"
            }},
            "sleep_and_lifestyle_suggestions": {{
                "sleep_duration": "7-9 hours",
                "sleep_tips": "3-4 specific sleep improvement tips",
                "stress_management": "3-4 specific stress management techniques"
            }}
        }}

        Important Considerations:
        1. This user is {habits.get('diet_preference', 'No preference')}, ensure ALL meals follow this restriction
        2. Their fitness goal is {fitness_goals}, focus workouts on this goal
        3. Account for their {habits.get('activity_level', 'moderate')} activity level
        4. Consider their health conditions: {', '.join(health_details.get('existing_conditions', []))}
        5. Include specific portion sizes in all meal descriptions
        6. Include duration and intensity in all workout descriptions
        7. Ensure workouts match their current frequency of {habits.get('weekly_workout_frequency')} times per week
        8. Account for their habitual consumption of {', '.join(health_details.get('habitual_consumption', []))}
        """

        # Generate plan using Gemini
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            raise Exception("Empty response from Gemini API")

        # Parse and validate the generated plan
        try:
            # Clean up the response text by removing markdown code block formatting
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]  # Remove ```json prefix
            if response_text.endswith('```'):
                response_text = response_text[:-3]  # Remove ``` suffix
            response_text = response_text.strip()  # Remove any extra whitespace
            
            # Now parse the cleaned JSON
            generated_plan = json.loads(response_text)
            
            # Validate required fields
            required_fields = ["plan_duration", "meal_plan", "workout_plan", "sleep_and_lifestyle_suggestions"]
            for field in required_fields:
                if field not in generated_plan:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate meal plan structure
            for day in range(1, 8):
                day_key = f"day_{day}"
                if day_key not in generated_plan["meal_plan"]:
                    raise ValueError(f"Missing meal plan for {day_key}")
                meal_plan = generated_plan["meal_plan"][day_key]
                for meal in ["breakfast", "lunch", "dinner", "snack"]:
                    if meal not in meal_plan:
                        raise ValueError(f"Missing {meal} in {day_key}")

            # Validate workout plan structure
            for day in range(1, 8):
                day_key = f"day_{day}"
                if day_key not in generated_plan["workout_plan"]:
                    raise ValueError(f"Missing workout plan for {day_key}")

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)}\nResponse: {response.text}")
            return JSONResponse(status_code=500, content={"message": "Error generating fitness plan: Invalid AI response format"})
        except ValueError as e:
            print(f"Validation error: {str(e)}\nResponse: {response.text}")
            return JSONResponse(status_code=500, content={"message": f"Error generating fitness plan: {str(e)}"})

        # Add the user_id to the plan
        generated_plan["user_id"] = ObjectId(user_id)

        # Get collection and check for existing plan
        fitness_plans_collection = get_fitness_plan_collection()
        existing_fitness_plan = await fitness_plans_collection.find_one({"user_id": ObjectId(user_id)})
        if existing_fitness_plan:
            return JSONResponse(status_code=400, content={"message": "Fitness plan already exists for this user."})

        # Save the generated plan
        result = await fitness_plans_collection.insert_one(generated_plan)
        
        # Convert ObjectIds to strings for response
        generated_plan['user_id'] = str(generated_plan['user_id'])
        generated_plan['_id'] = str(result.inserted_id)

        return {"plan_id": str(result.inserted_id), "fitness_plan": generated_plan}

    except PyMongoError as e:
        print(f"Database error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Database error: {str(e)}"})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Unexpected error: {str(e)}"})


# Fetch the fitness plan from the database
@plan_router.get("/v1/360_degree_fitness/retrieve_fitness_plan/{user_id}")
async def get_user_fitness_plan(user_id: str):

    # Note: also include code for user_id validation i.e. if the user_id exists

    # Get collection inside the handler
    fitness_plans_collection = get_fitness_plan_collection()

    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        return JSONResponse(status_code=400, content= {"message": "Invalid user id format"})

    try:
        # MongoDB query to fetch the plan for a user with the given user_id
        fitness_plan = await fitness_plans_collection.find_one({"user_id": user_id})

        if fitness_plan is None:
            return JSONResponse(status_code=404, content= {"message": "Fitness Plan not found"})

        #Convert ObjectId to string for proper serialization
        fitness_plan['user_id'] = str(fitness_plan['user_id'])
        fitness_plan['_id'] = str(fitness_plan['_id'])

        return fitness_plan
    except PyMongoError as e:
        return JSONResponse(status_code=500, content= {"message": f"Database error: {str(e)}"})

    except Exception as e:
        return JSONResponse(status_code=500, content= {"message": f"Unexpected error: {str(e)}"})

# delete fitness plan ---> soft delete or hard delete?? for historical reference
@plan_router.delete("/v1/360_degree_fitness/delete_fitness_plan/{user_id}")
async def delete_user_fitness_plan(user_id: str):

    # Note: also include code for user_id validation i.e. if the user_id exists

    # Get collection inside the handler
    fitness_plans_collection = get_fitness_plan_collection()

    try:
        user_id = ObjectId(user_id)
    except Exception as e:
        return JSONResponse(status_code=400, content= {"message": "Invalid user id format"})

    try:
        #mongoDB logic to delete the fitness plan
        result = await fitness_plans_collection.delete_one({"user_id": user_id})
        if result.deleted_count == 0:
            return JSONResponse(status_code=404, content= {"message": "Fitness Plan not found"})

        return {"message": "Fitness Plan deleted successfully"}
    except PyMongoError as e:
        # Handle database-related errors
        return JSONResponse(status_code=500, content= {"message": f"Database error: {str(e)}"})
    except Exception as e:
        # Catch any other exceptions
        return JSONResponse(status_code=500, content= {"message": f"Unexpected error: {str(e)}"})

#update fitness plan ---> once we integrate AI/ML
#Use Pydantic Model Class for plan creation & validation- fitnessPlan.py
#generate button for generating fitness plan using AI/ML model n number of times
#try adding loggers to get details of errors