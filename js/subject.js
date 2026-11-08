import {boot} from './shell.js?v=20261108-pp5-3';
import {attendancePage} from './attendance.js?v=20261108-pp5-3';
boot('subject',ctx=>attendancePage(ctx,'subject'));
