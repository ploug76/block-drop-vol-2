/* BLOCK DROP 2: Pixel Quest — a FIVE8NINE Studios game (Vol 2 of Block Drop). Built on kit.js. */
(function(){'use strict';
const {X}=K;const clamp=K.clamp,lerp=K.lerp,rand=K.rand;
K.FONT='"Lilita One","Arial Rounded MT Bold",system-ui,sans-serif';
const MONO='"Courier New",ui-monospace,monospace';
const SAVEK='block-drop-2-save-v1';
const save=K.load(SAVEK,{stars:{},unlocked:1,best:{marathon:0,sprint:0,ultra:0},muted:false,seenIntro:false,seenHow:false,ghost:true});
K.au.muted=save.muted;const persist=()=>K.store(SAVEK,save);
/* ---------- pieces (SRS) ---------- */
const SH={I:[[0,1],[1,1],[2,1],[3,1]],O:[[1,0],[2,0],[1,1],[2,1]],T:[[1,0],[0,1],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],Z:[[0,0],[1,0],[1,1],[2,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]]};
const COL={I:'#3ee8ff',O:'#ffe03a',T:'#c25cff',S:'#4cff6a',Z:'#ff4a6a',J:'#4a7cff',L:'#ff9a2e',G:'#7a7f99',Y:'#ffffff'};
const KICK={JLSTZ:[[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],[[0,0],[1,0],[1,1],[0,-2],[1,-2]],[[0,0],[1,0],[1,-1],[0,2],[1,2]],[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]]],
 I:[[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],[[0,0],[-1,0],[2,0],[-1,-2],[2,1]],[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],[[0,0],[1,0],[-2,0],[1,2],[-2,-1]]]};
function cells(t,r){const n=t==='I'?4:t==='O'?4:3;let c=SH[t].map(([x,y])=>[x,y]);if(t==='O')return c;for(let i=0;i<r;i++)c=c.map(([x,y])=>[n-1-y,x]);return c}
/* ---------- worlds & stages ---------- */
const WORLDS=[
 {n:'Neon Arcade',sky:['#1a0638','#5a1070'],acc:'#ff3ec8',acc2:'#3ee8ff',bg:'grid',seed:11,key:57,bpm:132},
 {n:'Pixel Jungle',sky:['#06281a','#1a5a2a'],acc:'#7dff5a',acc2:'#ffe03a',bg:'jungle',seed:23,key:55,bpm:124},
 {n:'Deep Blue Grid',sky:['#021a3a','#0a4a7a'],acc:'#3ee8ff',acc2:'#7dffd8',bg:'ocean',seed:37,key:53,bpm:116},
 {n:'Lava Core',sky:['#2a0606','#7a1a06'],acc:'#ff8a2e',acc2:'#ffe03a',bg:'lava',seed:41,key:52,bpm:140},
 {n:'Cyber Space',sky:['#02020f','#1a0a4a'],acc:'#ffffff',acc2:'#c25cff',bg:'space',seed:59,key:50,bpm:148}];
const BOSSES=['Glitchy','Vine Byte','Bit Shark','Magma Cube','The Glitch King'];
// per world: lines, dig, gems, survive, lines(speed), boss
const STAGES=[];WORLDS.forEach((w,wi)=>{const L=1+wi*2;
 STAGES.push({w:wi,type:'lines',goal:10+wi*4,lvl:L,par:70+wi*15,name:'Clear '+(10+wi*4)+' lines'});
 STAGES.push({w:wi,type:'dig',rows:4+wi,lvl:L,par:60+wi*15,name:'Dig out the junk'});
 STAGES.push({w:wi,type:'gems',goal:4+wi,rows:5+wi,lvl:L+1,par:80+wi*15,name:'Free '+(4+wi)+' gems'});
 STAGES.push({w:wi,type:'survive',time:60+wi*10,every:Math.max(5,9-wi),lvl:L+1,par:0,name:'Survive the rising junk'});
 STAGES.push({w:wi,type:'lines',goal:14+wi*4,lvl:L+3,par:90+wi*15,name:'Speed run: '+(14+wi*4)+' lines'});
 STAGES.push({w:wi,type:'boss',hp:16+wi*6,every:Math.max(6,12-wi),lvl:L+2,par:120+wi*20,name:'BOSS: '+BOSSES[wi]})});
STAGES.forEach((s,i)=>{s.i=i;s.label=(s.w+1)+'-'+(i%6+1)});
const SONGS=WORLDS.map(w=>K.compose(w.seed,{key:w.key,bpm:w.bpm,drum:w.bg==='ocean'?'half':'four',wave:{lead:'square',bass:'triangle'},scale:[0,3,5,7,10,12,15,17]}));
const SONG_T=K.compose(5,{key:57,bpm:118,drum:'half',scale:[0,2,4,7,9,12,14,16]});
/* ---------- audio ---------- */
const AU=K.au;Object.assign(K.SFX,{move(){AU.tone(320,.03,'square',.05)},rot(){AU.tone(520,.05,'square',.07,700)},lock(){AU.tone(160,.08,'triangle',.18,90);AU.noise(.05,.06,900)},
 hard(){AU.tone(220,.12,'square',.12,60);AU.noise(.12,.18,700)},hold(){AU.tone(440,.06,'sine',.12,660);AU.tone(660,.06,'sine',.1,880,.06)},
 clear(n){const b=[523,659,784,1047];for(let i=0;i<n+1;i++)AU.tone(b[Math.min(3,i)],.14,'square',.11,null,i*.06);AU.noise(.25,.12,4000,'highpass')},
 quad(){[523,659,784,1047,1319].forEach((f,i)=>AU.tone(f,.2,'square',.12,null,i*.07));AU.noise(.5,.2,5000,'highpass',.1)},
 tspin(){AU.tone(300,.3,'sawtooth',.12,1200)},gem(){AU.tone(1568,.12,'sine',.12,2093);AU.tone(2093,.1,'sine',.08,null,.08)},
 garbage(){AU.tone(90,.25,'sawtooth',.16,50);AU.noise(.2,.1,400)},over(){[392,330,262,196].forEach((f,i)=>AU.tone(f,.3,'square',.12,null,i*.18))},
 win(){[523,659,784,1047,784,1047].forEach((f,i)=>AU.tone(f,.18,'square',.11,null,i*.1))},boss(){AU.tone(110,.4,'sawtooth',.18,55)},count(){AU.tone(880,.08,'square',.1)}});
/* ---------- background renderer ---------- */
const stars=[];for(let i=0;i<120;i++)stars.push({x:Math.random(),y:Math.random(),z:Math.random(),p:Math.random()*6});
function drawBG(wi,t,dim){const w=WORLDS[wi],W=K.W,H=K.H;const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,w.sky[0]);g.addColorStop(1,w.sky[1]);X.fillStyle=g;X.fillRect(0,0,W,H);
 for(const s of stars){const tw=.4+.6*Math.abs(Math.sin(t*1.5+s.p));X.fillStyle=`rgba(255,255,255,${(w.bg==='space'?.9:.45)*tw*s.z})`;const y=w.bg==='space'?(s.y*H+t*40*s.z)%H:s.y*H*.55;X.fillRect(s.x*W,y,1+s.z*1.5,1+s.z*1.5)}
 if(w.bg==='grid'){const hy=H*.58;const sg=X.createLinearGradient(0,hy-H*.25,0,hy);sg.addColorStop(0,'#ffe03a');sg.addColorStop(1,'#ff3ec8');X.fillStyle=sg;const r=Math.min(W,H)*.2;X.beginPath();X.arc(W/2,hy,r,Math.PI,0);X.fill();
  X.fillStyle=w.sky[0];for(let i=0;i<6;i++)X.fillRect(W/2-r,hy-i*r*.16-4,r*2,2+i*.6);
  X.strokeStyle='rgba(255,62,200,.55)';X.lineWidth=1.5;for(let i=-12;i<=12;i++){X.beginPath();X.moveTo(W/2+i*20,hy);X.lineTo(W/2+i*W*.18,H);X.stroke()}
  for(let i=0;i<14;i++){const y=hy+Math.pow((i+(t*.8)%1)/14,2)*(H-hy);X.beginPath();X.moveTo(0,y);X.lineTo(W,y);X.stroke()}
  for(let i=0;i<9;i++){const bw=W/9,bh=H*(.08+.12*((i*37)%5)/5);X.fillStyle='rgba(20,0,40,.85)';X.fillRect(i*bw,hy-bh,bw-4,bh);X.fillStyle='rgba(62,232,255,.5)';for(let j=0;j<bh/10;j++)if((i*7+j*3)%4===0)X.fillRect(i*bw+6+(j%3)*8,hy-bh+6+j*10,3,3)}}
 else if(w.bg==='jungle'){for(let l=0;l<3;l++){X.fillStyle=['#0a3a1a','#0f4a22','#15602a'][l];for(let i=0;i<8;i++){const x=((i*W/6+l*40+t*(4+l*6))%(W+120))-60,y=H*(.35+l*.2);X.beginPath();X.ellipse(x,y,50+l*12,24+l*8,Math.sin(i+l)*.6,0,6.283);X.fill();X.fillRect(x-4,y,8,H)}}
  X.fillStyle='rgba(255,224,58,.6)';for(let i=0;i<20;i++){const x=(i*97+Math.sin(t+i)*20)%W,y=(i*53+t*12)%H;X.fillRect(x,y,2,2)}}
 else if(w.bg==='ocean'){for(let i=0;i<6;i++){X.fillStyle=`rgba(62,232,255,${.05+i*.01})`;X.beginPath();X.moveTo(0,H*.2+i*30);for(let x=0;x<=W;x+=20)X.lineTo(x,H*.2+i*30+Math.sin(x*.02+t+i)*8);X.lineTo(W,0);X.lineTo(0,0);X.fill()}
  for(let i=0;i<30;i++){const x=(i*61%W)+Math.sin(t*2+i)*6,y=H-((t*40*(1+i%3)+i*80)%(H+40));X.strokeStyle='rgba(180,255,255,.45)';X.lineWidth=1.5;X.beginPath();X.arc(x,y,2+i%4,0,6.283);X.stroke()}
  X.fillStyle='#03304a';for(let i=0;i<12;i++){const x=i*W/11;X.beginPath();X.moveTo(x-30,H);X.quadraticCurveTo(x+Math.sin(t+i)*14,H-80-(i%3)*40,x+30,H);X.fill()}}
 else if(w.bg==='lava'){for(let i=0;i<14;i++){const x=(i*73)%W,y=H-((t*30*(1+i%2)+i*120)%(H*.9));const r=6+i%5*3;const gg=X.createRadialGradient(x,y,0,x,y,r*3);gg.addColorStop(0,'rgba(255,200,60,.8)');gg.addColorStop(1,'rgba(255,80,0,0)');X.fillStyle=gg;X.beginPath();X.arc(x,y,r*3,0,6.283);X.fill()}
  X.fillStyle='#1a0402';X.beginPath();X.moveTo(0,H);for(let x=0;x<=W;x+=30)X.lineTo(x,H*.82-((x*7)%50));X.lineTo(W,H);X.fill();X.fillStyle='rgba(255,120,30,.6)';X.fillRect(0,H-8,W,8)}
 else{X.save();X.translate(W/2,H*.4);X.rotate(t*.05);for(let i=0;i<3;i++){X.strokeStyle=`rgba(194,92,255,${.25-i*.06})`;X.lineWidth=2;X.beginPath();X.ellipse(0,0,W*(.3+i*.15),H*(.06+i*.03),0,0,6.283);X.stroke()}X.restore()}
 if(dim){X.fillStyle=`rgba(0,0,10,${dim})`;X.fillRect(0,0,W,H)}}
