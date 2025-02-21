from fastapi import APIRouter
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext


auth_router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")