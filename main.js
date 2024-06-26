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

async function initialize() {
    const ui = new UI();

    const gameId = await getGameId();
    if (gameId === null) {
        ui.showWrongUrlNotification();
        return;
    }

    const game = new Game(ui, gameId);
    subheading.textContent = gameId;
    ui.refresh(game.log);

    submitBtn.addEventListener("click", () => submitNewLogEntry(game, input.value.trim()));
    clearBtn.addEventListener("click", () => {
        input.value = "";
        input.focus();
    });
}

/**
 * 
 * @param {Game} game 
 * @param {string} logEntryText 
 * @returns 
 */
function submitNewLogEntry(game, logEntryText) {
    if (logEntryText.length == 0) {
        alert("A log entry is required!");
        return;
    }

    game.log.addLogEntry(logEntryText);
    game.save();

    game.ui.refresh(game.log);
    input.value = "";
    input.focus();
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

class UI {
    constructor() {
        /** @type HTMLButtonElement */
        this.submitBtn = document.getElementById("submit-btn");
        /** @type HTMLButtonElement */
        this.clearBtn = document.getElementById("clear-btn");
        /** @type HTMLTextAreaElement */
        this.input = document.getElementById("log-input");
        /** @type HTMLElement */
        this.logContainer = document.getElementById("log-messages");
        /** @type HTMLElement */
        this.subheading = document.getElementById("game-id");
    }

    /**
     * Updates the logs in the UI.
     * @param {GameLog} gameLog
     */
    refresh(gameLog) {
        logContainer.innerHTML = "";
        for (let i = gameLog.logs.length - 1; i >= 0; i--) {
            const entry = gameLog.logs[i];
            this.#makeLogEntryHtml(i, gameLog.gameId, entry);
        }
    }

    /**
     * Presents a notification to the user if they try to use the extension outside of a game.
     */
    showWrongUrlNotification() {
        const container = document.querySelector("#content-section");

        const p = document.createElement("p");
        p.classList.add("text-lg");
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

    #makeLogEntryHtml(index, gameId, logEntry) {
        const containerElem = document.createElement("div");
        containerElem.classList.add("group");
        containerElem.classList.add("entry-container");

        const headerElem = document.createElement("header");
        headerElem.classList.add("entry-header")

        const dateElem = document.createElement("span");
        dateElem.classList.add("entry-date");

        const deleteBtnElem = document.createElement("button");
        deleteBtnElem.classList.add("entry-delete-btn")
        deleteBtnElem.textContent = "Delete";
        deleteBtnElem.addEventListener("click", () => {
            const game = new Game(new UI(), gameId);
            game.log.removeAtIndex(index);
            game.save();
            this.refresh(game.log);
        });

        dateElem.textContent = dateFns.format(logEntry.timestamp, "eee d MMM HH:mm");
        headerElem.appendChild(deleteBtnElem);
        headerElem.appendChild(dateElem);
        containerElem.appendChild(headerElem);

        const textContainerElem = document.createElement("div");
        textContainerElem.classList.add("entry-text-container");
        const lines = logEntry.text.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const textElem = document.createElement("p");
            textElem.textContent = line;
            textContainerElem.appendChild(textElem);
        }

        containerElem.appendChild(textContainerElem);
        logContainer.appendChild(containerElem);
    }
}

/** Class representing a Game. */
class Game {
    /**
     * Creates a new Game.
     * @param {UI} ui - The user interface of the app.
     * @param {number} gameId - The ID of the game.
     */
    constructor(ui, gameId) {
        this.id = gameId;
        this.log = this.getGameLog();
        this.ui = ui
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

document.addEventListener("DOMContentLoaded", async () => initialize());
