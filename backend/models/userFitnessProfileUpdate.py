from typing_extensions import Literal
from pydantic import BaseModel, condecimal
from typing import List, Dict, Optional

class UserDetailsUpdate(BaseModel):
    age: Optional[int]
    weight_in_kg: Optional[condecimal(ge=0)] #Makes sure that a positive value is entered
    height_in_cm: Optional[condecimal(ge=50, le=300)] #reasonable height range
    gender: Optional[Literal[ #predefined options
        'Male',
        'Female',
        'Other']]

class InitialMeasurementsUpdate(BaseModel):
    arms_in_cm: Optional[condecimal(ge=0)] #positive value
    neck_in_cm: Optional[condecimal(ge=0)]
    chest_in_cm: Optional[condecimal(ge=0)]
    waist_in_cm: Optional[condecimal(ge=0)]
    thighs_in_cm: Optional[condecimal(ge=0)]
    hips_in_cm: Optional[condecimal(ge=0)]

class HealthDetailsUpdate(BaseModel):
    family_history: Optional[str] #Can be None if no health history exists
    existing_conditions: Optional[List[str]] #Can be None if no conditions exist
    habitual_consumption: Optional[List[str]] #Can be None if nothing to report
    current_medications: Optional[List[str]] #Can be None if not having any medications
    current_supplements: Optional[List[str]] #Can be None if not having any supplements

class HabitsAssessmentUpdate(BaseModel):
    daily_water_intake_in_liter: Optional[Literal[ #dropdown option
        '1 liter',
        '2 liters',
        '3 liters',
        '4 liters',
        '5 liters'
    ]]
    weekly_workout_frequency: Optional[condecimal(ge=0, le=7)] # workout frequency should be between 0 and 7
    diet_preference: Optional[Literal[ # Dropdown option
        'Vegetarian',
        'Non-Vegetarian',
        'Vegan',
        'Gluten-Free',
        'Keto']]
    uncomfortable_foods: Optional[List[str]] #Can be none
    activity_level: Optional[Literal[  # Dropdown option
        'Sedentary',
        'Lightly active',
        'Moderately active',
        'Very active',
        'Super active'
    ]]

class RoutineAssessmentUpdate(BaseModel):
    # Allowing optional meals as some users might not have more than 3 meals in a day
    typical_meals: Optional[Dict[str, Optional[str]]] = {
        'breakfast': None, # each meal can be left blank
        'lunch': None,
        'snacks': None,
        'dinner': None
    }
    #Allowing optional time as some users may not follow set times
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

class UserFitnessProfileUpdate(BaseModel):
    user_id: str # A unique identifier for the user
    user_basic_details: Optional[UserDetailsUpdate]
    user_initial_measurements: Optional[InitialMeasurementsUpdate]
    user_health_details: Optional[HealthDetailsUpdate]
    user_habits_assessment: Optional[HabitsAssessmentUpdate]
    user_routine_assessment: Optional[RoutineAssessmentUpdate]
    user_fitness_goals: Optional[Literal[  # Dropdown option
        'Weight Loss',
        'Weight Gain',
        'Maintain Weight',
        'Muscle Gain',
        'Endurance',
        'Get Healthier'
    ]]
