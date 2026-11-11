import {boot} from './shell.js?v=20261111-transfer1';
import {attendancePage} from './attendance.js?v=20261110-notify1';
boot('subject',ctx=>attendancePage(ctx,'subject'));
