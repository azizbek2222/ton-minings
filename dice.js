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

const AdController = window.Adsgram ? window.Adsgram.init({ blockId: "int-21833" }) : null;

onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        currentBalance = data.balance || 0;
        document.getElementById('user-balance').innerText = currentBalance.toFixed(6);
    }
});

rollBtn.onclick = async () => {
    if (!AdController) {
        tg.showAlert("Tizim yuklanmoqda, kuting...");
        return;
    }

    try {
        rollBtn.disabled = true;
        rollBtn.innerText = "KUTING..."; 
        
        const result = await AdController.show();
        
        if (result.done) {
            // FAQAT REKLAMA TUGASA AYLANADI
            rollDice();
        } else {
            // REKLAMA YOPILSA AYLANMAYDI
            tg.showAlert("Jarayon oxirigacha kutilishi shart!");
            resetBtn();
        }
    } catch (e) {
        // XATOLIK BO'LSA ZAR AYLANMAYDI
        console.error("Ad Error:", e);
        tg.showAlert("Hozircha imkoniyat yo'q, qayta urunib ko'ring.");
        resetBtn();
    }
};

function rollDice() {
    rollBtn.innerText = "AYLANMOQDA...";
    const side = Math.floor(Math.random() * 6) + 1;
    
    const angles = {
        1: {x: 0, y: 0},
        2: {x: 0, y: -90},
        3: {x: 0, y: -180},
        4: {x: 0, y: 90},
        5: {x: -90, y: 0},
        6: {x: 90, y: 0}
    };

    cube.style.transform = `rotateX(${angles[side].x + 720}deg) rotateY(${angles[side].y + 720}deg)`;

    setTimeout(async () => {
        const winAmount = side * 0.00001;
        const newBalance = currentBalance + winAmount;
        
        try {
            await update(userRef, { balance: newBalance });
            addHistory(side, winAmount);
            tg.showAlert(`Tabriklaymiz! +${winAmount.toFixed(5)} TON!`);
        } catch (error) {
            console.log("DB update error");
        }
        resetBtn();
    }, 1500);
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
