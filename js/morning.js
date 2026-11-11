import {boot} from './shell.js?v=20261111-transfer1';
import {attendancePage} from './attendance.js?v=20261110-notify1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
