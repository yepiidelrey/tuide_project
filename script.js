const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shell = document.querySelector('.game-shell');
const $ = id => document.getElementById(id);

// ===== REPLACEABLE IMAGES =====
// Put your own PNG/WebP files in assets/ with these exact names.
const bg = new Image(); bg.src = 'assets/iceland.jpg';
const characterImg = new Image(); characterImg.src = 'assets/karakter_2.png';
const characterImages = ['karakter_2.png','karakter_3.png','karakter_4.png','karakter_5.png','karakter_6.png','karakter_7.png','karakter_8.png','karakter_9.png','karakter_10.png'].map(name=>{const img=new Image();img.src=`assets/${name}`;return img;});
const powerImages = {poison:new Image(),shield:new Image(),speed:new Image()};
powerImages.poison.src='assets/poison.png'; powerImages.shield.src='assets/shield.png'; powerImages.speed.src='assets/speed.png';
const characterAttackImages=['serangankarakter1.png','serangankarakter2.png','serangankarakter3.png'].map(name=>{const img=new Image();img.src=`assets/${name}`;return img;});
const bossAttackImages=[
  ['assets/boss_attack1.png','assets/boss_attack1.jpg','assets/boss_attack1.webp'],
  ['assets/boss_attack2.png','assets/boss_attack2.jpg','assets/boss_attack2.webp'],
  ['assets/boss_attack3.png','assets/boss_attack3.jpg','assets/boss_attack3.webp']
].map(loadImageCandidates);
const giftClosedImg=new Image();giftClosedImg.src='assets/gift_closed.png';
const giftOpenImg=new Image();giftOpenImg.src='assets/gift_open.png';
const giftRewardImg=new Image();giftRewardImg.src='assets/gift_reward.jpg';

const sheepImg = new Image(); sheepImg.src = 'assets/sheep.png';
const starImg = new Image(); starImg.src = 'assets/star.png';
const diamondImg = new Image(); diamondImg.src = 'assets/heart.png';
function loadImageCandidates(candidates){
  const img=new Image();
  let index=0;
  const tryNext=()=>{
    if(index>=candidates.length)return;
    img.src=candidates[index++];
  };
  img.onerror=tryNext;
  tryNext();
  return img;
}
const bossImages = [
  ['assets/boss1.png','assets/boss1.jpg','assets/boss1.webp'],
  ['assets/boss2.png','assets/boss2.jpg','assets/boss2.webp'],
  ['assets/boss3.png','assets/boss3.jpg','assets/boss3.webp']
].map(loadImageCandidates);
const bgImages = [
  ['assets/bg1.jpg','assets/background1.jpg','assets/bg1_boss1.jpg','assets/bg1.png','assets/background1.png'],
  ['assets/bg2.jpg','assets/background2.jpg','assets/bg2_boss2.jpg','assets/bg2.png','assets/background2.png'],
  ['assets/bg3.jpg','assets/background3.jpg','assets/bg3_boss3.jpg','assets/bg3.png','assets/background3.png']
].map(loadImageCandidates);

// Audio: replace these files with your own songs. They start after the PLAY button is clicked.
const mainBgm = new Audio('assets/sun kiss.mp3');
const danceBgm = new Audio('assets/cat.mp3');
const giftBgm = new Audio('assets/gift-bgm.mp3');
mainBgm.loop=true; danceBgm.loop=true; giftBgm.loop=false; mainBgm.volume=.55; danceBgm.volume=.7; giftBgm.volume=.85;
function syncMusic(){
  const shouldPlay = game.running && !game.paused && game.music;
  if(shouldPlay){
    if(game.victoryCelebration){
      mainBgm.pause();
      if(game.giftOpened) danceBgm.pause(); else danceBgm.play().catch(()=>{});
      if(game.giftOpened) { /* giftBgm is started exactly when the gift opens */ }
    } else {
      danceBgm.pause(); giftBgm.pause(); mainBgm.play().catch(()=>{});
    }
  }else{ mainBgm.pause(); danceBgm.pause(); giftBgm.pause(); }
}

let W=1280,H=720,dpr=1;
function resize(){
  dpr=Math.min(devicePixelRatio||1,2); W=shell.clientWidth; H=shell.clientHeight;
  canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(!game.player.y) game.player.y=H/2;
}
addEventListener('resize',resize);

const BOSS_STATS=[
  {hp:120, speedX:-55, speedY:35, ultEvery:15, shotRate:.9, ultRows:3, ultShots:5},
  {hp:200, speedX:-75, speedY:55, ultEvery:12, shotRate:1.25, ultRows:4, ultShots:6},
  {hp:280, speedX:-95, speedY:75, ultEvery:9, shotRate:1.6, ultRows:5, ultShots:7}
];
const game={
  running:false,paused:false,score:0,hp:3,time:187,power:1,boss:false,bossStage:0,bossHp:100,bossMaxHp:100,bossX:0,bossY:0,bossVX:0,bossVY:0,ultimateTimer:15,ultimateFlash:0,ultimateActive:0,victoryCelebration:false,victoryTimer:0,finaleElapsed:0,stageTransition:0,bossWait:30,giftReady:false,giftOpened:false,giftTimer:0,finalDark:0,finalGiftDelay:0,
  control:'keyboard',bgAnim:true,shake:true,music:true,sfx:true,stars:0,ownedCharacters:['karakter_2.png'],selectedCharacter:'karakter_2.png',ownedPowers:[],ownedAttacks:['serangankarakter1.png'],selectedAttack:'serangankarakter1.png',spawn:0,starSpawn:0,diamondSpawn:0,powerSpawn:0,shotCD:0,shakeTime:0,
  player:{x:90,y:360,w:90,h:90,speed:430,targetX:90,targetY:360,inv:0},
  sheep:[],pickups:[],shots:[],bossShots:[],particles:[]
};
resize();

