// Authoritative settings. Restart the server after changing these defaults or environment variables.
// Existing sessions retain their original duration and reward.
const {validate}=require('../assets/farm-engine.js');
module.exports=validate({durationMs:Number(process.env.FARM_DURATION_MS||14400000),rewardCents:Number(process.env.FARM_REWARD_CENTS||20)});
