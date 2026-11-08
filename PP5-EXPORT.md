# ปพ.5 attendance export

The semester subject report's **Excel ปพ.5** action uses the layout of the supplied `ม.5 ปพ.5 Reading.xlsx`: Angsana New, A4 portrait, student rows, five weeks per sheet, month/day/date/cumulative-period headers, and a final-page time summary. CSV remains a flat summary.

`js/pp5-model.js` is the shared data/layout/formula model. `js/pp5-export.js` writes it with the existing ExcelJS browser runtime. No original students, attendance marks, dates, holidays, course credit, or filled example workbook are published as assets.

- Dates, course code, teachers, roster, planned periods and effective attendance come from `attendanceTermReport`.
- Sheet count is `ceil(calendarWeeks / 5)`; a configured 27-week semester needs six sheets per classroom. Extra weeks are never truncated to 20.
- Each consecutive block uses one marker and the latest status for the entire block. Nonconsecutive blocks on the same day receive distinct subcolumns.
- Cumulative period headers are separate from actual school-period numbers. Hidden numeric weight rows hold the actual number of periods in each block. Bounded `SUMIF` formulas total the markers across all pages; there is no fixed `COUNTIF * 2` or fixed 34-period total.
- `/` present, `ส` late, `ป` known sick leave, `ล` known personal leave. Existing generic leave is shown separately as `ลา`; its type is never inferred from a note or guessed. Unknown future or unchecked marks stay blank.
- The final time-remaining column subtracts absence only. It is not a claim that every remaining period has been recorded as attended. The register includes that distinction in its footer.
- Credit is optional because the current course registry does not contain it. The report has a local credit input for the exported header; it does not mutate the course registry.
- Conflicting checks, inconsistent totals and Saturday/Sunday lessons outside the Monday–Friday template stop export instead of silently losing data.
- Every sheet has an explicit A4 print area, no styled rows through row 1000, a hidden weight row and formula cached results for immediate opening. Original source history is never edited by export.

The private review artifact for the current Reading course was authored with the bundled artifact spreadsheet tool and verified by rendering all sheets. Its XML-only print/hidden-row/rotation settings were applied separately because those settings are not exposed by that authoring API. Real roster artifacts remain outside these public repositories.
