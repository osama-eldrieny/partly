/*
  Repair AI components. Shared by the demo (index.html) and the docs (system.html).
  Every component is a function: data in, HTML out. No component fetches data or decides autonomy on its own.
  Set PDS.parts, PDS.suppliers and PDS.slotOptions before rendering.
*/
const PDS={parts:{},suppliers:{},slotOptions:()=>[]};
/* A part fits a trim when its "fits" says "All trims" or names that trim ("ZR (parking sensors)" fits "ZR (LED headlights, ...)"). */
PDS.fitsTrim=(p,trim)=>{const name=x=>String(x||'').split('(')[0].trim().toLowerCase();const f=name(p.fits);return f.startsWith('all')||!trim||f===name(trim)};
const fmt=n=>'$'+Number(n).toLocaleString()+'<span class="cur">NZD</span>';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LUCIDE={
 truck:'<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
 ban:'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
 undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',
 help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
 shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
 car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
 pointer:'<path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/>',
 pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
 clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
 wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
 camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
 sparkles:'<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
 user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 chev:'<path d="m6 9 6 6 6-6"/>',
 swap:'<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
 alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
 recycle:'<path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>',
 send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
 plus:'<path d="M5 12h14"/><path d="M12 5v14"/>'
};
const ic=(n,cls='')=>'<svg class="i '+cls+'" viewBox="0 0 24 24" aria-hidden="true">'+LUCIDE[n]+'</svg>';
const ICON_CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';


const isAdded=l=>l.state==='added'||l.state==='you'||(l.mode==='auto'&&l.state!=='removed');
const isMain=l=>l.component!=='part_card'||(PDS.parts[l.part_id]?.role||'main')==='main';


function guard(line){
  const p=PDS.parts[line.part_id];
  if(line.component!=='part_card'||!p)return line;
  if(line.mode==='auto'&&(line.confidence<0.9||p.price>=150||!p.returnable))return {...line,mode:'suggest',guarded:true};
  if(line.mode==='ask')return {...line,mode:'suggest'};
  return line;
}
/* "Why?" only where the reason matters: unsure, expensive, or not returnable. */
const needsWhy=l=>l.component==='question_card'||l.confidence<0.85||(PDS.parts[l.part_id]&&(PDS.parts[l.part_id].price>=500||!PDS.parts[l.part_id].returnable));

