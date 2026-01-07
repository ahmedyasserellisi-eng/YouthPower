/* ============================================================
    YouthPower HR - UI Management
    Version: 5.2 PRO (2026)
============================================================ */

let currentTab = "dashboard";

/* ------------------------------------------------------------
    SWITCH MAIN TABS (Dashboard – Search – Ranking)
------------------------------------------------------------ */
function switchTab(tab) {
    currentTab = tab;

    const views = {
        dashboard: "dashboardView",
        search: "searchView",
        ranking: "rankingView"
    };

    Object.keys(views).forEach(t => {
        document.getElementById(views[t]).classList.add("hidden");
    });

    document.getElementById(views[tab]).classList.remove("hidden");

    updateNavUI(tab);

    if (tab === "dashboard") loadDashboardStats();
    if (tab === "ranking") onRankingTabOpen();
}

/* ------------------------------------------------------------
    UPDATE NAV STYLE
------------------------------------------------------------ */
function updateNavUI(tab) {
    const navs = ["nav-dash", "nav-search", "nav-top"];
    navs.forEach(id => {
        document.getElementById(id).className =
            "px-6 py-2 rounded-xl font-black text-sm text-slate-500";
    });

    const active = {
        dashboard: "nav-dash",
        search: "nav-search",
        ranking: "nav-top"
    }[tab];

    document.getElementById(active).className =
        "px-6 py-2 rounded-xl font-black text-sm bg-white dark:bg-slate-900 shadow text-brand-600";
}

/* ------------------------------------------------------------
    DASHBOARD — LOAD STATS
------------------------------------------------------------ */
async function loadDashboardStats() {
    const res = await apiRequest({ action: "stats" });
    if (!res.success) return;

    document.getElementById("statTotal").innerText = res.data.stats.total;
    document.getElementById("statActive").innerText = res.data.stats.active;
    document.getElementById("statPending").innerText = res.data.stats.pendingReviews;

    loadNotifications(res.data.notifications);
}

/* ------------------------------------------------------------
    NOTIFICATIONS CENTER
------------------------------------------------------------ */
function loadNotifications(list) {
    const box = document.getElementById("notificationsList");
    box.innerHTML = "";

    if (!list || !list.length) {
        box.innerHTML = `
            <div class="p-20 text-center opacity-30 font-bold">
                لا توجد طلبات للمراجعة
            </div>`;
        return;
    }

    list.forEach(n => {
        box.innerHTML += `
            <div class="p-6 flex items-center justify-between border-b dark:border-slate-800">
                <div>
                    <p class="font-black text-brand-600">${n.type}</p>
                    <p class="text-xs text-slate-500">${n.reason}</p>
                </div>
                <button onclick="approveLog('${n.memberUID}','${n.logId}')"
                    class="px-6 py-2 bg-brand-600 text-white text-xs rounded-xl font-black">
                    اعتماد
                </button>
            </div>
        `;
    });
}

/* ------------------------------------------------------------
    APPROVE LOG (From Admin Panel)
------------------------------------------------------------ */
async function approveLog(uid, logId) {
    const res = await apiRequest({
        action: "approve_log",
        uid,
        logId
    });

    if (res.success) {
        showToast("تم اعتماد السجل", "success");
        loadDashboardStats();
    } else {
        showToast(res.error, "error");
    }
}
/* ============================================================
    MEMBER SEARCH + PROFILE UI
============================================================ */

/* ------------------------------------------------------------
    SEARCH MEMBER
------------------------------------------------------------ */
async function searchMember() {
    const id = document.getElementById("searchInput").value.trim();

    if (!id)
        return showToast("أدخل رقم العضوية أو الرقم القومي", "error");

    // Show loader
    document.getElementById("memberLoader").classList.remove("hidden");
    document.getElementById("memberCard").classList.add("hidden");

    const res = await apiRequest({
        action: "search",
        id
    });

    // Hide loader
    document.getElementById("memberLoader").classList.add("hidden");

    if (!res.success)
        return showToast(res.error, "error");

    // Save member globally
    window.currentMember = res.data;

    populateMemberUI(res.data);
    loadMemberLogs(res.data.logs);
    loadPerformanceChart(res.data.logs);

    document.getElementById("memberCard").classList.remove("hidden");
}


