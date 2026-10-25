import {boot} from './shell.js?v=20261025-overview1';
import {attendancePage} from './attendance.js?v=20261025-date1';
boot('subject',ctx=>attendancePage(ctx,'subject'));