function supplierOf(p){const ids=Object.keys(p.stock||{}).filter(k=>p.stock[k]>0);if(!ids.length)return null;const id=ids[0];return {...PDS.suppliers[id],qty:p.stock[id]}}
const initials=n=>n.split(/\s+/).filter(w=>/^[A-Z]/.test(w)).slice(0,2).map(w=>w[0]).join('');
/* Chips: grey = normal facts, red = a risk for the user. */
/* part: undefined = all chips; 'risk' = red risk chips only; 'facts' = delivery + stock as quiet text for the supplier row. */
function chips(p,part){
  if(p.manual)return part==='facts'?'':'<div class="chips"><span class="ichip">'+ic('user','sm')+'Added by you</span></div>';
  const s=supplierOf(p),out=[];
  /* Same place every time: delivery and stock sit in the header row, always. Only the colour changes:
     stock under 3 (and 0) is red, 3 or more is grey. Risks (not returnable, used) sit in the row below, red. */
  const qty=s?s.qty:0;
  const stock='<span class="ichip'+(qty<3?' risk':'')+'"><span class="dot"></span>'+qty+' in stock</span>';
  const eta=s?'<span class="ichip">'+ic('truck','sm')+esc(s.eta)+'</span>':'';
  if(!p.returnable)out.push('<span class="ichip risk">'+ic('ban','sm')+'Not returnable</span>');
  if(/used/i.test(p.name))out.push('<span class="ichip risk">'+ic('recycle','sm')+'Used part</span>');
  if(part==='risk')return out.length?'<div class="chips">'+out.join('')+'</div>':'';
  if(part==='facts')return '<div class="chips">'+eta+stock+'</div>';
  return '<div class="chips">'+eta+stock+out.join('')+'</div>';
}
function supplier(p){if(p.manual)return '';const s=supplierOf(p);return s?'<span class="sup"><b aria-hidden="true">'+initials(s.name)+'</b>'+esc(s.name)+'</span>':''}
function conf(l){const v=Math.round((l.confidence||0)*100);return '<span class="conf'+(v<70?' low':v<90?' mid':'')+'" title="How sure the AI is"><span class="bar"><i style="width:'+v+'%"></i></span>'+v+'% sure</span>'}
function why(l){
  if(!l.reason_short)return '';
  const more=needsWhy(l)&&l.reason_long&&l.reason_long!==l.reason_short?'<details class="more"><summary>'+ic('help','sm')+' Why?</summary><p>'+esc(l.reason_long)+'</p></details>':'';
  return '<div class="why"><b>'+esc(l.reason_short)+'</b>'+more+'</div>';
}
function altsHtml(l,i){
  const p=PDS.parts[l.part_id];
  const others=PDS.slotOptions(p);
  if(!others.length)return '<div class="alts"><p>No other part fits this slot. Tell me what\'s wrong in the box below.</p></div>';
  return '<div class="alts"><p>Other parts for this slot:</p><div class="row" style="margin-top:0">'+others.map(o=>'<button class="chip" data-act="swap" data-i="'+i+'" data-part="'+o.id+'">'+esc(o.name)+'<small>'+fmt(o.price)+'</small></button>').join('')+'</div></div>';
}
/* "Needs you": full cards with the reason and the decision buttons. */
function needCard(l,i){
  const p=PDS.parts[l.part_id];
  const risk=chips(p,'risk');
  return '<article class="card need"><div class="need-head"><div class="need-id"><p class="title">'+esc(p.name)+'</p></div><div class="need-price">'+fmt(p.price)+'</div></div>'
    +'<div class="need-meta">'+supplier(p)+'<span class="pn">'+esc(p.number)+'</span>'+chips(p,'facts')+'</div>'
    +risk
    +'<div class="need-ai"><div class="need-ai-top"><span class="badge suggest">'+ic('sparkles','sm')+' Suggested</span>'+conf(l)+'</div>'+why(l)
    +'</div>'
    +'<div class="need-actions"><button class="btn" data-act="add" data-i="'+i+'">'+ic('plus','sm')+' Add to quote</button><button class="btn ghost" data-act="wrong" data-i="'+i+'">'+ic('swap','sm')+' Wrong part</button><button class="btn link" data-act="remove" data-i="'+i+'">Not needed</button></div>'
    +(l.showAlts?altsHtml(l,i):'')+'</article>';
}
function questionCard(l,i){
  return '<article class="card ask"><span class="badge ask">'+ic('help','sm')+' Needs your answer</span><p class="q">'+esc(l.question)+'</p>'+why(l)
    +'<div class="choices">'+l.choices.map(c=>{
      const ps=c.part_ids.map(id=>PDS.parts[id]).filter(Boolean);
      const total=ps.reduce((s,p)=>s+p.price,0);
      return '<button class="choice" data-act="choose" data-i="'+i+'" data-part="'+c.part_ids.join(',')+'" data-label="'+esc(c.label)+'"><b>'+esc(c.label)+'</b><span>'+esc(ps.map(p=>p.name).join(' + '))+'</span><span class="mono">'+fmt(total)+'</span>'+(ps.some(p=>!p.returnable)?'<span class="ichip risk" style="margin-top:4px">'+ic('ban','sm')+'Not returnable</span>':'')+'</button>';
    }).join('')+'</div></article>';
}
/* "Not found": the AI refused to invent a part. Never a dead end: two ways forward. */
function notFoundCard(l,i){
  if(l.state==='manual-form')return '<article class="card ask"><span class="badge ask">'+ic('alert','sm')+' Part not found</span><p class="q">'+esc(l.reason_short)+'</p>'
    +'<form class="manual-add" data-i="'+i+'"><label>Part name<input name="name" required placeholder="e.g. Right headlight, LED"></label><label>Price<input name="price" required inputmode="decimal" placeholder="0.00"></label><button class="btn" type="submit">'+ic('plus','sm')+' Add to quote</button><button class="btn ghost" type="button" data-act="cancel-manual" data-i="'+i+'">Cancel</button></form></article>';
  return '<article class="card ask"><span class="badge ask">'+ic('alert','sm')+' Part not found</span><p class="q">'+esc(l.reason_short)+'</p>'
    +'<div class="why">I won\'t guess a part that might not fit. Choose how to continue.</div>'
    +'<div class="row"><button class="btn" data-act="ask-suppliers" data-i="'+i+'">'+ic('send','sm')+' Ask suppliers for a price</button><button class="btn ghost" data-act="manual" data-i="'+i+'">'+ic('plus','sm')+' Add part manually</button><button class="btn ghost" data-act="remove" data-i="'+i+'">Not needed</button></div></article>';
}
function pendingRow(l,i){
  return '<details class="qrow"><summary><span class="ok pending">'+ic('clock')+'</span><span class="nm">'+esc((t=>t[0].toUpperCase()+t.slice(1))(l.reason_short.replace(/^No /,'').replace(/ (found|in stock).*$/,'')))+'</span>'+sourceLabel(l,null,'waiting')+'<span class="pr">Price pending</span><button class="mini" data-act="cancel-request" data-i="'+i+'">'+ic('undo','sm')+'Cancel</button>'+ic('chev','chev')+'</summary><div class="body"><div class="why">You asked 5 suppliers for a price. Demo only: in the real product, their replies would appear here.</div></div></details>';
}
/* Source label: answers "how did this part get on my quote?". Who first, then what they did.
   Only "Added by AI" stands out: it's the one part the user never looked at. */
