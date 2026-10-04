from pathlib import Path
root = Path(__file__).resolve().parents[2]
p = root / 'assets/home-ui.js'
s = p.read_text(encoding='utf-8')
duplicate = '<span class="node-card-caption">${t(\'BONUSES\',\'БОНУСЫ\')}</span>'
assert s.count(duplicate) == 1
s = s.replace(duplicate, '')
s = s.replace('const segmentFill=(progress,i)=>Math.max(0,Math.min(1,progress*6-i));\n', '')
s = s.replace('session-control-progress segmented-mining-progress', 'session-control-progress continuous-mining-progress')
segments = '${Array.from({length:6},(_,i)=>`<i class="mining-progress-segment"><span style="transform:scaleX(${segmentFill(x.progress,i)})"></span></i>`).join(\'\')}'
assert segments in s
s = s.replace(segments, '<span style="transform:scaleX(${x.progress})"></span>')
tick = "e.querySelectorAll('.mining-progress-segment>span').forEach((segment,i)=>segment.style.transform='scaleX('+segmentFill(x.progress,i)+')');"
assert tick in s
s = s.replace(tick, "e.firstElementChild.style.transform='scaleX('+x.progress+')';")
p.write_text(s, encoding='utf-8')

p = root / 'assets/app.css'
lines = p.read_text(encoding='utf-8').splitlines()
def last_rule(selector, body):
    indices = [i for i, line in enumerate(lines) if line.startswith(selector + '{')]
    assert indices, selector
    lines[indices[-1]] = selector + '{' + body + '}'
base = '.home-screen .reference-session-panel '
last_rule('.home-screen .session-panel.session-control.reference-session-panel', 'margin:calc(6px + 5.7cqw) 3.49cqw 0;padding:4.07cqw 4.65cqw 4.46cqw;border-radius:22px;border:1px solid #ffffff14;background:rgba(21,28,35,.97);box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;font-family:Arial,Helvetica,sans-serif')
last_rule(base + '.node-panel-tile', 'display:flex;align-items:center;justify-content:flex-start;gap:8px;height:44px;min-height:44px;min-width:0;padding:0;border:0;border-radius:0;background:none;box-shadow:none;text-align:left;color:#e6edf0')
last_rule(base + '.node-card-icon', 'display:grid;place-items:center;position:relative;flex:none;width:32px;height:32px;border-radius:0;background:none')
last_rule(base + '.node-card-icon svg', 'width:25px;height:25px;fill:none;stroke:#a6b0bc;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round')
last_rule(base + '.node-card-icon .node-contract-icon', 'width:25px;height:25px;stroke-width:2.4')
last_rule(base + '.node-card-copy strong', 'font-size:18px;line-height:21px;font-weight:500;white-space:nowrap')
last_rule(base + '.node-card-caption', 'font-size:11px;line-height:14px;font-weight:400;color:#a6b0bc;white-space:nowrap')
last_rule(base + '.session-control-progress.segmented-mining-progress', 'height:4px;min-width:0;margin:0;padding:0;border:0;border-radius:999px;background:#2c3742;box-shadow:none;overflow:hidden')
lines = [line.replace('.session-control-progress.segmented-mining-progress{', '.session-control-progress.continuous-mining-progress{') for line in lines]
lines = [line for line in lines if not line.startswith(base + '.mining-progress-segment')]
progress_index = next(i for i,line in enumerate(lines) if line.startswith(base + '.session-control-progress.continuous-mining-progress{'))
lines.insert(progress_index + 1, base + '.continuous-mining-progress>span{display:block;width:100%;height:100%;border-radius:inherit;transform-origin:left;background:#d5e3e9;box-shadow:none;transition:transform .2s linear}')
last_rule(base + '.session-control-button', 'height:11.82cqw;min-height:11.82cqw;border:0;border-radius:2.71cqw;font-size:4.65cqw;line-height:5.81cqw;font-weight:400;letter-spacing:0;background:#e6edf0;color:#111820;box-shadow:none')
last_rule(base + '.session-control-button:before', 'content:none;box-shadow:none')
last_rule(base + '.session-control-button:disabled', 'background:#252e37;border:0;color:#a6b0bc;box-shadow:none;opacity:1')
tile_index = next(i for i,line in enumerate(lines) if line.startswith(base + '.node-card-caption{') and 'font-size:11px' in line)
lines.insert(tile_index + 1, base + '.node-bonus-control .node-card-copy strong{font-size:14px;line-height:18px;font-weight:500}')
p.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('Only Home session-panel presentation and continuous progress rendering updated.')
