/* ☁️ ワンタップ復元 v1: data/restore/latest.json (AES-GCM, PBKDF2-SHA256, パスワードで暗号化) を読んで、backup.js の importText でマージ（消さずに足すだけ） */
(function(){
var A={'yotei-note':['yotei',/^yt_state$/],'benri-note':['benri',/^bn_chk$/],'yuzu-health-note':['health',/^yz_day_/],'life-plan-note':['lifeplan',/^lp_data$/],'love-note':['love',/^ln_data$/]};
var seg=location.pathname.split('/').filter(Boolean)[0]||'';var cfg=A[seg];if(!cfg)return;
var URL0='data/restore/latest.json';var META=null;
function ub(b){var s=atob(b),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
function J(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function n(x){return x?(Array.isArray(x)?x.length:Object.keys(x).length):0}
function empty(){var a=cfg[0];if(a==='benri')return n(J('bn_chk'))===0;if(a==='yotei')return n(J('yt_state'))===0;
 if(a==='lifeplan'){var d=J('lp_data')||{};return n(d.expenses)+n(d.balances)+n(d.savings)+n(d.wants)===0}
 if(a==='love'){var l=J('ln_data')||{};return n(l.entries)===0}
 for(var i=0;i<localStorage.length;i++){if(/^yz_day_/.test(localStorage.key(i)))return false}return true}
function md(d){var m=/^(\d+)-(\d+)-(\d+)/.exec(d||'');return m?(+m[2])+'/'+(+m[3]):d}
async function run(btn){var pw=prompt('いつものパスワードを入れてね🔑\n（'+md(META.date)+'までのデータを、今のデータを消さずに足すよ）');if(!pw)return;
 btn&&(btn.disabled=true);try{var r=await fetch(URL0+'?t='+Date.now(),{cache:'no-store'});var e=await r.json();
 var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
 var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:ub(e.salt),iterations:e.iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
 var pt;try{pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(e.iv),additionalData:new TextEncoder().encode(e.aad)},key,ub(e.ct))}catch(x){alert('パスワードがちがうみたい🥺 もう一回ためしてね');return}
 var txt=new TextDecoder().decode(pt);if(!window.yzImportText){alert('読み込み機能がまだ準備中だよ。少し待ってもう一回押してね');return}
 window.yzImportText(txt,'☁️ '+md(META.date)+'のバックアップ')}catch(x){alert('バックアップを取りに行けなかったよ🥺 電波を確認してもう一回ためしてね')}finally{btn&&(btn.disabled=false)}}
function css(){var s=document.createElement('style');s.textContent='#yzRs{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom));z-index:99999;width:min(92vw,460px);box-sizing:border-box;padding:14px;border-radius:22px;background:#fff;border:3px solid #ff8fb8;box-shadow:0 8px 30px rgba(120,30,80,.35);font-family:-apple-system,"Hiragino Sans",sans-serif;text-align:center}#yzRs p{margin:0 0 8px;font-size:13px;color:#7a4a5a}#yzRs button.go{width:100%;min-height:58px;border:0;border-radius:16px;font-size:18px;font-weight:900;color:#fff;background:linear-gradient(135deg,#ff5fa2,#c2185b)}#yzRs button.x{margin-top:6px;border:0;background:none;color:#999;font-size:12px}#yzRsC{display:block;width:100%;margin-top:10px;min-height:48px;border:3px solid #fff;border-radius:16px;font-size:15px;font-weight:800;color:#fff;background:linear-gradient(135deg,#ff9f43,#e8590c)}';document.head.appendChild(s)}
function banner(){if(document.getElementById('yzRs'))return;var d=document.createElement('div');d.id='yzRs';
 d.innerHTML='<p>データが空っぽみたい🥺<br>'+md(META.date)+'までのバックアップがあるよ</p><button class="go" type="button">☁️ 前回のデータを戻す</button><button class="x" type="button">あとで</button>';
 d.querySelector('.go').onclick=function(){run(this)};d.querySelector('.x').onclick=function(){d.remove()};document.body.appendChild(d)}
function inCard(){var c=document.getElementById('yz-bk');if(!c||document.getElementById('yzRsC'))return;var b=document.createElement('button');b.type='button';b.id='yzRsC';b.textContent='☁️ 前回のデータを戻す（'+md(META.date)+'まで）';b.onclick=function(){run(b)};c.appendChild(b)}
async function init(){try{var r=await fetch(URL0+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;var e=await r.json();META={date:e.date};css();inCard();setTimeout(inCard,2500);if(empty())banner()}catch(x){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(init,800)});else setTimeout(init,800);
})();