// ===== SHOP / SAVE SYSTEM =====
const SHOP_CHARACTERS = [
  {file:'karakter_2.png', name:'Seah', price:0},
  {file:'karakter_3.png', name:'Hearin', price:100},
  {file:'karakter_4.png', name:'Hanni', price:250},
  {file:'karakter_5.png', name:'Minji', price:500},
  {file:'karakter_6.png', name:'Danielle', price:500},
  {file:'karakter_7.png', name:'Babeh', price:500},
  {file:'karakter_8.png', name:'Ha-joon ', price:500},
  {file:'karakter_9.png', name:'Eun-woo', price:500},
  {file:'karakter_10.png', name:'Seo-jun ', price:500}
];
const SHOP_ATTACKS = [
  {file:'serangankarakter1.png', name:'Lumen Shot', price:0},
  {file:'serangankarakter2.png', name:'Moon Beam', price:220},
  {file:'serangankarakter3.png', name:'Aurora Burst', price:450}
];
const SHOP_POWERS = [
  {id:'poison', name:'Poison', price:150, description:'Stronger boss damage'},
  {id:'shield', name:'Shield', price:200, description:'Absorb one hit'},
  {id:'speed', name:'Speed', price:180, description:'Move faster'}
];
function loadSave(){
  try{
    const d=JSON.parse(localStorage.getItem('tuideCatchSave')||'{}');
    if(Number.isFinite(d.stars))game.stars=Math.max(0,d.stars);
    if(Array.isArray(d.ownedCharacters)&&d.ownedCharacters.length)game.ownedCharacters=d.ownedCharacters;
    if(typeof d.selectedCharacter==='string')game.selectedCharacter=d.selectedCharacter;
    if(Array.isArray(d.ownedPowers))game.ownedPowers=d.ownedPowers;
    if(Array.isArray(d.ownedAttacks)&&d.ownedAttacks.length)game.ownedAttacks=d.ownedAttacks;
    if(typeof d.selectedAttack==='string')game.selectedAttack=d.selectedAttack;
  }catch(_){}
  const selected=characterImages.find((_,i)=>SHOP_CHARACTERS[i].file===game.selectedCharacter);
  characterImg.src=`assets/${game.selectedCharacter}`;
}
function saveGame(){localStorage.setItem('tuideCatchSave',JSON.stringify({stars:game.stars,ownedCharacters:game.ownedCharacters,selectedCharacter:game.selectedCharacter,ownedPowers:game.ownedPowers,ownedAttacks:game.ownedAttacks,selectedAttack:game.selectedAttack}));}
function renderShop(){
  $('shopStars').textContent=game.stars;
  $('characterShop').innerHTML=SHOP_CHARACTERS.map((c,i)=>{
    const owned=game.ownedCharacters.includes(c.file), equipped=game.selectedCharacter===c.file;
    return `<div class="shop-item"><div class="shop-preview"><img src="assets/${c.file}" onerror="this.style.display='none'"></div><strong>${c.name}</strong><small>${c.price?`⭐ ${c.price}`:'FREE'}</small><button class="shop-buy" data-char="${c.file}">${equipped?'EQUIPPED':owned?'EQUIP':`BUY ⭐ ${c.price}`}</button></div>`;
  }).join('');
  $('attackShop').innerHTML=SHOP_ATTACKS.map(a=>{
    const owned=game.ownedAttacks.includes(a.file), equipped=game.selectedAttack===a.file;
    return `<div class="shop-item attack-item"><div class="shop-preview"><img src="assets/${a.file}" onerror="this.style.display='none'"></div><strong>${a.name}</strong><small>${a.price?'⭐ '+a.price:'FREE'}</small><button class="shop-buy" data-attack="${a.file}">${equipped?'EQUIPPED':owned?'EQUIP':`BUY ⭐ ${a.price}`}</button></div>`;
  }).join('');
  $('powerShop').innerHTML=SHOP_POWERS.map(p=>{
    const owned=game.ownedPowers.includes(p.id);
    return `<div class="shop-item power-item"><div class="shop-preview"><img src="assets/${p.id}.png" onerror="this.style.display='none'"></div><strong>${p.name}</strong><small>${p.description}</small><button class="shop-buy" data-power="${p.id}">${owned?'OWNED':`BUY ⭐ ${p.price}`}</button></div>`;
  }).join('');
  document.querySelectorAll('[data-char]').forEach(b=>b.onclick=()=>buyOrEquipCharacter(b.dataset.char));
  document.querySelectorAll('[data-power]').forEach(b=>b.onclick=()=>buyPower(b.dataset.power));  document.querySelectorAll('[data-attack]').forEach(b=>b.onclick=()=>buyOrEquipAttack(b.dataset.attack));

}
function buyOrEquipCharacter(file){
  const c=SHOP_CHARACTERS.find(x=>x.file===file); if(!c)return;
  if(game.ownedCharacters.includes(file)){game.selectedCharacter=file;characterImg.src=`assets/${file}`;saveGame();renderShop();return;}
  if(game.stars<c.price){showToast('Not enough ⭐');return;}
  game.stars-=c.price;game.ownedCharacters.push(file);game.selectedCharacter=file;characterImg.src=`assets/${file}`;saveGame();renderShop();hud();showToast(`${c.name} unlocked!`);
}
function buyOrEquipAttack(file){
  const a=SHOP_ATTACKS.find(x=>x.file===file); if(!a)return;
  if(game.ownedAttacks.includes(file)){game.selectedAttack=file;saveGame();renderShop();showToast(`${a.name} equipped!`);return;}
  if(game.stars<a.price){showToast('Not enough ⭐');return;}
  game.stars-=a.price;game.ownedAttacks.push(file);game.selectedAttack=file;saveGame();renderShop();hud();showToast(`${a.name} unlocked!`);
}
function buyPower(id){
  const p=SHOP_POWERS.find(x=>x.id===id); if(!p||game.ownedPowers.includes(id))return;
  if(game.stars<p.price){showToast('Not enough ⭐');return;}
  game.stars-=p.price;game.ownedPowers.push(id);saveGame();renderShop();hud();showToast(`${p.name} unlocked!`);
}
function showToast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),1600);}
loadSave();

