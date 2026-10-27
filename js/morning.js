import {boot} from './shell.js?v=20261027-roles1';
import {attendancePage} from './attendance.js?v=20261027-roles1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
