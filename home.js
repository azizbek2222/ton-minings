// Firebase modullarini import qilish
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Sizning yangi konfiguratsiyangiz
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

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Telegram WebApp sozlamalari
const tg = window.Telegram.WebApp;
tg.expand();

// Telegram foydalanuvchi ma'lumotlarini olish
const user = tg.initDataUnsafe?.user || { id: "test_user", first_name: "Mehmon" };
const userId = user.id;
document.getElementById('user-name').innerText = user.first_name;

// O'zgaruvchilar
let totalBalance = 0;
let miningTime = 600; // 10 minut = 600 soniya
let timeLeft = miningTime;
let timerInterval;

const actionBtn = document.getElementById('action-btn');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const balanceDisplay = document.getElementById('total-balance');

// Firebase'dan foydalanuvchi balansini olish (Telegram ID bo'yicha)
const userRef = ref(db, 'users/' + userId);
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        totalBalance = data.balance || 0;
        balanceDisplay.innerText = totalBalance.toFixed(6);
    } else {
        // Yangi foydalanuvchi bo'lsa bazaga qo'shish
        set(userRef, {
            name: user.first_name,
            balance: 0,
            id: userId
        });
    }
});

// Tugma bosilganda ishlash tartibi
actionBtn.addEventListener('click', () => {
    if (actionBtn.classList.contains('claim-mode')) {
        claimTon();
    } else {
        startMining();
    }
});

function startMining() {
    actionBtn.disabled = true;
    actionBtn.innerText = "MINING QILINMOQDA...";
    document.getElementById('mining-status').innerText = "TON yig'ilmoqda...";
    
    timeLeft = miningTime;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateMiningUI();
        
        if (timeLeft <= 0) {
            stopMining();
        }
    }, 1000);
}

function updateMiningUI() {
    // Vaqtni MM:SS ko'rinishiga keltirish
    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;
    timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    
    // Progress bar foizini hisoblash
    let progress = ((miningTime - timeLeft) / miningTime) * 100;
    progressBar.style.width = progress + "%";
    
    // 10 minutda 0.00005 TON yig'ilishini ko'rsatib turish
    let earnedSoFar = ((miningTime - timeLeft) / miningTime) * 0.00005;
    pendingDisplay.innerText = earnedSoFar.toFixed(6);
}

function stopMining() {
    clearInterval(timerInterval);
    actionBtn.disabled = false;
    actionBtn.innerText = "DAROMADNI OLISH (CLAIM)";
    actionBtn.classList.add('claim-mode');
    document.getElementById('mining-status').innerText = "Mining yakunlandi!";
    pendingDisplay.innerText = "0.00005";
}

function claimTon() {
    // Yangi balansni hisoblash
    const newBalance = totalBalance + 0.00005;
    
    // Firebase'da yangilash (Telegram ID ostidagi balance o'zgaradi)
    update(userRef, {
        balance: newBalance
    }).then(() => {
        // Interfeysni dastlabki holatga qaytarish
        actionBtn.classList.remove('claim-mode');
        actionBtn.innerText = "MININGNI BOSHLASH";
        timerDisplay.innerText = "10:00";
        progressBar.style.width = "0%";
        pendingDisplay.innerText = "0.00000";
        document.getElementById('mining-status').innerText = "Mining boshlashga tayyor";
        
        tg.showAlert("Tabriklaymiz! 0.00005 TON balansingizga qo'shildi.");
    }).catch((error) => {
        console.error("Xatolik yuz berdi:", error);
        tg.showAlert("Xatolik yuz berdi, qaytadan urunib ko'ring.");
    });
}
