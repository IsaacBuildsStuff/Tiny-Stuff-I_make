// ================================================================
// SIDE PANEL HTML
// ================================================================
function panelHTML(side){
  const sel=S.selected[side],def=getDef(sel);
  const hp=S.liveHPs[side],mana=S.liveManas[side],sig=S.liveSigCharges[side]||0;
  const hpVal=hp!==null?hp:(def?def.hp:0);
  const hpPct=def?Math.max(0,hpVal/def.hp):1;
  const manaPct=def&&def.magic.enabled?Math.max(0,(mana!==null?mana:def.magic.mana.max*.65)/(def.magic.mana.max||1)):0;
  const hc=hpCol(hpPct),col=def?def.color:'#7766ff';
  let info='';
  if(def){
    const prio=def.ai.priority,mp=Math.max(prio.magic||0,prio.melee||0,prio.ranged||0);
    const pa=PASSIVES[def.passive&&def.passive.id]||PASSIVES.none;
    const pa2=PASSIVES[def.passive2&&def.passive2.id]||PASSIVES.none;
    info=`<div class="side-info">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px"><div class="dot" style="width:11px;height:11px;background:${col};box-shadow:0 0 7px ${col}"></div><span style="color:${col};font-size:11px;font-weight:bold;letter-spacing:2px;flex:1">${def.name}</span><button class="mb" onclick="goEdit('${def.id}')">EDIT</button></div>
      <div style="margin-bottom:5px;line-height:1.8">${mkTags(def)}</div>
      <p style="font-size:9px;color:var(--dim);line-height:1.5;margin:0 0 8px">${def.desc}</p>
      <div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;color:var(--dim)">HP</span><span id="ht${side}" style="font-size:9px;color:${hc}">${Math.max(0,Math.round(hpVal))}/${def.hp}</span></div><div class="bar-bg" style="height:5px"><div id="hb${side}" class="bar-f" style="width:${hpPct*100}%;height:5px;background:${hc}"></div></div></div>
      ${def.magic.enabled?`<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;color:var(--dim)">MANA</span><span id="mt${side}" style="font-size:9px;color:${col}">${Math.round(mana!==null?mana:def.magic.mana.max*.65)}/${def.magic.mana.max}</span></div><div class="bar-bg" style="height:3px"><div id="mb${side}" class="bar-f" style="width:${manaPct*100}%;height:3px;background:${col};box-shadow:0 0 4px ${col}"></div></div></div>`:''}
      ${def.magic.enabled&&def.magic.sig.type!=='none'?`<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;color:var(--dim)">SIG (${def.magic.sig.type.toUpperCase()})</span><span id="ct${side}" style="font-size:9px;color:${col}">${Math.round(sig*100)}%</span></div><div class="bar-bg" style="height:3px"><div id="cb${side}" class="bar-f" style="width:${sig*100}%;height:3px;background:${col};box-shadow:0 0 4px ${col}"></div></div></div>`:''}
      <div style="font-size:9px;color:var(--dim);margin-bottom:7px" id="st${side}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:7px">${['magic','melee','ranged'].map(m=>{const v=prio[m]||0;const isMx=v===mp&&v>0;const en2=def[m==='magic'?'magic':m].enabled;return`<div style="background:${isMx?'#120e30':'var(--bg)'};border:1px solid ${isMx?col:'var(--border)'};border-radius:3px;padding:3px 2px;text-align:center"><div style="font-size:8px;color:${isMx?col:'var(--dim)'}">${m.toUpperCase()}</div><div style="font-size:10px;font-weight:bold;color:${isMx?col:en2?'var(--text)':'var(--dim)'}">${Math.round(v*100)}%</div></div>`;}).join('')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 5px;border-top:1px solid var(--border);padding-top:6px"><div class="srow"><span class="sl">STANCE</span><span class="sv">${def.ai.stance.slice(0,7).toUpperCase()}</span></div><div class="srow"><span class="sl">SPD</span><span class="sv">${def.spd}</span></div><div class="srow"><span class="sl">ARMOR</span><span class="sv">${def.armor}</span></div><div class="srow"><span class="sl">PASSIVE</span><span class="sv" style="color:#8899ff;font-size:9px">${pa.name}</span></div>${pa2.name!=='NONE'?`<div class="srow" style="grid-column:1/-1"><span class="sl">PASSIVE 2</span><span class="sv" style="color:#8899ff;font-size:9px">${pa2.name}</span></div>`:''}</div>
    </div>`;
  }
  const unlockedUnits = typeof Progression !== 'undefined' ? Progression.getUnlockedUnits() : S.units.map(u => u.id);
  const filteredUnits = S.units.filter(u => unlockedUnits.includes(u.id));
  const list=filteredUnits.map(u=>`<div class="u-card ${u.id===sel?'sel':''}" style="${u.id===sel?'border-color:'+u.color+';box-shadow:0 0 7px '+u.color+'22':''}" onclick="selectUnit(${side},'${u.id}')"><div style="display:flex;align-items:center;gap:5px;margin-bottom:2px"><div class="dot" style="width:8px;height:8px;background:${u.color};box-shadow:0 0 4px ${u.color}"></div><span style="font-size:10px;color:${u.color};font-weight:bold;flex:1">${u.name}</span><button class="mb" onclick="event.stopPropagation();goEdit('${u.id}')">EDIT</button></div><div style="margin-bottom:2px;line-height:1.6">${mkTags(u)}</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px 4px"><span style="font-size:9px"><span class="sl">HP </span>${u.hp}</span><span style="font-size:9px"><span class="sl">ARM </span>${u.armor}</span><span style="font-size:9px"><span class="sl">SPD </span>${u.spd}</span></div></div>`).join('');
  return`${info}<div class="side-list"><div style="font-size:9px;color:var(--dim);letter-spacing:2px;margin-bottom:6px">SELECT UNIT</div>${list}</div>`;
}
