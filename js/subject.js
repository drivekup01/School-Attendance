import {boot} from './shell.js?v=20261027-roles1';
import {attendancePage} from './attendance.js?v=20261027-roles1';
boot('subject',ctx=>attendancePage(ctx,'subject'));
