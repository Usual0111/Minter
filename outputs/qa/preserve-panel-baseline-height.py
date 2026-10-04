from pathlib import Path
p = Path(__file__).resolve().parents[2] / 'assets/app.css'
s = p.read_text(encoding='utf-8')
s = s.replace('height:calc(42.24cqw + 46px);', 'height:calc(42.24cqw + 46px + var(--node-panel-height-adjustment,0px));')
s = s.replace('padding:max(6px,calc(15.21cqw - 46.5px)) 4.65cqw;', 'padding:max(6px,calc(15.21cqw - 46.5px + var(--node-panel-height-adjustment,0px)/2)) 4.65cqw;')
anchor = '.home-screen .reference-session-panel .node-panel-heading{height:22px;'
index = s.index(anchor)
s = s[:index] + '/* Preserve the previous title baseline height on wider phone screens. */\n@media(min-width:420px){.home-screen .reference-session-panel{--node-panel-height-adjustment:1px}}\n' + s[index:]
p.write_text(s, encoding='utf-8')
