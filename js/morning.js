import {boot} from './shell.js?v=20261025-sidebar1';
import {attendancePage} from './attendance.js?v=20261025-sidebar1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