const keys=new Set();
addEventListener('keydown',e=>{
  keys.add(e.key.toLowerCase());
  if(e.code==='Space'){e.preventDefault(); attack();}
  if(e.key.toLowerCase()==='p') togglePause();
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

function setPointerTarget(e){
  const r=shell.getBoundingClientRect();
  game.player.targetX=Math.max(20,Math.min(W-game.player.w-20,e.clientX-r.left));
  game.player.targetY=Math.max(105,Math.min(H-145,e.clientY-r.top));
}
shell.addEventListener('pointermove',e=>{
  if(game.control==='mouse'||game.control==='touch') setPointerTarget(e);
});
shell.addEventListener('pointerdown',e=>{
  if(game.control==='touch'){ e.preventDefault(); setPointerTarget(e); try{shell.setPointerCapture(e.pointerId);}catch(_){} }
});
shell.addEventListener('pointerup',e=>{ if(game.control==='touch'){ try{shell.releasePointerCapture(e.pointerId);}catch(_){} } });

function bindHold(id,key){
  const b=$(id); if(!b)return;
  const down=e=>{e.preventDefault();keys.add(key);};
  const up=e=>{e.preventDefault();keys.delete(key);};
  ['pointerdown'].forEach(x=>b.addEventListener(x,down));
  ['pointerup','pointercancel','pointerleave'].forEach(x=>b.addEventListener(x,up));
}
bindHold('touchUp','arrowup'); bindHold('touchDown','arrowdown'); bindHold('touchLeft','arrowleft'); bindHold('touchRight','arrowright');
$('touchAttack')?.addEventListener('pointerdown',e=>{e.preventDefault();attack();});

function reset(){
  game.score=0;game.hp=3;game.stars=game.stars||0;game.time=187;game.power=1;game.boss=false;game.bossStage=0;game.victoryCelebration=false;game.victoryTimer=0;game.finaleElapsed=0;game.stageTransition=0;game.bossHp=100;game.bossMaxHp=100;game.bossWait=30;game.bossX=W*.83;game.bossY=H*.34;game.bossVX=0;game.bossVY=0;game.ultimateTimer=15;game.ultimateFlash=0;game.ultimateActive=0;
  game.spawn=0;game.starSpawn=0;game.diamondSpawn=0;game.powerSpawn=0;game.shotCD=0;mainBgm.currentTime=0;danceBgm.currentTime=0;giftBgm.currentTime=0;
  game.sheep=[];game.pickups=[];game.shots=[];game.bossShots=[];game.particles=[];game.giftReady=false;game.giftOpened=false;game.giftTimer=0;game.finalDark=0;game.finalGiftDelay=8;
  game.player.x=90;game.player.y=H/2;game.player.targetX=90;game.player.targetY=H/2;game.player.inv=0;
  hud();
}
function start(){reset();game.running=true;game.paused=false;$('startScreen').classList.add('hidden');$('pauseScreen').classList.add('hidden');$('gameOverScreen').classList.add('hidden');game.last=performance.now();syncMusic();}
function end(win){if(game.victoryCelebration&&game.bossStage===2&&!win)return;game.running=false;syncMusic();$('resultTitle').textContent=win?'VICTORY!':'GAME OVER';$('resultMessage').textContent=win?'Boss defeated!':'Try again and catch more sheep!';$('finalScore').textContent=game.score;$('gameOverScreen').classList.remove('hidden');}
function togglePause(){if(!game.running)return;game.paused=!game.paused;$('pauseScreen').classList.toggle('hidden',!game.paused);game.last=performance.now();syncMusic();}
function menu(){game.running=false;syncMusic();game.paused=false;$('pauseScreen').classList.add('hidden');$('gameOverScreen').classList.add('hidden');$('startScreen').classList.remove('hidden');}
$('startBtn').onclick=start;$('playAgainBtn').onclick=start;$('pauseBtn').onclick=togglePause;$('continueBtn').onclick=togglePause;$('restartBtn1').onclick=start;$('menuBtn1').onclick=menu;$('menuBtn2').onclick=menu;

$('shopBtn').onclick=()=>{renderShop();$('shopModal').classList.remove('hidden');};
$('closeShop').onclick=()=>$('shopModal').classList.add('hidden');
$('settingsBtn').onclick=()=>$('settingsModal').classList.remove('hidden');
$('closeSettings').onclick=()=>$('settingsModal').classList.add('hidden');
document.querySelectorAll('.control-option').forEach(btn=>btn.onclick=()=>{
  // Live setting: changing control must never call start(), reset(), or touch game progress.
  document.querySelectorAll('.control-option').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  game.control=btn.dataset.control;
  game.player.targetX=game.player.x;
  game.player.targetY=game.player.y;
  updateControlUI();
});
$('bgToggle').onchange=e=>game.bgAnim=e.target.checked;$('shakeToggle').onchange=e=>game.shake=e.target.checked;$('musicToggle').onchange=e=>{game.music=e.target.checked;syncMusic();};$('sfxToggle').onchange=e=>game.sfx=e.target.checked;
function updateControlUI(){ $('touchControls').classList.toggle('show',game.control==='touch'); }
updateControlUI();

function hud(){
  $('score').textContent=game.score; if($('shopStars'))$('shopStars').textContent=game.stars;
  $('hp').textContent='♥ '.repeat(Math.max(0,game.hp)).trim()||'♡ ♡ ♡';
  const s=Math.max(0,Math.ceil(game.time));$('timer').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  $('powerText').textContent=game.power;
  if($('stageLabel')){
    $('stageLabel').textContent=game.bossStage<3?`BOSS ${game.bossStage+1}/3`:'VICTORY';
    if(game.time<=0 && game.boss) $('stageLabel').textContent=`BOSS ${game.bossStage+1}/3 • FINAL PUSH`;
  }
}
function burst(x,y,color,n=10){for(let i=0;i<n;i++)game.particles.push({x,y,vx:(Math.random()-.5)*280,vy:(Math.random()-.5)*280,life:.45+Math.random()*.5,color,size:3+Math.random()*5});}
function attack(){
  if(!game.running||game.paused||game.shotCD>0)return;game.shotCD=.2;
  const n=game.power>=3?3:game.power>=2?2:1;
  for(let i=0;i<n;i++)game.shots.push({x:game.player.x+game.player.w-2,y:game.player.y+game.player.h/2,vx:720,vy:(i-(n-1)/2)*130,life:1.5,r:12,image:characterAttackImages.find(img=>img.src.endsWith(game.selectedAttack))});
  burst(game.player.x+game.player.w,game.player.y+game.player.h/2,'#fff0a5',8);
}
function spawnSheep(){game.sheep.push({x:W+100,y:110+Math.random()*Math.max(80,H-300),w:130,h:110,vx:100+Math.random()*90,rot:Math.random()*6.28,hp:1});}
function spawnPickup(type){game.pickups.push({type,x:W+50,y:110+Math.random()*Math.max(80,H-300),r:type==='diamond'?20:type==='poison'?20:17,vx:120+Math.random()*80,rot:0});}
function hurt(){if(game.player.inv>0)return;game.hp--;game.player.inv=1;game.shakeTime=game.shake?.22:0;hud();if(game.hp<=0)end(false);}
function startBoss(stage){
  const st=BOSS_STATS[stage];
  game.boss=true;
  game.bossHp=st.hp;
  game.bossMaxHp=st.hp;
  game.bossX=W*.83;
  game.bossY=H*.34;
  game.bossVX=st.speedX;
  game.bossVY=st.speedY;
  game.ultimateTimer=st.ultEvery;
  game.ultimateFlash=0;
  game.ultimateActive=0;
  game.spawn=0;
  game.sheep=[];
  game.pickups=[];
  burst(game.bossX,game.bossY,'#ff9ddd',30+stage*10);
  hud();
}

function bossHit(d){
  game.bossHp-=d;
  burst(game.bossX,game.bossY,'#ff9ddd',5+game.bossStage*2);
  if(game.bossHp<=0){
    const defeatedStage=game.bossStage;
    game.boss=false;
    game.bossShots=[];
    game.ultimateFlash=0;
    game.ultimateActive=0;
    game.score += 1000*(defeatedStage+1);
    game.stars += 100*(defeatedStage+1); saveGame();

    // Every boss defeat gets a short dance + white fantasy explosion.
    game.victoryCelebration=true;
    game.giftOpened=false;
    game.giftReady=false;
    game.finaleElapsed=0;
    game.giftTimer=0;
    game.finalDark=defeatedStage===2 ? 1 : 0;
    // Final boss: enter a dedicated ending state. It is NOT controlled by the game timer.
    game.victoryTimer=defeatedStage===2 ? 0 : 4.5;
    if(defeatedStage===2){ game.time=0; game.finalGiftDelay=3; game.finaleElapsed=0; }
    const cx=game.bossX, cy=game.bossY;
    for(let i=0;i<260;i++){
      const a=Math.random()*Math.PI*2, speed=70+Math.random()*520;
      game.particles.push({x:cx,y:cy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-80,life:1.2+Math.random()*2.8,color:'#ffffff',size:2+Math.random()*8,gravity:70});
    }
    for(let i=0;i<70;i++){
      game.particles.push({x:cx+(Math.random()-.5)*180,y:cy+(Math.random()-.5)*140,vx:(Math.random()-.5)*90,vy:-80-Math.random()*180,life:2+Math.random()*2,color:'#f8fbff',size:5+Math.random()*10,gravity:-15});
    }
    syncMusic();
    hud();
  }
}
function rectHit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function circlePlayer(p){const nx=Math.max(game.player.x,Math.min(p.x,game.player.x+game.player.w));const ny=Math.max(game.player.y,Math.min(p.y,game.player.y+game.player.h));return Math.hypot(p.x-nx,p.y-ny)<p.r;}

function update(dt){
  if(!game.running||game.paused)return;
  syncMusic();
  if(game.victoryCelebration){
    // The ending sequence is completely independent of the 3:07 gameplay timer.
    // Boss 3 defeat -> dark highlight -> dance -> gift -> open -> victory.
    if(game.bossStage===2){
      // FINAL BOSS ENDING: this state is independent of the 3:07 gameplay timer.
      // It uses its own elapsed clock so the finale cannot freeze at 00:00.
      game.finaleElapsed += dt;
      if(!game.giftReady && !game.giftOpened){
        game.finalGiftDelay=Math.max(0,game.finalGiftDelay-dt);
        if(game.finalGiftDelay<=0) game.giftReady=true;
      }
      if(game.giftOpened){
        game.giftTimer-=dt;
        if(game.giftTimer<=0){
          game.victoryCelebration=false;
          end(true);
          return;
        }
      }
      game.particles.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=(q.gravity||70)*dt;q.life-=dt;q.vx*=Math.pow(.992,dt*60);q.vy*=Math.pow(.992,dt*60);});
      game.particles=game.particles.filter(q=>q.life>0);
      return;
    }
    game.victoryTimer-=dt;
    game.particles.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=(q.gravity||70)*dt;q.life-=dt;q.vx*=Math.pow(.992,dt*60);q.vy*=Math.pow(.992,dt*60);});
    game.particles=game.particles.filter(q=>q.life>0);
    if(game.victoryTimer<=0){
      game.victoryCelebration=false;
      if(game.bossStage<2){ game.bossStage++; game.stageTransition=2.2; game.bossWait=20; syncMusic(); }
    }
    return;
  }
  game.stageTransition=Math.max(0,game.stageTransition-dt);
  // Never cut off the final-boss ending. If the gameplay timer reaches zero while
  // Boss 3 is still being fought, hold the timer at zero and let the fight/finale finish.
  if(game.time>0) game.time-=dt;
  if(game.time<=0){
    game.time=0;

    // NEVER stop an active boss fight just because the 3:07 timer reached 00:00.
    // The current boss must be defeated before the game can end.
    if(game.boss){
      // Keep the fight alive in overtime. The HUD stays at 00:00.
      // Boss 3 gets a gentle overtime damage assist so the ending can actually happen.
      if(game.bossStage===2 && game.bossHp>0){
        game.bossHp=Math.max(0, game.bossHp-dt*18);
        if(game.bossHp<=0) bossHit(1);
      }
    }else if(game.bossStage>=2){
      game.victoryCelebration=true;
      if(game.victoryTimer<=0) game.victoryTimer=16;
      game.giftReady=false;
      hud();
      return;
    }else{
      // No active boss and there is still a future boss: keep the game alive.
      hud();
    }
  }
  const p=game.player;p.inv=Math.max(0,p.inv-dt);game.shotCD=Math.max(0,game.shotCD-dt);game.shakeTime=Math.max(0,game.shakeTime-dt);

  if(game.control==='keyboard'){
    const l=keys.has('arrowleft')||keys.has('a'),r=keys.has('arrowright')||keys.has('d'),u=keys.has('arrowup')||keys.has('w'),d=keys.has('arrowdown')||keys.has('s');
    p.x+=((r?1:0)-(l?1:0))*p.speed*dt;p.y+=((d?1:0)-(u?1:0))*p.speed*dt;
  }else{
    // Mouse and Touch both move freely on X and Y.
    p.x+=(p.targetX-p.x)*Math.min(1,dt*10);p.y+=(p.targetY-p.y)*Math.min(1,dt*10);
  }
  p.x=Math.max(20,Math.min(W-p.w-20,p.x));p.y=Math.max(105,Math.min(H-150,p.y));

  game.spawn-=dt;game.starSpawn-=dt;game.diamondSpawn-=dt;
  if(!game.boss&&game.spawn<=0){spawnSheep();game.spawn=.65+Math.random()*.75;}
  if(game.starSpawn<=0){spawnPickup('star');game.starSpawn=1+Math.random()*1.4;}
  if(game.diamondSpawn<=0){spawnPickup('diamond');game.diamondSpawn=4+Math.random()*3;}
  if(game.powerSpawn<=0){spawnPickup('poison');game.powerSpawn=10+Math.random()*7;}

  // Boss timing: Boss 1 after 30 seconds; each following boss 20 seconds
  // after the previous boss's celebration ends.
  if(!game.boss && !game.victoryCelebration && game.bossStage<3){
    game.bossWait-=dt;
    if(game.bossWait<=0){
      startBoss(game.bossStage);
      game.bossWait=0;
    }
  }

  game.sheep.forEach(s=>{s.x-=s.vx*dt;s.rot+=dt*4;if(rectHit(p,s)){hurt();s.x=-300;}});game.sheep=game.sheep.filter(s=>s.x>-200);
  game.pickups.forEach(q=>{q.x-=q.vx*dt;q.rot+=dt*5;if(circlePlayer(q)){if(q.type==='star'){game.score+=10;game.stars+=10;saveGame();burst(q.x,q.y,'#ffe99b',8);}else if(q.type==='diamond'){game.score+=40;game.hp=Math.min(3,game.hp+1);burst(q.x,q.y,'#9bdfff',12);}else if(q.type==='poison'){game.power=Math.min(3,game.power+1);burst(q.x,q.y,'#b56cff',18);showToast('POISON POWER UP!');}q.x=-200;hud();}});game.pickups=game.pickups.filter(q=>q.x>-200);
  game.shots.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;game.sheep.forEach(t=>{if(Math.hypot(s.x-(t.x+t.w/2),s.y-(t.y+t.h/2))<60){s.life=0;t.hp--;burst(t.x+t.w/2,t.y+t.h/2,'#fff0a5',10);if(t.hp<=0){game.score+=25;t.x=-300;hud();}}});if(game.boss&&s.x>W*.72&&s.x<W&&s.y>H*.15&&s.y<H*.6){s.life=0;bossHit(game.power>=3?7:game.power>=2?5:3);}});game.shots=game.shots.filter(s=>s.life>0&&s.x<W+80);
  if(game.boss){
    // Boss moves freely: forward/backward (X) and up/down (Y).
    game.bossX += game.bossVX*dt;
    game.bossY += game.bossVY*dt;
    const minX=W*.60, maxX=W*.91, minY=H*.16, maxY=H*.64;
    if(game.bossX<minX || game.bossX>maxX){ game.bossX=Math.max(minX,Math.min(maxX,game.bossX)); game.bossVX*=-1; }
    if(game.bossY<minY || game.bossY>maxY){ game.bossY=Math.max(minY,Math.min(maxY,game.bossY)); game.bossVY*=-1; }
    const bst=BOSS_STATS[game.bossStage];
    if(Math.random()<dt*bst.shotRate)game.bossShots.push({x:game.bossX-55,y:game.bossY+Math.random()*70-35,vx:-330-game.bossStage*55,vy:(Math.random()-.5)*(180+game.bossStage*60),r:15+game.bossStage*2,image:bossAttackImages[game.bossStage]});

    // Ultimate every 15 seconds: warning, then a 3-wave spread attack.
    game.ultimateTimer-=dt;
    game.ultimateFlash=Math.max(0,game.ultimateFlash-dt);
    game.ultimateActive=Math.max(0,game.ultimateActive-dt);
    if(game.ultimateTimer<=0){
      game.ultimateTimer=bst.ultEvery; game.ultimateFlash=1.2; game.ultimateActive=2.4;
      burst(game.bossX,game.bossY,'#ff78d0',42+game.bossStage*10);
      const rows=bst.ultRows, shots=bst.ultShots;
      for(let row=0;row<rows;row++){
        const baseY=game.bossY+(row-(rows-1)/2)*42;
        for(let i=0;i<shots;i++){
          const spread=(row-(rows-1)/2)*55;
          game.bossShots.push({x:game.bossX-65-i*18,y:baseY,vx:-470-game.bossStage*65,vy:spread,r:17+game.bossStage*2,ultimate:true,image:bossAttackImages[game.bossStage]});
        }
      }
      // Boss 3 adds a second diagonal wave for its ultimate.
      if(game.bossStage===2){
        for(let i=0;i<7;i++) game.bossShots.push({x:game.bossX-40-i*20,y:game.bossY,vx:-520,vy:(i-3)*95,r:19,ultimate:true,image:bossAttackImages[game.bossStage]});
      }
    }
  }
  game.bossShots.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;if(circlePlayer(b)){hurt();b.x=-300;}});game.bossShots=game.bossShots.filter(b=>b.x>-300&&b.y>-100&&b.y<H+100);
  game.particles.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=180*dt;q.life-=dt;});game.particles=game.particles.filter(q=>q.life>0);
  if(game.score>=550)game.power=3;else if(game.score>=300)game.power=2; if(game.bossStage>=2)game.power=3;hud();
}

