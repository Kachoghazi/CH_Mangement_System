// pages/Reports.jsx - UPDATED WITH COMPLETE FEE DATA
import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  Download, Printer, Filter, Calendar, AlertCircle, 
  TrendingUp, Users, DollarSign, Book, CheckCircle,
  Clock, XCircle, TrendingDown, ArrowUpRight, ArrowDownRight,
  FileText, BarChart2, PieChart as PieChartIcon, Activity
} from "lucide-react";

const Reports = ({ students, studentFees, fees }) => {
  const [dateRange, setDateRange] = useState("all");
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState("bar");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredSelect, setHoveredSelect] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Get unique courses for filter
  const uniqueCourses = ["all", ...new Set(students.map(s => s.course).filter(Boolean))];
  const uniqueStatuses = ["all", "Active", "Inactive", "Left", "Passout"];

  // Calculate fee data from students array
  const calculateStudentFees = (student) => {
    const totalFee = Number(student.totalFee || 0);
    const feePaid = Number(student.feePaid || 0);
    const dueAmount = Math.max(0, totalFee - feePaid);
    const paymentProgress = totalFee > 0 ? Math.round((feePaid / totalFee) * 100) : 0;
    
    // Determine fee status
    let feeStatus = "Fully Paid";
    let statusColor = "#10b981";
    
    if (dueAmount > 0) {
      if (feePaid === 0) {
        feeStatus = "Unpaid";
        statusColor = "#ef4444";
      } else {
        feeStatus = "Partially Paid";
        statusColor = "#f59e0b";
      }
    }
    
    // Check for overdue (if last payment was more than 30 days ago)
    let overdueAmount = 0;
    if (dueAmount > 0 && student.lastPaymentDate) {
      const lastPayment = new Date(student.lastPaymentDate);
      const daysSincePayment = Math.floor((new Date() - lastPayment) / (1000 * 60 * 60 * 24));
      if (daysSincePayment > 30) {
        overdueAmount = dueAmount;
        feeStatus = "Overdue";
        statusColor = "#dc2626";
      }
    }
    
    return {
      totalFee,
      feePaid,
      dueAmount,
      overdueAmount,
      paymentProgress,
      feeStatus,
      statusColor,
      lastPaymentDate: student.lastPaymentDate
    };
  };

  // Get month name from admissionMonth
  const getMonthName = (admissionMonth) => {
    if (!admissionMonth) return "Not Specified";
    return admissionMonth;
  };

  // Calculate totals
  useEffect(() => {
    setLoading(true);
    const calculateReportData = () => {
      let filteredStudents = [...students];

      // Apply filters
      if (selectedCourse !== "all") {
        filteredStudents = filteredStudents.filter(s => s.course === selectedCourse);
      }
      
      if (selectedStatus !== "all") {
        filteredStudents = filteredStudents.filter(s => (s.status || "Active") === selectedStatus);
      }

      // Date range filter
      if (dateRange !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        if (dateRange === "month") startDate.setMonth(now.getMonth() - 1);
        else if (dateRange === "quarter") startDate.setMonth(now.getMonth() - 3);
        else if (dateRange === "year") startDate.setFullYear(now.getFullYear() - 1);
        
        filteredStudents = filteredStudents.filter(student => {
          const admissionDate = new Date(student.admissionDate);
          return admissionDate >= startDate;
        });
      }

      // Calculate fee data for each student
      return filteredStudents.map(student => {
        const feeData = calculateStudentFees(student);
        const admissionDate = new Date(student.admissionDate);
        
        return {
          name: student.name,
          studentId: student.studentId,
          course: student.course || "N/A",
          admissionMonth: getMonthName(student.admissionMonth),
          admissionDate: admissionDate.toLocaleDateString('en-IN'),
          status: student.status || "Active",
          fatherName: student.fatherName || "N/A",
          phone: student.phone || "N/A",
          
          // Fee data
          totalFee: feeData.totalFee,
          feePaid: feeData.feePaid,
          dueAmount: feeData.dueAmount,
          overdueAmount: feeData.overdueAmount,
          paymentProgress: feeData.paymentProgress,
          feeStatus: feeData.feeStatus,
          statusColor: feeData.statusColor,
          lastPaymentDate: feeData.lastPaymentDate,
          
          // For charts
          Paid: feeData.feePaid,
          Due: feeData.dueAmount,
          Overdue: feeData.overdueAmount,
          Total: feeData.totalFee
        };
      }).sort((a, b) => b.dueAmount - a.dueAmount); // Sort by highest due first
    };

    setTimeout(() => {
      setFilteredData(calculateReportData());
      setLoading(false);
    }, 500);
  }, [students, dateRange, selectedCourse, selectedStatus]);

  // Calculate summary statistics
  const summaryStats = {
    totalStudents: filteredData.length,
    totalFeeAmount: filteredData.reduce((acc, item) => acc + item.totalFee, 0),
    totalPaid: filteredData.reduce((acc, item) => acc + item.feePaid, 0),
    totalDue: filteredData.reduce((acc, item) => acc + item.dueAmount, 0),
    totalOverdue: filteredData.reduce((acc, item) => acc + item.overdueAmount, 0),
    fullyPaidStudents: filteredData.filter(item => item.dueAmount === 0).length,
    partiallyPaidStudents: filteredData.filter(item => item.dueAmount > 0 && item.feePaid > 0).length,
    unpaidStudents: filteredData.filter(item => item.feePaid === 0).length,
    collectionRate: filteredData.length > 0 
      ? Math.round((filteredData.reduce((acc, item) => acc + item.feePaid, 0) / 
         filteredData.reduce((acc, item) => acc + item.totalFee, 0)) * 100) || 0
      : 0
  };

  // Calculate month-wise data
  const monthlyData = filteredData.reduce((acc, student) => {
    const month = student.admissionMonth;
    if (!month || month === "Not Specified") return acc;
    
    if (!acc[month]) {
      acc[month] = {
        month,
        students: 0,
        totalFees: 0,
        paidFees: 0,
        dueFees: 0
      };
    }
    
    acc[month].students += 1;
    acc[month].totalFees += student.totalFee;
    acc[month].paidFees += student.feePaid;
    acc[month].dueFees += student.dueAmount;
    
    return acc;
  }, {});

  const monthlyChartData = Object.values(monthlyData).sort((a, b) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months.indexOf(a.month.split(' ')[0]) - months.indexOf(b.month.split(' ')[0]);
  });

  // Data for pie chart
  const pieData = [
    { name: "Paid", value: summaryStats.totalPaid, color: "#10b981" },
    { name: "Due", value: summaryStats.totalDue, color: "#f59e0b" },
    { name: "Overdue", value: summaryStats.totalOverdue, color: "#ef4444" }
  ];

  // Course-wise fee distribution
  const courseData = filteredData.reduce((acc, student) => {
    const course = student.course;
    if (!acc[course]) {
      acc[course] = {
        course,
        students: 0,
        totalFees: 0,
        paidFees: 0,
        dueFees: 0
      };
    }
    
    acc[course].students += 1;
    acc[course].totalFees += student.totalFee;
    acc[course].paidFees += student.feePaid;
    acc[course].dueFees += student.dueAmount;
    
    return acc;
  }, {});

  const courseChartData = Object.values(courseData).sort((a, b) => b.totalFees - a.totalFees).slice(0, 10);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Student ID", "Student Name", "Father's Name", "Course", 
      "Admission Month", "Status", "Phone", "Total Fee", 
      "Fee Paid", "Due Amount", "Overdue Amount", "Payment %", "Fee Status"
    ];
    
    const csvData = filteredData.map(item => [
      item.studentId,
      item.name,
      item.fatherName,
      item.course,
      item.admissionMonth,
      item.status,
      item.phone,
      `₹${item.totalFee.toLocaleString()}`,
      `₹${item.feePaid.toLocaleString()}`,
      `₹${item.dueAmount.toLocaleString()}`,
      `₹${item.overdueAmount.toLocaleString()}`,
      `${item.paymentProgress}%`,
      item.feeStatus
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fees-detailed-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Export summary report
  const exportSummaryReport = () => {
    const summaryContent = [
      "FEE REPORT SUMMARY",
      `Generated on: ${new Date().toLocaleDateString('en-IN')}`,
      `Time Period: ${dateRange === "all" ? "All Time" : dateRange}`,
      `Course Filter: ${selectedCourse === "all" ? "All Courses" : selectedCourse}`,
      `Status Filter: ${selectedStatus === "all" ? "All Status" : selectedStatus}`,
      "",
      "SUMMARY STATISTICS",
      `Total Students: ${summaryStats.totalStudents}`,
      `Total Fee Amount: ₹${summaryStats.totalFeeAmount.toLocaleString()}`,
      `Total Paid: ₹${summaryStats.totalPaid.toLocaleString()}`,
      `Total Due: ₹${summaryStats.totalDue.toLocaleString()}`,
      `Total Overdue: ₹${summaryStats.totalOverdue.toLocaleString()}`,
      `Collection Rate: ${summaryStats.collectionRate}%`,
      `Fully Paid Students: ${summaryStats.fullyPaidStudents}`,
      `Partially Paid Students: ${summaryStats.partiallyPaidStudents}`,
      `Unpaid Students: ${summaryStats.unpaidStudents}`,
      "",
      "DISTRIBUTION",
      `Paid: ${Math.round((summaryStats.totalPaid / summaryStats.totalFeeAmount) * 100) || 0}%`,
      `Due: ${Math.round((summaryStats.totalDue / summaryStats.totalFeeAmount) * 100) || 0}%`,
      `Overdue: ${Math.round((summaryStats.totalOverdue / summaryStats.totalFeeAmount) * 100) || 0}%`
    ].join("\n");

    const blob = new Blob([summaryContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-summary-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  // Print detailed report
  const printDetailedReport = () => {
    const printWindow = window.open('', '_blank');
    const monthName = dateRange === "all" ? "All Time" : dateRange;
    const courseName = selectedCourse === "all" ? "All Courses" : selectedCourse;
    const statusName = selectedStatus === "all" ? "All Status" : selectedStatus;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Report - ${new Date().toLocaleDateString('en-IN')}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; }
          .academy-name { font-size: 24px; font-weight: bold; color: #1e40af; }
          .report-title { font-size: 18px; color: #3b82f6; margin: 10px 0; }
          .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .summary-item { margin: 8px 0; display: flex; justify-content: space-between; }
          .summary-label { font-weight: bold; color: #475569; }
          .summary-value { font-weight: bold; color: #1e293b; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { background: #3b82f6; color: white; padding: 10px; text-align: left; }
          .table td { padding: 8px; border: 1px solid #e2e8f0; }
          .table tr:nth-child(even) { background: #f8fafc; }
          .status-paid { color: #10b981; font-weight: bold; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          .status-overdue { color: #ef4444; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 11px; }
          @media print { body { margin: 10px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="academy-name">CodeHub Tech Academy</div>
          <div class="report-title">Fee Collection Report</div>
          <div style="color: #64748b;">
            Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div style="color: #64748b; margin-top: 5px;">
            Period: ${monthName} | Course: ${courseName} | Status: ${statusName}
          </div>
        </div>

        <div class="summary">
          <h3>Summary</h3>
          <div class="summary-item">
            <span class="summary-label">Total Students:</span>
            <span class="summary-value">${summaryStats.totalStudents}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Fee Amount:</span>
            <span class="summary-value">₹${summaryStats.totalFeeAmount.toLocaleString()}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Collected:</span>
            <span class="summary-value">₹${summaryStats.totalPaid.toLocaleString()} (${summaryStats.collectionRate}%)</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Due:</span>
            <span class="summary-value">₹${summaryStats.totalDue.toLocaleString()}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Overdue:</span>
            <span class="summary-value">₹${summaryStats.totalOverdue.toLocaleString()}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Fully Paid:</span>
            <span class="summary-value">${summaryStats.fullyPaidStudents} students</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Pending Payments:</span>
            <span class="summary-value">${summaryStats.partiallyPaidStudents + summaryStats.unpaidStudents} students</span>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Course</th>
              <th>Admission Month</th>
              <th>Total Fee</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Payment %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.studentId}</td>
                <td>${item.name}</td>
                <td>${item.course}</td>
                <td>${item.admissionMonth}</td>
                <td>₹${item.totalFee.toLocaleString()}</td>
                <td>₹${item.feePaid.toLocaleString()}</td>
                <td>₹${item.dueAmount.toLocaleString()}</td>
                <td>${item.paymentProgress}%</td>
                <td class="status-${item.feeStatus.toLowerCase().replace(' ', '-')}">
                  ${item.feeStatus}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Computer Generated Report - No Signature Required</p>
          <p>Total Students: ${summaryStats.totalStudents} | 
             Total Amount: ₹${summaryStats.totalFeeAmount.toLocaleString()} | 
             Collection Rate: ${summaryStats.collectionRate}%</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            🖨️ Print Report
          </button>
          <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-left: 10px;">
            ✕ Close
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

  // Inline CSS Styles Object
  const styles = {
    page: {
      padding: "24px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    },
    
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      flexWrap: "wrap",
      gap: "20px"
    },
    
    titleContainer: {
      flex: "1"
    },
    
    title: {
      fontSize: "32px",
      fontWeight: "800",
      color: "#1e293b",
      marginBottom: "8px",
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    },
    
    subtitle: {
      color: "#64748b",
      fontSize: "16px",
      fontWeight: "500"
    },
    
    actionButtons: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap"
    },
    
    button: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 24px",
      borderRadius: "10px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      fontSize: "14px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
    },
    
    exportButton: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white"
    },
    
    printButton: {
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "white"
    },
    
    summaryButton: {
      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      color: "white"
    },
    
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "30px"
    },
    
    statCard: {
      background: "white",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      border: "1px solid rgba(0, 0, 0, 0.05)",
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden"
    },
    
    statCardHover: {
      transform: "translateY(-8px)",
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)"
    },
    
    statIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "16px"
    },
    
    statLabel: {
      fontSize: "14px",
      color: "#64748b",
      marginBottom: "8px",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    
    statValue: {
      fontSize: "32px",
      fontWeight: "800",
      color: "#1e293b",
      marginBottom: "8px"
    },
    
    statTrend: {
      fontSize: "13px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    
    filterSection: {
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      marginBottom: "30px",
      border: "1px solid #e2e8f0"
    },
    
    filterHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "20px"
    },
    
    filterTitle: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#1e293b"
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
      fontWeight: "600",
      color: "#475569",
      fontSize: "14px",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      gap: "5px"
    },
    
    select: {
      padding: "12px 20px",
      border: "2px solid #e2e8f0",
      borderRadius: "10px",
      background: "white",
      color: "#1e293b",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    
    selectHover: {
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
    },
    
    dateInfo: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      color: "#64748b",
      fontWeight: "500",
      marginTop: "15px"
    },
    
    chartsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "30px",
      marginBottom: "30px"
    },
    
    chartContainer: {
      background: "white",
      padding: "28px",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      border: "1px solid rgba(0, 0, 0, 0.05)"
    },
    
    chartWrapper: {
      height: "340px"
    },
    
    chartSummary: {
      textAlign: "center",
      color: "#64748b",
      marginTop: "20px",
      paddingTop: "20px",
      borderTop: "2px dashed #e2e8f0",
      fontSize: "14px",
      fontWeight: "600"
    },
    
    tableSection: {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      overflow: "hidden",
      marginBottom: "30px",
      border: "1px solid rgba(0, 0, 0, 0.05)"
    },
    
    tableHeader: {
      padding: "24px",
      borderBottom: "2px solid #f1f5f9",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
    },
    
    tableTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "8px"
    },
    
    tableSubtitle: {
      fontSize: "14px",
      color: "#64748b",
      fontWeight: "500"
    },
    
    table: {
      width: "100%",
      borderCollapse: "collapse"
    },
    
    tableHead: {
      background: "#f8fafc"
    },
    
    tableHeaderCell: {
      padding: "18px 24px",
      textAlign: "left",
      fontWeight: "700",
      color: "#475569",
      fontSize: "13px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      borderBottom: "2px solid #e2e8f0",
      whiteSpace: "nowrap"
    },
    
    tableRow: {
      borderBottom: "1px solid #f1f5f9",
      transition: "all 0.2s ease",
      cursor: "pointer"
    },
    
    tableRowHover: {
      background: "#f8fafc",
      transform: "translateX(4px)"
    },
    
    tableCell: {
      padding: "18px 24px",
      fontSize: "14px",
      color: "#1e293b",
      fontWeight: "500",
      borderBottom: "1px solid #f1f5f9"
    },
    
    statusBadge: {
      display: "inline-block",
      padding: "8px 20px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "700",
      textAlign: "center",
      minWidth: "100px",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    
    progressBar: {
      height: "8px",
      borderRadius: "10px",
      background: "#e2e8f0",
      overflow: "hidden",
      width: "100%",
      marginTop: "8px"
    },
    
    progressFill: {
      height: "100%",
      borderRadius: "10px",
      transition: "width 0.5s ease"
    },
    
    footer: {
      textAlign: "center",
      color: "#64748b",
      fontSize: "13px",
      paddingTop: "24px",
      borderTop: "2px dashed #e2e8f0",
      fontWeight: "500"
    },
    
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px"
    },
    
    loadingSpinner: {
      width: "50px",
      height: "50px",
      border: "4px solid #e2e8f0",
      borderTopColor: "#3b82f6",
      borderRightColor: "#3b82f6",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>📊 Fee Analytics Dashboard</h1>
          <p style={styles.subtitle}>Comprehensive fee reports and student financial analytics</p>
        </div>
        <div style={styles.actionButtons}>
          <button 
            onClick={exportToCSV}
            style={{
              ...styles.button,
              ...styles.exportButton,
              transform: hoveredCard === 'export' ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: hoveredCard === 'export' ? '0 8px 25px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={() => setHoveredCard('export')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <Download size={18} />
            Export Detailed CSV
          </button>
          <button 
            onClick={exportSummaryReport}
            style={{
              ...styles.button,
              ...styles.summaryButton,
              transform: hoveredCard === 'summary' ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: hoveredCard === 'summary' ? '0 8px 25px rgba(139, 92, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={() => setHoveredCard('summary')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <FileText size={18} />
            Export Summary
          </button>
          <button 
            onClick={printDetailedReport}
            style={{
              ...styles.button,
              ...styles.printButton,
              transform: hoveredCard === 'print' ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: hoveredCard === 'print' ? '0 8px 25px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={() => setHoveredCard('print')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <Printer size={18} />
            Print Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {/* Total Fee Amount Card */}
        <div 
          style={{
            ...styles.statCard,
            ...(hoveredCard === 'totalFee' && styles.statCardHover)
          }}
          onMouseEnter={() => setHoveredCard('totalFee')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'}}>
            <DollarSign size={24} color="#3730a3" />
          </div>
          <div style={styles.statLabel}>Total Fee Amount</div>
          <div style={styles.statValue}>₹{summaryStats.totalFeeAmount.toLocaleString()}</div>
          <div style={{...styles.statTrend, color: '#4f46e5'}}>
            <Activity size={16} />
            From {summaryStats.totalStudents} Students
          </div>
        </div>

        {/* Total Collected Card */}
        <div 
          style={{
            ...styles.statCard,
            ...(hoveredCard === 'collected' && styles.statCardHover)
          }}
          onMouseEnter={() => setHoveredCard('collected')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'}}>
            <CheckCircle size={24} color="#065f46" />
          </div>
          <div style={styles.statLabel}>Total Collected</div>
          <div style={styles.statValue}>₹{summaryStats.totalPaid.toLocaleString()}</div>
          <div style={{...styles.statTrend, color: '#10b981'}}>
            {summaryStats.totalFeeAmount > 0 ? (
              <>
                <ArrowUpRight size={16} />
                {summaryStats.collectionRate}% Collection Rate
              </>
            ) : 'No fees'}
          </div>
        </div>

        {/* Total Due Card */}
        <div 
          style={{
            ...styles.statCard,
            ...(hoveredCard === 'due' && styles.statCardHover)
          }}
          onMouseEnter={() => setHoveredCard('due')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'}}>
            <Clock size={24} color="#92400e" />
          </div>
          <div style={styles.statLabel}>Pending Due</div>
          <div style={styles.statValue}>₹{summaryStats.totalDue.toLocaleString()}</div>
          <div style={{...styles.statTrend, color: '#f59e0b'}}>
            <AlertCircle size={16} />
            {summaryStats.partiallyPaidStudents + summaryStats.unpaidStudents} Students
          </div>
        </div>

        {/* Overdue Card */}
        <div 
          style={{
            ...styles.statCard,
            ...(hoveredCard === 'overdue' && styles.statCardHover)
          }}
          onMouseEnter={() => setHoveredCard('overdue')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'}}>
            <XCircle size={24} color="#991b1b" />
          </div>
          <div style={styles.statLabel}>Overdue Amount</div>
          <div style={styles.statValue}>₹{summaryStats.totalOverdue.toLocaleString()}</div>
          <div style={{...styles.statTrend, color: '#ef4444'}}>
            <AlertCircle size={16} />
            Immediate Attention Required
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div style={styles.filterSection}>
        <div style={styles.filterHeader}>
          <Filter size={20} color="#3b82f6" />
          <div style={styles.filterTitle}>Report Filters</div>
        </div>
        <div style={styles.filterGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <Calendar size={16} /> Time Period
            </label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                ...styles.select,
                ...(hoveredSelect && styles.selectHover),
                borderColor: hoveredSelect ? "#3b82f6" : "#e2e8f0"
              }}
              onMouseEnter={() => setHoveredSelect(true)}
              onMouseLeave={() => setHoveredSelect(false)}
            >
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <Book size={16} /> Course
            </label>
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{
                ...styles.select,
                borderColor: selectedCourse !== "all" ? "#10b981" : "#e2e8f0"
              }}
            >
              {uniqueCourses.map(course => (
                <option key={course} value={course}>
                  {course === "all" ? "All Courses" : course}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <Users size={16} /> Status
            </label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                ...styles.select,
                borderColor: selectedStatus !== "all" ? "#3b82f6" : "#e2e8f0"
              }}
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div style={styles.dateInfo}>
          <Calendar size={16} />
          <span>Report Generated: {new Date().toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
          <span style={{ marginLeft: 'auto', fontWeight: '600', color: '#3b82f6' }}>
            Showing {filteredData.length} of {students.length} students
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartContainer}>
          <div style={styles.chartsHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.chartsTitle}>Fee Distribution Analysis</div>
              <button 
                onClick={() => setActiveChart(activeChart === 'bar' ? 'pie' : 'bar')}
                style={{
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {activeChart === 'bar' ? <PieChartIcon size={14} /> : <BarChart2 size={14} />}
                Switch to {activeChart === 'bar' ? 'Pie Chart' : 'Bar Chart'}
              </button>
            </div>
          </div>
          
          <div style={styles.chartWrapper}>
            {activeChart === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={filteredData.slice(0, 10)} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                    labelFormatter={(label) => {
                      const student = filteredData.find(s => s.name === label);
                      return student ? `Student: ${label}\nCourse: ${student.course}` : label;
                    }}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Paid" 
                    fill="#10b981" 
                    name="Paid" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="Due" 
                    fill="#f59e0b" 
                    name="Due" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="Overdue" 
                    fill="#ef4444" 
                    name="Overdue" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div style={styles.chartSummary}>
            Total Amount: ₹{pieData.reduce((acc, item) => acc + item.value, 0).toLocaleString()} • 
            Paid: ₹{summaryStats.totalPaid.toLocaleString()} • 
            Due: ₹{summaryStats.totalDue.toLocaleString()} • 
            Overdue: ₹{summaryStats.totalOverdue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <div style={styles.tableTitle}>📋 Detailed Fee Report</div>
          <div style={styles.tableSubtitle}>
            Showing {filteredData.length} students • 
            Total Amount: ₹{summaryStats.totalFeeAmount.toLocaleString()} • 
            Collection Rate: {summaryStats.collectionRate}%
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead style={styles.tableHead}>
              <tr>
                <th style={styles.tableHeaderCell}>#</th>
                <th style={styles.tableHeaderCell}>Student ID</th>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>Course</th>
                <th style={styles.tableHeaderCell}>Month</th>
                <th style={styles.tableHeaderCell}>Total Fee</th>
                <th style={styles.tableHeaderCell}>Paid</th>
                <th style={styles.tableHeaderCell}>Due</th>
                <th style={styles.tableHeaderCell}>Overdue</th>
                <th style={styles.tableHeaderCell}>Payment %</th>
                <th style={styles.tableHeaderCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((student, index) => {
                const isHovered = hoveredRow === index;
                
                return (
                  <tr 
                    key={student.studentId}
                    style={{
                      ...styles.tableRow,
                      ...(isHovered && styles.tableRowHover),
                      background: isHovered ? '#f8fafc' : (index % 2 === 0 ? '#fafafa' : 'white')
                    }}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{...styles.tableCell, fontWeight: '600'}}>
                      {index + 1}
                    </td>
                    <td style={{...styles.tableCell, color: '#3b82f6', fontWeight: '600'}}>
                      {student.studentId}
                    </td>
                    <td style={{...styles.tableCell, fontWeight: '600'}}>
                      {student.name}
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        📞 {student.phone}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        background: '#f0f9ff',
                        color: '#0369a1',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {student.course}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      {student.admissionMonth}
                    </td>
                    <td style={{...styles.tableCell, fontWeight: '700'}}>
                      ₹{student.totalFee.toLocaleString()}
                    </td>
                    <td style={{...styles.tableCell, color: '#10b981', fontWeight: '600'}}>
                      ₹{student.feePaid.toLocaleString()}
                    </td>
                    <td style={{...styles.tableCell, color: '#f59e0b', fontWeight: '600'}}>
                      ₹{student.dueAmount.toLocaleString()}
                    </td>
                    <td style={{...styles.tableCell, color: '#ef4444', fontWeight: '600'}}>
                      {student.overdueAmount > 0 ? `₹${student.overdueAmount.toLocaleString()}` : '-'}
                    </td>
                    <td style={styles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{student.paymentProgress}%</span>
                        <div style={styles.progressBar}>
                          <div style={{
                            ...styles.progressFill,
                            width: `${student.paymentProgress}%`,
                            background: student.paymentProgress >= 80 ? '#10b981' : 
                                       student.paymentProgress >= 50 ? '#f59e0b' : '#ef4444'
                          }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.statusBadge,
                        background: student.statusColor + '20',
                        color: student.statusColor
                      }}>
                        {student.feeStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
            <h3 style={{ color: '#475569', marginBottom: '10px' }}>No Data Available</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto' }}>
              No fee data available for the selected filters. Try adjusting your filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>© {new Date().getFullYear()} CodeHub Tech Academy • Fee Management System</p>
        <p style={{ marginTop: '8px' }}>Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • 
           Total Students: {students.length} • 
           Total Fee Amount: ₹{students.reduce((acc, s) => acc + Number(s.totalFee || 0), 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Reports;