/* ---------- block drawing ---------- */
function block(x,y,s,c,o){o=o||{};if(o.ghost){X.strokeStyle=c;X.globalAlpha=.55;X.lineWidth=2;X.strokeRect(x+2,y+2,s-4,s-4);X.globalAlpha=.12;X.fillStyle=c;X.fillRect(x+2,y+2,s-4,s-4);X.globalAlpha=1;return}
 X.fillStyle=c;X.fillRect(x+1,y+1,s-2,s-2);X.fillStyle='rgba(255,255,255,.45)';X.fillRect(x+1,y+1,s-2,Math.max(2,s*.16));X.fillRect(x+1,y+1,Math.max(2,s*.16),s-2);
 X.fillStyle='rgba(0,0,0,.35)';X.fillRect(x+1,y+s-1-Math.max(2,s*.16),s-2,Math.max(2,s*.16));X.fillRect(x+s-1-Math.max(2,s*.16),y+1,Math.max(2,s*.16),s-2);
 X.fillStyle='rgba(255,255,255,.25)';X.fillRect(x+s*.3,y+s*.3,s*.4,s*.4);
 if(o.gem){const cx=x+s/2,cy=y+s/2,r=s*.32;X.fillStyle=`hsl(${(K.t*200+x)%360},100%,65%)`;X.shadowColor='#fff';X.shadowBlur=8;X.beginPath();X.moveTo(cx,cy-r);X.lineTo(cx+r,cy);X.lineTo(cx,cy+r);X.lineTo(cx-r,cy);X.closePath();X.fill();X.shadowBlur=0}}
/* ---------- game ---------- */
const COLS=10,ROWS=22,VIS=20;let G=null;
function newGame(mode,S){const g={mode,S,board:[],bag:[],next:[],cur:null,hold:null,canHold:true,score:0,lines:0,level:S?S.lvl:1,combo:-1,b2b:false,t:0,over:null,lockT:0,resets:0,fallT:0,clearing:null,
 gems:0,gemsTotal:0,bossHP:S&&S.type==='boss'?S.hp:0,bossMax:S&&S.type==='boss'?S.hp:0,garbT:0,das:{dir:0,t:0},soft:false,flash:0,ann:null,hurt:0,pieces:0,startT:3.2,stats:{quads:0,tspins:0}};
 for(let r=0;r<ROWS;r++)g.board.push(new Array(COLS).fill(null));
 if(mode==='marathon')g.level=1;
 if(S&&(S.type==='dig'||S.type==='gems')){for(let i=0;i<S.rows;i++)addGarbage(g,1,S.type==='gems'&&i%Math.max(1,Math.floor(S.rows/S.goal))===0&&g.gemsTotal<S.goal)}
 if(S&&S.type==='dig')g.digLeft=S.rows;
 fillNext(g);spawn(g);return g}
function fillNext(g){while(g.next.length<6){if(!g.bag.length){g.bag=['I','O','T','S','Z','J','L'];for(let i=6;i>0;i--){const j=Math.floor(Math.random()*(i+1));[g.bag[i],g.bag[j]]=[g.bag[j],g.bag[i]]}}g.next.push(g.bag.pop())}}
function spawn(g,t){t=t||g.next.shift();fillNext(g);g.cur={t,r:0,x:t==='O'?3:3,y:0};g.lockT=0;g.resets=0;g.fallT=0;g.lastRot=false;g.canHoldNow=true;
 if(collide(g,g.cur)){g.cur.y=-1;if(collide(g,g.cur))return end(g,false,'Blocked out!')}g.pieces++}
function collide(g,p,dx,dy,r){dx=dx||0;dy=dy||0;r=r==null?p.r:r;for(const [x,y] of cells(p.t,r)){const bx=p.x+x+dx,by=p.y+y+dy+2;if(bx<0||bx>=COLS||by>=ROWS)return true;if(by>=0&&g.board[by][bx])return true}return false}
function tryMove(g,dx,dy){if(!g.cur||g.clearing)return false;if(!collide(g,g.cur,dx,dy)){g.cur.x+=dx;g.cur.y+=dy;g.lastRot=false;if(dx&&onGround(g)&&g.resets<15){g.lockT=0;g.resets++}return true}return false}
function onGround(g){return collide(g,g.cur,0,1)}
function rotate(g,d){if(!g.cur||g.clearing||g.cur.t==='O'){if(g.cur&&g.cur.t==='O')K.sfx('rot');return}const from=g.cur.r,to=(from+d+4)%4;const tb=g.cur.t==='I'?KICK.I:KICK.JLSTZ;
 let kicks=tb[d>0?from:to].map(([x,y])=>d>0?[x,y]:[-x,-y]);
 for(const [kx,ky] of kicks){if(!collide(g,g.cur,kx,-ky,to)){g.cur.x+=kx;g.cur.y-=ky;g.cur.r=to;g.lastRot=true;g.kick=kx||ky;if(onGround(g)&&g.resets<15){g.lockT=0;g.resets++}K.sfx('rot');return}}}
