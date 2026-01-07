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

    document.getElementById("dashboardStats").innerHTML = `
        <div class="p-8 glass rounded-4xl text-center">
            <p class="text-4xl font-black">${res.data.stats.total}</p>
            <p class="text-sm opacity-60">عدد الأعضاء</p>
        </div>

        <div class="p-8 glass rounded-4xl text-center">
            <p class="text-4xl font-black">${res.data.stats.active}</p>
            <p class="text-sm opacity-60">أعضاء نشطين</p>
        </div>

        <div class="p-8 glass rounded-4xl text-center">
            <p class="text-4xl font-black">${res.data.stats.pendingReviews}</p>
            <p class="text-sm opacity-60">سجلات تحتاج مراجعة</p>
        </div>
    `;

    loadNotifications(res.data.notifications);
}

/* ------------------------------------------------------------
    NOTIFICATIONS
------------------------------------------------------------ */
function loadNotifications(list) {
    const box = document.getElementById("notifications");
    box.innerHTML = "";

    if (!list || !list.length) {
        box.innerHTML =
            `<div class="p-10 text-center opacity-30 font-bold">لا توجد إشعارات</div>`;
        return;
    }

    list.forEach(n => {
        box.innerHTML += `
            <div class="p-6 glass rounded-3xl flex justify-between items-center mt-3">
                <div>
                    <p class="font-black text-brand-600">${n.type}</p>
                    <p class="text-xs opacity-70">${n.reason}</p>
                </div>

                <button onclick="approveLog('${n.memberUID}', '${n.logId}')"
                    class="px-6 py-2 bg-brand-600 text-white rounded-xl font-black text-xs">
                    اعتماد
                </button>
            </div>
        `;
    });
}

/* ------------------------------------------------------------
    APPROVE LOG
------------------------------------------------------------ */
async function approveLog(uid, logId) {
    const res = await apiRequest({
        action: "approve_log",
        uid,
        logId
    });

    if (!res.success) return showToast(res.error, "error");

    showToast("تم اعتماد السجل", "success");
    loadDashboardStats();
}

/* ============================================================
    MEMBER SEARCH
============================================================ */

async function searchMember() {
    const id = document.getElementById("searchInput").value.trim();

    if (!id) return showToast("أدخل رقم العضوية", "error");

    document.getElementById("memberLoader").classList.remove("hidden");
    document.getElementById("memberCard").classList.add("hidden");

    const res = await apiRequest({ action: "search", id });

    document.getElementById("memberLoader").classList.add("hidden");

    if (!res.success) return showToast(res.error, "error");

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
    document.getElementById("memberCard").innerHTML = `
        <div class="p-10 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl">

            <div class="flex gap-6 items-center">
                <img id="mPhoto"
                     src="${fixImg(data.photo)}"
                     class="w-28 h-28 rounded-2xl object-cover border">

                <div>
                    <p id="mName" class="text-2xl font-black">${data.name}</p>
                    <p class="text-slate-500 text-sm">رقم العضوية: <span id="mId">${data.MemberID}</span></p>
                    <p class="text-slate-500 text-sm">القطاع: <span id="mSector">${data.sector}</span></p>
                    <p class="text-slate-500 text-sm">الانضمام: <span id="mJoinDate">${data.joinDate}</span></p>
                    <p id="docIdLabel" class="text-[10px] opacity-60 mt-1">UID: ${data.uid}</p>
                </div>
            </div>

            <hr class="my-6 opacity-20">

            <div class="grid grid-cols-3 gap-4 text-center">
                <div class="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <p class="text-xs opacity-60">النقاط</p>
                    <p id="mTotalScore" class="text-xl font-black">0</p>
                </div>
                <div id="chartContainer" class="col-span-2 flex gap-2 items-end h-24"></div>
            </div>

            <hr class="my-6 opacity-20">

            <h3 class="font-black mb-3 text-brand-600">السجلات</h3>
            <div id="logList" class="space-y-3"></div>

            <hr class="my-6 opacity-20">

            <h3 class="font-black mb-3 text-brand-600">الإجراءات</h3>

            ${buildActionForms()}

        </div>
    `;

    updateTotalScore(data.logs);
}

/* ------------------------------------------------------------
    CALCULATE TOTAL SCORE
------------------------------------------------------------ */
function updateTotalScore(logs) {
    let total = 0;

    logs.forEach(l => {
        if (l.status !== "approved") return;

        if (l.type === "بونص") total += extractNumber(l.reason);
        if (l.type === "عقوبة") total -= extractNumber(l.reason);
        if (l.type === "تقييم شهري") total += parseInt(l.avg || 0);
    });

    document.getElementById("mTotalScore").innerText = total;
}

