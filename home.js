import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7VLHdjPqf_tobSiBczGbN8H7YlFwq9Wg",
  authDomain: "magnetic-alloy-467611-u7.firebaseapp.com",
  databaseURL: "https://magnetic-alloy-467611-u7-default-rtdb.firebaseio.com",
  projectId: "magnetic-alloy-467611-u7",
  storageBucket: "magnetic-alloy-467611-u7.firebasestorage.app",
  messagingSenderId: "589500919880",
  appId: "1:589500919880:web:d7963d4b558ac49351687d",
  measurementId: "G-TD6W87M30Z"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

const tg = window.Telegram.WebApp;
tg.expand();

// AdsGram Controllerni sozlash (O'z block ID-ingizni qo'ying)
const AdController = window.Adsgram.init({ blockId: "int-21833" });

const actionBtn = document.getElementById('action-btn');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const balanceDisplay = document.getElementById('total-balance');
const userNameDisplay = document.getElementById('user-name');

const user = tg.initDataUnsafe?.user || { id: "test_user", first_name: "User" };
const userId = user.id.toString();
userNameDisplay.innerText = user.first_name;

let totalBalance = 0;
let miningDuration = 600; 
let timerInterval = null;
const miningReward = 0.00005;

const userRef = ref(db, 'users/' + userId);

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

// Tugma bosilganda
actionBtn.addEventListener('click', async () => {
    if (actionBtn.classList.contains('claim-mode')) {
        await claimTon();
    } else {
        // Reklama ko'rsatish
        showAdAndStartMining();
    }
});

// Reklama funksiyasi
async function showAdAndStartMining() {
    try {
        actionBtn.disabled = true;
        actionBtn.innerText = "REKLAMA YUKLANMOQDA...";
        
        const result = await AdController.show();
        
        if (result.done) {
            // Reklama to'liq ko'rildi, miningni boshlash
            const startTime = Date.now();
            await update(userRef, { miningStartedAt: startTime });
            startUIThread(startTime);
        } else {
            // Reklama yopib qo'yildi
            tg.showAlert("Miningni boshlash uchun reklamani oxirigacha ko'rishingiz kerak!");
            actionBtn.disabled = false;
            actionBtn.innerText = "MININGNI BOSHLASH";
        }
    } catch (e) {
        // Reklama yuklanishda xato yoki bloklangan bo'lsa
        console.error("Ad error:", e);
        tg.showAlert("Reklama yuklanmadi. Iltimos, keyinroq urunib ko'ring.");
        actionBtn.disabled = false;
        actionBtn.innerText = "MININGNI BOSHLASH";
    }
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
    
    let progress = ((miningDuration - remaining) / miningDuration) * 100;
    progressBar.style.width = progress + "%";
    
    let earned = ((miningDuration - remaining) / miningDuration) * miningReward;
    pendingDisplay.innerText = earned.toFixed(6);
}

function stopMiningUI() {
    clearInterval(timerInterval);
    timerInterval = null;
    actionBtn.disabled = false;
    actionBtn.innerText = "CLAIM TON";
    actionBtn.classList.add('claim-mode'); // CSS'da bu class orqali rang va holat o'zgaradi
    timerDisplay.innerText = "00:00";
    progressBar.style.width = "100%";
    pendingDisplay.innerText = miningReward.toFixed(5);
    
    const statusText = document.getElementById('mining-status');
    if (statusText) statusText.innerText = "Mining yakunlandi!";
}

async function claimTon() {
    actionBtn.disabled = true;
    const newBalance = totalBalance + miningReward;
    
    try {
        await update(userRef, {
            balance: newBalance,
            miningStartedAt: null 
        });
        
        // UI RESET - Bu qismni to'g'irladim
        actionBtn.classList.remove('claim-mode');
        actionBtn.innerText = "MININGNI BOSHLASH";
        actionBtn.disabled = false; // Tugmani qayta aktiv qilish
        
        timerDisplay.innerText = "10:00";
        progressBar.style.width = "0%";
        pendingDisplay.innerText = "0.00000";
        
        const statusText = document.getElementById('mining-status');
        if (statusText) statusText.innerText = "Mining boshlashga tayyor";
        
        tg.showAlert(`Tabriklaymiz! ${miningReward} TON balansingizga qo'shildi.`);
    } catch (e) {
        tg.showAlert("Xatolik: " + e.message);
        actionBtn.disabled = false;
    }
}