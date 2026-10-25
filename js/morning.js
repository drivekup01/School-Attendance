import {boot} from './shell.js?v=20261025-navigation1';
import {attendancePage} from './attendance.js?v=20261025-date1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
