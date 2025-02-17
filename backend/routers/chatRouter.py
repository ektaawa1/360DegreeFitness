from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..db.database import MongoDB
import httpx
import os
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from google.auth.transport.requests import Request
from google.oauth2 import service_account

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

chat_router = APIRouter()

class ChatMessage(BaseModel):
    user_id: str
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None

class Document:
    def __init__(self, page_content, metadata=None):
        self.page_content = page_content
        self.metadata = metadata or {}

@chat_router.post("/v1/360_degree_fitness/chat", response_model=ChatResponse)
async def chat_with_ai(chat_message: ChatMessage):
    try:
        # Retrieve user's data from the database
        documents = await MongoDB.get_fitness_data_for_rag(chat_message.user_id)
        
        # Ensure documents are in the correct format
        documents = [Document(doc, metadata={"source": "User Profile"}) for doc in documents]
        
        # Before splitting documents
        print("Documents before splitting:", documents)
        
        # Create vector store
        text_splitter = RecursiveCharacterTextSplitter()
        try:
            texts = text_splitter.split_documents(documents)
        except Exception as e:
            print("Error during document splitting:", str(e))
            raise HTTPException(status_code=500, detail="Error during document splitting")
        
        # After splitting documents
        print("Texts after splitting:", texts)
        
        # Sanitize the prompt to remove sensitive information and unnecessary fields
        sanitized_documents = []
        for doc in texts:
            sanitized_content = doc.page_content
            # Remove sensitive fields
            if 'password' in sanitized_content:
                sanitized_content = sanitized_content.replace('password', '***')
            # Remove database-specific fields
            sanitized_content = sanitized_content.replace("ObjectId(", "").replace(")", "")
            sanitized_content = sanitized_content.replace("__v", "")
            # Add more fields to sanitize as needed
            # sanitized_documents.append(f"User Profile: {sanitized_content}")
            sanitized_documents.append(f"User Profile: nora's weight is 60kg and height is 176cm")

        
        # Check if any documents were found
        if not sanitized_documents:
            combined_prompt = f"User Query: {chat_message.message}\n\nNo fitness profile data found for the user."
        else:
            combined_prompt = f"User Query: {chat_message.message}\n\nRetrieved Data:\n" + "\n".join(sanitized_documents)
        
        # Debug: Print the combined prompt
        print("Combined Prompt:", combined_prompt)
        
        # Load your service account credentials
        credentials = service_account.Credentials.from_service_account_file(
            'credentials/service_account.json',
            scopes=['https://www.googleapis.com/auth/generative-language']
        )

        # Refresh the token if necessary
        credentials.refresh(Request())

        headers = {
            "Authorization": f"Bearer {credentials.token}",
            "Content-Type": "application/json"
        }
        
        # Make a request to the Gemini API
        data = {
            "model": "gemini-large",
            "prompt": combined_prompt,
            # Remove or replace max_tokens if not valid
            # "max_tokens": 150
        }
        async with httpx.AsyncClient() as client:
            response = await client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-large:generateText", headers=headers, json=data)
            print("Response status code:", response.status_code)
            print("Response content:", response.text)
            response_data = response.json()
        
        # Debug: Print the entire response data
        print("Response data from Gemini API:", response_data)
        
        # Get response
        result = response_data  # Assuming the response structure is similar
        sources = [doc.metadata["source"] for doc in texts if "source" in doc.metadata]
        
        return ChatResponse(
            response=result.get("output", "No answer available"),
            sources=sources
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 