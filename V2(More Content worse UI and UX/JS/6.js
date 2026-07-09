// ================================================================
// INIT
// ================================================================
if(!TutorialCache.hasSeen()){renderTutorial();if(typeof Progression!=='undefined'&&Progression.stats.battlesTotal===0){setTimeout(()=>{if(typeof playCutscene==='function'&&!CS.active)playCutscene('intro_welcome');},800);}}else{setTab('battle');}
document.addEventListener('keydown',e=>{
  const target=e.target;const tag=(target&&target.tagName||'').toLowerCase();
  const isTyping=tag==='input'||tag==='textarea'||(target&&target.isContentEditable);
  if(isTyping)return;
  if(e.key==='?')setTab('tutorial');
  if(e.key==='t'||e.key==='T')showBattleTutorialMenu();
});
if(typeof Progression!=='undefined'){Progression.checkMissions();}
restartGame();
requestAnimationFrame(loop);
