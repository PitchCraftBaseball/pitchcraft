# Deployment Instructions
### Repo Setup
```
git clone <url>
cd pitchcraft
```
### Python (3.11) Setup
```
python -m venv .venv
source venv/bin/activate # Linux/Mac
. .\venv\Scripts\activate # Windows
pip install -r requirements.txt
```
### Backend
```
cd backend
python manage.py runserver

# http://127.0.0.1:8000/api/ping/
```
### Frontend
```
cd frontend
npm install
npm run dev

# http://localhost:5173/
```