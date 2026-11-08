# ปพ.5 attendance export

The semester subject report's **Excel ปพ.5** action uses the layout of the supplied `ม.5 ปพ.5 Reading.xlsx`: Angsana New 16 pt bold, A4 portrait, student rows, five weeks per sheet, month/day/date/cumulative-period headers, and a final-page time summary. CSV remains a flat summary.

`js/pp5-model.js` is the shared data/layout/formula model. `js/pp5-export.js` writes it with the existing ExcelJS browser runtime. No original students, attendance marks, dates, holidays, course credit, or filled example workbook are published as assets.

- Dates, code, teachers and planned periods come from the main weekly timetable. `attendanceTermReport` excludes substitute/exchange jobs and any off-plan historical lessons; it merges only ordinary marks on base slots and explicit retrospective entries. `attendanceSpecialReport` returns exchange/substitute marks separately for the course owner.
- Teachers explicitly choose a base date and period in the current term to save retrospective statuses; no special marks are copied automatically. Writes use server-only `attendance_regular_sessions` with revisions/history and idempotent receipts. Raw special records remain unchanged.
- Schedule columns have uniform width 3.6, with fixed daily subcolumn counts across all weeks. Rotated cumulative-period ranges have 58-point rows. Medium borders mark the outer frame, header boundary and week boundaries; interior cells use thin borders.
- PP5 uses exactly 20 calendar weeks anchored to Monday of the opening week: four sheets per classroom, five weeks per sheet. Lessons and histories are clipped and totals recomputed for export only. UI tables and CSV retain the full semester.
- Course selection groups actual code and name; eligible rooms combine in one file. Missing or ambiguous codes stay isolated by room. Backend authorization remains per teacher and class. Sheet names include level and room.
- Week/month/day labels stay horizontal. Only numeric date and cumulative-period cells rotate up (90 degrees), with fitted row heights.
- Summary formulas include cached numeric results (including zero), integer number formats and automatic recalculation. Counts are weighted by actual periods across all four sheets. They are attendance reports only and never update SGS grades.
- The report page separates main PP5, exchange/substitute references, manual retrospective entry, and date-range exports. Hidden report forms load catalogs only on first use.
- Each consecutive block uses one marker and the latest status for the entire block. Nonconsecutive blocks on the same day receive distinct subcolumns.
- Cumulative period headers are separate from actual school-period numbers. Hidden numeric weight rows hold the actual number of periods in each block. Bounded `SUMIF` formulas total the markers across all pages; there is no fixed `COUNTIF * 2` or fixed 34-period total.
- `/` present, `ส` late, `ป` known sick leave, `ล` known personal leave. Existing generic leave is shown separately as `ลา`; its type is never inferred from a note or guessed. Unknown future or unchecked marks stay blank.
- The final time-remaining column subtracts absence only. It is not a claim that every remaining period has been recorded as attended. No details are printed below the student table.
- Credit is optional because the current course registry does not contain it. The report has a local credit input for the exported header; it does not mutate the course registry.
- Conflicting checks, inconsistent totals and Saturday/Sunday lessons outside the Monday–Friday template stop export instead of silently losing data.
- Every sheet has an explicit A4 print area, no styled rows through row 1000, a hidden weight row and formula cached results for immediate opening. Original source history is never edited by export.

The private review artifact for the current Reading course was authored with the bundled artifact spreadsheet tool and verified by rendering all sheets. Its XML-only print/hidden-row settings were applied separately because those settings are not exposed by that authoring API. Real roster artifacts remain outside these public repositories.
