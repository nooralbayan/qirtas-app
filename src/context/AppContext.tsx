import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { initialStudentsFromExcel } from '../data/studentsData';

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر';

export interface AttendanceRecord {
  id: string; // e.g. student_1_2024-10-01
  studentId: number;
  date: string;
  status: AttendanceStatus;
  notes: string;
}

function useCloudStorage<T>(key: string, initialValue: T, serverValue?: T): [T, Dispatch<SetStateAction<T>>] {
  // Use localStorage as fallback while loading or offline
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (serverValue != null) return serverValue;
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      const parsed = JSON.parse(item);
      return parsed != null ? parsed : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    if (serverValue != null) {
      setStoredValue(serverValue);
      window.localStorage.setItem(key, JSON.stringify(serverValue));
    }
  }, [serverValue, key]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    try {
      if (key !== 'qirtas_theme' && key !== 'qirtas_currentUser') {
         const userJson = window.localStorage.getItem('qirtas_currentUser');
         if (userJson) {
           try {
             const user = JSON.parse(userJson);
             if (user?.role === 'viewer') {
               alert('عذراً، حسابك للعرض فقط ولا يمكنك إجراء تعديلات.');
               return;
             }
           } catch (e) {}
         }
      }

      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? (value as any)(prev) : value;
        
        // Defer heavy serialization and network tasks to unblock the UI instantly
        setTimeout(() => {
          try {
            // Do not stringify if it's a huge array (like students) to avoid freezing
            if (key !== 'qirtas_students' || (Array.isArray(valueToStore) && valueToStore.length < 100)) {
              window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
          } catch (lsError) {
            console.warn('LocalStorage limit reached', lsError);
          }
          
          // Async save to cloud
          if (key !== 'qirtas_theme' && key !== 'qirtas_currentUser') {
            const cleanKey = key.replace('qirtas_', '');
            
            let payload = valueToStore;
            
            // --- ULTRA FAST DIFFING USING REFERENCES ---
            if (cleanKey === 'students' && Array.isArray(valueToStore) && Array.isArray(prev)) {
              const oldMap = new Map(prev.map((s: any) => [s.id, s]));
              const changedOrNew = valueToStore.filter((s: any) => {
                const oldObj = oldMap.get(s.id);
                // If it's a new reference, it means it was modified or newly added!
                return !oldObj || oldObj !== s;
              });
              
              const newIds = new Set(valueToStore.map((s: any) => s.id));
              const deletedIds = prev.filter((s: any) => !newIds.has(s.id)).map((s: any) => s.id);
              
              if (changedOrNew.length > 0 || deletedIds.length > 0) {
                 payload = {
                   __isDiff: true,
                   upsert: changedOrNew,
                   removeIds: deletedIds
                 };
              } else {
                 return; 
              }
            }
            
            fetch('/api/state/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: cleanKey, value: payload })
            }).catch(console.error);
          }
        }, 10);

        return valueToStore;
      });

    } catch (error) {
      console.error(error);
    }
  }, [key]);

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
  additionalPhone?: string;
  whatsappPhone?: string;
  gender?: 'ذكر' | 'أنثى' | 'غير محدد';
  specialNeeds?: string;
  medicalCondition?: string;
  medication?: string;
  missingItems?: string;
  notes?: string;
  totalFees: number;
  discountAmount?: number;
  discountReason?: string;
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
  paymentMethod: 'نقدي' | 'بطاقة مصرفية' | 'حوالة مصرفية' | 'صك مصدق';
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
  paymentMethod?: 'نقدي' | 'بطاقة مصرفية' | 'حوالة مصرفية' | 'صك مصدق';
}

export interface LessonLog {
  id: string;
  grade: string;
  classRoom: string;
  subject: string;
  teacherName: string;
  lessonTitle: string;
  date: string;
  homework?: string;
  notes?: string;
}

export type UserRole = 'admin' | 'accountant' | 'student_affairs' | 'hr' | 'teacher' | 'parent' | 'viewer';

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: UserRole;
}

export interface RecycleBinItem {
  id: string;
  type: 'student' | 'receipt' | 'expense';
  deletedAt: string;
  data: any;
}

