// Minimal DOM harness, not a substitute for rendering or real-device tests.
import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {fresh} from '../src/domain.js';
function harness(){
 const listeners={},timers=[];let html='',modal='';const saved=fresh();saved.seen=true;const memory=new Map([['reward-quest-v1',JSON.stringify(saved)]]);
 const clock={value:'2026-11-01T21:00'};
 const app={set innerHTML(v){html=v;modal='';},get innerHTML(){return html;},append(d){modal=d.innerHTML;},querySelector(){return {inert:false};}};
 const document={hidden:false,body:{classList:{toggle(){}}},querySelector(sel){if(sel==='#app')return app;if(sel==='#clock')return clock;if(sel==='#record-date')return {value:'2026-11-01'};if(sel==='#toast')return {classList:{add(){},remove(){}},textContent:''};return null;},addEventListener(name,fn){listeners[name]=fn;},createElement(){return {innerHTML:'',setAttribute(){},addEventListener(){},showModal(){}};}};
 const context=vm.createContext({document,window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},navigator:{},matchMedia:()=>({matches:false}),Date,Intl,structuredClone,Blob,URL,FormData,setInterval:fn=>{timers.push(fn);},setTimeout:()=>0,clearTimeout(){},console});
 const source=['data','domain','storage','visuals','app'].map(name=>readFileSync(`src/${name}.js`,'utf8').replace(/import \{[^}]*\} from '[^']+';/g,'').replace(/\bexport\s+(?=(?:const|function|class)\b)/g,'')).join('\n');vm.runInContext(source,context);
 return {html:()=>html,modal:()=>modal,clock,async click(dataset={},id='',dismiss=false){await listeners.click({target:{closest(){return {dataset,id,hasAttribute:()=>dismiss};}},preventDefault(){}});},tick(){timers.forEach(fn=>fn());},state:()=>JSON.parse(memory.get('reward-quest-v1'))};
}
test('five screens render, demo date advances next action and notification/event flow persists',async()=>{
 const h=harness();assert.match(h.html(),/NEXT ACTION/);for(const page of ['quest','status','item','settings']){await h.click({page});assert.match(h.html(),/メインメニュー/);}
 await h.click({},'setclock');await h.click({page:'quest'});h.tick();assert.match(h.modal(),/NEW QUEST UNLOCKED/);
 await h.click({},'',true);assert.ok(h.state().ack.length===1);await h.click({page:'status'});assert.match(h.html(),/回復イベント/);
 await h.click({event:'d1-bath'});assert.match(h.modal(),/LEVEL UP!/);assert.ok(h.state().done.includes('d1-bath'));assert.equal(h.state().players.bride.hp[1],110);
 await h.click({},'',true);await h.click({page:'home'});assert.match(h.html(),/次の行動|NEXT ACTION/);
});
