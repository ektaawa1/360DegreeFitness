from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from backend.models.auth import UserRegister, UserLogin, UserResponse
from backend.db.database import User
from backend.core.security import create_access_token, verify_token

auth_router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Registration endpoint
@auth_router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserRegister):
    try:
        # Check if username already exists
        if User.objects(username=user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email already exists
        if User.objects(email=user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        try:
            # Hash the password
            hashed_password = pwd_context.hash(user_data.password)
            
            # Create new user
            new_user = User(
                username=user_data.username,
                email=user_data.email,
                name=user_data.name,
                password_hash=hashed_password
            )
            print(f"Attempting to save user with data: {user_data}")  # Debug log
            print(f"Created user object: {new_user}")  # Debug log
            try:
                new_user.save()
                print("User saved successfully")  # Debug log
            except Exception as save_error:
                print(f"Save error details: {str(save_error)}")
                print(f"Save error type: {type(save_error)}")
                raise save_error

            return UserResponse(
                username=new_user.username,
                email=new_user.email,
                name=new_user.name
            )
        except Exception as inner_e:
            print(f"Inner error: {str(inner_e)}")
            print(f"Inner error type: {type(inner_e)}")
            raise

    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        print(f"Outer error: {str(e)}")
        print(f"Outer error type: {type(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

# Login endpoint
@auth_router.post("/login")
async def login_user(user_data: UserLogin):
    try:
        # Find user by username
        user = User.objects(username=user_data.username).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Verify password
        if not pwd_context.verify(user_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        # Generate JWT token
        access_token = create_access_token(
            data={"sub": user.username}  # sub is the subject of the token
        )

        # Return token and user info
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(
                username=user.username,
                email=user.email,
                name=user.name
            )
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )

# New endpoint to get current user
@auth_router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    username = verify_token(token)
    user = User.objects(username=username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse(
        username=user.username,
        email=user.email,
        name=user.name
    ) 