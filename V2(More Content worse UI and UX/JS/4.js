// ================================================================
// STATUS HELPERS
// ================================================================
function applyStatus(tgt,eff){
  if(!eff||eff.type==='none')return;
  if(!tgt.status)tgt.status={};
  const cur=tgt.status[eff.type];
  if(cur&&eff.stackable!==false){tgt.status[eff.type]={timer:Math.max(cur.timer,eff.duration),power:eff.power,stacks:Math.min((cur.stacks||1)+1,eff.maxStacks||3)};}
  else tgt.status[eff.type]={timer:eff.duration||2000,power:eff.power||5,stacks:1};
}
function hasStatus(u,type){return u.status&&u.status[type]&&u.status[type].timer>0;}
function getStatus(u,type){return hasStatus(u,type)?u.status[type]:null;}
function statusColor(u){
  if(!u.status)return null;
  for(const k of Object.keys(u.status)){if(u.status[k].timer>0)return SFX_COL[k]||null;}
  return null;
}


// ================================================================
// PASSIVE HELPERS
// ================================================================
function passiveModifyDmg(attacker,defender,dmg,isSpell){
  let d=dmg;
  const pa=attacker.def.passive,pa2=attacker.def.passive2;
  if(pa.id==='berserker'||pa2.id==='berserker'){const pw=(pa.id==='berserker'?pa:pa2).power;const missing=1-attacker.hp/attacker.maxHp;d*=(1+missing*pw);}
  if(pa.id==='laststand'||pa2.id==='laststand'){if(attacker.hp/attacker.maxHp<0.2)d*=2;}
  if(pa.id==='vengeance'||pa2.id==='vengeance'){if(attacker.passiveState&&attacker.passiveState.vengeanceReady){d*=1.5;attacker.passiveState.vengeanceReady=false;}}
  if(pa.id==='rage'||pa2.id==='rage'){if(hasStatus(attacker,'rage'))d*=1.3;}
  return d;
}
function passiveOnHit(attacker,defender,dmg,gs){
  const pa=attacker.def.passive,pa2=attacker.def.passive2;
  if(pa.id==='vampiric'||pa2.id==='vampiric'){const pw=(pa.id==='vampiric'?pa:pa2).power;attacker.hp=Math.min(attacker.maxHp,attacker.hp+dmg*0.15*pw);}
  if(pa.id==='manaburn'||pa2.id==='manaburn'){if(defender.def.magic.enabled)defender.mana=Math.max(0,defender.mana-8);}
}
function passiveOnReceive(attacker,defender,dmg,gs){
  if(!defender.passiveState)defender.passiveState={};
  const pa=defender.def.passive,pa2=defender.def.passive2;
  if(pa.id==='thorns'||pa2.id==='thorns'){const pw=(pa.id==='thorns'?pa:pa2).power;attacker.hp-=dmg*0.25*pw;}
  if(pa.id==='vengeance'||pa2.id==='vengeance')defender.passiveState.vengeanceReady=true;
  if((pa.id==='blink'||pa2.id==='blink')&&defender.hp/defender.maxHp<0.3&&(defender.passiveState.blinkCd||0)<=0){
    defender.x=clamp(rnd(PAD+20,W-PAD-20),PAD+20,W-PAD-20);defender.y=clamp(rnd(PAD+20,H-PAD-20),PAD+20,H-PAD-20);
    defender.passiveState.blinkCd=12000;pBurst(gs.parts,defender.x,defender.y,defender.def.color,16,2.5);
  }
}
function tickPassives(u,dt,gs){
  if(!u.passiveState)u.passiveState={};
  if(u.passiveState.blinkCd>0)u.passiveState.blinkCd-=dt;
  const pa=u.def.passive;
  if(pa.id==='regen')u.hp=Math.min(u.maxHp,u.hp+3*(dt/1000)*pa.power);
  if(pa.id==='swift'&&u.hp/u.maxHp<0.4)u.def._speedBoost=0.2*pa.power;else u.def._speedBoost=0;
}


// ================================================================
// PARTICLES
// ================================================================
function pBurst(parts,x,y,col,n,spd){for(let i=0;i<n;i++){const a=(i/n)*PI2+rnd(0,.5),s=rnd(spd*.4,spd);parts.push({x:x+Math.cos(a)*7,y:y+Math.sin(a)*7,vx:Math.cos(a)*s,vy:Math.sin(a)*s,col,life:rnd(280,720),maxLife:720,r:rnd(2.5,6),gw:true});}}
function pHit(parts,x,y,col,n){n=n||6;for(let i=0;i<n;i++){const a=rndA(),s=rnd(1,5);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,col,life:rnd(120,420),maxLife:420,r:rnd(2,5),gw:true});}}
function pRing(parts,x,y,col,n,rad){rad=rad||10;for(let i=0;i<n;i++){const a=(i/n)*PI2;parts.push({x:x+Math.cos(a)*rad,y:y+Math.sin(a)*rad,vx:Math.cos(a)*.6,vy:Math.sin(a)*.6,col,life:rnd(350,820),maxLife:820,r:rnd(1.5,3.5),gw:true});}}
function pSlash(parts,x,y,col,ang,arc){for(let i=0;i<10;i++){const a=ang-arc/2+(i/10)*arc,r2=rnd(18,46);parts.push({x:x+Math.cos(a)*r2,y:y+Math.sin(a)*r2,vx:Math.cos(a)*rnd(.8,2.5),vy:Math.sin(a)*rnd(.8,2.5),col,life:rnd(120,300),maxLife:300,r:rnd(1.5,3.5),gw:false});}}
function pSt(parts,x,y,col){const a=rndA();parts.push({x,y,vx:Math.cos(a)*rnd(.4,1.4),vy:Math.sin(a)*rnd(.4,1.4)-0.8,col,life:rnd(280,600),maxLife:600,r:rnd(1.5,3.5),gw:true});}
function bLog(u,msg,col){if(!u.brain)return;u.brain.log.unshift({msg,col:col||'#8899cc'});if(u.brain.log.length>14)u.brain.log.pop();u.brain.lastAction=msg;}

