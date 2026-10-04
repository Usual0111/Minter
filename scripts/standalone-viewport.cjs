'use strict';
// Applied only to an HTML opened from disk. Hosted/Telegram builds keep their layout.
const css=`
html.standalone-file,html.standalone-file body{width:100%;height:100%;min-width:0;overflow:hidden}
.standalone-file:not(.tma-viewport) #app{position:fixed;inset:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.standalone-file:not(.tma-viewport) #app::-webkit-scrollbar{display:none}
.standalone-file:not(.tma-viewport) #app>.app{width:100%;height:auto;min-height:100%}
.standalone-file:not(.tma-viewport) #app>.loading{min-height:100%}
`;
const script=`(function(){
 if(location.protocol!=='file:')return;
 document.documentElement.classList.add('standalone-file');
 window.addEventListener('hashchange',function(){document.getElementById('app')?.scrollTo({top:0,behavior:'instant'});});
})();`;
module.exports={css,script};
