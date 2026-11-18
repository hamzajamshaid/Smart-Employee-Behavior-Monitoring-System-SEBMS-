import datetime

from app.models import Employee, Ticket


def auto_assign_employee(session, ticket):
    """Assign an unassigned ticket to the Active employee with the fewest open tickets."""
    candidates = session.query(Employee).filter_by(status='Active').all()
    if not candidates:
        return None
    best = None
    best_open = None
    for e in candidates:
        open_count = session.query(Ticket).filter(
            Ticket.employee_id == e.id, Ticket.status != 'Resolved'
        ).count()
        if best is None or open_count < best_open or (open_count == best_open and e.id < best.id):
            best = e
            best_open = open_count
    ticket.employee_id = best.id
    ticket.updated_at = datetime.datetime.utcnow()
    session.commit()
    return best.id
