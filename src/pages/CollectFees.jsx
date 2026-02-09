import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, User, Calendar, CreditCard, 
  ArrowLeft, CheckCircle, Printer, 
  AlertCircle, ChevronDown, Search, Users,
  CheckSquare, IndianRupee, Package,
  CalendarDays, Grid, Tag, Layers,
  FileSpreadsheet, History, Clock,
  AlertTriangle, Info, Scissors,
  PlusCircle, Trash2, X,
  Percent, BadgePercent, Receipt
} from "lucide-react";

// Import Academy Config
import { getAcademyConfig } from "../config/academyConfig";

// Helper function to normalize extra fees
const normalizeExtraFees = (fees) => {
  if (!fees || !Array.isArray(fees)) return [];
  
  return fees.map(fee => {
    if (typeof fee === 'string') {
      return {
        id: Date.now() + Math.random(),
        name: fee,
        amount: 0,
        paid: 0,
        due: 0
      };
    }
    
    const amount = Number(fee.amount) || 0;
    const paid = Number(fee.paid) || 0;
    const due = Math.max(0, amount - paid);
    
    return {
      id: fee.id || Date.now() + Math.random(),
      name: fee.name || fee.feeName || "Extra Fee",
      amount: amount,
      paid: paid,
      due: due
    };
  });
};

