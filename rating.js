import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, query, limitToLast, orderByKey } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// 1. Jami foydalanuvchilar sonini hisoblash
onValue(ref(db, 'users'), (snapshot) => {
    const count = snapshot.size;
    document.getElementById('total-users').innerText = count.toLocaleString();
});

// 2. Jami to'langan TON miqdorini va oxirgi to'lovlarni yuklash
const requestsRef = query(ref(db, 'withdraw_requests'), limitToLast(20));

onValue(requestsRef, (snapshot) => {
    let totalPaid = 0;
    const payoutsList = document.getElementById('payouts-list');
    payoutsList.innerHTML = "";
    
    let recentPayouts = [];

    snapshot.forEach((child) => {
        const req = child.val();
        if (req.status === "tasdiqlandi") {
            totalPaid += parseFloat(req.amount);
            recentPayouts.push(req);
        }
    });

    document.getElementById('total-withdrawn').innerText = totalPaid.toFixed(4);

    // Oxirgi 5 ta tasdiqlangan to'lovni ko'rsatish
    recentPayouts.reverse().slice(0, 5).forEach(pay => {
        const div = document.createElement('div');
        div.className = "payout-item";
        // Ismni yashirish (Ali*** kabi)
        const maskedName = pay.userName.substring(0, 3) + "***";
        div.innerHTML = `
            <span class="payout-user">👤 ${maskedName}</span>
            <span class="payout-amount">+${pay.amount} TON</span>
        `;
        payoutsList.appendChild(div);
    });

    if (recentPayouts.length === 0) {
        payoutsList.innerHTML = "<div style='text-align:center;color:#555;'>Hozircha to'lovlar yo'q</div>";
    }
});
