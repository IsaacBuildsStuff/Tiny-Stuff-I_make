// ================================================================
// MATH
// ================================================================
function getLineColFromPos(text, pos) {
  const lines = text.substring(0, pos).split('\n');
  return {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  };
}

function parseJsonError(err, text) {
  let line = 1, col = 1;
  let match = err.message.match(/line (\d+) column (\d+)/);
  if (match) {
    line = parseInt(match[1], 10);
    col = parseInt(match[2], 10);
  } else {
    match = err.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1], 10);
      const coords = getLineColFromPos(text, pos);
      line = coords.line;
      col = coords.col;
    }
  }
  return { message: err.message, line, col };
}

const PI2=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const ed=(ax,ay,bx,by)=>Math.hypot(bx-ax,by-ay);
const ea=(ax,ay,bx,by)=>Math.atan2(by-ay,bx-ax);
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const rnd=(lo,hi)=>lo+Math.random()*(hi-lo);
const rndA=()=>Math.random()*PI2;
const dc=o=>JSON.parse(JSON.stringify(o));
function dset(obj,path,val){const k=path.split('.');let o=obj;for(let i=0;i<k.length-1;i++){if(!o[k[i]])o[k[i]]={};o=o[k[i]];}o[k[k.length-1]]=val;}
function dget(obj,path){return path.split('.').reduce((o,k)=>o&&o[k]!==undefined?o[k]:undefined,obj);}
function deepMerge(t,s){if(!s)return t;for(const k in s){if(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])){if(!t[k]||typeof t[k]!=='object')t[k]={};deepMerge(t[k],s[k]);}else if(s[k]!==undefined)t[k]=s[k];}return t;}


// ================================================================
// MAGIC SCHOOLS
// ================================================================
const SCH={
  fire:{color:'#ff5522',glow:'#ff2200',trail:'#ff8844',name:'FIRE'},
  frost:{color:'#44ccff',glow:'#0088ff',trail:'#aaeeff',name:'FROST'},
  storm:{color:'#ffee33',glow:'#ffaa00',trail:'#ffff88',name:'STORM'},
  arcane:{color:'#cc44ff',glow:'#8800ff',trail:'#dd88ff',name:'ARCANE'},
  void:{color:'#9933cc',glow:'#550088',trail:'#bb66ee',name:'VOID'},
  nature:{color:'#44ff66',glow:'#008833',trail:'#88ffaa',name:'NATURE'},
  shadow:{color:'#aa44cc',glow:'#660077',trail:'#cc88dd',name:'SHADOW'},
  holy:{color:'#ffee88',glow:'#ffcc00',trail:'#ffffcc',name:'HOLY'},
  blood:{color:'#ff3355',glow:'#cc0033',trail:'#ff8899',name:'BLOOD'},
  time:{color:'#66ffcc',glow:'#00cc88',trail:'#aaffee',name:'TIME'},
  ice:{color:'#88ddff',glow:'#0055aa',trail:'#cceeff',name:'ICE'},
  rune:{color:'#8899ff',glow:'#4455cc',trail:'#bbccff',name:'RUNE'},
};
const SCHOOL_N=Object.keys(SCH);


// ================================================================
// STATUS EFFECTS
// ================================================================
const STATUS_DEFS={
  none:    {color:'#888',name:'NONE',desc:'No effect'},
  burn:    {color:'#ff4400',name:'BURN',desc:'Damage over time, fire damage'},
  freeze:  {color:'#44ccff',name:'FREEZE',desc:'Slows movement, amplifies damage taken'},
  shock:   {color:'#ffee00',name:'SHOCK',desc:'Amplifies next hit damage by 40%'},
  poison:  {color:'#44ff44',name:'POISON',desc:'Damage over time, nature damage'},
  weaken:  {color:'#cc88ff',name:'WEAKEN',desc:'Reduces damage dealt by target'},
  bleed:   {color:'#ff3355',name:'BLEED',desc:'Damage over time, physical damage'},
  slow:    {color:'#8888ff',name:'SLOW',desc:'Greatly reduces movement speed'},
  taunt:   {color:'#ffaa44',name:'TAUNT',desc:'Forces aggressive approach'},
  barrier: {color:'#88aaff',name:'BARRIER',desc:'Absorbs incoming damage'},
  regen:   {color:'#44ffaa',name:'REGEN',desc:'Regenerates HP over time'},
  rage:    {color:'#ff2244',name:'RAGE',desc:'Increases damage dealt, reduces HP regen'},
  glitch:  {color:'#44aaff',name:'GLITCH',desc:'Slows movement and deals damage over time'},
};
const STATUS_N=Object.keys(STATUS_DEFS);
const SFX_COL={burn:'#ff4400',freeze:'#44ccff',shock:'#ffee00',poison:'#44ff44',weaken:'#cc88ff',bleed:'#ff3355',slow:'#8888ff',taunt:'#ffaa44',barrier:'#88aaff',regen:'#44ffaa',rage:'#ff2244',glitch:'#44aaff'};


