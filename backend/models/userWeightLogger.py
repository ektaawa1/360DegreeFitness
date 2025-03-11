from typing import List
from pydantic import BaseModel
from datetime import date

class WeightEntry(BaseModel):
    weight_in_kg: float
    timestamp: str
    notes: str

class UserWeightLogger(BaseModel):
    user_id: str
    date: date
    weights: List[WeightEntry]