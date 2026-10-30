import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {homePresentation,homeBackgrounds,homeChapters} from '../src/home.js';
import {fresh,applyEvent,notifications} from '../src/domain.js';import {recoveryEvents,eventEffect} from '../src/data.js';
const jst=value=>Date.parse(value+'+09:00');
test('all HOME messages and backgrounds use the requested JST date and time boundaries',()=>{
 const cases=[
 ['2026-10-30T23:59:59','before','night','wedding'],['2026-10-31T00:00:00','day1','night','hotelNight'],
 ['2026-10-31T04:59:59','day1','night','hotelNight'],['2026-10-31T05:00:00','day1','morning','departure'],
 ['2026-10-31T11:59:59','day1','morning','departure'],['2026-10-31T12:00:00','day1','afternoon','departure'],
 ['2026-10-31T17:59:59','day1','afternoon','departure'],['2026-10-31T18:00:00','day1','night','hotelNight'],
 ['2026-11-01T00:00:00','day2','night','starlight'],['2026-11-01T05:00:00','day2','morning','meadow'],
 ['2026-11-01T12:00:00','day2','afternoon','meadow'],['2026-11-01T18:00:00','day2','night','starlight'],
 ['2026-11-02T00:00:00','day3','night','homeward'],['2026-11-02T05:00:00','day3','morning','homeward'],
 ['2026-11-02T12:00:00','day3','afternoon','homeward'],['2026-11-02T18:00:00','day3','night','homeward'],
 ['2026-11-03T00:00:00','after','night','ending']];
 for(const [time,chapter,period,background] of cases){const result=homePresentation(jst(time)),entry=homeChapters[chapter];assert.equal(result.chapter,chapter,time);assert.equal(result.period,period,time);assert.equal(result.background,background,time);assert.equal(result.title,entry.title);assert.deepEqual(result.message,entry.message||entry.messages[period]);}
 assert.deepEqual(homePresentation(Date.parse('2026-10-31T09:00:00Z')),homePresentation(jst('2026-10-31T18:00:00')));
 for(const date of ['2026-10-30','2026-11-03'])assert.equal(homePresentation(jst(date+'T06:00:00')).key,homePresentation(jst(date+'T20:00:00')).key);
});
test('all seven pixel backgrounds exist with no external resources and can be replaced independently',async()=>{
 assert.equal(Object.keys(homeBackgrounds).length,7);
 for(const entry of Object.values(homeBackgrounds)){assert.ok(entry.src.startsWith('./assets/backgrounds/'));const svg=await readFile(entry.src,'utf8');assert.match(svg,/viewBox="0 0 320 200"/);assert.match(svg,/shape-rendering="crispEdges"/);assert.ok(!/<script|<image|href=|<foreignObject/i.test(svg));}
 const css=await readFile('src/style.css','utf8');assert.match(css,/home-scenery-fade/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/\.home-scenery\[hidden\]/);
});
test('final-day breakfast and relaxation reward once each and use natural notification names',()=>{
 const day3=recoveryEvents.filter(e=>e.day===3);assert.deepEqual(day3.map(e=>e.id),['d3-meal','d3-rest']);assert.ok(day3.every(e=>['meal','rest'].includes(e.effect)));
 let s=fresh();for(const event of day3){const at=Date.parse(event.availableAt);assert.equal(applyEvent(s,event.id,at-1),s);s=applyEvent(s,event.id,at);assert.deepEqual(applyEvent(s,event.id,at),s);}
 assert.equal(s.players.groom.hp[1],125);assert.equal(s.players.groom.mp[1],180);assert.equal(s.players.groom.joy[1],240);
 const texts=notifications(fresh(),jst('2026-11-02T09:00:00')).filter(n=>n.ref.startsWith('d3-')).map(n=>n.text);assert.deepEqual(texts,['ホテルで朝食を食べた？','ホテルでゆっくり過ごした？']);
 const old={...s,done:['d3-meal','d3-rest','d2-sleep']};assert.deepEqual(applyEvent(old,'d3-meal',jst('2026-11-03T09:00:00')),old);
 assert.equal(eventEffect(day3[0]).name,'ホテルで朝食を食べた');
});
