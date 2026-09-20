(function(root){
 const en={adRewards:'Ad rewards',inProgress:'In progress',adsWatched:'ads watched',nextBonus:'Next bonus',loadingAd:'Loading ad…',checking:'Checking…',tryAgain:'Try again',limitReached:'Limit reached',
  watchAd:({amount})=>`Watch ad · +${amount} CR`,adsLeft:({count})=>`${count} ${count===1?'ad':'ads'} left`,series:({number})=>`Series #${String(number).padStart(3,'0')}`,credited:({amount})=>`+${amount} CR credited`};
 root.BounteraI18n={t:(key,values={})=>typeof en[key]==='function'?en[key](values):en[key]||key};
})(typeof globalThis!=='undefined'?globalThis:window);
