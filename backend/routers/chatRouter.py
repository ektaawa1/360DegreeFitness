from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import orjson
from pydantic import BaseModel
from typing import List, Optional, Literal
import google.generativeai as genai
import os
from dotenv import load_dotenv
from ..db.database import profiles_collection, key_recommendations_collection, conversation_history_collection, meal_diary_collection
from datetime import datetime, timedelta, date
import re
from rapidfuzz import fuzz
from bson import ObjectId
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from fastapi import BackgroundTasks
import calendar
from enum import Enum, auto
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

# Configure the Generative AI client
print(f"Initializing Gemini with API key: {gemini_api_key[:5]}...")
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

# Define query types for better context tracking
class QueryType(Enum):
    CALORIES = "calories"
    WORKOUT = "workout"
    WEIGHT = "weight"
    HEALTH = "health"
    GENERAL = "general"
    MEAL_PLAN = "meal_plan"
    WATER = "water"
    SLEEP = "sleep"

# Add this enum for query classification
class QueryIntent(Enum):
    CALORIES_TODAY = "calories_today"
    CALORIES_DATE = "calories_date"
    GENERAL_FITNESS = "general_fitness"
    MEAL_PLAN = "meal_plan"
    WORKOUT = "workout"
    UNKNOWN = "unknown"

# Enhance the conversation context to track more types of queries
class ConversationContext:
    """Class to track conversation context"""
    def __init__(self):
        self.contexts = {}  # user_id -> context dict
    
    def get_context(self, user_id: str):
        """Get context for a user (create if doesn't exist)"""
        if user_id not in self.contexts:
            self.contexts[user_id] = {
                "last_query_type": None,
                "last_query_date": None,
                "last_response": None,
                "last_timestamp": None,
                "conversation_topics": []  # Track topics discussed in the conversation
            }
        return self.contexts[user_id]
    
    def update_context(self, user_id: str, query_type: str, query_date: date, response: str):
        """Update context for a user"""
        context = self.get_context(user_id)
        context["last_query_type"] = query_type
        context["last_query_date"] = query_date
        context["last_response"] = response
        context["last_timestamp"] = datetime.utcnow()
        
        # Add to conversation topics if not already there
        if query_type not in context["conversation_topics"]:
            context["conversation_topics"].append(query_type)

# Function to detect query type
def detect_query_type(message: str, user_id: str = None) -> tuple:
    """
    Detect the type of query and any relevant parameters
    Returns: (QueryType, parameters dict)
    """
    message_lower = message.lower()
    
    # Check for calorie-related queries
    if is_calorie_query(message_lower, user_id):
        return QueryType.CALORIES, {"date": parse_date_from_message(message)}
    
    # Check for workout-related queries
    workout_keywords = ["workout", "exercise", "training", "cardio", "strength", "run", "jog", "lift"]
    if any(keyword in message_lower for keyword in workout_keywords):
        return QueryType.WORKOUT, {"date": parse_date_from_message(message)}
    
    # Check for weight-related queries
    weight_keywords = ["weight", "bmi", "fat", "gain", "lose", "lost", "gained"]
    if any(keyword in message_lower for keyword in weight_keywords):
        return QueryType.WEIGHT, {"date": parse_date_from_message(message)}
    
    # Check for meal plan queries
    meal_plan_keywords = ["meal plan", "diet plan", "eating plan", "nutrition plan", "what should i eat"]
    if any(keyword in message_lower for keyword in meal_plan_keywords):
        return QueryType.MEAL_PLAN, {}
    
    # Check for water intake queries
    water_keywords = ["water", "hydration", "drink", "fluid"]
    if any(keyword in message_lower for keyword in water_keywords):
        return QueryType.WATER, {}
    
    # Check for sleep-related queries
    sleep_keywords = ["sleep", "rest", "tired", "fatigue", "insomnia"]
    if any(keyword in message_lower for keyword in sleep_keywords):
        return QueryType.SLEEP, {}
    
    # Check for health-related queries
    health_keywords = ["health", "medical", "condition", "pain", "injury", "sick", "illness"]
    if any(keyword in message_lower for keyword in health_keywords):
        return QueryType.HEALTH, {}
    
    # Check for follow-up questions
    if user_id:
        context = conversation_context.get_context(user_id)
        if context["last_query_type"] and len(message_lower.split()) <= 5:
            # This is likely a follow-up to the previous query
            return context["last_query_type"], {"date": context["last_query_date"]}
    
    # Default to general query
    return QueryType.GENERAL, {}

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

