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
        }).catch(err => console.error('Failed to sync to server', err));
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

export type UserRole = 'admin' | 'accountant' | 'student_affairs' | 'hr';

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

import { initialStudentsFromExcel } from '../data/studentsData';
const initialStudents: Student[] = initialStudentsFromExcel.length > 0 ? initialStudentsFromExcel : [];

const initialWithdrawnStudents: WithdrawnStudent[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export type ThemeType = 'light' | 'dark';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [schoolName, setSchoolName] = useLocalStorage('qirtas_schoolName', 'نظام قرطاس المدرسي');
  const [schoolLogo, setSchoolLogo] = useLocalStorage('qirtas_schoolLogo', '<>');
  const [gradeFees, setGradeFees] = useLocalStorage<Record<string, number>>('qirtas_gradeFees', initialGradeFees);
  const [students, setStudents] = useLocalStorage<Student[]>('qirtas_students', initialStudents);
  const [receipts, setReceipts] = useLocalStorage<Receipt[]>('qirtas_receipts', initialReceipts);
  const [teachers, setTeachers] = useLocalStorage<Teacher[]>('qirtas_teachers', initialTeachers);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('qirtas_expenses', initialExpenses);
  const [gradeSubjects, setGradeSubjects] = useLocalStorage<Record<string, string[]>>('qirtas_gradeSubjects', initialGradeSubjects);
  const [timetables, setTimetables] = useLocalStorage<Record<string, TimetableEntry[]>>('qirtas_timetables', {});
  const [users, setUsers] = useLocalStorage<User[]>('qirtas_users', initialUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('qirtas_currentUser', null);
  const [classRooms, setClassRooms] = useLocalStorage<Record<string, string[]>>('qirtas_classRooms', initialClassRooms);
  const [withdrawnStudents, setWithdrawnStudents] = useLocalStorage<WithdrawnStudent[]>('qirtas_withdrawnStudents', initialWithdrawnStudents);
  const [recycleBin, setRecycleBin] = useLocalStorage<RecycleBinItem[]>('qirtas_recycleBin', []);
  const [studentResults, setStudentResults] = useLocalStorage<Record<string, Record<number, Record<string, string>>>>('qirtas_studentResults', {});
  const [theme, setTheme] = useLocalStorage<ThemeType>('qirtas_theme', 'light');
  const [academicYear, setAcademicYear] = useLocalStorage('qirtas_academicYear', '2024 - 2025');
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>('qirtas_attendanceRecords', []);

  // Fetch from server on mount
  useEffect(() => {
    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/state');
        const json = await res.json();
        if (json.success && json.data) {
          isInitializingFromServer = true;
          const state = json.data;
          
          if (state.students && state.students.length > 0) {
            // If the server has students, it means it's the source of truth.
            // We should apply all its data, even empty arrays, so deletions sync properly.
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
          }
          
          isInitializingFromServer = false;
        }
      } catch (err) {
        console.error('Failed to fetch server state:', err);
      }
    };
    
    fetchServerState();
  }, []);

  // Apply theme to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Migrate old phone numbers to use +218
  useEffect(() => {
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
  }, []); // Run once on mount

  // Migration: auto-fill fatherName from student name & default gender
  useEffect(() => {
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
  }, []); // Run once on mount

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
      attendanceRecords, setAttendanceRecords
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
