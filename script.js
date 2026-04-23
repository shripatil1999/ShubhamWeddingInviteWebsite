// Wedding content and target time are kept in one place for easy updates later.
const weddingDate = new Date("2026-05-06T12:36:00+05:30");

const introScreen = document.getElementById("introScreen");
const openInviteButton = document.getElementById("openInviteButton");
const musicToggle = document.getElementById("musicToggle");
const rsvpForm = document.getElementById("rsvpForm");
const formNote = document.getElementById("formNote");
const petalLayer = document.querySelector(".petal-layer");

let audioContext;
let masterGain;
let oscillators = [];
let isMusicPlaying = false;

updateMusicButton();

// Reveal sections as they enter the viewport for a polished scroll experience.
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((section) => observer.observe(section));

// Countdown timer updates every second.
function updateCountdown() {
  const now = new Date();
  const diff = weddingDate.getTime() - now.getTime();

  if (diff <= 0) {
    setCountdownValues(0, 0, 0, 0);
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  setCountdownValues(days, hours, minutes, seconds);
}

function setCountdownValues(days, hours, minutes, seconds) {
  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

// Create a gentle self-contained ambient score so the site does not depend on external audio files.
function initMusic() {
  if (audioContext) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.05;
  masterGain.connect(audioContext.destination);

  const frequencies = [261.63, 329.63, 392.0];

  oscillators = frequencies.map((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = index === 1 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = index === 1 ? 0.022 : 0.014;
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start();
    return { oscillator, gain };
  });

  isMusicPlaying = true;
  updateMusicButton();
}

async function resumeMusic() {
  if (!audioContext) {
    initMusic();
  }

  if (audioContext?.state === "suspended") {
    await audioContext.resume();
  }

  isMusicPlaying = true;
  fadeMasterGain(0.05);
  updateMusicButton();
}

async function pauseMusic() {
  if (!audioContext) {
    return;
  }

  isMusicPlaying = false;
  fadeMasterGain(0.0001);
  updateMusicButton();
}

function fadeMasterGain(targetValue) {
  if (!masterGain || !audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.linearRampToValueAtTime(targetValue, now + 0.5);
}

function updateMusicButton() {
  musicToggle.classList.toggle("is-paused", !isMusicPlaying);
  musicToggle.setAttribute("aria-pressed", String(isMusicPlaying));
  musicToggle.setAttribute("aria-label", isMusicPlaying ? "Pause music" : "Play music");
  musicToggle.querySelector(".music-icon").textContent = isMusicPlaying ? "♫" : "♪";
}

// Create celebratory petals when the invitation opens.
function burstPetals(count = 24) {
  const colors = ["#f3cb75", "#d88921", "#b9473f", "#f6b486", "#fff1cf"];

  for (let index = 0; index < count; index += 1) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.background = colors[index % colors.length];
    petal.style.setProperty("--drift", `${Math.random() * 24 - 12}vw`);
    petal.style.animationDuration = `${6 + Math.random() * 4}s`;
    petal.style.animationDelay = `${Math.random() * 1.4}s`;
    petalLayer.appendChild(petal);

    setTimeout(() => {
      petal.remove();
    }, 11000);
  }
}

// Open the invitation, start music, and trigger the celebratory entrance effect.
openInviteButton.addEventListener("click", async () => {
  introScreen.classList.add("hidden");
  await resumeMusic();
  burstPetals(34);
});

musicToggle.addEventListener("click", async () => {
  if (isMusicPlaying) {
    await pauseMusic();
  } else {
    await resumeMusic();
  }
});

// Keep the RSVP flow simple and local until a backend is added.
rsvpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(rsvpForm);
  const name = formData.get("guestName");
  const attendance = formData.get("attendance");

  formNote.textContent =
    attendance === "yes"
      ? `Thank you, ${name}. Your blessings mean a lot and we look forward to celebrating with you.`
      : `Thank you, ${name}. Your wishes are warmly received, and we will miss your presence.`;

  rsvpForm.reset();
});

updateCountdown();
setInterval(updateCountdown, 1000);
