const btn = document.getElementById("btn");
const input = document.getElementById("log-input");
const logContainer = document.getElementById("log-messages");

function getGameId() {
    let gameId = 0;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0].url;
        const segments = url.split("/");
        const lastSegment = segments[segments.length - 1];
        gameId = parseInt(lastSegment, 10);
    });
    return gameId;
}

function getLogsFromLocalStorage(gameId) {
    const currentLogs = localStorage.getItem(gameId);
    if (currentLogs === null) {
        console.log("there are no logs");
        return { game_id: gameId, logs: [] };
    }
    return JSON.parse(currentLogs);
}

function addLogToLocalStorage(gameId, log) {
    let gameLog = getLogsFromLocalStorage(gameId);
    gameLog.logs = [...gameLog.logs, log];

    const json = JSON.stringify(gameLog);
    localStorage.setItem(gameId, json);
}

function setLogEntriesInLogContainer() {
    const gameId = getGameId();
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

btn.addEventListener("click", () => {
    const gameId = getGameId();
    addLogToLocalStorage(gameId, input.value);
    setLogEntriesInLogContainer();
});

document.addEventListener("DOMContentLoaded", setLogEntriesInLogContainer);
