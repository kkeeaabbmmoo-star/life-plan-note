/* 💾 バックアップ: 📤 JSON書き出し / 📥 JSON読み込み(マージ・上書きなし) / 💌送信にJSON添付 / storage.persist */
(function(){
var A={'yotei-note':['yotei','yt_'],'benri-note':['benri','bn_'],'yuzu-health-note':['health','yz_','yuzu_plans'],'life-plan-note':['lifeplan','lp_'],'love-note':['love','ln_']};
var seg=location.pathname.split('/').filter(Boolean)[0]||'';var cfg=A[seg];
if(!cfg){var t=document.title||'';cfg=/予定/.test(t)?A['yotei-note']:/便利/.test(t)?A['benri-note']:/健康/.test(t)?A['yuzu-health-note']:/人生/.test(t)?A['life-plan-note']:A['love-note']}
var BKV='backup v5';var APP=cfg[0],PRES=cfg.slice(1);function own(k){return PRES.some(function(p){return k.indexOf(p)===0})}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
function skip(k){return /_pw$|_lock/.test(k)}
function keys(){var o=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&own(k)&&!skip(k))o.push(k)}return o.sort()}
function ymd(){var d=new Date(Date.now()+9*36e5);return d.toISOString().slice(0,10).replace(/-/g,'')}
var IMG={};
function idbOpen(){return new Promise(function(ok,ng){var r=indexedDB.open('yuzu_db',1);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('slots'))d.createObjectStore('slots');if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id',autoIncrement:true})};r.onsuccess=function(){ok(r.result)};r.onerror=function(){ng(r.error)}})}
function b2u(b){return new Promise(function(ok){if(!b||!b.size){ok(null);return}var im=new Image(),u=URL.createObjectURL(b);im.onload=function(){var W=1080,sc=Math.min(1,W/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.82))};im.onerror=function(){URL.revokeObjectURL(u);ok(null)};im.src=u})}
function loadImgs(){if(APP!=='health'||!window.indexedDB)return;idbOpen().then(function(d){var t=d.transaction('slots','readonly'),o=t.objectStore('slots'),out=[];[0,1,2,3,4,5,6].forEach(function(i){var q=o.get(i);q.onsuccess=function(){out[i]=q.result}});t.oncomplete=function(){Promise.all(out.map(b2u)).then(function(us){var n={};us.forEach(function(u,i){if(u)n['idb:slots:'+i]=u});IMG=n})}}).catch(function(){})}
loadImgs();document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(loadImgs,800)});
function putImgs(m){var ks=Object.keys(m).filter(function(k){return /^idb:slots:[0-6]$/.test(k)&&typeof m[k]==='string'&&m[k].indexOf('data:image')===0});if(!ks.length)return Promise.resolve(0);
 return idbOpen().then(function(d){return Promise.all(ks.map(function(k){var i=+k.split(':')[2];return new Promise(function(ok){var t=d.transaction('slots','readonly'),q=t.objectStore('slots').get(i);q.onsuccess=function(){ok(q.result?null:i)};q.onerror=function(){ok(null)}}).then(function(e){if(e==null)return 0;return fetch(m[k]).then(function(r){return r.blob()}).then(function(b){return new Promise(function(ok){var t=d.transaction('slots','readwrite');t.objectStore('slots').put(b,i);t.oncomplete=function(){ok(1)};t.onerror=function(){ok(0)}})})})})).then(function(a){return a.reduce(function(x,y){return x+y},0)})}).catch(function(){return 0})}
function snapshot(){var o={app:APP,kind:'yuzu-backup',v:1,exported:new Date().toISOString(),data:{}};keys().forEach(function(k){o.data[k]=localStorage.getItem(k)});for(var k in IMG)o.data[k]=IMG[k];return o}
function file(){var n=APP+'-backup-'+ymd()+'.json';return new File([JSON.stringify(snapshot(),null,1)],n,{type:'application/json'})}
function canFiles(f){try{return !!(navigator.canShare&&navigator.canShare({files:[f]}))}catch(e){return false}}
function download(f){var a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();a.remove()}
function exportJSON(){var f=file();if(canFiles(f))navigator.share({files:[f],title:f.name}).catch(function(e){if(e&&e.name!=='AbortError')download(f)});else download(f)}
function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function idOf(x){return isObj(x)?(x.id!=null?'id:'+x.id:x.key!=null?'key:'+x.key:null):null}
var added=0;
function ckey(x){if(!isObj(x))return null;if(x.name!=null&&x.amount==null&&x.price==null)return 'n:'+x.name;if(x.text!=null||x.title!=null)return 't:'+(x.date||'')+'|'+(x.title||'')+'|'+(x.text||'');return null}
function union(ex,inc){var have={};function ks(x){var a=[idOf(x),ckey(x)].filter(Boolean);if(!a.length)a.push(JSON.stringify(x));return a}
 ex.forEach(function(x){ks(x).forEach(function(k){have[k]=1})});
 inc.forEach(function(x){var a=ks(x);if(a.some(function(k){return have[k]}))return;ex.push(x);a.forEach(function(k){have[k]=1});added++});return ex}
