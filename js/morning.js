import {boot} from './shell.js?v=20261026-adminall1';
import {attendancePage} from './attendance.js?v=20261026-adminall1';
boot('morning',ctx=>attendancePage(ctx,'morning'));