/* ------------------------------------------------------------
    LOAD LOGS
------------------------------------------------------------ */
function loadMemberLogs(logs) {
    const box = document.getElementById("logList");
    box.innerHTML = "";

    if (!logs.length) {
        box.innerHTML =
            `<div class="text-center opacity-40 p-6 font-bold">لا توجد سجلات</div>`;
        return;
    }

    logs.forEach(l => {
        const cls =
            l.type === "بونص"
                ? "text-emerald-600"
                : l.type === "عقوبة"
                ? "text-rose-600"
                : "text-brand-600";

        box.innerHTML += `
            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                <p class="font-black ${cls}">${l.type}</p>
                <p class="text-xs opacity-70">${l.reason}</p>
                <p class="text-[10px] opacity-50 mt-1">
                    ${l.status === "approved" ? "معتمد" : "قيد المراجعة"}
                    ${l.admin ? " — المسؤول: " + l.admin : ""}
                </p>
            </div>`;
    });
}

/* ------------------------------------------------------------
    PERFORMANCE CHART
------------------------------------------------------------ */
function loadPerformanceChart(logs) {
    const box = document.getElementById("chartContainer");
    box.innerHTML = "";

    const evals = logs
        .filter(l => l.type === "تقييم شهري" && l.status === "approved")
        .slice(-8);

    if (!evals.length) {
        box.innerHTML = `<p class="text-xs opacity-50 m-auto">لا توجد تقييمات كافية</p>`;
        return;
    }

    evals.forEach(e => {
        const val = parseInt(e.avg || 0);
        const h = (val / 70) * 100;

        box.innerHTML += `
            <div class="flex-1 flex flex-col items-center">
                <div style="height:${h}%"
                     class="w-full bg-brand-500 rounded-xl"></div>
                <p class="text-[10px] mt-1">${val}</p>
            </div>
        `;
    });
}

/* ============================================================
    ACTION PANELS (Evaluation + Activity + Quick Bonus)
============================================================ */

function buildActionForms() {
    return `
        <div class="flex gap-2 mb-4">
            <button id="btn-eval-toggle"
                onclick="toggleForm('eval')"
                class="flex-1 py-3 text-xs font-black rounded-xl text-slate-400">
                تقييم شهري
            </button>

            <button id="btn-quick-toggle"
                onclick="toggleForm('quick')"
                class="flex-1 py-3 text-xs font-black rounded-xl text-slate-400">
                بونص / عقوبة
            </button>

            <button id="btn-act-toggle"
                onclick="toggleForm('activity')"
                class="flex-1 py-3 text-xs font-black rounded-xl text-slate-400">
                نشاط / اجتماع / مهمة
            </button>
        </div>

        ${buildEvalForm()}
        ${buildQuickForm()}
        ${buildActivityForm()}
    `;
}

/* ------------------------------------------------------------
    QUICK BONUS / PENALTY
------------------------------------------------------------ */
function setQuickType(t) {
    window.quickType = t;

document.getElementById("q-bonus").classList =
    t === "بونص"
        ? "flex-1 p-6 rounded-2xl border-2 border-emerald-600 bg-emerald-50 text-emerald-700 shadow"
        : "flex-1 p-6 rounded-2xl border-2";

document.getElementById("q-penalty").classList =
    t === "عقوبة"
        ? "flex-1 p-6 rounded-2xl border-2 border-rose-600 bg-rose-50 text-rose-700 shadow"
        : "flex-1 p-6 rounded-2xl border-2";
}

function adjustPoints(v) {
    const input = document.getElementById("quickPoints");
    let x = parseInt(input.value || "0") + v;

    x = Math.max(1, Math.min(100, x));
    input.value = x;
}

async function submitQuickAction() {
    const m = window.currentMember;
    if (!m) return;

    const pts = parseInt(document.getElementById("quickPoints").value || "0");
    const reason = document.getElementById("quickReason").value.trim();

    if (!pts || !reason)
        return showToast("اكتب السبب وعدد النقاط", "error");

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
    searchMember();
}
/* ============================================================
    ACTIVITY (Meeting – Event – Task)
============================================================ */

