# Lazy imports to avoid numexpr deadlock on Mac M1
def get_model_loader():
    from .model_loader import get_model_loader as _get_model_loader
    return _get_model_loader()

def get_file_manager():
    from .file_manager import get_file_manager as _get_file_manager
    return _get_file_manager()

def get_trigger():
    from .trigger import get_trigger as _get_trigger
    return _get_trigger()

__all__ = [
    'get_model_loader',
    'get_file_manager',
    'get_trigger',
]
