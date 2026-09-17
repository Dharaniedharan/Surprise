/* ==========================================================================
   Sketch Birthday Surprise - Interactive Calculator Logic & Audio Engine
   ========================================================================== */

const CORRECT_DATE = "19-09-2007";
const TARGET_DIGITS = "19092007";

let enteredDigits = "";
let isAudioMuted = false;
let audioCtx = null;

// DOM Elements
const lockScreen = document.getElementById("lock-screen");
const surpriseScreen = document.getElementById("surprise-screen");
const displayText = document.getElementById("display-text");
const calculator = document.getElementById("calculator");
const errorSpeechBubble = document.getElementById("error-speech-bubble");
const hintToggleBtn = document.getElementById("hint-toggle-btn");
const hintNote = document.getElementById("hint-note");

const soundToggleBtn = document.getElementById("sound-toggle");
const soundIcon = document.getElementById("sound-icon");
const magicBubble = document.getElementById("magic-bubble");
const bubbleCaption = document.getElementById("bubble-caption");

// Keypad buttons
const numButtons = document.querySelectorAll(".btn-num");
const btnClear = document.getElementById("btn-clear");
const btnBackspace = document.getElementById("btn-backspace");
const btnUnlock = document.getElementById("btn-unlock");

// ==========================================================================
// Web Audio Synthesizer (Pencil scribbles, calculator clicks, fanfare)
// ==========================================================================
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Tactile calculator button click / tap
function playKeyClickSound() {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(650 + Math.random() * 100, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn("Audio click prevented:", e);
  }
}

// Playful "wrong passcode" buzzer sound
function playBuzzerSound() {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(170, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// Grand celebratory chime fanfare
function playCelebrationFanfare() {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + index * 0.12 + 0.7,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + index * 0.12);
      osc.stop(ctx.currentTime + index * 0.12 + 0.7);
    });
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// Bubble pop sound effect
function playBubblePopSound() {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// ==========================================================================
// ==========================================================================
// Birthday Vault Glow Dot Password Formatter
// ==========================================================================
function updateScreenDisplay() {
  for (let i = 0; i < 8; i++) {
    const dot = document.getElementById(`slot-${i}`);
    if (!dot) continue;

    if (i < enteredDigits.length) {
      dot.classList.add("active");
      dot.classList.remove("current");
    } else if (i === enteredDigits.length) {
      dot.classList.remove("active");
      dot.classList.add("current");
    } else {
      dot.classList.remove("active");
      dot.classList.remove("current");
    }
  }
}

// ==========================================================================
// Keypad Click Handlers
// ==========================================================================
numButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    playKeyClickSound();
    hideErrorMessage();

    const val = btn.getAttribute("data-val");
    if (enteredDigits.length < 8) {
      enteredDigits += val;
      updateScreenDisplay();
    }
  });
});

btnClear.addEventListener("click", () => {
  playKeyClickSound();
  hideErrorMessage();
  enteredDigits = "";
  updateScreenDisplay();
});

btnBackspace.addEventListener("click", () => {
  playKeyClickSound();
  hideErrorMessage();
  if (enteredDigits.length > 0) {
    enteredDigits = enteredDigits.slice(0, -1);
    updateScreenDisplay();
  }
});

btnUnlock.addEventListener("click", () => {
  handleUnlockAttempt();
});

// ==========================================================================
// Physical Keyboard Support
// ==========================================================================
window.addEventListener("keydown", (e) => {
  if (!lockScreen.classList.contains("active")) return;

  if (e.key >= "0" && e.key <= "9") {
    // Highlight button on keypad visually
    const btn = Array.from(numButtons).find(
      (b) => b.getAttribute("data-val") === e.key,
    );
    if (btn) {
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 120);
    }
    playKeyClickSound();
    hideErrorMessage();
    if (enteredDigits.length < 8) {
      enteredDigits += e.key;
      updateScreenDisplay();
    }
  } else if (e.key === "Backspace") {
    btnBackspace.classList.add("pressed");
    setTimeout(() => btnBackspace.classList.remove("pressed"), 120);
    playKeyClickSound();
    hideErrorMessage();
    if (enteredDigits.length > 0) {
      enteredDigits = enteredDigits.slice(0, -1);
      updateScreenDisplay();
    }
  } else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
    btnClear.classList.add("pressed");
    setTimeout(() => btnClear.classList.remove("pressed"), 120);
    playKeyClickSound();
    hideErrorMessage();
    enteredDigits = "";
    updateScreenDisplay();
  } else if (e.key === "Enter") {
    btnUnlock.classList.add("pressed");
    setTimeout(() => btnUnlock.classList.remove("pressed"), 120);
    handleUnlockAttempt();
  }
});

