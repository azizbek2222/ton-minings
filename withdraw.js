import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, push, set, update, query, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const user = tg.initDataUnsafe?.user || { id: "test_user", first_name: "Foydalanuvchi" };
const userId = user.id.toString();
const userRef = ref(db, 'users/' + userId);

let currentBalance = 0;

onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        currentBalance = data.balance || 0;
        document.getElementById('user-balance').innerText = currentBalance.toFixed(6);
    }
});

// Tarixni yuklash (Oxirgi 10 ta)
const historyRef = query(ref(db, `user_history/${userId}`), limitToLast(10));
onValue(historyRef, (snapshot) => {
    const list = document.getElementById('history-list');
    list.innerHTML = "";
    snapshot.forEach((child) => {
        const item = child.val();
        const statusClass = `status-${item.status}`;
        list.innerHTML = `
            <div class="history-item">
                <div class="hist-info">
                    <span class="hist-amount">${item.amount} TON</span>
                    <small>${item.email}</small>
                </div>
                <span class="status-badge ${statusClass}">${item.status.toUpperCase()}</span>
            </div>
        ` + list.innerHTML;
    });
});

document.getElementById('withdraw-submit-btn').onclick = async () => {
    const email = document.getElementById('faucetpay-email').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);

    if (!email.includes('@')) {
        tg.showAlert("Invalid Gmail entered!");
        return;
    }
    if (amount < 0.001) {
        tg.showAlert("Minimum withdrawal 0.001 TON!");
        return;
    }
    if (amount > currentBalance) {
        tg.showAlert("There are not enough funds in the balance.!");
        return;
    }

    const requestsRef = ref(db, 'withdraw_requests');
    const newReqRef = push(requestsRef);
    const reqId = newReqRef.key;

    const requestData = {
        reqId,
        userId,
        userName: user.first_name,
        email,
        amount,
        status: "expected",
        timestamp: Date.now()
    };

    try {
        // 1. Balansni ayirish
        await update(userRef, { balance: currentBalance - amount });
        // 2. Admin paneli uchun so'rov
        await set(newReqRef, requestData);
        // 3. Foydalanuvchi tarixi
        await set(ref(db, `user_history/${userId}/${reqId}`), requestData);
        
        tg.showAlert("Request sent! Pending status.");
        document.getElementById('withdraw-amount').value = "";
    } catch (e) {
        tg.showAlert("An error occurred.!");
    }
};