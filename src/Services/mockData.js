const STORAGE_KEY = 'students_data';

// ---------------- GET STUDENTS ----------------
const getStudents = async () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// ---------------- ADD STUDENT ----------------
const addStudent = async (student) => {
  const data = localStorage.getItem(STORAGE_KEY);
  const students = data ? JSON.parse(data) : [];

  students.push(student);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  return student;
};

// ---------------- DELETE STUDENT ----------------
const deleteStudent = async (id) => {
  const data = localStorage.getItem(STORAGE_KEY);
  const students = data ? JSON.parse(data) : [];

  const updated = students.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

// ---------------- CLASSES ----------------
const getClasses = async () => {
  return [
    { id: 1, name: '1st' },
    { id: 2, name: '2nd' },
    { id: 3, name: '3rd' },
    { id: 4, name: '4th' },
    { id: 5, name: '5th' },
    { id: 6, name: '6th' },
    { id: 7, name: '7th' },
    { id: 8, name: '8th' },
    { id: 9, name: '9th' },
    { id: 10, name: '10th' }
  ];
};

// ---------------- SECTIONS ----------------
const getSections = async () => {
  return [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
    { id: 3, name: 'C' }
  ];
};

export default {
  getStudents,
  addStudent,
  deleteStudent,
  getClasses,
  getSections
};
