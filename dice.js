import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// Foydalanuvchini aniqlash
const user = tg.initDataUnsafe?.user || { id: "test_user" };
const userId = user.id.toString();
const userRef = ref(db, 'users/' + userId);

let currentBalance = 0;
const rollBtn = document.getElementById('roll-btn');
const cube = document.getElementById('cube');

// AdsGram Controller
const AdController = window.Adsgram ? window.Adsgram.init({ blockId: "int-21833" }) : null;

// Balansni kuzatish
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        currentBalance = data.balance || 0;
        document.getElementById('user-balance').innerText = currentBalance.toFixed(6);
    }
});

// Tugma bosilganda
rollBtn.onclick = async () => {
    if (!AdController) {
        tg.showAlert("Reklama tizimi yuklanmadi. Internetni tekshiring.");
        return;
    }

    try {
        rollBtn.disabled = true;
        rollBtn.innerText = "REKLAMA YUKLANMOQDA...";
        
        // Reklamani ko'rsatish
        const result = await AdController.show();
        
        if (result.done) {
            // Reklama to'liq ko'rildi, zarni aylantiramiz
            rollDice();
        } else {
            // Reklama yopib qo'yildi
            tg.showAlert("Mukofot olish uchun reklamani oxirigacha ko'ring!");
            resetBtn();
        }
    } catch (e) {
        console.error(e);
        tg.showAlert("Hozircha reklama yo'q, birozdan keyin urunib ko'ring.");
        resetBtn();
    }
};

function rollDice() {
    rollBtn.innerText = "ZAR AYLANMOQDA...";
    
    // 1 dan 6 gacha tasodifiy son
    const side = Math.floor(Math.random() * 6) + 1;
    
    // Zarni aylantirish animatsiyasi uchun burchaklar
    const angles = {
        1: {x: 0, y: 0},
        2: {x: 0, y: -90},
        3: {x: 0, y: -180},
        4: {x: 0, y: 90},
        5: {x: -90, y: 0},
        6: {x: 90, y: 0}
    };

    // Aylanish effekti (qo'shimcha 720 gradus aylanishi uchun)
    cube.style.transform = `rotateX(${angles[side].x + 720}deg) rotateY(${angles[side].y + 720}deg)`;

    // 1.5 soniyadan keyin natijani ko'rsatish
    setTimeout(async () => {
        const winAmount = side * 0.00001;
        const newBalance = currentBalance + winAmount;
        
        // Bazani yangilash
        await update(userRef, { balance: newBalance });
        
        addHistory(side, winAmount);
        tg.showAlert(`Tabriklaymiz! ${side} tushdi. +${winAmount.toFixed(5)} TON qo'shildi!`);
        resetBtn();
    }, 1500);
}

function resetBtn() {
    rollBtn.disabled = false;
    rollBtn.innerText = "REKLAMA VA ZAR TASHLASH";
}

function addHistory(side, amount) {
    const hist = document.getElementById('dice-history');
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
        <span>Zar: ${side}</span>
        <span class="win-amt">+${amount.toFixed(5)} TON</span>
    `;
    hist.prepend(div);
}
