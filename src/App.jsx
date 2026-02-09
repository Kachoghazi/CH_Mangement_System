// App.js - UPDATED WITH ACADEMY CONFIG
import "./App.css";
import React, { useState, useEffect } from "react";
import Sidebar from "./component/Sidebar";
import Dashboard from "./pages/Dashboard";
import StudentList from "./pages/Studentlist";
import NewAdmission from "./pages/NewAdmission";
import MonthWiseStudentList from "./pages/MonthWiseStudentList";
import PromoteStudent from "./pages/PromoteStudent";
import CoursesPage from "./pages/CoursesPage";
import CollectFees from "./pages/CollectFees";
import GetDueFees from "./pages/GetDueFees";
import FeesType from "./pages/FeesType";
import SendSMS from "./pages/SendSMS";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Slip from "./pages/Slip";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [editingStudent, setEditingStudent] = useState(null);
  
  // ✅ Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("currentUser");
    return !!(token && user);
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem("app-theme");
    return savedTheme || "light";
  });

  // ✅ Academy config refresh trigger
  const [academyConfigRefresh, setAcademyConfigRefresh] = useState(0);

  // ✅ Initialize theme on app load
  useEffect(() => {
    applyTheme(currentTheme);
  }, []);

  // ✅ Apply theme to entire app
  const applyTheme = (theme) => {
    document.body.classList.remove("light-theme", "dark-theme", "blue-theme");
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem("app-theme", theme);
  };

  // ✅ Handle Login
  const handleLogin = (userData, token) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    localStorage.setItem("authToken", token);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    
    // Initialize default data for new users
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userExists = users.some(u => u.email === userData.email);
    
    if (!userExists) {
      // Add new user to users list
      const updatedUsers = [...users, userData];
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Add default demo data for new user
      const defaultStudents = [
        { 
          studentId: "CH001", 
          name: "Ali Ahmed", 
          course: "Python Programming", 
          admissionDate: "2025-12-30", 
          feeDue: 5000,
          totalFee: 15000,
          email: "ali@example.com",
          phone: "03123456789",
          fatherName: "Ahmed Khan",
          address: "Karachi, Pakistan",
          status: "Active"
        },
        { 
          studentId: "CH002", 
          name: "Sara Khan", 
          course: "Web Development", 
          admissionDate: "2025-12-30", 
          feeDue: 7000,
          totalFee: 25000,
          email: "sara@example.com",
          phone: "03211234567",
          fatherName: "Khan Sahab",
          address: "Lahore, Pakistan",
          status: "Active"
        },
        { 
          studentId: "CH003", 
          name: "Usman Raza", 
          course: "Data Science", 
          admissionDate: "2025-12-25", 
          feeDue: 0,
          totalFee: 35000,
          email: "usman@example.com",
          phone: "03331234567",
          fatherName: "Raza Ahmed",
          address: "Islamabad, Pakistan",
          status: "Active"
        },
      ];
      
      const defaultCourses = [
        { id: 1, name: "Python Programming", duration: "3 Months", fee: 15000, description: "Complete Python programming course", status: "Active" },
        { id: 2, name: "Web Development", duration: "6 Months", fee: 25000, description: "Full stack web development", status: "Active" },
        { id: 3, name: "Data Science", duration: "8 Months", fee: 35000, description: "Data science with Python and ML", status: "Active" },
        { id: 4, name: "Mobile App Development", duration: "6 Months", fee: 30000, description: "Android & iOS app development", status: "Active" },
        { id: 5, name: "Graphic Design", duration: "4 Months", fee: 20000, description: "Adobe Photoshop & Illustrator", status: "Active" },
      ];
      
      const defaultFees = [
        { id: 1, feeName: "Tuition Fee", amount: 15000, description: "Course tuition fee" },
        { id: 2, feeName: "Exam Fee", amount: 2000, description: "Examination charges" },
        { id: 3, feeName: "Library Fee", amount: 1000, description: "Library membership" },
        { id: 4, feeName: "Lab Fee", amount: 5000, description: "Laboratory charges" },
        { id: 5, feeName: "Registration Fee", amount: 3000, description: "One-time registration" },
      ];
      
      const defaultStudentFees = [
        { id: 1, studentId: "CH001", studentName: "Ali Ahmed", course: "Python Programming", feeType: "Tuition Fee", amount: 15000, paid: 10000, due: 5000, date: "2025-12-01", status: "Partially Paid" },
        { id: 2, studentId: "CH002", studentName: "Sara Khan", course: "Web Development", feeType: "Tuition Fee", amount: 25000, paid: 18000, due: 7000, date: "2025-12-05", status: "Partially Paid" },
        { id: 3, studentId: "CH003", studentName: "Usman Raza", course: "Data Science", feeType: "Tuition Fee", amount: 35000, paid: 35000, due: 0, date: "2025-12-10", status: "Paid" },
      ];
      
      localStorage.setItem("students", JSON.stringify(defaultStudents));
      localStorage.setItem("courses", JSON.stringify(defaultCourses));
      localStorage.setItem("feeTypes", JSON.stringify(defaultFees));
      localStorage.setItem("studentFees", JSON.stringify(defaultStudentFees));
    }
    
    setActiveMenu("dashboard");
  };

  // ✅ Handle Logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      setActiveMenu("dashboard");
    }
  };

  // ✅ Handle Update Profile
  const handleUpdateProfile = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    
    // Update in users list
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map(user => 
      user.id === updatedUser.id ? { ...user, ...updatedUser } : user
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));
  };

  // ✅ Handle Academy Config Update
  const handleAcademyConfigUpdate = () => {
    setAcademyConfigRefresh(prev => prev + 1);
  };

  // ✅ Handle Account Switching
  const handleSwitchAccount = (user) => {
    if (window.confirm(`Switch to ${user.name}'s account?`)) {
      // Generate new token for switched user
      const token = btoa(`${user.email}:${Date.now()}`);
      
      // Update state using setCurrentUser
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("authToken", token);
      
      // Show success message
      alert(`Switched to ${user.name}'s account!`);
      
      // Reload dashboard
      setActiveMenu("dashboard");
    }
  };

  // ✅ Load initial data
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem("students");
    if (saved) {
      return JSON.parse(saved);
    } else {
      // Default students if none exist
      return [
        { 
          studentId: "CH001", 
          name: "Ali Ahmed", 
          course: "Python Programming", 
          admissionDate: "2025-12-30", 
          feeDue: 5000,
          totalFee: 15000,
          email: "ali@example.com",
          phone: "03123456789",
          fatherName: "Ahmed Khan",
          address: "Karachi, Pakistan",
          status: "Active"
        },
        { 
          studentId: "CH002", 
          name: "Sara Khan", 
          course: "Web Development", 
          admissionDate: "2025-12-30", 
          feeDue: 7000,
          totalFee: 25000,
          email: "sara@example.com",
          phone: "03211234567",
          fatherName: "Khan Sahab",
          address: "Lahore, Pakistan",
          status: "Active"
        },
      ];
    }
  });

  const [fees, setFees] = useState(() => {
    const saved = localStorage.getItem("feeTypes");
    return saved ? JSON.parse(saved) : [
      { id: 1, feeName: "Tuition Fee", amount: 15000, description: "Course tuition fee" },
      { id: 2, feeName: "Exam Fee", amount: 2000, description: "Examination charges" },
      { id: 3, feeName: "Library Fee", amount: 1000, description: "Library membership" },
      { id: 4, feeName: "Lab Fee", amount: 5000, description: "Laboratory charges" },
    ];
  });

  const [studentFees, setStudentFees] = useState(() => {
    const saved = localStorage.getItem("studentFees");
    return saved ? JSON.parse(saved) : [];
  });

  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem("courses");
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "Python Programming", duration: "3 Months", fee: 15000, description: "Complete Python programming course", status: "Active" },
      { id: 2, name: "Web Development", duration: "6 Months", fee: 25000, description: "Full stack web development", status: "Active" },
      { id: 3, name: "Data Science", duration: "8 Months", fee: 35000, description: "Data science with Python and ML", status: "Active" },
    ];
  });

  const [systemSettings, setSystemSettings] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("systemSettings") || "{}");
    const defaultSettings = {
      academyName: "Academy Dashboard",
      currency: "₹",
      dateFormat: "DD/MM/YYYY",
      receiptFooter: "Thank you for choosing our Academy!",
      enableNotifications: true,
      theme: currentTheme,
      autoGenerateId: true,
      receiptPrefix: "CH",
      academyAddress: "",
      academyPhone: "",
      academyEmail: "",
      taxRate: 13,
      smsApiKey: "",
      smsSenderId: "ACADEMY",
      enableEmailNotifications: true,
      enableSMSNotifications: true
    };
    return { ...defaultSettings, ...saved };
  });

  // ✅ Save to localStorage
  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("feeTypes", JSON.stringify(fees));
  }, [fees]);

  useEffect(() => {
    localStorage.setItem("studentFees", JSON.stringify(studentFees));
  }, [studentFees]);

  useEffect(() => {
    localStorage.setItem("courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("systemSettings", JSON.stringify(systemSettings));
  }, [systemSettings]);

  // ✅ When systemSettings theme changes, update currentTheme
  useEffect(() => {
    if (systemSettings.theme && systemSettings.theme !== currentTheme) {
      setCurrentTheme(systemSettings.theme);
      applyTheme(systemSettings.theme);
    }
  }, [systemSettings.theme]);

  // ✅ Function to handle Collect Fees navigation
  const handleCollectFees = (student) => {
    setEditingStudent(student);
    setActiveMenu("collect-fees");
  };

  // ✅ Function to go back to dashboard from CollectFees
  const handleBackToDashboard = () => {
    setActiveMenu("dashboard");
    setEditingStudent(null);
  };

  // ✅ Modified addStudent function to navigate to dashboard
  const addStudent = (student) => {
    const index = students.findIndex(s => s.studentId === student.studentId);

    let updatedStudents;
    if (index !== -1) {
      updatedStudents = [...students];
      updatedStudents[index] = student;
      alert("✅ Student updated successfully!");
    } else {
      // Auto-generate student ID if enabled
      const newStudent = systemSettings.autoGenerateId 
        ? {
            ...student,
            studentId: `${systemSettings.receiptPrefix}${(students.length + 1).toString().padStart(3, '0')}`
          }
        : student;
      
      updatedStudents = [...students, newStudent];
      alert("✅ Student added successfully!");
    }

    setStudents(updatedStudents);
    setEditingStudent(null);
    setActiveMenu("dashboard");
  };

  // ✅ Function to update system settings with theme change
  const handleSetSystemSettings = (newSettings) => {
    setSystemSettings(newSettings);
    
    if (newSettings.theme && newSettings.theme !== currentTheme) {
      setCurrentTheme(newSettings.theme);
      applyTheme(newSettings.theme);
    }
  };

  // ✅ Function to handle back to dashboard from NewAdmission
  const handleBackToDashboardFromNewAdmission = () => {
    setActiveMenu("dashboard");
    setEditingStudent(null);
  };

  // ✅ Render content based on activeMenu (only when authenticated)
  const renderContent = () => {
    const commonProps = { 
      systemSettings,
      currentUser,
      academyName: systemSettings.academyName 
    };
    
    switch (activeMenu) {
      case "dashboard":
        return (
          <Dashboard
            students={students}
            setStudents={setStudents}
            setActiveMenu={setActiveMenu}
            setEditingStudent={setEditingStudent}
            onCollectFees={handleCollectFees}
            studentFees={studentFees}
            fees={fees}
            courses={courses}
            refreshTrigger={academyConfigRefresh}
            {...commonProps}
          />
        );

      case "new-admission":
        return (
          <NewAdmission
            addStudent={addStudent}
            editingStudent={editingStudent}
            courses={courses}
            systemSettings={systemSettings}
            onComplete={handleBackToDashboardFromNewAdmission}
            {...commonProps}
          />
        );

      case "student-list":
        return (
          <StudentList
            students={students}
            setStudents={setStudents}
            setEditingStudent={setEditingStudent}
            setActiveMenu={setActiveMenu}
            onCollectFees={handleCollectFees}
            systemSettings={systemSettings}
            courses={courses}
            {...commonProps}
          />
        );

      case "monthwise-student-list":
        return (
          <MonthWiseStudentList
            students={students}
            courses={courses}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "collect-fees":
        return (
          <CollectFees
            student={editingStudent}
            students={students}
            setStudents={setStudents}
            studentFees={studentFees}
            setStudentFees={setStudentFees}
            onBack={handleBackToDashboard}
            fees={fees}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "promote-student":
        return (
          <PromoteStudent
            students={students}
            setStudents={setStudents}
            setEditingStudent={setEditingStudent}
            setActiveMenu={setActiveMenu}
            studentFees={studentFees}
            courses={courses}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "class":
        return (
          <CoursesPage 
            courses={courses} 
            setCourses={setCourses}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "fees-type":
        return (
          <FeesType 
            fees={fees} 
            setFees={setFees}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "due-fees":
        return (
          <GetDueFees
            students={students}
            studentFees={studentFees}
            setStudentFees={setStudentFees}
            fees={fees}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "send-sms":
        return (
          <SendSMS 
            students={students} 
            studentFees={studentFees}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "reports":
        return (
          <Reports
            students={students}
            studentFees={studentFees}
            fees={fees}
            courses={courses}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "slip":
        return (
          <Slip 
            students={students}
            studentFees={studentFees}
            systemSettings={systemSettings}
            {...commonProps}
          />
        );

      case "settings":
        return (
          <Settings 
            fees={fees}
            setFees={setFees}
            setStudents={setStudents}
            setStudentFees={setStudentFees}
            systemSettings={systemSettings}
            setSystemSettings={handleSetSystemSettings}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
            applyTheme={applyTheme}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );

      case "profile":
        return (
          <Profile
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onUpdateProfile={handleUpdateProfile}
            onSwitchAccount={handleSwitchAccount}
            onLogout={handleLogout}
            systemSettings={systemSettings}
            onAcademyConfigUpdate={handleAcademyConfigUpdate}
          />
        );

      default:
        return (
          <Dashboard
            students={students}
            setStudents={setStudents}
            setActiveMenu={setActiveMenu}
            setEditingStudent={setEditingStudent}
            onCollectFees={handleCollectFees}
            studentFees={studentFees}
            fees={fees}
            courses={courses}
            refreshTrigger={academyConfigRefresh}
            {...commonProps}
          />
        );
    }
  };

  // ✅ If not authenticated, show login/signup page
  if (!isAuthenticated) {
    return (
      <div className={`app ${currentTheme}-theme`}>
        <Login onLogin={handleLogin} systemSettings={systemSettings} />
      </div>
    );
  }

  // ✅ Main app layout (when authenticated)
  return (
    <div className={`app ${currentTheme}-theme`}>
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        setEditingStudent={setEditingStudent}
        collapsed={false}
        academyName={systemSettings.academyName}
        currentTheme={currentTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;