async def get_user_meal_data(user_id: str, query_date: date = None):
    """Get user's meal data for a specific date (defaults to today)"""
    if query_date is None:
        query_date = date.today()
    
    # Convert date to string in ISO format (YYYY-MM-DD)
    date_str = query_date.isoformat()
    
    print(f"DEBUG: Looking for meal data with user_id={user_id}, date={date_str}")
    
    # Try different date formats that might be in the database
    possible_date_formats = [
        date_str,                                      # ISO format: 2025-02-25
        query_date.strftime("%m/%d/%Y"),              # US format: 02/25/2025
        query_date.strftime("%d/%m/%Y"),              # UK format: 25/02/2025
        query_date.strftime("%B %d, %Y"),             # Long format: February 25, 2025
        str(query_date)                               # String representation
    ]
    
    # First try exact match with ISO format
    meal_diary = await meal_diary_collection.find_one(
        {"user_id": user_id, "date": date_str}
    )
    
    # If not found, try other date formats
    if not meal_diary:
        print(f"DEBUG: No meal data found with exact ISO format. Trying other formats...")
        
        # Try a more flexible query that might match different date formats
        for date_format in possible_date_formats:
            print(f"DEBUG: Trying date format: {date_format}")
            meal_diary = await meal_diary_collection.find_one(
                {"user_id": user_id, "date": date_format}
            )
            if meal_diary:
                print(f"DEBUG: Found meal data with format: {date_format}")
                break
    
    # If still not found, try a regex approach for partial date matching
    if not meal_diary:
        print(f"DEBUG: No meal data found with standard formats. Trying regex...")
        
        # Get month and day for partial matching
        month = query_date.month
        day = query_date.day
        
        # Find all user's meal entries
        all_user_meals = await meal_diary_collection.find(
            {"user_id": user_id}
        ).to_list(length=100)
        
        print(f"DEBUG: Found {len(all_user_meals)} total meal entries for user")
        
        # Print all dates in the database for debugging
        for meal in all_user_meals:
            print(f"DEBUG: Database has entry with date: {meal.get('date')}")
        
        # Try to find a match based on month/day
        for meal in all_user_meals:
            db_date = meal.get('date')
            if db_date:
                # Try to extract month and day from various formats
                try:
                    # Try parsing as ISO format
                    parsed_date = date.fromisoformat(db_date)
                    if parsed_date.month == month and parsed_date.day == day:
                        print(f"DEBUG: Found matching meal by month/day: {db_date}")
                        meal_diary = meal
                        break
                except ValueError:
                    # Try other formats
                    for fmt in ["%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y"]:
                        try:
                            parsed_date = datetime.strptime(db_date, fmt).date()
                            if parsed_date.month == month and parsed_date.day == day:
                                print(f"DEBUG: Found matching meal by month/day with format {fmt}: {db_date}")
                                meal_diary = meal
                                break
                        except ValueError:
                            continue
    
    # If we found a meal diary entry, return it
    if meal_diary:
        print(f"DEBUG: Returning meal data: {meal_diary}")
    else:
        print(f"DEBUG: No meal data found for user {user_id} on date {date_str}")
    
    return meal_diary

