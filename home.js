import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";

// Yangi Firebase konfiguratsiyasi
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

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

// Telegram WebApp sozlamalari
const tg = window.Telegram.WebApp;
tg.expand();

// UI elementlari
const actionBtn = document.getElementById('action-btn');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const balanceDisplay = document.getElementById('total-balance');
const userNameDisplay = document.getElementById('user-name');

// Foydalanuvchi ma'lumotlari
const user = tg.initDataUnsafe?.user || { id: "test_user", first_name: "User" };
const userId = user.id.toString();
userNameDisplay.innerText = user.first_name;

let totalBalance = 0;
let miningDuration = 600; // 10 minut = 600 soniya
let timerInterval = null;
const miningReward = 0.00005;

const userRef = ref(db, 'users/' + userId);

// 1. Firebase-dan ma'lumotlarni yuklash va real vaqtda kuzatish
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        totalBalance = data.balance || 0;
        balanceDisplay.innerText = totalBalance.toFixed(6);
        
        // Agar foydalanuvchida mining jarayoni ketayotgan bo'lsa
        if (data.miningStartedAt && !timerInterval) {
            checkAndResumeMining(data.miningStartedAt);
        }
    } else {
        // Yangi foydalanuvchini bazada yaratish
        set(userRef, {
            name: user.first_name,
            balance: 0,
            miningStartedAt: null
        });
    }
});

// 2. Mining holatini tekshirish
function checkAndResumeMining(startTime) {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);

    if (elapsedSeconds >= miningDuration) {
        stopMiningUI();
    } else {
        startUIThread(startTime);
    }
}

// 3. Tugmani bosish (Start yoki Claim)
actionBtn.addEventListener('click', async () => {
    if (actionBtn.classList.contains('claim-mode')) {
        await claimTon();
    } else {
        const startTime = Date.now();
        try {
            // Mining boshlangan vaqtni bazaga saqlash
            await update(userRef, { miningStartedAt: startTime });
            startUIThread(startTime);
        } catch (e) {
            tg.showAlert("Firebase xatosi: " + e.message);
        }
    }
});

// 4. Taymer va UI yangilanishi
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

// 5. Mining tugagan holat
function stopMiningUI() {
    clearInterval(timerInterval);
    timerInterval = null;
    actionBtn.disabled = false;
    actionBtn.innerText = "CLAIM TON";
    actionBtn.classList.add('claim-mode');
    timerDisplay.innerText = "00:00";
    progressBar.style.width = "100%";
    pendingDisplay.innerText = miningReward.toFixed(5);
    if(document.getElementById('mining-status')) {
        document.getElementById('mining-status').innerText = "Mining yakunlandi!";
    }
}

// 6. Balansni saqlash
async function claimTon() {
    actionBtn.disabled = true;
    const newBalance = totalBalance + miningReward;
    
    try {
        await update(userRef, {
            balance: newBalance,
            miningStartedAt: null // Mining holatini o'chirish
        });
        
        // UI-ni tozalash
        actionBtn.classList.remove('claim-mode');
        actionBtn.innerText = "START MINING";
        timerDisplay.innerText = "10:00";
        progressBar.style.width = "0%";
        pendingDisplay.innerText = "0.00000";
        if(document.getElementById('mining-status')) {
            document.getElementById('mining-status').innerText = "Ready to mine";
        }
        
        tg.showAlert(`Tabriklaymiz! ${miningReward} TON balansingizga qo'shildi.`);
    } catch (e) {
        tg.showAlert("Xatolik: " + e.message);
        actionBtn.disabled = false;
    }
}
