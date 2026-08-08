const firebaseConfig = {
    apiKey: "AIzaSyC3vETKSStfMQ6IylW64h5snWJl1hc1FwY",
    authDomain: "jang-seoul.firebaseapp.com",
    projectId: "jang-seoul",
    storageBucket: "jang-seoul.firebasestorage.app",
    messagingSenderId: "916714748195",
    appId: "1:916714748195:web:2cd71e8f1bf7173b137496",
    measurementId: "G-QSXPTY6ZFK"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ALLOWED_NAMES = ["박기준", "변석현", "이명순", "김탁", "한상훈", "문인식", "황덕일", "강철규", "이상헌"];
const ADMIN_NAME = "박기준";

window.toggleAuth = function(isSignup) {
    document.getElementById('loginBox').style.display = isSignup ? 'none' : 'block';
    document.getElementById('signupBox').style.display = isSignup ? 'block' : 'none';
}

window.handleSignup = async function() {
    const name = document.getElementById('signupName').value.trim();
    const pwd = document.getElementById('signupPwd').value;
    const pwdConfirm = document.getElementById('signupPwdConfirm').value;

    if(!name || !pwd || !pwdConfirm) return alert("모든 칸을 입력해주세요.");
    if(!ALLOWED_NAMES.includes(name)) return alert(`등록된 운전원 이름이 아닙니다.\n(허용: ${ALLOWED_NAMES.join(', ')})`);
    if(pwd !== pwdConfirm) return alert("비밀번호가 일치하지 않습니다.");
    if(pwd.length < 6) return alert("비밀번호는 6자리 이상 설정해주세요.");

    try {
        const docRef = db.collection("drivingUsersAuth").doc(name);
        const docSnap = await docRef.get();
        if(docSnap.exists) {
            alert("이미 가입된 이름입니다. 로그인을 진행해주세요.");
            toggleAuth(false); return;
        }
        await docRef.set({ password: pwd, createdAt: new Date() });
        alert("회원가입 완료! 로그인해주세요.");
        document.getElementById('loginName').value = name;
        toggleAuth(false);
    } catch (error) { alert("가입 중 오류가 발생했습니다."); }
}

window.handleLogin = async function() {
    const name = document.getElementById('loginName').value.trim();
    const pwd = document.getElementById('loginPwd').value;
    if(!name || !pwd) return alert("이름과 비밀번호를 입력해주세요.");

    try {
        const docRef = db.collection("drivingUsersAuth").doc(name);
        const docSnap = await docRef.get();

        if(!docSnap.exists) return alert("가입되지 않은 이름입니다. 회원가입을 먼저 진행해주세요.");
        if(docSnap.data().password !== pwd) return alert("비밀번호가 틀렸습니다.");

        localStorage.setItem("loggedInUser", name);
        showMainApp(name);
    } catch(e) { alert("로그인 오류가 발생했습니다."); }
}

function showMainApp(name) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('welcomeUserName').innerText = `👤 ${name}님 접속중`;
    if(name === ADMIN_NAME) document.getElementById('adminSettingBtn').classList.remove('hidden');
    renderCalendarUI(); 
}

window.handleLogout = function() {
    localStorage.removeItem("loggedInUser");
    location.reload();
}

window.goToDrivingLog = function() {
    location.href = "log.html"; 
}

let vehicles = [
    { id: '1호', type: 'bus' }, { id: '2호', type: 'bus' }, { id: '3호', type: 'bus' },
    { id: '11호', type: 'solati' }, { id: '12호', type: 'solati' }, { id: '13호', type: 'solati' }, { id: '14호', type: 'solati' }
];

