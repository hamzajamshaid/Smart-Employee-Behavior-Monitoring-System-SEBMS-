import io
from datetime import datetime, timedelta, time
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import or_
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from app.models import Employee, BehavioralScore, CustomerFeedback, Interaction, ResponseTimeRecord

reports_bp = Blueprint('reports', __name__)

HEADER_FILL = PatternFill('solid', fgColor='0052CC')
HEADER_FONT = Font(bold=True, color='FFFFFF')


def _range(args):
    today = datetime.utcnow().date()
    if args.get('date_from') and args.get('date_to'):
        return (datetime.strptime(args['date_from'], '%Y-%m-%d').date(),
                datetime.strptime(args['date_to'], '%Y-%m-%d').date())
    period = args.get('period', 'month')
    if period == 'today':
        return today, today
    if period == 'week':
        return today - timedelta(days=7), today
    if period == 'month':
        return today - timedelta(days=30), today
    return None, today


def _avg(values, digits=1):
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), digits) if vals else None


def _write_sheet(ws, headers, rows):
    ws.append(headers)
    for cell in ws[1]:
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal='center')
    for row in rows:
        ws.append(row)
    for col in ws.columns:
        width = max(len(str(c.value)) if c.value is not None else 0 for c in col)
        ws.column_dimensions[col[0].column_letter].width = min(max(width + 2, 10), 40)
    ws.freeze_panes = 'A2'


def _build_report(args, employee_ids):
    start, end = _range(args)
    session = current_app.SessionLocal()
    try:
        eq = session.query(Employee).filter(Employee.status != 'Deleted')
        if employee_ids is not None:
            eq = eq.filter(Employee.id.in_(employee_ids))
        employees = eq.order_by(Employee.name).all()
        if not employees:
            return jsonify({'error': 'No employees found'}), 404
        sq = session.query(BehavioralScore).filter(
            BehavioralScore.employee_id.in_([e.id for e in employees]),
            or_(BehavioralScore.score_status == 'scored', BehavioralScore.score_status.is_(None)))
        if start:
            sq = sq.filter(BehavioralScore.date >= datetime.combine(start, time.min))
        sq = sq.filter(BehavioralScore.date <= datetime.combine(end, time.max))
        scores = sq.order_by(BehavioralScore.date.desc()).all()
        feedback_ids = [s.interaction_id for s in scores if s.interaction_id]
        customers = {}
        if feedback_ids:
            customers = {f.interaction_id: f.customer_name for f in
                         session.query(CustomerFeedback).filter(CustomerFeedback.interaction_id.in_(feedback_ids)).all()}
        emp_by_id = {e.id: e for e in employees}

        wb = Workbook()
        summary = wb.active
        summary.title = 'Summary'
        summary_rows = []
        for e in employees:
            mine = [s for s in scores if s.employee_id == e.id]
            summary_rows.append([
                e.name, e.employee_code, len(mine),
                _avg([s.unified_score for s in mine]),
                _avg([s.presence_score for s in mine]),
                _avg([s.emotion_score for s in mine]),
                _avg([s.response_score for s in mine]),
                _avg([s.feedback_score / 20 if s.feedback_score is not None else None for s in mine]),
                _avg([s.voice_score for s in mine]),
                sum(1 for s in mine if s.unified_score is not None and s.unified_score < 60),
            ])
        _write_sheet(summary, ['Employee', 'Employee code', 'Sessions', 'Avg unified score', 'Avg presence',
                               'Avg expression', 'Avg response', 'Avg rating (stars)', 'Avg voice',
                               'Sessions below 60'], summary_rows)

        ws = wb.create_sheet('Sessions')
        session_rows = []
        for s in scores:
            e = emp_by_id.get(s.employee_id)
            session_rows.append([
                e.name if e else '', e.employee_code if e else '', s.interaction_id,
                s.date.strftime('%Y-%m-%d') if s.date else '',
                s.date.strftime('%H:%M') if s.date else '',
                customers.get(s.interaction_id) or 'No customer recorded',
                s.unified_score, s.presence_score, s.emotion_score, s.response_score,
                round(s.feedback_score / 20, 1) if s.feedback_score is not None else None,
                s.voice_score, s.score_status or '',
            ])
        _write_sheet(ws, ['Employee', 'Employee code', 'Session ID', 'Date', 'Time', 'Customer',
                          'Unified score', 'Presence', 'Expression', 'Response score', 'Rating (stars)',
                          'Voice', 'Status'], session_rows)

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        label = 'all-employees' if employee_ids is None else employees[0].name.lower().replace(' ', '-')
        return send_file(
            buf,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f"{label}-report-{datetime.utcnow().date()}.xlsx")
    except Exception as e:
        return jsonify({'error': 'report failed', 'detail': str(e)}), 500
    finally:
        session.close()


@reports_bp.route('/reports/employee/<int:employee_id>', methods=['GET'])
@jwt_required()
def employee_report(employee_id):
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    return _build_report(request.args, [employee_id])


@reports_bp.route('/reports/all', methods=['GET'])
@jwt_required()
def all_report():
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    return _build_report(request.args, None)


@reports_bp.route('/reports/stats', methods=['GET'])
@jwt_required()
def report_stats():
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    start, end = _range(request.args)
    lo = datetime.combine(start, time.min) if start else None
    hi = datetime.combine(end, time.max)
    session = current_app.SessionLocal()
    try:
        employees = session.query(Employee).filter(Employee.status != 'Deleted').all()
        iq = session.query(Interaction).filter(Interaction.start_timestamp <= hi)
        if lo:
            iq = iq.filter(Interaction.start_timestamp >= lo)
        interactions = iq.all()
        by_emp = {}
        for it in interactions:
            by_emp.setdefault(it.employee_id, []).append(it)
        inter_ids = [it.id for it in interactions]
        rt, fb = {}, {}
        if inter_ids:
            rt = {r.interaction_id: r.response_seconds for r in
                  session.query(ResponseTimeRecord).filter(ResponseTimeRecord.interaction_id.in_(inter_ids)).all()}
            fb = {f.interaction_id: f.star_rating for f in
                  session.query(CustomerFeedback).filter(CustomerFeedback.interaction_id.in_(inter_ids)).all()}
        sq = session.query(BehavioralScore).filter(
            or_(BehavioralScore.score_status == 'scored', BehavioralScore.score_status.is_(None)),
            BehavioralScore.date <= hi)
        if lo:
            sq = sq.filter(BehavioralScore.date >= lo)
        scores_by_emp = {}
        for s_row in sq.all():
            scores_by_emp.setdefault(s_row.employee_id, []).append(s_row)
        out = []
        for e in employees:
            its = by_emp.get(e.id, [])
            scs = scores_by_emp.get(e.id, [])
            out.append({
                'employee_id': e.id,
                'total_interactions': len(its),
                'presence_rate': _avg([s_row.presence_score for s_row in scs]),
                'avg_response': _avg([rt.get(i.id) for i in its]),
                'feedback': _avg([fb.get(i.id) for i in its]),
                'unified_score': _avg([s_row.unified_score for s_row in scs]),
            })
        return jsonify(out), 200
    except Exception as e:
        return jsonify({'error': 'stats failed', 'detail': str(e)}), 500
    finally:
        session.close()
