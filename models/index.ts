// User model with discriminators (single collection for all user types)
export {
  default as User,
  User as UserModel,
  Admin,
  Teacher,
  Student,
  isAdmin,
  isTeacher,
  isStudent,
  type IUserBase,
  type IUser,
  type IAdmin,
  type ITeacher,
  type IStudent,
  type UserRole,
  type Gender,
  type AdminLevel,
  type UserBaseModel,
  type AdminModel,
  type TeacherModel,
  type StudentModel,
  type IUserMethods,
} from './User';

// Domain models
export { Course, type ICourse, type CourseModel } from './Course';
export { Batch, type IBatch, type BatchModel, type DayOfWeek } from './Batch';
export {
  Enrollment,
  type IEnrollment,
  type EnrollmentModel,
  type EnrollmentStatus,
  type IInstallment,
} from './Enrollments';
export {
  TeacherAssignment,
  type ITeacherAssignment,
  type TeacherAssignmentModel,
  type RoleInBatch,
} from './TeacherAssignment';
export {
  Assignment,
  type IAssignment,
  type AssignmentModel,
  type AssignmentType,
} from './Assignment';
export {
  Submission,
  type ISubmission,
  type SubmissionModel,
  type SubmissionStatus,
  type IGrade,
} from './Submission';
export {
  Attendance,
  type IAttendance,
  type AttendanceModel,
  type AttendanceStatus,
  type IAttendanceRecord,
} from './Student_attendance';
export {
  Announcement,
  type IAnnouncement,
  type AnnouncementModel,
  type AnnouncementPriority,
  type AnnouncementCategory,
} from './Announcement';
export {
  FeeStructure,
  type IFeeStructure,
  type FeeStructureModel,
  type IInstallmentPlan,
} from './FeeStructure';
export {
  Payment,
  type IPayment,
  type PaymentModel,
  type PaymentMethod,
  type PaymentStatus,
  type PaymentType,
} from './Payment';
export {
  TeacherAttendance,
  type ITeacherAttendance,
  type TeacherAttendanceModel,
  type TeacherAttendanceStatus,
} from './Teacher_attendance';
export {
  StudentApplication,
  type IStudentApplication,
  type StudentApplicationModel,
  type ApplicationStatus,
} from './Student_applications';
