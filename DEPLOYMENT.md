# Deployment Instructions
These aren't currently written with Docker in mind, though we'll probably want to switch to it at some point.

### Repo Setup
```
git clone <url>
cd pitchcraft
```
### Dependencies (ec2's distro uses yum)
```
sudo yum install npm
sudo yum install python3.11
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
