# 360 Degree Fitness

## Installation and Setup

### **Clone Repository**
git clone https://github.com/tashigarg/360DegreeFitness.git
cd 360DegreeFitness

### **Setup Frontend**
cd client
npm install -f

### **Setup Server**
cd ../server
npm install

### **Setup Backend**
cd ../backend
python -m venv venv

### **Activate Virtual Environment:**
**Unix/macOS:**
source venv/bin/activate
**Windows PowerShell:**
.\venv\Scripts\Activate
**Windows CMD:**
venv\Scripts\activate

### **Install Dependencies**
pip install -r requirements.txt

### **Start Services**
**Start Backend Server**
uvicorn app:app --reload

### **In a new terminal, start Server**
cd ../server
npm start

### **In another terminal, start Frontend**
cd ../client
npm start

## Features

- **User Authentication**: Register, login, and secure access
- **Fitness Profile Management**: Create and manage personal fitness profiles
- **Fitness Plan Generation**: Get personalized workout and meal plans

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation

## Project Structure

backend/
├── core/
│   └── security.py         # JWT and password security
├── db/
│   ├── connection.py       # Database connection
│   └── database.py        # Database models
├── models/
│   ├── auth.py            # Auth models
│   ├── fitnessPlan.py     # Fitness plan models
│   └── userFitnessProfile.py  # User profile models
├── routers/
│   ├── authRouter.py      # Auth endpoints
│   ├── fitnessPlanRouter.py  # Fitness plan endpoints
│   └── userFitnessProfileRouter.py  # Profile endpoints
└── app.py                 # Main application