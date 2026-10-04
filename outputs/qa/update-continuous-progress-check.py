from pathlib import Path
p=Path(__file__).resolve().parents[2]/'tests/mining-contracts.test.cjs'
s=p.read_text(encoding='utf-8')
s=s.replace('assert.equal((html.match(/class="mining-progress-segment"/g)||[]).length,6);', 'assert(html.includes(\'continuous-mining-progress\'));assert.equal(Number(html.match(/continuous-mining-progress[\\s\\S]*?scaleX\\(([^)]+)\\)/)[1]),v.rewardMining.progress);')
s=s.replace("assert(html.includes('scaleX(0.21)'));", 'assert.equal(Number(html.match(/continuous-mining-progress[\\s\\S]*?scaleX\\(([^)]+)\\)/)[1]),v.rewardMining.progress);')
p.write_text(s,encoding='utf-8')
