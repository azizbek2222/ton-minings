import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 1. Firebase Konfiguratsiyasi
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

// 2. Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let user = tg.initDataUnsafe?.user || { id: "test_user", first_name: "User" };
let userId = user.id.toString();
const userRef = ref(db, 'users/' + userId);

// 3. UI Elementlari
const userNameDisplay = document.getElementById('user-name');
const totalBalanceDisplay = document.getElementById('total-balance');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const miningStatus = document.getElementById('mining-status');
const actionBtn = document.getElementById('action-btn');

// 4. Mining Sozlamalari (Tuzatildi: 10 minutda 0.00005 TON)
const miningDuration = 600; // 10 minut
const miningReward = 0.00005; // Siz aytgan miqdor
let timerInterval = null;
let totalBalance = 0;

// Adsgram
const AdController = window.Adsgram.init({ blockId: "int-21900" }); 

// 5. Firebase'dan ma'lumotlarni yuklash
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        totalBalance = data.balance || 0;
        totalBalanceDisplay.innerText = totalBalance.toFixed(6);
        userNameDisplay.innerText = data.name || user.first_name;

        if (data.miningStartedAt) {
            checkMiningStatus(data.miningStartedAt);
        } else {
            resetStartButton();
        }
    } else {
        set(userRef, {
            name: user.first_name,
            balance: 0,
            miningStartedAt: null
        });
    }
});

function checkMiningStatus(startTime) {
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    const remaining = miningDuration - elapsed;

    if (remaining > 0) {
        startTimer(remaining);
        miningStatus.innerText = "Mining jarayonda..."; // Siz aytgan yozuv
        actionBtn.disabled = true;
    } else {
        stopMiningUI();
    }
}

function resetStartButton() {
    actionBtn.disabled = false;
    actionBtn.innerText = "MININGNI BOSHLASH";
    actionBtn.classList.remove('claim-mode');
    miningStatus.innerText = "Mining boshlashga tayyor";
    timerDisplay.innerText = "10:00";
    progressBar.style.width = "0%";
    pendingDisplay.innerText = "0.00000";
}

actionBtn.onclick = async () => {
    if (actionBtn.classList.contains('claim-mode')) {
        claimTon();
    } else {
        showAdAndStartMining();
    }
};

async function showAdAndStartMining() {
    actionBtn.disabled = true;
    actionBtn.innerText = "REKLAMA YUKLANMOQDA...";

    try {
        const result = await AdController.show();
        if (result && result.done) {
            startMiningInDB();
        } else {
            tg.showAlert("Mining boshlash uchun reklamani oxirigacha ko'ring!");
            resetStartButton();
        }
    } catch (error) {
        tg.showAlert("Reklama yuklanmadi. Qayta urinib ko'ring.");
        resetStartButton();
    }
}

async function startMiningInDB() {
    try {
        await update(userRef, {
            miningStartedAt: Date.now()
        });
        miningStatus.innerText = "Mining jarayonda...";
    } catch (e) {
        tg.showAlert("Xatolik: " + e.message);
        resetStartButton();
    }
}

function startTimer(duration) {
    if (timerInterval) clearInterval(timerInterval);
    let remaining = duration;
    updateUI(remaining);

    timerInterval = setInterval(() => {
        remaining--;
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
    
    let progress = ((miningDuration - remaining) / miningDuration) * 100;
    progressBar.style.width = progress + "%";
    
    // Vizual ravishda o'sib borishini ko'rsatish
    let pending = ((miningDuration - remaining) / miningDuration) * miningReward;
    pendingDisplay.innerText = pending.toFixed(6);
}

function stopMiningUI() {
    clearInterval(timerInterval);
    timerInterval = null;
    actionBtn.disabled = false;
    actionBtn.innerText = "CLAIM TON";
    actionBtn.classList.add('claim-mode');
    miningStatus.innerText = "Mining yakunlandi!";
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
        resetStartButton();
        tg.showAlert(`Muvaffaqiyatli! ${miningReward} TON qo'shildi.`);
    } catch (e) {
        tg.showAlert("Xatolik: " + e.message);
        actionBtn.disabled = false;
    }
}