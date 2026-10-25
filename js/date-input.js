// Preserve ISO values and the native mobile calendar; render dates in day/month/year order.
export function displayDayFirst(input){
 if(!input||input.parentElement.classList.contains('day-first-date'))return;
 if(!document.getElementById('dayFirstDateStyle')){
  const style=document.createElement('style');style.id='dayFirstDateStyle';
  style.textContent='.day-first-date{position:relative;display:block;min-width:0;width:100%;border:1px solid #dfd0ee;border-radius:14px;background:#fff;min-height:48px;color:#302047}.day-first-date input[type="date"]{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;z-index:1}.day-first-date:focus-within{outline:2px solid #8050b3;outline-offset:2px}.day-first-date:has(input:disabled){opacity:.55}.day-first-date .date-display{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:0 14px;pointer-events:none;font:inherit}.day-first-date .date-display svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7}';document.head.append(style);
 }
 const wrap=document.createElement('span');wrap.className='day-first-date';input.before(wrap);wrap.append(input);
 const display=document.createElement('span');display.className='date-display';display.setAttribute('aria-hidden','true');wrap.append(display);
 function paint(){const parts=input.value.split('-');const text=parts.length===3?parts.reverse().join('/'):'วัน/เดือน/ปี';display.innerHTML='<span>'+text+'</span><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>';}
 input.addEventListener('input',paint);input.addEventListener('change',()=>queueMicrotask(paint));paint();
}
