from typing_extensions import Literal
from pydantic import BaseModel, condecimal
from typing import List, Dict, Optional

class UserDetails(BaseModel):
    age: int
    weight_in_kg: condecimal(ge=0)  # Ensures positive value
    height_in_cm: condecimal(ge=50, le=300)  # Reasonable height range
    gender: Literal[  # Predefined options
        'Male',
        'Female',
        'Other'
    ]

class InitialMeasurements(BaseModel):
    arms_in_cm: Optional[condecimal(ge=0)]  # Positive value
    neck_in_cm: Optional[condecimal(ge=0)]
    chest_in_cm: Optional[condecimal(ge=0)]
    waist_in_cm: Optional[condecimal(ge=0)]
    thighs_in_cm: Optional[condecimal(ge=0)]
    hips_in_cm: Optional[condecimal(ge=0)]

class HealthDetails(BaseModel):
    family_history: Optional[List[str]]  # Can be None if no health history exists
    existing_conditions: Optional[List[str]]  # Can be None if no conditions exist
    habitual_consumption: Optional[List[str]]  # Can be None if nothing to report
    current_medications: Optional[List[str]]  # Can be None if not having any medications
    current_supplements: Optional[List[str]]  # Can be None if not having any supplements

class HabitsAssessment(BaseModel):
    daily_water_intake_in_liter: Optional[Literal[  # Dropdown option
        '1 liter',
        '2 liters',
        '3 liters',
        '4 liters',
        '5 liters'
    ]]
    weekly_workout_frequency: Optional[condecimal(ge=0, le=7)]  # Workout frequency should be between 0 and 7
    diet_preference: Optional[Literal[  # Dropdown option
        'Vegetarian',
        'Non-Vegetarian',
        'Vegan',
        'Gluten-Free',
        'Keto'
    ]]
    uncomfortable_foods: Optional[List[str]]  # Can be None
    activity_level: Optional[Literal[  # Dropdown option
        'Sedentary',
        'Lightly active',
        'Moderately active',
        'Very active',
        'Super active'
    ]]

class RoutineAssessment(BaseModel):
    typical_meals: Optional[Dict[str, Optional[str]]] = {
        'breakfast': None,  # Each meal can be left blank
        'lunch': None,
        'snacks': None,
        'dinner': None
    }
    daily_routine: Optional[Dict[str, Optional[str]]] = {
        'wakeup_time': None,
        'breakfast_time': None,
        'lunch_time': None,
        'evening_snacks_time': None,
        'dinner_time': None,
        'bed_time': None
    }
    stress_audit: Optional[Dict[str, Optional[str]]] = {
        'time_sitting_at_a_stretch': None,
        'time_standing_at_a_stretch': None,
        'time_travelling_per_day': None
    }

class UserFitnessProfile(BaseModel):
    user_id = str
    user_basic_details: UserDetails
    user_initial_measurements: Optional[InitialMeasurements] = None
    user_health_details: Optional[HealthDetails] = None
    user_habits_assessment: Optional[HabitsAssessment] = None
    user_routine_assessment: Optional[RoutineAssessment] = None
    user_fitness_goals: Literal[  # Dropdown option
        'Weight Loss',
        'Weight Gain',
        'Maintain Weight',
        'Muscle Gain',
        'Endurance',
        'Get Healthier'
    ]