interface AppContextType {
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



const initialReceipts: Receipt[] = [];

const initialTeachers: Teacher[] = [];

const initialExpenses: Expense[] = [];

const defaultSubjects = ['القرآن الكريم', 'التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية'];
const initialGradeSubjects: Record<string, string[]> = {};
Object.keys(initialGradeFees).forEach(g => {
  initialGradeSubjects[g] = [...defaultSubjects];
});

const initialUsers: User[] = [
  { id: '1', username: 'admin', password: '123', name: 'المدير العام', role: 'admin' },
  { id: '2', username: 'acc', password: '123', name: 'المحاسب', role: 'accountant' },
  { id: '3', username: 'std', password: '123', name: 'شؤون الطلبة', role: 'student_affairs' },
  { id: '4', username: 'hr', password: '123', name: 'شؤون الموظفين', role: 'hr' }
];

const initialStudents: Student[] = [];

const initialWithdrawnStudents: WithdrawnStudent[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export type ThemeType = 'light' | 'dark';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [serverState, setServerState] = useState<any>(null);
  // Only block with loading screen if this is the very first time (no local users saved)
  const hasLocalData = !!localStorage.getItem('qirtas_users');
  const [isLoading, setIsLoading] = useState(!hasLocalData);
  // ✅ FIX: Track whether server data has been loaded to prevent
  // migration effects from overwriting MongoDB with stale localStorage data
  const [serverLoaded, setServerLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          // Auto-repair classRooms registry based on students' actual assigned classrooms
          const stateData = data.data;
          if (stateData.students && stateData.classRooms) {
            stateData.students.forEach((s: any) => {
              if (s.grade && s.classRoom) {
                if (!stateData.classRooms[s.grade]) {
                  stateData.classRooms[s.grade] = ['أ'];
                }
                if (!stateData.classRooms[s.grade].includes(s.classRoom)) {
                  stateData.classRooms[s.grade].push(s.classRoom);
                  stateData.classRooms[s.grade].sort();
                }
              }
            });
          }
          setServerState(stateData);
        }
        setIsLoading(false);
        setServerLoaded(true);
      })
      .catch(err => {
        console.error('Failed to fetch cloud state', err);
        setIsLoading(false);
        // Even if server fails, allow local migrations to run
        setServerLoaded(true);
      });
  }, []);

  const serverStudents = (() => {
    const raw = serverState?.students;
    if (!Array.isArray(raw) || raw.length === 0) return undefined;
    return raw.map((s: any) => {
      let cleanStatus: 'مسدد' | 'جزئي' | 'غير مسدد' = 'غير مسدد';
      if (s.paymentStatus === 'مسدد' || String(s.paymentStatus).includes('مسدد')) cleanStatus = 'مسدد';
      else if (s.paymentStatus === 'جزئي' || String(s.paymentStatus).includes('جزئي')) cleanStatus = 'جزئي';

      let cleanGender: 'ذكر' | 'أنثى' | 'غير محدد' = s.gender || 'غير محدد';
      if (cleanGender !== 'ذكر' && cleanGender !== 'أنثى') {
        if (s.nationalId && String(s.nationalId).startsWith('1')) cleanGender = 'ذكر';
        else if (s.nationalId && String(s.nationalId).startsWith('2')) cleanGender = 'أنثى';
      }

      return {
        ...s,
        paymentStatus: cleanStatus,
        gender: cleanGender,
        enrollmentNumber: s.enrollmentNumber || String(s.id),
        nationalId: s.nationalId || '',
        fatherName: s.fatherName || '',
        motherName: s.motherName || '',
      };
    });
  })();

  const [schoolName, setSchoolName] = useCloudStorage('qirtas_schoolName', 'نظام قرطاس المدرسي', serverState?.schoolName);
  const [schoolLogo, setSchoolLogo] = useCloudStorage('qirtas_schoolLogo', '<>', serverState?.schoolLogo);
  const [gradeFees, setGradeFees] = useCloudStorage<Record<string, number>>('qirtas_gradeFees', initialGradeFees, serverState?.gradeFees);
  const [students, setStudents] = useCloudStorage<Student[]>('qirtas_students', initialStudentsFromExcel, serverStudents);
  const [receipts, setReceipts] = useCloudStorage<Receipt[]>('qirtas_receipts', [], Array.isArray(serverState?.receipts) ? serverState.receipts : undefined);
  const [teachers, setTeachers] = useCloudStorage<Teacher[]>('qirtas_teachers', [], Array.isArray(serverState?.teachers) ? serverState.teachers : undefined);
  const [expenses, setExpenses] = useCloudStorage<Expense[]>('qirtas_expenses', [], Array.isArray(serverState?.expenses) ? serverState.expenses : undefined);
  const [gradeSubjects, setGradeSubjects] = useCloudStorage<Record<string, string[]>>('qirtas_gradeSubjects', initialGradeSubjects, serverState?.gradeSubjects);
  const [timetables, setTimetables] = useCloudStorage<Record<string, TimetableEntry[]>>('qirtas_timetables', {}, serverState?.timetables);
  // Normalize server users: ensure they have 'id' and 'password' fields
  const serverUsers = (() => {
    const raw = serverState?.users;
    if (!Array.isArray(raw) || raw.length === 0) return undefined;
    const normalized = raw
      .filter((u: any) => u.username && u.password) // must have both
      .map((u: any) => ({
        id: u.id || (u._id ? String(u._id) : String(Math.random())),
        username: u.username,
        name: u.name || u.username,
        password: u.password,
        role: u.role || 'student_affairs',
      }));
    return normalized.length > 0 ? normalized : undefined;
  })();
  const [users, setUsers] = useCloudStorage<User[]>('qirtas_users', initialUsers, serverUsers);
  const [currentUser, setCurrentUser] = useCloudStorage<User | null>('qirtas_currentUser', null);
  const [classRooms, setClassRooms] = useCloudStorage<Record<string, string[]>>('qirtas_classRooms', initialClassRooms, serverState?.classRooms);
  const [withdrawnStudents, setWithdrawnStudents] = useCloudStorage<WithdrawnStudent[]>('qirtas_withdrawnStudents', initialWithdrawnStudents, serverState?.withdrawnStudents);
  const [recycleBin, setRecycleBin] = useCloudStorage<RecycleBinItem[]>('qirtas_recycleBin', [], serverState?.recycleBin);
  const [studentResults, setStudentResults] = useCloudStorage<Record<string, Record<number, Record<string, string>>>>('qirtas_studentResults', {}, serverState?.studentResults);
  const [theme, setTheme] = useCloudStorage<ThemeType>('qirtas_theme', 'light');
  const [academicYear, setAcademicYear] = useCloudStorage('qirtas_academicYear', '2024 - 2025', serverState?.academicYear);
  const [attendanceRecords, setAttendanceRecords] = useCloudStorage<AttendanceRecord[]>('qirtas_attendanceRecords', [], serverState?.attendanceRecords);
  const [lessonLogs, setLessonLogs] = useCloudStorage<LessonLog[]>('qirtas_lessonLogs', [], serverState?.lessonLogs);

  // Apply theme to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Emergency Vault Cache: Preserves non-empty student lists safely in localStorage
  useEffect(() => {
    if (students && students.length > 0) {
      localStorage.setItem('qirtas_emergency_students_vault', JSON.stringify(students));
    }
  }, [students]);

  // ✅ FIX: Migrate old phone numbers to use +218
  // Only runs AFTER server data is loaded to prevent overwriting MongoDB with stale localStorage data
  useEffect(() => {
    if (!serverLoaded) return; // Wait for cloud data first
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
  }, [serverLoaded]); // ✅ Run only after server state is loaded

  // ✅ FIX: Migration: auto-fill fatherName from student name & default gender
  // Only runs AFTER server data is loaded to prevent overwriting MongoDB with stale localStorage data
  useEffect(() => {
    if (!serverLoaded) return; // Wait for cloud data first
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
  }, [serverLoaded]); // ✅ Run only after server state is loaded

  // ✅ FIX: Auto-repair corrupted/garbled paymentStatus and gender in loaded students list
  useEffect(() => {
    if (!serverLoaded || !students || students.length === 0) return;
    let hasCorrupted = false;
    const sanitizedList = students.map(s => {
      let cleanStatus: 'مسدد' | 'جزئي' | 'غير مسدد' = 'غير مسدد';
      if (s.paymentStatus === 'مسدد' || String(s.paymentStatus).includes('مسدد')) cleanStatus = 'مسدد';
      else if (s.paymentStatus === 'جزئي' || String(s.paymentStatus).includes('جزئي')) cleanStatus = 'جزئي';

      let cleanGender: 'ذكر' | 'أنثى' | 'غير محدد' = s.gender || 'غير محدد';
      if (cleanGender !== 'ذكر' && cleanGender !== 'أنثى') {
        if (s.nationalId && String(s.nationalId).startsWith('1')) cleanGender = 'ذكر';
        else if (s.nationalId && String(s.nationalId).startsWith('2')) cleanGender = 'أنثى';
      }

      if (s.paymentStatus !== cleanStatus || s.gender !== cleanGender) {
        hasCorrupted = true;
      }

      return {
        ...s,
        paymentStatus: cleanStatus,
        gender: cleanGender,
      };
    });

    if (hasCorrupted) {
      setStudents(sanitizedList);
    }
  }, [serverLoaded]);

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
      lessonLogs, setLessonLogs
    }}>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'Cairo' }}>
          <h2>جاري التحميل والمزامنة السحابية...</h2>
        </div>
      ) : children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
