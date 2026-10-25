import {boot} from './shell.js?v=20261025-firebase2';
import {attendancePage} from './attendance.js?v=20261025-firebase2';
boot('morning',ctx=>attendancePage(ctx,'morning'));
