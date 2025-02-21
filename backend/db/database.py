import os
from datetime import datetime
from dotenv import load_dotenv
from mongoengine import Document, StringField, DateTimeField
from motor.motor_asyncio import AsyncIOMotorClient  # Use AsyncIO MongoDB client
from decimal import Decimal
import json
from bson import ObjectId

# Load environment variables
load_dotenv()

# User model (if you're using it for authentication)
class User(Document):
    username = StringField(required=True, unique=True)
    name = StringField(required=True)
    password = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    meta = {'collection': 'users'}

# MongoDB async connection
client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
db = client['360DegreeFitness']
profiles_collection = db['fitness_profiles']
changes_collection = db['fitness_profile_changes']
key_recommendations_collection = db["key_recommendations"] # for chatbot to store key recommendations
conversation_history_collection = db["conversation_history"] # for chatbot to store conversation history
meals_logging_collection = db["meal_logger"] # for meal logger to store meal log

# Decimal handling
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# Profile update functions
async def update_latest_profile(user_id, update_data):
    # Convert Decimal objects to float
    update_data = json.loads(json.dumps(update_data, cls=DecimalEncoder))
    update_data['updated_at'] = datetime.utcnow()
    await profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )

async def log_profile_change(user_id, change_data):
    # Convert Decimal objects to float
    change_data = json.loads(json.dumps(change_data, cls=DecimalEncoder))
    change_data['user_id'] = user_id
    change_data['timestamp'] = datetime.utcnow()
    await changes_collection.insert_one(change_data)

# Meal logger functions
async def add_meal(user_id, meal_data):
    # Convert Decimal objects to float if needed
    meal_data = json.loads(json.dumps(meal_data, cls=DecimalEncoder))
    meal_data['user_id'] = user_id
    meal_data['timestamp'] = datetime.utcnow()
    await meals_logging_collection.insert_one(meal_data)

async def get_meal(user_id, start_date=None, end_date=None):
    query = {"user_id": user_id}
    if start_date and end_date:
        query["timestamp"] = {
            "$gte": start_date,
            "$lte": end_date
        }
    return await meals_logging_collection.find(query).sort("timestamp", -1).to_list(length=None)

async def update_meal(log_id, update_data):
    update_data = json.loads(json.dumps(update_data, cls=DecimalEncoder))
    update_data['updated_at'] = datetime.utcnow()
    await meals_logging_collection.update_one(
        {"_id": ObjectId(log_id)},
        {"$set": update_data}
    )

async def delete_meal(log_id):
    await meals_logging_collection.delete_one({"_id": ObjectId(log_id)})

