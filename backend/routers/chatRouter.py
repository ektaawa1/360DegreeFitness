from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import orjson
from pydantic import BaseModel
from typing import List, Optional, Literal
import google.generativeai as genai
import os
from dotenv import load_dotenv
from ..db.database import profiles_collection, key_recommendations_collection, conversation_history_collection
from datetime import datetime, timedelta
import re
from rapidfuzz import fuzz
from bson import ObjectId
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from fastapi import BackgroundTasks

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

# Configure the Generative AI client
genai.configure(api_key=gemini_api_key)

chat_router = APIRouter()

class ChatMessage(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None
    conversation_id: str
    retrieval_instructions: Optional[str] = None  # Add instructions for retrieving history

def extract_calories_from_response(response_text):
    """Extract calorie recommendations with more flexible patterns."""
    patterns = [
        r'(\d{3,4})\s*calories',
        r'consume\s*(\d{3,4})',
        r'intake.*?(\d{3,4})',
        r'diet.*?(\d{3,4})\s*calories'
    ]
    for pattern in patterns:
        match = re.search(pattern, response_text, re.IGNORECASE)
        if match:
            return match.group(1) + " calories"
    return "Calories recommendation not found"

def extract_meal_plan_from_response(response_text):
    """Extract meal plan recommendations with more flexible patterns."""
    patterns = [
        r'meal plan:\s*(.*?)(?:\n|$)',
        r'recommend.*?eat(?:ing)?\s+(.*?)(?:\n|$)',
        r'diet should include\s+(.*?)(?:\n|$)',
        r'include\s+(?:more|less)\s+(.*?)(?:\n|$)',
        r'foods?.*?like\s+(.*?)(?:\n|$)'
    ]
    for pattern in patterns:
        match = re.search(pattern, response_text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    # Look for food-related sentences if no specific pattern matches
    sentences = response_text.split('.')
    food_keywords = ['eat', 'food', 'diet', 'meal', 'nutrition']
    for sentence in sentences:
        if any(keyword in sentence.lower() for keyword in food_keywords):
            return sentence.strip()
            
    return "Meal plan recommendation not found"

def extract_workouts_from_response(response_text):
    """Extract workout recommendations with more flexible patterns."""
    patterns = [
        r'(\d+)\s*(minutes|hours)\s*(of\s*\w+)',
        r'exercise\s*for\s*(\d+)\s*(minutes|hours)',
        r'workout.*?(\d+)\s*(minutes|hours)',
        r'(\d+)\s*times?\s*per\s*week'
    ]
    for pattern in patterns:
        match = re.search(pattern, response_text, re.IGNORECASE)
        if match:
            if len(match.groups()) == 3:
                return f"{match.group(1)} {match.group(2)} {match.group(3)}"
            return f"{match.group(1)} {match.group(2)} of exercise"
    return "Workout recommendation not found"

def extract_fitness_advice_from_response(response_text):
    """Extract general fitness advice with more flexible patterns."""
    patterns = [
        r'fitness advice:\s*(.*?)(?:\n|$)',
        r'recommend(?:ed|ation)?\s+(.*?)(?:\n|$)',
        r'should\s+(.*?)(?:\n|$)',
        r'improve.*?by\s+(.*?)(?:\n|$)'
    ]
    for pattern in patterns:
        match = re.search(pattern, response_text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    # If no pattern matches, return the first relevant sentence
    sentences = response_text.split('.')
    advice_keywords = ['should', 'recommend', 'improve', 'increase', 'decrease']
    for sentence in sentences:
        if any(keyword in sentence.lower() for keyword in advice_keywords):
            return sentence.strip()
            
    return "General fitness advice not found"

async def find_similar_question(user_id, question, threshold=80):
    """Finds a similar question based on text similarity and context."""
    user_questions = await key_recommendations_collection.find({"user_id": user_id}).to_list(length=None)

    # Define categories and their keywords
    categories = {
        'food': ['food', 'eat', 'diet', 'meal', 'nutrition', 'calories'],
        'exercise': ['exercise', 'workout', 'sport', 'training', 'fitness'],
        'health': ['health', 'medical', 'condition', 'symptom'],
    }

    # Determine the category of the current question
    question_lower = question.lower()
    current_category = None
    for cat, keywords in categories.items():
        if any(keyword in question_lower for keyword in keywords):
            current_category = cat
            break

    best_match = None
    best_score = 0

    for entry in user_questions:
        entry_lower = entry["message"].lower()
        
        # Check if the entry is in the same category
        entry_category = None
        for cat, keywords in categories.items():
            if any(keyword in entry_lower for keyword in keywords):
                entry_category = cat
                break
        
        # Only compare questions in the same category
        if current_category and current_category == entry_category:
            score = fuzz.ratio(question_lower, entry_lower)
            if score > best_score and score >= threshold:
                best_match = entry
                best_score = score

    return best_match

async def store_conversation(user_id: str, message: str, response: str):
    # Always generate a new conversation_id
    conversation_id = str(ObjectId())
    
    await conversation_history_collection.insert_one({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "message": message,
        "response": response,
        "timestamp": datetime.utcnow()
    })
    
    return conversation_id

async def enrich_response_with_external_data(response: str, user_id: str):
    # Add weather data for outdoor activities
    # Include local fitness events
    # Add nutritional information
    pass

async def get_fallback_response(error_type: str) -> str:
    fallback_responses = {
        "api_error": "I'm having trouble connecting to my fitness knowledge base. Let me provide some general advice...",
        "parsing_error": "I understand your question about fitness, but let me rephrase my response...",
        "profile_error": "I notice some information is missing from your profile. Would you like to update it?"
    }
    return fallback_responses.get(error_type, "I apologize for the confusion. Could you rephrase your question?")

async def is_new_session(user_id: str, session_timeout_minutes: int = 30) -> bool:
    """
    Check if this is a new session for the user.
    """
    # Calculate the cutoff time for session timeout
    cutoff_time = datetime.utcnow() - timedelta(minutes=session_timeout_minutes)
    
    # Find the most recent conversation for this user
    latest_conversation = await conversation_history_collection.find_one(
        {"user_id": user_id},
        sort=[("timestamp", -1)]
    )
    
    if not latest_conversation:
        return True  # First time user
    
    # Check if the last conversation was before the cutoff time
    last_chat_time = latest_conversation["timestamp"]
    return last_chat_time < cutoff_time

@chat_router.post("/v1/360_degree_fitness/chat", response_model=ChatResponse)
async def chat_with_ai(chat_message: ChatMessage):
    try:
        # Generate conversation_id at the start
        conversation_id = str(ObjectId())  # Generate ID early
        
        # Define retrieval instructions early
        retrieval_instructions = (
            "Want to view this conversation later? "
            f"Save this conversation ID: {conversation_id}\n"
            "You can retrieve your chat history by visiting:\n"
            f"- JSON format: /v1/360_degree_fitness/chat/history/{conversation_id}?format=json\n"
            f"- PDF format: /v1/360_degree_fitness/chat/history/{conversation_id}?format=pdf"
        )
        
        fitness_profile = await profiles_collection.find_one({"user_id": chat_message.user_id})
        
        if not fitness_profile:
            raise HTTPException(status_code=404, detail="Fitness profile not found")

        # Check for similar questions in the database
        similar_entry = await find_similar_question(chat_message.user_id, chat_message.message, threshold=90)
        
        # Only use stored recommendations if we find a very similar question in the same category
        if similar_entry and similar_entry.get("message", "").lower() == chat_message.message.lower():
            stored_recommendations = {}
            
            # Add only relevant recommendations based on the question category
            question_lower = chat_message.message.lower()
            if any(word in question_lower for word in ['food', 'eat', 'diet', 'meal']):
                if similar_entry["recommended_calories"] != "Calories recommendation not found":
                    stored_recommendations["Recommended Calories"] = similar_entry["recommended_calories"]
                if similar_entry["recommended_meal_plan"] != "Meal plan recommendation not found":
                    stored_recommendations["Recommended Meal Plan"] = similar_entry["recommended_meal_plan"]
            elif any(word in question_lower for word in ['exercise', 'workout', 'sport']):
                if similar_entry["recommended_workouts"] != "Workout recommendation not found":
                    stored_recommendations["Recommended Workouts"] = similar_entry["recommended_workouts"]

            # Only return stored recommendations if we have any valid ones
            if stored_recommendations:
                return ChatResponse(
                    response="Based on your previous similar question, here are the recommendations:\n\n" +
                            "\n".join([f"{key}: {value}" for key, value in stored_recommendations.items()]),
                    sources=["Historical Data"],
                    conversation_id=conversation_id,
                    retrieval_instructions=retrieval_instructions
                )

        # For all other cases, generate a new response using Gemini
        profile_summary = f"""
            User's Fitness Profile:
            Basic Details:
            - Age: {fitness_profile['user_basic_details']['age']}
            - Gender: {fitness_profile['user_basic_details']['gender']}
            - Weight: {fitness_profile['user_basic_details']['weight_in_kg']} kg
            - Height: {fitness_profile['user_basic_details']['height_in_cm']} cm

            Body Measurements:
            - Arms: {fitness_profile.get('user_initial_measurements', {}).get('arms_in_cm', 'N/A')} cm
            - Neck: {fitness_profile.get('user_initial_measurements', {}).get('neck_in_cm', 'N/A')} cm
            - Chest: {fitness_profile.get('user_initial_measurements', {}).get('chest_in_cm', 'N/A')} cm
            - Waist: {fitness_profile.get('user_initial_measurements', {}).get('waist_in_cm', 'N/A')} cm
            - Thighs: {fitness_profile.get('user_initial_measurements', {}).get('thighs_in_cm', 'N/A')} cm
            - Hips: {fitness_profile.get('user_initial_measurements', {}).get('hips_in_cm', 'N/A')} cm

            Health Details:
            - Family History: {', '.join(fitness_profile.get('user_health_details', {}).get('family_history', [])) or 'N/A'}
            - Existing Conditions: {', '.join(fitness_profile.get('user_health_details', {}).get('existing_conditions', [])) or 'N/A'}
            - Habitual Consumption: {', '.join(fitness_profile.get('user_health_details', {}).get('habitual_consumption', [])) or 'N/A'}
            - Current Medications: {', '.join(fitness_profile.get('user_health_details', {}).get('current_medications', [])) or 'N/A'}
            - Current Supplements: {', '.join(fitness_profile.get('user_health_details', {}).get('current_supplements', [])) or 'N/A'}

            Health Habits:
            - Water Intake: {fitness_profile.get('user_habits_assessment', {}).get('daily_water_intake_in_liter', 'N/A')}
            - Workout Frequency: {fitness_profile.get('user_habits_assessment', {}).get('weekly_workout_frequency', 'N/A')} times per week
            - Activity Level: {fitness_profile.get('user_habits_assessment', {}).get('activity_level', 'N/A')}
            - Diet Preference: {fitness_profile.get('user_habits_assessment', {}).get('diet_preference', 'N/A')}
            - Uncomfortable Foods: {', '.join(fitness_profile.get('user_habits_assessment', {}).get('uncomfortable_foods', [])) or 'N/A'}

            Daily Routine:
            Typical Meals:
            - Breakfast: {fitness_profile.get('user_routine_assessment', {}).get('typical_meals', {}).get('breakfast') or 'N/A'}
            - Lunch: {fitness_profile.get('user_routine_assessment', {}).get('typical_meals', {}).get('lunch') or 'N/A'}
            - Snacks: {fitness_profile.get('user_routine_assessment', {}).get('typical_meals', {}).get('snacks') or 'N/A'}
            - Dinner: {fitness_profile.get('user_routine_assessment', {}).get('typical_meals', {}).get('dinner') or 'N/A'}

            Daily Schedule:
            - Wake up: {fitness_profile.get('user_routine_assessment', {}).get('daily_routine', {}).get('wakeup_time') or 'N/A'}
            - Breakfast at: {fitness_profile.get('user_routine_assessment', {}).get('daily_routine', {}).get('breakfast_time') or 'N/A'}
            - Lunch at: {fitness_profile.get('user_routine_assessment', {}).get('daily_routine', {}).get('lunch_time') or 'N/A'}
            - Evening Snacks at: {fitness_profile.get('user_routine_assessment', {}).get('daily_routine', {}).get('evening_snacks_time') or 'N/A'}
            - Dinner at: {fitness_profile.get('user_routine_assessment', {}).get('daily_routine', {}).get('dinner_time') or 'N/A'}
            - Bed time: {fitness_profile.get('user_routine_assessment', {}).get('daily_routine', {}).get('bed_time') or 'N/A'}

            Stress Audit:
            - Time sitting at a stretch: {fitness_profile.get('user_routine_assessment', {}).get('stress_audit', {}).get('time_sitting_at_a_stretch') or 'N/A'}
            - Time standing at a stretch: {fitness_profile.get('user_routine_assessment', {}).get('stress_audit', {}).get('time_standing_at_a_stretch') or 'N/A'}
            - Time travelling per day: {fitness_profile.get('user_routine_assessment', {}).get('stress_audit', {}).get('time_travelling_per_day') or 'N/A'}

            Fitness Goals: {fitness_profile.get('user_fitness_goals', 'N/A')}
            """

        try:
            # Generate response using Gemini AI
            model = genai.GenerativeModel('gemini-pro')
            prompt = f"""
                You are a professional fitness and health advisor. Based on the following user profile, provide a brief answer to the user's question (limited 300 characters):
                {profile_summary}
                User's Question: {chat_message.message}
            """

            try:
                # First get the response from Gemini
                response = model.generate_content(prompt)
                if not response or not response.text:
                    raise Exception("Empty response from Gemini API")
                generated_text = response.text

                # Only store conversation if we got a valid response
                await conversation_history_collection.insert_one({
                    "user_id": chat_message.user_id,
                    "conversation_id": conversation_id,
                    "message": chat_message.message,
                    "response": generated_text,
                    "timestamp": datetime.utcnow()
                })

                # Extract and store key recommendations
                key_recommendations = {
                    "user_id": chat_message.user_id,
                    "message": chat_message.message,
                    "recommended_calories": extract_calories_from_response(generated_text),
                    "recommended_workouts": extract_workouts_from_response(generated_text),
                    "recommended_meal_plan": extract_meal_plan_from_response(generated_text),
                    "fitness_advice": extract_fitness_advice_from_response(generated_text),
                    "timestamp": datetime.utcnow()
                }
                
                # Only store if recommendations are relevant to the question category
                question_lower = chat_message.message.lower()
                if any(word in question_lower for word in ['food', 'eat', 'diet', 'meal']):
                    has_useful_recommendations = any([
                        key_recommendations["recommended_calories"] != "Calories recommendation not found",
                        key_recommendations["recommended_meal_plan"] != "Meal plan recommendation not found"
                    ])
                elif any(word in question_lower for word in ['exercise', 'workout', 'sport']):
                    has_useful_recommendations = any([
                        key_recommendations["recommended_workouts"] != "Workout recommendation not found",
                        key_recommendations["fitness_advice"] != "General fitness advice not found"
                    ])
                else:
                    has_useful_recommendations = any([
                        key_recommendations["recommended_calories"] != "Calories recommendation not found",
                        key_recommendations["recommended_workouts"] != "Workout recommendation not found",
                        key_recommendations["recommended_meal_plan"] != "Meal plan recommendation not found",
                        key_recommendations["fitness_advice"] != "General fitness advice not found"
                    ])
                
                if has_useful_recommendations:
                    await key_recommendations_collection.insert_one(key_recommendations)
                
                # Construct the complete response
                complete_response = ""
                if await is_new_session(chat_message.user_id):
                    complete_response = "Welcome! I'm your AI fitness advisor.\n\n"
                complete_response += generated_text
                complete_response += f"\n\n{retrieval_instructions}"
                
                return ChatResponse(
                    response=complete_response,
                    sources=["Fitness Profile"],
                    conversation_id=conversation_id,
                    retrieval_instructions=retrieval_instructions
                )
                
            except Exception as api_error:
                print(f"Gemini API Error: {str(api_error)}")
                # Don't store failed conversations
                fallback_response = await get_fallback_response("api_error")
                return ChatResponse(
                    response=fallback_response,
                    sources=["Fallback"],
                    conversation_id=conversation_id,
                    retrieval_instructions=retrieval_instructions
                )
            
        except Exception as e:
            print(f"General Error: {str(e)}")
            fallback_response = await get_fallback_response("profile_error")
            return ChatResponse(
                response=fallback_response,
                sources=["Fallback"],
                conversation_id=conversation_id,
                retrieval_instructions=retrieval_instructions
            ) 

    except Exception as e:
        print(f"General Error: {str(e)}")
        fallback_response = await get_fallback_response("profile_error")
        return ChatResponse(
            response=fallback_response,
            sources=["Fallback"],
            conversation_id=conversation_id,
            retrieval_instructions=retrieval_instructions
        ) 

@chat_router.get("/v1/360_degree_fitness/chat/history/{conversation_id}")
async def get_chat_history(
    conversation_id: str,
    format: Literal["json", "pdf"] = "json",
    pretty: bool = True,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Retrieve chat history for a given conversation ID in specified format."""
    history = await conversation_history_collection.find(
        {"conversation_id": conversation_id}
    ).sort("timestamp", 1).to_list(length=None)
    
    if not history:
        raise HTTPException(
            status_code=404, 
            detail="Conversation not found. Please ensure you're using a valid conversation ID."
        )

    if format == "json":
        json_data = {
            "conversation_id": conversation_id,
            "total_messages": len(history),
            "messages": [
                {
                    "message": chat["message"],
                    "response": chat["response"],
                    "timestamp": chat["timestamp"].strftime("%Y-%m-%d %H:%M:%S UTC")
                } for chat in history
            ]
        }
        return JSONResponse(
            content=orjson.loads(orjson.dumps(json_data, option=orjson.OPT_INDENT_2) if pretty else orjson.dumps(json_data)),
            media_type="application/json"
        )
    
    elif format == "pdf":
        # Create a PDF buffer
        buffer = BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            title=f"Chat History - {conversation_id}"
        )
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30
        )
        
        # Create the PDF content
        content = []
        
        # Add title
        content.append(Paragraph(f"Chat History - Conversation ID: {conversation_id}", title_style))
        content.append(Spacer(1, 12))
        
        # Add chat messages with UTC time
        for chat in history:
            timestamp = chat["timestamp"].strftime("%Y-%m-%d %H:%M:%S UTC")
            content.append(Paragraph(f"Time: {timestamp}", styles["Heading3"]))
            content.append(Paragraph(f"User: {chat['message']}", styles["Normal"]))
            content.append(Paragraph(f"AI: {chat['response']}", styles["Normal"]))
            content.append(Spacer(1, 12))
        
        # Build the PDF
        doc.build(content)
        
        # Get the value from the buffer
        pdf = buffer.getvalue()
        buffer.close()
        
        # Create a temporary file to serve
        temp_pdf_path = f"temp_chat_history_{conversation_id}.pdf"
        with open(temp_pdf_path, "wb") as f:
            f.write(pdf)
        
        # Add the cleanup task to background tasks
        background_tasks.add_task(os.unlink, temp_pdf_path)
        
        # Return the PDF file
        return FileResponse(
            temp_pdf_path,
            media_type="application/pdf",
            filename=f"chat_history_{conversation_id}.pdf",
            background=background_tasks
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Available formats: json, pdf"
        )