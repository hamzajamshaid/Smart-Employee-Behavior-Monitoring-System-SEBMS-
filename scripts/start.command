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
pkill -f "cloudflared tunnel" 2>/dev/null
sleep 2

cd "$PROJECT/backend"
nohup "$PY" run.py > "$LOGS/backend.log" 2>&1 &
nohup "$PY" -m celery -A celery_worker worker --loglevel=info --pool=solo > "$LOGS/worker.log" 2>&1 &
SENSOR_PORT=$(ls /dev/cu.usbserial* 2>/dev/null | head -1) nohup "$PY" tools/ultrasonic_bridge.py > "$LOGS/sensor.log" 2>&1 &

nohup cloudflared tunnel --url http://localhost:5173 > "$LOGS/tunnel.log" 2>&1 &
URL=""
for i in {1..30}; do
  URL=$(grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOGS/tunnel.log" | head -1)
  [ -n "$URL" ] && break
  sleep 1
done
if [ -n "$URL" ]; then
  sed -i '' "s#^VITE_PUBLIC_URL=.*#VITE_PUBLIC_URL=$URL#" "$PROJECT/frontend/.env"
  echo "QR address: $URL"
else
  echo "Tunnel did not start. Check $LOGS/tunnel.log"
fi

cd "$PROJECT/frontend"
nohup npm run dev > "$LOGS/frontend.log" 2>&1 &
sleep 5
open http://localhost:5173
echo "SEBMS started. Logs are in $LOGS"
