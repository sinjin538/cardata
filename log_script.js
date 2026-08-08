import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAC-4qsyKMuGp6o583agoFructJKiX67Oo",
    authDomain: "carpro-97259.firebaseapp.com",
    projectId: "carpro-97259",
    storageBucket: "carpro-97259.firebasestorage.app",
    messagingSenderId: "565637957634",
    appId: "1:565637957634:web:dca9222b84f1d9955e3f1b",
    measurementId: "G-JWL5TQWCB2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_NAME = "박기준";

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); 
let selectedDateStr = "";
let currentUser = "";
let isAdmin = false;
let logsData = {}; 
let memosData = {}; 
let userSettingsData = {}; 
let dispatchData = [];

function stripDriverNumber(name) { return name.replace(/^\d+,\s*/, '').trim(); }

// 💡 2. 가장 먼저 실행됨: 배차판에서 로그인하고 넘어온 건지 확인!
const savedUser = localStorage.getItem("loggedInUser");
if (!savedUser) {
    alert("로그인이 필요합니다. 배차판 메인에서 로그인해주세요.");
    window.location.href = "index.html"; // 몰래 들어오면 대문으로 쫓아냄
} else {
    currentUser = savedUser;
    isAdmin = (currentUser === ADMIN_NAME);
    document.getElementById('welcomeUserName').innerText = `👤 ${currentUser} 님의 운행 기록`;
    if(isAdmin) document.getElementById('adminToggleBtn').classList.remove('hidden');
}

window.addEventListener('popstate', function(event) {
    if (!document.getElementById('logModal').classList.contains('hidden')) {
        document.getElementById('logModal').classList.add('hidden'); document.getElementById('logForm').reset();
    } else if (!document.getElementById('adminView').classList.contains('hidden')) {
        document.getElementById('adminView').classList.add('hidden'); document.getElementById('userView').classList.remove('hidden'); renderCalendar();
    }
});

onSnapshot(doc(db, "DispatchSystem", "MainData"), (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        dispatchData = data.allDispatches || [];
    } else { dispatchData = []; }
});

onSnapshot(collection(db, "drivingLogsMulti"), (snapshot) => {
    logsData = {};
    snapshot.forEach((doc) => { logsData[doc.id] = doc.data(); });
    if (currentUser !== "") {
        if (document.getElementById('adminView') && !document.getElementById('adminView').classList.contains('hidden')) renderAdminTable();
        else renderCalendar();
    }
});

onSnapshot(collection(db, "userSettingsProfile"), (snapshot) => {
    userSettingsData = {};
    snapshot.forEach((doc) => { userSettingsData[doc.id] = doc.data(); });
    if (currentUser !== "") {
        if (document.getElementById('adminView') && document.getElementById('adminView').classList.contains('hidden')) renderCalendar();
    }
});

function formatTime(timeStr) {
    if (!timeStr) return "";
    const val = parseFloat(timeStr);
    if (isNaN(val)) return timeStr;
    const h = Math.floor(val);
    const m = (val - h) * 60;
    return `${h}:${m === 0 ? '00' : m}`;
}

window.toggleAdminMode = function() {
    history.pushState({ page: 'admin' }, null, ''); 
    document.getElementById('userView').classList.add('hidden'); 
    document.getElementById('adminView').classList.remove('hidden'); 
    renderAdminTable();
}
window.toggleUserMode = function() {
    if (!document.getElementById('adminView').classList.contains('hidden')) { history.back(); }
}

window.changeMonth = function(direction) {
    currentMonth += direction;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; } else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    if (!document.getElementById('adminView').classList.contains('hidden')) renderAdminTable(); else renderCalendar();
}

function addDays(dateStr, days) {
    const parts = dateStr.split('-'); const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + days);
    const outY = d.getFullYear(); const outM = String(d.getMonth() + 1).padStart(2, '0'); const outD = String(d.getDate()).padStart(2, '0');
    return `${outY}-${outM}-${outD}`;
}

