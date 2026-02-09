import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Phone,
  Book,
  User,
  ArrowLeft,
  Check,
  X,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const PromoteStudent = ({ students = [], setStudents, setActiveMenu }) => {
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [selectedCourses, setSelectedCourses] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [expandedStudents, setExpandedStudents] = useState({});

  // ✅ Load IT courses dynamically from localStorage (CoursesPage)
  const [itCourses, setItCourses] = useState([]);

  useEffect(() => {
    const savedCourses = localStorage.getItem("courses");
    setItCourses(savedCourses ? JSON.parse(savedCourses) : []);
  }, []);

  // Get unique months from admissionMonth
  const uniqueMonths = ["all", ...new Set(students
    .map(s => s.admissionMonth)
    .filter(Boolean)
  )].sort();

  // Get unique courses from students
  const uniqueStudentCourses = ["all", ...new Set(students
    .map(s => s.course)
    .filter(Boolean)
  )].sort();

  // Get status color
  const getStatusInfo = (status) => {
    switch(status) {
      case "Active":
        return { color: "#10b981", bg: "#d1fae5" };
      case "Inactive":
        return { color: "#6b7280", bg: "#f3f4f6" };
      case "Left":
        return { color: "#f59e0b", bg: "#fef3c7" };
      case "Passout":
        return { color: "#3b82f6", bg: "#dbeafe" };
      default:
        return { color: "#10b981", bg: "#d1fae5" };
    }
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

  // Format currency
  const formatCurrency = (value) => {
    const numValue = Number(value || 0);
    return `₹${numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Calculate due amount
  const calculateDue = (student) => {
    const totalFee = Number(student.totalFee || 0);
    const feePaid = Number(student.feePaid || 0);
    return Math.max(0, totalFee - feePaid);
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    // Search filter
    if (searchTerm && 
        !student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !student.course?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !student.phone?.includes(searchTerm)) {
      return false;
    }
    
    // Course filter
    if (filterCourse !== "all" && student.course !== filterCourse) return false;
    
    // Status filter
    if (filterStatus !== "all" && (student.status || "Active") !== filterStatus) return false;
    
    // Month filter
    if (filterMonth !== "all" && student.admissionMonth !== filterMonth) return false;
    
    return true;
  });

  const toggleStudentDetails = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const getCourseStats = (courseName) => {
    return students.filter(student => student.course === courseName).length;
  };

  const getCourseColor = (courseName) => {
    const course = itCourses.find(c => c.title === courseName);
    return course ? course.color || "#3498db" : "#3498db";
  };

  const handlePromote = (studentIndex) => {
    const selected = selectedCourses[studentIndex];
    if (!selected) {
      showNotification("Please select a course to promote", "error");
      return;
    }

    const originalIndex = students.findIndex(s => 
      s.studentId === filteredStudents[studentIndex].studentId
    );

    if (originalIndex === -1) return;

    const updatedStudents = [...students];
    const student = updatedStudents[originalIndex];
    
    // Store previous course for reference
    updatedStudents[originalIndex] = {
      ...student,
      course: selected,
      previousCourse: student.course,
      lastPromotionDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };

    setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    
    showNotification(
      `✅ Student "${student.name}" promoted from ${student.course} to ${selected}`,
      "success"
    );

    setSelectedCourses(prev => {
      const newSelections = { ...prev };
      delete newSelections[studentIndex];
      return newSelections;
    });
  };

  const handlePromoteAll = () => {
    if (filteredStudents.length === 0) {
      showNotification("No students to promote", "error");
      return;
    }

    let promotedCount = 0;
    const updatedStudents = [...students];

    filteredStudents.forEach((student, index) => {
      const selectedCourse = selectedCourses[index];
      if (selectedCourse && selectedCourse !== student.course) {
        const originalIndex = students.findIndex(s => 
          s.studentId === student.studentId
        );
        
        if (originalIndex !== -1) {
          updatedStudents[originalIndex] = {
            ...student,
            course: selectedCourse,
            previousCourse: student.course,
            lastPromotionDate: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString()
          };
          promotedCount++;
        }
      }
    });

    if (promotedCount === 0) {
      showNotification("No changes to promote", "warning");
      return;
    }

    setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    
    showNotification(
      `✅ Successfully promoted ${promotedCount} student(s)`,
      "success"
    );
    
    setSelectedCourses({});
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 5000);
  };

  const resetSelections = () => {
    setSelectedCourses({});
    showNotification("All selections cleared", "info");
  };

  const selectAllStudents = () => {
    const allSelections = {};
    filteredStudents.forEach((student, idx) => {
      allSelections[idx] = student.course; // Set current course as default
    });
    setSelectedCourses(allSelections);
    showNotification(`Selected all ${filteredStudents.length} students`, "info");
  };

  const resetFilters = () => {
    setFilterCourse("all");
    setFilterStatus("all");
    setFilterMonth("all");
    setSearchTerm("");
  };

  const getSelectedCourseFee = (studentIndex, courseName) => {
    if (!courseName) return 0;
    const course = itCourses.find(c => c.title === courseName);
    return course ? course.fee || 0 : 0;
  };

  const styles = {
    container: {
      padding: "25px",
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
      margin: "0 0 8px 0",
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    subtitle: {
      fontSize: "14px",
      color: "#64748b",
      margin: 0
    },
    headerActions: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap"
    },
    button: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s"
    },
    dashboardButton: {
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "20px",
      boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)"
    },
    selectAllButton: {
      background: "#f1f5f9",
      color: "#475569",
      border: "1px solid #e2e8f0"
    },
    promoteAllButton: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white",
      border: "none",
      boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)"
    },
    clearButton: {
      background: "#fee2e2",
      color: "#dc2626",
      border: "1px solid #fecaca"
    },
    notification: {
      padding: "15px 20px",
      borderRadius: "8px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontWeight: "600"
    },
    successNotification: {
      background: "#d1fae5",
      border: "1px solid #10b981",
      color: "#065f46"
    },
    errorNotification: {
      background: "#fee2e2",
      border: "1px solid #dc2626",
      color: "#dc2626"
    },
    warningNotification: {
      background: "#fef3c7",
      border: "1px solid #f59e0b",
      color: "#92400e"
    },
    infoNotification: {
      background: "#e0f2fe",
      border: "1px solid #0ea5e9",
      color: "#0369a1"
    },
    searchSection: {
      position: "relative",
      marginBottom: "25px"
    },
    searchInput: {
      width: "100%",
      padding: "14px 20px",
      paddingRight: "50px",
      border: "2px solid #e2e8f0",
      borderRadius: "10px",
      fontSize: "16px",
      background: "white",
      transition: "all 0.2s",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    clearSearch: {
      position: "absolute",
      right: "15px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "transparent",
      border: "none",
      color: "#64748b",
      cursor: "pointer",
      fontSize: "18px"
    },
    filtersContainer: {
      background: "white",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "25px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      border: "1px solid #e2e8f0"
    },
    filtersHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      cursor: "pointer"
    },
    filterGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px",
      marginBottom: "15px"
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column"
    },
    filterLabel: {
      fontSize: "12px",
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
    tableWrapper: {
      background: "white",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "14px"
    },
    th: {
      background: "#f1f5f9",
      padding: "16px",
      textAlign: "left",
      fontWeight: "600",
      color: "#475569",
      borderBottom: "2px solid #e2e8f0",
      fontSize: "14px"
    },
    td: {
      padding: "16px",
      borderBottom: "1px solid #e2e8f0",
      color: "#1e293b",
      verticalAlign: "middle"
    },
    actionButton: {
      padding: "8px 16px",
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)"
    },
    disabledButton: {
      background: "#f1f5f9",
      color: "#94a3b8",
      cursor: "not-allowed",
      boxShadow: "none"
    },
    noDataMessage: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#64748b",
      background: "white",
      borderRadius: "12px",
      marginBottom: "20px"
    },
    statsBadge: {
      background: "#e0f2fe",
      color: "#0369a1",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      marginLeft: "8px"
    },
    feeInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    feeLabel: {
      fontSize: "11px",
      color: "#64748b",
      fontWeight: "600"
    },
    feeValue: {
      fontSize: "14px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    dueAmount: {
      color: "#dc2626"
    },
    paidAmount: {
      color: "#10b981"
    },
    expandedRow: {
      background: "#f8fafc"
    },
    expandedContent: {
      padding: "20px",
      borderTop: "1px solid #e2e8f0"
    },
    detailGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px"
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
      gap: "4px"
    },
    courseSelect: {
      padding: "10px 12px",
      border: "2px solid #e2e8f0",
      borderRadius: "6px",
      fontSize: "14px",
      background: "white",
      cursor: "pointer",
      minWidth: "250px",
      transition: "all 0.2s"
    }
  };

  return (
    <div style={styles.container}>
      {/* Dashboard Button */}
      <button
        onClick={() => setActiveMenu && setActiveMenu("dashboard")}
        style={styles.dashboardButton}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}><TrendingUp size={32} /> Promote Students</h1>
          <p style={styles.subtitle}>Change student courses and track academic progress</p>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={selectAllStudents}
            disabled={filteredStudents.length === 0}
            style={{
              ...styles.button,
              ...styles.selectAllButton,
              opacity: filteredStudents.length === 0 ? 0.5 : 1
            }}
          >
            <Check size={16} /> Select All ({filteredStudents.length})
          </button>
          <button 
            onClick={handlePromoteAll}
            disabled={Object.keys(selectedCourses).length === 0}
            style={{
              ...styles.button,
              ...styles.promoteAllButton,
              opacity: Object.keys(selectedCourses).length === 0 ? 0.5 : 1
            }}
          >
            <TrendingUp size={16} /> Promote Selected ({Object.keys(selectedCourses).length})
          </button>
          <button 
            onClick={resetSelections}
            disabled={Object.keys(selectedCourses).length === 0}
            style={{
              ...styles.button,
              ...styles.clearButton,
              opacity: Object.keys(selectedCourses).length === 0 ? 0.5 : 1
            }}
          >
            <X size={16} /> Clear Selections
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification.message && (
        <div style={{
          ...styles.notification,
          ...(notification.type === 'success' ? styles.successNotification :
               notification.type === 'error' ? styles.errorNotification :
               notification.type === 'warning' ? styles.warningNotification :
               styles.infoNotification)
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {notification.type === 'success' ? '✅' :
             notification.type === 'error' ? '❌' : 
             notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification({ message: "", type: "" })}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search Section */}
      <div style={styles.searchSection}>
        <input
          type="text"
          placeholder="🔍 Search students by name, ID, course, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm("")}
            style={styles.clearSearch}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div 
          style={styles.filtersHeader}
          onClick={() => setShowFilters(!showFilters)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Filter size={20} color="#3b82f6" />
            <h3 style={{ margin: 0, color: "#1e293b", fontSize: "16px", fontWeight: "700" }}>
              Filter Students
            </h3>
            <span style={{
              background: "#3b82f6",
              color: "white",
              padding: "2px 8px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "600"
            }}>
              {filteredStudents.length} found
            </span>
          </div>
          <div>
            {showFilters ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
          </div>
        </div>

        {showFilters && (
          <div>
            <div style={styles.filterGrid}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <Book size={14} /> Current Course
                </label>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  style={{
                    ...styles.select,
                    borderColor: filterCourse !== "all" ? "#10b981" : "#e2e8f0"
                  }}
                >
                  <option value="all">All Courses</option>
                  {uniqueStudentCourses.filter(c => c !== "all").map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <User size={14} /> Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    ...styles.select,
                    borderColor: filterStatus !== "all" ? getStatusInfo(filterStatus).color : "#e2e8f0"
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
                <label style={styles.filterLabel}>
                  <Calendar size={14} /> Fees Month
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{
                    ...styles.select,
                    borderColor: filterMonth !== "all" ? "#f59e0b" : "#e2e8f0"
                  }}
                >
                  <option value="all">All Months</option>
                  {uniqueMonths.filter(m => m !== "all").map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginTop: "15px",
              paddingTop: "15px",
              borderTop: "1px solid #e2e8f0"
            }}>
              <button 
                onClick={resetFilters}
                style={{
                  padding: "8px 16px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Reset Filters
              </button>
              <div style={{ fontSize: "14px", color: "#475569", fontWeight: "600" }}>
                Showing {filteredStudents.length} of {students.length} students
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Table */}
      <div style={styles.tableWrapper}>
        {filteredStudents.length === 0 ? (
          <div style={styles.noDataMessage}>
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>📚</div>
            <h3 style={{ color: "#475569", marginBottom: "10px" }}>No Students Found</h3>
            <p style={{ fontSize: "14px", maxWidth: "400px", margin: "0 auto" }}>
              {searchTerm || filterCourse !== "all" || filterStatus !== "all" || filterMonth !== "all" 
                ? "No students match your filters. Try adjusting your search criteria." 
                : "No students available. Add students from New Admission page."}
            </p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Student ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Current Course</th>
                <th style={styles.th}>Fee Information</th>
                <th style={styles.th}>New Course</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const dueAmount = calculateDue(student);
                const totalFee = Number(student.totalFee || 0);
                const feePaid = Number(student.feePaid || 0);
                const paymentProgress = totalFee > 0 ? Math.round((feePaid / totalFee) * 100) : 0;
                const isExpanded = expandedStudents[student.studentId];
                const statusInfo = getStatusInfo(student.status || "Active");
                const selectedCourseFee = getSelectedCourseFee(index, selectedCourses[index]);
                
                return (
                  <React.Fragment key={index}>
                    <tr style={isExpanded ? styles.expandedRow : {}}>
                      <td style={styles.td}>
                        <strong>{index + 1}</strong>
                        <button
                          onClick={() => toggleStudentDetails(student.studentId)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            marginLeft: "10px",
                            color: "#64748b"
                          }}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: "600", color: "#3b82f6" }}>
                          {student.studentId}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>
                            {student.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Phone size={12} /> {student.phone || "N/A"}
                            <span style={{
                              ...styles.statusBadge,
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              fontSize: "10px"
                            }}>
                              {student.status || "Active"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ 
                            background: "#f0f9ff", 
                            color: "#0369a1",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            {student.course || "No Course"}
                          </span>
                          {student.admissionMonth && (
                            <span style={{
                              background: "#f1f5f9",
                              color: "#64748b",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "11px"
                            }}>
                              {student.admissionMonth}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.feeInfo}>
                          <div>
                            <div style={styles.feeLabel}>Total Fee</div>
                            <div style={styles.feeValue}>{formatCurrency(totalFee)}</div>
                          </div>
                          <div>
                            <div style={styles.feeLabel}>Paid</div>
                            <div style={{ ...styles.feeValue, ...styles.paidAmount }}>
                              <TrendingUp size={12} /> {formatCurrency(feePaid)}
                              {totalFee > 0 && (
                                <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "5px" }}>
                                  ({paymentProgress}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div style={styles.feeLabel}>Due</div>
                            <div style={{ ...styles.feeValue, ...styles.dueAmount }}>
                              <TrendingDown size={12} /> {formatCurrency(dueAmount)}
                              {dueAmount > 0 && " ⚠️"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <select
                          value={selectedCourses[index] || ""}
                          onChange={(e) =>
                            setSelectedCourses({
                              ...selectedCourses,
                              [index]: e.target.value
                            })
                          }
                          style={{
                            ...styles.courseSelect,
                            borderColor: selectedCourses[index] ? "#10b981" : "#e2e8f0"
                          }}
                        >
                          <option value="">-- Select New Course --</option>
                          {itCourses.map((course) => (
                            <option key={course.id} value={course.title}>
                              {course.title} (Fee: {formatCurrency(course.fee || 0)})
                            </option>
                          ))}
                        </select>
                        {selectedCourses[index] && selectedCourseFee > 0 && (
                          <div style={{ marginTop: "8px", fontSize: "12px", color: "#3b82f6", fontWeight: "600" }}>
                            New Course Fee: {formatCurrency(selectedCourseFee)}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handlePromote(index)}
                          disabled={!selectedCourses[index] || selectedCourses[index] === student.course}
                          style={{
                            ...styles.actionButton,
                            ...(!selectedCourses[index] || selectedCourses[index] === student.course ? styles.disabledButton : {}),
                            width: "100px"
                          }}
                        >
                          {!selectedCourses[index] ? "Select Course" :
                           selectedCourses[index] === student.course ? "Same Course" :
                           "Promote"}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr style={styles.expandedRow}>
                        <td colSpan="7" style={{ padding: 0 }}>
                          <div style={styles.expandedContent}>
                            <div style={styles.detailGrid}>
                              <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Father's Name</div>
                                <div style={styles.detailValue}>{student.fatherName || "N/A"}</div>
                              </div>
                              <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Admission Date</div>
                                <div style={styles.detailValue}>{formatDate(student.admissionDate)}</div>
                              </div>
                              <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Gender</div>
                                <div style={styles.detailValue}>{student.gender || "N/A"}</div>
                              </div>
                              <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Date of Birth</div>
                                <div style={styles.detailValue}>{student.dob || "N/A"}</div>
                              </div>
                              <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Last Payment Date</div>
                                <div style={styles.detailValue}>
                                  {student.lastPaymentDate ? formatDate(student.lastPaymentDate) : "No payments yet"}
                                </div>
                              </div>
                              <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Email</div>
                                <div style={styles.detailValue}>{student.email || "N/A"}</div>
                              </div>
                              <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Address</div>
                                <div style={styles.detailValue}>{student.address || "N/A"}</div>
                              </div>
                              <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Remarks</div>
                                <div style={styles.detailValue}>{student.remarks || "No remarks"}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Stats */}
      <div style={{
        marginTop: "25px",
        padding: "20px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "15px",
        fontSize: "14px",
        color: "#475569"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>{students.length}</div>
          <div>Total Students</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>{filteredStudents.length}</div>
          <div>Filtered Students</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{Object.keys(selectedCourses).length}</div>
          <div>Selected for Promotion</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#8b5cf6" }}>{itCourses.length}</div>
          <div>Available Courses</div>
        </div>
      </div>
    </div>
  );
};

export default PromoteStudent;