# -*- coding: utf-8 -*-
"""Inject stud-page EN translations into tlumaczenia.js"""
from pathlib import Path
import re

root = Path(r"G:/smoltech.ua")
js_path = root / "assets/js/tlumaczenia.js"
js = js_path.read_text(encoding="utf-8")

marker = "/* === EN PATCH STUD 20260903 === */"
if marker in js:
    raise SystemExit("already patched")

pairs = {
    "Конденсаторне приварювання шпильок — швидкий імпульс, чистий зворот": "Capacitor-discharge stud welding — fast pulse, clean reverse side",
    "Міцні зʼєднання на тонкому матеріалі за 1–3 мс. До 50 шпильок/хв — без зайвого нагріву й майже без сліду на зворотному боці.": "Strong joints on thin material in 1–3 ms. Up to 50 studs/min — without excess heat and almost no mark on the reverse side.",
    "Технологія розряду": "Discharge technology",
    "Економічні й надійні пристрої для тонкого матеріалу": "Economical, reliable units for thin material",
    "Шпильки Ø2–Ø10 мм з мʼякої та нержавіючої сталі, алюмінію й латуні — до плоских, чистих листів. Короткий час заряджання дає високий такт і низькі експлуатаційні витрати.": "Studs Ø2–Ø10 mm in mild and stainless steel, aluminium and brass — to flat, clean sheet. Short charging time delivers high takt and low operating cost.",
    "діапазон шпильок": "stud diameter range",
    "шпильок за хвилину": "studs per minute",
    "імпульс розряду": "discharge pulse",
    "Конденсаторний пристрій CDM для приварювання шпильок": "CDM capacitor unit for stud welding",
    "C2 і LG2 — під контакт і підняття": "C2 and LG2 — contact and lift",
    "Машини CDM працюють із контактними пістолетами C2 і пістолетами з підняттям LG2. Легка, міцна конструкція джерел спрощує перенесення між постами.": "CDM machines work with contact guns C2 and lift guns LG2. A light, robust power-source design makes it easy to move between stations.",
    "Мʼяка сталь, нержавіюча, алюміній, латунь": "Mild steel, stainless, aluminium, brass",
    "Мінімальний слід на зворотному боці листа": "Minimal mark on the reverse side of the sheet",
    "Під ручну роботу й автоматизацію ЧПК": "For hand work and CNC automation",
    "Контактний C2 · підняття LG2": "Contact C2 · lift LG2",
    "Пістолети": "Guns",
    "Цифрове керування напругою, швидкий цикл і компактний корпус — готове джерело і для ручного поста, і для автоматичної головки.": "Digital voltage control, a fast cycle and a compact housing — ready as a source for a hand station or an automatic head.",
    "Цифрова напруга": "Digital voltage",
    "Відображення напруги заряджання конденсаторів і плавне регулювання без дрейфу від мережі.": "Display of capacitor charging voltage and smooth regulation without drift from the mains.",
    "Швидкий цикл": "Fast cycle",
    "Короткий час заряджання — високий такт приварювання на серійних і дрібносерійних роботах.": "Short charging time — high welding takt on series and short-run work.",
    "Чистий зворот": "Clean reverse side",
    "Імпульс 1–3 мс на тонкому матеріалі залишає мінімальний слід на зворотному боці зʼєднання.": "A 1–3 ms pulse on thin material leaves a minimal mark on the reverse side of the joint.",
    "Світлодіодна сигналізація": "LED signalling",
    "Усі ключові функції чітко сигналізуються — оператор одразу бачить стан процесу.": "All key functions are clearly signalled — the operator sees process status at once.",
    "Компактний корпус": "Compact housing",
    "Міцна й легка конструкція зручна на ручному посту та як джерело в клітинці ЧПК.": "A robust, light design suits a hand station and as a source in a CNC cell.",
    "З подавачем шпильок і головками SIK2 / SIK100 — джерело струму для комплексів ЧПК SMOLTECH.": "With a stud feeder and SIK2 / SIK100 heads — a current source for SMOLTECH CNC cells.",
    "Природний вибір для шпильок Ø2–Ø10 мм на тонкому матеріалі, коли важливі швидкість циклу та вигляд зворотного боку.": "The natural choice for Ø2–Ø10 mm studs on thin material when cycle speed and reverse-side appearance matter.",
    "Комплекси ЧПК на базі CDM": "CNC cells based on CDM",
    "Вібраційні подавачі, головки SIK2 / SIK100 і конденсаторні джерела — серійне приварювання без ручного такту.": "Vibratory feeders, SIK2 / SIK100 heads and capacitor sources — series welding without a manual takt.",
    "Дивитись комплекси ЧПК": "See CNC cells",
    "Більший діаметр": "Larger diameter",
    "Потрібні шпильки понад Ø10?": "Need studs over Ø10?",
    "Для діаметрів до Ø16 мм і товстішого матеріалу — інверторна дуга i12 / i16 (Drawn Arc і Short Cycle).": "For diameters up to Ø16 mm and thicker material — inverter arc i12 / i16 (Drawn Arc and Short Cycle).",
    "Інверторне дугове приварювання — більший діаметр, товстіший матеріал": "Inverter arc stud welding — larger diameter, thicker material",
    "Пристрої i12 та i16 для шпильок до Ø16 мм. Drawn Arc і Short Cycle, струм до 1400 А, цикл 10–1000 мс — точний контроль на складальних і сервісних постах.": "i12 and i16 units for studs up to Ø16 mm. Drawn Arc and Short Cycle, current up to 1400 A, cycle 10–1000 ms — precise control on assembly and service stations.",
    "Інверторна дуга": "Inverter arc",
    "Швидкі й точні зʼєднання без зайвої складності": "Fast, accurate joints without unnecessary complexity",
    "Мікропроцесорне керування, легкий корпус і зрозумілий дисплей. Після автотесту безпеки задаєте струм і час — і працюєте з мʼякою чи нержавіючою сталлю.": "Microprocessor control, a light housing and a clear display. After the safety self-test you set current and time — and work with mild or stainless steel.",
    "макс. струм зварювання": "max. welding current",
    "мов на дисплеї": "languages on the display",
    "Інверторний пристрій DA для приварювання шпильок": "DA inverter unit for stud welding",
    "DA2A, DA7B і DA8A під ваш процес": "DA2A, DA7B and DA8A for your process",
    "Група DA працює з пістолетами DA2A, DA7B і DA8A. Компактна конструкція полегшує установку на посту й обслуговування в цеху.": "The DA group works with DA2A, DA7B and DA8A guns. A compact design makes station setup and shop-floor service easier.",
    "Автотест безпеки після включення": "Safety self-test after switch-on",
    "Тест ходу пістолета перед серією": "Gun stroke test before a run",
    "Піддув захисного газу в комплектації": "Shielding-gas purge in the package",
    "Drawn Arc або Short Cycle": "Drawn Arc or Short Cycle",
    "Один пристрій — два режими. Підбираємо метод під діаметр шпильки, товщину матеріалу й вимоги до зʼєднання.": "One unit — two modes. We match the method to stud diameter, material thickness and joint requirements.",
    "Тягнута дуга": "Drawn arc",
    "Класичний дуговий цикл для більших діаметрів і товстішого основного матеріалу. Стабільна дуга, контрольований час і струм запалювання.": "Classic arc cycle for larger diameters and thicker parent material. Stable arc, controlled ignition time and current.",
    "Короткий цикл": "Short cycle",
    "Стиснений імпульс для швидших зʼєднань там, де геометрія й матеріал дозволяють коротший час приварювання.": "A compressed pulse for faster joints where geometry and material allow a shorter weld time.",
    "Оснащення": "Equipment",
    "Що всередині інверторних пристроїв DA": "What is inside DA inverter units",
    "Інверторна техніка дає стабільну дугу навіть за коротких часів — видно в якості зʼєднання й енергоефективності.": "Inverter technology gives a stable arc even at short times — visible in joint quality and energy efficiency.",
    "Мікропроцесор": "Microprocessor",
    "Керування параметрами зварювання з безступінчастим регулюванням струму й часу.": "Weld-parameter control with stepless current and time regulation.",
    "Запалювання дуги": "Arc ignition",
    "Окреме налаштування часу та струму запалювання під конкретну шпильку й матеріал.": "Separate ignition time and current settings for the specific stud and material.",
    "Дисплей 12 мов": "12-language display",
    "Багатофункціональний екран зрозумілий оператору — менше помилок при зміні програми.": "A multifunction screen the operator understands — fewer errors when changing programmes.",
    "Захист процесу": "Process protection",
    "Сигналізація перегріву, короткого замикання та помилок запалювання дуги.": "Signalling for overheating, short circuit and arc-ignition faults.",
    "Захисний газ": "Shielding gas",
    "Установка піддуву захисного газу в комплекті — для процесів, де потрібна захищена дуга.": "Shielding-gas purge setup in the package — for processes that need a shielded arc.",
    "Міцна легка конструкція — зручне маневрування й установка в будь-якому місці цеху.": "A robust, light build — easy to move and set up anywhere in the shop.",
    "DA — для шпильок більшого діаметра й товстішого матеріалу. Типова продуктивність 20–30 шпильок/хв залежно від розміру.": "DA — for larger-diameter studs and thicker material. Typical output 20–30 studs/min depending on size.",
    "Тонкий лист": "Thin sheet",
    "Діаметри до Ø10 на тонкому матеріалі?": "Diameters up to Ø10 on thin material?",
    "Конденсаторна CDM часто економічніша: до 50 шпильок/хв і мінімальний слід на звороті.": "Capacitor CDM is often more economical: up to 50 studs/min and a minimal reverse-side mark.",
    "Серія": "Series",
    "Потрібна повна автоматизація?": "Need full automation?",
    "Комплекси ЧПК SMOLTECH на конденсаторних джерелах — для серійного приварювання за програмою.": "SMOLTECH CNC cells on capacitor sources — for series welding by programme.",
    "Комплекси ЧПК · SMOLTECH": "CNC cells · SMOLTECH",
    "Автоматичне приварювання шпильок за програмою": "Automatic stud welding by programme",
    "Власні комплекси з вібраційними подавачами й джерелами TAYLOR CDM: до 4 головок, поле до 3000 × 2000 мм, швидке переналагодження під коротку й довгу серію.": "Our own cells with vibratory feeders and TAYLOR CDM sources: up to 4 heads, field up to 3000 × 2000 mm, fast changeover for short and long runs.",
    "Серійне виробництво": "Series production",
    "Точність ЧПК + конденсаторне джерело": "CNC accuracy + capacitor source",
    "Будуємо клітинки під вашу деталь: числове позиціонування, автоматична подача шпильок і міцні зʼєднання без ручного такту оператора.": "We build cells around your part: numerical positioning, automatic stud feed and strong joints without an operator’s manual takt.",
    "поле деталі, мм": "part field, mm",
    "головки в одному циклі": "heads in one cycle",
    "осі позиціонування": "positioning axes",
    "Автомат ЧПК SMOLTECH для приварювання шпильок": "SMOLTECH CNC automatic machine for stud welding",
    "Фото, відео й опис поруч — одразу видно конфігурацію, яку показувати клієнту. Кожна позиція має якір для прямого посилання.": "Photo, video and description side by side — the configuration to show a customer is clear at once. Each item has an anchor for a direct link.",
    "Галерея": "Gallery",
    "Поле": "Field",
    "До 3000 × 2000 мм": "Up to 3000 × 2000 mm",
    "Максимально 4 осі — багато шпильок на кількох компонентах в одній програмі.": "Up to 4 axes — many studs on several components in one programme.",
    "Шпильки": "Studs",
    "Ø3–Ø8 мм": "Ø3–Ø8 mm",
    "Стандартні M4–M8 і M8 із фланцем — низьковуглецева та нержавіюча сталь, 6–30 мм.": "Standard M4–M8 and flanged M8 — low-carbon and stainless steel, 6–30 mm.",
    "Головки": "Heads",
    "До 4 комплектів": "Up to 4 sets",
    "До 4 типів шпильок в одному циклі без переналагодження машини.": "Up to 4 stud types in one cycle without machine changeover.",
    "Подача": "Feed",
    "Вібраційні бункери": "Vibratory hoppers",
    "Автоматична подача шпильок до головок — стабільний такт без ручного дозування.": "Automatic stud feed to the heads — stable takt without manual dosing.",
    "Джерело": "Source",
    "Конденсатор CDM": "CDM capacitor",
    "Джерела TAYLOR CDM у клітинці — швидкий імпульс і чисте зʼєднання на тонкому листі.": "TAYLOR CDM sources in the cell — a fast pulse and a clean joint on thin sheet.",
    "Робот як 5-а вісь": "Robot as a 5th axis",
    "Машини ЧПК можуть працювати з роботами як 5-осьове рішення для обʼємних деталей.": "CNC machines can work with robots as a 5-axis solution for 3D parts.",
    "Робочі поля, головки й вібраційні подавачі — реальні машини SMOLTECH, готові до показу клієнту.": "Work fields, heads and vibratory feeders — real SMOLTECH machines, ready to show a customer.",
    "Джерела CDM для клітинок": "CDM sources for cells",
    "ST-2 — вигляд машини": "ST-2 — machine view",
    "Робоче поле · головки": "Work field · heads",
    "Подавачі · джерела CDM": "Feeders · CDM sources",
    "Методи": "Methods",
}

# escape for JS single-quoted strings
def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")

# drop keys already present
existing = set(re.findall(r"(?m)^[ \t]+'((?:\\'|[^'])*)'\s*:", js))
existing = {k.replace("\\'", "'") for k in existing}
new_pairs = {k: v for k, v in pairs.items() if k not in existing}
print("new", len(new_pairs), "skip", len(pairs) - len(new_pairs))

body_lines = [f"  '{esc(k)}': '{esc(v)}'," for k, v in new_pairs.items()]
body = "\n".join(body_lines)

# insert before closing of D
end = js.rfind("\n  };")
if end < 0:
    raise SystemExit("dictionary close not found")

new_js = js[:end] + f"\n\n  {marker}\n" + body + js[end:]
js_path.write_text(new_js, encoding="utf-8")
print("OK size", len(new_js))