/* ------------------------------------------------------------
    POPULATE MEMBER CARD
------------------------------------------------------------ */
function populateMemberUI(data) {
    document.getElementById("mPhoto").src = fixImg(data.photo);
    document.getElementById("mName").innerText = data.name;

    document.getElementById("mId").innerText = data.MemberID;
    document.getElementById("mSector").innerText = data.sector;
    document.getElementById("mJoinDate").innerText = data.joinDate;

    // UID
    document.getElementById("docIdLabel").innerText = "UID: " + data.uid;

    updateTotalScore(data.logs);
}


/* ------------------------------------------------------------
    CALCULATE TOTAL SCORE (Evaluation + Logs)
------------------------------------------------------------ */
function updateTotalScore(logs) {
    let total = 0;

    logs.forEach(l => {
        if (l.status !== "approved") return;

        if (l.type === "تقييم شهري") {
            total += parseInt(l.avg || 0);
        }

        if (l.type === "بونص") {
            total += extractNumber(l.reason);
        }

        if (l.type === "عقوبة") {
            total -= extractNumber(l.reason);
        }
    });

    document.getElementById("mTotalScore").innerText = total;
}


/* ------------------------------------------------------------
    LOAD MEMBER LOGS
------------------------------------------------------------ */
function loadMemberLogs(logs) {
    const box = document.getElementById("logList");

    box.innerHTML = "";

    if (!logs.length) {
        box.innerHTML =
            `<div class="p-10 text-center opacity-40 font-bold">لا توجد سجلات للعضو</div>`;
        return;
    }

    logs.forEach(l => {
        const color =
            l.type === "بونص" ? "text-emerald-600" :
            l.type === "عقوبة" ? "text-rose-600" :
            "text-brand-600";

        box.innerHTML += `
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                <p class="font-black ${color}">${l.type}</p>
                <p class="text-xs mt-1">${l.reason}</p>
                <p class="text-[10px] text-slate-500 mt-1">
                    الحالة: 
                    ${l.status === "approved" ? "معتمد" : "قيد المراجعة"}
                    ${l.admin ? `| المسؤول: ${l.admin}` : ""}
                </p>
            </div>
        `;
    });
}


/* ------------------------------------------------------------
    PERFORMANCE CHART (LAST 8 MONTHLY EVALUATIONS)
------------------------------------------------------------ */
function loadPerformanceChart(logs) {
    const box = document.getElementById("chartContainer");
    box.innerHTML = "";

    const evals = logs
        .filter(l => l.type === "تقييم شهري" && l.status === "approved")
        .slice(-8);

    if (!evals.length) {
        box.innerHTML =
            `<p class="w-full text-center opacity-50 text-sm">لا توجد تقييمات كافية</p>`;
        return;
    }

    evals.forEach(e => {
        const val = parseInt(e.avg || 0);
        const height = (val / 70) * 100;

        box.innerHTML += `
            <div class="flex-1 flex flex-col justify-end items-center">
                <div class="w-full bg-brand-500 rounded-xl transition-all" 
                     style="height:${height}%"></div>
                <p class="text-[10px] mt-2">${val}</p>
            </div>
        `;
    });
}
/* ============================================================
    ACTIONS — Evaluation / Activity / Quick Bonus-Penalty
============================================================ */

/* ------------------------------------------------------------
    TOGGLE ACTION FORMS
------------------------------------------------------------ */
function toggleForm(type) {
    const forms = ["eval", "quick", "activity"];

    forms.forEach(f => {
        document.getElementById(`form-${f}`).classList.add("hidden");
        document.getElementById(`btn-${f === "activity" ? "act" : f}-toggle`)
            .className =
            "flex-1 py-3 text-xs font-black rounded-xl transition-all text-slate-400";
    });

    // Show selected
    document.getElementById(`form-${type}`).classList.remove("hidden");

    // Activate button
    document.getElementById(`btn-${type === "activity" ? "act" : type}-toggle`)
        .className =
        "flex-1 py-3 text-xs font-black rounded-xl bg-brand-600 text-white shadow-lg";
}

/* ============================================================
    QUICK ACTION: (BONUS / PENALTY)
============================================================ */

function setQuickType(type) {
    window.quickType = type;

    document.getElementById("pointsSection").classList.remove("hidden");

    document.getElementById("q-bonus").className =
        type === "بونص"
            ? "flex-1 p-6 rounded-2xl border-2 border-brand-600 bg-brand-50 text-brand-600 shadow"
            : "flex-1 p-6 rounded-2xl border-2";

    document.getElementById("q-penalty").className =
        type === "عقوبة"
            ? "flex-1 p-6 rounded-2xl border-2 border-rose-600 bg-rose-50 text-rose-600 shadow"
            : "flex-1 p-6 rounded-2xl border-2";
}

