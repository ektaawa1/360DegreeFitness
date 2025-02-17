from pydantic import BaseModel

class UserBase(BaseModel):
    username: str
    name: str

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: str

class ChatResponse(BaseModel):
    response: str
    sources: list[str]

def return_chat_response(result):
    return ChatResponse(
        response=result["answer"],
        sources=[doc.metadata["source"] for doc in result["source_documents"]]
    ) 