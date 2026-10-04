from pathlib import Path
root = Path(__file__).resolve().parents[2]
p = root / 'assets/home-ui.js'
s = p.read_text(encoding='utf-8')
old = '<strong class="node-contract-value${complete?\' is-complete\':\'\'}">${label}</strong><span class="node-card-caption">${t(\'CONTRACT\',\'КОНТРАКТ\')}</span>'
new = '<span class="node-card-caption">${t(\'Contract\',\'Контракт\')}</span><strong class="node-contract-value${complete?\' is-complete\':\'\'}">${label}</strong>'
assert old in s
s = s.replace(old, new).replace("${t('TIER','ТИР')} ${x.node.tier}", "${t('Tier','Тир')} ${x.node.tier}")
start = s.index('<div class="session-mining-row">')
end = s.index('\n<div class="session-control-action">', start)
row = s[start:end]
progress_start = row.index('<div class="session-control-progress continuous-mining-progress"')
progress_end = row.index('</div>', progress_start) + len('</div>')
progress = row[progress_start:progress_end]
row = row[:progress_start] + row[progress_end:] + '\n' + progress
row = row.replace("${t('Until completion','До завершения')}", "${t('Time left','Осталось времени')}")
row = row.replace('alt="" width="18" height="18"', 'alt="" width="16" height="16"')
s = s[:start] + row + s[end:]
p.write_text(s, encoding='utf-8')

p = root / 'assets/app.css'
lines = p.read_text(encoding='utf-8').splitlines()
def last_rule(selector, body):
    matches = [i for i,line in enumerate(lines) if line.startswith(selector + '{')]
    assert matches, selector
    lines[matches[-1]] = selector + '{' + body + '}'
base = '.home-screen .reference-session-panel '
# Retain the original responsive panel height while fitting five physical rows
# (the metrics and their progress line form one semantic row) with 10px gaps.
last_rule('.home-screen .session-panel.session-control.reference-session-panel', 'display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:22px 38px 34px 3px auto;column-gap:0;row-gap:10px;height:calc(42.24cqw + 46px);margin:calc(6px + 5.7cqw) 3.49cqw 0;padding:max(6px,calc(15.21cqw - 46.5px)) 4.65cqw;border-radius:22px;border:1px solid #ffffff14;background:rgba(21,28,35,.97);box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;font-family:Arial,Helvetica,sans-serif')
last_rule(base + '.node-panel-heading', 'height:22px;display:flex;justify-content:space-between;margin:0;min-width:0')
last_rule(base + '.node-panel-heading h1', 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;font-size:18px;line-height:22px;font-weight:500;letter-spacing:0')
last_rule(base + '.session-reference-tier', 'font-size:11px;line-height:15px;font-weight:400;color:#a6b0bc;white-space:nowrap;background:#10171e;border:1px solid #ffffff0d;border-radius:5px;padding:2px 6px')
last_rule(base + '.node-panel-tiles', 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0;min-width:0')
last_rule(base + '.node-panel-tile', 'display:flex;align-items:center;justify-content:flex-start;gap:6px;height:38px;min-height:38px;min-width:0;padding:0 8px;border:0;border-radius:8px;background:#ffffff06;box-shadow:none;text-align:left;color:#e6edf0')
last_rule(base + '.node-card-icon', 'display:grid;place-items:center;position:relative;flex:none;width:18px;height:18px;border-radius:0;background:none')
last_rule(base + '.node-card-icon svg', 'width:18px;height:18px;fill:none;stroke:#a6b0bc;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round')
last_rule(base + '.node-card-icon .node-contract-icon', 'width:18px;height:18px;stroke-width:2.4')
last_rule(base + '.node-card-copy', 'display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:6px;min-width:0')
last_rule(base + '.node-card-copy strong', 'font-size:13px;line-height:18px;font-weight:400;white-space:nowrap;font-variant-numeric:tabular-nums')
last_rule(base + '.node-card-caption', 'font-size:13px;line-height:18px;font-weight:400;letter-spacing:0;color:#e6edf0;white-space:nowrap')
last_rule(base + '.node-bonus-control .node-card-copy strong', 'font-size:13px;line-height:18px;font-weight:400')
last_rule(base + '.session-mining-row', 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:12px;margin:0;min-height:0;height:34px')
last_rule(base + '.session-mining-row .session-control-metrics', 'display:block;margin:0;min-width:0')
last_rule(base + '.session-control-metrics dt', 'position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip:auto;clip-path:none;white-space:nowrap;font-size:10.5px;line-height:12px;color:#a6b0bc;font-weight:400')
last_rule(base + '.session-mining-row .session-control-metrics dd', 'font-size:18px;line-height:22px;font-weight:400;color:#f4f4f7;white-space:nowrap;font-variant-numeric:tabular-nums')
last_rule(base + '.session-mining-row .session-reward-coin', 'width:16px;height:16px;flex-shrink:0;object-fit:contain;filter:none;box-shadow:none')
last_rule(base + '.session-control-progress.continuous-mining-progress', 'height:3px;min-width:0;width:100%;margin:0;padding:0;border:0;border-radius:999px;background:#303a43;box-shadow:none;overflow:hidden')
last_rule(base + '.continuous-mining-progress>span', 'display:block;width:100%;height:100%;border-radius:inherit;transform-origin:left;background:#a9ccd8;box-shadow:none;transition:transform .2s linear')
last_rule(base + '.session-control-action', 'margin:0')
p.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('Home panel arranged into compact rows; original footprint and main button style retained.')
