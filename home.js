import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Konfiguratsiya o'zgarishsiz qoladi
const firebaseConfig = {
    apiKey: "AIzaSyDIeG8dVbm0Yk7FR1hPzrBoD7rgDKWAFoY",
    authDomain: "user1111-c84a0.firebaseapp.com",
    databaseURL: "https://user1111-c84a0-default-rtdb.firebaseio.com",
    projectId: "user1111-c84a0",
    storageBucket: "user1111-c84a0.firebasestorage.app",
    messagingSenderId: "901723757936",
    appId: "1:901723757936:web:ecab5c1a12b73f790c03b5",
    measurementId: "G-VYJLRSC6MB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const tg = window.Telegram.WebApp;
tg.expand();

// Elementlar ID-lari HTML-dagi bilan bir xil ekanligiga ishonch hosil qiling
const actionBtn = document.getElementById('action-btn');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const balanceDisplay = document.getElementById('total-balance');
const userNameDisplay = document.getElementById('user-name');

const user = tg.initDataUnsafe?.user || { id: 12345, first_name: "User" };
const userId = user.id.toString();
userNameDisplay.innerText = user.first_name;

let totalBalance = 0;
let miningDuration = 600; // 10 daqiqa
let timerInterval;
const miningReward = 0.00005;

const userRef = ref(db, 'users/' + userId);

// Birinchi marta ma'lumotlarni yuklash
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        totalBalance = data.balance || 0;
        balanceDisplay.innerText = totalBalance.toFixed(6);
        
        // Mining holatini faqat bir marta tekshiramiz
        if (data.miningStartedAt && !timerInterval) {
            resumeMining(data.miningStartedAt);
        }
    } else {
        set(userRef, { name: user.first_name, balance: 0, miningStartedAt: null });
    }
}, { onlyOnce: false });

// Miningni boshlash tugmasi
actionBtn.addEventListener('click', async () => {
    if (actionBtn.classList.contains('claim-mode')) {
        await claimTon();
    } else {
        const startTime = Date.now();
        // Avval bazaga yozamiz, keyin UI-ni boshlaymiz
        try {
            await update(userRef, { miningStartedAt: startTime });
            startUIThread(startTime);
        } catch (e) {
            tg.showAlert("Firebase ulanishda xato: " + e.message);
        }
    }
});

function resumeMining(startTime) {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);

    if (elapsedSeconds >= miningDuration) {
        stopMiningUI();
    } else {
        startUIThread(startTime);
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
    timerInterval = null; // Taymerni butkul to'xtatish
    actionBtn.disabled = false;
    actionBtn.innerText = "CLAIM TON";
    actionBtn.classList.add('claim-mode');
    timerDisplay.innerText = "00:00";
    progressBar.style.width = "100%";
    pendingDisplay.innerText = miningReward.toFixed(5);
    if(document.getElementById('mining-status')) {
        document.getElementById('mining-status').innerText = "Finished!";
    }
}

async function claimTon() {
    actionBtn.disabled = true;
    const newBalance = totalBalance + miningReward;
    
    try {
        await update(userRef, {
            balance: newBalance,
            miningStartedAt: null
        });
        
        // UI-ni reset qilish
        actionBtn.classList.remove('claim-mode');
        actionBtn.innerText = "START MINING";
        timerDisplay.innerText = "10:00";
        progressBar.style.width = "0%";
        pendingDisplay.innerText = "0.00000";
        tg.showAlert(`Muvaffaqiyatli yig'ildi: ${miningReward} TON!`);
    } catch (e) {
        tg.showAlert("Xatolik: " + e.message);
        actionBtn.disabled = false;
    }
}
