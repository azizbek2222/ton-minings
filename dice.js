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
const diceDisplay = document.getElementById('dice-result');

onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        currentBalance = data.balance || 0;
        document.getElementById('user-balance').innerText = currentBalance.toFixed(6);
    }
});

// Koeffitsient va yutuqni hisoblash
function calculatePayout() {
    const chance = parseInt(document.getElementById('chance-range').value);
    const bet = parseFloat(document.getElementById('bet-amount').value) || 0;
    const multiplier = 99 / chance; // 1% uy haqqi bilan
    const payout = bet * multiplier;
    document.getElementById('payout-val').innerText = payout.toFixed(6);
    document.getElementById('chance-val').innerText = chance;
}

document.getElementById('chance-range').oninput = calculatePayout;
document.getElementById('bet-amount').oninput = calculatePayout;

rollBtn.onclick = async () => {
    const bet = parseFloat(document.getElementById('bet-amount').value);
    const chance = parseInt(document.getElementById('chance-range').value);
    
    if (bet <= 0 || bet > currentBalance) {
        tg.showAlert("Balans yetarli emas yoki noto'g'ri miqdor!");
        return;
    }

    rollBtn.disabled = true;
    diceDisplay.classList.remove('win', 'lose');
    diceDisplay.innerText = "??";

    setTimeout(async () => {
        const result = Math.floor(Math.random() * 100);
        diceDisplay.innerText = result;

        let newBalance = currentBalance - bet;
        let isWin = false;

        if (result < chance) {
            const multiplier = 99 / chance;
            const winAmount = bet * multiplier;
            newBalance += winAmount;
            isWin = true;
            diceDisplay.classList.add('win');
        } else {
            diceDisplay.classList.add('lose');
        }

        await update(userRef, { balance: newBalance });
        addHistory(bet, isWin, result);
        rollBtn.disabled = false;
    }, 800);
};

function addHistory(bet, win, num) {
    const hist = document.getElementById('dice-history');
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
        <span>Ball: ${num}</span>
        <span>Tikish: ${bet}</span>
        <span class="${win ? 'win-text' : 'lose-text'}">${win ? 'YUTUQ' : 'BOY BERILDI'}</span>
    `;
    hist.prepend(div);
}
