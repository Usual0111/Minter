from pathlib import Path
p=Path(__file__).resolve().parents[2]/'assets/motion.js'
s=p.read_text(encoding='utf-8')
s=s.replace("const header=document.querySelector('.depin-header');if(!header)return;", "const header=document.querySelector('.depin-header')||document.querySelector('.nodes-header')||document.querySelector('.header');if(!header)return;")
s=s.replace("const viewport=window.visualViewport,top=viewport?.offsetTop||0,height=viewport?.height||innerHeight;", "const viewport=window.visualViewport,tg=window.Telegram?.WebApp,top=viewport?.offsetTop||0,hostHeight=Number(tg?.viewportHeight)||innerHeight,height=Math.min(viewport?.height||innerHeight,hostHeight),bottom=Math.max(0,Number(tg?.safeAreaInset?.bottom)||0)+Math.max(0,Number(tg?.contentSafeAreaInset?.bottom)||0);")
s=s.replace("top+height-safe-16", "top+height-safe-bottom-16")
p.write_text(s,encoding='utf-8')
