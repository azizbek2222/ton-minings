import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const currentUserId = tg.initDataUnsafe?.user?.id?.toString() || "test_user";
const topListDiv = document.getElementById('top-list');
const myRankDiv = document.getElementById('my-rank');

// 50 ta eng boy foydalanuvchini balans bo'yicha olish
const usersRef = query(ref(db, 'users'), orderByChild('balance'), limitToLast(50));

onValue(usersRef, (snapshot) => {
    let users = [];
    snapshot.forEach((child) => {
        users.push({ id: child.key, ...child.val() });
    });

    // Firebase limitToLast kichikdan kattaga beradi, biz uni teskari qilamiz
    users.reverse();

    renderTopList(users);
});

function renderTopList(users) {
    topListDiv.innerHTML = "";
    let myRank = "50+";

    users.forEach((user, index) => {
        const rank = index + 1;
        if (user.id === currentUserId) myRank = rank;

        const row = document.createElement('div');
        row.className = `user-row rank-${rank}`;
        if (user.id === currentUserId) row.style.border = "1px solid #007aff";

        row.innerHTML = `
            <div class="rank-number">${rank}</div>
            <div class="user-info">
                <span class="name">${user.name || "Anonim"}</span>
                <span class="stat">Mininglar: ${user.totalMinings || 0}</span>
            </div>
            <div class="user-balance">${parseFloat(user.balance || 0).toFixed(4)} TON</div>
        `;
        topListDiv.appendChild(row);
    });

    myRankDiv.innerHTML = `Sizning o'rningiz: #${myRank}`;
}
