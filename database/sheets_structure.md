# YouthPower HR — Google Sheets Structure
إصدار 2026 — v5.2 PRO

---

## 1) Members
| Column       | Description                          |
|--------------|--------------------------------------|
| MemberID     | رقم العضوية                           |
| Name         | اسم العضو                             |
| PhotoID      | رابط صورة Google Drive                |
| JoinDate     | تاريخ الانضمام                         |
| Status       | الحالة (عضو – غير ذلك)                |
| Sector       | القطاع                                 |
| MemberUID    | رقم UID فريد (يتولّد تلقائيًا)        |

---

## 2) MemberLogs
| Column    | Description                            |
|-----------|----------------------------------------|
| MemberUID | UID الخاص بالعضو                        |
| LogID     | رقم سجل فريد                            |
| Type      | بونص – عقوبة – تقييم شهري…             |
| Reason    | سبب الإجراء                             |
| S1–S5     | تفاصيل التقييمات                       |
| AvgScore  | المتوسط النهائي                         |
| Status    | approved / pending                     |
| Admin     | المسؤول                                 |

---

## 3) Logs
| Column       | Description                        |
|--------------|------------------------------------|
| Timestamp    | وقت الحدث                           |
| User         | المستخدم                            |
| Action       | العملية                              |
| Status       | النجاح/الفشل                        |
| Token        | رمز الجلسة                          |
| Signature    | التوقيع                             |
| Error        | تفاصيل الخطأ                        |

---

## 4) MonthlyEvaluations
| Field            | Description                             |
|------------------|-----------------------------------------|
| MemberUID        |                                         |
| Date             |                                         |
| Month            |                                         |
| Year             |                                         |
| MeetingMode      |                                         |
| MeetingStatus    | حاضر/متأخر/غائب                        |
| DelayMinutes     |                                         |
| AttendanceScore  |                                         |
| ActivityScore    |                                         |
| TaskScore        |                                         |
| Bonus            |                                         |
| Penalty          |                                         |
| FinalScore       |                                         |
| Notes            |                                         |
| RawJSON          | النسخة الخام من التقييم                 |

---

## 5) MemberActivities
| Field        | Description                     |
|--------------|---------------------------------|
| MemberUID    |                                 |
| Type         | meeting / task / event          |
| Date         |                                 |
| Description  |                                 |
| Score        |                                 |
| RawJSON      | النسخة الخام                     |

---

## 6) ReportsCache (اختياري)
| Field        | Description                     |
|--------------|---------------------------------|
| MemberUID    |                                 |
| ReportType   | شهري / سنوي / شامل…             |
| FromDate     |                                 |
| ToDate       |                                 |
| GeneratedAt  |                                 |
| GeneratedBy  |                                 |
| Notes        |                                 |