const KOREAN_HOLIDAYS = { '2024-01-01': '신정', '2024-02-09': '설날', '2024-02-10': '설날', '2024-02-11': '설날', '2024-02-12': '대체공휴일', '2024-03-01': '삼일절', '2024-05-05': '어린이날', '2024-05-06': '대체공휴일', '2024-05-15': '부처님오신날', '2024-06-06': '현충일', '2024-08-15': '광복절', '2024-09-16': '추석', '2024-09-17': '추석', '2024-09-18': '추석', '2024-10-03': '개천절', '2024-10-09': '한글날', '2024-12-25': '크리스마스', '2025-01-01': '신정', '2025-01-28': '설날', '2025-01-29': '설날', '2025-01-30': '설날', '2025-03-01': '삼일절', '2025-03-03': '대체공휴일', '2025-05-05': '어린이날/부처님오신날', '2025-05-06': '대체공휴일', '2025-06-06': '현충일', '2025-08-15': '광복절', '2025-10-03': '개천절', '2025-10-05': '추석', '2025-10-06': '추석', '2025-10-07': '추석', '2025-10-08': '대체공휴일', '2025-10-09': '한글날', '2025-12-25': '크리스마스', '2026-01-01': '신정', '2026-02-16': '설날', '2026-02-17': '설날', '2026-02-18': '설날', '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날', '2026-05-25': '대체공휴일', '2026-06-06': '현충일', '2026-08-15': '광복절', '2026-08-17': '대체공휴일', '2026-09-24': '추석', '2026-09-25': '추석', '2026-09-26': '추석', '2026-10-03': '개천절', '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '크리스마스' };

let rosterHistory = {};
let allDispatches = []; 
let editingId = null;
let selectedDateStr = '';
let currentViewDate = new Date(); 
let offDaysData = {}; 

function formatDate(year, month, day) { return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
function parseDate(dateStr) { let p = dateStr.split('-'); return new Date(p[0], p[1]-1, p[2]); }
function stripDriverNumber(name) { return name.replace(/^\d+,\s*/, '').trim(); }

window.onload = () => { 
    populateVehicles(); 
    const savedUser = localStorage.getItem("loggedInUser");
    if(savedUser) { 
        showMainApp(savedUser); 
    } else {
        document.getElementById('loginView').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
};

db.collection('DispatchSystem').doc('MainData').onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        allDispatches = data.allDispatches || [];
        rosterHistory = data.rosterHistory || { '2024-01-01': ['1,박기준', '2,변석현', '3,이명순', '4,김탁', '5,한상훈', '6,문인식', '7,황덕일', '8,강철규', '9,이상헌'] };
    } else {
        rosterHistory = { '2024-01-01': ['1,박기준', '2,변석현', '3,이명순', '4,김탁', '5,한상훈', '6,문인식', '7,황덕일', '8,강철규', '9,이상헌'] };
        saveToFirebase();
    }
    if (document.getElementById('mainApp').style.display === 'block') renderCalendarUI(); 
});

db.collection('drivingLogsMulti').onSnapshot((snapshot) => {
    offDaysData = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isLeaveDay) {
            if (!offDaysData[data.date]) offDaysData[data.date] = [];
            offDaysData[data.date].push(data.userId);
        }
    });
    if (document.getElementById('mainApp').style.display === 'block') renderCalendarUI(); 
});

function saveToFirebase() {
    db.collection('DispatchSystem').doc('MainData').set({
        allDispatches: allDispatches, rosterHistory: rosterHistory
    }).catch(error => console.error("저장 실패:", error));
}

function changeMonth(offset) {
    currentViewDate.setMonth(currentViewDate.getMonth() + offset);
    renderCalendarUI();
}

