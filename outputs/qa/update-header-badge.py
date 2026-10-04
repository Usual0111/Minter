from pathlib import Path
p = Path(__file__).resolve().parents[2] / 'assets/app.js'
text = p.read_text(encoding='utf-8')
start = text.index('<svg class="home-balance-coin"')
coin = text[start:text.index('</svg>', start) + len('</svg>')]
old = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6.5" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2Z"/></svg>'
assert text.count(old) == 1
text = text.replace(old, coin.replace('home-balance-coin', 'nodes-balance-coin'))
p.write_text(text, encoding='utf-8')
