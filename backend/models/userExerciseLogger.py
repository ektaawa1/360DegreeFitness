from typing import List
from pydantic import BaseModel
from datetime import date


class UserExerciseLogger(BaseModel):
    exercise_type: str
    duration_minutes: int
    calories_burnt: float

class UserExerciseDiary(BaseModel):
    user_id: str
    date: date
    exercises: List[UserExerciseLogger] = []