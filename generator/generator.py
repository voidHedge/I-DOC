from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import os
import random
import datetime

# === БАЗОВАЯ ДИРЕКТОРИЯ ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==========================================
# 1. ТРАНСЛИТЕРАЦИЯ ДЛЯ MRZ
# ==========================================
CLEAR_MAP = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E',
    'Ё': '2', 'Ж': 'J', 'З': 'Z', 'И': 'I', 'Й': 'Q', 'К': 'K',
    'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
    'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
    'Ч': '3', 'Ш': '4', 'Щ': 'W', 'Ъ': 'X', 'Ы': 'Y', 'Ь': '9',
    'Э': '6', 'Ю': '7', 'Я': '8'
}

def transliterate_clear(text):
    text = text.upper().replace("-", "<").replace(" ", "<")
    return "".join(CLEAR_MAP.get(char, char) for char in text)

# ==========================================
# 2. РАСЧЕТ КОНТРОЛЬНЫХ ЦИФР (7-3-1)
# ==========================================
def calculate_check_digit(text):
    weights = [7, 3, 1]
    total = 0
    for i, char in enumerate(text):
        val = 0
        if char.isdigit(): val = int(char)
        elif char == '<': val = 0
        elif char.isalpha(): val = ord(char) - ord('A') + 10
        total += val * weights[i % 3]
    return str(total % 10)

# ==========================================
# 3. ОБРАБОТКА ДЛИННЫХ ФИО
# ==========================================
def handle_long_names(surname, name, patronymic):
    if len(surname) + len(name) + len(patronymic) > 36:
        if len(surname) > 34:
            person = f"{surname[:34]}<<{name[0]}<{patronymic[0]}"
        elif len(surname) + len(name) >= 36:
            lim = 37 - 2 - len(surname)
            person = f"{surname}<<{name[:lim]}<{patronymic[0]}"
        elif len(surname) + len(name) <= 35:
            limPatr = 39 - 2 - 1 - (len(surname) + len(name))
            person = f"{surname}<<{name}<{patronymic[:limPatr]}"
    elif len(surname) + len(name) + len(patronymic) == 36:
        person = f"{surname}<<{name}<{patronymic}"
    else:
        person = f"{surname}<<{name}<{patronymic}" + "<" * (36 - (len(surname) + len(name) + len(patronymic)))
    return person

# ==========================================
# 4. ГЕНЕРАЦИЯ СЛУЧАЙНЫХ ДАННЫХ
# ==========================================
def generate_random_data():
    male_names = ["ИВАН", "АЛЕКСАНДР", "СЕРГЕЙ", "ДМИТРИЙ", "АНДРЕЙ", "АЛЕКСЕЙ", "МАКСИМ", "ЕВГЕНИЙ"]
    female_names = ["АННА", "ЕЛЕНА", "ОЛЬГА", "НАТАЛЬЯ", "ТАТЬЯНА", "МАРИЯ", "ЕКАТЕРИНА"]
    male_patronymics = ["ИВАНОВИЧ", "АЛЕКСАНДРОВИЧ", "СЕРГЕЕВИЧ", "ДМИТРИЕВИЧ", "АНДРЕЕВИЧ", "АЛЕКСЕЕВИЧ"]
    female_patronymics = ["ИВАНОВНА", "АЛЕКСАНДРОВНА", "СЕРГЕЕВНА", "ДМИТРИЕВНА", "АНДРЕЕВНА", "АЛЕКСЕЕВНА"]
    surnames = ["ИВАНОВ", "СМИРНОВ", "КУЗНЕЦОВ", "ПОПОВ", "ВАСИЛЬЕВ", "ПЕТРОВ", "СОКОЛОВ", "МИХАЙЛОВ"]

    gender = random.choice(["M", "F"])
    if gender == "M":
        name = random.choice(male_names)
        patronymic = random.choice(male_patronymics)
        surname = random.choice(surnames)
    else:
        name = random.choice(female_names)
        patronymic = random.choice(female_patronymics)
        surname = random.choice(surnames) + "А"

    start_date = datetime.date(2011, 7, 1)
    end_date = datetime.date.today()
    issue_date = start_date + datetime.timedelta(days=random.randint(0, (end_date - start_date).days))
    
    min_birth_date = issue_date - datetime.timedelta(days=14*365)
    max_birth_date = issue_date - datetime.timedelta(days=80*365)
    birth_date = max_birth_date + datetime.timedelta(days=random.randint(0, (min_birth_date - max_birth_date).days))

    series = f"{random.randint(10, 99)}{random.randint(10, 99)}"
    number = f"{random.randint(100000, 999999)}"

    dept_code = f"{random.randint(100, 999)}-{random.randint(100, 999)}"
    dept_code_mrz = dept_code.replace("-", "")

    return {
        "surname": surname, "name": name, "patronymic": patronymic,
        "gender": gender, "birth_date": birth_date, "issue_date": issue_date,
        "series": series, "number": number, "dept_code": dept_code, "dept_code_mrz": dept_code_mrz
    }