const holidaysMap = { "01-01": "신정", "03-01": "삼일절", "05-05": "어린이날", "06-06": "현충일", "08-15": "광복절", "10-03": "개천절", "10-09": "한글날", "12-25": "성탄절" };
function getHolidayName(dateStr) {
    if (holidaysMap[dateStr]) return holidaysMap[dateStr];
    const mmdd = dateStr.substring(5); if (holidaysMap[mmdd]) return holidaysMap[mmdd]; return null;
}

function calculateOvertime(startStr, endStr, isHoliday) {
    if (!startStr || !endStr) return { totalPayTime: 0 };
    let startVal = parseFloat(startStr); let endVal = parseFloat(endStr);
    if (isNaN(startVal) || isNaN(endVal)) return { totalPayTime: 0 };

    if (endVal <= startVal) endVal += 24.0; 
    const overlapStart = Math.max(startVal, 9.0); const overlapEnd = Math.min(endVal, 18.0);
    let rawNormalHours = (overlapEnd > overlapStart) ? overlapEnd - overlapStart : 0;
    let restTime = (rawNormalHours >= 4) ? 1.0 : 0;
    let normalHours = Math.max(0, rawNormalHours - restTime); 
    let overtimeHours = Math.max(0, (endVal - startVal) - rawNormalHours);

    if (isHoliday) { return { totalPayTime: ((normalHours * 1.5) + (overtimeHours * 2.0)).toFixed(2) }; } 
    else { return { totalPayTime: (overtimeHours * 1.5).toFixed(2) }; }
}

function calculateAllowance(log) {
    if (log.scheduleType === 'day') return 12500;
    if (log.scheduleType === '1night' || log.scheduleType === '2night') return 37500;
    if (log.scheduleType === 'linked' && (log.parentType === '1night' || log.parentType === '2night')) return 37500;
    return 0;
}

