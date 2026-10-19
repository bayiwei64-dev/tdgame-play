const canvas=document.getElementById('canvas');
const cover=document.getElementById('cover');
const startButton=document.getElementById('start');
const pauseButton=document.getElementById('pause');
const soundButton=document.getElementById('sound');
const restartButton=document.getElementById('restart');
const statusLabel=document.getElementById('status');
const errorBox=document.getElementById('error');
let game=null;
let state='ready';
let muted=false;
function message(title,description,button){
  document.getElementById('cover-title').textContent=title;
  document.getElementById('cover-description').textContent=description;
  startButton.textContent=button;
  cover.hidden=false;
}
function fail(error){
  state='error';statusLabel.textContent='加载失败';
  errorBox.hidden=false;errorBox.textContent=`游戏未能启动：${String(error)}。请重新加载页面后重试。`;
  startButton.disabled=false;startButton.textContent='重新加载';
}
function pause(){
  if(state!=='playing')return;
  state='paused';game.gamePaused=true;
  game.ccall('web_set_audio_enabled',null,['number'],[0]);
  statusLabel.textContent='已暂停';pauseButton.textContent='继续';
  document.getElementById('cover-kicker').textContent='防线已暂停，操作不会丢失';
  message('暂停中','点击继续，回到游戏。','继续试玩 →');
}
function resume(){
  if(state!=='paused')return;
  state='playing';game.gamePaused=false;cover.hidden=true;
  game.ccall('web_set_audio_enabled',null,['number'],[muted?0:1]);
  statusLabel.textContent='试玩中';pauseButton.textContent='暂停';canvas.focus();
}
startButton.addEventListener('click',async()=>{
  if(state==='paused'){resume();return;}
  if(state==='finished'||state==='error'){location.reload();return;}
  if(state!=='ready')return;
  state='loading';startButton.disabled=true;startButton.textContent='正在加载…';statusLabel.textContent='正在加载游戏资源';
  try{
    if(typeof createTdGame!=='function')throw new Error('游戏文件未找到');
    game=await createTdGame({
      canvas,noInitialRun:true,gamePaused:false,
      print:(text)=>{if(String(text).includes('冷却'))statusLabel.textContent='时间停止技能冷却中';},
      printErr:(text)=>console.error(text),
      setStatus:(text)=>{if(text&&state==='loading')statusLabel.textContent='正在加载游戏资源';},
      onAbort:(reason)=>fail(reason),onGameError:fail,
      onGameFinished:(won)=>{
        state='finished';statusLabel.textContent=won?'防守成功':'本次防守结束';pauseButton.disabled=true;
        document.getElementById('cover-kicker').textContent='本次试玩已结束';
        message(won?'防守成功':'村庄失守',won?'所有波次已结束。可以重新开始，尝试不同的布防。':'重新开始，再调整一下炮塔位置。','再玩一次 →');
      }
    });
    game.callMain([]);
    if(state==='error')return;
    state='playing';cover.hidden=true;document.querySelector('.poster').hidden=true;startButton.disabled=false;statusLabel.textContent='试玩中';
    pauseButton.disabled=soundButton.disabled=restartButton.disabled=false;
    canvas.focus();
  }catch(error){if(error!=='unwind')fail(error);}
});
pauseButton.addEventListener('click',()=>state==='paused'?resume():pause());
soundButton.addEventListener('click',()=>{
  muted=!muted;soundButton.textContent=muted?'声音：关':'声音：开';soundButton.setAttribute('aria-pressed',String(muted));
  game.ccall('web_set_audio_enabled',null,['number'],[muted||state==='paused'?0:1]);
  if(state==='playing')canvas.focus();
});
restartButton.addEventListener('click',()=>location.reload());
canvas.addEventListener('contextmenu',(event)=>event.preventDefault());
canvas.addEventListener('keydown',(event)=>{
  if(['KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyQ','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
  if(event.code==='Escape'){event.preventDefault();pause();}
});
window.addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
canvas.addEventListener('click',()=>{if(state==='playing')canvas.focus();});