const SOURCES={
  ai:['sparkles','Added by AI','Added automatically: under $150, returnable and 90%+ sure. Undo if wrong.'],
  approved:['check','You approved','The AI suggested it and you added it.'],
  chose:['pointer','You chose','You picked this part from the options.'],
  manual:['pencil','You added','You typed this part in yourself.'],
  waiting:['clock','Waiting for price','You asked 5 suppliers. The price appears here when one replies.']
};
function sourceOf(l,p){return p&&p.manual?'manual':l.state==='you'?'chose':l.mode==='auto'&&!l.state?'ai':'approved'}
function sourceLabel(l,p,key){
  const k=key||sourceOf(l,p),[icon,text,tip]=SOURCES[k];
  return '<span class="who'+(k==='ai'?' ai':'')+'" title="'+esc(tip)+'">'+ic(icon,'sm')+text+'</span>';
}
/* "On the quote": one compact row per part, expandable for details. */
function quoteRow(l,i){
  const p=PDS.parts[l.part_id],removed=l.state==='removed';
  const who=sourceLabel(l,p);
  const btn=removed?'<button class="mini" data-act="restore" data-i="'+i+'">'+ic('plus','sm')+'Add back</button>':'<button class="mini" data-act="remove" data-i="'+i+'">'+ic('undo','sm')+'Undo</button>';
  return '<details class="qrow'+(removed?' removed':'')+(l.fresh?' enter':'')+'"'+(l.showAlts?' open':'')+'><summary><span class="ok">'+(removed?ic('undo'):ic('check'))+'</span><span class="nm">'+esc(p.name)+'</span>'+(removed?'':who)+(p.returnable?'':'<span class="ichip risk">'+ic('ban','sm')+'Not returnable</span>')+'<span class="pr">'+fmt(p.price)+'</span>'+btn+ic('chev','chev')+'</summary>'
    +'<div class="body"><div class="row" style="margin-top:0;gap:10px">'+supplier(p)+'<span class="pn">'+esc(p.number)+'</span>'+(l.state==='you'?'':conf(l))+'</div>'+chips(p)+why(l)
    +(removed?'':'<div class="row"><button class="btn ghost" data-act="wrong" data-i="'+i+'">'+ic('swap','sm')+' Wrong part</button></div>')+(l.showAlts?altsHtml(l,i):'')+'</div></details>';
}
