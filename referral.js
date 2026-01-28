import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Firebase konfiguratsiyasi
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

// Foydalanuvchi ma'lumotlari
const user = tg.initDataUnsafe?.user || { id: "test_user" };
const userId = user.id.toString();

// 1. Shaxsiy referal linkni yaratish
// MUHIM: Telegram Mini App linklarida 'startapp' parametri ishlatiladi
const botUsername = "Ton_miningsbot"; 
const appName = "mining"; // t.me/bot_username/app_name dagi app_name qismi
const refLink = `https://t.me/${botUsername}/${appName}?startapp=${userId}`;
document.getElementById('referral-link').value = refLink;

// 2. Statistika ma'lumotlarini yuklash
const userRef = ref(db, 'users/' + userId);
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const count = data.referralsCount || 0;
        document.getElementById('friends-count').innerText = count;
        // Jami daromad (0.0001 dan hisoblaganda)
        document.getElementById('ref-earnings').innerText = (count * 0.0001).toFixed(4);
    }
});

// 3. Havolani nusxalash
document.getElementById('copy-btn').onclick = () => {
    const linkInput = document.getElementById('referral-link');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // Mobil qurilmalar uchun
    
    try {
        navigator.clipboard.writeText(linkInput.value);
        tg.showAlert("Havola nusxalandi!");
    } catch (err) {
        // Fallback (agar clipboard ishlamasa)
        document.execCommand('copy');
        tg.showAlert("Havola nusxalandi!");
    }
};

// 4. Do'stlarga ulashish (Telegram orqali)
document.getElementById('share-btn').onclick = () => {
    const text = "🚀 Earn real money with TON Mining bot! Here is my referral link:";
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`;
    tg.openTelegramLink(shareUrl);
};