// ================================================================
// WEAPONS / AMMO
// ================================================================
const WEAPON_N=['sword','axe','hammer','dagger','spear','fist','claws','staff','whip','scythe'];
const AMMO_N=['bolt','arrow','explosive','seeking','pellet','needle','javelin','boomerang'];
const MOVE_N=['orbit','kite','charge','erratic','random','stationary','strafe','aggressive'];
const PAT_N=['single','spread','wave','spiral','pulse','fan','burst','ring','random'];
const SIG_N=['none','nova','beam','barrage','zone','summon','chain','meteor'];
const STANCE_N=['balanced','aggressive','defensive','sniper','berserk','cunning','duelist','coward','guardian','trickster'];


// ================================================================
// GLITCH ABILITY LIBRARY
// ================================================================
const GLITCH_DEFS={
  none:            {name:'NONE',           desc:'No glitch ability'},
  popup_block:     {name:'POPUP BLOCK',    desc:'Spawns popup terrain that blocks movement and deals DOT to nearby enemies'},
  static_field:    {name:'STATIC FIELD',   desc:'Creates a slowing field that deals chip damage over time'},
  buffer_overflow: {name:'BUFFER OVERFLOW',desc:'Applies escalating stacking damage-over-time to the enemy'},
  null_pointer:    {name:'NULL POINTER',    desc:'Armor-piercing instant damage spike on cooldown'},
  infinite_loop:   {name:'INFINITE LOOP',   desc:'Locks enemy movement and deals chip damage'},
};
const GLITCH_N=Object.keys(GLITCH_DEFS);


// ================================================================
// PASSIVE ABILITY LIBRARY
// ================================================================
const PASSIVES={
  none:       {name:'NONE',      desc:'No passive',                                   applyFn:null},
  thorns:     {name:'THORNS',    desc:'Returns 25% of melee damage received',         applyFn:'thorns'},
  vampiric:   {name:'VAMPIRIC',  desc:'Heal 15% of all damage dealt',                 applyFn:'vampiric'},
  berserker:  {name:'BERSERKER', desc:'Deal 10% more damage per 10% HP missing',      applyFn:'berserker'},
  fortress:   {name:'FORTRESS',  desc:'Take 20% less damage when above 50% HP',       applyFn:'fortress'},
  swift:      {name:'SWIFT',     desc:'Gain 20% speed when below 40% HP',             applyFn:'swift'},
  manaburn:   {name:'MANABURN',  desc:'Attacks drain 8 mana from target',             applyFn:'manaburn'},
  laststand:  {name:'LAST STAND',desc:'Double damage when below 20% HP',              applyFn:'laststand'},
  spellweave: {name:'SPELLWEAVE',desc:'Every 3rd spell fires an extra free bolt',     applyFn:'spellweave'},
  vengeance:  {name:'VENGEANCE', desc:'First hit after taking damage deals 50% more', applyFn:'vengeance'},
  momentum:   {name:'MOMENTUM',  desc:'Each melee combo adds 5% crit chance',         applyFn:'momentum'},
  blink:      {name:'BLINK',     desc:'Teleport when below 30% HP (12s cooldown)',    applyFn:'blink'},
};
const PASSIVE_N=Object.keys(PASSIVES);


