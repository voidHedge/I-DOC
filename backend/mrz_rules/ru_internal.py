from .base import MRZRuleSet

class RussiaInternalRuleSet(MRZRuleSet):
    # Таблица транслитерации (модернизированный клер)
    CYRILLIC_MAP = {
        'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д', 'E': 'Е',
        '2': 'Ё', 'J': 'Ж', 'Z': 'З', 'I': 'И', 'Q': 'Й', 'K': 'К',
        'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О', 'P': 'П', 'R': 'Р',
        'S': 'С', 'T': 'Т', 'U': 'У', 'F': 'Ф', 'H': 'Х', 'C': 'Ц',
        '3': 'Ч', '4': 'Ш', 'W': 'Щ', 'X': 'Ъ', 'Y': 'Ы', '9': 'Ь',
        '6': 'Э', '7': 'Ю', '8': 'Я'
    }

    def _to_cyrillic(self, text: str) -> str:
        """Переводит латиницу клера в кириллицу"""
        if not text:
            return "-"
        # Заменяем символы по словарю, если символа нет — оставляем как есть
        return "".join(self.CYRILLIC_MAP.get(char, char) for char in text)

    def _format_date(self, date_str: str) -> str:
        """Превращает YYMMDD в DD.MM.YYYY"""
        if len(date_str) != 6 or not date_str.isdigit():
            return "-"
        yy, mm, dd = date_str[:2], date_str[2:4], date_str[4:6]
        
        # Логика века: если год больше 25, то это 19XX, иначе 20XX
        # (Для паспортов РФ логика может быть сложнее, но для базовой используем эту)
        century = "19" if int(yy) > 25 else "20"
        return f"{dd}.{mm}.{century}{yy}"

    def parse(self, line1: str, line2: str) -> dict:
        try:
            # 1. ИЗВЛЕЧЕНИЕ ФИО (Line 1, позиции 6-44)
            # Обрезаем первые 5 символов (PNRUS)
            name_part = line1[5:]
            
            # Разделяем фамилию и остальное по <<
            surname_raw, rest = name_part.split('<<', 1) if '<<' in name_part else (name_part, "")
            
            # Разделяем имя и отчество по <
            given_names_parts = rest.split('<')
            name_raw = given_names_parts[0] if len(given_names_parts) > 0 else ""
            patronymic_raw = given_names_parts[1] if len(given_names_parts) > 1 else ""
            
            # Переводим в кириллицу, убираем лишние заполнители
            surname = self._to_cyrillic(surname_raw.replace('<', '')).strip()
            name = self._to_cyrillic(name_raw.replace('<', '')).strip()
            patronymic = self._to_cyrillic(patronymic_raw.replace('<', '')).strip()

            # 2. СЕРИЯ И НОМЕР (Line 2)
            # Позиции 1-9 (индексы 0-8): 3 цифры серии + 6 цифр номера
            doc_num_raw = line2[0:9]
            serial_part1 = doc_num_raw[0:3] # Первые 3 цифры серии
            number = doc_num_raw[3:9]       # 6 цифр номера
            
            # Позиция 29 (индекс 28): последняя 4-я цифра серии
            serial_part2 = line2[28:29] 
            full_serial = f"{serial_part1}{serial_part2}" # Склеиваем полную серию

            # 3. ДАТА РОЖДЕНИЯ (Line 2, позиции 14-19 -> индексы 13-18)
            dob_raw = line2[13:19]
            birthday = self._format_date(dob_raw)

            # 4. ПОЛ (Line 2, позиция 21 -> индекс 20)
            gender_raw = line2[20:21]
            gender = "Мужской" if gender_raw == "M" else ("Женский" if gender_raw == "F" else "-")

            # 5. ДАТА ВЫДАЧИ (Line 2, позиции 30-35 -> индексы 29-34)
            issue_date_raw = line2[29:35]
            issue_date = self._format_date(issue_date_raw)

            # 6. КОД ПОДРАЗДЕЛЕНИЯ (Line 2, позиции 36-41 -> индексы 35-40)
            dept_code_raw = line2[35:41]
            # Форматируем в XXX-XXX
            dept_code = f"{dept_code_raw[:3]}-{dept_code_raw[3:]}" if len(dept_code_raw) == 6 else "-"

            # 7. ГРАЖДАНСТВО (Line 2, позиции 11-13 -> индексы 10-12)
            nationality = line2[10:13] # Обычно RUS

            # Возвращаем ровно 10 полей
            return {
                "surname": surname or "-",
                "name": name or "-",
                "patronymic": patronymic or "-",
                "serial": full_serial,
                "number": number,
                "birthday": birthday,
                "gender": gender,
                "issue_date": issue_date,
                "department_code": dept_code,
                "nationality": nationality
            }

        except Exception as e:
            print(f"Ошибка парсинга внутреннего паспорта: {e}")
            return {"error": "Не удалось разобрать строки MRZ"}