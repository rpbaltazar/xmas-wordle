const WORDS=["BEZEL", "PRONG", "MOUNT"];
const MAX_ATTEMPTS=5;
const WORD_OF_THE_DAY="todaysWord";
const STORAGE_KEY="lastPlayedDate";
const GAME_STATE_KEY = "dailyWordGameState";
const WORD_DICTIONARY_PATH = "resources/words.json"

const grid=document.getElementById("grid");
const message=document.getElementById("message");
const input=document.getElementById("guessInput");

input.addEventListener("input", () => {
  message.textContent = "";
});

input.addEventListener("input", () => {
  input.value = input.value.toUpperCase();
  message.textContent = "";
  updateSubmitState();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !submitBtn.disabled) {
    e.preventDefault();
    submitGuess();
  }
});

const submitBtn = document.getElementById("submitBtn");
let dictionaryLoaded = false;

// Build grid
for (let i=0; i < MAX_ATTEMPTS; i++) {
  const row=document.createElement("div");
  row.className="row";

  for (let j=0; j < 5; j++) {
    cell = createCell()
    row.appendChild(cell);
  }

  grid.appendChild(row);
}

function createCell() {
  const cell = document.createElement("div");
cell.className = "cell";

const inner = document.createElement("div");
inner.className = "cell-inner";

const front = document.createElement("div");
front.className = "cell-face cell-front";

const back = document.createElement("div");
back.className = "cell-face cell-back";

inner.appendChild(front);
inner.appendChild(back);
cell.appendChild(inner);
return cell;
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
fetch(WORD_DICTIONARY_PATH)
.then(res => res.json())
.then(words => {
  DICTIONARY = new Set(words);
  dictionaryLoaded = true;
  updateSubmitState();
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
  updateSubmitState();
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

  // First pass: mark correct letters
  const results = Array(5).fill("absent");

  for (let i = 0; i < 5; i++) {
    if (guess[i] === word[i]) {
      results[i] = "correct";
      wordLetters[i] = null;
    }
  }

  // Second pass: present letters
  for (let i = 0; i < 5; i++) {
    if (results[i] !== "absent") continue;

    const index = wordLetters.indexOf(guess[i]);
    if (index !== -1) {
      results[i] = "present";
      wordLetters[index] = null;
    }
  }

  // Animate tiles
  [...row.children].forEach((cell, i) => {
    const inner = cell.querySelector(".cell-inner");
    const front = cell.querySelector(".cell-front");
    const back = cell.querySelector(".cell-back");

    front.textContent = guess[i];
    back.textContent = guess[i];
    back.classList.add(results[i]);

    setTimeout(() => {
      cell.classList.add("flip");
    }, i * 120); // staggered flip
  });
}

function disableGame(text) {
  input.disabled=true;
  message.textContent=text;
  submitBtn.disabled = true;
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
  if (navigator.vibrate) navigator.vibrate(50);

  // Remove class so it can re-trigger
  setTimeout(() => row.classList.remove("shake"), 300);
}

function updateSubmitState() {
  console.log(dictionaryLoaded);
  console.log(gameStatus);
  console.log(input.value.length);
  submitBtn.disabled = !dictionaryLoaded || gameStatus !== "playing" || input.value.length !== 5;
}