function adjustPoints(v) {
    const input = document.getElementById("quickPoints");
    let x = parseInt(input.value) + v;

    x = Math.max(1, Math.min(x, 100));
    input.value = x;
}

/* ------------------------------------------------------------
    SUBMIT QUICK ACTION
------------------------------------------------------------ */
async function submitQuickAction() {
    const m = window.currentMember;
    if (!m) return;

    const pts = document.getElementById("quickPoints").value;
    const reason = document.getElementById("quickReason").value.trim();

    if (!reason)
        return showToast("اكتب سبب البونص / الخصم", "error");

    const btn = document.getElementById("submitQuickBtn");
    btn.disabled = true;

    const res = await apiRequest({
        action: "add_log",
        uid: m.uid,
        type: window.quickType,
        reason: `${reason} (${pts} نقطة)`,
        status: authState.role === "admin" ? "approved" : "pending"
    });

    btn.disabled = false;

    if (!res.success)
        return showToast(res.error, "error");

    showToast("تم حفظ الإجراء", "success");

    document.getElementById("quickReason").value = "";
    searchMember(); // refresh
}

/* ============================================================
    MONTHLY EVALUATION
============================================================ */

function calcFinalScore() {
    const items = [
        "AttendanceScore",
        "ActivityScore",
        "TaskScore",
        "Bonus",
        "Penalty"
    ];

    let total = 0;

    items.forEach(id => {
        const v = parseInt(document.getElementById(id).value) || 0;
        if (id === "Penalty") total -= v;
        else total += v;

        document.getElementById(id + "v").innerText =
            `${v} / ${document.getElementById(id).max}`;
    });

    document.getElementById("finalTotal").innerText = total;
}

async function submitEvaluation() {
    const m = window.currentMember;
    if (!m) return;

    const btn = document.getElementById("submitEvalBtn");
    btn.disabled = true;

    const payload = {
        action: "add_month_eval",
        MemberUID: m.uid,
        Month: document.getElementById("evalMonthSelect").value,
        Year: document.getElementById("evalYearSelect").value,

        AttendanceScore: document.getElementById("AttendanceScore").value,
        ActivityScore: document.getElementById("ActivityScore").value,
        TaskScore: document.getElementById("TaskScore").value,
        Bonus: document.getElementById("Bonus").value,
        Penalty: document.getElementById("Penalty").value,

        FinalScore: document.getElementById("finalTotal").innerText
    };

    const res = await apiRequest(payload);

    btn.disabled = false;

    if (!res.success)
        return showToast(res.error, "error");

    showToast("تم حفظ التقييم", "success");
    searchMember();
}

/* ============================================================
    ACTIVITY (Meeting – Event – Task)
============================================================ */

function setMeetStatus(st) {
    window.meetingStatus = st;

    ["ms-present", "ms-late", "ms-absent"].forEach(id => {
        document.getElementById(id).className =
            "py-2 text-[10px] font-bold border rounded-lg";
    });

    const map = {
        "حاضر": "ms-present",
        "متأخر": "ms-late",
        "غائب": "ms-absent"
    };

    document.getElementById(map[st]).className =
        "py-2 text-[10px] font-bold border rounded-lg bg-brand-600 text-white";
}

async function submitActivity() {
    const m = window.currentMember;
    if (!m) return;

    const type = document.getElementById("actType").value;
    const date = document.getElementById("actDate").value;
    const desc = document.getElementById("actDesc").value.trim();
    const score = parseInt(document.getElementById("actScore").value) || 0;

    if (!date || !desc)
        return showToast("أدخل تاريخ ووصف النشاط", "error");

    const btn = document.getElementById("submitActBtn");
    btn.disabled = true;

    const res = await apiRequest({
        action: "add_activity",
        MemberUID: m.uid,
        Type: type,
        Date: date,
        Description: (type === "meeting")
            ? `اجتماع (${window.meetingStatus}) — ${desc}`
            : desc,
        Score: score
    });

    btn.disabled = false;

    if (!res.success)
        return showToast(res.error, "error");

    showToast("تم حفظ النشاط", "success");

    document.getElementById("actDesc").value = "";
    searchMember();
}

/* ============================================================
    RANKING — TOP 3 OF THE MONTH
============================================================ */

