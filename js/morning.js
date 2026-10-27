import {boot} from './shell.js?v=20261027-catalog1';
import {attendancePage} from './attendance.js?v=20261027-catalog1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
