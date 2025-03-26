from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date, datetime

class WeightEntry(BaseModel):
    weight_in_kg: float = Field(..., description="Weight in kilograms")
    notes: Optional[str] = Field(None, description="Optional notes about the weight entry")

class UserWeightLogger(BaseModel):
    user_id: str
    date: date
    weights: List[WeightEntry]