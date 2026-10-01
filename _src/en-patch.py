# -*- coding: utf-8 -*-
"""Generate en-extra-snippet.js from missing-en.txt using EN translations."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MISSING = ROOT / "missing-en.txt"
OUT = ROOT / "en-extra-snippet.js"

EN: dict[str, str] = {
    "Плечі мають регульовану довжину, тому машину легко підлаштувати під розмір зварюваних деталей, а регульований хід електродів дає змогу обслуговувати елементи різної товщини. Трансформатор залитий у пластик, що захищає його від пошкоджень, а вода охолоджує його разом із тиристором, плечима та електродами — тому обладнання не втрачає продуктивності під час тривалої роботи. За керування відповідає мікропроцесорний контролер TE101, опційно — потужніший TE550.": "The arms have adjustable length, so the machine is easy to match to the size of the parts being welded, and the adjustable electrode stroke handles elements of different thicknesses. The transformer is resin-encapsulated for protection, and water cools it together with the thyristor, arms and electrodes — so the equipment keeps its output during long shifts. Control is handled by the TE101 microprocessor controller, optionally the more powerful TE550.",
    "Плечі мають регульовану довжину, тому машину можна підлаштувати під розміри зварюваних деталей, а регульований хід електродів полегшує роботу з елементами різної товщини. Трансформатор залитий у пластик, що підвищує його стійкість, а вода охолоджує трансформатор, тиристор, плечі та електроди. За керування відповідає мікропроцесорний контролер": "The arms have adjustable length, so the machine can be matched to the dimensions of the parts being welded, and the adjustable electrode stroke makes work with elements of different thicknesses easier. The transformer is resin-encapsulated for durability, and water cools the transformer, thyristor, arms and electrodes. Control is handled by the microprocessor controller",
    "Циліндри понад 1242 даН мають послідовні камери з можливістю відключення однієї з них, функцію мʼякого підходу та сферичне крiплення стопи циліндра, що забезпечує точність контакту Т-подібних плит. На більших машинах цієї групи зварюють масивні багатовиступні елементи, кільцеві герметичні виступи та нетипові виступи. Застосування": "Cylinders above 1242 daN have sequential chambers with the option to disable one of them, a soft-approach function and a spherical cylinder-foot mount that keeps T-slot platens accurately in contact. Larger machines in this group weld heavy multi-projection parts, annular sealing projections and non-standard projections. Applications",
    "Ця група має водяне охолодження, регульований попередній і робочий хід електродів, регулювання сили притиску та швидкості руху плечей. Доступність багатьох варіантів — за потужністю, довжиною плечей і силою притиску — дозволяє підібрати обладнання і для зварювання тонкого листа, і для складніших стальних елементів.": "This group has water cooling, adjustable approach and working electrode stroke, and adjustable squeeze force and arm travel speed. A wide choice of ratings — by power, arm length and squeeze force — lets you match equipment for thin sheet and for more demanding steel parts alike.",
    "CDM підходить для діаметрів Ø2–Ø10 мм на тонкому, плоскому й чистому матеріалі — короткий розряд (1–3 мс) і майже непомітний слід на звороті. DA (інверторна дуга) охоплює Ø3–Ø16 мм, працює також на товстішому матеріалі; цикл довше (10–1000 мс), слід помітніший, продуктивність типово 20–30 шпильок/хв.": "CDM suits diameters Ø2–Ø10 mm on thin, flat and clean material — a short discharge (1–3 ms) and an almost invisible mark on the reverse. DA (inverter arc) covers Ø3–Ø16 mm and also works on thicker stock; the cycle is longer (10–1000 ms), the mark more visible, typical output 20–30 studs/min.",
    "Інверторну версію 25 кВА варто розглядати, коли важливі витрати на енергію та електроди, якість і вигляд зʼєднання або зварювання важкозварюваних матеріалів. Виліт плечей підбирають як компроміс: мінімальний, потрібний для геометрії деталі — бо чим довші плечі, тим менша доступна сила притиску.": "The 25 kVA inverter version is worth considering when energy and electrode costs, joint quality and appearance, or hard-to-weld materials matter. Arm throat is chosen as a compromise: the minimum needed for part geometry — because the longer the arms, the lower the available squeeze force.",
    "Базові точкові машини потужністю від 16 до 25 кВА, призначені передусім для зварювання листового металу. Відмінна риса групи — вибір типу притиску електродів: доступні варіанти з педальним і з пневматичним притиском. Саме від нього залежить спосіб роботи, продуктивність і сфера застосування.": "Standard spot welders from 16 to 25 kVA, intended mainly for sheet-metal welding. The distinctive feature of the group is the choice of electrode squeeze: pedal and pneumatic options are available. That choice drives how you work, the output and the field of use.",
    "Так — на більших машинах цієї групи. Кільцевий герметичний виступ вимагає великої рівномірної сили притиску та точної паралельності плит, тому потрібні машини з відповідним циліндром, сферичним крiпленням стопи та якісною оснасткою. Ми підбираємо конфігурацію під конкретне креслення.": "Yes — on the larger machines in this group. An annular sealing projection needs high, even squeeze force and accurate platen parallelism, so you need a machine with a suitable cylinder, spherical foot mount and quality tooling. We match the configuration to the specific drawing.",
    "Стаціонарні точкові машини добре пристосовані до щоденної роботи майстерень, виробничих цехів і складальних постів. Найчастіше їх використовують для зʼєднання стальних листів, а завдяки регулюванню довжини плечей і ходу електродів вони справляються з деталями різної форми й товщини.": "Stationary spot welders suit day-to-day work in workshops, production halls and assembly stations. They are most often used to join steel sheets, and with adjustable arm length and electrode stroke they handle parts of different shapes and thicknesses.",
    "Найменші машини цієї групи (2,5–6 кВА) мають ручний притиск, більші — пневматичний з штовхаючим циліндром (6–38 кВА) або з тягнучим горизонтальним (38–50 кВА). Вони працюють на трансформаторах AC 50 Гц або на інверторних MFDC середньої частоти, наприклад 1000 Гц.": "The smallest machines in this group (2.5–6 kVA) have manual squeeze; larger ones use pneumatic push cylinders (6–38 kVA) or horizontal pull cylinders (38–50 kVA). They run on AC 50 Hz transformers or medium-frequency MFDC inverters, for example 1000 Hz.",
    "У точковому зварюванні зʼєднання виконуються послідовно — рішення для менших серій і нетипових виробів. Багатоточкові машини зварюють цілий ряд вузлів за один цикл і дають вищу продуктивність при серійному виробництві панелей огорожі чи будівельних сіток.": "In spot welding the joints are made one after another — a solution for smaller batches and non-standard products. Multi-spot machines weld a whole row of nodes in one cycle and deliver higher output in series production of fence panels or construction mesh.",
    "Кліщові точкові машини вирізняються високою якістю роботи, досягнутою завдяки сучасній раціональній конструкції та зменшеним габаритам. Вони мають вбудований сучасний мікропроцесорний контролер, який дає змогу точно налаштовувати параметри зварювання.": "Gun-type spot welders stand out for high working quality, thanks to a modern, efficient design and compact dimensions. They have a built-in modern microprocessor controller that lets you set weld parameters precisely.",
    "Конденсаторна технологія — природний вибір для шпильок Ø2–Ø10 мм на тонкому матеріалі, коли важливі швидкість циклу та мінімальний слід на зворотному боці. Конкретну конфігурацію (ємність, пістолети, автоматизація) підберемо під ваше завдання.": "Capacitor-discharge technology is the natural choice for Ø2–Ø10 mm studs on thin material when cycle speed and a minimal mark on the reverse side matter. We will match the specific configuration (capacitance, guns, automation) to your task.",
    "Гіроскопічне підвішування та балансир забезпечують вільний рух машини й мінімум фізичного навантаження на оператора. Діапазон потужностей дозволяє підібрати обладнання як для дрібних ремонтних робіт, так і для промислового виробництва.": "Gyroscopic suspension and a balancer give the machine free movement and minimum physical load on the operator. The power range lets you match equipment for light repair work and for industrial production alike.",
    "У педальній версії натиск задає оператор, а струм рушає лише після досягнення потрібного притиску. У пневматичній версії притиск забезпечує циліндр, який дає рівний повторюваний натиск і функцію одиничної та серійної роботи.": "In the pedal version the operator sets the squeeze, and current starts only after the required force is reached. In the pneumatic version a cylinder provides squeeze — even, repeatable force with single-shot and series modes.",
    "Усі прути подаються автоматично трьома подавачами з буферними накопичувачами. Обладнання оснащене системою палетизації готових панелей і поворотним столом для відбору панелей автонавантажувачем під час роботи машини.": "All wires are fed automatically by three feeders with buffer magazines. The equipment includes a palletising system for finished panels and a turntable so a forklift can remove panels while the machine is running.",
    "Обладнання спроєктовано для високоякісних зварних зʼєднань із високою продуктивністю та оптимізованими витратами на установку. Машини мають великі сили притиску електродів, зменшені габарити й безпечні компоненти.": "The equipment is designed for high-quality weld joints with high output and optimised installation costs. The machines offer high electrode squeeze forces, compact dimensions and safe components.",
    "Серія E-tech призначена для точкового зварювання листа та просторових деталей у майстернях і на промислових лініях. Конкретну конфігурацію — потужність, кліщі, програми контролера — підбираємо під ваше завдання.": "The E-tech series is intended for spot welding sheet and 3D parts in workshops and on industrial lines. We match the specific configuration — power, guns, controller programmes — to your task.",
    "Ступінь автоматизації підбираємо під виробництво: від ручного укладання прутів у шаблонах, через автоматичні подавачі для сіток 2D і 3D, до пресів загинання панелей і систем палетизації. Компоненти зварювання —": "We match the automation level to the production: from hand-loading wires into templates, through automatic feeders for 2D and 3D mesh, to panel-bending presses and palletising systems. Welding components —",
    "DA підходить для шпильок більшого діаметра (до Ø16 мм) і товстішого основного матеріалу. Струм зварювання та час циклу налаштовуються під конкретну шпильку й матеріал — ми допоможемо підібрати конфігурацію.": "DA suits larger-diameter studs (up to Ø16 mm) and thicker base material. Weld current and cycle time are set for the specific stud and material — we will help match the configuration.",
    "Так. Ми виготовляємо обладнання для промислових підприємств Польщі, України та інших країн. Спілкуємося польською та англійською. Напишіть нам — обговоримо технологію, підбір обладнання та умови постачання.": "Yes. We build equipment for industrial plants in Poland, Ukraine and other countries. We communicate in Polish and English. Write to us — we will discuss the process, equipment selection and supply terms.",
    "Проєктуємо й будуємо машини для зварювання сіток та повні автоматичні лінії під конкретний виріб і продуктивність — від окремих постів до ліній з автоматичною подачею прутів і відбором готових виробів.": "We design and build mesh welding machines and complete automatic lines for a specific product and output — from individual stations to lines with automatic wire feed and removal of finished parts.",
    "Автоматичне зварювання панелей максимальних розмірів 2500 × 2500 мм із прутів Ø3–8 мм. Три подавачі: поперечний, продовжній і бічний — для додаткового нижнього поперечного прута в панелях 2D.": "Automatic welding of panels up to 2500 × 2500 mm from Ø3–8 mm wires. Three feeders: cross, longitudinal and side — for an extra lower cross wire in 2D panels.",
    "Роботизовані комплекси, автоматичні машини для точкового, рельєфного й шовного зварювання, лінії для сіток і приварювання шпильок. Одна спеціалізація — повний контроль від проєкту до пуску.": "Robotic cells, automatic machines for spot, projection and seam welding, mesh lines and stud welding. One specialism — full control from design to start-up.",
    "Пристрої CDM ми використовуємо як джерела струму в автоматизованих комплексах ЧПК нашого виробництва — разом із вібраційними подавачами шпильок і автоматичними головками SIK2 або SIK100.": "We use CDM units as power sources in automated CNC cells of our own build — together with vibratory stud feeders and automatic heads SIK2 or SIK100.",
    "Старші моделі групи рекомендовані як джерела живлення на автоматизованих і роботизованих постах — після підключення автоматичного подавача шпильок і автоматичної головки SIK2 або SIK100.": "Older models in the group are recommended as power sources on automated and robotic stations — after connecting an automatic stud feeder and automatic head SIK2 or SIK100.",
    "Міцна стальна конструкція в поєднанні з інверторною технологією дає найвищу якість зʼєднань. Контролер із кількома режимами роботи дозволяє вибрати найкращий для конкретних матеріалів.": "A rigid steel frame combined with inverter technology delivers the highest joint quality. A controller with several operating modes lets you choose the best for specific materials.",
    "Усі машини цих груп працюють у діапазоні 16–25 кВА. Вибір визначають передусім тип притиску, виліт плечей і сила притиску під ваші деталі, а також те, чи потрібна інверторна техніка.": "All machines in these groups run in the 16–25 kVA range. The choice is driven mainly by squeeze type, arm throat and squeeze force for your parts, and whether inverter technology is needed.",
    "Відмінні властивості при зварюванні чистого алюмінію або його зварюваних сплавів, міді та латуні. Високе значення коефіцієнта потужності та зменшене навантаження на мережу живлення.": "Excellent performance when welding pure aluminium or its weldable alloys, copper and brass. High power factor and reduced load on the supply network.",
    "Швидкість приварювання залежить від розміру та діаметра шпильки (типово до 20–30 шпильок/хв). Для діаметрів до Ø10 мм і тонкого основного матеріалу часто економічнішим рішенням буде": "Stud welding rate depends on stud size and diameter (typically up to 20–30 studs/min). For diameters up to Ø10 mm and thin base material a more economical solution is often",
    "На обладнанні SMOLTECH виробляють панелі огорожі 2D і 3D, будівельні та армувальні сітки, габіони, гірничі сітки, кратниці, а також нетипові вироби — наприклад пера жалюзійних сит.": "SMOLTECH equipment produces 2D and 3D fence panels, construction and reinforcing mesh, gabions, mining mesh, gratings, and non-standard products — for example louvre-screen fins.",
    "Точкова — вузол за вузлом, гнучкіша щодо форми сітки, для менших серій. Багатоточкова — цілий ряд вузлів за цикл, для серійного виробництва панелей огорожі та будівельних сіток.": "Spot — node by node, more flexible on mesh shape, for smaller batches. Multi-spot — a whole row of nodes per cycle, for series production of fence panels and construction mesh.",
    "У асортименті — машини змінного струму 16–25 кВА та інверторні 25 кВА. Тип притиску (педальний або пневматичний) підбираємо під інтенсивність роботи та вимоги до повторюваності.": "The range includes AC machines 16–25 kVA and inverter 25 kVA. We match the squeeze type (pedal or pneumatic) to work intensity and repeatability requirements.",
    "SMOLTECH Technika Zgrzewalnicza Sp. z o. o. — конструкторське бюро й виробництво в Мокроносі-Дольному. Проєктуємо й будуємо обладнання під конкретну деталь і такт лінії.": "SMOLTECH Technika Zgrzewalnicza Sp. z o. o. — design office and production in Mokronos Dolny. We design and build equipment for a specific part and line cycle time.",
    "Модульна конструкція рами, плечей, зʼєднувачів і циліндрів дозволяє конфігурувати машину під конкретну оснастку та деталь. Діапазон потужності — від 35 до 315 кВА.": "A modular frame, arms, connectors and cylinders let you configure the machine for specific tooling and parts. Power range — from 35 to 315 kVA.",
    "Так: подавачі поперечних, продовжніх і бічних прутів, преси для панелей 3D, палетизація та поворотні столи для відбору автонавантажувачем під час роботи машини.": "Yes: feeders for cross, longitudinal and side wires, presses for 3D panels, palletising and turntables for forklift removal while the machine is running.",
    "(Італія). Автоматика, оптика, пневматика й сервоприводи — від перевірених світових виробників. На виході: промислові автомати під реальний процес замовника.": "(Italy). Controls, optics, pneumatics and servos — from proven global manufacturers. The result: industrial automation built around the customer’s real process.",
    "Ми працюємо з двома основними групами підвісних кліщів: змінного струму середньої потужності та інверторними машинами для інтенсивної промислової роботи.": "We work with two main groups of suspended guns: medium-power AC and inverter machines for intensive industrial use.",
    "Модульна конструкція рами, плечей, зʼєднувачів і циліндрів. Циліндри з хромованими стінками подовженого ресурсу, протиобертові. Безмастильна пневматика.": "Modular construction of frame, arms, connectors and cylinders. Long-life chrome-bore cylinders, anti-rotation. Oil-free pneumatics.",
    "У реалізованих машинах — панелі до 2500 × 2500 мм (Ø3–8 мм) і сітки до 1600 × 4000 мм (Ø3–10 мм, вічко 20–200 мм). Межі визначаємо на етапі концепції.": "On machines already built — panels up to 2500 × 2500 mm (Ø3–8 mm) and mesh up to 1600 × 4000 mm (Ø3–10 mm, mesh opening 20–200 mm). Limits are set at the concept stage.",
    "Інверторна техніка підвищує культуру роботи обладнання, забезпечує високу енергоефективність, відмінну якість зʼєднання та довший ресурс електродів.": "Inverter technology raises the working standard of the equipment, delivering high energy efficiency, excellent joint quality and longer electrode life.",
    "Портальна стальна конструкція з 12 зварювальними циліндрами над робочим полем. Два інверторні трансформатори по 90 кВА (P=50%) з обох боків портала.": "A portal steel frame with 12 welding cylinders above the work area. Two inverter transformers of 90 kVA each (P=50%) on both sides of the portal.",
    "Асортимент охоплює чотири групи обладнання — від мобільних кліщів для великих корпусів до інверторних машин для кузовних і складальних робіт:": "The range covers four equipment groups — from mobile guns for large housings to inverter machines for body and assembly work:",
    "Автоматична лінія на 4 інверторних трансформаторах 1000 Гц по 200 кВА (P-50%) і 51 трикамерному зварювальному циліндрі. Три подавачі прутів.": "An automatic line on 4 inverter transformers 1000 Hz at 200 kVA each (P-50%) and 51 three-chamber welding cylinders. Three wire feeders.",
    "— компактні переносні пристрої для мʼякої та нержавіючої сталі, алюмінію й латуні; мінімальний слід на зворотному боці, до 50 шпильок/хв.": "— compact portable units for mild and stainless steel, aluminium and brass; minimal mark on the reverse side, up to 50 studs/min.",
    "Девʼять подвійних зварювальних модулів із інтегрованим трансформатором 32 кВА (P=50%) і силою притиску електродів 2×260 даН (при 6 бар).": "Nine twin welding modules with an integrated 32 kVA transformer (P=50%) and electrode squeeze force 2×260 daN (at 6 bar).",
    "дає рівний, повторюваний натиск і двоетапний цикл (позиціонування без струму, потім зварювання) — краще для серійного виробництва.": "gives even, repeatable squeeze and a two-stage cycle (positioning without current, then welding) — better for series production.",
    "Прут Ø3–10 мм, вічко 20–200 мм. Вузли постійного струму 400 кВА (P-50%) і 15 пневматичних циліндрів із силою притиску 760 даН.": "Wire Ø3–10 mm, mesh opening 20–200 mm. DC packs 400 kVA (P-50%) and 15 pneumatic cylinders with squeeze force 760 daN.",
    "— нижча ціна, відсутність потреби в компресорі та простіше обслуговування; підходить для роботи меншої інтенсивності.": "— lower price, no need for a compressor and simpler maintenance; suited to lower-intensity work.",
    "Зварювання сіток — панелей огорожі та переносних будівельних огорож — зі змінними шаблонами й системою палетизації.": "Mesh welding — fence panels and portable construction fencing — with interchangeable templates and a palletising system.",
    "Продуктивні інверторні пристрої для приварювання тягнутою дугою шпильок зі зменшеною основою й діаметром до 16 мм.": "High-output inverter units for drawn-arc welding of reduced-base studs up to 16 mm diameter.",
    "Економічні й надійні конденсаторні пристрої — міцне та швидке приварювання шпильок до тонких основних матеріалів.": "Economical and reliable capacitor-discharge units — strong, fast stud welding to thin base materials.",
    "Приклади реалізацій SMOLTECH. Кожну машину підбираємо під тип сітки, діаметр прутів і плановану продуктивність.": "Examples of SMOLTECH installations. We match each machine to mesh type, wire diameter and planned output.",
    "— автоматизовані комплекси нашого виробництва з вібраційними подавачами та конденсаторними джерелами струму.": "— automated cells of our own build with vibratory feeders and capacitor-discharge power sources.",
    "— дугове обладнання i12 та i16 для більших діаметрів і товстішого матеріалу; методи Drawn Arc і Short Cycle.": "— arc equipment i12 and i16 for larger diameters and thicker material; Drawn Arc and Short Cycle methods.",
    "(Італія), плюс вузли автоматики, електроніки, оптики, пневматики та серводвигунів від визнаних виробників.": "(Italy), plus automation, electronics, optics, pneumatics and servo-motor packs from recognised manufacturers.",
    "Автопром, металообробка, електротехніка, меблі — частина підприємств, для яких ми проєктували обладнання.": "Automotive, metalworking, electrical engineering, furniture — some of the plants for which we have designed equipment.",
    "На кожному етапі замовник має підтримку нашої команди: від технології зварювання до сервісу й запчастин.": "At every stage the customer has support from our team: from welding process to service and spare parts.",
    "Тип сітки, діаметр прутів, розміри виробу та планована продуктивність — від цього залежить конфігурація.": "Mesh type, wire diameter, product size and planned output — that is what drives the configuration.",
    "Британський виробник обладнання для приварювання шпильок — понад 35 років на ринках Європи та світу.": "A British manufacturer of stud welding equipment — over 35 years on European and world markets.",
    "1. Інверторна машина SW-51/5×200/MF для сіток і панелей огорожі 2D і 3D зі столом, що обертається": "1. Inverter machine SW-51/5×200/MF for mesh and 2D and 3D fence panels with a rotating table",
    "TAYLOR Studwelding Systems Limited: обладнання для шпильок і комплекси ЧПК на базі систем TAYLOR.": "TAYLOR Studwelding Systems Limited: stud equipment and CNC cells based on TAYLOR systems.",
    "3. Інверторна багатоточкова машина SW-9/2×240/MF для сіток і переносних будівельних огорож": "3. Inverter multi-spot machine SW-9/2×240/MF for mesh and portable construction fencing",
    "Польща, Нижня Сілезія — біля Вроцлава. Зум карти показує розташування в масштабі країни.": "Poland, Lower Silesia — near Wrocław. The map zoom shows the location at country scale.",
    "— для листа, прута та просторових деталей із педальним або пневматичним притиском.": "— for sheet, wire and 3D parts with pedal or pneumatic squeeze.",
    "7. Багатоточкова машина постійного струму SW-15/1×400 для сіток до 1600 × 4000 мм": "7. DC multi-spot machine SW-15/1×400 for mesh up to 1600 × 4000 mm",
    "(Познань). Разом розвиваємо проєкти на технології TECNA та холодильні агрегати": "(Poznań). Together we develop projects on TECNA technology and chillers",
    "4. Інверторна багатоточкова машина SW-51/4×180 для огорожних і габіонних сіток": "4. Inverter multi-spot machine SW-51/4×180 for fence and gabion mesh",
    "2. Інверторна багатоточкова машина SW-51/5×200/MF для панелей огорожі 2D і 3D": "2. Inverter multi-spot machine SW-51/5×200/MF for 2D and 3D fence panels",
    "5. Багатоточкова машина SW-18/9×32/AC для сіток зі стальних прутів у шаблонах": "5. Multi-spot machine SW-18/9×32/AC for steel-wire mesh in templates",
    "Від креслення в Inventor — до збирання на заводі й офісної підтримки проєкту.": "From a drawing in Inventor — to assembly at the plant and office project support.",
    "Цех у Мокроносі-Дольному — збирання багатоточкової машини для панелей огорожі": "Hall in Mokronos Dolny — assembling a multi-spot machine for fence panels",
    "Mokronos Dolny біля Вроцлава, Польща. Відповідаємо польською та англійською.": "Mokronos Dolny near Wrocław, Poland. We answer in Polish and English.",
    "— для просторових і великих деталей, коли стаціонарна машина неефективна.": "— for 3D and large parts when a stationary machine is inefficient.",
    "6. Інверторна багатоточкова машина SW-12/2×90/MF для пер жалюзійних сит": "6. Inverter multi-spot machine SW-12/2×90/MF for louvre-screen fins",
    "Інверторні багатофункціональні машини E-tech зі зварювальними кліщами": "Inverter multifunction E-tech machines with welding guns",
    "— для деталей із технологічними виступами в техніках AC, DC або MFDC.": "— for parts with process projections in AC, DC or MFDC.",
    "Пристрої групи DA можуть застосовуватися для приварювання шпильок": "DA-group units can be used for stud welding",
    "Підвісні кліщові машини з вбудованим трансформатором (2,5–90 кВА)": "Suspended gun welders with built-in transformer (2.5–90 kVA)",
    "— для складальних і сервісних ліній, зокрема кузовних деталей.": "— for assembly and service lines, including body parts.",
    "Машини контактного зварювання з власного заводу під Вроцлавом": "Resistance welding machines from our own plant near Wrocław",
    "— для листового металу, прута навхрест і просторових деталей.": "— for sheet metal, cross-wire and 3D parts.",
    "— лінійний притиск для деталей із технологічними виступами.": "— linear squeeze for parts with process projections.",
    "Інверторні пристрої для приварювання шпильок від Ø3 до Ø16": "Inverter units for stud welding from Ø3 to Ø16",
    "AC · 63–163 кВА — точково-рельєфні машини змінного струму": "AC · 63–163 kVA — AC spot-projection machines",
    "Точково-рельєфні машини з лінійним притиском (35–315 кВА)": "Spot-projection machines with linear squeeze (35–315 kVA)",
    "AC · 35–80 кВА — точково-рельєфні машини змінного струму": "AC · 35–80 kVA — AC spot-projection machines",
    "DC · 100 кВА — точково-рельєфні машини постійного струму": "DC · 100 kVA — DC spot-projection machines",
    "Конструкторський відділ: проєктування зварювальних машин": "Design office: welding machine design",
    "MFDC · 90–200 кВА — інверторні точково-рельєфні машини": "MFDC · 90–200 kVA — inverter spot-projection machines",
    "Кліщові підвісні машини точкового зварювання 16–38 кВА": "Suspended spot-welding guns 16–38 kVA",
    "Роботизований комплекс контактного зварювання SMOLTECH": "SMOLTECH robotic resistance welding cell",
    "Багатофункціональні інверторні машини (серія E-tech)": "Multifunction inverter machines (E-tech series)",
    "Інверторні стаціонарні точкові машини 25 кВА (MFDC)": "Inverter stationary spot welders 25 kVA (MFDC)",
    "SMOLTECH на карті Польщі / Європи — Mokronos Dolny": "SMOLTECH on the map of Poland / Europe — Mokronos Dolny",
    "Впровадження на лінії, навчання персоналу, сервіс.": "Line introduction, operator training, service.",
    ". Вони працюють із пістолетами DA2A, DA7B і DA8A.": ". They work with guns DA2A, DA7B and DA8A.",
    "AC · 80–315 кВА — рельєфні машини змінного струму": "AC · 80–315 kVA — AC projection machines",
    "MFDC · 56 кВА — енергоефективні інверторні машини": "MFDC · 56 kVA — energy-efficient inverter machines",
    "Підбір процесу й обладнання під ваше виробництво.": "Process and equipment selection for your production.",
    "— серія E-tech для складальних і сервісних ліній.": "— E-tech series for assembly and service lines.",
    "Трансформатори, керування, холодильні агрегати.": "Transformers, controls, chillers.",
    "Компоненти TECNA та світовий рівень автоматики": "TECNA components and world-class automation",
    "Понад десять років — лише контактне зварювання": "Over ten years — resistance welding only",
    "Інверторні стаціонарні точкові машини 25 кВА": "Inverter stationary spot welders 25 kVA",
    "Комплекси ЧПК для автоматичного приварювання": "CNC cells for automatic stud welding",
    "Надішліть креслення — підберемо конфігурацію": "Send a drawing — we will match the configuration",
    "Інверторні підвісні машини 56–90 кВА (MFDC)": "Inverter suspended machines 56–90 kVA (MFDC)",
    "Комплекси та оснастка під конкретну деталь.": "Cells and tooling for a specific part.",
    "Машини і лінії для сіток та панелей огорожі": "Machines and lines for mesh and fence panels",
    "Коли обирати дугову інверторну технологію": "When to choose inverter arc technology",
    "Стаціонарні точкові машини 16–25 кВА (AC)": "Stationary spot welders 16–25 kVA (AC)",
    "CDM — конденсаторне приварювання Ø2–Ø10": "CDM — capacitor discharge Ø2–Ø10",
    "Приводи, балансири, тримачі, електроди.": "Actuators, balancers, holders, electrodes.",
    "Як підібрати стаціонарну точкову машину": "How to choose a stationary spot welder",
    "Кліщові підвісні машини 16–38 кВА (AC)": "Suspended guns 16–38 kVA (AC)",
    "Стаціонарні точкові машини (16–25 кВА)": "Stationary spot welders (16–25 kVA)",
    "Спілкуємося польською та англійською.": "We communicate in Polish and English.",
    "Підказати технологію під вашу деталь": "Suggest a process for your part",
    "Не машина в ящику — готове рішення": "Not a machine in a crate — a ready solution",
    "Оснащення інверторних пристроїв DA": "Equipment for DA inverter units",
    "Точково-рельєфні машини 35–315 кВА": "Spot-projection machines 35–315 kVA",
    "Базові точкові та рельєфні машини": "Standard spot and projection machines",
    "Підібрати конфігурацію під деталь": "Match a configuration to the part",
    "Підібрати машину для вашої деталі": "Find a machine for your part",
    "З чого починається підбір машини": "Where machine selection starts",
    "Група, дистрибуція, реквізити": "Group, distribution, company details",
    "Меблі, HVAC, побутова техніка": "Furniture, HVAC, household appliances",
    "Запитати про цю конфігурацію": "Ask about this configuration",
    "Конструкція та застосування": "Design and applications",
    "Де працюють машини E-tech": "Where E-tech machines work",
    "Ексклюзивний дистриб'ютор": "Exclusive distributor",
    "Конструкція та можливості": "Design and capabilities",
    "для універсальних завдань": "for general-purpose tasks",
    "Заводи в Польщі та світі": "Plants in Poland and worldwide",
    "Автомобільні компоненти": "Automotive components",
    "Зварювальні вузли — від": "Welding packs — from",
    "Конструкція та переваги": "Design and advantages",
    "Сітки та панелі огорожі": "Mesh and fence panels",
    "Проєкт і виготовлення": "Design and manufacturing",
    "Три особи до контакту": "Three people to contact",
    "під конкретну деталь": "for a specific part",
    "Точкові та рельєфні": "Spot and projection",
    "Адреса та звʼязок": "Address and contact",
    "Входимо до групи": "We are part of the group",
    "Коли обирати CDM": "When to choose CDM",
    "TAYLOR у Польщі": "TAYLOR in Poland",
    "Пуск і навчання": "Start-up and training",
    "і комплекси ЧПК": "and CNC cells",
    "Електротехніка": "Electrical engineering",
    "Каталог відео": "Video catalogue",
    "Партнерства": "Partnerships",
    "Запчастини": "Spare parts",
    "Звʼязатися": "Contact us",
    "Де ми є": "Where we are",
    "Хто ми": "Who we are",
    "Опис": "Description",
}


def js_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def main() -> int:
    keys = [ln for ln in MISSING.read_text(encoding="utf-8").splitlines() if ln != ""]

    missing = [k for k in keys if k not in EN]
    translated = len(keys) - len(missing)

    print(f"translated: {translated}")
    print(f"missing from EN: {len(missing)}")
    if missing:
        for m in missing:
            print(f"  MISSING: {m[:80]}{'…' if len(m) > 80 else ''}")
        return 1

    out_lines = [f"  '{js_escape(k)}': '{js_escape(EN[k])}'," for k in keys]
    OUT.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(out_lines)} lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