function ghostY(g){let d=0;while(!collide(g,g.cur,0,d+1))d++;return d}
function hardDrop(g){if(!g.cur||g.clearing)return;const d=ghostY(g);g.cur.y+=d;g.score+=d*2;K.sfx('hard');K.shake=Math.max(K.shake,4+d*.25);g.trail={x:g.cur.x,t:g.cur.t,r:g.cur.r,y0:g.cur.y-d,y1:g.cur.y,life:.25};if(d)g.lastRot=false;lock(g)}
function doHold(g){if(!g.cur||!g.canHoldNow||g.clearing)return;const t=g.cur.t;if(g.hold){const h=g.hold;g.hold=t;spawn(g,h);g.pieces--}else{g.hold=t;spawn(g);g.pieces--}g.canHoldNow=false;K.sfx('hold')}
function tspinCheck(g){const p=g.cur;if(p.t!=='T'||!g.lastRot)return 0;const c=[[0,0],[2,0],[0,2],[2,2]];let n=0;for(const [x,y] of c){const bx=p.x+x,by=p.y+y+2;if(bx<0||bx>=COLS||by>=ROWS||(by>=0&&g.board[by][bx]))n++}
 if(n<3)return 0;const front={0:[[0,0],[2,0]],1:[[2,0],[2,2]],2:[[0,2],[2,2]],3:[[0,0],[0,2]]}[p.r];let f=0;for(const [x,y] of front){const bx=p.x+x,by=p.y+y+2;if(bx<0||bx>=COLS||by>=ROWS||(by>=0&&g.board[by][bx]))f++}return f===2||g.kick?2:1}
function lock(g){const p=g.cur;const ts=tspinCheck(g);let above=true;for(const [x,y] of cells(p.t,p.r)){const by=p.y+y+2;if(by>=0)g.board[by][p.x+x]={c:COL[p.t]};if(by>=2)above=false}
 g.cur=null;K.sfx('lock');if(above)return end(g,false,'Stacked too high!');
 const full=[];for(let r=0;r<ROWS;r++)if(g.board[r].every(Boolean))full.push(r);
 const n=full.length;let pts=0,msg='';
 if(n||ts){const base=ts?[400,800,1200,1600][n]:[0,100,300,500,800][n];const hard=n===4||(ts&&n>0);pts=base*g.level;if(hard&&g.b2b&&n){pts=Math.round(pts*1.5);msg='BACK-TO-BACK '}if(n)g.b2b=hard;
  msg+=ts?(ts===1?'MINI ':'')+'T-SPIN'+(n?[''," SINGLE"," DOUBLE"," TRIPLE"][n]:'')+'!':['','SINGLE','DOUBLE','TRIPLE','QUAD DROP!'][n];if(ts)g.stats.tspins++;if(n===4)g.stats.quads++}
 if(n){g.combo++;if(g.combo>0){pts+=50*g.combo*g.level;msg+=(msg?'  ':'')+'COMBO x'+g.combo}}else g.combo=-1;
 g.score+=pts;if(msg){g.ann={s:msg,t:0,big:n===4||ts>0};if(n===4)K.sfx('quad');else if(ts)K.sfx('tspin');else K.sfx('clear',n)}
 if(n){let gems=0;for(const r of full)for(const c of g.board[r])if(c&&c.gem)gems++;if(gems){g.gems+=gems;K.sfx('gem')}
  const garb=full.filter(r=>g.board[r].some(c=>c&&c.junk)).length;if(g.digLeft!=null)g.digLeft=Math.max(0,g.digLeft-garb);
  if(g.mode==='quest'&&g.S.type==='boss'){const dmg=[0,1,3,5,8][n]+(ts?2:0)+(g.combo>0?g.combo:0);g.bossHP=Math.max(0,g.bossHP-dmg);g.hurt=.4;K.float('-'+dmg,bd.x+bd.w/2,bd.y+20,'#ff6a6a',28)}
  g.clearing={rows:full,t:0};K.shake=Math.max(K.shake,n*3);
  for(const r of full){for(let c=0;c<COLS;c++){const cell=g.board[r][c];const s=bd.s;K.burst(bd.x+c*s+s/2,bd.y+(r-2)*s+s/2,[cell.c,'#fff'],3,240,{sq:1,size:1.3})}}
  if(g.board.every((row,i)=>full.includes(i)||row.every(c=>!c))){g.score+=3000*g.level;g.ann={s:'PERFECT CLEAR!',t:0,big:true};K.sfx('quad')}
  g.lines+=n;if(g.mode==='marathon'){const nl=1+Math.floor(g.lines/10);if(nl>g.level){g.level=nl;K.float('LEVEL '+nl,K.W/2,K.H*.4,'#ffe03a',32)}}}
 else spawnNext(g);checkWin(g)}
function spawnNext(g){if(!g.over)spawn(g)}
function finishClear(g){const full=g.clearing.rows;for(const r of full.sort((a,b)=>a-b)){g.board.splice(r,1);g.board.unshift(new Array(COLS).fill(null))}g.clearing=null;checkWin(g);if(!g.over)spawn(g)}
function addGarbage(g,n,gem){for(let i=0;i<n;i++){const hole=K.ri(0,COLS-1);const row=[];for(let c=0;c<COLS;c++)row.push(c===hole?null:{c:COL.G,junk:1});if(gem){const gc=(hole+K.ri(1,COLS-1))%COLS;row[gc]={c:'#3a3f5a',junk:1,gem:1};g.gemsTotal++}
  const top=g.board.shift();if(top.some(Boolean)&&g.cur){}g.board.push(row)}if(g.cur&&collide(g,g.cur)){g.cur.y-=n;if(collide(g,g.cur))end(g,false,'Pushed out by junk!')}}
function goalText(g){const S=g.S;if(g.mode==='marathon')return['LEVEL',''+g.level];if(g.mode==='sprint')return['LINES',Math.max(0,40-g.lines)+' left'];if(g.mode==='ultra')return['TIME',fmt(Math.max(0,120-g.t))];
 if(S.type==='lines')return['LINES',Math.min(g.lines,S.goal)+' / '+S.goal];if(S.type==='dig')return['JUNK ROWS',g.digLeft+' left'];if(S.type==='gems')return['GEMS',g.gems+' / '+S.goal];
 if(S.type==='survive')return['SURVIVE',fmt(Math.max(0,S.time-g.t))];return['BOSS HP',g.bossHP+' / '+g.bossMax]}
const fmt=s=>{s=Math.max(0,s);const m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x.toFixed(1)};
function checkWin(g){if(g.over)return;const S=g.S;let win=false;
 if(g.mode==='sprint'&&g.lines>=40)win=true;else if(g.mode==='ultra'&&g.t>=120)win=true;
 else if(g.mode==='quest'){if(S.type==='lines'&&g.lines>=S.goal)win=true;if(S.type==='dig'&&g.digLeft<=0)win=true;if(S.type==='gems'&&g.gems>=S.goal)win=true;if(S.type==='survive'&&g.t>=S.time)win=true;if(S.type==='boss'&&g.bossHP<=0)win=true}
 if(win)end(g,true)}
