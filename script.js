let counts = {
  follow: 0,
  communication: 0,
  transition: 0,
  group: 0
};

let trialNumber = 0;
let editingSessionId = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sessionDate").valueAsDate = new Date();

  loadDefaultRBT();
  loadHistory();
  updateDashboard();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});

function saveDefaultRBT() {
  const rbtName = document.getElementById("rbtName").value.trim();

  if (!rbtName) {
    alert("Enter an RBT name first.");
    return;
  }

  localStorage.setItem("defaultRBTName", rbtName);
  alert("Default RBT saved.");
}

function loadDefaultRBT() {
  const savedRBT = localStorage.getItem("defaultRBTName");

  if (savedRBT) {
    document.getElementById("rbtName").value = savedRBT;
  }
}

function changeCount(id, amount) {
  counts[id] += amount;

  if (counts[id] < 0) {
    counts[id] = 0;
  }

  document.getElementById(id).textContent = counts[id];
  updateDashboard();
}

function addTrial(trialData = null) {
  trialNumber++;

  const trialList = document.getElementById("trialList");

  const trial = document.createElement("div");
  trial.className = "trial";

  trial.innerHTML = `
    <h3>Trial ${trialNumber}</h3>

    <label>Target</label>
    <input class="trialTarget" type="text" placeholder="Target skill" value="${trialData?.target || ""}" />

    <div class="trial-row">
      <div>
        <label>Result</label>
        <select class="trialResult" onchange="updateDashboard()">
          <option value="">Select</option>
          <option value="+" ${trialData?.result === "+" ? "selected" : ""}>+</option>
          <option value="-" ${trialData?.result === "-" ? "selected" : ""}>-</option>
          <option value="N/A" ${trialData?.result === "N/A" ? "selected" : ""}>N/A</option>
        </select>
      </div>

      <div>
        <label>Prompt Level</label>
        <select class="trialPrompt">
          <option value="">Select</option>
          <option ${trialData?.prompt === "Independent" ? "selected" : ""}>Independent</option>
          <option ${trialData?.prompt === "Gestural" ? "selected" : ""}>Gestural</option>
          <option ${trialData?.prompt === "Verbal" ? "selected" : ""}>Verbal</option>
          <option ${trialData?.prompt === "Model" ? "selected" : ""}>Model</option>
          <option ${trialData?.prompt === "Partial Physical" ? "selected" : ""}>Partial Physical</option>
          <option ${trialData?.prompt === "Full Physical" ? "selected" : ""}>Full Physical</option>
        </select>
      </div>
    </div>

    <button class="danger" onclick="removeTrial(this)">
      Remove Trial
    </button>
  `;

  trialList.appendChild(trial);
  updateDashboard();
}

function removeTrial(button) {
  button.parentElement.remove();
  updateDashboard();
}

function collectSessionData() {
  const trials = Array.from(document.querySelectorAll(".trial")).map(trial => {
    return {
      target: trial.querySelector(".trialTarget").value,
      result: trial.querySelector(".trialResult").value,
      prompt: trial.querySelector(".trialPrompt").value
    };
  });

  return {
    id: editingSessionId || Date.now(),
    clientName: document.getElementById("clientName").value,
    sessionDate: document.getElementById("sessionDate").value,
    rbtName: document.getElementById("rbtName").value,
    counts: { ...counts },
    trials: trials,
    dtt: {
      respondsName: document.getElementById("respondsName").value,
      whQuestion: document.getElementById("whQuestion").value,
      imitatesAction: document.getElementById("imitatesAction").value
    },
    emotion: {
      emotionIdentified: document.getElementById("emotionIdentified").value,
      communicationLevel: document.getElementById("communicationLevel").value
    },
    notes: document.getElementById("notes").value,
    savedAt: new Date().toISOString()
  };
}

function saveSession() {
  const sessions = getSessions();
  const session = collectSessionData();

  if (!session.clientName.trim()) {
    alert("Please enter a client name.");
    return;
  }

  if (!session.sessionDate) {
    alert("Please enter a session date.");
    return;
  }

  if (!session.rbtName.trim()) {
    alert("Please enter an RBT name.");
    return;
  }

  if (editingSessionId) {
    const index = sessions.findIndex(item => item.id === editingSessionId);

    if (index !== -1) {
      sessions[index] = session;
      alert("Session updated.");
    }
  } else {
    sessions.push(session);
    alert("Session saved.");
  }

  localStorage.setItem("abaSessions", JSON.stringify(sessions));

  editingSessionId = null;
  document.getElementById("saveButton").textContent = "Save Session";

  loadHistory();
  updateDashboard();
}

