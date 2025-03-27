from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

async def update_user_weight_fields():
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client['360DegreeFitness']
    profiles_collection = db['fitness_profiles']
    
    try:
        # Update all documents to:
        # 1. Remove last_weight_update
        # 2. Add weight_goal_in_kg (default to current weight for existing users)
        result = await profiles_collection.update_many(
            {
                "user_basic_details.last_weight_update": {"$exists": True}  # Only update docs with old field
            },
            [
                {
                    "$set": {
                        "user_basic_details": {
                            "$mergeObjects": [
                                {
                                    "$arrayToObject": {
                                        "$filter": {
                                            "input": {"$objectToArray": "$user_basic_details"},
                                            "cond": {"$ne": ["$$this.k", "last_weight_update"]}
                                        }
                                    }
                                },
                                {
                                    "weight_goal_in_kg": "$user_basic_details.weight_in_kg"
                                }
                            ]
                        }
                    }
                }
            ]
        )
        
        print(f"Updated {result.modified_count} documents")
        
        # Verify the update
        sample_doc = await profiles_collection.find_one({})
        print("\nSample document after update:")
        print(sample_doc)
        
    except Exception as e:
        print(f"Error during update: {e}")
    finally:
        client.close()

# Run the migration
if __name__ == "__main__":
    asyncio.run(update_user_weight_fields())