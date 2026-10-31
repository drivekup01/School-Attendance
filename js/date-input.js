// Preserve ISO values and the native mobile calendar; render dates in day/month/year order.
export function displayDayFirst(input){
 if(!input||input.parentElement.classList.contains('day-first-date'))return;
 const wrap=document.createElement('span');wrap.className='day-first-date';input.before(wrap);wrap.append(input);
 const display=document.createElement('span');display.className='date-display';display.setAttribute('aria-hidden','true');wrap.append(display);
 function paint(){const parts=input.value.split('-');const text=parts.length===3?parts.reverse().join('/'):'วัน/เดือน/ปี';display.innerHTML='<span>'+text+'</span><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>';}
 input.addEventListener('input',paint);input.addEventListener('change',()=>queueMicrotask(paint));paint();
}
