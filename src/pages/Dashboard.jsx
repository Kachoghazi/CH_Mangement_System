// pages/Dashboard.jsx - COMPLETE FIXED CODE
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { 
  Eye, Edit, Trash2, DollarSign, User, Book, 
  Calendar, Phone, MapPin, ArrowRight, TrendingUp, 
  TrendingDown, CheckCircle, XCircle, LogOut, GraduationCap,
  Filter, Search, Download, ChevronDown, ChevronUp,
  Plus, Minus, Settings, CreditCard, Users, BarChart3,
  PieChart, RefreshCw, CalendarDays, AlertCircle, Shield,
  Mail, Home, Clock, Award, Target, Wallet, FileText,
  Building, Image, Bell, Tag, Upload
} from "lucide-react";

// Import academy config
import { getAcademyConfig } from "../config/academyConfig";

const Dashboard = ({ 
  students = [], 
  setActiveMenu = () => {},
  setEditingStudent = () => {},
  setStudents = () => {},
  onCollectFees = () => {},
  refreshTrigger = 0,
  forceRefresh = () => {}
}) => {
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [tempStatus, setTempStatus] = useState("");
  
  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Academy configuration
  const [academyConfig, setAcademyConfig] = useState(getAcademyConfig());
  
  // Refresh academy config when triggered
  useEffect(() => {
    setAcademyConfig(getAcademyConfig());
  }, [refreshTrigger]);
  
  // State to store actual students data
  const [dashboardStudents, setDashboardStudents] = useState(students);
  
  // File input ref for import
  const fileInputRef = useRef(null);
  
  // Sync students from localStorage when component mounts or when students prop changes
  useEffect(() => {
    const syncStudents = () => {
      try {
        const storedStudents = JSON.parse(localStorage.getItem('students') || '[]');
        
        if (storedStudents.length > 0 && JSON.stringify(storedStudents) !== JSON.stringify(dashboardStudents)) {
          setDashboardStudents(storedStudents);
          if (setStudents) {
            setStudents(storedStudents);
          }
        }
      } catch (error) {
        console.error("Error syncing students from localStorage:", error);
      }
    };
    
    syncStudents();
    
    if (students && students.length > 0) {
      setDashboardStudents(students);
    }
  }, [students, refreshTrigger, setStudents]);
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  
  // Custom year management
  const [showYearSettings, setShowYearSettings] = useState(false);
  const [customYears, setCustomYears] = useState(() => {
    const saved = localStorage.getItem("customYears");
    if (saved) return JSON.parse(saved);
    
    const defaultYears = ["all", 2021, 2022, 2023, 2024, 2025];
    if (!defaultYears.includes(currentYear)) {
      defaultYears.push(currentYear);
      defaultYears.sort((a, b) => {
        if (a === "all") return -1;
        if (b === "all") return 1;
        return b - a;
      });
    }
    return defaultYears;
  });
  const [newYear, setNewYear] = useState("");

  // Months array
  const months = useMemo(() => [
    { value: currentMonth, name: `${currentMonthName} (Current)` },
    { value: "all", name: "All Months" },
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" }
  ], [currentMonth, currentMonthName]);

  // State for month-wise fees card
  const [selectedMonthForFees, setSelectedMonthForFees] = useState(currentMonth);
  const [selectedYearForFees, setSelectedYearForFees] = useState(currentYear);

  // Get unique courses from ALL students
  const uniqueCourses = useMemo(() => {
    const courseSet = new Set();
    dashboardStudents.forEach(student => {
      if (student.course && student.course.trim() !== "") {
        courseSet.add(student.course.trim());
      }
    });
    return ["all", ...Array.from(courseSet)];
  }, [dashboardStudents]);

  const uniqueStatuses = ["all", "Active", "Inactive", "Left", "Passout"];

  // Extract month and year from admissionMonth
  const extractMonthYear = useCallback((admissionMonth) => {
    if (!admissionMonth || admissionMonth.trim() === "") {
      return { month: null, year: null };
    }
    
    const monthNames = ["january", "february", "march", "april", "may", "june", 
                       "july", "august", "september", "october", "november", "december"];
    const monthShortNames = ["jan", "feb", "mar", "apr", "may", "jun", 
                            "jul", "aug", "sep", "oct", "nov", "dec"];
    
    const lowerStr = admissionMonth.toLowerCase().trim();
    let foundMonth = null;
    let foundYear = null;
    
    const yearMatch = lowerStr.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      foundYear = parseInt(yearMatch[1]);
    }
    
    for (let i = 0; i < monthNames.length; i++) {
      if (lowerStr.includes(monthNames[i])) {
        foundMonth = i + 1;
        break;
      }
    }
    
    if (!foundMonth) {
      for (let i = 0; i < monthShortNames.length; i++) {
        if (lowerStr.includes(monthShortNames[i])) {
          foundMonth = i + 1;
          break;
        }
      }
    }
    
    if (!foundMonth) {
      const numMatch = lowerStr.match(/(\d{1,2})[\/\-](\d{4})/);
      if (numMatch) {
        foundMonth = parseInt(numMatch[1]);
        foundYear = parseInt(numMatch[2]);
      } else {
        const reverseMatch = lowerStr.match(/(\d{4})[\/\-](\d{1,2})/);
        if (reverseMatch) {
          foundYear = parseInt(reverseMatch[1]);
          foundMonth = parseInt(reverseMatch[2]);
        }
      }
    }
    
    if (foundMonth && !foundYear) {
      const anyYearMatch = admissionMonth.match(/\b(\d{4})\b/);
      if (anyYearMatch) {
        foundYear = parseInt(anyYearMatch[1]);
      } else {
        foundYear = currentYear;
      }
    }
    
    if (foundMonth && (foundMonth < 1 || foundMonth > 12)) {
      foundMonth = null;
    }
    
    return { month: foundMonth, year: foundYear };
  }, [currentYear]);

  // Save custom years to localStorage
  useEffect(() => {
    localStorage.setItem("customYears", JSON.stringify(customYears));
  }, [customYears]);

  // Listen for storage changes to sync data
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedStudents = JSON.parse(localStorage.getItem('students') || '[]');
        if (JSON.stringify(storedStudents) !== JSON.stringify(dashboardStudents)) {
          setDashboardStudents(storedStudents);
          if (setStudents) {
            setStudents(storedStudents);
          }
        }
      } catch (error) {
        console.error("Error syncing from storage change:", error);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dashboardStudents, setStudents]);

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    try {
      const storedStudents = JSON.parse(localStorage.getItem('students') || '[]');
      setDashboardStudents(storedStudents);
      if (setStudents) {
        setStudents(storedStudents);
      }
      if (forceRefresh) {
        forceRefresh();
      }
    } catch (error) {
      console.error("Error manually refreshing:", error);
    }
  }, [setStudents, forceRefresh]);

  // Handle Excel file import
  const handleImportExcel = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        if (jsonData.length === 0) {
          alert("The Excel file is empty!");
          return;
        }

        // Map Excel data to student format
        const importedStudents = jsonData.map((row, index) => {
          // Check for different possible column names
          const studentId = row["Student ID"] || row["studentId"] || row["ID"] || `IMP-${Date.now()}-${index}`;
          const name = row["Name"] || row["name"] || row["Student Name"] || "";
          const fatherName = row["Father's Name"] || row["fatherName"] || row["Father Name"] || row["Parent Name"] || "";
          const course = row["Course"] || row["course"] || row["Program"] || "";
          const admissionDate = row["Admission Date"] || row["admissionDate"] || row["Date"] || new Date().toISOString().split('T')[0];
          const admissionMonth = row["Fees Month"] || row["admissionMonth"] || row["Month"] || "";
          const status = row["Status"] || row["status"] || "Active";
          const gender = row["Gender"] || row["gender"] || "Other";
          const phone = row["Phone"] || row["phone"] || row["Mobile"] || row["Contact"] || "";
          const totalFees = parseFloat(row["Total Fees"] || row["totalFees"] || row["Fees"] || row["Course Fee"] || row["courseFee"] || 0);
          const paid = parseFloat(row["Paid"] || row["paid"] || row["Total Paid"] || row["tuitionPaid"] || 0);
          const due = parseFloat(row["Due"] || row["due"] || row["Balance"] || 0);
          
          // Calculate tuition fee and extra fees if needed
          const tuitionFee = totalFees;
          const tuitionPaid = paid;
          
          // Create a unique student ID if missing
          const finalStudentId = studentId || `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          return {
            studentId: finalStudentId,
            name: name || `Imported Student ${index + 1}`,
            fatherName,
            course,
            admissionDate,
            admissionMonth,
            status: ["Active", "Inactive", "Left", "Passout"].includes(status) ? status : "Active",
            gender,
            phone: phone.toString(),
            courseFee: tuitionFee,
            tuitionFee: tuitionFee,
            tuitionPaid: tuitionPaid,
            selectedExtraFees: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

        // Ask for confirmation before importing
        if (window.confirm(`Import ${importedStudents.length} students from Excel? This will add them to your existing students.`)) {
          // Merge with existing students, avoiding duplicates by studentId
          const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
          const existingIds = new Set(existingStudents.map(s => s.studentId));
          
          // Filter out duplicates
          const newStudents = importedStudents.filter(student => !existingIds.has(student.studentId));
          const duplicates = importedStudents.length - newStudents.length;
          
          // Combine existing with new
          const updatedStudents = [...existingStudents, ...newStudents];
          
          // Update state and localStorage
          setDashboardStudents(updatedStudents);
          if (setStudents) setStudents(updatedStudents);
          localStorage.setItem("students", JSON.stringify(updatedStudents));
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Show success message
          alert(`Successfully imported ${newStudents.length} students. ${duplicates > 0 ? `${duplicates} duplicates were skipped.` : ''}`);
          
          // Force refresh to update UI
          if (forceRefresh) forceRefresh();
        }
      } catch (error) {
        console.error("Error importing Excel file:", error);
        alert("Error importing Excel file. Please check the file format and try again.");
      }
    };
    
    reader.onerror = () => {
      alert("Error reading the file. Please try again.");
    };
    
    reader.readAsArrayBuffer(file);
  }, [setStudents, forceRefresh]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    let filtered = [...dashboardStudents];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(student => {
        return (
          (student.name?.toLowerCase().includes(query)) ||
          (student.studentId?.toLowerCase().includes(query)) ||
          (student.fatherName?.toLowerCase().includes(query)) ||
          (student.phone?.includes(searchQuery)) ||
          (student.course?.toLowerCase().includes(query))
        );
      });
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(student => 
        (student.status || "Active") === filterStatus
      );
    }
    
    if (filterCourse !== "all") {
      filtered = filtered.filter(student => 
        student.course === filterCourse
      );
    }
    
    if (filterMonth !== "all" || filterYear !== "all") {
      filtered = filtered.filter(student => {
        const { month, year } = extractMonthYear(student.admissionMonth);
        
        if (month === null || year === null) {
          return filterMonth === "all" && filterYear === "all";
        }
        
        let monthMatch = true;
        let yearMatch = true;
        
        if (filterMonth !== "all") {
          monthMatch = month === filterMonth;
        }
        
        if (filterYear !== "all") {
          yearMatch = year === filterYear;
        }
        
        return monthMatch && yearMatch;
      });
    }
    
    return filtered;
  }, [dashboardStudents, filterMonth, filterYear, filterCourse, filterStatus, searchQuery, extractMonthYear]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalStudents = dashboardStudents.length;
    const activeStudents = dashboardStudents.filter(s => (s.status || "Active") === "Active").length;
    const inactiveStudents = dashboardStudents.filter(s => (s.status || "Active") === "Inactive").length;
    const leftStudents = dashboardStudents.filter(s => (s.status || "Active") === "Left").length;
    const passoutStudents = dashboardStudents.filter(s => (s.status || "Active") === "Passout").length;
    
    const currentMonthStudents = dashboardStudents.filter(student => {
      const { month, year } = extractMonthYear(student.admissionMonth);
      return month === currentMonth && year === currentYear;
    });
    
    const currentMonthActive = currentMonthStudents.filter(s => (s.status || "Active") === "Active").length;
    const currentMonthInactive = currentMonthStudents.filter(s => (s.status || "Active") === "Inactive").length;
    const currentMonthLeft = currentMonthStudents.filter(s => (s.status || "Active") === "Left").length;
    const currentMonthPassout = currentMonthStudents.filter(s => (s.status || "Active") === "Passout").length;
    
    const allTimeTotalFees = dashboardStudents.reduce((sum, s) => {
      const tuitionFee = Number(s.courseFee) || Number(s.tuitionFee) || 0;
      const extraFees = Array.isArray(s.selectedExtraFees) 
        ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.amount) || 0), 0)
        : 0;
      return sum + tuitionFee + extraFees;
    }, 0);
    
    const allTimeTotalPaid = dashboardStudents.reduce((sum, s) => {
      const tuitionPaid = Number(s.tuitionPaid) || 0;
      const extraFeesPaid = Array.isArray(s.selectedExtraFees)
        ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.paid) || 0), 0)
        : 0;
      return sum + tuitionPaid + extraFeesPaid;
    }, 0);
    
    const allTimeTotalDue = allTimeTotalFees - allTimeTotalPaid;
    
    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      leftStudents,
      passoutStudents,
      currentMonthStudents: currentMonthStudents.length,
      currentMonthActive,
      currentMonthInactive,
      currentMonthLeft,
      currentMonthPassout,
      allTimeTotalFees,
      allTimeTotalPaid,
      allTimeTotalDue
    };
  }, [dashboardStudents, currentMonth, currentYear, extractMonthYear]);

  // Function to calculate fees for a specific month
  const getFeesForMonth = useCallback((month, year) => {
    if (month === "all") {
      const studentsForYear = dashboardStudents.filter(student => {
        const { year: studentYear } = extractMonthYear(student.admissionMonth);
        return studentYear === year;
      });
      
      const total = studentsForYear.reduce((sum, s) => {
        const tuitionFee = Number(s.courseFee) || Number(s.tuitionFee) || 0;
        const extraFees = Array.isArray(s.selectedExtraFees) 
          ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.amount) || 0), 0)
          : 0;
        return sum + tuitionFee + extraFees;
      }, 0);
      
      const paid = studentsForYear.reduce((sum, s) => {
        const tuitionPaid = Number(s.tuitionPaid) || 0;
        const extraFeesPaid = Array.isArray(s.selectedExtraFees)
          ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.paid) || 0), 0)
          : 0;
        return sum + tuitionPaid + extraFeesPaid;
      }, 0);
      
      const due = total - paid;
      
      const activeStudents = studentsForYear.filter(s => (s.status || "Active") === "Active");
      const activeTotal = activeStudents.reduce((sum, s) => {
        const tuitionFee = Number(s.courseFee) || Number(s.tuitionFee) || 0;
        const extraFees = Array.isArray(s.selectedExtraFees) 
          ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.amount) || 0), 0)
          : 0;
        return sum + tuitionFee + extraFees;
      }, 0);
      
      const activePaid = activeStudents.reduce((sum, s) => {
        const tuitionPaid = Number(s.tuitionPaid) || 0;
        const extraFeesPaid = Array.isArray(s.selectedExtraFees)
          ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.paid) || 0), 0)
          : 0;
        return sum + tuitionPaid + extraFeesPaid;
      }, 0);
      
      const activeDue = activeTotal - activePaid;
      
      return { 
        total, paid, due, 
        count: studentsForYear.length,
        activeTotal, activePaid, activeDue,
        activeCount: activeStudents.length
      };
    }
    
    const studentsForMonth = dashboardStudents.filter(student => {
      const { month: studentMonth, year: studentYear } = extractMonthYear(student.admissionMonth);
      return studentMonth === month && studentYear === year;
    });
    
    const total = studentsForMonth.reduce((sum, s) => {
      const tuitionFee = Number(s.courseFee) || Number(s.tuitionFee) || 0;
      const extraFees = Array.isArray(s.selectedExtraFees) 
        ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.amount) || 0), 0)
        : 0;
      return sum + tuitionFee + extraFees;
    }, 0);
    
    const paid = studentsForMonth.reduce((sum, s) => {
      const tuitionPaid = Number(s.tuitionPaid) || 0;
      const extraFeesPaid = Array.isArray(s.selectedExtraFees)
        ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.paid) || 0), 0)
        : 0;
      return sum + tuitionPaid + extraFeesPaid;
    }, 0);
    
    const due = total - paid;
    
    const activeStudents = studentsForMonth.filter(s => (s.status || "Active") === "Active");
    const activeTotal = activeStudents.reduce((sum, s) => {
      const tuitionFee = Number(s.courseFee) || Number(s.tuitionFee) || 0;
      const extraFees = Array.isArray(s.selectedExtraFees) 
        ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.amount) || 0), 0)
        : 0;
      return sum + tuitionFee + extraFees;
    }, 0);
      
    const activePaid = activeStudents.reduce((sum, s) => {
      const tuitionPaid = Number(s.tuitionPaid) || 0;
      const extraFeesPaid = Array.isArray(s.selectedExtraFees)
        ? s.selectedExtraFees.reduce((feeSum, fee) => feeSum + (Number(fee.paid) || 0), 0)
        : 0;
      return sum + tuitionPaid + extraFeesPaid;
    }, 0);
      
    const activeDue = activeTotal - activePaid;
      
    return { 
      total, paid, due, 
      count: studentsForMonth.length,
      activeTotal, activePaid, activeDue,
      activeCount: activeStudents.length
    };
  }, [dashboardStudents, extractMonthYear]);

  // Calculate fees for selected month
  const selectedMonthFees = useMemo(() => 
    getFeesForMonth(selectedMonthForFees, selectedYearForFees),
    [selectedMonthForFees, selectedYearForFees, getFeesForMonth]
  );

  const handleEdit = useCallback((student) => {
    if (setEditingStudent && setActiveMenu) {
      setEditingStudent(student);
      setActiveMenu("new-admission");
    }
  }, [setEditingStudent, setActiveMenu]);

  const handleDelete = useCallback((studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      const updated = dashboardStudents.filter(s => s.studentId !== studentId);
      setDashboardStudents(updated);
      if (setStudents) setStudents(updated);
      localStorage.setItem("students", JSON.stringify(updated));
      alert("Student deleted successfully!");
    }
  }, [dashboardStudents, setStudents]);

  const handleCollectFees = useCallback((student) => {
    localStorage.setItem('currentStudentForFees', JSON.stringify(student));
    if (onCollectFees) {
      onCollectFees(student);
    } else if (setEditingStudent && setActiveMenu) {
      setEditingStudent(student);
      setActiveMenu("collect-fees");
    }
  }, [onCollectFees, setEditingStudent, setActiveMenu]);

  const handleView = useCallback((student) => {
    setViewingStudent(student);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((studentId, newStatus) => {
    const updatedStudents = dashboardStudents.map(s => {
      if (s.studentId === studentId) {
        return { ...s, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    
    setDashboardStudents(updatedStudents);
    if (setStudents) setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    setEditingStatus(null);
    alert(`Status updated to ${newStatus}`);
  }, [dashboardStudents, setStudents]);

  const startEditStatus = useCallback((student, e) => {
    e.stopPropagation();
    setEditingStatus(student.studentId);
    setTempStatus(student.status || "Active");
  }, []);

  const cancelEditStatus = useCallback((e) => {
    e?.stopPropagation();
    setEditingStatus(null);
    setTempStatus("");
  }, []);

  const handleExportData = useCallback(() => {
    if (!filteredStudents.length) return alert("No students to export!");

    const exportData = filteredStudents.map(s => {
      const tuitionFee = Number(s.courseFee) || Number(s.tuitionFee) || 0;
      const extraFees = Array.isArray(s.selectedExtraFees) 
        ? s.selectedExtraFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0)
        : 0;
      const totalFee = tuitionFee + extraFees;
      
      const tuitionPaid = Number(s.tuitionPaid) || 0;
      const extraFeesPaid = Array.isArray(s.selectedExtraFees)
        ? s.selectedExtraFees.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0)
        : 0;
      const totalPaid = tuitionPaid + extraFeesPaid;
      
      return {
        "Student ID": s.studentId,
        "Name": s.name,
        "Father's Name": s.fatherName || "",
        "Course": s.course,
        "Admission Date": s.admissionDate,
        "Fees Month": s.admissionMonth || "Not Specified",
        "Status": s.status || "Active",
        "Gender": s.gender || "Other",
        "Phone": s.phone || "",
        "Total Fees": totalFee,
        "Paid": totalPaid,
        "Due": totalFee - totalPaid,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `students_${new Date().toISOString().split("T")[0]}.xlsx`);
    alert(`Exported ${filteredStudents.length} students to Excel`);
  }, [filteredStudents]);

  const resetFilters = useCallback(() => {
    setFilterMonth(currentMonth);
    setFilterYear(currentYear);
    setFilterCourse("all");
    setFilterStatus("all");
    setSearchQuery("");
  }, [currentMonth, currentYear]);

  const addCustomYear = useCallback(() => {
    if (!newYear || isNaN(newYear)) {
      alert("Please enter a valid year");
      return;
    }
    
    const yearNum = parseInt(newYear);
    if (customYears.includes(yearNum)) {
      alert("This year already exists in the list");
      return;
    }
    
    if (yearNum < 2000 || yearNum > 2100) {
      alert("Please enter a year between 2000 and 2100");
      return;
    }
    
    const updatedYears = [...customYears, yearNum];
    updatedYears.sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      return b - a;
    });
    
    setCustomYears(updatedYears);
    setNewYear("");
    alert(`Year ${yearNum} added successfully!`);
  }, [customYears, newYear]);

  const removeCustomYear = useCallback((yearToRemove) => {
    if (yearToRemove === "all" || yearToRemove === currentYear) {
      alert("Cannot remove this year");
      return;
    }
    
    const updatedYears = customYears.filter(y => y !== yearToRemove);
    setCustomYears(updatedYears);
    
    if (filterYear === yearToRemove) {
      setFilterYear(currentYear);
    }
    
    alert(`Year ${yearToRemove} removed from the list`);
  }, [customYears, currentYear, filterYear]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }, []);

  const formatCurrency = useCallback((value) => {
    const numValue = Number(value || 0);
    return `₹${numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }, []);

  const getStatusInfo = useCallback((status) => {
    switch(status) {
      case "Active":
        return { color: "#10b981", bg: "#d1fae5", icon: <CheckCircle size={12} /> };
      case "Inactive":
        return { color: "#6b7280", bg: "#f3f4f6", icon: <XCircle size={12} /> };
      case "Left":
        return { color: "#f59e0b", bg: "#fef3c7", icon: <LogOut size={12} /> };
      case "Passout":
        return { color: "#3b82f6", bg: "#dbeafe", icon: <GraduationCap size={12} /> };
      default:
        return { color: "#10b981", bg: "#d1fae5", icon: <CheckCircle size={12} /> };
    }
  }, []);

  const handleMonthWiseList = useCallback(() => {
    const filters = {
      month: filterMonth,
      year: filterYear,
      course: filterCourse,
      status: filterStatus
    };
    localStorage.setItem("monthWiseFilters", JSON.stringify(filters));
    setActiveMenu("month-wise");
  }, [filterMonth, filterYear, filterCourse, filterStatus, setActiveMenu]);

  // Get admission month name
  const getMonthName = useCallback((monthNumber) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNumber - 1] || "Unknown";
  }, []);

  // Course distribution for stats
  const courseDistribution = useMemo(() => {
    const distribution = dashboardStudents.reduce((acc, s) => {
      const course = s.course || "No Course";
      acc[course] = (acc[course] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [dashboardStudents]);

  // Calculate student's total due
  const calculateStudentDue = useCallback((student) => {
    const tuitionFee = Number(student.courseFee) || Number(student.tuitionFee) || 0;
    const tuitionPaid = Number(student.tuitionPaid) || 0;
    const extraFees = Array.isArray(student.selectedExtraFees) 
      ? student.selectedExtraFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0)
      : 0;
    const extraFeesPaid = Array.isArray(student.selectedExtraFees)
      ? student.selectedExtraFees.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0)
      : 0;
    
    const totalFee = tuitionFee + extraFees;
    const totalPaid = tuitionPaid + extraFeesPaid;
    
    return {
      totalFee,
      totalPaid,
      due: Math.max(0, totalFee - totalPaid)
    };
  }, []);

  // View Student Modal Component
  const ViewStudentModal = useCallback(() => {
    if (!viewingStudent) return null;

    const { totalFee, totalPaid, due } = calculateStudentDue(viewingStudent);

    return (
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px"
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            color: "white",
            padding: "25px 30px",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>Student Details</h2>
              <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: "14px" }}>Complete info about {viewingStudent.name}</p>
            </div>
            <button 
              onClick={() => setViewingStudent(null)}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "white",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "20px",
                fontWeight: "bold",
                transition: "all 0.2s ease"
              }}
            >✕</button>
          </div>

          <div style={{ padding: "30px" }}>
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                <User size={20}/> Basic Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Student ID</div>
                  <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>{viewingStudent.studentId}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</div>
                  <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>{viewingStudent.name}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Father's Name</div>
                  <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>{viewingStudent.fatherName || "N/A"}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</div>
                  <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: getStatusInfo(viewingStudent.status || "Active").bg,
                      color: getStatusInfo(viewingStudent.status || "Active").color
                    }}>
                      {getStatusInfo(viewingStudent.status || "Active").icon}
                      {viewingStudent.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                <Book size={20}/> Course Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Course</div>
                  <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>{viewingStudent.course || "N/A"}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Admission Date</div>
                  <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>{formatDate(viewingStudent.admissionDate)}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fees Month</div>
                  <div style={{ fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>
                    <span style={{
                      background: "#f0f9ff",
                      color: "#0369a1",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      border: "1px solid #bae6fd"
                    }}>
                      {viewingStudent.admissionMonth || "Not Specified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                <DollarSign size={20}/> Fee Information
              </h3>
              <div style={{ background: "#f1f5f9", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "2px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Fee</div>
                    <div style={{ fontSize: "18px", color: "#1e293b", fontWeight: "600" }}>{formatCurrency(totalFee)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Paid</div>
                    <div style={{ fontSize: "18px", color: "#10b981", fontWeight: "600" }}>{formatCurrency(totalPaid)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due</div>
                    <div style={{ fontSize: "18px", color: due > 0 ? "#ef4444" : "#10b981", fontWeight: "600" }}>
                      {formatCurrency(due)}
                      {due === 0 && " ✓"}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Extra Fees Section */}
              {viewingStudent.selectedExtraFees && viewingStudent.selectedExtraFees.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#475569", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Tag size={16} /> Extra Fees
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                    {viewingStudent.selectedExtraFees.map((fee, index) => {
                      const feeAmount = Number(fee.amount) || 0;
                      const feePaid = Number(fee.paid) || 0;
                      const feeDue = feeAmount - feePaid;
                      
                      return (
                        <div key={index} style={{ 
                          background: feeDue === 0 ? "#d1fae5" : "#fee2e2", 
                          padding: "12px", 
                          borderRadius: "8px",
                          border: `1px solid ${feeDue === 0 ? "#a7f3d0" : "#fecaca"}`
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                              {fee.name || fee.feeName || "Extra Fee"}
                            </div>
                            <div style={{ 
                              fontSize: "10px", 
                              padding: "2px 6px", 
                              borderRadius: "10px",
                              background: feeDue === 0 ? "#10b981" : "#ef4444",
                              color: "white",
                              fontWeight: "600"
                            }}>
                              {feeDue === 0 ? "Paid" : "Due"}
                            </div>
                          </div>
                          <div style={{ marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Amount:</span>
                              <span style={{ fontWeight: "600" }}>{formatCurrency(feeAmount)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                              <span>Paid:</span>
                              <span style={{ color: "#10b981", fontWeight: "600" }}>{formatCurrency(feePaid)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                              <span>Due:</span>
                              <span style={{ color: feeDue > 0 ? "#ef4444" : "#10b981", fontWeight: "600" }}>
                                {formatCurrency(feeDue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [viewingStudent, getStatusInfo, formatDate, formatCurrency, calculateStudentDue]);

  // Year Settings Modal Component
  const YearSettingsModal = useCallback(() => {
    if (!showYearSettings) return null;

    return (
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1001,
        padding: "20px"
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "white",
            padding: "25px 30px",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>Manage Year List</h2>
              <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: "14px" }}>Add or remove years from the filter list</p>
            </div>
            <button 
              onClick={() => setShowYearSettings(false)}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "white",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "20px",
                fontWeight: "bold",
                transition: "all 0.2s ease"
              }}
            >✕</button>
          </div>

          <div style={{ padding: "30px" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar size={20} />
              Available Years
            </div>
            
            <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
              {customYears.map((year, index) => (
                <div key={index} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 15px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f8fafc"
                }}>
                  <span style={{ 
                    fontWeight: "600", 
                    color: year === "all" ? "#3b82f6" : 
                           year === currentYear ? "#10b981" : "#1e293b",
                    fontSize: "16px"
                  }}>
                    {year === "all" ? "All Years" : 
                     year === currentYear ? `${year} (Current)` : year}
                  </span>
                  {year !== "all" && year !== currentYear && (
                    <button 
                      onClick={() => removeCustomYear(year)}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                      title="Remove year"
                    >
                      <Minus size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <input
                type="number"
                placeholder="Enter year (e.g., 2024)"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                min="2000"
                max="2100"
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              />
              <button 
                onClick={addCustomYear}
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                <Plus size={16} /> Add Year
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [showYearSettings, customYears, newYear, currentYear, addCustomYear, removeCustomYear]);

  // Quick Action Button Component
  const QuickActionButton = ({ icon, label, onClick, color }) => (
    <button 
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
        color: "white",
        border: "none",
        padding: "12px 15px",
        borderRadius: "10px",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: `0 4px 8px ${color}40`,
        transition: "all 0.2s ease",
        height: "50px"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 6px 12px ${color}60`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 4px 8px ${color}40`;
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="dashboard" style={{ minHeight: "100vh", background: "#f8fafc", padding: "15px" }}>
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
      />
      
      {/* View Student Modal */}
      <ViewStudentModal />
      
      {/* Year Settings Modal */}
      <YearSettingsModal />

      {/* Dashboard Header */}
      <div style={{
        background: `linear-gradient(135deg, ${academyConfig.theme?.primaryColor || "#3b82f6"} 0%, ${academyConfig.theme?.secondaryColor || "#1d4ed8"} 100%)`,
        color: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
          {/* Left side with logo and academy name */}
          <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
            {/* Logo Display */}
            {academyConfig.showLogo !== false && academyConfig.logo && (
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0
              }}>
                {academyConfig.logoType === "image" && academyConfig.logo.startsWith("data:image") ? (
                  <img 
                    src={academyConfig.logo} 
                    alt="Academy Logo" 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover",
                      borderRadius: "10px"
                    }} 
                  />
                ) : academyConfig.logoType === "text" ? (
                  <div style={{ 
                    fontSize: "22px", 
                    fontWeight: "bold",
                    color: "white"
                  }}>
                    {academyConfig.logo}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {academyConfig.logo || "💻"}
                  </div>
                )}
              </div>
            )}
            
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: "24px", 
                    fontWeight: "700", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px" 
                  }}>
                    {(!academyConfig.showLogo || !academyConfig.logo) && <BarChart3 size={24} />}
                    {academyConfig.name}
                  </h2>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center",
                    marginTop: "8px",
                    gap: "15px",
                    flexWrap: "wrap"
                  }}>
                    <span style={{ fontSize: "14px", opacity: 0.9 }}>{academyConfig.tagline}</span>
                    <span style={{ 
                      fontSize: "12px", 
                      background: "rgba(255,255,255,0.2)", 
                      padding: "4px 10px", 
                      borderRadius: "12px" 
                    }}>
                      Current: {currentMonthName} {currentYear}
                    </span>
                    {academyConfig.description && (
                      <span style={{ fontSize: "12px", opacity: 0.8, fontStyle: "italic" }}>
                        {academyConfig.description}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Import Button (Replaced Refresh Button) */}
                <button 
                  onClick={handleImportExcel}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    transition: "all 0.2s ease",
                    flexShrink: 0
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"}
                  title="Import Students from Excel"
                >
                  <Upload size={14} />
                  Import Excel
                </button>
              </div>
            </div>
          </div>

          {/* Right side with stats and customize button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
            <div style={{ fontSize: "20px", fontWeight: "700", textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
              {academyConfig.fees?.currencySymbol || "₹"}{stats.allTimeTotalPaid.toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>Total Collected</div>
            <button 
              onClick={() => setActiveMenu("profile")}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "6px",
                color: "white",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              title="Edit Academy Details & Logo"
            >
              <Settings size={12} />
              Customize
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - 4 COMPACT CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "15px",
        marginBottom: "20px"
      }}>
        {/* Card 1: Total Students */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "18px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
          borderLeft: "4px solid #3b82f6",
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "white"
            }}>
              <Users size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>Total Students</div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b" }}>{stats.totalStudents}</div>
              <div style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "600", marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Active:</span>
                  <span style={{ fontWeight: "700" }}>{stats.activeStudents}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Inactive:</span>
                  <span style={{ fontWeight: "700" }}>{stats.inactiveStudents}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Left:</span>
                  <span style={{ fontWeight: "700" }}>{stats.leftStudents}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Passout:</span>
                  <span style={{ fontWeight: "700" }}>{stats.passoutStudents}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 2: Current Month Students */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "18px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
          borderLeft: "4px solid #10b981",
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              background: "linear-gradient(135deg, #10b981 0%, #065f46 100%)", 
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "white"
            }}>
              <CalendarDays size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>
                {currentMonthName} Students
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b" }}>{stats.currentMonthStudents}</div>
              <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "600", marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Active:</span>
                  <span style={{ fontWeight: "700" }}>{stats.currentMonthActive}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Inactive:</span>
                  <span style={{ fontWeight: "700" }}>{stats.currentMonthInactive}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Left:</span>
                  <span style={{ fontWeight: "700" }}>{stats.currentMonthLeft}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Passout:</span>
                  <span style={{ fontWeight: "700" }}>{stats.currentMonthPassout}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Course Stats */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "18px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
          borderLeft: "4px solid #8b5cf6",
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", 
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "white"
            }}>
              <Book size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>Top Courses</div>
              <div style={{ maxHeight: "60px", overflowY: "auto", paddingRight: "5px" }}>
                {courseDistribution.length > 0 ? (
                  courseDistribution.map(([course, count], idx) => (
                    <div key={idx} style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: "6px",
                      padding: "3px 0"
                    }}>
                      <span style={{ 
                        fontSize: "12px", 
                        color: "#475569", 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap",
                        maxWidth: "70%"
                      }}>
                        {course || "No Course"}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#8b5cf6" }}>{count}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", fontStyle: "italic" }}>
                    No courses
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Card 4: Month-Wise Fees Card */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "18px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
          borderLeft: "4px solid #f59e0b",
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "white"
            }}>
              <CreditCard size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Month Fees</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <select
                    value={selectedMonthForFees}
                    onChange={(e) => setSelectedMonthForFees(e.target.value === "all" ? "all" : Number(e.target.value))}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "11px",
                      background: "white",
                      cursor: "pointer",
                      minWidth: "90px",
                      fontWeight: "500"
                    }}
                  >
                    <option value={currentMonth}>Current</option>
                    <option value="all">All Months</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>
                        {getMonthName(m).slice(0, 3)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYearForFees}
                    onChange={(e) => setSelectedYearForFees(parseInt(e.target.value))}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "11px",
                      background: "white",
                      cursor: "pointer",
                      minWidth: "70px",
                      fontWeight: "500"
                    }}
                  >
                    {customYears.filter(y => y !== "all").map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ 
                background: "#fef3c7", 
                padding: "12px", 
                borderRadius: "8px",
                marginBottom: "12px"
              }}>
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "10px", color: "#92400e", fontWeight: "600", marginBottom: "4px" }}>
                    {selectedMonthForFees === "all" 
                      ? `ALL ${selectedYearForFees}` 
                      : `${getMonthName(selectedMonthForFees).slice(0, 3)} ${selectedYearForFees}`}
                  </div>
                  <div style={{ fontSize: "16px", color: "#92400e", fontWeight: "800" }}>
                    {formatCurrency(selectedMonthFees.paid)}
                  </div>
                  <div style={{ fontSize: "10px", color: "#92400e", opacity: 0.8 }}>
                    Paid • {selectedMonthFees.count} Students
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginTop: "8px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#1e293b", fontWeight: "600" }}>Total</div>
                    <div style={{ color: "#1e293b", fontWeight: "700" }}>{formatCurrency(selectedMonthFees.total)}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#ef4444", fontWeight: "600" }}>Due</div>
                    <div style={{ color: "#ef4444", fontWeight: "700" }}>{formatCurrency(selectedMonthFees.due)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "12px",
        marginBottom: "20px"
      }}>
        <QuickActionButton 
          icon={<Plus size={18} />}
          label="New Admission"
          onClick={() => setActiveMenu("new-admission")}
          color="#3b82f6"
        />
        
        <QuickActionButton 
          icon={<Users size={18} />}
          label="Show All"
          onClick={() => {
            setFilterMonth("all");
            setFilterYear("all");
            setFilterCourse("all");
            setFilterStatus("all");
            setSearchQuery("");
          }}
          color="#10b981"
        />
        
        <QuickActionButton 
          icon={<DollarSign size={18} />}
          label="Collect Fees"
          onClick={() => {
            localStorage.setItem('currentStudentForFees', JSON.stringify(null));
            setActiveMenu("collect-fees");
          }}
          color="#f59e0b"
        />
        
        <QuickActionButton 
          icon={<Download size={18} />}
          label="Export Data"
          onClick={handleExportData}
          color="#ec4899"
        />
        
        <QuickActionButton 
          icon={<Upload size={18} />}
          label="Import Excel"
          onClick={handleImportExcel}
          color="#8b5cf6"
        />
      </div>

      {/* Filters Section */}
      <div style={{
        background: "white",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0"
      }}>
        <div 
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: showFilters ? "15px" : "0",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            background: "#f8fafc",
            transition: "all 0.2s ease"
          }}
          onClick={() => setShowFilters(!showFilters)}
          onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"}
          onMouseOut={(e) => e.currentTarget.style.background = "#f8fafc"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "36px", 
              height: "36px", 
              background: "#3b82f6", 
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Filter size={18} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "16px", fontWeight: "700" }}>
                Filter Students
              </h3>
              <p style={{ margin: "3px 0 0 0", color: "#64748b", fontSize: "12px" }}>
                Narrow down your student list
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{
              background: "#3b82f6",
              color: "white",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "600"
            }}>
              {filteredStudents.length} found
            </span>
            <div style={{ 
              width: "28px", 
              height: "28px", 
              borderRadius: "6px", 
              background: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {showFilters ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
            </div>
          </div>
        </div>

        {showFilters && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
              marginBottom: "15px"
            }}>
              <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} /> Month
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                  style={{
                    padding: "10px 12px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "border 0.2s ease",
                    borderColor: filterMonth !== "all" ? "#3b82f6" : "#e2e8f0"
                  }}
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} /> Year
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                  style={{
                    padding: "10px 12px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "border 0.2s ease",
                    borderColor: filterYear !== "all" ? "#3b82f6" : "#e2e8f0"
                  }}
                >
                  {customYears.map(year => (
                    <option key={year} value={year}>
                      {year === "all" ? "All Years" : 
                       year === currentYear ? `${year} (Current)` : year}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowYearSettings(true)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "38px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    fontSize: "14px"
                  }}
                  title="Manage year list"
                >
                  <Settings size={14} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Book size={14} /> Course
                </label>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "border 0.2s ease",
                    borderColor: filterCourse !== "all" ? "#10b981" : "#e2e8f0"
                  }}
                >
                  {uniqueCourses.map(course => (
                    <option key={course} value={course}>
                      {course === "all" ? "All Courses" : course.length > 20 ? course.slice(0, 20) + "..." : course}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Shield size={14} /> Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "border 0.2s ease",
                    borderColor: filterStatus !== "all" ? getStatusInfo(filterStatus).color : "#e2e8f0"
                  }}
                >
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {status === "all" ? "All Status" : status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Search size={14} /> Search
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search by name, ID, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 40px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "white",
                      transition: "all 0.2s ease",
                      borderColor: searchQuery ? "#f59e0b" : "#e2e8f0"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#f59e0b"}
                    onBlur={(e) => e.target.style.borderColor = searchQuery ? "#f59e0b" : "#e2e8f0"}
                  />
                  <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "10px" }} />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "8px",
                        background: "#e2e8f0",
                        border: "none",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "11px",
                        color: "#64748b"
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginTop: "20px", 
              paddingTop: "15px", 
              borderTop: "2px solid #f1f5f9" 
            }}>
              <button 
                onClick={resetFilters}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#2563eb"}
                onMouseOut={(e) => e.currentTarget.style.background = "#3b82f6"}
              >
                <RefreshCw size={14} /> Reset Filters
              </button>
              <div style={{ fontSize: "13px", color: "#475569", fontWeight: "600", textAlign: "right" }}>
                {filteredStudents.length} of {dashboardStudents.length} students
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div style={{
        background: "white",
        borderRadius: "10px",
        padding: "20px",
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
        marginBottom: "30px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={20} /> Student List
              {filteredStudents.length > 0 && (
                <span style={{ 
                  background: "#e2e8f0", 
                  color: "#475569", 
                  padding: "3px 10px", 
                  borderRadius: "12px", 
                  fontSize: "12px", 
                  fontWeight: "600" 
                }}>
                  {filteredStudents.length}
                </span>
              )}
            </h3>
            <p style={{ margin: "5px 0 0 0", color: "#64748b", fontSize: "13px" }}>
              Manage student admissions, fees, and status
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button 
              onClick={handleImportExcel}
              style={{
                background: "#8b5cf6",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#7c3aed"}
              onMouseOut={(e) => e.currentTarget.style.background = "#8b5cf6"}
              title="Import students from Excel file"
            >
              <Upload size={14} />
              Import Excel
            </button>
            <button 
              onClick={handleExportData}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#059669"}
              onMouseOut={(e) => e.currentTarget.style.background = "#10b981"}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: "700", color: "#475569", borderBottom: "2px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>ID & Name</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: "700", color: "#475569", borderBottom: "2px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Course</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: "700", color: "#475569", borderBottom: "2px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Admission</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: "700", color: "#475569", borderBottom: "2px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: "700", color: "#475569", borderBottom: "2px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fees Summary</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: "700", color: "#475569", borderBottom: "2px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => {
                  const { totalFee, totalPaid, due } = calculateStudentDue(student);
                  const statusInfo = getStatusInfo(student.status || "Active");
                  const { month: admissionMonth, year: admissionYear } = extractMonthYear(student.admissionMonth);
                  const isDue = due > 0;
                  
                  return (
                    <tr key={index} style={{ 
                      background: index % 2 === 0 ? "#fafafa" : "white",
                      transition: "background 0.2s ease"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseOut={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#fafafa" : "white"}
                    >
                      <td style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ 
                            width: "40px", 
                            height: "40px", 
                            borderRadius: "10px", 
                            background: isDue ? "#fee2e2" : "#e0f2fe", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            color: isDue ? "#dc2626" : "#0369a1", 
                            fontWeight: "700",
                            fontSize: "14px",
                            border: `2px solid ${isDue ? "#fecaca" : "#bae6fd"}`
                          }}>
                            {student.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                              {student.name || "No Name"}
                              {admissionMonth === currentMonth && admissionYear === currentYear && (
                                <span style={{
                                  background: "#10b981",
                                  color: "white",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "9px",
                                  fontWeight: "600"
                                }}>
                                  New
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>ID: {student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Book size={14} color="#64748b" />
                          <span style={{ 
                            color: student.course ? "#1e293b" : "#64748b",
                            fontWeight: student.course ? "600" : "400",
                            fontSize: "13px"
                          }}>
                            {student.course || "No Course"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Calendar size={12} color="#64748b" />
                            <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "500" }}>
                              {formatDate(student.admissionDate)}
                            </span>
                          </div>
                          {student.admissionMonth && (
                            <span style={{
                              background: "#f0f9ff",
                              color: "#0369a1",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "600",
                              border: "1px solid #bae6fd",
                              display: "inline-block",
                              width: "fit-content"
                            }}>
                              {student.admissionMonth}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
                        {editingStatus === student.studentId ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <select
                              value={tempStatus}
                              onChange={(e) => setTempStatus(e.target.value)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: `2px solid ${statusInfo.color}`,
                                background: "white",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: statusInfo.color,
                                outline: "none",
                                cursor: "pointer",
                                minWidth: "100px"
                              }}
                            >
                              <option value="Active" style={{ color: "#10b981", fontWeight: "600" }}>Active</option>
                              <option value="Inactive" style={{ color: "#6b7280", fontWeight: "600" }}>Inactive</option>
                              <option value="Left" style={{ color: "#f59e0b", fontWeight: "600" }}>Left</option>
                              <option value="Passout" style={{ color: "#3b82f6", fontWeight: "600" }}>Passout</option>
                            </select>
                            <button
                              onClick={() => handleStatusChange(student.studentId, tempStatus)}
                              style={{
                                background: "#10b981",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 10px",
                                fontSize: "11px",
                                cursor: "pointer",
                                fontWeight: "600"
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditStatus}
                              style={{
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 10px",
                                fontSize: "11px",
                                cursor: "pointer",
                                fontWeight: "600"
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              cursor: "pointer",
                              border: `1px solid ${statusInfo.color}20`,
                              transition: "all 0.2s ease"
                            }}
                            onClick={(e) => startEditStatus(student, e)}
                            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                            title="Click to change status"
                          >
                            {statusInfo.icon}
                            {student.status || "Active"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Total:</span>
                            <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "700" }}>
                              {formatCurrency(totalFee)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Paid:</span>
                            <span style={{ fontSize: "13px", color: "#10b981", fontWeight: "700" }}>
                              {formatCurrency(totalPaid)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Due:</span>
                            <span style={{ 
                              fontSize: "13px", 
                              color: isDue ? "#ef4444" : "#10b981", 
                              fontWeight: "700"
                            }}>
                              {formatCurrency(due)}
                              {!isDue && " ✓"}
                            </span>
                          </div>
                          
                          {/* Extra fees indicator */}
                          {student.selectedExtraFees && student.selectedExtraFees.length > 0 && (
                            <div style={{ 
                              marginTop: "4px", 
                              padding: "3px 6px", 
                              background: "#f3e8ff", 
                              borderRadius: "4px",
                              border: "1px solid #e9d5ff"
                            }}>
                              <div style={{ 
                                fontSize: "10px", 
                                color: "#7c3aed", 
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <Tag size={9} />
                                {student.selectedExtraFees.length} extra fee(s)
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button 
                            onClick={() => handleView(student)}
                            style={{
                              background: "#e0f2fe",
                              border: "1px solid #7dd3fc",
                              borderRadius: "4px",
                              padding: "6px 10px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#0369a1",
                              transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#7dd3fc";
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "#e0f2fe";
                              e.currentTarget.style.color = "#0369a1";
                            }}
                            title="View Details"
                          >
                            <Eye size={12} />
                          </button>
                          <button 
                            onClick={() => handleEdit(student)}
                            style={{
                              background: "#f0f9ff",
                              border: "1px solid #bae6fd",
                              borderRadius: "4px",
                              padding: "6px 10px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#0ea5e9",
                              transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#bae6fd";
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "#f0f9ff";
                              e.currentTarget.style.color = "#0ea5e9";
                            }}
                            title="Edit Student"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            onClick={() => handleCollectFees(student)}
                            style={{ 
                              background: "#d1fae5",
                              border: "1px solid #a7f3d0",
                              borderRadius: "4px",
                              padding: "6px 10px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#065f46",
                              transition: "all 0.2s ease"
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#a7f3d0";
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "#d1fae5";
                              e.currentTarget.style.color = "#065f46";
                            }}
                            title="Collect Fees"
                          >
                            <DollarSign size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "40px 20px", 
            color: "#64748b", 
            fontSize: "14px",
            background: "#f8fafc",
            borderRadius: "8px",
            marginTop: "15px",
            border: "2px dashed #e2e8f0"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "15px", opacity: 0.5 }}>🔍</div>
            <h4 style={{ margin: "0 0 10px 0", color: "#475569", fontSize: "16px", fontWeight: "700" }}>No Students Found</h4>
            <p style={{ margin: 0, fontSize: "13px", maxWidth: "400px", margin: "0 auto 20px" }}>
              {dashboardStudents.length === 0 
                ? "No students added yet. Add your first student using 'New Admission'." 
                : `No students found matching your filters. Try adjusting filters.`}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={resetFilters}
                style={{
                  padding: "10px 20px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#2563eb"}
                onMouseOut={(e) => e.currentTarget.style.background = "#3b82f6"}
              >
                <RefreshCw size={14} /> Reset Filters
              </button>
              {dashboardStudents.length === 0 && (
                <button 
                  onClick={() => setActiveMenu("new-admission")}
                  style={{
                    padding: "10px 20px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#059669"}
                  onMouseOut={(e) => e.currentTarget.style.background = "#10b981"}
                >
                  <Plus size={14} /> Add Student
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;