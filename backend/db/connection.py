from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect_db(cls):
        cls.client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
        
    @classmethod
    async def close_db(cls):
        if cls.client is not None:
            cls.client.close()
            
    @classmethod
    def get_db(cls):
        return cls.client['360DegreeFitness']

# Collection getters
def get_fitness_profile_collection():
    return Database.get_db()['fitness_profiles']

def get_fitness_plan_collection():
    return Database.get_db()['fitness_plans']

def get_meals_logging_collection():
    return Database.get_db()['meal_logger']

def connect_to_db():
    uri = os.getenv("MONGO_URI")
    connect(db='360DegreeFitness', host=uri)  # Ensure this matches your production database 