import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 1. Firebase Konfiguratsiyasi
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

// 2. Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let user = tg.initDataUnsafe?.user || { id: "test_user", first_name: "User" };
let userId = user.id.toString();
const userRef = ref(db, 'users/' + userId);

// 3. UI Elementlari
const userNameDisplay = document.getElementById('user-name');
const totalBalanceDisplay = document.getElementById('total-balance');
const timerDisplay = document.getElementById('timer-display');
const progressBar = document.getElementById('progress-bar');
const pendingDisplay = document.getElementById('pending-amount');
const miningStatus = document.getElementById('mining-status');
const actionBtn = document.getElementById('action-btn');

// 4. Mining Sozlamalari (10 minutda 0.00005 TON)
const miningDuration = 600; 
const miningReward = 0.00005; 
let timerInterval = null;
let totalBalance = 0;

// Adsgram
const AdController = window.Adsgram.init({ blockId: "int-21900" }); 

// --- REFERAL TIZIMI LOGIKASI ---
async function handleReferralBonus(currentUserData) {
    // Agar foydalanuvchi allaqachon tekshirilgan bo'lsa, to'xtatamiz
    if (currentUserData && currentUserData.referredByHandled === true) return;

    const startParam = tg.initDataUnsafe?.start_param;

    // Agar start_param mavjud bo'lsa va u foydalanuvchining o'z ID-si bo'lmasa
    if (startParam && startParam !== userId) {
        const referrerRef = ref(db, 'users/' + startParam);
        
        try {
            const referrerSnapshot = await get(referrerRef);
            if (referrerSnapshot.exists()) {
                const referrerData = referrerSnapshot.val();
                
                // Taklif qilgan odamga bonus berish
                await update(referrerRef, {
                    referralsCount: (referrerData.referralsCount || 0) + 1,
                    balance: (referrerData.balance || 0) + 0.0001
                });

                // Yangi foydalanuvchini belgilash
                await update(userRef, {
                    referredByHandled: true,
                    invitedBy: startParam
                });
                console.log("Referral bonus given!");
            }
        } catch (error) {
            console.error("Referral error:", error);
        }
    } else {
        // Parametr bo'lmasa ham bazani yangilab qo'yamiz
        await update(userRef, { referredByHandled: true });
    }
}

// 5. Firebase'dan ma'lumotlarni yuklash
onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        totalBalance = data.balance || 0;
        totalBalanceDisplay.innerText = totalBalance.toFixed(6);
        userNameDisplay.innerText = data.name || user.first_name;

        // Referalni tekshirish
        if (!data.referredByHandled) {
            handleReferralBonus(data);
        }

        if (data.miningStartedAt) {
            checkMiningStatus(data.miningStartedAt);
        } else {
            resetStartButton();
        }
    } else {
        // Yangi foydalanuvchi yaratish
        set(userRef, {
            name: user.first_name,
            balance: 0,
            miningStartedAt: null,
            referralsCount: 0,
            referredByHandled: false // Birinchi kirishda false
        });
    }
});

function checkMiningStatus(startTime) {
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    const remaining = miningDuration - elapsed;

    if (remaining > 0) {
        startTimer(remaining);
        miningStatus.innerText = "Mining in progress...";
        actionBtn.disabled = true;
    } else {
        stopMiningUI();
    }
}

function resetStartButton() {
    actionBtn.disabled = false;
    actionBtn.innerText = "START RIDING";
    actionBtn.classList.remove('claim-mode');
    miningStatus.innerText = "Ready to start mining";
    timerDisplay.innerText = "10:00";
    progressBar.style.width = "0%";
    pendingDisplay.innerText = "0.00000";
}

actionBtn.onclick = async () => {
    if (actionBtn.classList.contains('claim-mode')) {
        claimTon();
    } else {
        showAdAndStartMining();
    }
};

async function showAdAndStartMining() {
    actionBtn.disabled = true;
    actionBtn.innerText = "AT THE BEGINNING OF MAY...";

    try {
        const result = await AdController.show();
        if (result && result.done) {
            startMiningInDB();
        } else {
            tg.showAlert("Watch the ad until the end to start mining!");
            resetStartButton();
        }
    } catch (error) {
        tg.showAlert("The ad failed to load. Please try again.");
        resetStartButton();
    }
}

async function startMiningInDB() {
    try {
        await update(userRef, {
            miningStartedAt: Date.now()
        });
        miningStatus.innerText = "Mining in progress...";
    } catch (e) {
        tg.showAlert("Error: " + e.message);
        resetStartButton();
    }
}

function startTimer(duration) {
    if (timerInterval) clearInterval(timerInterval);
    let remaining = duration;
    updateUI(remaining);

    timerInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            stopMiningUI();
        } else {
            updateUI(remaining);
        }
    }, 1000);
}

function updateUI(remaining) {
    let mins = Math.floor(remaining / 60);
    let secs = remaining % 60;
    timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    
    let progress = ((miningDuration - remaining) / miningDuration) * 100;
    progressBar.style.width = progress + "%";
    
    let pending = ((miningDuration - remaining) / miningDuration) * miningReward;
    pendingDisplay.innerText = pending.toFixed(6);
}

function stopMiningUI() {
    clearInterval(timerInterval);
    timerInterval = null;
    actionBtn.disabled = false;
    actionBtn.innerText = "CLAIM TON";
    actionBtn.classList.add('claim-mode');
    miningStatus.innerText = "Mining completed!";
    timerDisplay.innerText = "00:00";
    progressBar.style.width = "100%";
    pendingDisplay.innerText = miningReward.toFixed(5);
}

async function claimTon() {
    actionBtn.disabled = true;
    try {
        const newTotal = totalBalance + miningReward;
        await update(userRef, {
            balance: newTotal,
            miningStartedAt: null 
        });
        resetStartButton();
        tg.showAlert(`Success! ${miningReward} TON added.`);
    } catch (e) {
        tg.showAlert("Error: " + e.message);
        actionBtn.disabled = false;
    }
}