// ================================================================
// DEFAULT SCHEMAS
// ================================================================
const D_VISUAL={
  bodyRadius:10,glowIntensity:1.0,trailLength:7,trailWidth:1.0,
  auraEnabled:false,auraRadius:25,auraPulse:true,
  runeEnabled:true,runeArms:4,runeSpeed:1.0,
  shockwaveOnHit:false,nameVisible:true,barsVisible:true,
};
const D_MAGIC={
  enabled:true,school:'arcane',
  mana:{max:100,regen:8,cost:18,burstEnabled:false,burstCost:45,burstMultiplier:2.2},
  spell:{type:'bolt',pattern:'single',dmg:20,cd:900,range:220,critChance:0.1,critMult:1.8},
  bolt:{speed:4.5,count:1,spread:0.15,size:4,lifetime:2000,trail:7,homing:0,pierce:false,inaccuracy:0.06,impactRadius:0,bounce:0,chainTargets:0},
  effect:{type:'none',power:5,duration:2000,stackable:false,maxStacks:3},
  sig:{type:'none',chargeRate:1.0,power:80,radius:130,beamLen:400,beamWidth:12,duration:750,burstCount:8,speed:7,autoThreshold:0.85,manualTrigger:false},
};
const D_MELEE={
  enabled:false,weapon:'sword',
  dmg:30,range:50,cd:900,lunge:1.2,knockback:2,cleave:0.3,arcWidth:70,
  critChance:0.12,critMult:2.0,
  combo:{enabled:false,steps:3,dmgBonus:0.3,window:850,resetOnMiss:true},
  parry:{enabled:false,chance:0.2,window:200,counterDmg:1.5},
  charge:{enabled:false,minDist:120,dashSpd:7,cooldown:3000},
  effect:{type:'none',power:5,duration:1500,stackable:false},
};
const D_RANGED={
  enabled:false,ammo:'bolt',
  dmg:18,cd:1100,range:280,critChance:0.1,critMult:1.8,
  bolt:{speed:5.5,count:1,spread:0.08,size:3.5,lifetime:2800,trail:6,homing:0,pierce:false,inaccuracy:0.04,impactRadius:0,bounce:0,chainTargets:0},
  volley:{enabled:false,count:3,delay:120,spread:0.25},
  effect:{type:'none',power:4,duration:1800,stackable:false},
};
const D_AI={
  stance:'balanced',
  priority:{magic:0.5,melee:0.25,ranged:0.25},
  aggression:0.5,spacing:0.5,strafe:0.5,randomness:0.2,
  keepDistance:0.5,retreatThreshold:0.2,advanceThreshold:0.75,
  aim:0.8,prediction:0.5,leadFactor:0.5,
  dodge:0.4,dodgeTiming:0.5,parryTendency:0.3,
  counterPlay:0.4,baiting:0.2,
  comboBias:0.5,burstWindow:0.5,targetCommit:0.7,
  specialBias:0.6,manaConserve:0.3,retreatToHeal:0.3,
  adaptRate:0.3,pressureResponse:0.5,flankTendency:0.2,
  attackDelay:0.1,cancelThreshold:0.5,
  notes:'',
};
const D_GLITCH={
  enabled:false,ability:'none',
  cd:3500,power:14,duration:3000,radius:55,range:210,
};
const STANCES={
  balanced:  {aggression:.5,spacing:.5,strafe:.5,dodge:.4,retreatThreshold:.2,aim:.8,prediction:.5,comboBias:.5,keepDistance:.5},
  aggressive:{aggression:.82,spacing:.2,strafe:.35,dodge:.2,retreatThreshold:.08,comboBias:.72,targetCommit:.85,keepDistance:.15,burstWindow:.7},
  defensive: {aggression:.25,spacing:.72,strafe:.65,dodge:.72,retreatThreshold:.38,specialBias:.4,keepDistance:.72,manaConserve:.5,baiting:.4},
  sniper:    {aggression:.18,spacing:.88,strafe:.72,dodge:.55,keepDistance:.9,retreatThreshold:.3,aim:.95,prediction:.82,leadFactor:.75},
  berserk:   {aggression:.97,spacing:.05,strafe:.18,comboBias:.9,targetCommit:.95,retreatThreshold:.04,keepDistance:.05,dodge:.1,burstWindow:.9},
  cunning:   {aggression:.55,randomness:.5,dodge:.65,prediction:.7,baiting:.6,counterPlay:.72,comboBias:.65,flankTendency:.55},
  duelist:   {aggression:.65,spacing:.55,strafe:.72,dodge:.6,counterPlay:.75,parryTendency:.6,comboBias:.68,dodgeTiming:.7},
  coward:    {aggression:.12,spacing:.9,strafe:.8,dodge:.85,keepDistance:.95,retreatThreshold:.45,baiting:.55,manaConserve:.6},
  guardian:  {aggression:.4,spacing:.6,strafe:.55,dodge:.5,retreatThreshold:.15,specialBias:.3,comboBias:.4,keepDistance:.55,adaptRate:.6},
  trickster: {aggression:.6,randomness:.65,baiting:.7,dodge:.7,prediction:.6,flankTendency:.65,comboBias:.55,cancelThreshold:.6},
};


