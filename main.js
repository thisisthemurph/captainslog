/** @type HTMLButtonElement */
const submitBtn = document.getElementById("submit-btn");
/** @type HTMLButtonElement */
const clearBtn = document.getElementById("clear-btn");
/** @type HTMLTextAreaElement */
const input = document.getElementById("log-input");
/** @type HTMLElement */
const logContainer = document.getElementById("log-messages");
/** @type HTMLElement */
const subheading = document.getElementById("game-id");

/**
 * @typedef {Object} LogEntryObject
 * @property {string} text
 * @property {string} timestamp
 * 
 * @typedef {Object} GameLogObject
 * @property {number} gameId
 * @property {LogEntryObject[]} logs
 */

/** Class representing a Game. */
class Game {
    /**
     * Creates a new Game.
     * @param {number} gameId - The ID of the game.
     */
    constructor(gameId) {
        this.id = gameId;
        this.log = this.getGameLog();
    }

    /**
     * Gets the game log from LocalStorage if it exists. Returns a new game log if it doesn't exist.
     * @returns {GameLog}
     */
    getGameLog() {
        const newGameLog = new GameLog(this.id);
        const gameLogJson = localStorage.getItem(this.id);

        if (gameLogJson === null) {
            console.info(`Game ${this.id} has no logs.`);
            return newGameLog;
        }

        /** @type GameLogObject */
        const gameLogData = JSON.parse(gameLogJson);
        for (let log of gameLogData.logs) {
            newGameLog.addLogEntry(log.text);
        }
        return newGameLog;
    }

    /**
     * Saves the game log in LocalStorage, overwrites if gameId already exists.
     * @param {GameLog} gameLog the game log to be persisted
     */
    save() {
        localStorage.setItem(this.id, this.log.toJson());
    }
}

/** Class representing a GameLog */
class GameLog {
    /**
     * Creates a new GameLog.
     * @param {number} gameId 
     */
    constructor(gameId) {
        this.gameId = gameId;
        /** @type LogEntry[] */
        this.logs = [];
    }

    /**
     * Adds a new log entry to the game log.
     * @param {string} text 
     */
    addLogEntry(text) {
        const entry = new LogEntry(this.gameId, text);
        this.logs.push(entry);
    }

    /**
     * Removes the log entry at the given index.
     * @param {number} index 
     */
    removeAtIndex(index) {
        if (this.logs.length >= index) {
            this.logs.splice(index, 1);
        }
    }

    /**
     * Returns the GameLog as a JSON string.
     * @returns {string} the JSON data
     */
    toJson() {
        return JSON.stringify(this.asObject());
    }

    /**
     * Returns a POJO of the GameLog class.
     * @returns {GameLogObject}
     */
    asObject() {
        const data = { gameId: this.gameId, logs: [] };
        for (let log of this.logs) {
            data.logs.push(log.asObject());
        }
        return data;
    }
}

/** Class representing a single LogEntry */
class LogEntry {
    /**
     * Creates a new LogEntry. If no timestamp is provided, the current time is used.
     * @param {number} gameId 
     * @param {string} text 
     * @param {Date} timestamp 
     */
    constructor(gameId, text, timestamp = null) {
        this.gameId = gameId;
        this.text = text;
        this.timestamp = timestamp === null ? Date.now() : timestamp;
    }

    /**
     * Returns the formatted timestamp
     * @returns {string} the formatted date
     */
    formattedDate() {
        return dateFns.format(this.timestamp, "eee d MMM HH:mm");
    }

    /**
     * Returns a POJO representation of the class.
     * @returns {LogEntryObject}
     */
    asObject() {
        return { gameId: this.gameId, text: this.text, timestamp: this.timestamp };
    }
}

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
 * @returns {Promise<number|null>} A promise that resolves to an integer representing the game ID.
 */
