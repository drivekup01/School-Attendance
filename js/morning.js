import {boot} from './shell.js?v=20261027-home1';
import {attendancePage} from './attendance.js?v=20261027-home1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
