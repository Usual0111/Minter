(function(root){
 'use strict';let adapter=null;
 root.BounteraAds={
  register(value){if(!value||typeof value.show!=='function')throw new Error('Ad adapter must implement show(session).');adapter=value;},
  get configured(){return !!adapter;},
  async show(session){if(!adapter)throw new Error('Advertising is not connected yet. Try again later.');await adapter.show(Object.freeze({...session}));}
 };
 // Register a real SDK adapter here. show() launches the ad only; returning from it
 // never confirms a reward. Only a verified server callback can credit CR.
})(typeof globalThis!=='undefined'?globalThis:window);
