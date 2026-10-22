from abc import ABC, abstractmethod
from datetime import datetime

class InteractionTrigger(ABC):
    """Abstract base for triggering interaction start"""
    
    @abstractmethod
    def trigger_interaction_start(self, employee_id: int) -> dict:
        pass

class ManualTrigger(InteractionTrigger):
    """Manual API trigger for testing (no hardware)"""
    
    def trigger_interaction_start(self, employee_id: int) -> dict:
        return {
            'status': 'success',
            'triggered_at': datetime.utcnow().isoformat(),
            'trigger_type': 'manual',
            'employee_id': employee_id
        }

class SimulatedTrigger(InteractionTrigger):
    """Auto-trigger at intervals (testing)"""
    
    def trigger_interaction_start(self, employee_id: int) -> dict:
        return {
            'status': 'success',
            'triggered_at': datetime.utcnow().isoformat(),
            'trigger_type': 'simulated',
            'employee_id': employee_id
        }

class ArduinoTrigger(InteractionTrigger):
    """Real sensor-based trigger (implement later)"""
    
    def trigger_interaction_start(self, employee_id: int) -> dict:
        # TODO: Implement Arduino sensor logic
        raise NotImplementedError("Arduino trigger not yet implemented")

def get_trigger(mode: str = 'manual') -> InteractionTrigger:
    """Factory function to get appropriate trigger"""
    triggers = {
        'manual': ManualTrigger,
        'simulated': SimulatedTrigger,
        'arduino': ArduinoTrigger
    }
    trigger_class = triggers.get(mode, ManualTrigger)
    return trigger_class()

