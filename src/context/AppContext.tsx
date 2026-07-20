import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر';

export interface AttendanceRecord {
  id: string; // e.g. student_1_2024-10-01
  studentId: number;
  date: string;
  status: AttendanceStatus;
  notes: string;
}

export interface LessonLog {
  id: string;
  date: string;
  teacherId: number;
  grade: string;
  classRoom: string;
  subject: string;
  topic: string;
  homework: string;
  type: 'درس' | 'واجب' | 'امتحان';
  imageUrl?: string;
  imageUrls?: string[];
}

export interface StudentEvaluation {
  id: string;
  date: string;
  studentId: number;
  teacherId: number;
  subject: string;
  rating: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
  notes: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: number;
  date: string;
  type: 'إيجابي' | 'سلبي';
  category: string;
  points: number;
  notes: string;
  loggedBy: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'عاجل' | 'عادي' | 'إعلامي';
  target: 'الكل' | 'المعلمين' | 'أولياء الأمور';
  author: string;
}

let isInitializingFromServer = false;

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? (value as any)(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Auto-sync with backend if not currently initializing from it
      if (!isInitializingFromServer) {
        const serverKey = key.replace('qirtas_', '');
        fetch('/api/state/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: serverKey, value: valueToStore })
        }).then(res => {
          if (!res.ok) {
            console.error('Server returned error:', res.status);
            alert('⚠️ فشل حفظ البيانات على السيرفر! يرجى التأكد من اتصالك بالإنترنت وأن السيرفر يعمل بشكل سليم.');
          }
        }).catch(err => {
          console.error('Failed to sync to server', err);
          alert('⚠️ تعذر الاتصال بالسيرفر! يرجى عدم إغلاق الصفحة والمحاولة مرة أخرى.');
        });
      }
      
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export interface Student {
  id: number;
  enrollmentNumber: string;
  nationalId: string;
  name: string;
  photo: string | null;
  birthDate: string;
  grade: string;
  classRoom: string;
  address: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  gender?: 'ذكر' | 'أنثى' | 'غير محدد';
  specialNeeds?: string;
  medicalCondition?: string;
  medication?: string;
  missingItems?: string;
  notes?: string;
  totalFees: number;
  installmentsCount: number;
  paymentStatus: 'مسدد' | 'جزئي' | 'غير مسدد';
  wasWithdrawn?: boolean;
}

export interface WithdrawnStudent {
  id: number;
  studentId: number;
  name: string;
  grade: string;
  classRoom: string;
  withdrawalDate: string;
  reason: string;
  refundAmount: number;
  originalStudent: Student;
}

export interface Receipt {
  id: string;
  studentId: number;
  studentName: string;
  grade: string;
  installmentNo: number;
  totalDue: number;
  paidAmount: number;
  remaining: number;
  paymentMethod: 'نقدي' | 'بطاقة مصرفية' | 'حوالة مصرفية';
  date: string;
}

export interface TimetableEntry {
  day: string;
  periodId: number;
  subject: string;
  teacher: string;
}

export interface Teacher {
  id: number;
  name: string;
  subject: string;
  phone: string;
  nationalId?: string;
  salary: number;
  hireDate: string;
  isAbsent?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  category: 'إيجار' | 'صيانة' | 'رواتب' | 'فواتير' | 'أخرى';
  amount: number;
  date: string;
  notes: string;
}

export type UserRole = 'admin' | 'accountant' | 'student_affairs' | 'hr' | 'viewer';

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: UserRole | 'teacher' | 'parent';
  permissions?: string[];
}

export interface RecycleBinItem {
  id: string;
  type: 'student' | 'receipt' | 'expense';
  deletedAt: string;
  data: any;
}