function remapLP(a,b){function mp(ea,ia){var byName={},r={};(ea||[]).forEach(function(x){if(x&&x.name!=null)byName[x.name]=x.id});(ia||[]).forEach(function(x){if(x&&byName[x.name]!=null&&byName[x.name]!==x.id)r[x.id]=byName[x.name]});return r}
 var ts=mp(a.savTypes,b.savTypes),cs=mp(a.cats,b.cats);
 (b.savings||[]).forEach(function(e){if(e&&ts[e.type]!=null)e.type=ts[e.type]});
 ['expenses','fixed','wants'].forEach(function(L){(b[L]||[]).forEach(function(e){if(e&&cs[e.cat]!=null)e.cat=cs[e.cat]})});
 b.savTypes=(b.savTypes||[]).filter(function(x){return !(x&&ts[x.id]!=null)});b.cats=(b.cats||[]).filter(function(x){return !(x&&cs[x.id]!=null)})}
function legacy(j){if(Array.isArray(j)&&APP!=='lifeplan')j=j[0];if(!j||typeof j!=='object')return j;if(j.data&&typeof j.data==='object'&&!(APP==='lifeplan'&&isObj(j.data)&&(j.data.lp_data&&typeof j.data.lp_data==='object'||j.data.D)))return j;
 if(j.app==='life-plan-note-art'||Array.isArray(j.images)){alert('これは画像のバックアップだよ🖼️\n設定の「画像の読み込み」から入れてね');return null}
 var d={};
 if(APP==='health'&&(isObj(j.days)||j.settings||j.plans)){for(var k in (j.days||{})){var o=j.days[k];if(o&&((o.foods||[]).length||o.steps||o.exMin||(o.exList||[]).length||o.wt!=null||o.sleep!=null||o.poo!=null||o.mood!=null||o.rest))d['yz_day_'+k]=JSON.stringify(o)}
  if(isObj(j.plans)){var p={};for(var q in j.plans)if(Array.isArray(j.plans[q])&&j.plans[q].length)p[q]=j.plans[q];d.yuzu_plans=JSON.stringify(p)}
  if(isObj(j.settings))d.yz_settings=JSON.stringify(j.settings);return {app:'health',data:d}}
 if(APP==='lifeplan'){var LPK=['cats','balances','expenses','fixed','wants','goals','memos','savings','savTypes','savGoals','birth'];
  var isLP=function(o){return isObj(o)&&LPK.some(function(k){return o[k]!==undefined})};
  var unwrap=function(o){if(Array.isArray(o))o=o.find(function(x){return isLP(x)||isObj(x)})||o[0];if(typeof o==='string'){try{o=parseLoose(o)}catch(e){}}return o};
  var cand=[j,j&&j.D,j&&j.lp_data,j&&j.data&&j.data.lp_data,j&&j.data&&j.data.D].map(unwrap);for(var ci=0;ci<cand.length;ci++)if(isLP(cand[ci])){j=cand[ci];break}}
 if(APP==='lifeplan'&&isObj(j)&&(Array.isArray(j.cats)||j.app==='life-plan-note'||['balances','expenses','fixed','wants','goals','memos','savings','savTypes','savGoals','birth'].some(function(k){return j[k]!==undefined}))){var c={};for(var k2 in j)if(k2!=='app'&&k2!=='exported')c[k2]=j[k2];return {app:'lifeplan',data:{lp_data:JSON.stringify(c)}}}
 if(APP==='love'&&(Array.isArray(j.entries)||isObj(j.likes))){var l={};for(var k3 in j)if(k3!=='app'&&k3!=='exported')l[k3]=j[k3];return {app:'love',data:{ln_data:JSON.stringify(l)}}}
 return j}
function merge(ex,inc,depth){if(ex===undefined||ex===null){if(inc!==undefined&&inc!==null)added++;return inc}
 if(Array.isArray(ex)&&Array.isArray(inc))return union(ex,inc);
 if(isObj(ex)&&isObj(inc)&&depth<2){for(var k in inc)ex[k]=merge(ex[k],inc[k],depth+1);return ex}
 return ex}