def parse_date_from_message(message: str) -> date:
    """Extract date from user message (returns today if no date found)"""
    today = date.today()
    
    # Check for specific date formats (MM/DD or MM/DD/YYYY)
    date_patterns = [
        r'(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?',  # MM/DD or MM/DD/YYYY
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, message)
        if match:
            try:
                month, day = int(match.group(1)), int(match.group(2))
                year = int(match.group(3)) if match.group(3) else today.year
                
                # Handle 2-digit years
                if year < 100:
                    year += 2000
                
                # Validate the date
                if 1 <= month <= 12 and 1 <= day <= calendar.monthrange(year, month)[1]:
                    return date(year, month, day)
            except (ValueError, IndexError):
                pass
    
    # Check for relative dates
    message_lower = message.lower()
    if "yesterday" in message_lower:
        return today - timedelta(days=1)
    elif "tomorrow" in message_lower:
        return today + timedelta(days=1)
    elif "last week" in message_lower:
        return today - timedelta(days=7)
    
    # Default to today
    return today

# Create a global conversation context tracker
conversation_context = ConversationContext()

# Fix the is_calorie_query function to handle date patterns better
def is_calorie_query(message: str, user_id: str = None) -> bool:
    """Check if the message is asking about calories consumed with context awareness"""
    calorie_keywords = [
        "calories", "calorie", "eat", "ate", "consume", "consumed", 
        "intake", "food", "meal", "nutrition", "diet", "kcal"
    ]
    
    time_keywords = ["today", "yesterday", "this week", "this month"]
    
    question_words = ["how", "what", "tell", "show", "many"]
    
    message_lower = message.lower()
    
    # Check for date patterns (like 2/25)
    has_date_pattern = bool(re.search(r'\d{1,2}[/\-]\d{1,2}', message_lower))
    
    # Direct calorie question
    has_calorie_keyword = any(keyword in message_lower for keyword in calorie_keywords)
    has_time_keyword = any(keyword in message_lower for keyword in time_keywords) or has_date_pattern
    has_question_word = any(word in message_lower for word in question_words)
    
    # Check if it's a follow-up question
    is_followup = False
    if user_id:
        context = conversation_context.get_context(user_id)
        # If the last query was about calories and this is a short follow-up
        if (context["last_query_type"] == "calories" and 
            len(message_lower.split()) <= 5 and
            (has_date_pattern or any(word in message_lower for word in ["what about", "how about"]))):
            is_followup = True
    
    return (has_calorie_keyword and (has_time_keyword or has_question_word)) or is_followup