async function getGameId() {
    let url;
    try {
        url = await getCurrentTabUrl();
    } catch {
        console.warn("Could not determine url, unable to get current tab.")
        return null;
    }

    let segments;
    try {
        segments = url.split("/");
    } catch {
        console.warn("Could not determine url, malformed.")
        return null;
    }

    const lastSegment = segments[segments.length - 1];

    return parseInt(lastSegment, 10);
}

submitBtn.addEventListener("click", async () => {
    if (input.value.trim().length == 0) {
        alert("A log entry is required!");
        return;
    }

    const gameId = await getGameId();
    if (gameId === null) {
        showWrongUrlNotification();
        return;
    }

    const game = new Game(gameId);
    game.log.addLogEntry(input.value);
    game.save();

    refreshLogsInUi(gameId);
    input.value = "";
    input.focus();
});

clearBtn.addEventListener("click", () => {
    input.value = "";
    input.focus();
});

document.addEventListener("DOMContentLoaded", async () => {
    const gameId = await getGameId();
    if (gameId === null) {
        showWrongUrlNotification();
        return;
    }

    subheading.textContent = gameId;
    refreshLogsInUi(gameId);
});

//
// UI functions
//

/**
 * Helper function to construct log entry HTML structure.
 * Appends the log entry to the container HTML element.
 * @param {number} index
 * @param {number} gameId
 * @param {LogEntryObject} logEntry 
 */
function makeLogEntryHtml(index, gameId, logEntry) {
    const containerClasses = "group p-4 odd:bg-[#2C3273] even:bg-transparent text-white text-lg hover:bg-[#5961bb]"
    const dateClasses = "flex justify-end text-sm text-[#99a2ff] group-hover:hidden"
    const headerClasses = "flex justify-end min-h-6"
    const deleteBtnStyles = "btn-sm hidden group-hover:block"

    const containerElem = document.createElement("div");
    addStringOfClassesToHtmlElement(containerElem, containerClasses);
    const headerElem = document.createElement("header");
    addStringOfClassesToHtmlElement(headerElem, headerClasses);
    const dateElem = document.createElement("span");
    addStringOfClassesToHtmlElement(dateElem, dateClasses);
    const deleteBtnElem = document.createElement("button");
    addStringOfClassesToHtmlElement(deleteBtnElem, deleteBtnStyles);
    deleteBtnElem.textContent = "Delete";
    deleteBtnElem.addEventListener("click", () => {
        const game = new Game(gameId);
        game.log.removeAtIndex(index);
        game.save();
        refreshLogsInUi(gameId);
    });

    dateElem.textContent = dateFns.format(logEntry.timestamp, "eee d MMM HH:mm");
    headerElem.appendChild(deleteBtnElem);
    headerElem.appendChild(dateElem);
    containerElem.appendChild(headerElem);

    const lines = logEntry.text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const textElem = document.createElement("p");
        textElem.textContent = line;
        containerElem.appendChild(textElem);
    }

    logContainer.appendChild(containerElem);
}

/**
 * Presents the logs in the UI.
 * @param {number} gameId
 */
function refreshLogsInUi(gameId) {
    const game = new Game(gameId);

    logContainer.innerHTML = "";
    for (let i = game.log.logs.length - 1; i >= 0; i--) {
        const entry = game.log.logs[i];
        makeLogEntryHtml(i, gameId, entry);
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
 * Presents a notification to the user if they try to use the extension outside of a game.
 */
function showWrongUrlNotification() {
    const container = document.querySelector("#content-section");

    const p = document.createElement("p");
    addStringOfClassesToHtmlElement(p, "text-lg")
    const t1 = document.createElement("span");
    const t2 = document.createElement("span");
    const link = document.createElement("a");

    t1.textContent = "This extension only works on the Neptune's Pride website. Visit ";
    link.textContent = "Neptune's Pride"
    link.href = "https://np.ironhelmet.com/#load_game"
    link.target = "_blank"
    t2.textContent = " to select your game.";

    p.appendChild(t1);
    p.appendChild(link);
    p.appendChild(t2);

    container.innerHTML = "";
    container.appendChild(p);
}