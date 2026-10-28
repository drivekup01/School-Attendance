import {boot} from './shell.js?v=20261028-exchange1';
import {attendancePage} from './attendance.js?v=20261028-exchange1';
boot('subject',ctx=>attendancePage(ctx,'subject'));