function end(g,win,why){if(g.over)return;g.over={win,why,t:0};g.cur=null;if(win){K.sfx('win');for(let i=0;i<80;i++)K.burst(K.rand(0,K.W),K.rand(-20,K.H*.3),['#ffe03a','#ff3ec8','#3ee8ff','#7dff5a'],1,200,{g:200,life:2.5,sq:1})}else{K.sfx('over');K.shake=10}
 if(g.mode==='quest'&&win){const S=g.S;let st=1;if(S.type==='survive')st=1+(g.score>=S.time*40?1:0)+(g.stats.quads+g.stats.tspins>0?1:0);else st=1+(g.t<=S.par?1:0)+(g.t<=S.par*.7||g.stats.quads+g.stats.tspins>=2?1:0);g.stars=st;save.stars[S.i]=Math.max(save.stars[S.i]||0,st);save.unlocked=Math.max(save.unlocked,S.i+2);persist()}
 if(g.mode==='marathon'&&g.score>save.best.marathon){save.best.marathon=g.score;g.newBest=true;persist()}
 if(g.mode==='ultra'&&win&&g.score>save.best.ultra){save.best.ultra=g.score;g.newBest=true;persist()}
 if(g.mode==='sprint'&&win&&(!save.best.sprint||g.t<save.best.sprint)){save.best.sprint=g.t;g.newBest=true;persist()}}
function gravity(g){const L=g.level;return Math.pow(.8-(L-1)*.007,L-1)}// seconds per row (guideline)
/* ---------- layout ---------- */
let bd={x:0,y:0,s:20,w:200,h:400};let side={};
function layout(){const W=K.W,H=K.H,s=K.safe;if(!K.land){const top=s.t+64,bot=H-s.b-30;let cs=Math.floor(Math.min((bot-top)/VIS,(W-s.l-s.r-120)/COLS));cs=Math.max(14,cs);
  bd={s:cs,w:cs*COLS,h:cs*VIS};bd.x=Math.round(s.l+10+((W-s.l-s.r-20-100)-bd.w)/2);bd.y=Math.round(top+(bot-top-bd.h)/2);side={x:bd.x+bd.w+12,w:W-s.r-12-(bd.x+bd.w+12),y:bd.y}}
 else{const top=s.t+12,bot=H-s.b-12;let cs=Math.floor((bot-top)/VIS);bd={s:cs,w:cs*COLS,h:cs*VIS};bd.x=Math.round((W-bd.w)/2);bd.y=top;side={x:bd.x+bd.w+16,w:Math.min(190,W-s.r-16-(bd.x+bd.w+16)),y:top,lx:Math.max(s.l+10,bd.x-16-170),lw:Math.min(170,bd.x-16-s.l-10)}}}
/* ---------- input (touch: drag to move, tap rotate, flick down drop, swipe up hold; no on-screen pad) ---------- */
const TOUCH={p:null,ax:0,ay:0};
/* ---------- scenes ---------- */
let RT=0;
const Title={menu:true,primary:'quest',enter(){G=null;K.music.play(SONG_T);this.fall=[];this.t=0},
 update(dt){RT+=dt;this.t+=dt;if(Math.random()<dt*3)this.fall.push({x:Math.random(),y:-40,t:K.pick(Object.keys(SH)),r:K.ri(0,3),v:rand(40,90),rot:rand(-1,1)});for(const f of this.fall)f.y+=f.v*dt;this.fall=this.fall.filter(f=>f.y<K.H+60);K.updFx(dt)},
 back(){},
 draw(){const W=K.W,H=K.H,s=K.safe;drawBG(0,RT,.15);
  for(const f of this.fall){X.save();X.translate(f.x*W,f.y);X.rotate(f.rot*f.y*.003);X.globalAlpha=.55;for(const [x,y] of cells(f.t,f.r))block(x*16-24,y*16-16,16,COL[f.t]);X.restore()}X.globalAlpha=1;
  const land=K.land;const lx=land?W*.3:W/2,ly=land?H*.36:s.t+H*.17;const sz=land?Math.min(72,W*.08):Math.min(76,W*.18);
  drawLogo(lx,ly,sz);
  K.text('PIXEL QUEST',lx,ly+sz*1.25,sz*.36,'#fff',{glow:'#ff3ec8',gb:14,stroke:'#2a0a4a',lw:4});
  // stats line
  const tot=Object.values(save.stars).reduce((a,b)=>a+b,0);K.text('★ '+tot+' / '+STAGES.length*3,lx,ly+sz*1.25+sz*.6,18,'#ffe03a',{stroke:'#000',lw:3});
  const bw=land?Math.min(330,W*.4):Math.min(360,W-40),bx=land?W*.56+(W*.44-bw)/2-s.r/2:(W-bw)/2;let by=land?s.t+20:Math.max(ly+sz*2.4,H*.42);const bh=land?Math.min(54,(H-s.t-s.b-60)/5.6):56,gap=land?8:12;
  K.button('quest',bx,by,bw,bh+6,save.unlocked>1?'▶ CONTINUE QUEST':'▶ START QUEST',{color:'#2fae4a',px:24,cb:()=>startQuest()});by+=bh+6+gap;
  const hw=(bw-gap)/2;K.button('marathon',bx,by,hw,bh,'MARATHON',{color:'#3a49c8',cb:()=>play('marathon')});K.button('sprint',bx+hw+gap,by,hw,bh,'SPRINT 40',{color:'#3a49c8',cb:()=>play('sprint')});by+=bh+gap;
  K.button('ultra',bx,by,hw,bh,'ULTRA 2:00',{color:'#3a49c8',cb:()=>play('ultra')});K.button('how',bx+hw+gap,by,hw,bh,'HOW TO PLAY',{color:'#8a3ab0',cb:()=>K.go(How,Title)});by+=bh+gap;
  K.button('sound',bx,by,hw,bh-6,save.muted?'🔇 SOUND OFF':'🔊 SOUND ON',{color:'#4a4f6a',px:17,cb:()=>{save.muted=!save.muted;K.au.muted=save.muted;K.au.apply();persist()}});
  K.button('story',bx+hw+gap,by,hw,bh-6,'🎬 STORY',{color:'#4a4f6a',px:17,cb:()=>K.go(new K.Story(STORY,()=>K.go(Title),{bg:()=>drawBG(4,RT,.3)}))});by+=bh-6+gap;
  if(!land||by+30<H-s.b){K.text('Bests  Marathon '+save.best.marathon+'  ·  Sprint '+(save.best.sprint?fmt(save.best.sprint):'--')+'  ·  Ultra '+save.best.ultra,W/2+(land?W*.28-s.r/2:0)-(land?0:0),Math.min(H-s.b-18,by+8),13,'#cfd6ff',{fam:MONO,w:700,max:land?W*.42:W-20})}
  K.logo('tl');K.drawFx()}};
function drawLogo(x,y,sz){const t=RT;X.save();const a='BLOCK',b='DROP 2';X.font=K.font(sz);
 K.text(a,x,y+Math.sin(t*2)*3,sz,'#3ee8ff',{stroke:'#0a2a5a',lw:sz*.16,glow:'#3ee8ff',gb:18});K.text(b,x,y+sz*.82+Math.sin(t*2+.6)*3,sz*1.02,'#ffe03a',{stroke:'#5a2a0a',lw:sz*.16,glow:'#ff9a2e',gb:18});X.restore()}
const STORY=[
 {t:'The Pixel Worlds ran on perfect lines: neat rows of glowing blocks, humming with music.',draw:(x,y,w,h,t)=>{drawBG(0,RT,0);X.save();X.beginPath();X.rect(x,y,w,h);X.clip();for(let r=0;r<6;r++)for(let c=0;c<8;c++)block(x+w*.1+c*w*.1,y+h*.35+r*w*.1,w*.1,K.pick?['#3ee8ff','#ff3ec8','#ffe03a','#4cff6a'][(r+c)%4]:'#fff');X.restore()}},
 {t:'Then THE GLITCH KING crashed in, scrambling the blocks and burying all five worlds in junk.',draw:(x,y,w,h,t)=>{X.fillStyle='#120018';X.fillRect(x,y,w,h);drawGlitch(x+w/2,y+h*.45,w*.35,t);for(let i=0;i<20;i++)block(x+((i*53+t*90)%w),y+((i*97)%h),w*.07,COL.G)}},
 {t:'Drop, spin and stack your way through the Neon Arcade, the Pixel Jungle, the Deep Blue Grid, the Lava Core and Cyber Space. Clear the lines. Beat the bosses. Fix the worlds!',draw:(x,y,w,h,t)=>{for(let i=0;i<5;i++){const yy=y+i*h/5;const g=X.createLinearGradient(0,yy,0,yy+h/5);g.addColorStop(0,WORLDS[i].sky[0]);g.addColorStop(1,WORLDS[i].sky[1]);X.fillStyle=g;X.fillRect(x,yy,w,h/5);K.text(WORLDS[i].n,x+w/2,yy+h/10,Math.min(26,w*.07),WORLDS[i].acc,{stroke:'#000',lw:4})}}}];
