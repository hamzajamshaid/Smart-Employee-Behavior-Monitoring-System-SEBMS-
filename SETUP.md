# SEBMS setup (macOS, Apple Silicon)

## 1. Prerequisites
- Homebrew, then: `brew install mysql redis ffmpeg node`
- Python 3.12 (for example from Anaconda, or `brew install python@3.12`)
- Start services: `brew services start mysql` and `brew services start redis`

## 2. Virtual environments (three, on purpose)
MediaPipe, DeepFace/TensorFlow, and Silero/Whisper have conflicting dependencies, so each runs in its own environment. The batch calls the presence and voice steps in child processes.

```bash
cd ~/Documents/FYP/sebms_final
python3.12 -m venv venv
python3.12 -m venv venv-presence
python3.12 -m venv venv-voice
source venv/bin/activate && pip install -r backend/requirements.txt && deactivate
source venv-presence/bin/activate && pip install -r backend/requirements-presence.txt && pip install --no-deps mediapipe==0.10.21 && deactivate
source venv-voice/bin/activate && pip install -r backend/requirements-voice.txt faster-whisper && deactivate
```

Known: DeepFace reports a `retina-face` dependency warning from `pip check`. It is not needed for the emotion path and can be ignored.

## 3. Database
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS sebms_db;"
```
Schema setup and seed: see section 6 (open item).

## 4. Environment file
```bash
cd ~/Documents/FYP/sebms_final/backend
cp .env.example .env
```
Set `SECRET_KEY` and `JWT_SECRET_KEY` to random values (command is in the file). Never commit `.env`.

## 5. Start order (each in its own terminal, leave running)
1. MySQL and Redis (services above)
2. Backend: `cd backend && source ../venv/bin/activate && export DATABASE_URL=mysql+pymysql://root@localhost/sebms_db && python run.py`
3. Worker: `cd backend && source ../venv/bin/activate && celery -A celery_worker worker --loglevel=info --pool=solo`
4. Beat (daily batch at 00:00 UTC): `cd backend && source ../venv/bin/activate && celery -A celery_worker beat --loglevel=info`
5. Frontend: `cd frontend && npm install && npm run dev` (open the address it prints)

## 6. Database schema and seed data
The schema is created from the SQLAlchemy models, so no hand-written migrations are needed.
Verified on a fresh database (`sebms_test`): the models create every table and constraint the code uses, and the seed script runs successfully.

```bash
cd backend && source ../venv/bin/activate
mysql -u root -e "CREATE DATABASE IF NOT EXISTS sebms_db;"
DATABASE_URL=mysql+pymysql://root@localhost/sebms_db python -c "
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from app.models import Base
from app.seed_db import seed_database
engine = sa.create_engine('mysql+pymysql://root@localhost/sebms_db')
Base.metadata.create_all(engine)
s = sessionmaker(bind=engine)()
seed_database(s); s.commit()
"
```

Demo logins (development only): admin `admin` / `admin123`; employee `EMP001` / `password`.
Note: the seed creates 365 days of synthetic scores. These are demonstration data, not measurements.

## 7. Recording and processing
Record on Simulate Capture (employee login), then trigger batch as admin, or let beat run it. Recordings are saved as `.webm` in `backend/storage/videos/`.