// ==========================================================================
// Passcode Verification
// ==========================================================================
function hideErrorMessage() {
  if (errorSpeechBubble.classList.contains("visible")) {
    errorSpeechBubble.classList.remove("visible");
  }
}

function handleUnlockAttempt() {
  if (enteredDigits === TARGET_DIGITS) {
    handleSuccessfulUnlock();
  } else {
    handleWrongPasscode();
  }
}

function handleWrongPasscode() {
  playBuzzerSound();

  // Trigger shake on calculator
  calculator.classList.remove("sketch-shake");
  void calculator.offsetWidth; // reflow
  calculator.classList.add("sketch-shake");

  // Display speech bubble error
  errorSpeechBubble.classList.add("visible");
}

// DOM Elements for Question Stage
const questionScreen = document.getElementById("question-screen");
const btnQuestionYes = document.getElementById("btn-question-yes");
const btnQuestionNo = document.getElementById("btn-question-no");
const noDodgeMsg = document.getElementById("no-dodge-msg");

const dodgePhrases = [
  "Nope! You can't say no to this! 🏃💨",
  "Nice try, but not an option! 😜",
  "Catch me if you can! 👻",
  "Oops, too slow! 💨",
  "Resistance is futile! Click YES! 💖",
  "Don't break my heart, click Yes! 🥺",
];
let dodgeCount = 0;

function dodgeNoButton() {
  playKeyClickSound();
  btnQuestionNo.classList.add("evading");

  const padding = 60;
  const buttonWidth = btnQuestionNo.offsetWidth || 100;
  const buttonHeight = btnQuestionNo.offsetHeight || 50;

  const maxX = window.innerWidth - buttonWidth - padding;
  const maxY = window.innerHeight - buttonHeight - padding;

  const randomX = Math.max(padding, Math.floor(Math.random() * maxX));
  const randomY = Math.max(padding, Math.floor(Math.random() * maxY));

  btnQuestionNo.style.left = `${randomX}px`;
  btnQuestionNo.style.top = `${randomY}px`;

  // Scale up the Yes button slightly each time No is chased!
  dodgeCount++;
  const yesScale = Math.min(1.4, 1 + dodgeCount * 0.06);
  btnQuestionYes.style.transform = `scale(${yesScale})`;

  // Display fun rotating dodge message
  const msg = dodgePhrases[dodgeCount % dodgePhrases.length];
  noDodgeMsg.querySelector("span").textContent = msg;
  noDodgeMsg.classList.remove("hidden");
}

// Dodge on hover, mouseenter, touchstart, or focus
btnQuestionNo.addEventListener("mouseenter", dodgeNoButton);
btnQuestionNo.addEventListener("touchstart", (e) => {
  e.preventDefault();
  dodgeNoButton();
});
btnQuestionNo.addEventListener("click", (e) => {
  e.preventDefault();
  dodgeNoButton();
});

// YES button clicked -> proceeds to Birthday Surprise Stage
btnQuestionYes.addEventListener("click", () => {
  playCelebrationFanfare();

  if (window.confetti) {
    window.confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#ff4785", "#7952b3", "#f59e0b", "#2563eb", "#2ec4b6"],
    });
  }

  // Smooth transition from Question Screen to Surprise Screen
  const questionWrapper = document.querySelector(".question-page-wrapper");
  questionWrapper.style.transition = "all 0.5s ease";
  questionWrapper.style.transform = "scale(0.9) rotate(4deg)";
  questionWrapper.style.opacity = "0";

  // Reset No button position if evading
  btnQuestionNo.classList.remove("evading");
  btnQuestionNo.style.left = "";
  btnQuestionNo.style.top = "";

  setTimeout(() => {
    questionScreen.classList.remove("active");
    questionScreen.classList.add("hidden");

    surpriseScreen.classList.remove("hidden");
    surpriseScreen.classList.add("active");

    // Play Stage 3 Birthday Song!
    playBirthdaySong();

    // Confetti celebration on entering Surprise Screen
    setTimeout(() => {
      if (window.confetti) {
        window.confetti({
          particleCount: 80,
          spread: 85,
          origin: { y: 0.45 },
          colors: ["#ff4785", "#f59e0b", "#7952b3", "#2563eb"],
        });
      }
    }, 400);
  }, 500);
});