function drawGlitch(cx,cy,R,t,hurt){const c=['#ff3ec8','#3ee8ff','#ffe03a','#c25cff'];const n=6;const s=R*2/n;X.save();X.translate(cx+(hurt?Math.sin(t*60)*4:0),cy+Math.sin(t*2)*4);
 for(let r=0;r<n;r++)for(let q=0;q<n;q++){const edge=r===0||r===n-1||q===0||q===n-1;if((r===0||r===n-1)&&(q===0||q===n-1))continue;const jit=Math.random()<.06?rand(-6,6):0;block(-R+q*s+jit,-R+r*s,s,hurt?'#ffffff':edge?'#3a1a5a':'#5a2a8a')}
 // crown
 for(let i=0;i<4;i++)block(-R+s*(1+i),-R-s,s,i%3===0?'#ffe03a':'#ffb02e');
 // eyes + grin
 const blink=Math.sin(t*3)>.95;X.fillStyle=c[Math.floor(t*4)%4];X.fillRect(-R+s*1.2,-R+s*1.8,s*1.4,blink?s*.2:s*1.1);X.fillRect(R-s*2.6,-R+s*1.8,s*1.4,blink?s*.2:s*1.1);
 X.fillStyle='#000';X.fillRect(-R+s*1.6,-R+s*2.1,s*.5,s*.5);X.fillRect(R-s*2.2,-R+s*2.1,s*.5,s*.5);
 X.fillStyle='#ffe03a';for(let i=0;i<4;i++)X.fillRect(-R+s*(1+i)+2,-R+s*4,s-4,s*.6);X.restore()}
function startQuest(){if(!save.seenIntro){save.seenIntro=true;persist();K.go(new K.Story(STORY,()=>K.go(Map),{bg:()=>drawBG(4,RT,.4)}))}else K.go(Map)}
const Map={menu:true,primary:'st0',enter(){this.scroll=0;K.music.play(SONG_T);const n=Math.min(save.unlocked,STAGES.length)-1;this.primary='st'+n;K.focus='st'+n;this.want=Math.floor(n/6)},update(dt){RT+=dt;K.updFx(dt)},back(){K.go(Title)},
 down(p){this.drag={y:p.y,s:this.scroll}},move(p){if(this.drag){this.scroll=this.drag.s+(p.y-this.drag.y)}},up(){this.drag=null},
 draw(){const W=K.W,H=K.H,s=K.safe;drawBG(this.want||0,RT,.35);const land=K.land;
  K.button('back',s.l+10,s.t+10,96,44,'◀ BACK',{color:'#4a4f6a',px:17,cb:()=>K.go(Title)});K.text('WORLD MAP',W/2,s.t+32,26,'#fff',{stroke:'#000',lw:5});
  const top=s.t+66,cardH=land?112:152,gap=12;const cw=Math.min(W-s.l-s.r-24,land?W-40:560);const cx=(W-cw)/2;
  // keep focused stage visible
  const fi=K.focus&&K.focus.startsWith('st')?+K.focus.slice(2):null;if(fi!=null&&K.showFocus){const wy=top+Math.floor(fi/6)*(cardH+gap);const want=clamp(-(wy-top-40),-(5*(cardH+gap)-(H-top-s.b-20)),0);this.scroll=lerp(this.scroll,want,.2)}
  this.scroll=clamp(this.scroll,Math.min(0,-(5*(cardH+gap)-(H-top-s.b-10))),0);
  X.save();X.beginPath();X.rect(0,top-4,W,H-top);X.clip();
  for(let wi=0;wi<5;wi++){const y=top+this.scroll+wi*(cardH+gap);const w=WORLDS[wi];const lock=save.unlocked<=wi*6;
   const g=X.createLinearGradient(0,y,0,y+cardH);g.addColorStop(0,w.sky[0]);g.addColorStop(1,w.sky[1]);X.fillStyle=g;K.rr(cx,y,cw,cardH,16);X.fill();X.strokeStyle=lock?'rgba(255,255,255,.25)':w.acc;X.lineWidth=2;X.stroke();
   K.text('World '+(wi+1)+': '+w.n,cx+14,y+20,20,lock?'#888':'#fff',{align:'left',stroke:'#000',lw:4});
   const per=land?6:3,nw=(cw-28-(per-1)*8)/per,nh=land?60:52;
   for(let k=0;k<6;k++){const si=wi*6+k,S=STAGES[si];const col=k%per,row=Math.floor(k/per);const nx=cx+14+col*(nw+8),ny=y+38+row*(nh+8);const un=si<save.unlocked;
    if(ny+nh<top-4||ny>H)continue;
    K.button('st'+si,nx,ny,nw,nh,'',{dis:!un,color:S.type==='boss'?'#c02a5a':(save.stars[si]?'#2a9a40':'#d06a2a'),cb:()=>K.go(Card,si),draw:(x,y2,w2,h2)=>{K.text(un?S.label:'🔒',x+w2/2,y2+h2*.36,18,'#fff',{stroke:'#000',lw:3});if(un)K.text('★★★'.slice(0,save.stars[si]||0)+'☆☆☆'.slice(0,3-(save.stars[si]||0)),x+w2/2,y2+h2*.74,14,'#ffe03a',{stroke:'#000',lw:3})}})}}
  X.restore()}};
const Card={menu:true,primary:'go',enter(si){this.si=si},update(dt){RT+=dt},back(){K.go(Map)},
 draw(){const W=K.W,H=K.H,s=K.safe,S=STAGES[this.si],w=WORLDS[S.w];drawBG(S.w,RT,.45);const pw=Math.min(W-30,440),ph=Math.min(H-s.t-s.b-30,K.land?H-40:420),px=(W-pw)/2,py=(H-ph)/2;
  X.fillStyle='rgba(10,10,30,.88)';K.rr(px,py,pw,ph,20);X.fill();X.strokeStyle=w.acc;X.lineWidth=3;X.stroke();
  K.text('World '+(S.w+1)+' · '+w.n,W/2,py+28,18,w.acc2,{stroke:'#000',lw:3});K.text('Stage '+S.label,W/2,py+62,32,'#fff',{stroke:'#000',lw:5});
  const desc={lines:'Clear '+S.goal+' lines.',dig:'Clear all '+S.rows+' rows of grey junk at the bottom.',gems:'Free '+S.goal+' sparkling gems by clearing the junk rows they sit in.',survive:'Survive '+S.time+' seconds. Junk rises from below every '+S.every+' seconds!',boss:BOSSES[S.w]+' attacks! Clear lines to drain its HP. It throws junk at you every '+S.every+' seconds.'}[S.type];
  if(S.type==='boss')drawGlitch(W/2,py+ph*.42,Math.min(50,ph*.12),RT);
  K.para(desc,W/2,py+(S.type==='boss'?ph*.66:ph*.45),pw-40,19,'#fff',{center:true,w:700,lh:1.3});
  if(save.stars[this.si])K.text('Best: '+'★'.repeat(save.stars[this.si]),W/2,py+ph-96,18,'#ffe03a',{stroke:'#000',lw:3});
  const bw=(pw-50)/2;K.button('mapb',px+18,py+ph-70,bw,52,'◀ MAP',{color:'#4a4f6a',cb:()=>K.go(Map)});K.button('go',px+pw-18-bw,py+ph-70,bw,52,'START ▶',{color:'#2fae4a',cb:()=>{if(!save.seenHow){save.seenHow=true;persist();K.go(How,{then:()=>playQuest(this.si)})}else playQuest(this.si)}})}};
