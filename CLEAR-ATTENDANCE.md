# Clear attendance for a classroom and date

Admin workspace exposes a preview followed by an explicit confirmation. Scope is a classroom ID, Bangkok date, and morning/subject/all. The preview counts both shared morning marks and matching legacy/inactive assignments, with no writes. The commit requires the exact snapshot token; changes require a fresh preview.

`attendanceAdmin` checks administrator rights on entry and inside every transaction. Transactions clear at most 180 marks (360 mark/history writes plus audit), preserve immutable history, advance revisions and record actor/date/scope/count in `attendance_admin_audit`. Larger operations stop visibly on failure or role revocation; the UI shows how many were cleared and asks for a fresh preview of what remains.

Current marks use the server-only `cleared` state. They appear as unrecorded, never absent. Student summaries, overview and term reports already ignore unsupported attendance statuses. Browser raw sessions retain revisions but omit cleared marks. Shared morning sessions include clearance in their revision hash so stale screens cannot overwrite a reset; teachers can reload and record new statuses normally. No rule grants were broadened. Rosters, assignments, other dates/classes, behavior scores and SGS grades are untouched.

No production attendance is cleared during implementation or deployment. Only an administrator's explicit confirmation in the live UI performs a reset.
