/* Wallet inbox: source identity and balance live in one atomic lp_data write.
   v2: 残高合わせ (data.kind='true_up', target, asOf) records the gap as 雑費/雑収入, always after earlier receipts. */
(function(root){
'use strict';
const KEY_RX=/^[a-zA-Z0-9:._-]{8,200}$/;
const ZATSU_OUT='雑費',ZATSU_IN='雑収入';
function isTrueUp(it){return !!it && it.kind==='wallet' && (it.data||{}).kind==='true_up';}
function ms(s){const v=Date.parse(s);return isNaN(v)?NaN:v;}
function validTrueUp(it){
 const x=it.data||{};
 return isTrueUp(it) && /^\d{4}-\d{2}-\d{2}$/.test(it.date||'') &&
 Number.isSafeInteger(x.target) && x.target>=0 && typeof x.asOf==='string' && !isNaN(ms(x.asOf)) &&
 typeof x.sourceKey==='string' && KEY_RX.test(x.sourceKey);
}
function valid(it){
 if(isTrueUp(it))return validTrueUp(it);
 const x=it.data||{};
 return it.kind==='wallet' && /^\d{4}-\d{2}-\d{2}$/.test(it.date||'') &&
 Number.isSafeInteger(x.amount) && x.amount>0 && (x.kind==='out'||x.kind==='in') &&
 typeof x.sourceKey==='string' && KEY_RX.test(x.sourceKey);
}
/* When did this receipt happen? data.at, else receipt:YYYY-MM-DD:HH:MM:... sourceKey, else start of its date (JST). */
function receiptAt(it){
 const x=it.data||{};
 if(typeof x.at==='string' && !isNaN(ms(x.at)))return ms(x.at);
 const m=/^receipt:(\d{4}-\d{2}-\d{2}):(\d{2}):(\d{2}):/.exec(x.sourceKey||'');
 if(m)return ms(m[1]+'T'+m[2]+':'+m[3]+':00+09:00');
 return ms((it.date||'')+'T00:00:00+09:00');
}
/* Latest 残高合わせ moment already applied on this device (ms) or 0. */
function lastAsOf(state){
 let t=0;const a=state.walletAsOf&&ms(state.walletAsOf);if(a>t)t=a;
 (state.walletRecs||[]).forEach(r=>{const v=r.adjust&&ms(r.adjust.asOf);if(v>t)t=v;});
 return t;
}
/* A receipt from before an applied 残高合わせ is already inside the counted cash. */
function beforeTrueUp(state,it){
 if(isTrueUp(it)||!valid(it))return false;const t=lastAsOf(state);return t>0 && receiptAt(it)<=t;
}
function wDelta(it){const x=it.data||{};return x.kind==='in'?x.amount:-x.amount;}
/* Projected 残高合わせ: receipts selected in the same batch that happened before asOf are applied first. */
function trueUpPlan(state,it,others){
 const x=it.data||{},asOf=ms(x.asOf);
 const first=(others||[]).filter(o=>o!==it && !isTrueUp(o) && valid(o) && !known(state,o) && receiptAt(o)<=asOf);
 const now=Number.isSafeInteger(state.walletBal)?state.walletBal:NaN;
 const after=first.reduce((s,o)=>s+wDelta(o),now);
 return {now:now,first:first,afterReceipts:after,target:x.target,diff:x.target-after};
}
function order(sel){
 const key=it=>isTrueUp(it)?ms((it.data||{}).asOf):(it.kind==='wallet'?receiptAt(it):-Infinity);
 return sel.map((it,i)=>({it:it,i:i,k:key(it),t:isTrueUp(it)?1:0}))
  .sort((a,b)=>(a.k-b.k)||(a.t-b.t)||(a.i-b.i)).map(o=>o.it);
}
function known(state,it){const k=(it.data||{}).sourceKey;
 return !!k && ((state.walletInboxKeys||[]).indexOf(k)>=0 || (state.walletRecs||[]).some(r=>r.sourceKey===k));}
function match(state,it){const x=it.data||{};
 return (state.walletRecs||[]).some(r=>r.date===it.date && r.amount===x.amount && r.kind===x.kind);}
function append(state,it,id){
 if(!valid(it))throw new Error('財布の金額・種類・識別子が正しくありません');
 if(known(state,it))return 0;
 const x=it.data;
 if(!Number.isSafeInteger(state.walletBal))throw new Error('財布残高を確認してください');
 if(!Array.isArray(state.walletInboxKeys))state.walletInboxKeys=[];
 if(isTrueUp(it)){
  const before=state.walletBal,diff=x.target-before;
  if(diff!==0)state.walletRecs.push({id:id,date:it.date,amount:Math.abs(diff),kind:diff<0?'out':'in',cat:diff<0?ZATSU_OUT:ZATSU_IN,
   memo:String(x.memo||it.title||'不明金（残高合わせ）'),sourceKey:x.sourceKey,from:'yuzu',adjust:{asOf:x.asOf,target:x.target,before:before}});
  state.walletBal=x.target;
  if(!state.walletAsOf||ms(x.asOf)>ms(state.walletAsOf))state.walletAsOf=x.asOf;
  state.walletInboxKeys.push(x.sourceKey);
  return 1;
 }
 const bal=state.walletBal+(x.kind==='in'?x.amount:-x.amount);
 if(!Number.isSafeInteger(bal))throw new Error('財布残高が範囲外です');
 state.walletRecs.push({id:id,date:it.date,amount:x.amount,kind:x.kind,cat:String(x.cat||'食費'),memo:String(x.memo||it.title||''),sourceKey:x.sourceKey,from:'yuzu'});
 state.walletBal=bal;
 state.walletInboxKeys.push(x.sourceKey);
 return 1;
}
/* Month summary of 雑費 (unexplained cash out) and 雑収入 (unexplained cash in); never part of real income/category totals. */
function zatsu(state,ym){
 const r=(state.walletRecs||[]).filter(e=>String(e.date||'').slice(0,7)===ym);
 const out=r.filter(e=>e.kind==='out'&&e.cat===ZATSU_OUT),inn=r.filter(e=>e.kind==='in'&&e.cat===ZATSU_IN);
 const sum=a=>a.reduce((s,e)=>s+(+e.amount||0),0);
 const cash=sum(r.filter(e=>e.kind==='out'));
 const o=sum(out),i=sum(inn);
 return {outCount:out.length,out:o,inCount:inn.length,in:i,net:i-o,cashOut:cash,hint:o>3000||(cash>0&&o>cash*0.1)};
}
function persist(storage,before,next){
 const previous=storage.getItem('lp_data');
 // Stop rather than overwrite changes made in another tab or window.
 if(previous && JSON.stringify(JSON.parse(previous))!==JSON.stringify(before))throw new Error('別の画面で記録が更新されたよ。ノートを開き直してね');
 // Keep an immutable pre-import snapshot. A quota failure aborts BEFORE wallet changes.
 const key='lp_before_inbox_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
 storage.setItem(key,previous||JSON.stringify(before));
 next.saved=Date.now();
 const text=JSON.stringify(next);
 storage.setItem('lp_data',text); // localStorage setItem is atomic; failure leaves old data intact.
 return text;
}
const api={valid:valid,known:known,match:match,append:append,persist:persist,isTrueUp:isTrueUp,receiptAt:receiptAt,lastAsOf:lastAsOf,beforeTrueUp:beforeTrueUp,trueUpPlan:trueUpPlan,order:order,zatsu:zatsu,ZATSU_OUT:ZATSU_OUT,ZATSU_IN:ZATSU_IN};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LPWalletInbox=api;
})(typeof window!=='undefined'?window:this);
