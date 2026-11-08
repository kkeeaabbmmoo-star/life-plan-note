/* Wallet inbox: source identity and balance live in one atomic lp_data write. */
(function(root){
'use strict';
function valid(it){
 const x=it.data||{};
 return it.kind==='wallet' && /^\d{4}-\d{2}-\d{2}$/.test(it.date||'') &&
 Number.isSafeInteger(x.amount) && x.amount>0 && (x.kind==='out'||x.kind==='in') &&
 typeof x.sourceKey==='string' && /^[a-zA-Z0-9:._-]{8,200}$/.test(x.sourceKey);
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
 const bal=state.walletBal+(x.kind==='in'?x.amount:-x.amount);
 if(!Number.isSafeInteger(bal))throw new Error('財布残高が範囲外です');
 state.walletRecs.push({id:id,date:it.date,amount:x.amount,kind:x.kind,cat:String(x.cat||'食費'),memo:String(x.memo||it.title||''),sourceKey:x.sourceKey,from:'yuzu'});
 state.walletBal=bal;
 if(!Array.isArray(state.walletInboxKeys))state.walletInboxKeys=[];
 state.walletInboxKeys.push(x.sourceKey);
 return 1;
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
const api={valid:valid,known:known,match:match,append:append,persist:persist};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LPWalletInbox=api;
})(typeof window!=='undefined'?window:this);