async function onRankingTabOpen() {
    const month = document.getElementById("rankMonth").value;
    const year = document.getElementById("rankYear").value;

    document.getElementById("topLoader").classList.remove("hidden");
    document.getElementById("top3Container").innerHTML = "";

    const res = await apiRequest({
        action: "top3",
        month,
        year
    });

    document.getElementById("topLoader").classList.add("hidden");

    if (!res.success)
        return showToast(res.error, "error");

    loadTop3(res.data);
}

function loadTop3(list) {
    const box = document.getElementById("top3Container");
    box.innerHTML = "";

    if (!list.length)
        return box.innerHTML =
            `<p class="text-center opacity-40">لا توجد بيانات لهذا الشهر</p>`;

    list.forEach((m, i) => {
        box.innerHTML += `
            <div class="p-10 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl text-center border">
                <p class="text-5xl font-black text-brand-600">#${i + 1}</p>
                <p class="font-black text-xl mt-4">${m.name}</p>
                <p class="text-sm opacity-60">${m.sector}</p>
                <p class="text-3xl font-black mt-4">${m.total} ن</p>
            </div>
        `;
    });
}

/* ============================================================
    OFFICIAL REPORT — PDF
============================================================ */

async function downloadOfficialReport() {
    const m = window.currentMember;
    if (!m) return;

    showToast("جاري تجهيز التقرير...", "info");

    const res = await apiRequest({
        action: "get_member_report",
        MemberUID: m.uid
    });

    if (!res.success)
        return showToast(res.error, "error");

    const d = res.data;

    // Build the PDF container
    const div = document.createElement("div");
    div.className = "official-report";

    div.innerHTML = `
        <h1 style="font-weight:900; font-size:26px; color:#172554;">
            Youth Power — ملف العضو الرسمي
        </h1>

        <p style="margin-bottom:20px; color:#475569;">
            تقرير صادر بتاريخ: ${new Date().toLocaleDateString("ar-EG")}
        </p>

        <div style="display:flex; gap:20px;">
            <img src="${fixImg(d.profile.photo)}"
                 style="width:120px; height:120px; border-radius:15px; object-fit:cover; border:3px solid #e2e8f0">
            <div>
                <p><strong>الاسم:</strong> ${d.profile.name}</p>
                <p><strong>القطاع:</strong> ${d.profile.sector}</p>
                <p><strong>رقم العضوية:</strong> ${d.profile.MemberID}</p>
                <p><strong>UID:</strong> ${d.profile.uid}</p>
                <p><strong>تاريخ الانضمام:</strong> ${d.profile.joinDate}</p>
            </div>
        </div>

        <hr style="margin:25px 0;">

        <h3 style="font-size:18px; font-weight:900; color:#1e40af;">التقييمات الشهرية</h3>

        <table style="width:100%; margin-top:10px; border-collapse:collapse;">
            <thead>
                <tr style="background:#f1f5f9; text-align:center;">
                    <th>الفترة</th>
                    <th>الحضور</th>
                    <th>المشاركة</th>
                    <th>المهام</th>
                    <th>النهائي</th>
                </tr>
            </thead>
            <tbody>
                ${d.evaluations.map(e => `
                    <tr style="text-align:center;">
                        <td>${e.Month} ${e.Year}</td>
                        <td>${e.AttendanceScore}</td>
                        <td>${e.ActivityScore}</td>
                        <td>${e.TaskScore}</td>
                        <td style="font-weight:bold; color:#1e40af;">${e.FinalScore}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>

        <hr style="margin:25px 0;">

        <h3 style="font-size:18px; font-weight:900; color:#1e40af;">الأنشطة والمهام</h3>

        ${d.activities.map(a => `
            <p>• <strong>${a.Type}</strong> — ${a.Description} (${a.Score} ن)</p>
        `).join("")}

        <hr style="margin:25px 0;">

        <h3 style="font-size:18px; font-weight:900; color:#1e40af;">سجل البونص والجزاءات</h3>

        ${d.logs.map(l => `
            <p>• ${l.type}: ${l.reason} <span style="color:#64748b">(المسؤول: ${l.admin})</span></p>
        `).join("")}

        <hr style="margin:25px 0;">

        <p style="font-weight:bold; color:#172554;">
            إجمالي النقاط: ${d.score.total}
        </p>
    `;

    // Generate PDF
    html2pdf()
        .from(div)
        .set({
            margin: 0.5,
            filename: `YouthPower_Report_${m.name}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 3 },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        })
        .save()
        .then(() => showToast("تم استخراج التقرير بنجاح", "success"));
}
// ui.js