function play(mode){G=newGame(mode,null);K.go(Play)}
function playQuest(si){G=newGame('quest',STAGES[si]);K.go(Play)}
const HOWP=[
 {h:'Touch controls',t:'Drag left or right: the piece follows your finger.\nTap: rotate (tap the left edge to rotate the other way).\nDrag down: soft drop.  Flick down fast: HARD DROP.\nSwipe up: HOLD the piece.  No buttons to fumble!'},
 {h:'Score big',t:'Clear 4 rows at once for a QUAD DROP! Spin a T-block into a tight spot for a T-SPIN. Keep clearing in a row for COMBOS, and chain big clears for BACK-TO-BACK bonuses.'},
 {h:'Quest',t:'5 worlds, 30 stages: clear lines, dig out junk, free gems, survive rising junk and beat a boss at the end of every world. Win fast for 3 stars!'},
 {h:'Keyboard & controller',t:'Keyboard: ← → move, ↓ soft drop, Space hard drop, ↑ or X rotate, Z rotate back, C or Shift hold, Esc pause.\nController: D-pad/stick move, ↓ soft drop, ↑ or X hard drop, A rotate, B rotate back, Y/LB/RB hold, Start pause, Select sound. USB or Bluetooth.'}];
const How={menu:true,primary:'next',enter(o){this.o=o||{};this.p=0},update(dt){RT+=dt},back(){this.close()},close(){if(this.o.then)this.o.then();else if(this.o===Title)K.go(Title);else if(this.o.resume)K.go(Pause);else K.go(Title)},
 draw(){const W=K.W,H=K.H,s=K.safe;drawBG(2,RT,.5);const P=HOWP[this.p];const pw=Math.min(W-24,520),ph=Math.min(H-s.t-s.b-24,K.land?H-24:520),px=(W-pw)/2,py=(H-ph)/2;
  X.fillStyle='rgba(10,10,30,.9)';K.rr(px,py,pw,ph,20);X.fill();X.strokeStyle='#3ee8ff';X.lineWidth=3;X.stroke();
  K.text('HOW TO PLAY  '+(this.p+1)+'/'+HOWP.length,W/2,py+26,16,'#3ee8ff',{fam:MONO});K.text(P.h,W/2,py+60,28,'#ffe03a',{stroke:'#000',lw:4});
  K.para(P.t,W/2,py+100,pw-36,K.land?17:19,'#fff',{w:700,lh:1.32});
  const bw=(pw-50)/2;if(this.p>0)K.button('prev',px+18,py+ph-68,bw,50,'◀ BACK',{color:'#4a4f6a',cb:()=>{this.p--}});
  K.button('next',px+pw-18-bw,py+ph-68,bw,50,this.p<HOWP.length-1?'NEXT ▶':'GOT IT!',{color:'#2fae4a',cb:()=>{if(this.p<HOWP.length-1)this.p++;else this.close()}});
  K.button('x',px+pw-52,py+8,44,40,'✕',{color:'#7a2a4a',cb:()=>this.close()})}};
const Pause={menu:true,primary:'resume',startBack:true,update(dt){RT+=dt},back(){K.go(Play,true)},
 draw(){drawPlay(true);const W=K.W,H=K.H;X.fillStyle='rgba(0,0,15,.65)';X.fillRect(0,0,W,H);K.text('PAUSED',W/2,H*.24,44,'#fff',{stroke:'#000',lw:6,glow:'#3ee8ff'});
  const bw=Math.min(300,W-60),bx=(W-bw)/2;let y=H*.33;const bh=K.land?46:54,g=K.land?8:12;
  K.button('resume',bx,y,bw,bh,'▶ RESUME',{color:'#2fae4a',cb:()=>K.go(Play,true)});y+=bh+g;
  K.button('restart',bx,y,bw,bh,'↻ RESTART',{color:'#3a49c8',cb:()=>{G=newGame(G.mode,G.S);K.go(Play)}});y+=bh+g;
  K.button('phow',bx,y,bw,bh,'HOW TO PLAY',{color:'#8a3ab0',cb:()=>K.go(How,{resume:1})});y+=bh+g;
  K.button('quit',bx,y,bw,bh,G.mode==='quest'?'◀ WORLD MAP':'◀ TITLE',{color:'#7a2a4a',cb:()=>{const q=G.mode==='quest';G=null;K.go(q?Map:Title)}})}};
const Result={menu:true,primary:'next',enter(){this.t=0},update(dt){RT+=dt;this.t+=dt;K.updFx(dt)},back(){this.leave()},leave(){const q=G.mode==='quest';G=null;K.go(q?Map:Title)},
 draw(){drawPlay(true);const W=K.W,H=K.H,s=K.safe,g=G;X.fillStyle='rgba(0,0,15,.72)';X.fillRect(0,0,W,H);const win=g.over.win;
  const ttl=g.mode==='quest'?(win?(g.S.type==='boss'?BOSSES[g.S.w].toUpperCase()+' BEATEN!':'STAGE CLEAR!'):'TRY AGAIN!'):(win||g.mode==='marathon'?'GAME OVER':'TRY AGAIN!');
  K.text(g.mode!=='quest'&&win?'FINISHED!':ttl,W/2,H*.2,K.land?36:40,win?'#ffe03a':'#ff6a8a',{stroke:'#000',lw:6,max:W-30});
  let y=H*.3;if(g.mode==='quest'&&win){for(let i=0;i<3;i++){const on=i<g.stars,a=clamp((this.t-.3-i*.25)*4,0,1);X.globalAlpha=on?a:.35;K.text('★',W/2+(i-1)*56,y+10,on?54*(1+.2*(1-a)):46,on?'#ffe03a':'#555',{stroke:'#000',lw:5})}X.globalAlpha=1;y+=56}
  if(!win&&g.over.why){K.text(g.over.why,W/2,y,20,'#fff',{stroke:'#000',lw:4});y+=34}
  K.text('Score '+g.score.toLocaleString()+'   ·   Lines '+g.lines+'   ·   Time '+fmt(g.t),W/2,y,18,'#fff',{fam:MONO,w:700,max:W-20});y+=28;
  if(g.newBest){K.text('NEW BEST!',W/2,y,24,'#7dff5a',{stroke:'#000',lw:4});y+=34}
  const bw=Math.min(170,(W-60)/3),bh=52,by=Math.max(y+20,K.land?H-s.b-bh-14:H*.62);const nx=(W-(bw*3+20))/2;
  K.button('back2',nx,by,bw,bh,g.mode==='quest'?'◀ MAP':'◀ TITLE',{color:'#4a4f6a',cb:()=>this.leave()});
  K.button('again',nx+bw+10,by,bw,bh,'↻ AGAIN',{color:'#3a49c8',cb:()=>{G=newGame(g.mode,g.S);K.go(Play)}});
  const nxt=g.mode==='quest'&&win&&g.S.i+1<STAGES.length;K.button('next',nx+2*(bw+10),by,bw,bh,nxt?'NEXT ▶':g.mode==='quest'&&win?'THE END ▶':'MENU ▶',{color:'#2fae4a',cb:()=>{if(nxt){const n=g.S.i+1;G=null;K.go(Card,n)}else if(g.mode==='quest'&&win){G=null;K.go(new K.Story(ENDING,()=>K.go(Title),{bg:()=>drawBG(4,RT,.3),go:'THE END'}))}else this.leave()}});
  K.drawFx()}};
const ENDING=[{t:'The last junk row cleared with a QUAD DROP that shook all five worlds. The Glitch King blinked... and his scrambled blocks clicked neatly back into place.',draw:(x,y,w,h,t)=>{X.fillStyle='#120018';X.fillRect(x,y,w,h);drawGlitch(x+w/2,y+h*.5,w*.3,t)}},
 {t:'The Pixel Worlds glow and hum again. Thanks for playing BLOCK DROP 2! Try Marathon, Sprint and Ultra to beat your bests.',draw:(x,y,w,h,t)=>{drawBG(0,RT,0)}}];
