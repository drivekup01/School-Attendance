import {boot} from './shell.js?v=20261108-block1';
import {attendancePage} from './attendance.js?v=20261108-block1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
