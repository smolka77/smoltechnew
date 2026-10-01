# -*- coding: utf-8 -*-
import re
from pathlib import Path

page = Path('_build/pages/10-pro-kompaniyu.html')
sn = Path('_build/_client_wall_snippet.html').read_text(encoding='utf-8')
t = page.read_text(encoding='utf-8')
newt = re.sub(
    r'(<ul class="client-wall rv rv-d1">).*?(</ul>)',
    r'\1\n' + sn + r'\n    \2',
    t,
    count=1,
    flags=re.S,
)
# update lead
newt = newt.replace(
    'Логотипи замовників у Польщі та за кордоном — той самий список, що на smoltech.pl.',
    'Повна сітка логотипів замовників у Польщі та світі — той самий набір, що в розділі Odbiorcy на smoltech.pl.',
)
page.write_text(newt, encoding='utf-8')
print('client-full count', newt.count('client-full-'))
