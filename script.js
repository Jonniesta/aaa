const tallyTargets = [
  "Follows individual instructions from teacher",
  "Follows instructions to stop/wait",
  "Uses appropriate voice level",
  "Requests with audible voice",
  "Requests using full sentence",
  "Requests permission before leaving area",
  "Accepts feedback without problem behavior",
  "Adjusts behavior according to feedback",
  "Gives attention within 5 seconds",
  "Transitions preferred to non-preferred",
  "Initiates non-preferred task after two prompts",
  "Stays near RBT/BCBA during transitions",
  "Keeps hands to self during transitions"
];

const trialTargets = [
  "Follow 3-step directions",
  "Blow nose and wash/sanitize",
  "Remain in line",
  "Transition from incomplete activity",
  "Accept no",
  "Give personal space",
  "Remain seated 10 minutes",
  "Communicate when misunderstood",
  "Observe inappropriate behavior without joining",
  "Self-advocate with peers",
  "Resolve peer conflict independently",
  "Ask for break before behavior",
  "Choose coping activity during behavior"
];

const dttTargets = ["Mom's birthday", "Dad's birthday", "Oaklynn's birthday", "Aniyah's birthday", "Address", "Mom's phone number", "Dad's phone number"];
const teacherTargets = ["Implement behavior reduction strategies", "Learn functions of behavior"];

let state = { tally:{}, trials:{}, dtt:{}, teacher:{}, groupIndependent:0, groupPrompted:0, specialSounds:"" };
let editingSessionId = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sessionDate").valueAsDate = new Date();
  buildUI();
  loadDefaultRBT();
  loadHistory();
  updateSummary();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js");
});

