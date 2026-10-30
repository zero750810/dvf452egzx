const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elems=new Map();let labelClicks=0;
const elem=key=>{if(!elems.has(key)) elems.set(key,{textContent:'',style:{},dataset:{},events:{},classList:{contains:()=>false,add(){},remove(){}},addEventListener(name,cb){this.events[name]=cb},querySelectorAll:()=>[],querySelector:sub=>elem(key+' '+sub),click(){labelClicks++}});return elems.get(key)};
let next=0;const timers=new Map();
const RealDate=Date; class FixedDate extends RealDate { constructor(...a){super(...(a.length?a:[2026,0,2,23,59]))} }
let clock=100000;FixedDate.now=()=>clock;
const ctx=vm.createContext({document:{getElementById:elem,querySelector:elem,querySelectorAll:()=>[]},navigator:{},window:{},console:{log(){}},Date:FixedDate,setTimeout(cb,ms){timers.set(++next,{cb,ms});return next},clearTimeout(id){timers.delete(id)}});
vm.runInContext(fs.readFileSync(process.env.SOURCE || __dirname+'/script.js','utf8')+'\nglobalThis.subject=calculator',ctx);
const c=ctx.subject;
c.currentInput='1,000';c.triggerMagicCalculation();assert.equal(Number(c.currentInput.replace(/,/g,'')),1029000); // January 2 23:59 + 1 minute = 1030000 (Jan 3 00:00), minus 1000
assert.equal(vm.runInContext('getMagicTimeNumber(new Date(2026,9,30,12,59))',ctx),10301300); // 12:59 -> 13:00, never "12:60"
assert.equal(vm.runInContext('getMagicTimeNumber(new Date(2026,11,31,23,59))',ctx),1010000); // year-end rolls to Jan 1 00:00
let digit,operation;c.highlightDigitCount=n=>digit=n;c.highlightOperation=n=>operation=n;
c.currentInput='1,000';c.showCalculatorHint();assert.equal(digit,7);assert.equal(operation,'add');
const display=elem('.display'),sw=elem('.haptic-switch input');
display.events.pointerdown();assert.equal(c.buttonsLocked,true);assert.equal(sw.disabled,true);assert.equal([...timers.values()][0].ms,3000);display.events.pointerleave();assert.equal(c.buttonsLocked,false);assert.equal(timers.size,0);
display.events.pointerdown();display.events.pointerup();assert.equal(c.magicCalculated,false);assert.equal(sw.disabled,true); // released early: no magic, switch stays off (no vibration)
display.events.pointerdown();[...timers.values()][0].cb();assert.equal(c.magicCalculated,true);assert.equal(sw.disabled,false);display.events.pointercancel();assert.equal(c.buttonsLocked,false);assert.equal(timers.size,0);
// finger's click toggles the armed switch -> two scripted extra pulses, then it disarms
sw.events.change();[...timers.values()].at(-1).cb();assert.equal(labelClicks,1);sw.events.change();[...timers.values()].at(-1).cb();assert.equal(labelClicks,2);sw.events.change();assert.equal(sw.disabled,true);
display.events.pointerdown();assert.equal(sw.disabled,true); // a new press disarms any leftover switch
display.events.pointerup();
// backup trigger: three quick taps fire the magic on the third tap's pointerup (before its click)
const tap=(hold,gap)=>{clock+=gap;display.events.pointerdown();clock+=hold;display.events.pointerup()};
clock+=5000;c.currentInput='1,000';
tap(100,0);tap(100,200);assert.equal(c.magicCalculated,false);tap(100,200);assert.equal(c.magicCalculated,true);assert.equal(sw.disabled,false);assert.equal(Number(c.currentInput.replace(/,/g,'')),1029000);
clock+=5000;tap(100,0);tap(100,200);tap(100,800);assert.equal(c.magicCalculated,false); // too slow: no trigger
clock+=5000;tap(100,0);tap(500,200);tap(100,200);assert.equal(c.magicCalculated,false); // a held press breaks the sequence
let prevented=0;const event={preventDefault:()=>prevented++};
let show=0,hide=0;c.showCalculatorHint=()=>show++;c.hideCalculatorHint=()=>hide++;
const hint=elem('[data-action="calculator"]');for(const key of ['mousedown','touchstart','mouseup','touchend','mouseleave','touchcancel']) hint.events[key](event);
assert.equal(show,2);assert.equal(hide,4);assert.equal(prevented,4);
console.log('phone: minute rollover, hint, long press, switch arm/disarm, haptic pulses and triple tap passed');
