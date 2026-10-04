from pathlib import Path
import re
root = Path(__file__).resolve().parents[2]
p = root / 'assets/home-ui.js'
s = p.read_text(encoding='utf-8')
anchor = "const displayedTime=x=>x.activeCount?clock(x.remainingMs):x.readyCents?clock(0):clock(x.freeSession?.reason==='available'?x.freeSession.durationMs:x.offer.durationMs||x.sessionDurationMs);"
assert anchor in s
s = s.replace(anchor, anchor + "\nconst displayedReward=x=>x.status==='idle'&&!x.activeCount&&!x.readyCents&&x.freeSession?.reason==='available'?x.freeSession.rewardCents:x.sessionRewardCents;")
coin = '<img class="session-reward-coin" src="assets/session-coin.png" alt="" width="18" height="18">'
s, n = re.subn(r'<svg class="session-reward-coin".*?</svg>', coin, s)
assert n == 1
assert s.count('cr(x.sessionRewardCents)') == 2
s = s.replace('cr(x.sessionRewardCents)', 'cr(displayedReward(x))')
p.write_text(s, encoding='utf-8')
p = root / 'assets/app.css'
s = p.read_text(encoding='utf-8')
s = s.replace('.session-mining-row .session-reward-value{justify-content:flex-start;gap:1.55cqw}', '.session-mining-row .session-reward-value{justify-content:flex-start;gap:6px}')
s = s.replace('.session-mining-row .session-reward-coin{width:18px;height:18px;flex-shrink:0}', '.session-mining-row .session-reward-coin{width:18px;height:18px;flex-shrink:0;object-fit:contain;filter:none;box-shadow:none}')
p.write_text(s, encoding='utf-8')
print('Gold counter coin reused at 18px; idle free reward is a display-only preview, also on live ticks.')