function setMeetStatus(st) {
    window.meetingStatus = st;

    const ids = {
        "حاضر":  "ms-present",
        "متأخر": "ms-late",
        "غائب":  "ms-absent"
    };

    ["ms-present", "ms-late", "ms-absent"].forEach(id => {
        document.getElementById(id).className =
            "py-2 text-[10px] font-bold border rounded-lg";
    });

    document.getElementById(ids[st]).className =
        "py-2 text-[10px] font-bold border rounded-lg bg-brand-600 text-white";
}

async function submitActivity() {
    const m = window.currentMember;
    if (!m) return;

    const type = document.getElementById("actType").value;
    const date = document.getElementById("actDate").value;
    const desc = document.getElementById("actDesc").value.trim();
    const score = parseInt(document.getElementById("actScore").value || "0");

    if (!date || !desc)
        return showToast("أدخل تاريخ ووصف النشاط", "error");

    const btn = document.getElementById("submitActBtn");
    btn.disabled = true;

    const payload = {
        action: "add_activity",
        MemberUID: m.uid,
        Type: type,
        Date: date,
        Description:
            (type === "meeting")
                ? `اجتماع (${window.meetingStatus}) — ${desc}`
                : desc,
        Score: score
    };

    const res = await apiRequest(payload);

    btn.disabled = false;

    if (!res.success)
        return showToast(res.error, "error");

    showToast("تم تسجيل النشاط", "success");
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

    if (!list.length) {
        box.innerHTML = `
            <p class="text-center opacity-40 font-bold">
                لا توجد بيانات لهذا الشهر
            </p>`;
        return;
    }

    list.forEach((m, i) => {
        box.innerHTML += `
            <div class="p-10 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl text-center border dark:border-slate-800">
                <p class="text-5xl font-black text-brand-600">#${i + 1}</p>

                <p class="font-black text-xl mt-4">${m.name}</p>
                <p class="text-sm opacity-60">${m.sector}</p>

                <p class="text-3xl font-black mt-4">${m.total} ن</p>
            </div>
        `;
    });
}
/* ============================================================
    OFFICIAL REPORT — PDF GENERATION
============================================================ */

async function downloadOfficialReport() {
    const m = window.currentMember;
    if (!m) return showToast("ابحث عن عضو أولاً", "error");

    showToast("جاري تجهيز التقرير...", "info");

    const res = await apiRequest({
        action: "get_member_report",
        MemberUID: m.uid
    });

    if (!res.success)
        return showToast(res.error, "error");

    const d = res.data;

    // Create container for PDF layout
    const div = document.createElement("div");
    div.className = "official-report";

    div.innerHTML = `
        <h1 style="font-weight:900; font-size:26px; color:#172554;">
            Youth Power — ملف العضو الرسمي
        </h1>

        <p style="margin-bottom:20px; color:#475569;">
            تقرير صادر بتاريخ: ${new Date().toLocaleDateString("ar-EG")}
        </p>

        <div style="display:flex; gap:20px; margin-bottom:20px;">
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

        <!-- Evaluations -->
        <h3 style="font-size:18px; font-weight:900; color:#1e40af;">
            التقييمات الشهرية
        </h3>

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
                        <td style="font-weight:bold; color:#1e40af;">
                            ${e.FinalScore}
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>

        <hr style="margin:25px 0;">

        <!-- Activities -->
        <h3 style="font-size:18px; font-weight:900; color:#1e40af;">
            الأنشطة والمهام
        </h3>

        ${
            d.activities.length
                ? d.activities.map(a => `
                    <p>• <strong>${a.Type}</strong> — ${a.Description} 
                       (${a.Score} ن)</p>
                `).join("")
                : "<p style='opacity:0.5;'>لا توجد أنشطة مسجلة</p>"
        }

        <hr style="margin:25px 0;">

        <!-- Logs -->
        <h3 style="font-size:18px; font-weight:900; color:#1e40af;">
            سجل البونص والجزاءات
        </h3>

        ${
            d.logs.length
                ? d.logs.map(l => `
                    <p>• ${l.type}: ${l.reason} 
                        <span style="color:#64748b;">
                            (المسؤول: ${l.admin})
                        </span>
                    </p>
                `).join("")
                : "<p style='opacity:0.5;'>لا توجد بونص أو عقوبات</p>"
        }

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
            filename: `YouthPower_Report_${d.profile.name}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 3 },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        })
        .save()
        .then(() => showToast("تم استخراج التقرير بنجاح", "success"));
}
