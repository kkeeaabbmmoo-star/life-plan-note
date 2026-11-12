const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const wallet=require('../wallet-inbox.js');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const code=html.split('/* 人生設計ノート →')[1].split('</script>')[0];
function fixture(balance=10000,records=[],extra={}){
 const state=Object.assign({cats:[{id:'food',name:'食費'}],savTypes:[],expenses:[],savings:[],balances:[],memos:[],goals:[],wants:[],walletBal:balance,walletRecs:records},extra);
 const values=new Map([['lp_data',JSON.stringify(state)]]);
 const storage={fail:null,getItem:k=>values.get(k)||null,setItem(k,v){if(this.fail && (this.fail==='backup'?k.startsWith('lp_before_inbox_'):k==='lp_data'))throw Error('quota');values.set(k,v)}};
 const c={D:state,localStorage:storage,LPWalletInbox:wallet,yzInbox:{init(cfg){c.cfg=cfg}},uid:()=>Math.random().toString(36).slice(2),today:()=> '2020-01-04',yen:n=>'¥'+n,GCATS:[],idbPut:s=>{c.mirror=s},render:()=>{},console};
 vm.createContext(c);vm.runInContext('/* 人生設計ノート →'+code,c);return{c,storage,values};
}
// Synthetic examples only.
const AS='2020-01-02T13:00+09:00';
function tu(target=5000,key='adjust:test:2020-01-02T13:00:'+target){return{kind:'wallet',date:'2020-01-02',title:'残高合わせ',data:{kind:'true_up',target,asOf:AS,sourceKey:key,memo:'不明金（残高合わせ 1/2）'}}}
function rc(amount,hhmm,date='2020-01-02',kind='out'){return{kind:'wallet',date,title:'テストのレシート',data:{amount,kind,cat:'食費',memo:'テスト店 '+hhmm,sourceKey:`receipt:${date}:${hhmm}:t-${amount}`}}}
const N=r=>typeof r==='object'?r.n:r;
// 1) app higher than real cash -> one 雑費 out record
let f=fixture(12000);let r=f.c.cfg.apply([tu()]);
assert.equal(N(r),1);assert.equal(f.c.D.walletBal,5000);assert.equal(f.c.D.walletRecs.length,1);
let z=f.c.D.walletRecs[0];assert.equal(z.kind,'out');assert.equal(z.cat,'雑費');assert.equal(z.amount,7000);assert.equal(z.memo,'不明金（残高合わせ 1/2）');assert.equal(z.adjust.before,12000);
assert.match(r.note[0],/雑費 ¥7000/);assert.equal(f.c.D.expenses.length,0,'雑費 stays out of 生活費 category ratios');
// 2) idempotent: same item, resend with new id, reload from storage
assert.equal(f.c.cfg.apply([tu()]),0);assert.equal(f.c.cfg.apply([{...tu(),id:'resend'}]),0);assert.equal(f.c.D.walletBal,5000);
let saved=JSON.parse(f.values.get('lp_data'));assert.equal(saved.walletBal,5000);
let f2=fixture(saved.walletBal,saved.walletRecs,{walletInboxKeys:saved.walletInboxKeys,walletAsOf:saved.walletAsOf});assert.equal(f2.c.cfg.apply([tu()]),0);
assert.ok(f.c.cfg.describe(tu()).same);
// 3) app lower than real cash -> 雑収入 in record
f=fixture(3000);r=f.c.cfg.apply([tu()]);assert.equal(f.c.D.walletBal,5000);z=f.c.D.walletRecs[0];assert.equal(z.kind,'in');assert.equal(z.cat,'雑収入');assert.equal(z.amount,2000);assert.match(r.note[0],/雑収入 ¥2000/);
// 4) equal -> nothing recorded, but key remembered
f=fixture(5000);r=f.c.cfg.apply([tu()]);assert.equal(N(r),1);assert.equal(f.c.D.walletRecs.length,0);assert.equal(f.c.D.walletBal,5000);assert.match(r.note[0],/ぴったり👍/);
assert.equal(f.c.cfg.apply([tu()]),0);
// 5) same batch: earlier receipt always applied first, whatever the list order; later receipt after
for(const order of [[0,1,2],[2,1,0],[1,0,2]]){
 f=fixture(12000);const items=[tu(),rc(1500,'12:49'),rc(300,'14:10')];
 f.c.cfg.apply(order.map(i=>items[i]));
 assert.equal(f.c.D.walletBal,4700);const zz=f.c.D.walletRecs.find(x=>x.cat==='雑費');assert.equal(zz.amount,5500);assert.equal(zz.adjust.before,10500);
}
// 6) preview: 今の残高 → 実際 → 差額, plus receipts applied first; live with/without receipt
f=fixture(12000);const early=rc(1500,'12:49');
let d=f.c.cfg.describe(tu(),[early,tu()]);assert.ok(d.ok);assert.ok(d.live);
let t=d.detail.join('\n');assert.match(t,/先に反映するレシート：テスト店 −¥1500/);assert.match(t,/今の残高 ¥12000（レシート反映後 ¥10500） → 実際 ¥5000 → 差額 −¥5500（雑費として記録）/);
t=f.c.cfg.describe(tu(),[]).detail.join('\n');assert.match(t,/今の残高 ¥12000 → 実際 ¥5000 → 差額 −¥7000（雑費として記録）/);
t=fixture(4000).c.cfg.describe(tu(),[]).detail.join('\n');assert.match(t,/差額 \+¥1000（雑収入として記録）/);
t=fixture(6500).c.cfg.describe(tu(),[early]).detail.join('\n');assert.match(t,/ぴったり👍/);
// 7) receipt from before asOf arriving AFTER the true-up: warned and unchecked; later receipt is normal
f=fixture(12000);f.c.cfg.apply([tu()]);
d=f.c.cfg.describe(early);assert.ok(d.ok);assert.match(String(d.conflict),/残高合わせより前のレシートです/);
const sameDayNoTime={kind:'wallet',date:'2020-01-01',data:{amount:200,kind:'out',sourceKey:'manual-test-0001'}};assert.match(String(f.c.cfg.describe(sameDayNoTime).conflict),/残高合わせより前/);
assert.equal(f.c.cfg.describe(rc(300,'14:10')).conflict,0);
// user may still deliberately import it
assert.equal(f.c.cfg.apply([early]),1);assert.equal(f.c.D.walletBal,3500);
// 8) monthly summary: 雑費 count/total, 雑収入 own line, net; hint thresholds
const recs=[{date:'2020-01-02',kind:'out',cat:'雑費',amount:3500},{date:'2020-01-03',kind:'out',cat:'食費',amount:40000},{date:'2020-01-05',kind:'in',cat:'雑収入',amount:500},{date:'2020-02-01',kind:'out',cat:'雑費',amount:999},{date:'2020-01-06',kind:'in',cat:'',amount:9000}];
z=wallet.zatsu({walletRecs:recs},'2020-01');assert.deepEqual([z.outCount,z.out,z.inCount,z.in,z.net,z.cashOut,z.hint],[1,3500,1,500,-3000,43500,true]);
z=wallet.zatsu({walletRecs:[{date:'2020-01-02',kind:'out',cat:'雑費',amount:900},{date:'2020-01-02',kind:'out',cat:'食費',amount:20000}]},'2020-01');assert.equal(z.hint,false);
z=wallet.zatsu({walletRecs:[{date:'2020-01-02',kind:'out',cat:'雑費',amount:900},{date:'2020-01-02',kind:'out',cat:'食費',amount:2000}]},'2020-01');assert.equal(z.hint,true);
assert.match(html,/const WAL_CATS=\[[^\]]*"雑費"/);assert.match(html,/id="mmZatsu"/);assert.match(html,/id="wfZatsu"/);
assert.ok(html.indexOf('wallet-inbox.js?v=2')<html.indexOf('"use strict";'),'wallet-inbox loads before the main script');
// 9) validation
for(const bad of [{target:-1},{target:1.5},{target:'5000'},{asOf:'nope'},{asOf:undefined},{sourceKey:'x'}]){const it=tu();Object.assign(it.data,bad);f=fixture();assert.equal(Boolean(f.c.cfg.describe(it).ok),false);assert.equal(f.c.cfg.apply([it]),0);assert.equal(f.c.D.walletBal,10000)}
// 10) write failures leave balance untouched
for(const fail of ['backup','state']){f=fixture(12000);f.storage.fail=fail;assert.throws(()=>f.c.cfg.apply([tu()]));assert.equal(f.c.D.walletBal,12000);assert.equal(JSON.parse(f.values.get('lp_data')).walletBal,12000);assert.equal(JSON.parse(f.values.get('lp_data')).walletRecs.length,0)}
console.log('PASS: true-up lower/higher/equal, idempotent+reload, batch ordering, preview text, pre-asOf warning, 雑費 summary+hint, validation, write failures');