// ================================================================
// UNIT FACTORY
// ================================================================
function mkDef(o){
  const d=dc({id:o.id||'u_'+Date.now(),name:o.name||'UNIT',school:o.school||'arcane',
    desc:o.desc||'',hp:o.hp||250,armor:o.armor||0,spd:o.spd||2.0,
    resistances:{fire:0,frost:0,storm:0,physical:0,magic:0},
    passive:{id:'none',power:1.0},
    passive2:{id:'none',power:1.0},
    visual:dc(D_VISUAL),
    magic:dc(D_MAGIC),melee:dc(D_MELEE),ranged:dc(D_RANGED),glitch:dc(D_GLITCH),ai:dc(D_AI)});
  deepMerge(d,{visual:o.visual||{},magic:o.magic||{enabled:D_MAGIC.enabled},melee:o.melee||{},ranged:o.ranged||{},glitch:o.glitch||{},ai:o.ai||{}});
  if(o.resistances)Object.assign(d.resistances,o.resistances);
  if(o.passive)d.passive=o.passive;
  if(o.passive2)d.passive2=o.passive2;
  const sc=SCH[d.school]||SCH.arcane;
  d.color=d.magic.enabled?sc.color:(o.color||'#ffaa44');
  d.glowColor=sc.glow;d.trailColor=sc.trail;
  return d;
}