// ==========================================================================
// Stage 3 Song Audio Controller (ReelAudio-73819.mp3)
// ==========================================================================
const birthdaySong = document.getElementById("birthday-song");

function playBirthdaySong() {
  if (!birthdaySong) return;
  if (isAudioMuted) return; // If muted via speaker, don't start

  birthdaySong.currentTime = birthdaySong.currentTime || 0;
  birthdaySong.muted = false;
  birthdaySong.volume = 0.85;

  if (birthdaySong.paused) {
    birthdaySong.play().catch((err) => {
      console.log("Autoplay waiting for user gesture:", err);
    });
  }
}

function stopBirthdaySong() {
  if (!birthdaySong) return;
  birthdaySong.pause();
}

function handleSuccessfulUnlock() {
  playCelebrationFanfare();

  // Mini celebration upon unlocking
  if (window.confetti) {
    window.confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#ff4785", "#ffd166", "#ffffff", "#ff1744"],
    });
  }

  // Smooth transition from Lock Screen to Question Screen
  const stageBox = document.querySelector(".glow-vault-stage") || lockScreen;
  stageBox.style.transition = "all 0.45s ease";
  stageBox.style.transform = "scale(0.9) rotate(3deg)";
  stageBox.style.opacity = "0";

  setTimeout(() => {
    lockScreen.classList.remove("active");
    lockScreen.classList.add("hidden");

    // Reveal Question Screen
    questionScreen.classList.remove("hidden");
    questionScreen.classList.add("active");

    // Restore stageBox styles for if they return
    stageBox.style.opacity = "1";
    stageBox.style.transform = "none";
  }, 450);
}

// Clue Sticky Tab
hintToggleBtn.addEventListener("click", () => {
  playKeyClickSound();
  hintNote.classList.toggle("hidden");
});

// Sound Toggle (Top-Right Speaker)
// Toggling this stops/resumes the song and toggles sound effects
soundToggleBtn.addEventListener("click", () => {
  isAudioMuted = !isAudioMuted;
  soundIcon.textContent = isAudioMuted ? "🔇" : "🔊";
  soundToggleBtn.title = isAudioMuted ? "Sound Muted" : "Sound Active";

  if (birthdaySong) {
    if (isAudioMuted) {
      stopBirthdaySong();
    } else {
      // Only resume song if we are currently on the surprise screen
      if (surpriseScreen && surpriseScreen.classList.contains("active")) {
        playBirthdaySong();
      }
    }
  }

  if (!isAudioMuted) {
    playKeyClickSound();
  }
});

// ==========================================================================
// Right-Side Bubble & Memories Showcase Interaction
// 1. First click on bubble -> pops bubble, reveals pic 1.jpg with "Unlock More Memories"
// 2. Click "Unlock More Memories" -> transitions through Draw 1, 2, 3, 4, 5, 6, 7 one by one with fade
// 3. After completing Draw 7 -> pressing "Unlock More Memories" views friend.jpg!
// ==========================================================================
const memoriesShowcase = document.getElementById("memories-showcase");
const memoryActiveImg = document.getElementById("memory-active-img");
const memoryCaption = document.getElementById("memory-caption");
const btnUnlockMemories = document.getElementById("btn-unlock-memories");
const btnPrevMemory = document.getElementById("btn-prev-memory");
const unlockBtnLabel = document.getElementById("unlock-btn-label");

