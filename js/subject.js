import {boot} from './shell.js';
import {attendancePage} from './attendance.js';
boot('subject',ctx=>attendancePage(ctx,'subject'));
