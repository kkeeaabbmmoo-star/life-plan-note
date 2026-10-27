(function(){
var B='https://kkeeaabbmmoo-star.github.io/';
var N=[['yotei-note','㊙ 予定 💗','linear-gradient(135deg,#2f6bff,#4b2bbf)','#fff'],
['benri-note','📝 便利ノート 💚','linear-gradient(135deg,#2ec4a0,#0f8a8a)','#fff'],
['yuzu-health-note','🍊 健康ノート 💛','linear-gradient(135deg,#ffc83d,#ff7a1a)','#fff'],
['life-plan-note','🧭 人生設計 ⭐','linear-gradient(135deg,#14213d,#0a1128)','#ffd76a'],
['love-note','💖 超幸せノート ✨','linear-gradient(135deg,#d6194f,#7b2cbf)','#fff'],
['omoide-benri','💞 みんなの思い出 🌸','linear-gradient(135deg,#ff8fb3,#d0567f)','#fff']];
var me=location.pathname.split('/').filter(Boolean)[0]||'';
function build(){
 if(document.getElementById('yz-nav'))return document.getElementById('yz-nav');
 var s=document.createElement('style');
 s.textContent='#yz-nav{position:relative;z-index:5;margin:28px auto 24px;max-width:560px;padding:16px 14px 18px;border-radius:22px;background:rgba(255,255,255,.88);border:3px solid #fff;box-shadow:0 6px 22px rgba(120,30,80,.28);font-family:-apple-system,"Hiragino Sans",sans-serif;box-sizing:border-box;width:calc(100% - 24px)}#yz-nav h3{margin:0 0 12px;text-align:center;font-size:17px;color:#c2185b;font-weight:800}#yz-nav .g{display:grid;grid-template-columns:1fr 1fr;gap:12px}#yz-nav a{display:flex;align-items:center;justify-content:center;min-height:58px;padding:10px 8px;border-radius:18px;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.28);font-weight:800;font-size:15px;text-decoration:none;text-align:center;line-height:1.3;-webkit-tap-highlight-color:transparent}#yz-nav a:active{transform:scale(.96)}';
 document.head.appendChild(s);
 var d=document.createElement('nav');d.id='yz-nav';
 var h='<h3>💖 ほかのノートへ 💖</h3><div class="g">';
 N.forEach(function(n){if(n[0]!==me)h+='<a href="'+B+n[0]+'/" data-n="'+n[0]+'" style="background:'+n[2]+';color:'+n[3]+'">'+n[1]+'</a>';});
 d.innerHTML=h+'</div>';return d;}
function put(){var d=build();if(document.body.lastElementChild!==d)document.body.appendChild(d);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',put);else put();
window.addEventListener('load',put);[800,2500,6000].forEach(function(t){setTimeout(put,t)});
/* 💞 みんなの思い出: 最新の投稿日をボタンに小さく（公開の data/latest.json を読むだけ） */
setTimeout(function(){if(me==='omoide-benri')return;fetch(B+'omoide-benri/data/latest.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){if(!j||!j.latest)return;var a=document.querySelector('#yz-nav a[data-n="omoide-benri"]');if(!a||a.querySelector('small'))return;var t=new Date(Date.now()+9*36e5).toISOString().slice(0,10),d=j.latest;var sm=document.createElement('small');sm.style.cssText='display:block;font-size:11px;font-weight:700;opacity:.95';sm.textContent=(d===t?'🆕 今日 ':'最新 ')+(+d.slice(5,7))+'/'+(+d.slice(8,10))+(j.who?' '+j.who:'');a.style.flexDirection='column';a.appendChild(sm)}).catch(function(){})},1200);
})();
