/* ゆずのミュージック v1 — 🎼 オルゴール / 💕 幸せノートの曲（切り替え・日替わり） */
(function(){
const C=window.YM_CFG||{};const OK=C.onKey,TK=C.trackKey,DEF=C.defTrack||"orgel";
const TR={orgel:{f:"orgel.mp3",len:51.42857142857143,name:"🎼 オルゴール"},love:{f:"bgm.mp3",len:43.63634920634921,name:"💕 ふたりの曲"}};if(C.tracks)for(const k in C.tracks)Object.assign(TR[k],C.tracks[k]);
const isOn=C.isOn||(()=>localStorage.getItem(OK)!=="0"),setOn=C.setOn||(v=>localStorage.setItem(OK,v?"1":"0"));
let ctx=null,gain=null,duckG=null,src=null,cur=null,bufs={},started=false,ducked=false,vol=C.vol!=null?C.vol:0.45;
const choice=()=>{const t=localStorage.getItem(TK);return TR[t]||t==="daily"?t:DEF};
function pick(){let t=choice();if(t==="daily"){const d=new Date();t=Math.floor((d.getTime()-d.getTimezoneOffset()*6e4)/864e5)%2?"love":"orgel"}return t}
function ensure(){if(ctx)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ctx=new A();gain=ctx.createGain();gain.gain.value=vol;duckG=ctx.createGain();duckG.gain.value=ducked?0:1;gain.connect(duckG);duckG.connect(ctx.destination);ctx.onstatechange=ui}
function load(t){return bufs[t]=bufs[t]||fetch(TR[t].f).then(r=>r.arrayBuffer()).then(a=>new Promise((ok,ng)=>ctx.decodeAudioData(a,ok,ng))).catch(e=>{delete bufs[t];throw e})}
async function play(){if(!isOn())return;try{ensure();if(!ctx)return;const pr=ctx.state!=="running"?ctx.resume():null;started=true;const t=pick();if(src&&cur===t){await pr;ui();return}
 stop();cur=t;const buf=await load(t);if(pr)await pr;if(!isOn()||cur!==t||src)return;
 const d=buf.getChannelData(0);let n0=0;while(n0<d.length&&Math.abs(d[n0])<1e-4&&n0<buf.sampleRate*0.2)n0++;
 const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;s.loopStart=n0/buf.sampleRate;s.loopEnd=Math.min(buf.duration,s.loopStart+TR[t].len);
 gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(vol,ctx.currentTime+1.5);s.connect(gain);s.start(0,s.loopStart);src=s;window.__bgm={ctx,src,track:t};ui()}catch(e){console.warn(e);started=false}}
function stop(){if(src){try{src.stop()}catch(e){}src.disconnect();src=null}ui()}
function toggle(){setOn(!isOn());if(isOn())play();else stop();ui();if(C.onToggle)C.onToggle(isOn())}
function setTrack(t){localStorage.setItem(TK,t);ui();if(isOn()&&(src||started)){stop();play()}}
function playing(){return!!(src&&ctx&&ctx.state==="running")}
function ui(){const on=isOn();document.querySelectorAll("[data-ym-btn]").forEach(b=>{b.classList.toggle("off",!on);b.textContent=on?"🎵":"🔇";b.setAttribute("aria-label",on?"音楽ON":"音楽OFF")});
 document.querySelectorAll("[data-ym-set]").forEach(b=>b.textContent=on?"🎵 音楽：ON（タップでOFF）":"🔇 音楽：OFF（タップでON）");
 const ch=choice();document.querySelectorAll("[data-ym-track]").forEach(b=>b.classList.toggle("on",b.dataset.ymTrack===ch));
 document.querySelectorAll("[data-ym-now]").forEach(e=>e.textContent=(ch==="daily"?"日替わり → 今日は ":"今の曲： ")+TR[pick()].name);if(C.onUi)C.onUi(on,playing())}
function cardHTML(cls){cls=cls||"ymchip";return `<div class="ymwrap"><div class="ymrow">${["orgel","love","daily"].map(t=>`<button type="button" class="${cls}" data-ym-track="${t}">${t==="daily"?"📅 日替わり":TR[t].name}</button>`).join("")}</div><div class="ymnow" data-ym-now></div><button type="button" class="ymset" data-ym-set></button></div>`}
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-ym-btn],[data-ym-set],[data-ym-track]");if(!el)return;e.stopPropagation();e.preventDefault();
 if(el.dataset.ymTrack)setTrack(el.dataset.ymTrack);else toggle()},true);
const locked=C.locked||(()=>false);
const first=e=>{if(e.target.closest&&e.target.closest("[data-ym-btn],[data-ym-set],[data-ym-track]"))return;if(isOn()&&!started&&!locked())play()};
["pointerdown","touchend","click"].forEach(n=>document.addEventListener(n,first,true));
document.addEventListener("visibilitychange",()=>{if(!ctx)return;if(document.hidden)ctx.suspend().catch(()=>{});else if(isOn()&&src)ctx.resume().catch(()=>{})});
const st=document.createElement("style");st.textContent=`.ymrow{display:flex;gap:6px;flex-wrap:wrap}.ymchip{flex:1;min-width:30%;padding:10px 4px;border-radius:14px;border:2px solid #f4b6cc;background:#fff;color:#c24d7a;font-weight:700;font-size:14px}.ymchip.on{background:linear-gradient(90deg,#ff8fb1,#ffb86b);color:#fff;border-color:transparent}.ymnow{font-size:13px;margin:8px 0;opacity:.8}.ymset{width:100%;padding:11px;border-radius:14px;border:0;background:#fde3ec;color:#b03a68;font-weight:700;font-size:15px}
.ymfab{position:fixed;right:10px;top:calc(env(safe-area-inset-top) + 8px);z-index:7000;width:44px;height:44px;min-height:44px;padding:0;border-radius:50%;font-size:20px;background:#fff;border:0;box-shadow:0 0 10px #ff8fb1}.ymfab.off{opacity:.55;filter:grayscale(1)}`;document.head.appendChild(st);
if(C.fab){const b=document.createElement("button");b.type="button";b.className="ymfab";b.setAttribute("data-ym-btn","");document.body.appendChild(b)}
window.YuzuMusic={play,stop,toggle,setTrack,cardHTML,ui,duck(on){ducked=on;if(duckG&&ctx)duckG.gain.setTargetAtTime(on?0:1,ctx.currentTime,on?.08:.6)},setVol(v){vol=v;if(gain&&ctx)gain.gain.setTargetAtTime(v,ctx.currentTime,.05)},get ctx(){return ctx},get playing(){return playing()},get on(){return isOn()},get track(){return pick()}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ui);else ui();
})();
