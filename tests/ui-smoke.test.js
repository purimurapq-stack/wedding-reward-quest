// Minimal DOM harness. Browser rendering and real-device tests remain separate.
import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {fresh} from '../src/domain.js';
function harness(options={}){
 const listeners={},timers=[],timeouts=new Map(),raf=[];let html='',modal='',writes=0,fail=false,scroll=0,timeoutId=0;const base=Date.parse(options.now||'2026-10-29T00:00:00+09:00');let virtual=base;class Clock extends Date{static now(){return virtual;}}
 const saved=fresh();saved.seen=options.seen??true;saved.motion=options.motion??true;const memory=new Map([['reward-quest-v1',JSON.stringify(saved)]]);
 const clock={value:'2026-11-01T21:00'},count={textContent:''},error={hidden:true,textContent:''};
 const inputs=Array.from({length:14},(_,i)=>({dataset:{item:String(i)},checked:false,disabled:false}));
 const app={set innerHTML(v){html=v;modal='';writes++;},get innerHTML(){return html;},append(d){modal=d.innerHTML;},querySelector(){return {inert:false};}};
 const document={hidden:false,body:{classList:{toggle(){}}},querySelector(sel){if(sel==='#app')return app;if(sel==='#clock')return clock;if(sel==='#item-count')return count;if(sel==='#save-error')return error;if(sel==='#record-date')return {value:'2026-11-01'};if(sel==='#toast')return {classList:{add(){},remove(){}},textContent:''};return null;},querySelectorAll(sel){if(sel==='[data-item]')return inputs;if(sel==='dialog')return [{remove(){modal='';}}];if(sel==='[data-growth-count]')return growthNumbers;if(sel==='[data-growth-bar]')return growthBars;return [];},addEventListener(name,fn){listeners[name]=fn;},createElement(){return {innerHTML:'',setAttribute(){},addEventListener(){},showModal(){},querySelector(){return {focus(){}};}};}};
 const windowListeners={};const location={search:options.role==='bride'?'?role=bride':'',protocol:'https:'};
 const context=vm.createContext({location,URLSearchParams,document,window:{scrollY:400,addEventListener(name,fn){windowListeners[name]=fn;},scrollTo(){scroll++;}},localStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>{if(fail){const error=Error('quota');error.name='QuotaExceededError';throw error;}memory.set(k,v);}},navigator:{},matchMedia:()=>({matches:false}),Date:Clock,Intl,structuredClone,Blob,URL,FileReader:class{readAsDataURL(file){this.result=file.data;this.onload();}},Image:class{set src(value){this.onload();}},FormData:function(form){return new Map(Object.entries(form.fields));},setInterval:fn=>{timers.push(fn);},performance:{now:()=>virtual-base},requestAnimationFrame:fn=>{raf.push(fn);return raf.length;},setTimeout:(fn,ms)=>{timeouts.set(++timeoutId,{fn,at:virtual+ms});return timeoutId;},clearTimeout:id=>timeouts.delete(id),console});
 const growthNumbers=[{dataset:{from:'100',to:'130'},textContent:'100'}],growthBars=[{dataset:{from:'76.923'},style:{width:'76.923%'}}];
 const source=['itinerary','data','domain','storage','home','visuals','app'].map(name=>readFileSync(`src/${name}.js`,'utf8').replace(/import \{[^}]*\} from '[^']+';/g,'').replace(/\bexport\s+(?=(?:const|function|class)\b)/g,'').replace(/export async function/g,'async function')).join('\n');vm.runInContext(source,context);
 return {async setRole(role){location.search='?role='+role;windowListeners.storage();},async runTo(ms){const target=base+ms;while(true){const due=[...timeouts].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;timeouts.delete(due[0]);virtual=due[1].at;await due[1].fn();}virtual=target;},animate(ms){virtual=base+ms;const callbacks=raf.splice(0);callbacks.forEach(fn=>fn(ms));},growthNumbers,growthBars,html:()=>html,modal:()=>modal,clock,error,count,inputs,writes:()=>writes,scroll:()=>scroll,failSave:()=>{fail=true;},async submit(fields){await listeners.submit({target:{id:'itinerary-editor',fields},preventDefault(){}});},async check(id,checked){const input=inputs[id];input.checked=checked;await listeners.change({target:input});},async click(dataset={},id='',dismiss=false){await listeners.click({target:{closest(){return {dataset,id,hasAttribute:()=>dismiss};}},preventDefault(){}});},tick(){timers.forEach(fn=>fn());},state:()=>JSON.parse(JSON.stringify(vm.runInContext('repository.load()',context)))};
}
test('five screens, demo clock, notification and shared growth still work',async()=>{
 const h=harness({role:'bride'});assert.match(h.html(),/NEXT ACTION/);for(const page of ['quest','status','item','settings']){await h.click({page});assert.match(h.html(),/メインメニュー/);}
 await h.click({},'setclock');await h.click({page:'quest'});h.tick();assert.match(h.modal(),/NEW QUEST UNLOCKED/);
 const before=h.writes();await h.click({},'',true);assert.equal(h.writes(),before);assert.equal(h.state().ack.length,1);
 await h.click({page:'status'});await h.click({event:'d1-bath'});assert.match(h.modal(),/LEVEL UP!/);assert.equal(h.state().players.bride.hp[1],130);
});
test('item changes update only controls/count and never replace the screen or scroll',async()=>{
 const h=harness();await h.click({page:'item'});const writes=h.writes(),scroll=h.scroll();
 await h.check(0,true);assert.equal(h.writes(),writes);assert.equal(h.scroll(),scroll);assert.equal(h.inputs[0].checked,true);assert.equal(h.count.textContent,'1 / 14');assert.deepEqual(h.state().items,[0]);
 await h.check(1,true);await h.check(0,false);assert.equal(h.count.textContent,'1 / 14');assert.equal(h.writes(),writes);assert.deepEqual(h.state().items,[1]);
});
test('failed item storage rolls the checkbox and count back without rebuilding the screen',async()=>{
 const h=harness();await h.click({page:'item'});await h.check(0,true);const writes=h.writes();h.failSave();await h.check(1,true);
 assert.equal(h.inputs[1].checked,false);assert.equal(h.inputs[1].disabled,false);assert.equal(h.inputs[0].checked,true);assert.equal(h.count.textContent,'1 / 14');assert.equal(h.error.hidden,false);assert.match(h.error.textContent,/保存できません/);assert.equal(h.writes(),writes);assert.deepEqual(h.state().items,[0]);
});
test('warning appears at 14:00 while open and bus selection UI is absent',async()=>{
 const h=harness({role:'bride'});await h.click({page:'settings'});h.clock.value='2026-11-01T13:59';await h.click({},'setclock');await h.click({page:'home'});h.tick();
 assert.ok(!h.html().includes('class="bus-warning"'));await h.click({},'',true);await h.runTo(60000);h.tick();assert.match(h.html(),/バスの時間がやばいよ！/);assert.match(h.html(),/15:50/);
 await h.click({page:'quest'});await h.click({day:'2'});assert.ok(!h.html().includes('data-bus='));assert.ok(!h.html().includes('15:10'));assert.match(h.html(),/14:20/);
});
test('groom cannot see or activate demo controls; bride can use them',async()=>{
 const h=harness();await h.click({page:'settings'});assert.ok(!h.html().includes('id="clock"'));assert.ok(!h.html().includes('id="setclock"'));
 await h.click({},'setclock');assert.ok(!h.html().includes('DEMO TIME'));
 await h.setRole('bride');assert.match(h.html(),/id="clock"/);await h.click({},'setclock');assert.match(h.html(),/DEMO TIME/);
 await h.setRole('groom');assert.ok(!h.html().includes('DEMO TIME'));assert.ok(!h.html().includes('id="clock"'));
});
test('bride editor saves real row changes and the groom display masks custom future details',async()=>{
 const h=harness();await h.click({page:'settings'});await h.setRole('bride');await h.click({page:'quest'});await h.click({day:'2'});assert.match(h.html(),/昼食タイム！/);await h.click({editAction:'a2-lunch'});assert.match(h.modal(),/ITINERARY EDITOR/);
 await h.submit({time:'12:30',detail:'新しい昼食会場',safeText:'昼食',note:'混雑状況を確認',safeNote:'昼食予定',revealTime:'11:04'});assert.equal(h.state().plan.actions['a2-lunch'].time,'12:30');assert.match(h.html(),/12:30/);
 await h.click({page:'settings'});await h.setRole('groom');await h.click({page:'quest'});await h.click({day:'2'});assert.ok(!h.html().includes('新しい昼食会場'));
});
test('rapid independent checks preserve all pending selections without DOM replacement',async()=>{
 const h=harness();await h.click({page:'item'});const writes=h.writes();await Promise.all([h.check(0,true),h.check(1,true),h.check(2,true)]);assert.equal(h.writes(),writes);assert.equal(h.count.textContent,'3 / 14');assert.deepEqual(h.state().items,[0,1,2]);
});

