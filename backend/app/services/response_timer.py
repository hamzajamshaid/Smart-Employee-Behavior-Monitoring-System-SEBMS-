from datetime import datetime

RESPONSE_THRESHOLD_SECONDS = 15.0  # experimental; to be validated in Phase 8


def _parse(value):
    if value is None or isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value))


def compute_response_time(arrival_at, response_at) -> dict:
    """
    Response time = response_at - arrival_at.
    Never returns 0 for missing data.
    """
    arrival = _parse(arrival_at)
    response = _parse(response_at)

    if arrival is None or response is None:
        return {'status': 'missing_event', 'response_seconds': None,
                'is_acceptable': None, 'error': 'arrival or response event not recorded'}

    seconds = (response - arrival).total_seconds()
    if seconds < 0:
        return {'status': 'invalid_order', 'response_seconds': None,
                'is_acceptable': None, 'error': 'response recorded before arrival'}

    return {'status': 'ok', 'response_seconds': round(seconds, 2),
            'is_acceptable': seconds <= RESPONSE_THRESHOLD_SECONDS, 'error': None}


class ResponseTimer:
    def calculate_response_time(self, arrival_at, response_at) -> dict:
        return compute_response_time(arrival_at, response_at)