# Add this function to classify user intent using Gemini
async def classify_user_intent(message: str):
    """Use Gemini to classify the user's intent"""
    try:
        # First check for simple date follow-up patterns before calling Gemini
        message_lower = message.lower()
        
        # Check for explicit date mentions in short queries
        date_patterns = [
            r'(?:what|how) about (\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?',  # what about 2/25
            r'date (\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?',  # date 2/25
            r'^(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?$',  # just 2/25
            r'hi how about (\d{1,2})[/\-](\d{1,2})',  # hi how about 2/25
            r'.*\b(\d{1,2})[/\-](\d{1,2})\b',  # any mention of 2/25
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, message_lower)
            if match:
                try:
                    month, day = int(match.group(1)), int(match.group(2))
                    year = int(match.group(3)) if match.group(3) and len(match.groups()) >= 3 else datetime.now().year
                    
                    # Handle 2-digit years
                    if year < 100:
                        year += 2000
                    
                    # Validate the date
                    if 1 <= month <= 12 and 1 <= day <= calendar.monthrange(year, month)[1]:
                        date_obj = date(year, month, day)
                        print(f"DEBUG: Detected date pattern in message: {date_obj.isoformat()}")
                        return {
                            "intent": QueryIntent.CALORIES_DATE,
                            "date": date_obj,
                            "explanation": f"User is asking about calories on {date_obj.isoformat()}"
                        }
                except (ValueError, IndexError) as e:
                    print(f"DEBUG: Error parsing date: {str(e)}")
                    pass
        
        # If not a simple date pattern, use Gemini
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"""
        Classify the following user message into exactly ONE of these categories:
        - CALORIES_TODAY: User is asking about calories consumed today
        - CALORIES_DATE: User is asking about calories consumed on a specific date (extract the date in YYYY-MM-DD format)
        - MEAL_PLAN: User is asking about meal plans or diet advice
        - WORKOUT: User is asking about workout or exercise
        - GENERAL_FITNESS: Any other fitness-related question
        - UNKNOWN: Not related to fitness or unclear
        
        User message: "{message}"
        
        Return ONLY a JSON object with these fields:
        - intent: the category
        - date: the date in YYYY-MM-DD format (only for CALORIES_DATE, otherwise null)
        - explanation: brief explanation of why you classified it this way
        
        Example: {{"intent": "CALORIES_TODAY", "date": null, "explanation": "User is asking about today's calorie intake"}}
        """
        
        response = model.generate_content(prompt)
        if not response or not response.text:
            return {"intent": QueryIntent.UNKNOWN, "date": None}
        
        # Parse the JSON response
        import json
        try:
            result = json.loads(response.text.strip())
            intent = result.get("intent", "UNKNOWN")
            date_str = result.get("date")
            
            # Convert string date to date object if present
            parsed_date = None
            if date_str and intent == "CALORIES_DATE":
                try:
                    parsed_date = date.fromisoformat(date_str)
                except ValueError:
                    # If date format is invalid, default to today
                    parsed_date = date.today()
            
            return {
                "intent": getattr(QueryIntent, intent, QueryIntent.UNKNOWN),
                "date": parsed_date,
                "explanation": result.get("explanation", "")
            }
        except json.JSONDecodeError:
            return {"intent": QueryIntent.UNKNOWN, "date": None}
            
    except Exception as e:
        print(f"Error classifying intent: {str(e)}")
        return {"intent": QueryIntent.UNKNOWN, "date": None}

# Add a function to find similar past questions and their successful responses
async def find_similar_questions(user_id: str, current_question: str, threshold: float = 0.7):
    """Find similar questions that the user has asked before and got satisfactory responses"""
    
    # Get user's conversation history from the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    past_conversations = await conversation_history_collection.find({
        "user_id": user_id,
        "timestamp": {"$gte": thirty_days_ago},
        # You could add a field to track if the response was helpful
        # "was_helpful": True
    }).to_list(length=100)
    
    if not past_conversations or len(past_conversations) < 3:
        # Not enough data to make meaningful comparisons
        return None
    
    # Extract questions and responses
    past_questions = [conv["message"] for conv in past_conversations]
    past_responses = [conv["response"] for conv in past_conversations]
    
    # Create a list of all questions including the current one
    all_questions = past_questions + [current_question]
    
    # Use TF-IDF to vectorize the questions
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(all_questions)
    
    # Calculate similarity between current question and past questions
    current_vector = tfidf_matrix[-1]
    past_vectors = tfidf_matrix[:-1]
    
    # Calculate cosine similarity
    similarities = cosine_similarity(current_vector, past_vectors)[0]
    
    # Find the most similar question above the threshold
    max_sim_idx = np.argmax(similarities)
    if similarities[max_sim_idx] >= threshold:
        return {
            "similar_question": past_questions[max_sim_idx],
            "previous_response": past_responses[max_sim_idx],
            "similarity_score": similarities[max_sim_idx]
        }
    
    return None

# Add this before the feedback endpoint
class ChatFeedback(BaseModel):
    conversation_id: str
    feedback_rating: int
    feedback_text: str = None

