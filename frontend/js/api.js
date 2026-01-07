/* ============================================================
    YouthPower HR - Frontend API Connector
    Version 5.2 PRO (2026)
============================================================ */

// ضع رابط Web App هنا
const API_URL = "https://script.google.com/macros/s/AKfycbyAIMKdc6ELTxsEOyJLkuEycRAFAyCNI3hUwmlRTxAfm5Tr-hyWLKrbQJ-EIXKRguP8oA/exec";

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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return data;

    } catch (err) {
        console.error("API ERROR:", err);
        return { success: false, error: "تعذر الاتصال بالخادم" };
    }
}

/* ------------------------------------------------------------
    SHORTCUTS
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

window.api = (payload) => apiRequest(payload);
