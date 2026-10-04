from pathlib import Path
import re
root = Path(__file__).resolve().parents[2]
p = root / 'assets/home-ui.js'
s = p.read_text(encoding='utf-8')
header = (root / 'assets/app.js').read_text(encoding='utf-8')
coin = re.search(r'<svg class="home-balance-coin".*?</svg>', header).group(0).replace('home-balance-coin', 'session-reward-coin')
old = '<span aria-hidden="true">$</span><span data-session-live="ready">'
assert s.count(old) == 1
s = s.replace(old, coin + '<span data-session-live="ready">')
start = s.index('<div class="session-mining-row">')
end = s.index('\n<div class="session-control-action">', start)
row = s[start:end]
time_start = row.index('<dl class="session-control-metrics session-time-metric">')
time_end = row.index('</dl>', time_start) + len('</dl>')
time = row[time_start:time_end]
row = row[:time_start] + row[time_end:]
reward_start = row.index('<dl class="session-control-metrics session-reward-metric">')
reward_end = row.index('</dl>', reward_start) + len('</dl>')
reward = row[reward_start:reward_end]
row = row[:reward_start] + row[reward_end:]
prefix = '<div class="session-mining-row">'
assert row.endswith('</div>')
row = prefix + reward + row[len(prefix):-6] + time + '</div>'
s = s[:start] + row + s[end:]
p.write_text(s, encoding='utf-8')

p = root / 'assets/app.css'
s = p.read_text(encoding='utf-8')
old = '.home-screen .reference-session-panel .session-mining-row .session-reward-value{gap:1.55cqw}'
assert s.count(old) == 1
s = s.replace(old, '.home-screen .reference-session-panel .session-mining-row .session-reward-value{justify-content:flex-start;gap:1.55cqw}\n.home-screen .reference-session-panel .session-mining-row .session-reward-coin{width:18px;height:18px;flex-shrink:0}\n.home-screen .reference-session-panel .session-mining-row .session-time-metric{text-align:right}')
p.write_text(s, encoding='utf-8')
print('Home mining row: reward with existing balance coin on the left, timer on the right.')
