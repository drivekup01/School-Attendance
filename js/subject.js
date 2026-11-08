import {boot} from './shell.js?v=20261108-pp5-4';
import {attendancePage} from './attendance.js?v=20261108-pp5-4';
boot('subject',ctx=>attendancePage(ctx,'subject'));
