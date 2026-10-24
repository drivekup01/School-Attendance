import {boot} from './shell.js';
import {attendancePage} from './attendance.js';
boot('morning',ctx=>attendancePage(ctx,'morning'));