// Format currency function
const formatCurrency = (value) => {
  const numValue = Number(value || 0);
  return `RS ${numValue.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

// Format date function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-IN', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const CollectFees = ({ 
  student: initialStudent, 
  students, 
  setStudents, 
  studentFees, 
  setStudentFees,
  onBack,
  onPaymentSuccess
}) => {
  const navigate = useNavigate();
  const amountInputRef = useRef(null);
  
  // Academy configuration
  const [academyConfig, setAcademyConfig] = useState(getAcademyConfig());
  
  // Get current date
  const currentDate = new Date();
  const todayDate = currentDate.toISOString().split("T")[0];
  const currentMonthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  const monthsArr = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const [currentStudent, setCurrentStudent] = useState(initialStudent || null);
  const [loading, setLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState(todayDate);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  const [installments, setInstallments] = useState([]);
  const [selectedExtraFees, setSelectedExtraFees] = useState([]);
  const [paymentType, setPaymentType] = useState("tuition");
  const [payAllMode, setPayAllMode] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(0);
  
  // States for Apply Fee to All feature
  const [showApplyFeeToAll, setShowApplyFeeToAll] = useState(false);
  const [newFeeName, setNewFeeName] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");
  const [applyToAllLoading, setApplyToAllLoading] = useState(false);
  const [applyFeeMode, setApplyFeeMode] = useState("add"); // "add" or "delete"
  const [selectedFeeToDelete, setSelectedFeeToDelete] = useState("");

  // States for Discount feature
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState("fixed"); // "fixed" or "percentage"
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [discountedAmount, setDiscountedAmount] = useState(0);
  const [originalAmount, setOriginalAmount] = useState(0);

  // Calculate installment start month based on admission date - FIXED VERSION
  const calculateInstallmentStartMonth = useCallback((admissionDate) => {
    if (!admissionDate) {
      const now = new Date();
      return {
        month: monthsArr[now.getMonth()],
        monthIndex: now.getMonth(),
        year: now.getFullYear()
      };
    }
    
    const date = new Date(admissionDate);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    
    // If admission is after 20th of the month, start installments from next month
    if (day > 20) {
      let nextMonthIndex = monthIndex + 1;
      let nextYear = year;
      
      if (nextMonthIndex >= 12) {
        nextMonthIndex = 0;
        nextYear = year + 1;
      }
      
      return {
        month: monthsArr[nextMonthIndex],
        monthIndex: nextMonthIndex,
        year: nextYear
      };
    } else {
      return {
        month: monthsArr[monthIndex],
        monthIndex: monthIndex,
        year: year
      };
    }
  }, [monthsArr]);

  // Calculate overdue months - FIXED FUNCTION
  const calculateOverdueMonths = useCallback((dueDate) => {
    if (!dueDate) return { overdue: false, overdueMonths: 0 };
    
    const today = new Date();
    const due = new Date(dueDate);
    
    const monthsOverdue = (today.getFullYear() - due.getFullYear()) * 12 + 
                         (today.getMonth() - due.getMonth());
    
    const overdue = monthsOverdue > 0;
    
    return {
      overdue: overdue,
      overdueMonths: Math.max(0, monthsOverdue)
    };
  }, []);

  // Get all unique fee names from all students
  const allFeeNames = useMemo(() => {
    if (!students || students.length === 0) return [];
    
    const feeNames = new Set();
    students.forEach(student => {
      const fees = normalizeExtraFees(student.selectedExtraFees || []);
      fees.forEach(fee => {
        if (fee.name && fee.name.trim()) {
          feeNames.add(fee.name);
        }
      });
    });
    
    return Array.from(feeNames).sort();
  }, [students]);

  // Generate transaction number
  useEffect(() => {
    const generateTxn = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `TXN${year}${month}${day}${random}`;
    };
    
    setTransactionNumber(generateTxn());
  }, []);

  // FIXED: Generate installments based on admission date (matching NewAdmission concept)
  const generateInstallments = useCallback((student) => {
    if (!student) return;
    
    // Get total months from course duration or installment months
    const totalMonths = Number(student.courseDuration) || Number(student.installmentMonths) || 1;
    
    // Get monthly fee
    const monthlyFee = Number(student.monthlyFee) || 
                      (Number(student.courseFee) || 0) / totalMonths;
    
    // Get total course fee
    const tuitionFee = Number(student.courseFee) || Number(student.tuitionFee) || 0;
    
    // Check if student already has installmentMonthsList from NewAdmission
    let installmentList = student.installmentMonthsList || [];
    
    // If no installment list exists or it's empty, generate one based on admission date
    if (installmentList.length === 0 && student.admissionDate) {
      const { monthIndex: startMonthIndex, year: startYear } = calculateInstallmentStartMonth(student.admissionDate);
      
      let currentYear = startYear;
      let monthIndex = startMonthIndex;
      
      for (let i = 1; i <= totalMonths; i++) {
        // Get month name from monthsArr using monthIndex
        const monthName = monthsArr[monthIndex];
        
        // Get short month name (JAN, FEB, etc.)
        const shortMonthName = new Date(currentYear, monthIndex, 1)
          .toLocaleString('en-US', { month: 'short' })
          .toUpperCase();
        
        // Calculate installment amount (last installment may be different due to rounding)
        let installmentAmount = monthlyFee;
        if (i === totalMonths) {
          // For last installment, calculate remaining amount
          installmentAmount = tuitionFee - (monthlyFee * (totalMonths - 1));
        }
        
        installmentList.push({
          month: i,
          monthName: monthName,
          shortMonthName: shortMonthName,
          year: currentYear,
          dueDate: new Date(currentYear, monthIndex, 10).toISOString().split('T')[0], // 10th of each month
          amount: installmentAmount,
          displayName: `${shortMonthName} ${currentYear}`
        });
        
        // Move to next month
        monthIndex++;
        if (monthIndex >= 12) {
          monthIndex = 0;
          currentYear++;
        }
      }
    } else if (installmentList.length > 0) {
      // Ensure all installment items have proper month names
      installmentList = installmentList.map((inst, index) => {
        // Check if this is from NewAdmission (might have different structure)
        const isNewAdmissionFormat = inst.month && typeof inst.month === 'string' && inst.year && !inst.monthName;
        
        if (isNewAdmissionFormat) {
          // This is from NewAdmission format: {month: "January", year: 2024, ...}
          const monthName = inst.month;
          const shortMonthName = monthName.substring(0, 3).toUpperCase();
          const dueDate = inst.dueDate || new Date(inst.year, monthsArr.indexOf(monthName), 10).toISOString().split('T')[0];
          
          return {
            ...inst,
            monthName: monthName,
            shortMonthName: shortMonthName,
            displayName: `${shortMonthName} ${inst.year}`,
            dueDate: dueDate
          };
        }
        
        // If monthName is missing or undefined, calculate it
        if (!inst.monthName || inst.monthName === 'undefined') {
          let monthName, shortMonthName, year, dueDateStr;
          
          // Try to get from dueDate first
          if (inst.dueDate) {
            const dueDate = new Date(inst.dueDate);
            const monthIndex = dueDate.getMonth();
            monthName = monthsArr[monthIndex];
            shortMonthName = dueDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            year = dueDate.getFullYear();
            dueDateStr = inst.dueDate;
          } 
          // Try to get from year and installment number
          else if (inst.year && inst.month && student.admissionDate) {
            const { monthIndex: startMonthIndex, year: startYear } = calculateInstallmentStartMonth(student.admissionDate);
            let monthIndex = (startMonthIndex + inst.month - 1) % 12;
            year = startYear + Math.floor((startMonthIndex + inst.month - 1) / 12);
            monthName = monthsArr[monthIndex];
            shortMonthName = new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' }).toUpperCase();
            dueDateStr = new Date(year, monthIndex, 10).toISOString().split('T')[0];
          }
          
          return {
            ...inst,
            monthName: monthName || monthsArr[index % 12],
            shortMonthName: shortMonthName || monthsArr[index % 12].substring(0, 3).toUpperCase(),
            year: year || currentYear + Math.floor(index / 12),
            dueDate: dueDateStr || new Date(currentYear + Math.floor(index / 12), index % 12, 10).toISOString().split('T')[0],
            displayName: `${shortMonthName || monthsArr[index % 12].substring(0, 3).toUpperCase()} ${year || currentYear + Math.floor(index / 12)}`
          };
        }
        
        // If displayName is missing, create it
        if (!inst.displayName && inst.shortMonthName && inst.year) {
          return {
            ...inst,
            displayName: `${inst.shortMonthName} ${inst.year}`
          };
        }
        
        return inst;
      });
    }
    
    // Get all tuition payments for this student
    const allFees = JSON.parse(localStorage.getItem('studentFees') || '[]');
    const studentTuitionPayments = allFees.filter(fee => 
      fee.studentId === student.studentId && fee.type === 'tuition'
    );
    
    const installs = [];
    
    installmentList.forEach((instData, index) => {
      // Ensure we have all required fields
      let monthName = instData.monthName;
      let shortMonthName = instData.shortMonthName;
      let year = instData.year;
      let dueDateStr = instData.dueDate;
      let installmentAmount = instData.amount || monthlyFee;
      
      // If any field is missing, calculate it
      if (!monthName || !shortMonthName || !year || !dueDateStr) {
        // Calculate from admission date and month number
        const admissionDate = new Date(student.admissionDate);
        const { monthIndex: startMonthIndex, year: startYear } = calculateInstallmentStartMonth(student.admissionDate);
        
        // Calculate month index for this installment
        let monthIndex = (startMonthIndex + instData.month - 1) % 12;
        let calcYear = startYear + Math.floor((startMonthIndex + instData.month - 1) / 12);
        
        monthName = monthsArr[monthIndex];
        shortMonthName = new Date(calcYear, monthIndex, 1)
          .toLocaleString('en-US', { month: 'short' })
          .toUpperCase();
        year = calcYear;
        dueDateStr = new Date(calcYear, monthIndex, 10).toISOString().split('T')[0];
        
        // Calculate installment amount for last installment
        if (instData.month === totalMonths) {
          installmentAmount = tuitionFee - (monthlyFee * (totalMonths - 1));
        }
      }
      
      const dueDate = new Date(dueDateStr);
      
      // Calculate paid amount for this installment from payment history
      const monthPayments = studentTuitionPayments.filter(p => p.month === instData.month);
      const paidAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const dueAmount = Math.max(0, installmentAmount - paidAmount);
      
      // Check if overdue
      const overdueInfo = calculateOverdueMonths(dueDateStr);
      
      let status = 'Pending';
      if (dueAmount === 0) {
        status = 'Paid';
      } else if (paidAmount > 0 && dueAmount > 0) {
        status = 'Partial';
      } else if (overdueInfo.overdue) {
        status = 'Overdue';
      }
      
      // Create display name
      const displayName = `${shortMonthName} ${year}`;
      
      installs.push({
        month: instData.month,
        monthName: monthName,
        shortMonthName: shortMonthName,
        year: year,
        dueDate: dueDateStr,
        amount: installmentAmount,
        paid: paidAmount,
        due: dueAmount,
        status: status,
        overdue: overdueInfo.overdue,
        overdueMonths: overdueInfo.overdueMonths,
        expectedDueDate: dueDate,
        originalDue: installmentAmount,
        displayName: displayName
      });
    });
    
    // Sort installments by month number
    installs.sort((a, b) => a.month - b.month);
    
    setInstallments(installs);
    
    // Find first unpaid installment
    const firstUnpaidIndex = installs.findIndex(inst => inst.due > 0);
    if (firstUnpaidIndex >= 0) {
      setSelectedMonth(firstUnpaidIndex);
      setSelectedInstallments([firstUnpaidIndex]);
      setAmount(installs[firstUnpaidIndex].due.toString());
    } else if (installs.length > 0) {
      setSelectedMonth(installs.length - 1);
      setSelectedInstallments([installs.length - 1]);
      setAmount("0");
    }
  }, [calculateInstallmentStartMonth, calculateOverdueMonths, monthsArr]);

  // Helper function to generate updated installments after payment
  const generateUpdatedInstallments = useCallback((student, newPayments) => {
    if (!student) return [];
    
    // Get total months from course duration or installment months
    const totalMonths = Number(student.courseDuration) || Number(student.installmentMonths) || 1;
    
    // Get monthly fee
    const monthlyFee = Number(student.monthlyFee) || 
                      (Number(student.courseFee) || 0) / totalMonths;
    
    // Get total course fee
    const tuitionFee = Number(student.courseFee) || Number(student.tuitionFee) || 0;
    
    // Check if student already has installmentMonthsList
    let installmentList = student.installmentMonthsList || [];
    
    // If no installment list exists, generate one based on admission date
    if (installmentList.length === 0 && student.admissionDate) {
      const { monthIndex: startMonthIndex, year: startYear } = calculateInstallmentStartMonth(student.admissionDate);
      
      let currentYear = startYear;
      let monthIndex = startMonthIndex;
      
      for (let i = 1; i <= totalMonths; i++) {
        const monthName = monthsArr[monthIndex];
        const shortMonthName = new Date(currentYear, monthIndex, 1).toLocaleString('en-US', { month: 'short' }).toUpperCase();
        
        // Calculate installment amount
        let installmentAmount = monthlyFee;
        if (i === totalMonths) {
          installmentAmount = tuitionFee - (monthlyFee * (totalMonths - 1));
        }
        
        installmentList.push({
          month: i,
          monthName: monthName,
          shortMonthName: shortMonthName,
          year: currentYear,
          dueDate: new Date(currentYear, monthIndex, 10).toISOString().split('T')[0],
          amount: installmentAmount,
          displayName: `${shortMonthName} ${currentYear}`
        });
        
        // Move to next month
        monthIndex++;
        if (monthIndex >= 12) {
          monthIndex = 0;
          currentYear++;
        }
      }
    }
    
    // Get all tuition payments including new ones
    const allFees = JSON.parse(localStorage.getItem('studentFees') || '[]');
    const studentTuitionPayments = [
      ...allFees.filter(fee => fee.studentId === student.studentId && fee.type === 'tuition'),
      ...(newPayments.filter(p => p.type === 'tuition'))
    ];
    
    const installs = [];
    
    installmentList.forEach((instData, index) => {
      const dueDate = new Date(instData.dueDate);
      
      // Calculate paid amount for this installment
      const monthPayments = studentTuitionPayments.filter(p => p.month === instData.month);
      const paidAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const dueAmount = Math.max(0, instData.amount - paidAmount);
      
      // Check if overdue
      const overdueInfo = calculateOverdueMonths(instData.dueDate);
      
      let status = 'Pending';
      if (dueAmount === 0) {
        status = 'Paid';
      } else if (paidAmount > 0 && dueAmount > 0) {
        status = 'Partial';
      } else if (overdueInfo.overdue) {
        status = 'Overdue';
      }
      
      installs.push({
        month: instData.month,
        monthName: instData.monthName,
        shortMonthName: instData.shortMonthName,
        year: instData.year,
        dueDate: instData.dueDate,
        amount: instData.amount,
        paid: paidAmount,
        due: dueAmount,
        status: status,
        overdue: overdueInfo.overdue,
        overdueMonths: overdueInfo.overdueMonths,
        expectedDueDate: dueDate,
        originalDue: instData.amount,
        displayName: `${instData.shortMonthName} ${instData.year}`
      });
    });
    
    // Sort installments by month number
    installs.sort((a, b) => a.month - b.month);
    
    return installs;
  }, [calculateInstallmentStartMonth, calculateOverdueMonths, monthsArr]);

  // Load student data
  useEffect(() => {
    let studentData = initialStudent;
    
    if (!studentData && students && students.length > 0) {
      studentData = students[0];
    }
    
    if (studentData) {
      const normalizedStudent = {
        ...studentData,
        selectedExtraFees: normalizeExtraFees(studentData.selectedExtraFees || [])
      };
      
      setCurrentStudent(normalizedStudent);
      generateInstallments(normalizedStudent);
      loadPaymentHistory(normalizedStudent);
    }
  }, [initialStudent, students, generateInstallments]);

  // Filter students
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students || []);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = (students || []).filter(student => 
        student.name.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query) ||
        student.fatherName?.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  // Load payment history
  const loadPaymentHistory = (student) => {
    const allFees = JSON.parse(localStorage.getItem('studentFees') || '[]');
    const studentPayments = allFees
      .filter(fee => fee.studentId === student.studentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setPaymentHistory(studentPayments);
  };

  const handleSelectStudent = (student) => {
    const normalizedStudent = {
      ...student,
      selectedExtraFees: normalizeExtraFees(student.selectedExtraFees || [])
    };
    
    setCurrentStudent(normalizedStudent);
    setShowStudentSearch(false);
    setSearchQuery("");
    setAmount("");
    setReceiptData(null);
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedExtraFees([]);
    setSelectedInstallments([]);
    setPayAllMode(false);
    setPaymentType("tuition");
    setAppliedDiscounts([]);
    setDiscountedAmount(0);
    setOriginalAmount(0);
    
    generateInstallments(normalizedStudent);
    loadPaymentHistory(normalizedStudent);
    
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
  };

  const handleMonthSelect = (index) => {
    if (payAllMode) {
      const isSelected = selectedInstallments.includes(index);
      if (isSelected) {
        setSelectedInstallments(prev => prev.filter(i => i !== index));
      } else {
        setSelectedInstallments(prev => [...prev, index]);
      }
    } else {
      setSelectedMonth(index);
      setSelectedInstallments([index]);
      if (installments[index]?.due > 0) {
        setAmount(installments[index].due.toString());
      } else {
        setAmount("0");
      }
    }
    
    // Calculate total amount
    calculateTotalAmount();
  };

  const handleExtraFeeSelect = (fee) => {
    if (!fee) return;
    
    const isSelected = selectedExtraFees.some(f => f.id === fee.id);
    
    if (isSelected) {
      setSelectedExtraFees(prev => prev.filter(f => f.id !== fee.id));
    } else {
      setSelectedExtraFees(prev => [...prev, fee]);
    }
    
    setPaymentType("extra");
    calculateTotalAmount();
  };

  const handleSelectAllExtraFees = () => {
    if (!currentStudent?.selectedExtraFees) return;
    
    const normalizedFees = normalizeExtraFees(currentStudent.selectedExtraFees);
    const feesWithDue = normalizedFees.filter(fee => fee.due > 0);
    
    if (selectedExtraFees.length === feesWithDue.length) {
      setSelectedExtraFees([]);
    } else {
      setSelectedExtraFees(feesWithDue);
    }
    
    setPaymentType("extra");
    calculateTotalAmount();
  };

  const handleSelectAllInstallments = () => {
    if (installments.length === 0) return;
    
    const unpaidInstallments = installments
      .map((inst, index) => ({ ...inst, index }))
      .filter(inst => inst.due > 0);
    
    if (selectedInstallments.length === unpaidInstallments.length) {
      setSelectedInstallments([]);
    } else {
      setSelectedInstallments(unpaidInstallments.map(inst => inst.index));
    }
    
    calculateTotalAmount();
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (type === "tuition") {
      setSelectedExtraFees([]);
      if (!payAllMode && installments[selectedMonth]) {
        setSelectedInstallments([selectedMonth]);
        setAmount(installments[selectedMonth]?.due.toString() || "0");
      }
    } else {
      if (!payAllMode) {
        setSelectedInstallments([]);
        setAmount(selectedExtraFees.reduce((sum, fee) => sum + (fee.due || 0), 0).toString());
      }
    }
  };

  const handlePayAllToggle = () => {
    const newPayAllMode = !payAllMode;
    setPayAllMode(newPayAllMode);
    
    if (newPayAllMode) {
      // Select all unpaid installments
      const unpaidInstallments = installments
        .map((inst, index) => ({ ...inst, index }))
        .filter(inst => inst.due > 0);
      setSelectedInstallments(unpaidInstallments.map(inst => inst.index));
      
      // Select all unpaid extra fees
      const normalizedFees = normalizeExtraFees(currentStudent?.selectedExtraFees || []);
      const feesWithDue = normalizedFees.filter(fee => fee.due > 0);
      setSelectedExtraFees(feesWithDue);
    } else {
      // Reset to single installment mode
      const firstUnpaidIndex = installments.findIndex(inst => inst.due > 0);
      if (firstUnpaidIndex >= 0) {
        setSelectedInstallments([firstUnpaidIndex]);
        setAmount(installments[firstUnpaidIndex].due.toString());
      } else {
        setSelectedInstallments([]);
        setAmount("0");
      }
      setSelectedExtraFees([]);
    }
    calculateTotalAmount();
  };

  // Calculate total amount with discount
  const calculateTotalAmount = useCallback(() => {
    const installmentsTotal = selectedInstallments.reduce((sum, i) => {
      const inst = installments[i];
      return sum + (inst?.due || 0);
    }, 0);
    
    const extraFeesTotal = selectedExtraFees.reduce((sum, fee) => sum + (fee.due || 0), 0);
    const total = installmentsTotal + extraFeesTotal;
    
    // Save original amount before discount
    setOriginalAmount(total);
    
    // Apply discount if any
    const totalDiscount = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);
    if (totalDiscount > 0) {
      setAmount(Math.max(0, total - totalDiscount).toString());
    } else {
      setAmount(total.toString());
    }
  }, [selectedInstallments, selectedExtraFees, installments, appliedDiscounts]);

  // Calculate discount amount
  const calculateDiscountAmount = useCallback((total, type, value) => {
    if (!value || parseFloat(value) <= 0) return 0;
    
    let discount = 0;
    if (type === "percentage") {
      const percentage = Math.min(100, Math.max(0, parseFloat(value) || 0));
      discount = (total * percentage) / 100;
    } else {
      discount = Math.min(total, parseFloat(value) || 0);
    }
    
    return discount;
  }, []);

  // Apply discount
  const handleApplyDiscount = () => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      setErrorMessage("Please enter a valid discount value!");
      return;
    }
    
    const discountAmount = calculateDiscountAmount(originalAmount, discountType, discountValue);
    
    if (discountAmount <= 0) {
      setErrorMessage("Invalid discount amount!");
      return;
    }
    
    const discountRecord = {
      id: Date.now() + Math.random(),
      type: discountType,
      value: parseFloat(discountValue),
      reason: discountReason || "Discount applied",
      amount: discountAmount,
      date: new Date().toISOString(),
      appliedBy: "Admin"
    };
    
    setAppliedDiscounts(prev => [...prev, discountRecord]);
    setDiscountedAmount(prev => prev + discountAmount);
    
    // Update the amount after discount
    const newAmount = Math.max(0, originalAmount - (discountedAmount + discountAmount));
    setAmount(newAmount.toString());
    
    setDiscountValue("");
    setDiscountReason("");
    setDiscountType("fixed");
    setShowDiscountModal(false);
    
    setSuccessMessage(`Discount of ${formatCurrency(discountAmount)} applied successfully!`);
  };

  // Remove discount
  const handleRemoveDiscount = (discountId) => {
    const discountToRemove = appliedDiscounts.find(d => d.id === discountId);
    if (discountToRemove) {
      setAppliedDiscounts(prev => prev.filter(d => d.id !== discountId));
      setDiscountedAmount(prev => prev - discountToRemove.amount);
      
      // Update the amount after removing discount
      const newAmount = Math.max(0, originalAmount - (discountedAmount - discountToRemove.amount));
      setAmount(newAmount.toString());
      
      setSuccessMessage("Discount removed successfully!");
    }
  };

  // Clear all discounts
  const handleClearAllDiscounts = () => {
    setAppliedDiscounts([]);
    setDiscountedAmount(0);
    setAmount(originalAmount.toString());
    setSuccessMessage("All discounts cleared!");
  };

  // Update amount whenever selections change or discount changes
  useEffect(() => {
    calculateTotalAmount();
  }, [selectedInstallments, selectedExtraFees, calculateTotalAmount]);

  // Apply fee to all students function
  const handleApplyFeeToAll = async () => {
    if (!newFeeName.trim() || !newFeeAmount || Number(newFeeAmount) <= 0) {
      setErrorMessage("Please enter valid fee name and amount!");
      return;
    }
    
    setApplyToAllLoading(true);
    setErrorMessage("");
    
    try {
      const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
      const feeName = newFeeName.trim();
      const feeAmount = Number(newFeeAmount);
      
      const updatedStudents = existingStudents.map(student => {
        const currentExtraFees = normalizeExtraFees(student.selectedExtraFees || []);
        
        // Check if fee already exists
        const existingFeeIndex = currentExtraFees.findIndex(f => 
          f.name.toLowerCase() === feeName.toLowerCase()
        );
        
        if (existingFeeIndex >= 0) {
          // Update existing fee - keep paid amount, update due
          const existingFee = currentExtraFees[existingFeeIndex];
          const newDue = Math.max(0, feeAmount - (existingFee.paid || 0));
          
          currentExtraFees[existingFeeIndex] = {
            ...existingFee,
            amount: feeAmount,
            due: newDue
          };
        } else {
          // Add new fee
          currentExtraFees.push({
            id: Date.now() + Math.random(),
            name: feeName,
            amount: feeAmount,
            paid: 0,
            due: feeAmount
          });
        }
        
        // Calculate totals
        const tuitionFee = Number(student.courseFee) || Number(student.tuitionFee) || 0;
        const extraFeesTotal = currentExtraFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
        const extraFeesPaid = currentExtraFees.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0);
        const totalFee = tuitionFee + extraFeesTotal;
        const totalPaid = (Number(student.feePaid) || 0) + extraFeesPaid;
        const feeDue = Math.max(0, totalFee - totalPaid);
        
        return {
          ...student,
          selectedExtraFees: currentExtraFees,
          extraFeesPaid: extraFeesPaid,
          totalFee: totalFee,
          feePaid: totalPaid,
          feeDue: feeDue,
          updatedAt: new Date().toISOString()
        };
      });
      
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      
      if (setStudents) {
        setStudents(updatedStudents);
      }
      
      // Update current student if exists
      if (currentStudent) {
        const updatedCurrentStudent = updatedStudents.find(s => 
          s.studentId === currentStudent.studentId
        );
        if (updatedCurrentStudent) {
          const normalizedStudent = {
            ...updatedCurrentStudent,
            selectedExtraFees: normalizeExtraFees(updatedCurrentStudent.selectedExtraFees || [])
          };
          setCurrentStudent(normalizedStudent);
        }
      }
      
      setSuccessMessage(`Fee "${feeName}" (${formatCurrency(feeAmount)}) applied to all ${updatedStudents.length} students!`);
      setNewFeeName("");
      setNewFeeAmount("");
      setShowApplyFeeToAll(false);
      
    } catch (error) {
      console.error("Error applying fee to all students:", error);
      setErrorMessage("Failed to apply fee to all students!");
    } finally {
      setApplyToAllLoading(false);
    }
  };

  // Delete fee from all students function
  const handleDeleteFeeFromAll = async () => {
    if (!selectedFeeToDelete) {
      setErrorMessage("Please select a fee to delete!");
      return;
    }
    
    setApplyToAllLoading(true);
    setErrorMessage("");
    
    try {
      const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
      const feeName = selectedFeeToDelete;
      
      const updatedStudents = existingStudents.map(student => {
        const currentExtraFees = normalizeExtraFees(student.selectedExtraFees || []);
        
        // Filter out the fee to delete
        const updatedExtraFees = currentExtraFees.filter(f => 
          f.name.toLowerCase() !== feeName.toLowerCase()
        );
        
        // Calculate totals
        const tuitionFee = Number(student.courseFee) || Number(student.tuitionFee) || 0;
        const extraFeesTotal = updatedExtraFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
        const extraFeesPaid = updatedExtraFees.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0);
        const totalFee = tuitionFee + extraFeesTotal;
        const totalPaid = (Number(student.feePaid) || 0) + extraFeesPaid;
        const feeDue = Math.max(0, totalFee - totalPaid);
        
        return {
          ...student,
          selectedExtraFees: updatedExtraFees,
          extraFeesPaid: extraFeesPaid,
          totalFee: totalFee,
          feePaid: totalPaid,
          feeDue: feeDue,
          updatedAt: new Date().toISOString()
        };
      });
      
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      
      if (setStudents) {
        setStudents(updatedStudents);
      }
      
      // Update current student if exists
      if (currentStudent) {
        const updatedCurrentStudent = updatedStudents.find(s => 
          s.studentId === currentStudent.studentId
        );
        if (updatedCurrentStudent) {
          const normalizedStudent = {
            ...updatedCurrentStudent,
            selectedExtraFees: normalizeExtraFees(updatedCurrentStudent.selectedExtraFees || [])
          };
          setCurrentStudent(normalizedStudent);
        }
      }
      
      setSuccessMessage(`Fee "${feeName}" deleted from all ${updatedStudents.length} students!`);
      setSelectedFeeToDelete("");
      setShowApplyFeeToAll(false);
      
    } catch (error) {
      console.error("Error deleting fee from all students:", error);
      setErrorMessage("Failed to delete fee from all students!");
    } finally {
      setApplyToAllLoading(false);
    }
  };

  // UPDATED: Direct payment processing with discount
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!currentStudent) {
      setErrorMessage("Please select a student!");
      return;
    }
    
    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      setErrorMessage("Please enter valid amount!");
      return;
    }
    
    // Validate selection
    if (paymentType === "tuition" && selectedInstallments.length === 0) {
      setErrorMessage("Please select at least one installment!");
      return;
    }
    
    if (paymentType === "extra" && selectedExtraFees.length === 0) {
      setErrorMessage("Please select at least one extra fee!");
      return;
    }
    
    setLoading(true);
    setErrorMessage("");
    
    try {
      const selectedInstallmentsData = selectedInstallments.map(i => installments[i]);
      
      // Validate payment amount
      if (!paymentAmount || paymentAmount <= 0) {
        setErrorMessage("Invalid payment amount!");
        setLoading(false);
        return;
      }
      
      let allPayments = [];
      let updatedStudent = { ...currentStudent };
      
      // Calculate total selected amount for proper discount distribution
      const totalSelectedInstallmentsAmount = selectedInstallmentsData.reduce((sum, inst) => sum + inst.due, 0);
      const totalSelectedExtraFeesAmount = selectedExtraFees.reduce((sum, fee) => sum + fee.due, 0);
      const totalSelectedAmount = totalSelectedInstallmentsAmount + totalSelectedExtraFeesAmount;
      
      // Distribute discount proportionally
      let remainingDiscount = discountedAmount;
      
      // Pay selected installments (tuition)
      const tuitionPayments = [];
      let totalTuitionPaidInThisTransaction = 0;
      
      if (selectedInstallmentsData && selectedInstallmentsData.length > 0) {
        selectedInstallmentsData.forEach((installment, index) => {
          if (installment.due > 0) {
            // Calculate discount for this installment proportionally
            let installmentDiscount = 0;
            if (remainingDiscount > 0 && totalSelectedAmount > 0) {
              const installmentProportion = installment.due / totalSelectedAmount;
              installmentDiscount = discountedAmount * installmentProportion;
              
              // For the last installment, use remaining discount
              if (index === selectedInstallmentsData.length - 1 && 
                  selectedExtraFees.length === 0) {
                installmentDiscount = remainingDiscount;
              }
              
              // Cap the discount at installment due amount
              installmentDiscount = Math.min(installmentDiscount, installment.due);
              remainingDiscount -= installmentDiscount;
            }
            
            const installmentPayment = Math.max(0, installment.due - installmentDiscount);
            
            if (installmentPayment > 0) {
              const paymentData = {
                id: Date.now().toString() + "-T" + installment.month,
                studentId: currentStudent.studentId,
                studentName: currentStudent.name,
                amount: installmentPayment,
                date: paymentDate,
                method: paymentMethod,
                transactionId: `${transactionNumber}-T${installment.month}`,
                month: installment.month,
                monthName: installment.monthName,
                displayName: installment.displayName,
                dueDate: installment.dueDate,
                type: "tuition",
                status: "completed",
                overdue: installment.overdue,
                overdueMonths: installment.overdueMonths,
                timestamp: new Date().toISOString(),
                originalAmount: installment.due,
                discountApplied: installmentDiscount,
                discountReason: discountReason
              };
              
              tuitionPayments.push(paymentData);
              totalTuitionPaidInThisTransaction += installmentPayment;
            }
          }
        });
      }
      
      allPayments.push(...tuitionPayments);
      
      // Pay selected extra fees
      const extraFeePayments = [];
      const updatedExtraFees = [...(currentStudent.selectedExtraFees || [])];
      let totalExtraPaidInThisTransaction = 0;
      
      if (selectedExtraFees && selectedExtraFees.length > 0) {
        selectedExtraFees.forEach((fee, index) => {
          if (fee.due > 0) {
            // Find the fee in student's extra fees
            const feeIndex = updatedExtraFees.findIndex(f => 
              f.id === fee.id || f.name === fee.name
            );
            
            // Calculate discount for this fee proportionally
            let feeDiscount = 0;
            if (remainingDiscount > 0 && totalSelectedAmount > 0) {
              const feeProportion = fee.due / totalSelectedAmount;
              feeDiscount = discountedAmount * feeProportion;
              
              // For the last fee, use remaining discount
              if (index === selectedExtraFees.length - 1) {
                feeDiscount = remainingDiscount;
              }
              
              // Cap the discount at fee due amount
              feeDiscount = Math.min(feeDiscount, fee.due);
              remainingDiscount -= feeDiscount;
            }
            
            const feePayment = Math.max(0, fee.due - feeDiscount);
            
            if (feePayment > 0) {
              const paymentData = {
                id: Date.now().toString() + "-E" + (feeIndex >= 0 ? feeIndex : updatedExtraFees.length),
                studentId: currentStudent.studentId,
                studentName: currentStudent.name,
                amount: feePayment,
                date: paymentDate,
                method: paymentMethod,
                transactionId: `${transactionNumber}-E${(feeIndex >= 0 ? feeIndex : updatedExtraFees.length) + 1}`,
                feeName: fee.name,
                type: "extra",
                status: "completed",
                timestamp: new Date().toISOString(),
                originalAmount: fee.due,
                discountApplied: feeDiscount,
                discountReason: discountReason
              };
              
              extraFeePayments.push(paymentData);
              totalExtraPaidInThisTransaction += feePayment;
              
              if (feeIndex >= 0) {
                // Update existing fee
                const currentPaid = Number(updatedExtraFees[feeIndex].paid) || 0;
                const currentAmount = Number(updatedExtraFees[feeIndex].amount) || 0;
                const newPaid = currentPaid + feePayment;
                const newDue = Math.max(0, currentAmount - newPaid);
                
                updatedExtraFees[feeIndex] = {
                  ...updatedExtraFees[feeIndex],
                  paid: newPaid,
                  due: newDue
                };
              } else {
                // If fee not found, add it as fully paid
                updatedExtraFees.push({
                  id: fee.id || Date.now() + Math.random(),
                  name: fee.name,
                  amount: fee.amount || 0,
                  paid: feePayment,
                  due: 0
                });
              }
            }
          }
        });
      }
      
      allPayments.push(...extraFeePayments);
      
      // Calculate total paid in this transaction
      const totalPaidInThisTransaction = allPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // If no payments were created, show error
      if (allPayments.length === 0) {
        setErrorMessage("No valid items selected for payment!");
        setLoading(false);
        return;
      }
      
      // Calculate updated student totals
      const tuitionFee = Number(currentStudent.courseFee) || Number(currentStudent.tuitionFee) || 0;
      const previousTuitionPaid = Number(currentStudent.tuitionPaid) || 0;
      const newTuitionPaid = previousTuitionPaid + totalTuitionPaidInThisTransaction;
      
      const totalExtraPaid = updatedExtraFees.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0);
      const extraFeesTotal = updatedExtraFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
      
      const totalFee = tuitionFee + extraFeesTotal;
      const previousTotalPaid = Number(currentStudent.feePaid) || 0;
      const newTotalPaid = previousTotalPaid + totalPaidInThisTransaction;
      const newFeeDue = Math.max(0, totalFee - newTotalPaid);
      
      // Update student object with discount history
      const discountTransactions = appliedDiscounts.map(d => ({
        ...d,
        transactionId: transactionNumber,
        paymentDate: paymentDate,
        appliedTo: {
          installments: selectedInstallmentsData.map(inst => ({
            month: inst.month,
            monthName: inst.monthName,
            originalAmount: inst.due,
            discountedAmount: tuitionPayments.find(p => p.month === inst.month)?.discountApplied || 0
          })),
          extraFees: selectedExtraFees.map(fee => ({
            name: fee.name,
            originalAmount: fee.due,
            discountedAmount: extraFeePayments.find(p => p.feeName === fee.name)?.discountApplied || 0
          }))
        }
      }));
      
      updatedStudent = {
        ...updatedStudent,
        tuitionPaid: newTuitionPaid,
        selectedExtraFees: updatedExtraFees,
        extraFeesPaid: totalExtraPaid,
        feePaid: newTotalPaid,
        feeDue: newFeeDue,
        paymentStatus: newFeeDue === 0 ? 'fully_paid' : 
                      newTotalPaid === 0 ? 'unpaid' : 'partial',
        updatedAt: new Date().toISOString(),
        discounts: [...(currentStudent.discounts || []), ...discountTransactions]
      };
      
      // Update localStorage
      try {
        const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
        const existingFees = JSON.parse(localStorage.getItem('studentFees') || '[]');
        
        // Update students array
        const updatedStudents = existingStudents.map(s => 
          s.studentId === currentStudent.studentId ? updatedStudent : s
        );
        
        // Add new fees to existing fees
        const updatedFees = [...existingFees, ...allPayments];
        
        // Save to localStorage
        localStorage.setItem("students", JSON.stringify(updatedStudents));
        localStorage.setItem("studentFees", JSON.stringify(updatedFees));
        
        // Update state
        if (setStudents) setStudents(updatedStudents);
        if (setStudentFees) setStudentFees(updatedFees);
        
        // Update current student state
        setCurrentStudent(updatedStudent);
        
        // Update payment history
        const updatedPaymentHistory = [...allPayments, ...paymentHistory];
        setPaymentHistory(updatedPaymentHistory);
        
        // Generate updated installments
        const updatedInstallments = generateUpdatedInstallments(updatedStudent, allPayments);
        setInstallments(updatedInstallments);
        
        // Generate receipt data (with discount information)
        const receipt = {
          student: updatedStudent,
          payments: allPayments,
          selectedInstallments: selectedInstallmentsData,
          selectedExtraFees: selectedExtraFees,
          transactionId: transactionNumber,
          date: paymentDate,
          method: paymentMethod,
          totalAmount: totalPaidInThisTransaction,
          originalAmount: originalAmount,
          discountAmount: discountedAmount,
          discounts: appliedDiscounts,
          updatedInstallments: updatedInstallments,
          academyConfig: academyConfig
        };
        
        setReceiptData(receipt);
        
        // Success message with discount info
        let successMsg = "";
        if (discountedAmount > 0) {
          successMsg = `Payment successful! Discount: ${formatCurrency(discountedAmount)} applied. `;
        }
        
        if (tuitionPayments.length > 0 && extraFeePayments.length > 0) {
          successMsg += `${tuitionPayments.length} installment(s) and ${extraFeePayments.length} extra fee(s) paid!`;
        } else if (tuitionPayments.length > 0) {
          successMsg += `${tuitionPayments.length} installment(s) paid!`;
        } else if (extraFeePayments.length > 0) {
          successMsg += `${extraFeePayments.length} extra fee(s) paid!`;
        } else {
          successMsg += "Payment processed successfully!";
        }
        
        setSuccessMessage(successMsg);
        
        // Reset form including discounts
        setAmount("");
        setSelectedExtraFees([]);
        setSelectedInstallments([]);
        setPayAllMode(false);
        setAppliedDiscounts([]);
        setDiscountedAmount(0);
        setOriginalAmount(0);
        setDiscountValue("");
        setDiscountReason("");
        setDiscountType("fixed");
        
        // Generate new transaction number for next payment
        const generateTxn = () => {
          const date = new Date();
          const year = date.getFullYear().toString().slice(-2);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          return `TXN${year}${month}${day}${random}`;
        };
        
        setTransactionNumber(generateTxn());
        
      } catch (storageError) {
        console.error("Storage error:", storageError);
        setErrorMessage("Error saving payment data to storage!");
      }
      
    } catch (error) {
      console.error("Payment processing error:", error);
      setErrorMessage("Error processing payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Simple receipt printing with discount
  const handlePrintReceipt = () => {
    if (!receiptData) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Simple receipt HTML with discount section
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${receiptData.student.name}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }
          
          body {
            padding: 20px;
            background: #f5f5f5;
          }
          
          .receipt-container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #09c288;
          }
          
          .academy-name {
            font-size: 28px;
            font-weight: bold;
            color: #09c288;
            margin-bottom: 5px;
          }
          
          .academy-address {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          
          .receipt-title {
            font-size: 22px;
            color: #333;
            margin: 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .payment-success {
            background: #10b981;
            color: white;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            margin: 15px 0;
            font-weight: bold;
            font-size: 18px;
          }
          
          .discount-badge {
            background: #f59e0b;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-top: 5px;
          }
          
          .details-section {
            margin: 20px 0;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 10px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          
          .detail-label {
            font-weight: 600;
            color: #64748b;
          }
          
          .detail-value {
            font-weight: 500;
            color: #1e293b;
          }
          
          .amount-breakdown {
            background: #fffbeb;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #fcd34d;
          }
          
          .breakdown-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .discount-row {
            color: #d97706;
            font-weight: bold;
          }
          
          .total-row {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #e5e7eb;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .amount-total {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
            text-align: center;
            margin: 25px 0;
            padding: 15px;
            background: #f0fdf4;
            border-radius: 8px;
            border: 2px solid #10b981;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          .items-table th {
            background: #09c288;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          
          .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .items-table tr:nth-child(even) {
            background: #f8fafc;
          }
          
          .discount-cell {
            color: #d97706;
            font-style: italic;
          }
          
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px dashed #cbd5e1;
            color: #64748b;
            fontSize: 12px;
          }
          
          .print-controls {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            background: #f1f5f9;
            borderRadius: 8px;
          }
          
          .print-btn {
            padding: 10px 25px;
            background: #3b82f6;
            color: white;
            border: none;
            borderRadius: 5px;
            cursor: pointer;
            fontSize: 16px;
            fontWeight: bold;
            margin: 0 10px;
          }
          
          .print-btn:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="academy-name">${academyConfig.name || "CODE HUB ACADEMY"}</div>
            <div class="academy-address">${academyConfig.contact?.address || "Ali Chowk Skardu"}</div>
            <div class="receipt-title">PAYMENT RECEIPT</div>
            <div class="payment-success">
              ✓ PAYMENT SUCCESSFUL
              ${receiptData.discountAmount > 0 ? '<div class="discount-badge">DISCOUNT APPLIED</div>' : ''}
            </div>
          </div>
          
          <div class="details-section">
            <div class="section-title">Student Details</div>
            <div class="detail-row">
              <span class="detail-label">Student Name:</span>
              <span class="detail-value">${receiptData.student.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Father's Name:</span>
              <span class="detail-value">${receiptData.student.fatherName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Student ID:</span>
              <span class="detail-value">${receiptData.student.studentId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Course:</span>
              <span class="detail-value">${receiptData.student.course}</span>
            </div>
          </div>
          
          <div class="details-section">
            <div class="section-title">Payment Details</div>
            <div class="detail-row">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${receiptData.transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${formatDate(receiptData.date)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${receiptData.method.toUpperCase()}</span>
            </div>
          </div>
          
          ${receiptData.discountAmount > 0 ? `
          <div class="details-section">
            <div class="section-title">Discount Details</div>
            ${receiptData.discounts.map(discount => `
              <div class="detail-row">
                <span class="detail-label">Discount:</span>
                <span class="detail-value" style="color: #d97706;">
                  ${discount.type === 'percentage' ? `${discount.value}%` : `${formatCurrency(discount.value)}`}
                  ${discount.reason ? ` (${discount.reason})` : ''}
                </span>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div class="amount-breakdown">
            <div class="section-title">Amount Breakdown</div>
            <div class="breakdown-row">
              <span>Original Amount:</span>
              <span>${formatCurrency(receiptData.originalAmount)}</span>
            </div>
            ${receiptData.discountAmount > 0 ? `
            <div class="breakdown-row discount-row">
              <span>Discount Applied:</span>
              <span>- ${formatCurrency(receiptData.discountAmount)}</span>
            </div>
            ` : ''}
            <div class="breakdown-row total-row">
              <span>Final Amount Paid:</span>
              <span>${formatCurrency(receiptData.totalAmount)}</span>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Original Amount</th>
                ${receiptData.discountAmount > 0 ? '<th>Discount</th>' : ''}
                <th>Paid Amount</th>
              </tr>
            </thead>
            <tbody>
              ${receiptData.payments.map(payment => `
                <tr>
                  <td>${payment.type === 'extra' ? 'Extra Fee' : 'Tuition Fee'}</td>
                  <td>${payment.type === 'extra' ? payment.feeName : payment.displayName || `Month ${payment.month}`}</td>
                  <td>${formatCurrency(payment.originalAmount || payment.amount)}</td>
                  ${receiptData.discountAmount > 0 ? `
                  <td class="discount-cell">
                    ${payment.discountApplied > 0 ? `- ${formatCurrency(payment.discountApplied)}` : '-'}
                  </td>
                  ` : ''}
                  <td>${formatCurrency(payment.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="amount-total">
            TOTAL PAID: ${formatCurrency(receiptData.totalAmount)}
            ${receiptData.discountAmount > 0 ? 
              `<div style="font-size: 14px; margin-top: 5px; color: #d97706;">
                (Saved: ${formatCurrency(receiptData.discountAmount)})
              </div>` : ''
            }
          </div>
          
          <div class="footer">
            <div>Payment recorded on: ${new Date().toLocaleString()}</div>
            <div style="margin-top: 5px;">Thank you for your payment!</div>
            ${receiptData.discountAmount > 0 ? 
              `<div style="margin-top: 5px; color: #d97706; font-weight: bold;">
                * Discount applied as per academy policy
              </div>` : ''
            }
            <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
              This is a computer generated receipt, no signature required.
            </div>
          </div>
          
          <div class="print-controls no-print">
            <button onclick="window.print()" class="print-btn">🖨️ Print Receipt</button>
            <button onclick="window.close()" class="print-btn" style="background: #6b7280;">Close Window</button>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleBackToDashboard = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  };

  // Payment History Modal
  const PaymentHistoryModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 10,
        width: '100%',
        maxWidth: 800,
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background: '#09c288',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={20} />
            <h3 style={{ margin: 0, fontSize: 18 }}>Payment History - {currentStudent?.name}</h3>
          </div>
          <button 
            onClick={() => setShowPaymentHistory(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: 30,
              height: 30,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
          {paymentHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              <AlertCircle size={40} style={{ marginBottom: 15, opacity: 0.5 }} />
              <p>No payment history found for this student</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paymentHistory.map((payment, index) => (
                <div key={index} style={{
                  padding: 15,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: index % 2 === 0 ? '#f8fafc' : 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 14 }}>
                        ${payment.type === 'extra' ? payment.feeName : payment.displayName || `Month ${payment.month}`}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        ${formatDate(payment.date)} • ${payment.method.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: 16, color: '#10b981' }}>
                        ${formatCurrency(payment.amount)}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        ${payment.transactionId}
                      </div>
                    </div>
                  </div>
                  {payment.overdue && (
                    <div style={{
                      display: 'inline-block',
                      background: '#fee2e2',
                      color: '#dc2626',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 'bold',
                      marginTop: 5
                    }}>
                      ⚠️ ${payment.overdueMonths} month(s) overdue
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ fontSize: 14 }}>
            Total Payments: <strong>${paymentHistory.length}</strong>
          </div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#10b981' }}>
            Total Paid: ${formatCurrency(paymentHistory.reduce((sum, p) => sum + p.amount, 0))}
          </div>
        </div>
      </div>
    </div>
  );

  // Apply Fee to All Modal with Delete Option
  const ApplyFeeToAllModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 10,
        width: '100%',
        maxWidth: 450,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background: '#09c288',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            ${applyFeeMode === 'add' ? '<PlusCircle size={20} />' : '<Trash2 size={20} />'}
            <h3 style={{ margin: 0, fontSize: 18 }}>
              ${applyFeeMode === 'add' ? 'Apply Fee to All Students' : 'Delete Fee from All Students'}
            </h3>
          </div>
          <button 
            onClick={() => {
              setShowApplyFeeToAll(false);
              setApplyFeeMode('add');
              setNewFeeName('');
              setNewFeeAmount('');
              setSelectedFeeToDelete('');
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: 30,
              height: 30,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: 20 }}>
          {/* Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            background: '#f1f5f9', 
            borderRadius: 6, 
            marginBottom: 20,
            padding: 3
          }}>
            <button
              onClick={() => setApplyFeeMode('add')}
              style={{
                flex: 1,
                padding: 8,
                border: 'none',
                background: applyFeeMode === 'add' ? 'white' : 'transparent',
                borderRadius: 5,
                cursor: 'pointer',
                fontWeight: applyFeeMode === 'add' ? 'bold' : 'normal',
                color: applyFeeMode === 'add' ? '#3b82f6' : '#475569',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <PlusCircle size={14} /> Add Fee
            </button>
            <button
              onClick={() => setApplyFeeMode('delete')}
              style={{
                flex: 1,
                padding: 8,
                border: 'none',
                background: applyFeeMode === 'delete' ? 'white' : 'transparent',
                borderRadius: 5,
                cursor: 'pointer',
                fontWeight: applyFeeMode === 'delete' ? 'bold' : 'normal',
                color: applyFeeMode === 'delete' ? '#3b82f6' : '#475569',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Trash2 size={14} /> Delete Fee
            </button>
          </div>
          
          ${applyFeeMode === 'add' ? `
            <>
              <div style={{ marginBottom: 15 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 5, 
                  fontWeight: '600', 
                  fontSize: 13, 
                  color: '#475569' 
                }}>
                  Fee Name
                </label>
                <input
                  type="text"
                  value={newFeeName}
                  onChange={(e) => setNewFeeName(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 10, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 6,
                    fontSize: 13
                  }}
                  placeholder="e.g., Exam Fee, Book Charges, etc."
                />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 5, 
                  fontWeight: '600', 
                  fontSize: 13, 
                  color: '#475569' 
                }}>
                  Amount
                </label>
                <input
                  type="number"
                  value={newFeeAmount}
                  onChange={(e) => setNewFeeAmount(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 10, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 6,
                    fontSize: 13
                  }}
                  placeholder="Enter amount"
                />
              </div>
            </>
          ` : `
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 5, 
                  fontWeight: '600', 
                  fontSize: 13, 
                  color: '#475569' 
                }}>
                  Select Fee to Delete
                </label>
                <select
                  value={selectedFeeToDelete}
                  onChange={(e) => setSelectedFeeToDelete(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 10, 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 6,
                    fontSize: 13,
                    background: 'white'
                  }}
                >
                  <option value="">Select a fee to delete</option>
                  ${allFeeNames.map(name => `
                    <option key="${name}" value="${name}">${name}</option>
                  `).join('')}
                </select>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>
                  Found ${allFeeNames.length} unique fee types across all students
                </div>
              </div>
            </>
          `}
          
          <div style={{ 
            background: '#f8fafc', 
            padding: 12, 
            borderRadius: 6,
            marginBottom: 20,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>
              This will affect:
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              • All ${students?.length || 0} students
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              ${applyFeeMode === 'add' 
                ? '• Each student will have this fee added to their extra fees'
                : '• This fee will be removed from all students'}
            </div>
            ${applyFeeMode === 'add' ? `
              <div style={{ fontSize: 11, color: '#64748b' }}>
                • Existing fees with same name will be updated
              </div>
            ` : ''}
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={applyFeeMode === 'add' ? handleApplyFeeToAll : handleDeleteFeeFromAll}
              disabled={applyToAllLoading || 
                (applyFeeMode === 'add' && (!newFeeName.trim() || !newFeeAmount)) ||
                (applyFeeMode === 'delete' && !selectedFeeToDelete)}
              style={{
                flex: 1,
                padding: 10,
                background: applyToAllLoading ? '#94a3b8' : 
                          applyFeeMode === 'delete' ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: applyToAllLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 'bold',
                fontSize: 13
              }}
            >
              ${applyToAllLoading ? `
                <>
                  <div style={{ 
                    width: 16, 
                    height: 16, 
                    border: '2px solid white', 
                    borderTopColor: 'transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }} />
                  ${applyFeeMode === 'add' ? 'Applying...' : 'Deleting...'}
                </>
              ` : `
                <>
                  ${applyFeeMode === 'add' ? '<CheckCircle size={14} />' : '<Trash2 size={14} />'}
                  ${applyFeeMode === 'add' ? 'Apply to All Students' : 'Delete from All Students'}
                </>
              `}
            </button>
            <button 
              onClick={() => {
                setShowApplyFeeToAll(false);
                setApplyFeeMode('add');
                setNewFeeName('');
                setNewFeeAmount('');
                setSelectedFeeToDelete('');
              }}
              style={{
                padding: '10px 15px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 13
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Discount Modal Component
  const DiscountModal = () => {
    const currentDiscountAmount = calculateDiscountAmount(originalAmount, discountType, discountValue);
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: 20
      }}>
        <div style={{
          background: 'white',
          borderRadius: 10,
          width: '100%',
          maxWidth: 450,
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Percent size={20} />
              <h3 style={{ margin: 0, fontSize: 18 }}>Apply Discount</h3>
            </div>
            <button 
              onClick={() => {
                setShowDiscountModal(false);
                setDiscountValue("");
                setDiscountReason("");
                setDiscountType("fixed");
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: 30,
                height: 30,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ padding: 20 }}>
            <div style={{ 
              background: '#fffbeb', 
              padding: 12, 
              borderRadius: 6,
              marginBottom: 20,
              border: '1px solid #fcd34d'
            }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 'bold', 
                color: '#92400e', 
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Info size={12} /> Summary
              </div>
              <div style={{ fontSize: 11, color: '#b45309' }}>
                • Original Amount: {formatCurrency(originalAmount)}
              </div>
              <div style={{ fontSize: 11, color: '#b45309' }}>
                • Selected Items: {selectedInstallments.length + selectedExtraFees.length}
              </div>
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 5, 
                fontWeight: '600', 
                fontSize: 13, 
                color: '#475569' 
              }}>
                Discount Type
              </label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                <button
                  onClick={() => setDiscountType("fixed")}
                  style={{
                    flex: 1,
                    padding: 10,
                    border: discountType === 'fixed' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    background: discountType === 'fixed' ? '#fffbeb' : 'white',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: discountType === 'fixed' ? 'bold' : 'normal',
                    color: discountType === 'fixed' ? '#92400e' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5
                  }}
                >
                  <BadgePercent size={14} /> Fixed Amount
                </button>
                <button
                  onClick={() => setDiscountType("percentage")}
                  style={{
                    flex: 1,
                    padding: 10,
                    border: discountType === 'percentage' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    background: discountType === 'percentage' ? '#fffbeb' : 'white',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: discountType === 'percentage' ? 'bold' : 'normal',
                    color: discountType === 'percentage' ? '#92400e' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5
                  }}
                >
                  <Percent size={14} /> Percentage
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 5, 
                fontWeight: '600', 
                fontSize: 13, 
                color: '#475569' 
              }}>
                Discount {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (RS)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 10, 
                    paddingRight: 40,
                    border: '1px solid #e2e8f0', 
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}
                  placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                  min="0"
                  max={discountType === 'percentage' ? '100' : originalAmount}
                />
                <div style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontWeight: 'bold',
                  fontSize: 12
                }}>
                  {discountType === 'percentage' ? '%' : 'RS'}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {discountType === 'percentage' 
                  ? `Max: 100% (${formatCurrency(originalAmount)})`
                  : `Max: ${formatCurrency(originalAmount)}`
                }
              </div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 5, 
                fontWeight: '600', 
                fontSize: 13, 
                color: '#475569' 
              }}>
                Reason for Discount (Optional)
              </label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: 10, 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 6,
                  fontSize: 13
                }}
                placeholder="e.g., Early bird discount, Referral, etc."
              />
            </div>
            
            {discountValue && parseFloat(discountValue) > 0 && (
              <div style={{ 
                background: '#f0fdf4', 
                padding: 12, 
                borderRadius: 6,
                marginBottom: 20,
                border: '1px solid #10b981'
              }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 'bold', 
                  color: '#065f46', 
                  marginBottom: 4 
                }}>
                  Preview:
                </div>
                <div style={{ fontSize: 11, color: '#059669' }}>
                  • Original: {formatCurrency(originalAmount)}
                </div>
                <div style={{ fontSize: 11, color: '#d97706' }}>
                  • Discount: {discountType === 'percentage' 
                    ? `${discountValue}% (${formatCurrency(currentDiscountAmount)})`
                    : formatCurrency(currentDiscountAmount)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 'bold', color: '#10b981', marginTop: 2 }}>
                  • Final Amount: {formatCurrency(Math.max(0, originalAmount - currentDiscountAmount))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handleApplyDiscount}
                disabled={!discountValue || parseFloat(discountValue) <= 0}
                style={{
                  flex: 1,
                  padding: 10,
                  background: !discountValue || parseFloat(discountValue) <= 0 ? '#94a3b8' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: !discountValue || parseFloat(discountValue) <= 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontWeight: 'bold',
                  fontSize: 13
                }}
              >
                <CheckCircle size={14} />
                Apply Discount
              </button>
              <button 
                onClick={() => {
                  setShowDiscountModal(false);
                  setDiscountValue("");
                  setDiscountReason("");
                  setDiscountType("fixed");
                }}
                style={{
                  padding: '10px 15px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 13
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!students || students.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h3>No students found</h3>
        <button onClick={handleBackToDashboard} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const extraFees = normalizeExtraFees(currentStudent?.selectedExtraFees || []);
  
  const tuitionFee = Number(currentStudent?.courseFee) || Number(currentStudent?.tuitionFee) || 0;
  const tuitionPaid = Number(currentStudent?.tuitionPaid) || 0;
  const tuitionDue = Math.max(0, tuitionFee - tuitionPaid);
  
  const extraFeesTotal = extraFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
  const extraFeesPaid = extraFees.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0);
  const extraFeesDue = Math.max(0, extraFeesTotal - extraFeesPaid);
  
  const totalFee = Number(currentStudent?.totalFee) || (tuitionFee + extraFeesTotal);
  const totalPaid = Number(currentStudent?.feePaid) || (tuitionPaid + extraFeesPaid);
  const totalDue = Math.max(0, totalFee - totalPaid);

  const unpaidInstallments = installments.filter(inst => inst.due > 0);
  const overdueInstallments = installments.filter(inst => inst.overdue);

  const totalDiscount = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div style={{ padding: 15, fontFamily: 'Arial, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: `linear-gradient(135deg, #09c288 0%, #07a873 100%)`,
        color: "white",
        padding: "15px",
        borderRadius: "10px",
        marginBottom: 15,
        boxShadow: "0 4px 15px rgba(9, 194, 136, 0.3)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: "20px", 
                fontWeight: "700", 
                display: "flex", 
                alignItems: "center", 
                gap: "8px" 
              }}>
                <FileSpreadsheet size={24} /> Collect Fees
              </h1>
              <div style={{ 
                display: "flex", 
                alignItems: "center",
                marginTop: "5px",
                gap: 10,
                flexWrap: "wrap"
              }}>
                <span style={{ fontSize: "12px", opacity: 0.9 }}>{academyConfig.name}</span>
                <span style={{ 
                  fontSize: "11px", 
                  background: "rgba(255,255,255,0.2)", 
                  padding: "3px 8px", 
                  borderRadius: "10px" 
                }}>
                  {currentMonthName} {currentYear}
                </span>
                {currentStudent && (
                  <button 
                    onClick={() => setShowPaymentHistory(true)}
                    style={{
                      padding: '3px 10px',
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'white'
                    }}
                  >
                    <History size={10} /> Payment History
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={() => setShowApplyFeeToAll(true)}
              style={{ 
                padding: "8px 15px", 
                background: "rgba(255,255,255,0.2)", 
                border: "1px solid rgba(255,255,255,0.3)", 
                borderRadius: 5, 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: 5,
                color: "white",
                fontSize: "12px"
              }}
            >
              <PlusCircle size={14} /> Apply Fee to All
            </button>
            
            {/* ADD DISCOUNT BUTTON HERE */}
            {currentStudent && originalAmount > 0 && (
              <button 
                onClick={() => setShowDiscountModal(true)}
                style={{ 
                  padding: "8px 15px", 
                  background: totalDiscount > 0 ? "#f59e0b" : "rgba(255,255,255,0.2)", 
                  border: totalDiscount > 0 ? "1px solid #d97706" : "1px solid rgba(255,255,255,0.3)", 
                  borderRadius: 5, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 5,
                  color: totalDiscount > 0 ? "white" : "white",
                  fontSize: "12px",
                  fontWeight: totalDiscount > 0 ? "bold" : "normal"
                }}
              >
                <Percent size={14} />
                {totalDiscount > 0 ? `Discount: -${formatCurrency(totalDiscount)}` : "Apply Discount"}
              </button>
            )}
            
            <button onClick={handleBackToDashboard} style={{ 
              padding: "8px 15px", 
              background: "rgba(255,255,255,0.2)", 
              border: "1px solid rgba(255,255,255,0.3)", 
              borderRadius: 5, 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: 5,
              color: "white",
              fontSize: "12px"
            }}>
              <ArrowLeft size={14} /> Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Discount Applied Section */}
      {appliedDiscounts.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 15,
          border: '1px solid #fcd34d'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 8 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BadgePercent size={16} color="#d97706" />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 14, color: '#92400e' }}>
                  Discount Applied
                </div>
                <div style={{ fontSize: 11, color: '#b45309' }}>
                  {appliedDiscounts.length} discount(s) applied
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#d97706', textAlign: 'right' }}>
                - {formatCurrency(totalDiscount)}
              </div>
              <div style={{ fontSize: 11, color: '#92400e', textAlign: 'right' }}>
                Final Amount: {formatCurrency(originalAmount - totalDiscount)}
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8, 
            marginTop: 8 
          }}>
            {appliedDiscounts.map((discount, index) => (
              <div key={discount.id} style={{
                background: 'white',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #fcd34d',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <div style={{ fontSize: 11, fontWeight: 'bold', color: '#92400e' }}>
                  {discount.type === 'percentage' ? `${discount.value}%` : `${formatCurrency(discount.value)}`}
                </div>
                {discount.reason && (
                  <div style={{ fontSize: 10, color: '#b45309' }}>
                    ({discount.reason})
                  </div>
                )}
                <button
                  onClick={() => handleRemoveDiscount(discount.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0,
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            
            <button
              onClick={handleClearAllDiscounts}
              style={{
                padding: '6px 10px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                color: '#dc2626'
              }}
            >
              <X size={10} /> Clear All
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {errorMessage && (
        <div style={{ 
          padding: 10, 
          background: '#fee2e2', 
          border: '1px solid #ef4444', 
          borderRadius: 5, 
          marginBottom: 12, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          color: '#dc2626',
          fontSize: '13px'
        }}>
          <AlertCircle size={14} /> {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div style={{ 
          padding: 10, 
          background: '#d1fae5', 
          border: '1px solid #10b981', 
          borderRadius: 5, 
          marginBottom: 12, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          color: '#065f46',
          fontSize: '13px'
        }}>
          <CheckCircle size={14} /> {successMessage}
        </div>
      )}

      {currentStudent && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          {/* Left Column */}
          <div>
            {/* Student Details Card */}
            <div style={{ 
              background: 'white', 
              padding: 15, 
              borderRadius: 8, 
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
              marginBottom: 12 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 12 
              }}>
                <h3 style={{ 
                  margin: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  color: '#1e293b',
                  fontSize: '15px'
                }}>
                  <User size={16} /> Student Details
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => setShowStudentSearch(!showStudentSearch)}
                    style={{
                      padding: '5px 10px',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#0369a1'
                    }}
                  >
                    <Users size={10} /> Change
                  </button>
                  <button 
                    onClick={() => setShowPaymentHistory(true)}
                    style={{
                      padding: '5px 10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#475569'
                    }}
                  >
                    <History size={10} /> History
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Student ID</div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>{currentStudent.studentId}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Name</div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>{currentStudent.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Father's Name</div>
                  <div style={{ fontSize: 13 }}>{currentStudent.fatherName || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Course</div>
                  <div style={{ fontSize: 13 }}>{currentStudent.course}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Phone</div>
                  <div style={{ fontSize: 13 }}>{currentStudent.phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Admission Date</div>
                  <div style={{ fontSize: 13 }}>{formatDate(currentStudent.admissionDate)}</div>
                </div>
              </div>
              
              {/* Installment Details */}
              {currentStudent.admissionDate && (
                <div style={{ 
                  marginTop: 15,
                  padding: 10,
                  background: '#f0f9ff',
                  borderRadius: 6,
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#0369a1', marginBottom: 5 }}>
                    Installment Details:
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    • Course Duration: {currentStudent.courseDuration || currentStudent.installmentMonths || 1} months
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    • Monthly Fee: {formatCurrency(currentStudent.monthlyFee || 
                      (Number(currentStudent.courseFee) || 0) / (currentStudent.courseDuration || 1))}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    • Installments Start: {calculateInstallmentStartMonth(currentStudent.admissionDate).month}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    • Admission Day: {new Date(currentStudent.admissionDate).getDate()} 
                    {new Date(currentStudent.admissionDate).getDate() > 20 ? 
                      ' (After 20th → Next month start)' : ' (On/before 20th → Same month start)'}
                  </div>
                </div>
              )}
            </div>

            {/* Fee Summary Card */}
            <div style={{ 
              background: 'white', 
              padding: 15, 
              borderRadius: 8, 
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
              marginBottom: 12 
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                color: '#1e293b',
                fontSize: '15px'
              }}>
                <IndianRupee size={16} /> Fee Summary
              </h3>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: 8, 
                  paddingBottom: 6, 
                  borderBottom: '1px solid #f1f5f9' 
                }}>
                  <span style={{ fontSize: 13 }}>Total Fee:</span>
                  <span style={{ fontWeight: 'bold', fontSize: 13 }}>{formatCurrency(totalFee)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: 8, 
                  paddingBottom: 6, 
                  borderBottom: '1px solid #f1f5f9' 
                }}>
                  <span style={{ fontSize: 13 }}>Total Paid:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: 13 }}>
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13 }}>Total Due:</span>
                  <span style={{ 
                    color: totalDue > 0 ? '#ef4444' : '#10b981', 
                    fontWeight: 'bold', 
                    fontSize: 13 
                  }}>
                    {formatCurrency(totalDue)} {totalDue === 0 ? '✓' : ''}
                  </span>
                </div>
                
                {/* Installment Summary */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 10, 
                  borderRadius: 6, 
                  marginBottom: 8 
                }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    color: '#475569', 
                    marginBottom: 6 
                  }}>
                    Installments ({installments.length} months):
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>Paid:</span>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#10b981' }}>
                      {installments.filter(inst => inst.status === 'Paid').length} months
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>Pending:</span>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#f59e0b' }}>
                      {installments.filter(inst => inst.status === 'Pending').length} months
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12 }}>Overdue:</span>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#ef4444' }}>
                      {installments.filter(inst => inst.status === 'Overdue').length} months
                    </span>
                  </div>
                </div>
                
                {extraFees.length > 0 && (
                  <div style={{ 
                    background: '#f0f9ff', 
                    padding: 10, 
                    borderRadius: 6
                  }}>
                    <div style={{ 
                      fontSize: 12, 
                      fontWeight: 'bold', 
                      color: '#0369a1', 
                      marginBottom: 6 
                    }}>
                      Extra Fees:
                    </div>
                    {extraFees.map((fee, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: 5 
                      }}>
                        <span style={{ fontSize: 12 }}>{fee.name}:</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, fontWeight: 'bold' }}>
                            {formatCurrency(fee.amount || 0)}
                          </div>
                          <div style={{ 
                            fontSize: 10, 
                            color: (fee.due || 0) === 0 ? '#10b981' : '#ef4444' 
                          }}>
                            {(fee.due || 0) === 0 ? 'Paid ✓' : `Due: ${formatCurrency(fee.due || 0)}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pay All Mode Toggle */}
            {totalDue > 0 && unpaidInstallments.length > 0 && (
              <div style={{ 
                background: 'white', 
                padding: 15, 
                borderRadius: 8, 
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
                marginBottom: 12 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 12 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={16} color="#f59e0b" />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 14 }}>Pay All Unpaid Installments</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {unpaidInstallments.length} unpaid installments available
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handlePayAllToggle}
                    style={{
                      padding: '6px 12px',
                      background: payAllMode ? '#f59e0b' : '#f0f9ff',
                      color: payAllMode ? 'white' : '#0369a1',
                      border: payAllMode ? 'none' : '1px solid #bae6fd',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {payAllMode ? 'Cancel Pay All' : 'Pay All Together'}
                  </button>
                </div>
                
                {payAllMode && (
                  <div style={{ 
                    background: '#fffbeb', 
                    padding: 12, 
                    borderRadius: 6,
                    border: '1px solid #fcd34d'
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 'bold', color: '#92400e', marginBottom: 8 }}>
                      Selected for Payment:
                    </div>
                    <div style={{ fontSize: 11, color: '#b45309', marginBottom: 4 }}>
                      • {selectedInstallments.length} installments
                    </div>
                    <div style={{ fontSize: 11, color: '#b45309', marginBottom: 8 }}>
                      • {selectedExtraFees.length} extra fees
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 'bold', 
                      color: '#f59e0b',
                      textAlign: 'center',
                      padding: '8px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: 4
                    }}>
                      Total: {formatCurrency(amount)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            {/* Payment Type Toggle */}
            <div style={{ 
              display: 'flex', 
              background: '#f1f5f9', 
              borderRadius: 6, 
              marginBottom: 15,
              padding: 3
            }}>
              <button
                onClick={() => handlePaymentTypeChange("tuition")}
                style={{
                  flex: 1,
                  padding: 10,
                  border: 'none',
                  background: paymentType === 'tuition' ? 'white' : 'transparent',
                  borderRadius: 5,
                  cursor: 'pointer',
                  fontWeight: paymentType === 'tuition' ? 'bold' : 'normal',
                  color: paymentType === 'tuition' ? '#3b82f6' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                  fontSize: '13px'
                }}
              >
                <Grid size={14} />
                Tuition Fee
              </button>
              <button
                onClick={() => handlePaymentTypeChange("extra")}
                style={{
                  flex: 1,
                  padding: 10,
                  border: 'none',
                  background: paymentType === 'extra' ? 'white' : 'transparent',
                  borderRadius: 5,
                  cursor: 'pointer',
                  fontWeight: paymentType === 'extra' ? 'bold' : 'normal',
                  color: paymentType === 'extra' ? '#3b82f6' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                  fontSize: '13px'
                }}
              >
                <Tag size={14} />
                Extra Fees
              </button>
            </div>

            {/* Installments Section */}
            {installments.length > 0 && (
              <div style={{ 
                background: 'white', 
                padding: 15, 
                borderRadius: 8, 
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
                marginBottom: 15 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 12 
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: '#1e293b', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    fontSize: '15px'
                  }}>
                    <CalendarDays size={16} /> Installments ({installments.length})
                  </h3>
                  {payAllMode && (
                    <button
                      onClick={handleSelectAllInstallments}
                      style={{
                        padding: '4px 10px',
                        background: selectedInstallments.length === unpaidInstallments.length ? '#f0f9ff' : '#f8fafc',
                        border: selectedInstallments.length === unpaidInstallments.length ? 
                          '2px solid #3b82f6' : '1px solid #e2e8f0',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#0369a1'
                      }}
                    >
                      <CheckSquare size={10} />
                      {selectedInstallments.length === unpaidInstallments.length ? 
                        'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                
                <div style={{ maxHeight: 250, overflowY: 'auto', paddingRight: 5 }}>
                  {installments.map((inst, index) => (
                    <div 
                      key={index}
                      onClick={() => handleMonthSelect(index)}
                      style={{ 
                        padding: 10, 
                        borderBottom: '1px solid #f1f5f9', 
                        cursor: inst.due > 0 ? 'pointer' : 'default',
                        background: payAllMode && selectedInstallments.includes(index) ? '#dbeafe' : 
                                  inst.status === 'Paid' ? '#d1fae5' : 
                                  inst.status === 'Partial' ? '#fef3c7' : 
                                  inst.status === 'Overdue' ? '#fee2e2' : 'white',
                        borderRadius: 6,
                        marginBottom: 6,
                        border: payAllMode && selectedInstallments.includes(index) ? '2px solid #3b82f6' : 
                                inst.status === 'Paid' ? '1px solid #10b981' : 
                                inst.status === 'Partial' ? '1px solid #f59e0b' : 
                                inst.status === 'Overdue' ? '1px solid #dc2626' : '1px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        opacity: inst.due === 0 ? 0.8 : 1
                      }}
                      onMouseOver={(e) => {
                        if (inst.due > 0) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (inst.due > 0) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 13 }}>
                          {inst.displayName}
                          {payAllMode && selectedInstallments.includes(index) && (
                            <span style={{ 
                              marginLeft: '6px', 
                              fontSize: '10px', 
                              background: '#3b82f6', 
                              color: 'white', 
                              padding: '1px 4px', 
                              borderRadius: '3px' 
                            }}>
                              ✓
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: 10, 
                          padding: '2px 6px', 
                          borderRadius: 8,
                          background: inst.status === 'Paid' ? '#10b981' : 
                                     inst.status === 'Partial' ? '#f59e0b' : 
                                     inst.status === 'Overdue' ? '#dc2626' : '#6b7280',
                          color: 'white'
                        }}>
                          {inst.status}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                        Due: {formatDate(inst.dueDate)}
                        {inst.overdue && (
                          <span style={{ color: '#dc2626', marginLeft: '4px', fontSize: '10px' }}>
                            ⚠️ {inst.overdueMonths}m overdue
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: 12 }}>
                            {formatCurrency(inst.amount)}
                          </div>
                          {inst.paid > 0 && (
                            <div style={{ fontSize: 10, color: '#10b981' }}>
                              Paid: {formatCurrency(inst.paid)}
                            </div>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: 12, 
                          fontWeight: 'bold',
                          color: inst.due === 0 ? '#10b981' : 
                                 inst.status === 'Overdue' ? '#dc2626' : '#f59e0b'
                        }}>
                          {inst.due === 0 ? '✓ Paid' : `Due: ${formatCurrency(inst.due)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Installment Summary */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '2px solid #e2e8f0'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Total</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>{formatCurrency(tuitionFee)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Paid</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: '#10b981' }}>
                      {formatCurrency(tuitionPaid)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Due</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: '#ef4444' }}>
                      {formatCurrency(tuitionDue)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Extra Fees Section */}
            {extraFees.length > 0 && extraFees.some(f => f.due > 0) && (
              <div style={{ 
                background: 'white', 
                padding: 15, 
                borderRadius: 8, 
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
                marginBottom: 15 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 12 
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: '#1e293b', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    fontSize: '15px'
                  }}>
                    <Package size={16} /> Extra Fees
                  </h3>
                  
                  <button
                    onClick={handleSelectAllExtraFees}
                    style={{
                      padding: '4px 10px',
                      background: selectedExtraFees.length === extraFees.filter(f => f.due > 0).length ? '#f0f9ff' : '#f8fafc',
                      border: selectedExtraFees.length === extraFees.filter(f => f.due > 0).length ? 
                        '2px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#0369a1'
                    }}
                  >
                    <CheckSquare size={10} />
                    {selectedExtraFees.length === extraFees.filter(f => f.due > 0).length ? 
                      'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div style={{ maxHeight: 150, overflowY: 'auto', paddingRight: 5 }}>
                  {extraFees.map((fee, index) => {
                    if (fee.due === 0) return null;
                    
                    const isSelected = selectedExtraFees.some(f => f.id === fee.id);
                    
                    return (
                      <div 
                        key={index}
                        onClick={() => handleExtraFeeSelect(fee)}
                        style={{ 
                          padding: 8, 
                          borderBottom: '1px solid #f1f5f9', 
                          cursor: 'pointer',
                          background: isSelected ? '#dbeafe' : 'white',
                          borderRadius: 5,
                          marginBottom: 5,
                          border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = isSelected ? '#dbeafe' : 'white';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 14,
                            height: 14,
                            border: '2px solid #cbd5e1',
                            borderRadius: 3,
                            background: isSelected ? '#3b82f6' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {isSelected && (
                              <CheckSquare size={8} color="white" />
                            )}
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 'bold', fontSize: 12 }}>{fee.name}</div>
                              <div style={{ 
                                fontSize: 11, 
                                fontWeight: 'bold', 
                                color: '#ef4444'
                              }}>
                                DUE: {formatCurrency(fee.due)}
                              </div>
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                              Total: {formatCurrency(fee.amount || 0)} • Paid: {formatCurrency(fee.paid || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Form */}
            <div style={{ 
              background: 'white', 
              padding: 15, 
              borderRadius: 8, 
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)' 
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                color: '#1e293b', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                fontSize: '15px'
              }}>
                <CreditCard size={16} /> Payment Details
              </h3>
              
              <form onSubmit={handleSubmitPayment}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 4, 
                    fontWeight: '600', 
                    fontSize: 12, 
                    color: '#475569' 
                  }}>
                    {payAllMode ? 'Total Amount for Selected Items' : 
                     paymentType === "extra" && selectedExtraFees.length > 0 
                      ? `Pay ${selectedExtraFees.length} Extra Fee(s)` 
                      : paymentType === "tuition" && selectedInstallments.length > 0
                      ? `Pay ${selectedInstallments.length} Installment(s)`
                      : 'Select Items to Pay'}
                  </label>
                  <input
                    ref={amountInputRef}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      border: '2px solid #e2e8f0', 
                      borderRadius: 6, 
                      fontSize: 14, 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: '#1e293b',
                      transition: 'borderColor 0.2s ease'
                    }}
                    placeholder="Enter amount"
                    required
                    disabled={
                      (paymentType === "extra" && selectedExtraFees.length === 0) ||
                      (paymentType === "tuition" && selectedInstallments.length === 0)
                    }
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{ 
                    fontSize: 11, 
                    color: '#64748b', 
                    marginTop: 4, 
                    textAlign: 'center' 
                  }}>
                    {payAllMode 
                      ? `Selected: ${selectedInstallments.length} installments, ${selectedExtraFees.length} extra fees`
                      : paymentType === "extra" && selectedExtraFees.length > 0 
                      ? `Total Due: ${formatCurrency(selectedExtraFees.reduce((sum, fee) => sum + (fee.due || 0), 0))}` 
                      : paymentType === "tuition" && selectedInstallments.length > 0? `Total Due: ${formatCurrency(selectedInstallments.reduce((sum, i) => sum + installments[i].due, 0))}`
                      : 'Select items to pay'}
                  </div>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 4, 
                    fontWeight: '600', 
                    fontSize: 12, 
                    color: '#475569' 
                  }}>
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 6,
                      fontSize: 13
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 4, 
                    fontWeight: '600', 
                    fontSize: 12, 
                    color: '#475569' 
                  }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 6,
                      fontSize: 13,
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Debit/Credit Card</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: 15 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 4, 
                    fontWeight: '600', 
                    fontSize: 12, 
                    color: '#475569' 
                  }}>
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={transactionNumber}
                    readOnly
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 6, 
                      background: '#f8fafc',
                      fontSize: 13,
                      color: '#64748b',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !amount || Number(amount) <= 0 || 
                    (paymentType === "extra" && selectedExtraFees.length === 0) ||
                    (paymentType === "tuition" && selectedInstallments.length === 0)}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: loading ? '#94a3b8' : '#09c288',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!loading && amount && Number(amount) > 0) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading && amount && Number(amount) > 0) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{ 
                        width: 18, 
                        height: 18, 
                        border: '2px solid white', 
                        borderTopColor: 'transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      {payAllMode 
                        ? `Pay All (${selectedInstallments.length + selectedExtraFees.length} Items)`
                        : paymentType === "extra" && selectedExtraFees.length > 0 
                        ? `Pay ${selectedExtraFees.length} Extra Fee(s)` 
                        : paymentType === "tuition" && selectedInstallments.length > 0
                        ? `Pay ${selectedInstallments.length} Installment(s)`
                        : 'Submit Payment'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Section */}
      {receiptData && (
        <div id="receipt-section" style={{ 
          background: 'linear-gradient(135deg, #2c3e50 0%, #4a5568 100%)', 
          color: 'white', 
          padding: 15, 
          borderRadius: 8, 
          marginTop: 15 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 15 
          }}>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: 18, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                fontWeight: '700'
              }}>
                <CheckCircle size={20} color="#10b981" /> Payment Successful!
              </h3>
              <p style={{ 
                margin: '4px 0 0 0', 
                color: '#cbd5e1', 
                fontSize: 12 
              }}>
                Transaction ID: {receiptData.transactionId}
              </p>
            </div>
            <div style={{ 
              fontSize: 24, 
              fontWeight: '700', 
              color: '#10b981',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {formatCurrency(receiptData.totalAmount)}
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: 12, 
            borderRadius: 6,
            marginBottom: 15
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Items Paid:</div>
            {receiptData.payments.map((payment, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 4,
                padding: '4px 0',
                borderBottom: index < receiptData.payments.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}>
                <div style={{ fontSize: 12 }}>
                  {payment.type === 'extra' ? payment.feeName : payment.displayName || `Month ${payment.month}`}
                </div>
                <div style={{ fontSize: 12, fontWeight: '600', color: '#10b981' }}>
                  {formatCurrency(payment.amount)}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={handlePrintReceipt} 
              style={{ 
                flex: 1, 
                padding: 10, 
                background: '#10b981', 
                color: 'white', 
                border: 'none', 
                borderRadius: 6, 
                cursor: 'pointer', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: 6,
                fontSize: 13,
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
              onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
            >
              <Printer size={14} /> Print Receipt
            </button>
            <button 
              onClick={() => setReceiptData(null)} 
              style={{ 
                flex: 1, 
                padding: 10, 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: 6, 
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && <PaymentHistoryModal />}

      {/* Apply Fee to All Modal */}
      {showApplyFeeToAll && <ApplyFeeToAllModal />}

      {/* Discount Modal */}
      {showDiscountModal && <DiscountModal />}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 10px !important;
          }
          
          .header {
            padding: 12px !important;
            flex-direction: column;
            gap: 10px;
          }
          
          .student-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
};

export default CollectFees;