// ================================================================
// BASE ROSTER
// ================================================================
const BASE_UNITS=[
  mkDef({id:'pyros',name:'PYROS',school:'fire',desc:'Pyromancer. Scorched-earth spread fire. Nova ultimate. Berserker passive.',
    hp:310,armor:0,spd:2.0,passive:{id:'berserker',power:1.0},
    magic:{school:'fire',mana:{max:100,regen:9,cost:14},spell:{type:'bolt',pattern:'spread',dmg:15,cd:800,range:200,critChance:.12,critMult:2.0},bolt:{speed:3.8,count:4,spread:.38,size:5,trail:8,impactRadius:22},effect:{type:'burn',power:7,duration:2500},sig:{type:'nova',power:72,radius:155,chargeRate:1.2,autoThreshold:.85}},
    visual:{auraEnabled:true,auraRadius:22,runeArms:6},
    ai:{stance:'aggressive',priority:{magic:1,melee:0,ranged:0},aggression:.75,spacing:.38,burstWindow:.7,comboBias:.65}}),
  mkDef({id:'glacius',name:'GLACIUS',school:'frost',desc:'Frost sniper. Homing ice lances freeze on hit. Beam signature. Fortress passive.',
    hp:220,armor:0,spd:2.1,passive:{id:'fortress',power:1.0},
    magic:{school:'frost',mana:{max:88,regen:7,cost:22},spell:{type:'bolt',pattern:'single',dmg:28,cd:1150,range:285,critChance:.14,critMult:2.2},bolt:{speed:8,size:5,homing:.22,trail:10,inaccuracy:.02},effect:{type:'freeze',power:.45,duration:1600},sig:{type:'beam',power:98,beamLen:430,beamWidth:13,duration:720,chargeRate:1.1,autoThreshold:.85}},
    visual:{bodyRadius:9},
    ai:{stance:'sniper',priority:{magic:1,melee:0,ranged:0},aggression:.22,spacing:.88,aim:.95,prediction:.82,leadFactor:.78,keepDistance:.9}}),
  mkDef({id:'ironclad',name:'IRON',school:'rune',desc:'Heavy bruiser. Hammer combos with weaken. Last Stand passive. High armor.',
    hp:390,armor:18,spd:1.65,color:'#ffaa44',passive:{id:'laststand',power:1.0},passive2:{id:'thorns',power:.8},
    magic:{enabled:false},
    melee:{enabled:true,weapon:'hammer',dmg:50,range:58,cd:1500,lunge:3.2,knockback:4.5,cleave:.55,arcWidth:92,critChance:.1,critMult:2.2,combo:{enabled:true,steps:3,dmgBonus:.38,window:1100,resetOnMiss:false},charge:{enabled:true,minDist:130,dashSpd:6,cooldown:3500},effect:{type:'weaken',power:.28,duration:2000}},
    ai:{stance:'berserk',priority:{magic:0,melee:1,ranged:0},aggression:.9,spacing:.1,targetCommit:.92,burstWindow:.8}}),
  mkDef({id:'shade',name:'SHADE',school:'shadow',desc:'Shadow assassin. Dagger bleeds. Barrage sig. Vengeance+Vampiric passives.',
    hp:258,armor:4,spd:2.95,passive:{id:'vengeance',power:1.0},passive2:{id:'vampiric',power:.7},
    magic:{school:'shadow',mana:{max:72,regen:8,cost:12},spell:{type:'bolt',pattern:'burst',dmg:12,cd:1000,range:180},bolt:{speed:4.5,count:3,spread:.4,trail:6},effect:{type:'bleed',power:6,duration:3500},sig:{type:'barrage',power:20,burstCount:10,speed:8.5,chargeRate:1.15,autoThreshold:.85}},
    melee:{enabled:true,weapon:'dagger',dmg:26,range:46,cd:640,lunge:2.5,knockback:1.2,critChance:.18,critMult:2.5,combo:{enabled:true,steps:4,dmgBonus:.5,window:680,resetOnMiss:true},effect:{type:'poison',power:4,duration:3500}},
    ai:{stance:'cunning',priority:{magic:.35,melee:.65,ranged:0},aggression:.7,randomness:.55,dodge:.78,comboBias:.85,baiting:.55,counterPlay:.65}}),
  mkDef({id:'rifter',name:'RIFTER',school:'frost',desc:'Ranged specialist. Freeze arrows. Volley mode. Swift passive for escapes.',
    hp:240,armor:2,spd:2.3,color:'#44ccff',passive:{id:'swift',power:1.0},
    magic:{enabled:false},
    ranged:{enabled:true,ammo:'arrow',dmg:27,cd:1000,range:325,critChance:.14,critMult:2.0,bolt:{speed:8.5,count:1,size:4,trail:9,homing:.14,inaccuracy:.02},volley:{enabled:true,count:3,delay:130,spread:.22},effect:{type:'freeze',power:.4,duration:1500}},
    ai:{stance:'sniper',priority:{magic:0,melee:0,ranged:1},aggression:.22,spacing:.88,aim:.95,prediction:.82,keepDistance:.9,dodge:.6}}),
  mkDef({id:'templar',name:'TEMPLAR',school:'holy',desc:'Holy warrior. Radiant pulses plus hammer combo. Barrier passive. Guardian stance.',
    hp:318,armor:11,spd:1.9,passive:{id:'fortress',power:1.0},
    magic:{school:'holy',mana:{max:100,regen:9,cost:10},spell:{type:'aoe',pattern:'pulse',dmg:9,cd:410,range:168},effect:{type:'none',power:0,duration:0},sig:{type:'nova',power:68,radius:148,chargeRate:1.0,autoThreshold:.85}},
    melee:{enabled:true,weapon:'hammer',dmg:37,range:55,cd:1100,lunge:1.8,knockback:3,cleave:.38,arcWidth:82,critChance:.1,critMult:1.9,combo:{enabled:true,steps:2,dmgBonus:.25,window:1000},effect:{type:'weaken',power:.2,duration:1600}},
    ai:{stance:'guardian',priority:{magic:.45,melee:.55,ranged:0},aggression:.55,spacing:.5,comboBias:.6}}),
  mkDef({id:'voidmage',name:'VOID',school:'void',desc:'Life drain mage. Void beam sig. Vampiric+Spellweave passives.',
    hp:345,armor:0,spd:1.9,passive:{id:'vampiric',power:1.0},passive2:{id:'spellweave',power:1.0},
    magic:{school:'void',mana:{max:90,regen:7,cost:10},spell:{type:'drain',pattern:'single',dmg:9,cd:550,range:175},bolt:{speed:4.5,trail:9,homing:.08},effect:{type:'weaken',power:.2,duration:1800},sig:{type:'beam',power:90,beamLen:385,beamWidth:12,duration:680,chargeRate:.9,autoThreshold:.85}},
    visual:{auraEnabled:true,auraRadius:28,auraPulse:true},
    ai:{stance:'balanced',priority:{magic:1,melee:0,ranged:0},aggression:.6,spacing:.42,retreatThreshold:.12,manaConserve:.2}}),
  mkDef({id:'stormcaller',name:'STORM',school:'storm',desc:'Storm mage. Spiral chain lightning. Barrage sig. Momentum passive.',
    hp:252,armor:0,spd:2.55,passive:{id:'momentum',power:1.0},
    magic:{school:'storm',mana:{max:90,regen:11,cost:13},spell:{type:'bolt',pattern:'spiral',dmg:17,cd:850,range:215,critChance:.12,critMult:1.9},bolt:{speed:5.5,count:5,spread:.28,size:3.8,trail:6,chainTargets:1},effect:{type:'shock',power:9,duration:1200},sig:{type:'barrage',power:23,burstCount:12,speed:9,chargeRate:1.3,autoThreshold:.85}},
    ai:{stance:'cunning',priority:{magic:1,melee:0,ranged:0},aggression:.65,randomness:.55,dodge:.68,burstWindow:.72}}),
  mkDef({id:'warden',name:'WARDEN',school:'nature',desc:'Nature guardian. Spear plus poison zone. Regen passive. Defensive stance.',
    hp:290,armor:5,spd:1.9,passive:{id:'fortress',power:.8},passive2:{id:'vampiric',power:.5},
    magic:{school:'nature',mana:{max:110,regen:13,cost:9},spell:{type:'aoe',pattern:'pulse',dmg:8,cd:410,range:170},effect:{type:'poison',power:3,duration:4000},sig:{type:'zone',power:11,radius:125,duration:4300,chargeRate:.85,autoThreshold:.85}},
    melee:{enabled:true,weapon:'spear',dmg:28,range:72,cd:1200,lunge:2.2,knockback:1.8,cleave:.18,arcWidth:42,effect:{type:'poison',power:4,duration:2500}},
    ai:{stance:'defensive',priority:{magic:.5,melee:.5,ranged:0},aggression:.42,spacing:.6,dodge:.58,retreatThreshold:.28,retreatToHeal:.5}}),
  mkDef({id:'hexblade',name:'HEX',school:'void',desc:'Battlemage. Void bolts plus sword. Duelist stance. Thorns passive.',
    hp:282,armor:6,spd:2.2,passive:{id:'thorns',power:.9},passive2:{id:'vengeance',power:.8},
    magic:{school:'void',mana:{max:80,regen:7,cost:20},spell:{type:'bolt',pattern:'single',dmg:25,cd:1200,range:205,critChance:.12,critMult:2.0},bolt:{speed:6,size:5,homing:.15,trail:9},sig:{type:'beam',power:88,beamLen:360,beamWidth:12,duration:700,chargeRate:1.2,autoThreshold:.85}},
    melee:{enabled:true,weapon:'sword',dmg:32,range:56,cd:950,lunge:3,knockback:2.2,arcWidth:72,critChance:.14,critMult:2.2,combo:{enabled:true,steps:2,dmgBonus:.28,window:900},parry:{enabled:true,chance:.22,window:200,counterDmg:1.5}},
    ai:{stance:'duelist',priority:{magic:.5,melee:.5,ranged:0},aggression:.78,spacing:.32,counterPlay:.7,targetCommit:.85,parryTendency:.55}}),
  mkDef({id:'gunner',name:'GUNNER',school:'fire',desc:'Explosive pellet spread. Volley burst mode. Berserker passive. Pure ranged chaos.',
    hp:262,armor:2,spd:2.35,color:'#ff8844',passive:{id:'berserker',power:.9},
    magic:{enabled:false},
    ranged:{enabled:true,ammo:'explosive',dmg:20,cd:720,range:230,critChance:.1,critMult:1.8,bolt:{speed:5,count:4,spread:.48,size:4.5,trail:5,impactRadius:32},volley:{enabled:true,count:4,delay:90,spread:.3},effect:{type:'burn',power:5,duration:1800}},
    ai:{stance:'aggressive',priority:{magic:0,melee:0,ranged:1},aggression:.72,spacing:.4,strafe:.78,burstWindow:.75}}),
  mkDef({id:'berserker',name:'FURY',school:'blood',desc:'Pure melee rage. Claw combo bleeds. Last Stand+Berserker. Never stops.',
    hp:345,armor:7,spd:2.85,color:'#ff3355',passive:{id:'laststand',power:1.0},passive2:{id:'berserker',power:1.0},
    magic:{enabled:false},
    melee:{enabled:true,weapon:'claws',dmg:33,range:50,cd:600,lunge:3.8,knockback:1.2,cleave:.48,arcWidth:65,critChance:.16,critMult:2.2,combo:{enabled:true,steps:5,dmgBonus:.52,window:720,resetOnMiss:true},charge:{enabled:true,minDist:140,dashSpd:7.5,cooldown:3000},effect:{type:'bleed',power:7,duration:4000}},
    ai:{stance:'berserk',priority:{magic:0,melee:1,ranged:0},aggression:.97,spacing:.05,comboBias:.92,targetCommit:.95,burstWindow:.9}}),
  mkDef({id:'tempus',name:'TEMPUS',school:'time',desc:'Chronomancer. Homing time bolts. Beam sig. Perfect prediction. Spellweave passive.',
    hp:245,armor:0,spd:2.1,passive:{id:'spellweave',power:1.0},
    magic:{school:'time',mana:{max:82,regen:7,cost:24},spell:{type:'bolt',pattern:'single',dmg:26,cd:1300,range:355,critChance:.15,critMult:2.2},bolt:{speed:5.5,size:5,homing:.28,trail:10,inaccuracy:.01},sig:{type:'beam',power:92,beamLen:420,beamWidth:10,duration:700,chargeRate:.95,autoThreshold:.85}},
    visual:{bodyRadius:9,runeArms:3,runeSpeed:0.6},
    ai:{stance:'sniper',priority:{magic:1,melee:0,ranged:0},aggression:.2,spacing:.85,aim:.97,prediction:.9,leadFactor:.85,keepDistance:.88}}),
  mkDef({id:'oortho',name:'OORTHO',school:'arcane',desc:'The Arcane Sentinel. Powerful void mage with devastating chain bolts and reality-warping beam. Uses Glitch abilities to spawn popup terrain. Dangerous battlefield control and adaptive AI. Tutorial antagonist.',
    hp:420,armor:12,spd:2.0,passive:{id:'fortress',power:1.2},passive2:{id:'spellweave',power:1.0},
    glitch:{enabled:true,ability:'popup_block',cd:5000,power:8,duration:4000,radius:50,range:220},
    magic:{school:'arcane',mana:{max:140,regen:12,cost:16},spell:{type:'bolt',pattern:'spiral',dmg:22,cd:950,range:240,critChance:.16,critMult:2.3},bolt:{speed:5.2,count:6,spread:.32,size:5.5,trail:9,homing:.18,chainTargets:2,impactRadius:18},effect:{type:'weaken',power:.35,duration:2200},sig:{type:'beam',power:120,beamLen:450,beamWidth:16,duration:850,chargeRate:1.15,autoThreshold:.8,manualTrigger:false}},
    visual:{auraEnabled:true,auraRadius:28,auraPulse:true,runeEnabled:true,runeArms:8,runeSpeed:1.2,shockwaveOnHit:true},
    resistances:{fire:.15,frost:.15,storm:.1,physical:.2,magic:.1},
    ai:{stance:'aggressive',priority:{magic:1,melee:0,ranged:0},aggression:.8,spacing:.3,aim:.92,prediction:.75,dodgeTiming:.65,burstWindow:.85,targetCommit:.9,keepDistance:.25}}),
  mkDef({id:'glitch1',name:'GLITCH',school:'arcane',desc:'Rogue process. Static fields slow enemies while buffer overflow stacks escalating damage. Master-rank glitch unit.',
    hp:280,armor:4,spd:2.3,color:'#44aaff',passive:{id:'spellweave',power:1.0},passive2:{id:'swift',power:.8},
    magic:{school:'arcane',mana:{max:90,regen:10,cost:14},spell:{type:'bolt',pattern:'spread',dmg:14,cd:850,range:210,critChance:.12,critMult:2.0},bolt:{speed:5,count:3,spread:.3,size:4,trail:7,impactRadius:14},effect:{type:'glitch',power:6,duration:2500},sig:{type:'nova',power:65,radius:140,chargeRate:1.1,autoThreshold:.85}},
    glitch:{enabled:true,ability:'static_field',cd:4000,power:10,duration:3500,radius:70,range:200},
    visual:{auraEnabled:true,auraRadius:24,runeArms:5,runeSpeed:1.4},
    ai:{stance:'cunning',priority:{magic:1,melee:0,ranged:0},aggression:.62,spacing:.45,randomness:.5,dodge:.65,burstWindow:.7}}),
  mkDef({id:'glitch2',name:'KERNEL',school:'void',desc:'System kernel crash. Null pointer spikes ignore armor, infinite loop locks enemies in place. Master-rank glitch unit.',
    hp:310,armor:6,spd:2.1,color:'#9966ff',passive:{id:'vampiric',power:.8},passive2:{id:'berserker',power:.8},
    magic:{school:'void',mana:{max:85,regen:8,cost:18},spell:{type:'bolt',pattern:'single',dmg:22,cd:1100,range:230,critChance:.14,critMult:2.1},bolt:{speed:6,size:5,homing:.15,trail:8},effect:{type:'weaken',power:.25,duration:1800},sig:{type:'beam',power:85,beamLen:380,beamWidth:11,duration:680,chargeRate:1.0,autoThreshold:.85}},
    glitch:{enabled:true,ability:'null_pointer',cd:3000,power:35,duration:0,radius:0,range:220},
    visual:{bodyRadius:10,runeArms:6,runeSpeed:1.1},
    ai:{stance:'duelist',priority:{magic:.6,melee:0,ranged:0},aggression:.7,spacing:.4,counterPlay:.65,targetCommit:.82,keepDistance:.35}}),
];