const DRAWING_IMAGES = [
  {
    src: "drawing/Draw 1.jpg",
    caption: "✏️ Step 1: Starting with the grid lines... 📐",
  },
  {
    src: "drawing/Draw 2.jpg",
    caption: "✏️ Step 2: Laying down initial contours... ✍️",
  },
  {
    src: "drawing/Draw 3.jpg",
    caption: "✏️ Step 3: Shaping the silhouette & pose... 🌸",
  },
  {
    src: "drawing/Draw 4.jpg",
    caption: "✏️ Step 4: Sketching that beautiful hair... ✨",
  },
  {
    src: "drawing/Draw 5.jpg",
    caption: "✏️ Step 5: Bringing out the eyes & smile... 💖",
  },
  {
    src: "drawing/Draw 6.jpg",
    caption: "✏️ Step 6: Detailed shading & accents... 🎨",
  },
  {
    src: "drawing/Draw 7.jpg",
    caption: "✨ Step 7: The Masterpiece is complete! 🌟",
  },
];

// Build full slideshow sequence: pic1 -> drawings (1..7) -> friend
const SLIDES = [
  { src: "pic 1.jpg", caption: "Your wish may come true one day 😂" },
  ...DRAWING_IMAGES,
  { src: "friend.jpg", caption: "Best Friends Forever & Always! 💖👭✨" },
];

let currentMemoryPhase = "bubble"; // 'bubble' until popped
let isTransitioningMemory = false;
let currentSlideIndex = -1; // index into SLIDES when memories visible
let autoplayInProgress = false;
let autoplayCancel = null;

// Preload drawings and friend images for instant butter-smooth transitions
[
  "pic 1.jpg",
  "drawing/Draw 1.jpg",
  "drawing/Draw 2.jpg",
  "drawing/Draw 3.jpg",
  "drawing/Draw 4.jpg",
  "drawing/Draw 5.jpg",
  "drawing/Draw 6.jpg",
  "drawing/Draw 7.jpg",
  "friend.jpg",
].forEach((src) => {
  const img = new Image();
  img.src = src;
});

// Helper for fading image change - loads new image completely before fading in
function transitionMemoryPhoto(newSrc, newCaptionText, callback) {
  if (!memoryActiveImg) return;

  // Start fade out
  memoryActiveImg.classList.add("fading");
  if (memoryCaption && newCaptionText) {
    memoryCaption.style.opacity = "0";
    memoryCaption.style.transition = "opacity 0.25s ease";
  }

  // Preload next image into memory first so heavy images (Draw 1, Draw 2) don't lag or skip
  const tempImg = new Image();
  let finished = false;

  const onReady = () => {
    if (finished) return;
    finished = true;

    // Switch source and fade in
    memoryActiveImg.src = newSrc;
    if (memoryCaption && newCaptionText) {
      memoryCaption.querySelector("span").textContent = newCaptionText;
      memoryCaption.style.opacity = "1";
    }

    // Give browser brief tick to paint before removing .fading
    requestAnimationFrame(() => {
      setTimeout(() => {
        memoryActiveImg.classList.remove("fading");
        if (callback) callback();
      }, 50);
    });
  };

  tempImg.onload = () => {
    // Wait at least the CSS fade-out time (320ms) for smooth transition
    setTimeout(onReady, 320);
  };

  tempImg.onerror = () => {
    console.error("Failed to load image:", newSrc);
    setTimeout(onReady, 320);
  };

  tempImg.src = newSrc;

  // Fallback in case image is already cached or delayed
  setTimeout(onReady, 1200);
}

// First Interaction: Pop Me Bubble clicked
magicBubble.addEventListener("click", () => {
  playBubblePopSound();

  // If on surprise screen and not muted, ensure song is playing
  if (!isAudioMuted && birthdaySong && birthdaySong.paused) {
    playBirthdaySong();
  }

  // Burst celebratory confetti
  const rect = magicBubble.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  if (window.confetti) {
    window.confetti({
      particleCount: 50,
      spread: 70,
      origin: { x, y },
      colors: ["#ff4785", "#f59e0b", "#7952b3", "#2563eb", "#10b981"],
    });
  }

  // Pop animation on bubble
  magicBubble.classList.add("bubble-sketch-pop");

  setTimeout(() => {
    // Hide bubble & its initial caption completely
    magicBubble.style.display = "none";
    bubbleCaption.style.display = "none";

    // Show Polaroid card with pic 1.jpg
    currentMemoryPhase = "pic1";
    memoriesShowcase.classList.remove("hidden");
    memoriesShowcase.style.display = "flex";

    // Initialize slideshow to first slide (pic 1)
    currentSlideIndex = 0;
    showSlide(currentSlideIndex);

    // Mini confetti burst on photo appearance
    if (window.confetti) {
      window.confetti({
        particleCount: 40,
        spread: 60,
        origin: { x, y },
        colors: ["#ff4785", "#ffd166", "#ffffff"],
      });
    }
  }, 400);
});

