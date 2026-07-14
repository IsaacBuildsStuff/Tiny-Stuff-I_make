// ================================================================
// INIT
// ================================================================
try{
  if(!TutorialCache.hasSeen()){
    renderTutorial();
    if(typeof Progression!=='undefined'&&Progression.stats.battlesTotal===0){
      setTimeout(()=>{
        try{
          if(typeof playCutscene==='function'&&!CS.active)playCutscene('intro_welcome');
        }catch(err){
          console.warn('Cutscene failed:',err);
        }
      },800);
    }
  }else{
    setTab('battle');
  }
}catch(err){
  console.error('Init failed:',err);
  setTab('battle');
}

document.addEventListener('keydown',e=>{
  try{
    const target=e.target;const tag=(target&&target.tagName||'').toLowerCase();
    const isTyping=tag==='input'||tag==='textarea'||(target&&target.isContentEditable);
    if(isTyping)return;
    if(e.key==='?')setTab('tutorial');
    if(e.key==='t'||e.key==='T')showBattleTutorialMenu();
    if(e.key==='Escape'){
      const modal=document.getElementById('modal');
      if(modal&&modal.innerHTML)modal.innerHTML='';
    }
  }catch(err){
    console.warn('Key handler failed:',err);
  }
});

try{
  if(typeof Progression!=='undefined'){Progression.checkMissions();}
  restartGame();
  requestAnimationFrame(loop);
}catch(err){
  console.error('Game start failed:',err);
}
