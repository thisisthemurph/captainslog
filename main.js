const btn = document.getElementById("btn");
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
    const p = document.createElement("p");
    p.textContent = logText;
    logContainer.appendChild(p);
}

btn.addEventListener("click", async () => {
    const gameId = await getGameId();
    addLogEntryToLocalStorage(gameId, input.value);
    setLogEntriesInLogContainer(gameId);
});

document.addEventListener("DOMContentLoaded", async () => {
    const gameId = await getGameId();
    subheading.textContent = gameId;
    setLogEntriesInLogContainer(gameId);
});