function spawnOorthoPopupStorm(gs, count=2){
  if(!gs) return;
  const layer=document.getElementById('battle-overlay-layer');
  if(!layer) return;
  const popups=gs.oorthoPopups||(gs.oorthoPopups=[]);
  for(let i=0;i<count;i++){
    const id=`oortho-popup-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
    const lines=[];
    const lineCount=4+Math.floor(Math.random()*5);
    const lex=['SIGMA','QUANTA','MATRIX','RIFT','ARCANE','GLITCH','REWRITE','STATIC','CIPHER','PULSE','TRACE','AETHER','VOID','LAYER','FRACT','RESONANCE','KERNEL','RANDOM','NEXUS','THRUM'];
    for(let j=0;j<lineCount;j++){
      const words=[];const wc=2+Math.floor(Math.random()*3);
      for(let k=0;k<wc;k++){
        const word=lex[Math.floor(Math.random()*lex.length)];
        words.push(word+(Math.random()<.35?Math.floor(Math.random()*10):''));
      }
      lines.push(words.join(' '));
    }
    const popup={
      id,
      x:12+Math.random()*76,
      y:14+Math.random()*72,
      life:3600+Math.random()*2600,
      maxLife:6200,
      text:lines.join('\n'),
      size:0.72+Math.random()*0.34,
      color:'#44aaff',
      glow:'#66ccff',
      el:null,
      dead:false,
    };
    popups.push(popup);
  }
  syncBattleOverlay(gs);
}

function updateOorthoPopups(gs, dt){
  if(!gs) return;
  const popups=gs.oorthoPopups||[];
  if(!popups.length) return;
  const live=[];
  for(const p of popups){
    if(p.dead) continue;
    p.life-=dt;
    if(p.life<=0){
      if(p.el&&p.el.parentNode)p.el.remove();
      p.dead=true;
      continue;
    }
    live.push(p);
  }
  gs.oorthoPopups=live;
  if(!gs.oorthoPopupTimer) gs.oorthoPopupTimer=5000+Math.random()*4000;
  gs.oorthoPopupTimer-=dt;
  const oortho=gs.units&&gs.units.find(u=>u&&u.def&&u.def.id==='oortho');
  if(oortho&&oortho.alive&&!gs.winner&&gs.oorthoPopupTimer<=0){
    gs.oorthoPopupTimer=5200+Math.random()*7000;
    if(Math.random()<.72) spawnOorthoPopupStorm(gs, 1+(Math.random()<.4?1:0));
  }
  syncBattleOverlay(gs);
}

function syncBattleOverlay(gs){
  if(!gs) return;
  const layer=document.getElementById('battle-overlay-layer');
  if(!layer) return;
  const popups=gs.oorthoPopups||[];
  const existing=[...layer.querySelectorAll('.oortho-popup')];
  const aliveIds=new Set();
  for(const popup of popups){
    aliveIds.add(popup.id);
    let el=popup.el;
    if(!el){
      el=document.createElement('button');
      el.type='button';
      el.className='oortho-popup';
      el.innerHTML=`<div class="oortho-popup-title">OORTHO // SIG</div><div class="oortho-popup-text"></div><div class="oortho-popup-hint">click to clear</div>`;
      el.addEventListener('click', (ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        popup.dead=true;
        if(popup.el&&popup.el.parentNode)popup.el.remove();
        pBurst(gs.parts||[], popup.x*4.6, popup.y*4.6, '#44aaff', 9, 2.2);
      });
      el.dataset.popupId=popup.id;
      layer.appendChild(el);
      popup.el=el;
    }
    el.dataset.popupId=popup.id;
    const pct=Math.max(0, popup.life/popup.maxLife);
    const textEl=el.querySelector('.oortho-popup-text');
    if(textEl) textEl.textContent=popup.text;
    el.style.left=popup.x+'%';
    el.style.top=popup.y+'%';
    el.style.transform=`translate(-50%,-50%) scale(${0.82 + popup.size*0.25 + pct*0.16})`;
    el.style.opacity=Math.max(0.2, pct*0.95);
    el.style.borderColor=`rgba(68,170,255,${0.2 + pct*0.8})`;
    el.style.boxShadow=`0 0 ${10+pct*24}px rgba(68,170,255,${0.16+pct*0.34})`;
  }
  for(const el of existing){
    if(!aliveIds.has(el.dataset.popupId)) el.remove();
  }
}


// ================================================================
// GLITCH ABILITIES
// ================================================================
function tickGlitch(u,en,gs,dt){
  const gl=u.def.glitch;
  if(!gl||!gl.enabled||gl.ability==='none')return;
  u.glitchCd-=dt;
  if(u.glitchCd>0)return;
  const d=ed(u.x,u.y,en.x,en.y);
  if(d>gl.range)return;
  u.glitchCd=gl.cd;
  const sc='#44aaff';
  switch(gl.ability){
    case'popup_block':{
      const count=2+Math.floor(Math.random()*2);
      for(let i=0;i<count;i++){
        const ang=rndA();
        const dist=rnd(40,gl.range*.7);
        const bx=clamp(en.x+Math.cos(ang)*dist,PAD+15,W-PAD-15);
        const by=clamp(en.y+Math.sin(ang)*dist,PAD+15,H-PAD-15);
        gs.glitchBlocks.push({x:bx,y:by,r:gl.radius,life:gl.duration,maxLife:gl.duration,col:sc,side:u.side,dps:gl.power});
      }
      pRing(gs.parts,u.x,u.y,sc,10,18);
      bLog(u,'GLITCH: POPUP BLOCK','#44aaff');
      break;
    }
    case'static_field':{
      gs.zones.push({x:en.x,y:en.y,r:gl.radius,dps:gl.power,life:gl.duration,maxLife:gl.duration,col:sc,glow:'#66ccff',side:u.side});
      pBurst(gs.parts,en.x,en.y,sc,14,2.5);
      bLog(u,'GLITCH: STATIC FIELD','#44aaff');
      break;
    }
    case'buffer_overflow':{
      applyStatus(en,{type:'glitch',power:gl.power,duration:gl.duration,stackable:true,maxStacks:5});
      pBurst(gs.parts,en.x,en.y,sc,8,2);
      bLog(u,'GLITCH: BUFFER OVERFLOW','#44aaff');
      break;
    }
    case'null_pointer':{
      const dmg=gl.power;
      en.hp-=dmg;en.flash=1;en.flashCol=sc;
      pBurst(gs.parts,en.x,en.y,sc,16,3);
      pRing(gs.parts,en.x,en.y,sc,12,22);
      gs.shake=Math.max(gs.shake,5);
      bLog(u,'GLITCH: NULL POINTER','#44aaff');
      break;
    }
    case'infinite_loop':{
      applyStatus(en,{type:'slow',power:0.8,duration:gl.duration,stackable:false});
      applyStatus(en,{type:'glitch',power:gl.power,duration:gl.duration,stackable:false});
      pRing(gs.parts,en.x,en.y,sc,14,20);
      bLog(u,'GLITCH: INFINITE LOOP','#44aaff');
      break;
    }
  }
}


