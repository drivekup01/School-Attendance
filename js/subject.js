import {boot} from './shell.js?v=20261025-firebase2';
import {attendancePage} from './attendance.js?v=20261025-firebase2';
boot('subject',ctx=>attendancePage(ctx,'subject'));
