import {boot} from './shell.js?v=20261030-unified1';
import {attendancePage} from './attendance.js?v=20261028-exchange1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