// ================================================================
// MOVEMENT
// ================================================================
function moveUnit(u,en,dt,gs){
  const ai=u.def.ai;
  const freeze=getStatus(u,'freeze');const slow=getStatus(u,'slow');const glitch=getStatus(u,'glitch');
  const spdMult=(freeze?1-freeze.power*0.6:1)*(slow?1-slow.power*0.6:1)*(glitch?1-0.3:1)*(1+(u.def._speedBoost||0));
  const spd=u.def.spd*58*(dt/1000)*spdMult;
  const d=ed(u.x,u.y,en.x,en.y);
  const a=ea(u.x,u.y,en.x,en.y);
  const retreating=(u.hp/u.maxHp)<ai.retreatThreshold;
  const taunt=getStatus(u,'taunt');
  const prefR=(ai.orbitRadius||150)*(1+(0.5-ai.aggression)*.5+ai.keepDistance*.3);
  const speedMult=retreating?(ai.retreatSpeed||1.2):(ai.pursuitSpeed||1.0);
  const finalSpd=spd*speedMult;

  function orbitMove(){
    const dir=retreating?-1.6:1;
    u.orbitAng+=dir*(0.45+ai.strafe*.35)*(dt/1000);
    const tx=en.x+Math.cos(u.orbitAng)*prefR,ty=en.y+Math.sin(u.orbitAng)*prefR;
    const dx=tx-u.x,dy=ty-u.y,dl=Math.hypot(dx,dy)||1;
    u.vx=lerp(u.vx,(dx/dl)*finalSpd,.14);u.vy=lerp(u.vy,(dy/dl)*finalSpd,.14);
  }
  function kiteMove(){
    let fx=0,fy=0;
    if(retreating&&!taunt||d<prefR-25){fx=-Math.cos(a);fy=-Math.sin(a);}
    else if(d>prefR+25){fx=Math.cos(a);fy=Math.sin(a);}
    else{const sv=ai.strafe*2-1;fx=-Math.sin(a)*sv;fy=Math.cos(a)*sv;}
    const r2=ai.movementVar*.4;fx+=rnd(-r2,r2);fy+=rnd(-r2,r2);
    const fl=Math.hypot(fx,fy)||1;
    u.vx=lerp(u.vx,(fx/fl)*finalSpd,.12);u.vy=lerp(u.vy,(fy/fl)*finalSpd,.12);
  }

  const mv=ai.movementStyle||(u.def.move&&u.def.move.type)||'orbit';
  switch(mv){
    case'orbit':orbitMove();break;
    case'kite':kiteMove();break;
    case'aggressive':{const fx=Math.cos(a),fy=Math.sin(a);u.vx=lerp(u.vx,fx*finalSpd,.18);u.vy=lerp(u.vy,fy*finalSpd,.18);break;}
    case'strafe':{const sv=Math.sin(u.orbitAng+=0.7*(dt/1000));const fx=-Math.sin(a)*sv+Math.cos(a)*.4,fy=Math.cos(a)*sv+Math.sin(a)*.4;const fl2=Math.hypot(fx,fy)||1;u.vx=lerp(u.vx,(fx/fl2)*finalSpd,.12);u.vy=lerp(u.vy,(fy/fl2)*finalSpd,.12);break;}
    case'charge':{
      if(u.cState==='idle'){
        u.orbitAng+=0.28*(dt/1000);
        const tx=en.x+Math.cos(u.orbitAng)*140,ty=en.y+Math.sin(u.orbitAng)*140;
        const dx=tx-u.x,dy=ty-u.y,dl=Math.hypot(dx,dy)||1;
        u.vx=lerp(u.vx,(dx/dl)*finalSpd*.7,.1);u.vy=lerp(u.vy,(dy/dl)*finalSpd*.7,.1);
      }else if(u.cState==='windup'){u.cTimer-=dt;u.vx*=.82;u.vy*=.82;if(u.cTimer<=0){u.cState='dash';u.cTimer=290;const px=en.x+en.vx*ai.prediction*9,py=en.y+en.vy*ai.prediction*9;const ca=ea(u.x,u.y,px,py);u.cVx=Math.cos(ca)*finalSpd*5.5;u.cVy=Math.sin(ca)*finalSpd*5.5;}}
      else{u.cTimer-=dt;u.vx=u.cVx;u.vy=u.cVy;if(u.cTimer<=0)u.cState='idle';}
      break;}
    case'erratic':{u.eTimer-=dt;if(u.eTimer<=0){u.eTimer=rnd(140,500);const sp2=Math.PI*(0.5+ai.movementVar*.65),ra=a+rnd(-sp2,sp2);u.eVx=Math.cos(ra)*finalSpd*rnd(.4,1.7);u.eVy=Math.sin(ra)*finalSpd*rnd(.4,1.7);}u.vx=lerp(u.vx,u.eVx,.2);u.vy=lerp(u.vy,u.eVy,.2);break;}
    case'random':{u.eTimer-=dt;if(u.eTimer<=0){u.eTimer=rnd(350,900);const ra=rndA();u.eVx=Math.cos(ra)*finalSpd;u.eVy=Math.sin(ra)*finalSpd;}u.vx=lerp(u.vx,u.eVx,.09);u.vy=lerp(u.vy,u.eVy,.09);break;}
    case'stationary':u.vx*=.88;u.vy*=.88;break;
    default:orbitMove();
  }
  if(taunt&&d>60){u.vx=lerp(u.vx,Math.cos(a)*spd,.2);u.vy=lerp(u.vy,Math.sin(a)*spd,.2);}
  // Glitch block collision — push unit out of blocks
  if(gs.glitchBlocks){
    for(const b of gs.glitchBlocks){
      const bd=ed(u.x,u.y,b.x,b.y);
      if(bd<b.r+(u.def.visual.bodyRadius||10)+4){
        const ba=ea(b.x,b.y,u.x,u.y);
        const push=(b.r+(u.def.visual.bodyRadius||10)+4-bd);
        u.x+=Math.cos(ba)*push;u.y+=Math.sin(ba)*push;
        u.vx*=0.3;u.vy*=0.3;
      }
    }
  }
  u.x=clamp(u.x+u.vx,PAD+8,W-PAD-8);u.y=clamp(u.y+u.vy,PAD+8,H-PAD-8);
  u.flash=Math.max(0,u.flash-dt*3.5);
  u.runeAng+=dt*0.001*(u.def.visual.runeSpeed||1);
}


// ================================================================
// PROJECTILE FACTORY
// ================================================================
function mkP(x,y,vx,vy,dmg,col,trail,side,o){
  return Object.assign({x,y,vx,vy,dmg,col,trail:trail||col,side,r:4,life:2000,maxLife:2000,trl:[],hit:false,isDrain:false,healFrac:0,homing:0,pierce:false,impactR:0,hitSet:new Set(),isAoe:false,aoeR:0,isBeam:false,beamTo:null,isMelee:false,tMax:6,bounce:0,bounceLeft:0,eff:{type:'none',power:0,duration:0},shk:.8,isCrit:false,chainLeft:0},o);
}


// ================================================================
// MAGIC
// ================================================================
function castMagic(u,en,gs){
  const mg=u.def.magic,ai=u.def.ai;
  const px=en.x+en.vx*ai.prediction*9,py=en.y+en.vy*ai.prediction*9;
  const base=ea(u.x,u.y,px,py);
  const sc=SCH[mg.school]||SCH.arcane;
  const isCrit=Math.random()<(mg.spell.critChance||0.1);
  const dmgBase=mg.spell.dmg*(isCrit?mg.spell.critMult||1.8:1);

  if(!u.passiveState)u.passiveState={};
  u.passiveState.spellCount=(u.passiveState.spellCount||0)+1;
  const spellweave=(u.def.passive.id==='spellweave'||u.def.passive2.id==='spellweave')&&u.passiveState.spellCount%3===0;

  const sp=(dx,dy,ang)=>{
    const inac=mg.bolt.inaccuracy*(1.2-(ai.aim||.8));
    const fa=ang+rnd(-inac,inac);
    return mkP(u.x+dx,u.y+dy,Math.cos(fa)*mg.bolt.speed,Math.sin(fa)*mg.bolt.speed,dmgBase,sc.color,sc.trail,u.side,
      {r:mg.bolt.size*(isCrit?1.3:1),life:mg.bolt.lifetime,maxLife:mg.bolt.lifetime,isDrain:mg.spell.type==='drain',healFrac:.55,homing:mg.bolt.homing,pierce:mg.bolt.pierce,impactR:mg.bolt.impactRadius,tMax:mg.bolt.trail,bounce:mg.bolt.bounce||0,bounceLeft:mg.bolt.bounce||0,eff:mg.effect,shk:.8,isCrit,chainLeft:mg.bolt.chainTargets||0});
  };
  if(mg.spell.type==='aoe'){
    gs.projs.push(mkP(u.x,u.y,0,0,dmgBase,sc.color,sc.trail,u.side,{isAoe:true,aoeR:mg.spell.range*.62,life:420,maxLife:420,eff:mg.effect,shk:2}));
    pBurst(gs.parts,u.x,u.y,sc.color,14,2.8);pRing(gs.parts,u.x,u.y,sc.glow,8);
    if(spellweave)gs.projs.push(sp(0,0,base));return;
  }
  const byPat=(pat)=>{
    switch(pat){
      case'single':gs.projs.push(sp(0,0,base));break;
      case'spread':{const h2=Math.floor(mg.bolt.count/2);for(let i=-h2;i<=h2;i++)gs.projs.push(sp(0,0,base+i*mg.bolt.spread));break;}
      case'wave':for(let i=0;i<mg.bolt.count;i++){const off=i-(mg.bolt.count-1)/2,p2=base+Math.PI/2;gs.projs.push(sp(Math.cos(p2)*off*13,Math.sin(p2)*off*13,base+off*.18));}break;
      case'spiral':for(let i=0;i<mg.bolt.count;i++)gs.projs.push(sp(0,0,base+(i/mg.bolt.count)*PI2));break;
      case'pulse':gs.projs.push(mkP(u.x,u.y,0,0,dmgBase,sc.color,sc.trail,u.side,{isAoe:true,aoeR:mg.spell.range*.62,life:320,maxLife:320,eff:mg.effect,shk:1.5}));for(let i=0;i<10;i++){const ra=(i/10)*PI2;gs.parts.push({x:u.x+Math.cos(ra)*9,y:u.y+Math.sin(ra)*9,vx:Math.cos(ra)*2.4,vy:Math.sin(ra)*2.4,col:sc.color,life:280,maxLife:280,r:2.5,gw:true});}break;
      case'fan':{const tot=mg.bolt.count+2;for(let i=0;i<tot;i++)gs.projs.push(sp(0,0,base-(mg.bolt.spread*1.4)/2+i*(mg.bolt.spread*1.4/(tot-1))));}break;
      case'burst':for(let i=0;i<mg.bolt.count+2;i++)gs.projs.push(sp(rnd(-7,7),rnd(-7,7),base+rnd(-.55,.55)));break;
      case'ring':for(let i=0;i<8+mg.bolt.count;i++)gs.projs.push(sp(0,0,(i/(8+mg.bolt.count))*PI2));break;
      case'random':byPat(['single','spread','wave','spiral','fan'][Math.floor(Math.random()*5)]);break;
      default:gs.projs.push(sp(0,0,base));
    }
  };
  byPat(mg.spell.pattern);
  if(spellweave)gs.projs.push(sp(0,0,base+rnd(-.3,.3)));
  pRing(gs.parts,u.x,u.y,sc.glow,5,9);
}