# ==========================================
# 5. СБОРКА СТРОК MRZ
# ==========================================
def build_mrz(data):
    surname = transliterate_clear(data["surname"])
    name = transliterate_clear(data["name"])
    patronymic = transliterate_clear(data["patronymic"])
    person = handle_long_names(surname, name, patronymic)
    line1 = f"PNRUS{person}"
    
    doc_num = data["series"][:3] + data["number"]
    check1 = calculate_check_digit(doc_num)
    
    birth_date_mrz = data["birth_date"].strftime("%y%m%d")
    check2 = calculate_check_digit(birth_date_mrz)
    
    gender = data["gender"]
    expiry = "<<<<<<"
    check3 = "<" 
    
    issue_date_mrz = data["issue_date"].strftime("%y%m%d")
    optional_data = data["series"][3] + issue_date_mrz + data["dept_code_mrz"] + "<"
    check4 = calculate_check_digit(optional_data)
    
    line2_partial = f"{doc_num}{check1}RUS{birth_date_mrz}{check2}{gender}{expiry}{check3}{optional_data}{check4}"
    
    segments_for_final = line2_partial[0:10] + line2_partial[13:20] + line2_partial[21:28] + line2_partial[28:43]
    final_check = calculate_check_digit(segments_for_final)
    
    line2 = line2_partial + final_check
    
    return line1, line2

# ==========================================
# 6. РЕНДЕРИНГ ИЗОБРАЖЕНИЯ + ВОДЯНОЙ ЗНАК
# ==========================================
def generate_passport_image(line1: str, line2: str, output_filename=None):
    template_path = os.path.join(BASE_DIR, "templates", "template.jpg")
    font_path = os.path.join(BASE_DIR, "fonts", "OCRB.ttf") 
    warn_path = os.path.join(BASE_DIR, "templates", "warn.png")
    
    output_dir = os.path.join(BASE_DIR, "output")
    os.makedirs(output_dir, exist_ok=True)
    
    if output_filename is None:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
        output_filename = f"passport_{timestamp}.jpg"
    
    output_path = os.path.join(output_dir, output_filename)

    if not os.path.exists(template_path) or not os.path.exists(font_path):
        print("Ошибка: Не найден шаблон или шрифт.")
        return

    img = Image.open(template_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    width, height = img.size

    # --- Замазываем старую MRZ ---
    mrz_box_top = height * 0.83  
    mrz_box_bottom = height * 0.98 
    background_color = (209, 213, 219) 
    draw.rectangle([(0, mrz_box_top), (width, mrz_box_bottom)], fill=background_color)

    # --- Автоподбор шрифта для MRZ ---
    target_width = width * 0.90
    font_size = 10
    while True:
        font = ImageFont.truetype(font_path, font_size)
        bbox = draw.textbbox((0, 0), line1, font=font)
        if (bbox[2] - bbox[0]) >= target_width or font_size > 100:
            font_size -= 1 
            font = ImageFont.truetype(font_path, font_size)
            break
        font_size += 1

    # --- Рисуем текст MRZ ---
    text_color = (0, 0, 0)
    bbox1 = draw.textbbox((0, 0), line1, font=font)
    text_x1 = (width - (bbox1[2] - bbox1[0])) / 2
    bbox2 = draw.textbbox((0, 0), line2, font=font)
    text_x2 = (width - (bbox2[2] - bbox2[0])) / 2

    line1_y = mrz_box_top + (height * 0.02) 
    line2_y = line1_y + (font_size * 1.2) 

    draw.text((text_x1, line1_y), line1, font=font, fill=text_color)
    draw.text((text_x2, line2_y), line2, font=font, fill=text_color)

    # Накладываем warn.png: обрезаем прозрачные края, масштабируем под ширину,
    # поворачиваем, ограничиваем по высоте и центрируем над MRZ.
    if os.path.exists(warn_path):
        warn_img = Image.open(warn_path).convert("RGBA")
        
        bbox = warn_img.getbbox()
        if bbox:
            warn_img = warn_img.crop(bbox)

        target_wm_width = int(width * 1.5) 
        ratio = target_wm_width / warn_img.width
        new_size = (int(warn_img.width * ratio), int(warn_img.height * ratio))
        warn_img = warn_img.resize(new_size, Image.Resampling.LANCZOS)

        angle = 25
        rotated_warn = warn_img.rotate(angle, expand=True)

        # Ограничиваем высоту, чтобы не налезть на MRZ
        max_h = int(height * 0.78) 
        if rotated_warn.height > max_h:
            scale = max_h / rotated_warn.height
            new_w = int(rotated_warn.width * scale)
            rotated_warn = rotated_warn.resize((new_w, max_h), Image.Resampling.LANCZOS)

        wm_x = (width - rotated_warn.width) // 2
        wm_y = int(height * 0.82) - rotated_warn.height
        
        if wm_y < 0:
            wm_y = 0
        
        img.paste(rotated_warn, (wm_x, wm_y), rotated_warn)
    else:
        print(f"Внимание: Картинка {warn_path} не найдена.")

    # --- Размытие и шум для реализма ---
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    img_np = np.array(img)
    noise = np.random.normal(0, 5, img_np.shape).astype('uint8')
    img_np = np.clip(img_np + noise, 0, 255).astype('uint8')
    img = Image.fromarray(img_np)

    img.save(output_path, quality=90)
    print(f"Успех! Сохранено: {output_path}")

# ==========================================
# ЗАПУСК
# ==========================================
if __name__ == "__main__":
    random_data = generate_random_data()
    line1, line2 = build_mrz(random_data)
    
    print(f"Сгенерированы данные для: {random_data['surname']} {random_data['name']} {random_data['patronymic']}")
    generate_passport_image(line1, line2, output_filename=None)