(function (root) {
  'use strict';
  const config = {
    mode: 'demo', storageKey: 'bountera.demo.v2', currency: 'CR', asset: 'ASSET',
    transport: 'auto', // auto: server when available; explicit local demo on static hosts
    motion: { browserPrototype: 'full' }, // Explicit prototype setting; use 'system' to follow reduced motion.
    testing: { unlimitedDailyBoost: false },
    telegram: { botUsername: '', appShortName: '' },
    node: { baseMicroPerHour: 1500000, bufferHours: 4, demandBps: 11000, maxResourceLevel: 5, dailyAdLimit: 10, restoreCostCents: 1000 },
    dailyBoost: { rewardCents: 100, intervalHours: 24 },
    farm: { durationMs: 14400000, rewardCents: 20 }, // Display defaults; live settings come from server/farm-config.cjs.
    ads: { rewardCents: 10, providerDailyLimit: null, cooldownSeconds: 0, demoDurationSeconds: 3, confirmationSeconds: 120 },
    milestones: { seriesLength: 50, levels: [{id:'level-1',views:10,rewardCents:100},{id:'level-2',views:25,rewardCents:200},{id:'level-3',views:50,rewardCents:300}] },
    referrals: { percent: 10, eligibleSource: 'Confirmed ad rewards' },
    exchange: { assetMicrosPerCR: 10000, minCRCents: 1000, feeBps: 100, quoteSeconds: 60 },
    withdrawal: { minAssetMicros: 100000, feeAssetMicros: 10000, network: 'Demo network' },
    tasks: [
      {id:'community',title:'Join the Bountera community',category:'channels',description:'Subscribe to the official community channel and stay up to date with Bountera.',condition:'Join the channel and keep your subscription active.',reward:35,unit:'CR',icon:'channel',active:true,url:'',limit:1},
      {id:'news',title:'Follow Bountera News',category:'channels',description:'Get product news, campaign updates and community announcements.',condition:'Subscribe to the news channel.',reward:50,unit:'CR',icon:'news',active:true,url:'',limit:1},
      {id:'community-bot',title:'Meet the community bot',category:'bots',description:'Open the community bot and complete the welcome step.',condition:'Start the bot and finish its introduction.',reward:35,unit:'CR',icon:'bot',active:true,url:'',limit:1},
      {id:'partner-bot',title:'Explore a partner bot',category:'bots',description:'Discover the partner experience and complete the specified action.',condition:'Complete the welcome action inside the partner bot.',reward:50,unit:'CR',icon:'bot',active:true,url:'',limit:1},
      {id:'home-partner',title:'Partner task',category:'partners',description:'Complete a confirmed partner action to earn credits directly.',condition:'Complete the partner introduction. Opening a link alone does not earn a reward.',reward:35,unit:'CR',icon:'partners',active:true,url:'',limit:1},
      {id:'home-daily',title:'Daily task',category:'channels',description:'Take part in today’s community activity.',condition:'Complete the community check-in.',reward:15,unit:'CR',icon:'check',active:true,url:'',limit:1}
    ]
  };
  for(const task of config.tasks)task.rewardCents=task.reward*100;
  root.BounteraConfig = config;
  if (typeof module === 'object' && module.exports) module.exports = config;
})(typeof globalThis !== 'undefined' ? globalThis : window);
