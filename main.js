const submitBtn = document.getElementById("submit-btn");
const input = document.getElementById("log-input");
const logContainer = document.getElementById("log-messages");
const subheading = document.getElementById("game-id");

async function getCurrentTab() {
    const queryOptions = { active: true, currentWindow: true }
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function getGameId() {
    const tab = await getCurrentTab();
    const url = tab.url;
    const segments = url.split("/");
    const lastSegment = segments[segments.length - 1];

    return parseInt(lastSegment, 10);
}

function getLogsFromLocalStorage(gameId) {
    const currentLogs = localStorage.getItem(gameId);
    if (currentLogs === null) {
        console.log("there are no logs");
        return { gameId, logs: [] };
    }
    return JSON.parse(currentLogs);
}

function addLogEntryToLocalStorage(gameId, log) {
    let gameLog = getLogsFromLocalStorage(gameId);
    gameLog.logs = [...gameLog.logs, log];

    const json = JSON.stringify(gameLog);
    localStorage.setItem(gameId, json);
}

function setLogEntriesInLogContainer(gameId) {
    const gameLog = getLogsFromLocalStorage(gameId);

    logContainer.innerHTML = "";
    for (const entry of gameLog.logs) {
        makeLogEntryHtml(entry);
    }
}

function makeLogEntryHtml(logText) {
    const classes = "p-4 odd:bg-[#2C3273] even:bg-transparent text-white text-lg"
    const p = document.createElement("p");
    p.textContent = logText;
    for (c of classes.split(" ")) {
        p.classList.add(c);
    }
    logContainer.appendChild(p);
}

submitBtn.addEventListener("click", async () => {
    const gameId = await getGameId();
    addLogEntryToLocalStorage(gameId, input.value);
    setLogEntriesInLogContainer(gameId);
});

document.addEventListener("DOMContentLoaded", async () => {
    const gameId = await getGameId();
    subheading.textContent = gameId;
    setLogEntriesInLogContainer(gameId);
});
