/* 💌 由依から — paste box (v2: auto-receive + 受け取る button). Own key only (window.GY_CFG.key); never touches other keys. */
(function(){
var GYV="gy3";var C=window.GY_CFG||{},K=C.key,T=C.theme||{};if(!K)return;
function jd(){var d=new Date(Date.now()+9*3600e3);return d.toISOString().slice(0,10)}
function jt(){return new Date(Date.now()+9*3600e3).toISOString().slice(11,16)}
function ld(){try{var a=JSON.parse(localStorage.getItem(K)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
function sv(a){localStorage.setItem(K,JSON.stringify(a))}
var DK=K+"_del";function ldD(){try{var a=JSON.parse(localStorage.getItem(DK)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function toast(m){var t=document.createElement("div");t.textContent=m;t.style.cssText="position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:"+(T.acc||"#e2457a")+";color:#fff;padding:10px 18px;border-radius:20px;z-index:99999;font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,.2)";document.body.appendChild(t);setTimeout(function(){t.remove()},1800)}
var st=document.createElement("style");st.textContent=
".gyCard{background:"+(T.bg||"linear-gradient(135deg,#fff,#ffeef6)")+";border:2px dashed "+(T.bd||"#ffb3cf")+";border-radius:18px;padding:14px;margin:12px 0;color:"+(T.fg||"#5a3a45")+";text-align:left}"+
".gyCard h3{margin:0 0 4px;font-size:17px;color:"+(T.acc||"#e2457a")+"}.gyCard .gyh{font-size:12.5px;opacity:.8;margin-bottom:8px;line-height:1.5}"+
".gyCard textarea{width:100%;box-sizing:border-box;min-height:96px;border:1.5px solid "+(T.bd||"#ffb3cf")+";border-radius:12px;padding:10px;font-size:15px;font-family:inherit;background:"+(T.in||"#fff")+";color:inherit;resize:vertical}"+
".gyCard .gyb{display:block;width:100%;margin-top:8px;border:0;border-radius:14px;padding:12px;font-size:16px;font-weight:800;color:#fff;background:"+(T.btn||"linear-gradient(90deg,#ff8fb8,#ff6fa0)")+"}"+
".gyE{background:"+(T.ebg||"#fff")+";border-radius:12px;padding:10px;margin-top:8px;border-left:4px solid "+(T.acc||"#e2457a")+"}.gyE .gyd{font-size:12px;opacity:.7;margin-bottom:4px}.gyE .gyt{white-space:pre-wrap;word-break:break-word;font-size:14.5px;line-height:1.6}"+
".gyE .gyr{display:flex;gap:6px;justify-content:flex-end;margin-top:6px}.gyE .gyr button{border:1px solid "+(T.bd||"#ffb3cf")+";background:"+(T.sbg||"#fff5f9")+";color:"+(T.acc||"#e2457a")+";border-radius:10px;padding:6px 10px;font-size:13px}"+
".gyCard .gyz{font-size:13px;opacity:.65;text-align:center;margin-top:8px}";
document.head.appendChild(st);
function list(){var a=ld().slice().sort(function(x,y){return (y.date+y.time+y.id)<(x.date+x.time+x.id)?-1:1});
 if(!a.length)return '<div class="gyz">まだないよ。ゆいのメッセージを貼ってね♡</div>';
 return a.map(function(e){return '<div class="gyE"><div class="gyd">📅 '+esc(e.date.replace(/-/g,"/"))+(e.time?" "+esc(e.time):"")+(e.src==="auto"?' ✨自動でとどいたよ':'')+'</div><div class="gyt">'+esc(e.text)+'</div><div class="gyr"><button data-gyc="'+esc(e.id)+'">📋 コピー</button><button data-gyx="'+esc(e.id)+'">🗑 けす</button></div></div>'}).join("")}
function html(){return '<h3>💌 由依から</h3><div class="gyh">由依が書いてくれたメッセージを貼って「保存」してね。日付つきで残って、「💌 ゆずに送る」にも入るよ♡（このiPhoneの中だけに保存）</div><textarea class="gyIn" placeholder="ここに貼り付けてね…"></textarea><button class="gyb gyS">💾 保存</button><button class="gyb gyR" style="opacity:.92">📥 由依から受け取る</button><div class="gyst" style="font-size:11.5px;opacity:.6;text-align:right;margin-top:4px">'+stTxt()+'</div><div class="gyL">'+list()+'</div>'}
var ST="";function stTxt(){return esc((C.ver?C.ver+" / ":"")+GYV+(ST?" ・ "+ST:""))}
function fill(){document.querySelectorAll("[data-gy]").forEach(function(el){if(!el.dataset.gyOk){el.dataset.gyOk=1;el.className="gyCard";el.innerHTML=html();setTimeout(function(){pull()},300)}})}
function refresh(){document.querySelectorAll(".gyCard .gyL").forEach(function(l){l.innerHTML=list()});document.querySelectorAll(".gyCard .gyst").forEach(function(l){l.innerHTML=stTxt()})}
document.addEventListener("click",function(ev){var b=ev.target.closest&&ev.target.closest("button");if(!b)return;
 if(b.classList.contains("gyR")){last=0;pull(true);return}
 if(b.classList.contains("gyS")){var ta=b.parentNode.querySelector(".gyIn"),v=ta.value.trim();if(!v){toast("貼り付けてから保存してね");return}
  var a=ld();a.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),date:jd(),time:jt(),text:v});sv(a);ta.value="";refresh();toast("💾 保存したよ♡");return}
 var id=b.getAttribute("data-gyc");if(id){var e=ld().filter(function(x){return x.id===id})[0];if(!e)return;
  var done=function(){toast("📋 コピーしたよ")};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(e.text).then(done,function(){fb(e.text);done()});else{fb(e.text);done()}return}
 id=b.getAttribute("data-gyx");if(id){if(!confirm("このメッセージをけす？（もとにもどせないよ）"))return;var de=ld().filter(function(x){return x.id===id})[0];if(de&&de.src==="auto"){var dl=ldD();if(dl.indexOf(id)<0){dl.push(id);localStorage.setItem(DK,JSON.stringify(dl.slice(-500)))}}sv(ld().filter(function(x){return x.id!==id}));refresh();toast("けしたよ")}});
function fb(t){var x=document.createElement("textarea");x.value=t;x.style.cssText="position:fixed;opacity:0";document.body.appendChild(x);x.select();try{document.execCommand("copy")}catch(e){}x.remove()}
new MutationObserver(fill).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fill);else fill();
/* add grokYuzu: [[date,time,text],...] (entries of that day) to the YUZU-DATA objects; existing fields untouched */
function forDay(d,cut){return ld().filter(function(e){return e.date===d}).sort(function(x,y){return x.time<y.time?-1:1}).map(function(e){return [e.date,e.time||"",cut&&e.text.length>cut?e.text.slice(0,cut)+"…":e.text]})}
function add(o,cut){if(!o||typeof o!=="object")return o;var d=o.date||o.sel||jd(),g=forDay(d,cut);if(!g.length)return o;var r=Object.assign({},o);r.grokYuzu=g;if(cut&&g.some(function(x){return /…$/.test(x[2])}))r.grokCut=1;return r}
function wrap(){var f=window.yuzuSend;if(!f||f.__gy)return;var w=function(opt){try{if(opt){opt=Object.assign({},opt);if(opt.levels&&opt.levels.length){var L=opt.levels,z=L[L.length-1];opt.levels=L.map(function(l,i){return Object.assign({},l,{data:add(l.data,i?300:0)})}).concat([Object.assign({},z,{data:add(z.data,60)})])}if(opt.full)opt.full=add(opt.full,0)}}catch(e){}return f.call(this,opt)};w.__gy=1;window.yuzuSend=w}
wrap();window.addEventListener("load",wrap);
/* auto-receive: data/grok-yuzu.json (published by ゆず), merged by id; fails silently */
function locked(){var l=document.getElementById("lock");if(l&&!l.classList.contains("hide"))return true;return !!document.getElementById("pwLock")}
var busy=0,last=0;
function hm(){return jt()}
function pull(manual){if(busy)return;if(locked()){if(manual)toast("先にパスワードでひらいてね🔑");return}if(!manual&&Date.now()-last<15000)return;busy=1;last=Date.now();
 var u=new URL("data/grok-yuzu.json",location.href);u.searchParams.set("t",Date.now());
 fetch(u.toString(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(function(j){busy=0;if(!j||!Array.isArray(j.messages))throw new Error("形式がちがう");
  var a=ld(),have={},del=ldD(),n=0;a.forEach(function(x){have[x.id]=1});
  j.messages.forEach(function(m){if(!m||!m.id||!m.text)return;var id="auto-"+m.id;if(have[id]||del.indexOf(id)>=0)return;a.push({id:id,date:String(m.date||jd()),time:String(m.time||""),text:String(m.text),src:"auto"});have[id]=1;n++});
  if(n)sv(a);ST=hm()+" チェック ✓"+(n?" 新しく"+n+"件":"（新しいのなし・公開"+j.messages.length+"件）");refresh();
  if(n)toast("💌 由依から "+n+"件とどいたよ♡");else if(manual)toast("新しいメッセージはないよ（ぜんぶ受け取りずみ）")}).catch(function(e){busy=0;ST=hm()+" 受け取れなかった: "+(e&&e.message||e);refresh();if(manual)toast("受け取れなかったよ… "+(e&&e.message||e))})}
setInterval(function(){if(locked())return;if(!pull.done){pull.done=1;last=0;pull()}else if(document.visibilityState==="visible"&&Date.now()-last>120000)pull()},1500);
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")pull()});
window.addEventListener("focus",pull);window.addEventListener("pageshow",pull);
window.GrokYuzu={pull:function(){last=0;pull()},entries:ld,forDay:forDay};
})();
