from fastapi import FastAPI
from pydantic import BaseModel
from .db.connection import Database
from .routers import userFitnessProfileRouter, fitnessPlanRouter, authRouter, chatRouter

app = FastAPI()

@app.on_event("startup")
async def startup_db_client():
    await Database.connect_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    await Database.close_db()

# Include routers
app.include_router(authRouter.auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(
    userFitnessProfileRouter.profile_router,
    tags=["Fitness Profile"]
)
app.include_router(fitnessPlanRouter.plan_router)
app.include_router(
    chatRouter.chat_router,
    tags=["Chat"]
)

# Data model for analysis input
class DataAnalysisInput(BaseModel):
    numbers: list[float]  # Example: List of numbers to analyze

# Endpoint for data analysis
@app.post("/api/analyze")
async def analyze_data(input: DataAnalysisInput):
    """
    Perform data analysis and return the results.
    """
    numbers = input.numbers
    average = sum(numbers) / len(numbers) if numbers else 0
    return {"average": average, "count": len(numbers)}

# is user profile existing & completed?
# create a fitness profile for the user
# get user fitness profile
# edit user fitness profile
# delete user fitness profile
# create fitness plan
# get fitness plan
# delete fitness plan


