import os, requests
B = os.getenv('SEBMS_API', 'http://127.0.0.1:5000')
ADMIN_PW = os.environ['SEBMS_ADMIN_PW']

def login(path, body):
    r = requests.post(B + path, json=body, timeout=10); r.raise_for_status()
    return r.json()['token']

def H(t): return {'Authorization': 'Bearer ' + t}

def run():
    adm = login('/auth/login', {'username': 'admin', 'password': ADMIN_PW, 'role': 'Admin'})
    emp = login('/api/auth/employee-login', {'employee_code': 'EMP001', 'password': os.environ['SEBMS_TEST_EMP_PW']})
    cus = login('/api/auth/customer-login', {'phone': '03001234567', 'password': os.environ['SEBMS_TEST_CUS_PW']})
    results = []
    def check(name, method, path, tok, want, **kw):
        r = requests.request(method, B + path, headers=H(tok), timeout=15, **kw)
        ok = r.status_code == want
        results.append((ok, name, r.status_code, want))
        return r
    # Access by role
    check('admin: list employees', 'GET', '/api/employees', adm, 200)
    check('employee: list employees (blocked)', 'GET', '/api/employees', emp, 403)
    check('customer: list employees (blocked)', 'GET', '/api/employees', cus, 403)
    check('employee: trigger batch (blocked)', 'POST', '/api/batch/trigger', emp, 403)
    check('admin: alerts', 'GET', '/api/alerts', adm, 200)
    check('employee: alerts (blocked)', 'GET', '/api/alerts', emp, 403)
    check('customer: alerts (blocked)', 'GET', '/api/alerts', cus, 403)
    check('employee: dashboard summary', 'GET', '/api/dashboard/summary?period=month', emp, 200)
    check('employee: performers (blocked)', 'GET', '/api/dashboard/performers?period=month', emp, 403)
    # Attendance
    check('employee: attendance', 'GET', '/api/attendance', emp, 200)
    check('customer: attendance (empty)', 'GET', '/api/attendance', cus, 200)
    # Appointments
    a = check('customer: book appointment', 'POST', '/api/appointments', cus, 201,
              json={'appointment_date': '2026-11-01T10:00:00', 'service_type': 'General',
                    'vehicle_model': 'Honda Breeze', 'vehicle_plate': 'TEST-0001', 'description': 'smoke test'})
    check('employee: book appointment (blocked)', 'POST', '/api/appointments', emp, 403,
          json={'appointment_date': '2026-11-01T10:00:00'})
    check('customer: list appointments', 'GET', '/api/appointments', cus, 200)
    appt_id = a.json().get('id') if a.status_code == 201 else None
    if appt_id:
        check('customer: cancel own appointment', 'DELETE', f'/api/appointments/{appt_id}', cus, 200)
    # Tickets
    t = check('customer: open ticket', 'POST', '/api/tickets', cus, 201,
              json={'title': 'smoke test ticket', 'description': 'automated test', 'type': 'General', 'priority': 'Low'})
    tid = t.json().get('id') if t.status_code == 201 else None
    check('employee: open ticket (blocked)', 'POST', '/api/tickets', emp, 403, json={'title': 'x'})
    check('customer: list tickets', 'GET', '/api/tickets', cus, 200)
    check('employee: list tickets', 'GET', '/api/tickets', emp, 200)
    if tid:
        check('customer: message own ticket', 'POST', f'/api/tickets/{tid}/messages', cus, 201, json={'message': 'hello'})
        check('customer: read own ticket messages', 'GET', f'/api/tickets/{tid}/messages', cus, 200)
        check('employee: unassigned ticket hidden', 'GET', f'/api/tickets/{tid}', emp, 404)
        check('admin: delete test ticket', 'DELETE', f'/api/tickets/{tid}', adm, 200)
    fails = [r for r in results if not r[0]]
    for ok, name, got, want in results:
        print(('PASS' if ok else 'FAIL'), name, got, '(want %d)' % want)
    print(f'\n{len(results)-len(fails)}/{len(results)} passed')

if __name__ == '__main__':
    run()
