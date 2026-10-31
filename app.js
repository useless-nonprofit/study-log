const $ = id => document.getElementById(id);
const KEY = "study-log-local-v1";
const today = () => new Date().toLocaleDateString("sv-SE");
let state = JSON.parse(localStorage.getItem(KEY) || '{"goal":360,"tasks":[],"records":[],"memo":""}');
let selectedMinutes = 25, remaining = 25*60, interval = null, running = false, endAt = 0;
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); render(); }
function mins(n){return Math.max(0,Math.round(n||0))}
function showToast(s){const t=$("toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2100)}
function render(){
  const dayRecords=state.records.filter(r=>r.date===today());
  const total=dayRecords.reduce((a,r)=>a+mins(r.minutes),0);
  $("todayMinutes").textContent=total;
  const goal=Math.max(10,mins(state.goal)||360), pct=Math.min(100,Math.round(total/goal*100));
  $("goalPercent").textContent=pct+"%"; $("goalBar").style.width=pct+"%";
  $("goalRing").style.background=`conic-gradient(var(--accent) ${pct*3.6}deg,#e5e7f1 0deg)`;
  $("goalInput").value=goal;
  $("todayLabel").textContent=new Date().toLocaleDateString("ja-JP",{month:"long",day:"numeric",weekday:"short"})+" の学習";
  $("taskCount").textContent=state.tasks.filter(t=>!t.done).length+"件";
  $("taskList").innerHTML="";
  $("emptyTasks").hidden=state.tasks.length>0;
  state.tasks.forEach(task=>{
    const li=document.createElement("li");li.className="task-item"+(task.done?" done":"");
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=task.done;cb.addEventListener("change",()=>{task.done=cb.checked;save()});
    const span=document.createElement("span");span.textContent=task.text;
    const del=document.createElement("button");del.className="delete-task";del.textContent="×";del.setAttribute("aria-label","削除");del.onclick=()=>{state.tasks=state.tasks.filter(t=>t.id!==task.id);save()};
    li.append(cb,span,del);$("taskList").append(li);
  });
  const recent=[...state.records].sort((a,b)=>(b.date+b.id).localeCompare(a.date+a.id)).slice(0,12);
  $("recordsList").innerHTML="";$("emptyRecords").hidden=recent.length>0;
  recent.forEach(r=>{const el=document.createElement("div");el.className="record";
    const left=document.createElement("div"),name=document.createElement("strong"),date=document.createElement("small");
    name.textContent=r.subject;date.textContent=r.date;left.append(name,date);
    const dur=document.createElement("div");dur.className="duration";dur.textContent=mins(r.minutes)+"分";el.append(left,dur);$("recordsList").append(el);
  });
  $("memo").value=state.memo||"";
}
function addRecord(subject,minutes,date=today()){
  state.records.push({id:String(Date.now())+Math.random().toString(16).slice(2),subject,minutes:mins(minutes),date});save();
}
function updateTimer(){const m=Math.floor(remaining/60),s=remaining%60;$("timerDisplay").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")}
function stopTimer(){clearInterval(interval);interval=null;running=false;$("startBtn").textContent="スタート";$("timerStatus").textContent="PAUSED"}
function tick(){
  remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));updateTimer();
  if(remaining<=0){stopTimer();addRecord("フォーカスタイマー",selectedMinutes);showToast("お疲れさま。学習を記録しました。");remaining=selectedMinutes*60;updateTimer();$("timerStatus").textContent="DONE"}
}
$("goalInput").addEventListener("change",e=>{state.goal=Math.min(1440,Math.max(10,mins(e.target.value)));save()});
$("taskForm").addEventListener("submit",e=>{e.preventDefault();const text=$("taskInput").value.trim();if(!text)return;state.tasks.push({id:String(Date.now()),text,done:false});$("taskInput").value="";save()});
$("recordForm").addEventListener("submit",e=>{e.preventDefault();const subject=$("subjectInput").value.trim(),minutes=mins($("minutesInput").value),date=$("dateInput").value;if(!subject||!minutes||!date)return;addRecord(subject,minutes,date);$("subjectInput").value="";$("minutesInput").value="";showToast("学習記録を追加しました")});
$("dateInput").value=today();
document.querySelectorAll(".preset").forEach(b=>b.addEventListener("click",()=>{if(running)return;document.querySelectorAll(".preset").forEach(x=>x.classList.remove("active"));b.classList.add("active");selectedMinutes=Number(b.dataset.min);remaining=selectedMinutes*60;updateTimer()}));
$("startBtn").onclick=()=>{if(running){stopTimer();return}if(remaining<=0)remaining=selectedMinutes*60;running=true;endAt=Date.now()+remaining*1000;$("startBtn").textContent="一時停止";$("timerStatus").textContent="FOCUS";interval=setInterval(tick,250)};
$("resetBtn").onclick=()=>{stopTimer();remaining=selectedMinutes*60;updateTimer();$("timerStatus").textContent="READY"};
$("clearBtn").onclick=()=>{if(confirm("学習履歴をすべて削除しますか？")){state.records=[];save();showToast("履歴を削除しました")}};
$("memo").addEventListener("input",e=>{state.memo=e.target.value;localStorage.setItem(KEY,JSON.stringify(state))});
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="study-log-backup-"+today()+".json";a.click();URL.revokeObjectURL(a.href);showToast("バックアップを書き出しました")};
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();updateTimer();