test('opening shows PNGs and petals, changes at 5/11s, and automatically saves/returns HOME at 15s',async()=>{
 const h=harness({seen:false});assert.match(h.modal(),/MAIN QUEST CLEAR!/);assert.match(h.modal(),/character_hanayome_01_black.png/);assert.match(h.modal(),/character_hanamuko_gray_black.png/);assert.match(h.modal(),/petal/);
 await h.runTo(4999);assert.match(h.modal(),/MAIN QUEST CLEAR!/);await h.runTo(5000);assert.match(h.modal(),/おうちへ帰還/);assert.match(h.modal(),/intro-gauge/);
 await h.runTo(11000);assert.match(h.modal(),/NEW QUEST UNLOCKED/);await h.runTo(15000);assert.match(h.html(),/NEXT ACTION/);assert.equal(h.modal(),'');assert.equal(h.state().seen,true);
});
test('reduced motion keeps the same automatic duration and skip/replay preserve saves',async()=>{
 const h=harness({seen:false,motion:false});await h.runTo(15000);assert.equal(h.modal(),'');assert.equal(h.state().seen,true);await h.click({page:'item'});await h.check(0,true);await h.click({page:'settings'});await h.click({},'replay');assert.match(h.modal(),/MAIN QUEST CLEAR!/);await h.click({},'skip');assert.match(h.html(),/NEXT ACTION/);assert.deepEqual(h.state().items,[0]);
});
test('growth popup counts maximums and fills gauges without changing saved rewards again',async()=>{
 const h=harness({role:'bride'});await h.click({page:'settings'});await h.click({},'setclock');await h.click({page:'status'});await h.click({event:'d1-bath'});assert.match(h.modal(),/最大HP/);assert.match(h.modal(),/＋30/);assert.match(h.modal(),/data-growth-count/);
 h.animate(700);assert.ok(+h.growthNumbers[0].textContent>100);assert.ok(+h.growthNumbers[0].textContent<130);h.animate(1400);assert.equal(+h.growthNumbers[0].textContent,130);assert.equal(h.growthBars[0].style.width,'100%');assert.equal(h.state().players.bride.hp[1],130);
});
test('repository PNG paths are used everywhere; no upload control or URL role buttons remain',async()=>{
 const h=harness();assert.match(h.html(),/assets\/characters\/character_hanayome_01_black.png/);await h.click({page:'settings'});assert.ok(!h.html().includes('type="file"'));assert.ok(!h.html().includes('data-role='));await h.click({},'replay');assert.match(h.modal(),/assets\/characters\/character_hanamuko_gray_black.png/);
});
test('all status values and recovery events are available without Google login',async()=>{
 const h=harness();assert.match(h.html(),/class="statline"/);assert.ok(!h.html().includes('Googleでログイン'));await h.click({page:'status'});assert.match(h.html(),/class="statline"/);await h.click({page:'settings'});assert.ok(!h.html().includes('id="login"'));assert.match(h.html(),/ログインなし/);
});