function drawBg(t){
  const currentBg=bgImages[Math.min(game.bossStage,2)];
  if(currentBg.complete&&currentBg.naturalWidth){const scale=Math.max(W/currentBg.naturalWidth,H/currentBg.naturalHeight),dw=currentBg.naturalWidth*scale,dh=currentBg.naturalHeight*scale,maxX=Math.max(0,dw-W);const shift=game.bgAnim?Math.sin(t*.00012)*18:0;ctx.drawImage(currentBg,-maxX/2+shift,-Math.max(0,(dh-H)*.52),dw,dh);}else{ctx.fillStyle='#687ab3';ctx.fillRect(0,0,W,H);} 
  if(game.stageTransition>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(.75,game.stageTransition/2.2*.75)})`;ctx.fillRect(0,0,W,H);}
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(35,40,110,.15)');g.addColorStop(1,'rgba(80,40,110,.08)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function drawImageOrFallback(img,x,y,w,h,fallback){if(img.complete&&img.naturalWidth)ctx.drawImage(img,x,y,w,h);else fallback();}
function drawSheep(s){ctx.save();ctx.translate(s.x+s.w/2,s.y+s.h/2);ctx.rotate(s.rot);ctx.shadowBlur=18;ctx.shadowColor='#ffd8ff';drawImageOrFallback(sheepImg,-55,-55,110,110,()=>{ctx.fillStyle='#fff4ff';ctx.strokeStyle='#69558f';ctx.lineWidth=4;ctx.beginPath();ctx.arc(-20,0,28,0,Math.PI*2);ctx.arc(10,-12,28,0,Math.PI*2);ctx.arc(35,2,25,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f1cbbb';ctx.beginPath();ctx.arc(50,0,23,0,Math.PI*2);ctx.fill();ctx.fillStyle='#33254d';ctx.fillRect(44,-7,5,8);ctx.fillRect(58,-7,5,8);});ctx.restore();}
function drawStar(q){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.rot);ctx.shadowBlur=20;ctx.shadowColor='#ffe99b';drawImageOrFallback(starImg,-q.r*1.5,-q.r*1.5,q.r*3,q.r*3,()=>{ctx.fillStyle='#ffe99b';ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?q.r:q.r*.42;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();});ctx.restore();}
function drawDiamond(q){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.rot*.2);ctx.shadowBlur=18;ctx.shadowColor='#aeeaff';drawImageOrFallback(diamondImg,-q.r*1.5,-q.r*1.5,q.r*3,q.r*3,()=>{ctx.fillStyle='#9be0ff';ctx.beginPath();ctx.moveTo(0,-q.r);ctx.lineTo(q.r*.8,0);ctx.lineTo(0,q.r);ctx.lineTo(-q.r*.8,0);ctx.closePath();ctx.fill();});ctx.restore();}
function drawPowerPickup(q){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.rot*.5);ctx.shadowBlur=25;ctx.shadowColor='#c875ff';drawImageOrFallback(powerImages.poison,-q.r*1.5,-q.r*1.5,q.r*3,q.r*3,()=>{ctx.fillStyle='#9d55d8';ctx.beginPath();ctx.arc(0,0,q.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#efffb7';ctx.font='900 20px Nunito';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('☠',0,1);});ctx.restore();}
function drawPlayer(){
  const p=game.player;
  const dancing=game.victoryCelebration;
  const t=performance.now()*.001;
  ctx.save();
  let bob=0, sway=0, rot=0;
  if(dancing){
    bob=Math.abs(Math.sin(t*8))*18;
    sway=Math.sin(t*8)*22;
    rot=Math.sin(t*8)*.16;
    ctx.translate(p.x+p.w/2+sway,p.y+p.h/2-bob);
    ctx.rotate(rot);
    ctx.translate(-p.w/2,-p.h/2);
  }else{
    ctx.translate(p.x,p.y);
  }
  ctx.globalAlpha=p.inv>0&&Math.floor(p.inv*10)%2===0?.45:1;
  ctx.shadowBlur=dancing?32:20;
  ctx.shadowColor=dancing?'#ffffff':'#d5b5ff';
  if(characterImg.complete&&characterImg.naturalWidth){
    ctx.drawImage(characterImg,0,0,p.w,p.h);
  }else{
    ctx.fillStyle='#eab8ff';ctx.beginPath();ctx.arc(p.w/2,30,27,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#7b48b6';ctx.fillRect(10,8,65,20);
    ctx.fillStyle='#433064';ctx.fillRect(22,29,7,10);ctx.fillRect(58,29,7,10);
    ctx.fillStyle='#c78cff';ctx.fillRect(17,52,55,28);
  }
  ctx.restore();
}
function drawBoss(){
  const x=game.bossX,y=game.bossY;
  ctx.save();ctx.translate(x,y);
  if(game.ultimateFlash>0){
    const pulse=1+Math.sin(performance.now()*.025)*.12;
    ctx.scale(pulse,pulse);
    ctx.shadowBlur=45;ctx.shadowColor='#ff5cc7';
  }else{ctx.shadowBlur=30;ctx.shadowColor='#ff8dce';}
  const currentBoss=bossImages[Math.min(game.bossStage,2)];
  if(currentBoss.complete&&currentBoss.naturalWidth){
    const bossScale=1+game.bossStage*.12;
    if(game.bossStage===1){
      // Boss 2 uses the supplied reference proportions: wider and taller, not a skinny 144x144 square.
      const bw=188, bh=242;
      ctx.drawImage(currentBoss,-bw/2,-bh/2,bw,bh);
    }else{
      ctx.drawImage(currentBoss,-72*bossScale,-72*bossScale,144*bossScale,144*bossScale);
    }
  }else{
    ctx.fillStyle='#3f315d';ctx.strokeStyle='#ff9ddd';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-70,-60);ctx.lineTo(55,-52);ctx.lineTo(76,0);ctx.lineTo(48,62);ctx.lineTo(-58,54);ctx.lineTo(-82,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffb66e';ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.fill();ctx.fillStyle='#392249';ctx.fillRect(-17,-9,10,16);ctx.fillRect(8,-9,10,16);
  }
  ctx.restore();
  ctx.fillStyle='rgba(34,20,63,.8)';ctx.fillRect(x-75,y-104,150,11);ctx.fillStyle='#67e39c';ctx.fillRect(x-75,y-104,150*(game.bossHp/game.bossMaxHp),11);ctx.fillStyle='white';ctx.font='900 15px Nunito';ctx.textAlign='center';ctx.fillText(`BOSS ${game.bossStage+1}/3`,x,y-112);
  if(game.ultimateFlash>0){ctx.fillStyle='#fff';ctx.font='900 20px Nunito';ctx.fillText('ULTIMATE READY!',x,y+105);}
}
function drawVictoryFX(t){
  if(!game.victoryCelebration)return;
  const cx=game.bossX,cy=game.bossY;
  ctx.save();
  // Expanding white rings and glow.
  const elapsed=(game.bossStage===2 ? game.finaleElapsed : 5.5-game.victoryTimer);
  for(let i=0;i<7;i++){
    const r=((elapsed*210+i*90)%720);
    const a=Math.max(0,.28-r/720);
    ctx.globalAlpha=a;
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=2+i%3;
    ctx.shadowBlur=20;
    ctx.shadowColor='#ffffff';
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  }
  // Bright central flash at the moment of defeat.
  const flash=Math.max(0,1-elapsed/.9);
  if(flash>0){
    ctx.globalAlpha=flash*.75;
    ctx.fillStyle='#ffffff';
    ctx.shadowBlur=70;ctx.shadowColor='#ffffff';
    ctx.beginPath();ctx.arc(cx,cy,80+elapsed*180,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.textAlign='center';
  ctx.font='900 34px Nunito';
  ctx.fillStyle='#ffffff';
  ctx.shadowBlur=18;ctx.shadowColor='#ffffff';
  ctx.fillText('BOSS DEFEATED!',W/2,95);
  ctx.font='800 17px Nunito';
  ctx.fillText(game.bossStage<2 ? `BOSS ${game.bossStage+1} DEFEATED — NEXT BOSS INCOMING!` : 'FINAL BOSS DEFEATED — VICTORY!',W/2,122);
  ctx.restore();
}
function drawFinalGift(t){
  if(!game.victoryCelebration || game.bossStage!==2) return;
  const elapsed=game.finaleElapsed;
  // Darken the whole screen while keeping the dancing character above the darkness.
  ctx.save();
  const dark=Math.min(.82,.55+elapsed*.035);
  ctx.fillStyle=`rgba(0,0,12,${dark})`;ctx.fillRect(0,0,W,H);
  if(game.giftReady && !game.giftOpened){
    const pulse=1+Math.sin(t*.008)*.08;
    const gx=W/2, gy=H*.62;
    ctx.save();ctx.translate(gx,gy);ctx.scale(pulse,pulse);
    ctx.shadowBlur=30;ctx.shadowColor='#fff';
    if(giftClosedImg.complete&&giftClosedImg.naturalWidth)ctx.drawImage(giftClosedImg,-65,-65,130,130);
    else{ctx.fillStyle='#dba0ff';ctx.fillRect(-55,-45,110,90);ctx.fillStyle='#fff0a5';ctx.fillRect(-10,-45,20,90);ctx.fillRect(-55,-5,110,20);}
    ctx.restore();
    ctx.textAlign='center';ctx.font='900 18px Nunito';ctx.fillStyle='#fff';ctx.fillText('A GIFT IS WAITING FOR YOU',gx,gy+92);
    ctx.font='700 14px Nunito';ctx.fillText('CLICK THE GIFT TO OPEN',gx,gy+116);
  }
  if(game.giftOpened){
    const a=Math.min(1,(game.giftTimer-1)/1.5);
    ctx.globalAlpha=Math.max(0,a);
    if(giftOpenImg.complete&&giftOpenImg.naturalWidth)ctx.drawImage(giftOpenImg,W/2-85,H*.62-85,170,170);
    if(giftRewardImg.complete&&giftRewardImg.naturalWidth){ctx.globalAlpha=Math.min(1,Math.max(0,(game.giftTimer-2)/1.2));ctx.drawImage(giftRewardImg,W/2-60,H*.62-60,120,120);}
    ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='900 28px Nunito';ctx.fillStyle='#fff';ctx.shadowBlur=20;ctx.shadowColor='#fff';ctx.fillText('GIFT UNLOCKED!',W/2,H*.35);
  }
  ctx.restore();
}

function draw(t){let sx=0,sy=0;if(game.shakeTime>0){sx=(Math.random()-.5)*9;sy=(Math.random()-.5)*9;}ctx.save();ctx.translate(sx,sy);drawBg(t);game.pickups.forEach(q=>q.type==='star'?drawStar(q):q.type==='diamond'?drawDiamond(q):drawPowerPickup(q));game.sheep.forEach(drawSheep);game.shots.forEach(s=>{if(s.image&&s.image.complete&&s.image.naturalWidth){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));ctx.shadowBlur=18;ctx.shadowColor='#fff0a5';ctx.drawImage(s.image,-24,-24,48,48);ctx.restore();}else{ctx.fillStyle='#fff0a5';ctx.shadowBlur=16;ctx.shadowColor='#fff0a5';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}});
game.bossShots.forEach(b=>{if(b.image&&b.image.complete&&b.image.naturalWidth){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.shadowBlur=b.ultimate?26:14;ctx.shadowColor='#ff5cc7';ctx.drawImage(b.image,-28,-28,56,56);ctx.restore();}else{ctx.fillStyle=b.ultimate?'#ff5cc7':'#ff8bd3';ctx.shadowBlur=b.ultimate?18:0;ctx.shadowColor='#ff5cc7';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}});if(game.boss)drawBoss();drawPlayer();game.particles.forEach(q=>{ctx.globalAlpha=Math.max(0,q.life);ctx.fillStyle=q.color;ctx.shadowBlur=q.color==='#ffffff'?12:0;ctx.shadowColor='#ffffff';ctx.fillRect(q.x,q.y,q.size,q.size);});ctx.globalAlpha=1;drawVictoryFX(t);drawFinalGift(t);if(game.victoryCelebration&&game.bossStage===2)drawPlayer();ctx.restore();}

shell.addEventListener('pointerdown',e=>{
  if(game.victoryCelebration && game.bossStage===2 && game.giftReady && !game.giftOpened){
    const r=shell.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
    const gx=W/2, gy=H*.62;
    if(Math.hypot(x-gx,y-gy)<125){
      game.giftOpened=true; game.giftTimer=5.0; game.finalGiftDelay=0; game.stars+=250; saveGame(); hud();
      danceBgm.pause(); giftBgm.currentTime=0; if(game.music) giftBgm.play().catch(()=>{});
      for(let i=0;i<100;i++){const a=Math.random()*Math.PI*2,sp=80+Math.random()*360;game.particles.push({x:gx,y:gy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-100,life:1+Math.random()*1.8,color:'#fff',size:3+Math.random()*7,gravity:50});}
    }
  }
});

function loop(t){const dt=Math.min(.033,(t-(game.last||t))/1000);game.last=t;update(dt);draw(t);requestAnimationFrame(loop);}requestAnimationFrame(loop);

window.addEventListener('beforeunload',saveGame);