function renderCalendarUI() {
    let year = currentViewDate.getFullYear();
    let month = currentViewDate.getMonth() + 1;
    document.getElementById('monthYearDisplay').innerText = `${year}년 ${month}월`;

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = `<div class="day-header text-red">일</div><div class="day-header">월</div><div class="day-header">화</div><div class="day-header">수</div><div class="day-header">목</div><div class="day-header">금</div><div class="day-header text-blue">토</div>`;

    let firstDay = new Date(year, month - 1, 1).getDay();
    let lastDate = new Date(year, month, 0).getDate();

    for (let i = 0; i < firstDay; i++) calendar.innerHTML += `<div class="day-empty"></div>`;

    for (let i = 1; i <= lastDate; i++) {
        let currentStr = formatDate(year, month, i);
        let dayOfWeek = new Date(year, month - 1, i).getDay();
        let isHoliday = KOREAN_HOLIDAYS[currentStr] ? true : false;
        
        let titleClass = (dayOfWeek === 0 || isHoliday) ? 'text-red' : (dayOfWeek === 6 ? 'text-blue' : '');
        let holidayText = isHoliday ? `<span class="holiday-name">${KOREAN_HOLIDAYS[currentStr]}</span>` : '';

        let dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.style.display = 'flex';
        dayDiv.style.flexDirection = 'column';
        dayDiv.style.height = '100%'; 
        
        dayDiv.innerHTML = `
            <div class="day-title ${titleClass}"><span>${i}일</span> ${holidayText}</div>
            <div id="dispatch-${currentStr}" style="flex: 1; display: flex; flex-direction: column;"></div>
        `;
        dayDiv.onclick = (e) => { if(e.target.closest('.dispatch-item')) return; openModal(currentStr); };
        calendar.appendChild(dayDiv);
    }
    recalculateEngine(); 
}

function populateVehicles() {
    const select = document.getElementById('vehicleSelect');
    vehicles.forEach(v => select.innerHTML += `<option value="${v.id}">${v.id} (${v.type === 'bus' ? '버스' : '쏠라티'})</option>`);
}

function openDriverModal() {
    document.getElementById('rosterDateInput').value = formatDate(currentViewDate.getFullYear(), currentViewDate.getMonth()+1, currentViewDate.getDate());
    loadRosterForDate();
    document.getElementById('driverModalOverlay').style.display = 'block';
}
function closeDriverModal() { document.getElementById('driverModalOverlay').style.display = 'none'; }

function loadRosterForDate() {
    const targetDateStr = document.getElementById('rosterDateInput').value;
    if(!targetDateStr) return;
    let dates = Object.keys(rosterHistory).sort();
    let activeRoster = [];
    for (let d of dates) { if (d <= targetDateStr) activeRoster = rosterHistory[d]; else break; }
    document.getElementById('driverListText').value = activeRoster.join('\n');
}

function saveRoster() {
    const targetDateStr = document.getElementById('rosterDateInput').value;
    const newRoster = document.getElementById('driverListText').value.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (newRoster.length === 0) return alert('최소 1명 이상 입력해주세요.');
    rosterHistory[targetDateStr] = newRoster; closeDriverModal(); saveToFirebase(); 
}

function resetRoster() {
    const targetDateStr = document.getElementById('rosterDateInput').value;
    if (targetDateStr === Object.keys(rosterHistory).sort()[0]) return alert('최초 설정된 기본 명단은 삭제할 수 없습니다.');
    delete rosterHistory[targetDateStr]; closeDriverModal(); saveToFirebase(); 
}

function openModal(dateStr) {
    selectedDateStr = dateStr;
    editingId = null; 
    document.getElementById('modalDate').innerText = `${dateStr} 배차 추가`;
    document.getElementById('scheduleSelect').value = '당일';
    document.getElementById('vehicleSelect').value = '';
    document.getElementById('departureInput').value = ''; 
    document.getElementById('destinationInput').value = '';
    document.getElementById('soloDrive').checked = false;
    document.getElementById('deleteBtn').classList.add('hidden');
    toggleBusOptions();
    document.getElementById('modalOverlay').style.display = 'block';
}

function openEditModal(id) {
    const dispatch = allDispatches.find(d => d.id === id);
    editingId = id;
    selectedDateStr = dispatch.startDay;
    document.getElementById('modalDate').innerText = `${dispatch.startDay} 배차 수정`;
    document.getElementById('scheduleSelect').value = dispatch.schedule;
    document.getElementById('vehicleSelect').value = dispatch.vehicleId;
    document.getElementById('departureInput').value = dispatch.departure || ''; 
    document.getElementById('destinationInput').value = dispatch.destination || '';
    document.getElementById('soloDrive').checked = dispatch.isSolo;
    document.getElementById('deleteBtn').classList.remove('hidden');
    toggleBusOptions();
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }
function toggleBusOptions() {
    const vId = document.getElementById('vehicleSelect').value;
    document.getElementById('busOptions').className = (vehicles.find(v => v.id === vId)?.type === 'bus') ? 'form-group' : 'form-group hidden';
}

