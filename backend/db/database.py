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

# Load environment variables
load_dotenv()

# Connect to MongoDB
def connect_to_db():
    uri = os.getenv("MONGO_URI")
    connect(db='360DegreeFitness', host=uri)

connect_to_db()

# Define a user model -> maps to the user collection
class User(Document):
    username = StringField(required=True, unique=True)
    email = EmailField(required=True, unique=True)
    name = StringField(required=True)
    password_hash = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    is_active = BooleanField(default=True)
    last_login = DateTimeField()
    meta = {'collection': 'users'}

# Lifestyle Current Model
class LifestyleCurrent(Document):
    user = ReferenceField(User, required=True, unique=True)
    
    # UserDetails
    age = IntField(required=True)
    weight_in_kg = DecimalField(required=True, min_value=0)
    height_in_cm = DecimalField(required=True, min_value=50, max_value=300)
    gender = StringField(required=True, choices=['Male', 'Female', 'Other'])
    
    # InitialMeasurements
    arms_in_cm = DecimalField(required=True, min_value=0)
    neck_in_cm = DecimalField(required=True, min_value=0)
    chest_in_cm = DecimalField(required=True, min_value=0)
    waist_in_cm = DecimalField(required=True, min_value=0)
    thighs_in_cm = DecimalField(required=True, min_value=0)
    hips_in_cm = DecimalField(required=True, min_value=0)
    
    # HealthDetails
    family_history = StringField()
    existing_conditions = ListField(StringField())
    habitual_consumption = ListField(StringField())
    current_medications = ListField(StringField())
    current_supplements = ListField(StringField())
    
    # HabitsAssessment
    daily_water_intake_in_liter = StringField(required=True, 
        choices=['1 liter', '2 liters', '3 liters', '4 liters', '5 liters'])
    weekly_workout_frequency = DecimalField(required=True, min_value=0, max_value=7)
    diet_preference = StringField(required=True, 
        choices=['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free', 'Keto'])
    uncomfortable_foods = ListField(StringField())
    activity_level = StringField(required=True, 
        choices=['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Super active'])
    
    # RoutineAssessment
    typical_meals = DictField()  # Stores breakfast, lunch, snacks, dinner
    daily_routine = DictField()  # Stores various daily timings
    stress_audit = DictField()   # Stores stress-related timings
    
    # Fitness Goals
    fitness_goals = StringField(required=True, 
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
        await cls.ensure_db_connected()
        return await cls.db.users.find_one({"username": username})

    @classmethod
    async def create_user(cls, user: UserDB):
        await cls.ensure_db_connected()
        return await cls.db.users.insert_one(user.dict())

    @classmethod
    async def get_user_by_email(cls, email: str):
        await cls.ensure_db_connected()
        return await cls.db.users.find_one({"email": email})