// ================================================================
// MELEE
// ================================================================
function doMelee(u,en,gs){
  const m=u.def.melee;const a=ea(u.x,u.y,en.x,en.y);
  if(ed(u.x,u.y,en.x,en.y)<=m.range){
    if(m.parry&&m.parry.enabled&&Math.random()<m.parry.chance){
      const counter=m.dmg*(m.parry.counterDmg||1.5);
      en.hp-=counter;en.flash=1;en.flashCol='#ffffff';
      pBurst(gs.parts,u.x,u.y,u.def.color,12,2.5);gs.shake=Math.max(gs.shake,4);
      bLog(u,'PARRY + COUNTER!','#ffffff');
      return;
    }
    let dmg=m.dmg;
    if(m.combo&&m.combo.enabled&&u.comboCount>0)dmg*=(1+m.combo.dmgBonus*Math.min(u.comboCount,m.combo.steps)/m.combo.steps);
    const isCrit=Math.random()<(m.critChance||.12);
    if(isCrit)dmg*=(m.critMult||2.0);
    dmg=passiveModifyDmg(u,en,dmg,false);
    if(hasStatus(en,'freeze')||hasStatus(en,'weaken'))dmg*=1.3;
    const physRes=en.def.resistances?en.def.resistances.physical||0:0;
    dmg=Math.max(1,dmg*(1-physRes*.5)-(en.armor||0)*.35);
    en.hp-=dmg;en.flash=1;en.flashCol=isCrit?'#ffffff':u.def.color;
    passiveOnHit(u,en,dmg,gs);passiveOnReceive(u,en,dmg,gs);
    en.vx+=Math.cos(a)*m.knockback;en.vy+=Math.sin(a)*m.knockback;
    u.vx+=Math.cos(a)*m.lunge;u.vy+=Math.sin(a)*m.lunge;
    pHit(gs.parts,en.x,en.y,isCrit?'#ffffff':u.def.color,isCrit?12:8);
    pSlash(gs.parts,u.x,u.y,u.def.color,a,(m.arcWidth*Math.PI)/180);
    if(isCrit)pRing(gs.parts,en.x,en.y,'#ffffff',8,20);
    gs.shake=Math.max(gs.shake,isCrit?5.5:3.2);
    applyStatus(en,m.effect);
    if(m.combo&&m.combo.enabled){if(u.comboTimer>0)u.comboCount=Math.min(u.comboCount+1,m.combo.steps);else u.comboCount=1;u.comboTimer=m.combo.window;}
    bLog(u,(isCrit?'CRIT ':'')+m.weapon.toUpperCase()+(u.comboCount>1?' x'+u.comboCount:''),isCrit?'#ffffff':u.def.color);
  }
  gs.projs.push(mkP(u.x,u.y,0,0,0,u.def.color,u.def.color,u.side,{isMelee:true,arcAng:a,arcW:(m.arcWidth*Math.PI)/180,arcR:m.range,life:200,maxLife:200,hit:true}));
}


// ================================================================
// RANGED
// ================================================================
function doRanged(u,en,gs){
  const rg=u.def.ranged,ai=u.def.ai;
  const px=en.x+en.vx*ai.prediction*9,py=en.y+en.vy*ai.prediction*9;
  const base=ea(u.x,u.y,px,py);
  const col=u.def.magic.enabled?(SCH[u.def.school]||SCH.arcane).color:u.def.color;
  const isCrit=Math.random()<(rg.critChance||.1);
  const dmgBase=rg.dmg*(isCrit?rg.critMult||1.8:1);
  const sp=(ang)=>{const inac=rg.bolt.inaccuracy*(1.2-(ai.aim||.8));const fa=ang+rnd(-inac,inac);return mkP(u.x,u.y,Math.cos(fa)*rg.bolt.speed,Math.sin(fa)*rg.bolt.speed,dmgBase,col,col,u.side,{r:rg.bolt.size*(isCrit?1.3:1),life:rg.bolt.lifetime||2800,maxLife:rg.bolt.lifetime||2800,homing:rg.bolt.homing||0,pierce:rg.bolt.pierce||false,impactR:rg.bolt.impactRadius||0,tMax:rg.bolt.trail||6,bounce:rg.bolt.bounce||0,bounceLeft:rg.bolt.bounce||0,eff:rg.effect,shk:1,isCrit});};
  const cnt=rg.bolt.count||1;
  if(rg.volley&&rg.volley.enabled){
    for(let v=0;v<rg.volley.count;v++){const delay=v*rg.volley.delay;const cs=u.side;gs.bQ.push({d:delay,fn:()=>{for(let i=0;i<cnt;i++){const va=base+(i-(cnt-1)/2)*(rg.bolt.spread||.08)+(Math.random()-.5)*rg.volley.spread;gs.projs.push(sp(va));}}});}
  }else{
    const h2=Math.floor(cnt/2);for(let i=-h2;i<=h2;i++)gs.projs.push(sp(base+i*(rg.bolt.spread||.08)));
  }
  if(isCrit)bLog(u,'CRIT '+rg.ammo.toUpperCase(),'#ffffff');
}


