const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elems=new Map();
const elem=key=>{if(!elems.has(key)) elems.set(key,{textContent:'',style:{},dataset:{},events:{},classList:{contains:()=>false,add(){},remove(){}},addEventListener(name,cb){this.events[name]=cb},querySelectorAll:()=>[]});return elems.get(key)};
let next=0;const timers=new Map();let haptics=0;
const node=()=>({style:{},setAttribute(){},appendChild(){},click(){haptics++},remove(){}});
const RealDate=Date; class FixedDate extends RealDate { constructor(...a){super(...(a.length?a:[2026,0,2,23,59]))} }
const ctx=vm.createContext({document:{getElementById:elem,querySelector:elem,querySelectorAll:()=>[],createElement:node,body:node()},navigator:{},window:{},console:{log(){}},Date:FixedDate,setTimeout(cb,ms){timers.set(++next,{cb,ms});return next},clearTimeout(id){timers.delete(id)}});
vm.runInContext(fs.readFileSync(process.env.SOURCE || __dirname+'/script.js','utf8')+'\nglobalThis.subject=calculator',ctx);
const c=ctx.subject;
c.currentInput='1,000';c.triggerMagicCalculation();assert.equal(Number(c.currentInput.replace(/,/g,'')),1029000); // January 2 23:59 + 1 minute = 1030000 (Jan 3 00:00), minus 1000
assert.equal(vm.runInContext('getMagicTimeNumber(new Date(2026,9,30,12,59))',ctx),10301300); // 12:59 -> 13:00, never "12:60"
assert.equal(vm.runInContext('getMagicTimeNumber(new Date(2026,11,31,23,59))',ctx),1010000); // year-end rolls to Jan 1 00:00
let digit,operation;c.highlightDigitCount=n=>digit=n;c.highlightOperation=n=>operation=n;
c.currentInput='1,000';c.showCalculatorHint();assert.equal(digit,7);assert.equal(operation,'add');
let prevented=0;const event={preventDefault:()=>prevented++};const display=elem('.display');
display.events.mousedown(event);assert.equal(c.buttonsLocked,true);assert.equal([...timers.values()][0].ms,3000);display.events.mouseleave(event);assert.equal(c.buttonsLocked,false);assert.equal(timers.size,0);
display.events.touchstart(event);const timer=[...timers.values()][0];timer.cb();assert.equal(c.magicCalculated,true);display.events.touchcancel(event);assert.equal(c.buttonsLocked,false);assert.equal(timers.size,0);assert.equal(haptics,0);
display.events.touchstart(event);display.events.touchend(event);assert.equal(haptics,0); // released before the magic fired: no vibration
display.events.touchstart(event);[...timers.values()][0].cb();display.events.touchend(event);assert.equal(haptics,1); // released after the magic fired: vibrate once
let show=0,hide=0;c.showCalculatorHint=()=>show++;c.hideCalculatorHint=()=>hide++;
const hint=elem('[data-action="calculator"]');for(const key of ['mousedown','touchstart','mouseup','touchend','mouseleave','touchcancel']) hint.events[key](event);
assert.equal(show,2);assert.equal(hide,4);assert.equal(prevented,10);
console.log('phone: minute rollover, hint, press/release/cancel, timer unlock and release haptic passed');
