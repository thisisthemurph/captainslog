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

function addLogEntryToLocalStorage(gameId, text) {
    let gameLog = getLogsFromLocalStorage(gameId);
    const timestamp = Date.now();
    gameLog.logs = [...gameLog.logs, { text, timestamp }];

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

function addStringOfClassesToHtmlElement(elem, classes) {
    for (c of classes.split(" ")) {
        elem.classList.add(c);
    }
}

function makeLogEntryHtml(logEntry) {
    const containerClasses = "p-4 odd:bg-[#2C3273] even:bg-transparent text-white text-lg"
    const dateClasses = "flex justify-end text-sm text-[#99a2ff]"
    const headerClasses = "mb-2"

    const containerElem = document.createElement("div");
    addStringOfClassesToHtmlElement(containerElem, containerClasses);
    const headerElem = document.createElement("header");
    addStringOfClassesToHtmlElement(headerElem, headerClasses);
    const dateElem = document.createElement("span");
    addStringOfClassesToHtmlElement(dateElem, dateClasses)
    const textElem = document.createElement("p");

    textElem.textContent = logEntry.text;
    dateElem.textContent = dateFns.format(logEntry.timestamp, "eee d MMM HH:mm");

    containerElem.appendChild(dateElem);
    containerElem.appendChild(textElem);
    logContainer.appendChild(containerElem);
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
