/* SMOLTECH UA — client-side Ukrainian → English. Default remains uk. */
(function () {
  'use strict';

  var STORE = 'st-lang';
  var CYR = /[А-Яа-яЁёІіЇїЄєҐґ]/;
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|KBD)$/;
  var ATTRS = ['aria-label', 'alt', 'title', 'placeholder', 'data-title'];
  var PREFIX = [
    ['Відтворити відео: ', { en: 'Play video: ', pl: 'Odtwórz wideo: ', ru: 'Воспроизвести видео: ' }],
    ['Дивитись відео: ', { en: 'Watch video: ', pl: 'Obejrzyj wideo: ', ru: 'Смотреть видео: ' }],
    ['Дивитися відео: ', { en: 'Watch video: ', pl: 'Obejrzyj wideo: ', ru: 'Смотреть видео: ' }]
  ];
  var D = {
    /* chrome */
    'Заголовок': 'Heading',
    'Короткий опис, який можна змінити.': 'A short description you can change.',
    'Текст, який можна змінити.': 'Text you can change.',
    'Підпис': 'Label',
    'Розділ': 'Section',
    'Цифри': 'Figures',
    'Нова модель': 'New model',
    'Нова машина': 'New machine',
    'Позначка': 'Tag',
    'Докладніше': 'Read more',
    'Короткий опис сторінки. Його можна змінити.': 'A short page description. You can change it.',
    'Фото': 'Photo',
    'Перейти до основного вмісту': 'Skip to content',
    'Мова сайту': 'Site language',
    'Українська': 'Ukrainian',
    'Mokronos Dolny, Польща': 'Mokronos Dolny, Poland',
    'Польща, 55-080 Mokronos Dolny': 'Poland, 55-080 Mokronos Dolny',
    'Польща': 'Poland',
    'SMOLTECH на YouTube': 'SMOLTECH on YouTube',
    'SMOLTECH в Instagram': 'SMOLTECH on Instagram',
    'SMOLTECH — на головну': 'SMOLTECH — home',
    'Головне меню': 'Main menu',
    'Головна': 'Home',
    'Компанія': 'Company',
    'Про компанію': 'About us',
    'Виробник машин контактного зварювання під Вроцлавом': 'Resistance welding machine manufacturer near Wrocław',
    'Компетенції': 'Expertise',
    'Проєктування, виробництво, автоматизація, роботизація': 'Design, build, automation, robotics',
    'Зварювальні машини': 'Welding machines',
    'Машини для металу': 'Metal welding machines',
    'Машини точкового та рельєфного зварювання': 'Spot and projection welding machines',
    'Серійні машини 2,5–315 кВА': 'Standard machines 2.5–315 kVA',
    'Серійні машини 2,5–315 кВА · 4 групи': 'Standard machines 2.5–315 kVA · 4 groups',
    'Машини зварювання з оснасткою': 'Fixture-equipped welding machines',
    'Базові машини з пристосуваннями під деталь': 'Basic machines with jigs for your part',
    'Машини з оснасткою': 'Fixture-equipped machines',
    'Оснастка під деталь': 'Tooling for your part',
    'Практичне застосування базових рельєфних і точкових машин TECNA з технологічними пристосуваннями, спроєктованими під просторові деталі — від гайок і кронштейнів до елементів вихлопу та амортизаторів.': 'Practical use of basic TECNA projection and spot welders fitted with process tooling designed for 3D parts — from nuts and brackets to exhaust and damper components.',
    'Приклади реалізацій': 'Case studies',
    'Машини з пристосуваннями в роботі': 'Machines with fixtures at work',
    'Від базової машини — до готового робочого місця': 'From a basic welder to a ready workstation',
    'База TECNA': 'TECNA base',
    'Оснастка SMOLTECH': 'SMOLTECH tooling',
    'Підібрати оснастку під деталь': 'Match tooling to your part',
    'Усі відео рельєфного зварювання': 'All projection-welding videos',
    'Оберіть групу машин': 'Choose a machine group',
    'Загальну сторінку-огляд прибрано. Нижче — чотири актуальні групи серійних машин точкового та рельєфного зварювання.': 'The overview page has been removed. Below are the four current groups of standard spot and projection welders.',
    'На головну — меню груп': 'Home — group menu',
    'Від серійних машин точкового та рельєфного зварювання — до складних автоматичних ліній і машин з оснасткою під конкретну деталь.': 'From standard spot and projection welders to complex automatic lines and machines with fixture for a specific part.',
    'Базові рельєфні та точкові машини комплектуємо змінною зварювальною оснасткою під просторові деталі: гайки, кронштейни, елементи вихлопу, амортизатори.': 'We fit basic projection and spot welders with interchangeable welding tooling for 3D parts: nuts, brackets, exhaust parts, dampers.',
    'Одна машина працює з кількома пристосуваннями — параметри зварювання підтягуються автоматично після встановлення інструменту. За потреби — датчики наявності деталі та захисна огорожа.': 'One machine works with several fixtures — weld parameters load automatically after the tool is fitted. Presence sensors and a safety cage on request.',
    'Машини зварювання з оснасткою | SMOLTECH': 'Welding machines with fixture | SMOLTECH',
    'Машини зварювання з оснасткою — SMOLTECH': 'Welding machines with fixture — SMOLTECH',
    'Базові рельєфні та точкові машини з змінною зварювальною оснасткою під просторові деталі: гайки, кронштейни, елементи вихлопу. Параметри підтягуються автоматично після встановлення інструменту.': 'Basic projection and spot welders with interchangeable tooling for 3D parts: nuts, brackets, exhaust components. Parameters load automatically after the tool is fitted.',
    'Базові рельєфні та точкові машини TECNA з технологічними пристосуваннями SMOLTECH — під гайки, кронштейни, елементи вихлопу й амортизатори.': 'Basic TECNA projection and spot welders with SMOLTECH process tooling — for nuts, brackets, exhaust parts and dampers.',
    'Пристосування + серійна база': 'Fixtures + standard base',
    'Одна машина — кілька інструментів під різні деталі': 'One machine — several tools for different parts',
    'Комплектуємо базові рельєфні й точкові машини змінною оснасткою. Пристосування легко замінюються, а параметри зварювання підтягуються автоматично після встановлення інструменту.': 'We fit basic projection and spot welders with interchangeable tooling. Fixtures swap easily, and weld parameters load automatically after the tool is fitted.',
    'серійна база': 'standard base',
    'оснастка під деталь': 'tooling for the part',
    'датчики базування': 'locating sensors',
    'Як це працює': 'How it works',
    'Від стандартної машини — до готового поста': 'From a standard welder to a ready station',
    'Оснастку доповнюємо датчиками наявності та положення деталі. На запит — захисна клітка з оптичними або механічними барʼєрами.': 'We add presence and position sensors to the tooling. On request — a safety cage with optical or mechanical barriers.',
    'Швидка зміна інструменту': 'Quick tool change',
    'Кілька пристосувань на одній машині — переналагодження без довгого простою лінії.': 'Several fixtures on one machine — changeover without a long line stop.',
    'Автоматичні параметри': 'Automatic parameters',
    'Технологія зварювання, призначена для конкретного інструменту, викликається одразу після його встановлення.': 'The weld schedule for a given tool is recalled as soon as it is fitted.',
    'Контроль базування': 'Locating control',
    'Датчики наявності й положення деталі виключають зварювання при неправильній укладці (Poka-Yoke).': 'Presence and position sensors prevent welding when the part is mislocated (Poka-Yoke).',
    'Захист оператора': 'Operator protection',
    'Опційна огорожа з оптичними або механічними барʼєрами — під вимоги цеху й оцінку ризику.': 'Optional guarding with optical or mechanical barriers — matched to the shop and risk assessment.',
    'Автомобіль і метал': 'Automotive and metalwork',
    'Гайки, кронштейни, вихлоп, амортизатори, корпуси — типові завдання для оснастки на рельєфних машинах.': 'Nuts, brackets, exhaust, dampers, housings — typical jobs for tooling on projection welders.',
    'Шлях до автоматизації': 'Path to automation',
    'Масштабування': 'Scaling up',
    'Коли такт зростає — та сама технологія масштабується в автоматичний або роботизований комплекс.': 'When the cycle rate rises — the same process scales into an automatic or robotic cell.',
    'Кожна позиція — приклад оснастки під конкретну деталь на базі серійної машини TECNA. Відео з YouTube лише після натискання.': 'Each item is an example of tooling for a specific part on a standard TECNA welder. YouTube video loads only after you click.',
    '6127N — приварювання гайки до кронштейна': '6127N — nut-to-bracket projection welding',
    'Інверторна машина 160 кВА зі змінним пристосуванням для рельєфного приварювання гайок до сталевих кронштейнів.': '160 kVA inverter welder with interchangeable tooling for projection welding nuts to steel brackets.',
    '6710 — два циліндри під днище амортизатора': '6710 — twin cylinders for damper bottom',
    'Машина 200 кВА з двома актуаторами по 1242 даН і оснасткою для елементів днища автомобільного амортизатора.': '200 kVA machine with two 1242 daN actuators and tooling for car damper bottom parts.',
    '6128S — гайка до кронштейна сидіння': '6128S — nut to seat bracket',
    'Інверторна рельєфна 160 кВА з пристосуванням для приварювання гайок до кронштейнів автосидінь.': '160 kVA inverter projection welder with tooling for welding nuts to car-seat brackets.',
    'SG-1 — гайки й гравіювання позначень': 'SG-1 — nuts and mark engraving',
    'Напівавтоматична станція: приварювання гайок до елементів автосидіння з наступним гравіюванням маркування.': 'Semi-automatic station: welding nuts to seat parts, then engraving the markings.',
    '6128/S/MF — болт і корпус натягувача ременів': '6128/S/MF — bolt and belt-retractor housing',
    'Два змінні пристосування: зварювання корпусу натягувача та рельєфне приварювання болта.': 'Two interchangeable fixtures: welding the retractor housing and projection welding the bolt.',
    'SP-2/1×56MF — рухомий стіл X-Y': 'SP-2/1×56MF — moving X-Y table',
    'Базова інверторна точкова 56 кВА з рухомим столом для багатоточкового зварювання просторових деталей.': 'Basic 56 kVA inverter spot welder with a moving table for multi-spot welding of 3D parts.',
    'SG-3 — три кронштейни до кільця': 'SG-3 — three brackets to a ring',
    'Оснастка для одночасного або послідовного приварювання трьох кронштейнів до кільця.': 'Tooling for simultaneous or sequential welding of three brackets to a ring.',
    '8203 — поворотна оснастка під гайки': '8203 — rotary nut tooling',
    'Рельєфна 100 кВА з поворотним інструментом для чотирьох гайок — вищий такт і точне базування.': '100 kVA projection welder with a rotary tool for four nuts — higher rate and precise locating.',
    'SG-2/160 — болти й гайки': 'SG-2/160 — bolts and nuts',
    'Два змінні пристосування з автоматичним викликом параметрів і датчиками правильного базування.': 'Two interchangeable fixtures with automatic parameter recall and correct-locating sensors.',
    'Оснастка під оцинкований лист': 'Tooling for galvanised sheet',
    'Пристосування для якісного зʼєднання оцинкованих деталей — контроль контакту й параметрів процесу.': 'Fixture for sound joints on galvanised parts — contact and process-parameter control.',
    'Роботизоване приварювання гайок': 'Robotic nut projection welding',
    'Коли оснастки на базовій машині вже замало — інтегруємо робота для серійного приварювання на кузовних деталях.': 'When basic-machine tooling is no longer enough — we integrate a robot for series welding on body parts.',
    'SG-4 — ручки до чаші гриля': 'SG-4 — handles to a grill bowl',
    'Напівавтоматичний комплекс на базі рельєфної машини з оснасткою під просторову деталь побутової техніки.': 'Semi-automatic cell on a projection welder with tooling for a spatial appliance part.',
    'Що отримуєте': 'What you get',
    'Серійні точкові та рельєфні машини з перевіреною механікою, водяним охолодженням і мікропроцесорним контролером.': 'Standard spot and projection welders with proven mechanics, water cooling and a microprocessor controller.',
    'Проєктуємо й виготовляємо пристосування під вашу деталь: базування, притиск, датчики, швидка зміна інструменту.': 'We design and build fixtures for your part: locating, clamping, sensors, quick tool change.',
    'Пусконалагодження, навчання операторів і впровадження у виробництво — у стандарті поставки з оснасткою.': 'Commissioning, operator training and production introduction — included with tooling delivery.',
    'Коли такт зростає — та сама технологія переходить у автоматизований або роботизований комплекс.': 'When the cycle rate rises — the same process moves into an automated or robotic cell.',
    'Рельєфна машина контактного зварювання з технологічною оснасткою SMOLTECH': 'Resistance projection welder with SMOLTECH process tooling',
    'Рельєфна машина контактного зварювання з технологічною оснасткою': 'Resistance projection welder with process tooling',
    'Зварювальна оснастка SMOLTECH: притиск, електроди та датчики під деталь': 'SMOLTECH welding fixture: clamp, electrodes and part-presence sensors',
    'Підвісні кліщові 2,5–90 кВА': 'Suspended gun welders 2.5–90 kVA',
    'Підвісні з вбудованим трансформатором, 2,5–90 кВА': 'Suspended with built-in transformer, 2.5–90 kVA',
    'Кліщові підвісні 16–38 кВА': 'Suspended guns 16–38 kVA',
    'Інверторні підвісні 56–90 кВА': 'Inverter suspended 56–90 kVA',
    'Стаціонарні точкові 16–25 кВА': 'Stationary spot welders 16–25 kVA',
    'Точкові для листів, прутів і просторових елементів': 'Spot welders for sheet, cross-wire and 3D parts',
    'Стаціонарні 16–25 кВА': 'Stationary 16–25 kVA',
    'Інверторні стаціонарні 25 кВА': 'Inverter stationary 25 kVA',
    'Точково-рельєфні 35–315 кВА': 'Spot-projection machines 35–315 kVA',
    'Точково-рельєфні з лінійним притиском': 'Spot-projection with linear force',
    'Точково-рельєфні з лінійним притиском, 35–315 кВА': 'Spot-projection with linear force, 35–315 kVA',
    'AC 35–80 кВА': 'AC 35–80 kVA',
    'Інверторні 56 кВА': 'Inverter 56 kVA',
    'Інверторні 90–200 кВА': 'Inverter 90–200 kVA',
    'AC 63–163 кВА': 'AC 63–163 kVA',
    'AC 80–315 кВА': 'AC 80–315 kVA',
    'DC 100 кВА': 'DC 100 kVA',
    'Багатофункціональні інверторні (E-tech)': 'Multifunction inverter machines (E-tech)',
    'Автоматизовані комплекси': 'Automated resistance welding cells',
    'Спеціальні та роботизовані установки на замовлення': 'Automated and robotic systems, built to order',
    'Відео реалізацій — усі машини': 'All videos on film',
    'Проєктування, виробництво, роботизація': 'Design, manufacturing, robotics',
    'Машини для зварювання сіток': 'Mesh welding machines',
    'Панелі огорожі 2D/3D, габіони, сітки': '2D/3D fence panels, gabions, mesh',
    'Багатоточкові лінії з подавачами прута': 'Multi-spot lines with wire feeders',
    'Підібрати машину під виріб': 'Find the right machine for your part',
    'Приварювання шпильок': 'Stud welding',
    'CDM — конденсаторне приварювання': 'CDM — capacitor discharge stud welding',
    'Шпильки Ø2–Ø10, розрядний час 1–3 мс': 'Studs Ø2–Ø10, discharge time 1–3 ms',
    'DA — інверторне приварювання': 'DA — inverter stud welding',
    'Шпильки Ø3–Ø16, техніка з захисним газом і керамікою': 'Studs Ø3–Ø16, drawn-arc with gas and ceramic ferrule',
    'Комплекси ЧПК': 'CNC stud welding machines',
    'Автоматичне приварювання шпильок за програмою': 'Programmed, automatic stud welding',
    'Відео': 'Video',
    'Відео — автоматизація': 'Video — automation',
    'Контакти': 'Contact',
    'Реалізації': 'Installations',
    'Відкрити меню': 'Open menu',
    'Закрити меню': 'Close menu',
    '— Підвісні кліщові 2,5–90 кВА': '— Suspended gun welders 2.5–90 kVA',
    '— Підвісні з трансформатором, 2,5–90 кВА': '— Suspended with transformer, 2.5–90 kVA',
    '—— Кліщові 16–38 кВА': '—— Guns 16–38 kVA',
    '—— Інверторні 56–90 кВА': '—— Inverter 56–90 kVA',
    '— Стаціонарні точкові машини': '— Stationary spot welders',
    '— Стаціонарні точкові машини 16–25 кВА': '— Stationary spot welding machines 16–25 kVA',
    '— Точкові стаціонарні': '— Stationary spot',
    '—— 16–25 кВА': '—— 16–25 kVA',
    '—— Інверторні 25 кВА': '—— Inverter 25 kVA',
    '— Точково-рельєфні 35–315 кВА': '— Spot-projection 35–315 kVA',
    '— Точково-рельєфні з лінійним притиском': '— Spot-projection with linear force',
    '— Точково-рельєфні з лінійним притиском, 35–315 кВА': '— Spot-projection with linear force, 35–315 kVA',
    '—— AC 35–80 кВА': '—— AC 35–80 kVA',
    '—— Інверторні 56 кВА': '—— Inverter 56 kVA',
    '—— Інверторні 90–200 кВА': '—— Inverter 90–200 kVA',
    '—— AC 63–163 кВА': '—— AC 63–163 kVA',
    '—— AC 80–315 кВА': '—— AC 80–315 kVA',
    '—— DC 100 кВА': '—— DC 100 kVA',
    '— Багатофункціональні інверторні': '— Multifunction inverter machines',
    '— Багатофункціональні інверторні машини': '— Inverter multifunction machines',
    'Інверторні машини для зварювання кузовів': 'Car body inverter welding machines',
    '— Інверторні машини для зварювання кузовів': '— Car body inverter welding machines',
    'Приварювання шпильок — огляд': 'Stud welding — overview',
    '— CDM, Ø2–Ø10': '— CDM, Ø2–Ø10',
    '— DA, Ø3–Ø16': '— DA, Ø3–Ø16',
    '— Комплекси ЧПК': '— CNC cells',
    'Відео — автоматизація зварювання': 'Video — welding automation',
    'Отримати пропозицію': 'Get a quote',
    'Проєктуємо та виробляємо машини контактного зварювання, автоматизовані й роботизовані зварювальні комплекси та технологічні лінії для металообробної й автомобільної промисловості.': 'We design and build resistance welders, automated and robotic cells, and process lines for metalworking and automotive plants.',
    'YouTube SMOLTECH': 'SMOLTECH YouTube',
    'Instagram SMOLTECH': 'SMOLTECH Instagram',
    'Обладнання': 'Equipment',
    'Точкові та рельєфні машини': 'Spot and projection machines',
    'Підвісні кліщові машини': 'Suspended gun welders',
    'Стаціонарні точкові машини': 'Stationary spot welders',
    'Точково-рельєфні машини': 'Spot-projection machines',
    'Багатофункціональні інверторні': 'Car body inverter welding machines',
    'CDM — Ø2–Ø10': 'Stud welding - CDM',
    'DA — Ø3–Ø16': 'Stud welding - DA',
    'Відео — реалізації': 'Video — installations',
    'Політика конфіденційності': 'Privacy policy',
    'SMOLTECH Technika Zgrzewalnicza Sp. z o. o.\nst. Przyjazna 2, 55-080 Mokronos Dolny, Польща': 'SMOLTECH Technika Zgrzewalnicza Sp. z o. o.\nst. Przyjazna 2, 55-080 Mokronos Dolny, Poland',
    'SMOLTECH Technika Zgrzewalnicza Sp. z o. o. Усі права захищені.': 'SMOLTECH Technika Zgrzewalnicza Sp. z o. o. All rights reserved.',
    'Польська версія — smoltech.pl': 'Polish version — smoltech.pl',
    'Швидкий контакт': 'Quick contact',
    'Подзвонити': 'Call',
    'Запит': 'Ask us',
    'Догори': 'Back to top',
    'Навігація': 'Navigation',
    'Машини': 'Machines',
    'SMOLTECH — машини контактного зварювання': 'SMOLTECH — resistance welding machines',
    'SMOLTECH — відео': 'SMOLTECH — video',

    /* form */
    'Запит на пропозицію': 'Request a quote',
    'Напишіть, що зварюєте — підберемо рішення під деталь': 'Tell us what you weld — we will match a setup to the part',
    'Шукаєте точкову машину, лінію для сіток чи партнера, який збере автоматичний комплекс під ваше виробництво? Залиште заявку — передзвонимо й скажемо, яка технологія, потужність і рівень автоматизації мають сенс.': 'Need a spot welder, a mesh line, or someone to design an automated cell around your plant? Leave a note — we will call back with a sensible process, kVA rating and automation level.',
    'Або напишіть на': 'Or email',
    '— відповідаємо українською, польською та англійською.': '— we answer in Ukrainian, Polish and English.',
    'Не заповнюйте це поле': 'Leave this field empty',
    'Імʼя та прізвище *': 'First and last name *',
    'Компанія': 'Company',
    'E-mail *': 'E-mail *',
    'Телефон': 'Phone',
    'Тема запиту': 'Subject',
    '— оберіть —': '— select —',
    '— оберіть або впишіть —': '— select or type —',
    'Автоматизований / роботизований комплекс': 'Automated / robotic cell',
    'Машини для зварювання сіток і панелей огорожі': 'Machines for welding mesh and fence panels',
    'Сервіс і запасні частини': 'Service and spare parts',
    'Інше': 'Other',
    'Що потрібно зварити *': 'What needs welding *',
    'Матеріал і товщина, тип зʼєднання, розміри деталі, який такт потрібен…': 'Material and thickness, joint type, part size, cycle time…',
    'Погоджуюся на обробку моїх персональних даних компанією SMOLTECH Technika Zgrzewalnicza Sp. z o. o. з метою відповіді на цей запит.': 'I agree to the processing of my personal data by SMOLTECH Technika Zgrzewalnicza Sp. z o. o. in order to respond to this enquiry.',
    'Ваші персональні дані оброблятиме SMOLTECH Technika Zgrzewalnicza Sp. z o.o. з метою розгляду цього запиту. Докладніше — у нашій Політиці конфіденційності.': 'Your personal data will be processed by SMOLTECH Technika Zgrzewalnicza Sp. z o.o. for the purpose of handling your enquiry. For more information, see our Privacy Policy.',
    'Політиці конфіденційності': 'Privacy Policy',
    'Інформація про обробку персональних даних': 'Personal data notice',
    'Закрити': 'Close',
    '* — обовʼязкові поля.': '* — required fields.',
    'Надіслати запит': 'Send message',
    'Надсилаємо…': 'Sending…',
    'Дякуємо! Ваш запит надіслано — ми звʼяжемося з вами найближчим часом.': 'Thanks — we have your message and will be in touch shortly.',
    'Не вдалося надіслати форму. ': 'Could not send the form. ',
    'Напишіть нам на': 'Write to us at',
    'або телефонуйте': 'or call',

    /* titles / meta */
    'Машини контактного зварювання — виробник обладнання | SMOLTECH': 'Resistance welding machines — equipment manufacturer | SMOLTECH',
    'Виробник машин контактного зварювання: точкові та рельєфні машини, автоматизовані й роботизовані комплекси, машини для зварних сіток і 3D панелей огорожі.': 'Manufacturer of resistance welding machines: spot and projection welders, automated and robotic cells, machines for welded mesh and 3D fence panels.',
    'Польський виробник машин контактного зварювання для підприємств України: точкові й рельєфні машини, автоматизовані комплекси, сітки та 3D панелі огорожі.': 'Polish manufacturer of resistance welding machines for plants in Ukraine: spot and projection welders, automated cells, mesh and 3D fence panels.',
    'Підвісна кліщова машина точкового зварювання SMOLTECH': 'SMOLTECH suspended gun spot welder',
    'Стаціонарна машина точкового зварювання SMOLTECH': 'SMOLTECH stationary spot welder',
    'Точково-рельєфна машина з лінійним притиском SMOLTECH': 'SMOLTECH spot-projection machine with linear squeeze',
    'Автоматизований комплекс контактного зварювання SMOLTECH': 'SMOLTECH automated resistance welding cell',
    'Багатоточкова машина для зварювання сіток SMOLTECH': 'SMOLTECH multi-spot mesh welding machine',
    'Машина зварювання з оснасткою під деталь SMOLTECH': 'SMOLTECH fixture-equipped welding machine',
    'Комплекс ЧПК для приварювання шпильок SMOLTECH': 'SMOLTECH CNC stud welding cell',
    'Комплекс ЧПК для автоматичного приварювання шпильок SMOLTECH': 'SMOLTECH CNC cell for automatic stud welding',
    'Інверторні пристрої DA для приварювання шпильок': 'DA inverter stud welding units',
    'Конденсаторні пристрої CDM для приварювання шпильок': 'CDM capacitor stud welding units',
    'Виробничий цех SMOLTECH у Мокроносі-Дольному під Вроцлавом': 'SMOLTECH production hall in Mokronos Dolny near Wrocław',
    'Виробничий цех SMOLTECH — машини контактного зварювання': 'SMOLTECH production hall — resistance welding machines',
    'Відео реалізацій автоматизації зварювання SMOLTECH': 'SMOLTECH welding automation case-study video',
    'Інверторна багатофункціональна машина E-tech SMOLTECH': 'SMOLTECH E-tech multifunction inverter welder',
    'Політика конфіденційності — SMOLTECH': 'Privacy policy — SMOLTECH',
    'SMOLTECH — машини контактного зварювання та автоматизація зварювання': 'SMOLTECH — resistance welding machines and welding automation',
    'Про компанію — виробник машин контактного зварювання | SMOLTECH': 'About us — resistance welding machines | SMOLTECH',
    'SMOLTECH — виробник машин контактного зварювання та автоматизованих комплексів. Власне конструкторське бюро й виробництво під Вроцлавом, компоненти TECNA.': 'SMOLTECH manufactures resistance welding machines and automated cells. In-house design office and production near Wrocław, TECNA components.',
    'Про компанію SMOLTECH — виробник зварювального обладнання': 'About SMOLTECH — welding equipment manufacturer',
    'Компетенції — проєктування та автоматизація | SMOLTECH': 'Expertise — design and automation | SMOLTECH',
    'Проєктування механіки, виробництво машин, автоматизація та роботизація зварювальних процесів. Повний цикл: від концепції до пуску обладнання у виробництво.': 'Mechanical design, machine building, automation and robotics of welding processes. Full cycle: from concept to production start-up.',
    'Компетенції SMOLTECH — проєктування, виробництво, автоматизація, роботизація': 'SMOLTECH capabilities — design, manufacturing, automation, robotics',
    'Машини точкового та рельєфного зварювання | SMOLTECH': 'Spot and projection welders | SMOLTECH',
    'Машини контактного зварювання: підвісні кліщові 2,5–90 кВА, стаціонарні точкові, точково-рельєфні 35–315 кВА та багатофункціональні інверторні. Обладнання TECNA.': 'Resistance welding machines: suspended guns 2.5–90 kVA, stationary spot welders, spot-projection 35–315 kVA and multifunction inverter machines. TECNA equipment.',
    'Машини точкового та рельєфного зварювання металу — SMOLTECH': 'Spot and projection metal welding machines — SMOLTECH',
    'Підвісні кліщові точкові машини 2,5–90 кВА | SMOLTECH': 'Suspended gun spot welders 2.5–90 kVA | SMOLTECH',
    'Підвісні кліщові машини точкового зварювання з вбудованим трансформатором: 16–38 кВА (AC) та інверторні 56–90 кВА. Технічні параметри моделей.': 'Suspended gun spot welders with built-in transformer: 16–38 kVA (AC) and inverter 56–90 kVA. Model specifications.',
    'Підвісні кліщові машини точкового зварювання 2,5–90 кВА': 'Suspended gun spot welders 2.5–90 kVA',
    'Стаціонарні точкові машини 16–25 кВА | SMOLTECH': 'Stationary spot welders 16–25 kVA | SMOLTECH',
    'Стаціонарні точкові машини для листа, прута і деталей | SMOLTECH': 'Stationary spot welders for sheet, rod and parts | SMOLTECH',
    'Стаціонарні точкові машини 16–25 кВА з педальним або пневматичним притиском та інверторні 25 кВА. Технічні параметри моделей 4640–4649 і 6010–6013.': 'Stationary spot welders 16–25 kVA with pedal or pneumatic squeeze, and inverter 25 kVA. Specifications for models 4640–4649 and 6010–6013.',
    'Точково-рельєфні машини 35–315 кВА | SMOLTECH': 'Spot-projection machines 35–315 kVA | SMOLTECH',
    'Точково-рельєфні машини з лінійним притиском: AC 35–315 кВА, інверторні MFDC 56–200 кВА, DC 100 кВА. Для деталей із виступами, гайок і кронштейнів.': 'Spot-projection machines with linear squeeze: AC 35–315 kVA, MFDC inverter 56–200 kVA, DC 100 kVA. For embossed parts, nuts and brackets.',
    'Багатофункціональні інверторні машини E-tech | SMOLTECH': 'E-tech multifunction inverter machines | SMOLTECH',
    'Інверторні машини E-tech 3660 і 3670 для точкового зварювання листа та просторових деталей, зокрема кузова авто. Контролер TE760, памʼять на 150 технологій.': 'E-tech inverter machines 3660 and 3670 for spot welding sheet and 3D parts, including car bodies. TE760 controller, memory for 150 weld schedules.',
    'Автоматизовані та роботизовані зварювальні комплекси | SMOLTECH': 'Automated and robotic welding cells | SMOLTECH',
    'Проєктуємо й будуємо спеціалізовані зварювальні комплекси: роботизовані пости, поворотні столи, машинний зір, Poka-Yoke та збір даних процесу.': 'We design and build dedicated welding cells: robot stations, turntables, machine vision, Poka-Yoke and process data capture.',
    'Автоматизовані та роботизовані зварювальні комплекси — SMOLTECH': 'Automated and robotic welding cells — SMOLTECH',
    'Машини для зварювання сіток і панелей огорожі 2D/3D | SMOLTECH': 'Machines for welding mesh and 2D/3D fence panels | SMOLTECH',
    'Точкові та багатоточкові машини для зварних сіток: панелі огорожі 2D і 3D, будівельні й армувальні сітки, габіони. Автоматичні лінії з подачею прутів.': 'Spot and multi-spot machines for welded mesh: 2D and 3D fence panels, construction and reinforcing mesh, gabions. Automatic lines with wire feed.',
    'Машини для зварювання сіток і панелей огорожі — SMOLTECH': 'Machines for welding mesh and fence panels — SMOLTECH',
    'Приварювання шпильок — обладнання TAYLOR | SMOLTECH': 'Stud welding — TAYLOR equipment | SMOLTECH',
    'Обладнання для приварювання шпильок: конденсаторні CDM (Ø2–Ø10), інверторні i12 та i16 (Ø3–Ø16), комплекси ЧПК. Дистриб\'ютор TAYLOR Studwelding.': 'Stud welding equipment: CDM capacitor units (Ø2–Ø10), inverter i12 and i16 (Ø3–Ø16), CNC cells. TAYLOR Studwelding distributor.',
    'Приварювання шпильок — обладнання та комплекси ЧПК | SMOLTECH': 'Stud welding — equipment and CNC cells | SMOLTECH',
    'CDM — конденсаторне приварювання шпильок Ø2–Ø10 | SMOLTECH': 'CDM — capacitor discharge stud welding Ø2–Ø10 | SMOLTECH',
    'Пристрої CDM8, CDM9 і CDM10 для конденсаторного приварювання шпильок Ø2–Ø10 мм: сталь, нержавіюча сталь, алюміній, латунь. До 50 шпильок за хвилину.': 'CDM8, CDM9 and CDM10 units for capacitor discharge stud welding Ø2–Ø10 mm: steel, stainless steel, aluminium, brass. Up to 50 studs per minute.',
    'DA — інверторне приварювання шпильок Ø3–Ø16 | SMOLTECH': 'DA — inverter stud welding Ø3–Ø16 | SMOLTECH',
    'Інверторні пристрої i12 та i16 для дугового приварювання шпильок Ø3–Ø16 мм. Струм 100–1400 А, цикл 10–1000 мс, методи Drawn Arc і Short Cycle.': 'Inverter units i12 and i16 for drawn-arc stud welding Ø3–Ø16 mm. Current 100–1400 A, cycle 10–1000 ms, Drawn Arc and Short Cycle.',
    'Комплекси ЧПК для автоматичного приварювання шпильок | SMOLTECH': 'CNC cells for automatic stud welding | SMOLTECH',
    'Автоматизовані комплекси ЧПК для приварювання шпильок: деталі до 3000×2000 мм, до 4 осей і 4 головок, вібраційні подавачі, швидке переналагодження.': 'Automated CNC stud welding cells: parts up to 3000×2000 mm, up to 4 axes and 4 heads, vibratory feeders, fast changeover.',
    'Відео — автоматизація зварювання | SMOLTECH': 'Video — welding automation | SMOLTECH',
    'Відео з роботи наших зварювальних комплексів: точкове та рельєфне зварювання, шовне по колу, багатоточкові лінії для сіток і автоматичне приварювання шпильок.': 'Videos of our welding cells at work: spot and projection welding, circular seam welding, multi-spot mesh lines and automatic stud welding.',
    'Відео — автоматизація зварювання, реалізації SMOLTECH': 'Video — welding automation, SMOLTECH case studies',
    'Контакти — SMOLTECH Technika Zgrzewalnicza, Mokronos Dolny': 'Contact — SMOLTECH Technika Zgrzewalnicza, Mokronos Dolny',
    'Звʼяжіться з нами: +48 71 321 54 27, biuro@smoltech.pl. SMOLTECH Technika Zgrzewalnicza, st. Przyjazna 2, 55-080 Mokronos Dolny під Вроцлавом.': 'Get in touch: +48 71 321 54 27, biuro@smoltech.pl. SMOLTECH Technika Zgrzewalnicza, st. Przyjazna 2, 55-080 Mokronos Dolny near Wrocław.',
    'Контакти — SMOLTECH Technika Zgrzewalnicza': 'Contact — SMOLTECH Technika Zgrzewalnicza',
    'Політика конфіденційності | SMOLTECH': 'Privacy policy | SMOLTECH',
    'Політика конфіденційності сайту smoltech.com.ua: адміністратор персональних даних, мета й термін обробки, права користувача та файли cookie.': 'Privacy policy of smoltech.com.ua: personal data controller, purpose and retention, user rights and cookies.',
    'Сторінку не знайдено (404) | SMOLTECH': 'Page not found (404) | SMOLTECH',
    'Такої сторінки на сайті smoltech.com.ua немає. Скористайтеся посиланнями нижче, щоб перейти до машин контактного зварювання або до контактів.': 'That address is not on smoltech.com.ua. The links below take you to the machines — or to us.',
    'DA — інверторне приварювання': 'DA — inverter stud welding',
    'CDM — конденсаторне приварювання': 'CDM — capacitor discharge stud welding',

    /* home */
    'Виробничий цех SMOLTECH: багатоточкова машина для зварювання панелей огорожі': 'SMOLTECH production hall: multi-spot machine for fence panels',
    'Виробник зварювального обладнання · Польща': 'Welding equipment manufacturer · Poland',
    'Машини контактного зварювання та автоматизація зварювальних процесів': 'Resistance welding machines and welding process automation',
    'Машини контактного зварювання': 'Resistance welding machines',
    'та автоматизація зварювальних процесів': 'and welding process automation',
    'Проєктуємо й виробляємо машини точкового, рельєфного та шовного зварювання, багатоточкові машини для зварних сіток, а також повністю автоматизовані й роботизовані зварювальні комплекси та технологічні лінії — під конкретну деталь і задану продуктивність.': 'We design and build spot, projection and seam welding machines, multi-spot machines for welded mesh, and fully automated and robotic welding cells and process lines — for a specific part and required output.',
    'Дивитися машини в роботі': 'See the machines at work',
    'Років спеціалізації на контактному зварюванні': 'Years in resistance welding',
    'Побудованих машин': 'Machines built',
    'Власне проєктування, виробництво і автоматика': 'Design, build and controls — all in-house',
    'Зварювальні компоненти TECNA S.p.A., Італія': 'Welding components from TECNA S.p.A., Italy',
    'Чим займаємося': 'What we do',
    'Три речі, які вміємо найкраще': 'The three things we do best',
    'Чотири речі, які вміємо найкраще': 'The four things we do best',
    'Від серійних машин точкового та рельєфного зварювання — до складних автоматичних ліній, спроєктованих під конкретний виріб замовника.': 'From catalogue spot and projection welders to automatic lines built around your part.',
    'Автоматизований комплекс контактного зварювання з мідними електродами та пневматичними приводами': 'Automated resistance welding cell with copper electrodes and pneumatic actuators',
    'Автоматизація та роботизація зварювання': 'Welding automation and robotics',
    'Проєктуємо й будуємо спеціалізовані машини контактного зварювання, автоматизовані комплекси та багатозадачні технологічні лінії. Рішення призначені передусім для автомобільної, електротехнічної, меблевої, вентиляційної галузей і виробництва побутової техніки.': 'We design and build dedicated resistance welding machines, automated cells and multi-task process lines. Solutions are aimed mainly at automotive, electrical, furniture, HVAC and household-appliance manufacturing.',
    'Застосовуємо найвищі стандарти безпеки, інтегруємо системи контролю деталей та моніторингу всіх параметрів процесу — тому наші машини відповідають суворим вимогам якості автопрому.': 'Safety is built in, and so is part inspection and weld-parameter logging — the kind of quality automotive plants expect.',
    'Багатоточкова машина для зварювання сіток та панелей огорожі 2D і 3D': 'Multi-spot machine for welding mesh and 2D/3D fence panels',
    'Проєктуємо та виробляємо багатоточкові машини для панелей огорожі 2D і 3D, гірничих та армувальних сіток, габіонів, ґрат і інших виробів із прута й дроту.': 'We design and manufacture multi-spot machines for 2D and 3D fence panels, mining and reinforcing mesh, gabions, gratings and other wire products.',
    'Забезпечуємо потрібний рівень автоматизації — від ручного укладання прутів у шаблони до повністю автоматичних ліній із подавачами прута для 2D і 3D сіток, пресами для гнуття панелей і системами палетизації.': 'We provide the required automation — from hand-loading wires into templates to fully automatic lines with wire feeders for 2D and 3D mesh, panel-bending presses and palletising.',
    'Машини для сіток': 'Mesh machines',
    'Базові машини точкового та рельєфного зварювання металу': 'Standard spot and projection metal welding machines',
    'Базові машини точкового та рельєфного зварювання': 'Standard spot and projection welding machines',
    'Пропонуємо серійні машини контактного зварювання для майстерень і промислового виробництва: точкові та рельєфні машини для листового металу, прута, гайок і болтів.': 'We offer standard resistance welding machines for workshops and industrial production: spot and projection welders for sheet metal, wire, nuts and bolts.',
    'Міцна конструкція, водяне охолодження та мікропроцесорне керування параметрами зварювання забезпечують максимальну продуктивність і стабільно високу якість зварних точок.': 'A stiff frame, water cooling and a microprocessor weld controller give you output and a stable nugget, shift after shift.',
    'Чому SMOLTECH': 'Why SMOLTECH',
    'Польський виробник, який живе контактним зварюванням': 'A Polish manufacturer that lives and breathes resistance welding',
    'Виробничий цех SMOLTECH у Мокроносі-Дольному під Вроцлавом': 'SMOLTECH production hall in Mokronos Dolny near Wrocław',
    'Виробничий цех SMOLTECH: зварювальна машина з оснасткою на складанні': 'SMOLTECH production hall: fixture-equipped welding machine being assembled',
    'Офіс SMOLTECH Technika Zgrzewalnicza в Мокроносі-Дольному': 'SMOLTECH Technika Zgrzewalnicza office in Mokronos Dolny',
    'Конструкторський відділ: проєктування зварювальних машин у Autodesk Inventor': 'Design office: welding machines in Autodesk Inventor',
    'Роботизований комплекс контактного зварювання, побудований SMOLTECH': 'Robotic resistance welding cell built by SMOLTECH',
    'У нашому портфелі — одно- та багатопозиційні комплекси, традиційні й інверторні машини, рельєфні, шовні, точкові та багатоточкові машини. У межах одного комплексу інтегруємо додаткові операції: калібрування деталі, запресування, гравіювання маркування, різання, гнуття, автоматичну перевірку міцності зварної точки, палетизацію та пакування.': 'Our portfolio includes single- and multi-station cells, conventional and inverter machines, projection, seam, spot and multi-spot welders. Within one cell we integrate extra operations: part calibration, press-fitting, marking, cutting, bending, automatic nugget-strength checks, palletising and packing.',
    'Досвід, перевірений у промисловості — десятки проєктів для вимогливого автопрому.': 'Industry-proven experience — dozens of projects for demanding automotive plants.',
    'Власне інженерне забезпечення (100% власними силами) — повний контроль від проєкту до впровадження.': 'In-house engineering (100%) — full control from design to commissioning.',
    'Компоненти світового класу: автоматика, оптика, пневматика, сервоприводи, зварювальні трансформатори.': 'World-class components: controls, optics, pneumatics, servo drives, welding transformers.',
    'Сервіс і постійна підтримка: навчання персоналу та доступність запасних частин.': 'Service and ongoing support: operator training and spare-part availability.',
    'Технологічна оснастка, спроєктована під конкретну деталь замовника.': 'Process tooling designed around the customer’s part.',
    'Дуже добра комунікація — це підтверджують рекомендації та повторні замовлення.': 'We keep the conversation straightforward — that is why customers come back.',
    'Наші компетенції': 'Our capabilities',
    'Подивіться, як працюють наші машини': 'Watch them run',
    'Кілька десятків спеціалізованих машин контактного зварювання, знятих у роботі. Кожен комплекс спроєктований і виготовлений з нуля під конкретну деталь замовника.': 'Dozens of dedicated resistance welding machines filmed in operation. Each cell is designed and built from scratch for the customer’s part.',
    'Рельєфне зварювання': 'Projection welding',
    'Система машинного зору': 'Machine-vision system',
    'Роботизація': 'Robotics',
    'Зварні сітки': 'Welded mesh',
    'Усі відео': 'All videos',
    'Галузі та замовники': 'Industries and customers',
    'Наші машини працюють на заводах у Польщі та по всьому світу': 'Our machines run in plants in Poland and around the world',
    'Ми співпрацюємо з виробниками автомобільних компонентів, сталевих меблів, зварних огорожних та армувальних сіток, сталевих корпусів, вентиляційних систем та інших металовиробів.': 'We work with makers of automotive components, steel furniture, welded fence and reinforcing mesh, steel housings, HVAC systems and other metal products.',
    'Логотип замовника SMOLTECH': 'SMOLTECH customer logo',
    'Що ми даємо разом із машиною': 'What we deliver with the machine',
    'Розробка технології зварювання та підбір обладнання під специфіку виробництва.': 'Weld-process development and equipment selection for your production.',
    'Проєктування й виготовлення спеціалізованих комплексів і технологічної оснастки.': 'Design and build of dedicated cells and process tooling.',
    'Пуск обладнання, впровадження у виробництво, навчання персоналу та сервіс.': 'Start-up, production introduction, operator training and service.',
    'Постачання запасних і швидкозношуваних частин: приводи, балансири, тримачі й електроди.': 'Supply of spare and wear parts: actuators, balancers, holders and electrodes.',
    'Постачання обладнання: трансформатори, системи керування, холодильні агрегати.': 'Supply of equipment: transformers, control systems, chillers.',
    'Контроль процесу на рівні автопрому': 'Automotive-grade process control',
    'На вимогу замовників — переважно з автомобільної галузі — застосовуємо системи детального вимірювання параметрів зварювання зі збором даних, рішення Poka-Yoke, авторські тести систем контролю Error Proofing, системи ідентифікації оснастки та керовані рівні доступу.': 'At customer request — mainly from automotive — we apply detailed weld-parameter measurement with data logging, Poka-Yoke, our own Error Proofing tests, tooling identification and controlled access levels.',
    'Пропонуємо також постійний онлайн-моніторинг роботи машин і сервісну підтримку після завершення проєкту.': 'We also offer continuous online machine monitoring and after-sales service support.',
    'Технології зварювання': 'Welding technologies',
    'Працюємо в техніках AC (змінний струм), DC (постійний струм) та MFDC — інверторне зварювання середньої частоти. Технологія MFDC дає відмінні результати також для алюмінію, нержавіючих і покритих сталей та різнорідних матеріалів.': 'We work with AC, DC and MFDC — medium-frequency inverter welding. MFDC also gives excellent results on aluminium, stainless and coated steels, and dissimilar materials.',
    'Поширені питання': 'FAQ',
    'Контактне зварювання — коротко про головне': 'Resistance welding — the essentials',
    'Що таке контактне зварювання і де його застосовують?': 'What is resistance welding and where is it used?',
    'Контактне зварювання (зварювання опором) — це зʼєднання металів за рахунок тепла, що виділяється під час проходження струму через місце контакту деталей, які одночасно стискаються електродами. Найпоширеніші різновиди — точкове, рельєфне та шовне зварювання. Метод широко застосовують в автомобільній, електротехнічній, меблевій промисловості, у виробництві побутової техніки, вентиляційних систем, зварних сіток і панелей огорожі.': 'Resistance welding joins metals by heat generated as current passes through the contact of parts squeezed by electrodes. The most common types are spot, projection and seam welding. The process is widely used in automotive, electrical and furniture industries, household appliances, HVAC, welded mesh and fence panels.',
    'Чим відрізняється точкове зварювання від рельєфного?': 'How does spot welding differ from projection welding?',
    'У точковому зварюванні зона зʼєднання формується геометрією електродів — струм концентрується у місці їхнього контакту з деталями. У рельєфному зварюванні місце зʼєднання визначає сама деталь: виступ (рельєф), гайка або болт із технологічним виступом. Завдяки цьому за один хід можна зварити кілька точок одночасно, а електроди мають вигляд плит із оснасткою, що забезпечує високу повторюваність.': 'In spot welding the joint is shaped by electrode geometry — current concentrates where they meet the parts. In projection welding the part itself defines the joint: an emboss, nut or bolt with a process projection. Several spots can be welded in one stroke, and electrodes are platen-style tooling for high repeatability.',
    'Що дає інверторна технологія MFDC?': 'What does MFDC inverter technology give you?',
    'Інверторні машини середньої частоти дозволяють задавати струм і час зварювання з точністю до 1 мс, зменшують навантаження на мережу живлення та підвищують енергоефективність. Результат — стабільніша якість зварної точки, довший ресурс електродів і можливість зварювати матеріали, складні для змінного струму: алюміній та його сплави, нержавіючі й гальванічно вкриті сталі, різнорідні пари матеріалів.': 'Medium-frequency inverter machines set current and weld time to 1 ms, reduce mains load and improve energy efficiency. The result is more stable nugget quality, longer electrode life and the ability to weld materials that are difficult on AC: aluminium and its alloys, stainless and galvanised steels, dissimilar pairs.',
    'Ви виготовляєте машини під конкретну деталь?': 'Do you build machines for a specific part?',
    'Так, це наш основний напрям. На основі технічних вимог замовника ми розробляємо технологію, проєктуємо механіку, електрику й автоматику, виготовляємо машину, програмуємо та тестуємо її разом із замовником. Кожен комплекс може містити додаткові операції — запресування, калібрування, гравіювання, перевірку міцності зварної точки, палетизацію.': 'Yes — that is our core work. From the customer’s technical requirements we develop the process, design mechanics, electrics and controls, build the machine, then program and test it together. Each cell can include extra operations — press-fitting, calibration, marking, nugget-strength checks, palletising.',
    'Чи постачаєте ви обладнання в Україну?': 'Do you supply equipment to Ukraine?',
    'Так. Ми працюємо з промисловими підприємствами в Польщі, Україні та інших країнах. Обслуговування ведемо українською, польською та англійською мовами. Напишіть нам, що потрібно зварювати — ми запропонуємо технологію, підберемо потужність машини та рівень автоматизації й підготуємо комерційну пропозицію.': 'Yes. We work with industrial plants in Poland, Ukraine and other countries. We support you in Ukrainian, Polish and English. Tell us what you need to weld — we will propose the process, match machine power and automation level, and prepare a quotation.',

    /* common UI */
    'Детальніше': 'More',
    'Точкове зварювання': 'Spot welding',
    'Усі': 'All',
    'Категорії відео': 'Video categories',
    'Шовне зварювання по колу': 'Circular seam welding',
    'Багатоточкові машини та сітки': 'Multi-spot machines and mesh',
    'Канал на YouTube': 'YouTube channel',
    'Обговорити проєкт': 'Talk through a project',
    'Підібрати машину': 'Help me choose',
    'Групи машин': 'Machine groups',
    'Групи обладнання': 'Equipment groups',
    'Групи моделей': 'Model groups',
    'Запросити пропозицію': 'Ask for a quote',
    'Технологія': 'Technology',
    'Технічні дані': 'Technical data',
    'Параметр': 'Parameter',
    'Од.': 'Unit',
    'Характеристика': 'Features',
    'Галерея': 'Gallery',
    'Підбір': 'Selection',
    'Підбір машини': 'Machine selection',
    'Дивіться також': 'See also',
    'Інші групи машин': 'Other machine groups',
    'Повернутися на головну': 'Back to home',
    'Сторінку не знайдено': 'Page not found',

    /* 404 */
    'Можливо, адресу введено з помилкою, або сторінку було переміщено. Нижче — найкоротший шлях до того, що ви шукали.': 'The link may be mistyped, or the page may have moved. These are the shortest routes to what you probably wanted.',
    'Підвісні, стаціонарні, інверторні МЧ — 2,5–315 кВА': 'Hanging, stationary, MF inverter — 2.5–315 kVA',
    'Роботизація та багатоточкові лінії під деталь замовника': 'Robotics and multi-spot lines for the customer’s part',
    'Сітки, огорожні панелі, армокаркаси': 'Mesh, fence panels, reinforcement cages',
    'CDM Ø2–Ø10, DA Ø3–Ø16, комплекси ЧПК': 'CDM Ø2–Ø10, DA Ø3–Ø16, CNC cells',
    'Відео: автоматизація': 'Video: automation',
    'Реальні машини SMOLTECH у роботі': 'Real SMOLTECH machines at work',
    'Напишіть або зателефонуйте — відповідаємо того ж дня': 'Write or call — we usually answer the same day',

    /* contact */
    'Поговоримо про ваш процес зварювання': 'Let’s talk about how you weld',
    'Відповідаємо українською, польською та англійською. Напишіть або подзвоніть — підберемо технологію, потужність і рівень автоматизації під конкретну деталь.': 'We answer in Ukrainian, Polish and English. Write or call — we will match process, kVA and automation to the part.',
    'біля Вроцлава, Польща': 'near Wrocław, Poland',
    'Розташування SMOLTECH — Mokronos Dolny, Польща': 'SMOLTECH location — Mokronos Dolny, Poland',
    'Статутний капітал сплачено повністю: 500 000,00 zł': 'Share capital paid in full: PLN 500,000.00',
    'Прямі контакти': 'Direct contacts',
    'Напишіть безпосередньо відповідальній особі': 'Write to the person who owns it',
    'Так ви швидше отримаєте відповідь по суті — без переадресації всередині компанії.': 'You get a straight answer from the person who actually handles it.',
    'Продаж — спеціалізовані машини': 'Sales — dedicated machines',
    'Продаж — базові машини, приварювання шпильок, запчастини': 'Sales — standard machines, stud welding, spare parts',
    'Виробництво та технічний сервіс': 'Production and technical service',
    'Адміністрація та маркетинг': 'Administration and marketing',
    'Бухгалтерія': 'Accounts',
    'Соцмережі': 'Social media',
    'Дивіться машини в роботі': 'Watch the machines at work',
    'YouTube — канал SMOLTECH': 'YouTube — SMOLTECH channel',
    'Відео реалізацій на сайті': 'Installation videos on the site',
    '+48 71 321 54 27 вн. 22': '+48 71 321 54 27 ext. 22',
    '+48 71 321 54 27 вн. 20': '+48 71 321 54 27 ext. 20',
    '+48 71 321 54 27 вн. 25': '+48 71 321 54 27 ext. 25',
    '+48 71 321 54 27 вн. 23': '+48 71 321 54 27 ext. 23',
    '+48 71 321 54 27 вн. 24': '+48 71 321 54 27 ext. 24',

    /* company */
    'Наша спеціальність — машини контактного зварювання та автоматизація зварювання': 'Resistance welding machines and welding automation — that is the job',
    'SMOLTECH Technika Zgrzewalnicza Sp. z o. o. — виробник обладнання для контактного зварювання металів із власним конструкторським бюро та виробництвом у Мокроносі-Дольному під Вроцлавом.': 'SMOLTECH Technika Zgrzewalnicza Sp. z o. o. manufactures resistance welding equipment, with its own design office and production in Mokronos Dolny near Wrocław.',
    'Ми проєктуємо й виробляємо машини для зварювання металів. Це передусім роботизовані комплекси та автоматичні машини для точкового, рельєфного і шовного зварювання. Ми маємо унікальну спеціалізацію та понад десять років досвіду в галузі контактного зварювання — і завдяки цьому створюємо машини для промислових підприємств Польщі, України та інших країн, зокрема для виробників:': 'We design and manufacture metal welding machines — mainly robotic cells and automatic machines for spot, projection and seam welding. With a focused specialism and more than ten years in resistance welding, we build machines for industrial plants in Poland, Ukraine and other countries, including makers of:',
    'автомобільних компонентів та вузлів;': 'automotive components and assemblies;',
    'зварних сіток для будівництва та панелей огорожі;': 'welded construction mesh and fence panels;',
    'електротехнічних виробів;': 'electrical products;',
    'меблевих деталей, побутової техніки, систем опалення та вентиляції.': 'furniture parts, household appliances, heating and ventilation systems.',
    'Наші машини побудовані на зварювальних компонентах': 'Our machines are built on welding components from',
    'з Італії — одного з найбільших у Європі виробників машин контактного зварювання, у тому числі інверторних. Крім того, ми використовуємо комплектуючі найвищої якості від світових виробників автоматики, електроніки, оптики, пневматики та серводвигунних систем. У результаті на нашому заводі під Вроцлавом народжуються технологічно передові автомати для зварювання металів.': 'in Italy — one of Europe’s largest makers of resistance welding machines, including inverter units. We also use top-quality parts from global suppliers of automation, electronics, optics, pneumatics and servo systems. The result, at our plant near Wrocław, is technically advanced metal-welding automation.',
    'Окрім спеціалізованих зварювальних комплексів ми пропонуємо': 'Besides dedicated welding cells we also offer',
    'базові машини точкового та рельєфного зварювання': 'standard spot and projection welding machines',
    'для універсального застосування, а також': 'for general use, as well as',
    'обладнання для приварювання шпильок': 'stud welding equipment',
    'Ми також проєктуємо й виготовляємо спеціалізовану зварювальну оснастку для зʼєднання просторових деталей.': 'We also design and manufacture dedicated welding fixtures for joining 3D parts.',
    'Виробничий цех SMOLTECH: складання багатоточкової машини для панелей огорожі': 'SMOLTECH production hall: assembling a multi-spot machine for fence panels',
    'Офіс SMOLTECH Technika Zgrzewalnicza у Мокроносі-Дольному': 'SMOLTECH Technika Zgrzewalnicza office in Mokronos Dolny',
    'Складання та монтаж зварювальних машин у цеху SMOLTECH': 'Assembly of welding machines in the SMOLTECH hall',
    'Комплексний підхід': 'The whole job, not a box',
    'Ми постачаємо не машину, а готове рішення': 'You get a working process, not a crate and a manual',
    'Обладнання нашого виробництва передається замовникові з повним пакетом рішень, тому на кожному етапі проєкту клієнт має професійну підтримку нашої команди.': 'Equipment from our plant is handed over with a full package of solutions, so the customer has professional support from our team at every project stage.',
    'Технологія та підбір обладнання': 'Process and equipment selection',
    'Розробляємо технологію зварювання й підбираємо обладнання під специфіку конкретного виробництва.': 'We develop the welding process and select equipment for the specific production.',
    'Проєктування та виготовлення': 'Design and manufacturing',
    'Проєктуємо й виготовляємо спеціалізовані зварювальні комплекси та технологічну оснастку під конкретну деталь.': 'We design and build dedicated welding cells and process tooling for a specific part.',
    'Пуск, впровадження, сервіс': 'Start-up, introduction, service',
    'Запускаємо обладнання, впроваджуємо його у виробництво, навчаємо персонал і надаємо сервісне обслуговування.': 'We start up the equipment, introduce it into production, train staff and provide service.',
    'Запасні та швидкозношувані частини': 'Spare and wear parts',
    'Постачаємо приводи, балансири, тримачі й електроди для контактного зварювання.': 'We supply actuators, balancers, holders and electrodes for resistance welding.',
    'Обладнання та комплектуючі': 'Equipment and components',
    'Постачаємо зварювальні трансформатори, системи керування та холодильні агрегати.': 'We supply welding transformers, control systems and chillers.',
    'Група компаній': 'Group of companies',
    'Ми входимо до групи': 'We are part of the',
    'з Познані. Завдяки взаємній підтримці ми синергійно реалізуємо проєкти у сфері контактного зварювання на технології TECNA, а також пропонуємо холодильні агрегати марки': 'group from Poznań. Through mutual support we deliver resistance-welding projects on TECNA technology and also offer chillers from',
    '(Італія).': '(Italy).',
    'Представництво': 'Representation',
    'Ми —': 'We are the',
    'ексклюзивний дистриб\'ютор TAYLOR Studwelding Systems Limited': 'exclusive distributor of TAYLOR Studwelding Systems Limited',
    '(Велика Британія) у Польщі: обладнання та аксесуари для приварювання шпильок, а також автоматизовані комплекси ЧПК на базі систем TAYLOR.': '(United Kingdom) in Poland: stud welding equipment and accessories, and automated CNC cells based on TAYLOR systems.',
    'Реквізити': 'Company details',
    'st. Przyjazna 2, 55-080 Mokronos Dolny, Польща': 'st. Przyjazna 2, 55-080 Mokronos Dolny, Poland',
    'Замовники': 'Customers',
    'Замовники в Польщі та по всьому світу': 'Customers in Poland and worldwide',
    'Наші машини працюють на заводах автомобільної, металообробної, електротехнічної та меблевої галузей. Нижче — частина підприємств, для яких ми проєктували та виготовляли обладнання.': 'Our machines run in automotive, metalworking, electrical and furniture plants. Below is a selection of companies for which we have designed and built equipment.',
    'Ексклюзивний дистриб\'ютор TAYLOR у Польщі': 'Exclusive TAYLOR distributor in Poland',
    'TAYLOR Studwelding Systems Limited — британська компанія, яка вже понад 35 років виробляє обладнання для приварювання шпильок і забезпечує промислові підприємства в Європі та світі.': 'TAYLOR Studwelding Systems Limited is a British company that has manufactured stud welding equipment for over 35 years, supplying industry in Europe and worldwide.',
    'TAYLOR Studwelding Systems Limited — ексклюзивний дистриб\'ютор у Польщі': 'TAYLOR Studwelding Systems Limited — exclusive distributor in Poland',

    /* capabilities */
    'Проєктування та виробництво машин, автоматизація, роботизація': 'Machine design and manufacturing, automation, robotics',
    'Проєктуємо, збираємо і запускаємо': 'We design, build and start it up',
    '— щоб на деталі пішов такт': '— so the part actually hits cycle time',
    'Нам ідеться не про машину в цеху, а про виробництво, яке реально йде. Тому тримаємо проєкт від розбору креслення до серійного пуску — механіка, електрика, програма й навчання в одних руках.': 'It is not about a machine sitting in the hall. It is about production that actually runs. We keep the job from the drawing to series start-up — mechanics, electrics, software and training in one pair of hands.',
    'Нам ідеться про те, щоб у замовника реально пішло виробництво, а не щоб просто стояла машина. Тому ведемо проєкт від розбору креслення до пуску в серію.': 'What matters is that production actually runs — not that a machine simply sits on the floor. We take the job from the drawing through to series start-up.',
    'Як ми працюємо': 'How we work',
    'Від концепції машини до серійного виробництва': 'From machine concept to series production',
    'Пʼять кроків від креслення до серії': 'Five steps from drawing to series',
    'Кожен етап закриваємо самі. Замовник бачить концепцію, погоджує автоматизацію й тестує машину на своїх деталях — ще до того, як вона стане в лінію.': 'We close every stage ourselves. You see the concept, agree the automation and run the machine on your own parts — before it ever joins the line.',
    'Вхідні дані': 'Inputs',
    'Розбираємо деталь, матеріал, тип зʼєднання, потрібну продуктивність і умови роботи.': 'We go through the part, the material, the joint, the output you need and how the station will be used.',
    'Аналіз технічних вихідних даних': 'Analysis of technical inputs',
    'Спочатку розбираємо технічні вимоги замовника: деталь, матеріал, тип зʼєднання, потрібну продуктивність і умови роботи.': 'First we go through your requirements: the part, the material, the joint, the output you need and how the station will be used.',
    'Концепція': 'Concept',
    'Концепція машини': 'Machine concept',
    'Подаємо концепцію на узгодження. Разом фіксуємо обсяг автоматизації та рівень контролю процесу.': 'We put a concept on the table. Together we lock the automation scope and how tightly the process is watched.',
    'На цій основі розробляємо концепцію машини, яку подаємо на узгодження. Разом визначаємо обсяг автоматизації та рівень контролю процесу.': 'On that basis we develop a machine concept for approval. Together we define the automation scope and process-control level.',
    'Документація': 'Documentation',
    'Конструкторська документація': 'Design documentation',
    'Проєкти механіки й електрики, схеми автоматики та керування — з урахуванням усіх зауважень.': 'Mechanical and electrical design, automation and control schematics — with every comment already in.',
    'Після врахування всіх вимог і зауважень замовника виконуємо проєкти механічної та електричної конструкції, проєктуємо схеми автоматики й керування.': 'After all customer requirements and comments, we produce mechanical and electrical designs and automation and control schematics.',
    'Збірка і тести': 'Build and tests',
    'Виготовлення, програмування, тестування': 'Build, programming, testing',
    'Будуємо обладнання, пишемо програму й випробовуємо машину разом із вами на ваших деталях.': 'We build it, write the software and run the machine with you on your parts.',
    'Далі будуємо обладнання, пишемо програму й випробовуємо машину разом із замовником на його деталях.': 'Then we build it, write the software and run the machine with you on your own parts.',
    'Пуск у серію': 'Series start-up',
    'Впровадження та пуск': 'Introduction and start-up',
    'Впровадження, серійний режим і навчання персоналу. Після здачі лишаємось на звʼязку.': 'Introduction, series running and operator training. After handover we stay on the line.',
    'Після позитивної оцінки обладнання готове до впровадження й пуску в режимі серійного виробництва — разом із навчанням персоналу.': 'After a positive assessment the equipment is ready for introduction and start-up in series production — together with operator training.',
    'Комплектуючі беремо в перевірених світових виробників — роботи, автоматика, електроніка, оптика, пневматика, сервоприводи. Якщо замовник просить повний контроль процесу, ставимо вимірювання параметрів, збір даних і моніторинг. Після здачі проєкту залишаємося на звʼязку: онлайн-нагляд за машиною і сервіс.': 'Parts come from proven global suppliers — robots, controls, electronics, optics, pneumatics, servos. If you want full process control, we add measurement, data logging and monitoring. After handover we stay on it: live diagnostics and service.',
    'Сфери компетенцій': 'Capability areas',
    'Чотири напрями': 'Four areas',
    'Чотири напрями, які ми закриваємо власними силами': 'Four areas we cover in-house',
    'Усе, що треба для машини — своїми силами': 'Everything the machine needs — in-house',
    'Конструкція, збірка, автоматика й роботи. Не розкидаємо проєкт між підрядниками — тримаємо його в одному бюро й одному цеху.': 'Design, build, controls and robots. We do not split the job across vendors — it stays in one office and one hall.',
    'Проєктування механіки': 'Mechanical design',
    'Від вихідних даних до виконавчої документації — в Autodesk Inventor Professional і AutoCAD.': 'From the first inputs to as-built drawings — in Autodesk Inventor Professional and AutoCAD.',
    'Підготовка, аналіз і початкова концепція проєкту на основі вихідних даних замовника.': 'Preparation, analysis and initial concept from the customer’s inputs.',
    'Попередні робочі проєкти та калькуляції для замовника.': 'Preliminary working designs and calculations for the customer.',
    'Основне проєктування механічних систем оснастки, обладнання та машин.': 'Main design of mechanical tooling, equipment and machines.',
    'Основне проєктування механічних систем оснастки, обладнання та машин у Autodesk Inventor Professional і AutoCAD.': 'Main design of mechanical tooling, equipment and machines in Autodesk Inventor Professional and AutoCAD.',
    'Комплексний підбір вузлів і комплектуючих для застосування у проєкті.': 'Complete selection of assemblies and components for the project.',
    'Підготовка виконавчої документації та закупівельних переліків для виробництва.': 'As-built documentation and purchasing lists for production.',
    'Технічний нагляд за виробничою фазою проєкту.': 'Technical supervision of the production phase.',
    'Контроль попередніх і кінцевих приймань.': 'Supervision of preliminary and final acceptance.',
    'Підготовка виконавчої та експлуатаційно-технічної документації.': 'As-built and operation & maintenance documentation.',
    'Виробництво машин': 'Machine manufacturing',
    'Від простої оснастки до багатозадачного комплексу — механіка, електрика, пневматика, гідравліка, зір і вимірювання.': 'From simple tooling to a multi-task cell — mechanics, electrics, pneumatics, hydraulics, vision and measurement.',
    'Комплексне виготовлення машин і обладнання за власною або сторонньою технічною документацією.': 'Complete manufacture of machines and equipment to our own or third-party documentation.',
    'Виконання замовлень від проєкту до кінцевого приймання.': 'Orders from design through to final acceptance.',
    'Виготовлення й монтаж — від простих інструментів і пристроїв до багатозадачних промислових машин.': 'Build and assembly — from simple tools and devices to multi-task industrial machines.',
    'Співпраця зі спеціалізованими центрами механічної обробки.': 'Cooperation with specialist machining centres.',
    'Повна реалізація проєктів з боку механіки, електрики, пневматики, гідравліки, сервосистем, а також систем машинного зору та вимірювання.': 'Full project delivery covering mechanics, electrics, pneumatics, hydraulics, servo systems, machine vision and measurement.',
    'Досвід реалізації проєктів у роботизованих конфігураціях.': 'Experience delivering projects in robotic configurations.',
    'Застосування зварювальних систем TECNA.': 'Use of TECNA welding systems.',
    'Широкий інструментальний і машинний парк.': 'A broad tooling and machine park.',
    'Автоматизація виробництва': 'Production automation',
    'Шафи, ПЛК і моніторинг у реальному часі — Siemens, Mitsubishi, Allen-Bradley, B&R. Схеми в WSCAD і EPLAN.': 'Cabinets, PLCs and live monitoring — Siemens, Mitsubishi, Allen-Bradley, B&R. Schematics in WSCAD and EPLAN.',
    'Проєктування електричних установок і систем автоматики на обладнанні провідних виробників: Siemens, Mitsubishi, Allen-Bradley, B&R.': 'Design of electrical installations and automation on equipment from leading makers: Siemens, Mitsubishi, Allen-Bradley, B&R.',
    'Використання спеціалізованого ПЗ, а також WSCAD і EPLAN.': 'Use of specialist software, including WSCAD and EPLAN.',
    'Комплексні рішення у сфері автоматизації процесу.': 'Complete process-automation solutions.',
    'Інтеграція машинних процесів, їх візуалізація та моніторинг у реальному часі на власних розробках і застосунках.': 'Integration of machine processes with real-time visualisation and monitoring on our own developments and apps.',
    'Дистанційний онлайн-моніторинг процесів і роботи обладнання.': 'Remote online monitoring of processes and equipment.',
    'Консультації та сервіс.': 'Consulting and service.',
    'Клітина під деталь: зварювання, завантаження, контроль, пакування й палетизація.': 'A cell around the part: welding, loading, inspection, packing and palletising.',
    'Роботизація робочих місць і виробничих процесів.': 'Robotics of workplaces and production processes.',
    'Проєктування та виготовлення роботизованих комплексів контактного й дугового зварювання.': 'Design and build of robotic cells for resistance and arc welding.',
    'Проєктування та виготовлення комплексів із багатоосьовими роботами для завантаження та розвантаження деталей.': 'Design and build of cells with multi-axis robots for part loading and unloading.',
    'Роботизоване обладнання для пакування та палетизації.': 'Robotic equipment for packing and palletising.',
    'Проєктування зварювальних машин: 3D-модель конструкції': 'Welding-machine design: 3D model of the structure',
    'Конструкторське бюро — механіка, електрика та автоматика в одному місці.': 'Design office — mechanics, electrics and automation in one place.',
    'Виробництво та монтаж машин у цеху SMOLTECH': 'Machine production and assembly in the SMOLTECH hall',
    'Виробництво й монтаж машин — від оснастки до багатозадачних комплексів.': 'Machine production and assembly — from tooling to multi-task cells.',
    'Роботизований зварювальний комплекс SMOLTECH': 'SMOLTECH robotic welding cell',
    'Роботизація — завантаження, зварювання, контроль і палетизація.': 'Robotics — loading, welding, inspection and palletising.',
    'Оператор SMOLTECH при машині з оснасткою до зварювання гайок': 'SMOLTECH operator at a nut-welding fixture',
    'Виробничий цех SMOLTECH: складання зварювальної машини': 'SMOLTECH production hall: assembling a welding machine',
    'Автоматизований комплекс контактного зварювання': 'Automated resistance-welding cell',
    'Комплектуючі та контроль': 'Components and control',
    'Світові вузли. Наш процес. Сервіс після пуску': 'World-class parts. Our process. Service after start-up',
    'Комплектуючі': 'Components',
    'Роботи, автоматика, електроніка, оптика, пневматика й сервоприводи — від перевірених світових виробників. Зварювальні вузли': 'Robots, controls, electronics, optics, pneumatics and servos — from proven global makers. Welding packs from',
    'Якщо потрібен повний контроль — ставимо вимірювання параметрів, збір даних, Poka-Yoke і моніторинг. Так, як чекає автопром.': 'If you need full control, we add parameter measurement, data logging, Poka-Yoke and monitoring. The kind of setup automotive plants expect.',
    'Після здачі': 'After handover',
    'Онлайн-нагляд за машиною і сервіс. Не зникаємо після акту приймання.': 'Live machine diagnostics and service. We do not disappear after the acceptance protocol.',
    'Також проєктуємо й виготовляємо': 'We also design and build',
    'Не лише зварювальний пост': 'Not only the weld station',
    'Коли до зварки треба лінія, оснастка чи шафа — робимо це в тому ж проєкті, під ту саму деталь.': 'When the weld also needs a line, tooling or a cabinet — we do it in the same job, around the same part.',
    'автоматизованих виробничих ліній;': 'automated production lines;',
    'роботизованих комплексів;': 'robotic cells;',
    'промислової оснастки;': 'industrial tooling;',
    'електричних шаф;': 'electrical cabinets;',
    'конструкційних елементів.': 'structural elements.',
    'Автоматизовані виробничі лінії': 'Automated production lines',
    'Роботизовані комплекси': 'Robotic cells',
    'Промислова оснастка': 'Industrial tooling',
    'Електричні шафи': 'Electrical cabinets',
    'Конструкційні елементи': 'Structural elements',
    'Подивитись реалізації': 'See them on film',
    'Роботизація рельєфного зварювання — комплекс виробництва SMOLTECH': 'Robotic projection welding — a SMOLTECH-built cell',

    /* video page */
    'Усі відео': 'All videos',
    'Наші зварювальні комплекси в роботі': 'Our welding cells at work',
    'Оберіть категорію, щоб побачити відповідні реалізації. Відео завантажується з YouTube лише після натискання — сторінка не надсилає жодних запитів до сторонніх сервісів раніше.': 'Choose a category to see matching case studies. The video loads from YouTube only after you click — the page sends no third-party requests before that.',
    'Контроль процесу': 'Process control',
    'Сучасні технології контролю зварювального процесу': 'Modern weld-process control technologies',
    'Ступінь автоматизації процесу, час операції, рівень безпеки, а також обсяг і точність вимірювання параметрів залежать від вимог замовника. Крім контактного зварювання, у межах одного комплексу часто виконуються й інші операції: запресування деталей, калібрування, тест міцності зʼєднання, палетизація або укладання на кінцевій станції.': 'Automation level, cycle time, safety, and the scope and accuracy of parameter measurement depend on the customer’s requirements. Besides resistance welding, one cell often also press-fits parts, calibrates, strength-tests the joint, palletises or places parts at the end station.',
    'Розгорнуті системи детального вимірювання параметрів процесу зварювання зі збором даних.': 'Extended systems for detailed weld-process measurement with data logging.',
    'Контрольні рішення класу Poka-Yoke.': 'Poka-Yoke inspection solutions.',
    'Власні тести контрольних систем Error Proofing.': 'Our own Error Proofing tests of inspection systems.',
    'Системи ідентифікації оснастки та контрольовані рівні доступу.': 'Tooling identification and controlled access levels.',
    'Візуалізація процесу та моніторинг у реальному часі.': 'Process visualisation and real-time monitoring.',
    'Галузі': 'Industries',
    'Виробник зварювальних машин для різних галузей промисловості': 'A welding-machine manufacturer for many industries',
    'Ми проєктуємо й будуємо як окремі автоматичні машини для зварювання металу, так і розгалужені технологічні лінії, адаптовані до специфіки галузі. Як виробник машин контактного зварювання для промисловості ми співпрацюємо із заводами:': 'We design and build both stand-alone automatic metal-welding machines and extensive process lines adapted to the industry. As an industrial resistance-welding manufacturer we work with plants making:',
    'автомобільних компонентів і вузлів;': 'automotive components and assemblies;',
    'сталевих меблів;': 'steel furniture;',
    'зварних огорожних і армувальних сіток;': 'welded fence and reinforcing mesh;',
    'сталевих корпусів і шаф;': 'steel housings and cabinets;',
    'вентиляційних систем та інших металевих виробів у Польщі, Україні та світі.': 'HVAC systems and other metal products in Poland, Ukraine and worldwide.',
    'Автоматизація та роботизація зварювальних процесів — найважливіший напрям нашої діяльності. Ми створюємо спеціалізовані зварювальні комплекси: технічно передове обладнання контактного зварювання, спроєктоване з нуля під конкретне завдання. Кожну машину знято на відео, щоб показати її роботу.': 'Welding automation and robotics are our core activities. We build dedicated welding cells: advanced resistance-welding equipment designed from scratch for a specific task. Every machine is filmed to show it at work.',
    'Найкраща команда професіоналів.': 'The best team of professionals.',
    'Наші партнери:': 'Our partners:',
    'Короткий час заряджання — високий такт на серійних і дрібносерійних роботах.': 'Short charging time — high takt on series and short-run work.',
    'Машини CDM працюють із контактними пістолетами C2 і пістолетами з підняттям LG2. Для комбінації кількох пістолетів — CDM Multi-Gun (до трьох комплектів).': 'CDM machines work with contact guns C2 and lift guns LG2. For a combination of several guns — CDM Multi-Gun (up to three sets).',
    'Зварювання з оснасткою SMOLTECH: мідні електроди, притиск і зварна точка на деталі': 'SMOLTECH fixture welding: copper electrodes, clamp and a weld spot on the part'
  };

  /* video titles + home variants */
  var videos = {
    'Напівавтоматичний комплекс SG-4/2×200/AC для рельєфного зварювання ручок чаші гриля': 'Semi-automatic cell SG-4/2×200/AC for projection welding of grill-bowl handles',
    'комплекс SG-4/2×200/AC для рельєфного зварювання ручок чаші гриля': 'cell SG-4/2×200/AC for projection welding of grill-bowl handles',
    'Інверторна рельєфна машина SG-2/1×25/MF із системою машинного зору': 'Inverter projection machine SG-2/1×25/MF with machine vision',
    'інверторна рельєфна машина SG-2/1×25/MF із системою машинного зору': 'inverter projection machine SG-2/1×25/MF with machine vision',
    'Інверторна рельєфна машина SG-2/1×25/MF із системою зору для зварювання ручки термокружки': 'Inverter projection machine SG-2/1×25/MF with vision for welding a travel-mug handle',
    'Роботизований комплекс SP-8/4×75/AC/R для точкового зварювання сталевих корпусів': 'Robotic cell SP-8/4×75/AC/R for spot welding steel housings',
    'роботизований комплекс SP-8/4×75/AC/R': 'robotic cell SP-8/4×75/AC/R',
    'Роботизований комплекс SP-8/4×75/AC/R для точкового зварювання сталевих корпусів і приварювання штифтів': 'Robotic cell SP-8/4×75/AC/R for spot welding steel housings and welding pins',
    'Інверторна багатоточкова машина SW-51/5×200/MF для панелей огорожі 2D і 3D': 'Inverter multi-spot machine SW-51/5×200/MF for 2D and 3D fence panels',
    'інверторна багатоточкова машина SW-51/5×200/MF': 'inverter multi-spot machine SW-51/5×200/MF',
    'Інверторна багатоточкова машина SW-51/5×200/MF для панелей огорожі 2D і 3D з поворотним столом': 'Inverter multi-spot machine SW-51/5×200/MF for 2D and 3D fence panels with a turntable',
    'Роботизація зварювання — приварювання гайок за допомогою робота': 'Weld robotics — nut welding with a robot',
    'роботизація зварювання — приварювання гайок': 'weld robotics — nut welding',
    'Комплекс ЧПК для приварювання шпильок до стального листа': 'CNC cell for stud welding to steel sheet',
    'комплекс ЧПК для приварювання шпильок': 'CNC cell for stud welding',
    'Роботизований комплекс точкового зварювання сталевих корпусів і приварювання шпильок': 'Robotic cell for spot welding steel housings and stud welding',
    'Автоматична точкова машина з ленточним конвеєром для транспортування деталей': 'Automatic spot welder with a belt conveyor for part transfer',
    'Точкове зварювання кухонних витяжок на столі, що обертається': 'Spot welding of kitchen hoods on a rotary table',
    'Точкове зварювання металевих скринь і приварювання шпильок': 'Spot welding of metal boxes and stud welding',
    'Комплекс монтажу та точкового зварювання елементів системи випуску': 'Cell for assembly and spot welding of exhaust-system parts',
    'Багатоточкова машина MFDC — зварювання кронштейнів і листового металу': 'MFDC multi-spot machine — welding brackets and sheet metal',
    'Універсальна точкова машина зі столом для просторових деталей': 'Universal spot welder with a table for 3D parts',
    'Точкова машина з рухомим робочим столом': 'Spot welder with a moving work table',
    'Машина для зварювання елементів струмової котушки': 'Machine for welding current-coil elements',
    'Запресування та зварювання втулки на штоку амортизатора — версія 2': 'Press-fitting and welding a bush on a damper rod — version 2',
    'Комплекс запресування та зварювання втулки на штоку амортизатора': 'Cell for press-fitting and welding a bush on a damper rod',
    'Різання та брикетування проводів — точкова машина 50 кВА': 'Wire cutting and compacting — 50 kVA spot welder',
    'Рельєфне приварювання ручок до чаші гриля': 'Projection welding of handles to a grill bowl',
    'Приварювання ручки до термокружки з системою машинного зору': 'Welding a handle to a travel mug with machine vision',
    'Приварювання трьох кронштейнів до кільця': 'Welding three brackets to a ring',
    'Напівавтоматична рельєфна машина для стабілізаторів мінометної міни': 'Semi-automatic projection machine for mortar-bomb stabilisers',
    'Рельєфна машина з двома циліндрами 200 кВА': '200 kVA projection welder with two cylinders',
    'Комплекс приварювання локатора на циліндрі амортизатора': 'Cell for welding a locator onto a damper cylinder',
    'Приварювання гайок до кронштейна': 'Welding nuts to a bracket',
    'Рельєфне приварювання гайки до кронштейна автомобільного сидіння': 'Projection welding a nut to a car-seat bracket',
    'Рельєфна машина — приварювання гайок і гравіювання позначень': 'Projection machine — nut welding and marking',
    'Рельєфна машина з поворотною оснасткою — приварювання гайок': 'Projection machine with rotary tooling — nut welding',
    'Рельєфна машина — приварювання болтів і гайок': 'Projection machine — bolt and nut welding',
    'Зварювання болта та корпусу натягувача ременів безпеки': 'Welding a bolt and the housing of a seat-belt pretensioner',
    'Рельєфна машина з оснасткою — зварювання оцинкованого листа': 'Projection machine with tooling — welding galvanised sheet',
    'Рельєфна машина з оснасткою — елементи системи випуску': 'Projection machine with tooling — exhaust-system parts',
    'Рельєфна машина постійного струму — елементи системи випуску': 'DC projection machine — exhaust-system parts',
    'Рельєфна машина з оснасткою — приварювання ніпелів': 'Projection machine with tooling — nipple welding',
    'Рельєфна машина постійного струму — зварювання кожуха підшипника': 'DC projection machine — welding a bearing housing',
    'Інверторна рельєфна машина — приварювання кронштейна до труби': 'Inverter projection machine — welding a bracket to a tube',
    'Зварювання металевих кошиків різних розмірів': 'Welding metal baskets of different sizes',
    'Роботизований комплекс запресування та шовного зварювання денця в трубу': 'Robotic cell for press-fitting and seam welding a bottom into a tube',
    'Автоматична станція запресування та шовного зварювання денця в трубу': 'Automatic station for press-fitting and seam welding a bottom into a tube',
    'Комплекс шовного зварювання денця до циліндра амортизатора': 'Cell for seam welding a bottom to a damper cylinder',
    'Інверторна багатоточкова машина для панелей огорожі 2D і 3D': 'Inverter multi-spot machine for 2D and 3D fence panels',
    'Багатоточкова інверторна машина для зварювання панелей огорожі 2D і 3D': 'Inverter multi-spot machine for welding 2D and 3D fence panels',
    'Машина для огорожних і будівельних сіток із шаблонами та палетизацією': 'Machine for fence and construction mesh with templates and palletising',
    'Багатоточкова машина для зварювання сталевих сіток у шаблонах': 'Multi-spot machine for welding steel mesh in templates',
    'Багатоточкова машина для огорожних сіток із трьома подавачами прутів': 'Multi-spot machine for fence mesh with three wire feeders',
    'Багатоточкова машина постійного струму — зварювання сіток': 'DC multi-spot machine — mesh welding',
    'Багатоточкове зварювання жалюзійних сит': 'Multi-spot welding of louver screens',
    'Автоматична машина ЧПК для приварювання шпильок': 'Automatic CNC machine for stud welding',
    'Дугове приварювання шпильок із автоматичними подавачами': 'Drawn-arc stud welding with automatic feeders',
    'Напівавтоматичне приварювання шпильок до оцинкованого листа': 'Semi-automatic stud welding to galvanised sheet',
    'Запресування тарілки на трубу та приварювання штифта': 'Press-fitting a plate onto a tube and pin welding'
  };
  var vk;
  for (vk in videos) { if (Object.prototype.hasOwnProperty.call(videos, vk)) D[vk] = videos[vk]; }

  var extra = {
    'Підібрати модель': 'Select a model',
    'Підібрати лінію': 'Select a line',
    'Відео реалізацій': 'Installation videos',
    'Машини точкового та рельєфного зварювання металу': 'Spot and projection metal welding machines',
    'У нашому асортименті — сучасні та надійні машини контактного зварювання: точкові стаціонарні, настільні й підвісні для універсального застосування, а також рельєфні машини різної потужності. Міцна конструкція робить їх придатними як для одиничного, так і для промислового виробництва.': 'Our range includes modern, reliable resistance welding machines: stationary, bench and suspended-gun welders for general use, plus projection machines of various ratings. A rigid build makes them suitable for both one-off and industrial production.',
    'Чотири групи машин контактного зварювання': 'Four groups of resistance welding machines',
    'Щоб адаптувати машину під конкретний проєкт, ми проєктуємо та виготовляємо спеціалізовану зварювальну оснастку. Оберіть групу, що відповідає вашому завданню.': 'To adapt a machine to a specific project we design and build dedicated welding tooling. Choose the group that matches your task.',
    'Підвісні кліщові машини точкового зварювання з вбудованим трансформатором': 'Suspended gun spot welders with a built-in transformer',
    'Підвісні кліщові машини з вбудованим трансформатором': 'Suspended gun welders with a built-in transformer',
    'Для зварювання просторових, а також великих і важких деталей, коли використання стаціонарних машин неефективне та неергономічне — шаф, корпусів, кожухів, каналів, подавачів.': 'For welding 3D parts and large, heavy components when stationary machines are inefficient and unergonomic — cabinets, housings, covers, ducts, feeders.',
    'Стаціонарна точкова машина контактного зварювання з педальним і пневматичним притиском': 'Stationary resistance spot welder with pedal and pneumatic squeeze',
    'Точкові машини для листового металу, прута та просторових деталей': 'Spot welders for sheet metal, wire and 3D parts',
    'Серійні стаціонарні точкові машини з педальним кліщовим або пневматичним притиском. Мікропроцесорні контролери, охолоджуваний трансформатор та жорсткий корпус забезпечують стабільну якість.': 'Standard stationary spot welders with pedal-gun or pneumatic squeeze. Microprocessor controllers, a cooled transformer and a rigid frame deliver stable quality.',
    'Точково-рельєфні машини контактного зварювання з лінійним притиском': 'Spot-projection resistance welders with linear squeeze',
    'Точково-рельєфні машини з лінійним притиском': 'Spot-projection machines with linear squeeze',
    'Для зʼєднання деталей із технологічними виступами. Зварювання в техніках AC, DC або MFDC, Т-подібні плити для монтажу оснастки та максимальна точність притиску по осі приводу.': 'For joining parts with process projections. Welding in AC, DC or MFDC, T-slot platens for tooling and maximum squeeze accuracy on the cylinder axis.',
    'Багатофункціональні інверторні машини E-tech для точкового зварювання кузовних деталей': 'E-tech multifunction inverter machines for spot welding body parts',
    'Серія E-tech': 'E-tech series',
    'Багатофункціональні інверторні машини для листа та просторових деталей': 'Multifunction inverter machines for sheet and 3D parts',
    'Нова група інверторних машин для складальних і сервісних ліній — зокрема для точкового зварювання кузовних деталей автомобілів. Контролер TE760 із памʼяттю на 150 технологій.': 'A new group of inverter machines for assembly and service lines — including spot welding of car-body parts. TE760 controller with memory for 150 weld schedules.',
    'Італійські машини контактного зварювання TECNA S.p.A.': 'Italian TECNA S.p.A. resistance welding machines',
    'Машини, які ми пропонуємо, походять від італійського бренду TECNA S.p.A. — одного з найбільших у Європі виробників машин контактного зварювання та зварювальних вузлів. Це міцні й надійні машини з мікропроцесорним контролером параметрів зварювання, водяним охолодженням і безмастильними пневматичними елементами.': 'The machines we offer come from the Italian brand TECNA S.p.A. — one of Europe’s largest makers of resistance welding machines and welding assemblies. They are robust and reliable, with microprocessor weld-parameter control, water cooling and oil-free pneumatics.',
    'Завдяки великій різноманітності конструкцій, а також конфігурацій потужності трансформатора й сили притиску ми можемо підібрати відповідну машину під будь-яке завдання.': 'A wide range of designs, transformer ratings and squeeze forces lets us match a machine to almost any task.',
    'Машини точкового зварювання': 'Spot welding machines',
    'Наші машини контактного зварювання призначені для точних і повторюваних технологічних процесів у виробничих та промислових умовах. Кожна машина точкового зварювання підбирається індивідуально — за параметрами, типом матеріалу та вимогами до продуктивності. Широкий діапазон конфігурацій дозволяє адаптувати обладнання і до одиничної обробки, і до багатосерійної роботи.': 'Our resistance welding machines are built for precise, repeatable processes in production and industrial conditions. Each spot welder is selected individually — by parameters, material type and output requirements. A wide configuration range covers both one-off work and high-volume production.',
    'Точкове зварювання нержавіючої сталі вимагає точного керування енергією та належного охолодження робочого контуру — через властивості матеріалу й високу теплопровідність елементів. Тому машини для зварювання автомобільного листа, кузовних деталей, труб, дроту й прута оснащуються сучасними контролерами параметрів зварювання, системами водяного охолодження та довговічними компонентами для інтенсивної промислової експлуатації.': 'Spot welding stainless steel needs precise energy control and proper cooling of the secondary circuit — because of the material properties and high thermal conductivity. Machines for automotive sheet, body parts, tubes, wire and rod therefore have modern weld controllers, water cooling and durable components for intensive industrial use.',
    'Рельєфні машини': 'Projection machines',
    'Рельєфні машини призначені для процесів, що вимагають високої повторюваності та стабільних параметрів зварювання. Обладнання цього типу застосовують там, де потрібно виконувати міцні зʼєднання зі збереженням високої продуктивності. Машини можуть комплектуватися спеціальною технологічною оснасткою, спроєктованою під конкретну деталь і виробничий процес.': 'Projection machines are for processes that need high repeatability and stable weld parameters. This equipment is used where strong joints must be made at high output. Machines can be fitted with dedicated process tooling designed for a specific part and production process.',
    'Техніки зварювання': 'Welding techniques',
    'AC': 'AC',
    '— змінний струм 50 Гц: універсальне й економічне рішення для сталі.': '— 50 Hz alternating current: a universal, economical solution for steel.',
    'DC': 'DC',
    '— постійний струм: масивні багатовиступні деталі, кільцеві герметичні виступи, алюміній, мідь, латунь.': '— direct current: heavy multi-projection parts, annular leak-tight projections, aluminium, copper, brass.',
    'MFDC': 'MFDC',
    '— інверторне зварювання середньої частоти (напр. 1000 Гц): найвища точність, енергоефективність, довший ресурс електродів.': '— medium-frequency inverter welding (e.g. 1000 Hz): highest precision, energy efficiency, longer electrode life.',
    'Матеріали': 'Materials',
    'Усі типи сталей, у тому числі з гальванічними покриттями, нержавіючі та покриті сталі, кольорові метали, а також різнорідні пари матеріалів. Можлива реалізація суміжних процесів — наприклад пайко-зварювання або брикетування мідних жил.': 'All steel types, including galvanised, stainless and coated steels, non-ferrous metals, and dissimilar pairs. Related processes are also possible — e.g. braze-welding or compacting copper strands.',
    'Потрібна оснастка?': 'Need tooling?',
    'Ми проєктуємо та виготовляємо технологічну оснастку під конкретну деталь — із ручними або повністю автоматичними системами базування й фіксації.': 'We design and manufacture process tooling for a specific part — with manual or fully automatic locating and clamping.',
    'Чому варто обрати нас': 'Why SMOLTECH',
    'Машина — це ще не все. Важливий увесь процес': 'The machine is only part of it. The process around it matters',
    'Придбання точкової або рельєфної машини — це не лише вибір обладнання, а рішення щодо технології, оснастки, пуску та подальшого обслуговування робочого місця. Ми поєднуємо компетенції конструкторського бюро, виробництва машин, автоматики, роботизації та сервісу — тому ведемо проєкт від аналізу деталі й технічних вимог до впровадження обладнання в роботу.': 'Buying a spot or projection machine is not only choosing equipment — it is a decision about process, tooling, start-up and ongoing workplace support. We combine a design office, machine building, automation, robotics and service — so we take the project from part analysis and technical requirements through to equipment running in production.',
    'Багаторічний досвід як виробника машин точкового зварювання та постачальника рішень для багатьох галузей.': 'Many years as a spot-welding machine manufacturer and solution supplier for many industries.',
    'Власний конструкторський відділ, який розробляє обладнання під конкретний технологічний процес.': 'An in-house design department that develops equipment for a specific process.',
    'Проєктування й виготовлення спеціальної зварювальної оснастки під визначену деталь.': 'Design and manufacture of special welding tooling for a defined part.',
    'Можливість інтеграції обладнання з промисловою автоматикою та роботизованими комплексами.': 'The option to integrate equipment with industrial automation and robotic cells.',
    'Підбір параметрів роботи на основі реальних вимог робочого місця.': 'Operating parameters selected from the real requirements of the workplace.',
    'Конфігурація обладнання під тип матеріалу, геометрію деталі та потрібну продуктивність.': 'Equipment configured for material type, part geometry and required output.',
    'Технічна підтримка на етапі проєкту, пуску та впровадження.': 'Technical support during design, start-up and introduction.',
    'Реалізація як окремих машин, так і повних технологічних комплексів.': 'Delivery of both stand-alone machines and complete process cells.',
    'Підбір машини контактного зварювання': 'Selecting a resistance welding machine',
    'Яку потужність машини вибрати?': 'What machine rating should I choose?',
    'Потужність трансформатора підбирається під матеріал, товщину та кількість одночасно зварюваних точок. Для тонкого стального листа й одиничних точок зазвичай достатньо 16–25 кВА, для рельєфного зварювання гайок і кронштейнів — 35–200 кВА, для масивних багатовиступних деталей і кільцевих герметичних виступів — до 315 кВА. Точний підбір ми робимо на основі креслення деталі та потрібного такту.': 'Transformer rating is matched to material, thickness and the number of spots welded at once. Thin steel sheet and single spots usually need 16–25 kVA; projection welding of nuts and brackets 35–200 kVA; heavy multi-projection parts and annular leak-tight projections up to 315 kVA. We size it from the part drawing and required cycle time.',
    'Чим відрізняється педальний притиск від пневматичного?': 'How does pedal squeeze differ from pneumatic?',
    'Педальний (кліщовий) притиск створюється оператором через важіль — це просте й недороге рішення для одиничних робіт і невеликих серій. Пневматичний притиск забезпечує повторювану, точно задану силу стиснення та стабільний час зварювання, тому потрібен для серійного виробництва й для зʼєднань, які підлягають контролю якості.': 'Pedal (gun) squeeze is applied by the operator through a lever — a simple, low-cost solution for one-off work and small batches. Pneumatic squeeze gives a repeatable, set force and a stable weld time, so it is needed for series production and for joints under quality control.',
    'Чи можна зварювати алюміній контактним зварюванням?': 'Can aluminium be resistance-welded?',
    'Так, але це вимагає високої щільності струму за дуже короткий час і точного керування процесом. Найкращі результати дають машини постійного струму та інверторні MFDC. Для алюмінію, його зварюваних сплавів, міді й латуні ми рекомендуємо саме ці технології.': 'Yes, but it needs high current density in a very short time and precise process control. DC and MFDC inverter machines give the best results. For aluminium, its weldable alloys, copper and brass we recommend these technologies.',
    'Ви постачаєте електроди та запасні частини?': 'Do you supply electrodes and spare parts?',
    'Так. Ми постачаємо електроди для контактного зварювання, тримачі електродів, пневматичні приводи, балансири, зварювальні трансформатори, системи керування та холодильні агрегати. Напишіть нам модель обладнання — підберемо відповідні компоненти.': 'Yes. We supply resistance-welding electrodes, electrode holders, pneumatic actuators, balancers, welding transformers, control systems and chillers. Tell us the equipment model — we will match the components.',
    'Автоматизація та роботизація': 'Automation and robotics',
    'Автоматизовані та роботизовані зварювальні комплекси на замовлення': 'Custom automated and robotic welding cells',
    'У межах найважливішого напряму нашої діяльності — автоматизації та роботизації зварювальних процесів — ми створюємо спеціалізовані зварювальні комплекси. Це технічно передове обладнання контактного зварювання, спроєктоване з нуля для виконання конкретних завдань.': 'In our core activity — automation and robotics of welding — we build dedicated welding cells. This is advanced resistance-welding equipment designed from scratch for specific tasks.',
    'Що ми будуємо': 'What we build',
    'Від одного посту до цілої технологічної лінії': 'From a single station to a complete process line',
    'базові точкові та рельєфні машини': 'standard spot and projection machines',
    'Крім машин на замовлення, ми пропонуємо також': 'Besides custom machines we also offer',
    'Кожен спеціалізований комплекс проєктується під конкретну деталь, такт і рівень контролю процесу.': 'Each dedicated cell is designed for a specific part, cycle time and process-control level.',
    'Роботизований комплекс зварювання сталевих корпусів': 'Robotic cell for welding steel housings',
    'Роботизовані зварювальні пости': 'Robotic welding stations',
    'Багатоосьові роботи для завантаження та розвантаження деталей, переміщення між станціями, зварювання й палетизації. Системи машинного зору для розпізнавання положення деталі.': 'Multi-axis robots for loading and unloading parts, transfer between stations, welding and palletising. Machine-vision systems to recognise part position.',
    'Автоматика': 'Automation',
    'Автоматична точкова машина з подавачем деталей': 'Automatic spot welder with a part feeder',
    'Автоматичні машини з подачею деталей': 'Automatic machines with part feeding',
    'Вібраційні та лоткові подавачі гайок, болтів і прутів, ленточні конвеєри транспортування й розвантаження, поворотні столи з кількома робочими станціями.': 'Vibratory and bowl feeders for nuts, bolts and wires, belt conveyors for transfer and unloading, turntables with several work stations.',
    'Роботизація рельєфного зварювання': 'Robotic projection welding',
    'Комплекси рельєфного зварювання': 'Projection welding cells',
    'Приварювання гайок, болтів, кронштейнів і ніпелів у кілька точок одночасно — із автоматичною подачею елементів та контролем наявності кожного зʼєднання.': 'Welding nuts, bolts, brackets and nipples at several spots at once — with automatic feeding and presence checks on every joint.',
    'Машина зі системою машинного зору для зварювання ручки кружки': 'Machine with vision for welding a mug handle',
    'Машинний зір': 'Machine vision',
    'Комплекси з системою машинного зору': 'Cells with machine vision',
    'Автоматичне розпізнавання місця зварювання та орієнтації деталі — там, де геометрія або положення елемента не є повторюваними.': 'Automatic recognition of the weld location and part orientation — where geometry or position is not repeatable.',
    'Напівавтоматичний комплекс приварювання ручок до чаші гриля': 'Semi-automatic cell for welding handles to a grill bowl',
    'Напівавтомат': 'Semi-automatic',
    'Напівавтоматичні пости': 'Semi-automatic stations',
    'Ручне завантаження деталі й автоматичний цикл зварювання — оптимальне рішення там, де повна автоматизація подачі економічно невиправдана.': 'Manual part loading and an automatic weld cycle — the right solution where fully automatic feeding is not economical.',
    'Рельєфне зварювання стабілізаторів мінометної міни': 'Projection welding of mortar-bomb stabilisers',
    'Повні технологічні лінії': 'Complete process lines',
    'Вимірювання та дані': 'Measurement and data',
    'Ідентифікація та доступ': 'Identification and access',
    'Онлайн-моніторинг': 'Online monitoring',
    'Безпека': 'Safety',
    'Процедура проєкту': 'Project procedure',
    'Як ми ведемо проєкт автоматизації': 'How we run an automation project',
    'Аналіз вихідних даних': 'Input-data analysis',
    'Деталь, матеріал, тип зʼєднання, потрібний такт, умови роботи та обсяг контролю.': 'Part, material, joint type, required cycle time, working conditions and inspection scope.',
    'Концепція та узгодження': 'Concept and approval',
    'Розробляємо концепцію машини й подаємо її на узгодження. Разом визначаємо обсяг автоматизації.': 'We develop a machine concept and submit it for approval. Together we define the automation scope.',
    'Конструкція та автоматика': 'Design and controls',
    'Проєкти механіки й електрики в Autodesk Inventor, AutoCAD, WSCAD і EPLAN. Автоматика Siemens, Mitsubishi, Allen-Bradley, B&R.': 'Mechanical and electrical designs in Autodesk Inventor, AutoCAD, WSCAD and EPLAN. Automation from Siemens, Mitsubishi, Allen-Bradley, B&R.',
    'Виготовлення й тести': 'Build and tests',
    'Будуємо обладнання, пишемо ПЗ і тестуємо машину разом із замовником на реальних деталях.': 'We build the equipment, write the software and test the machine with the customer on real parts.',
    'Пуск і сервіс': 'Start-up and service',
    'Впровадження в серійне виробництво, навчання персоналу, сервісна підтримка та онлайн-моніторинг.': 'Introduction into series production, operator training, service support and online monitoring.',
    'Автоматизація зварювання — питання замовників': 'Welding automation — customer questions',
    'Що потрібно, щоб ви підготували концепцію?': 'What do you need to prepare a concept?',
    'Чи ви інтегруєте обладнання з нашою існуючою лінією?': 'Can you integrate equipment with our existing line?',
    'Чи можливий дистанційний сервіс?': 'Is remote service possible?',
    'Ви працюєте з клієнтами з України?': 'Do you work with customers in Ukraine?',
    'Машини для зварювання сіток — точкові та багатоточкові': 'Mesh welding machines — spot and multi-spot',
    'Ми проєктуємо й будуємо машини для зварювання сіток, а також повні автоматичні лінії для їх виробництва. Наші машини створюються під конкретний виріб і продуктивність — від окремих постів до розгалужених ліній з автоматичною подачею прутів і відбором готових виробів.': 'We design and build mesh welding machines and complete automatic lines for their production. Our machines are made for a specific product and output — from single stations to extensive lines with automatic wire feed and finished-product take-off.',
    'Точкові та багатоточкові машини для сіток': 'Spot and multi-spot mesh machines',
    'Автоматизація та побудова машин': 'Automation and machine design',
    'Що виробляють на наших машинах': 'What is made on our machines',
    'Типові параметри': 'Typical parameters',
    'Приклади машин і ліній для сіток': 'Examples of mesh machines and lines',
    'Машини для сіток нашого виробництва': 'Mesh machines of our manufacture',
    'З чого починається підбір': 'Where selection starts',
    'Точкова чи багатоточкова машина?': 'Spot or multi-spot machine?',
    'Які розміри панелей і діаметри прутів можливі?': 'What panel sizes and wire diameters are possible?',
    'Чи можлива автоматична подача прутів і палетизація?': 'Is automatic wire feed and palletising possible?',
    'Обладнання для приварювання шпильок і штифтів': 'Equipment for welding studs and pins',
    'Три групи рішень для приварювання шпильок': 'Three groups of stud-welding solutions',
    'CDM — конденсаторне приварювання шпильок від Ø2 до Ø10': 'CDM — capacitor discharge stud welding from Ø2 to Ø10',
    'DA — інверторне приварювання шпильок від Ø3 до Ø16': 'DA — inverter stud welding from Ø3 to Ø16',
    'Комплекси ЧПК для автоматичного приварювання шпильок': 'CNC cells for automatic stud welding',
    'Порівняння технологій': 'Technology comparison',
    'Конденсаторна чи дугова технологія?': 'Capacitor discharge or drawn arc?',
    'Ремонт і сервіс обладнання': 'Equipment repair and service',
    'Ставте на перевірене обладнання': 'Choose proven equipment',
    'Критерій': 'Criterion',
    'CDM (конденсаторна)': 'CDM (capacitor discharge)',
    'DA (дугова інверторна)': 'DA (drawn-arc inverter)',
    'Діаметр шпильки': 'Stud diameter',
    'Час розряду / циклу': 'Discharge / cycle time',
    'Основний матеріал': 'Parent material',
    'тонкий, плоский і чистий': 'thin, flat and clean',
    'також товстіший матеріал': 'thicker material as well',
    'Слід на зворотному боці': 'Mark on the reverse side',
    'мінімальний': 'minimal',
    'помітніший': 'more visible',
    'Продуктивність': 'Output',
    'до 50 шпильок/хв': 'up to 50 studs/min',
    'до 20–30 шпильок/хв': 'up to 20–30 studs/min',
    'сталь, нержавіюча сталь, алюміній, латунь': 'steel, stainless steel, aluminium, brass',
    'мʼяка та нержавіюча сталь, алюміній': 'mild and stainless steel, aluminium',
    'Діаметр шпильок': 'Stud diameter',
    'Приварюваний матеріал': 'Weldable material',
    'Швидкість приварювання': 'Welding rate',
    'Максимальна потужність': 'Maximum power',
    'Струм зварювання': 'Welding current',
    'Час циклу': 'Cycle time',
    'Джерело живлення': 'Power source',
    'Трансформатор': 'Transformer',
    'Мережеве живлення': 'Mains supply',
    'Зовнішній запобіжник': 'External fuse',
    'Клас захисту': 'Protection class',
    'Розміри': 'Dimensions',
    'Маса': 'Mass',
    'Охолодження': 'Cooling',
    'Вентилятор': 'Fan',
    'Застосовувані пістолети': 'Applicable guns',
    'Ємність': 'Capacitance',
    'Електролітичні конденсатори': 'Electrolytic capacitors',
    'Вихідна напруга': 'Output voltage',
    'Контактний C2; з підняттям LG2; міні-контакт, мікро-контакт': 'Contact C2; lift LG2; mini-contact, micro-contact',
    'Мʼяка сталь, нержавіюча сталь, алюміній': 'Mild steel, stainless steel, aluminium',
    'Сталь (низьковуглецева або високолегована), алюміній, вибрані сплави міді': 'Steel (low-carbon or high-alloy), aluminium, selected copper alloys',
    'До 50 шпильок за хвилину (залежно від їх розміру та діаметра)': 'Up to 50 studs per minute (depending on size and diameter)',
    'до 20 шпильок/хв': 'up to 20 studs/min',
    'до 30 шпильок/хв': 'up to 30 studs/min',
    'Напруга живлення / частота': 'Supply voltage / frequency',
    'Інерційний захист': 'Slow-blow protection',
    'Номінальна потужність (ED 50%)': 'Rated power (50% duty)',
    'Макс. потужність зварювання': 'Max. welding power',
    'Макс. вторинний струм короткого замикання': 'Max. secondary short-circuit current',
    'Час зварювання': 'Weld time',
    'Ступінь захисту': 'Ingress protection',
    'Номінальна потужність 50%, кВА': 'Rated power 50%, kVA',
    'Максимальна потужність, кВА': 'Maximum power, kVA',
    'Вторинна напруга, В': 'Secondary voltage, V',
    'Макс. струм короткого замикання, кА': 'Max. short-circuit current, kA',
    'Макс. струм зварювання сталі, кА': 'Max. steel welding current, kA',
    'Напруга / частота, В / Гц': 'Voltage / frequency, V / Hz',
    'Інерційні запобіжники 400 В, А': 'Slow-blow fuses 400 V, A',
    'Перетин кабелів живлення L=10 м / L=30 м, мм²': 'Supply cable cross-section L=10 m / L=30 m, mm²',
    'Клас ізоляції': 'Insulation class',
    'Мін. виліт плечей L, мм': 'Min. arm reach L, mm',
    'Макс. сила притиску для L=min, даН': 'Max. squeeze force at L=min, daN',
    'Хід електрода для L=min, мм': 'Electrode stroke at L=min, mm',
    'Макс. виліт плечей L, мм': 'Max. arm reach L, mm',
    'Макс. сила притиску для L=max, даН': 'Max. squeeze force at L=max, daN',
    'Хід електрода для L=max, мм': 'Electrode stroke at L=max, mm',
    'Струм КЗ для макс. вилету, кА': 'Short-circuit current at max. reach, kA',
    'Водяне охолодження, л/хв': 'Water cooling, l/min',
    'Мін. тиск води, бар': 'Min. water pressure, bar',
    'Маса, кг': 'Mass, kg',
    'Ø плечей, мм': 'Ø of arms, mm',
    'Ø тримача електрода, мм': 'Ø of electrode holder, mm',
    'Ø гнізда електрода BS, мм': 'Ø of electrode socket BS, mm',
    'Необхідний тиск повітря, бар': 'Required air pressure, bar',
    'Витрата повітря / 100 зʼєднань, Нм³': 'Air consumption / 100 joints, Nm³',
    'Перетин кабелів живлення L=30 м, мм²': 'Supply cable cross-section L=30 m, mm²',
    'Тиск повітря мін./макс., бар': 'Air pressure min./max., bar',
    'Витрата повітря / 1000 зʼєднань, Нм³': 'Air consumption / 1000 joints, Nm³',
    'Тиск води мін./макс., бар': 'Water pressure min./max., bar',
    'педальний': 'pedal',
    'пневматичний': 'pneumatic',
    'Притиск': 'Squeeze',
    'Ергономіка': 'Ergonomics',
    'Правова інформація': 'Legal information',
    'Дата останнього оновлення: 24 серпня 2026 р.': 'Last updated: 24 August 2026',
    '1. Адміністратор персональних даних': '1. Personal data controller',
    '2. Які дані ми обробляємо': '2. What data we process',
    '3. Мета та правова підстава обробки': '3. Purpose and legal basis of processing',
    '4. Термін зберігання даних': '4. Data retention period',
    '5. Одержувачі даних': '5. Data recipients',
    '6. Передавання даних за межі ЄЕЗ': '6. Transfers outside the EEA',
    '7. Ваші права': '7. Your rights',
    '8. Файли cookie та вбудовані сервіси': '8. Cookies and embedded services',
    '9. Безпека': '9. Security',
    '10. Зміни політики': '10. Policy changes',
    'імʼя та прізвище;': 'first and last name;',
    'назва компанії (необовʼязково);': 'company name (optional);',
    'адреса електронної пошти;': 'e-mail address;',
    'номер телефону (необовʼязково);': 'phone number (optional);',
    'зміст запиту та технічна інформація, яку ви в ньому наводите.': 'the content of the enquiry and any technical information you include.',
    'Адміністратором ваших персональних даних є': 'The controller of your personal data is',
    'У справах, пов\'язаних з обробкою персональних даних, звертайтеся на адресу': 'For matters related to personal-data processing, contact',
    'або за телефоном': 'or by phone',
    'Ми обробляємо лише ті дані, які ви добровільно надаєте нам через контактну форму, електронною поштою або телефоном:': 'We process only data you voluntarily give us via the contact form, e-mail or telephone:',
    'Крім цього, наш сервер автоматично записує технічні дані відвідування: IP-адресу, тип браузера, дату й час запиту та адресу сторінки. Ці дані використовуються виключно для забезпечення безпеки та стабільності сайту.': 'In addition, our server automatically records technical visit data: IP address, browser type, date and time of the request and page address. This data is used solely to keep the site secure and stable.',
    'Відповідь на запит і ведення переговорів': 'Responding to an enquiry and conducting negotiations',
    '— на підставі вашої згоди (ст. 6 п. 1 літ. a GDPR) та в межах виконання дій, необхідних для укладення договору (ст. 6 п. 1 літ. b GDPR).': '— based on your consent (Art. 6(1)(a) GDPR) and as steps needed to enter into a contract (Art. 6(1)(b) GDPR).',
    'Виконання договору та гарантійні зобовʼязання': 'Contract performance and warranty obligations',
    'Виконання правових обовʼязків': 'Compliance with legal obligations',
    ', у тому числі податкових і бухгалтерських — ст. 6 п. 1 літ. c GDPR.': ', including tax and accounting duties — Art. 6(1)(c) GDPR.',
    'Безпека сайту та захист від зловживань': 'Site security and protection against abuse',
    ', а також можливий захист від претензій — обґрунтований інтерес адміністратора, ст. 6 п. 1 літ. f GDPR.': ', and possible defence against claims — the controller’s legitimate interest, Art. 6(1)(f) GDPR.',
    'Дані з контактної форми ми зберігаємо протягом часу, необхідного для відповіді на запит і подальшого ведення справи, а після її завершення — не довше 3 років, якщо довший термін не вимагається законом (наприклад щодо бухгалтерської документації) або не потрібен для захисту від претензій. Технічні журнали сервера зберігаються не довше 12 місяців.': 'Contact-form data is kept for as long as needed to answer the enquiry and continue the matter, and after it ends — no longer than 3 years, unless a longer period is required by law (e.g. accounting records) or needed to defend against claims. Server technical logs are kept no longer than 12 months.',
    'Ваші дані можуть бути передані субʼєктам, які обслуговують нашу інфраструктуру та діяльність, виключно в обсязі, потрібному для надання послуги:': 'Your data may be passed to parties that support our infrastructure and operations, solely to the extent needed to provide the service:',
    'постачальнику хостингу та електронної пошти;': 'the hosting and e-mail provider;',
    'постачальникам ІТ- та бухгалтерських послуг;': 'IT and accounting service providers;',
    'субʼєктам групи': 'entities in the',
    '— якщо запит стосується спільно реалізованого проєкту;': 'group — if the enquiry concerns a jointly delivered project;',
    'органам державної влади — якщо це вимагається законом.': 'public authorities — if required by law.',
    'Ми не продаємо й не передаємо ваші дані третім особам для маркетингових цілей.': 'We do not sell or pass your data to third parties for marketing.',
    'Ми не передаємо персональних даних за межі Європейського економічного простору. Виняток може становити технічна передача, що виникає з користування вбудованими сервісами (див. розділ 8), яка відбувається на підставі механізмів, передбачених GDPR.': 'We do not transfer personal data outside the European Economic Area. An exception may be a technical transfer arising from embedded services (see section 8), based on GDPR mechanisms.',
    'право доступу до своїх даних та отримання їх копії;': 'the right of access to your data and to obtain a copy;',
    'право на виправлення (уточнення) даних;': 'the right to rectification of data;',
    'право на видалення даних («право бути забутим»);': 'the right to erasure (“right to be forgotten”);',
    'право на обмеження обробки;': 'the right to restriction of processing;',
    'право на перенесення даних;': 'the right to data portability;',
    'право заперечити проти обробки, що ґрунтується на обґрунтованому інтересі;': 'the right to object to processing based on legitimate interest;',
    'право відкликати згоду в будь-який момент — без впливу на законність обробки, здійсненої до її відкликання;': 'the right to withdraw consent at any time — without affecting the lawfulness of processing before withdrawal;',
    'право подати скаргу до наглядового органу — у Польщі це Голова Управління з питань захисту персональних даних (Prezes UODO), ul. Stawki 2, 00-193 Warszawa.': 'the right to lodge a complaint with a supervisory authority — in Poland the President of the Personal Data Protection Office (Prezes UODO), ul. Stawki 2, 00-193 Warsaw.',
    'Надання даних є добровільним, однак необхідним для відповіді на запит. Ми не приймаємо рішень щодо вас на підставі автоматизованого профілювання.': 'Providing data is voluntary but necessary to answer an enquiry. We do not make decisions about you based on automated profiling.',
    'Цей сайт': 'This site',
    'не використовує маркетингових або аналітичних файлів cookie': 'does not use marketing or analytics cookies',
    'і не встановлює трекерів сторонніх постачальників під час звичайного перегляду сторінок.': 'and does not set third-party trackers during ordinary page browsing.',
    'Ми свідомо звели зовнішні запити до мінімуму:': 'We have deliberately kept external requests to a minimum:',
    'Відео YouTube': 'YouTube videos',
    '— мініатюри розміщені на нашому сервері. Плеєр YouTube (у режимі': '— thumbnails are hosted on our server. The YouTube player (in',
    'режимі) завантажується лише після того, як ви натиснете кнопку відтворення. Лише тоді Google може встановити власні файли cookie — згідно з': ') loads only after you press play. Only then may Google set its own cookies — according to',
    'політикою конфіденційності Google': 'Google’s privacy policy',
    'Карта Google Maps': 'Google Maps',
    'Карта': 'Map',
    'на сторінці «Контакти» — вбудована карта Google Maps. Якщо ви не хочете взаємодіяти з картою, скористайтеся адресою, наведеною текстом.': 'on the Contact page — an embedded Google Maps map. If you do not want to interact with the map, use the address given as text.',
    'Карта на сторінці «Контакти» — вбудована карта Google Maps. Якщо ви не хочете взаємодіяти з картою, скористайтеся адресою, наведеною текстом.': 'Map on the Contact page — an embedded Google Maps map. If you do not want to interact with the map, use the address given as text.',
    'Шрифти': 'Fonts',
    'розміщені на нашому сервері — жодних запитів до зовнішніх постачальників шрифтів не виконується.': 'are hosted on our server — no requests are made to external font providers.',
    'Налаштування файлів cookie можна змінити в будь-який момент у налаштуваннях вашого браузера.': 'Cookie settings can be changed at any time in your browser.',
    'Звʼязок із сайтом шифрується протоколом HTTPS. Ми застосовуємо технічні й організаційні заходи, що відповідають рівню ризику, зокрема обмежений доступ до даних лише для уповноважених осіб.': 'Communication with the site is encrypted with HTTPS. We apply technical and organisational measures matching the risk, including access to data limited to authorised persons.',
    'Ми можемо оновлювати цю політику, наприклад у звʼязку зі зміною законодавства або обсягу послуг. Актуальна версія завжди доступна на цій сторінці разом із датою останнього оновлення.': 'We may update this policy, for example when the law or the scope of services changes. The current version is always available on this page with the date of the last update.',
    'Стаціонарні точкові машини контактного зварювання 16–25 кВА': 'Stationary resistance spot welders 16–25 kVA',
    'Точкові машини для зварювання плоского листа, прута навхрест і просторових деталей': 'Spot welders for flat sheet, crossed wire and 3D parts',
    'Підвісні кліщові машини точкового зварювання з вбудованим трансформатором, 2,5–90 кВА': 'Suspended gun spot welders with a built-in transformer, 2.5–90 kVA',
    'Інверторні багатофункціональні машини для точкового зварювання листа та просторових деталей': 'Inverter multifunction machines for spot welding sheet and 3D parts',
    'Точково-рельєфні машини з лінійним притиском для деталей із виступами': 'Spot-projection machines with linear squeeze for parts with projections',
    'CDM — пристрої для конденсаторного приварювання шпильок від Ø2 до Ø10': 'CDM — capacitor discharge stud welding units from Ø2 to Ø10',
    'Інверторні пристрої i12 та i16 для приварювання шпильок від Ø3 до Ø16': 'Inverter units i12 and i16 for stud welding from Ø3 to Ø16',
    'Що дає машина ЧПК SMOLTECH': 'What a SMOLTECH CNC machine gives you',
    'Розмір деталі': 'Part size',
    'Головки та подавачі': 'Heads and feeders',
    'Робота з роботами': 'Working with robots',
    'Приклади комплексів нашого виробництва': 'Examples of cells of our manufacture',
    'Комплекси ЧПК у нашому цеху': 'CNC cells in our hall',
    'Повністю автоматизована машина ЧПК': 'Fully automated CNC machine',
    'Компоненти для автоматизації': 'Automation components',
    'Джерела струму': 'Power sources',
    'Можливості': 'Capabilities',
    'Оснащення пристроїв i12 та i16': 'Features of i12 and i16 units',
    'Моделі i12 та i16': 'Models i12 and i16',
    'Що дає конденсаторна технологія': 'What capacitor-discharge technology gives you',
    'Моделі CDM8, CDM9 і CDM10': 'Models CDM8, CDM9 and CDM10',
    'Автоматизація на базі CDM': 'Automation based on CDM',
    'Потрібні більші діаметри?': 'Need larger diameters?',
    'Властивості машин E-tech': 'E-tech machine features',
    'Контролер TE760': 'TE760 controller',
    'Властивості мікропроцесорного контролера': 'Microprocessor controller features',
    'Моделі 3660 E-tech і 3670 E-tech': 'Models 3660 E-tech and 3670 E-tech',
    'Подивіться машину в роботі': 'See the machine at work',
    'Застосування': 'Applications',
    'Оснащення': 'Equipment',
    'Шість груп точково-рельєфних машин': 'Six groups of spot-projection machines',
    'Точково-рельєфні машини змінного струму, 35–80 кВА': 'AC spot-projection machines, 35–80 kVA',
    'Енергоефективні інверторні машини потужністю 56 кВА': 'Energy-efficient inverter machines rated 56 kVA',
    'Інверторні точково-рельєфні машини, 90–200 кВА': 'Inverter spot-projection machines, 90–200 kVA',
    'Точково-рельєфні машини змінного струму, 63–163 кВА': 'AC spot-projection machines, 63–163 kVA',
    'Рельєфні машини змінного струму, 80–315 кВА': 'AC projection machines, 80–315 kVA',
    'Точково-рельєфні машини постійного струму, 100 кВА': 'DC spot-projection machines, 100 kVA',
    'Конструкція': 'Design',
    'Що дає лінійний притиск': 'What linear squeeze gives you',
    'Модульність': 'Modularity',
    'Циліндри': 'Cylinders',
    'Пневматика': 'Pneumatics',
    'Точність': 'Accuracy',
    'Автоматизація рельєфного зварювання': 'Automation of projection welding',
    'Рельєфне зварювання на практиці': 'Projection welding in practice',
    'Чим рельєфне зварювання відрізняється від точкового?': 'How does projection welding differ from spot welding?',
    'Коли вибирати AC, DC чи MFDC?': 'When to choose AC, DC or MFDC?',
    'Чи можна зварювати кільцеві герметичні виступи?': 'Can annular leak-tight projections be welded?',
    'Дві групи стаціонарних точкових машин': 'Two groups of stationary spot welders',
    'Стаціонарні точкові машини з педальним кліщовим або пневматичним притиском, 16–25 кВА': 'Stationary spot welders with pedal-gun or pneumatic squeeze, 16–25 kVA',
    'Інверторні стаціонарні точкові машини з педальним кліщовим або пневматичним притиском, 25 кВА': 'Inverter stationary spot welders with pedal-gun or pneumatic squeeze, 25 kVA',
    'Конструкція та оснащення стаціонарних машин': 'Design and equipment of stationary machines',
    'Машини з педальним притиском': 'Machines with pedal squeeze',
    'Машини з пневматичним притиском': 'Machines with pneumatic squeeze',
    'Технічні дані — машини з педальним притиском': 'Technical data — pedal-squeeze machines',
    'Технічні дані — машини з пневматичним притиском': 'Technical data — pneumatic-squeeze machines',
    'Застосування стаціонарних точкових машин': 'Applications of stationary spot welders',
    'Група 25 кВА · інвертор': '25 kVA group · inverter',
    'Що вирізняє інверторні машини': 'What sets inverter machines apart',
    'Переваги інверторної техніки': 'Advantages of inverter technology',
    'Конструкція та керування': 'Design and control',
    'Яку модель вибрати?': 'Which model to choose?',
    'Педальний чи пневматичний притиск?': 'Pedal or pneumatic squeeze?',
    'Коли варто вибрати інверторну версію 25 кВА?': 'When to choose the 25 kVA inverter version?',
    'Який виліт плечей потрібен?': 'What arm reach is needed?',
    'Для зварювання просторових деталей або настільки великих і важких, що застосування стаціонарних машин стає неефективним і неергономічним — шаф, корпусів, кожухів, каналів, подавачів.': 'For welding 3D parts, or parts so large and heavy that stationary machines become inefficient and unergonomic — cabinets, housings, covers, ducts, feeders.',
    'Дві групи підвісних машин у нашому асортименті': 'Two groups of suspended machines in our range',
    'Кліщові підвісні машини з вбудованим контролером і трансформатором, 16–38 кВА': 'Suspended gun welders with a built-in controller and transformer, 16–38 kVA',
    'Інверторні підвісні машини потужністю 56–90 кВА для промисловості': 'Inverter suspended machines rated 56–90 kVA for industry',
    'Конструкція та можливості роботи': 'Design and operating options',
    'Інверторні підвісні машини для промисловості': 'Inverter suspended machines for industry',
    'Керування й безпека': 'Control and safety',
    'Переваги інверторної технології': 'Advantages of inverter technology',
    'Стаціонарні точкові машини 16–25 кВА': 'Stationary spot welding machines 16–25 kVA',
    'Точково-рельєфні машини 35–630 кВА': 'Spot-projection machines 35–630 kVA',
    'Багатофункціональні інверторні машини': 'Multifunction inverter machines',
    'Група 16–38 кВА': '16–38 kVA group',
    'Група 56–90 кВА': '56–90 kVA group',
    'Група 16–25 кВА': '16–25 kVA group',
    'Ручний (2,5–6 кВА), пневматичний штовхаючий (6–38 кВА), пневматичний тягнучий горизонтальний (38–50 кВА).': 'Manual (2.5–6 kVA), pneumatic push (6–38 kVA), pneumatic pull horizontal (38–50 kVA).',
    'AC 50 Гц або інверторний MFDC середньої частоти — напр. 1000 Гц.': 'AC 50 Hz or medium-frequency MFDC inverter — e.g. 1000 Hz.',
    'SMOLTECH є': 'SMOLTECH is the',
    'ексклюзивним дистриб\'ютором обладнання TAYLOR у Польщі': 'exclusive distributor of TAYLOR equipment in Poland',
    'Ми пропонуємо широкий асортимент обладнання та аксесуарів для ручної роботи, а також автоматизовані комплекси ЧПК, які проєктує й будує наша компанія на базі систем TAYLOR.': 'We offer a wide range of equipment and accessories for manual work, plus automated CNC cells designed and built by our company on TAYLOR systems.',
    'Конденсаторні пристрої CDM для приварювання шпильок Ø2–Ø10': 'CDM capacitor units for stud welding Ø2–Ø10',
    'Інверторні пристрої i12 та i16 для приварювання шпильок Ø3–Ø16': 'Inverter units i12 and i16 for stud welding Ø3–Ø16',
    '. Кожен спеціалізований комплекс проєктується під конкретну деталь, такт і рівень контролю процесу.': '. Each specialised cell is designed around a specific part, cycle time and process-control level.',
    'Технологічні лінії': 'Process lines',
    'Зварювання разом із суміжними операціями: запресуванням деталей, калібруванням, щіткуванням, гравіюванням позначень, тестом міцності зʼєднання та палетизацією.': 'Welding together with adjacent operations: part pressing, calibration, brushing, marking, joint-strength testing and palletising.',
    'Подивитись усі реалізації на відео': 'See all installations on video',
    'Ступінь автоматизації процесу, час операції, рівень безпеки, а також обсяг і точність вимірювання параметрів залежать від вимог замовника. На бажання клієнтів — переважно з автомобільної галузі — ми застосовуємо в нашому обладнанні передові рішення контролю якості.': 'The degree of process automation, cycle time, safety level, and the scope and accuracy of parameter measurement depend on the customer’s requirements. At the request of customers — mainly from the automotive sector — we apply advanced quality-control solutions in our equipment.',
    'Детальне вимірювання параметрів процесу зварювання зі збором і архівуванням даних для кожної деталі.': 'Detailed measurement of welding-process parameters with data capture and archiving for every part.',
    'Контрольні рішення, що фізично унеможливлюють помилку оператора — неправильне базування або пропущену операцію.': 'Control solutions that physically prevent operator error — incorrect locating or a skipped operation.',
    'Власні тести контрольних систем, які перевіряють, чи сама система контролю працює правильно.': 'In-house tests of the control systems that check whether the control system itself is working correctly.',
    'Системи ідентифікації оснастки (RFID) і контрольовані рівні доступу до параметрів технології.': 'Tooling identification systems (RFID) and controlled access levels to process parameters.',
    'Дистанційний моніторинг процесів і роботи обладнання, візуалізація в реальному часі, сервісна підтримка.': 'Remote monitoring of processes and equipment, real-time visualisation, service support.',
    'Кіоски з нерухомими та рухомими огорожами, оптичні бар\'єри, натискні захисні планки, кнопки аварійного зупинення.': 'Booths with fixed and moving guards, light curtains, pressure-sensitive safety edges, emergency-stop buttons.',
    'Роботизований зварювальний комплекс виробництва SMOLTECH': 'Robotic welding cell manufactured by SMOLTECH',
    'Проєктування механічної конструкції зварювального комплексу': 'Mechanical design of the welding cell',
    'Виготовлення та монтаж зварювального комплексу': 'Build and installation of the welding cell',
    'Мінімум — креслення або 3D-модель деталі, матеріал і товщину, опис потрібних зʼєднань та очікуваний такт (деталей на годину чи на зміну). Корисно також знати умови в цеху: доступне живлення, стиснене повітря, охолодження, місце під машину. На цій основі ми готуємо концепцію й попередню калькуляцію.': 'At minimum — a drawing or 3D model of the part, material and thickness, a description of the required joints and the expected cycle (parts per hour or per shift). It also helps to know shop-floor conditions: available power, compressed air, cooling, floor space for the machine. From that we prepare a concept and a preliminary quotation.',
    'Так. Ми проєктуємо електричні установки й системи автоматики на обладнанні Siemens, Mitsubishi, Allen-Bradley та B&R, тому можемо підлаштуватися під стандарт, що вже діє на вашому заводі, а також забезпечити обмін сигналами й даними з надрядними системами.': 'Yes. We design electrical installations and automation systems on Siemens, Mitsubishi, Allen-Bradley and B&R equipment, so we can match the standard already in use at your plant and exchange signals and data with higher-level systems.',
    'Так. Ми пропонуємо постійний онлайн-моніторинг процесів і роботи обладнання після завершення проєкту, а також дистанційну діагностику — це суттєво скорочує час реакції на проблему.': 'Yes. After project handover we offer continuous online monitoring of processes and equipment, plus remote diagnostics — that substantially shortens response time when a problem occurs.',
    'Так. Ми виготовляємо обладнання для промислових підприємств Польщі, України та інших країн. Спілкуємося українською, польською та англійською. Напишіть нам — обговоримо технологію, підбір обладнання та умови постачання.': 'Yes. We build equipment for industrial plants in Poland, Ukraine and other countries. We work in Ukrainian, Polish and English. Write to us — we will discuss the process, equipment selection and delivery terms.',
    'Машини для зварювання автомобільного кузова серії E-tech — нова група інверторних машин, призначених для робіт на складальних і сервісних лініях.': 'E-tech series car-body welding machines — a new group of inverter machines for work on assembly and service lines.',
    'Технічні параметри': 'Specifications',
    'Різноманітність машин разом із відмінними можливостями контролера параметрів зварювання': 'The range of machines together with the welding-parameter controller’s capabilities',
    'робить це обладнання застосовним і для майстерневих робіт — наприклад ремонту автомобільних кузовів, і для промислових складальних ліній.': 'makes this equipment suitable both for workshop work — for example car-body repair — and for industrial assembly lines.',
    'Змінні зварювальні пістолети — у стандарті постачаються з охолоджуваними водою кліщами типу «C» із силою притиску 450 даН (8 бар).': 'Interchangeable welding guns — supplied as standard with water-cooled C-type tongs, 450 daN squeeze force (8 bar).',
    'Кліщі зʼєднуються з обладнанням суперелястичним, охолоджуваним водою кабелем довжиною 2400 мм.': 'The tongs connect to the unit with a super-elastic water-cooled cable 2400 mm long.',
    'Обладнання оснащене плечем і балансиром для підвішування кліщів.': 'The unit is fitted with an arm and balancer for suspending the tongs.',
    'Інверторні багатофункціональні машини E-tech 3660 і 3670 зі зварювальними кліщами': 'Multifunction inverter machines E-tech 3660 and 3670 with welding tongs',
    'Керування інверторним трансформатором MF з IGBT.': 'Control of an MF inverter transformer with IGBT.',
    'Просте програмування за допомогою 9 кнопок і цифрового дисплея.': 'Simple programming with 9 buttons and a digital display.',
    'Памʼять на 150 технологій зварювання.': 'Memory for 150 welding programmes.',
    '15 змінних для параметризації технології зварювання.': '15 variables for parameterising the welding programme.',
    'Наростання та спад струму зварювання, пульсація, час зварювання з точністю до 1 мс.': 'Weld-current upslope and downslope, pulsing, weld time accurate to 1 ms.',
    'Вимірювання реального значення струму зварювання RMS у кА.': 'Measurement of the actual RMS welding current in kA.',
    '2 режими роботи: стандартний FIX або постійнострумовий IK.': '2 operating modes: standard FIX or constant-current IK.',
    'Програмовані ліміти струму та відсоток використання інвертора.': 'Programmable current limits and inverter utilisation percentage.',
    'Функція Sepper — компенсація зносу електродів.': 'Sepper function — electrode-wear compensation.',
    'Одиничний та автоматичний цикл роботи.': 'Single and automatic work cycle.',
    'Функції «WELD» і «NO WELD» — зі струмом і без струму зварювання.': 'WELD and NO WELD functions — with and without welding current.',
    'Авторегулювання під частоту мережі 50/60 Гц.': 'Auto-adjustment to 50/60 Hz mains frequency.',
    'Звʼязок через порт USB.': 'USB port communication.',
    'Технічні параметри багатофункціональних інверторних машин E-tech': 'Specifications of multifunction inverter E-tech machines',
    'В / Гц': 'V / Hz',
    'А': 'A',
    'кВА': 'kVA',
    'кА': 'kA',
    'с': 's',
    'кг': 'kg',
    'Коротке відео з роботи машини для зварювання автомобільного кузова серії E-tech.': 'Short video of an E-tech series car-body welding machine in operation.',
    'Дивитись на YouTube': 'Watch on YouTube',
    'Складальні лінії, сервісні станції, ремонт автомобільних кузовів, майстерневі роботи з листовим металом і просторовими деталями.': 'Assembly lines, service stations, car-body repair, workshop work on sheet metal and three-dimensional parts.',
    'Змінні зварювальні пістолети, кліщі типу «C» 450 даН (8 бар) з водяним охолодженням, кабель 2400 мм, плече й балансир.': 'Interchangeable welding guns, C-type tongs 450 daN (8 bar) with water cooling, 2400 mm cable, arm and balancer.',
    'Ми пропонуємо повністю автоматизоване приварювання шпильок завдяки нашим машинам із числовим програмним керуванням. Кожен аспект процесу може бути керований компʼютером і автоматизований — від подачі шпильок і зварювання до завантаження та розвантаження.': 'We offer fully automated stud welding with our CNC machines. Every aspect of the process can be computer-controlled and automated — from stud feeding and welding to loading and unloading.',
    'Ці машини забезпечують незмінно точне позиціонування та міцні довговічні результати. Легке програмування й система швидкого переналагодження роблять їх ідеальним рішенням як для довгих, так і для коротких виробничих серій.': 'These machines deliver consistently accurate positioning and strong, durable results. Easy programming and a quick changeover system make them an ideal solution for both long and short production runs.',
    'До': 'Up to',
    '3000 × 2000 мм': '3000 × 2000 mm',
    '— з використанням максимально': '— using up to',
    '4 осей': '4 axes',
    'для приварювання багатьох шпильок на кількох компонентах у межах однієї програми.': 'to weld many studs on several components within a single programme.',
    'Діаметри шпильок': 'Stud diameters',
    'Від': 'From',
    'Ø3 до Ø8 мм': 'Ø3 to Ø8 mm',
    'у конфігурації ЧПК. Стандартні M4–M8, а також M8 із фланцем — з низьковуглецевої та нержавіючої сталі, довжиною від 6 до 30 мм.': 'in a CNC configuration. Standard M4–M8, and M8 with flange — in low-carbon and stainless steel, lengths from 6 to 30 mm.',
    'Від 1 до': 'From 1 to',
    '4 незалежних зварювальних комплектів': '4 independent welding sets',
    '. Це дає змогу одночасно й автоматично приварювати до 4 різних типів або розмірів шпильок в одному виробничому циклі — без переналагодження машини.': '. This makes it possible to weld up to 4 different types or sizes of stud automatically in a single production cycle — without machine changeover.',
    'Машини ЧПК нашого виробництва можуть також працювати з роботами як повністю автоматичне': 'CNC machines of our manufacture can also work with robots as a fully automatic',
    '5-осьове рішення': '5-axis solution',
    '— ідеальне для обʼємних 3D-деталей.': '— ideal for volumetric 3D parts.',
    'Автомат ST-2/1×35/1-CNC — 1 головка, вібраційний подавач шпильок, конденсаторне джерело струму': 'ST-2/1×35/1-CNC automatic machine — 1 head, vibratory stud feeder, capacitor current source',
    'Сучасний, повністю автоматизований комплекс ЧПК, призначений для серійного приварювання шпильок. Обладнання поєднує точність числового керування з надійною технологією конденсаторного зварювання. Спроєктоване з думкою про максимальну продуктивність, безпеку оператора та гнучкість виробництва.': 'A modern, fully automated CNC cell for series stud welding. The equipment combines the accuracy of numerical control with proven capacitor-discharge welding. Designed for maximum output, operator safety and production flexibility.',
    'Комплекс має повну можливість розширення до 4 незалежних зварювальних комплектів. Це дозволяє одночасно й автоматично приварювати до 4 різних типів або розмірів шпильок в одному виробничому циклі — без потреби переналагоджувати машину.': 'The cell can be expanded to 4 independent welding sets. That allows up to 4 different types or sizes of stud to be welded automatically in a single production cycle — without changing over the machine.',
    'Автоматизований комплекс ST-3/6-CNC — 3 головки, вібраційні подавачі, конденсаторні джерела струму': 'Automated cell ST-3/6-CNC — 3 heads, vibratory feeders, capacitor current sources',
    'Комплекс із робочим полем розмірами 2500 × 1500 мм спроєктовано так, щоб уможливити приварювання різних типів шпильок у довільній конфігурації до сталевих листів різних розмірів і форм.': 'The cell with a 2500 × 1500 mm working area is designed so that different types of stud can be welded in any configuration to steel sheets of various sizes and shapes.',
    'Обладнання оснащене трьома приварювальними головками, які живляться через вібраційні подавачі шпильок і конденсаторні джерела струму. Діапазон приварюваних шпильок: M4–M8 стандартні, а також M8 із фланцем — з низьковуглецевої та нержавіючої сталі, довжиною від 6 до 30 мм.': 'The equipment has three welding heads fed through vibratory stud feeders and capacitor current sources. Weldable stud range: standard M4–M8, and M8 with flange — in low-carbon and stainless steel, lengths from 6 to 30 mm.',
    'Автомат із Т-подібним столом — 2 приварювальні головки': 'Automatic machine with T-slot table — 2 welding heads',
    'Автомат для приварювання різних типів шпильок у довільній конфігурації до сталевих листів різних розмірів і форм. Т-подібний стіл, 2 приварювальні головки, вібраційні подавачі шпильок, конденсаторні джерела струму.': 'Automatic machine for welding different types of stud in any configuration to steel sheets of various sizes and shapes. T-slot table, 2 welding heads, vibratory stud feeders, capacitor current sources.',
    'У каталозі відео': 'In the video catalogue',
    'У каталозі реалізацій': 'In the installations catalogue',
    'Дивитись відео ST-2': 'Watch the ST-2 video',
    'Дивитись відео ST-3': 'Watch the ST-3 video',
    'Джерела CDM': 'CDM sources',
    'Фото в галереї': 'Photos in the gallery',
    'Усі відео шпильок': 'All stud-welding videos',
    'Комплекс ЧПК для автоматичного приварювання шпильок — вигляд машини': 'CNC cell for automatic stud welding — machine view',
    'Робоче поле комплексу ЧПК із приварювальними головками': 'Working area of the CNC cell with welding heads',
    'Вібраційні подавачі шпильок і конденсаторні джерела струму в комплексі ЧПК': 'Vibratory stud feeders and capacitor current sources in the CNC cell',
    'Це високоекономічний і продуктивний вибір, який пропонує винятковy універсальність і надійність. Обладнання спроєктоване й побудоване так, щоб відповідати всім необхідним нормам.': 'This is a highly economical and productive choice, offering exceptional versatility and reliability. The equipment is designed and built to meet all required standards.',
    'Подивитись комплекси на відео': 'See the cells on video',
    'Ми постачаємо також базовий комплект компонентів для застосування в обладнанні автоматичного приварювання шпильок діаметром до 8 мм — для застосувань ЧПК і на роботизованих постах.': 'We also supply a basic set of components for use in automatic stud-welding equipment up to 8 mm diameter — for CNC applications and robotic stations.',
    'Конденсаторні джерела CDM9 і CDM10 разом із автоматичними головками SIK2 або SIK100 та вібраційними подавачами шпильок.': 'CDM9 and CDM10 capacitor sources together with automatic heads SIK2 or SIK100 and vibratory stud feeders.',
    'i12 та i16 — продуктивні інверторні пристрої для приварювання тягнутою дугою шпильок зі зменшеною основою й діаметром до 16 мм.': 'i12 and i16 — productive inverter units for drawn-arc welding of reduced-base studs up to 16 mm in diameter.',
    'Машини керуються мікропроцесором, а їхня легка та компактна конструкція полегшує маневрування й установку в будь-якому місці. Пристрої спроєктовані так, щоб забезпечувати швидкі й точні зʼєднання, залишаючись водночас простими в обслуговуванні — це економічний і надійний метод крiплення шпильок із мʼякої та нержавіючої сталі.': 'The machines are microprocessor-controlled, and their light, compact construction makes them easy to move and install anywhere. They are designed for fast, accurate joints while remaining simple to service — an economical and reliable method of fastening mild-steel and stainless-steel studs.',
    'Після включення пристрій спершу проходить автотест, щоб переконатися у виконанні стандартів безпеки (доступна також функція тестування ходу пістолета). Далі можна задати струм і час приварювання за допомогою зрозумілого дисплея.': 'After switch-on the unit first runs a self-test to confirm that safety standards are met (a gun-stroke test function is also available). Current and weld time can then be set on a clear display.',
    'i12 та i16 можуть застосовуватися для приварювання шпильок': 'i12 and i16 can be used to weld studs by',
    'тягнутою дугою (Drawn Arc)': 'drawn arc (Drawn Arc)',
    'або': 'or',
    'коротким циклом (Short Cycle)': 'short cycle (Short Cycle)',
    '. Пристрої працюють із пістолетами DA2A, DA7B і DA8A.': '. The units work with DA2A, DA7B and DA8A guns.',
    'Пістолети DA2A, DA7B і DA8A для дугового приварювання шпильок': 'DA2A, DA7B and DA8A guns for arc stud welding',
    'Міцна компактна конструкція корпусу.': 'Rugged, compact housing.',
    'Безступінчасте регулювання струму й часу приварювання.': 'Stepless adjustment of welding current and time.',
    'Мікропроцесорне керування.': 'Microprocessor control.',
    'Регулювання параметрів запалювання дуги — часу та струму.': 'Adjustment of arc-ignition parameters — time and current.',
    'Найновіша інверторна технологія.': 'Latest inverter technology.',
    'Багатофункціональний дисплей у 12 мовах.': 'Multifunction display in 12 languages.',
    'Сигналізація перегріву, короткого замикання та помилок запалювання дуги.': 'Alarms for overheating, short circuit and arc-ignition faults.',
    'Установка піддуву захисного газу.': 'Shielding-gas shroud connection.',
    'Тестування функції ходу в пістолеті.': 'Gun stroke-function test.',
    'Приварювання двома методами: Drawn Arc або Short Cycle.': 'Welding by two methods: Drawn Arc or Short Cycle.',
    'Технічні параметри інверторних пристроїв i12 та i16': 'Specifications of inverter units i12 and i16',
    '3–10,8 мм RB (M12 PD)': '3–10.8 mm RB (M12 PD)',
    '3–14,6 мм RB (M16 PD)': '3–14.6 mm RB (M16 PD)',
    '18 кВА': '18 kVA',
    '35 кВА': '35 kVA',
    '100–800 А': '100–800 A',
    '100–1400 А': '100–1400 A',
    '10–1000 мс': '10–1000 ms',
    '3×400 В, 50/60 Гц': '3×400 V, 50/60 Hz',
    '32 А': '32 A',
    'IP 23 (клас I)': 'IP 23 (class I)',
    '520 × 230 × 250 мм': '520 × 230 × 250 mm',
    '510 × 325 × 450 мм': '510 × 325 × 450 mm',
    '18 кг': '18 kg',
    '34 кг': '34 kg',
    'Швидкість приварювання залежить від розміру та діаметра шпильки. Для діаметрів до Ø10 мм і тонкого основного матеріалу часто економічнішим рішенням буде': 'Welding speed depends on stud size and diameter. For diameters up to Ø10 mm and thin parent material, a more economical solution is often',
    'конденсаторна технологія CDM': 'CDM capacitor technology',
    'Моделі: CDM8, CDM9, CDM10. Пристрої CDM економічні й надійні водночас — вони забезпечують міцне та швидке приварювання.': 'Models: CDM8, CDM9, CDM10. CDM units are economical and reliable at the same time — they deliver strong, fast welds.',
    'Ці міцно виконані й водночас легкі машини з дуже коротким часом заряджання забезпечують високу продуктивність та економічну ефективність операції.': 'These ruggedly built yet lightweight machines with a very short charging time provide high productivity and economical operation.',
    'Пристрої CDM приварюють шпильки діаметром від 2 мм до 10 мм, виготовлені з мʼякої сталі, нержавіючої сталі, алюмінію та латуні, до тонких основних матеріалів — плоских і чистих. Результат — відмінні міцні зʼєднання з мінімальними слідами на зворотному боці.': 'CDM units weld studs from 2 mm to 10 mm in diameter, made of mild steel, stainless steel, aluminium and brass, to thin parent materials — flat and clean. The result is excellent, strong joints with minimal marks on the reverse side.',
    'Машини CDM підходять для роботи як з контактними пістолетами': 'CDM machines are suitable for work with both contact guns',
    ', так і з пістолетами з підняттям': ', as well as with lift guns',
    'Пістолети для конденсаторного приварювання шпильок: контактний C2 і з підняттям LG2': 'Guns for capacitor-discharge stud welding: contact C2 and lift LG2',
    'Цифрове відображення напруги заряджання конденсаторів.': 'Digital display of capacitor charging voltage.',
    'Усі функції чітко сигналізуються світлодіодами.': 'All functions clearly indicated by LEDs.',
    'Короткий час заряджання — швидке приварювання.': 'Short charging time — fast welding.',
    'Плавно регульована напруга заряджання.': 'Steplessly adjustable charging voltage.',
    'Напруга заряджання не змінюється під впливом напруги живлення.': 'Charging voltage is unaffected by mains-voltage variation.',
    'Оптимальна безпека під час зварювання.': 'Optimum safety during welding.',
    'Компактна та міцна конструкція.': 'Compact and rugged construction.',
    'CDM9 і CDM10 рекомендовані як джерела живлення на автоматизованих і роботизованих постах — після підключення автоматичного подавача шпильок і автоматичної головки SIK2 або SIK100.': 'CDM9 and CDM10 are recommended as power sources on automated and robotic stations — after connecting an automatic stud feeder and an automatic head SIK2 or SIK100.',
    'Технічні параметри конденсаторних пристроїв CDM': 'Specifications of CDM capacitor units',
    '2–8 мм': '2–8 mm',
    '2–10 мм': '2–10 mm',
    '66 000 мкФ': '66 000 µF',
    '99 000 мкФ': '99 000 µF',
    '132 000 мкФ': '132 000 µF',
    '230 В AC (±10%), 50–60 Гц': '230 V AC (±10%), 50–60 Hz',
    '10 А': '10 A',
    '35–200 В': '35–200 V',
    '430 × 210 × 270 мм': '430 × 210 × 270 mm',
    '16 кг': '16 kg',
    '17 кг': '17 kg',
    'Моделі CDM9 і CDM10 ми використовуємо як джерела струму в автоматизованих комплексах ЧПК нашого виробництва — разом із вібраційними подавачами шпильок і автоматичними головками SIK2 або SIK100.': 'We use CDM9 and CDM10 models as current sources in automated CNC cells of our manufacture — together with vibratory stud feeders and automatic heads SIK2 or SIK100.',
    'Для шпильок понад Ø10 мм або товстішого основного матеріалу застосовують дугову інверторну технологію — пристрої i12 та i16.': 'For studs above Ø10 mm or thicker parent material, drawn-arc inverter technology is used — units i12 and i16.',
    'DA — інверторне приварювання Ø3–Ø16': 'DA — inverter welding Ø3–Ø16',
    'На обладнанні SMOLTECH виробляють широкий спектр зварних сіток: панелі огорожі 2D і 3D, будівельні та армувальні сітки, габіони, гірничі сітки, кратниці, а також нетипові виріб — наприклад пера жалюзійних сит.': 'On SMOLTECH equipment a wide range of welded mesh is produced: 2D and 3D fence panels, construction and reinforcing mesh, gabions, mining mesh, gratings, and non-standard products — for example shutter-screen blades.',
    'Зварні сітки можна виробляти двома способами, і вибір технології залежить передусім від продуктивності та типу виробу. У точковому зварюванні зʼєднання виконуються послідовно, вузол за вузлом — таке рішення підходить для менших серій і нетипових виробів. Точкова машина для сітки дає при цьому велику свободу у виборі кроку прутів і форми сітки.': 'Welded mesh can be produced in two ways, and the choice of technology depends mainly on output and product type. In spot welding, joints are made sequentially, node by node — that solution suits smaller series and non-standard products. A mesh spot welder then gives great freedom in choosing wire pitch and mesh shape.',
    'Значно вищу продуктивність забезпечують багатоточкові машини, у яких багато циліндрів зварюють одночасно цілий ряд вузлів. Багатоточкові машини для сіток дозволяють виконати повний ряд зʼєднань за один цикл, що у виробництві панелей огорожі чи будівельних сіток безпосередньо впливає на темп роботи. У нашому асортименті є як точкові машини для сіток, так і розгалужені багатоточкові машини на кількох десятках зварювальних модулів, які підбираються під масштаб виробництва.': 'Much higher output is provided by multi-spot machines, in which many cylinders weld a whole row of nodes at once. Multi-spot mesh machines complete a full row of joints in one cycle, which in fence-panel or construction-mesh production directly affects the work rate. Our range includes both mesh spot welders and extensive multi-spot machines with several dozen welding modules, selected to match production scale.',
    'Ступінь автоматизації машини для сіток ми підбираємо під специфіку виробництва й вимоги замовника. Діапазон рішень — від ручного укладання прутів у шаблонах, через автоматичні подавачі прутів для сіток 2D і 3D, до пресів для загинання панелей та систем відбору й палетизації готових виробів. Завдяки цьому один пост може обслуговувати одиничні серії, а розгалужена лінія — працювати в безперервному циклі.': 'We match the automation level of a mesh machine to the production profile and the customer’s requirements. The range of solutions — from manual laying of wires in templates, through automatic wire feeders for 2D and 3D mesh, to panel-bending presses and systems for take-off and palletising of finished products. Thanks to that, one station can handle one-off series, while an extensive line can run in a continuous cycle.',
    'Машини для зварювання сіток ми конструюємо на зварювальних компонентах': 'We build mesh welding machines on welding components',
    'з Італії — одного з найбільших у Європі виробників машин контактного зварювання. Ми також використовуємо високоякісні вузли визнаних виробників автоматики, електроніки, оптики, пневматики та серводвигунних систем.': 'from Italy — one of Europe’s largest manufacturers of resistance welding machines. We also use high-quality assemblies from recognised makers of automation, electronics, optics, pneumatics and servo-drive systems.',
    'Панелі огорожі 2D і 3D, будівельні та армувальні сітки, габіони, гірничі сітки, кратниці, пера жалюзійних сит.': '2D and 3D fence panels, construction and reinforcing mesh, gabions, mining mesh, gratings, shutter-screen blades.',
    'Прути Ø3–10 мм, вічко 20–200 мм, панелі до 2500 × 2500 мм, сітки до 1600 × 4000 мм — залежно від конфігурації машини.': 'Wires Ø3–10 mm, mesh opening 20–200 mm, panels up to 2500 × 2500 mm, mesh up to 1600 × 4000 mm — depending on machine configuration.',
    'Технології': 'Technologies',
    'Інверторні трансформатори MFDC 1000 Гц, машини змінного струму AC та постійного струму DC — потужністю від 32 до 400 кВА на модуль.': 'MFDC inverter transformers 1000 Hz, AC and DC machines — from 32 to 400 kVA per module.',
    'Автоматизація': 'Automation',
    'Подавачі поперечних, продовжніх і бічних прутів із буферними накопичувачами, преси загинання, палетизація, поворотні столи відбору.': 'Feeders for cross, longitudinal and side wires with buffer magazines, bending presses, palletising, rotary take-off tables.',
    'Кожну машину підбирають індивідуально під тип сітки, діаметр прутів і очікувану продуктивність. Нижче — вибрані реалізації нашого виробництва.': 'Each machine is selected individually for mesh type, wire diameter and expected output. Below — selected installations of our manufacture.',
    'Інверторна машина SW-51/5×200/MF для сіток і панелей огорожі 2D і 3D зі столом, що обертається': 'Inverter machine SW-51/5×200/MF for 2D and 3D mesh and fence panels with a rotating table',
    'Усі прути подаються автоматично трьома подавачами з буферними накопичувачами. Обладнання оснащене також системою палетизації готових панелей і поворотним столом для відбору панелей автонавантажувачем під час роботи машини.': 'All wires are fed automatically by three feeders with buffer magazines. The equipment is also fitted with a palletising system for finished panels and a rotary table so a forklift can take panels off while the machine is running.',
    'Машина призначена для автоматичного зварювання панелей огорожі максимальних розмірів 2500 × 2500 мм із прутів діаметром від 3 до 8 мм. Усі прути подаються автоматично трьома подавачами: поперечним, продовжнім і бічним — для подачі додаткового нижнього поперечного прута в панелях 2D.': 'The machine is designed for automatic welding of fence panels up to 2500 × 2500 mm from wires 3 to 8 mm in diameter. All wires are fed automatically by three feeders: cross, longitudinal and side — to feed an extra lower cross wire in 2D panels.',
    'Інверторна багатоточкова машина SW-9/2×240/MF для сіток і переносних будівельних огорож': 'Inverter multi-spot machine SW-9/2×240/MF for mesh and portable construction fencing',
    'Машина для зварювання сіток — панелей огорожі та переносних будівельних огорож — зі змінними шаблонами й системою палетизації.': 'Machine for welding mesh — fence panels and portable construction fencing — with interchangeable templates and a palletising system.',
    'Інверторна багатоточкова машина SW-51/4×180 для огорожних і габіонних сіток': 'Inverter multi-spot machine SW-51/4×180 for fence and gabion mesh',
    'Професійна автоматична лінія для виробництва зварних сіток, призначених на панелі огорожі або габіони. Обладнання базується на 4 інверторних трансформаторах 1000 Гц, кожен потужністю 200 кВА при P-50%, і 51 трикамерному зварювальному циліндрі.': 'A professional automatic line for producing welded mesh for fence panels or gabions. The equipment is based on 4 inverter transformers 1000 Hz, each 200 kVA at P-50%, and 51 three-chamber welding cylinders.',
    'Багатоточкова машина SW-18/9×32/AC для сіток зі сталевих прутів у шаблонах': 'Multi-spot machine SW-18/9×32/AC for steel-wire mesh in templates',
    'Машина для автоматичного зварювання сіток зі сталевих прутів у шаблонах. Побудована на 9 подвійних зварювальних модулях із інтегрованим трансформатором потужністю 32 кВА (P=50%) і силою притиску електродів 2×260 даН (при 6 бар).': 'Machine for automatic welding of steel-wire mesh in templates. Built on 9 double welding modules with an integrated 32 kVA transformer (P=50%) and electrode squeeze force 2×260 daN (at 6 bar).',
    'Інверторна багатоточкова машина SW-12/2×90/MF для пер жалюзійних сит': 'Inverter multi-spot machine SW-12/2×90/MF for shutter-screen blades',
    'Пост багатоточкового зварювання побудований на портальній стальній конструкції з 12 зварювальними циліндрами, установленими над робочим полем. З обох боків портала розташовані два інверторні трансформатори потужністю 90 кВА (P=50%) кожен.': 'The multi-spot welding station is built on a portal steel structure with 12 welding cylinders mounted above the working area. On both sides of the portal are two inverter transformers of 90 kVA (P=50%) each.',
    'Багатоточкова машина постійного струму SW-15/1×400 для сіток до 1600 × 4000 мм': 'DC multi-spot machine SW-15/1×400 for mesh up to 1600 × 4000 mm',
    'Обладнання спроєктоване для виробництва сіток із прута товщиною ϕ3–10 мм і вічком 20–200 мм. У машині використано вузли постійного струму потужністю 400 кВА (P-50%) і 15 пневматичних циліндрів із силою притиску 760 даН.': 'The equipment is designed for producing mesh from ϕ3–10 mm wire with 20–200 mm openings. The machine uses 400 kVA DC assemblies (P-50%) and 15 pneumatic cylinders with 760 daN squeeze force.',
    'Подивитись машини для сіток на відео': 'See mesh machines on video',
    'Багатоточкова машина для зварювання сіток виробництва SMOLTECH': 'Multi-spot mesh welding machine manufactured by SMOLTECH',
    'Лінія для виробництва будівельних зварних сіток': 'Line for producing construction welded mesh',
    'Багатоточкова машина для зварювання пер жалюзійних сит': 'Multi-spot machine for welding shutter-screen blades',
    'Машина для зварювання панелей огорожі': 'Machine for welding fence panels',
    'Автоматична лінія для виробництва зварних сіток': 'Automatic line for producing welded mesh',
    'Кожну машину й лінію ми проєктуємо під конкретний виріб, тому підбір починаємо з визначення типу сітки, діаметра прутів, розмірів виробу та планованої продуктивності.': 'We design each machine and line around a specific product, so selection starts by defining mesh type, wire diameter, product size and planned output.',
    'Точкова машина зварює вузол за вузлом — це дешевше, гнучкіше щодо форми сітки й кроку прутів, тому підходить для менших серій і нетипових виробів. Багатоточкова машина зварює цілий ряд вузлів за один цикл, тому дає багатократно вищу продуктивність — це вибір для серійного виробництва панелей огорожі, будівельних і армувальних сіток.': 'A spot machine welds node by node — that is cheaper and more flexible as to mesh shape and wire pitch, so it suits smaller series and non-standard products. A multi-spot machine welds a whole row of nodes in one cycle, so it gives many times higher output — that is the choice for series production of fence panels, construction and reinforcing mesh.',
    'Залежить від конфігурації. У реалізованих машинах ми досягали панелей до 2500 × 2500 мм із прутів Ø3–8 мм, а також сіток до 1600 × 4000 мм із прута Ø3–10 мм із вічком 20–200 мм. Конкретні межі визначаємо на етапі концепції — під ваш виріб.': 'It depends on the configuration. On machines we have built we have reached panels up to 2500 × 2500 mm from Ø3–8 mm wire, and mesh up to 1600 × 4000 mm from Ø3–10 mm wire with 20–200 mm openings. Specific limits are set at the concept stage — for your product.',
    'Так. Ми будуємо подавачі поперечних, продовжніх і бічних прутів із буферними накопичувачами, преси для загинання панелей 3D, а також системи відбору й палетизації готових виробів — у тому числі поворотні столи, що дають змогу забирати панелі автонавантажувачем під час роботи машини.': 'Yes. We build feeders for cross, longitudinal and side wires with buffer magazines, presses for bending 3D panels, and systems for take-off and palletising of finished products — including rotary tables that let a forklift take panels off while the machine is running.',
    'Найменші машини цієї групи (2,5–6 кВА) мають ручний притиск, більші — пневматичний з штовхаючим циліндром (моделі 6–38 кВА) або з тягнучим горизонтальним (моделі 38–50 кВА). Вони працюють на трансформаторах AC 50 Гц або на інверторних MFDC середньої частоти, наприклад 1000 Гц.': 'The smallest machines in this group (2.5–6 kVA) have manual squeeze; larger ones have pneumatic squeeze with a push cylinder (models 6–38 kVA) or a pulling horizontal cylinder (models 38–50 kVA). They run on 50 Hz AC transformers or on medium-frequency MFDC inverters, for example 1000 Hz.',
    'Гіроскопічне підвішування та балансир забезпечують вільний рух машини й мінімум фізичного навантаження на оператора. Типоряд дозволяє підібрати оптимальну модель як для дрібних ремонтних робіт, так і для промислового виробництва.': 'Gyroscopic suspension and a balancer give the machine free movement and minimum physical load on the operator. The range lets you select the optimum model both for small repair work and for industrial production.',
    'Гіроскопічне підвішування та підібраний за вагою балансир — повна свобода руху, установка плечей під будь-яким кутом.': 'Gyroscopic suspension and a weight-matched balancer — full freedom of movement, arms set at any angle.',
    'Кліщові підвісні машини точкового зварювання 16–38 кВА, моделі 3321–3328': 'Suspended gun spot welders 16–38 kVA, models 3321–3328',
    '16–38 кВА · AC': '16–38 kVA · AC',
    'Моделі: 3321, 3322, 3323, 3324, 3327, 3328': 'Models: 3321, 3322, 3323, 3324, 3327, 3328',
    'Кліщова точкова машина призначена для точкового зварювання листового металу та прута у виробничих умовах. Завдяки компактній конструкції, вбудованому контролеру й трансформатору вона є практичним рішенням для виробничих цехів, майстерень і складальних постів. Ручні кліщові машини забезпечують зручне обслуговування та велику свободу маневрування зі зварюваним матеріалом.': 'A gun-type spot welder is intended for spot welding sheet metal and bar in production conditions. Thanks to its compact construction, built-in controller and transformer it is a practical solution for production shops, workshops and assembly stations. Manual gun machines give convenient handling and great freedom of movement with the work.',
    'Інверторні підвісні машини точкового зварювання 56–90 кВА для промисловості': 'Inverter suspended spot welders 56–90 kVA for industry',
    '56–90 кВА · MFDC': '56–90 kVA · MFDC',
    'Моделі: 3062, 3066, 3176, 3177, 3183, 3184': 'Models: 3062, 3066, 3176, 3177, 3183, 3184',
    'Обладнання спроєктовано для виконання високоякісних зварних зʼєднань з високою продуктивністю та оптимізованими витратами на установку. Машини мають великі сили притиску електродів, зменшені габарити й безпечні компоненти.': 'The equipment is designed to make high-quality welded joints at high output with optimised installation costs. The machines have high electrode squeeze forces, reduced overall size and safe components.',
    'Кліщові точкові машини вирізняються високою якістю роботи, досягнутою завдяки сучасній раціональній конструкції та зменшеним габаритам. Вони мають вбудований сучасний мікропроцесорний контролер, який дає змогу точно налаштовувати параметри зварювання. Цей типоряд має водяне охолодження, регульований попередній і робочий хід електродів, регулювання сили притиску та швидкості руху плечей.': 'Gun-type spot welders stand out for high work quality, achieved through a modern, rational design and reduced overall size. They have a built-in modern microprocessor controller that lets you set welding parameters precisely. This range has water cooling, adjustable electrode approach and working stroke, and adjustment of squeeze force and arm speed.',
    'Технічні параметри кліщових підвісних машин 16–38 кВА': 'Specifications of suspended gun machines 16–38 kVA',
    'Номінальна потужність': 'Rated power',
    'Максимальна потужність зварювання': 'Maximum welding power',
    'Максимальний струм короткого замикання': 'Maximum short-circuit current',
    'Напруга / частота': 'Voltage / frequency',
    'В/Гц': 'V/Hz',
    'Розхил плечей': 'Arm gap',
    'мм': 'mm',
    'Довжина стандартних плечей L': 'Length of standard arms L',
    'Мінімальна довжина плечей': 'Minimum arm length',
    'Максимальна довжина плечей': 'Maximum arm length',
    'Макс. сила притиску (6 бар) для L': 'Max. squeeze force (6 bar) for L',
    'даН': 'daN',
    'Необхідний тиск повітря': 'Required air pressure',
    'бар': 'bar',
    'Витрата охолоджувальної води при 250 кПа': 'Cooling-water consumption at 250 kPa',
    'л/хв': 'l/min',
    'Зварювання низьковуглецевого листа при L': 'Welding of low-carbon sheet at L',
    'Прути навхрест, низьковуглецева сталь': 'Crossed bars, low-carbon steel',
    'Ø мм': 'Ø mm',
    'Маса брутто з найкоротшими плечима': 'Gross mass with shortest arms',
    'Доступність багатьох варіантів — за потужністю, довжиною плечей і силою притиску — дозволяє підібрати обладнання і для зварювання тонкого листа, і для складніших сталевих елементів.': 'Availability of many variants — by power, arm length and squeeze force — lets you select equipment both for welding thin sheet and for more demanding steel parts.',
    'Звʼяжіться з нашою командою': 'Contact our team',
    ', щоб підібрати машину для листового металу та прута.': ', to select a machine for sheet metal and bar.',
    'Гіроскопічне підвішування забезпечує точну маневреність у будь-якому напрямку. Довгий регульований робочий хід дає змогу зварювати підсилення й ребра та працювати у важкодоступних місцях. Хромований циліндр високої міцності й довговічності та безмастильний пневматичний контур дозволяють уникнути масляного туману в приміщенні. Вторинний контур із міді повністю охолоджується водою.': 'Gyroscopic suspension provides precise manoeuvrability in any direction. A long adjustable working stroke lets you weld reinforcements and ribs and work in hard-to-reach places. A high-strength, durable chromed cylinder and a lubrication-free pneumatic circuit avoid oil mist in the room. The copper secondary circuit is fully water-cooled.',
    'Керуюча рукоятка з вибором двох програм зварювання.': 'Control handle with a choice of two welding programmes.',
    'Функція відкриття подвійного ходу та режим «тільки притиск».': 'Double-stroke opening function and “squeeze only” mode.',
    'Захист від випадкового запуску та кнопка аварійного зупинення машини.': 'Protection against accidental start and a machine emergency-stop button.',
    'Захист від роботи без охолодження.': 'Protection against running without cooling.',
    'Зростання коефіцієнта потужності, що суттєво зменшує споживання струму з мережі живлення.': 'Rise in power factor, which substantially reduces current drawn from the supply network.',
    'Зменшення габаритів машини зі збереженням великих струмів зварювання.': 'Reduced machine overall size while retaining high welding currents.',
    'Скорочення часу зварювання до 1 мс проти 20 мс у конвенційній технології — відмінний вигляд і якість зʼєднання.': 'Welding time cut to 1 ms versus 20 ms in conventional technology — excellent appearance and joint quality.',
    'Подача струму зварювання безперервно й без втрат, зумовлених розмірами зварювального контуру.': 'Welding current delivered continuously and without losses caused by the size of the welding loop.',
    'Технічні параметри інверторних підвісних машин 56–90 кВА': 'Specifications of inverter suspended machines 56–90 kVA',
    'Модель': 'Model',
    'кВА 20%': 'kVA 20%',
    'кВА 50%': 'kVA 50%',
    'Розхил плечей, мм': 'Arm gap, mm',
    'Сила притиску, даН (6 бар)': 'Squeeze force, daN (6 bar)',
    'Сила притиску, даН (8 бар)': 'Squeeze force, daN (8 bar)',
    'Ø циліндра, мм': 'Cylinder Ø, mm',
    'Струм КЗ, кА': 'Short-circuit current, kA',
    'Ø плечей без ізол., мм': 'Arm Ø without insulation, mm',
    'Ø плечей з ізол., мм': 'Arm Ø with insulation, mm',
    'Маса нетто, кг': 'Net mass, kg',
    'Стаціонарні точкові машини контактного зварювання': 'Stationary resistance-welding spot machines',
    'Для листового металу, прута навхрест і просторових деталей.': 'For sheet metal, crossed bar and three-dimensional parts.',
    'Лінійний притиск для деталей із технологічними виступами.': 'Linear squeeze for parts with process projections.',
    'Багатофункціональні інверторні машини E-tech': 'Multifunction inverter E-tech machines',
    'Серія E-tech для складальних і сервісних ліній.': 'E-tech series for assembly and service lines.',
    ', st. Przyjazna 2, 55-080 Mokronos Dolny, Польща; NIP 8971804142, REGON 360382474, KRS 0000535326.': ', st. Przyjazna 2, 55-080 Mokronos Dolny, Poland; NIP 8971804142, REGON 360382474, KRS 0000535326.',
    '— ст. 6 п. 1 літ. b GDPR.': '— Art. 6(1)(b) GDPR.',
    ') завантажується лише після того, як ви натиснете кнопку відтворення. Лише тоді Google може встановити власні файли cookie — згідно з': ') is loaded only after you press the play button. Only then can Google set its own cookies — in accordance with',
    '. Ми також проєктуємо й виготовляємо спеціалізовану зварювальну оснастку для зʼєднання просторових деталей.': '. We also design and manufacture specialised welding tooling for joining three-dimensional parts.',
    'TAYLOR Studwelding Systems Limited — британська компанія, яка вже понад 35 років виробляє обладнання для приварювання шпильок і забезпечує промислові підприємства в Європі та світі. SMOLTECH є': 'TAYLOR Studwelding Systems Limited is a British company that has been manufacturing stud-welding equipment for over 35 years and supplies industrial plants in Europe and worldwide. SMOLTECH is the',
    'У нашому асортименті — машини для різьбових і безрізьбових шпильок, як для одиничного, так і для серійного виробництва: ручні пристрої, автоматичні системи та додаткове оснащення, що дає змогу реалізувати найвимогливіші технологічні процеси.': 'Our range includes machines for threaded and unthreaded studs, for both one-off and series production: hand-held units, automatic systems and additional equipment that makes it possible to carry out the most demanding process applications.',
    'Компактні переносні пристрої для конденсаторного приварювання шпильок діаметром до 10 мм. Завдяки простій і надійній конструкції серія CDM забезпечує економічне приварювання шпильок з мʼякої та нержавіючої сталі, алюмінію й латуні.': 'Compact portable units for capacitor-discharge welding of studs up to 10 mm in diameter. Thanks to a simple, reliable construction the CDM series provides economical welding of mild-steel and stainless-steel, aluminium and brass studs.',
    'i12 та i16 — швидке й точне інверторне обладнання для дугового приварювання шпильок діаметром до 16 мм. Інверторна технологія забезпечує високу стабільність електричної дуги навіть за дуже коротких часів і струмів приварювання, а також високу енергоефективність.': 'i12 and i16 — fast, accurate inverter equipment for arc welding of studs up to 16 mm in diameter. Inverter technology provides high arc stability even at very short weld times and currents, and high energy efficiency.',
    'Автоматизовані комплекси ЧПК для приварювання шпильок': 'Automated CNC cells for stud welding',
    'ЧПК': 'CNC',
    'Ми виготовляємо автоматизовані комплекси ЧПК для приварювання різних типів шпильок у довільній конфігурації до сталевих листів різних розмірів і форм. Зварювальні головки живляться через вібраційні подавачі шпильок і конденсаторні джерела струму.': 'We manufacture automated CNC cells for welding various types of stud in any configuration to steel sheets of various sizes and shapes. The welding heads are fed through vibratory stud feeders and capacitor current sources.',
    'Вибір технології визначають діаметр шпильки, товщина основного матеріалу та вимоги до вигляду зворотного боку зʼєднання.': 'The choice of technology is determined by stud diameter, parent-material thickness and requirements for the appearance of the reverse side of the joint.',
    'Порівняння конденсаторної технології CDM та дугової DA': 'Comparison of CDM capacitor technology and DA arc technology',
    'Ø2–Ø10 мм': 'Ø2–Ø10 mm',
    'Ø3–Ø16 мм': 'Ø3–Ø16 mm',
    '1–3 мс': '1–3 ms',
    'Крім постачання обладнання для приварювання шпильок, ми забезпечуємо також комплексну технічну підтримку. Виконуємо вимірювання, технологічні послуги, модернізацію та ремонти, діагностику та відновлення обладнання, що застосовується у процесах приварювання шпильок.': 'Besides supplying stud-welding equipment, we also provide comprehensive technical support. We carry out measurements, process services, modernisation and repairs, diagnostics and restoration of equipment used in stud-welding processes.',
    'Наш сервіс охоплює як конденсаторні машини TAYLOR, так і обладнання інших перевірених виробників. Завдяки багаторічному досвіду ми допомагаємо зберігати безперервність виробництва та найвищу якість виконуваних зʼєднань.': 'Our service covers both TAYLOR capacitor machines and equipment from other proven manufacturers. Thanks to many years of experience we help maintain production continuity and the highest quality of the joints made.',
    'Від компактних машин для шпильок до повністю автоматизованих комплексів ЧПК — ми допомагаємо підібрати технологію, яка працює в реальних виробничих умовах. Скажіть, що ви хочете виготовляти, і команда SMOLTECH підбере рішення під потреби вашого підприємства.': 'From compact stud machines to fully automated CNC cells — we help select a technology that works in real production conditions. Tell us what you want to manufacture, and the SMOLTECH team will match a solution to your plant’s needs.',
    'Автоматизований комплекс ЧПК приварювання шпильок виробництва SMOLTECH': 'Automated CNC stud-welding cell manufactured by SMOLTECH',
    'Пістолети для конденсаторного приварювання шпильок C2 і LG2': 'C2 and LG2 guns for capacitor-discharge stud welding',
    'Стаціонарні машини контактного зварювання з педальним кліщовим або пневматичним притиском — 16–25 кВА у техніці AC та 25 кВА в інверторній техніці MFDC.': 'Stationary resistance welding machines with pedal gun or pneumatic squeeze — 16–25 kVA in AC technique and 25 kVA in MFDC inverter technique.',
    'Стаціонарні машини — це обладнання, змонтоване постійно в одному місці, біля якого оператор зварює подані до машини деталі. Вони мають стабільну конструкцію, що забезпечує повторюваність зʼєднань і зручність роботи в серійному виробництві, де елементи близьких розмірів зʼєднують у постійному циклі.': 'Stationary machines are equipment permanently installed in one place, at which the operator welds parts brought to the machine. They have a stable construction that provides joint repeatability and convenient work in series production, where parts of similar size are joined in a constant cycle.',
    'Високу якість зварювання та максимальну продуктивність забезпечують, зокрема: сучасні мікропроцесорні контролери, охолоджуваний трансформатор, циліндри з блокуванням обертання штока та попереднім ходом, велика жорсткість плечей і корпусу, регулювання швидкості руху електродів. Ці властивості дозволяють зварювати всі типи сталей, у тому числі з гальванічними покриттями, кольорові метали, а також виконувати суміжні процеси — наприклад пайко-зварювання чи брикетування мідних жил.': 'High welding quality and maximum output are provided, among other things, by: modern microprocessor controllers, a cooled transformer, cylinders with rod anti-rotation lock and approach stroke, high rigidity of arms and frame, and electrode-speed adjustment. These features make it possible to weld all types of steel, including with electroplated coatings, non-ferrous metals, and also to carry out related processes — for example braze-welding or compacting copper strands.',
    'Стаціонарні точкові машини 16–25 кВА, моделі 4640–4649': 'Stationary spot machines 16–25 kVA, models 4640–4649',
    '16–25 кВА · AC': '16–25 kVA · AC',
    'Моделі: 4640, 4641, 4642, 4643, 4644 (педальний притиск) · 4645, 4646, 4647, 4648, 4649 (пневматичний притиск)': 'Models: 4640, 4641, 4642, 4643, 4644 (pedal squeeze) · 4645, 4646, 4647, 4648, 4649 (pneumatic squeeze)',
    'Базові точкові машини потужністю від 16 до 25 кВА, призначені передусім для зварювання листового металу. Відмінна риса серії — вибір типу притиску електродів: доступні варіанти з педальним і з пневматичним притиском. Саме від нього залежить спосіб роботи, продуктивність і сфера застосування.': 'Basic spot machines from 16 to 25 kVA, intended primarily for welding sheet metal. The distinctive feature of the series is the choice of electrode squeeze type: variants with pedal and with pneumatic squeeze are available. That choice determines the way of working, output and field of application.',
    'Конструкція та параметри': 'Construction and parameters',
    'Інверторні стаціонарні точкові машини 25 кВА, моделі 6010–6013': 'Inverter stationary spot machines 25 kVA, models 6010–6013',
    '25 кВА · MFDC': '25 kVA · MFDC',
    'Моделі: 6010, 6011 (педальний притиск) · 6012, 6013 (пневматичний притиск)': 'Models: 6010, 6011 (pedal squeeze) · 6012, 6013 (pneumatic squeeze)',
    'Міцна конструкція з плечима регульованої довжини та налаштовуваним ходом електрода. Додатково обладнана інверторним джерелом струму й електронним контролером параметрів — це забезпечує найвищу якість зварювання при високій енергоефективності.': 'Rugged construction with arms of adjustable length and adjustable electrode stroke. Additionally fitted with an inverter current source and an electronic parameter controller — that provides the highest welding quality at high energy efficiency.',
    'Усі моделі серії поєднує та сама надійна база. Плечі мають регульовану довжину, тому машину легко підлаштувати під розмір зварюваних деталей, а регульований хід електродів дає змогу обслуговувати елементи різної товщини. Трансформатор залитий у пластик, що захищає його від пошкоджень, а вода охолоджує його разом із тиристором, плечима та електродами — тому обладнання не втрачає продуктивності під час тривалої роботи. За керування відповідає мікропроцесорний контролер TE101, опційно — потужніший TE550.': 'All models in the series share the same reliable base. The arms have adjustable length, so the machine is easy to adapt to the size of the parts being welded, and adjustable electrode stroke lets you handle parts of different thickness. The transformer is encapsulated in plastic, which protects it from damage, and water cools it together with the thyristor, arms and electrodes — so the equipment does not lose output during prolonged work. Control is by a TE101 microprocessor controller, optionally a more powerful TE550.',
    'Педальний притиск': 'Pedal squeeze',
    'Силу натиску задає сам оператор, натискаючи педаль, а струм починає протікати лише після досягнення належного притиску. Проста й недорога в експлуатації конструкція не потребує установки стисненого повітря, а довжину педалі можна персоналізувати під оператора. Це добрий вибір для роботи меншої інтенсивності та всюди, де важливе нескладне обслуговування.': 'The operator sets the squeeze force by pressing the pedal, and current starts to flow only after the proper squeeze is reached. A simple, inexpensive-to-run construction needs no compressed-air installation, and pedal length can be customised to the operator. A good choice for lower-intensity work and wherever straightforward servicing matters.',
    'Пневматичний притиск': 'Pneumatic squeeze',
    'Тут натиск створює циліндр, що живиться стисненим повітрям — завдяки цьому він рівний, повторюваний і більший, ніж на педалі, незалежно від сили оператора. Натиск регулюється клапаном, а дроселі дають змогу налаштувати швидкість руху верхнього плеча. Двопозиційна електрична педаль дозволяє спершу притиснути деталі без струму, щоб точно їх виставити, а потім виконати саме зварювання.': 'Here squeeze is produced by a cylinder fed with compressed air — so it is even, repeatable and higher than on a pedal, regardless of the operator’s strength. Squeeze is adjusted by a valve, and throttles let you set the speed of the upper arm. A two-position electric pedal lets you first clamp the parts without current, to position them accurately, and then carry out the weld itself.',
    'Технічні параметри стаціонарних точкових машин із педальним притиском, моделі 4640–4644': 'Specifications of stationary spot machines with pedal squeeze, models 4640–4644',
    'Технічні параметри стаціонарних точкових машин із пневматичним притиском, моделі 4645–4649': 'Specifications of stationary spot machines with pneumatic squeeze, models 4645–4649',
    'Стаціонарні точкові машини — це обладнання базового сегмента, добре пристосоване до щоденної роботи майстерень, виробничих цехів і складальних постів. Найчастіше їх використовують для зʼєднання сталевих листів, а завдяки регулюванню довжини плечей і ходу електродів вони справляються з деталями різної форми й товщини.': 'Stationary spot machines are basic-segment equipment, well suited to everyday work in workshops, production shops and assembly stations. They are most often used for joining steel sheets, and thanks to adjustment of arm length and electrode stroke they handle parts of various shapes and thicknesses.',
    'зʼєднання сталевих листів у виробництві елементів і конструкцій із листового металу;': 'joining steel sheets in the production of sheet-metal parts and structures;',
    'робота в майстернях і на складальних постах, де потрібна надійна стаціонарна машина;': 'work in workshops and at assembly stations where a reliable stationary machine is needed;',
    'виробництво малих і середніх серій без застосування розгалуженої автоматики;': 'production of small and medium series without extensive automation;',
    'зварювання деталей різної товщини завдяки регулюванню плечей і ходу електродів;': 'welding parts of different thickness thanks to adjustment of arms and electrode stroke;',
    'завдання, що вимагають постійної якості зʼєднання, з вибором педального або пневматичного притиску залежно від інтенсивності роботи.': 'tasks that require consistent joint quality, with a choice of pedal or pneumatic squeeze depending on work intensity.',
    'Інверторні машини керують струмом зварювання в техніці середньої частоти, а не класичним змінним струмом 50 Гц. Імпульс струму завдяки цьому коротший і краще контрольований — це видно в якості зʼєднання, споживанні енергії та ресурсі електродів.': 'Inverter machines control welding current in medium-frequency technique, not classic 50 Hz alternating current. The current pulse is therefore shorter and better controlled — that shows in joint quality, energy consumption and electrode life.',
    'Нижче споживання потужності з мережі': 'Lower power consumption from the network',
    '— інвертор споживає менше енергії, ніж машини змінного струму з подібними можливостями.': '— the inverter consumes less energy than AC machines with similar capabilities.',
    'Коротший час протікання струму': 'Shorter current-flow time',
    '— краще контрольований імпульс покращує якість і вигляд зʼєднання.': '— a better-controlled pulse improves joint quality and appearance.',
    'Менший струм зварювання': 'Lower welding current',
    '— нижча сила струму продовжує ресурс електродів, а це рідші простої та нижчі витрати на експлуатацію.': '— lower current extends electrode life, which means fewer stoppages and lower running costs.',
    'Зварювання важкозварюваних матеріалів': 'Welding of difficult-to-weld materials',
    '— точне керування струмом дозволяє зʼєднувати матеріали, з якими класична машина справляється гірше.': '— precise current control makes it possible to join materials that a classic machine handles less well.',
    'Серія 6010–6013 спирається на перевірені конструкційні рішення. Плечі мають регульовану довжину, тому машину можна підлаштувати під розміри зварюваних деталей, а регульований хід електродів полегшує роботу з елементами різної товщини. Трансформатор залитий у пластик, що підвищує його стійкість, а вода охолоджує трансформатор, тиристор, плечі та електроди. За керування відповідає мікропроцесорний контролер': 'The 6010–6013 series is based on proven design solutions. The arms have adjustable length, so the machine can be adapted to the size of the parts being welded, and adjustable electrode stroke makes it easier to work with parts of different thickness. The transformer is encapsulated in plastic, which increases its durability, and water cools the transformer, thyristor, arms and electrodes. Control is by a microprocessor controller',
    ', на якому налаштовуються параметри зварювання.': ', on which welding parameters are set.',
    'У моделях 6010 і 6011 натиск задає оператор педаллю, а струм рушає лише після досягнення потрібного притиску. У моделях 6012 і 6013 притиск забезпечує пневматичний циліндр, який дає рівний повторюваний натиск і функцію одиничної та серійної роботи.': 'On models 6010 and 6011 squeeze is set by the operator with a pedal, and current starts only after the required squeeze is reached. On models 6012 and 6013 squeeze is provided by a pneumatic cylinder, which gives even, repeatable squeeze and single and series work functions.',
    'Технічні параметри інверторних стаціонарних точкових машин 25 кВА, моделі 6010–6013': 'Specifications of inverter stationary spot machines 25 kVA, models 6010–6013',
    'Усі машини цих серій працюють у діапазоні 16–25 кВА, а вибір конкретної моделі визначає передусім тип притиску, а також виліт плечей і сила притиску, підібрані під зварювані деталі.': 'All machines in these series work in the 16–25 kVA range, and the choice of a specific model is determined mainly by squeeze type, as well as arm reach and squeeze force selected for the parts being welded.',
    'Педальна версія — це нижча ціна, відсутність потреби в компресорі та простіше обслуговування. Підходить для роботи меншої інтенсивності. Пневматична версія дає рівний, повторюваний і більший натиск незалежно від оператора, а також двоетапний цикл (спершу позиціонування без струму, потім зварювання) — тому вона краще працює в серійному виробництві, де важлива стала якість кожного зʼєднання.': 'The pedal version is a lower price, no need for a compressor and simpler servicing. It suits lower-intensity work. The pneumatic version gives even, repeatable and higher squeeze regardless of the operator, and a two-stage cycle (first positioning without current, then welding) — so it works better in series production, where consistent quality of every joint matters.',
    'Коли важливі витрати на енергію та електроди, якість і вигляд зʼєднання, а також коли ви зварюєте важкозварювані матеріали. Інвертор дає коротший, точніше контрольований імпульс струму при нижчому споживанні з мережі.': 'When energy and electrode costs, joint quality and appearance matter, and when you weld difficult-to-weld materials. The inverter gives a shorter, more precisely controlled current pulse at lower draw from the network.',
    'Виліт визначає, наскільки глибоко можна дістатися до зварюваної точки. Але чим довші плечі, тим менша доступна сила притиску та струм короткого замикання. Тому виліт підбирають як компроміс: мінімальний, потрібний для геометрії вашої деталі. Ми допоможемо визначити його на основі креслення.': 'Reach determines how far you can get to the weld point. But the longer the arms, the lower the available squeeze force and short-circuit current. So reach is selected as a compromise: the minimum needed for the geometry of your part. We will help determine it from a drawing.',
    '2,5–90 кВА': '2.5–90 kVA',
    '16–25 кВА': '16–25 kVA',
    '35–315 кВА': '35–315 kVA',
    'Машини для точкового та рельєфного зварювання в техніках AC, DC і MFDC — від 35 до 315 кВА. Т-подібні плити для монтажу оснастки забезпечують максимальну точність притиску по осі циліндра.': 'Machines for spot and projection welding in AC, DC and MFDC techniques — from 35 to 315 kVA. T-slotted platens for tooling mounting provide maximum squeeze accuracy along the cylinder axis.',
    'Точково-рельєфні машини для металу мають можливість точкового та рельєфного зварювання в техніці AC, DC або MFDC. Як правило, вони мають Т-подібні плити для монтажу оснастки й отримання максимальної точності притиску по осі циліндра.': 'Spot-projection machines for metal can do both spot and projection welding in AC, DC or MFDC technique. As a rule they have T-slotted platens for tooling mounting and obtaining maximum squeeze accuracy along the cylinder axis.',
    'Циліндри понад 1242 даН мають послідовні камери з можливістю відключення однієї з них, функцію мʼякого підходу та сферичне крiплення стопи циліндра, що забезпечує точність контакту Т-подібних плит. На більших моделях цих машин зварюють масивні багатовиступні елементи, кільцеві герметичні виступи та нетипові виступи. Застосування': 'Cylinders above 1242 daN have series chambers with the option of isolating one of them, a soft-approach function and spherical mounting of the cylinder foot, which provides accurate contact of the T-slotted platens. On larger models of these machines massive multi-projection parts, annular leak-tight projections and non-standard projections are welded. The use of',
    'інверторної технології MFDC': 'MFDC inverter technology',
    'дає змогу отримувати відмінні результати також при зварюванні алюмінію, нержавіючих і покритих сталей, а також різнорідних матеріалів.': 'makes it possible to obtain excellent results also when welding aluminium, stainless and coated steels, and dissimilar materials.',
    'Модульна конструкція рами, плечей, зʼєднувачів і циліндрів дозволяє конфігурувати машину під конкретну оснастку та деталь.': 'Modular construction of the frame, arms, connectors and cylinders lets you configure the machine for specific tooling and the part.',
    'Точково-рельєфні машини змінного струму 35–80 кВА': 'AC spot-projection machines 35–80 kVA',
    'AC · 35–80 кВА': 'AC · 35–80 kVA',
    'Модульна конструкція рами, плечей, зʼєднувачів і циліндрів. Циліндри з хромованими стінками подовженого ресурсу, протиобертові. Безмастильна пневматика, що усуває викид масляного туману.': 'Modular construction of the frame, arms, connectors and cylinders. Cylinders with long-life chromed walls, anti-rotation. Lubrication-free pneumatics, which eliminates oil-mist emission.',
    'Енергоефективні інверторні машини 56 кВА, моделі 6073–6075': 'Energy-efficient inverter machines 56 kVA, models 6073–6075',
    'MFDC · 56 кВА': 'MFDC · 56 kVA',
    'Група охоплює моделі 6073, 6074 і 6075. Використання інверторної техніки підвищує культуру роботи обладнання, забезпечує високу енергоефективність, відмінну якість зʼєднання та довший ресурс електродів.': 'The group covers models 6073, 6074 and 6075. Using inverter technique raises the equipment’s working culture, provides high energy efficiency, excellent joint quality and longer electrode life.',
    'Інверторні точково-рельєфні машини 90–200 кВА, моделі 6121N–6129N': 'Inverter spot-projection machines 90–200 kVA, models 6121N–6129N',
    'MFDC · 90–200 кВА': 'MFDC · 90–200 kVA',
    'Машини 6121N–6129N завдяки міцній стальній конструкції в поєднанні з інверторною технологією дають змогу отримувати найвищу якість зʼєднань. Шість режимів роботи контролера TE700 дозволяють вибрати найкращий для конкретних матеріалів.': 'Machines 6121N–6129N, thanks to a rugged steel construction combined with inverter technology, make it possible to obtain the highest joint quality. Six operating modes of the TE700 controller let you choose the best for the specific materials.',
    'Точково-рельєфні машини змінного струму 63–163 кВА': 'AC spot-projection machines 63–163 kVA',
    'AC · 63–163 кВА': 'AC · 63–163 kVA',
    'Рельєфні машини змінного струму 80–315 кВА': 'AC projection machines 80–315 kVA',
    'AC · 80–315 кВА': 'AC · 80–315 kVA',
    'Найбільші машини змінного струму в цій групі — для масивних багатовиступних елементів, кільцевих герметичних виступів і нетипових виступів. Модульна конструкція та протиобертові циліндри.': 'The largest AC machines in this group — for massive multi-projection parts, annular leak-tight projections and non-standard projections. Modular construction and anti-rotation cylinders.',
    'Точково-рельєфні машини постійного струму 100 кВА': 'DC spot-projection machines 100 kVA',
    'DC · 100 кВА': 'DC · 100 kVA',
    'Відмінні властивості при зварюванні чистого алюмінію або його зварюваних сплавів, міді та латуні. Високе значення коефіцієнта потужності. Зменшене навантаження на мережу живлення при покращених можливостях зварювання.': 'Excellent properties when welding pure aluminium or its weldable alloys, copper and brass. High power-factor value. Reduced load on the supply network with improved welding capability.',
    'Модульна конструкція рами, плечей, зʼєднувачів і циліндрів дозволяє конфігурувати машину під конкретну деталь і оснастку.': 'Modular construction of the frame, arms, connectors and cylinders lets you configure the machine for a specific part and tooling.',
    'Хромовані стінки циліндрів подовженого ресурсу, протиобертове виконання. Циліндри понад 1242 даН мають послідовні камери з можливістю відключення однієї з них та функцію мʼякого підходу.': 'Long-life chromed cylinder walls, anti-rotation design. Cylinders above 1242 daN have series chambers with the option of isolating one of them and a soft-approach function.',
    'Елементи пневматики не потребують змащення, що усуває викид масляного туману в приміщенні.': 'Pneumatic components need no lubrication, which eliminates oil-mist emission in the room.',
    'Т-подібні плити для монтажу оснастки та сферичне крiплення стопи циліндра забезпечують максимальну точність притиску по осі циліндра й точний контакт плит.': 'T-slotted platens for tooling mounting and spherical mounting of the cylinder foot provide maximum squeeze accuracy along the cylinder axis and accurate platen contact.',
    'Точково-рельєфні машини — це база для автоматизованих і роботизованих зварювальних комплексів. Ми проєктуємо оснастку з ручним або повністю автоматичним базуванням деталі, системи подачі гайок і кронштейнів, а також контроль якості зʼєднання.': 'Spot-projection machines are the base for automated and robotic welding cells. We design tooling with manual or fully automatic part locating, nut and bracket feeding systems, and joint-quality control.',
    'Роботизоване рельєфне зварювання гайки з застосуванням робота': 'Robotic projection welding of a nut using a robot',
    'У точковому зварюванні місце зʼєднання визначає форма електрода, який притискає листи. У рельєфному зварюванні місце зʼєднання визначає геометрія самої деталі — технологічний виступ (гарб). Електроди тут мають форму плоских плит, тому одним циклом можна зварити кілька виступів одночасно. Це швидше й повторюваніше — типово для гайок, кронштейнів, шпильок і штампованих деталей із виступами.': 'In spot welding the joint location is determined by the shape of the electrode that presses the sheets. In projection welding the joint location is determined by the geometry of the part itself — a process projection (nub). The electrodes here are flat platens, so several projections can be welded in one cycle. That is faster and more repeatable — typical for nuts, brackets, studs and stamped parts with projections.',
    '— універсальне й економічне рішення для сталі, у тому числі покритої.': '— a universal and economical solution for steel, including coated steel.',
    '— там, де потрібен великий струм за довший час: масивні багатовиступні деталі, кільцеві герметичні виступи, а також алюміній, мідь і латунь.': '— where a high current for a longer time is needed: massive multi-projection parts, annular leak-tight projections, and also aluminium, copper and brass.',
    '(інвертор середньої частоти) — найвища точність керування, менша споживана потужність, довший ресурс електродів; найкращий вибір для нержавіючої сталі, алюмінію та різнорідних пар матеріалів.': '(medium-frequency inverter) — the highest control accuracy, lower power consumption, longer electrode life; the best choice for stainless steel, aluminium and dissimilar material pairs.',
    'Так — на більших моделях цієї групи. Кільцевий герметичний виступ вимагає великої рівномірної сили притиску та точної паралельності плит, тому потрібні машини з відповідним циліндром, сферичним крiпленням стопи та якісною оснасткою. Ми підбираємо конфігурацію під конкретне креслення.': 'Yes — on larger models in this group. An annular leak-tight projection requires a large, even squeeze force and accurate platen parallelism, so machines with a suitable cylinder, spherical foot mounting and quality tooling are needed. We select the configuration for the specific drawing.',
    'DA — інверторні пристрої i12 та i16 для приварювання шпильок': 'DA — inverter units i12 and i16 for stud welding',
    'Багатофункціональні інверторні машини E-tech — SMOLTECH': 'Multifunction inverter E-tech machines — SMOLTECH',
    'Комплекси ЧПК для автоматичного приварювання шпильок — SMOLTECH': 'CNC cells for automatic stud welding — SMOLTECH',
    'CDM — конденсаторні пристрої приварювання шпильок Ø2–Ø10': 'CDM — capacitor stud-welding units Ø2–Ø10',
    'Точково-рельєфні машини з лінійним притиском — SMOLTECH': 'Spot-projection machines with linear squeeze — SMOLTECH',
    /* === EN PATCH 20260901 === */
  'Плечі мають регульовану довжину, тому машину легко підлаштувати під розмір зварюваних деталей, а регульований хід електродів дає змогу обслуговувати елементи різної товщини. Трансформатор залитий у пластик, що захищає його від пошкоджень, а вода охолоджує його разом із тиристором, плечима та електродами — тому обладнання не втрачає продуктивності під час тривалої роботи. За керування відповідає мікропроцесорний контролер TE101, опційно — потужніший TE550.': 'The arms have adjustable length, so the machine is easy to match to the size of the parts being welded, and the adjustable electrode stroke handles elements of different thicknesses. The transformer is resin-encapsulated for protection, and water cools it together with the thyristor, arms and electrodes — so the equipment keeps its output during long shifts. Control is handled by the TE101 microprocessor controller, optionally the more powerful TE550.',
  'Плечі мають регульовану довжину, тому машину можна підлаштувати під розміри зварюваних деталей, а регульований хід електродів полегшує роботу з елементами різної товщини. Трансформатор залитий у пластик, що підвищує його стійкість, а вода охолоджує трансформатор, тиристор, плечі та електроди. За керування відповідає мікропроцесорний контролер': 'The arms have adjustable length, so the machine can be matched to the dimensions of the parts being welded, and the adjustable electrode stroke makes work with elements of different thicknesses easier. The transformer is resin-encapsulated for durability, and water cools the transformer, thyristor, arms and electrodes. Control is handled by the microprocessor controller',
  'Циліндри понад 1242 даН мають послідовні камери з можливістю відключення однієї з них, функцію мʼякого підходу та сферичне крiплення стопи циліндра, що забезпечує точність контакту Т-подібних плит. На більших машинах цієї групи зварюють масивні багатовиступні елементи, кільцеві герметичні виступи та нетипові виступи. Застосування': 'Cylinders above 1242 daN have sequential chambers with the option to disable one of them, a soft-approach function and a spherical cylinder-foot mount that keeps T-slot platens accurately in contact. Larger machines in this group weld heavy multi-projection parts, annular sealing projections and non-standard projections. Applications',
  'Ця група має водяне охолодження, регульований попередній і робочий хід електродів, регулювання сили притиску та швидкості руху плечей. Доступність багатьох варіантів — за потужністю, довжиною плечей і силою притиску — дозволяє підібрати обладнання і для зварювання тонкого листа, і для складніших сталевих елементів.': 'This group has water cooling, adjustable approach and working electrode stroke, and adjustable squeeze force and arm travel speed. A wide choice of ratings — by power, arm length and squeeze force — lets you match equipment for thin sheet and for more demanding steel parts alike.',
  'CDM підходить для діаметрів Ø2–Ø10 мм на тонкому, плоскому й чистому матеріалі — короткий розряд (1–3 мс) і майже непомітний слід на звороті. DA (інверторна дуга) охоплює Ø3–Ø16 мм, працює також на товстішому матеріалі; цикл довше (10–1000 мс), слід помітніший, продуктивність типово 20–30 шпильок/хв.': 'CDM suits diameters Ø2–Ø10 mm on thin, flat and clean material — a short discharge (1–3 ms) and an almost invisible mark on the reverse. DA (inverter arc) covers Ø3–Ø16 mm and also works on thicker stock; the cycle is longer (10–1000 ms), the mark more visible, typical output 20–30 studs/min.',
  'Інверторну версію 25 кВА варто розглядати, коли важливі витрати на енергію та електроди, якість і вигляд зʼєднання або зварювання важкозварюваних матеріалів. Виліт плечей підбирають як компроміс: мінімальний, потрібний для геометрії деталі — бо чим довші плечі, тим менша доступна сила притиску.': 'The 25 kVA inverter version is worth considering when energy and electrode costs, joint quality and appearance, or hard-to-weld materials matter. Arm throat is chosen as a compromise: the minimum needed for part geometry — because the longer the arms, the lower the available squeeze force.',
  'Базові точкові машини потужністю від 16 до 25 кВА, призначені передусім для зварювання листового металу. Відмінна риса групи — вибір типу притиску електродів: доступні варіанти з педальним і з пневматичним притиском. Саме від нього залежить спосіб роботи, продуктивність і сфера застосування.': 'Standard spot welders from 16 to 25 kVA, intended mainly for sheet-metal welding. The distinctive feature of the group is the choice of electrode squeeze: pedal and pneumatic options are available. That choice drives how you work, the output and the field of use.',
  'Так — на більших машинах цієї групи. Кільцевий герметичний виступ вимагає великої рівномірної сили притиску та точної паралельності плит, тому потрібні машини з відповідним циліндром, сферичним крiпленням стопи та якісною оснасткою. Ми підбираємо конфігурацію під конкретне креслення.': 'Yes — on the larger machines in this group. An annular sealing projection needs high, even squeeze force and accurate platen parallelism, so you need a machine with a suitable cylinder, spherical foot mount and quality tooling. We match the configuration to the specific drawing.',
  'Стаціонарні точкові машини добре пристосовані до щоденної роботи майстерень, виробничих цехів і складальних постів. Найчастіше їх використовують для зʼєднання сталевих листів, а завдяки регулюванню довжини плечей і ходу електродів вони справляються з деталями різної форми й товщини.': 'Stationary spot welders suit day-to-day work in workshops, production halls and assembly stations. They are most often used to join steel sheets, and with adjustable arm length and electrode stroke they handle parts of different shapes and thicknesses.',
  'Найменші машини цієї групи (2,5–6 кВА) мають ручний притиск, більші — пневматичний з штовхаючим циліндром (6–38 кВА) або з тягнучим горизонтальним (38–50 кВА). Вони працюють на трансформаторах AC 50 Гц або на інверторних MFDC середньої частоти, наприклад 1000 Гц.': 'The smallest machines in this group (2.5–6 kVA) have manual squeeze; larger ones use pneumatic push cylinders (6–38 kVA) or horizontal pull cylinders (38–50 kVA). They run on AC 50 Hz transformers or medium-frequency MFDC inverters, for example 1000 Hz.',
  'У точковому зварюванні зʼєднання виконуються послідовно — рішення для менших серій і нетипових виробів. Багатоточкові машини зварюють цілий ряд вузлів за один цикл і дають вищу продуктивність при серійному виробництві панелей огорожі чи будівельних сіток.': 'In spot welding the joints are made one after another — a solution for smaller batches and non-standard products. Multi-spot machines weld a whole row of nodes in one cycle and deliver higher output in series production of fence panels or construction mesh.',
  'Кліщові точкові машини вирізняються високою якістю роботи, досягнутою завдяки сучасній раціональній конструкції та зменшеним габаритам. Вони мають вбудований сучасний мікропроцесорний контролер, який дає змогу точно налаштовувати параметри зварювання.': 'Gun-type spot welders stand out for high working quality, thanks to a modern, efficient design and compact dimensions. They have a built-in modern microprocessor controller that lets you set weld parameters precisely.',
  'Конденсаторна технологія — природний вибір для шпильок Ø2–Ø10 мм на тонкому матеріалі, коли важливі швидкість циклу та мінімальний слід на зворотному боці. Конкретну конфігурацію (ємність, пістолети, автоматизація) підберемо під ваше завдання.': 'Capacitor-discharge technology is the natural choice for Ø2–Ø10 mm studs on thin material when cycle speed and a minimal mark on the reverse side matter. We will match the specific configuration (capacitance, guns, automation) to your task.',
  'Гіроскопічне підвішування та балансир забезпечують вільний рух машини й мінімум фізичного навантаження на оператора. Діапазон потужностей дозволяє підібрати обладнання як для дрібних ремонтних робіт, так і для промислового виробництва.': 'Gyroscopic suspension and a balancer give the machine free movement and minimum physical load on the operator. The power range lets you match equipment for light repair work and for industrial production alike.',
  'У педальній версії натиск задає оператор, а струм рушає лише після досягнення потрібного притиску. У пневматичній версії притиск забезпечує циліндр, який дає рівний повторюваний натиск і функцію одиничної та серійної роботи.': 'In the pedal version the operator sets the squeeze, and current starts only after the required force is reached. In the pneumatic version a cylinder provides squeeze — even, repeatable force with single-shot and series modes.',
  'Усі прути подаються автоматично трьома подавачами з буферними накопичувачами. Обладнання оснащене системою палетизації готових панелей і поворотним столом для відбору панелей автонавантажувачем під час роботи машини.': 'All wires are fed automatically by three feeders with buffer magazines. The equipment includes a palletising system for finished panels and a turntable so a forklift can remove panels while the machine is running.',
  'Обладнання спроєктовано для високоякісних зварних зʼєднань із високою продуктивністю та оптимізованими витратами на установку. Машини мають великі сили притиску електродів, зменшені габарити й безпечні компоненти.': 'The equipment is designed for high-quality weld joints with high output and optimised installation costs. The machines offer high electrode squeeze forces, compact dimensions and safe components.',
  'Серія E-tech призначена для точкового зварювання листа та просторових деталей у майстернях і на промислових лініях. Конкретну конфігурацію — потужність, кліщі, програми контролера — підбираємо під ваше завдання.': 'The E-tech series is intended for spot welding sheet and 3D parts in workshops and on industrial lines. We match the specific configuration — power, guns, controller programmes — to your task.',
  'Ступінь автоматизації підбираємо під виробництво: від ручного укладання прутів у шаблонах, через автоматичні подавачі для сіток 2D і 3D, до пресів загинання панелей і систем палетизації. Компоненти зварювання —': 'We match the automation level to the production: from hand-loading wires into templates, through automatic feeders for 2D and 3D mesh, to panel-bending presses and palletising systems. Welding components —',
  'DA підходить для шпильок більшого діаметра (до Ø16 мм) і товстішого основного матеріалу. Струм зварювання та час циклу налаштовуються під конкретну шпильку й матеріал — ми допоможемо підібрати конфігурацію.': 'DA suits larger-diameter studs (up to Ø16 mm) and thicker base material. Weld current and cycle time are set for the specific stud and material — we will help match the configuration.',
  'Так. Ми виготовляємо обладнання для промислових підприємств Польщі, України та інших країн. Спілкуємося українською, польською та англійською. Напишіть нам — обговоримо технологію, підбір обладнання та умови постачання.': 'Yes. We build equipment for industrial plants in Poland, Ukraine and other countries. We communicate in Ukrainian, Polish and English. Write to us — we will discuss the process, equipment selection and supply terms.',
  'Проєктуємо й будуємо машини для зварювання сіток та повні автоматичні лінії під конкретний виріб і продуктивність — від окремих постів до ліній з автоматичною подачею прутів і відбором готових виробів.': 'We design and build mesh welding machines and complete automatic lines for a specific product and output — from individual stations to lines with automatic wire feed and removal of finished parts.',
  'Автоматичне зварювання панелей максимальних розмірів 2500 × 2500 мм із прутів Ø3–8 мм. Три подавачі: поперечний, продовжній і бічний — для додаткового нижнього поперечного прута в панелях 2D.': 'Automatic welding of panels up to 2500 × 2500 mm from Ø3–8 mm wires. Three feeders: cross, longitudinal and side — for an extra lower cross wire in 2D panels.',
  'Роботизовані комплекси, автоматичні машини для точкового, рельєфного й шовного зварювання, лінії для сіток і приварювання шпильок. Одна спеціалізація — повний контроль від проєкту до пуску.': 'Robotic cells, automatic machines for spot, projection and seam welding, mesh lines and stud welding. One specialism — full control from design to start-up.',
  'Пристрої CDM ми використовуємо як джерела струму в автоматизованих комплексах ЧПК нашого виробництва — разом із вібраційними подавачами шпильок і автоматичними головками SIK2 або SIK100.': 'We use CDM units as power sources in automated CNC cells of our own build — together with vibratory stud feeders and automatic heads SIK2 or SIK100.',
  'Старші моделі групи рекомендовані як джерела живлення на автоматизованих і роботизованих постах — після підключення автоматичного подавача шпильок і автоматичної головки SIK2 або SIK100.': 'Older models in the group are recommended as power sources on automated and robotic stations — after connecting an automatic stud feeder and automatic head SIK2 or SIK100.',
  'Міцна стальна конструкція в поєднанні з інверторною технологією дає найвищу якість зʼєднань. Контролер із кількома режимами роботи дозволяє вибрати найкращий для конкретних матеріалів.': 'A rigid steel frame combined with inverter technology delivers the highest joint quality. A controller with several operating modes lets you choose the best for specific materials.',
  'Усі машини цих груп працюють у діапазоні 16–25 кВА. Вибір визначають передусім тип притиску, виліт плечей і сила притиску під ваші деталі, а також те, чи потрібна інверторна техніка.': 'All machines in these groups run in the 16–25 kVA range. The choice is driven mainly by squeeze type, arm throat and squeeze force for your parts, and whether inverter technology is needed.',
  'Відмінні властивості при зварюванні чистого алюмінію або його зварюваних сплавів, міді та латуні. Високе значення коефіцієнта потужності та зменшене навантаження на мережу живлення.': 'Excellent performance when welding pure aluminium or its weldable alloys, copper and brass. High power factor and reduced load on the supply network.',
  'Швидкість приварювання залежить від розміру та діаметра шпильки (типово до 20–30 шпильок/хв). Для діаметрів до Ø10 мм і тонкого основного матеріалу часто економічнішим рішенням буде': 'Stud welding rate depends on stud size and diameter (typically up to 20–30 studs/min). For diameters up to Ø10 mm and thin base material a more economical solution is often',
  'На обладнанні SMOLTECH виробляють панелі огорожі 2D і 3D, будівельні та армувальні сітки, габіони, гірничі сітки, кратниці, а також нетипові вироби — наприклад пера жалюзійних сит.': 'SMOLTECH equipment produces 2D and 3D fence panels, construction and reinforcing mesh, gabions, mining mesh, gratings, and non-standard products — for example louvre-screen fins.',
  'Точкова — вузол за вузлом, гнучкіша щодо форми сітки, для менших серій. Багатоточкова — цілий ряд вузлів за цикл, для серійного виробництва панелей огорожі та будівельних сіток.': 'Spot — node by node, more flexible on mesh shape, for smaller batches. Multi-spot — a whole row of nodes per cycle, for series production of fence panels and construction mesh.',
  'У асортименті — машини змінного струму 16–25 кВА та інверторні 25 кВА. Тип притиску (педальний або пневматичний) підбираємо під інтенсивність роботи та вимоги до повторюваності.': 'The range includes AC machines 16–25 kVA and inverter 25 kVA. We match the squeeze type (pedal or pneumatic) to work intensity and repeatability requirements.',
  'SMOLTECH Technika Zgrzewalnicza Sp. z o. o. — конструкторське бюро й виробництво в Мокроносі-Дольному. Проєктуємо й будуємо обладнання під конкретну деталь і такт лінії.': 'SMOLTECH Technika Zgrzewalnicza Sp. z o. o. — design office and production in Mokronos Dolny. We design and build equipment for a specific part and line cycle time.',
  'Модульна конструкція рами, плечей, зʼєднувачів і циліндрів дозволяє конфігурувати машину під конкретну оснастку та деталь. Діапазон потужності — від 35 до 315 кВА.': 'A modular frame, arms, connectors and cylinders let you configure the machine for specific tooling and parts. Power range — from 35 to 315 kVA.',
  'Так: подавачі поперечних, продовжніх і бічних прутів, преси для панелей 3D, палетизація та поворотні столи для відбору автонавантажувачем під час роботи машини.': 'Yes: feeders for cross, longitudinal and side wires, presses for 3D panels, palletising and turntables for forklift removal while the machine is running.',
  '(Італія). Автоматика, оптика, пневматика й сервоприводи — від перевірених світових виробників. На виході: промислові автомати під реальний процес замовника.': '(Italy). Controls, optics, pneumatics and servos — from proven global manufacturers. The result: industrial automation built around the customer’s real process.',
  'Ми працюємо з двома основними групами підвісних кліщів: змінного струму середньої потужності та інверторними машинами для інтенсивної промислової роботи.': 'We work with two main groups of suspended guns: medium-power AC and inverter machines for intensive industrial use.',
  'Модульна конструкція рами, плечей, зʼєднувачів і циліндрів. Циліндри з хромованими стінками подовженого ресурсу, протиобертові. Безмастильна пневматика.': 'Modular construction of frame, arms, connectors and cylinders. Long-life chrome-bore cylinders, anti-rotation. Oil-free pneumatics.',
  'У реалізованих машинах — панелі до 2500 × 2500 мм (Ø3–8 мм) і сітки до 1600 × 4000 мм (Ø3–10 мм, вічко 20–200 мм). Межі визначаємо на етапі концепції.': 'On machines already built — panels up to 2500 × 2500 mm (Ø3–8 mm) and mesh up to 1600 × 4000 mm (Ø3–10 mm, mesh opening 20–200 mm). Limits are set at the concept stage.',
  'Інверторна техніка підвищує культуру роботи обладнання, забезпечує високу енергоефективність, відмінну якість зʼєднання та довший ресурс електродів.': 'Inverter technology raises the working standard of the equipment, delivering high energy efficiency, excellent joint quality and longer electrode life.',
  'Портальна стальна конструкція з 12 зварювальними циліндрами над робочим полем. Два інверторні трансформатори по 90 кВА (P=50%) з обох боків портала.': 'A portal steel frame with 12 welding cylinders above the work area. Two inverter transformers of 90 kVA each (P=50%) on both sides of the portal.',
  'Асортимент охоплює чотири групи обладнання — від мобільних кліщів для великих корпусів до інверторних машин для кузовних і складальних робіт:': 'The range covers four equipment groups — from mobile guns for large housings to inverter machines for body and assembly work:',
  'Автоматична лінія на 4 інверторних трансформаторах 1000 Гц по 200 кВА (P-50%) і 51 трикамерному зварювальному циліндрі. Три подавачі прутів.': 'An automatic line on 4 inverter transformers 1000 Hz at 200 kVA each (P-50%) and 51 three-chamber welding cylinders. Three wire feeders.',
  '— компактні переносні пристрої для мʼякої та нержавіючої сталі, алюмінію й латуні; мінімальний слід на зворотному боці, до 50 шпильок/хв.': '— compact portable units for mild and stainless steel, aluminium and brass; minimal mark on the reverse side, up to 50 studs/min.',
  'Девʼять подвійних зварювальних модулів із інтегрованим трансформатором 32 кВА (P=50%) і силою притиску електродів 2×260 даН (при 6 бар).': 'Nine twin welding modules with an integrated 32 kVA transformer (P=50%) and electrode squeeze force 2×260 daN (at 6 bar).',
  'дає рівний, повторюваний натиск і двоетапний цикл (позиціонування без струму, потім зварювання) — краще для серійного виробництва.': 'gives even, repeatable squeeze and a two-stage cycle (positioning without current, then welding) — better for series production.',
  'Прут Ø3–10 мм, вічко 20–200 мм. Вузли постійного струму 400 кВА (P-50%) і 15 пневматичних циліндрів із силою притиску 760 даН.': 'Wire Ø3–10 mm, mesh opening 20–200 mm. DC packs 400 kVA (P-50%) and 15 pneumatic cylinders with squeeze force 760 daN.',
  '— нижча ціна, відсутність потреби в компресорі та простіше обслуговування; підходить для роботи меншої інтенсивності.': '— lower price, no need for a compressor and simpler maintenance; suited to lower-intensity work.',
  'Зварювання сіток — панелей огорожі та переносних будівельних огорож — зі змінними шаблонами й системою палетизації.': 'Mesh welding — fence panels and portable construction fencing — with interchangeable templates and a palletising system.',
  'Продуктивні інверторні пристрої для приварювання тягнутою дугою шпильок зі зменшеною основою й діаметром до 16 мм.': 'High-output inverter units for drawn-arc welding of reduced-base studs up to 16 mm diameter.',
  'Економічні й надійні конденсаторні пристрої — міцне та швидке приварювання шпильок до тонких основних матеріалів.': 'Economical and reliable capacitor-discharge units — strong, fast stud welding to thin base materials.',
  'Приклади реалізацій SMOLTECH. Кожну машину підбираємо під тип сітки, діаметр прутів і плановану продуктивність.': 'Examples of SMOLTECH installations. We match each machine to mesh type, wire diameter and planned output.',
  '— автоматизовані комплекси нашого виробництва з вібраційними подавачами та конденсаторними джерелами струму.': '— automated cells of our own build with vibratory feeders and capacitor-discharge power sources.',
  '— дугове обладнання i12 та i16 для більших діаметрів і товстішого матеріалу; методи Drawn Arc і Short Cycle.': '— arc equipment i12 and i16 for larger diameters and thicker material; Drawn Arc and Short Cycle methods.',
  '(Італія), плюс вузли автоматики, електроніки, оптики, пневматики та серводвигунів від визнаних виробників.': '(Italy), plus automation, electronics, optics, pneumatics and servo-motor packs from recognised manufacturers.',
  'Автопром, металообробка, електротехніка, меблі — частина підприємств, для яких ми проєктували обладнання.': 'Automotive, metalworking, electrical engineering, furniture — some of the plants for which we have designed equipment.',
  'На кожному етапі замовник має підтримку нашої команди: від технології зварювання до сервісу й запчастин.': 'At every stage the customer has support from our team: from welding process to service and spare parts.',
  'Тип сітки, діаметр прутів, розміри виробу та планована продуктивність — від цього залежить конфігурація.': 'Mesh type, wire diameter, product size and planned output — that is what drives the configuration.',
  'Британський виробник обладнання для приварювання шпильок — понад 35 років на ринках Європи та світу.': 'A British manufacturer of stud welding equipment — over 35 years on European and world markets.',
  '1. Інверторна машина SW-51/5×200/MF для сіток і панелей огорожі 2D і 3D зі столом, що обертається': '1. Inverter machine SW-51/5×200/MF for mesh and 2D and 3D fence panels with a rotating table',
  'TAYLOR Studwelding Systems Limited: обладнання для шпильок і комплекси ЧПК на базі систем TAYLOR.': 'TAYLOR Studwelding Systems Limited: stud equipment and CNC cells based on TAYLOR systems.',
  '3. Інверторна багатоточкова машина SW-9/2×240/MF для сіток і переносних будівельних огорож': '3. Inverter multi-spot machine SW-9/2×240/MF for mesh and portable construction fencing',
  'На карті одночасно видно локацію компанії біля Вроцлава і Львів.': 'The map shows the company location near Wrocław and Lviv at the same time.',
  '— для листа, прута та просторових деталей із педальним або пневматичним притиском.': '— for sheet, wire and 3D parts with pedal or pneumatic squeeze.',
  '7. Багатоточкова машина постійного струму SW-15/1×400 для сіток до 1600 × 4000 мм': '7. DC multi-spot machine SW-15/1×400 for mesh up to 1600 × 4000 mm',
  '(Познань). Разом розвиваємо проєкти на технології TECNA та холодильні агрегати': '(Poznań). Together we develop projects on TECNA technology and chillers',
  '4. Інверторна багатоточкова машина SW-51/4×180 для огорожних і габіонних сіток': '4. Inverter multi-spot machine SW-51/4×180 for fence and gabion mesh',
  '2. Інверторна багатоточкова машина SW-51/5×200/MF для панелей огорожі 2D і 3D': '2. Inverter multi-spot machine SW-51/5×200/MF for 2D and 3D fence panels',
  '5. Багатоточкова машина SW-18/9×32/AC для сіток зі сталевих прутів у шаблонах': '5. Multi-spot machine SW-18/9×32/AC for steel-wire mesh in templates',
  'Від креслення в Inventor — до збирання на заводі й офісної підтримки проєкту.': 'From a drawing in Inventor — to assembly at the plant and office project support.',
  'Цех у Мокроносі-Дольному — збирання багатоточкової машини для панелей огорожі': 'Hall in Mokronos Dolny — assembling a multi-spot machine for fence panels',
  'Mokronos Dolny біля Вроцлава, Польща. Відповідаємо українською, польською та англійською.': 'Mokronos Dolny near Wrocław, Poland. We answer in Ukrainian, Polish and English.',
  '— для просторових і великих деталей, коли стаціонарна машина неефективна.': '— for 3D and large parts when a stationary machine is inefficient.',
  '6. Інверторна багатоточкова машина SW-12/2×90/MF для пер жалюзійних сит': '6. Inverter multi-spot machine SW-12/2×90/MF for louvre-screen fins',
  'Інверторні багатофункціональні машини E-tech зі зварювальними кліщами': 'Inverter multifunction E-tech machines with welding guns',
  '— для деталей із технологічними виступами в техніках AC, DC або MFDC.': '— for parts with process projections in AC, DC or MFDC.',
  'Пристрої групи DA можуть застосовуватися для приварювання шпильок': 'DA-group units can be used for stud welding',
  'Підвісні кліщові машини з вбудованим трансформатором (2,5–90 кВА)': 'Suspended gun welders with built-in transformer (2.5–90 kVA)',
  '— для складальних і сервісних ліній, зокрема кузовних деталей.': '— for assembly and service lines, including body parts.',
  'Машини контактного зварювання з власного заводу під Вроцлавом': 'Resistance welding machines from our own plant near Wrocław',
  '— для листового металу, прута навхрест і просторових деталей.': '— for sheet metal, cross-wire and 3D parts.',
  '— лінійний притиск для деталей із технологічними виступами.': '— linear squeeze for parts with process projections.',
  'Інверторні пристрої для приварювання шпильок від Ø3 до Ø16': 'Inverter units for stud welding from Ø3 to Ø16',
  'AC · 63–163 кВА — точково-рельєфні машини змінного струму': 'AC · 63–163 kVA — AC spot-projection machines',
  'Точково-рельєфні машини з лінійним притиском (35–315 кВА)': 'Spot-projection machines with linear squeeze (35–315 kVA)',
  'AC · 35–80 кВА — точково-рельєфні машини змінного струму': 'AC · 35–80 kVA — AC spot-projection machines',
  'DC · 100 кВА — точково-рельєфні машини постійного струму': 'DC · 100 kVA — DC spot-projection machines',
  'Конструкторський відділ: проєктування зварювальних машин': 'Design office: welding machine design',
  'MFDC · 90–200 кВА — інверторні точково-рельєфні машини': 'MFDC · 90–200 kVA — inverter spot-projection machines',
  'Кліщові підвісні машини точкового зварювання 16–38 кВА': 'Suspended spot-welding guns 16–38 kVA',
  'Роботизований комплекс контактного зварювання SMOLTECH': 'SMOLTECH robotic resistance welding cell',
  'Багатофункціональні інверторні машини (серія E-tech)': 'Multifunction inverter machines (E-tech series)',
  'Інверторні стаціонарні точкові машини 25 кВА (MFDC)': 'Inverter stationary spot welders 25 kVA (MFDC)',
  'SMOLTECH на карті Польщі / Європи — Mokronos Dolny': 'SMOLTECH on the map of Poland / Europe — Mokronos Dolny',
  'Впровадження на лінії, навчання персоналу, сервіс.': 'Line introduction, operator training, service.',
  '. Вони працюють із пістолетами DA2A, DA7B і DA8A.': '. They work with guns DA2A, DA7B and DA8A.',
  'AC · 80–315 кВА — рельєфні машини змінного струму': 'AC · 80–315 kVA — AC projection machines',
  'MFDC · 56 кВА — енергоефективні інверторні машини': 'MFDC · 56 kVA — energy-efficient inverter machines',
  'Підбір процесу й обладнання під ваше виробництво.': 'Process and equipment selection for your production.',
  '— серія E-tech для складальних і сервісних ліній.': '— E-tech series for assembly and service lines.',
  'Трансформатори, керування, холодильні агрегати.': 'Transformers, controls, chillers.',
  'Компоненти TECNA та світовий рівень автоматики': 'TECNA components and world-class automation',
  'Понад десять років — лише контактне зварювання': 'Over ten years — resistance welding only',
  'Інверторні стаціонарні точкові машини 25 кВА': 'Inverter stationary spot welders 25 kVA',
  'Комплекси ЧПК для автоматичного приварювання': 'CNC cells for automatic stud welding',
  'Надішліть креслення — підберемо конфігурацію': 'Send a drawing — we will match the configuration',
  'Інверторні підвісні машини 56–90 кВА (MFDC)': 'Inverter suspended machines 56–90 kVA (MFDC)',
  'Комплекси та оснастка під конкретну деталь.': 'Cells and tooling for a specific part.',
  'Машини і лінії для сіток та панелей огорожі': 'Machines and lines for mesh and fence panels',
  'Коли обирати дугову інверторну технологію': 'When to choose inverter arc technology',
  'Стаціонарні точкові машини 16–25 кВА (AC)': 'Stationary spot welders 16–25 kVA (AC)',
  'CDM — конденсаторне приварювання Ø2–Ø10': 'CDM — capacitor discharge Ø2–Ø10',
  'Приводи, балансири, тримачі, електроди.': 'Actuators, balancers, holders, electrodes.',
  'Як підібрати стаціонарну точкову машину': 'How to choose a stationary spot welder',
  'Кліщові підвісні машини 16–38 кВА (AC)': 'Suspended guns 16–38 kVA (AC)',
  'Стаціонарні точкові машини (16–25 кВА)': 'Stationary spot welders (16–25 kVA)',
  'Спілкуємося українською, польською та англійською.': 'We communicate in Ukrainian, Polish and English.',
  'Підказати технологію під вашу деталь': 'Suggest a process for your part',
  'Не машина в ящику — готове рішення': 'Not a machine in a crate — a ready solution',
  'Оснащення інверторних пристроїв DA': 'Equipment for DA inverter units',
  'Точково-рельєфні машини 35–315 кВА': 'Spot-projection machines 35–315 kVA',
  'Базові точкові та рельєфні машини': 'Standard spot and projection machines',
  'Підібрати конфігурацію під деталь': 'Match a configuration to the part',
  'Підібрати машину для вашої деталі': 'Find a machine for your part',
  'З чого починається підбір машини': 'Where machine selection starts',
  'Група, дистрибуція, реквізити': 'Group, distribution, company details',
  'Меблі, HVAC, побутова техніка': 'Furniture, HVAC, household appliances',
  'Запитати про цю конфігурацію': 'Ask about this configuration',
  'Конструкція та застосування': 'Design and applications',
  'Де працюють машини E-tech': 'Where E-tech machines work',
  'Ексклюзивний дистриб\'ютор': 'Exclusive distributor',
  'Конструкція та можливості': 'Design and capabilities',
  'для універсальних завдань': 'for general-purpose tasks',
  'Заводи в Польщі та світі': 'Plants in Poland and worldwide',
  'Автомобільні компоненти': 'Automotive components',
  'Зварювальні вузли — від': 'Welding packs — from',
  'Конструкція та переваги': 'Design and advantages',
  'Сітки та панелі огорожі': 'Mesh and fence panels',
  'Проєкт і виготовлення': 'Design and manufacturing',
  'Контактні особи': 'Contact persons',
  'Спілкуємося українською, польською та англійською. Оберіть напрям — відповімо напряму.': 'We speak Ukrainian, Polish and English. Pick a contact — we reply directly.',
  'Прокласти маршрут': 'Get directions',
  'Poland, 55-080 Mokronos Dolny': 'Poland, 55-080 Mokronos Dolny',
  'st. Przyjazna 2 · біля Вроцлава': 'st. Przyjazna 2 · near Wrocław',
  'На карті одночасно видно локацію компанії біля Вроцлава і Львів.': 'The map shows the company location near Wrocław and Lviv at the same time.',
  'SMOLTECH на карті — Mokronos Dolny і Львів': 'SMOLTECH on the map — Mokronos Dolny and Lviv',
  'Tax ID (NIP): PL8971804142': 'Tax ID (NIP): PL8971804142',
  'National Court Register (KRS): 0000535326': 'National Court Register (KRS): 0000535326',
  'Statistical ID (REGON): 360382474': 'Statistical ID (REGON): 360382474',
  'Share capital (paid in full): 500,000.00 PLN': 'Share capital (paid in full): 500,000.00 PLN',
  'REGON: 360382474': 'REGON: 360382474',
  'Оберіть групу машин': 'Choose a machine group',
  'Три прямі контакти — українською, польською та англійською. Оберіть напрям, і відповімо без зайвих передач.': 'Three direct contacts — in Ukrainian, Polish and English. Pick a lane and we reply without hand-offs.',
  'Mokronos Dolny біля Вроцлава, Польща. Відповідаємо українською, польською та англійською.': 'Mokronos Dolny near Wrocław, Poland. We answer in Ukrainian, Polish and English.',
  'Логотипи замовників у Польщі та за кордоном — той самий список, що на smoltech.pl.': 'Customer logos in Poland and abroad — the same list as on smoltech.pl.',
  'Повна сітка логотипів замовників у Польщі та світі — той самий набір, що в розділі «Замовники» на smoltech.pl.': 'Full customer-logo grid for Poland and worldwide — the same set as in the Customers section on smoltech.pl.',
  'під конкретну деталь': 'for a specific part',
  'біля Вроцлава, Польща': 'near Wrocław, Poland',
  'центральний телефон': 'main phone',
  'загальна пошта': 'general inbox',
  'Точкові та рельєфні': 'Spot and projection',
  'Адреса та звʼязок': 'Address and contact',
  'Входимо до групи': 'We are part of the group',
  'Коли обирати CDM': 'When to choose CDM',
  'TAYLOR у Польщі': 'TAYLOR in Poland',
  'Пуск і навчання': 'Start-up and training',
  'і комплекси ЧПК': 'and CNC cells',
  'Електротехніка': 'Electrical engineering',
  'Каталог відео': 'Video catalogue',
  'Партнерства': 'Partnerships',
  'Запчастини': 'Spare parts',
  'Звʼязатися': 'Contact us',
  'Як нас знайти': 'How to find us',
  'Хто ми': 'Who we are',
  'Опис': 'Description',
  /* === ABOUT MERGE 20260901 === */
  'Контактне зварювання — від креслення до серії': 'Resistance welding — from drawing to series production',
  'SMOLTECH Technika Zgrzewalnicza — конструкторське бюро й завод у Мокроносі-Дольному. Проєктуємо, збираємо й запускаємо машини під конкретну деталь.': 'SMOLTECH Technika Zgrzewalnicza — an engineering office and plant in Mokronos Dolny. We design, build and commission machines for a specific part.',
  'Цифри SMOLTECH': 'SMOLTECH in numbers',
  'Ідей під конкретну деталь': 'Ideas for a specific part',
  'Побудованих машин': 'Machines built',
  'Власне проєктування й автоматика': 'In-house design and controls',
  'Років спеціалізації на контактному зварюванні': 'Years focused on resistance welding',
  'Про SMOLTECH': 'About SMOLTECH',
  'Познайомтеся зі SMOLTECH': 'Meet SMOLTECH',
  'Контактне зварювання, автоматизація й роботизація — від креслення до серії.': 'Resistance welding, automation and robotics — from drawing to series production.',
  'SMOLTECH — польський виробник технологій контактного зварювання та промислової автоматизації. Проєктуємо й будуємо зварювальні машини, роботизовані станції та автоматизовані лінії для автомобільної, металообробної, електротехнічної, меблевої галузі та побутової техніки.': 'SMOLTECH is a Polish manufacturer specializing in resistance welding technology and industrial automation. We design and build welding machines, robotic stations and automated lines for automotive, metalworking, electrical, furniture and home-appliance industries.',
  'Розуміємо вимоги серійного виробництва й підбираємо технологію під конкретну деталь. Повний цикл — від розробки процесу й конструкції машини до пуску, навчання та сервісу. Працюємо з компонентами TECNA, Siemens, Mitsubishi, Allen-Bradley, B&R та іншими перевіреними брендами.': 'We understand series-production demands and match the process to the part. A full cycle — from process development and machine design to commissioning, training and service. We work with TECNA, Siemens, Mitsubishi, Allen-Bradley, B&R and other proven brands.',
  'Наші орієнтири — надійність зʼєднання й продуктивність лінії. Бюро й завод у Мокроносі-Дольному під Вроцлавом; фокус — контактне зварювання понад 10 років.': 'Our compass is joint reliability and line productivity. Engineering office and plant in Mokronos Dolny near Wrocław; focused on resistance welding for over 10 years.',
  'Орієнтуємось на якість і інновації: повний цикл — від розробки технології та конструкції машини до пуску й технічної підтримки. Мета — підвищити ефективність, надійність і якість виробництва клієнта.': 'With a strong focus on quality and innovation, we deliver complete solutions — from process development and machine design to commissioning and technical support. The goal is higher efficiency, reliability and weld quality for the customer.',
  'Інженер SMOLTECH при машині контактного зварювання з панеллю керування': 'SMOLTECH engineer at a resistance welding machine with the control panel',
  'Оператор SMOLTECH при машині з оснасткою до зварювання гайок': 'SMOLTECH operator at a nut-welding fixture',
  'Інженер SMOLTECH під час складання зварювальної станції': 'SMOLTECH engineer assembling a welding station',
  'Представництва': 'Partners',
  'SMOLTECH у цифрах': 'SMOLTECH in figures',
  'Динамічний виробник у контактному зварюванні — комплекси й машини під серію, з власним проєктуванням і автоматикою.': 'A focused resistance-welding manufacturer — cells and machines for series production, with in-house design and controls.',
  'Що робимо самі': 'What we do in-house',
  'Чотири напрями під одним дахом': 'Four disciplines under one roof',
  'Механіка, збірка, автоматика й роботи — без розкидання проєкту між підрядниками.': 'Mechanics, assembly, controls and robots — without splitting the project across subcontractors.',
  'Замовники': 'Customers',
  'Наші машини на заводах у світі': 'Our machines in plants worldwide',
  'Партнери, з якими будуємо рішення': 'Partners we build with',
  'Холодильні агрегати для зварювальних систем': 'Chillers for welding systems',
  'Група TECHNIKA SPAWALNICZA — Познань': 'TECHNIKA SPAWALNICZA group — Poznań',
  'Вузли контактного зварювання TECNA': 'TECNA resistance welding packages',
  'Ексклюзив TAYLOR для приварювання шпильок': 'Exclusive TAYLOR stud-welding line',
  'Галузі': 'Industries',
  'Від вихідних даних до документації в Inventor і AutoCAD. Концепція, розрахунки, оснастка, нагляд за виробництвом.': 'From input data to documentation in Inventor and AutoCAD. Concept, calculations, tooling, production supervision.',
  'Збірка машин і оснастки: механіка, електрика, пневматика, гідравліка, зір і вимірювання. Вузли TECNA.': 'Assembly of machines and tooling: mechanics, electrics, pneumatics, hydraulics, vision and measurement. TECNA weld packages.',
  'Шафи, ПЛК і моніторинг — Siemens, Mitsubishi, Allen-Bradley, B&R. Схеми в WSCAD і EPLAN.': 'Cabinets, PLCs and monitoring — Siemens, Mitsubishi, Allen-Bradley, B&R. Schematics in WSCAD and EPLAN.',
  'Клітини під деталь: зварювання, завантаження, контроль, пакування.': 'Cells built around the part: welding, loading, inspection, packing.',
  'Комплекси': 'Cells',
  'Компетенції тепер у розділі «Про компанію»': 'Expertise is now part of About us',
  'Сторінку обʼєднано з описом компанії — проєктування, виробництво, автоматизація та роботизація в одному місці.': 'The page has been merged into About us — design, manufacturing, automation and robotics in one place.',
  'Перейти до «Про компанію»': 'Go to About us',
  'Оновлення': 'Update',
  'SMOLTECH — польський виробник машин контактного зварювання. Власне проєктування, виробництво, автоматизація та роботизація під Вроцлавом.': 'SMOLTECH — a Polish manufacturer of resistance welding machines. In-house design, manufacturing, automation and robotics near Wrocław.',
  'Компетенції — переадресація | SMOLTECH': 'Expertise — redirect | SMOLTECH',
  'Проєктування': 'Design',
  'Виробництво': 'Manufacturing',
  /* === PRODUCT SHOWCASE 20260902 === */
  'Сім реалізацій SMOLTECH: фото, розгорнутий опис і відео кожної машини — щоб під час розмови з клієнтом одразу показувати потрібну конфігурацію.': 'Seven SMOLTECH installations: photo, expanded description and video for each machine — so on a client call you can show the right setup at once.',
  'Дивитись машини': 'View machines',
  'Запитати конфігурацію': 'Ask about a setup',
  'Кожна позиція — окремий якір для посилання клієнту. Фото зліва, відео поруч з описом — без зайвого тексту перед продуктами.': 'Each item has its own anchor for a client link. Photo on the left, video beside the copy — no long text before the products.',
  'Швидкий перехід до машини': 'Jump to a machine',
  'Швидкий перехід до комплексу': 'Jump to a cell',
  'У каталозі відео': 'In the video catalogue',
  'Дивитись комплекси': 'View cells',
  'Повністю автоматизоване приварювання: фото машини, розгорнутий опис і відео поруч — одразу видно, що показувати клієнту.': 'Fully automated stud welding: machine photo, expanded description and video side by side — clear what to show the client.',
  'Кожна позиція має якір для прямого посилання. Додаткові можливості й галерея — нижче, після продуктів.': 'Each item has an anchor for a direct link. Extra capabilities and gallery sit below, after the products.',
  'Шість реалізацій SMOLTECH: фото, розгорнутий опис і відео кожного комплексу — щоб під час розмови з клієнтом одразу показувати потрібну конфігурацію.': 'Six SMOLTECH installations: photo, expanded description and video for each cell — so on a client call you can show the right setup at once.',
  'Приклади комплексів нашого виробництва': 'Examples of cells we build',
  'Запитати про ST-2': 'Ask about ST-2',
  'Запитати про ST-3': 'Ask about ST-3',
  'Більше фото в галереї': 'More photos in the gallery',
  'Усі відео шпильок': 'All stud-welding videos',
  'Автомат ST-2/1×35/1-CNC — 1 головка, вібраційний подавач, конденсаторне джерело': 'ST-2/1×35/1-CNC cell — 1 head, vibratory feeder, capacitor discharge source',
  'Автоматизований комплекс ST-3/6-CNC — 3 головки, вібраційні подавачі': 'ST-3/6-CNC automated cell — 3 heads, vibratory feeders',
  'Автомат із Т-подібним столом — 2 приварювальні головки': 'T-table cell — 2 stud welding heads',
  /* === HUB TILES 20260902 === */
  'Чотири групи серійних машин TECNA — підвісні кліщі, стаціонарні точкові, точково-рельєфні та E-tech. Оберіть групу на плитці нижче.': 'Four TECNA machine groups — suspended guns, stationary spot, spot-projection and E-tech. Pick a group on the tiles below.',
  'Оберіть групу під завдання — від мобільних кліщів для великих корпусів до інверторних машин для кузовних і складальних робіт. Під конкретний проєкт проєктуємо також зварювальну оснастку.': 'Pick a group for the job — from mobile guns for large housings to inverter machines for body and assembly lines. We also design tooling for a specific project.',
  'Дивитись групу': 'View group',
  'Підвісні кліщові машини': 'Suspended gun welders',
  'Для просторових і великих деталей — шаф, корпусів, кожухів — коли стаціонарна машина неефективна. AC 16–38 кВА та інверторні MFDC 56–90 кВА.': 'For spatial and large parts — cabinets, housings, covers — when a stationary machine is inefficient. AC 16–38 kVA and MFDC inverter 56–90 kVA.',
  'Для листа, прута та просторових деталей. Педальний або пневматичний притиск; також інверторні моделі 25 кВА.': 'For sheet, wire and 3D parts. Pedal or pneumatic squeeze; also inverter 25 kVA models.',
  'Лінійний притиск для деталей із технологічними виступами — гайки, болти, кронштейни. Техніки AC, DC або MFDC.': 'Linear squeeze for parts with process projections — nuts, bolts, brackets. AC, DC or MFDC.',
  'Багатофункціональні інверторні': 'Car body inverter welding machines',
  'Серія E-tech для складальних і сервісних ліній — зокрема кузовних деталей. Кліщі, гнучкість і контроль процесу.': 'E-tech series for assembly and service lines — including body parts. Guns, flexibility and process control.',
  'Ексклюзивний дистрибʼютор TAYLOR у Польщі — CDM, DA та комплекси ЧПК власного виробництва. Оберіть групу під діаметр шпильки й серію.': 'Exclusive TAYLOR distributor in Poland — CDM, DA and in-house CNC cells. Pick a group by stud diameter and series size.',
  'CDM — конденсаторне': 'CDM — capacitor discharge',
  'Компактні переносні пристрої для мʼякої та нержавіючої сталі, алюмінію й латуні. Мінімальний слід на звороті, до 50 шпильок/хв.': 'Compact portable units for mild and stainless steel, aluminium and brass. Minimal reverse mark, up to 50 studs/min.',
  'Дивитись CDM': 'View CDM',
  'DA — інверторне дугове': 'DA — inverter arc',
  'Обладнання i12 та i16 для більших діаметрів і товстішого матеріалу. Методи Drawn Arc і Short Cycle.': 'i12 and i16 units for larger diameters and thicker material. Drawn Arc and Short Cycle methods.',
  'Дивитись DA': 'View DA',
  'Автоматизовані комплекси SMOLTECH з вібраційними подавачами та конденсаторними джерелами — під серійне виробництво.': 'SMOLTECH automated cells with vibratory feeders and capacitor sources — for series production.',
  'Ексклюзивний дистрибʼютор у Польщі': 'Exclusive distributor in Poland',
  'TAYLOR Studwelding Systems Limited — понад 35 років виробництва обладнання для приварювання шпильок. SMOLTECH постачає ручні пристрої, аксесуари та будує автоматизовані комплекси ЧПК на базі систем TAYLOR.': 'TAYLOR Studwelding Systems Limited — over 35 years of stud-welding equipment. SMOLTECH supplies hand units and accessories and builds CNC cells on TAYLOR systems.',
  /* === METAL HUB POLISH 20260902 === */
  'Чотири групи серійних машин TECNA — оберіть категорію за фото й одразу перейдіть до параметрів.': 'Four TECNA machine groups — pick a category by photo and go straight to the specs.',
  'Від мобільних кліщів для великих корпусів до інверторних E-tech на складальних лініях. Під конкретний проєкт проєктуємо також зварювальну оснастку.': 'From mobile guns for large housings to inverter E-tech on assembly lines. We also design welding tooling for a specific project.',
  'Для просторових і великих деталей — шаф, корпусів, кожухів — коли стаціонарна машина неефективна. AC 16–38 кВА та інверторні MFDC 56–90 кВА з гіроскопічним підвішуванням.': 'For spatial and large parts — cabinets, housings, covers — when a stationary machine is inefficient. AC 16–38 kVA and MFDC inverter 56–90 kVA with gyroscopic suspension.',
  'Для листа, прута та просторових деталей. Педальний або пневматичний притиск; також інверторні моделі 25 кВА для стабільного серійного такту.': 'For sheet, wire and 3D parts. Pedal or pneumatic squeeze; also inverter 25 kVA models for a stable series cycle.',
  'Лінійний притиск і Т-плити під оснастку — гайки, болти, кронштейни, багатовиступні деталі. Техніки AC, DC або MFDC під матеріал і такт.': 'Linear squeeze and T-slot platens for tooling — nuts, bolts, brackets, multi-projection parts. AC, DC or MFDC matched to material and cycle time.',
  'Мобільна серія E-tech для складальних і сервісних ліній — зокрема кузовних деталей. Кліщі, гнучка конфігурація й контроль процесу TE760.': 'Mobile E-tech series for assembly and service lines — including body parts. Guns, flexible setup and TE760 process control.',
  'Один із найбільших у Європі виробників машин і зварювальних вузлів. Міцна конструкція, мікропроцесорне керування, водяне охолодження й безмастильні пневматичні елементи.': 'One of Europe’s largest makers of machines and welding assemblies. Robust build, microprocessor control, water cooling and oil-free pneumatics.',
  'Завдяки різноманітності конструкцій, потужностей трансформатора й сили притиску підбираємо машину під конкретне завдання — від одиничних робіт у майстерні до серійного промислового такту.': 'With a wide range of designs, transformer ratings and squeeze forces we match a machine to the job — from one-off workshop work to series industrial cycles.',
  'Змінний струм 50 Гц': '50 Hz alternating current',
  'Універсальне й економічне рішення для сталі та більшості стандартних застосувань.': 'A universal, economical solution for steel and most standard applications.',
  'Постійний струм': 'Direct current',
  'Масивні багатовиступні деталі, кільцеві герметичні виступи, алюміній, мідь, латунь.': 'Heavy multi-projection parts, annular leak-tight projections, aluminium, copper, brass.',
  'Інвертор середньої частоти': 'Medium-frequency inverter',
  'Найвища точність і енергоефективність, довший ресурс електродів — напр. 1000 Гц.': 'Highest precision and energy efficiency, longer electrode life — e.g. 1000 Hz.',
  'Точкове й рельєфне зварювання': 'Spot and projection welding',
  'Кожна машина підбирається індивідуально — за матеріалом, геометрією деталі та потрібною продуктивністю.': 'Each machine is selected individually — by material, part geometry and required output.',
  'Для автомобільного листа, кузовних деталей, труб, дроту й прута — із сучасними контролерами, водяним охолодженням і компонентами для інтенсивної експлуатації. Нержавіюча сталь вимагає точного керування енергією й охолодження робочого контуру.': 'For automotive sheet, body parts, tubes, wire and rod — with modern controllers, water cooling and components for intensive use. Stainless steel needs precise energy control and cooling of the secondary circuit.',
  'Там, де потрібна висока повторюваність і стабільні параметри. Машини комплектуємо технологічною оснасткою під конкретну деталь і процес — ручним або автоматичним базуванням.': 'Where high repeatability and stable parameters are required. We fit machines with process tooling for a specific part and process — with manual or automatic locating.',
  'Потрібна автоматизація?': 'Need automation?',
  'Придбання точкової або рельєфної машини — це рішення щодо технології, оснастки, пуску та подальшого обслуговування робочого місця.': 'Buying a spot or projection machine is a decision about process, tooling, start-up and ongoing workplace support.',
  'Власний конструкторський відділ під конкретний технологічний процес.': 'An in-house design department for a specific process.',
  'Інтеграція з промисловою автоматикою та роботизованими комплексами.': 'Integration with industrial automation and robotic cells.',
  'Підбір параметрів на основі реальних вимог робочого місця.': 'Parameter selection based on real workplace requirements.',
  'Конфігурація під матеріал, геометрію деталі та потрібну продуктивність.': 'Configuration for material, part geometry and required output.',
  'Окремі машини або повні технологічні комплекси.': 'Stand-alone machines or complete process cells.',
    /* === EN PATCH 20260903 === */
  'Плечі мають регульовану довжину, тому машину легко підлаштувати під розмір зварюваних деталей, а регульований хід електродів дає змогу обслуговувати елементи різної товщини. Трансформатор залитий у пластик, а вода охолоджує його разом із тиристором, плечима та електродами. За керування відповідає мікропроцесорний контролер TE101, опційно — потужніший TE550.': 'The arms have adjustable length, so the machine is easy to match to the size of the parts being welded, and the adjustable electrode stroke handles elements of different thicknesses. The transformer is resin-encapsulated, and water cools it together with the thyristor, arms and electrodes. Control is handled by the TE101 microprocessor controller, optionally — a more powerful TE550.',
  'Високу якість зварювання та максимальну продуктивність забезпечують, зокрема: сучасні мікропроцесорні контролери, охолоджуваний трансформатор, циліндри з блокуванням обертання штока та попереднім ходом, велика жорсткість плечей і корпусу, регулювання швидкості руху електродів.': 'High weld quality and maximum output are ensured by, among other things: modern microprocessor controllers, a cooled transformer, cylinders with rod anti-rotation lock and pre-stroke, high arm and frame rigidity, and electrode travel speed control.',
  'За полем зварювання — гідравлічний прес 150 т для гнутих панелей 3D. На кінці приймального столу — зона автоматичного відбору й палетизації; поворотний стіл дозволяє знімати готові панелі автонавантажувачем під час роботи машини.': 'Downstream of the welding field — a 150 t hydraulic press for bent 3D panels. At the end of the receiving table — an automatic take-off and palletising zone; a turntable allows finished panels to be removed by forklift while the machine is running.',
  'Інверторні машини керують струмом зварювання в техніці середньої частоти, а не класичним змінним струмом 50 Гц. Імпульс коротший і краще контрольований — це видно в якості зʼєднання, споживанні енергії та ресурсі електродів.': 'Inverter machines control welding current with medium-frequency technology rather than classic 50 Hz alternating current. The pulse is shorter and better controlled — this shows in joint quality, energy consumption and electrode life.',
  'Повністю автоматизований комплекс ЧПК для серійного приварювання шпильок. Поєднує точність числового керування з конденсаторним зварюванням — під продуктивність, безпеку оператора й гнучкість коротких і довгих серій.': 'Fully automated CNC system for series stud welding. Combines the precision of numerical control with capacitor-discharge welding — for output, operator safety and flexibility across short and long runs.',
  'Рішення під автомобільну галузь: стабільний такт, повторювана якість зʼєднання й можливість інтеграції з лінією. Ступінь автоматизації й обсяг контролю (Poka-Yoke, дані процесу) узгоджуємо на етапі концепції.': 'Solution for the automotive industry: stable cycle time, repeatable joint quality and the option of line integration. Degree of automation and scope of control (Poka-Yoke, process data) are agreed at the concept stage.',
  'Жорстка зварна рама в поєднанні з конструкцією з алюмінієвих профілів забезпечує жорсткість і довговічність. Два трансформатори по 200 кВА дають запас потужності для одночасного зварювання кількох виступів.': 'A rigid welded frame combined with an aluminium-profile structure provides stiffness and durability. Two 200 kVA transformers give power reserve for simultaneous welding of several projections.',
  'Два інверторні трансформатори по 90 кВА (P=50%) з обох боків портала дають симетричне живлення ряду. Конфігурація показує, як ми будуємо машину під конкретну геометрію, а не під «універсальний» каталог.': 'Two inverter transformers of 90 kVA each (P=50%) on both sides of the portal give symmetrical supply to the row. The configuration shows how we build the machine for a specific geometry, not for a “universal” catalogue.',
  'Типове рішення для серійного виробництва корпусів і шаф, де потрібні повторюваність, безпека оператора й контроль такту. Конфігурація з кількома зварювальними модулями AC під конкретну геометрію виробу.': 'A typical solution for series production of housings and cabinets where repeatability, operator safety and cycle control are required. Configuration with several AC welding modules for the specific product geometry.',
  'Інверторну версію 25 кВА варто розглядати, коли важливі витрати на енергію та електроди, якість зʼєднання або важкозварювані матеріали. Виліт плечей — мінімальний, потрібний для геометрії деталі.': 'The 25 kVA inverter version is worth considering when energy and electrode costs, joint quality or hard-to-weld materials matter. Arm throat — the minimum needed for part geometry.',
  'Компактна конструкція з вбудованим контролером і трансформатором — практичне рішення для цехів, майстерень і складальних постів. Зручне обслуговування та велика свобода маневрування з матеріалом.': 'Compact design with built-in controller and transformer — a practical solution for shops, workshops and assembly stations. Convenient servicing and ample freedom to manoeuvre material.',
  'Роботизований пост для компонентів кузова: робот автоматично виконує послідовність операцій приварювання гайок — подача, базування, зварювання й зняття — без участі оператора в зоні зварювання.': 'Robotic station for body components: the robot automatically performs the nut-welding sequence — feed, locating, welding and unload — without the operator in the welding zone.',
  'Пʼять інверторних джерел 1000 Гц по 200 кВА і 51 трикамерний циліндр забезпечують одночасне зварювання цілого ряду вузлів. Параметри процесу програмуються через TecnaNet і контролери TE700.': 'Five 1000 Hz inverter power sources of 200 kVA each and 51 three-chamber cylinders provide simultaneous welding of a whole row of nodes. Process parameters are programmed via TecnaNet and TE700 controllers.',
  'Спеціалізований напівавтоматичний комплекс для рельєфного зварювання стабілізаторів. Три зварювальні модулі по 160 кВА — під вимогливу геометрію й потребу в повторюваній міцності зʼєднання.': 'Specialised semi-automatic system for projection welding of stabilisers. Three 160 kVA welding modules — for demanding geometry and the need for repeatable joint strength.',
  'Силу натиску задає оператор педаллю, а струм рушає лише після належного притиску. Недорога в експлуатації конструкція без стисненого повітря — добрий вибір для меншої інтенсивності роботи.': 'The operator sets the squeeze via the pedal, and current starts only after proper clamping. An inexpensive-to-run design without compressed air — a good choice for lower work intensity.',
  'Автомат для приварювання різних типів шпильок у довільній конфігурації до сталевих листів різних розмірів і форм. Т-подібний стіл спрощує завантаження великих листів і доступ оператора.': 'Automatic machine for welding various stud types in any configuration to steel sheets of different sizes and shapes. A T-shaped table simplifies loading large sheets and operator access.',
  'Три приварювальні головки живляться через вібраційні подавачі й конденсаторні джерела. Діапазон: M4–M8 стандартні та M8 із фланцем — низьковуглецева й нержавіюча сталь, довжина 6–30 мм.': 'Three welding heads are fed via vibratory feeders and capacitor-discharge power sources. Range: standard M4–M8 and flanged M8 — low-carbon and stainless steel, length 6–30 mm.',
  'Циліндр дає рівний, більший натиск незалежно від сили оператора. Двопозиційна педаль дозволяє спершу притиснути деталі без струму, а потім виконати зварювання — ідеально для серій.': 'The cylinder gives even, higher squeeze regardless of the operator\'s strength. A two-position pedal lets you clamp the parts first without current, then weld — ideal for series work.',
  'Показує підхід SMOLTECH до нетипових виробів: оснастка й цикл будуються під креслення замовника, а не під «каталожну» машину. Ручне завантаження + автоматичний зварювальний цикл.': 'Shows SMOLTECH\'s approach to non-standard products: tooling and cycle are built to the customer\'s drawing, not to a “catalogue” machine. Manual loading + automatic welding cycle.',
  'Базові машини для зварювання листового металу з вибором педального або пневматичного притиску електродів — від цього залежить спосіб роботи, продуктивність і сфера застосування.': 'Basic machines for sheet-metal welding with a choice of pedal or pneumatic electrode squeeze — that choice drives how you work, the output and the field of use.',
  'Приклад комплексу з автоматичною подачею/відбором: там, де такт і ергономіка важливіші за повну роботизацію завантаження. Два модулі AC по 103 кВА під серійну геометрію виробу.': 'Example of a system with automatic feed/take-off: where cycle time and ergonomics matter more than full loading robotisation. Two 103 kVA AC modules for series product geometry.',
  'Регульована довжина плечей і хід електродів, трансформатор у пластику, водяне охолодження трансформатора, тиристора, плечей і електродів. Керування — мікропроцесорний контролер': 'Adjustable arm length and electrode stroke, resin-encapsulated transformer, water cooling of the transformer, thyristor, arms and electrodes. Control — microprocessor controller',
  'Міцна конструкція з регульованими плечима й ходом електрода плюс інверторне джерело струму та електронний контролер — найвища якість зварювання при високій енергоефективності.': 'Rigid design with adjustable arms and electrode stroke plus an inverter power source and electronic controller — highest weld quality with high energy efficiency.',
  'Усі машини цих груп працюють у діапазоні 16–25 кВА. Вибір визначають тип притиску, виліт плечей і сила притиску під ваші деталі, а також те, чи потрібна інверторна техніка.': 'All machines in these groups run in the 16–25 kVA range. The choice is driven by squeeze type, arm throat and squeeze force for your parts, and whether inverter technology is needed.',
  'Добре пристосовані до щоденної роботи майстерень, виробничих цехів і складальних постів — особливо там, де потрібне міцне повторюване зʼєднання без присадкового матеріалу.': 'Well suited to day-to-day work in workshops, production halls and assembly stations — especially where a strong, repeatable joint without filler material is required.',
  'Для високоякісних зварних зʼєднань із високою продуктивністю. Великі сили притиску електродів, зменшені габарити й безпечні компоненти — під інтенсивну промислову роботу.': 'For high-quality weld joints with high output. High electrode squeeze forces, compact dimensions and safe components — for intensive industrial work.',
  'Роботизовані пости, машинний зір, Poka-Yoke й збір даних — будуємо спеціалізовані комплекси під конкретний виріб і вимоги автомобільної чи металообробної промисловості.': 'Robotic stations, machine vision, Poka-Yoke and data collection — we build specialised cells for the specific product and the requirements of the automotive or metalworking industry.',
  'із прутів Ø3–8 мм. Усі прути подаються трьома подавачами з буферними накопичувачами: поперечним, поздовжнім і бічним (додатковий нижній поперечний прут у панелях 2D).': 'from Ø3–8 mm wires. All wires are fed by three feeders with buffer magazines: cross, longitudinal and side (an extra lower cross wire in 2D panels).',
  'Автоматичне зварювання сіток у шаблонах — компактніше рішення там, де повна лінія з подавачами ще не потрібна, але важлива повторюваність і швидкість ряду вузлів.': 'Automatic mesh welding in templates — a more compact solution where a full line with feeders is not yet needed, but row-node repeatability and speed matter.',
  'Так: подавачі поперечних, поздовжніх і бічних прутів, преси для панелей 3D, палетизація та поворотні столи для відбору автонавантажувачем під час роботи машини.': 'Yes: feeders for cross, longitudinal and side wires, presses for 3D panels, palletising and turntables for forklift removal while the machine is running.',
  'Будуємо машини під конкретну сітку й такт: панелі огорожі 2D/3D, габіони, будівельні й армувальні сітки, а також нетипові вироби — зокрема пера жалюзійних сит.': 'We build machines for the specific mesh and cycle: 2D/3D fence panels, gabions, construction and reinforcing mesh, and non-standard products — including louvre-screen fins.',
  'Два інверторні трансформатори по 240 кВА і девʼять зварювальних модулів. Система палетизації складає готові сітки в стос і скорочує ручну працю на відборі.': 'Two inverter transformers of 240 kVA each and nine welding modules. The palletising system stacks finished mesh and reduces manual take-off labour.',
  'Короткий імпульс 1–3 мс на тонкому, плоскому й чистому матеріалі. Майже непомітний слід на звороті, до 50 шпильок/хв — коли важливий вигляд поверхні.': 'Short 1–3 ms pulse on thin, flat and clean material. Almost invisible mark on the reverse, up to 50 studs/min — when surface appearance matters.',
  'У асортименті — машини змінного струму 16–25 кВА та інверторні 25 кВА. Тип притиску підбираємо під інтенсивність роботи та вимоги до повторюваності.': 'The range includes AC machines 16–25 kVA and inverter 25 kVA. We match the squeeze type to work intensity and repeatability requirements.',
  'Інвертор MF 25 кВА дає стабільний процес на тонкому матеріалі. Показує, як ми поєднуємо зварювання з оптикою, коли «сліпе» базування недостатнє.': 'The MF 25 kVA inverter delivers a stable process on thin material. Shows how we combine welding with optics when “blind” locating is insufficient.',
  'Приварювання гайок, болтів, кронштейнів і ніпелів у кілька точок одночасно — з автоматичною подачею та контролем наявності кожного зʼєднання.': 'Welding of nuts, bolts, brackets and nipples at several points simultaneously — with automatic feed and presence check of each joint.',
  'Багатоосьові роботи для завантаження, переміщення між станціями, зварювання й палетизації. Машинний зір для розпізнавання положення деталі.': 'Multi-axis robots for loading, transfer between stations, welding and palletising. Machine vision for part-position recognition.',
  'У педальній версії натиск задає оператор; у пневматичній — циліндр дає рівний повторюваний натиск і функцію одиничної та серійної роботи.': 'In the pedal version the operator sets the squeeze; in the pneumatic version — the cylinder gives even, repeatable force and single-shot and series modes.',
  'Від ручного укладання в шаблонах через подавачі 2D/3D до пресів загинання й палетизації. Компоненти зварювання — TECNA S.p.A. (Італія).': 'From hand-loading in templates via 2D/3D feeders to bending presses and palletising. Welding components — TECNA S.p.A. (Italy).',
  'Дві головки, вібраційні подавачі шпильок і конденсаторні джерела струму — компактніша конфігурація там, де три головки ще не потрібні.': 'Two heads, vibratory stud feeders and capacitor-discharge power sources — a more compact configuration where three heads are not yet needed.',
  'Три подавачі прутів ведуть матеріал у зону зварювання без ручного укладання — рішення під серійний такт і повторювану геометрію сітки.': 'Three wire feeders carry material into the welding zone without hand-loading — a solution for series cycle time and repeatable mesh geometry.',
  'Цикл 10–1000 мс для більших діаметрів і товстішого матеріалу. Методи Drawn Arc і Short Cycle, типова продуктивність 20–30 шпильок/хв.': 'Cycle 10–1000 ms for larger diameters and thicker material. Drawn Arc and Short Cycle methods, typical output 20–30 studs/min.',
  'Зварювання разом із суміжними операціями: запресуванням, калібруванням, щіткуванням, гравіюванням, тестом міцності та палетизацією.': 'Welding together with adjacent operations: press-fitting, calibration, brushing, engraving, strength testing and palletising.',
  'Діаметр шпильки, товщина матеріалу й вимоги до зворотного боку зʼєднання визначають, яку групу обладнання варто розглядати першою.': 'Stud diameter, material thickness and reverse-side joint requirements determine which equipment group to consider first.',
  'із прутів Ø3–8 мм. Три автоматичні подавачі прутів і прес для панелей 3D — підібрані під такт і геометрію виробу замовника.': 'from Ø3–8 mm wires. Three automatic wire feeders and a press for 3D panels — matched to the customer\'s cycle time and product geometry.',
  'Вібраційні та чашкові подавачі гайок, болтів і прутів, стрічкові конвеєри, поворотні столи з кількома робочими станціями.': 'Vibratory and bowl feeders for nuts, bolts and wires, belt conveyors, turntables with several workstations.',
  'Окрім постачання, забезпечуємо повну технічну підтримку процесів приварювання шпильок — щоб виробництво не зупинялось.': 'Beyond supply, we provide full technical support for stud welding processes — so production does not stop.',
  'Ручне завантаження деталі й автоматичний цикл зварювання — коли повна автоматизація подачі економічно невиправдана.': 'Manual part loading and automatic welding cycle — when full feed automation is not economically justified.',
  'Точне позиціонування, міцні зʼєднання, легке програмування й швидке переналагодження — для довгих і коротких серій.': 'Precise positioning, strong joints, easy programming and quick changeover — for long and short runs.',
  'Цілий ряд вузлів за один цикл — вища продуктивність при серійному виробництві панелей огорожі чи будівельних сіток.': 'A whole row of nodes in one cycle — higher output in series production of fence panels or construction mesh.',
  '. Базується на 4 інверторних трансформаторах 1000 Гц по 200 кВА (P-50%) і 51 трикамерному зварювальному циліндрі.': '. Based on 4 inverter transformers 1000 Hz at 200 kVA each (P-50%) and 51 three-chamber welding cylinders.',
  'Рішення там, де потрібна довга сітка й стабільний DC-процес — армування, будівельні сітки, спеціальні формати.': 'A solution where a long mesh and a stable DC process are needed — reinforcement, construction mesh, special formats.',
  'і рельєфного приварювання шпильок. Робот веде деталь між операціями — без ручного перекладання між станціями.': 'and projection stud welding. The robot transfers the part between operations — without hand transfer between stations.',
  'для приварювання різних типів шпильок у довільній конфігурації до сталевих листів різних розмірів і форм.': 'for welding various stud types in any configuration to steel sheets of different sizes and shapes.',
  '. Стрічковий конвеєр транспортує й розвантажує деталі — оператор не переносить виріб вручну між зонами.': '. A belt conveyor transports and unloads parts — the operator does not carry the product by hand between zones.',
  'Роботизований комплекс SP-8/4×75/AC/R — точкове зварювання сталевих корпусів і приварювання шпильок': 'Robotic system SP-8/4×75/AC/R — spot welding of steel housings and stud welding',
  'завдання, що вимагають постійної якості зʼєднання, з вибором педального або пневматичного притиску.': 'tasks requiring consistent joint quality, with a choice of pedal or pneumatic squeeze.',
  '. Вузли постійного струму 400 кВА (P-50%) і 15 пневматичних циліндрів із силою притиску 760 даН.': '. DC packs 400 kVA (P-50%) and 15 pneumatic cylinders with squeeze force 760 daN.',
  'Повністю автоматизований роботизований пост для точного точкового зварювання сталевих корпусів у': 'Fully automated robotic station for precise spot welding of steel housings in',
  'Спеціалізований пост під нетиповий виріб — пера жалюзійних сит. Портальна стальна конструкція з': 'Specialised station for a non-standard product — louvre-screen fins. Portal steel frame with',
  'Дивитись відео: Автоматична точкова машина з стрічковим конвеєром для транспортування деталей': 'Watch video: Automatic spot welder with belt conveyor for part transport',
  'Комплекс для точного приварювання ручок до циліндричних термокружок. Система машинного зору': 'System for precise welding of handles to cylindrical travel mugs. Machine vision system',
  'Інверторна рельєфна машина SG-2/1×25/MF із системою машинного зору для ручки термокружки': 'Inverter projection machine SG-2/1×25/MF with machine vision system for travel-mug handle',
  ': до 4 різних типів або розмірів шпильок в одному циклі — без переналагодження машини.': ': up to 4 different stud types or sizes in one cycle — without machine changeover.',
  'Автоматична точкова машина SP-3/2×103/AC — шухляда в 10 точках із стрічковим конвеєром': 'Automatic spot welder SP-3/2×103/AC — drawer in 10 spots with belt conveyor',
  'Інверторна лінія SW-51/5×200/MF для панелей огорожі 2D і 3D зі столом, що обертається': 'Inverter line SW-51/5×200/MF for 2D and 3D fence panels with a rotating table',
  'Напівавтоматичний комплекс SG-4/2×200/AC — рельєфне зварювання 4 ручок до чаші гриля': 'Semi-automatic system SG-4/2×200/AC — projection welding of 4 handles to a grill bowl',
  'до чаші гриля. Оператор завантажує деталь — цикл зварювання виконується автоматично.': 'to a grill bowl. The operator loads the part — the welding cycle runs automatically.',
  '. Стандартні M4–M8 і M8 із фланцем — низьковуглецева та нержавіюча сталь, 6–30 мм.': '. Standard M4–M8 and flanged M8 — low-carbon and stainless steel, 6–30 mm.',
  'Вузол за вузлом — гнучкіше щодо форми сітки, для менших серій і нетипових виробів.': 'Node by node — more flexible on mesh shape, for smaller batches and non-standard products.',
  'Напівавтоматична рельєфна машина SG-5/3×160/AC для стабілізаторів мінометної міни': 'Semi-automatic projection machine SG-5/3×160/AC for mortar-mine stabilisers',
  'Для великих сіток: прут Ø3–10 мм, вічко 20–200 мм, максимальні габарити виробу': 'For large meshes: wire Ø3–10 mm, mesh opening 20–200 mm, maximum product dimensions',
  'Напівавтоматична рельєфна машина SG-5/3×160/AC — стабілізатори мінометної міни': 'Semi-automatic projection machine SG-5/3×160/AC — mortar-mine stabilisers',
  'Автоматична точкова машина з стрічковим конвеєром для транспортування деталей': 'Automatic spot welder with belt conveyor for part transport',
  'та орієнтацію деталі — там, де положення елемента не є ідеально повторюваним.': 'and part orientation — where the element\'s position is not perfectly repeatable.',
  'Інверторна багатоточкова машина SW-9/2×240/MF для сіток і будівельних огорож': 'Inverter multi-spot machine SW-9/2×240/MF for mesh and construction fencing',
  'Роботизоване рельєфне приварювання гайки з застосуванням промислового робота': 'Robotic projection welding of a nut using an industrial robot',
  'TecnaNet + 5 контролерів TE700; додатковий мобільний пульт із кабелем 15 м': 'TecnaNet + 5 TE700 controllers; additional mobile pendant with 15 m cable',
  'Автоматична точкова машина SP-3/2×103/AC з стрічковим конвеєром для шухляд': 'Automatic spot welder SP-3/2×103/AC with belt conveyor for drawers',
  'Роботизація рельєфного зварювання — приварювання гайок промисловим роботом': 'Robotisation of projection welding — nut welding by industrial robot',
  'Та сама базова платформа SW-51 для серійного зварювання панелей максимум': 'The same SW-51 base platform for series welding of panels maximum',
  '— швидке переналагодження під інший розмір виробу без перебудови машини.': '— quick changeover to another product size without rebuilding the machine.',
  'Девʼять подвійних зварювальних модулів із інтегрованим трансформатором': 'Nine twin welding modules with integrated transformer',
  'Інверторна багатоточкова машина SW-12/2×90/MF для пера жалюзійних сит': 'Inverter multi-spot machine SW-12/2×90/MF for louvre-screen fins',
  'Напівавтоматичний пост для швидкого й точного рельєфного приварювання': 'Semi-automatic station for fast and precise projection welding',
  'Інверторна машина SG-2/1×25/MF із машинним зором — ручка термокружки': 'Inverter machine SG-2/1×25/MF with machine vision — travel-mug handle',
  'Багатоточкова машина постійного струму SW-15/1×400 для великих сіток': 'DC multi-spot machine SW-15/1×400 for large meshes',
  'Професійна автоматична лінія для зварних сіток на панелі огорожі або': 'Professional automatic line for welded mesh for fence panels or',
  '51 трикамерний зварювальний циліндр, притиск ~330 кг при 10 бар': '51 three-chamber welding cylinders, squeeze ~330 kg at 10 bar',
  'Автомат ST-2/1×35/1-CNC — комплекс ЧПК для приварювання шпильок': 'Automatic ST-2/1×35/1-CNC — CNC system for stud welding',
  'Автомат із Т-подібним столом і двома приварювальними головками': 'Automatic machine with T-shaped table and two welding heads',
  'Лінія для огорожних панелей і переносних будівельних огорож зі': 'Line for fence panels and portable construction fencing with',
  'Точково-рельєфна машина з лінійним притиском і жовтою охороною': 'Spot-projection machine with linear squeeze and yellow guarding',
  'для багатьох шпильок на кількох компонентах в одній програмі.': 'for many studs on several components in one programme.',
  '— рівний натиск і двоетапний цикл для серійного виробництва.': '— even squeeze and two-stage cycle for series production.',
  'Багатоточкова лінія SMOLTECH для зварювання панелей огорожі': 'SMOLTECH multi-spot line for welding fence panels',
  'Швидка автоматична точкова машина для зварювання шухляди в': 'Fast automatic spot welder for welding a drawer in',
  'Пістолети CD C2 і CD LG2 для конденсаторного приварювання': 'CD C2 and CD LG2 guns for capacitor-discharge welding',
  '— до 4 типів шпильок в одному циклі без переналагодження.': '— up to 4 stud types in one cycle without changeover.',
  'Інверторне дугове обладнання DA для приварювання шпильок': 'Inverter DA arc equipment for stud welding',
  'Комплекс ST-3/6-CNC із трьома головками на робочому полі': 'System ST-3/6-CNC with three heads on the working field',
  '5 інверторних трансформаторів 1000 Гц × 200 кВА (P-50%)': '5 inverter transformers 1000 Hz × 200 kVA (P-50%)',
  'Автоматизовані головки TAYLOR на комплексі ЧПК SMOLTECH': 'Automated TAYLOR heads on a SMOLTECH CNC system',
  '— нижча ціна, без компресора, простіше обслуговування.': '— lower price, no compressor, simpler maintenance.',
  'Багатофункціональна інверторна машина E-tech на візку': 'Multifunction inverter E-tech machine on a trolley',
  'Базова конфігурація з однією головкою розширюється до': 'Basic single-head configuration expands to',
  'Конденсаторне обладнання CDM для приварювання шпильок': 'CDM capacitor-discharge equipment for stud welding',
  'Роботизація рельєфного зварювання — комплекс SMOLTECH': 'Robotisation of projection welding — SMOLTECH system',
  'Автоматизовані та роботизовані зварювальні комплекси': 'Automated and robotic welding systems',
  'Комплекс ЧПК для автоматичного приварювання шпильок': 'CNC system for automatic stud welding',
  'Підвісна кліщова машина точкового зварювання TECNA': 'Suspended TECNA spot-welding gun',
  'Точково-рельєфна машина TECNA з лінійним притиском': 'TECNA spot-projection machine with linear squeeze',
  '— нижча сила струму продовжує ресурс електродів.': '— lower current extends electrode life.',
  'Від окремих постів до повних автоматичних ліній': 'From individual stations to full automatic lines',
  'Робоче поле комплексу ЧПК — збільшити в галереї': 'CNC system working field — enlarge in gallery',
  'Пістолети DA для дугового приварювання шпильок': 'DA guns for arc stud welding',
  'Сервіс обладнання інших перевірених виробників': 'Service for equipment from other proven manufacturers',
  'Комплекси під деталь, такт і контроль процесу': 'Systems for the part, cycle time and process control',
  'Під циліндричні вироби зі змінною орієнтацією': 'For cylindrical products with variable orientation',
  'Стрічковий конвеєр транспорту й розвантаження': 'Belt conveyor for transport and unloading',
  'Шпильки Ø3–Ø8 мм (M4–M8, також M8 із фланцем)': 'Studs Ø3–Ø8 mm (M4–M8, also flanged M8)',
  'Стаціонарна інверторна точкова машина 25 кВА': 'Stationary inverter spot welder 25 kVA',
  'Крім машин на замовлення, пропонуємо також': 'Besides custom machines, we also offer',
  'Напівавтомат: ручне завантаження, автоцикл': 'Semi-automatic: manual loading, auto cycle',
  'Автоматичне зварювання панелей огорожі до': 'Automatic welding of fence panels up to',
  'Ексклюзивний дистрибʼютор TAYLOR у Польщі': 'Exclusive TAYLOR distributor in Poland',
  'Машини ЧПК можуть працювати з роботами як': 'CNC machines can work with robots as',
  '14 точок + рельєфне приварювання шпильок': '14 spots + projection stud welding',
  'Головки TAYLOR у комплексах ЧПК SMOLTECH': 'TAYLOR heads in SMOLTECH CNC systems',
  'Поле деталі до 3000 × 2000 мм, до 4 осей': 'Part field up to 3000 × 2000 mm, up to 4 axes',
  'Поперечний, поздовжній і бічний подавачі': 'Cross, longitudinal and side feeders',
  '4 × 75 кВА AC — спеціалізована оснастка': '4 × 75 kVA AC — specialised tooling',
  'Відновлення конденсаторних машин TAYLOR': 'Refurbishment of TAYLOR capacitor-discharge machines',
  'Роботизоване завантаження й переміщення': 'Robotic loading and transfer',
  'Автоматичний цикл без ручного притиску': 'Automatic cycle without manual squeeze',
  'автоматично розпізнає місце зварювання': 'automatically recognises the weld location',
  'Гідравлічний прес 150 т для гнуття 3D': 'Hydraulic press 150 t for 3D bending',
  'Комплекс ЧПК для приварювання шпильок': 'CNC system for stud welding',
  '(P=50%) і силою притиску електродів': '(P=50%) and electrode squeeze force',
  'Вимірювання та технологічні послуги': 'Measurement and process services',
  'Під кузовні й складальні компоненти': 'For body and assembly components',
  'Рельєфне приварювання гайок роботом': 'Projection welding of nuts by robot',
  '3 незалежні головки в одному циклі': '3 independent heads in one cycle',
  'Модернізація, діагностика й ремонт': 'Modernisation, diagnostics and repair',
  'Вібраційний подавач + джерело CDM': 'Vibratory feeder + CDM power source',
  'Т-подібний стіл під великі листи': 'T-shaped table for large sheets',
  'Швидке переналагодження програми': 'Quick programme changeover',
  '2 головки + вібраційні подавачі': '2 heads + vibratory feeders',
  'Підказати технологію під деталь': 'Suggest technology for the part',
  'Змінні шаблони під різні сітки': 'Interchangeable templates for different meshes',
  '— Підвісні кліщові, 2,5–90 кВА': '— Suspended guns, 2.5–90 kVA',
  '10 точок за автоматичний цикл': '10 spots per automatic cycle',
  'Інверторні стаціонарні машини': 'Inverter stationary machines',
  '4 × 200 кВА інвертор 1000 Гц': '4 × 200 kVA inverter 1000 Hz',
  'Портальна рама, 12 циліндрів': 'Portal frame, 12 cylinders',
  'Підвісні кліщові, 2,5–90 кВА': 'Suspended guns, 2.5–90 kVA',
  'Рівний і повторюваний натиск': 'Even and repeatable squeeze',
  '12 зварювальними циліндрами': '12 welding cylinders',
  'Палетизація готових панелей': 'Palletising of finished panels',
  '16–25 кВА AC · 25 кВА MFDC': '16–25 kVA AC · 25 kVA MFDC',
  '3D-деталі · великі корпуси': '3D parts · large housings',
  'Інверторні підвісні машини': 'Inverter suspended machines',
  'Оснастка під стабілізатори': 'Tooling for stabilisers',
  'Педальний або пневматичний': 'Pedal or pneumatic',
  'Запитати про машинний зір': 'Ask about machine vision',
  'Робота в змінних шаблонах': 'Operation in interchangeable templates',
  '32 кВА на модуль (P=50%)': '32 kVA per module (P=50%)',
  'Важкозварювані матеріали': 'Hard-to-weld materials',
  'Запитати про роботизацію': 'Ask about robotisation',
  'Конденсаторна чи дугова?': 'Capacitor discharge or arc?',
  'для обʼємних 3D-деталей.': 'for volumetric 3D parts.',
  'комплекси на базі TAYLOR': 'systems based on TAYLOR',
  'років виробництва TAYLOR': 'years of TAYLOR production',
  '2 × 240 кВА MF інвертор': '2 × 240 kVA MF inverter',
  '4 незалежних комплектів': '4 independent sets',
  'Кліщові підвісні машини': 'Suspended gun machines',
  'Лист · прут · 3D-деталі': 'Sheet · wire · 3D parts',
  'Панелі 2D і 3D, Ø3–8 мм': '2D and 3D panels, Ø3–8 mm',
  'Простота без компресора': 'Simplicity without a compressor',
  'Під пера жалюзійних сит': 'For louvre-screen fins',
  'Усі відео': 'All videos',
  'ексклюзивна дистрибуція': 'exclusive distribution',
  '15 циліндрів × 760 даН': '15 cylinders × 760 daN',
  '2 × 90 кВА MF інвертор': '2 × 90 kVA MF inverter',
  '51 трикамерний циліндр': '51 three-chamber cylinders',
  '9 подвійних модулів AC': '9 twin AC modules',
  'Напівавтоматичний цикл': 'Semi-automatic cycle',
  'зварювальні компоненти': 'welding components',
  'Конденсаторний розряд': 'Capacitor discharge',
  'Ступінь автоматизації': 'Degree of automation',
  '— Стаціонарні точкові': '— Stationary spot',
  '4 ручки за один цикл': '4 handles in one cycle',
  'SG-5 · стабілізатори': 'SG-5 · stabilisers',
  'Багатоточкові машини': 'Multi-spot machines',
  'комплексів у галереї': 'systems in the gallery',
  'реалізацій у галереї': 'implementations in the gallery',
  'Поле 2500 × 1500 мм': 'Field 2500 × 1500 mm',
  'Стаціонарні точкові': 'Stationary spot',
  'Три подавачі прутів': 'Three wire feeders',
  'DC 400 кВА (P-50%)': 'DC 400 kVA (P-50%)',
  'Інвертор MF 25 кВА': 'Inverter MF 25 kVA',
  'Роботизовані пости': 'Robotic stations',
  'змінними шаблонами': 'interchangeable templates',
  'над робочим полем.': 'above the working field.',
  'До 1600 × 4000 мм': 'Up to 1600 × 4000 mm',
  'MFDC · 56–90 кВА': 'MFDC · 56–90 kVA',
  'Вибір технології': 'Technology choice',
  'відео реалізацій': 'implementation videos',
  'AC 50 Гц · MFDC': 'AC 50 Hz · MFDC',
  'Інверторна дуга': 'Inverter arc',
  'Замовити сервіс': 'Order service',
  'Лінії для сіток': 'Lines for meshes',
  'під вашу деталь': 'for your part',
  '1600 × 4000 мм': '1600 × 4000 mm',
  '2 × 103 кВА AC': '2 × 103 kVA AC',
  '2 × 200 кВА AC': '2 × 200 kVA AC',
  '2500 × 1500 мм': '2500 × 1500 mm',
  '2500 × 2500 мм': '2500 × 2500 mm',
  '3 × 160 кВА AC': '3 × 160 kVA AC',
  'AC · 16–25 кВА': 'AC · 16–25 kVA',
  'AC · 16–38 кВА': 'AC · 16–38 kVA',
  'DA — пістолети': 'DA — guns',
  'SP-3 · шухляда': 'SP-3 · drawer',
  'SP-8 · корпуси': 'SP-8 · housings',
  'SW-12 · жалюзі': 'SW-12 · louvres',
  'Подача деталей': 'Part feed',
  'панелі огорожі': 'fence panels',
  'чотирьох ручок': 'four handles',
  'MFDC · 25 кВА': 'MFDC · 25 kVA',
  'Робот · гайки': 'Robot · nuts',
  '— максимально': '— maximum',
  'SG-4 · гриль': 'SG-4 · grill',
  'SW-51 · стіл': 'SW-51 · table',
  'Партнерство': 'Partnership',
  'Робоче поле': 'Working field',
  'ЧПК — серія': 'CNC — series',
  'SG-2 · зір': 'SG-2 · vision',
  'при 6 бар.': 'at 6 bar.',
  '10 точках': '10 spots',
  '14 точках': '14 spots',
  '2×260 даН': '2×260 daN',
  'Підтримка': 'Support',
  'Для кого': 'For whom',
  'Діапазон': 'Range',
  'Техніка': 'Technology',
  'габіони': 'gabions',
  '32 кВА': '32 kVA',
  'T-стіл': 'T-table',
  '4 осі': '4 axes',

  /* === EN PATCH STUD 20260903 === */
  '1400 А': '1400 A',
  'Конденсаторне приварювання шпильок — швидкий імпульс, чистий зворот': 'Capacitor-discharge stud welding — fast pulse, clean reverse side',
  'Міцні зʼєднання на тонкому матеріалі за 1–3 мс. До 50 шпильок/хв — без зайвого нагріву й майже без сліду на зворотному боці.': 'Strong joints on thin material in 1–3 ms. Up to 50 studs/min — without excess heat and almost no mark on the reverse side.',
  'Технологія розряду': 'Discharge technology',
  'Економічні й надійні пристрої для тонкого матеріалу': 'Economical, reliable units for thin material',
  'Шпильки Ø2–Ø10 мм з мʼякої та нержавіючої сталі, алюмінію й латуні — до плоских, чистих листів. Короткий час заряджання дає високий такт і низькі експлуатаційні витрати.': 'Studs Ø2–Ø10 mm in mild and stainless steel, aluminium and brass — to flat, clean sheet. Short charging time delivers high takt and low operating cost.',
  'діапазон шпильок': 'stud diameter range',
  'шпильок за хвилину': 'studs per minute',
  'імпульс розряду': 'discharge pulse',
  'Конденсаторний пристрій CDM для приварювання шпильок': 'CDM capacitor unit for stud welding',
  'C2 і LG2 — під контакт і підняття': 'C2 and LG2 — contact and lift',
  'Машини CDM працюють із контактними пістолетами C2 і пістолетами з підняттям LG2. Легка, міцна конструкція джерел спрощує перенесення між постами.': 'CDM machines work with contact guns C2 and lift guns LG2. A light, robust power-source design makes it easy to move between stations.',
  'Мʼяка сталь, нержавіюча, алюміній, латунь': 'Mild steel, stainless, aluminium, brass',
  'Мінімальний слід на зворотному боці листа': 'Minimal mark on the reverse side of the sheet',
  'Під ручну роботу й автоматизацію ЧПК': 'For hand work and CNC automation',
  'Контактний C2 · підняття LG2': 'Contact C2 · lift LG2',
  'Пістолети': 'Guns',
  'Цифрове керування напругою, швидкий цикл і компактний корпус — готове джерело і для ручного поста, і для автоматичної головки.': 'Digital voltage control, a fast cycle and a compact housing — ready as a source for a hand station or an automatic head.',
  'Цифрова напруга': 'Digital voltage',
  'Відображення напруги заряджання конденсаторів і плавне регулювання без дрейфу від мережі.': 'Display of capacitor charging voltage and smooth regulation without drift from the mains.',
  'Швидкий цикл': 'Fast cycle',
  'Короткий час заряджання — високий такт приварювання на серійних і дрібносерійних роботах.': 'Short charging time — high welding takt on series and short-run work.',
  'Чистий зворот': 'Clean reverse side',
  'Імпульс 1–3 мс на тонкому матеріалі залишає мінімальний слід на зворотному боці зʼєднання.': 'A 1–3 ms pulse on thin material leaves a minimal mark on the reverse side of the joint.',
  'Світлодіодна сигналізація': 'LED signalling',
  'Усі ключові функції чітко сигналізуються — оператор одразу бачить стан процесу.': 'All key functions are clearly signalled — the operator sees process status at once.',
  'Компактний корпус': 'Compact housing',
  'Міцна й легка конструкція зручна на ручному посту та як джерело у комплексі ЧПК.': 'A robust, light design suits a hand station and as a source in a CNC cell.',
  'З подавачем шпильок і головками SIK2 / SIK100 — джерело струму для комплексів ЧПК SMOLTECH.': 'With a stud feeder and SIK2 / SIK100 heads — a current source for SMOLTECH CNC cells.',
  'Природний вибір для шпильок Ø2–Ø10 мм на тонкому матеріалі, коли важливі швидкість циклу та вигляд зворотного боку.': 'The natural choice for Ø2–Ø10 mm studs on thin material when cycle speed and reverse-side appearance matter.',
  'Комплекси ЧПК на базі CDM': 'CNC cells based on CDM',
  'Вібраційні подавачі, головки SIK2 / SIK100 і конденсаторні джерела — серійне приварювання без ручного такту.': 'Vibratory feeders, SIK2 / SIK100 heads and capacitor sources — series welding without a manual takt.',
  'Дивитись комплекси ЧПК': 'See CNC cells',
  'Більший діаметр': 'Larger diameter',
  'Потрібні шпильки понад Ø10?': 'Need studs over Ø10?',
  'Для діаметрів до Ø16 мм і товстішого матеріалу — інверторна дуга i12 / i16 (Drawn Arc і Short Cycle).': 'For diameters up to Ø16 mm and thicker material — inverter arc i12 / i16 (Drawn Arc and Short Cycle).',
  'Інверторне дугове приварювання — більший діаметр, товстіший матеріал': 'Inverter arc stud welding — larger diameter, thicker material',
  'Пристрої i12 та i16 для шпильок до Ø16 мм. Drawn Arc і Short Cycle, струм до 1400 А, цикл 10–1000 мс — точний контроль на складальних і сервісних постах.': 'i12 and i16 units for studs up to Ø16 mm. Drawn Arc and Short Cycle, current up to 1400 A, cycle 10–1000 ms — precise control on assembly and service stations.',
  'Швидкі й точні зʼєднання без зайвої складності': 'Fast, accurate joints without unnecessary complexity',
  'Мікропроцесорне керування, легкий корпус і зрозумілий дисплей. Після автотесту безпеки задаєте струм і час — і працюєте з мʼякою чи нержавіючою сталлю.': 'Microprocessor control, a light housing and a clear display. After the safety self-test you set current and time — and work with mild or stainless steel.',
  'макс. струм зварювання': 'max. welding current',
  'мов на дисплеї': 'languages on the display',
  'Інверторний пристрій DA для приварювання шпильок': 'DA inverter unit for stud welding',
  'DA2A, DA7B і DA8A під ваш процес': 'DA2A, DA7B and DA8A for your process',
  'Група DA працює з пістолетами DA2A, DA7B і DA8A. Компактна конструкція полегшує установку на посту й обслуговування в цеху.': 'The DA group works with DA2A, DA7B and DA8A guns. A compact design makes station setup and shop-floor service easier.',
  'Автотест безпеки після включення': 'Safety self-test after switch-on',
  'Тест ходу пістолета перед серією': 'Gun stroke test before a run',
  'Піддув захисного газу в комплектації': 'Shielding-gas purge in the package',
  'Drawn Arc або Short Cycle': 'Drawn Arc or Short Cycle',
  'Один пристрій — два режими. Підбираємо метод під діаметр шпильки, товщину матеріалу й вимоги до зʼєднання.': 'One unit — two modes. We match the method to stud diameter, material thickness and joint requirements.',
  'Тягнута дуга': 'Drawn arc',
  'Класичний дуговий цикл для більших діаметрів і товстішого основного матеріалу. Стабільна дуга, контрольований час і струм запалювання.': 'Classic arc cycle for larger diameters and thicker parent material. Stable arc, controlled ignition time and current.',
  'Короткий цикл': 'Short cycle',
  'Стиснений імпульс для швидших зʼєднань там, де геометрія й матеріал дозволяють коротший час приварювання.': 'A compressed pulse for faster joints where geometry and material allow a shorter weld time.',
  'Що всередині інверторних пристроїв DA': 'What is inside DA inverter units',
  'Інверторна техніка дає стабільну дугу навіть за коротких часів — видно в якості зʼєднання й енергоефективності.': 'Inverter technology gives a stable arc even at short times — visible in joint quality and energy efficiency.',
  'Мікропроцесор': 'Microprocessor',
  'Керування параметрами зварювання з безступінчастим регулюванням струму й часу.': 'Weld-parameter control with stepless current and time regulation.',
  'Запалювання дуги': 'Arc ignition',
  'Окреме налаштування часу та струму запалювання під конкретну шпильку й матеріал.': 'Separate ignition time and current settings for the specific stud and material.',
  'Дисплей 12 мов': '12-language display',
  'Багатофункціональний екран зрозумілий оператору — менше помилок при зміні програми.': 'A multifunction screen the operator understands — fewer errors when changing programmes.',
  'Захист процесу': 'Process protection',
  'Захисний газ': 'Shielding gas',
  'Установка піддуву захисного газу в комплекті — для процесів, де потрібна захищена дуга.': 'Shielding-gas purge setup in the package — for processes that need a shielded arc.',
  'Міцна легка конструкція — зручне маневрування й установка в будь-якому місці цеху.': 'A robust, light build — easy to move and set up anywhere in the shop.',
  'DA — для шпильок більшого діаметра й товстішого матеріалу. Типова продуктивність 20–30 шпильок/хв залежно від розміру.': 'DA — for larger-diameter studs and thicker material. Typical output 20–30 studs/min depending on size.',
  'Тонкий лист': 'Thin sheet',
  'Діаметри до Ø10 на тонкому матеріалі?': 'Diameters up to Ø10 on thin material?',
  'Конденсаторна CDM часто економічніша: до 50 шпильок/хв і мінімальний слід на звороті.': 'Capacitor CDM is often more economical: up to 50 studs/min and a minimal reverse-side mark.',
  'Серія': 'Series',
  'Потрібна повна автоматизація?': 'Need full automation?',
  'Комплекси ЧПК SMOLTECH на конденсаторних джерелах — для серійного приварювання за програмою.': 'SMOLTECH CNC cells on capacitor sources — for series welding by programme.',
  'Комплекси ЧПК · SMOLTECH': 'CNC cells · SMOLTECH',
  'Власні комплекси з вібраційними подавачами й джерелами TAYLOR CDM: до 4 головок, поле до 3000 × 2000 мм, швидке переналагодження під коротку й довгу серію.': 'Our own cells with vibratory feeders and TAYLOR CDM sources: up to 4 heads, field up to 3000 × 2000 mm, fast changeover for short and long runs.',
  'Серійне виробництво': 'Series production',
  'Точність ЧПК + конденсаторне джерело': 'CNC accuracy + capacitor source',
  'Будуємо комплекси під вашу деталь: числове позиціонування, автоматична подача шпильок і міцні зʼєднання без ручного такту оператора.': 'We build cells around your part: numerical positioning, automatic stud feed and strong joints without an operator’s manual takt.',
  'поле деталі, мм': 'part field, mm',
  'головки в одному циклі': 'heads in one cycle',
  'осі позиціонування': 'positioning axes',
  'Автомат ЧПК SMOLTECH для приварювання шпильок': 'SMOLTECH CNC automatic machine for stud welding',
  'Фото, відео й опис поруч — одразу видно конфігурацію, яку показувати клієнту. Кожна позиція має якір для прямого посилання.': 'Photo, video and description side by side — the configuration to show a customer is clear at once. Each item has an anchor for a direct link.',
  'Поле': 'Field',
  'До 3000 × 2000 мм': 'Up to 3000 × 2000 mm',
  'Максимально 4 осі — багато шпильок на кількох компонентах в одній програмі.': 'Up to 4 axes — many studs on several components in one programme.',
  'Шпильки': 'Studs',
  'Ø3–Ø8 мм': 'Ø3–Ø8 mm',
  'Стандартні M4–M8 і M8 із фланцем — низьковуглецева та нержавіюча сталь, 6–30 мм.': 'Standard M4–M8 and flanged M8 — low-carbon and stainless steel, 6–30 mm.',
  'Головки': 'Heads',
  'До 4 комплектів': 'Up to 4 sets',
  'До 4 типів шпильок в одному циклі без переналагодження машини.': 'Up to 4 stud types in one cycle without machine changeover.',
  'Подача': 'Feed',
  'Вібраційні бункери': 'Vibratory hoppers',
  'Автоматична подача шпильок до головок — стабільний такт без ручного дозування.': 'Automatic stud feed to the heads — stable takt without manual dosing.',
  'Джерело': 'Power source',
  'Конденсатор CDM': 'CDM capacitor',
  'Джерела TAYLOR CDM у комплексі — швидкий імпульс і чисте зʼєднання на тонкому листі.': 'TAYLOR CDM sources in the cell — a fast pulse and a clean joint on thin sheet.',
  'Робот як 5-а вісь': 'Robot as a 5th axis',
  'Машини ЧПК можуть працювати з роботами як 5-осьове рішення для обʼємних деталей.': 'CNC machines can work with robots as a 5-axis solution for 3D parts.',
  'Робочі поля, головки й вібраційні подавачі — реальні машини SMOLTECH, готові до показу клієнту.': 'Work fields, heads and vibratory feeders — real SMOLTECH machines, ready to show a customer.',
  'Джерела CDM для клітинок': 'CDM sources for cells',
  'ST-2 — вигляд машини': 'ST-2 — machine view',
  'Робоче поле · головки': 'Work field · heads',
  'Подавачі · джерела CDM': 'Feeders · CDM sources',
  'Методи': 'Methods',
  '23 реалізації SMOLTECH: відео й короткий опис кожного комплексу — ті самі позиції, що на smoltech.pl.': '23 SMOLTECH installations: a video and short description of each cell — the same items as on smoltech.pl.',
  'Інвертор 25 кВА і два циліндри для приварювання штифтів до струмової котушки MnMx.': '25 kVA projection welder with two cylinders for welding pins to an MnMx current coil.',
  'Інверторна машина SW-9/2×240/MF для огорожних і будівельних сіток': 'Inverter machine SW-9/2×240/MF for fence and construction meshes',
  'Інверторний комплекс SG-2/1×160/MF — металеві кошики різних розмірів': 'Inverter cell SG-2/1×160/MF — metal baskets of various sizes',
  'Інверторний комплекс ST1/1-CN — дугове приварювання до хомута паливного бака': 'Inverter cell ST1/1-CN — arc stud welding to a fuel-tank clamp',
  'Автоматизований комплекс SG-2/2×160/MF — гайки M8 і гравіювання': 'Automated cell SG-2/2×160/MF — M8 nuts and engraving',
  'Автоматизований комплекс ST-3/6-CNC — приварювання шпильок': 'Automated cell ST-3/6-CNC — stud welding',
  'Автоматизований комплекс SŁ-1/1×56/MF — щіткування й локатор амортизатора': 'Automated cell SŁ-1/1×56/MF — brushing and damper locator welding',
  'Автоматична станція SL-2/1×200 — запресування й шовне зварювання денця в трубу': 'Automatic station SL-2/1×200 — pressing and seam welding a bottom into a tube',
  'Автоматична точкова SP-8/3×75/AC — кухонні витяжки на поворотному столі': 'Automatic spot welder SP-8/3×75/AC — kitchen hoods on a rotary table',
  'Автоматичне зварювання панелей до 2500 × 2500 мм (Ø3–8 мм): три подавачі прутів, прес 150 т для 3D і поворотний стіл для палетизації під час роботи машини.': 'Automatic welding of panels up to 2500 × 2500 mm (Ø3–8 mm): three wire feeders, a 150 t press for 3D and a rotary table for palletising while the machine runs.',
  'Автоматичне точкове зварювання деталі в 10 точках зі стрічковим конвеєром для транспортування й розвантаження.': 'Automatic spot welding of a part at 10 points with a belt conveyor for transport and unloading.',
  'Автоматичний комплекс SP-1/1×50 — різання та брикетування проводів': 'Automatic cell SP-1/1×50 — wire cutting and briquetting',
  'Багатоточкова машина SW-12/2×90/MF для жалюзійних сит': 'Multi-spot machine SW-12/2×90/MF for louvre screens',
  'Багатоточкова машина SW-18/9×32/AC для зварювання сталевих сіток у шаблонах': 'Multi-spot machine SW-18/9×32/AC for welding steel meshes in templates',
  'Багатоточкова машина SW-51/4×180 для огорожних сіток із трьома подавачами прутів': 'Multi-spot machine SW-51/4×180 for fence meshes with three wire feeders',
  'Базова платформа SW-51 для серійного зварювання панелей до 2500 × 2500 мм: пʼять інверторів 200 кВА, 51 циліндр і прес для панелей 3D.': 'SW-51 base platform for series welding of panels up to 2500 × 2500 mm: five 200 kVA inverters, 51 cylinders and a press for 3D panels.',
  'Версія 2: лазерна брама вимірювання штока та подвійна ідентифікація оснастки RFID.': 'Version 2: laser gate for rod measurement and dual RFID tooling identification.',
  'Вібраційний подавач денець, автоподача труб, прес запресування/калібрування та шовне зварювання по колу.': 'Vibratory bottom feeder, automatic tube feed, press for pressing/calibration and circumferential seam welding.',
  'Два робочі гнізда з оснасткою DESTACO для приварювання ніпелів до металевих штамповок і труб вихлопу.': 'Two work nests with DESTACO tooling for welding nipples to metal stampings and exhaust tubes.',
  'Двогніздова станція для паралельного приварювання різних зондів до штамповки й труби системи випуску.': 'Twin-nest station for parallel welding of different probes to stampings and exhaust tubes.',
  'Джерело PRO-I 1300, два пістолети PHA-500 на важелях Powerflex і автоматичні подавачі VBZ-S01.': 'PRO-I 1300 source, two PHA-500 guns on Powerflex arms and automatic VBZ-S01 feeders.',
  'Для великих сіток: прут Ø3–10 мм, вічко 20–200 мм, габарити до 1600 × 4000 мм — DC 400 кВА і 15 циліндрів × 760 даН.': 'For large meshes: Ø3–10 mm wire, 20–200 mm pitch, sizes up to 1600 × 4000 mm — DC 400 kVA and 15 cylinders × 760 daN.',
  'Кожна позиція — окремий якір для посилання клієнту. Відео поруч із коротким описом.': 'Each item has its own anchor for sharing with a customer. Video beside a short description.',
  'Комплекс S-WPT — запресування тарілки та приварювання штифта': 'Cell S-WPT — pressing a plate and welding a pin',
  'Комплекс SG-2/1×400 DC — рельєфне приварювання зондів до вихлопу': 'Cell SG-2/1×400 DC — projection welding of probes to exhaust parts',
  'Комплекс SG-2/1×400 DC — рельєфне приварювання ніпелів': 'Cell SG-2/1×400 DC — projection welding of nipples',
  'Комплекс SL-2/1×200ST — шовне зварювання денця амортизатора': 'Cell SL-2/1×200ST — seam welding a damper bottom',
  'Комплекс SM-2/1×80 — монтаж і точкове зварювання вихлопу': 'Cell SM-2/1×80 — assembly and spot welding of exhaust parts',
  'Комплекс SP-4/1×160CH — запресування й точкове зварювання втулки штока (версія 2)': 'Cell SP-4/1×160CH — pressing and spot welding a rod bushing (version 2)',
  'Комплекс SPT-4/1×90MF — металеві корпуси та приварювання шпильок': 'Cell SPT-4/1×90MF — metal housings and stud welding',
  'Кіоск з оптичним барʼєром: після ручного завантаження скриньки — базування, точкове зварювання й приварювання шпильок.': 'Kiosk with an optical barrier: after manual box loading — locating, spot welding and stud welding.',
  'Кіоск із зонами ручного монтажу та автоматичного зварювання; двопозиційний поворотний стіл між зонами.': 'Kiosk with manual-assembly and automatic-welding zones; a two-position rotary table between them.',
  'Кіоск із нерухомими огорожами та рухомою фронтальною захисною планкою — для зварювання кошиків змінних габаритів.': 'Kiosk with fixed guards and a moving front safety strip — for welding baskets of variable sizes.',
  'Лінія Komax + TECNA 50 кВА: різання й зачищення проводів, брикетування та маніпулятори для подачі.': 'Komax + TECNA 50 kVA line: wire cutting and stripping, briquetting and feed manipulators.',
  'Машина SG-2/1×25/MF з машинним зором — ручка термокружки': 'Machine SG-2/1×25/MF with machine vision — thermal-mug handle',
  'Машина зі змінними шаблонами та палетизацією готових сіток — під огорожні й будівельні формати з інверторною технікою 2×240 кВА.': 'Machine with interchangeable templates and palletising of finished meshes — for fence and construction formats with 2×240 kVA inverter technology.',
  'Напівавтоматична рельєфна SG-3/1×200MF — три кронштейни до кільця': 'Semi-automatic projection SG-3/1×200MF — three brackets to a ring',
  'Напівавтоматичне шовне зварювання денця, запресованого в трубу: TECNA 200 кВА і два зварювальні модулі.': 'Semi-automatic seam welding of a bottom pressed into a tube: TECNA 200 kVA and two welding modules.',
  'Напівавтоматичний комплекс SG-4/2×200/AC — ручки до чаші гриля': 'Semi-automatic cell SG-4/2×200/AC — handles to a grill bowl',
  'Напівавтоматичний інверторний SP-1/1×25/MF — штифти зі струмовою котушкою': 'Semi-automatic inverter SP-1/1×25/MF — pins with a current coil',
  'Повністю автоматизований роботизований пост: точкове зварювання сталевих корпусів у 14 точках і рельєфне приварювання шпильок.': 'Fully automated robotic station: spot welding of steel housings at 14 points and projection welding of studs.',
  'Поворотний стіл із трьома станціями: завантаження плити, подача й зварювання гайок, гравіювання маркування.': 'Rotary table with three stations: plate loading, nut feed and welding, mark engraving.',
  'Поворотний стіл із чотирма підстанціями: завантаження, щіткування днища, очищення зони зварювання та приварювання локатора.': 'Rotary table with four substations: loading, bottom brushing, weld-zone cleaning and locator welding.',
  'Поворотний стіл із чотирма робочими станціями для серійного точкового зварювання кухонних витяжок.': 'Rotary table with four work stations for series spot welding of kitchen hoods.',
  'Преса KISTLER для запресування тарілки на трубу й головка NELSON для автоматичного приварювання штифта — елементи амортизатора.': 'KISTLER press for pressing a plate onto a tube and a NELSON head for automatic pin welding — damper parts.',
  'Робот із машинним зором забирає труби з коша; запресування денця й шовне зварювання по колу для герметичного зʼєднання.': 'A vision-guided robot picks tubes from a basket; bottom pressing and circumferential seam welding for a sealed joint.',
  'Робота в змінних шаблонах під різні вічка й габарити сітки — гнучке рішення для менших і середніх серій.': 'Operation in interchangeable templates for different mesh openings and sizes — a flexible solution for small and medium series.',
  'Роботизований комплекс SL-2/1×200 — запресування й шовне зварювання денця': 'Robotic cell SL-2/1×200 — pressing and seam welding a bottom',
  'Роботизований комплекс SP-8/4×75/AC/R — корпуси та шпильки': 'Robotic cell SP-8/4×75/AC/R — housings and studs',
  'Роботизований пост для компонентів кузова: робот автоматично виконує послідовність операцій приварювання без участі оператора в зоні зварювання.': 'Robotic station for body components: the robot runs the weld sequence automatically with no operator in the weld zone.',
  'Роботизований пост — зварювання елементів кузова': 'Robotic station — welding of body components',
  'Серійне зварювання огорожних сіток з автоматичною подачею поперечних, поздовжніх і бічних прутів — стабільний такт без ручного укладання.': 'Series welding of fence meshes with automatic feed of cross, longitudinal and side wires — a stable takt without hand laying.',
  'Спеціалізована конфігурація під пера жалюзійних сит: два інвертори по 90 кВА з обох боків портала для симетричного живлення ряду.': 'Specialised configuration for louvre-screen fins: two 90 kVA inverters on both sides of the portal for symmetrical row supply.',
  'Сім реалізацій SMOLTECH: відео й короткий опис кожної машини — щоб під час розмови з клієнтом одразу показувати потрібну конфігурацію.': 'Seven SMOLTECH installations: a video and short description of each machine — so you can show the right configuration in a customer call.',
  'Точкова машина SP-3/2×103/AC — шухляда в 10 точках із конвеєром': 'Spot welder SP-3/2×103/AC — drawer at 10 spots with a conveyor',
  'Точне приварювання ручок до циліндричних термокружок: система машинного зору сама визначає місце зварювання.': 'Precise welding of handles to cylindrical thermal mugs: machine vision finds the weld location automatically.',
  'Три головки з вібраційними подавачами: різні типи шпильок у довільній конфігурації на сталевих листах.': 'Three heads with vibratory feeders: different stud types in any layout on steel sheets.',
  'Три зварювальні головки з притиском ~900 кг і інвертор MFDC 200 кВА — для елементів корпусів електродвигунів і генераторів.': 'Three welding heads at ~900 kg squeeze and a 200 kVA MFDC inverter — for electric-motor and alternator housing parts.',
  'Усі 23 комплекси з аналогічної сторінки smoltech.pl. Відео поруч із коротким описом — окремий якір для посилання клієнту.': 'All 23 cells from the matching smoltech.pl page. Video beside a short description — each with its own anchor for sharing.',
  'Швидке й точне рельєфне приварювання 4 ручок до чаш гриля на жорсткій рамі з профілів алюмінію.': 'Fast, precise projection welding of 4 handles to grill bowls on a rigid aluminium-profile frame.',

  'Моделі CDM8, CDM9 і CDM10. Міцні зʼєднання на тонкому матеріалі за 1–3 мс — до 50 шпильок/хв майже без сліду на звороті.': 'Models CDM8, CDM9 and CDM10. Strong joints on thin material in 1–3 ms — up to 50 studs/min with almost no mark on the reverse.',
  'Специфікація': 'Specification',
  'три моделі': 'three models',
  'вихідна напруга': 'output voltage',
  'Для комбінації кількох пістолетів — CDM Multi-Gun (до трьох комплектів).': 'For combining several guns — CDM Multi-Gun (up to three sets).',
  'Порівняння моделей CDM8, CDM9 і CDM10': 'CDM8, CDM9 and CDM10 model comparison',
  'Параметри з каталогу TAYLOR. Оберіть модель за фото — підсвітиться відповідна колонка.': 'Parameters from the TAYLOR catalogue. Pick a model by photo — the matching column is highlighted.',
  'Параметри з каталогу TAYLOR. Оберіть модель у стрічці — підсвітиться відповідна колонка.': 'Parameters from the TAYLOR catalogue. Pick a model in the strip — the matching column is highlighted.',
  'Моделі CDM': 'CDM models',
  'Параметр': 'Parameter',
  'Діаметр шпильок': 'Stud diameter',
  'Матеріал шпильки': 'Stud material',
  'Сталь (низьковуглецева / високолегована), алюміній, окремі сплави міді': 'Steel (low-carbon / high-alloy), aluminium, selected copper alloys',
  'Швидкість приварювання': 'Welding rate',
  'До 50 шпильок/хв': 'Up to 50 studs/min',
  'Ємність конденсаторів': 'Capacitance',
  'Вихідна напруга': 'Output voltage',
  'Живлення': 'Power supply',
  'Зовнішній запобіжник': 'External fuse',
  'Клас захисту': 'Protection class',
  'Габарити': 'Dimensions',
  'Маса': 'Mass',
  'Пістолети': 'Guns',
  'C2, LG2, Mini-контакт, Мікро-контакт': 'C2, LG2, Mini-contact, Micro-contact',
  'Під автоматизацію': 'Ready for automation',
  'CDM9 і CDM10 рекомендовані як джерела у комплексах ЧПК із головками SIK2 / SIK100.': 'CDM9 and CDM10 are recommended as sources in CNC cells with SIK2 / SIK100 heads.',
  'Пристрої CDM8, CDM9, CDM10 для конденсаторного приварювання шпильок Ø2–Ø10 мм: сталь, нержавіюча сталь, алюміній, латунь. До 50 шпильок за хвилину.': 'CDM8, CDM9 and CDM10 capacitor stud welders for Ø2–Ø10 mm: steel, stainless, aluminium, brass. Up to 50 studs per minute.',
  'Пристрій CDM8': 'CDM8 unit',
  'Пристрій CDM9': 'CDM9 unit',
  'Пристрій CDM10': 'CDM10 unit',
  'Інструктаж': 'Instruction',
  'Інструктажні відео': 'Instructional videos',
  'Огляд серії CDM і робота з пістолетами C2 та LG2 — ті самі матеріали, що на smoltech.pl.': 'CDM series overview and work with C2 and LG2 guns — the same materials as on smoltech.pl.',
  'Конденсаторні пристрої CDM Taylor': 'CDM Taylor capacitor discharge units',
  'Пістолет контактний C2': 'Contact gun C2',
  'Пістолет з підняттям LG2': 'Lift gun LG2',
  'Дивитись відео: Конденсаторні пристрої CDM Taylor': 'Watch video: CDM Taylor capacitor discharge units',
  'Дивитись відео: Пістолет контактний C2': 'Watch video: Contact gun C2',
  'Дивитись відео: Пістолет з підняттям LG2': 'Watch video: Lift gun LG2',

  'Моделі i12 та i16. Drawn Arc і Short Cycle, струм до 1400 А, цикл 10–1000 мс — точний контроль на складальних і сервісних постах.': 'Models i12 and i16. Drawn Arc and Short Cycle, current up to 1400 A, cycle 10–1000 ms — precise control on assembly and service stations.',
  'дві моделі': 'two models',
  'макс. струм (i16)': 'max. current (i16)',
  'Група DA працює з пістолетами DA2A, DA7B і DA8A (також у варіанті SC). Компактна конструкція полегшує установку на посту й обслуговування в цеху.': 'The DA group works with DA2A, DA7B and DA8A guns (also in SC variants). A compact build makes station setup and shop maintenance easier.',
  'Порівняння моделей i12 та i16': 'i12 and i16 model comparison',
  'Моделі DA': 'DA models',
  '3–10,8 мм RB (M12 PD)': '3–10.8 mm RB (M12 PD)',
  '3–14,6 мм RB (M16 PD)': '3–14.6 mm RB (M16 PD)',
  'Мʼяка сталь, нержавіюча, алюміній': 'Mild steel, stainless, aluminium',
  'До 20 шпильок/хв': 'Up to 20 studs/min',
  'До 30 шпильок/хв': 'Up to 30 studs/min',
  'Максимальна потужність': 'Maximum power',
  'Струм зварювання': 'Welding current',
  'Час циклу': 'Cycle time',
  'Охолодження': 'Cooling',
  'Вентилятор': 'Fan',
  'IP 23 (клас I)': 'IP 23 (class I)',
  'Безступінчасте регулювання струму й часу, окреме налаштування запалювання дуги.': 'Stepless current and time control, separate arc-ignition settings.',
  'Сигналізація перегріву, короткого замикання та помилок запалювання дуги.': 'Indication of overheating, short circuit and arc-ignition faults.',
  'Багатофункціональний екран — менше помилок при зміні програми на посту.': 'A multifunction display — fewer errors when changing the programme at the station.',
  'Інверторні пристрої i12 та i16 для дугового приварювання шпильок Ø3–Ø16 мм. Струм до 1400 А, цикл 10–1000 мс, методи Drawn Arc і Short Cycle.': 'Inverter units i12 and i16 for arc stud welding Ø3–Ø16 mm. Current up to 1400 A, cycle 10–1000 ms, Drawn Arc and Short Cycle methods.',
  'Пристрій i12': 'i12 unit',
  'Пристрій i16': 'i16 unit',
  'Огляд інверторів i12 та i16 — ті самі матеріали, що на smoltech.pl.': 'i12 and i16 inverter overview — the same materials as on smoltech.pl.',
  'Інвертор i12 — дугове приварювання шпильок': 'i12 inverter — arc stud welding',
  'Інвертор i16 — дугове приварювання шпильок': 'i16 inverter — arc stud welding',
  'Дивитись відео: Інвертор i12 — дугове приварювання шпильок': 'Watch video: i12 inverter — arc stud welding',
  'Дивитись відео: Інвертор i16 — дугове приварювання шпильок': 'Watch video: i16 inverter — arc stud welding',

  'Ключові ліміти платформи — одразу видно, чи конфігурація покриває вашу деталь і такт.': 'Key platform limits — you can see at once whether the configuration covers your part and takt.',
  'Можливості комплексів ЧПК': 'CNC cell capabilities',
  'Платформа ЧПК': 'CNC platform',
  'Поле деталі': 'Part field',
  'до 3000 × 2000 мм': 'up to 3000 × 2000 mm',
  'Осі позиціонування': 'Positioning axes',
  'до 4 (робот як 5-а вісь для 3D)': 'up to 4 (robot as a 5th axis for 3D)',
  'Зварювальні головки': 'Welding heads',
  'до 4 незалежних комплектів': 'up to 4 independent sets',
  'Ø3–Ø8 мм · M4–M8, також M8 із фланцем': 'Ø3–Ø8 mm · M4–M8, also flanged M8',
  'Довжина шпильок': 'Stud length',
  'Низьковуглецева та нержавіюча сталь': 'Low-carbon and stainless steel',
  'Подача': 'Feed',
  'Вібраційні подавачі до кожної головки': 'Vibratory feeders to each head',
  'Джерело': 'Power source',
  'Конденсаторне TAYLOR CDM': 'TAYLOR CDM capacitor-discharge power source',
  'Серії': 'Series',
  'Короткі й довгі — швидке переналагодження програми': 'Short and long — fast programme changeover',
  'Відео поруч із коротким описом — одразу видно конфігурацію для клієнта.': 'Video beside a short description — the configuration for a customer is clear at once.',
  'Повністю автоматизований комплекс ЧПК для серійного приварювання. Базова конфігурація розширюється до 4 незалежних комплектів без переналагодження машини.': 'A fully automated CNC cell for series stud welding. The base configuration expands to 4 independent sets without machine changeover.',
  'Робоче поле 2500 × 1500 мм, три головки з вібраційними подавачами й джерелами CDM. Шпильки M4–M8 (також M8 із фланцем), довжина 6–30 мм.': 'Work field 2500 × 1500 mm, three heads with vibratory feeders and CDM sources. Studs M4–M8 (also flanged M8), length 6–30 mm.',
  'Т-подібний стіл під великі листи, дві головки, вібраційні подавачі й конденсаторні джерела — компактніша конфігурація там, де три головки ще не потрібні.': 'A T-shaped table for large sheets, two heads, vibratory feeders and capacitor sources — a more compact layout where three heads are not yet needed.',
  'Технічні параметри CDM': 'CDM technical data',
  'Технічні параметри DA': 'DA technical data',
  '4 ручок': '4 handles',
  'Повністю автоматизований роботизований пост: точкове зварювання сталевих корпусів у': 'Fully automated robotic station: spot welding of steel housings at',
  ' і рельєфне приварювання шпильок.': ' and projection welding of studs.',
  'Швидке й точне рельєфне приварювання': 'Fast, precise projection welding of',
  ' до чаш гриля на жорсткій рамі з профілів алюмінію.': ' to grill bowls on a rigid aluminium-profile frame.',
  'Автоматичне точкове зварювання деталі в': 'Automatic spot welding of a part at',
  ' зі стрічковим конвеєром для транспортування й розвантаження.': ' with a belt conveyor for transport and unloading.',
  'Польща, 55-080 Mokronos Dolny': 'Poland, 55-080 Mokronos Dolny',
  'Реквізити компанії': 'Company details',
  'ІПН (NIP): PL8971804142': 'Tax ID (NIP): PL8971804142',
  'Національний судовий реєстр (KRS): 0000535326': 'National Court Register (KRS): 0000535326',
  'Статутний капітал (повністю сплачений): 500 000,00 PLN': 'Share capital (paid in full): 500,000.00 PLN',
  'Чотири групи серійних машин точкового та рельєфного зварювання — від підвісних кліщів до інверторних багатофункціональних машин.': 'Four groups of series spot and projection welding machines — from suspended guns to multifunction inverter machines.',
  'Циліндри понад 1242 даН мають послідовні камери з можливістю відключення однієї з них, функцію мʼякого підходу та сферичне крiплення стопи циліндра, що забезпечує точність контакту Т-подібних плит. На більших машинах цієї групи зварюють масивні багатовиступні елементи, кільцеві герметичні виступи та нетипові виступи. Застосування інверторної технології MFDC дає змогу отримувати відмінні результати також при зварюванні алюмінію, нержавіючих і покритих сталей, а також різнорідних матеріалів.': 'Cylinders above 1242 daN have sequential chambers with the option to disable one of them, a soft-approach function and a spherical cylinder-foot mount that keeps T-slot platens accurately in contact. Larger machines in this group weld heavy multi-projection parts, annular sealing projections and non-standard projections. MFDC inverter technology also gives excellent results on aluminium, stainless and coated steels, and on dissimilar materials.',
  'AC — універсальне й економічне рішення для сталі, у тому числі покритої. DC — там, де потрібен великий струм за довший час: масивні багатовиступні деталі, кільцеві герметичні виступи, а також алюміній, мідь і латунь. MFDC (інвертор середньої частоти) — найвища точність керування, менша споживана потужність, довший ресурс електродів; найкращий вибір для нержавіючої сталі, алюмінію та різнорідних пар матеріалів.': 'AC — a universal, economical choice for steel, including coated steel. DC — where high current is needed for longer: heavy multi-projection parts, annular sealing projections, and also aluminium, copper and brass. MFDC (medium-frequency inverter) — the most precise control, lower power draw and longer electrode life; the best choice for stainless steel, aluminium and dissimilar material pairs.',
  'Різноманітність машин разом із відмінними можливостями контролера параметрів зварювання TE760 робить це обладнання застосовним і для майстерневих робіт — наприклад ремонту автомобільних кузовів, і для промислових складальних ліній.': 'The range of machines, together with the capabilities of the TE760 welding-parameter controller, makes this equipment suitable both for workshop jobs — for example car-body repair — and for industrial assembly lines.',
  'Педальний притиск — нижча ціна, без компресора, простіше обслуговування. Пневматичний притиск — рівний натиск і двоетапний цикл для серійного виробництва.': 'Pedal squeeze — lower price, no compressor, simpler servicing. Pneumatic squeeze — even pressure and a two-stage cycle for series production.',
  'Регульована довжина плечей і хід електродів, трансформатор у пластику, водяне охолодження трансформатора, тиристора, плечей і електродів. Керування — мікропроцесорний контролер TE850.': 'Adjustable arm length and electrode stroke, resin-encapsulated transformer, water cooling of the transformer, thyristor, arms and electrodes. Control — TE850 microprocessor controller.',
  "Оберіть групу — на сторінці моделі з таблицею параметрів, як у каталозі TECNA.": "Choose a group — the next page has models and a parameter table, as in the TECNA catalogue.",
  "Кліщові підвісні з вбудованим контролером": "Suspended guns with a built-in controller",
  "Моделі 3321–3328. Компактна водяна конструкція для цехів, майстерень і складальних постів.": "Models 3321–3328. Compact water-cooled design for shops, workshops and assembly stations.",
  "Дивитись 16–38 кВА": "See 16–38 kVA",
  "Інверторні підвісні для промисловості": "Industrial inverter suspended guns",
  "Моделі 3062–3184. Велика сила притиску, короткий імпульс і нижче споживання з мережі.": "Models 3062–3184. High squeeze force, a short pulse and lower draw from the mains.",
  "Дивитись 56–90 кВА": "See 56–90 kVA",
  "Гіроскопічне підвішування та балансир дають вільний рух машини й мінімум навантаження на оператора. Діапазон потужностей — від цехової роботи до інтенсивного промислового такту.": "Gyroscopic suspension and a balancer give free machine movement and minimal load on the operator. The power range covers shop work through to an intensive industrial cycle.",
  "Кліщові підвісні машини 16–38 кВА": "Suspended gun welders 16–38 kVA",
  "Інверторні підвісні машини 56–90 кВА": "Inverter suspended guns 56–90 kVA",
  "Підвісні кліщові точкові машини 2,5–90 кВА": "Suspended gun spot welders 2.5–90 kVA",
  "Підвісні кліщові машини точкового зварювання з вбудованим трансформатором: 16–38 кВА (AC) та інверторні 56–90 кВА. Для просторових і великих деталей.": "Suspended gun spot welders with a built-in transformer: 16–38 kVA (AC) and inverter 56–90 kVA. For 3D and large parts.",
  "TECNA · AC · 16–38 кВА": "TECNA · AC · 16–38 kVA",
  "Кліщові підвісні машини з вбудованим контролером і трансформатором": "Suspended guns with a built-in controller and transformer",
  "Моделі 3321–3328. Компактна водяна конструкція, гіроскопічне підвішування й мікропроцесорний контролер — для цехів, майстерень і складальних постів.": "Models 3321–3328. Compact water-cooled design, gyroscopic suspension and a microprocessor controller — for shops, workshops and assembly stations.",
  "Порівняння моделей 3321–3328": "Comparison of models 3321–3328",
  "Оберіть модель — підсвітиться відповідна колонка. Параметри з каталогу TECNA.": "Pick a model — the matching column is highlighted. Parameters from the TECNA catalogue.",
  "Номінальна потужність, кВА": "Rated power, kVA",
  "Максимальна потужність зварювання, кВА": "Maximum welding power, kVA",
  "Живлення, V/Hz": "Supply, V/Hz",
  "Запобіжник, A": "Fuse, A",
  "Мін. довжина плечей, мм": "Min. arm length, mm",
  "Макс. довжина плечей, мм": "Max. arm length, mm",
  "Макс. сила притиску (6 бар) при Lmin, даН": "Max. squeeze force (6 bar) at Lmin, daN",
  "Тиск повітря, бар": "Air pressure, bar",
  "Охолодження води, л/хв": "Water cooling, l/min",
  "Лист низьковуглецевий при Lmin, мм": "Low-carbon sheet at Lmin, mm",
  "Прут навхрест, Ø мм": "Crossed rod, Ø mm",
  "Маса з найкоротшими плечима, кг": "Mass with shortest arms, kg",
  "Вбудований контролер": "Built-in controller",
  "Мікропроцесор точно задає параметри зварювання без окремої шафи.": "A microprocessor sets weld parameters precisely without a separate cabinet.",
  "Гіроскопічне підвішування": "Gyroscopic suspension",
  "Балансир під вагу машини — вільний рух і плечі під будь-яким кутом.": "A balancer matched to machine weight — free movement and arms at any angle.",
  "Водяне охолодження": "Water cooling",
  "Регульований попередній і робочий хід електродів та сила притиску.": "Adjustable electrode pre-stroke and working stroke, and squeeze force.",
  "Для просторових і великих деталей": "For 3D and large parts",
  "Там, де стаціонарна машина незручна — шафи, корпуси, кожухи, канали, подавачі. Багато варіантів потужності, довжини плечей і сили притиску.": "Where a stationary machine is awkward — cabinets, housings, covers, ducts, feeders. Many options for power, arm length and squeeze force.",
  "Водяне охолодження контуру": "Water-cooled circuit",
  "Регулювання ходу електродів і швидкості плечей": "Adjustment of electrode stroke and arm speed",
  "Для тонкого листа й складніших сталевих елементів": "For thin sheet and more demanding steel parts",
  "Коли обирати 16–38 кВА": "When to choose 16–38 kVA",
  "Практична група для цехів і складальних постів. Для інтенсивнішої промислової роботи — інверторні підвісні 56–90 кВА.": "A practical group for shops and assembly stations. For heavier industrial work — inverter suspended guns 56–90 kVA.",
  "Більша сила притиску, коротший імпульс і нижче споживання з мережі — під серійну промислову роботу.": "Higher squeeze force, a shorter pulse and lower mains draw — for series industrial work.",
  "Стаціонарні": "Stationary",
  "Потрібна стаціонарна машина?": "Need a stationary machine?",
  "Для листа, прута навхрест і повторюваного циклу біля одного поста — стаціонарні точкові 16–25 кВА.": "For sheet, crossed rod and a repeating cycle at one station — stationary spot welders 16–25 kVA.",
  "Дивитись стаціонарні": "See stationary machines",
  "Технічні параметри 3321–3328": "Technical data 3321–3328",
  "Підвісні кліщові машини 16–38 кВА | SMOLTECH": "Suspended gun welders 16–38 kVA | SMOLTECH",
  "Кліщові підвісні машини точкового зварювання 16–38 кВА з вбудованим контролером і трансформатором. Моделі 3321–3328: технічні параметри.": "Suspended gun spot welders 16–38 kVA with a built-in controller and transformer. Models 3321–3328: specifications.",
  "Підвісні кліщові машини 16–38 кВА — SMOLTECH": "Suspended gun welders 16–38 kVA — SMOLTECH",
  "16–38 кВА": "16–38 kVA",
  "TECNA · MFDC · 56–90 кВА": "TECNA · MFDC · 56–90 kVA",
  "Інверторні підвісні машини для промислової роботи": "Inverter suspended guns for industrial work",
  "Моделі 3062–3184. Велика сила притиску, гіроскопічне підвішування й безпечні компоненти — якісні зʼєднання при високому такті.": "Models 3062–3184. High squeeze force, gyroscopic suspension and safety components — sound welds at a high cycle rate.",
  "Порівняння моделей 3062–3184": "Comparison of models 3062–3184",
  "Потужність 20%, кВА": "Power 20%, kVA",
  "Потужність 50%, кВА": "Power 50%, kVA",
  "Розстав плечей, мм": "Arm gap, mm",
  "Сила притиску при 6 бар, даН": "Squeeze force at 6 bar, daN",
  "Сила притиску при 8 бар, даН": "Squeeze force at 8 bar, daN",
  "Струм короткого замикання, кА": "Short-circuit current, kA",
  "Ø плечей без ізоляції, мм": "Arm Ø without insulation, mm",
  "Ø плечей з ізоляцією, мм": "Arm Ø with insulation, mm",
  "Маса нетто без плечей, кг": "Net mass without arms, kg",
  "Інвертор MFDC": "MFDC inverter",
  "Коефіцієнт потужності вищий, споживання з мережі нижче, імпульс до 1 мс.": "Higher power factor, lower mains draw, pulse down to 1 ms.",
  "Безмастильна пневматика": "Lubrication-free pneumatics",
  "Хромований циліндр і контур без масляного туману в приміщенні.": "Chromed cylinder and a circuit with no oil mist in the room.",
  "Керування й захист": "Control and protection",
  "Дві програми, подвійний хід, «тільки притиск», аварійний стоп і захист без охолодження.": "Two programmes, double stroke, squeeze-only, emergency stop and protection without cooling.",
  "Маневр у важкодоступних місцях": "Manoeuvre in hard-to-reach places",
  "Довгий регульований робочий хід для підсилень і ребер. Вторинний мідний контур повністю охолоджується водою.": "A long adjustable working stroke for reinforcements and ribs. The copper secondary circuit is fully water-cooled.",
  "Гіроскопічне підвішування в будь-якому напрямку": "Gyroscopic suspension in any direction",
  "Струм зварювання безперервно, без втрат від розміру контуру": "Weld current is continuous, without losses from circuit size",
  "Зменшені габарити при великих струмах зварювання": "Reduced size at high weld currents",
  "Коли обирати 56–90 кВА": "When to choose 56–90 kVA",
  "Інверторна група — коли важливі такт, вигляд зʼєднання та витрати енергії. Для компактнішої цехової роботи — AC 16–38 кВА.": "The inverter group — when cycle rate, weld appearance and energy use matter. For more compact shop work — AC 16–38 kVA.",
  "Вбудований контролер і трансформатор — практичне рішення для майстерень і складальних постів.": "Built-in controller and transformer — a practical choice for workshops and assembly stations.",
  "Рельєф": "Projection",
  "Потрібен лінійний притиск?": "Need linear squeeze?",
  "Для деталей із виступами, гайок і кронштейнів — точково-рельєфні машини 35–315 кВА.": "For parts with projections, nuts and brackets — spot-projection machines 35–315 kVA.",
  "Дивитись точково-рельєфні": "See spot-projection machines",
  "Технічні параметри 3062–3184": "Technical data 3062–3184",
  "Інверторні підвісні машини 56–90 кВА | SMOLTECH": "Inverter suspended guns 56–90 kVA | SMOLTECH",
  "Інверторні підвісні кліщові машини 56–90 кВА для промисловості. Моделі 3062, 3066, 3176, 3177, 3183, 3184 — технічні параметри.": "Industrial inverter suspended guns 56–90 kVA. Models 3062, 3066, 3176, 3177, 3183, 3184 — specifications.",
  "Інверторні підвісні машини 56–90 кВА — SMOLTECH": "Inverter suspended guns 56–90 kVA — SMOLTECH",
  "56–90 кВА": "56–90 kVA",
  "Моделі 4640–4649. Педальний або пневматичний притиск, регульовані плечі, контролер TE101.": "Models 4640–4649. Pedal or pneumatic squeeze, adjustable arms, TE101 controller.",
  "Дивитись 16–25 кВА": "See 16–25 kVA",
  "Моделі 6010–6013. Коротший імпульс, нижче споживання, контролер TE850.": "Models 6010–6013. Shorter pulse, lower draw, TE850 controller.",
  "Дивитись інверторні 25 кВА": "See inverter 25 kVA",
  "Стаціонарна машина стоїть на одному місці: оператор подає деталі. Повторюваність зʼєднань і зручний такт у серійному виробництві близьких розмірів.": "A stationary machine stands in one place: the operator brings the parts. Repeatable welds and a convenient cycle in series production of similar sizes.",
  "Стаціонарні точкові машини 16–25 кВА з педальним або пневматичним притиском та інверторні 25 кВА. Для листа, прута та просторових деталей.": "Stationary spot welders 16–25 kVA with pedal or pneumatic squeeze, and inverter 25 kVA. For sheet, rod and 3D parts.",
  "TECNA · AC · 16–25 кВА": "TECNA · AC · 16–25 kVA",
  "Стаціонарні точкові машини з педальним або пневматичним притиском": "Stationary spot welders with pedal or pneumatic squeeze",
  "Моделі 4640–4649. Регульовані плечі й хід електродів, водяне охолодження, контролер TE101 — для листа, прута й просторових деталей.": "Models 4640–4649. Adjustable arms and electrode stroke, water cooling, TE101 controller — for sheet, rod and 3D parts.",
  "Педальний притиск — моделі 4640–4644": "Pedal squeeze — models 4640–4644",
  "Силу натиску задає оператор. Струм рушає лише після належного притиску — без компресора.": "The operator sets squeeze force. Current starts only after proper squeeze — no compressor.",
  "Вторинна напруга, V": "Secondary voltage, V",
  "Макс. струм КЗ, кА": "Max. short-circuit current, kA",
  "Запобіжник 400 V, A": "Fuse 400 V, A",
  "Макс. сила притиску при Lmin, даН": "Max. squeeze force at Lmin, daN",
  "Хід електрода при Lmin, мм": "Electrode stroke at Lmin, mm",
  "Пневматичний притиск — моделі 4645–4649": "Pneumatic squeeze — models 4645–4649",
  "Циліндр дає рівний повторюваний натиск. Двопозиційна педаль: спочатку притиск без струму, потім зварювання.": "The cylinder gives even, repeatable squeeze. Two-stage pedal: squeeze without current first, then welding.",
  "Витрата повітря / 100 звар., Нм³": "Air consumption / 100 welds, Nm³",
  "Регульовані плечі": "Adjustable arms",
  "Довжину плечей і хід електродів підлаштовують під розмір і товщину деталі.": "Arm length and electrode stroke are set to the part size and thickness.",
  "Трансформатор у пластику; вода охолоджує трансформатор, тиристор, плечі й електроди.": "Resin-encapsulated transformer; water cools the transformer, thyristor, arms and electrodes.",
  "Контролер TE101": "TE101 controller",
  "Опційно потужніший TE550 — точне налаштування параметрів зварювання.": "Optional higher-spec TE550 — precise weld-parameter setting.",
  "Лист, прут і просторові деталі": "Sheet, rod and 3D parts",
  "Стаціонарна машина біля поста оператора — повторювані зʼєднання в малих і середніх серіях без розгалуженої автоматики.": "A stationary machine at the operator station — repeatable welds in small and medium series without extensive automation.",
  "Зʼєднання сталевих листів у виробах із листового металу": "Joining steel sheets in sheet-metal products",
  "Прут навхрест і деталі різної товщини": "Crossed rod and parts of different thickness",
  "Педальний притиск без компресора або пневматика для серій": "Pedal squeeze without a compressor, or pneumatics for series work",
  "Коли обирати AC 16–25 кВА": "When to choose AC 16–25 kVA",
  "Базова стаціонарна група. Інвертор 25 кВА — коли важливі енергія, електроди або важкозварювані матеріали.": "The basic stationary group. Inverter 25 kVA — when energy, electrodes or hard-to-weld materials matter.",
  "Коротший імпульс, нижче споживання й довший ресурс електродів — моделі 6010–6013.": "Shorter pulse, lower draw and longer electrode life — models 6010–6013.",
  "Підвісні": "Suspended",
  "Деталь не донести до машини?": "Cannot bring the part to the machine?",
  "Для великих корпусів і 3D-деталей — підвісні кліщові з балансиром.": "For large housings and 3D parts — suspended guns with a balancer.",
  "Дивитись підвісні": "See suspended guns",
  "Технічні параметри 4640–4644": "Technical data 4640–4644",
  "Технічні параметри 4645–4649": "Technical data 4645–4649",
  "Стаціонарні точкові машини 16–25 кВА з педальним або пневматичним притиском. Моделі 4640–4649 — технічні параметри.": "Stationary spot welders 16–25 kVA with pedal or pneumatic squeeze. Models 4640–4649 — specifications.",
  "Стаціонарні точкові машини 16–25 кВА — SMOLTECH": "Stationary spot welders 16–25 kVA — SMOLTECH",
  "TECNA · MFDC · 25 кВА": "TECNA · MFDC · 25 kVA",
  "Інверторні стаціонарні точкові машини з педальним або пневматичним притиском": "Inverter stationary spot welders with pedal or pneumatic squeeze",
  "Моделі 6010–6013. Середня частота замість 50 Гц — коротший імпульс, нижче споживання й кращий контроль на важкозварюваних матеріалах.": "Models 6010–6013. Medium frequency instead of 50 Hz — a shorter pulse, lower draw and better control on hard-to-weld materials.",
  "Порівняння моделей 6010–6013": "Comparison of models 6010–6013",
  "6010 і 6011 — педальний притиск. 6012 і 6013 — пневматичний. Оберіть модель — підсвітиться колонка.": "6010 and 6011 — pedal squeeze. 6012 and 6013 — pneumatic. Pick a model — the column is highlighted.",
  "Тиск повітря min/max, бар": "Air pressure min/max, bar",
  "Нижче споживання": "Lower draw",
  "Інвертор бере з мережі менше, ніж порівнянна машина змінного струму.": "The inverter draws less from the mains than a comparable AC machine.",
  "Коротший імпульс": "Shorter pulse",
  "Краще контрольований струм — якість зʼєднання і довший ресурс електродів.": "Better-controlled current — weld quality and longer electrode life.",
  "Контролер TE850": "TE850 controller",
  "Мікропроцесорне керування; пневматика дає одиничний і серійний цикл.": "Microprocessor control; pneumatics give single and series cycles.",
  "Та сама механіка, інше джерело": "The same mechanics, a different source",
  "Регульовані плечі й хід, трансформатор у пластику, водяне охолодження трансформатора, тиристора, плечей і електродів.": "Adjustable arms and stroke, resin-encapsulated transformer, water cooling of transformer, thyristor, arms and electrodes.",
  "Педаль: натиск задає оператор": "Pedal: the operator sets squeeze",
  "Пневматика: рівний повторюваний натиск": "Pneumatics: even, repeatable squeeze",
  "Для важкозварюваних матеріалів — точніше керування струмом": "For hard-to-weld materials — more precise current control",
  "Коли обирати інвертор 25 кВА": "When to choose inverter 25 kVA",
  "Коли важливі витрати на енергію й електроди, вигляд зʼєднання або важкозварювані матеріали. Інакше — AC 16–25 кВА.": "When energy and electrode costs, weld appearance or hard-to-weld materials matter. Otherwise — AC 16–25 kVA.",
  "Стаціонарні AC 16–25 кВА": "Stationary AC 16–25 kVA",
  "Педальний або пневматичний притиск без інвертора — економічний вибір для щоденної роботи з листом.": "Pedal or pneumatic squeeze without an inverter — an economical choice for everyday sheet work.",
  "Кузов і просторові деталі": "Bodywork and 3D parts",
  "Змінні кліщі, балансир і контролер TE760 — серія E-tech для складальних і сервісних ліній.": "Interchangeable guns, a balancer and the TE760 controller — the E-tech series for assembly and service lines.",
  "Дивитись E-tech": "See E-tech",
  "Технічні параметри 6010–6013": "Technical data 6010–6013",
  "Інверторні стаціонарні точкові машини 25 кВА | SMOLTECH": "Inverter stationary spot welders 25 kVA | SMOLTECH",
  "Інверторні стаціонарні точкові машини 25 кВА з педальним або пневматичним притиском. Моделі 6010–6013, контролер TE850.": "Inverter stationary spot welders 25 kVA with pedal or pneumatic squeeze. Models 6010–6013, TE850 controller.",
  "Інверторні стаціонарні точкові 25 кВА — SMOLTECH": "Inverter stationary spot 25 kVA — SMOLTECH",
  "Інверторні 25 кВА": "Inverter 25 kVA",
  "Оберіть групу — на сторінці моделі з таблицею параметрів, як у каталозі TECNA. Діапазон потужності — від 35 до 315 кВА.": "Choose a group — the next page has models and a parameter table, as in the TECNA catalogue. Power range — 35 to 315 kVA.",
  "Змінного струму 35–80 кВА": "Alternating current 35–80 kVA",
  "Моделі 8001N–8009N. Модульна рама, протиобертові циліндри, контролер TE500.": "Models 8001N–8009N. Modular frame, anti-rotation cylinders, TE500 controller.",
  "Дивитись 35–80 кВА": "See 35–80 kVA",
  "Моделі 6073–6075. Енергоефективність і довший ресурс електродів на нержавіючій та алюмінії.": "Models 6073–6075. Energy efficiency and longer electrode life on stainless steel and aluminium.",
  "Дивитись 56 кВА": "See 56 kVA",
  "Моделі 6121–6129. Сталева рама, час 1 мс і шість режимів контролера TE700.": "Models 6121–6129. Steel frame, 1 ms timing and six TE700 controller modes.",
  "Дивитись 90–200 кВА": "See 90–200 kVA",
  "Змінного струму 63–163 кВА": "Alternating current 63–163 kVA",
  "Моделі 8201–8214. Більше сили й струму, ніж у групі 35–80 кВА.": "Models 8201–8214. More force and current than the 35–80 kVA group.",
  "Дивитись 63–163 кВА": "See 63–163 kVA",
  "Змінного струму 80–315 кВА": "Alternating current 80–315 kVA",
  "Масивні багатовиступні елементи, кільцеві герметичні й нетипові виступи.": "Heavy multi-projection parts, annular sealing and non-standard projections.",
  "Дивитись 80–315 кВА": "See 80–315 kVA",
  "Постійного струму 100 кВА": "Direct current 100 kVA",
  "Моделі 6101–6103. Алюміній, мідь, латунь — рівномірне навантаження трьох фаз.": "Models 6101–6103. Aluminium, copper, brass — even loading of three phases.",
  "Дивитись DC 100 кВА": "See DC 100 kVA",
  "Точково-рельєфні машини AC 35–80 кВА": "AC spot-projection machines 35–80 kVA",
  "Інверторні точково-рельєфні машини 56 кВА": "Inverter spot-projection machines 56 kVA",
  "Інверторні точково-рельєфні машини 90–200 кВА": "Inverter spot-projection machines 90–200 kVA",
  "Точково-рельєфні машини AC 63–163 кВА": "AC spot-projection machines 63–163 kVA",
  "Рельєфні машини AC 80–315 кВА": "AC projection machines 80–315 kVA",
  "Точково-рельєфні машини DC 100 кВА": "DC spot-projection machines 100 kVA",
  "TECNA · AC · 35–80 кВА": "TECNA · AC · 35–80 kVA",
  "Точково-рельєфні машини змінного струму з лінійним притиском": "AC spot-projection machines with linear squeeze",
  "Моделі 8001N–8009N. Модульна конструкція, протиобертові циліндри й контролер TE500 — для листа, прута, гайок і виступів.": "Models 8001N–8009N. Modular design, anti-rotation cylinders and TE500 controller — for sheet, rod, nuts and projections.",
  "Порівняння моделей 8001N–8009N": "Comparison of models 8001N–8009N",
  "Номінальна потужність P=50%, кВА": "Rated power P=50%, kVA",
  "Запобіжник 380–415 V, A": "Fuse 380–415 V, A",
  "Виліт плечей L, мм": "Arm throat L, mm",
  "Виліт до осі столика D, мм": "Throat to table axis D, mm",
  "Притиск електродів при 6 бар, даН": "Electrode squeeze at 6 bar, daN",
  "Макс. хід, мм": "Max. stroke, mm",
  "Тримач електрода": "Electrode holder",
  "Ø 32 мм": "Ø 32 mm",
  "Модульна рама": "Modular frame",
  "Рама, плечі, зʼєднувачі й циліндри конфігурують під оснастку та деталь.": "Frame, arms, connectors and cylinders are configured for the tooling and the part.",
  "Хромовані стінки подовженого ресурсу, протиобертові; безмастильна пневматика.": "Long-life chromed walls, anti-rotation; lubrication-free pneumatics.",
  "Т-плити": "T-slot platens",
  "Монтаж оснастки й точність притиску по осі циліндра.": "Tooling mount and squeeze accuracy on the cylinder axis.",
  "Лінійний притиск для виступів і точок": "Linear squeeze for projections and spots",
  "Двопозиційна педаль: притиск без струму, потім зварювання. Дворучний старт у рельєфних машинах — у стандарті.": "Two-stage pedal: squeeze without current, then welding. Two-hand start on projection machines is standard.",
  "Попередній хід циліндра, керований ключем": "Cylinder pre-stroke, key-adjusted",
  "Синхронний тиристор із термостатом, ізольований від контуру води": "Synchronous thyristor with thermostat, isolated from the water circuit",
  "Контролер TE500 з відліком струму": "TE500 controller with current monitoring",
  "Коли обирати 35–80 кВА": "When to choose 35–80 kVA",
  "Універсальна AC-група для сталі. Для алюмінію й різнорідних пар — інвертор; для масивних виступів — більші AC або DC.": "A universal AC group for steel. For aluminium and dissimilar pairs — inverter; for heavy projections — larger AC or DC.",
  "Інвертор 56 кВА": "Inverter 56 kVA",
  "Енергоефективна група 6073–6075 — нержавіюча, покрита сталь, алюміній і різнорідні пари.": "Energy-efficient group 6073–6075 — stainless, coated steel, aluminium and dissimilar pairs.",
  "Більша потужність AC": "Higher AC power",
  "Моделі 8201–8214 — коли виступів більше або деталь масивніша.": "Models 8201–8214 — when there are more projections or the part is heavier.",
  "Технічні параметри 8001N–8009N": "Technical data 8001N–8009N",
  "Точково-рельєфні машини AC 35–80 кВА | SMOLTECH": "AC spot-projection machines 35–80 kVA | SMOLTECH",
  "Точково-рельєфні машини змінного струму 35–80 кВА з лінійним притиском. Моделі 8001N–8009N — технічні параметри.": "AC spot-projection machines 35–80 kVA with linear squeeze. Models 8001N–8009N — specifications.",
  "Точково-рельєфні машини AC 35–80 кВА — SMOLTECH": "AC spot-projection machines 35–80 kVA — SMOLTECH",
  "TECNA · MFDC · 56 кВА": "TECNA · MFDC · 56 kVA",
  "Моделі 6073–6075. Середня частота — культура роботи, енергоефективність, якість зʼєднання й довший ресурс електродів.": "Models 6073–6075. Medium frequency — quieter running, energy efficiency, weld quality and longer electrode life.",
  "Порівняння моделей 6073–6075": "Comparison of models 6073–6075",
  "Точкова / рельєфна": "Spot / projection",
  "Вторинний струм КЗ, кА": "Secondary short-circuit current, kA",
  "Виліт плечей L (точкові), мм": "Arm throat L (spot), mm",
  "Виліт D (рельєфні), мм": "Throat D (projection), mm",
  "Макс. сила притиску (6 бар), даН": "Max. squeeze force (6 bar), daN",
  "Т-плити, мм": "T-slot platens, mm",
  "Алюміній, нержавіюча й покрита сталь, різнорідні пари — сталь+алюміній.": "Aluminium, stainless and coated steel, dissimilar pairs — steel+aluminium.",
  "Мікропроцесорний контролер; двопозиційна педаль і дворучний старт.": "Microprocessor controller; two-stage pedal and two-hand start.",
  "Сервіс": "Service",
  "Вільне опускання головки без тиску для налагодження.": "Free lowering of the head without pressure for set-up.",
  "Енергоефективний лінійний притиск": "Energy-efficient linear squeeze",
  "Модульна механіка як у AC-групи, джерело — інвертор. Вільне опускання головки без тиску для налагодження й сервісу.": "The same modular mechanics as the AC group, with an inverter source. Free lowering of the head without pressure for set-up and service.",
  "Водяне охолодження трансформатора й електродів": "Water cooling of transformer and electrodes",
  "Захисний стоп негайно вимикає машину": "A safety stop shuts the machine off at once",
  "Коли обирати 56 кВА MFDC": "When to choose 56 kVA MFDC",
  "Коли важливі енергія, електроди й важкозварювані матеріали при помірній потужності. Для більшого струму — 90–200 кВА.": "When energy, electrodes and hard-to-weld materials matter at moderate power. For higher current — 90–200 kVA.",
  "Інвертор 90–200 кВА": "Inverter 90–200 kVA",
  "Моделі 6121–6129 зі сталевою рамою, TE700 і пропорційним клапаном тиску.": "Models 6121–6129 with a steel frame, TE700 and a proportional pressure valve.",
  "Якщо інвертор ще не потрібен — універсальна група змінного струму 8001N–8009N.": "If an inverter is not yet needed — the universal AC group 8001N–8009N.",
  "Технічні параметри 6073–6075": "Technical data 6073–6075",
  "Інверторні точково-рельєфні машини 56 кВА | SMOLTECH": "Inverter spot-projection machines 56 kVA | SMOLTECH",
  "Енергоефективні інверторні точково-рельєфні машини 56 кВА. Моделі 6073, 6074, 6075 — контролер TE700 / TE751.": "Energy-efficient inverter spot-projection machines 56 kVA. Models 6073, 6074, 6075 — TE700 / TE751 controller.",
  "Інверторні точково-рельєфні машини 56 кВА — SMOLTECH": "Inverter spot-projection machines 56 kVA — SMOLTECH",
  "MFDC 56 кВА": "MFDC 56 kVA",
  "TECNA · MFDC · 90–200 кВА": "TECNA · MFDC · 90–200 kVA",
  "Моделі 6121–6129. Сталева конструкція, час зварювання з точністю 1 мс і шість режимів контролера TE700 під матеріал.": "Models 6121–6129. Steel construction, weld time accurate to 1 ms and six TE700 controller modes for the material.",
  "Порівняння моделей 6121–6129": "Comparison of models 6121–6129",
  "Номінальна потужність P20%, кВА": "Rated power P20%, kVA",
  "Номінальна потужність P50%, кВА": "Rated power P50%, kVA",
  "Макс. сила з опцією 6135, даН": "Max. force with option 6135, daN",
  "Час 1 мс": "1 ms timing",
  "Струм безперервний і не залежить від розміру вторинного контуру.": "Current is continuous and independent of secondary-circuit size.",
  "Пропорційний клапан": "Proportional valve",
  "Тиск програмується зі контролера окремо для кожної програми.": "Pressure is programmed from the controller separately for each programme.",
  "Шість режимів роботи під конкретні матеріали.": "Six operating modes for specific materials.",
  "Інвертор для серійного рельєфу": "Inverter for series projection welding",
  "Датчик протоку води вимикає машину при збої. Дворучний старт у рельєфних — стандарт, у точкових — опція.": "A water-flow sensor shuts the machine off on a fault. Two-hand start is standard on projection machines, optional on spot machines.",
  "Модульна рама, плечі, зʼєднувачі й циліндри": "Modular frame, arms, connectors and cylinders",
  "Протиобертові циліндри з хромованими стінками": "Anti-rotation cylinders with chromed walls",
  "Попередній хід, що налаштовується ключем": "Key-adjusted pre-stroke",
  "Коли обирати 90–200 кВА MFDC": "When to choose 90–200 kVA MFDC",
  "Найвища якість зʼєднання на нержавіючій, алюмінії та різнорідних парах при промисловому такті.": "The highest weld quality on stainless steel, aluminium and dissimilar pairs at an industrial cycle rate.",
  "Менша інверторна група": "Smaller inverter group",
  "6073–6075, якщо 90 кВА ще не потрібні, а інвертор уже так.": "6073–6075, if 90 kVA is not yet needed but an inverter already is.",
  "Великі AC-машини": "Large AC machines",
  "Для масивних багатовиступних і кільцевих герметичних виступів.": "For heavy multi-projection and annular sealing projections.",
  "Технічні параметри 6121–6129": "Technical data 6121–6129",
  "Інверторні точково-рельєфні машини 90–200 кВА | SMOLTECH": "Inverter spot-projection machines 90–200 kVA | SMOLTECH",
  "Інверторні точково-рельєфні машини 90–200 кВА. Моделі 6121–6129, контролер TE700, пропорційний клапан тиску.": "Inverter spot-projection machines 90–200 kVA. Models 6121–6129, TE700 controller, proportional pressure valve.",
  "Інверторні точково-рельєфні машини 90–200 кВА — SMOLTECH": "Inverter spot-projection machines 90–200 kVA — SMOLTECH",
  "MFDC 90–200 кВА": "MFDC 90–200 kVA",
  "TECNA · AC · 63–163 кВА": "TECNA · AC · 63–163 kVA",
  "Моделі 8201–8214. Модульна рама й протиобертові циліндри — коли виступів більше або деталь важча за групу 35–80 кВА.": "Models 8201–8214. Modular frame and anti-rotation cylinders — when there are more projections or the part is heavier than the 35–80 kVA group.",
  "Порівняння моделей 8201–8214": "Comparison of models 8201–8214",
  "Макс. сила притиску, даН": "Max. squeeze force, daN",
  "Макс. сила з опцією 8235, даН": "Max. force with option 8235, daN",
  "Макс. хід електрода, мм": "Max. electrode stroke, mm",
  "Мін. / макс. розстав плечей, мм": "Min. / max. arm gap, mm",
  "Більший AC для серійного рельєфу": "Larger AC for series projection welding",
  "Контролер TE500 з відліком струму. Вільне опускання головки без тиску для налагодження.": "TE500 controller with current monitoring. Free lowering of the head without pressure for set-up.",
  "Буферний ресивер повітря й відсікання подачі": "Buffer air reservoir and supply cut-off",
  "Дворучний старт у рельєфних машинах — стандарт": "Two-hand start on projection machines is standard",
  "Коли обирати 63–163 кВА": "When to choose 63–163 kVA",
  "Проміжна AC-група: більше сили й струму, ніж 35–80 кВА, без переходу на DC 100 кВА.": "An intermediate AC group: more force and current than 35–80 kVA, without moving to DC 100 kVA.",
  "Менша AC-група": "Smaller AC group",
  "8001N–8009N, якщо 63 кВА ще не потрібні.": "8001N–8009N, if 63 kVA is not yet needed.",
  "Найбільші AC": "Largest AC",
  "80–315 кВА для масивних багатовиступних і кільцевих герметичних виступів.": "80–315 kVA for heavy multi-projection and annular sealing projections.",
  "Технічні параметри 8201–8214": "Technical data 8201–8214",
  "Точково-рельєфні машини AC 63–163 кВА | SMOLTECH": "AC spot-projection machines 63–163 kVA | SMOLTECH",
  "Точково-рельєфні машини змінного струму 63–163 кВА з лінійним притиском. Моделі 8201–8214, контролер TE500.": "AC spot-projection machines 63–163 kVA with linear squeeze. Models 8201–8214, TE500 controller.",
  "Точково-рельєфні машини AC 63–163 кВА — SMOLTECH": "AC spot-projection machines 63–163 kVA — SMOLTECH",
  "TECNA · AC · 80–315 кВА": "TECNA · AC · 80–315 kVA",
  "Найбільші AC цієї групи — масивні багатовиступні елементи, кільцеві герметичні й нетипові виступи. Модульна рама й протиобертові циліндри.": "The largest AC machines in this group — heavy multi-projection parts, annular sealing and non-standard projections. Modular frame and anti-rotation cylinders.",
  "Порівняння за номінальною потужністю": "Comparison by rated power",
  "80 кВА": "80 kVA",
  "100 кВА": "100 kVA",
  "125 кВА": "125 kVA",
  "160 кВА": "160 kVA",
  "200 кВА": "200 kVA",
  "250 кВА": "250 kVA",
  "315 кВА": "315 kVA",
  "Такт 100%, кА": "100% duty, kA",
  "Живлення 50 Гц, V": "Supply 50 Hz, V",
  "Пневматика, бар": "Pneumatics, bar",
  "Для масивних виступів": "For heavy projections",
  "Циліндри понад 1242 даН мають послідовні камери, мʼякий підхід і сферичне кріплення стопи — паралельність Т-плит.": "Cylinders above 1242 daN have sequential chambers, a soft approach and a spherical foot mount — T-slot platen parallelism.",
  "Цифровий мікропроцесорний контролер з відліком струму": "Digital microprocessor controller with current monitoring",
  "80–315 кВА": "80–315 kVA",
  "Коли обирати 80–315 кВА": "When to choose 80–315 kVA",
  "Коли потрібна велика рівномірна сила на кількох виступах одночасно — у тому числі кільцевих герметичних.": "When high even force is needed on several projections at once — including annular sealing projections.",
  "Постійний струм 100 кВА": "Direct current 100 kVA",
  "Алюміній, мідь, латунь — рівномірне навантаження трьох фаз і високий коефіцієнт потужності.": "Aluminium, copper, brass — even three-phase loading and a high power factor.",
  "Оснастка й комплекси": "Tooling and cells",
  "Точково-рельєфна машина — база для автоматизованого або роботизованого поста.": "A spot-projection machine is the base for an automated or robotic station.",
  "Технічні параметри 80–315 кВА": "Technical data 80–315 kVA",
  "Рельєфні машини AC 80–315 кВА | SMOLTECH": "AC projection machines 80–315 kVA | SMOLTECH",
  "Рельєфні машини змінного струму 80–315 кВА з лінійним притиском для масивних багатовиступних і кільцевих виступів.": "AC projection machines 80–315 kVA with linear squeeze for heavy multi-projection and annular projections.",
  "Рельєфні машини AC 80–315 кВА — SMOLTECH": "AC projection machines 80–315 kVA — SMOLTECH",
  "TECNA · DC · 100 кВА": "TECNA · DC · 100 kVA",
  "Трифазні точково-рельєфні машини постійного струму 100 кВА": "Three-phase DC spot-projection machines 100 kVA",
  "Моделі 6101–6103. Високий коефіцієнт потужності, рівномірне навантаження фаз і зменшене поле — для алюмінію, міді й латуні.": "Models 6101–6103. High power factor, even phase loading and a reduced field — for aluminium, copper and brass.",
  "Порівняння моделей 6101–6103": "Comparison of models 6101–6103",
  "Макс. струм зварювання алюмінію, кА": "Max. aluminium welding current, kA",
  "Розмір столика, мм": "Table size, mm",
  "Макс. притиск при 6 бар, даН": "Max. squeeze at 6 bar, daN",
  "Макс. притиск з опцією 6135, даН": "Max. squeeze with option 6135, daN",
  "Алюміній і кольорові": "Aluminium and non-ferrous",
  "Чистий алюміній і зварювані сплави, мідь, латунь.": "Pure aluminium and weldable alloys, copper, brass.",
  "Три фази": "Three phases",
  "Рівномірне навантаження мережі й нижчі витрати на підключення.": "Even mains loading and lower connection costs.",
  "Менше поле": "Smaller field",
  "Зменшений вплив магнітного поля на магнітні матеріали.": "Reduced magnetic-field effect on magnetic materials.",
  "DC там, де AC уже не тягне матеріал": "DC where AC no longer handles the material",
  "Великий струм за довший час — масивні багатовиступні деталі й кільцеві герметичні виступи на кольорових металах.": "High current for longer — heavy multi-projection parts and annular sealing projections on non-ferrous metals.",
  "Коефіцієнт потужності вищий, ніж у порівнянної AC-машини": "Power factor higher than a comparable AC machine",
  "Зменшене навантаження мережі живлення": "Reduced load on the supply network",
  "Лінійний притиск по осі циліндра": "Linear squeeze on the cylinder axis",
  "Коли обирати DC 100 кВА": "When to choose DC 100 kVA",
  "Алюміній, мідь, латунь і масивні виступи, де потрібен великий струм за довший час при рівномірному навантаженні фаз.": "Aluminium, copper, brass and heavy projections where high current is needed for longer with even phase loading.",
  "Інвертор замість DC?": "Inverter instead of DC?",
  "6121–6129 — якщо потрібна мілісекундна точність на сталі й нержавіючій, а не великий струм на алюмінії.": "6121–6129 — if you need millisecond accuracy on steel and stainless, not high current on aluminium.",
  "Великі AC": "Large AC",
  "Для масивних сталевих виступів без переходу на постійний струм.": "For heavy steel projections without switching to DC.",
  "Технічні параметри 6101–6103": "Technical data 6101–6103",
  "Точково-рельєфні машини DC 100 кВА | SMOLTECH": "DC spot-projection machines 100 kVA | SMOLTECH",
  "Трифазні точково-рельєфні машини постійного струму 100 кВА. Моделі 6101–6103 — алюміній, мідь, латунь.": "Three-phase DC spot-projection machines 100 kVA. Models 6101–6103 — aluminium, copper, brass.",
  "Точково-рельєфні машини DC 100 кВА — SMOLTECH": "DC spot-projection machines 100 kVA — SMOLTECH",
  "Моделі 3660E-tech і 3670E-tech. Змінні кліщі, балансир і контролер TE760 — складальні лінії, сервіс і ремонт кузовів.": "Models 3660E-tech and 3670E-tech. Interchangeable guns, a balancer and the TE760 controller — assembly lines, service and body repair.",
  "Порівняння моделей 3660E і 3670E": "Comparison of models 3660E and 3670E",
  "Макс. потужність зварювання, кВА": "Max. welding power, kVA",
  "Макс. вторинний струм КЗ, кА": "Max. secondary short-circuit current, kA",
  "Час зварювання, с": "Weld time, s",
  "Кліщі «C»": "“C” gun",
  "У стандарті водяне охолодження, 450 даН при 8 бар, кабель 2400 мм.": "Water cooling as standard, 450 daN at 8 bar, 2400 mm cable.",
  "Балансир": "Balancer",
  "Плече й балансир для підвішування кліщів на посту.": "An arm and balancer for hanging the gun at the station.",
  "150 технологій, 15 змінних, вимір RMS у кА, Sepper, USB.": "150 weld schedules, 15 variables, RMS measurement in kA, Sepper, USB.",
  "Майстерня й промислова лінія": "Workshop and industrial line",
  "Девʼять кнопок і цифровий дисплей. Інвертор MF з IGBT, наростання й спад струму, пульсація, час з точністю 1 мс.": "Nine buttons and a digital display. MF inverter with IGBT, current upslope and downslope, pulsing, time accurate to 1 ms.",
  "Режими FIX і постійнострумовий IK, ліміти струму": "FIX and constant-current IK modes, current limits",
  "Одиничний і автоматичний цикл, WELD / NO WELD": "Single and automatic cycle, WELD / NO WELD",
  "Авторегулювання під 50/60 Гц, компенсація зносу електродів": "Auto-adjustment for 50/60 Hz, electrode-wear compensation",
  "Машина E-tech у роботі": "The E-tech machine at work",
  "Машина E-tech для зварювання кузова": "E-tech machine for body welding",
  "Коли обирати E-tech": "When to choose E-tech",
  "Кузов, просторові деталі, змінні кліщі. Для стаціонарного поста з фіксованими плечима — точкові 16–25 кВА.": "Bodywork, 3D parts, interchangeable guns. For a stationary station with fixed arms — spot welders 16–25 kVA.",
  "Фіксовані плечі й педальний або пневматичний притиск — моделі 6010–6013.": "Fixed arms and pedal or pneumatic squeeze — models 6010–6013.",
  "Дивитись стаціонарні 25 кВА": "See stationary 25 kVA",
  "Підвісні інверторні 56–90 кВА": "Inverter suspended guns 56–90 kVA",
  "Коли кліщі мають їхати до великого корпусу, а не корпус до машини.": "When the gun must go to a large housing, not the housing to the machine.",
  "Дивитись підвісні 56–90 кВА": "See suspended 56–90 kVA",
  "Технічні параметри E-tech": "E-tech technical data",
  "Інверторні машини E-tech зі зварювальними кліщами": "E-tech inverter machines with welding guns",
  "Інверторні машини E-tech для точкового зварювання листа та просторових деталей, зокрема кузова авто. Контролер TE760, памʼять на 150 технологій.": "E-tech inverter machines for spot welding sheet and 3D parts, including car bodies. TE760 controller, memory for 150 weld schedules.",
  };
  for (vk in extra) { if (Object.prototype.hasOwnProperty.call(extra, vk)) D[vk] = extra[vk]; }

  var P = {
    'Перейти до основного вмісту': 'Przejdź do treści',
    'Мова сайту': 'Język strony',
    'Українська': 'Ukraiński',
    'Mokronos Dolny, Польща': 'Mokronos Dolny, Polska',
    'Польща': 'Polska',
    'SMOLTECH на YouTube': 'SMOLTECH na YouTube',
    'SMOLTECH в Instagram': 'SMOLTECH na Instagramie',
    'SMOLTECH — на головну': 'SMOLTECH — strona główna',
    'Головне меню': 'Menu główne',
    'Головна': 'Strona główna',
    'Компанія': 'Firma',
    'Про компанію': 'O firmie',
    'Компетенції': 'Kompetencje',
    'Зварювальні машини': 'Zgrzewarki',
    'Машини для металу': 'Maszyny do metalu',
    'Машини точкового та рельєфного зварювання': 'Zgrzewarki punktowe i garbowe',
    'Машини зварювання з оснасткою': 'Zgrzewarki z oprzyrządowaniem',
    'Машини з оснасткою': 'Maszyny z oprzyrządowaniem',
    'Автоматизовані комплекси': 'Automaty i roboty',
    'Машини для зварювання сіток': 'Zgrzewarki do siatek',
    'Приварювання шпильок': 'Zgrzewanie trzpieni',
    'Відео': 'Wideo',
    'Відео — автоматизація': 'Wideo — automatyzacja',
    'Контакти': 'Kontakt',
    'Реалізації': 'Realizacje',
    'Відкрити меню': 'Otwórz menu',
    'Закрити меню': 'Zamknij menu',
    'Подзвонити': 'Zadzwoń',
    'Запит': 'Zapytanie',
    'Догори': 'Do góry',
    'Запит на пропозицію': 'Zapytanie ofertowe',
    'Імʼя та прізвище *': 'Imię i nazwisko *',
    'Компанія': 'Firma',
    'Телефон': 'Telefon',
    'Тема запиту': 'Temat zapytania',
    'Що потрібно зварити *': 'Co trzeba zgrzać *',
    'Надіслати запит': 'Wyślij zapytanie',
    '— оберіть або впишіть —': '— wybierz lub wpisz —',
    '* — обовʼязкові поля.': '* — pola obowiązkowe.',
    'Ваші персональні дані оброблятиме SMOLTECH Technika Zgrzewalnicza Sp. z o.o. з метою розгляду цього запиту. Докладніше — у нашій Політиці конфіденційності.': 'Twoje dane osobowe będą przetwarzane przez SMOLTECH Technika Zgrzewalnicza Sp. z o.o. w celu obsługi zapytania. Więcej informacji znajdziesz w Polityce prywatności.',
    'Політиці конфіденційності': 'Polityce prywatności',
    'Інформація про обробку персональних даних': 'Informacja o przetwarzaniu danych',
    'Закрити': 'Zamknij',
    'Не заповнюйте це поле': 'Nie wypełniaj tego pola',
    'Швидкий контакт': 'Szybki kontakt',
    'Запитати про цю конфігурацію': 'Zapytaj o tę konfigurację',
    'Політика конфіденційності': 'Polityka prywatności',
    'Підібрати машину під виріб': 'Dobierz maszynę do detalu',
    'Приклади реалізацій': 'Przykłady realizacji',
    'Проєктування, виробництво, автоматизація, роботизація': 'Projektowanie, produkcja, automatyzacja, robotyzacja',
    'Виробник машин контактного зварювання під Вроцлавом': 'Producent zgrzewarek oporowych pod Wrocławiem',
    'Машини контактного зварювання — виробник обладнання | SMOLTECH': 'Zgrzewarki oporowe — producent urządzeń | SMOLTECH',
    'Польський виробник машин контактного зварювання для підприємств України: точкові й рельєфні машини, автоматизовані комплекси, сітки та 3D панелі огорожі.': 'Polski producent zgrzewarek oporowych dla zakładów na Ukrainie: zgrzewarki punktowe i garbowe, automaty, siatki i panele 3D.',
    'Стаціонарні точкові машини для листа, прута і деталей | SMOLTECH': 'Zgrzewarki punktowe stacjonarne do blachy, pręta i detali | SMOLTECH',
    'Підвісна кліщова машина точкового зварювання SMOLTECH': 'Podwieszana zgrzewarka kleszczowa SMOLTECH',
    'Стаціонарна машина точкового зварювання SMOLTECH': 'Stacjonarna zgrzewarka punktowa SMOLTECH',
    'Точково-рельєфна машина з лінійним притиском SMOLTECH': 'Zgrzewarka punktowo-garbowa z dociskiem liniowym SMOLTECH',
    'Автоматизований комплекс контактного зварювання SMOLTECH': 'Zautomatyzowany kompleks zgrzewania oporowego SMOLTECH',
    'Багатоточкова машина для зварювання сіток SMOLTECH': 'Zgrzewarka wielopunktowa do siatek SMOLTECH',
    'Машина зварювання з оснасткою під деталь SMOLTECH': 'Zgrzewarka z oprzyrządowaniem pod detal SMOLTECH',
    'Комплекс ЧПК для приварювання шпильок SMOLTECH': 'Kompleks CNC do zgrzewania trzpieni SMOLTECH',
    'Комплекс ЧПК для автоматичного приварювання шпильок SMOLTECH': 'Kompleks CNC do automatycznego zgrzewania trzpieni SMOLTECH',
    'Інверторні пристрої DA для приварювання шпильок': 'Inwertorowe urządzenia DA do zgrzewania trzpieni',
    'Конденсаторні пристрої CDM для приварювання шпильок': 'Kondensatorowe urządzenia CDM do zgrzewania trzpieni',
    'Виробничий цех SMOLTECH у Мокроносі-Дольному під Вроцлавом': 'Hala produkcyjna SMOLTECH w Mokronosie Dolnym pod Wrocławiem',
    'Виробничий цех SMOLTECH — машини контактного зварювання': 'Hala produkcyjna SMOLTECH — zgrzewarki oporowe',
    'Відео реалізацій автоматизації зварювання SMOLTECH': 'Wideo realizacji automatyzacji zgrzewania SMOLTECH',
    'Інверторна багатофункціональна машина E-tech SMOLTECH': 'Wielofunkcyjna zgrzewarka inwertorowa E-tech SMOLTECH',
    'Політика конфіденційності — SMOLTECH': 'Polityka prywatności — SMOLTECH',
    'Про компанію — виробник машин контактного зварювання | SMOLTECH': 'O firmie — producent zgrzewarek oporowych | SMOLTECH',
    'Компетенції — переадресація | SMOLTECH': 'Kompetencje — przekierowanie | SMOLTECH',
    'Машини точкового та рельєфного зварювання | SMOLTECH': 'Zgrzewarki punktowe i garbowe | SMOLTECH',
    'Підвісні кліщові точкові машини 2,5–90 кВА | SMOLTECH': 'Zgrzewarki kleszczowe podwieszane 2,5–90 kVA | SMOLTECH',
    'Стаціонарні точкові машини 16–25 кВА | SMOLTECH': 'Zgrzewarki punktowe stacjonarne 16–25 kVA | SMOLTECH',
    'Точково-рельєфні машини 35–315 кВА | SMOLTECH': 'Zgrzewarki punktowo-garbowe 35–315 kVA | SMOLTECH',
    'Багатофункціональні інверторні машини E-tech | SMOLTECH': 'Wielofunkcyjne zgrzewarki inwertorowe E-tech | SMOLTECH',
    'Машини зварювання з оснасткою | SMOLTECH': 'Zgrzewarki z oprzyrządowaniem | SMOLTECH',
    'Автоматизовані та роботизовані зварювальні комплекси | SMOLTECH': 'Automaty i roboty spawalnicze | SMOLTECH',
    'Машини для зварювання сіток і панелей огорожі 2D/3D | SMOLTECH': 'Zgrzewarki do siatek i paneli ogrodzeniowych 2D/3D | SMOLTECH',
    'Приварювання шпильок — обладнання TAYLOR | SMOLTECH': 'Zgrzewanie trzpieni — urządzenia TAYLOR | SMOLTECH',
    'CDM — конденсаторне приварювання шпильок Ø2–Ø10 | SMOLTECH': 'CDM — kondensatorowe zgrzewanie trzpieni Ø2–Ø10 | SMOLTECH',
    'DA — інверторне приварювання шпильок Ø3–Ø16 | SMOLTECH': 'DA — inwertorowe zgrzewanie trzpieni Ø3–Ø16 | SMOLTECH',
    'Комплекси ЧПК для автоматичного приварювання шпильок | SMOLTECH': 'Kompleksy CNC do automatycznego zgrzewania trzpieni | SMOLTECH',
    'Відео — автоматизація зварювання | SMOLTECH': 'Wideo — automatyzacja zgrzewania | SMOLTECH',
    'Контакти — SMOLTECH Technika Zgrzewalnicza, Mokronos Dolny': 'Kontakt — SMOLTECH Technika Zgrzewalnicza, Mokronos Dolny',
    'Політика конфіденційності | SMOLTECH': 'Polityka prywatności | SMOLTECH',
    'Сторінку не знайдено (404) | SMOLTECH': 'Nie znaleziono strony (404) | SMOLTECH',
    'Точкове зварювання': 'Zgrzewanie punktowe',
    'Рельєфне зварювання': 'Zgrzewanie garbowe',
    'Шовне зварювання по колу': 'Zgrzewanie liniowe po obwodzie',
    'Багатоточкові машини та сітки': 'Zgrzewarki wielopunktowe i siatki',
    'Приварювання шпильок': 'Zgrzewanie trzpieni',
    'Точково-рельєфні машини': 'Zgrzewarki punktowo-garbowe',
    'Підвісні кліщові машини': 'Zgrzewarki kleszczowe podwieszane',
    'Стаціонарні точкові машини': 'Zgrzewarki punktowe stacjonarne',
    'Стаціонарні точкові машини 16–25 кВА': 'Zgrzewarki punktowe stacjonarne 16–25 kVA',
    '— Стаціонарні точкові машини 16–25 кВА': '— Zgrzewarki punktowe stacjonarne 16–25 kVA',
    'Комплекси ЧПК': 'Kompleksy CNC',
    'DA — інверторне приварювання': 'DA — zgrzewanie inwertorowe',
    'CDM — конденсаторне приварювання': 'CDM — zgrzewanie kondensatorowe',
    'Інверторні машини для зварювання кузовів': 'Zgrzewarki inwertorowe do karoserii',
    'Відео — автоматизація зварювання': 'Wideo — automatyzacja zgrzewania',
    'Інверторні 25 кВА': 'Inwertorowe 25 kVA',
    'AC 35–80 кВА': 'AC 35–80 kVA',
    'MFDC 56 кВА': 'MFDC 56 kVA',
    'MFDC 90–200 кВА': 'MFDC 90–200 kVA',
    'AC 63–163 кВА': 'AC 63–163 kVA',
    'AC 80–315 кВА': 'AC 80–315 kVA',
    'DC 100 кВА': 'DC 100 kVA',
    '16–38 кВА': '16–38 kVA',
    '56–90 кВА': '56–90 kVA',
    '16–25 кВА': '16–25 kVA',
    'кВА': 'kVA'
  };

  function normKey(s) {
    return String(s || '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\u00a0/g, ' ')
      .replace(/[\u2010-\u2015\u2212]/g, '-')
      .replace(/[\u2018\u2019\u02BC\u02B9\u201B]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cmsIndex() {
    var cms = window.ST_I18N_CMS;
    if (!cms || typeof cms !== 'object') return {};
    if (cmsIndex._src !== cms) {
      var idx = {};
      Object.keys(cms).forEach(function (k) {
        idx[k] = cms[k];
        var nk = normKey(k);
        if (nk && !idx[nk]) idx[nk] = cms[k];
      });
      cmsIndex._src = cms;
      cmsIndex._idx = idx;
    }
    return cmsIndex._idx || {};
  }

  function lookup(uk, lang) {
    lang = lang || 'en';
    if (!uk || lang === 'uk') return uk;
    var n = normKey(uk);
    var src = n || uk;
    var table = lang === 'pl' ? P : (lang === 'ru' ? (window.ST_RU || {}) : D);
    var hit = cmsIndex()[uk] || cmsIndex()[n];
    /* Custom phrases saved in the admin panel (flag a=1) beat the static dictionary. */
    if (hit && hit.a === '1' && hit[lang]) return hit[lang];
    if (table[uk]) return table[uk];
    if (n !== uk && table[n]) return table[n];
    if (hit && hit[lang]) return hit[lang];
    var i, pfx, raw, restRaw, restTr, restNorm, alt;
    raw = String(uk);
    for (i = 0; i < PREFIX.length; i++) {
      pfx = PREFIX[i][0];
      if (raw.indexOf(pfx) !== 0 && src.indexOf(pfx) !== 0) continue;
      restRaw = raw.indexOf(pfx) === 0 ? raw.slice(pfx.length) : src.slice(pfx.length);
      restTr = lookup(restRaw, lang);
      if (restTr === restRaw) {
        restNorm = normKey(restRaw);
        if (restNorm && restNorm !== restRaw) {
          alt = lookup(restNorm, lang);
          if (alt !== restNorm) restTr = alt;
        }
      }
      return (PREFIX[i][1][lang] || PREFIX[i][1].en) + restTr;
    }
    return uk;
  }

  window.ST = {
    lang: function () {
      var l = document.documentElement.getAttribute('data-lang');
      return l === 'en' || l === 'ru' ? l : 'uk';
    },
    lookup: lookup,
    t: function (uk, en) {
      var lang = ST.lang();
      if (lang === 'uk') return uk;
      if (lang === 'en' && en != null) return en;
      return lookup(uk, lang);
    }
  };

  function wanted() {
    var q = /(?:^|[?&])lang=(en|uk|ru)(?:&|$)/.exec(location.search);
    if (q) return q[1];
    try {
      var s = localStorage.getItem(STORE);
      if (s === 'en' || s === 'ru') return s;
    } catch (e) { /* ignore */ }
    return 'uk';
  }

  function storeAttr(el, attr) {
    var key = 'data-i18n-' + attr;
    if (!el.hasAttribute(key)) el.setAttribute(key, el.getAttribute(attr) || '');
    return el.getAttribute(key);
  }

  function applyAttrs(root, lang) {
    var els = root.querySelectorAll('[aria-label], [alt], [title], [placeholder], [data-title]');
    var i, el, a, orig, n;
    for (i = 0; i < els.length; i++) {
      el = els[i];
      if (el.closest && el.closest('.lang')) continue;
      for (n = 0; n < ATTRS.length; n++) {
        a = ATTRS[n];
        if (!el.hasAttribute(a) && a !== 'data-title') continue;
        if (a === 'data-title' && !el.hasAttribute('data-title')) continue;
        orig = storeAttr(el, a);
        if (!orig || !CYR.test(orig)) continue;
        el.setAttribute(a, lang === 'uk' ? orig : lookup(orig, lang));
      }
    }
  }

  function mixedPlain(el) {
    var n, t, out = '';
    for (n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) {
        out += n.nodeValue;
        continue;
      }
      if (n.nodeType === 1 && /^(STRONG|EM|B|I|U|S|A|BR|SPAN|SUB|SUP)$/.test(n.tagName)) {
        t = n.textContent || '';
        out += n.tagName === 'BR' ? ' ' : t;
        continue;
      }
      return null;
    }
    return out.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function piecesTranslate(el, lang) {
    var walker = document.createTreeWalker(el, 4, null);
    var n, trim;
    while ((n = walker.nextNode())) {
      trim = String(n.nodeValue || '').replace(/^\s+|\s+$/g, '');
      if (!trim || !CYR.test(trim)) continue;
      if (lookup(trim, lang) === trim) return false;
    }
    return true;
  }

  function placeMarked(root, en) {
    en = String(en || '');
    var nodes = [];
    var walker = document.createTreeWalker(root, 4, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)) return 2;
        return 1;
      }
    });
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    if (!nodes.length) return false;
    var runs = [];
    nodes.forEach(function (node) {
      var mark = node.parentElement && node.parentElement.closest('[data-st-en]');
      if (!mark || mark === root || !root.contains(mark)) mark = null;
      var prev = runs[runs.length - 1];
      if (prev && prev.mark === mark) prev.nodes.push(node);
      else runs.push({ mark: mark, nodes: [node], filled: false });
    });
    function fill(list, text) {
      if (!list.length) return;
      list[0].nodeValue = text;
      var i;
      for (i = 1; i < list.length; i++) list[i].nodeValue = '';
    }
    var cursor = 0;
    var i, run, phrase, at, idx, prev;
    for (i = 0; i < runs.length; i++) {
      run = runs[i];
      if (!run.mark) continue;
      phrase = run.mark.getAttribute('data-st-en') || '';
      if (!phrase) return false;
      at = run.mark.getAttribute('data-st-at');
      idx = -1;
      if (at != null && at !== '' && Number(at) >= cursor && en.slice(Number(at), Number(at) + phrase.length) === phrase) idx = Number(at);
      if (idx < 0) idx = en.indexOf(phrase, cursor);
      if (idx < 0) return false;
      prev = i > 0 ? runs[i - 1] : null;
      if (idx > cursor) {
        if (!prev || prev.mark) return false;
        fill(prev.nodes, en.slice(cursor, idx));
        prev.filled = true;
      }
      fill(run.nodes, phrase);
      run.filled = true;
      cursor = idx + phrase.length;
    }
    var last = runs[runs.length - 1];
    if (cursor < en.length) {
      if (!last || last.mark) return false;
      fill(last.nodes, en.slice(cursor));
      last.filled = true;
      cursor = en.length;
    }
    runs.forEach(function (item) {
      if (!item.mark && !item.filled) fill(item.nodes, '');
    });
    return cursor === en.length;
  }

  function spreadTextNodes(el, en) {
    en = String(en || '');
    var nodes = [];
    var walker = document.createTreeWalker(el, 4, null);
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    if (!nodes.length) { el.textContent = en; return; }
    if (nodes.length === 1) {
      var one = nodes[0].nodeValue || '';
      nodes[0].nodeValue = (one.match(/^\s*/) || [''])[0] + en + (one.match(/\s*$/) || [''])[0];
      return;
    }
    var raws = nodes.map(function (x) { return x.nodeValue || ''; });
    var dashAt = -1, k;
    for (k = 1; k < raws.length; k++) {
      if (/^\s*[\u2013\u2014]/.test(raws[k]) || /^\s-\s/.test(raws[k]) || /^ — /.test(raws[k])) { dashAt = k; break; }
    }
    if (dashAt > 0) {
      var dm = en.match(/\s[\u2013\u2014]\s/) || en.match(/\s-\s/);
      if (dm) {
        var dpos = en.indexOf(dm[0]);
        var before = en.slice(0, dpos);
        var after = en.slice(dpos);
        for (k = 0; k < dashAt; k++) {
          nodes[k].nodeValue = (k === dashAt - 1) ? before : '';
        }
        nodes[dashAt].nodeValue = after;
        for (k = dashAt + 1; k < nodes.length; k++) nodes[k].nodeValue = '';
        nodes[0].nodeValue = (raws[0].match(/^\s*/) || [''])[0] + (nodes[0].nodeValue || '');
        return;
      }
    }
    var E = raws.join('');
    var lead = (E.match(/^\s*/) || [''])[0].length;
    var trail = (E.match(/\s*$/) || [''])[0].length;
    var core = Math.max(1, E.length - lead - trail);
    var cuts = [0], pos = 0, i, j;
    for (i = 0; i < raws.length - 1; i++) {
      pos += raws[i].length;
      var frac = (pos - lead) / core;
      var prev = cuts[cuts.length - 1];
      var best;
      if (frac <= 0) best = 0;
      else if (frac >= 1) best = en.length;
      else {
        var want = frac * en.length, bestD = Infinity;
        best = -1;
        for (j = prev + 1; j < en.length; j++) {
          if (en.charAt(j) !== ' ') continue;
          var d = Math.abs(j - want);
          if (d < bestD) { bestD = d; best = j; }
        }
        if (best < 0) best = Math.min(en.length, Math.max(prev, Math.round(want)));
      }
      cuts.push(Math.max(prev, best));
    }
    cuts.push(en.length);
    nodes.forEach(function (x, k) {
      var seg = en.slice(cuts[k], cuts[k + 1]);
      if (k === 0) seg = (raws[k].match(/^\s*/) || [''])[0] + seg.replace(/^\s+/, '');
      if (k === nodes.length - 1) seg = seg.replace(/\s+$/, '') + (raws[k].match(/\s*$/) || [''])[0];
      x.nodeValue = seg;
    });
  }

  function onlyOwnInline(node) {
    var els = node.querySelectorAll('*');
    var i, el, tag;
    if (!els.length) return true;
    for (i = 0; i < els.length; i++) {
      el = els[i];
      tag = el.tagName;
      if (el.hasAttribute('data-st-en')) return false;
      if (tag === 'A') {
        if (!(el.classList && el.classList.contains('st-link')) && !el.hasAttribute('data-st-link')) return false;
        continue;
      }
      if (tag !== 'STRONG' && tag !== 'EM' && tag !== 'U' && tag !== 'B' && tag !== 'I') return false;
    }
    return true;
  }

  function dropBlankUnmarkedLinks(node) {
    var links = node.querySelectorAll('a[href]');
    var i, a;
    for (i = links.length - 1; i >= 0; i--) {
      a = links[i];
      if (a.querySelector('img, svg, video')) continue;
      if ((a.textContent || '').replace(/\s/g, '')) continue;
      if (a.parentNode) a.parentNode.removeChild(a);
    }
  }

  function dropEmptyStyledSpans(root) {
    if (!root || !root.querySelectorAll) return;
    var list = root.querySelectorAll('span');
    var i, sp;
    for (i = list.length - 1; i >= 0; i--) {
      sp = list[i];
      if ((sp.textContent || '').replace(/\s/g, '')) continue;
      if (sp.parentNode) sp.parentNode.removeChild(sp);
    }
  }

  function paintMarkStyle(el, item) {
    if (!el || !item) return;
    if (typeof item.c === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(item.c)) el.style.color = item.c;
    if (typeof item.z === 'string' && /^(?:[\d.]+(?:px|rem|em|%))$/.test(item.z)) el.style.fontSize = item.z;
  }

  function applyMarkList(el, items, onlyAttr) {
    var spans = [];
    var rest = [];
    items.forEach(function (item) {
      if (item && (item.tag || '') === 'span') spans.push(item);
      else rest.push(item);
    });
    spans.concat(rest).forEach(function (item) {
      if (!item || !item.t) return;
      var tag = item.tag || 'a';
      if (tag !== 'a' && tag !== 'strong' && tag !== 'em' && tag !== 'u' && tag !== 'span') return;
      if (tag === 'span' && !item.c && !item.z) return;
      if (tag === 'a' && !/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(item.h || '')) return;
      var made = wrapPlainPhrase(el, item.t, tag, item.at);
      if (!made) return;
      if (onlyAttr) made.setAttribute(onlyAttr, '');
      if (tag === 'span') { paintMarkStyle(made, item); return; }
      if (tag !== 'a') return;
      made.setAttribute('href', item.h);
      made.className = 'st-link';
      made.setAttribute('data-st-link', '');
      if (item.b) {
        made.setAttribute('target', '_blank');
        made.setAttribute('rel', 'noopener');
      }
    });
  }

  function applyEnMarks(el) {
    var raw = el.getAttribute('data-st-enmark');
    if (!raw) return;
    var items;
    try { items = JSON.parse(raw); } catch (e) { return; }
    if (!items || !items.length) return;
    applyMarkList(el, items, '');
  }

  function applyRuMarks(el) {
    var raw = el && el.getAttribute ? el.getAttribute('data-st-rumark') : '';
    if (!raw) return;
    var items;
    try { items = JSON.parse(raw); } catch (e) { return; }
    if (!items || !items.length) return;
    applyMarkList(el, items, 'data-st-ru-only');
  }

  function styleSpanRecords(node) {
    var list = node.querySelectorAll('span');
    var out = [];
    var i, sp, style;
    for (i = 0; i < list.length; i++) {
      sp = list[i];
      if (sp.hasAttribute('data-st-en-only') || sp.hasAttribute('data-st-ru-only')) continue;
      if (sp.querySelector('a, strong, em, u, span')) continue;
      style = sp.getAttribute('style') || '';
      if (!/(?:^|;)\s*(?:color|font-size)\s*:/i.test(style)) continue;
      if (!(sp.textContent || '')) continue;
      out.push({ text: sp.textContent, style: style });
    }
    return out;
  }

  function reapplyStyleSpans(node, paints) {
    var i, made, seen;
    for (i = 0; i < paints.length; i++) {
      if (!paints[i].text || (node.textContent || '').indexOf(paints[i].text) < 0) continue;
      seen = false;
      node.querySelectorAll('span').forEach(function (sp) {
        if (sp.textContent === paints[i].text && (sp.getAttribute('style') || '') === paints[i].style) seen = true;
      });
      if (seen) continue;
      made = wrapPlainPhrase(node, paints[i].text, 'span');
      if (made) made.setAttribute('style', paints[i].style);
    }
  }

  function syncLangStyle(el, lang) {
    if (!el) return;
    var hasEn = el.hasAttribute('data-st-enstyle');
    var hasRu = el.hasAttribute('data-st-rustyle');
    if (!hasEn && !hasRu) return;
    if (el.stLangBase == null) el.stLangBase = { color: el.style.color || '', fontSize: el.style.fontSize || '' };
    var spec = null;
    var raw = '';
    if (lang === 'en' && hasEn) raw = el.getAttribute('data-st-enstyle') || '';
    else if (lang === 'ru' && hasRu) raw = el.getAttribute('data-st-rustyle') || '';
    if (raw) {
      try { spec = JSON.parse(raw); } catch (e) { spec = null; }
    }
    var color = '';
    var fontSize = '';
    if (spec && typeof spec === 'object') {
      if (typeof spec.color === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(spec.color)) color = spec.color;
      if (typeof spec.fontSize === 'string' && /^(?:[\d.]+(?:px|rem|em|%))$/.test(spec.fontSize)) fontSize = spec.fontSize;
    }
    el.style.color = color || el.stLangBase.color || '';
    el.style.fontSize = fontSize || el.stLangBase.fontSize || '';
    if (!String(el.getAttribute('style') || '').trim()) el.removeAttribute('style');
  }

  function wrapPlainPhrase(el, phrase, tag, preferAt) {
    if (el.normalize) el.normalize();
    var nodes = [];
    var walker = document.createTreeWalker(el, 4, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)) return 2;
        if (p.closest('a[href], strong, em, u')) return 2;
        return 1;
      }
    });
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    var full = '';
    var spans = [];
    nodes.forEach(function (node) {
      spans.push({ n: node, a: full.length });
      full += node.nodeValue || '';
    });
    var hits = [];
    var from = 0;
    var found;
    while ((found = full.indexOf(phrase, from)) >= 0) {
      hits.push(found);
      from = found + Math.max(1, phrase.length);
    }
    if (!hits.length) return null;
    var at = hits[0];
    if (hits.length > 1 && preferAt != null && preferAt !== '' && !isNaN(Number(preferAt))) {
      var best = hits[0];
      var bestD = Infinity;
      hits.forEach(function (h) {
        var d = Math.abs(h - Number(preferAt));
        if (d < bestD) { bestD = d; best = h; }
      });
      at = best;
    }
    var end = at + phrase.length;
    var startNode = null;
    var startOff = 0;
    var endNode = null;
    var endOff = 0;
    spans.forEach(function (s) {
      var b = s.a + (s.n.nodeValue || '').length;
      if (!startNode && at >= s.a && at < b) { startNode = s.n; startOff = at - s.a; }
      if (end > s.a && end <= b) { endNode = s.n; endOff = end - s.a; }
    });
    if (!startNode || !endNode || (startNode === endNode && startOff === endOff)) return null;
    var range = document.createRange();
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    var made = document.createElement(tag);
    try { range.surroundContents(made); }
    catch (err) {
      try {
        var frag = range.extractContents();
        if (!frag || !String(frag.textContent || '').replace(/\s/g, '')) return null;
        made.appendChild(frag);
        range.insertNode(made);
        dropEmptyStyledSpans(el);
      } catch (err2) { return null; }
    }
    return made;
  }

  function walkText(node, lang) {
    if (node.nodeType === 1) {
      if (SKIP.test(node.tagName)) return;
      if (node.classList && node.classList.contains('lang')) return;
      if (node.hasAttribute('data-st-rustyle') || node.hasAttribute('data-st-enstyle')) syncLangStyle(node, lang);
      if (node.hasAttribute('data-st-enhtml') || node.hasAttribute('data-st-ruhtml')) {
        if (node.stLangHtml == null) node.stLangHtml = node.innerHTML;
        if (lang === 'uk') {
          if (node.innerHTML !== node.stLangHtml) node.innerHTML = node.stLangHtml;
        } else {
          var langHtml = node.getAttribute(lang === 'ru' ? 'data-st-ruhtml' : 'data-st-enhtml') || '';
          if (langHtml) {
            node.innerHTML = langHtml;
            return;
          }
        }
      }
      if (node.stOrigPlain == null && /^(P|LI|H1|H2|H3|H4|DD|DT|FIGCAPTION|SUMMARY)$/.test(node.tagName)) {
        var plain = mixedPlain(node);
        if (plain && CYR.test(plain)) {
          node.stOrigPlain = plain;
          node.stOrigHTML = node.innerHTML;
        }
      }
      /* Hero stat values with no Cyrillic (e.g. "TECNA+", "15"): still show colour marks from the editor. */
      if (node.stOrigPlain == null && node.classList && node.classList.contains('stats__n') && (node.hasAttribute('data-st-enmark') || node.hasAttribute('data-st-rumark'))) {
        if (node.stMarkHTML == null) node.stMarkHTML = node.innerHTML;
        if (node.innerHTML !== node.stMarkHTML) node.innerHTML = node.stMarkHTML;
        if (lang === 'ru' && node.hasAttribute('data-st-rumark')) applyRuMarks(node);
        else applyEnMarks(node);
        return;
      }
      if (node.stOrigPlain && node.stOrigHTML != null) {
        if (node.innerHTML !== node.stOrigHTML) node.innerHTML = node.stOrigHTML;
        if (lang === 'uk') return;
        if ((lang === 'en' && node.hasAttribute('data-st-enhtml')) || (lang === 'ru' && node.hasAttribute('data-st-ruhtml'))) {
          var storedHtml = node.getAttribute(lang === 'en' ? 'data-st-enhtml' : 'data-st-ruhtml') || '';
          if (storedHtml) {
            node.innerHTML = storedHtml;
            return;
          }
        }
        var whole = lookup(node.stOrigPlain, lang);
        var paints = styleSpanRecords(node);
        if (whole !== node.stOrigPlain && paints.length && !node.querySelector('[data-st-en], a.st-link, a[data-st-link]')) {
          node.textContent = whole;
          reapplyStyleSpans(node, paints);
          dropBlankUnmarkedLinks(node);
          if (lang === 'en') applyEnMarks(node);
          if (lang === 'ru') applyRuMarks(node);
          return;
        }
        if (whole !== node.stOrigPlain && lang !== 'en' && node.querySelector('[data-st-en], [data-st-enmark]')) {
          /* Keep the link markup and translate the Ukrainian pieces below. */
        } else if (whole !== node.stOrigPlain) {
          if (node.querySelector('[data-st-en]')) {
            if (!placeMarked(node, whole)) {
              node.innerHTML = node.stOrigHTML;
              if (!node.querySelector('*') || onlyOwnInline(node)) node.textContent = whole;
              else spreadTextNodes(node, whole);
            }
          } else if (node.firstElementChild && (!onlyOwnInline(node) || (lang !== 'en' && node.querySelector('a.st-link, a[data-st-link]')))) spreadTextNodes(node, whole);
          else node.textContent = whole;
          dropBlankUnmarkedLinks(node);
          if (lang === 'en') applyEnMarks(node);
          if (lang === 'ru') applyRuMarks(node);
          return;
        }
        if (lang === 'en' && node.hasAttribute('data-st-enmark')) applyEnMarks(node);
      }
      var ch = node.childNodes;
      var i;
      for (i = 0; i < ch.length; i++) walkText(ch[i], lang);
      if (lang === 'ru' && node.hasAttribute('data-st-rumark')) applyRuMarks(node);
      return;
    }
    if (node.nodeType !== 3) return;
    if (node.stOrig == null) node.stOrig = node.nodeValue;
    var orig = node.stOrig;
    if (lang === 'uk') {
      node.nodeValue = orig;
      return;
    }
    var trim = orig.replace(/^\s+|\s+$/g, '');
    if (!trim || !CYR.test(trim)) return;
    var tr = lookup(trim, lang);
    if (tr === trim) return;
    node.nodeValue = orig.replace(trim, tr);
  }

  function applyMeta(lang) {
    var html = document.documentElement;
    if (!html.getAttribute('data-i18n-title')) html.setAttribute('data-i18n-title', document.title);
    document.title = lang === 'uk' ? html.getAttribute('data-i18n-title') : lookup(html.getAttribute('data-i18n-title'), lang);

    var pairs = [
      ['meta[name="description"]', 'content'],
      ['meta[property="og:title"]', 'content'],
      ['meta[property="og:description"]', 'content'],
      ['meta[property="og:image:alt"]', 'content'],
      ['meta[property="og:site_name"]', 'content'],
      ['meta[name="twitter:title"]', 'content'],
      ['meta[name="twitter:description"]', 'content']
    ];
    var i, el, orig;
    for (i = 0; i < pairs.length; i++) {
      el = document.querySelector(pairs[i][0]);
      if (!el) continue;
      orig = storeAttr(el, pairs[i][1]);
      if (!orig) continue;
      el.setAttribute(pairs[i][1], lang === 'uk' ? orig : lookup(orig, lang));
    }
    el = document.querySelector('meta[property="og:locale"]');
    if (el) el.setAttribute('content', lang === 'en' ? 'en_GB' : (lang === 'ru' ? 'ru_RU' : 'uk_UA'));
  }

  function applyMaps(lang) {
    var hl = lang === 'en' ? 'en' : (lang === 'ru' ? 'ru' : 'uk');
    var frames = document.querySelectorAll('iframe[src*="maps"]');
    var i, src, next;
    for (i = 0; i < frames.length; i++) {
      src = frames[i].getAttribute('src') || '';
      next = src.replace(/([?&]hl=)[a-zA-Z_-]+/i, '$1' + hl);
      if (next !== src) frames[i].setAttribute('src', next);
    }
  }

  function syncButtons(lang) {
    var btns = document.querySelectorAll('.lang__btn[data-lang]');
    var i, on;
    for (i = 0; i < btns.length; i++) {
      on = btns[i].getAttribute('data-lang') === lang;
      btns[i].classList.toggle('is-active', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    var groups = document.querySelectorAll('.lang');
    for (i = 0; i < groups.length; i++) {
      groups[i].setAttribute('aria-label', lookup('Мова сайту', lang));
    }
  }

  var ruScript = null;
  function loadRu() {
    if (window.ST_RU) return Promise.resolve();
    if (ruScript) return ruScript;
    ruScript = new Promise(function (ok, bad) {
      var s = document.createElement('script');
      s.src = '/assets/js/ru-slovnyk.js?v=20261013a';
      s.onload = function () { ok(); };
      s.onerror = function () { ruScript = null; bad(); };
      document.head.appendChild(s);
    });
    return ruScript;
  }

  function apply(lang) {
    if (lang === 'ru' && !window.ST_RU) {
      loadRu().then(function () { apply('ru'); }, function () { apply('uk'); });
      return;
    }
    if (lang !== 'en' && lang !== 'ru') lang = 'uk';
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : (lang === 'ru' ? 'ru' : 'uk-UA'));
    syncButtons(lang);
    if (document.body) {
      walkText(document.body, lang);
      applyAttrs(document.body, lang);
      applyMaps(lang);
    }
    applyMeta(lang);
    try { localStorage.setItem(STORE, lang); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('st:lang', { detail: lang }));
  }

  function bind() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.lang__btn[data-lang]');
      if (!btn) return;
      e.preventDefault();
      var picked = btn.getAttribute('data-lang');
      apply(picked === 'en' || picked === 'ru' ? picked : 'uk');
    });
  }

  if (document.documentElement.getAttribute('data-st-i18n') !== 'off') {
    apply(wanted());
    bind();
  }
})();