function parseLoose(txt){txt=String(txt||'').replace(/^\uFEFF/,'').replace(/[\u201C\u201D]/g,'"').replace(/\u00A0/g,' ').trim();var j;try{j=JSON.parse(txt)}catch(e0){var a=txt.indexOf('{'),b=txt.lastIndexOf('}');if(a<0||b<=a)throw e0;j=JSON.parse(txt.slice(a,b+1))}for(var i=0;i<3&&typeof j==='string';i++){try{j=JSON.parse(j.replace(/^\uFEFF/,'').trim())}catch(e){break}}return j}
function topKeys(j){try{return Array.isArray(j)?'[配列 '+j.length+'件]':(j&&typeof j==='object')?Object.keys(j).slice(0,12).join(', ')||'(空)':typeof j}catch(e){return '?'}}
function importText(txt,name){var j;try{j=parseLoose(txt)}catch(e){alert('JSONファイルが読めなかったよ🥺\n理由: 中にJSONが見つからない／形式がちがう\nファイル: '+(name||'?'));return}var _tk=topKeys(j);
 j=legacy(j);if(!j)return;var data=j&&j.data;if(!data||typeof data!=='object'){alert('このノートのバックアップではないみたい\n（ファイルの中身: '+_tk+'）\n'+BKV);return}
 if(j.app&&j.app!==APP&&!({'benri-note':'benri','life-plan-note':'lifeplan','love-note':'love','yuzu-health-note':'health','yotei-note':'yotei'}[j.app]===APP)){alert('これは「'+j.app+'」のバックアップだよ。このノートには読み込めないよ');return}
 var imgKeys={};Object.keys(data).forEach(function(k){if(/^idb:slots:/.test(k)&&APP==='health')imgKeys[k]=data[k]});var ks=Object.keys(data).filter(function(k){return own(k)&&!skip(k)});if(!ks.length&&Object.keys(imgKeys).length)ks=[];
 if(!ks.length&&!Object.keys(imgKeys).length){alert('読み込めるデータが入ってなかったよ');return}
 if(!confirm('「'+name+'」を読み込む？\n今のデータは消さずに、足りない分だけ追加するよ（同じ日・同じ項目は今のものを残すよ）'))return;
 var newKeys=0,before;added=0;
 ks.forEach(function(k){var cur=localStorage.getItem(k),inc=data[k];if(typeof inc!=='string')inc=JSON.stringify(inc);
  if(cur==null){localStorage.setItem(k,inc);newKeys++;return}
  if(/\d{4}-\d{2}-\d{2}/.test(k))return;
  var a,b;try{a=JSON.parse(cur);b=JSON.parse(inc)}catch(e){return}
  before=added;if(k==='lp_data'&&isObj(a)&&isObj(b))remapLP(a,b);
  if(k==='yz_presets'&&Array.isArray(a)&&Array.isArray(b)){var have={};a.forEach(function(q){if(q&&q.name)have[q.name]=1});b.forEach(function(q){if(!q||!q.name||have[q.name])return;for(var i=0;i<a.length;i++)if(!a[i]||!a[i].name){a[i]=q;have[q.name]=1;added++;return}if(a.length<7){a.push(q);have[q.name]=1;added++}});if(added>before)localStorage.setItem(k,JSON.stringify(a));return}
  var m=merge(a,b,0);if(added>before)localStorage.setItem(k,JSON.stringify(m))});
 putImgs(imgKeys).then(function(ni){alert('読み込んだよ♡\n新しく追加：'+newKeys+'件のデータ'+(added?'＋'+added+'件の項目':'')+(ni?'＋写真'+ni+'枚':'')+'\n今あったデータはそのまま残してるよ');location.reload()})}
function pick(){var i=document.createElement('input');i.type='file';i.style.display='none';document.body.appendChild(i);
 i.onchange=function(){var f=i.files[0];i.remove();if(!f)return;var r=new FileReader();r.onload=function(){importText(r.result,f.name)};r.readAsText(f)};i.click()}
