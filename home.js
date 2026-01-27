import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const user = tg.initDataUnsafe?.user || { id: "test_user", first_name: "Mehmon" };
const userId = user.id.toString(); // ID har doim string bo'lishi yaxshi
document.getElementById('user-name').innerText = user.first_name;

let totalBalance = 0;
let miningDuration = 600; // 10 minut (soniyalarda)
let timerInterval;
const miningReward = 0.00005;

const actionBtn = document.getElementById('action-btn');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const balanceDisplay = document.getElementById('total-balance');

const userRef = ref(db, 'users/' + userId);

// 1. Foydalanuvchi ma'lumotlarini real vaqtda kuzatish
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        totalBalance = data.balance || 0;
        balanceDisplay.innerText = totalBalance.toFixed(6);
        
        // Agar mining jarayoni bazada bo'lsa, uni tiklash
        if (data.miningStartedAt) {
            resumeMining(data.miningStartedAt);
        }
    } else {
        // Yangi foydalanuvchi yaratish
        set(userRef, {
            name: user.first_name,
            balance: 0,
            miningStartedAt: null
        });
    }
}, { onlyOnce: false });

// 2. Miningni boshlash
actionBtn.addEventListener('click', () => {
    if (actionBtn.classList.contains('claim-mode')) {
        claimTon();
    } else {
        const startTime = Date.now();
        // Bazaga mining boshlangan vaqtni yozamiz
        update(userRef, { miningStartedAt: startTime })
        .then(() => startUIThread(startTime));
    }
});

// 3. Mining jarayonini davom ettirish (Qayta kirganda)
function resumeMining(startTime) {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);

    if (elapsedSeconds >= miningDuration) {
        // Mining tugab bo'lgan
        stopMiningUI();
    } else {
        // Mining hali davom etmoqda
        startUIThread(startTime);
    }
}

// 4. Ekranda taymerni aylantirish
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
    actionBtn.disabled = false;
    actionBtn.innerText = "CLAIM TON";
    actionBtn.classList.add('claim-mode');
    timerDisplay.innerText = "00:00";
    progressBar.style.width = "100%";
    pendingDisplay.innerText = miningReward.toFixed(5);
    document.getElementById('mining-status').innerText = "Finished!";
}

// 5. Balansni saqlash va jarayonni yakunlash
async function claimTon() {
    actionBtn.disabled = true; // Dublikat bosishni oldini olish
    
    const newBalance = totalBalance + miningReward;
    
    try {
        await update(userRef, {
            balance: newBalance,
            miningStartedAt: null // Miningni o'chirish
        });
        
        // UI-ni tozalash
        actionBtn.classList.remove('claim-mode');
        actionBtn.innerText = "START MINING";
        timerDisplay.innerText = "10:00";
        progressBar.style.width = "0%";
        pendingDisplay.innerText = "0.00000";
        document.getElementById('mining-status').innerText = "Ready to mine";
        
        tg.showAlert(`Successfully claimed ${miningReward} TON!`);
    } catch (e) {
        tg.showAlert("Error: " + e.message);
    } finally {
        actionBtn.disabled = false;
    }
}
