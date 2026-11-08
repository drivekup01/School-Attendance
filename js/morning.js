import {boot} from './shell.js?v=20261108-pp5-1';
import {attendancePage} from './attendance.js?v=20261108-pp5-1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