@chat_router.post("/v1/360_degree_fitness/chat/feedback")
async def provide_chat_feedback(feedback: ChatFeedback):
    """Endpoint for users to provide feedback on AI responses"""
    try:
        # Update the conversation with feedback
        result = await conversation_history_collection.update_one(
            {"conversation_id": feedback.conversation_id, "message": feedback.message},
            {"$set": {
                "was_helpful": feedback.was_helpful,
                "feedback_text": feedback.feedback_text,
                "feedback_timestamp": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            return JSONResponse(
                status_code=404,
                content={"message": "Conversation not found"}
            )
        
        # If the response was particularly helpful, add it to key recommendations
        if feedback.was_helpful and feedback.rating >= 4:
            # Extract key information from the conversation
            conversation = await conversation_history_collection.find_one(
                {"conversation_id": feedback.conversation_id, "message": feedback.message}
            )
            
            if conversation:
                # Use AI to extract key recommendations from the response
                key_info = await extract_key_recommendations(conversation["response"])
                
                # Store in key_recommendations collection
                await key_recommendations_collection.insert_one({
                    "user_id": conversation["user_id"],
                    "message": conversation["message"],
                    "recommended_calories": key_info.get("calories"),
                    "recommended_workouts": key_info.get("workouts"),
                    "recommended_meal_plan": key_info.get("meal_plan"),
                    "fitness_advice": key_info.get("general_advice"),
                    "timestamp": datetime.utcnow(),
                    "rating": feedback.rating
                })
        
        return {"message": "Feedback recorded successfully"}
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error recording feedback: {str(e)}"}
        )

# Modify the chat_with_ai function to use similar past questions
@chat_router.post("/v1/360_degree_fitness/chat", response_model=ChatResponse)
async def chat_with_ai(chat_message: ChatMessage):
    # Generate conversation_id at the start
    conversation_id = str(ObjectId())
    
    # Define retrieval instructions early
    retrieval_instructions = (
        "Want to view this conversation later? "
        f"Save this conversation ID: {conversation_id}\n"
        "You can retrieve your chat history by visiting:\n"
        f"- JSON format: /v1/360_degree_fitness/chat/history/{conversation_id}?format=json\n"
        f"- PDF format: /v1/360_degree_fitness/chat/history/{conversation_id}?format=pdf"
    )
    
    try:
        # Before calling Gemini, check if we have a similar question with a good response
        similar_question = await find_similar_questions(chat_message.user_id, chat_message.message)
        
        if similar_question and similar_question["similarity_score"] > 0.85:
            # We found a very similar question with a good response
            # Use the previous response directly
            response_text = similar_question["previous_response"]
            
            # Store the conversation
            await conversation_history_collection.insert_one({
                "user_id": chat_message.user_id,
                "conversation_id": conversation_id,
                "message": chat_message.message,
                "response": response_text,
                "timestamp": datetime.utcnow(),
                "used_previous_response": True,
                "similar_question": similar_question["similar_question"]
            })
            
            return ChatResponse(
                response=response_text,
                sources=["Previous Conversation"],
                conversation_id=conversation_id,
                retrieval_instructions=retrieval_instructions
            )
        
        # If no similar question found or similarity score is low, continue with Gemini
        # Classify the user's intent using Gemini
        intent_data = await classify_user_intent(chat_message.message)
        intent = intent_data["intent"]
        
        # Debug logging
        print(f"Classified intent: {intent}, Date: {intent_data.get('date')}, Explanation: {intent_data.get('explanation')}")
        
        # Handle calorie-related queries
        if intent in [QueryIntent.CALORIES_TODAY, QueryIntent.CALORIES_DATE]:
            # Determine the date to query
            query_date = intent_data["date"] if intent == QueryIntent.CALORIES_DATE else date.today()
            
            # Debug logging
            print(f"Querying meal data for date: {query_date}")
            
            # Get meal data for the requested date
            meal_data = await get_user_meal_data(chat_message.user_id, query_date)
            
            # Debug logging
            print(f"Meal data found: {bool(meal_data)}")
            if meal_data:
                print(f"Nutrition summary: {meal_data.get('daily_nutrition_summary', {})}")
            
            # Format date for display
            formatted_date = query_date.strftime("%B %d, %Y")
            if query_date == date.today():
                date_display = "today"
            elif query_date == date.today() - timedelta(days=1):
                date_display = "yesterday"
            else:
                date_display = f"on {formatted_date}"
            
            if not meal_data:
                # No meal data found for the requested date
                response_text = (
                    f"I don't see any meals logged {date_display}. "
                    "Please log your meals in the Food Diary section to track your calorie intake."
                )
            else:
                # Extract nutrition summary from meal data
                nutrition_summary = meal_data.get("daily_nutrition_summary", {})
                total_calories = nutrition_summary.get("total_calories", 0)
                total_fat = nutrition_summary.get("total_fat", 0)
                total_carbs = nutrition_summary.get("total_carbs", 0)
                total_protein = nutrition_summary.get("total_protein", 0)
                
                # Create a response with the nutrition information
                response_text = (
                    f"Based on your meal diary {date_display}, you've consumed:\n\n"
                    f"• Total Calories: {total_calories} kcal\n"
                    f"• Total Fat: {total_fat}g\n"
                    f"• Total Carbs: {total_carbs}g\n"
                    f"• Total Protein: {total_protein}g\n\n"
                    f"You can view more details in the Food Diary section."
                )
            
            # Store the conversation
            await conversation_history_collection.insert_one({
                "user_id": chat_message.user_id,
                "conversation_id": conversation_id,
                "message": chat_message.message,
                "response": response_text,
                "timestamp": datetime.utcnow()
            })
            
            return ChatResponse(
                response=response_text,
                sources=["Meal Diary"],
                conversation_id=conversation_id,
                retrieval_instructions=retrieval_instructions
            )
        
        # For all other query types, use the AI model
        fitness_profile = await profiles_collection.find_one({"user_id": chat_message.user_id})
        
        # If profile doesn't exist, still try to answer the question
        if not fitness_profile:
            fitness_profile = {}  # Use empty profile instead of raising exception
        
        # Generate profile summary for the AI model
        profile_summary = f"""
            User Profile:
            - Name: {fitness_profile.get('user_name', 'N/A')}
            - Age: {fitness_profile.get('user_age', 'N/A')}
            - Gender: {fitness_profile.get('user_gender', 'N/A')}
            - Height: {fitness_profile.get('user_height_in_cm', 'N/A')} cm
            - Weight: {fitness_profile.get('user_weight_in_kg', 'N/A')} kg
            - Activity Level: {fitness_profile.get('activity_level', 'N/A')}
            - Fitness Goals: {fitness_profile.get('fitness_goals', 'N/A')}
        """
        
        try:
            # Generate response using Gemini AI
            model = genai.GenerativeModel('gemini-1.5-pro')
            
            prompt = f"""
                You are a professional fitness and health advisor. Based on the following user profile, provide a helpful answer to the user's question:
                {profile_summary}
                
                User's Question: {chat_message.message}
                
                If the question is about a specific date like "2/25", interpret it as February 25th of the current year.
                Keep your response concise and focused on the user's question.
            """
            
            response = model.generate_content(prompt)
            if not response or not response.text:
                raise Exception("Empty response from Gemini API")
            
            generated_text = response.text
            
            # Store the conversation
            await conversation_history_collection.insert_one({
                "user_id": chat_message.user_id,
                "conversation_id": conversation_id,
                "message": chat_message.message,
                "response": generated_text,
                "timestamp": datetime.utcnow()
            })
            
            return ChatResponse(
                response=generated_text,
                sources=["Fitness Profile"],
                conversation_id=conversation_id,
                retrieval_instructions=retrieval_instructions
            )
            
        except Exception as api_error:
            print(f"Gemini API Error: {str(api_error)}")
            # Don't store failed conversations
            fallback_response = "I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
            return ChatResponse(
                response=fallback_response,
                sources=["Fallback"],
                conversation_id=conversation_id,
                retrieval_instructions=retrieval_instructions
            )
            
    except Exception as e:
        print(f"General Error: {str(e)}")
        fallback_response = "I encountered an error processing your request. Please try again or contact support if the issue persists."
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