interface AppContextType {
  isServerLoaded: boolean;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  schoolName: string;
  setSchoolName: (name: string) => void;
  schoolLogo: string;
  setSchoolLogo: (logo: string) => void;
  gradeFees: Record<string, number>;
  setGradeFees: (fees: Record<string, number>) => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  receipts: Receipt[];
  setReceipts: (receipts: Receipt[]) => void;
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  gradeSubjects: Record<string, string[]>;
  setGradeSubjects: (subjects: Record<string, string[]>) => void;
  timetables: Record<string, TimetableEntry[]>;
  setTimetables: (timetables: Record<string, TimetableEntry[]>) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  classRooms: Record<string, string[]>;
  setClassRooms: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  withdrawnStudents: WithdrawnStudent[];
  setWithdrawnStudents: React.Dispatch<React.SetStateAction<WithdrawnStudent[]>>;
  recycleBin: RecycleBinItem[];
  setRecycleBin: React.Dispatch<React.SetStateAction<RecycleBinItem[]>>;
  studentResults: Record<string, Record<number, Record<string, string>>>;
  setStudentResults: React.Dispatch<React.SetStateAction<Record<string, Record<number, Record<string, string>>>>>;
  academicYear: string;
  setAcademicYear: (year: string) => void;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  lessonLogs: LessonLog[];
  setLessonLogs: React.Dispatch<React.SetStateAction<LessonLog[]>>;
  studentEvaluations: StudentEvaluation[];
  setStudentEvaluations: React.Dispatch<React.SetStateAction<StudentEvaluation[]>>;
  behaviorRecords: BehaviorRecord[];
  setBehaviorRecords: React.Dispatch<React.SetStateAction<BehaviorRecord[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  workDaysInMonth: number;
  setWorkDaysInMonth: (days: number) => void;
  refreshFromServer: () => Promise<void>;
}

const initialGradeFees = {
  'KG1': 1000,
  'KG2': 1000,
  'الصف الأول': 1200,
  'الصف الثاني': 1200,
  'الصف الثالث': 1200,
  'الصف الرابع': 1300,
  'الصف الخامس': 1300,
  'الصف السادس': 1300,
  'الصف السابع': 1500,
  'الصف الثامن': 1500,
  'الصف التاسع': 1500,
};

const initialClassRooms: Record<string, string[]> = {};
Object.keys(initialGradeFees).forEach(g => {
  initialClassRooms[g] = ['أ'];
});



const initialReceipts: Receipt[] = [
  { id: 'REC-0001', studentId: 1, studentName: 'أحمد محمد علي', grade: 'الصف الرابع', installmentNo: 1, totalDue: 1300, paidAmount: 1300, remaining: 0, paymentMethod: 'نقدي', date: '2029-09-01' },
];

const initialTeachers: Teacher[] = [
  { id: 1, name: 'أ. محمود خليل', subject: 'رياضيات', phone: '0910000001', salary: 1500, hireDate: '2025-08-15' },
  { id: 2, name: 'أ. ليلى عمر', subject: 'لغة عربية', phone: '0910000002', salary: 1500, hireDate: '2025-08-16' },
];

const initialExpenses: Expense[] = [
  { id: 'EXP-0001', description: 'إيجار المبنى المدرسي', category: 'إيجار', amount: 5000, date: '2029-09-01', notes: 'إيجار شهر 9' },
  { id: 'EXP-0002', description: 'صيانة مكيفات', category: 'صيانة', amount: 300, date: '2029-09-05', notes: 'صيانة 3 مكيفات' },
];

const initialGradeSubjects: Record<string, string[]> = {
  'KG1': ['القرآن الكريم والتربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'اللغة الإنجليزية', 'الأنشطة والمهارات'],
  'KG2': ['القرآن الكريم والتربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'اللغة الإنجليزية', 'الأنشطة والمهارات'],
  'الصف الأول': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'التربية البدنية', 'التربية الفنية والموسيقية'],
  'الصف الثاني': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'التربية البدنية', 'التربية الفنية والموسيقية'],
  'الصف الثالث': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'التربية البدنية', 'التربية الفنية والموسيقية'],
  'الصف الرابع': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'الاجتماعيات', 'الحاسوب', 'التربية البدنية'],
  'الصف الخامس': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'الاجتماعيات', 'الحاسوب', 'التربية البدنية'],
  'الصف السادس': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'الاجتماعيات', 'الحاسوب', 'التربية البدنية'],
  'الصف السابع': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'الحاسوب', 'التربية البدنية'],
  'الصف الثامن': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'الحاسوب', 'التربية البدنية'],
  'الصف التاسع': ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'الحاسوب', 'التربية البدنية']
};

