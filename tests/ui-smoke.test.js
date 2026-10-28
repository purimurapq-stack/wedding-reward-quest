// Minimal DOM harness. Browser rendering and real-device tests remain separate.
import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {fresh} from '../src/domain.js';
function harness(){
 const listeners={},timers=[];let html='',modal='',writes=0,fail=false,scroll=0;
 const saved=fresh();saved.seen=true;const memory=new Map([['reward-quest-v1',JSON.stringify(saved)]]);
 const clock={value:'2026-11-01T21:00'},count={textContent:''},error={hidden:true,textContent:''};
 const inputs=Array.from({length:14},(_,i)=>({dataset:{item:String(i)},checked:false,disabled:false}));
 const app={set innerHTML(v){html=v;modal='';writes++;},get innerHTML(){return html;},append(d){modal=d.innerHTML;},querySelector(){return {inert:false};}};
 const document={hidden:false,body:{classList:{toggle(){}}},querySelector(sel){if(sel==='#app')return app;if(sel==='#clock')return clock;if(sel==='#item-count')return count;if(sel==='#save-error')return error;if(sel==='#record-date')return {value:'2026-11-01'};if(sel==='#toast')return {classList:{add(){},remove(){}},textContent:''};return null;},querySelectorAll(sel){if(sel==='[data-item]')return inputs;if(sel==='dialog')return [{remove(){modal='';}}];return [];},addEventListener(name,fn){listeners[name]=fn;},createElement(){return {innerHTML:'',setAttribute(){},addEventListener(){},showModal(){}};}};
 const context=vm.createContext({document,window:{scrollY:400,addEventListener(){},scrollTo(){scroll++;}},localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>{if(fail)throw Error('quota');memory.set(k,v);}},navigator:{},matchMedia:()=>({matches:false}),Date,Intl,structuredClone,Blob,URL,FormData:function(form){return new Map(Object.entries(form.fields));},setInterval:fn=>{timers.push(fn);},setTimeout:()=>0,clearTimeout(){},console});
 const source=['itinerary','data','domain','storage','visuals','app'].map(name=>readFileSync(`src/${name}.js`,'utf8').replace(/import \{[^}]*\} from '[^']+';/g,'').replace(/\bexport\s+(?=(?:const|function|class)\b)/g,'')).join('\n');vm.runInContext(source,context);
 return {html:()=>html,modal:()=>modal,clock,error,count,inputs,writes:()=>writes,scroll:()=>scroll,failSave:()=>{fail=true;},async submit(fields){await listeners.submit({target:{id:'itinerary-editor',fields},preventDefault(){}});},async check(id,checked){const input=inputs[id];input.checked=checked;await listeners.change({target:input});},async click(dataset={},id='',dismiss=false){await listeners.click({target:{closest(){return {dataset,id,hasAttribute:()=>dismiss};}},preventDefault(){}});},tick(){timers.forEach(fn=>fn());},state:()=>JSON.parse(memory.get('reward-quest-v1'))};
}
test('five screens, demo clock, notification and shared growth still work',async()=>{
 const h=harness();assert.match(h.html(),/NEXT ACTION/);for(const page of ['quest','status','item','settings']){await h.click({page});assert.match(h.html(),/メインメニュー/);}
 await h.click({},'setclock');await h.click({page:'quest'});h.tick();assert.match(h.modal(),/NEW QUEST UNLOCKED/);
 const before=h.writes();await h.click({},'',true);assert.equal(h.writes(),before);assert.equal(h.state().ack.length,1);
 await h.click({page:'status'});await h.click({event:'d1-bath'});assert.match(h.modal(),/LEVEL UP!/);assert.equal(h.state().players.bride.hp[1],110);
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
test('switching bus plans updates real schedules and warning without exposing future park names',async()=>{
 const h=harness();await h.click({page:'settings'});h.clock.value='2026-11-01T14:16';await h.click({},'setclock');await h.click({page:'home'});assert.match(h.html(),/14:20/);assert.match(h.html(),/16:04のバスを逃すと帰還が困難/);assert.match(h.html(),/15:50/);assert.ok(!h.html().includes('まきば公園'));
 await h.click({page:'quest'});await h.click({day:'2'});await h.click({bus:'late'});assert.equal(h.state().plan.bus,'late');await h.click({page:'home'});assert.match(h.html(),/15:10/);assert.ok(!h.html().includes('まきば公園'));
});

test('bride editor saves real row changes and the groom display masks custom future details',async()=>{
 const h=harness();await h.click({page:'settings'});await h.click({role:'bride'});await h.click({page:'quest'});await h.click({day:'2'});assert.match(h.html(),/サンダンス/);await h.click({editAction:'a2-lunch'});assert.match(h.modal(),/ITINERARY EDITOR/);
 await h.submit({time:'12:30',detail:'新しい昼食会場',safeText:'昼食',note:'混雑状況を確認',safeNote:'昼食予定',revealTime:'11:04'});assert.equal(h.state().plan.actions['a2-lunch'].time,'12:30');assert.match(h.html(),/12:30/);
 await h.click({page:'settings'});await h.click({role:'groom'});await h.click({page:'quest'});await h.click({day:'2'});assert.ok(!h.html().includes('新しい昼食会場'));
});
test('rapid independent checks preserve all pending selections without DOM replacement',async()=>{
 const h=harness();await h.click({page:'item'});const writes=h.writes();await Promise.all([h.check(0,true),h.check(1,true),h.check(2,true)]);assert.equal(h.writes(),writes);assert.equal(h.count.textContent,'3 / 14');assert.deepEqual(h.state().items,[0,1,2]);
});
