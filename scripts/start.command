#!/bin/zsh
PROJECT=/Users/mac/Documents/FYP/sebms_final
LOGS="$PROJECT/logs"
PY="$PROJECT/venv/bin/python"
mkdir -p "$LOGS"

brew services start mysql >/dev/null 2>&1
brew services start redis >/dev/null 2>&1

pkill -f "celery -A celery_worker" 2>/dev/null
pkill -f "tools/ultrasonic_bridge.py" 2>/dev/null
pkill -f "python run.py" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

cd "$PROJECT/backend"
nohup "$PY" run.py > "$LOGS/backend.log" 2>&1 &
nohup "$PY" -m celery -A celery_worker worker --loglevel=info --pool=solo > "$LOGS/worker.log" 2>&1 &
nohup "$PY" tools/ultrasonic_bridge.py > "$LOGS/sensor.log" 2>&1 &

cd "$PROJECT/frontend"
nohup npm run dev > "$LOGS/frontend.log" 2>&1 &

sleep 5
open http://localhost:5173
echo "SEBMS started. Logs are in $LOGS"
