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

const user = tg.initDataUnsafe?.user || { id: "test_user" };
const userId = user.id.toString();
const userRef = ref(db, 'users/' + userId);

let currentBalance = 0;
const rollBtn = document.getElementById('roll-btn');
const cube = document.getElementById('cube');

// ADSGRAM BLOCK ID LAR RO'YXATI
const blockIds = ["int-21833", "int-21892", "int-21893"]; // O'zingizning boshqa ID laringizni shu yerga qo'shing

onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        currentBalance = data.balance || 0;
        document.getElementById('user-balance').innerText = currentBalance.toFixed(6);
    }
});

rollBtn.onclick = async () => {
    // Har safar tasodifiy ID tanlash
    const randomId = blockIds[Math.floor(Math.random() * blockIds.length)];
    const AdController = window.Adsgram ? window.Adsgram.init({ blockId: randomId }) : null;

    if (!AdController) {
        tg.showAlert("Tizim yuklanmoqda, kuting...");
        return;
    }

    try {
        rollBtn.disabled = true;
        rollBtn.innerText = "KUTING..."; 
        
        const result = await AdController.show();
        
        if (result.done) {
            rollDice();
        } else {
            tg.showAlert("Mukofot olish uchun reklamani oxirigacha ko'ring!");
            resetBtn();
        }
    } catch (e) {
        console.error("Ad Error:", e);
        tg.showAlert("Hozircha reklama mavjud emas, qayta urunib ko'ring.");
        resetBtn();
    }
};

function rollDice() {
    rollBtn.innerText = "AYLANMOQDA...";
    const side = Math.floor(Math.random() * 6) + 1;
    
    // Haqiqiy 3D effekt uchun ko'p marta aylantirish
    const xRotation = (Math.floor(Math.random() * 5) + 5) * 360; 
    const yRotation = (Math.floor(Math.random() * 5) + 5) * 360; 

    const angles = {
        1: {x: xRotation, y: yRotation},
        2: {x: xRotation, y: yRotation - 90},
        3: {x: xRotation, y: yRotation - 180},
        4: {x: xRotation, y: yRotation + 90},
        5: {x: xRotation - 90, y: yRotation},
        6: {x: xRotation + 90, y: yRotation}
    };

    cube.style.transform = `rotateX(${angles[side].x}deg) rotateY(${angles[side].y}deg)`;

    setTimeout(async () => {
        // MATEMATIK TUZATISH: Zar ochkosiga mos pul qo'shiladi
        const winAmount = side * 0.00001; 
        const newBalance = currentBalance + winAmount;
        
        try {
            await update(userRef, { balance: newBalance });
            addHistory(side, winAmount);
            tg.showAlert(`Tabriklaymiz! ${side} tushdi. +${winAmount.toFixed(5)} TON!`);
        } catch (error) {
            console.log("DB error");
        }
        resetBtn();
    }, 2500); 
}

function resetBtn() {
    rollBtn.disabled = false;
    rollBtn.innerText = "ZAR TASHLASH";
}

function addHistory(side, amount) {
    const hist = document.getElementById('dice-history');
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<span>Zar: ${side}</span><span class="win-amt">+${amount.toFixed(5)} TON</span>`;
    hist.prepend(div);
}
