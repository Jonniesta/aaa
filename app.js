const tallyTargets = [
  "Follows individual instructions from teacher (not RBT)",
  "Follows instructions to stop and/or wait",
  "Uses appropriate voice level according to social context",
  "Requests to others with audible voice level",
  "Requests to others using a full sentence",
  "Requests permission before leaving an area",
  "Accepts feedback to improve action without problem behavior",
  "Adjusts behavior according to feedback given",
  "Gives attention when others attempt within 5 seconds",
  "Transitions from preferred to non-preferred activity without behaviors",
  "Initiates non-preferred task after given 2 prompts",
  "Stays near RBT/BCBA when transitioning to other areas",
  "Keeps hands to self when transitioning to other areas"
];
const trialTargets = [
  "Follow 3-step directions",
  "Correctly blow nose and wash/sanitize",
  "Remain in line without problem behavior",
  "Transition from an incomplete activity without problem behavior",
  "Accept no from others without problem behavior",
  "Gives personal space if too close or requested",
  "Remain seated for at least 10 minutes when told",
  "Communicate what he is doing when misunderstood",
  "Observe inappropriate behavior and refrain from joining",
  "Self-advocate when peer wants inappropriate behavior",
  "Come to solution with peer without mediator",
  "Ask for break in absence of problem behavior",
  "During problem behavior, choose activity/action and stop behavior"
];
const dttTargets = [
  "What is mom's birthday?",
  "What is dad's birthday?",
  "What is Oaklynn's birthday?",
  "What is Aniyah's birthday?",
  "What is your address?",
  "What is mom's phone number?",
  "What is dad's phone number?"
];
const teacherTargets = ["Implement behavior reduction strategies", "Learn functions of behavior"];
const appKey = "abaDailyTrackerApp.v1";
const $ = sel => document.querySelector(sel);
function today(){ return new Date().toISOString().slice(0,10); }
function makeCounter(container, label, key){
  const node = $('#counterTemplate').content.cloneNode(true);
  node.querySelector('.target-name').textContent = label;
  const article = node.querySelector('article'); article.dataset.key = key;
  ['ind','pro'].forEach(type => {
    article.querySelector(`.plus-${type}`).addEventListener('click', () => inc(`${key}_${type}`, 1));
    article.querySelector(`.minus-${type}`).addEventListener('click', () => inc(`${key}_${type}`, -1));
  });
  container.appendChild(node);
}
function makeTrials(container, label, key, count=5){
  const node = $('#trialTemplate').content.cloneNode(true);
  node.querySelector('.target-name').textContent = label;
  const article = node.querySelector('article'); article.dataset.key = key;
  const selects = [...article.querySelectorAll('select')];
  selects.forEach((s,i)=>{ if(i>=count) s.remove(); else s.dataset.key = `${key}_trial${i+1}`; });
  container.appendChild(node);
}
function build(){
  tallyTargets.forEach((t,i)=>makeCounter($('#tallyTargets'),t,`tally${i}`));
  trialTargets.forEach((t,i)=>makeTrials($('#trialTargets'),t,`trial${i}`,5));
  dttTargets.forEach((t,i)=>makeTrials($('#dttTargets'),t,`dtt${i}`,2));
  teacherTargets.forEach((t,i)=>makeTrials($('#teacherTargets'),t,`teacher${i}`,5));
  $('#date').value = today();
}
function getData(){
  const data = { session:{}, counters:{}, fields:{}, trials:{}, notes:$('#notes').value };
  ['client','date','therapist','location'].forEach(id=>data.session[id]=$('#'+id).value);
  document.querySelectorAll('strong[id]').forEach(el=>data.counters[el.id]=Number(el.textContent)||0);
  document.querySelectorAll('input,textarea,select').forEach(el=>{ if(el.id) data.fields[el.id]=el.value; if(el.dataset.key) data.trials[el.dataset.key]=el.value; });
  document.querySelectorAll('article[data-key]').forEach(article=>{
    const key=article.dataset.key; const ind=article.querySelector('.ind-count'); const pro=article.querySelector('.pro-count');
    if(ind) data.counters[`${key}_ind`]=Number(ind.textContent)||0;
    if(pro) data.counters[`${key}_pro`]=Number(pro.textContent)||0;
  });
  return data;
}
function save(){ localStorage.setItem(appKey, JSON.stringify(getData())); updateMetrics(); }
function load(){
  const data = JSON.parse(localStorage.getItem(appKey)||"null"); if(!data) return updateMetrics();
  Object.entries(data.fields||{}).forEach(([id,val])=>{ const el=$('#'+id); if(el) el.value=val; });
  Object.entries(data.session||{}).forEach(([id,val])=>{ const el=$('#'+id); if(el) el.value=val; });
  if(data.notes) $('#notes').value=data.notes;
  Object.entries(data.trials||{}).forEach(([key,val])=>{ const el=document.querySelector(`[data-key="${key}"]`); if(el) el.value=val; });
  Object.entries(data.counters||{}).forEach(([key,val])=>{ const el=$('#'+key); if(el) el.textContent=val; const [base,type]=key.split('_'); const art=document.querySelector(`article[data-key="${base}"]`); if(art){ const target=art.querySelector(type==='ind'?'.ind-count':'.pro-count'); if(target) target.textContent=val; }});
  updateMetrics();
}
function inc(key, delta){
  const [base,type]=key.split('_'); const art=document.querySelector(`article[data-key="${base}"]`); const el=art.querySelector(type==='ind'?'.ind-count':'.pro-count');
  el.textContent=Math.max(0,(Number(el.textContent)||0)+delta); save();
}
function updateMetrics(){
  const data=getData(); let ind=0,pro=0,complete=0,plus=0,minus=0;
  Object.entries(data.counters).forEach(([k,v])=>{ if(k.endsWith('_ind')||k==='groupIndependent') ind+=v; if(k.endsWith('_pro')||k==='groupPrompted') pro+=v; });
  Object.values(data.fields).forEach(v=>{ if(v) complete++; }); Object.values(data.trials).forEach(v=>{ if(v){complete++; if(v==='+') plus++; if(v==='-') minus++; }});
  $('#totalIndependent').textContent=ind; $('#totalPrompted').textContent=pro; $('#completionCount').textContent=complete;
  $('#trialAccuracy').textContent=(plus+minus?Math.round(plus/(plus+minus)*100):0)+'%';
}
function download(name, type, content){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href); }
function exportJson(){ const d=getData(); download(`aba-tracker-${d.session.date||today()}.json`,'application/json',JSON.stringify(d,null,2)); }
function exportCsv(){
  const d=getData(); const rows=[['Section','Target/Field','Value']];
  Object.entries(d.session).forEach(([k,v])=>rows.push(['Session',k,v])); Object.entries(d.counters).forEach(([k,v])=>rows.push(['Counter',k,v]));
  Object.entries(d.trials).forEach(([k,v])=>rows.push(['Trial',k,v])); Object.entries(d.fields).forEach(([k,v])=>rows.push(['Field',k,v])); rows.push(['Notes','Session Notes',d.notes]);
  const csv=rows.map(r=>r.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\n'); download(`aba-tracker-${d.session.date||today()}.csv`,'text/csv',csv);
}
function wire(){
  document.addEventListener('input', e=>{ if(e.target.matches('input,textarea,select')) save(); });
  document.body.addEventListener('click', e=>{ const c=e.target.dataset.counter; if(c){ const el=$('#'+c); el.textContent=Math.max(0,Number(el.textContent)+Number(e.target.dataset.delta)); save(); }});
  $('#exportJsonBtn').addEventListener('click',exportJson); $('#exportCsvBtn').addEventListener('click',exportCsv); $('#printBtn').addEventListener('click',()=>window.print());
  $('#resetBtn').addEventListener('click',()=>{ if(confirm('Clear today\'s saved data?')){ localStorage.removeItem(appKey); location.reload(); }});
}
build(); wire(); load();
