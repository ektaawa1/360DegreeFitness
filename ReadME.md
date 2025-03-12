# 360 Degree Fitness

## Installation and Setup

### • Prerequisites
- Python 3.12.7 (recommended) or Python 3.12.x
- Conda (recommended) or pip
- Node.js and npm
- MongoDB Atlas account and connection string
- Tesseract OCR (for image text recognition)

### • Clone Repository
git clone https://github.com/tashigarg/360DegreeFitness.git

cd 360DegreeFitness

### • Setup Frontend
cd client

npm install -f

npm install jspdf --legacy-peer-deps

npm install @types/jspdf --legacy-peer-deps

### • Setup Server
cd ../server

npm install

### • Setup Backend and Resolve Linter Errors
cd ../backend

#### 1. Create and activate conda environment
conda create -n 360fitness python=3.12.7

conda activate 360fitness

### • Setup Environment
Create a `.env` file in the backend directory

Add the following variables:

MONGO_URI=your_mongodb_connection_string_here

ACCESS_TOKEN_EXPIRE_MINUTES=your_access_token_expire_minutes_here

SECRET_KEY=your_secret_key_here

GEMINI_API_KEY=your_gemini_api_key_here

### • Install Tesseract OCR
#### macOS:
```bash
brew install tesseract
```

#### Ubuntu/Debian:
```bash
sudo apt-get install tesseract-ocr
```

#### Windows:
1. Download the installer from https://github.com/UB-Mannheim/tesseract/wiki
2. Install and add the installation directory to your PATH

#### 2. Install dependencies
#### >> Install requirements from backend directory
pip install -r requirements.txt

#### >> Then go to root directory (where setup.py is) and install package
cd ..

pip install -e .

#### 3. If you see "Import fastapi could not be resolved" errors:
&nbsp;&nbsp;&nbsp;&nbsp;a. Verify you're in the conda environment

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;conda activate 360fitness

&nbsp;&nbsp;&nbsp;&nbsp;b. Check installations

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pip show fastapi

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pip list | grep -E "fastapi|pydantic|uvicorn"

&nbsp;&nbsp;&nbsp;&nbsp;c. Reinstall packages

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pip uninstall fastapi pydantic

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pip install -r requirements.txt

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pip install -e .

&nbsp;&nbsp;&nbsp;&nbsp;d. In VS Code:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Press Cmd/Ctrl + Shift + P

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Type "Python: Select Interpreter"

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Choose the conda environment (360fitness)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Type "Developer: Reload Window"

### • Start Services

#### Start Backend Server
cd backend

uvicorn backend.app:app --reload

#### In a new terminal, start Server
cd server

npm start

#### In another terminal, start Frontend
cd client

npm start


### • API Documentation
Visit http://localhost:8000/docs for interactive API documentation

### • Features

- AI-powered fitness coaching using Google's Gemini AI

- Personalized workout plans

- Diet recommendations

- Chat history export (JSON/PDF)

- Progress tracking

- User authentication

- Responsive chat interface

- More to come...