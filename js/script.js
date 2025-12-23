const WORDS=["BEZEL", "PRONG", "MOUNT"];
const MAX_ATTEMPTS=5;
const WORD_OF_THE_DAY="todaysWord";
const STORAGE_KEY="lastPlayedDate";
const GAME_STATE_KEY = "dailyWordGameState";

const grid=document.getElementById("grid");
const message=document.getElementById("message");
const input=document.getElementById("guessInput");

input.addEventListener("input", () => {
  message.textContent = "";
});

// Build grid
for (let i=0; i < MAX_ATTEMPTS; i++) {
  const row=document.createElement("div");
  row.className="row";

  for (let j=0; j < 5; j++) {
    const cell=document.createElement("div");
    cell.className="cell";
    row.appendChild(cell);
  }

  grid.appendChild(row);
}

// Check if already played today
const today=new Date().toISOString().split("T")[0];
const lastPlayed=localStorage.getItem(STORAGE_KEY);

let word = "";
let currentAttempt=0;
let attempts = [];
let gameStatus = "playing"; // playing | won | lost
loadGameState();

// load dictionary
let DICTIONARY = new Set();
fetch("../resources/words.json")
.then(res => res.json())
.then(words => {
  DICTIONARY = new Set(words);
})
.catch(() => {
  console.error("Failed to load dictionary");
});

function fetchWord() {
  const wordOfTheDay = localStorage.getItem(today + ":" + WORD_OF_THE_DAY);

  if (wordOfTheDay===null) {
    var newWord = WORDS[Math.floor(Math.random()*WORDS.length)];
    localStorage.setItem(today + ":" + WORD_OF_THE_DAY, newWord);
    return newWord;
  } else {
    return wordOfTheDay;
  }
}

function submitGuess() {
  const guess = input.value.toUpperCase();

  if (guess.length !==5) {
    message.textContent="Enter a 5-letter word.";
    shakeCurrentRow();
    return;
  }

  if (currentAttempt >= MAX_ATTEMPTS) return;

  if (!DICTIONARY.has(guess)) {
    message.textContent = "Not a valid English word";
    shakeCurrentRow();
    return;
  }

  attempts.push(guess);
  saveGameState();
  renderGuess(guess, currentAttempt);

  if (guess === word) {
    localStorage.setItem(STORAGE_KEY, today);
    gameStatus = "won";
    saveGameState();
    showPopup();
    disableGame("You won!");
    return;
  }

  currentAttempt++;
  input.value="";

  if (currentAttempt===MAX_ATTEMPTS) {
    localStorage.setItem(STORAGE_KEY, today);
    gameStatus = "lost";
    saveGameState();

    disableGame(`Game over ! You can try again tomorrow!`);
  }
}

function loadGameState() {
  word = fetchWord();
  const saved = localStorage.getItem(GAME_STATE_KEY);
  if (!saved) return;

  const state = JSON.parse(saved);

  // Ignore old games
  if (state.date !== today) {
    localStorage.removeItem(GAME_STATE_KEY);
    return;
  }

  attempts = state.attempts || [];
  gameStatus = state.status || "playing";

  attempts.forEach((guess, attemptIndex) => {
    renderGuess(guess, attemptIndex);
  });

  currentAttempt = attempts.length;

  if (gameStatus === "won") {
    disableGame("You already won today!");
    showPopup();
  } else if (gameStatus === "lost") {
    disableGame("You have already played today. Come back tomorrow!");
  }
}

function saveGameState() {
  const state = {
    date: today,
    attempts: attempts,
    status: gameStatus
  };
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
}

function renderGuess(guess, attemptIndex) {
  const row = grid.children[attemptIndex];
  const wordLetters = word.split("");

  // First pass: correct
  for (let i = 0; i < 5; i++) {
    const cell = row.children[i];
    cell.textContent = guess[i];

    if (guess[i] === word[i]) {
      cell.classList.add("correct");
      wordLetters[i] = null;
    }
  }

  // Second pass: present / absent
  for (let i = 0; i < 5; i++) {
    const cell = row.children[i];
    if (cell.classList.contains("correct")) continue;

    const index = wordLetters.indexOf(guess[i]);
    if (index !== -1) {
      cell.classList.add("present");
      wordLetters[index] = null;
    } else {
      cell.classList.add("absent");
    }
  }
}

function disableGame(text) {
  input.disabled=true;
  message.textContent=text;
}

function showPopup() {
  document.getElementById("popup").style.display="flex";
}

function closePopup() {
  document.getElementById("popup").style.display="none";
}

function shakeCurrentRow() {
  const row = grid.children[currentAttempt];
  row.classList.add("shake");

  // Remove class so it can re-trigger
  setTimeout(() => row.classList.remove("shake"), 300);
}