function defAv(){if(APP!=='health')return;try{if(!localStorage.getItem('yz_avatar_couple')){var el=document.getElementById('av_couple');if(el&&el.tagName!=='IMG'){var i=document.createElement('img');i.id='av_couple';i.src='img/twoshot.svg';i.alt='ふたり';i.dataset.def='1';el.replaceWith(i)}}}catch(e){}}
setTimeout(defAv,300);setTimeout(defAv,2500);
window.yuzuBackup={exportJSON:exportJSON,pick:pick,importText:importText,file:file,snapshot:snapshot};
function card(){if(document.getElementById('yz-bk'))return;var s=document.createElement('style');
 s.textContent='#yz-bk{position:relative;z-index:5;margin:24px auto 0;max-width:560px;width:calc(100% - 24px);box-sizing:border-box;padding:14px;border-radius:22px;background:rgba(255,255,255,.9);border:3px solid #fff;box-shadow:0 6px 22px rgba(120,30,80,.28);font-family:-apple-system,"Hiragino Sans",sans-serif;text-align:center}#yz-bk h3{margin:0 0 4px;font-size:16px;color:#c2185b}#yz-bk p{margin:0 0 10px;font-size:12px;color:#7a4a5a}#yz-bk .g{display:grid;grid-template-columns:1fr 1fr;gap:10px}#yz-bk button{min-height:52px;border:3px solid #fff;border-radius:16px;font-size:15px;font-weight:800;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.25)}';
 document.head.appendChild(s);var d=document.createElement('section');d.id='yz-bk';
 d.innerHTML='<h3>💾 だいじなデータのバックアップ <span style="font-size:11px;color:#999;font-weight:600">'+BKV+'</span></h3><p>ときどき書き出して「ファイル」に保存してね♡ 読み込みは今のデータを消さずに足すだけだよ</p><div class="g"><button type="button" id="yzBkE" style="background:linear-gradient(135deg,#ff5fa2,#c2185b)">📤 JSON書き出し</button><button type="button" id="yzBkI" style="background:linear-gradient(135deg,#4b7bff,#4b2bbf)">📥 JSON読み込み</button></div>';
 var nav=document.getElementById('yz-nav');if(nav)document.body.insertBefore(d,nav);else document.body.appendChild(d);
 if(APP==='health'){var pb=document.createElement('button');pb.type='button';pb.textContent='📷 写真を設定する（ヘッダー・アイコン）';pb.style.cssText='margin-top:10px;width:100%;background:linear-gradient(135deg,#ffb347,#ff7a1a)';pb.onclick=function(){var b=document.querySelector('nav button[data-t="set"]');if(b)b.click();setTimeout(function(){var c=document.getElementById('slotCard');if(c)c.scrollIntoView({block:'start',behavior:'smooth'})},200)};d.appendChild(pb)}
 d.querySelector('#yzBkE').onclick=exportJSON;d.querySelector('#yzBkI').onclick=pick}
function keepCard(){card();var d=document.getElementById('yz-bk'),nav=document.getElementById('yz-nav');if(d&&nav&&d.nextElementSibling!==nav)document.body.insertBefore(d,nav)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',keepCard);else keepCard();
window.addEventListener('load',keepCard);[900,2600,6200].forEach(function(t){setTimeout(keepCard,t)});
/* 💌 送信にJSONファイルを添付（iOS共有シート→メール/Gmail）。従来のメール送信はそのまま残す */
function wrap(){var o=window.yuzuSend;if(!o||o.__bk)return;var w=function(opt){var r=o.apply(this,arguments);try{addAttach(opt)}catch(e){}return r};w.__bk=1;window.yuzuSend=w}
function addAttach(opt){var ov=document.getElementById('yzSendOv');if(!ov||ov.querySelector('#yzBkS'))return;var box=ov.firstElementChild;if(!box)return;
 var body=opt.intro(opt.fullNote||'')+'\n\n---YUZU-DATA---\n'+JSON.stringify(opt.full)+'\n---END---';var f=file();
 if(!canFiles(f))return;
 var b=document.createElement('button');b.id='yzBkS';b.type='button';b.textContent='📎 JSONファイル付きで送る（おすすめ）';
 b.style.cssText='display:block;width:100%;padding:14px;border:3px solid #fff;border-radius:16px;font-size:17px;font-weight:800;margin-top:12px;color:#fff;background:linear-gradient(135deg,#ff5fa2,#7b2cbf);box-shadow:0 4px 12px rgba(0,0,0,.25)';
 var n=document.createElement('div');n.style.cssText='font-size:12px;margin-top:6px;opacity:.85';n.textContent='共有メニューで「メール」か「Gmail」をえらんでね。宛先は '+'自分のアドレス'+'、件名は「'+opt.subject+'」にしてね（本文はそのまま入るよ）';
 b.onclick=function(){navigator.share({files:[f],title:opt.subject,text:opt.subject+'\n\n'+body}).catch(function(){})};
 var t=box.children[0];if(t&&t.nextSibling)box.insertBefore(n,t.nextSibling);else box.appendChild(n);box.insertBefore(b,n)}
window.yzImportText=importText;window.yzOwnCount=function(){return keys().length};
wrap();document.addEventListener('DOMContentLoaded',wrap);window.addEventListener('load',wrap);[500,2000].forEach(function(t){setTimeout(wrap,t)});
})();
