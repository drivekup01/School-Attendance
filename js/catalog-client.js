export function visibleAssignments(assignments,user){
 if(['admin','viewer'].includes(user.attendanceRole||user.role))return assignments;
 return assignments.filter(a=>a.kind==='morning'?(user.teacherId&&a.teacherIds?.includes(user.teacherId)):a.teacherUid===user.uid||user.teacherId&&a.teacherId===user.teacherId);
}
export function historicalLessons(assignments,classes,user){
 const ids=new Set(classes.map(c=>c.id)),all=['admin','viewer'].includes(user.attendanceRole||user.role);
 return assignments.filter(a=>a.kind!=='morning'&&ids.has(a.classId)&&(all||a.teacherUid===user.uid));
}
