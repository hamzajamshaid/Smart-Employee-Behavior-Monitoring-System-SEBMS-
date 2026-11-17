"""Read PRESENT/ABSENT lines from the Arduino and store each one in the database."""
import glob
import os
import sys
import time

import serial
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.models import SensorPresenceEvent

BAUD = 9600
DB_URL = os.environ.get('DATABASE_URL', 'mysql+pymysql://root@localhost/sebms_db')

Session = sessionmaker(bind=sa.create_engine(DB_URL))


def find_port():
    env_port = os.environ.get('SENSOR_PORT')
    if env_port and os.path.exists(env_port):
        return env_port
    ports = sorted(glob.glob('/dev/cu.usbserial*'))
    return ports[0] if ports else None


def store(state):
    s = Session()
    try:
        s.add(SensorPresenceEvent(is_present=state))
        s.commit()
    finally:
        s.close()


def main():
    while True:
        port = find_port()
        if not port:
            print('No Arduino found, retrying in 2 seconds', flush=True)
            time.sleep(2)
            continue
        try:
            print('Listening on', port, flush=True)
            with serial.Serial(port, BAUD, timeout=5) as ser:
                while True:
                    line = ser.readline().decode('ascii', errors='ignore').strip()
                    if line == 'PRESENT':
                        store(True)
                        print('PRESENT saved', flush=True)
                    elif line == 'ABSENT':
                        store(False)
                        print('ABSENT saved', flush=True)
        except Exception as e:
            print('Sensor error:', e, '- retrying in 2 seconds', flush=True)
            time.sleep(2)


if __name__ == '__main__':
    main()
