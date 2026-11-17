"""Plain-language notes explaining what is missing from an interaction.

Rule-based only. Reads values the dashboard already returns.
Does not change scoring, batch, or database logic.
"""


def build_notes(row):
    """row: dict with status, presence_score, emotion, voice, response, feedback.
    Returns a list of short sentences. Never raises."""
    try:
        notes = []
        status = row.get('status')

        if status == 'not_processed':
            notes.append('Not processed yet. Run the batch to score this interaction.')
            return notes
        if status == 'insufficient_signals':
            notes.append('Too little data to score this interaction.')
            return notes
        if status == 'no_presence':
            notes.append('Employee was not detected in the recording (presence below 50%).')

        if row.get('presence_score') is None and status != 'no_presence':
            notes.append('No presence result for this interaction.')
        if row.get('emotion') is None:
            notes.append('Facial expression could not be read.')
        if row.get('voice') is None:
            notes.append('No speech was detected or transcribed.')
        if row.get('response') is None:
            notes.append('No response time was recorded by the sensor.')
        if row.get('feedback') is None:
            notes.append('Customer did not submit a QR rating.')

        if not notes:
            notes.append('All signals were captured.')
        return notes
    except Exception:
        return ['Notes unavailable for this interaction.']