// ================================================================
// SIGNATURE
// ================================================================
function fireSig(u,en,gs){
  u.sigFires=(u.sigFires||0)+1;
  const sig=u.def.magic.sig,sc=SCH[u.def.magic.school]||SCH.arcane;
  const a=ea(u.x,u.y,en.x,en.y);
  if(u.def.id==='oortho' && sig.type==='beam'){
    const popupCount = 5;
    for(let i=0;i<popupCount;i++){
      const t=i/(popupCount-1);
      const px = lerp(u.x, en.x, 0.2 + t*0.6) + rnd(-18, 18);
      const py = lerp(u.y, en.y, 0.2 + t*0.6) + rnd(-18, 18);
      gs.parts.push({x:px,y:py,vx:rnd(-0.2,0.2),vy:rnd(-0.2,0.2),col:'#44aaff',life:1200,maxLife:1200,r:3.5+Math.random()*2.5,gw:true});
      gs.bQ.push({d:i*140,fn:()=>{
        const target = gs.units[1-u.side];
        if(target && target.alive){
          target.hp = Math.max(0, target.hp - 8);
          target.flash = 1;
          target.flashCol = '#44aaff';
          target.status = target.status || {};
          target.status.weaken = {timer:2200,power:10,stacks:1};
          pRing(gs.parts, target.x, target.y, '#44aaff', 10, 18);
        }
      }});
    }
    gs.flashOvl={a:.28,col:'#44aaff'};
  }
  switch(sig.type){
    case'nova':
      gs.projs.push(mkP(u.x,u.y,0,0,sig.power,sc.color,sc.trail,u.side,{isAoe:true,aoeR:sig.radius,life:720,maxLife:720,shk:6}));
      pBurst(gs.parts,u.x,u.y,sc.color,34,4);pRing(gs.parts,u.x,u.y,sc.glow,20,sig.radius*.45);
      gs.shake=Math.max(gs.shake,7);gs.flashOvl={a:.32,col:sc.color};break;
    case'beam':{
      const bx=u.x+Math.cos(a)*sig.beamLen,by=u.y+Math.sin(a)*sig.beamLen;
      gs.projs.push(mkP(u.x,u.y,0,0,sig.power,sc.color,sc.trail,u.side,{isBeam:true,beamTo:{x:bx,y:by},r:sig.beamWidth/2,life:sig.duration,maxLife:sig.duration,shk:8}));
      for(let i=0;i<18;i++){const t=i/17;gs.parts.push({x:lerp(u.x,bx,t),y:lerp(u.y,by,t),vx:rnd(-1.4,1.4),vy:rnd(-1.4,1.4),col:sc.color,life:rnd(280,850),maxLife:850,r:rnd(3.5,10),gw:true});}
      gs.shake=Math.max(gs.shake,9);gs.flashOvl={a:.42,col:sc.color};break;}
    case'barrage':
      for(let i=0;i<sig.burstCount;i++){const delay=i*100,cs=u.side;gs.bQ.push({d:delay,fn:()=>{const t2=gs.units[1-cs];const ca=ea(gs.units[cs].x,gs.units[cs].y,t2.x+rnd(-25,25),t2.y+rnd(-25,25));gs.projs.push(mkP(gs.units[cs].x,gs.units[cs].y,Math.cos(ca)*sig.speed,Math.sin(ca)*sig.speed,sig.power,sc.color,sc.trail,cs,{r:5,homing:.22,life:2700,maxLife:2700,shk:1.2}));}});}
      gs.shake=Math.max(gs.shake,4);gs.flashOvl={a:.22,col:sc.color};break;
    case'zone':
      gs.zones.push({x:en.x+rnd(-18,18),y:en.y+rnd(-18,18),r:sig.radius,dps:sig.power,life:sig.duration,maxLife:sig.duration,col:sc.color,glow:sc.glow,side:u.side});
      pRing(gs.parts,en.x,en.y,sc.color,16,sig.radius*.45);
      gs.flashOvl={a:.18,col:sc.color};break;
    case'chain':{
      for(let i=0;i<6;i++){const ca2=a+i*(PI2/6);gs.projs.push(mkP(u.x,u.y,Math.cos(ca2)*sig.speed*.6,Math.sin(ca2)*sig.speed*.6,sig.power,sc.color,sc.trail,u.side,{r:5,homing:.35,life:2200,maxLife:2200,shk:2.5}));}
      gs.shake=Math.max(gs.shake,5);gs.flashOvl={a:.25,col:sc.color};break;}
    case'meteor':{
      for(let i=0;i<4;i++){const delay=i*200,cs=u.side;gs.bQ.push({d:delay,fn:()=>{const mx=en.x+rnd(-60,60),my=en.y+rnd(-60,60);gs.projs.push(mkP(u.x,u.y,(mx-u.x)/60,(my-u.y)/60,sig.power*1.2,sc.color,sc.trail,cs,{r:7,life:1800,maxLife:1800,isAoe:false,shk:5}));}});}
      gs.shake=Math.max(gs.shake,5);gs.flashOvl={a:.3,col:sc.color};break;}
  }
  bLog(u,'SIG: '+sig.type.toUpperCase(),'#ffcc44');
}


// ================================================================
// AI TICK
// ================================================================
function aiTick(u,en,gs,dt){
  const ai=u.def.ai,mg=u.def.magic,ml=u.def.melee,rg=u.def.ranged;
  const d=ed(u.x,u.y,en.x,en.y);
  u.brain.frameCount++;

  if(u.status){
    for(const k of Object.keys(u.status)){
      const s=u.status[k];s.timer-=dt;
      if(s.timer<=0){delete u.status[k];continue;}
      if(['burn','poison','bleed'].includes(k)){u.hp-=s.power*(s.stacks||1)*(dt/1000);if(Math.random()<.06)pSt(gs.parts,u.x+rnd(-10,10),u.y+rnd(-10,10),SFX_COL[k]||'#ff4400');}
      if(k==='glitch'){u.hp-=s.power*(s.stacks||1)*(dt/1000);if(Math.random()<.08)pSt(gs.parts,u.x+rnd(-10,10),u.y+rnd(-10,10),'#44aaff');}
      if(k==='regen')u.hp=Math.min(u.maxHp,u.hp+s.power*(dt/1000));
    }
  }
  if(u.comboTimer>0)u.comboTimer-=dt;else u.comboCount=0;
  tickPassives(u,dt,gs);
  if(mg.enabled)u.mana=Math.min(mg.mana.max,u.mana+mg.mana.regen*(dt/1000));
  if(mg.enabled&&mg.sig.type!=='none'){
    u.sigCharge=Math.min(1,u.sigCharge+dt*0.000082*mg.sig.chargeRate*(1+(ai.specialBias||.6)));
    if(u.sigCharge>=mg.sig.autoThreshold){u.sigCharge=0;fireSig(u,en,gs);}
  }
  tickGlitch(u,en,gs,dt);

  const hpPct=u.hp/u.maxHp;const enHpPct=en.hp/en.maxHp;
  let intent=hpPct<ai.retreatThreshold?'RETREATING':d>240?'CLOSING':'ENGAGING';
  if(enHpPct<.2)intent='FINISHING';
  u.brain.intent=intent;u.brain.d=Math.round(d);u.brain.hpPct=hpPct;

  const dec=[];
  const prio=ai.priority;
  const order=Object.entries(prio).sort((a2,b2)=>b2[1]-a2[1]).map(e=>e[0]);

  for(const mode of order){
    if(mode==='magic'&&mg.enabled){
      u.atkCd-=dt;
      const inRange=d<=mg.spell.range,hasMana=u.mana>=mg.mana.cost;
      dec.push({mode:'MAGIC',prio:prio.magic,inRange,hasMana,cd:u.atkCd,cdMax:mg.spell.cd,enabled:true,pat:mg.spell.pattern,school:mg.school});
      if(u.atkCd<=0&&inRange){
        if(hasMana){u.mana-=mg.mana.cost;castMagic(u,en,gs);bLog(u,'CAST '+mg.spell.pattern.toUpperCase(),(SCH[mg.school]||SCH.arcane).color);}
        else{const sc2=SCH[mg.school]||SCH.arcane;const a2=ea(u.x,u.y,en.x,en.y);gs.projs.push(mkP(u.x,u.y,Math.cos(a2)*3,Math.sin(a2)*3,Math.ceil(mg.spell.dmg*.3),sc2.color,sc2.trail,u.side,{r:3,life:1700,maxLife:1700,tMax:4,shk:.4}));bLog(u,'LOW MANA: weak bolt','#775588');}
        u.atkCd=mg.spell.cd;
      }
    }
    else if(mode==='melee'&&ml.enabled){
      u.meleeCd-=dt;
      const inRange=d<=ml.range+7;
      dec.push({mode:'MELEE',prio:prio.melee,inRange,hasMana:true,cd:u.meleeCd,cdMax:ml.cd,enabled:true,pat:ml.weapon});
      if(u.meleeCd<=0&&inRange){
        if(u.def.move&&u.def.move.type==='charge'&&u.cState==='idle'){u.cState='windup';u.cTimer=420;}
        doMelee(u,en,gs);u.meleeCd=ml.cd;
      }
      if(ml.charge&&ml.charge.enabled){
        u.chargeCd-=dt;
        if(u.chargeCd<=0&&d>ml.charge.minDist&&d<ml.charge.minDist*1.8){
          const ca3=ea(u.x,u.y,en.x,en.y);
          u.vx=Math.cos(ca3)*ml.charge.dashSpd*58*(dt/1000)*12;
          u.vy=Math.sin(ca3)*ml.charge.dashSpd*58*(dt/1000)*12;
          u.chargeCd=ml.charge.cooldown;
          pBurst(gs.parts,u.x,u.y,u.def.color,10,3);
          bLog(u,'CHARGE!','#ffcc44');
        }
      }
    }
    else if(mode==='ranged'&&rg.enabled){
      u.rangedCd-=dt;
      const inRange=d<=rg.range;
      dec.push({mode:'RANGED',prio:prio.ranged,inRange,hasMana:true,cd:u.rangedCd,cdMax:rg.cd,enabled:true,pat:rg.ammo});
      if(u.rangedCd<=0&&inRange){doRanged(u,en,gs);u.rangedCd=rg.cd;}
    }
  }
  if(!mg.enabled)dec.push({mode:'MAGIC',prio:0,enabled:false,cd:0,cdMax:1,inRange:false,hasMana:false});
  if(!ml.enabled)dec.push({mode:'MELEE',prio:0,enabled:false,cd:0,cdMax:1,inRange:false,hasMana:false});
  if(!rg.enabled)dec.push({mode:'RANGED',prio:0,enabled:false,cd:0,cdMax:1,inRange:false,hasMana:false});
  u.brain.deciding=dec.sort((a2,b2)=>b2.prio-a2.prio);
}


