/* 送信済みバッジ（sent-status v1）: 送るボタンの上にピル、ヘッダーに✅、同じデータの再送は確認。データは読むだけ（自分の yzss_<app> だけ書く） */
(function(){
var MAP={'benri-note':['benri',/^bn_/],'yuzu-health-note':['health',/^(yz_|yuzu_plans)/],'life-plan-note':['lifeplan',/^lp_/],'love-note':['love',/^ln_/],'yotei-note':['yotei',/^yt_/],'omoide-benri':['omoide',/^om_(react|reply)$/]};
var seg=location.pathname.split('/').filter(Boolean)[0]||'';var c=MAP[seg];
if(!c){var t=document.title||'';c=/思い出/.test(t)?MAP['omoide-benri']:/予定/.test(t)?MAP['yotei-note']:/便利/.test(t)?MAP['benri-note']:/健康/.test(t)?MAP['yuzu-health-note']:/人生/.test(t)?MAP['life-plan-note']:MAP['love-note']}
var APP=c[0],RX=c[1],SK='yzss_'+APP,SEL='.sendb,[onclick*="yzHealthSend"],#sendBottom,#sendSet,#ytSend,[onclick*="lpYuzuSendAll"],#yzs';
var SENT=null,lastKey=null;
function jstNow(){return new Date(Date.now()+9*36e5)}
function today(){return jstNow().toISOString().slice(0,10)}
function md(ms){var d=new Date(ms+9*36e5);return (d.getUTCMonth()+1)+'/'+d.getUTCDate()+' '+('0'+d.getUTCHours()).slice(-2)+':'+('0'+d.getUTCMinutes()).slice(-2)}
function tms(s){if(!s)return 0;s=String(s);if(!/[zZ]|[+-]\d\d:?\d\d$/.test(s))s=s+(s.length<=10?'T00:00':'')+'+09:00';var v=Date.parse(s);return isNaN(v)?0:v}
function hash(){var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&RX.test(k)&&!/_pw$|_lock|inbox|music|bgm|yzss/.test(k))ks.push(k)}ks.sort();
 var s='',h=5381;ks.forEach(function(k){s+=k+'='+localStorage.getItem(k)+'\n'});for(var j=0;j<s.length;j++)h=((h<<5)+h+s.charCodeAt(j))|0;return (h>>>0).toString(36)+':'+s.length}
function rec(){try{return JSON.parse(localStorage.getItem(SK))||null}catch(e){return null}}
function setRec(r){try{localStorage.setItem(SK,JSON.stringify(r))}catch(e){}}
function keyOf(o){o=o||{};return o.date||o.sel||String(o.sent||'').slice(0,10)||today()}
function confirmedFor(key,since){if(!SENT||!SENT.received)return null;var best=null;SENT.received.forEach(function(x){if(x.key!==key)return;var t=tms(x.receivedAt)||tms(x.sentAt);if(since&&t<since-12e4)return;if(!best||t>best)best=t});return best}
function state(){var T=today(),r=rec(),cur=hash();
 if(r&&r.key===T){var ok=confirmedFor(T,r.at);if(ok&&r.st!=='ok'){r.st='ok';r.ok=ok;setRec(r)}return {st:r.st==='ok'?'ok':'pending',at:r.ok||r.at,changed:r.h!==cur}}
 var ok2=confirmedFor(T,0);if(ok2){setRec({key:T,at:ok2,ok:ok2,st:'ok',h:cur});return {st:'ok',at:ok2,changed:false}}
 return {st:'none'}}