function keyify(text){return text.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");}

function buildUI(){
  const tallyBox = document.getElementById("tallyTargets");
  tallyBox.innerHTML = tallyTargets.map(name => {
    const key = keyify(name);
    state.tally[key] ||= { independent:0, prompted:0 };
    return `<div class="target-card"><div class="target-name">${name}</div><div class="two-counters">
      ${counterHTML(`tally.${key}.independent`,"Independent")}
      ${counterHTML(`tally.${key}.prompted`,"Prompted")}
    </div></div>`;
  }).join("");

  document.getElementById("trialTargets").innerHTML = trialTargets.map(name => trialHTML("trials", name, 5)).join("");
  document.getElementById("dttTargets").innerHTML = dttTargets.map(name => trialHTML("dtt", name, 2)).join("");
  document.getElementById("teacherTargets").innerHTML = teacherTargets.map(name => trialHTML("teacher", name, 5)).join("");
}

function counterHTML(path,label){
  return `<div class="mini-counter"><label>${label}</label><div class="counter-row">
    <span></span><button type="button" onclick="changePathCount('${path}',-1)">−</button>
    <strong data-count="${path}">0</strong><button type="button" onclick="changePathCount('${path}',1)">+</button>
  </div></div>`;
}

function trialHTML(group,name,total){
  const key = keyify(name);
  state[group][key] ||= Array(total).fill("");
  return `<div class="target-card"><div class="target-name">${name}</div><div class="trial-grid">
    ${Array.from({length:total},(_,i)=>`<button type="button" class="trial-pill" data-score="${group}.${key}.${i}" onclick="cycleScore(this)">–</button>`).join("")}
  </div></div>`;
}

function getByPath(path){return path.split('.').reduce((obj,k)=>obj[k],state)}
function setByPath(path,value){const parts=path.split('.');let obj=state;while(parts.length>1)obj=obj[parts.shift()];obj[parts[0]]=value}
function changePathCount(path,amount){const next=Math.max(0,(getByPath(path)||0)+amount);setByPath(path,next);document.querySelector(`[data-count="${path}"]`).textContent=next;updateSummary()}
function changeSimpleCount(id,amount){state[id]=Math.max(0,(state[id]||0)+amount);document.getElementById(id).textContent=state[id];updateSummary()}

function cycleScore(btn){
  const current = btn.dataset.value || "";
  const next = current === "" ? "+" : current === "+" ? "-" : current === "-" ? "N/A" : "";
  btn.dataset.value = next;
  btn.textContent = next || "–";
  btn.className = "trial-pill" + (next==="+"?" active plus":next==="-"?" active minus":next==="N/A"?" active na":"");
  setByPath(btn.dataset.score,next);
  updateSummary();
}

function setSegment(btn,value){
  const wrap = btn.parentElement;
  [...wrap.children].forEach(b=>{b.className=""});
  btn.className = value==="+"?"active plus":value==="-"?"active minus":"active na";
  state[wrap.dataset.field]=value;
}

function saveDefaultRBT(){
  const value = document.getElementById("rbtName").value.trim();
  if(!value) return alert("Enter your RBT name first.");
  localStorage.setItem("defaultRBTName", value);
  alert("RBT default saved.");
}
function loadDefaultRBT(){document.getElementById("rbtName").value = localStorage.getItem("defaultRBTName") || ""}
function getSessions(){return JSON.parse(localStorage.getItem("abaSessionsStreamlined")) || []}

function collectSession(){
  return {
    id: editingSessionId || Date.now(),
    clientName: document.getElementById("clientName").value.trim(),
    sessionDate: document.getElementById("sessionDate").value,
    rbtName: document.getElementById("rbtName").value.trim(),
    notes: document.getElementById("notes").value,
    emotion:{emotion1:emotion1.value,why1:emotionWhy1.value,emotion2:emotion2.value,why2:emotionWhy2.value},
    special:{name:specialName.value,duration:specialDuration.value,sounds:state.specialSounds},
    state: JSON.parse(JSON.stringify(state)),
    savedAt: new Date().toISOString()
  };
}

function saveSession(){
  const session = collectSession();
  if(!session.clientName) return alert("Client name is required.");
  if(!session.sessionDate) return alert("Date is required.");
  if(!session.rbtName) return alert("RBT name is required.");
  const sessions = getSessions();
  if(editingSessionId){
    const i = sessions.findIndex(s=>s.id===editingSessionId);
    if(i>-1) sessions[i]=session;
    alert("Session updated.");
  } else { sessions.push(session); alert("Session saved."); }
  localStorage.setItem("abaSessionsStreamlined", JSON.stringify(sessions));
  editingSessionId=null; saveButton.textContent="Save"; loadHistory(); updateSummary();
}

function editSession(id){
  const session = getSessions().find(s=>s.id===id); if(!session) return;
  editingSessionId=id; clientName.value=session.clientName||""; sessionDate.value=session.sessionDate||""; rbtName.value=session.rbtName||""; notes.value=session.notes||"";
  emotion1.value=session.emotion?.emotion1||""; emotionWhy1.value=session.emotion?.why1||""; emotion2.value=session.emotion?.emotion2||""; emotionWhy2.value=session.emotion?.why2||"";
  specialName.value=session.special?.name||""; specialDuration.value=session.special?.duration||"";
  state = session.state || state; buildUI(); hydrateUI(); saveButton.textContent="Update"; window.scrollTo({top:0,behavior:"smooth"}); updateSummary();
}

function hydrateUI(){
  document.querySelectorAll("[data-count]").forEach(el=>el.textContent=getByPath(el.dataset.count)||0);
  document.getElementById("groupIndependent").textContent=state.groupIndependent||0;
  document.getElementById("groupPrompted").textContent=state.groupPrompted||0;
  document.querySelectorAll(".trial-pill").forEach(btn=>{ const v=getByPath(btn.dataset.score)||""; btn.dataset.value=v; btn.textContent=v||"–"; btn.className="trial-pill"+(v==="+"?" active plus":v==="-"?" active minus":v==="N/A"?" active na":""); });
  const seg=document.querySelector('[data-field="specialSounds"]'); [...seg.children].forEach(b=>b.className=""); if(state.specialSounds){ const btn=[...seg.children].find(b=>b.textContent===state.specialSounds); if(btn) btn.className=state.specialSounds==="+"?"active plus":state.specialSounds==="-"?"active minus":"active na"; }
}

function deleteSession(id){ if(!confirm("Delete this session?")) return; localStorage.setItem("abaSessionsStreamlined", JSON.stringify(getSessions().filter(s=>s.id!==id))); loadHistory(); updateSummary(); }
function loadHistory(){
  const sessions = getSessions(); savedCount.textContent=sessions.length;
  history.innerHTML = sessions.length ? sessions.slice().reverse().map(s=>`<div class="history-item"><div class="history-top"><div><div class="history-title">${s.clientName||"Unnamed"}</div><div class="history-meta">${s.sessionDate||"No date"} • ${s.rbtName||"No RBT"}</div></div></div><div class="history-buttons"><button type="button" onclick="editSession(${s.id})">Edit</button><button type="button" class="danger" onclick="deleteSession(${s.id})">Delete</button></div></div>`).join("") : "<p>No saved sessions yet.</p>";
}

function updateSummary(){
  let total = (state.groupIndependent||0)+(state.groupPrompted||0);
  Object.values(state.tally||{}).forEach(v=>{total+=(v.independent||0)+(v.prompted||0)}); totalCount.textContent=total;
  const scores = [...Object.values(state.trials||{}).flat(), ...Object.values(state.dtt||{}).flat(), ...Object.values(state.teacher||{}).flat()].filter(v=>v==="+"||v==="-");
  const correct = scores.filter(v=>v==="+").length; trialAccuracy.textContent = scores.length ? Math.round(correct/scores.length*100)+"%" : "0%";
  savedCount.textContent=getSessions().length;
}

function clearForm(){
  if(!confirm("Clear current form? Saved sessions stay saved.")) return;
  editingSessionId=null; document.querySelectorAll("input, textarea").forEach(el=>el.value=""); sessionDate.valueAsDate=new Date(); loadDefaultRBT();
  state={tally:{},trials:{},dtt:{},teacher:{},groupIndependent:0,groupPrompted:0,specialSounds:""}; buildUI(); hydrateUI(); saveButton.textContent="Save"; updateSummary();
}

function exportCSV(){
  const sessions=getSessions(); if(!sessions.length) return alert("No sessions to export.");
  let csv="Client,Date,RBT,Total Count,Accuracy,Notes\n";
  sessions.forEach(s=>{ const old=state; state=s.state; updateSummary(); const total=totalCount.textContent, acc=trialAccuracy.textContent; state=old; csv += [s.clientName,s.sessionDate,s.rbtName,total,acc,s.notes].map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")+"\n"; });
  const blob=new Blob([csv],{type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="aba-tracker-sessions.csv"; a.click(); URL.revokeObjectURL(url); updateSummary();
}
