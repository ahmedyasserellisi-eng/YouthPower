/* ============================================================
    YouthPower HR - Charts & Visualization
    Version 5.2 PRO (2026)
============================================================ */

/* ------------------------------------------------------------
    PERFORMANCE BAR CHART (LAST 8 MONTHLY EVALUATIONS)
------------------------------------------------------------ */
/*
    This file focuses only on graph rendering logic.
    UI binding & data extraction happens from ui.js,
    so this file stays clean and reusable.
*/

function renderPerformanceChart(containerId, evalList) {
    const box = document.getElementById(containerId);
    if (!box) return;

    box.innerHTML = "";

    if (!evalList || !evalList.length) {
        box.innerHTML =
            `<p class="w-full text-center opacity-50 text-sm">لا توجد تقييمات متاحة</p>`;
        return;
    }

    // Only last 8 evaluations
    const last = evalList.slice(-8);

    last.forEach(e => {
        const value = parseInt(e.avg || 0);
        const height = (value / 70) * 100;

        box.innerHTML += `
            <div class="flex-1 flex flex-col justify-end items-center">
                <div class="w-full bg-brand-500 rounded-xl transition-all" 
                     style="height:${height}%"></div>
                <p class="text-[10px] mt-2">${value}</p>
            </div>
        `;
    });
}

/* ------------------------------------------------------------
    TOP 3 CHART (OPTIONAL EXTENSION)
------------------------------------------------------------ */
/*
    This util draws a simple rank card.
    It is optional (not critical) but included for structure
*/
function renderTop3Card(container, rankList) {
    container.innerHTML = "";

    if (!rankList.length) {
        container.innerHTML =
            `<p class="text-center opacity-40">لا توجد بيانات لهذا الشهر</p>`;
        return;
    }

    rankList.forEach((m, i) => {
        container.innerHTML += `
            <div class="p-10 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl text-center border">
                <p class="text-5xl font-black text-brand-600">#${i + 1}</p>
                <p class="font-black text-xl mt-4">${m.name}</p>
                <p class="text-sm opacity-60">${m.sector}</p>
                <p class="text-3xl font-black mt-4">${m.total} ن</p>
            </div>
        `;
    });
}

/* ------------------------------------------------------------
    EXPORT FUNCTIONS
------------------------------------------------------------ */
window.renderPerformanceChart = renderPerformanceChart;
window.renderTop3Card = renderTop3Card;
