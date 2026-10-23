/* 💾 バックアップ: 📤 JSON書き出し / 📥 JSON読み込み(マージ・上書きなし) / 💌送信にJSON添付 / storage.persist */
(function(){
var A={'yotei-note':['yotei','yt_'],'benri-note':['benri','bn_'],'yuzu-health-note':['health','yz_','yuzu_plans'],'life-plan-note':['lifeplan','lp_'],'love-note':['love','ln_']};
var seg=location.pathname.split('/').filter(Boolean)[0]||'';var cfg=A[seg];
if(!cfg){var t=document.title||'';cfg=/予定/.test(t)?A['yotei-note']:/便利/.test(t)?A['benri-note']:/健康/.test(t)?A['yuzu-health-note']:/人生/.test(t)?A['life-plan-note']:A['love-note']}
var APP=cfg[0],PRES=cfg.slice(1);function own(k){return PRES.some(function(p){return k.indexOf(p)===0})}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
function skip(k){return /_pw$|_lock/.test(k)}
function keys(){var o=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&own(k)&&!skip(k))o.push(k)}return o.sort()}
function ymd(){var d=new Date(Date.now()+9*36e5);return d.toISOString().slice(0,10).replace(/-/g,'')}
function snapshot(){var o={app:APP,kind:'yuzu-backup',v:1,exported:new Date().toISOString(),data:{}};keys().forEach(function(k){o.data[k]=localStorage.getItem(k)});return o}
function file(){var n=APP+'-backup-'+ymd()+'.json';return new File([JSON.stringify(snapshot(),null,1)],n,{type:'application/json'})}
function canFiles(f){try{return !!(navigator.canShare&&navigator.canShare({files:[f]}))}catch(e){return false}}
function download(f){var a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();a.remove()}
function exportJSON(){var f=file();if(canFiles(f))navigator.share({files:[f],title:f.name}).catch(function(e){if(e&&e.name!=='AbortError')download(f)});else download(f)}
function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function idOf(x){return isObj(x)?(x.id!=null?'id:'+x.id:x.key!=null?'key:'+x.key:null):null}
var added=0;
function union(ex,inc){var have={};ex.forEach(function(x){have[idOf(x)||JSON.stringify(x)]=1});inc.forEach(function(x){var k=idOf(x)||JSON.stringify(x);if(!have[k]){ex.push(x);have[k]=1;added++}});return ex}
function merge(ex,inc,depth){if(ex===undefined||ex===null){if(inc!==undefined&&inc!==null)added++;return inc}
 if(Array.isArray(ex)&&Array.isArray(inc))return union(ex,inc);
 if(isObj(ex)&&isObj(inc)&&depth<2){for(var k in inc)ex[k]=merge(ex[k],inc[k],depth+1);return ex}
 return ex}
function importText(txt,name){var j;try{j=JSON.parse(txt)}catch(e){alert('JSONファイルが読めなかったよ🥺');return}
 var data=j&&j.data;if(!data||typeof data!=='object'){alert('このノートのバックアップではないみたい');return}
 if(j.app&&j.app!==APP&&j.app!=='benri-note'){alert('これは「'+j.app+'」のバックアップだよ。このノートには読み込めないよ');return}
 var ks=Object.keys(data).filter(function(k){return own(k)&&!skip(k)});
 if(!ks.length){alert('読み込めるデータが入ってなかったよ');return}
 if(!confirm('「'+name+'」を読み込む？\n今のデータは消さずに、足りない分だけ追加するよ（同じ日・同じ項目は今のものを残すよ）'))return;
 var newKeys=0,before;added=0;
 ks.forEach(function(k){var cur=localStorage.getItem(k),inc=data[k];if(typeof inc!=='string')inc=JSON.stringify(inc);
  if(cur==null){localStorage.setItem(k,inc);newKeys++;return}
  if(/\d{4}-\d{2}-\d{2}/.test(k))return;
  var a,b;try{a=JSON.parse(cur);b=JSON.parse(inc)}catch(e){return}
  before=added;var m=merge(a,b,0);if(added>before)localStorage.setItem(k,JSON.stringify(m))});
 alert('読み込んだよ♡\n新しく追加：'+newKeys+'件のデータ'+(added?'＋'+added+'件の項目':'')+'\n今あったデータはそのまま残してるよ');location.reload()}
function pick(){var i=document.createElement('input');i.type='file';i.accept='.json,application/json,text/plain';i.style.display='none';document.body.appendChild(i);
 i.onchange=function(){var f=i.files[0];i.remove();if(!f)return;var r=new FileReader();r.onload=function(){importText(r.result,f.name)};r.readAsText(f)};i.click()}
window.yuzuBackup={exportJSON:exportJSON,pick:pick,importText:importText,file:file,snapshot:snapshot};
function card(){if(document.getElementById('yz-bk'))return;var s=document.createElement('style');
 s.textContent='#yz-bk{position:relative;z-index:5;margin:24px auto 0;max-width:560px;width:calc(100% - 24px);box-sizing:border-box;padding:14px;border-radius:22px;background:rgba(255,255,255,.9);border:3px solid #fff;box-shadow:0 6px 22px rgba(120,30,80,.28);font-family:-apple-system,"Hiragino Sans",sans-serif;text-align:center}#yz-bk h3{margin:0 0 4px;font-size:16px;color:#c2185b}#yz-bk p{margin:0 0 10px;font-size:12px;color:#7a4a5a}#yz-bk .g{display:grid;grid-template-columns:1fr 1fr;gap:10px}#yz-bk button{min-height:52px;border:3px solid #fff;border-radius:16px;font-size:15px;font-weight:800;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.25)}';
 document.head.appendChild(s);var d=document.createElement('section');d.id='yz-bk';
 d.innerHTML='<h3>💾 だいじなデータのバックアップ</h3><p>ときどき書き出して「ファイル」に保存してね♡ 読み込みは今のデータを消さずに足すだけだよ</p><div class="g"><button type="button" id="yzBkE" style="background:linear-gradient(135deg,#ff5fa2,#c2185b)">📤 JSON書き出し</button><button type="button" id="yzBkI" style="background:linear-gradient(135deg,#4b7bff,#4b2bbf)">📥 JSON読み込み</button></div>';
 var nav=document.getElementById('yz-nav');if(nav)document.body.insertBefore(d,nav);else document.body.appendChild(d);
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
wrap();document.addEventListener('DOMContentLoaded',wrap);window.addEventListener('load',wrap);[500,2000].forEach(function(t){setTimeout(wrap,t)});
})();
