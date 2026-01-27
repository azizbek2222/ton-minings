const firebaseConfig = {
    apiKey: "AIzaSyBUkCUhNzMGSBc7q23QVOAh0yK0OOl80uM",
    authDomain: "kazino-b83b8.firebaseapp.com",
    databaseURL: "https://kazino-b83b8-default-rtdb.firebaseio.com",
    projectId: "kazino-b83b8",
    storageBucket: "kazino-b83b8.firebasestorage.app",
    messagingSenderId: "46554087265",
    appId: "1:46554087265:web:240e6e2808b62ded448f20"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user || { id: "local_user", first_name: "Admin" };
const userId = user.id;
document.getElementById('user-name').innerText = user.first_name;

let totalBalance = 0;
let isMining = false;
let miningTime = 600; // 10 minut = 600 soniya
let timeLeft = miningTime;
let timerInterval;

const actionBtn = document.getElementById('action-btn');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const balanceDisplay = document.getElementById('total-balance');

// Firebase'dan ma'lumotlarni olish
const userRef = db.ref('users/' + userId);
userRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        totalBalance = data.balance || 0;
        balanceDisplay.innerText = totalBalance.toFixed(6);
    } else {
        userRef.set({ name: user.first_name, balance: 0 });
    }
});

actionBtn.addEventListener('click', () => {
    if (actionBtn.classList.contains('claim-mode')) {
        claimTon();
    } else {
        startMining();
    }
});

function startMining() {
    isMining = true;
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
    // Vaqtni formatlash (MM:SS)
    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;
    timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    
    // Progress bar
    let progress = ((miningTime - timeLeft) / miningTime) * 100;
    progressBar.style.width = progress + "%";
    
    // Yig'ilayotgan TON (10 minutda 0.00005)
    let earnedSoFar = ((miningTime - timeLeft) / miningTime) * 0.00005;
    pendingDisplay.innerText = earnedSoFar.toFixed(6);
}

function stopMining() {
    clearInterval(timerInterval);
    isMining = false;
    actionBtn.disabled = false;
    actionBtn.innerText = "DAROMADNI OLISH (CLAIM)";
    actionBtn.classList.add('claim-mode');
    document.getElementById('mining-status').innerText = "Mining yakunlandi!";
    pendingDisplay.innerText = "0.00005";
}

function claimTon() {
    totalBalance += 0.00005;
    
    // Firebase'da yangilash
    userRef.update({
        balance: totalBalance
    }).then(() => {
        // UI-ni qayta tiklash
        actionBtn.classList.remove('claim-mode');
        actionBtn.innerText = "MININGNI BOSHLASH";
        timerDisplay.innerText = "10:00";
        progressBar.style.width = "0%";
        pendingDisplay.innerText = "0.00000";
        document.getElementById('mining-status').innerText = "Mining boshlashga tayyor";
        
        tg.showAlert("Tabriklaymiz! 0.00005 TON balansingizga qo'shildi.");
    });
}
