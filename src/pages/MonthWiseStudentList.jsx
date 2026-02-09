import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Book,
  Phone,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CheckCircle,
  XCircle,
  LogOut,
  GraduationCap,
  Printer,
  Search,
  Plus,
  ArrowUpRight,
  Check,
  X,
  Clock,
  AlertCircle,
  MoveRight,
  FileText,
  User,
  Mail,
  ChevronRight,
  CheckSquare,
  Square,
  CreditCard,
  CalendarDays
} from "lucide-react";

const MonthWiseStudentList = ({ students = [], courses = [], systemSettings = {} }) => {
  // State variables
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStudents, setExpandedStudents] = useState({});
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeMonthStudents, setActiveMonthStudents] = useState([]);
  const [otherStudents, setOtherStudents] = useState([]);
  const [stats, setStats] = useState({ 
    total: 0, 
    active: 0, 
    inactive: 0, 
    left: 0, 
    passout: 0,
    activeMonth: 0,
    otherMonths: 0,
    newAdmissions: 0
  });
  const [exportProgress, setExportProgress] = useState(0);
  
  // Promotion state
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionType, setPromotionType] = useState("batch"); // "batch" or "single"
  const [singleStudentToPromote, setSingleStudentToPromote] = useState(null);
  const [promotionSource, setPromotionSource] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [promotionTarget, setPromotionTarget] = useState({
    month: (new Date().getMonth() + 2) > 12 ? 1 : new Date().getMonth() + 2,
    year: (new Date().getMonth() + 2) > 12 ? new Date().getFullYear() + 1 : new Date().getFullYear()
  });
  const [selectedStudentsForPromotion, setSelectedStudentsForPromotion] = useState([]);
  const [promotionMessage, setPromotionMessage] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);
  const [studentsInSourceMonth, setStudentsInSourceMonth] = useState([]);
  const [selectAllStudents, setSelectAllStudents] = useState(true);

  // Months array
  const months = [
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
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);
  const currentMonthName = months.find(m => m.value === (new Date().getMonth() + 1))?.name || "";
  
  const getStatusInfo = (status) => {
    switch(status) {
      case "Active":
        return { color: "#10b981", bg: "#d1fae5", icon: <CheckCircle size={14} /> };
      case "Inactive":
        return { color: "#6b7280", bg: "#f3f4f6", icon: <XCircle size={14} /> };
      case "Left":
        return { color: "#f59e0b", bg: "#fef3c7", icon: <LogOut size={14} /> };
      case "Passout":
        return { color: "#3b82f6", bg: "#dbeafe", icon: <GraduationCap size={14} /> };
      default:
        return { color: "#10b981", bg: "#d1fae5", icon: <CheckCircle size={14} /> };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  const formatCurrency = (value) => {
    const numValue = Number(value || 0);
    return `${systemSettings.currency || '₹'}${numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const toggleStudentDetails = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Updated function to parse admission month
  const getMonthFromAdmissionMonth = (admissionMonth) => {
    if (!admissionMonth) return null;
    
    // If it's already a number, return it
    if (typeof admissionMonth === 'number') return admissionMonth;
    
    // Check if it's a string like "January 2024"
    const monthString = admissionMonth.split(' ')[0].toLowerCase();
    
    const monthMap = {
      'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
      'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
      'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
      'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    };
    
    return monthMap[monthString] || null;
  };

  const getYearFromAdmissionMonth = (admissionMonth) => {
    if (!admissionMonth) return new Date().getFullYear();
    
    if (typeof admissionMonth === 'number') {
      return admissionMonth > 1000 ? admissionMonth : new Date().getFullYear();
    }
    
    // Extract year from string like "January 2024"
    const parts = admissionMonth.split(' ');
    for (let part of parts) {
      const year = parseInt(part);
      if (!isNaN(year) && year > 1000 && year < 2100) {
        return year;
      }
    }
    
    return new Date().getFullYear();
  };

  // Handle installment during promotion - NEW FUNCTION
  const handleInstallmentDuringPromotion = (student) => {
    // If student has installment plan and installmentMonthsList
    if (student.installmentPlan === "installment" && student.installmentMonthsList && student.installmentMonthsList.length > 0) {
      const targetMonthName = months.find(m => m.value === promotionTarget.month)?.name;
      const targetMonthYear = `${targetMonthName} ${promotionTarget.year}`;
      
      // Check if this month exists in the installment schedule
      const installmentExists = student.installmentMonthsList.some(
        installment => `${installment.month} ${installment.year}` === targetMonthYear
      );
      
      if (installmentExists) {
        // Find the installment for this month
        const installmentForThisMonth = student.installmentMonthsList.find(
          installment => `${installment.month} ${installment.year}` === targetMonthYear
        );
        
        // Update paid amount if installment is due
        const installmentAmount = installmentForThisMonth?.amount || 0;
        const currentPaid = Number(student.feePaid) || 0;
        
        // Only update if not already marked as paid
        if (installmentForThisMonth && !installmentForThisMonth.paid) {
          const newFeePaid = currentPaid + installmentAmount;
          const totalFee = Number(student.totalFee) || 0;
          
          return {
            ...student,
            feePaid: Math.min(newFeePaid, totalFee),
            installmentMonthsList: student.installmentMonthsList.map(installment => 
              `${installment.month} ${installment.year}` === targetMonthYear 
                ? { ...installment, paid: true, paidDate: new Date().toISOString().split('T')[0] }
                : installment
            ),
            paymentHistory: [
              ...(student.paymentHistory || []),
              {
                date: new Date().toISOString().split('T')[0],
                amount: installmentAmount,
                type: "installment",
                month: targetMonthYear,
                description: `Installment payment for ${targetMonthYear}`
              }
            ]
          };
        }
      }
    }
    
    return student;
  };

  const categorizeStudents = () => {
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYearNum = new Date().getFullYear();
    
    const activeMonth = [];
    const otherMonths = [];
    
    students.forEach(student => {
      const admissionMonthStr = student.admissionMonth || "";
      
      if (admissionMonthStr) {
        const studentMonth = getMonthFromAdmissionMonth(admissionMonthStr);
        const studentYear = getYearFromAdmissionMonth(admissionMonthStr);
        
        if (studentMonth === currentMonthNum && studentYear === currentYearNum) {
          activeMonth.push(student);
        } else {
          otherMonths.push(student);
        }
      } else {
        activeMonth.push(student);
      }
    });
    
    return { activeMonth, otherMonths };
  };

  useEffect(() => {
    if (!students || students.length === 0) {
      setAllStudents([]);
      setActiveMonthStudents([]);
      setOtherStudents([]);
      setFilteredStudents([]);
      return;
    }

    const { activeMonth, otherMonths } = categorizeStudents();
    setActiveMonthStudents(activeMonth);
    setOtherStudents(otherMonths);
    
    const combined = [...activeMonth, ...otherMonths];
    setAllStudents(combined);
    
    let filtered = combined.filter(student => {
      if (selectedMonth !== "all") {
        const admissionMonthStr = student.admissionMonth || "";
        let studentMonth = null;
        let studentYear = null;
        
        if (admissionMonthStr) {
          studentMonth = getMonthFromAdmissionMonth(admissionMonthStr);
          studentYear = getYearFromAdmissionMonth(admissionMonthStr);
        } else {
          try {
            const admissionDate = new Date(student.admissionDate);
            studentMonth = admissionDate.getMonth() + 1;
            studentYear = admissionDate.getFullYear();
          } catch {
            studentMonth = new Date().getMonth() + 1;
            studentYear = new Date().getFullYear();
          }
        }
        
        if (selectedMonth && studentMonth !== selectedMonth) return false;
        if (selectedYear && studentYear !== selectedYear) return false;
      }
      
      if (selectedCourse !== "all" && student.course !== selectedCourse) return false;
      
      if (selectedStatus !== "all" && (student.status || "Active") !== selectedStatus) return false;
      
      if (searchQuery && !student.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !student.fatherName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !student.phone?.includes(searchQuery)) {
        return false;
      }
      
      return true;
    });
    
    setFilteredStudents(filtered);
    
    const activeStudents = combined.filter(s => (s.status || "Active") === "Active");
    const inactiveStudents = combined.filter(s => (s.status || "Active") === "Inactive");
    const leftStudents = combined.filter(s => (s.status || "Active") === "Left");
    const passoutStudents = combined.filter(s => (s.status || "Active") === "Passout");
    const newAdmissions = combined.filter(s => !s.admissionMonth || s.admissionMonth === "").length;
    
    setStats({
      total: combined.length,
      active: activeStudents.length,
      inactive: inactiveStudents.length,
      left: leftStudents.length,
      passout: passoutStudents.length,
      activeMonth: activeMonth.length,
      otherMonths: otherMonths.length,
      newAdmissions: newAdmissions
    });
  }, [selectedMonth, selectedYear, selectedCourse, selectedStatus, searchQuery, students]);

  // Update students in source month when promotion source changes
  useEffect(() => {
    if (showPromotionModal) {
      const studentsInMonth = getStudentsInMonth(promotionSource.month, promotionSource.year);
      setStudentsInSourceMonth(studentsInMonth);
      
      // Auto-select all if selectAllStudents is true
      if (selectAllStudents && studentsInMonth.length > 0) {
        setSelectedStudentsForPromotion(studentsInMonth.map(s => s.studentId));
      }
    }
  }, [promotionSource, showPromotionModal, selectAllStudents]);

  const getStudentsInMonth = (month, year) => {
    return allStudents.filter(student => {
      if (!student.admissionMonth) {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        return month === currentMonth && year === currentYear;
      }
      
      const studentMonth = getMonthFromAdmissionMonth(student.admissionMonth);
      const studentYear = getYearFromAdmissionMonth(student.admissionMonth);
      
      return studentMonth === month && studentYear === year;
    });
  };

  const exportToCSV = () => {
    if (allStudents.length === 0) {
      alert("No students to export!");
      return;
    }

    setExportProgress(0);
    
    try {
      const monthName = selectedMonth === "all" ? "All Months" : months.find(m => m.value === selectedMonth)?.name || selectedMonth;
      const courseName = selectedCourse === "all" ? "All Courses" : selectedCourse;
      const statusName = selectedStatus === "all" ? "All Status" : selectedStatus;
      
      const metadata = [
        ["REPORT: COMPLETE STUDENT LIST"],
        [""],
        ["Academy Name:", systemSettings.academyName || "CodeHub Tech Academy"],
        ["Report Month:", monthName],
        ["Report Year:", selectedYear === "all" ? "All Years" : selectedYear],
        ["Course Filter:", courseName],
        ["Status Filter:", statusName],
        ["Search Query:", searchQuery || "None"],
        ["Total Students:", allStudents.length],
        ["Generated On:", new Date().toLocaleDateString('en-IN') + " " + new Date().toLocaleTimeString('en-IN')],
        [""]
      ];

      const headers = [
        "Sr. No.",
        "Student ID",
        "Student Name",
        "Father's Name",
        "Course",
        "Admission Date",
        "Current Month",
        "Student Status",
        "Phone Number",
        "Total Course Fee",
        "Fee Paid",
        "Due Amount",
        "Installment Plan",
        "Installment Months"
      ];

      const studentRows = allStudents.map((student, index) => {
        const totalFee = Number(student.totalFee) || 0;
        const feePaid = Number(student.feePaid) || 0;
        const dueAmount = Math.max(0, totalFee - feePaid);
        const installmentPlan = student.installmentPlan || "Full";
        const installmentMonths = student.installmentMonthsList ? 
          student.installmentMonthsList.map(m => `${m.month} ${m.year}`).join('; ') : 
          "No Installments";
        
        return [
          index + 1,
          student.studentId,
          student.name,
          student.fatherName || "",
          student.course || "",
          student.admissionDate,
          student.admissionMonth || "Current",
          student.status || "Active",
          student.phone || "",
          totalFee,
          feePaid,
          dueAmount,
          installmentPlan,
          installmentMonths
        ];
      });

      const totals = [
        "",
        "",
        "",
        "",
        "TOTALS:",
        "",
        "",
        "",
        "",
        allStudents.reduce((sum, s) => sum + (Number(s.totalFee) || 0), 0),
        allStudents.reduce((sum, s) => sum + (Number(s.feePaid) || 0), 0),
        allStudents.reduce((sum, s) => {
          const totalFee = Number(s.totalFee) || 0;
          const feePaid = Number(s.feePaid) || 0;
          const due = Math.max(0, totalFee - feePaid);
          return sum + due;
        }, 0),
        "",
        ""
      ];

      const allRows = [
        ...metadata,
        headers,
        ...studentRows,
        totals
      ];

      const csvContent = allRows.map(row => 
        row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `Student_List_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      
      setTimeout(() => {
        alert(`✅ Successfully exported ${allStudents.length} students to CSV!\n\nFile: ${fileName}`);
        setExportProgress(0);
      }, 300);

    } catch (error) {
      console.error("Export error:", error);
      alert("❌ Error exporting data. Please try again.");
      setExportProgress(0);
    }
  };

  const printReport = () => {
    if (allStudents.length === 0) {
      alert("No students to print!");
      return;
    }

    const printWindow = window.open('', '_blank');
    const monthName = selectedMonth === "all" ? "All Months" : months.find(m => m.value === selectedMonth)?.name || selectedMonth;
    const courseName = selectedCourse === "all" ? "All Courses" : selectedCourse;
    const statusName = selectedStatus === "all" ? "All Status" : selectedStatus;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Report - ${monthName} ${selectedYear}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; font-size: 12px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6; }
          .academy-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
          .report-title { font-size: 18px; color: #3b82f6; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th { background: #3b82f6; color: white; padding: 10px 8px; text-align: left; font-weight: 600; }
          td { padding: 8px; border: 1px solid #e2e8f0; vertical-align: top; }
          tr:nth-child(even) { background: #f8fafc; }
          .total-row { background: #f1f5f9; font-weight: bold; border-top: 2px solid #94a3b8; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          @media print { body { margin: 10px; } .no-print { display: none; } @page { margin: 0.5cm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="academy-name">${systemSettings.academyName || 'CodeHub Tech Academy'}</div>
          <div class="report-title">Complete Student Report</div>
          <div style="color: #64748b; margin-top: 5px;">
            Generated on: ${new Date().toLocaleDateString('en-IN')}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Father</th>
              <th>Course</th>
              <th>Month</th>
              <th>Status</th>
              <th>Phone</th>
              <th>Total Fee</th>
              <th>Paid</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            ${allStudents.map((student, index) => {
              const totalFee = Number(student.totalFee) || 0;
              const feePaid = Number(student.feePaid) || 0;
              const due = Math.max(0, totalFee - feePaid);
              const status = student.status || 'Active';
              
              return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${student.studentId}</td>
                  <td>${student.name}</td>
                  <td>${student.fatherName || ''}</td>
                  <td>${student.course || ''}</td>
                  <td>${student.admissionMonth || 'Current'}</td>
                  <td>${status}</td>
                  <td>${student.phone || ''}</td>
                  <td class="text-right">${formatCurrency(totalFee)}</td>
                  <td class="text-right">${formatCurrency(feePaid)}</td>
                  <td class="text-right">${formatCurrency(due)}</td>
                </tr>
              `;
            }).join('')}
            
            <tr class="total-row">
              <td colspan="8" class="text-right"><strong>TOTALS:</strong></td>
              <td class="text-right">${formatCurrency(allStudents.reduce((sum, s) => sum + (Number(s.totalFee) || 0), 0))}</td>
              <td class="text-right">${formatCurrency(allStudents.reduce((sum, s) => sum + (Number(s.feePaid) || 0), 0))}</td>
              <td class="text-right">${formatCurrency(allStudents.reduce((sum, s) => {
                const totalFee = Number(s.totalFee) || 0;
                const feePaid = Number(s.feePaid) || 0;
                const due = Math.max(0, totalFee - feePaid);
                return sum + due;
              }, 0))}</td>
            </tr>
          </tbody>
        </table>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin: 5px;
          ">
            🖨️ Print Report
          </button>
          <button onclick="window.close()" style="
            padding: 12px 24px;
            background: #6b7280;
            color: white;
            border: none;
            borderRadius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin: 5px;
          ">
            ✕ Close Window
          </button>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Open promotion modal for batch
  const openPromotionModal = () => {
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYearNum = new Date().getFullYear();
    
    setPromotionSource({
      month: currentMonthNum,
      year: currentYearNum
    });
    
    let nextMonth = currentMonthNum + 1;
    let nextYear = currentYearNum;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = currentYearNum + 1;
    }
    
    setPromotionTarget({
      month: nextMonth,
      year: nextYear
    });
    
    setPromotionType("batch");
    setSelectAllStudents(true);
    setShowPromotionModal(true);
  };

  // Open promotion modal for single student
  const openPromotionModalForStudent = (student) => {
    setSingleStudentToPromote(student);
    setSelectedStudentsForPromotion([student.studentId]);
    
    let sourceMonth = new Date().getMonth() + 1;
    let sourceYear = new Date().getFullYear();
    
    if (student.admissionMonth) {
      sourceMonth = getMonthFromAdmissionMonth(student.admissionMonth);
      sourceYear = getYearFromAdmissionMonth(student.admissionMonth);
    }
    
    setPromotionSource({
      month: sourceMonth,
      year: sourceYear
    });
    
    let nextMonth = sourceMonth + 1;
    let nextYear = sourceYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = sourceYear + 1;
    }
    
    setPromotionTarget({
      month: nextMonth,
      year: nextYear
    });
    
    setPromotionType("single");
    setShowPromotionModal(true);
  };

  // Handle promotion - UPDATED VERSION
  const handlePromotion = () => {
    if (selectedStudentsForPromotion.length === 0) {
      alert("Please select at least one student to promote!");
      return;
    }

    if (promotionSource.month === promotionTarget.month && promotionSource.year === promotionTarget.year) {
      alert("Source and target months cannot be the same!");
      return;
    }

    setIsPromoting(true);

    const targetMonthName = months.find(m => m.value === promotionTarget.month)?.name;
    const newAdmissionMonth = `${targetMonthName} ${promotionTarget.year}`;
    
    const updatedStudents = allStudents.map(student => {
      if (selectedStudentsForPromotion.includes(student.studentId)) {
        // Apply installment payment if applicable
        let updatedStudent = handleInstallmentDuringPromotion(student);
        
        // Update admission month
        updatedStudent = {
          ...updatedStudent,
          admissionMonth: newAdmissionMonth,
          lastPromotionDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
          // Keep original admission date unchanged
          admissionDate: student.admissionDate
        };
        
        return updatedStudent;
      }
      return student;
    });

    localStorage.setItem("students", JSON.stringify(updatedStudents));
    
    const sourceMonthName = months.find(m => m.value === promotionSource.month)?.name;
    
    setPromotionMessage(
      `✅ Successfully promoted ${selectedStudentsForPromotion.length} student${selectedStudentsForPromotion.length > 1 ? 's' : ''} from ${sourceMonthName} to ${targetMonthName}!\n\nNote: Students will now appear in the "${targetMonthName}" month filter.`
    );
    
    setTimeout(() => {
      setIsPromoting(false);
      setShowPromotionModal(false);
      window.location.reload();
    }, 2000);
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentsForPromotion(prev => {
      if (prev.includes(studentId)) {
        const newSelection = prev.filter(id => id !== studentId);
        if (selectAllStudents && newSelection.length !== studentsInSourceMonth.length) {
          setSelectAllStudents(false);
        }
        return newSelection;
      } else {
        const newSelection = [...prev, studentId];
        if (newSelection.length === studentsInSourceMonth.length) {
          setSelectAllStudents(true);
        }
        return newSelection;
      }
    });
  };

  const handleSelectAll = () => {
    const newSelectAllState = !selectAllStudents;
    setSelectAllStudents(newSelectAllState);
    
    if (newSelectAllState) {
      setSelectedStudentsForPromotion(studentsInSourceMonth.map(s => s.studentId));
    } else {
      setSelectedStudentsForPromotion([]);
    }
  };

  const resetFilters = () => {
    setSelectedMonth("all");
    setSelectedYear(new Date().getFullYear());
    setSelectedCourse("all");
    setSelectedStatus("all");
    setSearchQuery("");
  };

  // Function to get installment info for display
  const getInstallmentInfo = (student) => {
    if (student.installmentPlan === "installment" && student.installmentMonthsList) {
      const totalInstallments = student.installmentMonthsList.length;
      const paidInstallments = student.installmentMonthsList.filter(m => m.paid).length;
      const pendingInstallments = totalInstallments - paidInstallments;
      const nextInstallment = student.installmentMonthsList.find(m => !m.paid);
      
      return {
        hasInstallments: true,
        totalInstallments,
        paidInstallments,
        pendingInstallments,
        nextInstallment,
        installmentAmount: nextInstallment?.amount || 0
      };
    }
    
    return { hasInstallments: false };
  };

  const styles = {
    container: {
      padding: "20px",
      background: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
      flexWrap: "wrap",
      gap: "15px"
    },
    title: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#1e293b",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    filters: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px",
      marginBottom: "25px",
      background: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column"
    },
    filterLabel: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#475569",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      gap: "5px"
    },
    select: {
      padding: "10px",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      fontSize: "14px",
      background: "white",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    searchInput: {
      padding: "10px",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      fontSize: "14px",
      background: "white",
      transition: "all 0.2s"
    },
    statsCards: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px",
      marginBottom: "25px"
    },
    statCard: {
      background: "white",
      padding: "15px",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      textAlign: "center",
      border: "1px solid #e2e8f0",
      transition: "transform 0.2s"
    },
    statValue: {
      fontSize: "24px",
      fontWeight: "bold",
      margin: "10px 0 5px 0"
    },
    statLabel: {
      fontSize: "13px",
      color: "#64748b",
      fontWeight: "600"
    },
    sectionHeader: {
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "white",
      padding: "15px 20px",
      borderRadius: "10px",
      marginBottom: "15px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "700",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    studentCard: {
      background: "white",
      borderRadius: "12px",
      marginBottom: "15px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
      transition: "all 0.3s"
    },
    studentHeader: {
      padding: "15px 20px",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "all 0.2s"
    },
    studentInfo: {
      display: "flex",
      alignItems: "center",
      gap: "15px"
    },
    studentAvatar: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: "#3b82f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold",
      fontSize: "16px"
    },
    studentDetails: {
      flex: 1
    },
    studentName: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "3px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexWrap: "wrap"
    },
    studentMeta: {
      fontSize: "12px",
      color: "#64748b",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexWrap: "wrap"
    },
    expandedContent: {
      padding: "20px",
      borderTop: "1px solid #f1f5f9",
      background: "#f8fafc"
    },
    detailGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px",
      marginBottom: "15px"
    },
    detailItem: {
      background: "white",
      padding: "15px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0"
    },
    detailLabel: {
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "5px",
      fontWeight: "600"
    },
    detailValue: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1e293b"
    },
    statusBadge: {
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      border: "1px solid transparent"
    },
    actionButtons: {
      display: "flex",
      gap: "10px",
      marginTop: "20px",
      flexWrap: "wrap"
    },
    primaryButton: {
      padding: "12px 24px",
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s",
      boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)"
    },
    secondaryButton: {
      padding: "12px 24px",
      background: "white",
      color: "#475569",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s"
    },
    resetButton: {
      padding: "12px 24px",
      background: "#f1f5f9",
      color: "#475569",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s"
    },
    progressBar: {
      width: "100%",
      height: "6px",
      background: "#e2e8f0",
      borderRadius: "3px",
      marginTop: "5px",
      overflow: "hidden"
    },
    progressFill: {
      height: "100%",
      background: "linear-gradient(90deg, #10b981 0%, #3b82f6 100%)",
      borderRadius: "3px",
      transition: "width 0.3s ease"
    },
    monthIndicator: {
      padding: "3px 8px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "600"
    },
    currentMonthIndicator: {
      background: "#d1fae5",
      color: "#065f46",
      border: "1px solid #10b981"
    },
    otherMonthIndicator: {
      background: "#dbeafe",
      color: "#1e40af",
      border: "1px solid #3b82f6"
    },
    newAdmissionIndicator: {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #f59e0b"
    },
    installmentBadge: {
      background: "#f0f9ff",
      color: "#0369a1",
      border: "1px solid #7dd3fc",
      padding: "3px 8px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "3px"
    }
  };

  return (
    <div style={styles.container}>
      {/* PROMOTION MODAL */}
      {showPromotionModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "1000px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white",
              padding: "25px 30px",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700" }}>
                  <MoveRight size={24} style={{ marginRight: "10px" }} />
                  {promotionType === "single" ? "Promote Single Student" : "Promote Students to New Month"}
                </h2>
                <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
                  {promotionType === "single" ? "Move this student to a new month" : "Move selected students from one month to another"}
                </p>
              </div>
              <button 
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
                onClick={() => setShowPromotionModal(false)}
                disabled={isPromoting}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "30px" }}>
              {/* Success Message */}
              {promotionMessage && (
                <div style={{
                  background: "#d1fae5",
                  border: "1px solid #10b981",
                  color: "#065f46",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  textAlign: "center",
                  fontWeight: "600"
                }}>
                  {promotionMessage.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}

              {/* Single Student Info */}
              {promotionType === "single" && singleStudentToPromote && (
                <div style={{
                  background: "#f0f9ff",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "1px solid #e0f2fe"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "16px"
                    }}>
                      {singleStudentToPromote.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                        {singleStudentToPromote.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        ID: {singleStudentToPromote.studentId} | Course: {singleStudentToPromote.course}
                      </div>
                    </div>
                  </div>
                  
                  {/* Installment Info */}
                  {singleStudentToPromote.installmentPlan === "installment" && (
                    <div style={{
                      background: "#e0f2fe",
                      padding: "10px",
                      borderRadius: "6px",
                      marginTop: "10px",
                      fontSize: "12px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                        <CreditCard size={12} />
                        <strong>Installment Plan Active:</strong>
                      </div>
                      <div style={{ fontSize: "11px", color: "#0369a1" }}>
                        {singleStudentToPromote.installmentMonthsList?.length || 0} installments
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Promotion Settings */}
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: "20px",
                  paddingBottom: "10px",
                  borderBottom: "2px solid #e2e8f0"
                }}>
                  📅 Month Promotion Settings
                </h3>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: "20px",
                  alignItems: "center",
                  marginBottom: "30px"
                }}>
                  {/* Source Month */}
                  <div>
                    <h4 style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#ef4444",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <Calendar size={16} />
                      From Month (Current)
                    </h4>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <select
                        value={promotionSource.month}
                        onChange={(e) => {
                          setPromotionSource({...promotionSource, month: Number(e.target.value)});
                          setSelectAllStudents(true);
                        }}
                        style={{
                          padding: "10px",
                          border: "2px solid #fca5a5",
                          borderRadius: "6px",
                          fontSize: "14px",
                          background: "white",
                          cursor: "pointer",
                          flex: 1
                        }}
                      >
                        {months.map(month => (
                          <option key={month.value} value={month.value}>{month.name}</option>
                        ))}
                      </select>
                      <select
                        value={promotionSource.year}
                        onChange={(e) => {
                          setPromotionSource({...promotionSource, year: Number(e.target.value)});
                          setSelectAllStudents(true);
                        }}
                        style={{
                          padding: "10px",
                          border: "2px solid #fca5a5",
                          borderRadius: "6px",
                          fontSize: "14px",
                          background: "white",
                          cursor: "pointer",
                          flex: 1
                        }}
                      >
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}>
                      Students in this month: {studentsInSourceMonth.length}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ textAlign: "center" }}>
                    <MoveRight size={32} color="#6b7280" />
                  </div>

                  {/* Target Month */}
                  <div>
                    <h4 style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#10b981",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <Calendar size={16} />
                      To Month (New)
                    </h4>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <select
                        value={promotionTarget.month}
                        onChange={(e) => setPromotionTarget({...promotionTarget, month: Number(e.target.value)})}
                        style={{
                          padding: "10px",
                          border: "2px solid #86efac",
                          borderRadius: "6px",
                          fontSize: "14px",
                          background: "white",
                          cursor: "pointer",
                          flex: 1
                        }}
                      >
                        {months.map(month => (
                          <option key={month.value} value={month.value}>{month.name}</option>
                        ))}
                      </select>
                      <select
                        value={promotionTarget.year}
                        onChange={(e) => setPromotionTarget({...promotionTarget, year: Number(e.target.value)})}
                        style={{
                          padding: "10px",
                          border: "2px solid #86efac",
                          borderRadius: "6px",
                          fontSize: "14px",
                          background: "white",
                          cursor: "pointer",
                          flex: 1
                        }}
                      >
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}>
                      New admission month for selected students
                    </div>
                  </div>
                </div>

                {/* IMPORTANT NOTE */}
                <div style={{
                  background: "#fef3c7",
                  border: "1px solid #f59e0b",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <AlertCircle size={20} color="#92400e" />
                    <strong style={{ color: "#92400e" }}>Important Note:</strong>
                  </div>
                  <div style={{ fontSize: "13px", color: "#92400e" }}>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      <li>After promotion, students will move to the selected target month</li>
                      <li>They will appear in the dashboard when filtering by the new month</li>
                      <li>Original admission date remains unchanged</li>
                      <li>For students with installment plans, if an installment is due for the target month, it will be automatically marked as paid</li>
                    </ul>
                  </div>
                </div>

                {/* STUDENTS LIST WITH CHECKBOXES - ONLY FOR BATCH PROMOTION */}
                {promotionType === "batch" && (
                  <div style={{ 
                    background: "#f8fafc", 
                    padding: "20px", 
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "20px"
                  }}>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: "15px" 
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#1e293b",
                          marginBottom: "5px"
                        }}>
                          Students in {months.find(m => m.value === promotionSource.month)?.name} {promotionSource.year}
                        </h4>
                        <p style={{ fontSize: "12px", color: "#64748b" }}>
                          Select students to promote to next month
                        </p>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer"
                        }}
                        onClick={handleSelectAll}
                        >
                          <div style={{
                            width: "18px",
                            height: "18px",
                            border: "2px solid #3b82f6",
                            borderRadius: "4px",
                            background: selectAllStudents ? "#3b82f6" : "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {selectAllStudents && <Check size={12} color="white" />}
                          </div>
                          <span style={{ 
                            fontSize: "14px", 
                            fontWeight: "600", 
                            color: "#1e293b",
                            userSelect: "none"
                          }}>
                            Select All
                          </span>
                        </div>
                        
                        <div style={{
                          background: selectAllStudents ? "#10b981" : "#f1f5f9",
                          color: selectAllStudents ? "white" : "#475569",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          {selectedStudentsForPromotion.length} of {studentsInSourceMonth.length} selected
                        </div>
                      </div>
                    </div>
                    
                    {studentsInSourceMonth.length === 0 ? (
                      <div style={{ 
                        textAlign: "center", 
                        padding: "40px 20px", 
                        color: "#64748b",
                        background: "white",
                        borderRadius: "8px",
                        border: "1px dashed #e2e8f0"
                      }}>
                        <Users size={40} style={{ opacity: 0.3, marginBottom: "15px" }} />
                        <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}>
                          No students found in this month
                        </div>
                        <div style={{ fontSize: "12px" }}>
                          There are no students in {months.find(m => m.value === promotionSource.month)?.name} {promotionSource.year}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "white"
                      }}>
                        {studentsInSourceMonth.map((student, index) => {
                          const isSelected = selectedStudentsForPromotion.includes(student.studentId);
                          const statusInfo = getStatusInfo(student.status || "Active");
                          const totalFee = Number(student.totalFee) || 0;
                          const feePaid = Number(student.feePaid) || 0;
                          const dueAmount = Math.max(0, totalFee - feePaid);
                          const installmentInfo = getInstallmentInfo(student);
                          
                          return (
                            <div 
                              key={student.studentId}
                              style={{
                                padding: "12px 15px",
                                borderBottom: index < studentsInSourceMonth.length - 1 ? "1px solid #f1f5f9" : "none",
                                background: index % 2 === 0 ? "white" : "#f8fafc",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onClick={() => toggleStudentSelection(student.studentId)}
                            >
                              {/* Checkbox */}
                              <div style={{
                                width: "18px",
                                height: "18px",
                                border: "2px solid #3b82f6",
                                borderRadius: "4px",
                                background: isSelected ? "#3b82f6" : "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                              }}>
                                {isSelected && <Check size={12} color="white" />}
                              </div>
                              
                              {/* Student Avatar */}
                              <div style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: "#3b82f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "14px",
                                flexShrink: 0
                              }}>
                                {student.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              
                              {/* Student Details */}
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  display: "flex", 
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "4px"
                                }}>
                                  <div style={{ 
                                    fontSize: "14px", 
                                    fontWeight: "600", 
                                    color: "#1e293b" 
                                  }}>
                                    {student.name}
                                    {installmentInfo.hasInstallments && (
                                      <span style={styles.installmentBadge}>
                                        <CreditCard size={10} />
                                        Installment: {installmentInfo.paidInstallments}/{installmentInfo.totalInstallments}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: "6px" 
                                  }}>
                                    <span style={{
                                      ...statusInfo,
                                      padding: "4px 8px",
                                      borderRadius: "12px",
                                      fontSize: "10px",
                                      fontWeight: "600",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px"
                                    }}>
                                      {statusInfo.icon}
                                      {student.status || "Active"}
                                    </span>
                                    {dueAmount > 0 && (
                                      <span style={{
                                        background: "#fee2e2",
                                        color: "#dc2626",
                                        padding: "4px 8px",
                                        borderRadius: "12px",
                                        fontSize: "10px",
                                        fontWeight: "600"
                                      }}>
                                        Due: {formatCurrency(dueAmount)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div style={{ 
                                  display: "flex", 
                                  gap: "12px",
                                  fontSize: "11px",
                                  color: "#64748b"
                                }}>
                                  <span>
                                    <strong>ID:</strong> {student.studentId}
                                  </span>
                                  <span>
                                    <Book size={10} /> {student.course || "N/A"}
                                  </span>
                                  <span>
                                    <Phone size={10} /> {student.phone || "N/A"}
                                  </span>
                                  <span>
                                    <CalendarDays size={10} /> {student.admissionMonth || "New"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Selection Summary */}
                    {studentsInSourceMonth.length > 0 && (
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "15px",
                        padding: "12px 15px",
                        background: selectedStudentsForPromotion.length > 0 ? "#dbeafe" : "#f1f5f9",
                        borderRadius: "8px",
                        border: `1px solid ${selectedStudentsForPromotion.length > 0 ? "#3b82f6" : "#e2e8f0"}`
                      }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                            {selectedStudentsForPromotion.length} students selected
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {selectedStudentsForPromotion.length === 0 
                              ? "No students selected for promotion"
                              : selectedStudentsForPromotion.length === studentsInSourceMonth.length
                              ? "All students in this month are selected"
                              : `${selectedStudentsForPromotion.length} of ${studentsInSourceMonth.length} students selected`
                            }
                          </div>
                        </div>
                        
                        <div style={{ 
                          fontSize: "16px", 
                          fontWeight: "bold", 
                          color: selectedStudentsForPromotion.length > 0 ? "#1d4ed8" : "#64748b"
                        }}>
                          {selectedStudentsForPromotion.length} / {studentsInSourceMonth.length}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "15px",
                paddingTop: "20px",
                borderTop: "1px solid #e2e8f0"
              }}>
                <button
                  onClick={() => setShowPromotionModal(false)}
                  style={{
                    padding: "12px 24px",
                    background: "white",
                    color: "#475569",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                  disabled={isPromoting}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handlePromotion}
                  style={{
                    padding: "12px 24px",
                    background: isPromoting 
                      ? "#94a3b8" 
                      : selectedStudentsForPromotion.length === 0 
                        ? "#cbd5e1" 
                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: isPromoting || selectedStudentsForPromotion.length === 0 ? "#64748b" : "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: selectedStudentsForPromotion.length === 0 || isPromoting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: selectedStudentsForPromotion.length > 0 && !isPromoting ? "0 4px 6px rgba(16, 185, 129, 0.3)" : "none"
                  }}
                  disabled={isPromoting || selectedStudentsForPromotion.length === 0}
                >
                  {isPromoting ? (
                    <>
                      <Clock size={16} />
                      Promoting...
                    </>
                  ) : (
                    <>
                      <MoveRight size={16} />
                      {promotionType === "single" 
                        ? "Promote Student" 
                        : `Promote ${selectedStudentsForPromotion.length} Student${selectedStudentsForPromotion.length !== 1 ? 's' : ''}`
                      }
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Calendar size={32} />
            Complete Student List
          </h1>
          <p style={{ color: "#64748b", marginTop: "5px", fontSize: "14px" }}>
            View all students including current month and new admissions
          </p>
        </div>
        <div style={styles.actionButtons}>
          {exportProgress > 0 && exportProgress < 100 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "200px" }}>
              <div style={{ fontSize: "14px", color: "#3b82f6", fontWeight: "600" }}>
                Exporting... {exportProgress}%
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${exportProgress}%` }}></div>
              </div>
            </div>
          ) : (
            <>
              <button onClick={resetFilters} style={styles.resetButton}>
                <X size={18} />
                Reset Filters
              </button>
              <button onClick={exportToCSV} style={styles.secondaryButton}>
                <Download size={18} />
                Export CSV
              </button>
              <button onClick={printReport} style={styles.primaryButton}>
                <Printer size={18} />
                Print Report
              </button>
            </>
          )}
        </div>
      </div>
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}><Calendar size={16} /> Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
            style={{ ...styles.select, borderColor: selectedMonth !== "all" ? "#3b82f6" : "#e2e8f0" }}
          >
            <option value="all">All Months</option>
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}><Calendar size={16} /> Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : Number(e.target.value))}
            style={{ ...styles.select, borderColor: selectedYear !== "all" ? "#3b82f6" : "#e2e8f0" }}
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}><Book size={16} /> Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            style={{ ...styles.select, borderColor: selectedCourse !== "all" ? "#10b981" : "#e2e8f0" }}
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.name}>{course.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}><Filter size={16} /> Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ 
              ...styles.select, 
              borderColor: selectedStatus !== "all" ? 
                getStatusInfo(selectedStatus).color : 
                "#e2e8f0" 
            }}
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Left">Left</option>
            <option value="Passout">Passout</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}><Search size={16} /> Search</label>
          <input
            type="text"
            placeholder="Search by name, ID, phone, father..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...styles.searchInput, borderColor: searchQuery ? "#f59e0b" : "#e2e8f0" }}
          />
        </div>
      </div>

      <div style={styles.statsCards}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Students</div>
          <div style={{ ...styles.statValue, color: "#3b82f6" }}>{stats.total}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>All Time</div>
        </div>
        <div style={{ ...styles.statCard, background: getStatusInfo("Active").bg, borderColor: getStatusInfo("Active").color }}>
          <div style={{ ...styles.statLabel, color: getStatusInfo("Active").color }}>Active</div>
          <div style={{ ...styles.statValue, color: getStatusInfo("Active").color }}>{stats.active}</div>
          <div style={{ fontSize: "12px", color: getStatusInfo("Active").color, opacity: 0.8 }}>Currently Studying</div>
        </div>
        <div style={{ ...styles.statCard, background: "#f0f9ff", borderColor: "#0ea5e9" }}>
          <div style={{ ...styles.statLabel, color: "#0369a1" }}>Active Month</div>
          <div style={{ ...styles.statValue, color: "#0369a1" }}>{activeMonthStudents.length}</div>
          <div style={{ fontSize: "12px", color: "#0369a1", opacity: 0.8 }}>Current: {currentMonthName}</div>
        </div>
        <div style={{ ...styles.statCard, background: "#fef3c7", borderColor: "#f59e0b" }}>
          <div style={{ ...styles.statLabel, color: "#92400e" }}>New Admissions</div>
          <div style={{ ...styles.statValue, color: "#92400e" }}>{stats.newAdmissions}</div>
          <div style={{ fontSize: "12px", color: "#92400e", opacity: 0.8 }}>Not yet assigned</div>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "25px 0" }}>
        <button 
          onClick={openPromotionModal}
          style={{
            padding: "15px 30px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 6px 12px rgba(16, 185, 129, 0.4)",
            transition: "all 0.3s"
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 10px 20px rgba(16, 185, 129, 0.6)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 6px 12px rgba(16, 185, 129, 0.4)";
          }}
        >
          <MoveRight size={20} />
          Promote Students to Next Month
        </button>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "10px" }}>
          Move students from current month to next month in one click
        </p>
      </div>

      {/* Student Lists */}
      {activeMonthStudents.length > 0 && (
        <>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              <Clock size={20} />
              Current Active Month ({currentMonthName}) - {activeMonthStudents.length} Students
            </div>
            <span style={{ fontSize: "14px", opacity: 0.9 }}>
              Students currently in {currentMonthName}
            </span>
          </div>
          
          {activeMonthStudents.map(student => {
            const statusInfo = getStatusInfo(student.status || "Active");
            const isExpanded = expandedStudents[student.studentId];
            const totalFee = Number(student.totalFee) || 0;
            const feePaid = Number(student.feePaid) || 0;
            const dueAmount = Math.max(0, totalFee - feePaid);
            const isNewAdmission = !student.admissionMonth || student.admissionMonth === "";
            const installmentInfo = getInstallmentInfo(student);
            
            return (
              <div key={student.studentId} style={styles.studentCard}>
                <div 
                  style={styles.studentHeader}
                  onClick={() => toggleStudentDetails(student.studentId)}
                >
                  <div style={styles.studentInfo}>
                    <div style={styles.studentAvatar}>
                      {student.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div style={styles.studentDetails}>
                      <div style={styles.studentName}>
                        {student.name}
                        <span style={{
                          ...styles.statusBadge,
                          background: statusInfo.bg,
                          color: statusInfo.color,
                          borderColor: statusInfo.color
                        }}>
                          {statusInfo.icon}
                          {student.status || "Active"}
                        </span>
                        {isNewAdmission ? (
                          <span style={{
                            ...styles.monthIndicator,
                            ...styles.newAdmissionIndicator
                          }}>
                            <AlertCircle size={10} /> New Admission
                          </span>
                        ) : (
                          <span style={{
                            ...styles.monthIndicator,
                            ...styles.currentMonthIndicator
                          }}>
                            <Clock size={10} /> Current Month
                          </span>
                        )}
                        {installmentInfo.hasInstallments && (
                          <span style={styles.installmentBadge}>
                            <CreditCard size={10} />
                            {installmentInfo.paidInstallments}/{installmentInfo.totalInstallments} Installments
                          </span>
                        )}
                        {dueAmount > 0 && (
                          <span style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}>
                            Due: {formatCurrency(dueAmount)}
                          </span>
                        )}
                      </div>
                      <div style={styles.studentMeta}>
                        <span><strong>ID:</strong> {student.studentId}</span>
                        <span><Book size={12} /> {student.course || "N/A"}</span>
                        <span><Phone size={12} /> {student.phone || "N/A"}</span>
                        <span><Calendar size={12} /> {formatDate(student.admissionDate)}</span>
                        <span style={{ color: "#10b981", fontWeight: "600" }}>
                          <DollarSign size={12} /> Paid: {formatCurrency(feePaid)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {isExpanded ? 
                      <ChevronUp size={20} color="#3b82f6" /> : 
                      <ChevronDown size={20} color="#64748b" />
                    }
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.expandedContent}>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Student ID</div>
                        <div style={styles.detailValue}>{student.studentId}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Full Name</div>
                        <div style={styles.detailValue}>{student.name}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Father's Name</div>
                        <div style={styles.detailValue}>{student.fatherName || "N/A"}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Course</div>
                        <div style={styles.detailValue}>{student.course || "N/A"}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Admission Date</div>
                        <div style={styles.detailValue}>{formatDate(student.admissionDate)}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Current Month</div>
                        <div style={styles.detailValue}>
                          <span style={{
                            background: student.admissionMonth ? "#dbeafe" : "#f1f5f9",
                            color: student.admissionMonth ? "#1e40af" : "#475569",
                            padding: "6px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            {student.admissionMonth || "New Admission"}
                          </span>
                        </div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Status</div>
                        <div style={styles.detailValue}>
                          <span style={{
                            ...styles.statusBadge,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            borderColor: statusInfo.color
                          }}>
                            {statusInfo.icon}
                            {student.status || "Active"}
                          </span>
                        </div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Phone Number</div>
                        <div style={styles.detailValue}>{student.phone || "N/A"}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Fees Summary</div>
                        <div style={styles.detailValue}>
                          <div style={{ marginBottom: "8px", fontSize: "15px", fontWeight: "700" }}>
                            Total: {formatCurrency(totalFee)}
                          </div>
                          <div style={{ marginBottom: "6px", color: "#10b981", display: "flex", justifyContent: "space-between" }}>
                            <span>Paid:</span>
                            <span style={{ fontWeight: "600" }}>{formatCurrency(feePaid)}</span>
                          </div>
                          <div style={{ color: dueAmount > 0 ? "#ef4444" : "#10b981", display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                            <span>Due:</span>
                            <span>{formatCurrency(dueAmount)}</span>
                          </div>
                          {installmentInfo.hasInstallments && (
                            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "5px" }}>
                                <strong>Installment Details:</strong>
                              </div>
                              <div style={{ fontSize: "11px", color: "#0369a1" }}>
                                Plan: {installmentInfo.paidInstallments} paid of {installmentInfo.totalInstallments}
                                {installmentInfo.nextInstallment && (
                                  <div style={{ marginTop: "5px", color: "#92400e" }}>
                                    Next: {installmentInfo.nextInstallment.month} {installmentInfo.nextInstallment.year} - {formatCurrency(installmentInfo.installmentAmount)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "20px",
                      paddingTop: "20px",
                      borderTop: "1px solid #e2e8f0",
                      flexWrap: "wrap"
                    }}>
                      <button
                        onClick={() => openPromotionModalForStudent(student)}
                        style={{
                          padding: "10px 20px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                          minWidth: "200px"
                        }}
                      >
                        <MoveRight size={16} />
                        Promote to Next Month
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(student.studentId);
                          alert(`Student ID ${student.studentId} copied to clipboard!`);
                        }}
                        style={{
                          padding: "10px 20px",
                          background: "white",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                          minWidth: "150px"
                        }}
                      >
                        <FileText size={16} />
                        Copy ID
                      </button>
                      {installmentInfo.hasInstallments && installmentInfo.nextInstallment && (
                        <button
                          onClick={() => {
                            const installmentAmount = installmentInfo.installmentAmount;
                            const confirmPay = window.confirm(
                              `Mark installment for ${installmentInfo.nextInstallment.month} ${installmentInfo.nextInstallment.year} as paid?\n\nAmount: ${formatCurrency(installmentAmount)}`
                            );
                            if (confirmPay) {
                              // Update student data with paid installment
                              const updatedStudents = allStudents.map(s => {
                                if (s.studentId === student.studentId) {
                                  const updatedInstallmentList = s.installmentMonthsList.map(installment => 
                                    `${installment.month} ${installment.year}` === `${installmentInfo.nextInstallment.month} ${installmentInfo.nextInstallment.year}`
                                      ? { ...installment, paid: true, paidDate: new Date().toISOString().split('T')[0] }
                                      : installment
                                  );
                                  
                                  const newFeePaid = Number(s.feePaid || 0) + installmentAmount;
                                  
                                  return {
                                    ...s,
                                    feePaid: Math.min(newFeePaid, Number(s.totalFee || 0)),
                                    installmentMonthsList: updatedInstallmentList,
                                    paymentHistory: [
                                      ...(s.paymentHistory || []),
                                      {
                                        date: new Date().toISOString().split('T')[0],
                                        amount: installmentAmount,
                                        type: "installment",
                                        month: `${installmentInfo.nextInstallment.month} ${installmentInfo.nextInstallment.year}`,
                                        description: "Manual installment payment"
                                      }
                                    ]
                                  };
                                }
                                return s;
                              });
                              
                              localStorage.setItem("students", JSON.stringify(updatedStudents));
                              alert(`Installment marked as paid!\nAmount: ${formatCurrency(installmentAmount)}`);
                              window.location.reload();
                            }
                          }}
                          style={{
                            padding: "10px 20px",
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flex: 1,
                            minWidth: "200px"
                          }}
                        >
                          <CreditCard size={16} />
                          Mark Installment Paid
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {otherStudents.length > 0 && (
        <>
          <div style={{ ...styles.sectionHeader, background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}>
            <div style={styles.sectionTitle}>
              <Calendar size={20} />
              Other Months - {otherStudents.length} Students
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              Students from previous or future months
            </div>
          </div>
          
          {otherStudents.map(student => {
            const statusInfo = getStatusInfo(student.status || "Active");
            const isExpanded = expandedStudents[student.studentId];
            const totalFee = Number(student.totalFee) || 0;
            const feePaid = Number(student.feePaid) || 0;
            const dueAmount = Math.max(0, totalFee - feePaid);
            const installmentInfo = getInstallmentInfo(student);
            
            return (
              <div key={student.studentId} style={styles.studentCard}>
                <div 
                  style={styles.studentHeader}
                  onClick={() => toggleStudentDetails(student.studentId)}
                >
                  <div style={styles.studentInfo}>
                    <div style={styles.studentAvatar}>
                      {student.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div style={styles.studentDetails}>
                      <div style={styles.studentName}>
                        {student.name}
                        <span style={{
                          ...styles.statusBadge,
                          background: statusInfo.bg,
                          color: statusInfo.color,
                          borderColor: statusInfo.color
                        }}>
                          {statusInfo.icon}
                          {student.status || "Active"}
                        </span>
                        <span style={{
                          ...styles.monthIndicator,
                          ...styles.otherMonthIndicator
                        }}>
                          <Calendar size={10} /> {student.admissionMonth || "Not Assigned"}
                        </span>
                        {installmentInfo.hasInstallments && (
                          <span style={styles.installmentBadge}>
                            <CreditCard size={10} />
                            {installmentInfo.paidInstallments}/{installmentInfo.totalInstallments}
                          </span>
                        )}
                        {dueAmount > 0 && (
                          <span style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}>
                            Due: {formatCurrency(dueAmount)}
                          </span>
                        )}
                      </div>
                      <div style={styles.studentMeta}>
                        <span><strong>ID:</strong> {student.studentId}</span>
                        <span><Book size={12} /> {student.course || "N/A"}</span>
                        <span><Phone size={12} /> {student.phone || "N/A"}</span>
                        <span><Calendar size={12} /> {formatDate(student.admissionDate)}</span>
                        <span style={{ color: "#10b981", fontWeight: "600" }}>
                          <DollarSign size={12} /> Paid: {formatCurrency(feePaid)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {isExpanded ? 
                      <ChevronUp size={20} color="#3b82f6" /> : 
                      <ChevronDown size={20} color="#64748b" />
                    }
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.expandedContent}>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Student ID</div>
                        <div style={styles.detailValue}>{student.studentId}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Full Name</div>
                        <div style={styles.detailValue}>{student.name}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Father's Name</div>
                        <div style={styles.detailValue}>{student.fatherName || "N/A"}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Course</div>
                        <div style={styles.detailValue}>{student.course || "N/A"}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Admission Date</div>
                        <div style={styles.detailValue}>{formatDate(student.admissionDate)}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Current Month</div>
                        <div style={styles.detailValue}>
                          <span style={{
                            background: "#dbeafe",
                            color: "#1e40af",
                            padding: "6px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            {student.admissionMonth || "Not Assigned"}
                          </span>
                        </div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Status</div>
                        <div style={styles.detailValue}>
                          <span style={{
                            ...styles.statusBadge,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            borderColor: statusInfo.color
                          }}>
                            {statusInfo.icon}
                            {student.status || "Active"}
                          </span>
                        </div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Phone Number</div>
                        <div style={styles.detailValue}>{student.phone || "N/A"}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Fees Summary</div>
                        <div style={styles.detailValue}>
                          <div style={{ marginBottom: "8px", fontSize: "15px", fontWeight: "700" }}>
                            Total: {formatCurrency(totalFee)}
                          </div>
                          <div style={{ marginBottom: "6px", color: "#10b981", display: "flex", justifyContent: "space-between" }}>
                            <span>Paid:</span>
                            <span style={{ fontWeight: "600" }}>{formatCurrency(feePaid)}</span>
                          </div>
                          <div style={{ color: dueAmount > 0 ? "#ef4444" : "#10b981", display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                            <span>Due:</span>
                            <span>{formatCurrency(dueAmount)}</span>
                          </div>
                          {installmentInfo.hasInstallments && (
                            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "5px" }}>
                                <strong>Installment Details:</strong>
                              </div>
                              <div style={{ fontSize: "11px", color: "#0369a1" }}>
                                Plan: {installmentInfo.paidInstallments} paid of {installmentInfo.totalInstallments}
                                {installmentInfo.nextInstallment && (
                                  <div style={{ marginTop: "5px", color: "#92400e" }}>
                                    Next: {installmentInfo.nextInstallment.month} {installmentInfo.nextInstallment.year} - {formatCurrency(installmentInfo.installmentAmount)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "20px",
                      paddingTop: "20px",
                      borderTop: "1px solid #e2e8f0",
                      flexWrap: "wrap"
                    }}>
                      <button
                        onClick={() => openPromotionModalForStudent(student)}
                        style={{
                          padding: "10px 20px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                          minWidth: "200px"
                        }}
                      >
                        <MoveRight size={16} />
                        Promote to Next Month
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(student.studentId);
                          alert(`Student ID ${student.studentId} copied to clipboard!`);
                        }}
                        style={{
                          padding: "10px 20px",
                          background: "white",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                          minWidth: "150px"
                        }}
                      >
                        <FileText size={16} />
                        Copy ID
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {allStudents.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px", 
          color: "#64748b",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <Users size={80} style={{ opacity: 0.2, marginBottom: "20px" }} />
          <h3 style={{ color: "#475569", marginBottom: "10px", fontSize: "20px" }}>
            No Students Found
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto 20px auto" }}>
            No students found in the system. Please add students through the New Admission form.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px", 
          color: "#64748b",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <Filter size={80} style={{ opacity: 0.2, marginBottom: "20px" }} />
          <h3 style={{ color: "#475569", marginBottom: "10px", fontSize: "20px" }}>
            No Students Match Your Filters
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto 20px auto" }}>
            Try adjusting your filters to see more students.
          </p>
          <button 
            onClick={resetFilters}
            style={{
              padding: "10px 20px",
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default MonthWiseStudentList;