// Second Interaction: "Unlock More Memories" button clicked
btnUnlockMemories.addEventListener("click", () => {
  if (isTransitioningMemory || autoplayInProgress) return;
  playKeyClickSound();

  // Mini burst
  if (window.confetti) {
    window.confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.65 },
      colors: ["#ff4785", "#7952b3", "#f59e0b"],
    });
  }

  // If currently at the first slide (pic1), start the auto-play of drawings
  if (currentSlideIndex === 0) {
    startAutoplayDrawings();
    return;
  }

  // If not at last slide, advance one slide
  if (currentSlideIndex >= 0 && currentSlideIndex < SLIDES.length - 1) {
    showSlide(currentSlideIndex + 1, () => {
      // If we reached the final slide, celebration
      if (currentSlideIndex === SLIDES.length - 1) {
        playCelebrationFanfare();
      }
    });
    return;
  }

  // If already at the last slide, do nothing (or could replay)
});

// Prev button handler
if (btnPrevMemory) {
  btnPrevMemory.addEventListener("click", () => {
    if (isTransitioningMemory) return;
    // Cancel autoplay if running
    if (autoplayInProgress && autoplayCancel) {
      clearTimeout(autoplayCancel);
      autoplayInProgress = false;
      btnUnlockMemories.disabled = false;
    }
    if (currentSlideIndex > 0) {
      showSlide(currentSlideIndex - 1);
    }
  });
}

// Show a given slide index from SLIDES and update controls
function showSlide(index, cb) {
  if (index < 0) index = 0;
  if (index > SLIDES.length - 1) index = SLIDES.length - 1;
  isTransitioningMemory = true;
  currentSlideIndex = index;
  const slide = SLIDES[index];
  transitionMemoryPhoto(slide.src, slide.caption, () => {
    isTransitioningMemory = false;
    updateControls();
    if (cb) cb();
  });
}

function updateControls() {
  if (btnPrevMemory)
    btnPrevMemory.disabled =
      currentSlideIndex <= 0 || isTransitioningMemory || autoplayInProgress;
  if (!unlockBtnLabel) return;
  if (currentSlideIndex <= 0) {
    unlockBtnLabel.textContent = "Unlock More Memories";
    btnUnlockMemories.classList.remove("completed");
  } else if (currentSlideIndex >= SLIDES.length - 1) {
    unlockBtnLabel.textContent = "Friends Forever! 💖";
    btnUnlockMemories.classList.add("completed");
  } else if (
    currentSlideIndex >= 1 &&
    currentSlideIndex <= DRAWING_IMAGES.length
  ) {
    const drawNumber = currentSlideIndex; // 1..7
    unlockBtnLabel.textContent = `Sketch ${drawNumber} of ${DRAWING_IMAGES.length}... ✨`;
    btnUnlockMemories.classList.remove("completed");
  } else {
    unlockBtnLabel.textContent = "Next";
    btnUnlockMemories.classList.remove("completed");
  }
}

// Autoplay drawings sequence from Draw 1..7
function startAutoplayDrawings() {
  if (autoplayInProgress) return;
  autoplayInProgress = true;
  btnUnlockMemories.disabled = true;
  currentMemoryPhase = "drawings";

  let idx = 1; // drawings start at index 1 in SLIDES

  function step() {
    if (!autoplayInProgress) return;
    if (idx <= DRAWING_IMAGES.length) {
      showSlide(idx, () => {
        idx++;
        autoplayCancel = setTimeout(step, 2200);
      });
    } else {
      // finished drawings
      autoplayInProgress = false;
      btnUnlockMemories.disabled = false;
      currentMemoryPhase = "drawings_complete";
      currentSlideIndex = DRAWING_IMAGES.length;
      unlockBtnLabel.textContent = "Unlock Special Memory 💝";
      btnUnlockMemories.classList.add("completed");
      updateControls();

      if (window.confetti) {
        window.confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#ff4785", "#10b981", "#f59e0b"],
        });
      }
    }
  }

  step();
}
