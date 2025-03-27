from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

async def migrate_weight_fields():
    load_dotenv()
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client['360DegreeFitness']
    weight_diary_collection = db['weight_diary']
    
    try:
        # First, find all documents that need updating
        cursor = weight_diary_collection.find({"weights": {"$exists": True}})
        
        update_count = 0
        async for doc in cursor:
            weights = doc.get('weights', [])
            updated_weights = []
            
            for weight_entry in weights:
                if 'weight' in weight_entry:
                    # Convert 'weight' to 'weight_in_kg'
                    updated_entry = {
                        'weight_in_kg': weight_entry['weight'],
                        'timestamp': weight_entry['timestamp'],
                        'notes': weight_entry['notes']
                    }
                    updated_weights.append(updated_entry)
                else:
                    # Keep entries that already use weight_in_kg
                    updated_weights.append(weight_entry)
            
            # Update the document with standardized weights
            if updated_weights:
                result = await weight_diary_collection.update_one(
                    {'_id': doc['_id']},
                    {'$set': {'weights': updated_weights}}
                )
                if result.modified_count > 0:
                    update_count += 1
        
        print(f"Updated {update_count} documents")
        
        # Verify the update
        sample_doc = await weight_diary_collection.find_one({})
        if sample_doc:
            print("\nSample document after update:")
            print(sample_doc)
        
    except Exception as e:
        print(f"Error during update: {e}")
    finally:
        # Motor doesn't require await for close
        client.close()

# Run the migration
if __name__ == "__main__":
    asyncio.run(migrate_weight_fields())