from abc import ABC, abstractmethod

class MRZRuleSet(ABC):
    """
    Абстрактный базовый класс для всех наборов правил MRZ.
    Гарантирует, что у любой стратегии будет метод parse.
    """
    
    @abstractmethod
    def parse(self, line1: str, line2: str) -> dict:
        """
        Принимает две строки MRZ.
        Возвращает словарь с распарсенными данными.
        """
        pass