function saveDispatch() {
    const vId = document.getElementById('vehicleSelect').value;
    if (!vId) return alert('차량을 선택하세요!');
    const scheduleVal = document.getElementById('scheduleSelect').value;
    const isSoloVal = document.getElementById('soloDrive').checked;
    const depVal = document.getElementById('departureInput').value; 
    const destVal = document.getElementById('destinationInput').value;

    if (editingId) {
        let target = allDispatches.find(d => d.id === editingId);
        target.vehicleId = vId; target.schedule = scheduleVal; target.isSolo = isSoloVal;
        target.departure = depVal; target.destination = destVal;
    } else {
        allDispatches.push({ id: Date.now(), startDay: selectedDateStr, vehicleId: vId, schedule: scheduleVal, isSolo: isSoloVal, departure: depVal, destination: destVal });
    }
    closeModal(); saveToFirebase(); 
}

function deleteCurrentDispatch() {
    if(confirm('이 일정을 삭제하시겠습니까?')) {
        allDispatches = allDispatches.filter(d => d.id !== editingId);
        closeModal(); saveToFirebase(); 
    }
}

function getSortScore(dispatch) {
    const v = vehicles.find(v => v.id === dispatch.vehicleId);
    let score = v.type === 'solati' ? 10000 : 0; 
    if (dispatch.schedule.includes('당일')) score += 100; else if (dispatch.schedule === '1박') score += 200; else if (dispatch.schedule === '2박') score += 300; else score += 400;
    if (dispatch.vehicleId === '3호') score += 1; else if (dispatch.vehicleId === '1호') score += 2; else if (dispatch.vehicleId === '2호') score += 3;
    return score;
}

function recalculateEngine() {
    let renderData = {}; 
    let currentTurn = 0; 
    let driverBusyUntil = {}; 
    let activeDrivers = []; 

    let firstHistoryDate = Object.keys(rosterHistory).sort()[0];
    if (!firstHistoryDate) return;

    let year = currentViewDate.getFullYear();
    let month = currentViewDate.getMonth() + 1;
    let lastDateOfView = new Date(year, month, 0); 
    let endSimulateStr = formatDate(year, month, lastDateOfView.getDate());

    let simDate = parseDate(firstHistoryDate);
    let endDateObj = parseDate(endSimulateStr);

    while (simDate <= endDateObj) {
        let dayStr = formatDate(simDate.getFullYear(), simDate.getMonth()+1, simDate.getDate());
        
        if (!renderData[dayStr]) renderData[dayStr] = [];
        if (rosterHistory[dayStr]) { activeDrivers = [...rosterHistory[dayStr]]; currentTurn = 0; }

        let todaysDispatches = allDispatches.filter(d => d.startDay === dayStr);
        todaysDispatches.sort((a, b) => getSortScore(a) - getSortScore(b));

        todaysDispatches.forEach(d => {
            const v = vehicles.find(v => v.id === d.vehicleId);
            let needed = (v.type === 'bus' && !d.isSolo) ? 2 : 1;
            let assigned = [];

            for (let i = 0; i < needed; i++) {
                let loopSafe = 0;
                while (driverBusyUntil[activeDrivers[currentTurn]] >= dayStr && loopSafe < activeDrivers.length) {
                    currentTurn = (currentTurn + 1) % activeDrivers.length;
                    loopSafe++;
                }
                
                let assignedDriver = activeDrivers[currentTurn];
                assigned.push(assignedDriver);

                let duration = (d.schedule === '1박') ? 1 : (d.schedule === '2박') ? 2 : 0;
                if(duration > 0) {
                    let busyDateObj = parseDate(dayStr);
                    busyDateObj.setDate(busyDateObj.getDate() + duration);
                    driverBusyUntil[assignedDriver] = formatDate(busyDateObj.getFullYear(), busyDateObj.getMonth()+1, busyDateObj.getDate());
                }
                currentTurn = (currentTurn + 1) % activeDrivers.length; 
            }

            let totalDays = (d.schedule === '1박') ? 2 : (d.schedule === '2박') ? 3 : 1;
            for(let offset = 0; offset < totalDays; offset++) {
                let targetDateObj = parseDate(dayStr);
                targetDateObj.setDate(targetDateObj.getDate() + offset);
                let targetStr = formatDate(targetDateObj.getFullYear(), targetDateObj.getMonth()+1, targetDateObj.getDate());
                
                if (targetDateObj <= endDateObj) {
                    if (!renderData[targetStr]) renderData[targetStr] = [];
                    renderData[targetStr].push({ 
                        id: d.id, vehicleId: d.vehicleId, schedule: d.schedule, 
                        assigned: assigned, type: v.type, departure: d.departure, destination: d.destination 
                    });
                }
            }
        });
        simDate.setDate(simDate.getDate() + 1);
    }

    drawCalendar(renderData, year, month, lastDateOfView.getDate());
    renderDetailTable(renderData, year, month, lastDateOfView.getDate()); 
    
    if (activeDrivers.length > 0) {
        document.getElementById('currentTurn').innerText = stripDriverNumber(activeDrivers[currentTurn] || "");
    }
}

