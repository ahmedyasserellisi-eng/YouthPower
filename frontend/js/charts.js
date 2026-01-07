/* ============================================================
    YouthPower HR - Charting Utils
    Version: 5.2 PRO (2026)
============================================================ */

/*
    NOTE:
    - This file مخصص إذا أردت إضافة Charts متقدمة باستخدام
      Chart.js أو ApexCharts أو D3.js.
    - النظام الحالي يستخدم الأعمدة المحسوبة داخل ui.js.
*/

function createBarChart(containerId, data, labels) {
    if (!window.Chart) {
        console.warn("Chart.js غير محمّل — تخطّي الرسم");
        return;
    }

    const ctx = document.getElementById(containerId).getContext("2d");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "التقييم الشهري",
                data,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 70 }
            }
        }
    });
}
// charts.js
