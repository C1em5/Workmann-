(function(){
  const track = document.getElementById('track');
  const bar = document.getElementById('bar');
  const fish = document.getElementById('fish');
  const gaugeFill = document.getElementById('gaugeFill');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const retryBtn = document.getElementById('retryBtn');
  const stage = document.getElementById('stage');
    let gameWon = false;

  function markFishingWin(){
    try{
      const raw = localStorage.getItem('rtm_gift_state_v1');
      const state = raw ? JSON.parse(raw) : {};
      state.fishingPassed = true;
      localStorage.setItem('rtm_gift_state_v1', JSON.stringify(state));
    }catch(e){}
    window.location.href = 'index.html';
}
  const BAR_HEIGHT_PCT = 30;   // % of track height
  const FISH_HEIGHT_PCT = 17;  // % of track height (approx, square sprite)
  const RISE_SPEED = 95;       // %/sec while holding
  const FALL_SPEED = 60;       // %/sec gravity
  const FILL_RATE = 16;        // gauge %/sec when fish inside bar
  const DRAIN_RATE = 1;       // gauge %/sec when fish outside bar

  let barPos = 60;    // top position of bar, in % of track height (0-100-BAR_HEIGHT_PCT)
  let fishPos = 80;   // top position of fish center-ish, in %
  let fishTarget = 80;
  let fishSpeed = 40; // current %/sec toward target (randomized)
  let holding = false;
  let progress = 25;  // gauge 0-100
  let running = true;
  let lastTime = null;
  let nextJerkTime = 0;

  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function pickNewFishTarget(now){
    fishTarget = clamp(Math.random()*100, 0, 100 - FISH_HEIGHT_PCT*0.3);
    fishSpeed = 55 + Math.random()*110; // jerky: sometimes fast dart, sometimes slow
    // schedule next jerk between 0.35s and 1.1s
    nextJerkTime = now + 350 + Math.random()*750;
  }

  function resetGame(){
    barPos = 60;
    fishPos = Math.random()*70 + 10;
    fishTarget = fishPos;
    progress = 25;
    holding = false;
    running = true;
    lastTime = null;
    nextJerkTime = 0;
    overlay.classList.remove('show');
    requestAnimationFrame(loop);
  }

function endGame(win){
    running = false;
    overlay.classList.add('show');
    gameWon = win;
    if(win){
      overlayTitle.textContent = 'Поймал! 🐟';
      overlayText.textContent = 'Рыбка твоя! Возвращайся в квест.';
      retryBtn.textContent = 'Вернуться к квесту';
    } else {
      overlayTitle.textContent = 'Сорвалась...';
      overlayText.textContent = 'Попробуй ещё раз!';
      retryBtn.textContent = 'Ещё раз';
    }
}

  function loop(ts){
    if(!running) return;
    if(lastTime === null){ lastTime = ts; nextJerkTime = ts; }
    const dt = Math.min(0.05, (ts - lastTime)/1000);
    lastTime = ts;

    // bar physics
    if(holding){
      barPos -= RISE_SPEED*dt;
    } else {
      barPos += FALL_SPEED*dt;
    }
    barPos = clamp(barPos, 0, 100 - BAR_HEIGHT_PCT);

    // fish jerky movement
    if(ts >= nextJerkTime){
      pickNewFishTarget(ts);
    }
    const diff = fishTarget - fishPos;
    const step = fishSpeed*dt;
    if(Math.abs(diff) <= step){
      fishPos = fishTarget;
    } else {
      fishPos += Math.sign(diff)*step;
    }
    fishPos = clamp(fishPos, 0, 100 - FISH_HEIGHT_PCT*0.3);

    // overlap check (fish center vs bar range)
    const fishCenter = fishPos + FISH_HEIGHT_PCT*0.35;
    const barTop = barPos;
    const barBottom = barPos + BAR_HEIGHT_PCT;
    const inside = fishCenter >= barTop && fishCenter <= barBottom;

    if(inside){
      progress += FILL_RATE*dt;
    } else {
      progress -= DRAIN_RATE*dt;
    }
    progress = clamp(progress, 0, 100);

    // render
    bar.style.top = barPos + '%';
    fish.style.top = fishPos + '%';
    gaugeFill.style.height = progress + '%';
    bar.style.filter = inside ? 'brightness(1.25)' : 'brightness(1)';

    if(progress >= 100){
      endGame(true);
      return;
    }
    if(progress <= 0){
      endGame(false);
      return;
    }

    requestAnimationFrame(loop);
  }

  function startHold(e){
    if(e) e.preventDefault();
    holding = true;
  }
  function endHold(e){
    if(e) e.preventDefault();
    holding = false;
  }

  stage.addEventListener('pointerdown', startHold);
  window.addEventListener('pointerup', endHold);
  window.addEventListener('pointercancel', endHold);
  stage.addEventListener('touchstart', startHold, {passive:false});
  window.addEventListener('touchend', endHold, {passive:false});
  window.addEventListener('touchcancel', endHold, {passive:false});

  retryBtn.addEventListener('click', function(e){
    e.stopPropagation();
    if(gameWon){
      markFishingWin();
    } else {
      resetGame();
    }
});
  retryBtn.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
  retryBtn.addEventListener('touchstart', function(e){ e.stopPropagation(); }, {passive:true});

  resetGame();
})();