function drawCalendar(renderData, y, m, lastDate) {
    for (let i = 1; i <= lastDate; i++) {
        let dateStr = formatDate(y, m, i);
        const dispatchDiv = document.getElementById(`dispatch-${dateStr}`);
        if (!dispatchDiv) continue;
        dispatchDiv.innerHTML = '';
        
        if(renderData[dateStr]) {
            renderData[dateStr].forEach(d => {
                let className = `dispatch-item type-${d.type}`;
                if (d.schedule === '1박') className += ' schedule-1night';
                else if (d.schedule === '2박') className += ' schedule-2nights';

                let displayNames = d.assigned.map(name => stripDriverNumber(name)).join(', ');

                dispatchDiv.innerHTML += `
                    <div class="${className}" onclick="openEditModal(${d.id})" title="클릭하여 수정">
                        <div style="margin-bottom:3px;"><span class="schedule-badge">${d.schedule}</span> <strong>${d.vehicleId}</strong></div>
                        <div><span style="font-weight:bold; color:#d32f2f;">${displayNames}</span></div>
                    </div>
                `;
            });
        }

        if (offDaysData[dateStr] && offDaysData[dateStr].length > 0) {
            let offNames = [...new Set(offDaysData[dateStr].map(name => stripDriverNumber(name)))].join(', ');
            dispatchDiv.innerHTML += `
                <div style="margin-top: auto; color: #d32f2f; font-size: 11px; font-weight: bold; background: #ffebee; padding: 4px; border-radius: 4px; text-align: center; border: 1px dashed #ffcdd2; cursor: default; width: 100%; box-sizing: border-box;" onclick="event.stopPropagation()">
                    🏝️ 휴무: ${offNames}
                </div>
            `;
        }
    }
}

function renderDetailTable(renderData, y, m, lastDate) {
    const tbody = document.getElementById('detailTableBody');
    tbody.innerHTML = '';
    
    let hasData = false;
    for (let i = 1; i <= lastDate; i++) {
        let dateStr = formatDate(y, m, i);
        if(!renderData[dateStr] || renderData[dateStr].length === 0) continue;
        
        hasData = true;
        renderData[dateStr].forEach(d => {
            let displayNames = d.assigned.map(name => stripDriverNumber(name)).join(', ');
            let dep = d.departure || '-';
            let dest = d.destination || '-';
            
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td><td>${d.schedule}</td><td><strong>${d.vehicleId}</strong></td><td style="font-weight:bold; color:#d32f2f;">${displayNames}</td><td style="color:#555;">${dep}</td><td style="color:#555;">${dest}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    if (!hasData) tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; color:#888;">이번 달 배차 내역이 없습니다.</td></tr>`;
}
