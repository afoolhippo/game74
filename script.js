'use strict';
const $=id=>document.getElementById(id),ctx=$('game').getContext('2d');ctx.imageSmoothingEnabled=false;
const imgs={};let state='title',elapsed=0,last=0,next=0,score=0,combo=0,swingUntil=0,cooldown=0,shake=0,items=[],effects=[],particles=[];
const sound={bgm:new Audio(),hit:new Audio(),perfect:new Audio()};sound.bgm.loop=true;sound.bgm.volume=.5;sound.hit.volume=.65;sound.perfect.volume=.7;
for(const [key,file] of Object.entries({bgm:'bgm.mp3',hit:'se_hit.mp3',perfect:'se_perfect.mp3'})){sound[key].src=file;sound[key].addEventListener('error',()=>{});}
function audio(a){a.currentTime=0;a.play().catch(()=>{});}
function screen(s){resetResultButtons();state=s;for(const id of ['title','play','result'])$(id).hidden=id!==s;window.scrollTo(0,0);}
function start(){elapsed=0;last=0;next=.9;score=0;combo=0;swingUntil=0;cooldown=0;items=[];effects=[];particles=[];screen('play');audio(sound.bgm);hud();}
function hud(){$('swing').textContent='打ち返す！';$('score').textContent=score;$('time').textContent=Math.ceil(Math.max(0,30-elapsed));}
function stop(){sound.bgm.pause();sound.bgm.currentTime=0;}
const GAME_ID='game74',GAME_TITLE='宿題反対！',GAME_URL='https://afoolhippo.github.io/game74/';
let resultEpoch=0,buttonWait=0,fadeWait=0,resultReady=false,finalResult=null,registering=false,registered=false,db=null;
try{if(window.supabase)db=window.supabase.createClient('https://gmncxnybsovlallxgnkd.supabase.co','sb_publishable_ly3h5OhL8HDSHhYdmJq_Fw_9pG3mhla');}catch(error){console.error(error);}
function resetResultButtons(){
 resultEpoch++;clearTimeout(buttonWait);clearTimeout(fadeWait);resultReady=false;registering=false;registered=false;
 const box=$('resultButtons');box.classList.remove('visible');box.inert=true;box.setAttribute('aria-hidden','true');
 box.querySelectorAll('button').forEach(b=>b.disabled=true);$('registerButton').textContent='記録を登録';
}
function showResult(){
 stop();const rank=score>=800?'宿題根絶':score>=400?'宿題反対':'宿題苦手';
 screen('result');finalResult=Object.freeze({score,rank});$('total').textContent=score+'点';$('rank').textContent=rank;
 const epoch=resultEpoch;buttonWait=setTimeout(()=>{
  if(state!=='result'||epoch!==resultEpoch)return;
  $('resultButtons').classList.add('visible');
  fadeWait=setTimeout(()=>{if(state!=='result'||epoch!==resultEpoch)return;
   resultReady=true;$('resultButtons').inert=false;$('resultButtons').setAttribute('aria-hidden','false');
   $('resultButtons').querySelectorAll('button').forEach(b=>b.disabled=false);
  },350);
 },1500);
}
$('start').onclick=start;$('back').onclick=()=>{stop();screen('title');};
$('retryButton').onclick=()=>{if(!resultReady)return;stop();screen('title');finalResult=null;items=[];effects=[];particles=[];};
$('arcadeButton').onclick=()=>{if(resultReady)window.location.href='https://afoolhippo.github.io/home/?skipTitle=1';};
$('shareButton').onclick=()=>{if(!resultReady||!finalResult)return;
 const text=`宿題なんて、打ち返せ！✏️📚💥\n${finalResult.score}点\n無料ブラウザゲーム「${GAME_TITLE}」\n${GAME_URL}\n#宿題反対\n#カバゲーセン`;
 window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');
};
$('registerButton').onclick=async()=>{
 if(!resultReady||!finalResult||registering||registered)return;
 const input=window.prompt('ニックネームを入力してね','匿名カバ');if(input===null||!input.trim())return;
 const epoch=resultEpoch,result=finalResult;registering=true;$('registerButton').disabled=true;$('registerButton').textContent='登録中...';
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  if(!db)throw new Error('記録登録機能を読み込めませんでした');
  const {error}=await db.from('kaba_scores').insert({game_id:GAME_ID,game_title:GAME_TITLE,nickname:input.trim(),rank_title:result.rank,score:result.score}).abortSignal(controller.signal);
  if(error)throw error;
  if(epoch!==resultEpoch||state!=='result')return;
  registered=true;$('registerButton').textContent='登録済み';window.alert('記録を登録しました！');
 }catch(error){console.error(error);if(epoch!==resultEpoch||state!=='result')return;
  $('registerButton').textContent='記録を登録';window.alert('登録に失敗しました');
 }finally{clearTimeout(timeout);if(epoch===resultEpoch&&state==='result'){registering=false;$('registerButton').disabled=!resultReady||registered;}}
};
function vibrateHit(perfect){try{if(typeof navigator.vibrate==='function')navigator.vibrate(perfect?40:20);}catch{}}
function swing(){if(state!=='play'||elapsed<cooldown)return;cooldown=elapsed+.32;swingUntil=elapsed+.17;const target=items.filter(o=>!o.hit&&Math.abs(o.x-100)<=28).sort((a,b)=>Math.abs(a.x-100)-Math.abs(b.x-100))[0];if(!target){combo=0;return;}const perfect=target.x>=112;target.hit=true;target.vx=240;target.vy=perfect?-150:-90;combo++;const points=(perfect?30:10)+Math.min(20,Math.floor(combo/5)*5);score+=points;vibrateHit(perfect);audio(perfect?sound.perfect:sound.hit);effects.push({text:perfect?'大反対！':'反対！',sub:`+${points}${combo>1?'  '+combo+'れんぞく':''}`,life:.65,x:120,y:65,perfect});shake=perfect?4:2;for(let i=0;i<(perfect?16:8);i++)particles.push({x:100,y:139,vx:(Math.random()-.5)*150,vy:(Math.random()-.7)*150,life:.4,color:i%2?'#ff83aa':'#ffe044'});hud();}
$('swing').onpointerdown=e=>{e.preventDefault();swing();};$('game').onpointerdown=e=>{e.preventDefault();swing();};window.onkeydown=e=>{if((e.code==='Space'||e.code==='Enter')&&state==='play'){e.preventDefault();if(!e.repeat)swing();}};
function spawn(){const type=Math.floor(Math.random()*4);items.push({type,x:260,y:139,base:139,vx:-(65+elapsed*1.8+type*7),vy:0,angle:0,hit:false,phase:Math.random()*6});next=elapsed+Math.max(.43,1.15-elapsed*.02)+(Math.random()*.28);}
function update(dt){elapsed+=dt;if(elapsed>=30){showResult();return;}if(elapsed>=next&&elapsed<28.6)spawn();for(const o of items){o.x+=o.vx*dt;if(o.hit){o.vy+=160*dt;o.y+=o.vy*dt;o.angle+=dt*8;}else{o.y=o.base+Math.sin(elapsed*5+o.phase)*(o.type===0?5:2);o.angle=Math.sin(elapsed*4+o.phase)*.12;if(o.x<72){o.dead=true;combo=0;effects.push({text:'あっ…',sub:'',life:.35,x:75,y:90,perfect:false});}}}items=items.filter(o=>!o.dead&&o.x<285&&o.y<260);effects.forEach(e=>{e.life-=dt;e.y-=dt*14;});effects=effects.filter(e=>e.life>0);particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;});particles=particles.filter(p=>p.life>0);shake*=.8;hud();}
function draw(){ctx.save();ctx.fillStyle='#f0ddb2';ctx.fillRect(0,0,240,240);ctx.translate(Math.round((Math.random()-.5)*shake),0);ctx.fillStyle='#714725';ctx.fillRect(10,22,220,126);ctx.fillStyle='#2c614e';ctx.fillRect(15,27,210,115);ctx.fillStyle='#d1b278';ctx.fillRect(0,160,240,80);ctx.fillStyle='#ad824d';for(let y=168;y<240;y+=16)ctx.fillRect(0,y,240,2);for(let y=168;y<240;y+=16)for(let x=(y%32?15:45);x<240;x+=60)ctx.fillRect(x,y,2,16);ctx.strokeStyle='#38200f';ctx.lineWidth=4;ctx.strokeRect(72,112,56,58);ctx.strokeStyle=items.some(o=>!o.hit&&!o.dead&&Math.abs(o.x-100)<=28)?'#ff3535':'#fffaf0';ctx.lineWidth=2;ctx.strokeRect(72,112,56,58);
// Keep feet and waist aligned despite the source poses having different placements.
if(elapsed<swingUntil)ctx.drawImage(imgs.swing,6,88,134,134);else ctx.drawImage(imgs.ready,-18,81,138,138);
for(const o of items){ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));ctx.rotate(o.angle);const w=imgs.sheet.width/2,h=imgs.sheet.height/2;ctx.drawImage(imgs.sheet,(o.type%2)*w,Math.floor(o.type/2)*h,w,h,-22,-22,44,44);ctx.restore();}for(const p of particles){ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),3,3);}ctx.textAlign='center';for(const e of effects){ctx.font='19px DotGothic16, monospace';ctx.lineWidth=4;ctx.strokeStyle='#39200e';ctx.strokeText(e.text,e.x,e.y);ctx.fillStyle=e.perfect?'#ffe43d':'#ff92b3';ctx.fillText(e.text,e.x,e.y);ctx.font='11px DotGothic16, monospace';ctx.fillStyle='#fff4df';ctx.fillText(e.sub,e.x,e.y+17);}ctx.restore();}
function frame(t){const dt=last?Math.min((t-last)/1000,.04):0;last=t;if(state==='play'&&!document.hidden){update(dt);draw();}requestAnimationFrame(frame);}document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)sound.bgm.pause();else if(state==='play')sound.bgm.play().catch(()=>{});});
Promise.all([document.fonts.load('19px DotGothic16').catch(()=>{}),...Object.entries({ready:'hippo_ready.png',swing:'hippo_swing.png',sheet:'homework_sheet.png'}).map(([key,src])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{imgs[key]=im;resolve();};im.onerror=reject;im.src=src;}))]).then(()=>{$('start').disabled=false;$('start').textContent='ゲームスタート！';requestAnimationFrame(frame);}).catch(()=>{$('start').textContent='画像を読み込めませんでした';});