// ================================================================
// GAME UPDATE
// ================================================================
function playBattleEndCutscene(gs){
  if(!gs || !gs.winner || gs.resultCutscenePlayed || CS.active) return;
  const [u0,u1] = gs.units;
  // Only play story cutscenes when OORTHO is a combatant
  const hasOortho = (u0.def && u0.def.id === 'oortho') || (u1.def && u1.def.id === 'oortho');
  if(!hasOortho) return;
  gs.resultCutscenePlayed = true;
  const playerWon = u0.alive && !u1.alive;
  const enemyWon = u1.alive && !u0.alive;
  if(playerWon) playCutscene('oortho_defeated');
  else if(enemyWon) playCutscene('player_defeated');
}

function updateGame(gs,dt){
  if(!gs||gs.winner||CS.active)return;
  gs.time+=dt;gs.shake=Math.max(0,gs.shake-dt*4);
  if(gs.flashOvl){gs.flashOvl.a-=dt*.0038;if(gs.flashOvl.a<=0)gs.flashOvl=null;}
  for(let i=gs.bQ.length-1;i>=0;i--){gs.bQ[i].d-=dt;if(gs.bQ[i].d<=0){try{gs.bQ[i].fn();}catch(err){console.warn('BQ action failed:',err);}gs.bQ.splice(i,1);}}
  const[u0,u1]=gs.units;
  if(u0.alive&&u1.alive){
    moveUnit(u0,u1,dt,gs);moveUnit(u1,u0,dt,gs);
    aiTick(u0,u1,gs,dt);aiTick(u1,u0,gs,dt);
  }

  for(let i=gs.projs.length-1;i>=0;i--){
    const p=gs.projs[i];p.life-=dt;
    if(p.isMelee){if(p.life<=0)gs.projs.splice(i,1);continue;}
    if(p.isBeam){
      const tgt=gs.units[1-p.side];
      if(tgt&&tgt.alive&&!p.hit){try{const ba=ea(p.x,p.y,p.beamTo.x,p.beamTo.y),ta=ea(p.x,p.y,tgt.x,tgt.y);let da=ta-ba;while(da>Math.PI)da-=PI2;while(da<-Math.PI)da+=PI2;if(Math.abs(da)<.52&&ed(p.x,p.y,tgt.x,tgt.y)<=ed(p.x,p.y,p.beamTo.x,p.beamTo.y)){const bdmg=Math.max(.5,p.dmg*(dt/p.maxLife)*2-(tgt.armor||0)*.2);tgt.hp-=bdmg;tgt.flash=1;tgt.flashCol=p.col;pHit(gs.parts,tgt.x,tgt.y,p.col,2);passiveOnHit(gs.units[p.side],tgt,bdmg,gs);}}catch(err){console.warn('Beam hit failed:',err);}}
      if(p.life<=0)gs.projs.splice(i,1);continue;
    }
    if(p.isAoe){
      const tgt=gs.units[1-p.side];
      if(tgt&&tgt.alive&&!p.hit&&ed(p.x,p.y,tgt.x,tgt.y)<=p.aoeR){try{const adm=Math.max(.5,p.dmg-(tgt.armor||0)*.3);tgt.hp-=adm;tgt.flash=1;tgt.flashCol=p.col;pHit(gs.parts,tgt.x,tgt.y,p.col,10);p.hit=true;applyStatus(tgt,p.eff||{type:'none'});gs.shake=Math.max(gs.shake,p.shk||1);passiveOnReceive(gs.units[p.side],tgt,adm,gs);}catch(err){console.warn('AOE hit failed:',err);}}
      if(p.life<=0)gs.projs.splice(i,1);continue;
    }
    if(p.homing>0){const tgt=gs.units[1-p.side];if(tgt&&tgt.alive){try{const ta=ea(p.x,p.y,tgt.x,tgt.y),ca=Math.atan2(p.vy,p.vx);let da=ta-ca;while(da>Math.PI)da-=PI2;while(da<-Math.PI)da+=PI2;const na=ca+da*p.homing*.1,s=Math.hypot(p.vx,p.vy);p.vx=Math.cos(na)*s;p.vy=Math.sin(na)*s;}catch(err){}}}
    if(p.trl.length>p.tMax)p.trl.shift();
    p.trl.push({x:p.x,y:p.y});
    const nx=p.x+p.vx,ny=p.y+p.vy;
    if(p.bounceLeft>0&&(nx<PAD||nx>W-PAD||ny<PAD||ny>H-PAD)){if(nx<PAD||nx>W-PAD)p.vx*=-1;if(ny<PAD||ny>H-PAD)p.vy*=-1;p.bounceLeft--;pHit(gs.parts,p.x,p.y,p.col,3);}
    p.x=nx;p.y=ny;
    if(p.x<0||p.x>W||p.y<0||p.y>H||p.life<=0){gs.projs.splice(i,1);continue;}
    const tgt=gs.units[1-p.side];
    if(tgt&&tgt.alive&&!p.hitSet.has(1-p.side)&&ed(p.x,p.y,tgt.x,tgt.y)<(tgt.def.visual.bodyRadius||10)+2){
      try{
        const schk=hasStatus(tgt,'shock');
        let pdm=passiveModifyDmg(gs.units[p.side],tgt,p.dmg,true);
        pdm=Math.max(.5,pdm-(tgt.armor||0)*.3);
        if(schk)pdm*=1.4;
        const bar=getStatus(tgt,'barrier');if(bar){bar.timer=0;delete tgt.status.barrier;pRing(gs.parts,tgt.x,tgt.y,'#88aaff',12,22);gs.projs.splice(i,1);continue;}
        const physRes=tgt.def.resistances?tgt.def.resistances.physical||0:0;
        pdm*=(1-physRes*.4);
        tgt.hp-=pdm;tgt.flash=1;tgt.flashCol=p.isCrit?'#ffffff':p.col;
        if(p.isDrain){const att=gs.units[p.side];att.hp=Math.min(att.maxHp,att.hp+pdm*p.healFrac);}
        if(p.impactR>0)gs.projs.push(mkP(p.x,p.y,0,0,p.dmg*.38,p.col,p.trail,p.side,{isAoe:true,aoeR:p.impactR,life:350,maxLife:350,eff:p.eff||{type:'none'}}));
        pHit(gs.parts,tgt.x,tgt.y,p.isCrit?'#ffffff':p.col,p.isCrit?10:6);
        if(p.isCrit)pRing(gs.parts,tgt.x,tgt.y,'#ffffff',6,18);
        gs.shake=Math.max(gs.shake,p.shk||1.2);
        applyStatus(tgt,p.eff||{type:'none'});
        passiveOnHit(gs.units[p.side],tgt,pdm,gs);passiveOnReceive(gs.units[p.side],tgt,pdm,gs);
        if(p.pierce)p.hitSet.add(1-p.side);else{gs.projs.splice(i,1);continue;}
      }catch(err){
        console.warn('Projectile hit failed:',err);
        gs.projs.splice(i,1);
      }
    }
  }
  for(let i=gs.zones.length-1;i>=0;i--){try{const z=gs.zones[i];z.life-=dt;if(z.life<=0){gs.zones.splice(i,1);continue;}const tgt=gs.units[1-z.side];if(tgt&&tgt.alive&&ed(z.x,z.y,tgt.x,tgt.y)<=z.r){tgt.hp-=z.dps*(dt/1000);tgt.flash=.4;tgt.flashCol=z.col;}if(Math.random()<.05)gs.parts.push({x:z.x+rnd(-z.r,z.r),y:z.y+rnd(-z.r,z.r),vx:rnd(-.7,.7),vy:rnd(-1.4,-.2),col:z.col,life:rnd(350,850),maxLife:850,r:rnd(1.5,3.5),gw:true});}catch(err){console.warn('Zone update failed:',err);gs.zones.splice(i,1);}}
  for(let i=(gs.glitchBlocks||[]).length-1;i>=0;i--){try{const b=gs.glitchBlocks[i];b.life-=dt;if(b.life<=0){gs.glitchBlocks.splice(i,1);continue;}const tgt=gs.units[1-b.side];if(tgt&&tgt.alive&&ed(b.x,b.y,tgt.x,tgt.y)<=b.r+b.r*.3){tgt.hp-=b.dps*(dt/1000);tgt.flash=.3;tgt.flashCol=b.col;}if(Math.random()<.08)gs.parts.push({x:b.x+rnd(-b.r,b.r),y:b.y+rnd(-b.r,b.r),vx:rnd(-.3,.3),vy:rnd(-.8,.2),col:b.col,life:rnd(300,600),maxLife:600,r:rnd(1.5,3),gw:true});}catch(err){console.warn('Glitch block update failed:',err);gs.glitchBlocks.splice(i,1);}}
  for(let i=gs.parts.length-1;i>=0;i--){try{const p=gs.parts[i];p.life-=dt;if(p.life<=0){gs.parts.splice(i,1);continue;}p.x+=p.vx;p.y+=p.vy;p.vx*=.91;p.vy*=.91;}catch(err){console.warn('Particle update failed:',err);gs.parts.splice(i,1);}}
  u0.alive=u0.hp>0;u1.alive=u1.hp>0;
  if(!u0.alive||!u1.alive){
    if(!u0.alive&&!u1.alive)gs.winner={name:'DRAW',col:'#ffffff'};
    else if(!u0.alive)gs.winner={name:u1.def.name,col:u1.def.color};
    else gs.winner={name:u0.def.name,col:u0.def.color};
    const _playerWon=u0.alive&&!u1.alive;
    if(typeof Progression!=='undefined')Progression.recordBattle(_playerWon,u0.def.id,u1.def.id);
    if(!TUT.active) playBattleEndCutscene(gs);
  }
}


