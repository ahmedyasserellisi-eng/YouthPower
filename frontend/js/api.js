/* ============================================================
    YouthPower HR - Frontend API Connector
    Version 5.2 PRO (2026)
============================================================ */

// ضع رابط Web App هنا
const API_URL = "https://script.google.com/macros/s/AKfycbyls10eMc1qIy6c0esdiNdZpGgrBFMWzff5IOskmYuTBo4krP-Hzt_8fZFdIGFb7zqSmA/exec";

/* ------------------------------------------------------------
    SAFE API REQUEST (WITH AUTH CHECK)
------------------------------------------------------------ */
async function apiRequest(body = {}) {
    try {
        // لا نرسل بيانات التوثيق أثناء تسجيل الدخول
        if (body.action !== "login") {
            if (!authState || !authState.token) {
                return { success: false, error: "الجلسة منتهية أو غير صالحة" };
            }

            body._u = authState.user;
            body._t = authState.token;
            body._s = authState.sig;
        }

        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return data;
    }
    catch (err) {
        console.error("API ERROR:", err);
        return { success: false, error: "تعذر الاتصال بالخادم" };
    }
}

/* ------------------------------------------------------------
    SHORTCUT FUNCTIONS
------------------------------------------------------------ */

// LOGIN
function apiLogin(username, password) {
    return apiRequest({ action: "login", username, password });
}

// SEARCH MEMBER
function apiSearchMember(id) {
    return apiRequest({ action: "search", id });
}

// DASHBOARD STATS
function apiGetStats() {
    return apiRequest({ action: "stats" });
}

// ADD LOG (BONUS / PENALTY)
function apiAddLog(payload) {
    return apiRequest({ action: "add_log", ...payload });
}

// MONTHLY EVALUATION
function apiAddMonthlyEvaluation(payload) {
    return apiRequest({ action: "add_month_eval", ...payload });
}

// ACTIVITY
function apiAddActivity(payload) {
    return apiRequest({ action: "add_activity", ...payload });
}

// TOP 3
function apiGetTop3(month, year) {
    return apiRequest({ action: "top3", month, year });
}

// OFFICIAL REPORT
function apiGetFullReport(uid) {
    return apiRequest({ action: "get_member_report", MemberUID: uid });
}

// RAW CALL
window.api = (payload) => apiRequest(payload);