function editSession(id) {
  const sessions = getSessions();
  const session = sessions.find(item => item.id === id);

  if (!session) {
    alert("Session not found.");
    return;
  }

  editingSessionId = id;

  document.getElementById("clientName").value = session.clientName || "";
  document.getElementById("sessionDate").value = session.sessionDate || "";
  document.getElementById("rbtName").value = session.rbtName || "";

  counts = {
    follow: session.counts?.follow || 0,
    communication: session.counts?.communication || 0,
    transition: session.counts?.transition || 0,
    group: session.counts?.group || 0
  };

  Object.keys(counts).forEach(key => {
    document.getElementById(key).textContent = counts[key];
  });

  document.getElementById("respondsName").value = session.dtt?.respondsName || "";
  document.getElementById("whQuestion").value = session.dtt?.whQuestion || "";
  document.getElementById("imitatesAction").value = session.dtt?.imitatesAction || "";

  document.getElementById("emotionIdentified").value =
    session.emotion?.emotionIdentified || "";

  document.getElementById("communicationLevel").value =
    session.emotion?.communicationLevel || "";

  document.getElementById("notes").value = session.notes || "";

  document.getElementById("trialList").innerHTML = "";
  trialNumber = 0;

  if (session.trials && session.trials.length > 0) {
    session.trials.forEach(trial => {
      addTrial(trial);
    });
  }

  document.getElementById("saveButton").textContent = "Update Session";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  updateDashboard();
}

function getSessions() {
  return JSON.parse(localStorage.getItem("abaSessions")) || [];
}

function loadHistory() {
  const sessions = getSessions();
  const history = document.getElementById("history");

  history.innerHTML = "";

  if (sessions.length === 0) {
    history.innerHTML = "<p>No sessions saved yet.</p>";
    return;
  }

  sessions
    .slice()
    .reverse()
    .forEach(session => {
      const item = document.createElement("div");
      item.className = "history-item";

      item.innerHTML = `
        <strong>${session.clientName || "Unnamed Client"}</strong><br>
        Date: ${session.sessionDate || "No date"}<br>
        RBT: ${session.rbtName || "No RBT"}<br>
        Trials: ${session.trials?.length || 0}<br>

        <div class="history-buttons">
          <button onclick="editSession(${session.id})">
            Edit
          </button>

          <button onclick="deleteSession(${session.id})" class="danger">
            Delete
          </button>
        </div>
      `;

      history.appendChild(item);
    });

  updateDashboard();
}

function deleteSession(id) {
  if (!confirm("Delete this saved session?")) {
    return;
  }

  const sessions = getSessions().filter(session => session.id !== id);

  localStorage.setItem("abaSessions", JSON.stringify(sessions));

  if (editingSessionId === id) {
    clearForm(false);
  }

  loadHistory();
  updateDashboard();
}

function updateDashboard() {
  const total =
    counts.follow +
    counts.communication +
    counts.transition +
    counts.group;

  document.getElementById("totalCount").textContent = total;

  const results = Array.from(document.querySelectorAll(".trialResult"))
    .map(select => select.value)
    .filter(value => value === "+" || value === "-");

  const correct = results.filter(value => value === "+").length;

  const accuracy = results.length
    ? Math.round((correct / results.length) * 100)
    : 0;

  document.getElementById("accuracy").textContent = accuracy + "%";

  document.getElementById("savedCount").textContent = getSessions().length;
}

function exportCSV() {
  const sessions = getSessions();

  if (sessions.length === 0) {
    alert("No sessions to export.");
    return;
  }

  let csv =
    "Client,Date,RBT,Follow Directions,Communication,Transitions,Group Instruction,Trial Count,Notes\n";

  sessions.forEach(session => {
    csv += [
      cleanCSV(session.clientName),
      cleanCSV(session.sessionDate),
      cleanCSV(session.rbtName),
      session.counts?.follow || 0,
      session.counts?.communication || 0,
      session.counts?.transition || 0,
      session.counts?.group || 0,
      session.trials?.length || 0,
      cleanCSV(session.notes)
    ].join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "aba-sessions.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function cleanCSV(value) {
  const text = value || "";
  return `"${text.replace(/"/g, '""')}"`;
}

function clearForm(ask = true) {
  if (ask && !confirm("Clear current form? Saved sessions will stay.")) {
    return;
  }

  editingSessionId = null;
  document.getElementById("saveButton").textContent = "Save Session";

  document.getElementById("clientName").value = "";
  document.getElementById("sessionDate").valueAsDate = new Date();

  loadDefaultRBT();

  document.getElementById("notes").value = "";

  document.getElementById("respondsName").value = "";
  document.getElementById("whQuestion").value = "";
  document.getElementById("imitatesAction").value = "";
  document.getElementById("emotionIdentified").value = "";
  document.getElementById("communicationLevel").value = "";

  counts = {
    follow: 0,
    communication: 0,
    transition: 0,
    group: 0
  };

  Object.keys(counts).forEach(id => {
    document.getElementById(id).textContent = "0";
  });

  document.getElementById("trialList").innerHTML = "";
  trialNumber = 0;

  updateDashboard();
}
