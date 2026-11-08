const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const wallet=require('../wallet-inbox.js');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const code=html.split('/* 人生設計ノート →')[1].split('</script>')[0];
function fixture(balance=10000,records=[]){
 const state={cats:[{id:'food',name:'食費'}],savTypes:[],expenses:[],savings:[],balances:[],memos:[],goals:[],wants:[],walletBal:balance,walletRecs:records};
 const values=new Map([['lp_data',JSON.stringify(state)]]);
 const storage={fail:null,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail && (this.fail==='backup'?k.startsWith('lp_before_inbox_'):k==='lp_data'))throw Error('quota');values.set(k,v)}};
 const c={D:state,localStorage:storage,LPWalletInbox:wallet,yzInbox:{init(cfg){c.cfg=cfg}},uid:()=>Math.random().toString(36),today:()=> '2026-11-08',yen:n=>'¥'+n,GCATS:[],idbPut:s=>{c.mirror=s},render:()=>{},console};
 vm.createContext(c);vm.runInContext('/* 人生設計ノート →'+code,c);return{c,storage,values};
}
function item(amount=1357,key='receipt:2026-11-04:18:26:1-4987:1357'){return{kind:'wallet',date:'2026-11-04',title:'食品・菓子',data:{amount,sourceKey:key,kind:'out',cat:'食費'}}}
let f=fixture();const first=item(),second=item(897,'receipt:2026-11-05:18:50:1-3091:897');second.date='2026-11-05';
assert.equal(f.c.cfg.apply([first,second]),2);assert.equal(f.c.D.walletBal,7746);assert.equal(f.c.D.walletRecs.length,2);assert.equal(f.c.D.expenses.length,0);
assert.equal(f.c.cfg.apply([first,second]),0);assert.equal(f.c.D.walletBal,7746);
assert.equal(f.c.cfg.apply([{...first,id:'resend'}]),0);
const persisted=JSON.parse(f.values.get('lp_data'));f=fixture(persisted.walletBal,persisted.walletRecs);f.c.D.walletInboxKeys=persisted.walletInboxKeys;f.values.set('lp_data',JSON.stringify(f.c.D));assert.equal(f.c.cfg.apply([first]),0);
f=fixture(20000,[{id:'manual',date:first.date,amount:1357,kind:'out'}]);let d=f.c.cfg.describe(first);assert.ok(d.conflict);assert.ok(d.ok);assert.equal(f.c.cfg.apply([]),0);assert.equal(f.c.D.walletBal,20000);
// User can deliberately choose a truly different purchase with same date/amount.
assert.equal(f.c.cfg.apply([first]),1);assert.equal(f.c.D.walletBal,18643);
for(const amount of [0,-2,1.5,'1357',null,NaN,Infinity]){f=fixture();const bad=item(amount);assert.equal(Boolean(f.c.cfg.describe(bad).ok),false);assert.equal(f.c.cfg.apply([bad]),0);assert.equal(f.c.D.walletBal,10000)}
for(const kind of ['set','bad']){f=fixture();const bad=item();bad.data.kind=kind;assert.equal(Boolean(f.c.cfg.describe(bad).ok),false)}
for(const fail of ['backup','state']){f=fixture();f.storage.fail=fail;assert.throws(()=>f.c.cfg.apply([first]));assert.equal(f.c.D.walletBal,10000);assert.equal(JSON.parse(f.values.get('lp_data')).walletBal,10000);f.storage.fail=null;assert.equal(f.c.cfg.apply([first]),1);assert.equal(f.c.D.walletBal,8643)}
f=fixture();f.values.set('lp_data',JSON.stringify({...f.c.D,walletBal:22000}));assert.throws(()=>f.c.cfg.apply([first]),/別の画面/);assert.equal(JSON.parse(f.values.get('lp_data')).walletBal,22000);
f=fixture(50000);const exp={kind:'expense',date:'2026-11-03',data:{amount:600,cat:'食費',memo:'既存の通常経費'}};assert.equal(f.c.cfg.apply([exp,first,second]),3);assert.equal(f.c.D.walletBal,47746);assert.equal(f.c.D.expenses.length,1);
assert.ok([...f.values.keys()].some(k=>k.startsWith('lp_before_inbox_')));assert.equal(JSON.parse(f.c.mirror).walletBal,47746);
console.log('PASS: adapter integration, 2254 delta, resend/reload, manual-match preview, unselected, validation, mixed expense, backup/write failures, retry, stale tab, mirror');