/* ---------- play scene ---------- */
const Play={menu:false,enter(resume){if(!resume){K.parts.length=0}K.music.play(G.mode==='quest'?SONGS[G.S.w]:SONGS[G.mode==='marathon'?0:G.mode==='sprint'?3:4]);layout();TOUCH.p=null},
 resize(){layout()},pause(){if(G&&!G.over)K.go(Pause)},padLost(){this.pause()},
 down(p){if(!G||G.over||G.startT>0)return;TOUCH.p={id:p.id,lx:p.x,ly:p.y,acc:0,accY:0,moved:false,t0:p.t0,dropped:false,vy:0,lt:performance.now()}},
 move(p){const T=TOUCH.p;if(!T||T.id!==p.id||!G||!G.cur)return;const cs=Math.max(18,bd.s*.9);const now=performance.now();const dy=p.y-T.ly;T.vy=dy/Math.max(1,now-T.lt);T.lt=now;
  T.acc+=p.x-T.lx;T.lx=p.x;while(Math.abs(T.acc)>=cs){const d=Math.sign(T.acc);if(tryMove(G,d,0))K.sfx('move');T.acc-=d*cs;T.moved=true}
  if(Math.abs(p.x-p.x0)<cs*1.2||T.accY>0){T.accY+=dy;while(T.accY>=cs){if(tryMove(G,0,1))G.score+=1;T.accY-=cs;T.moved=true}}T.ly=p.y;if(Math.abs(p.y-p.y0)>14)T.moved=true},
 up(p){const T=TOUCH.p;TOUCH.p=null;if(!T||!G||G.over||p.cancel)return;const dx=p.x-p.x0,dy=p.y-p.y0;
  if(dy<-50&&Math.abs(dx)<Math.abs(dy)*.8&&p.dt<450){doHold(G);return}
  if(dy>60&&p.dt<260&&Math.abs(dx)<dy){hardDrop(G);return}
  if(T.vy>1.1&&dy>40){hardDrop(G);return}
  if(!T.moved&&p.dt<350){if(K.hit(p.x,p.y,side.holdR||{x:-9,y:-9,w:0,h:0})){doHold(G);return}rotate(G,p.x<bd.x+bd.w*.22||p.x<K.W*.18?-1:1)}},
 update(dt){RT+=dt;K.updFx(dt);const g=G;if(!g)return;if(g.ann)g.ann.t+=dt;if(g.trail){g.trail.life-=dt;if(g.trail.life<=0)g.trail=null}g.hurt=Math.max(0,g.hurt-dt);
  if(g.over){g.over.t+=dt;if(g.over.t>(g.over.win?2:1.4))K.go(Result);return}
  if(g.startT>0){const b=Math.ceil(g.startT);g.startT-=dt;if(Math.ceil(g.startT)!==b&&g.startT>0)K.sfx('count');return}
  g.t+=dt;const S=g.S;
  // keyboard / pad
  const kp=K.kp,kh=K.keys,P=K.pad.pr,PH=K.pad.held;
  if(kp.Escape||kp.KeyP||P.start){K.go(Pause);return}if(P.select){save.muted=!save.muted;K.au.muted=save.muted;K.au.apply();persist()}
  if(g.cur&&!g.clearing){if(kp.ArrowUp||kp.KeyX||P.a)rotate(g,1);if(kp.KeyZ||kp.ControlLeft||P.b)rotate(g,-1);if(kp.KeyC||kp.ShiftLeft||kp.ShiftRight||P.y||P.lb||P.rb){doHold(g)}
   if(kp.Space||P.x||P.up){hardDrop(g)}}
  const dir=(kh.ArrowLeft||kh.KeyA||PH.left?-1:0)+(kh.ArrowRight||kh.KeyD||PH.right?1:0);
  if(g.cur&&dir){if(g.das.dir!==dir){g.das={dir,t:0};if(tryMove(g,dir,0))K.sfx('move')}else{g.das.t+=dt;if(g.das.t>.17){while(g.das.t>.17+.045){g.das.t-=.045;if(!tryMove(g,dir,0))break}}}}else g.das.dir=0;
  g.soft=!!(kh.ArrowDown||kh.KeyS||PH.down);
  if(g.clearing){g.clearing.t+=dt;if(g.clearing.t>.32)finishClear(g);return}
  if(!g.cur)return;
  const grav=gravity(g);g.fallT+=dt;const step=g.soft?Math.min(grav,.035):grav;
  while(g.fallT>=step){g.fallT-=step;if(!tryMove(g,0,1)){g.fallT=0;break}else if(g.soft)g.score+=1}
  if(g.cur&&onGround(g)){g.lockT+=dt;if(g.lockT>.5)lock(g)}else if(g.cur)g.lockT=0;
  // rising junk / boss attacks
  if(g.mode==='quest'&&(S.type==='survive'||S.type==='boss')){g.garbT+=dt;if(g.garbT>=S.every){g.garbT=0;const n=S.type==='boss'?1+(S.w>=3?1:0):1;addGarbage(g,n,false);K.sfx('garbage');K.shake=Math.max(K.shake,5);if(S.type==='boss'){K.sfx('boss');g.ann={s:BOSSES[S.w]+' throws junk!',t:0}}}}
  if(g.mode==='ultra'||(g.mode==='quest'&&S.type==='survive'))checkWin(g)},
 draw(){drawPlay(false)}};