test('both roles see the requested HOME heading, messages and scenery without changing saves',async()=>{
 for(const role of ['bride','groom']){
  const h=harness({role,now:'2026-11-01T12:00:00+09:00'}),before=h.state();
  assert.match(h.html(),/八ヶ岳を大冒険！/);assert.match(h.html(),/絶景を目指して、いざ出発！/);assert.match(h.html(),/backgrounds\/meadow.svg/);assert.deepEqual(h.state(),before);
 }
});
test('HOME updates across noon, 18:00 and JST midnight while open; deferred modal updates are retried',async()=>{
 for(const [start,title,message,background] of [
  ['2026-10-31T11:59:59+09:00','冒険のはじまり','新しい景色、新しい冒険！','departure'],
  ['2026-11-01T17:59:59+09:00','八ヶ岳を大冒険！','今日もたくさん冒険したね！','starlight'],
  ['2026-11-02T23:59:59+09:00','二人の冒険、クリア！','メインクエスト、クリア！','ending']]){
  const h=harness({now:start});h.tick();await h.runTo(1000);h.tick();if(h.modal())await h.click({},'',true);h.tick();
  assert.ok(h.html().includes(title));assert.ok(h.html().includes(message));assert.ok(h.html().includes('backgrounds/'+background+'.svg'));
 }
});
