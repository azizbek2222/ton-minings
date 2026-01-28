import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7VLHdjPqf_tobSiBczGbN8H7YlFwq9Wg",
  authDomain: "magnetic-alloy-467611-u7.firebaseapp.com",
  databaseURL: "https://magnetic-alloy-467611-u7-default-rtdb.firebaseio.com",
  projectId: "magnetic-alloy-467611-u7",
  storageBucket: "magnetic-alloy-467611-u7.firebasestorage.app",
  messagingSenderId: "589500919880",
  appId: "1:589500919880:web:d7963d4b558ac49351687d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Foydalanuvchi ma'lumotlarini yuklash
let user = tg.initDataUnsafe?.user || { id: "test_user", first_name: "User" };
let userId = user.id.toString();
document.getElementById('user-name').innerText = user.first_name;

// AdsGram Controller
let AdController = null;
try {
    if (window.Adsgram) {
        AdController = window.Adsgram.init({ blockId: "int-21900" });
    }
} catch (e) { console.error("AdsGram init error"); }

const actionBtn = document.getElementById('action-btn');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const balanceDisplay = document.getElementById('total-balance');

let totalBalance = 0;
let miningDuration = 600; 
let timerInterval = null;
const miningReward = 0.00005;

const userRef = ref(db, 'users/' + userId);

// Firebase tinglovchisi
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        totalBalance = data.balance || 0;
        balanceDisplay.innerText = totalBalance.toFixed(6);
        if (data.miningStartedAt && !timerInterval) {
            checkAndResumeMining(data.miningStartedAt);
        }
    } else {
        set(userRef, { name: user.first_name, balance: 0, miningStartedAt: null });
    }
});

function checkAndResumeMining(startTime) {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    if (elapsedSeconds >= miningDuration) {
        stopMiningUI();
    } else {
        startUIThread(startTime);
    }
}

// ASOSIY TUGMA HODISASI
actionBtn.addEventListener('click', async () => {
    if (actionBtn.classList.contains('claim-mode')) {
        await claimTon();
    } else {
        handleMiningStart();
    }
});

async function handleMiningStart() {
    actionBtn.disabled = true;
    actionBtn.innerText = "YUKLANMOQDA...";

    // Reklamani tekshirish va ko'rsatish
    if (AdController) {
        try {
            const result = await AdController.show();
            if (result.done) {
                initiateMiningDB();
            } else {
                tg.showAlert("Reklamani oxirigacha ko'ring!");
                resetStartButton();
            }
        } catch (e) {
            console.log("Ad show error, starting anyway...");
            initiateMiningDB();
        }
    } else {
        // Agar reklama SDK yuklanmagan bo'lsa, miningni boshlayverish
        initiateMiningDB();
    }
}

async function initiateMiningDB() {
    const startTime = Date.now();
    await update(userRef, { miningStartedAt: startTime });
    startUIThread(startTime);
}

function resetStartButton() {
    actionBtn.disabled = false;
    actionBtn.innerText = "MININGNI BOSHLASH";
    actionBtn.classList.remove('claim-mode');
}

function startUIThread(startTime) {
    clearInterval(timerInterval);
    actionBtn.disabled = true;
    actionBtn.innerText = "MINING...";
    
    timerInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = miningDuration - elapsed;

        if (remaining <= 0) {
            stopMiningUI();
        } else {
            updateUI(remaining);
        }
    }, 1000);
}

function updateUI(remaining) {
    let mins = Math.floor(remaining / 60);
    let secs = remaining % 60;
    timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    progressBar.style.width = ((miningDuration - remaining) / miningDuration * 100) + "%";
    pendingDisplay.innerText = (((miningDuration - remaining) / miningDuration) * miningReward).toFixed(6);
}

function stopMiningUI() {
    clearInterval(timerInterval);
    timerInterval = null;
    actionBtn.disabled = false;
    actionBtn.innerText = "CLAIM TON";
    actionBtn.classList.add('claim-mode');
    timerDisplay.innerText = "00:00";
    progressBar.style.width = "100%";
    pendingDisplay.innerText = miningReward.toFixed(5);
}

async function claimTon() {
    actionBtn.disabled = true;
    try {
        const newTotal = totalBalance + miningReward;
        await update(userRef, {
            balance: newTotal,
            miningStartedAt: null 
        });
        
        // HAMMA NARSANI BOSHLANG'ICH HOLATGA QAYTARISH
        resetStartButton();
        timerDisplay.innerText = "10:00";
        progressBar.style.width = "0%";
        pendingDisplay.innerText = "0.00000";
        
        tg.showAlert(`Muvaffaqiyatli! Balans: ${newTotal.toFixed(6)} TON`);
    } catch (e) {
        tg.showAlert("Xatolik yuz berdi, qayta uruning.");
        actionBtn.disabled = false;
    }
}