function drawPlay(still){const g=G;if(!g)return;const W=K.W,H=K.H,s=K.safe,wi=g.mode==='quest'?g.S.w:g.mode==='marathon'?Math.min(4,Math.floor((g.level-1)/3)):g.mode==='sprint'?3:4;
 layout();drawBG(wi,RT,.25);const w=WORLDS[wi];
 X.save();if(K.shake>.3)X.translate(rand(-1,1)*K.shake,rand(-1,1)*K.shake);
 // well
 X.fillStyle='rgba(5,5,20,.82)';X.fillRect(bd.x-4,bd.y-4,bd.w+8,bd.h+8);X.strokeStyle=w.acc;X.lineWidth=3;X.shadowColor=w.acc;X.shadowBlur=14;X.strokeRect(bd.x-4,bd.y-4,bd.w+8,bd.h+8);X.shadowBlur=0;
 X.strokeStyle='rgba(255,255,255,.05)';X.lineWidth=1;for(let c=1;c<COLS;c++){X.beginPath();X.moveTo(bd.x+c*bd.s,bd.y);X.lineTo(bd.x+c*bd.s,bd.y+bd.h);X.stroke()}for(let r=1;r<VIS;r++){X.beginPath();X.moveTo(bd.x,bd.y+r*bd.s);X.lineTo(bd.x+bd.w,bd.y+r*bd.s);X.stroke()}
 const cl=g.clearing;for(let r=2;r<ROWS;r++)for(let c=0;c<COLS;c++){const cell=g.board[r][c];if(!cell)continue;let col=cell.c;if(cl&&cl.rows.includes(r)){const k=cl.t/.32;if(k>.5)continue;col=Math.floor(cl.t*30)%2?'#fff':cell.c}block(bd.x+c*bd.s,bd.y+(r-2)*bd.s,bd.s,col,{gem:cell.gem})}
 if(g.trail){const t=g.trail;X.globalAlpha=t.life*2;for(const [x,y] of cells(t.t,t.r)){const gx=bd.x+(t.x+x)*bd.s;X.fillStyle=COL[t.t];X.fillRect(gx+bd.s*.2,bd.y+(t.y0+y)*bd.s,bd.s*.6,(t.y1-t.y0)*bd.s)}X.globalAlpha=1}
 if(g.cur){const p=g.cur;if(save.ghost){const gy=ghostY(g);for(const [x,y] of cells(p.t,p.r))if(p.y+y+gy>=0)block(bd.x+(p.x+x)*bd.s,bd.y+(p.y+y+gy)*bd.s,bd.s,COL[p.t],{ghost:1})}
  const flash=g.lockT>0?.5+.5*Math.sin(K.t*30):0;for(const [x,y] of cells(p.t,p.r))if(p.y+y>=0){block(bd.x+(p.x+x)*bd.s,bd.y+(p.y+y)*bd.s,bd.s,COL[p.t]);if(flash>0){X.fillStyle=`rgba(255,255,255,${flash*.25*Math.min(1,g.lockT*3)})`;X.fillRect(bd.x+(p.x+x)*bd.s,bd.y+(p.y+y)*bd.s,bd.s,bd.s)}}}
 X.restore();
 // side panels
 const mini=(t,x,y,cs)=>{if(!t)return;const c=cells(t,0);const minx=Math.min(...c.map(q=>q[0])),maxx=Math.max(...c.map(q=>q[0])),miny=Math.min(...c.map(q=>q[1])),maxy=Math.max(...c.map(q=>q[1]));const ox=x-(maxx-minx+1)*cs/2,oy=y-(maxy-miny+1)*cs/2;for(const [a,b] of c)block(ox+(a-minx)*cs,oy+(b-miny)*cs,cs,COL[t])};
 const panel=(x,y,w,h,label)=>{X.fillStyle='rgba(5,5,20,.75)';K.rr(x,y,w,h,10);X.fill();X.strokeStyle='rgba(255,255,255,.3)';X.lineWidth=1.5;X.stroke();K.text(label,x+w/2,y+12,12,w.acc2||'#9fe',{fam:MONO,w:700})};
 const [gl,gv]=goalText(g);
 if(!K.land){const sx=side.x,sw=side.w;let y=bd.y;panel(sx,y,sw,62,'HOLD');mini(g.hold,sx+sw/2,y+38,Math.min(14,sw/5));side.holdR={x:sx,y,w:sw,h:62};if(!g.canHoldNow&&g.hold){X.fillStyle='rgba(0,0,0,.45)';X.fillRect(sx,y,sw,62)}y+=70;
  panel(sx,y,sw,172,'NEXT');for(let i=0;i<4;i++)mini(g.next[i],sx+sw/2,y+38+i*36,i?Math.min(10,sw/6):Math.min(13,sw/5));y+=180;
  const stat=(l,v,col)=>{panel(sx,y,sw,50,l);K.text(v,sx+sw/2,y+33,17,col||'#fff',{fam:MONO,w:800,max:sw-6});y+=56};
  stat('SCORE',''+g.score);stat(gl,gv,'#ffe03a');stat(g.mode==='quest'?'STAGE':'LINES',g.mode==='quest'?g.S.label:''+g.lines);stat('LEVEL',''+g.level);side.statEnd=y
  // top bar
  K.text(g.mode==='quest'?WORLDS[g.S.w].n+' · '+g.S.label:{marathon:'MARATHON',sprint:'SPRINT 40',ultra:'ULTRA 2:00'}[g.mode],s.l+14,s.t+30,18,'#fff',{align:'left',stroke:'#000',lw:4,max:W-150})}
 else{const sx=side.x,sw=side.w;let y=side.y;panel(sx,y,sw,190,'NEXT');for(let i=0;i<5;i++)mini(g.next[i],sx+sw/2,y+40+i*34,i?11:14);
  const lx=side.lx,lw=side.lw;let ly=side.y+56;panel(lx,ly,lw,70,'HOLD');mini(g.hold,lx+lw/2,ly+42,14);side.holdR={x:lx,y:ly,w:lw,h:70};ly+=78;
  const stat=(l,v,col)=>{panel(lx,ly,lw,48,l);K.text(v,lx+lw/2,ly+32,16,col||'#fff',{fam:MONO,w:800,max:lw-6});ly+=54};stat('SCORE',''+g.score);stat(gl,gv,'#ffe03a');stat('LINES',''+g.lines);stat('LEVEL',''+g.level);
  K.text(g.mode==='quest'?WORLDS[g.S.w].n+' '+g.S.label:{marathon:'MARATHON',sprint:'SPRINT 40',ultra:'ULTRA'}[g.mode],lx+lw/2,side.y+22,16,'#fff',{stroke:'#000',lw:4,max:lw})}
 // boss
 if(g.mode==='quest'&&g.S.type==='boss'){const R=K.land?Math.min(40,(H-side.y-230)/2.6):clamp((bd.y+bd.h-(side.statEnd||bd.y+480)-40)/2.4,14,side.w*.36);const bx=side.x+side.w/2,by=K.land?side.y+250+R:(side.statEnd||bd.y+480)+R+16;drawGlitch(bx,by,R,RT,g.hurt>0);
  const hw=side.w,hx=side.x,hy=by+R+12;X.fillStyle='#300';X.fillRect(hx,hy,hw,8);X.fillStyle='#ff3e6a';X.fillRect(hx,hy,hw*g.bossHP/g.bossMax,8);X.strokeStyle='#fff';X.strokeRect(hx,hy,hw,8)}
 // buttons: pause/mute (no d-pad)
 if(!still){K.button('pause',W-s.r-56,s.t+8,48,44,'II',{color:'#3a49c8',nofocus:1,cb:()=>K.go(Pause)});K.button('mute',W-s.r-110,s.t+8,48,44,save.muted?'🔇':'🔊',{color:'#3a49c8',nofocus:1,px:20,cb:()=>{save.muted=!save.muted;K.au.muted=save.muted;K.au.apply();persist()}})}
 // announcements
 if(g.ann&&g.ann.t<1.6){const a=g.ann,k=Math.min(1,a.t*5);X.globalAlpha=Math.min(1,(1.6-a.t)*2.5);K.text(a.s,bd.x+bd.w/2,bd.y+bd.h*.36-a.t*16,(a.big?30:22)*(.6+.4*K.ease.back(k)),a.big?'#ffe03a':'#fff',{stroke:'#000',lw:6,max:Math.max(bd.w+40,W*.9),glow:a.big?'#ff3ec8':null});X.globalAlpha=1}
 if(g.startT>0&&!still){const n=Math.ceil(g.startT);K.text(n>3?'':n>0?(g.startT<1?'GO!':''+(n-1||'GO!')):'',bd.x+bd.w/2,bd.y+bd.h*.42,64,'#fff',{stroke:'#000',lw:8,glow:w.acc});K.text(g.mode==='quest'?g.S.name:{marathon:'Clear lines. Speed rises every 10.',sprint:'Clear 40 lines, fast!',ultra:'Score big in 2 minutes!'}[g.mode],bd.x+bd.w/2,bd.y+bd.h*.58,18,'#ffe03a',{stroke:'#000',lw:4,max:bd.w+60})}
 K.drawFx()}
/* ---------- boot ---------- */
window.__BD={get G(){return G},STAGES,save,play,playQuest,K,
 bot(on){this._bot=on},hard(){G&&hardDrop(G)},rot(d){G&&rotate(G,d)},mv(d){G&&tryMove(G,d,0)},hold(){G&&doHold(G)},
 // QA autoplayer: picks the placement with the best simple heuristic (like a person thinking), then performs moves
 tick(){const g=G;if(!g||!g.cur||g.over||g.clearing||g.startT>0)return null;let best=null;for(let r=0;r<4;r++)for(let x=-2;x<COLS;x++){const p={t:g.cur.t,r,x,y:g.cur.y};if(collide(g,p))continue;let y=0;while(!collide(g,p,0,y+1))y++;
   const b=g.board.map(row=>row.map(c=>!!c));for(const [cx,cy] of cells(p.t,r)){const by=p.y+cy+y+2;if(by>=0)b[by][p.x+cx]=true}let lines=0,holes=0,hgt=0,bump=0;const hs=[];for(let c=0;c<COLS;c++){let h=0,seen=false;for(let rr=0;rr<ROWS;rr++){if(b[rr][c]){if(!seen){h=ROWS-rr;seen=true}}else if(seen)holes++}hs.push(h);hgt+=h}for(let c=1;c<COLS;c++)bump+=Math.abs(hs[c]-hs[c-1]);for(const row of b)if(row.every(Boolean))lines++;
   const sc=lines*7.6-holes*35-hgt*.51-bump*1.8;if(!best||sc>best.sc)best={sc,r,x}}
  if(!best)return null;g.cur.r=best.r;g.cur.x=best.x;if(collide(g,g.cur)){return null}hardDrop(g);return best}};
K.loadImages({logo:'logo589.webp'},()=>{});
K.start(Title);
})();