window.openSettingsModal = function() {
    history.pushState({ page: 'settings' }, null, '');
    document.getElementById('settingsModal').classList.remove('hidden');
    const mySettings = userSettingsData[currentUser];
    if (mySettings) { document.getElementById('setBaseDate').value = mySettings.baseDate || ""; document.getElementById('setBasePay').value = mySettings.basePayTime || ""; } 
    else { document.getElementById('setBaseDate').value = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`; }
}
window.closeSettingsModal = function() { if (document.getElementById('settingsModal') && !document.getElementById('settingsModal').classList.contains('hidden')) { history.back(); } }
document.getElementById('settingsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await setDoc(doc(db, "userSettingsProfile", currentUser), { userId: currentUser, baseDate: document.getElementById('setBaseDate').value, basePayTime: document.getElementById('setBasePay').value, updatedAt: new Date() });
    alert("설정 저장됨!"); closeSettingsModal();
});

function updateBalances() {
    if (!userSettingsData[currentUser]) { document.getElementById('topBalPay').innerText = "설정필요"; document.getElementById('topRealPay').innerText = "설정필요"; return; }
    const settings = userSettingsData[currentUser];
    let currentPayTime = parseFloat(settings.basePayTime || 0); let currentMonthTotal = 0; 
    const targetPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    Object.values(logsData).forEach(log => {
        if (log.userId === currentUser) {
            const calc = calculateOvertime(log.startTime, log.endTime, log.isHoliday);
            if (log.date >= settings.baseDate) { currentPayTime += parseFloat(calc.totalPayTime || 0); if (log.usedPayTime) currentPayTime -= parseFloat(log.usedPayTime); }
            if (log.date.startsWith(targetPrefix) && !log.isOff) { currentMonthTotal += parseFloat(calc.totalPayTime || 0); }
        }
    });
    document.getElementById('topBalPay').innerText = currentPayTime.toFixed(2) + "h";
    document.getElementById('topRealPay').innerText = (currentPayTime - currentMonthTotal).toFixed(2) + "h";
}

function renderCalendar() {
    document.getElementById('calendarMonthTitle').textContent = `${currentYear}년 ${currentMonth + 1}월 운행 달력`; 
    const gridEl = document.getElementById('calendarGrid'); gridEl.innerHTML = "";
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) gridEl.innerHTML += `<div class="min-h-[6.5rem] bg-slate-50/50 rounded-xl opacity-40 border border-slate-200"></div>`;

    for (let day = 1; day <= lastDay; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; 
        const log = (logsData[`${currentUser}_${dateKey}`] && !logsData[`${currentUser}_${dateKey}`].isOff) ? logsData[`${currentUser}_${dateKey}`] : null;

        const dayOfWeek = new Date(currentYear, currentMonth, day).getDay(); const holidayName = getHolidayName(dateKey);
        let dateColorClass = (holidayName || dayOfWeek === 0) ? "text-rose-500" : (dayOfWeek === 6 ? "text-blue-500" : "text-slate-700");
        let dateBadgeHTML = holidayName ? `<span class="text-[10px] text-rose-500 ml-1 font-bold tracking-tighter bg-rose-50 px-1.5 py-0.5 rounded-md">(${holidayName})</span>` : '';
        
        let cellBgClass = 'bg-white hover:shadow-md'; let contentHTML = ``;

        if (log) {
            // 휴무일 때의 디자인
            if (log.isLeaveDay) {
                contentHTML = `<div class="flex items-center justify-center flex-1 h-full pb-2"><span class="text-rose-500 font-extrabold text-sm md:text-base bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm animate-pulse">🏝️ 휴무</span></div>`;
            } else {
                let sType = log.scheduleType === 'linked' ? log.parentType : log.scheduleType;
                if (sType === 'day') cellBgClass = 'bg-[radial-gradient(circle,_#bfdbfe_0%,_#eff6ff_100%)]'; 
                else if (sType === '1night') cellBgClass = 'bg-[radial-gradient(circle,_#fde047_0%,_#fefce8_100%)]'; 
                else if (sType === '2night') cellBgClass = 'bg-[radial-gradient(circle,_#fdba74_0%,_#fff7ed_100%)]'; 
                else if (sType === 'seoul') cellBgClass = 'bg-[radial-gradient(circle,_#e2e8f0_0%,_#f8fafc_100%)]'; 

                const calc = calculateOvertime(log.startTime, log.endTime, log.isHoliday); const allowance = calculateAllowance(log);
                let allowanceHTML = allowance > 0 ? `<div class="text-[11px] font-bold text-emerald-600 text-center">${allowance.toLocaleString()}원</div>` : '';
                
                contentHTML = `
                    <div class="flex flex-col gap-0.5 mt-0.5 flex-1">
                        <div class="text-[13px] font-extrabold text-blue-700 text-center">${log.vehicle || ""}</div>
                        <div class="text-[13px] font-bold text-slate-800 text-center">${log.driver1 || ""}</div>
                        <div class="text-[11px] font-bold ${log.isHoliday ? 'text-rose-500' : 'text-amber-600'} text-center">${calc.totalPayTime}h</div>
                        ${allowanceHTML}
                    </div>
                `;
            }
        }

        gridEl.innerHTML += `
            <div onclick="openModal('${dateKey}')" class="h-full min-h-[6.5rem] ${cellBgClass} rounded-xl p-1.5 border border-slate-200 cursor-pointer flex flex-col">
                <div class="flex items-center ml-0.5"><span class="text-sm font-extrabold ${dateColorClass}">${day}</span>${dateBadgeHTML}</div>
                ${contentHTML}
            </div>
        `;
    }
    renderUserTable(); updateBalances();
}

function renderUserTable() {
    const tbody = document.getElementById('userTableBody'); tbody.innerHTML = "";
    const monthLogs = Object.values(logsData).filter(log => log.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`) && log.userId === currentUser).sort((a, b) => a.date.localeCompare(b.date));

    if (monthLogs.length === 0) tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">내역이 없습니다.</td></tr>`;
    else monthLogs.forEach(log => {
        let scheduleTxt = log.isLeaveDay ? "휴무" : (log.scheduleType === '1night' ? '1박' : (log.scheduleType === '2night' ? '2박' : '당일'));
        tbody.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="p-3 text-center font-bold">${log.date.split('-')[2]}일</td><td class="p-3 text-center">${log.vehicle || '-'}</td><td class="p-3 text-center font-bold text-slate-600">${scheduleTxt}</td><td class="p-3 text-center text-xs">${log.startTime ? log.startTime+'~'+log.endTime : '-'}</td><td class="p-3 text-center text-blue-600 font-extrabold">${calculateOvertime(log.startTime, log.endTime, log.isHoliday).totalPayTime}h</td><td class="p-3 text-right text-emerald-600 font-extrabold">${calculateAllowance(log)}원</td><td class="p-3 text-left text-xs">${log.memo || '-'}</td></tr>`;
    });
}
function renderAdminTable() {} // 관리자 테이블 생략 

window.openModal = function(dateStr) {
    history.pushState({ page: 'modal' }, null, ''); selectedDateStr = dateStr;
    document.getElementById('modalDateTitle').innerHTML = `📅 ${dateStr} 운행 정보`;
    document.getElementById('logForm').reset();
    
    const logKey = `${currentUser}_${dateStr}`;
    const log = logsData[logKey];
    document.getElementById('deleteBtn').classList.toggle('hidden', !log);

    if (log && !log.isOff) { 
        document.getElementById('scheduleType').value = log.scheduleType || "none";
        document.getElementById('vehicle').value = log.vehicle || "";
        document.getElementById('driver1').value = log.driver1 || currentUser;
        document.getElementById('startTime1').value = log.startTime || ""; 
        document.getElementById('endTime1').value = log.endTime || "";
        document.getElementById('memo').value = log.memo || ""; 
    } else {
        document.getElementById('driver1').value = currentUser;
        const myDispatch = dispatchData.find(d => d.startDay === dateStr && d.assigned.some(name => stripDriverNumber(name) === currentUser));
        if (myDispatch) {
            document.getElementById('scheduleType').value = myDispatch.schedule.includes('서울') ? "seoul" : (myDispatch.schedule === '1박' ? "1night" : (myDispatch.schedule === '2박' ? "2night" : "day"));
            document.getElementById('vehicle').value = myDispatch.vehicleId + '차';
            document.getElementById('memo').value = `[배차] ${myDispatch.departure || ''} ➔ ${myDispatch.destination || ''}`;
        }
    }
    document.getElementById('logModal').classList.remove('hidden');
}

window.closeModal = function() { if (!document.getElementById('logModal').classList.contains('hidden')) { history.back(); } }

window.deleteLog = async function() {
    if (!confirm("일정을 삭제하시겠습니까?")) return;
    try { await deleteDoc(doc(db, "drivingLogsMulti", `${currentUser}_${selectedDateStr}`)); closeModal(); } catch (e) { alert("삭제 실패"); }
}

// 휴무 등록 로직
window.setOffDay = async function() {
    const key1 = `${currentUser}_${selectedDateStr}`;
    try {
        await setDoc(doc(db, "drivingLogsMulti", key1), { 
            userId: currentUser, 
            date: selectedDateStr, 
            isLeaveDay: true,
            scheduleType: '휴무',
            updatedAt: new Date() 
        });
        closeModal(); 
    } catch (error) { alert("휴무 등록 실패"); }
}

document.getElementById('logForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await setDoc(doc(db, "drivingLogsMulti", `${currentUser}_${selectedDateStr}`), { 
        userId: currentUser, date: selectedDateStr, scheduleType: document.getElementById('scheduleType').value, vehicle: document.getElementById('vehicle').value, driver1: currentUser, startTime: document.getElementById('startTime1').value, endTime: document.getElementById('endTime1').value, memo: document.getElementById('memo').value, updatedAt: new Date() 
    });
    closeModal();
});

window.openSummaryModal = function(){} // 생략
window.closeSummaryModal = function(){} // 생략
window.openMemoModal = function(){} // 생략
window.closeMemoModal = function(){} // 생략
