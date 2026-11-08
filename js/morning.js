import {boot} from './shell.js?v=20261031-student1';
import {attendancePage} from './attendance.js?v=20261108-telegram1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
