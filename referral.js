import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const user = tg.initDataUnsafe?.user || { id: "123456" };
const userId = user.id.toString();

// 1. Shaxsiy referal linkni yaratish
// BOT_USERNAME o'rniga o'z botingiz userneymini yozing
const botUsername = "Ton_miningsbot/mining"; 
const refLink = `https://t.me/${botUsername}?start=${userId}`;
document.getElementById('referral-link').value = refLink;

// 2. Statistika ma'lumotlarini yuklash
const userRef = ref(db, 'users/' + userId);
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const count = data.referralsCount || 0;
        document.getElementById('friends-count').innerText = count;
        document.getElementById('ref-earnings').innerText = (count * 0.0001).toFixed(4);
    }
});

// 3. Havolani nusxalash
document.getElementById('copy-btn').onclick = () => {
    const linkInput = document.getElementById('referral-link');
    linkInput.select();
    document.execCommand('copy');
    tg.showAlert("Havola nusxalandi!");
};

// 4. Do'stlarga ulashish (Telegram Share)
document.getElementById('share-btn').onclick = () => {
    const text = "🚀 Ushbu botda TON mining qiling va real pul ishlang! Mana mening taklif havolam:";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
    tg.openTelegramLink(shareUrl);
};