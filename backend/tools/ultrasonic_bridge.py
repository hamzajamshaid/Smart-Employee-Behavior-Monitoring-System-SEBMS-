"""Read PRESENT/ABSENT lines from the Arduino and store each one in the database."""
import os
import sys

import serial
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.models import SensorPresenceEvent

PORT = os.environ.get('SENSOR_PORT', '/dev/cu.usbserial-120')
DB_URL = os.environ.get('DATABASE_URL', 'mysql+pymysql://root@localhost/sebms_db')

Session = sessionmaker(bind=sa.create_engine(DB_URL))


def store(state):
    s = Session()
    try:
        s.add(SensorPresenceEvent(is_present=state))
        s.commit()
    finally:
        s.close()


def main():
    print('Listening on', PORT)
    with serial.Serial(PORT, 9600, timeout=5) as ser:
        while True:
            line = ser.readline().decode('ascii', errors='ignore').strip()
            if line == 'PRESENT':
                store(True)
                print('PRESENT saved')
            elif line == 'ABSENT':
                store(False)
                print('ABSENT saved')


if __name__ == '__main__':
    main()
