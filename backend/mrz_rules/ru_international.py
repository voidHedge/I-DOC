from .base import MRZRuleSet

class RussiaInternationalRuleSet(MRZRuleSet):
    def parse(self, line1: str, line2: str) -> dict:
        # Пока не реализовано. Возвращаем пустой словарь или ошибку.
        return {"error": "Правила для загранпаспорта РФ еще не реализованы"}