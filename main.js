/** @type HTMLButtonElement */
const submitBtn = document.getElementById("submit-btn");
/** @type HTMLTextAreaElement */
const input = document.getElementById("log-input");
/** @type HTMLElement */
const logContainer = document.getElementById("log-messages");
/** @type HTMLElement */
const subheading = document.getElementById("game-id");

/**
 * @typedef {Object} LogEntry
 * @property {string} text
 * @property {string} timestamp
 * 
 * @typedef {Object} GameLog
 * @property {number} gameId
 * @property {LogEntry[]} logs
 */

/**
 * Returns a promise that resolves to the URL of the current tab.
 * @async
 * @returns {Promise<string>} the URL of the current tab.
 */
async function getCurrentTabUrl() {
    const queryOptions = { active: true, currentWindow: true }
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab.url;
}

/**
 * Asynchronously retrieves the game ID from the current tab's URL.
 * 
 * @async
 * @returns {Promise<number>} A promise that resolves to an integer representing the game ID.
 */
async function getGameId() {
    const url = await getCurrentTabUrl();
    const segments = url.split("/");
    const lastSegment = segments[segments.length - 1];

    return parseInt(lastSegment, 10);
}

/**
 * Retrieves logs from local storage for a given game ID.
 * @param {number} gameId 
 * @returns {GameLog} The game log object containing the game ID and an array of log entries.
 */
function getGameLogFromLocalStorage(gameId) {
    const currentLogs = localStorage.getItem(gameId);
    if (currentLogs === null) {
        console.log("there are no logs");
        return { gameId, logs: [] };
    }
    return JSON.parse(currentLogs);
}

/**
 * Stores the given log text in local storage.
 * @param {number} gameId 
 * @param {string} text 
 */
function addLogEntryToLocalStorage(gameId, text) {
    let gameLog = getGameLogFromLocalStorage(gameId);
    const timestamp = Date.now();
    gameLog.logs = [...gameLog.logs, { text, timestamp }];

    const json = JSON.stringify(gameLog);
    localStorage.setItem(gameId, json);
}

/**
 * Presents the logs in the UI.
 * @param {number} gameId
 */
function setLogEntriesInLogContainer(gameId) {
    logContainer.innerHTML = "";
    const gameLog = getGameLogFromLocalStorage(gameId);
    for (let i = gameLog.logs.length - 1; i >= 0; i--) {
        const entry = gameLog.logs[i];
        makeLogEntryHtml(entry);
    }
}

/**
 * Adds the given CSS classes to the given HTML element.
 * @param {HTMLElement} elem The HTML element.
 * @param {string} classes A string of space separated CSS classes.
 */
function addStringOfClassesToHtmlElement(elem, classes) {
    for (c of classes.split(" ")) {
        elem.classList.add(c);
    }
}

/**
 * Helper function to construct log entry HTML structure.
 * Appends the log entry to the container HTML element.
 * @param {LogEntry} logEntry 
 */
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
    if (input.value.trim().length == 0) {
        alert("A log entry is required!");
        return;
    }

    const gameId = await getGameId();
    addLogEntryToLocalStorage(gameId, input.value);
    setLogEntriesInLogContainer(gameId);
    input.value = "";
    input.focus();
});

document.addEventListener("DOMContentLoaded", async () => {
    const gameId = await getGameId();
    subheading.textContent = gameId;
    setLogEntriesInLogContainer(gameId);
});
