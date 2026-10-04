from pathlib import Path
root = Path(__file__).resolve().parents[2]
p = root / 'tests/common-session-ui.test.cjs'
s = p.read_text(encoding='utf-8').replace("[{activeCount:1},'Add +0.35 CR · ▶︎ ad']", "[{activeCount:1},'Boost mining']")
p.write_text(s, encoding='utf-8')
p = root / 'tests/free-session.test.cjs'
s = p.read_text(encoding='utf-8').replace("assert.equal(ui.control(v.rewardMining).label,'Добавить +0,20 CR · ▶︎ реклама');", "assert.equal(ui.control(v.rewardMining).label,'Усилить добычу');assert.equal(ui.control(v.rewardMining).subtitle,'Смотреть рекламу · +0,20 CR');")
p.write_text(s, encoding='utf-8')
