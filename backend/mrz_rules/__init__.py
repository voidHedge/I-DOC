from .base import MRZRuleSet
from .ru_internal import RussiaInternalRuleSet
from .ru_international import RussiaInternationalRuleSet

def get_rule_set(document_type: str) -> MRZRuleSet:
    """
    Фабрика стратегий.
    Принимает тип документа и возвращает нужный класс с правилами.
    """
    if document_type == "ru_international":
        return RussiaInternationalRuleSet()
    else:
        # По умолчанию (и для "ru_internal") используем внутренний паспорт
        return RussiaInternalRuleSet()