// ================================================================
// RENDERING
// ================================================================
function drawUnit(ctx,u,showIntel){
  if(!u.alive)return;
  const fl=u.flash>.5;const v=u.def.visual||D_VISUAL;
  const gc=SCH[u.def.school]?SCH[u.def.school].glow:u.def.color;
  const br=v.bodyRadius||10;
  const sCol=statusColor(u);
  const ai=u.def.ai;
  const retreating=(u.hp/u.maxHp)<ai.retreatThreshold;

  if(v.auraEnabled){
    const ar=v.auraRadius+(v.auraPulse?Math.sin(Date.now()*.003)*3:0);
    ctx.strokeStyle=u.def.color;ctx.lineWidth=1;ctx.globalAlpha=.12;
    ctx.beginPath();ctx.arc(u.x,u.y,ar,0,PI2);ctx.stroke();ctx.globalAlpha=1;
  }
  if(retreating){
    ctx.strokeStyle='#ff4455';ctx.lineWidth=2;ctx.globalAlpha=.3;
    ctx.beginPath();ctx.arc(u.x,u.y,br+18,0,PI2);ctx.stroke();
    ctx.globalAlpha=1;
  }
  if(ai.aggression>0.8){
    ctx.strokeStyle='#ffaa44';ctx.lineWidth=1.5;ctx.globalAlpha=.25;
    ctx.beginPath();ctx.arc(u.x,u.y,br+22,0,PI2);ctx.stroke();
    ctx.globalAlpha=1;
  }
  if(v.runeEnabled&&u.def.magic.enabled){
    ctx.globalAlpha=.14;ctx.strokeStyle=u.def.color;ctx.lineWidth=.8;
    ctx.beginPath();ctx.arc(u.x,u.y,br+12,0,PI2);ctx.stroke();
    const arms=v.runeArms||4;
    for(let i=0;i<arms;i++){const ra=u.runeAng+(i/arms)*PI2;ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(u.x+Math.cos(ra)*(br+12),u.y+Math.sin(ra)*(br+12));ctx.stroke();}
    ctx.globalAlpha=1;
  }
  if(sCol){ctx.strokeStyle=sCol;ctx.lineWidth=1;ctx.globalAlpha=.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(u.x,u.y,br+14,0,PI2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  if(hasStatus(u,'barrier')){ctx.strokeStyle='#88aaff';ctx.lineWidth=2;ctx.globalAlpha=.7;ctx.shadowColor='#88aaff';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(u.x,u.y,br+16,0,PI2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}
  if((u.armor||0)>0){const aR=Math.min(1,(u.armor||0)/25);ctx.strokeStyle='#aabb88';ctx.lineWidth=1.5;ctx.globalAlpha=aR*.4;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(u.x,u.y,br+9,0,PI2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  ctx.shadowColor=gc;ctx.shadowBlur=(fl?36:18)*(v.glowIntensity||1);
  ctx.fillStyle=fl?u.flashCol:u.def.color;ctx.globalAlpha=.92;
  ctx.beginPath();ctx.arc(u.x,u.y,br,0,PI2);ctx.fill();
  ctx.fillStyle='#04050a';ctx.globalAlpha=.8;
  ctx.beginPath();ctx.arc(u.x,u.y,br*.65,0,PI2);ctx.fill();
  ctx.fillStyle=fl?u.flashCol:gc;ctx.globalAlpha=.9;
  ctx.beginPath();ctx.arc(u.x,u.y,br*.28,0,PI2);ctx.fill();
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  if(v.shockwaveOnHit&&fl){ctx.strokeStyle=u.def.color;ctx.lineWidth=1;ctx.globalAlpha=u.flash*.4;ctx.beginPath();ctx.arc(u.x,u.y,br+22,0,PI2);ctx.stroke();ctx.globalAlpha=1;}

  if(!v.nameVisible)return;
  ctx.fillStyle=u.def.color;ctx.font='bold 7px monospace';ctx.textAlign='center';
  ctx.fillText(u.def.name,u.x,u.y-br-5);

  if(!v.barsVisible)return;
  const bw=br*4.5,hpR=Math.max(0,u.hp/u.maxHp);
  const hc=hpR>.5?'#44ff88':hpR>.25?'#ffaa44':'#ff3344';
  ctx.fillStyle='#0a0c1e';ctx.fillRect(u.x-bw/2,u.y+br+3,bw,4);
  ctx.fillStyle=hc;ctx.fillRect(u.x-bw/2,u.y+br+3,bw*hpR,4);
  if(u.def.magic.enabled){const mR=u.mana/(u.def.magic.mana.max||1);ctx.fillStyle='#0a0c1e';ctx.fillRect(u.x-bw/2,u.y+br+9,bw,2.5);ctx.fillStyle=u.def.color;ctx.globalAlpha=.7;ctx.fillRect(u.x-bw/2,u.y+br+9,bw*mR,2.5);ctx.globalAlpha=1;}
  if(u.def.magic.enabled&&u.def.magic.sig.type!=='none'&&u.sigCharge>.01){ctx.strokeStyle=u.def.color;ctx.lineWidth=1.8;ctx.globalAlpha=.65;ctx.shadowColor=gc;ctx.shadowBlur=7;ctx.beginPath();ctx.arc(u.x,u.y,br+1.5,-Math.PI/2,-Math.PI/2+u.sigCharge*PI2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}
  if(u.def.melee.combo&&u.def.melee.combo.enabled&&u.comboCount>0){for(let c=0;c<u.comboCount;c++){ctx.fillStyle='#ffaa44';ctx.globalAlpha=.85;ctx.fillRect(u.x-bw/2+c*7,u.y+br+13,5.5,2.5);}ctx.globalAlpha=1;}
}

function renderGame(ctx,gs,showIntel){
  const{units,projs,parts,zones,shake,flashOvl}=gs;
  ctx.save();
  if(shake>.5)ctx.translate(rnd(-shake,shake),rnd(-shake,shake));
  ctx.fillStyle='#040609';ctx.fillRect(0,0,W,H);
  
  ctx.strokeStyle='#08091a';ctx.lineWidth=1;
  ctx.beginPath();
  for(let x=0;x<W;x+=30){ctx.moveTo(x,0);ctx.lineTo(x,H);}
  for(let y=0;y<H;y+=30){ctx.moveTo(0,y);ctx.lineTo(W,y);}
  ctx.stroke();
  ctx.strokeStyle='#131a38';ctx.lineWidth=2;ctx.strokeRect(1,1,W-2,H-2);

  for(const z of zones){try{const pct=z.life/z.maxLife;ctx.globalAlpha=pct*.17;ctx.fillStyle=z.col;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,PI2);ctx.fill();ctx.globalAlpha=pct*.5;ctx.strokeStyle=z.col;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,PI2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}catch(err){}}
  for(const b of(gs.glitchBlocks||[])){try{const pct=b.life/b.maxLife;ctx.globalAlpha=pct*.25;ctx.fillStyle=b.col;ctx.fillRect(b.x-b.r,b.y-b.r*.7,b.r*2,b.r*1.4);ctx.globalAlpha=pct*.6;ctx.strokeStyle=b.col;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.strokeRect(b.x-b.r,b.y-b.r*.7,b.r*2,b.r*1.4);ctx.setLineDash([]);ctx.globalAlpha=pct*.5;ctx.fillStyle='#0a0c1e';ctx.fillRect(b.x-b.r+3,b.y-b.r*.7+3,b.r*2-6,b.r*1.4-6);ctx.globalAlpha=pct*.8;ctx.fillStyle=b.col;ctx.font='bold 6px monospace';ctx.textAlign='center';ctx.fillText('ERR',b.x,b.y+2);ctx.globalAlpha=1;}catch(err){}}
  for(const p of parts){try{const al=p.life/p.maxLife;ctx.globalAlpha=al*.85;ctx.fillStyle=p.col;if(p.gw){ctx.shadowColor=p.col;ctx.shadowBlur=5;}const r2=Math.max(.4,p.r*Math.sqrt(al));ctx.beginPath();ctx.arc(p.x,p.y,r2,0,PI2);ctx.fill();ctx.shadowBlur=0;}catch(err){}}
  ctx.globalAlpha=1;

  for(const p of projs){
    const pct=p.life/p.maxLife;
    if(p.isMelee){ctx.strokeStyle=p.col;ctx.lineWidth=p.isCrit?3.5:2.5;ctx.globalAlpha=pct*.85;ctx.shadowColor=p.col;ctx.shadowBlur=p.isCrit?18:10;ctx.beginPath();ctx.arc(p.x,p.y,p.arcR,p.arcAng-p.arcW/2,p.arcAng+p.arcW/2);ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;continue;}
    if(p.isBeam){ctx.globalAlpha=pct*.95;ctx.strokeStyle=p.col;ctx.lineWidth=p.r*2;ctx.shadowColor=p.col;ctx.shadowBlur=26;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.beamTo.x,p.beamTo.y);ctx.stroke();ctx.lineWidth=p.r*5;ctx.globalAlpha=pct*.16;ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;continue;}
    if(p.isAoe){ctx.globalAlpha=pct*.2;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.aoeR,0,PI2);ctx.fill();ctx.globalAlpha=pct*.5;ctx.strokeStyle=p.col;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;continue;}
    for(let ti=0;ti<p.trl.length;ti++){const t=ti/p.trl.length,tr=p.r*t;if(tr>.4){ctx.globalAlpha=t*.35;ctx.fillStyle=p.trail;ctx.beginPath();ctx.arc(p.trl[ti].x,p.trl[ti].y,tr,0,PI2);ctx.fill();}}
    ctx.globalAlpha=1;ctx.fillStyle=p.isCrit?'#ffffff':p.col;ctx.shadowColor=p.isCrit?'#ffffff':p.col;ctx.shadowBlur=p.isCrit?20:12;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*(p.isCrit?1.3:1),0,PI2);ctx.fill();ctx.shadowBlur=0;
  }
  for(const u of units)drawUnit(ctx,u,showIntel);
  if(gs.winner){
    ctx.fillStyle='rgba(3,4,8,.86)';ctx.fillRect(0,0,W,H);
    ctx.shadowColor=gs.winner.col;ctx.shadowBlur=32;
    ctx.fillStyle=gs.winner.col;ctx.font='bold 24px monospace';ctx.textAlign='center';
    ctx.fillText(gs.winner.name==='DRAW'?'DRAW!':gs.winner.name+' WINS!',W/2,H/2-12);
    ctx.shadowBlur=0;ctx.fillStyle='#334';ctx.font='10px monospace';
    ctx.fillText('press RESTART',W/2,H/2+12);
  }
  if(flashOvl&&flashOvl.a>0){ctx.fillStyle=flashOvl.col;ctx.globalAlpha=flashOvl.a*.28;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
  ctx.restore();
}
