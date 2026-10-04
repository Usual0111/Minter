from pathlib import Path
root = Path(__file__).resolve().parents[2]
p = root / 'assets/app.css'
s = p.read_text(encoding='utf-8')
s = s.replace('display:grid;grid-template-rows:22px 38px 34px 3px auto;row-gap:10px;', 'display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:22px 38px 34px 3px auto;column-gap:0;row-gap:10px;')
anchor = '.home-screen .reference-session-panel .session-mining-row .session-time-metric{text-align:right}'
s = s.replace(anchor, anchor + '\n.home-screen .reference-session-panel .session-mining-row .session-reward-metric>div{text-align:left}')
p.write_text(s, encoding='utf-8')
p = root / 'tests/common-session-ui.test.cjs'
s = p.read_text(encoding='utf-8').replace("assert(card.includes('Until completion'))", "assert(card.includes('Time left'))")
p.write_text(s, encoding='utf-8')
