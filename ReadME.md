git clone https://github.com/tashigarg/360DegreeFitness.git

cd 360DegreeFitness

cd client

npm install -f



cd ../server

npm install

cd ../backend

python -m venv venv

source venv/bin/activate
or .\venv\Scripts\Activate (powershell)
or venv\Scripts\activate (cmd)

pip install fastapi uvicorn

uvicorn app:app --reload


cd ../server

npm start

cd ../client

npm start
