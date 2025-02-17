# add MongoDB code here. You can change the file name if you want to.
import os
from datetime import datetime
from dotenv import load_dotenv
from mongoengine import (
    Document, StringField, EmailField, DateTimeField,
    DictField, ListField, ReferenceField, BooleanField,
    FloatField, IntField, DecimalField, connect
)
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Optional
from bson import ObjectId

# Load environment variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

# Connect to MongoDB
def connect_to_db():
    uri = os.getenv("MONGO_URI")
    connect(db='360DegreeFitness', host=uri)

connect_to_db()

# Define a user model -> maps to the user collection
# 
class User(Document):
    username = StringField(required=True, unique=True)
    name = StringField(required=True)
    password = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'users'  # This matches Express's collection
    }

# Lifestyle Current Model
class LifestyleCurrent(Document):
    user = ReferenceField(User, required=True, unique=True)
    
    # UserDetails
    age = IntField(required=True)
    weight_in_kg = DecimalField(required=True, min_value=0)
    height_in_cm = DecimalField(required=True, min_value=50, max_value=300)
    gender = StringField(required=True, choices=['Male', 'Female', 'Other'])
    
    # InitialMeasurements (Optional)
    arms_in_cm = DecimalField(required=False, min_value=0)
    neck_in_cm = DecimalField(required=False, min_value=0)
    chest_in_cm = DecimalField(required=False, min_value=0)
    waist_in_cm = DecimalField(required=False, min_value=0)
    thighs_in_cm = DecimalField(required=False, min_value=0)
    hips_in_cm = DecimalField(required=False, min_value=0)
    
    # HealthDetails (Optional)
    family_history = StringField(required=False)
    existing_conditions = ListField(StringField(), required=False)
    habitual_consumption = ListField(StringField(), required=False)
    current_medications = ListField(StringField(), required=False)
    current_supplements = ListField(StringField(), required=False)
    
    # HabitsAssessment (Optional)
    daily_water_intake_in_liter = StringField(required=False, 
        choices=['1 liter', '2 liters', '3 liters', '4 liters', '5 liters'])
    weekly_workout_frequency = DecimalField(required=False, min_value=0, max_value=7)
    diet_preference = StringField(required=False, 
        choices=['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free', 'Keto'])
    uncomfortable_foods = ListField(StringField(), required=False)
    activity_level = StringField(required=False, 
        choices=['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Super active'])
    
    # RoutineAssessment (Optional)
    typical_meals = DictField(required=False)  # Stores breakfast, lunch, snacks, dinner
    daily_routine = DictField(required=False)  # Stores various daily timings
    stress_audit = DictField(required=False)   # Stores stress-related timings
    
    # Fitness Goals (Optional)
    fitness_goals = StringField(required=False, 
        choices=['Weight Loss', 'Weight Gain', 'Maintain Weight', 
                'Muscle Gain', 'Endurance', 'Get Healthier'])
    
    last_updated = DateTimeField(default=datetime.utcnow)
    meta = {'collection': 'lifestyle_current'}

# Lifestyle History Model
class LifestyleHistory(Document):
    user = ReferenceField(User, required=True)
    timestamp = DateTimeField(default=datetime.utcnow)
    
    # Track changes in key metrics
    weight_kg = DecimalField(min_value=0)
    measurements = DictField()  # Store body measurements
    activity_level = StringField(
        choices=['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Super active'])
    weekly_workout_frequency = DecimalField(min_value=0, max_value=7)
    fitness_goals = StringField(
        choices=['Weight Loss', 'Weight Gain', 'Maintain Weight', 
                'Muscle Gain', 'Endurance', 'Get Healthier'])
    achievement_notes = StringField()
    
    meta = {
        'collection': 'lifestyle_history',
        'indexes': [
            {'fields': ['user', 'timestamp']},
        ]
    }

    @classmethod
    def create_history_entry(cls, current_lifestyle):
        """Create a history entry from current lifestyle data"""
        return cls(
            user=current_lifestyle.user,
            weight_kg=current_lifestyle.weight_in_kg,
            measurements={
                'arms': current_lifestyle.arms_in_cm,
                'neck': current_lifestyle.neck_in_cm,
                'chest': current_lifestyle.chest_in_cm,
                'waist': current_lifestyle.waist_in_cm,
                'thighs': current_lifestyle.thighs_in_cm,
                'hips': current_lifestyle.hips_in_cm
            },
            activity_level=current_lifestyle.activity_level,
            weekly_workout_frequency=current_lifestyle.weekly_workout_frequency,
            fitness_goals=current_lifestyle.fitness_goals
        ).save()

# Fitness Plan Model
class FitnessPlan(Document):
    user_id = StringField(required=True, unique=True)
    plan_duration = StringField(required=True)
    meal_plan = DictField(required=True)
    workout_plan = DictField(required=True)
    sleep_and_lifestyle_suggestions = DictField(required=True)
    meta = {'collection': 'fitness_plans'}

# Pydantic models for validation
class UserDB(BaseModel):
    username: str
    email: EmailStr
    name: str
    password_hash: str
    created_at: datetime = datetime.utcnow()
    is_active: bool = True
    last_login: Optional[datetime] = None

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect_db(cls):
        uri = os.getenv("MONGO_URI")
        cls.client = AsyncIOMotorClient(uri)
        cls.db = cls.client['360DegreeFitness']
        
    @classmethod
    async def close_db(cls):
        if cls.client is not None:
            await cls.client.close()

    @classmethod
    async def ensure_db_connected(cls):
        if cls.db is None:
            await cls.connect_db()

    # User operations
    @classmethod
    async def get_user(cls, username: str):
        """Get user from Express's users collection"""
        await cls.ensure_db_connected()
        return await cls.db.users.find_one({"username": username})

    @classmethod
    async def get_user_by_id(cls, user_id: str):
        """Get user by ID from Express's users collection"""
        try:
            await cls.ensure_db_connected()
            # Convert string ID to ObjectId
            object_id = ObjectId(user_id)
            # This line checks if user exists in the users collection
            return await cls.db.users.find_one({"_id": object_id})
        except Exception:
            return None

    @classmethod
    async def create_user(cls, user: UserDB):
        await cls.ensure_db_connected()
        return await cls.db.users.insert_one(user.dict())

    @classmethod
    async def get_user_by_email(cls, email: str):
        await cls.ensure_db_connected()
        return await cls.db.users.find_one({"email": email})

    @classmethod
    async def get_fitness_data_for_rag(cls, user_id: str):
        """Get all user fitness data and prepare for RAG"""
        await cls.ensure_db_connected()
        
        # Debug: Print the user_id being queried
        print("Querying for user_id:", user_id)
        
        # Get all user data
        user = await cls.get_user_by_id(user_id)
        fitness_profile = await cls.db.lifestyle_current.find_one({"user_id": user_id})
        # fitness_plan = await cls.db.fitness_plans.find_one({"user_id": user_id})
        
        # Debug: Print the retrieved data
        print("User Data:", user)
        print("Fitness Profile:", fitness_profile)
        # print("Fitness Plan:", fitness_plan)
        
        # Combine data into documents
        documents = []
        if user:
            documents.append(f"User Profile: {user}")
        if fitness_profile:
            documents.append(f"Fitness Profile: {fitness_profile}")
        # if fitness_plan:
        #     documents.append(f"Fitness Plan: {fitness_plan}")
            
        return documents

    headers = {
        "Authorization": f"Bearer {gemini_api_key}",
        "Content-Type": "application/json"
    }

