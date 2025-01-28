from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

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
