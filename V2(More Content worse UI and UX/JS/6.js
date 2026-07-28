// ================================================================
// INIT
// ================================================================

// Custom Cursor
(function initCustomCursor(){
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  const cursorDot = document.createElement('div');
  cursorDot.className = 'custom-cursor-dot';
  document.body.appendChild(cursor);
  document.body.appendChild(cursorDot);
  
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let dotX = 0, dotY = 0;
  
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    dotX += (mouseX - dotX) * 0.5;
    dotY += (mouseY - dotY) * 0.5;
    
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursorDot.style.left = dotX + 'px';
    cursorDot.style.top = dotY + 'px';
    
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
  
  // Cursor states based on hovered elements
  document.addEventListener('mouseover', e => {
    const target = e.target;
    document.body.classList.remove('hovering-link', 'hovering-button', 'hovering-input', 'hovering-drag', 'hovering-canvas');
    
    if (target.tagName === 'A' || target.tagName === 'BUTTON' || 
        target.classList.contains('nav-btn') || target.classList.contains('c-btn') ||
        target.classList.contains('spd-btn') || target.classList.contains('intel-btn') ||
        target.classList.contains('mb') || target.classList.contains('sb') ||
        target.classList.contains('tog') || target.classList.contains('ed-tab') ||
        target.classList.contains('jbt') || target.classList.contains('tutorial-action-btn') ||
        target.classList.contains('cs-skip') || target.classList.contains('ob-close')) {
      document.body.classList.add('hovering-button');
    } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      document.body.classList.add('hovering-input');
    } else if (target.tagName === 'CANVAS') {
      document.body.classList.add('hovering-canvas');
    } else if (target.classList.contains('u-card') || target.classList.contains('r-card') ||
               target.classList.contains('json-litem')) {
      document.body.classList.add('hovering-button');
    }
  });
})();

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