// ================================================================
// GAME STATE
// ================================================================
const W=460,H=460,PAD=18;

function mkUnit(def,x,y,side){
  return{def:dc(def),side,x,y,vx:0,vy:0,hp:def.hp,maxHp:def.hp,armor:def.armor||0,
    mana:def.magic.enabled?def.magic.mana.max*.65:0,
    atkCd:0,meleeCd:0,rangedCd:0,sigCharge:0,sigFires:0,chargeCd:0,glitchCd:0,
    comboCount:0,comboTimer:0,
    orbitAng:side===0?0:Math.PI,eTimer:0,eVx:0,eVy:0,
    cState:'idle',cTimer:0,cVx:0,cVy:0,
    flash:0,flashCol:'#ffffff',alive:true,
    status:{},
    passiveState:{spellCount:0,vengeanceReady:false,blinkCd:0},
    runeAng:rndA(),
    brain:{intent:'',log:[],deciding:[],lastAction:'',frameCount:0}};
}
function initGs(d0,d1){
  return{units:[mkUnit(d0,W*.25,H/2,0),mkUnit(d1,W*.75,H/2,1)],
    projs:[],parts:[],zones:[],bQ:[],glitchBlocks:[],
    shake:0,flashOvl:null,winner:null,time:0};
}


// ================================================================
// APP STATE
// ================================================================
const S={
  units:[...BASE_UNITS],selected:['pyros','ironclad'],
  speed:1,paused:false,showIntel:false,
  gs:null,tab:'battle',editingId:null,editTab:'IDENTITY',
  liveHPs:[null,null],liveManas:[null,null],liveSigCharges:[0,0],
  lt:null,statsT:0,intelT:0,
};
let _restartDebounce = null;
