# Student workspace UI

Version: 20261031-student1. All six pages load one local bundle (styles/student-workspace.css) and the shared Portal design tokens/font (shared/school-ui.css). Old theme.css, sidebar.css and attendance-base.css are retired.

Edit css/student-workspace.css for the shell and source component CSS for page layout. Build with the pinned tool in the sibling School-Portal repository:

    node ../School-Portal/tools/ui-build/build.cjs .

Run node scripts/pages.mjs to regenerate the HTML from scripts/student-page.tpl. All pages retain Apple installation metadata. js/shell.js owns the responsive drawer. Within an iframe, student-embedded hides its own shell so the Portal supplies the only menu and header. Printed behavior forms remain in js/behavior-print.js with their original document styles.

Portal/scripts/sync-attendance.py mirrors static UI including styles/, and prunes removed CSS/JS files only. It never prunes records or images. Publish this source first, then publish Portal's mirrored UI and navigation cache versions.
