from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'assets/app.js';s=p.read_text(encoding='utf-8');start=s.index('// Reserve room for the Telegram');end=s.index("let page='home'",start)
s=s[:start]+"// Share host geometry across all tabs; keep the authored scene internally aligned.\nconst telegramViewport=TelegramViewport.create({onChange:()=>{if(typeof MotionUI!=='undefined')MotionUI.dialogBounds();}});\n"+s[end:]
anchor='craft?.sync(s.rewardMining);\n'
assert anchor in s;s=s.replace(anchor,"telegramViewport.capture(app.querySelector('.app'));\n"+anchor,1)
s=s.replace("window.scrollTo({top:0,behavior:'instant'});", "app.scrollTo({top:0,behavior:'instant'});window.scrollTo({top:0,behavior:'instant'});")
p.write_text(s,encoding='utf-8')
p=root/'index.html';s=p.read_text(encoding='utf-8');s=s.replace('<script src="assets/app.js', '<script src="assets/telegram-viewport.js"></script><script src="assets/app.js');p.write_text(s,encoding='utf-8')
p=root/'scripts/package.cjs';s=p.read_text(encoding='utf-8').replace("'home-device-motion','app'", "'home-device-motion','telegram-viewport','app'");p.write_text(s,encoding='utf-8')
p=root/'scripts/standalone-viewport.cjs';s=p.read_text(encoding='utf-8').replace('.standalone-file #app', '.standalone-file:not(.tma-viewport) #app');p.write_text(s,encoding='utf-8')
