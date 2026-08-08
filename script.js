const firebaseConfig = {
    apiKey: "AIzaSyAC-4qsyKMuGp6o583agoFructJKiX67Oo",
    authDomain: "carpro-97259.firebaseapp.com",
    projectId: "carpro-97259",
    storageBucket: "carpro-97259.firebasestorage.app",
    messagingSenderId: "565637957634",
    appId: "1:565637957634:web:dca9222b84f1d9955e3f1b",
    measurementId: "G-JWL5TQWCB2"
    apiKey: "AIzaSyC3vETKSStfMQ6IylW64h5snWJl1hc1FwY",
    authDomain: "jang-seoul.firebaseapp.com",
    projectId: "jang-seoul",
    storageBucket: "jang-seoul.firebasestorage.app",
    messagingSenderId: "916714748195",
    appId: "1:1014430922351:web:2cd71e8f1bf7173b137496",
    measurementId: "G-QSXPTY6ZFK"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ALLOWED_NAMES = ["박기준", "변석현", "이명순", "김탁", "한상훈", "문인식", "황덕일", "강철규", "이상헌"];
const ADMIN_NAME = "박기준";

let loggedInUserRole = "";

window.toggleAuth = function(isSignup) {
document.getElementById('loginBox').style.display = isSignup ? 'none' : 'block';
document.getElementById('signupBox').style.display = isSignup ? 'block' : 'none';
@@ -62,7 +60,6 @@ window.handleLogin = async function() {
}

function showMainApp(name) {
    loggedInUserRole = name;
document.getElementById('loginView').style.display = 'none';
document.getElementById('mainApp').style.display = 'block';
document.getElementById('welcomeUserName').innerText = `👤 ${name}님 접속중`;
@@ -80,8 +77,8 @@ window.goToDrivingLog = function() {
}

let vehicles = [
    { id: '1호차', type: 'bus' }, { id: '2호차', type: 'bus' }, { id: '3호차', type: 'bus' },
    { id: '11호차', type: 'solati' }, { id: '12호차', type: 'solati' }, { id: '13호차', type: 'solati' }, { id: '14호차', type: 'solati' }
    { id: '1호', type: 'bus' }, { id: '2호', type: 'bus' }, { id: '3호', type: 'bus' },
    { id: '11호', type: 'solati' }, { id: '12호', type: 'solati' }, { id: '13호', type: 'solati' }, { id: '14호', type: 'solati' }
];

const KOREAN_HOLIDAYS = { '2024-01-01': '신정', '2024-02-09': '설날', '2024-02-10': '설날', '2024-02-11': '설날', '2024-02-12': '대체공휴일', '2024-03-01': '삼일절', '2024-05-05': '어린이날', '2024-05-06': '대체공휴일', '2024-05-15': '부처님오신날', '2024-06-06': '현충일', '2024-08-15': '광복절', '2024-09-16': '추석', '2024-09-17': '추석', '2024-09-18': '추석', '2024-10-03': '개천절', '2024-10-09': '한글날', '2024-12-25': '크리스마스', '2025-01-01': '신정', '2025-01-28': '설날', '2025-01-29': '설날', '2025-01-30': '설날', '2025-03-01': '삼일절', '2025-03-03': '대체공휴일', '2025-05-05': '어린이날/부처님오신날', '2025-05-06': '대체공휴일', '2025-06-06': '현충일', '2025-08-15': '광복절', '2025-10-03': '개천절', '2025-10-05': '추석', '2025-10-06': '추석', '2025-10-07': '추석', '2025-10-08': '대체공휴일', '2025-10-09': '한글날', '2025-12-25': '크리스마스', '2026-01-01': '신정', '2026-02-16': '설날', '2026-02-17': '설날', '2026-02-18': '설날', '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날', '2026-05-25': '대체공휴일', '2026-06-06': '현충일', '2026-08-15': '광복절', '2026-08-17': '대체공휴일', '2026-09-24': '추석', '2026-09-25': '추석', '2026-09-26': '추석', '2026-10-03': '개천절', '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '크리스마스' };
@@ -92,7 +89,6 @@ let editingId = null;
let selectedDateStr = '';
let currentViewDate = new Date(); 
let offDaysData = {}; 
let selectedFilterDate = ''; 

function formatDate(year, month, day) { return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
function parseDate(dateStr) { let p = dateStr.split('-'); return new Date(p[0], p[1]-1, p[2]); }
@@ -102,7 +98,6 @@ window.onload = () => {
populateVehicles(); 
const savedUser = localStorage.getItem("loggedInUser");
if(savedUser) { 
        loggedInUserRole = savedUser;
showMainApp(savedUser); 
} else {
document.getElementById('loginView').style.display = 'flex';
@@ -142,7 +137,6 @@ function saveToFirebase() {

function changeMonth(offset) {
currentViewDate.setMonth(currentViewDate.getMonth() + offset);
    selectedFilterDate = ''; 
renderCalendarUI();
}

@@ -277,15 +271,7 @@ function renderCalendarUI() {
           <div class="day-title ${titleClass}"><span>${i}일</span> ${holidayText}</div>
           <div id="dispatch-${currentStr}" style="flex: 1; display: flex; flex-direction: column;"></div>
       `;
        
        dayDiv.onclick = (e) => { 
            if(e.target.closest('.dispatch-item')) return; 
            selectedFilterDate = (selectedFilterDate === currentStr) ? '' : currentStr;
            recalculateEngine(); 
            
            if (loggedInUserRole !== ADMIN_NAME) return; // 일반 운전원은 상세 보기 필터만 작동
            openModal(currentStr); 
        };
        dayDiv.onclick = (e) => { if(e.target.closest('.dispatch-item')) return; openModal(currentStr); };
calendar.appendChild(dayDiv);
}
recalculateEngine(); 
@@ -313,22 +299,19 @@ function loadRosterForDate() {
}

function saveRoster() {
    if (loggedInUserRole !== ADMIN_NAME) return alert("관리자만 명단을 변경할 수 있습니다.");
const targetDateStr = document.getElementById('rosterDateInput').value;
const newRoster = document.getElementById('driverListText').value.split('\n').map(n => n.trim()).filter(n => n !== '');
if (newRoster.length === 0) return alert('최소 1명 이상 입력해주세요.');
rosterHistory[targetDateStr] = newRoster; closeDriverModal(); saveToFirebase(); 
}

function resetRoster() {
    if (loggedInUserRole !== ADMIN_NAME) return alert("관리자만 명단을 변경할 수 있습니다.");
const targetDateStr = document.getElementById('rosterDateInput').value;
if (targetDateStr === Object.keys(rosterHistory).sort()[0]) return alert('최초 설정된 기본 명단은 삭제할 수 없습니다.');
delete rosterHistory[targetDateStr]; closeDriverModal(); saveToFirebase(); 
}

function openModal(dateStr) {
    if (loggedInUserRole !== ADMIN_NAME) return;
selectedDateStr = dateStr;
editingId = null; 
document.getElementById('modalDate').innerText = `${dateStr} 배차 추가`;
@@ -345,10 +328,6 @@ function openModal(dateStr) {
}

function openEditModal(id) {
    if (loggedInUserRole !== ADMIN_NAME) {
        alert("배차 수정은 관리자(박기준)만 가능합니다.");
        return;
    }
const dispatch = allDispatches.find(d => d.id === id);
editingId = id;
selectedDateStr = dispatch.startDay;
@@ -373,7 +352,6 @@ function toggleBusOptions() {
}

function saveDispatch() {
    if (loggedInUserRole !== ADMIN_NAME) return alert("권한이 없습니다.");
const vId = document.getElementById('vehicleSelect').value;
if (!vId) return alert('차량을 선택하세요!');
const scheduleVal = document.getElementById('scheduleSelect').value;
@@ -397,18 +375,21 @@ function saveDispatch() {
}

function deleteCurrentDispatch() {
    if (loggedInUserRole !== ADMIN_NAME) return alert("권한이 없습니다.");
if(confirm('이 일정을 삭제하시겠습니까?')) {
allDispatches = allDispatches.filter(d => d.id !== editingId);
closeModal(); saveToFirebase(); 
}
}

// 💡 km가 짧을수록 우선순위가 높도록 정렬 점수 부여
function getSortScore(dispatch) {
const v = vehicles.find(v => v.id === dispatch.vehicleId);
let score = v.type === 'solati' ? 10000 : 0; 
    
    // km 입력값이 있으면 km순으로 정렬되도록 가중치 부여 (km가 짧을수록 위로)
let km = dispatch.km || 0;
score += km; 

return score;
}

@@ -514,12 +495,11 @@ function drawCalendar(renderData, y, m, lastDate) {
if(renderData[dateStr]) {
renderData[dateStr].forEach(d => {
let className = `dispatch-item type-${d.type}`;
                
                // 💡 일정별 조그마한 뱃지 색상 및 당일 배경색 조금 더 진하게 조정
let badgeBg = '#3b82f6';
                if (d.schedule === '당일') {
                    if (d.type === 'bus') { badgeBg = '#15803d'; className += ' schedule-bus-day'; }
                    else { badgeBg = '#1d4ed8'; className += ' schedule-day-dark'; }
                }
                else if (d.schedule === '당일(서울)') { badgeBg = '#60a5fa'; }
                if (d.schedule === '당일') { badgeBg = '#2563eb'; className += ' schedule-day-dark'; }
                else if (d.schedule === '당일(서울)') { badgeBg = '#475569'; }
else if (d.schedule === '1박') { badgeBg = '#ca8a04'; className += ' schedule-1night'; }
else if (d.schedule === '2박') { badgeBg = '#c2410c'; className += ' schedule-2nights'; }

@@ -531,6 +511,7 @@ function drawCalendar(renderData, y, m, lastDate) {
return clean;
}).join(', ');

                // 💡 차량호차 옆에 운전원 이름을 나란히 배치하도록 수정
dispatchDiv.innerHTML += `
                   <div class="${className}" onclick="openEditModal(${d.id})" title="클릭하여 수정" style="padding: 4px 6px; margin-bottom: 3px; border-radius: 6px; font-size: 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                       <div style="display: flex; align-items: center; gap: 4px;">
@@ -559,15 +540,9 @@ function renderDetailTable(renderData, y, m, lastDate) {
tbody.innerHTML = '';

let hasData = false;
    let targetDates = selectedFilterDate ? [selectedFilterDate] : [];
    if (!selectedFilterDate) {
        for (let i = 1; i <= lastDate; i++) {
            targetDates.push(formatDate(y, m, i));
        }
    }

    targetDates.forEach(dateStr => {
        if(!renderData[dateStr] || renderData[dateStr].length === 0) return;
    for (let i = 1; i <= lastDate; i++) {
        let dateStr = formatDate(y, m, i);
        if(!renderData[dateStr] || renderData[dateStr].length === 0) continue;

hasData = true;
renderData[dateStr].forEach(d => {
@@ -585,10 +560,6 @@ function renderDetailTable(renderData, y, m, lastDate) {
           `;
tbody.appendChild(tr);
});
    });

    if (!hasData) {
        let msg = selectedFilterDate ? `${selectedFilterDate}에 배차 내역이 없습니다.` : `이번 달 배차 내역이 없습니다.`;
        tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; color:#888;">${msg}</td></tr>`;
}
    if (!hasData) tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; color:#888;">이번 달 배차 내역이 없습니다.</td></tr>`;
}
