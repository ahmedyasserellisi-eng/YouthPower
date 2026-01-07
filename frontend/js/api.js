/* ============================================================
    YouthPower HR - Frontend API Connector
    Version 5.2 PRO (2026)
============================================================ */

/* ------------------------------------------------------------
    BACKEND URL (YOUR APPS SCRIPT DEPLOYMENT URL)
------------------------------------------------------------ */
// ⚠️ IMPORTANT — ضع رابط Web App الفعلي هنا
const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";


/* ------------------------------------------------------------
    GENERAL FETCH WRAPPER
------------------------------------------------------------ */
async function apiRequest(body = {}) {
    try {
        // Attach auth credentials if logged in
        if (authState && authState.user) {
            body._u = authState.user;
            body._t = authState.token;
            body._s = authState.sig;
        }

        const res = await fetch(API_URL, {
            method: "POST",
            contentType: "application/json",
            body: JSON.stringify(body)
        });

        return await res.json();
    } catch (err) {
        console.error("API error:", err);
        return { success: false, error: "تعذر الاتصال بالخادم" };
    }
}

/* ------------------------------------------------------------
    SPECIFIC SHORTCUTS
------------------------------------------------------------ */
function apiSearchMember(id) {
    return apiRequest({ action: "search", id });
}

function apiGetStats() {
    return apiRequest({ action: "stats" });
}

function apiAddLog(payload) {
    return apiRequest({ action: "add_log", ...payload });
}

function apiAddMonthlyEvaluation(payload) {
    return apiRequest({ action: "add_month_eval", ...payload });
}

function apiAddActivity(payload) {
    return apiRequest({ action: "add_activity", ...payload });
}

function apiGetTop3(month, year) {
    return apiRequest({ action: "top3", month, year });
}

function apiGetFullReport(uid) {
    return apiRequest({ action: "get_member_report", MemberUID: uid });
}

/* ------------------------------------------------------------
    DEBUG FUNCTION
------------------------------------------------------------ */
window.api = (payload) => apiRequest(payload);
