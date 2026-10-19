/* 💝 ゆずから受け取る — encrypted inbox importer (shared by 健康ノート & 人生設計ノート).
   Reads data/inbox/index.json + <id>.enc (AES-GCM, PBKDF2-SHA256). Never deletes or overwrites:
   the app adapter's apply() only appends / fills empty fields. Imported ids are remembered. */
(function(){
var C=null,IDX=null,ITEMS=[],KEY=null;
function ub(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})}
function b64(a){return btoa(String.fromCharCode.apply(null,new Uint8Array(a)))}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function done(){return lsGet(C.prefix+"_inbox_done",[])}
function markDone(ids){var d=done();ids.forEach(function(i){if(d.indexOf(i)<0)d.push(i)});lsSet(C.prefix+"_inbox_done",d)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function md(s){if(!s)return"";var p=s.split("-");return (+p[1])+"/"+(+p[2])}
async function loadIndex(){try{var r=await fetch(C.base+"index.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw 0;IDX=await r.json()}catch(e){IDX=null}return IDX}
function pending(){if(!IDX||!IDX.items)return[];var d=done();return IDX.items.filter(function(x){return x.app===C.app&&d.indexOf(x.id)<0})}
function badge(){var n=pending().length;document.querySelectorAll(".yzInBadge").forEach(function(b){b.textContent=n>9?"9+":n;b.style.display=n?"inline-flex":"none"});document.querySelectorAll(".yzInDot").forEach(function(b){b.style.display=n?"block":"none"})}
async function getKey(){if(KEY)return KEY;var raw=lsGet(C.prefix+"_inbox_k",null);if(raw&&raw.s===IDX.kdf.salt){KEY=await crypto.subtle.importKey("raw",ub(raw.k),"AES-GCM",false,["decrypt"]);return KEY}return null}
async function deriveKey(pw){var k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveBits"]);
 var bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:ub(IDX.kdf.salt),iterations:IDX.kdf.iter},k,256);
 return {raw:b64(bits),key:await crypto.subtle.importKey("raw",bits,"AES-GCM",false,["decrypt"])}}
async function decryptOne(key,meta){var r=await fetch(C.base+meta.id+".enc?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("fetch");var e=await r.json();
 var pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:ub(e.iv),additionalData:new TextEncoder().encode(e.aad)},key,ub(e.ct));
 var it=JSON.parse(new TextDecoder().decode(pt));it.id=meta.id;return it}
function css(){if(document.getElementById("yzInCss"))return;var T=C.theme,s=document.createElement("style");s.id="yzInCss";
 s.textContent=".yzInBadge{display:none;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;margin-left:8px;border-radius:11px;background:"+T.badge+";color:"+T.badgefg+";font-size:13px;font-weight:800;vertical-align:2px;box-shadow:0 0 0 2px "+T.badgering+";animation:yzInP 1.6s ease-in-out infinite}@keyframes yzInP{50%{transform:scale(1.12)}}"+
 "#yzInOv .row{display:flex;gap:10px;align-items:flex-start;padding:11px 10px;border-radius:14px;background:"+T.rowbg+";margin-top:8px}#yzInOv .row input{width:22px;height:22px;flex:none;margin-top:2px;accent-color:"+T.acc+"}#yzInOv .row .ic{font-size:22px;flex:none;line-height:1.1}#yzInOv .row .tx{flex:1;min-width:0}#yzInOv .row .tt{font-weight:800;font-size:15.5px;line-height:1.4}#yzInOv .row .mt{font-size:12px;opacity:.75;margin-top:3px;line-height:1.5;word-break:break-all}#yzInOv .row .cf{font-size:12.5px;margin-top:5px;color:"+T.warn+";font-weight:700}#yzInOv .row .ok{font-size:12.5px;margin-top:5px;opacity:.7}#yzInOv .row.off{opacity:.55}#yzInOv .sec{display:inline-block;font-size:11px;font-weight:800;padding:1px 8px;border-radius:9px;background:"+T.sub+";color:"+T.acc+";margin-right:4px}";
 document.head.appendChild(s)}
function sheet(inner){var T=C.theme,ov=document.getElementById("yzInOv");if(!ov){ov=document.createElement("div");ov.id="yzInOv";
 ov.style.cssText="position:fixed;inset:0;z-index:2147482000;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center";ov.onclick=function(e){if(e.target===ov)close()};document.body.appendChild(ov)}
 ov.innerHTML='<div style="background:'+T.bg+';color:'+T.fg+';width:100%;max-width:560px;border-radius:24px 24px 0 0;padding:18px 16px calc(env(safe-area-inset-bottom) + 20px);max-height:88vh;overflow:auto;font-family:-apple-system,\'Hiragino Sans\',sans-serif;box-sizing:border-box;'+(T.border?"border-top:1px solid "+T.border:"")+'"><div style="font-size:20px;font-weight:800;color:'+T.acc+'">💝 ゆずから受け取る</div>'+inner+'</div>';return ov}
var BT="display:block;width:100%;padding:14px;border:0;border-radius:16px;font-size:17px;font-weight:800;margin-top:10px;box-sizing:border-box;";
function close(){var o=document.getElementById("yzInOv");if(o)o.remove()}
function say(m){var d=document.createElement("div");d.textContent=m;d.style.cssText="position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 30px);transform:translateX(-50%);z-index:2147483001;background:#333;color:#fff;padding:9px 16px;border-radius:999px;font-size:14px;opacity:.95";document.body.appendChild(d);setTimeout(function(){d.remove()},2000)}
function msg(t){var T=C.theme;sheet('<div style="font-size:15px;line-height:1.7;margin:12px 0 4px">'+t+'</div><button id="yzInX" style="'+BT+'background:'+T.sub+';color:'+T.acc+'">とじる</button>');document.getElementById("yzInX").onclick=close}
function askPw(err){var T=C.theme;sheet('<div style="font-size:14px;line-height:1.6;margin:8px 0">ゆずが届けた内容はカギつきだよ🔑 最初の1回だけ、いつものパスワード（便利ノートと同じ）を入れてね。次からは自動でひらくよ♡</div>'+
 '<input id="yzInPw" type="password" autocomplete="current-password" placeholder="パスワード" style="width:100%;box-sizing:border-box;padding:13px;border-radius:14px;border:1px solid '+T.acc+';font-size:17px;background:'+T.rowbg+';color:'+T.fg+'">'+
 '<div id="yzInE" style="font-size:13px;color:'+T.warn+';min-height:18px;margin-top:6px">'+(err||"")+'</div>'+
 '<button id="yzInGo" style="'+BT+'background:'+T.btn+';color:'+T.btnfg+'">🔓 ひらく</button><button id="yzInX" style="'+BT+'background:transparent;color:'+T.fg+';opacity:.7;font-weight:600">とじる</button>');
 var i=document.getElementById("yzInPw");i.focus();document.getElementById("yzInX").onclick=close;
 var go=async function(){var v=(i.value||"").trim().toLowerCase().replace(/[\s\-ー－]/g,"");if(!v)return;document.getElementById("yzInE").textContent="ひらいてるよ…🔑";
  try{var d=await deriveKey(v),first=pending()[0];await decryptOne(d.key,first);lsSet(C.prefix+"_inbox_k",{s:IDX.kdf.salt,k:d.raw});KEY=d.key;open()}catch(e){askPw("パスワードがちがうみたい…もう一回ためしてね🥺")}};
 document.getElementById("yzInGo").onclick=go;i.onkeydown=function(e){if(e.key==="Enter")go()}}
async function open(){css();msg("確認してるよ…💝");await loadIndex();badge();
 if(!IDX){msg("ゆずのお届け箱にアクセスできなかったよ。ネットにつないでもう一回ためしてね🥺");return}
 var P=pending();if(!P.length){msg("いまは新しいお届けはないよ😊<br>ゆずがメールからノートに入れたいものを見つけたら、ボタンに<b>数字</b>がつくからね♡");return}
 var key=await getKey();if(!key){askPw();return}
 try{ITEMS=[];for(var j=0;j<P.length;j++){try{ITEMS.push(await decryptOne(key,P[j]))}catch(e){if(e&&e.name==="OperationError"){try{localStorage.removeItem(C.prefix+"_inbox_k")}catch(x){}KEY=null;askPw("パスワードが変わったみたい。もう一回入れてね🔑");return}}}}catch(e){msg("読み込めなかったよ🥺 もう一回ためしてね");return}
 ITEMS.sort(function(a,b){return (a.date||"")<(b.date||"")?-1:1});preview()}
function preview(){var T=C.theme,h="";
 ITEMS.forEach(function(it,i){var d=C.describe(it);it._d=d;var chk=d.ok&&!d.conflict&&!d.same;
  h+='<label class="row'+(d.ok?"":" off")+'"><input type="checkbox" data-i="'+i+'"'+(chk?" checked":"")+(d.ok?"":" disabled")+'><span class="ic">'+esc(d.icon)+'</span><span class="tx"><div class="tt">'+esc(d.label)+'</div>'+
  '<div class="mt"><span class="sec">'+esc(d.section)+'</span>📅 '+esc(md(it.date))+(it.src&&it.src.subject?' ・ ✉️ '+esc(it.src.subject):"")+(it.src&&it.src.date?'（'+esc(md(it.src.date))+'）':"")+'</div>'+
  (it.note?'<div class="mt">💬 '+esc(it.note)+'</div>':"")+
  (d.conflict?'<div class="cf">⚠️ '+esc(d.conflict)+'</div>':"")+(d.same?'<div class="ok">✓ '+esc(d.same)+'</div>':"")+(!d.ok?'<div class="cf">'+esc(d.why||"このノートでは取り込めない内容だよ")+'</div>':"")+'</span></label>'});
 sheet('<div style="font-size:14px;line-height:1.6;margin:6px 0 2px">ゆずがメールから見つけた内容だよ♡ 入れたいものにチェックして「取り込む」を押してね。<b>今までの記録は消えたり上書きされたりしないよ。</b></div>'+h+
  '<button id="yzInGo" style="'+BT+'background:'+T.btn+';color:'+T.btnfg+'"></button><button id="yzInSkip" style="'+BT+'background:'+T.sub+';color:'+T.acc+';font-size:14.5px">チェックしていないものは受け取らない</button><button id="yzInX" style="'+BT+'background:transparent;color:'+T.fg+';opacity:.7;font-weight:600">あとで</button>');
 var ov=document.getElementById("yzInOv"),cbs=[].slice.call(ov.querySelectorAll("input[data-i]"));
 function cnt(){var n=cbs.filter(function(c){return c.checked}).length,g=document.getElementById("yzInGo");g.textContent=n?"💝 取り込む（"+n+"件）":"チェックがないよ";g.disabled=!n;g.style.opacity=n?1:.5}
 cbs.forEach(function(c){c.onchange=cnt});cnt();
 document.getElementById("yzInX").onclick=close;
 document.getElementById("yzInSkip").onclick=function(){var ids=cbs.filter(function(c){return !c.checked}).map(function(c){return ITEMS[+c.dataset.i].id});
  if(!ids.length){say("チェックしてないものはないよ");return}if(!confirm(ids.length+"件を受け取らないでおく？（ノートには何も入らないよ）"))return;markDone(ids);badge();close();say("わかった、見送ったよ😊")};
 document.getElementById("yzInGo").onclick=function(){var sel=cbs.filter(function(c){return c.checked}).map(function(c){return ITEMS[+c.dataset.i]});if(!sel.length)return;
  var r;try{r=C.apply(sel)}catch(e){console.error(e);say("ごめんね、うまく入らなかった🥺");return}
  var same=ITEMS.filter(function(it){return it._d&&it._d.same&&sel.indexOf(it)<0}).map(function(it){return it.id});
  markDone(sel.map(function(x){return x.id}).concat(same));badge();close();say("💝 "+(r||sel.length)+"件取り込んだよ♡")}}
window.yzInbox={init:function(cfg){C=cfg;css();loadIndex().then(badge);document.addEventListener("visibilitychange",function(){if(!document.hidden)loadIndex().then(badge)})},open:open,_reload:function(){return loadIndex().then(badge)}};
})();