const initialUsers: User[] = [
  { id: '1', username: 'admin', password: '123', name: 'المدير العام', role: 'admin' },
  { id: '2', username: 'acc', password: '123', name: 'المحاسب', role: 'accountant', permissions: ['expenses', 'receipts', 'reports', 'whatsapp'] },
  { id: '3', username: 'std', password: '123', name: 'شؤون الطلبة', role: 'student_affairs', permissions: ['students', 'classrooms', 'withdrawn', 'attendance', 'timetable', 'whatsapp', 'results', 'subjects'] },
  { id: '4', username: 'hr', password: '123', name: 'شؤون الموظفين', role: 'hr', permissions: ['teachers', 'attendance'] }
];

import { initialStudentsFromExcel } from '../data/studentsData';
const initialStudents: Student[] = initialStudentsFromExcel.length > 0 ? initialStudentsFromExcel : [];

const initialWithdrawnStudents: WithdrawnStudent[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export type ThemeType = 'light' | 'dark';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [schoolName, setSchoolNameRaw] = useLocalStorage('qirtas_schoolName', 'نظام قرطاس المدرسي');
  const [schoolLogo, setSchoolLogoRaw] = useLocalStorage('qirtas_schoolLogo', '<>');
  const [gradeFees, setGradeFeesRaw] = useLocalStorage<Record<string, number>>('qirtas_gradeFees', initialGradeFees);
  const [students, setStudentsRaw] = useLocalStorage<Student[]>('qirtas_students', initialStudents);
  const [receipts, setReceiptsRaw] = useLocalStorage<Receipt[]>('qirtas_receipts', initialReceipts);
  const [teachers, setTeachersRaw] = useLocalStorage<Teacher[]>('qirtas_teachers', initialTeachers);
  const [expenses, setExpensesRaw] = useLocalStorage<Expense[]>('qirtas_expenses', initialExpenses);
  const [gradeSubjects, setGradeSubjectsRaw] = useLocalStorage<Record<string, string[]>>('qirtas_gradeSubjects', initialGradeSubjects);
  const [timetables, setTimetablesRaw] = useLocalStorage<Record<string, TimetableEntry[]>>('qirtas_timetables', {});
  const [users, setUsersRaw] = useLocalStorage<User[]>('qirtas_users', initialUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('qirtas_currentUser', null);
  const [classRooms, setClassRoomsRaw] = useLocalStorage<Record<string, string[]>>('qirtas_classRooms', initialClassRooms);
  const [withdrawnStudents, setWithdrawnStudentsRaw] = useLocalStorage<WithdrawnStudent[]>('qirtas_withdrawnStudents', initialWithdrawnStudents);
  const [recycleBin, setRecycleBinRaw] = useLocalStorage<RecycleBinItem[]>('qirtas_recycleBin', []);
  const [studentResults, setStudentResultsRaw] = useLocalStorage<Record<string, Record<number, Record<string, string>>>>('qirtas_studentResults', {});
  const [theme, setTheme] = useLocalStorage<ThemeType>('qirtas_theme', 'light');
  const [academicYear, setAcademicYearRaw] = useLocalStorage('qirtas_academicYear', '2024 - 2025');
  const [attendanceRecords, setAttendanceRecordsRaw] = useLocalStorage<AttendanceRecord[]>('qirtas_attendanceRecords', []);
  const [lessonLogs, setLessonLogsRaw] = useLocalStorage<LessonLog[]>('qirtas_lessonLogs', []);
  const [studentEvaluations, setStudentEvaluationsRaw] = useLocalStorage<StudentEvaluation[]>('qirtas_studentEvaluations', []);
  const [behaviorRecords, setBehaviorRecordsRaw] = useLocalStorage<BehaviorRecord[]>('qirtas_behaviorRecords', []);
  const [announcements, setAnnouncementsRaw] = useLocalStorage<Announcement[]>('qirtas_announcements', []);
  const [workDaysInMonth, setWorkDaysInMonthRaw] = useLocalStorage<number>('qirtas_workDaysInMonth', 22);
  const [isServerLoaded, setIsServerLoaded] = useState(false);

  // ─── Viewer Guard ───────────────────────────────────────────────────
  // Reads current user from localStorage directly to avoid circular deps.
  const isViewer = () => {
    try {
      const u = JSON.parse(window.localStorage.getItem('qirtas_currentUser') || 'null');
      return u?.role === 'viewer';
    } catch { return false; }
  };

  const viewerAlert = () => alert('⛔ هذا الحساب للمشاهدة فقط ولا يملك صلاحية التعديل أو الحذف.');

  const guardSetter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (value: React.SetStateAction<T>) => {
      if (isViewer()) { viewerAlert(); return; }
      setter(value);
    };

  const guardSimple = <T,>(setter: (v: T) => void) =>
    (value: T) => {
      if (isViewer()) { viewerAlert(); return; }
      setter(value);
    };

  // Protected setters
  const setSchoolName = guardSimple(setSchoolNameRaw);
  const setSchoolLogo = guardSimple(setSchoolLogoRaw);
  const setGradeFees = guardSimple(setGradeFeesRaw);
  const setStudents = guardSetter(setStudentsRaw);
  const setReceipts = guardSimple(setReceiptsRaw);
  const setTeachers = guardSimple(setTeachersRaw);
  const setExpenses = guardSimple(setExpensesRaw);
  const setGradeSubjects = guardSimple(setGradeSubjectsRaw);
  const setTimetables = guardSimple(setTimetablesRaw);
  const setUsers = guardSimple(setUsersRaw);
  const setClassRooms = guardSetter(setClassRoomsRaw);
  const setWithdrawnStudents = guardSetter(setWithdrawnStudentsRaw);
  const setRecycleBin = guardSetter(setRecycleBinRaw);
  const setStudentResults = guardSetter(setStudentResultsRaw);
  const setAcademicYear = guardSimple(setAcademicYearRaw);
  const setAttendanceRecords = guardSetter(setAttendanceRecordsRaw);
  const setLessonLogs = guardSetter(setLessonLogsRaw);
  const setStudentEvaluations = guardSetter(setStudentEvaluationsRaw);
  const setBehaviorRecords = guardSetter(setBehaviorRecordsRaw);
  const setAnnouncements = guardSetter(setAnnouncementsRaw);
  const setWorkDaysInMonth = guardSimple(setWorkDaysInMonthRaw);
  // ────────────────────────────────────────────────────────────────────

  const refreshFromServer = async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success && json.data) {
        isInitializingFromServer = true;
        const state = json.data;
        
        if (state.students && state.students.length > 0) {
          if (state.schoolName !== undefined) setSchoolName(state.schoolName);
          if (state.schoolLogo !== undefined) setSchoolLogo(state.schoolLogo);
          if (state.gradeFees !== undefined) setGradeFees(state.gradeFees);
          setStudents(state.students);
          setReceipts(state.receipts || []);
          setTeachers(state.teachers || []);
          setExpenses(state.expenses || []);
          if (state.gradeSubjects) setGradeSubjects(state.gradeSubjects);
          if (state.timetables) setTimetables(state.timetables);
          setUsers(state.users || initialUsers);
          if (state.classRooms) setClassRooms(state.classRooms);
          setWithdrawnStudents(state.withdrawnStudents || []);
          setRecycleBin(state.recycleBin || []);
          if (state.studentResults) setStudentResults(state.studentResults);
          if (state.academicYear) setAcademicYear(state.academicYear);
          setAttendanceRecords(state.attendanceRecords || []);
          setLessonLogs(state.lessonLogs || []);
          setStudentEvaluations(state.studentEvaluations || []);
          setBehaviorRecords(state.behaviorRecords || []);
          setAnnouncements(state.announcements || []);
        }
        
        isInitializingFromServer = false;
      }
    } catch (err) {
      console.error('Failed to fetch server state:', err);
    } finally {
      setIsServerLoaded(true);
    }
  };

  // Fetch from server on mount
  useEffect(() => {
    refreshFromServer();
  }, []);

  // Apply theme to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Migrate old phone numbers to use +218
  useEffect(() => {
    if (!isServerLoaded) return;
    if (!students || students.length === 0) return;
    
    let migrated = false;
    const migratedStudents = students.map(s => {
      let fPhone = s.fatherPhone || '';
      let mPhone = s.motherPhone || '';
      
      const fixPhone = (p: string) => {
        if (!p) return p;
        let cleaned = p.replace(/\s+/g, '').replace(/-/g, '');
        if (cleaned.startsWith('0')) return '+218' + cleaned.slice(1);
        if (cleaned.length > 0 && !cleaned.startsWith('+') && !cleaned.startsWith('218')) {
            if (cleaned.startsWith('9')) return '+218' + cleaned;
        }
        if (cleaned.startsWith('218')) return '+' + cleaned;
        return p;
      };

      const newF = fixPhone(fPhone);
      const newM = fixPhone(mPhone);

      if (newF !== fPhone || newM !== mPhone) {
        migrated = true;
        return { ...s, fatherPhone: newF, motherPhone: newM };
      }
      return s;
    });

    if (migrated) {
      setStudents(migratedStudents);
    }
  }, [isServerLoaded]); // Run after server loads

  // Migration: auto-fill fatherName from student name & default gender
  useEffect(() => {
    if (!isServerLoaded) return;
    if (!students || students.length === 0) return;
    let changed = false;
    const updated = students.map(s => {
      let newFather = s.fatherName;
      let newGender = s.gender || 'غير محدد';
      if (newGender === 'غير محدد' && s.nationalId) {
        if (s.nationalId.startsWith('1')) newGender = 'ذكر';
        else if (s.nationalId.startsWith('2')) newGender = 'أنثى';
      }

      // If fatherName is empty, extract from full name
      if (!s.fatherName || s.fatherName.trim() === '') {
        const parts = s.name.trim().split(/\s+/);
        if (parts.length > 1) {
          newFather = parts.slice(1).join(' ');
          changed = true;
        }
      }
      
      if (s.gender !== newGender) {
        changed = true;
      }
      
      return { ...s, fatherName: newFather, gender: newGender };
    });
    if (changed) setStudents(updated);
  }, [isServerLoaded]); // Run after server loads

  // Migration: force apply Libyan curriculum subjects to existing installations
  useEffect(() => {
    if (!isServerLoaded) return;
    const hasMigratedSubjects = localStorage.getItem('qirtas_migrated_libyan_subjects_v1');
    if (!hasMigratedSubjects) {
      setGradeSubjects(initialGradeSubjects);
      localStorage.setItem('qirtas_migrated_libyan_subjects_v1', 'true');
    }
  }, [isServerLoaded]);

  return (
    <AppContext.Provider value={{
      schoolName, setSchoolName,
      schoolLogo, setSchoolLogo,
      gradeFees, setGradeFees,
      students, setStudents,
      receipts, setReceipts,
      teachers, setTeachers,
      expenses, setExpenses,
      gradeSubjects, setGradeSubjects,
      timetables, setTimetables,
      users, setUsers,
      currentUser, setCurrentUser,
      classRooms, setClassRooms,
      withdrawnStudents, setWithdrawnStudents,
      recycleBin, setRecycleBin,
      studentResults, setStudentResults,
      theme, setTheme,
      academicYear, setAcademicYear,
      attendanceRecords, setAttendanceRecords,
      lessonLogs, setLessonLogs,
      studentEvaluations, setStudentEvaluations,
      behaviorRecords, setBehaviorRecords,
      announcements, setAnnouncements,
      workDaysInMonth, setWorkDaysInMonth,
      isServerLoaded,
      refreshFromServer
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