function css(){if(document.getElementById('yzssCss'))return;var s=document.createElement('style');s.id='yzssCss';
 s.textContent='.yzss-pill{display:block;width:fit-content;margin:10px auto 6px;padding:5px 14px;border-radius:999px;font-size:14px;font-weight:800;line-height:1.4;font-family:-apple-system,"Hiragino Sans",sans-serif;text-align:center}'+
 '.yzss-pill.none{background:#eee;color:#999;font-weight:600;font-size:12.5px}.yzss-pill.pending{background:#ff9a3c;color:#fff}.yzss-pill.ok{background:#2fb36b;color:#fff}'+
 '.yzss-pill small{display:block;font-size:11px;font-weight:600;opacity:.9}.yzss-done{background:linear-gradient(135deg,#9fd8b8,#7cc39c)!important;color:#fff!important;border-color:#7cc39c!important}'+
 '.yzss-h{font-size:.7em;margin-left:6px;vertical-align:middle}';document.head.appendChild(s)}
function apply(){css();var s=state(),T=today();
 document.querySelectorAll(SEL).forEach(function(b){if(b.closest('#yzSendOv,#lpSendPick'))return;
  if(b.dataset.yzssOrig==null)b.dataset.yzssOrig=b.innerHTML;
  var p=b.previousElementSibling;if(!p||!p.classList.contains('yzss-pill')){p=document.createElement('div');p.className='yzss-pill';b.parentNode.insertBefore(p,b)}
  var cls=s.st,html=s.st==='ok'?'✅ ゆずが受け取ったよ '+md(s.at):s.st==='pending'?'📨 送信したよ（確認待ち）':'未送信';
  if(s.st!=='none'&&s.changed)html+='<small>変更あり（もう一度送ってね）</small>';
  if(p.className!=='yzss-pill '+cls)p.className='yzss-pill '+cls;if(p.innerHTML!==html)p.innerHTML=html;
  var done=s.st==='ok'&&!s.changed,want=done?'✅ 送信済み（もう一度送る）':b.dataset.yzssOrig;
  if(b.innerHTML!==want)b.innerHTML=want;b.classList.toggle('yzss-done',done)});
 var h=document.querySelector('h1');if(h){var m=h.querySelector('.yzss-h'),txt=s.st==='ok'?'✅':s.st==='pending'?'📨':'';
  if(!txt){if(m)m.remove()}else{if(!m){m=document.createElement('span');m.className='yzss-h';h.appendChild(m)}if(m.textContent!==txt)m.textContent=txt;m.title=s.st==='ok'?'今日の分はゆずが受け取ったよ':'送信したよ（確認待ち）'}}}
/* 再送の確認（同じデータをもう送ってる時だけ） */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest(SEL);if(!b||b.closest('#yzSendOv,#lpSendPick'))return;var s=state();
 if(s.st!=='none'&&!s.changed&&!confirm('もう送ってるよ、また送る？')){e.preventDefault();e.stopImmediatePropagation()}},true);
/* 送信シートで メール/共有/コピー/📎 を押したら「送信したよ（確認待ち）」 */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#yzMail,#yzShare,#yzCopy,#yzBkS');if(!b||!b.closest('#yzSendOv'))return;
 setRec({key:lastKey||today(),at:Date.now(),st:'pending',h:hash()});setTimeout(apply,50)},true);
function wrap(){var o=window.yuzuSend;if(!o||o.__ss)return;var w=function(opt){try{lastKey=keyOf(opt&&opt.full)}catch(e){}return o.apply(this,arguments)};for(var k in o)w[k]=o[k];w.__ss=1;window.yuzuSend=w}
function load(){fetch('data/sent.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j&&(!j.app||j.app===APP))SENT=j;apply()}).catch(function(){apply()})}
var tm=null;function soon(){clearTimeout(tm);tm=setTimeout(function(){wrap();apply()},150)}
function start(){wrap();apply();load();try{new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var n=ms[i].target;if(n.closest&&n.closest('.yzss-pill,'+SEL))continue;soon();return}}).observe(document.body,{childList:true,subtree:true})}catch(e){}
 setInterval(apply,4000);document.addEventListener('visibilitychange',function(){if(!document.hidden)load()});[500,2000].forEach(function(t){setTimeout(wrap,t)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.yzSentStatus={state:state,reload:load,app:APP};
})();
