#!/bin/zsh
pkill -f "celery -A celery_worker"
pkill -f "tools/ultrasonic_bridge.py"
pkill -f "python run.py"
pkill -f "vite"
pkill -f "cloudflared tunnel"
echo "SEBMS stopped."
