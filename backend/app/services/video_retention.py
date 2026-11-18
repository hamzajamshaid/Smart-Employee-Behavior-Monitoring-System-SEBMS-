"""Raw recording retention. Deletes video and derived audio; keeps scores and records."""
import logging
import os
from datetime import datetime, time, timedelta

from app.models import Interaction
from app.services.file_manager import get_file_manager

logger = logging.getLogger(__name__)


def _remove(path, removed):
    if path and os.path.exists(path):
        try:
            os.remove(path)
            removed.append(path)
        except OSError as e:
            logger.warning(f"Could not delete {path}: {e}")


def delete_videos(session, on_date=None, before_date=None):
    """Delete recordings for one calendar day (on_date) or everything started before a datetime
    (before_date). Sets video_file_path to None. Scores and records are not touched."""
    if (on_date is None) == (before_date is None):
        raise ValueError('pass exactly one of on_date or before_date')
    q = session.query(Interaction).filter(Interaction.video_file_path.isnot(None))
    if on_date is not None:
        start = datetime.combine(on_date, time.min)
        q = q.filter(Interaction.start_timestamp >= start,
                     Interaction.start_timestamp < start + timedelta(days=1))
    else:
        q = q.filter(Interaction.start_timestamp < before_date)

    fm = get_file_manager()
    removed = []
    interactions = q.all()
    for it in interactions:
        _remove(it.video_file_path, removed)
        _remove(fm.get_audio_path(it.id), removed)
        it.video_file_path = None
    session.commit()
    return {'interactions_cleared': len(interactions), 'files_removed': len(removed)}
