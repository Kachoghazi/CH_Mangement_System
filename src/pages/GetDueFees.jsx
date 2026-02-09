// pages/GetDueFees.jsx - COMPLETE UPDATED VERSION WITH FIXED IMPORTS
import React, { useState, useEffect } from "react";
import { 
  DollarSign, AlertCircle, CheckCircle, Calendar, 
  User, Book, Phone, Mail, Clock, Filter,
  Download, Printer, Search, RefreshCw, ChevronDown,
  ChevronUp, ArrowRight, FileText, Users, CreditCard,
  History  // ✅ History icon added here
} from "lucide-react";
import './GetDueFees.css';

const GetDueFees = ({ students = [], setStudents, onPaymentSuccess }) => {
  // Load all student fees
  const savedStudentFees = localStorage.getItem("studentFees");
  const studentFees = savedStudentFees ? JSON.parse(savedStudentFees) : [];
  
  // Load all students from localStorage for consistency
  const [allStudents, setAllStudents] = useState(() => {
    const stored = localStorage.getItem('students');
    return stored ? JSON.parse(stored) : students;
  });

  const [dueStudents, setDueStudents] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, overdue, partial, unpaid
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Load and calculate due students
  useEffect(() => {
    calculateDueStudents();
  }, [allStudents, searchQuery, filterStatus]);

  const calculateDueStudents = () => {
    let filtered = allStudents.filter(student => {
      const feePaid = Number(student.feePaid) || 0;
      const totalFee = Number(student.totalFee) || 0;
      const feeDue = Math.max(0, totalFee - feePaid);
      const hasDue = feeDue > 0;
      
      // Check if overdue (more than 2 months since admission)
      const admissionDate = new Date(student.admissionDate);
      const today = new Date();
      const monthsDiff = (today.getFullYear() - admissionDate.getFullYear()) * 12 + 
                         (today.getMonth() - admissionDate.getMonth());
      const isOverdue = monthsDiff > 2 && feeDue > 0;
      
      let statusMatch = true;
      if (filterStatus === "overdue") statusMatch = isOverdue;
      else if (filterStatus === "partial") statusMatch = feePaid > 0 && feeDue > 0;
      else if (filterStatus === "unpaid") statusMatch = feePaid === 0 && feeDue > 0;
      
      // Search filter
      const searchMatch = !searchQuery || 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone?.includes(searchQuery);
      
      return hasDue && statusMatch && searchMatch;
    });

    // Sort by due amount (highest first)
    filtered.sort((a, b) => {
      const dueA = Math.max(0, (Number(a.totalFee) || 0) - (Number(a.feePaid) || 0));
      const dueB = Math.max(0, (Number(b.totalFee) || 0) - (Number(b.feePaid) || 0));
      return dueB - dueA;
    });

    setDueStudents(filtered);
    
    // Calculate total due
    const total = filtered.reduce((sum, student) => {
      const feePaid = Number(student.feePaid) || 0;
      const totalFee = Number(student.totalFee) || 0;
      return sum + Math.max(0, totalFee - feePaid);
    }, 0);
    
    setTotalDue(total);
  };

  // Refresh data from localStorage
  const refreshData = () => {
    const storedStudents = JSON.parse(localStorage.getItem('students') || '[]');
    setAllStudents(storedStudents);
    if (setStudents) setStudents(storedStudents);
    calculateDueStudents();
  };

  // Format currency
  const formatCurrency = (value) => {
    const numValue = Number(value || 0);
    return `₹${numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get payment status with color
  const getPaymentStatus = (student) => {
    const feePaid = Number(student.feePaid) || 0;
    const totalFee = Number(student.totalFee) || 0;
    const feeDue = Math.max(0, totalFee - feePaid);
    
    if (feeDue === 0) return { text: "Paid", color: "#10b981", bg: "#d1fae5" };
    
    const admissionDate = new Date(student.admissionDate);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - admissionDate.getFullYear()) * 12 + 
                       (today.getMonth() - admissionDate.getMonth());
    
    if (monthsDiff > 2) return { text: "Overdue", color: "#dc2626", bg: "#fee2e2" };
    if (feePaid > 0) return { text: "Partial", color: "#f59e0b", bg: "#fef3c7" };
    return { text: "Unpaid", color: "#6b7280", bg: "#f3f4f6" };
  };

  // Handle quick payment
  const handleQuickPayment = (student, amount) => {
    setSelectedStudent(student);
    setPaymentAmount(amount.toString());
    setShowPaymentModal(true);
  };

  // Handle payment submission
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !paymentAmount || Number(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount!");
      return;
    }

    setLoading(true);
    
    try {
      const amount = Number(paymentAmount);
      const student = selectedStudent;
      
      const feePaid = Number(student.feePaid) || 0;
      const totalFee = Number(student.totalFee) || 0;
      const currentDue = Math.max(0, totalFee - feePaid);
      
      if (amount > currentDue) {
        alert(`Payment amount cannot exceed due amount (${formatCurrency(currentDue)})!`);
        setLoading(false);
        return;
      }
      
      // Calculate new balances
      const newPaid = feePaid + amount;
      const newDue = Math.max(0, totalFee - newPaid);
      
      // Determine payment status
      let paymentStatus = "partial";
      if (newDue === 0) paymentStatus = "fully_paid";
      else if (feePaid === 0 && amount > 0) paymentStatus = "first_payment";
      
      // Generate transaction number
      const generateTransactionNumber = () => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TXN${year}${month}${day}${hours}${minutes}${random}`;
      };
      
      const transactionNumber = generateTransactionNumber();
      
      // Prepare payment data
      const paymentData = {
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        studentId: student.studentId,
        studentName: student.name,
        amount: amount,
        date: paymentDate,
        method: paymentMethod,
        description: `Fee payment from Due Fees page`,
        transactionId: transactionNumber,
        timestamp: new Date().toISOString(),
        course: student.course,
        fatherName: student.fatherName,
        phone: student.phone,
        remainingDue: newDue,
        previousDue: currentDue,
        type: "regular_payment",
        status: "completed"
      };
      
      // Update student record
      const updatedStudent = {
        ...student,
        feePaid: newPaid,
        feeDue: newDue,
        lastPaymentDate: paymentDate,
        paymentStatus: paymentStatus,
        updatedAt: new Date().toISOString()
      };
      
      // Update all students array
      const updatedAllStudents = allStudents.map(s => 
        s.studentId === student.studentId ? updatedStudent : s
      );
      
      // Update studentFees array
      const updatedStudentFees = [...studentFees, paymentData];
      
      // ✅ Save to localStorage (MOST IMPORTANT)
      localStorage.setItem("students", JSON.stringify(updatedAllStudents));
      localStorage.setItem("studentFees", JSON.stringify(updatedStudentFees));
      
      // ✅ Update parent state if provided
      if (setStudents) {
        setStudents(updatedAllStudents);
      }
      
      // ✅ Call callback if provided
      if (onPaymentSuccess) {
        onPaymentSuccess(updatedStudent, paymentData);
      }
      
      // Update states
      setAllStudents(updatedAllStudents);
      setSelectedStudent(updatedStudent);
      setShowPaymentModal(false);
      setPaymentAmount("");
      
      // Refresh data
      refreshData();
      
      // Show success message
      alert(`Payment of ${formatCurrency(amount)} recorded successfully for ${student.name}!`);
      
    } catch (error) {
      console.error("Payment error:", error);
      alert("Error recording payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle mark as fully paid
  const handleMarkFullyPaid = (student) => {
    if (!window.confirm(`Mark ${student.name}'s fees as fully paid?`)) return;
    
    const updatedStudent = {
      ...student,
      feePaid: student.totalFee,
      feeDue: 0,
      paymentStatus: "fully_paid",
      lastPaymentDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };
    
    const updatedAllStudents = allStudents.map(s => 
      s.studentId === student.studentId ? updatedStudent : s
    );
    
    localStorage.setItem("students", JSON.stringify(updatedAllStudents));
    setAllStudents(updatedAllStudents);
    if (setStudents) setStudents(updatedAllStudents);
    
    refreshData();
    alert(`${student.name} marked as fully paid!`);
  };

  // Toggle student details
  const toggleStudentDetails = (studentId) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentId);
    }
  };

  // Export due fees report
  const exportReport = () => {
    const report = dueStudents.map(student => ({
      'Student ID': student.studentId,
      'Name': student.name,
      'Course': student.course,
      'Total Fee': student.totalFee,
      'Paid': student.feePaid,
      'Due': Math.max(0, student.totalFee - student.feePaid),
      'Last Payment': student.lastPaymentDate,
      'Phone': student.phone,
      'Status': getPaymentStatus(student).text
    }));
    
    const csvContent = [
      Object.keys(report[0] || {}).join(','),
      ...report.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `due_fees_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get payment history for student
  const loadPaymentHistory = (studentId) => {
    const history = studentFees
      .filter(fee => fee.studentId === studentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    setPaymentHistory(history);
    setShowPaymentHistory(true);
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
    summaryCards: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "25px"
    },
    summaryCard: {
      background: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0"
    },
    cardTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#64748b",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    cardValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1e293b"
    },
    filters: {
      display: "flex",
      gap: "15px",
      marginBottom: "20px",
      flexWrap: "wrap",
      alignItems: "center"
    },
    searchInput: {
      flex: 1,
      minWidth: "250px",
      padding: "10px 15px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      background: "white"
    },
    filterSelect: {
      padding: "10px 15px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: "14px",
      background: "white",
      minWidth: "150px"
    },
    studentCard: {
      background: "white",
      borderRadius: "12px",
      marginBottom: "15px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0",
      overflow: "hidden"
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
      width: "45px",
      height: "45px",
      borderRadius: "50%",
      background: "#3b82f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold",
      fontSize: "18px"
    },
    studentDetails: {
      flex: 1
    },
    studentName: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "3px"
    },
    studentMeta: {
      fontSize: "13px",
      color: "#64748b",
      display: "flex",
      alignItems: "center",
      gap: "15px",
      flexWrap: "wrap"
    },
    feeInfo: {
      display: "flex",
      alignItems: "center",
      gap: "20px",
      marginLeft: "auto"
    },
    feeAmount: {
      textAlign: "right"
    },
    dueAmount: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#ef4444"
    },
    totalAmount: {
      fontSize: "13px",
      color: "#64748b",
      marginTop: "3px"
    },
    statusBadge: {
      padding: "5px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-block"
    },
    actionButtons: {
      display: "flex",
      gap: "10px"
    },
    primaryButton: {
      padding: "8px 15px",
      background: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      transition: "all 0.2s"
    },
    secondaryButton: {
      padding: "8px 15px",
      background: "#f1f5f9",
      color: "#475569",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      transition: "all 0.2s"
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
      marginBottom: "20px"
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
      marginBottom: "5px"
    },
    detailValue: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1e293b"
    },
    quickPaymentButtons: {
      display: "flex",
      gap: "10px",
      marginTop: "15px",
      flexWrap: "wrap"
    },
    quickAmountButton: {
      padding: "8px 15px",
      background: "#e0f2fe",
      border: "1px solid #7dd3fc",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#0369a1",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    },
    modalContent: {
      background: "white",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "90vh",
      overflowY: "auto"
    },
    modalHeader: {
      padding: "20px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#1e293b",
      margin: 0
    },
    modalBody: {
      padding: "20px"
    },
    formGroup: {
      marginBottom: "15px"
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#475569"
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      fontSize: "14px",
      background: "#f8fafc"
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      fontSize: "14px",
      background: "#f8fafc"
    },
    modalFooter: {
      padding: "20px",
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end"
    },
    emptyState: {
      textAlign: "center",
      padding: "50px 20px",
      color: "#64748b"
    },
    emptyIcon: {
      fontSize: "48px",
      color: "#cbd5e1",
      marginBottom: "15px"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <AlertCircle size={32} />
          Due Fees Management
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={refreshData}
            style={styles.secondaryButton}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            style={styles.secondaryButton}
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={styles.cardTitle}>
            <Users size={16} />
            Students with Due Fees
          </div>
          <div style={styles.cardValue}>{dueStudents.length}</div>
        </div>
        
        <div style={styles.summaryCard}>
          <div style={styles.cardTitle}>
            <DollarSign size={16} />
            Total Due Amount
          </div>
          <div style={{ ...styles.cardValue, color: "#ef4444" }}>
            {formatCurrency(totalDue)}
          </div>
        </div>
        
        <div style={styles.summaryCard}>
          <div style={styles.cardTitle}>
            <Clock size={16} />
            Overdue Students
          </div>
          <div style={{ ...styles.cardValue, color: "#dc2626" }}>
            {dueStudents.filter(s => getPaymentStatus(s).text === "Overdue").length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by name, ID, course, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Due Students</option>
          <option value="overdue">Overdue Only</option>
          <option value="partial">Partially Paid</option>
          <option value="unpaid">Not Paid Yet</option>
        </select>
      </div>

      {/* Due Students List */}
      {dueStudents.length === 0 ? (
        <div style={styles.emptyState}>
          <CheckCircle size={64} style={{ opacity: 0.3, marginBottom: "20px" }} />
          <h3 style={{ color: "#64748b", marginBottom: "10px" }}>
            No Due Fees Found
          </h3>
          <p>All students are up to date with their payments!</p>
        </div>
      ) : (
        <div>
          {dueStudents.map(student => {
            const status = getPaymentStatus(student);
            const feeDue = Math.max(0, student.totalFee - student.feePaid);
            const isExpanded = expandedStudent === student.studentId;
            
            return (
              <div key={student.studentId} style={styles.studentCard}>
                {/* Student Header */}
                <div 
                  style={styles.studentHeader}
                  onClick={() => toggleStudentDetails(student.studentId)}
                >
                  <div style={styles.studentInfo}>
                    <div style={styles.studentAvatar}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.studentDetails}>
                      <div style={styles.studentName}>
                        {student.name}
                        <span style={{ 
                          ...styles.statusBadge, 
                          background: status.bg, 
                          color: status.color,
                          marginLeft: "10px"
                        }}>
                          {status.text}
                        </span>
                      </div>
                      <div style={styles.studentMeta}>
                        <span><strong>ID:</strong> {student.studentId}</span>
                        <span><Book size={12} /> {student.course}</span>
                        <span><Phone size={12} /> {student.phone || "N/A"}</span>
                        <span><Calendar size={12} /> Admission: {formatDate(student.admissionDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.feeInfo}>
                    <div style={styles.feeAmount}>
                      <div style={styles.dueAmount}>{formatCurrency(feeDue)}</div>
                      <div style={styles.totalAmount}>
                        Total: {formatCurrency(student.totalFee)} | Paid: {formatCurrency(student.feePaid)}
                      </div>
                    </div>
                    <div style={{ marginLeft: "15px" }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={styles.expandedContent}>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Father's Name</div>
                        <div style={styles.detailValue}>{student.fatherName || "N/A"}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Address</div>
                        <div style={styles.detailValue}>{student.address || "N/A"}</div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Last Payment</div>
                        <div style={styles.detailValue}>
                          {student.lastPaymentDate ? formatDate(student.lastPaymentDate) : "No payments yet"}
                        </div>
                      </div>
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Payment Status</div>
                        <div style={styles.detailValue}>
                          <span style={{ 
                            ...styles.statusBadge, 
                            background: status.bg, 
                            color: status.color 
                          }}>
                            {status.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Payment Buttons */}
                    <div>
                      <h4 style={{ marginBottom: "10px", color: "#475569", fontSize: "14px" }}>
                        Quick Payment Options
                      </h4>
                      <div style={styles.quickPaymentButtons}>
                        {[500, 1000, 2000, 5000].map(amount => (
                          amount <= feeDue && (
                            <button
                              key={amount}
                              onClick={() => handleQuickPayment(student, amount)}
                              style={styles.quickAmountButton}
                            >
                              Pay {formatCurrency(amount)}
                            </button>
                          )
                        ))}
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setPaymentAmount(feeDue.toString());
                            setShowPaymentModal(true);
                          }}
                          style={styles.primaryButton}
                        >
                          <DollarSign size={14} />
                          Pay Full Due ({formatCurrency(feeDue)})
                        </button>
                        <button
                          onClick={() => handleMarkFullyPaid(student)}
                          style={{
                            ...styles.secondaryButton,
                            background: "#fef3c7",
                            borderColor: "#f59e0b",
                            color: "#92400e"
                          }}
                        >
                          <CheckCircle size={14} />
                          Mark as Fully Paid
                        </button>
                        <button
                          onClick={() => loadPaymentHistory(student.studentId)}
                          style={styles.secondaryButton}
                        >
                          <History size={14} />  {/* ✅ Fixed: History icon imported */}
                          View History
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <CreditCard size={20} />
                Collect Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={{ 
                background: "#f0f9ff", 
                padding: "15px", 
                borderRadius: "8px", 
                marginBottom: "20px",
                border: "1px solid #7dd3fc"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <User size={18} color="#0369a1" />
                  <strong style={{ color: "#0369a1" }}>{selectedStudent.name}</strong>
                </div>
                <div style={{ fontSize: "14px", color: "#475569" }}>
                  <div>Student ID: {selectedStudent.studentId}</div>
                  <div>Course: {selectedStudent.course}</div>
                  <div>Total Due: {formatCurrency(Math.max(0, selectedStudent.totalFee - selectedStudent.feePaid))}</div>
                </div>
              </div>
              
              <form onSubmit={handleSubmitPayment}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Amount *</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    style={styles.input}
                    placeholder="Enter amount"
                    min="1"
                    max={Math.max(0, selectedStudent.totalFee - selectedStudent.feePaid)}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    style={styles.input}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="cash">💰 Cash</option>
                    <option value="bank">🏦 Bank Transfer</option>
                    <option value="card">💳 Card</option>
                    <option value="upi">📱 UPI</option>
                    <option value="check">📝 Cheque</option>
                  </select>
                </div>
                
                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    style={styles.secondaryButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={styles.primaryButton}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          border: '2px solid white', 
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Submit Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && (
        <div style={styles.modalOverlay} onClick={() => setShowPaymentHistory(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <History size={20} />  {/* ✅ Fixed: History icon imported */}
                Payment History
              </h3>
              <button
                onClick={() => setShowPaymentHistory(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.modalBody}>
              {paymentHistory.length === 0 ? (
                <p style={{ textAlign: "center", color: "#64748b" }}>No payment history found</p>
              ) : (
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {paymentHistory.map(payment => (
                    <div key={payment.id} style={{
                      background: "#f8fafc",
                      padding: "15px",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <strong style={{ color: "#1e293b" }}>{formatCurrency(payment.amount)}</strong>
                        <span style={{ 
                          fontSize: "12px", 
                          background: "#d1fae5", 
                          color: "#065f46",
                          padding: "2px 8px",
                          borderRadius: "4px"
                        }}>
                          {payment.method}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "5px" }}>
                        {formatDate(payment.date)} • {payment.transactionId}
                      </div>
                      <div style={{ fontSize: "13px", color: "#475569" }}>
                        {payment.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .due-fees-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .due-fees-table th {
          background: #f1f5f9;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .due-fees-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #475569;
        }
        
        .due-fees-table tr:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default GetDueFees;