import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FaWhatsapp, 
  FaPrint, 
  FaFilePdf, 
  FaUser, 
  FaRupeeSign, 
  FaDownload, 
  FaCalendarAlt,
  FaCheck,  
  FaExclamationTriangle,
  FaClock,
  FaCopy,
  FaMoneyBillAlt,
  FaCalendarDay
} from 'react-icons/fa';

// Import academy config
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

// Helper function to calculate overdue months
const calculateOverdueMonths = (admissionDate, installmentMonth) => {
  if (!admissionDate) return { overdue: false, overdueMonths: 0 };
  
  const today = new Date();
  const admission = new Date(admissionDate);
  
  const expectedDueDate = new Date(admission);
  expectedDueDate.setMonth(admission.getMonth() + installmentMonth);
  expectedDueDate.setDate(10);
  
  const monthsOverdue = (today.getFullYear() - expectedDueDate.getFullYear()) * 12 + 
                       (today.getMonth() - expectedDueDate.getMonth());
  
  const overdue = monthsOverdue > 0;
  
  return {
    overdue: overdue,
    overdueMonths: Math.max(0, monthsOverdue),
    expectedDueDate: expectedDueDate
  };
};

// Function to generate installments
const generateInstallments = (student, allFees = []) => {
  if (!student) return [];
  
  const months = Number(student.installmentMonths) || 1;
  const tuitionFee = Number(student.courseFee) || Number(student.tuitionFee) || 0;
  const monthly = Math.ceil(tuitionFee / months);
  
  const today = new Date();
  const admissionDate = student.admissionDate ? new Date(student.admissionDate) : 
                       student.admission_date ? new Date(student.admission_date) : today;
  
  const installments = [];
  
  const studentTuitionPayments = allFees.filter(fee => 
    fee.studentId === student.studentId && fee.type === 'tuition'
  );
  
  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(admissionDate);
    dueDate.setMonth(admissionDate.getMonth() + i);
    
    let installmentAmount = monthly;
    if (i === months) {
      installmentAmount = tuitionFee - (monthly * (months - 1));
    }
    
    const monthPayments = studentTuitionPayments.filter(p => p.month === i);
    const paidAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const dueAmount = Math.max(0, installmentAmount - paidAmount);
    
    const overdueInfo = calculateOverdueMonths(admissionDate, i);
    
    let status = 'pending';
    if (dueAmount === 0) {
      status = 'paid';
    } else if (paidAmount > 0 && dueAmount > 0) {
      status = 'partial';
    } else if (overdueInfo.overdue) {
      status = 'overdue';
    }
    
    const monthName = dueDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = dueDate.getFullYear();
    
    installments.push({
      month: i,
      monthName: monthName,
      year: year,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: installmentAmount,
      paid: paidAmount,
      due: dueAmount,
      status: status,
      overdue: overdueInfo.overdue,
      overdueMonths: overdueInfo.overdueMonths,
      expectedDueDate: overdueInfo.expectedDueDate,
      originalDue: installmentAmount,
      displayName: `${monthName} ${year}`
    });
  }
  
  installments.sort((a, b) => a.month - b.month);
  
  return installments;
};

// Helper function to format slip date
const formatSlipDate = (dateString) => {
  if (!dateString) return "__/__/____";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return "__/__/____";
  }
};

const Slip = ({ students = [] }) => {
  const activeStudents = React.useMemo(() => {
    if (!Array.isArray(students)) return [];
    
    return students.filter(student => {
      if (!student) return false;
      
      const isActive = 
        student.active === true ||
        student.active === 'true' ||
        student.status === 'active' ||
        student.status === 'Active' ||
        student.isActive === true ||
        (student.status && student.status.toLowerCase().includes('active')) ||
        !student.status ||
        (!student.active && !student.status && !student.isActive);
      
      return isActive;
    });
  }, [students]);
  
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [whatsAppImage, setWhatsAppImage] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [payments, setPayments] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [copiedStudentId, setCopiedStudentId] = useState(null);
  
  const [academyConfig, setAcademyConfig] = useState(getAcademyConfig());

  const formatCurrency = (value) => {
    const numValue = Number(value || 0);
    return `${numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };
  
  // Format admission date for display
  const formatAdmissionDate = (dateString) => {
    if (!dateString) return "Not Available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return "Invalid Date";
    }
  };
  
  useEffect(() => {
    const config = getAcademyConfig();
    setAcademyConfig(config);
  }, []);

  useEffect(() => {
    if (currentStudent) {
      const allFees = JSON.parse(localStorage.getItem('studentFees') || '[]');
      const studentPayments = allFees
        .filter(fee => fee.studentId === currentStudent.studentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setPayments(studentPayments);
      
      const generatedInstallments = generateInstallments(currentStudent, allFees);
      setInstallments(generatedInstallments);
    }
  }, [currentStudent]);

  const copyStudentId = (studentId) => {
    navigator.clipboard.writeText(studentId);
    setCopiedStudentId(studentId);
    setTimeout(() => setCopiedStudentId(null), 2000);
  };

  const generateSlipData = (student) => {
    if (!student) return {};
    
    const allFees = JSON.parse(localStorage.getItem('studentFees') || '[]');
    const installments = generateInstallments(student, allFees);
    
    const now = new Date();
    const issueDate = formatSlipDate(now);
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const tuitionFee = Number(student.courseFee) || Number(student.tuitionFee) || 0;
    const tuitionPaid = installments.reduce((sum, inst) => sum + inst.paid, 0);
    const tuitionDue = Math.max(0, tuitionFee - tuitionPaid);
    
    const extraFees = normalizeExtraFees(student.selectedExtraFees || []);
    const extraFeesTotal = extraFees.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
    const extraFeesPaid = extraFees.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0);
    const extraFeesDue = extraFees.reduce((sum, fee) => sum + (Number(fee.due) || 0), 0);
    
    const totalFee = Number(student.totalFee) || (tuitionFee + extraFeesTotal);
    const totalPaid = Number(student.feePaid) || (tuitionPaid + extraFeesPaid);
    const totalDue = Math.max(0, totalFee - totalPaid);
    
    const paidInstallments = installments.filter(inst => inst.status === 'paid');
    const overdueInstallments = installments.filter(inst => inst.status === 'overdue');
    const partialInstallments = installments.filter(inst => inst.status === 'partial');
    const pendingInstallments = installments.filter(inst => inst.status === 'pending');
    
    // Calculate extra fee stats
    const paidExtraFees = extraFees.filter(fee => fee.due === 0);
    const dueExtraFees = extraFees.filter(fee => fee.due > 0);
    
    const latestPayment = payments.length > 0 ? payments[0] : null;
    
    // Get admission date from student data
    const admissionDate = student.admissionDate || student.admission_date || student.admission;
    
    return {
      studentName: student.name || 'Student',
      fatherName: student.fatherName || student.father_name || student.parent_name || 'N/A',
      studentId: student.studentId || student.student_id || student.id || '000',
      course: student.course || student.course_name || 'General',
      admissionDate: admissionDate,
      admissionDateFormatted: admissionDate ? formatAdmissionDate(admissionDate) : 'Not Available',
      tuitionFee: tuitionFee,
      tuitionPaid: tuitionPaid,
      tuitionDue: tuitionDue,
      extraFees: extraFees,
      extraFeesTotal: extraFeesTotal,
      extraFeesPaid: extraFeesPaid,
      extraFeesDue: extraFeesDue,
      paidExtraFees: paidExtraFees,
      dueExtraFees: dueExtraFees,
      installments: installments,
      paidInstallments: paidInstallments,
      overdueInstallments: overdueInstallments,
      partialInstallments: partialInstallments,
      pendingInstallments: pendingInstallments,
      totalFee: totalFee,
      totalPaid: totalPaid,
      totalDue: totalDue,
      issueDate: issueDate,
      time: time,
      academyName: academyConfig.name || "ACADEMY",
      academyAddress: academyConfig.contact?.address || "Address",
      academyPhone: academyConfig.contact?.phone || "Phone",
      academyLogo: academyConfig.logo || "💻",
      logoType: academyConfig.logoType || "emoji",
      showLogo: academyConfig.showLogo !== false,
      currency: academyConfig.fees?.currencySymbol || "RS",
      latestPayment: latestPayment,
      paymentMethod: latestPayment?.method || 'cash',
      transactionId: latestPayment?.transactionId || 'TXN' + new Date().getTime().toString().slice(-8)
    };
  };

  // Generate COMPACT slip HTML optimized for A4 landscape
  const generateSlipHTML = (slipData) => {
    return `
      <div style="
        width: 95mm;
        height: 185mm; /* Reduced height */
        background: white;
        padding: 0;
        position: relative;
        font-family: 'Arial', sans-serif;
        box-sizing: border-box;
        margin: 0;
        border: 0.5mm solid #000;
        display: flex;
        flex-direction: column;
        page-break-inside: avoid;
        overflow: hidden;
      ">
        <!-- STUDENT COPY (TOP) -->
        <div style="
          width: 100%;
          height: 50%;
          background: #fffde7;
          padding: 2mm; /* Reduced padding */
          display: flex;
          flex-direction: column;
          gap: 1.2mm; /* Reduced gap */
          border-bottom: 0.5mm dashed #000;
          position: relative;
          overflow: hidden;
        ">
          <!-- Copy Label -->
          <div style="
            position: absolute;
            top: 1.2mm;
            right: 1.2mm;
            background: #ff9800;
            color: white;
            padding: 0.4mm 2mm;
            border-radius: 0.8mm;
            font-size: 6px;
            font-weight: bold;
            z-index: 10;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          ">
            STUDENT COPY
          </div>

          <!-- Academy Header -->
          <div style="
            background: #09c288;
            color: white;
            padding: 1.2mm;
            text-align: center;
            border-radius: 1mm;
            margin-bottom: 1.2mm;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.2mm;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            ${slipData.logoType === 'emoji' ? `
              <div style="font-size: 10px; background: white; border-radius: 50%; width: 6mm; height: 6mm; display: flex; align-items: center; justify-content: center; color: #09c288; border: 0.5px solid #ddd;">${slipData.academyLogo}</div>
            ` : slipData.logoType === 'image' ? `
              <img src="${slipData.academyLogo}" style="height: 5mm; width: auto; border-radius: 2px; border: 0.5px solid rgba(255,255,255,0.5);" alt="Logo" />
            ` : `
              <div style="font-size: 10px; background: white; border-radius: 50%; width: 6mm; height: 6mm; display: flex; align-items: center; justify-content: center; color: #09c288; border: 0.5px solid #ddd;">🏫</div>
            `}
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 8.5px; font-weight: bold; letter-spacing: 0.2px;">${slipData.academyName}</div>
              <div style="font-size: 5px; opacity: 0.9;">${slipData.academyAddress}</div>
            </div>
          </div>

          <!-- Student Details - Compact with Admission Date -->
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.6mm;
            padding: 1mm;
            background: #f8f9fa;
            border-radius: 0.8mm;
            border: 0.5px solid #ddd;
            font-size: 6.5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-bottom: 0.4mm;
          ">
            <div><strong>ID:</strong> ${slipData.studentId}</div>
            <div><strong>Name:</strong> ${slipData.studentName}</div>
            <div><strong>Father:</strong> ${slipData.fatherName}</div>
            <div><strong>Course:</strong> ${slipData.course}</div>
            <div colspan="2" style="grid-column: span 2; text-align: center; margin-top: 0.5mm; padding-top: 0.5mm; border-top: 0.5px dashed #ddd;">
              <strong>📅 Admission:</strong> ${slipData.admissionDateFormatted}
            </div>
          </div>

          <!-- Fee Summary - UPDATED ORDER -->
          <div style="
            padding: 1mm;
            background: #f8f9fa;
            border-radius: 0.8mm;
            border: 0.5px solid #ddd;
            font-size: 6.5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-bottom: 0.8mm;
          ">
            <div style="font-size: 7px; font-weight: bold; text-align: center; margin-bottom: 0.8mm; border-bottom: 0.5px solid #ccc; padding-bottom: 0.6mm; color: #09c288;">
              FEE SUMMARY
            </div>
            
            <!-- First: Show installments months with fees -->
            ${slipData.installments.slice(0, 3).map(inst => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.4mm; padding: 0.2mm 0;">
                <div>${inst.monthName} ${inst.year}:</div>
                <div style="font-weight: bold; color: ${inst.due === 0 ? '#1b5e20' : '#333'};">${slipData.currency} ${formatCurrency(inst.amount)}</div>
              </div>
            `).join('')}
            
            ${slipData.installments.length > 3 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.4mm; padding: 0.2mm 0; color: #666; font-size: 6px;">
                <div>+ ${slipData.installments.length - 3} more months:</div>
                <div style="font-weight: bold;">${slipData.currency} ${formatCurrency(slipData.tuitionFee - slipData.installments.slice(0, 3).reduce((sum, inst) => sum + inst.amount, 0))}</div>
              </div>
            ` : ''}
            
            <!-- Second: Show Extra Fees -->
            ${slipData.extraFeesTotal > 0 ? `
              <div style="border-top: 0.5px dashed #ccc; margin: 0.5mm 0; padding-top: 0.5mm;">
                ${slipData.extraFees.slice(0, 2).map(fee => `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.3mm; padding: 0.1mm 0; font-size: 6.2px;">
                    <div>${fee.name}:</div>
                    <div style="font-weight: bold; color: #7b1fa2;">${slipData.currency} ${formatCurrency(fee.amount)}</div>
                  </div>
                `).join('')}
                
                ${slipData.extraFees.length > 2 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.3mm; padding: 0.1mm 0; color: #666; font-size: 5.8px;">
                    <div>+ ${slipData.extraFees.length - 2} more fees:</div>
                    <div style="font-weight: bold;">${slipData.currency} ${formatCurrency(slipData.extraFeesTotal - slipData.extraFees.slice(0, 2).reduce((sum, fee) => sum + fee.amount, 0))}</div>
                  </div>
                ` : ''}
                
                <div style="display: flex; justify-content: space-between; margin-top: 0.3mm; padding-top: 0.3mm; border-top: 0.5px dotted #ccc; font-weight: bold;">
                  <div>Total Extra Fees:</div>
                  <div style="color: #7b1fa2;">${slipData.currency} ${formatCurrency(slipData.extraFeesTotal)}</div>
                </div>
              </div>
            ` : ''}
            
            <!-- Third: Show Total Amount -->
            <div style="
              display: flex; 
              justify-content: space-between; 
              font-weight: bold; 
              padding: 0.6mm 0; 
              border-top: 0.5px solid #ccc; 
              background: #e8f5e8; 
              margin: 0 -1mm; 
              padding-left: 1mm; 
              padding-right: 1mm; 
              margin-top: 0.6mm;
              font-size: 7px;
            ">
              <div>TOTAL AMOUNT:</div>
              <div style="color: #1b5e20;">
                ${slipData.currency} ${formatCurrency(slipData.totalFee)}
              </div>
            </div>
            
            <!-- Fourth: Show Total Paid -->
            <div style="
              display: flex; 
              justify-content: space-between; 
              font-weight: bold; 
              padding: 0.6mm 0; 
              border-top: 0.5px solid #ccc; 
              background: #fff3cd; 
              margin: 0 -1mm; 
              padding-left: 1mm; 
              padding-right: 1mm; 
              margin-top: 0.2mm;
              font-size: 6.8px;
            ">
              <div>TOTAL PAID:</div>
              <div style="color: #1b5e20;">
                ${slipData.currency} ${formatCurrency(slipData.totalPaid)}
              </div>
            </div>
          </div>

          <!-- Installment Status - Compact -->
          <div style="
            padding: 1mm;
            background: #f8f9fa;
            border-radius: 0.8mm;
            border: 0.5px solid #ddd;
            flex-grow: 1;
            font-size: 6.5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-bottom: 0.8mm;
            max-height: 28mm;
            overflow: hidden;
          ">
            <div style="font-size: 7px; font-weight: bold; text-align: center; margin-bottom: 0.6mm; border-bottom: 0.5px solid #ccc; padding-bottom: 0.5mm; color: #09c288;">
              INSTALLMENT STATUS (${slipData.installments.length})
            </div>
            
            <!-- Installment Stats - Compact -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.8mm; padding: 0.5mm 0; border-bottom: 0.5px dashed #ccc; background: linear-gradient(to right, #e8f5e8, #fff3cd, #ffebee); border-radius: 0.5mm; padding-left: 0.8mm; padding-right: 0.8mm;">
              <div style="text-align: center; flex: 1;">
                <div style="color: #1b5e20; font-weight: bold; font-size: 8px;">${slipData.paidInstallments.length}</div>
                <div style="font-size: 4.5px; color: #666;">PAID</div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="color: #c62828; font-weight: bold; font-size: 8px;">${slipData.overdueInstallments.length}</div>
                <div style="font-size: 4.5px; color: #666;">OVERDUE</div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="color: #f57c00; font-weight: bold; font-size: 8px;">${slipData.pendingInstallments.length}</div>
                <div style="font-size: 4.5px; color: #666;">PENDING</div>
              </div>
            </div>
            
            <!-- Installment List - Compact -->
            <div style="max-height: 14mm; overflow-y: auto; padding-right: 0.6mm; font-size: 6px;">
              ${slipData.installments.slice(0, 2).map(inst => {
                let statusColor, statusIcon, bgColor;
                if (inst.status === 'paid') {
                  statusColor = '#1b5e20';
                  statusIcon = '✓';
                  bgColor = '#e8f5e8';
                } else if (inst.status === 'overdue') {
                  statusColor = '#c62828';
                  statusIcon = '⚠';
                  bgColor = '#ffebee';
                } else if (inst.status === 'partial') {
                  statusColor = '#f57c00';
                  statusIcon = '⏳';
                  bgColor = '#fff3cd';
                } else {
                  statusColor = '#666';
                  statusIcon = '•';
                  bgColor = '#f5f5f5';
                }
                
                return `
                <div style="
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 0.4mm; 
                  font-size: 6px; 
                  align-items: center;
                  padding: 0.5mm;
                  background: ${bgColor};
                  border-radius: 0.5mm;
                  border-left: 1.2px solid ${statusColor};
                ">
                  <div style="display: flex; align-items: center; gap: 0.5mm;">
                    <span style="color: ${statusColor}; font-weight: bold; font-size: 6px;">${statusIcon}</span>
                    <span style="font-weight: 500;">${inst.monthName} ${inst.year}</span>
                  </div>
                  <div style="text-align: right; min-width: 20mm;">
                    <div style="font-size: 5.5px; color: ${inst.due === 0 ? '#1b5e20' : '#c62828'}; font-weight: ${inst.due === 0 ? 'normal' : 'bold'}">
                      ${inst.due === 0 ? 'Paid' : `Due: ${slipData.currency} ${formatCurrency(inst.due)}`}
                    </div>
                  </div>
                </div>
                `;
              }).join('')}
              ${slipData.installments.length > 2 ? `
                <div style="
                  text-align: center; 
                  font-size: 5px; 
                  color: #666; 
                  padding: 0.3mm; 
                  background: #e3f2fd; 
                  border-radius: 0.3mm;
                  margin-top: 0.3mm;
                ">
                  +${slipData.installments.length - 2} more installments
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Note for Student Copy - Compact -->
          <div style="
            padding: 0.8mm;
            background: #fff9c4;
            border-radius: 0.6mm;
            border: 0.5px solid #ffd600;
            font-size: 4.5px;
            text-align: center;
            color: #5d4037;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-top: 0.4mm;
          ">
            <div style="direction: rtl; margin-bottom: 0.2mm; font-weight: bold; line-height: 1.3; font-size: 4.5px;">
              نوٹ: ماہانہ فیس 10 تاریخ تک جمع کروانا لازم ہے - 10 تا 15 تاریخ 200 روپے لیٹ فیس- 15 کے بعد ڈبل لیٹ فیس۔
            </div>
            <div style="font-size: 4px; line-height: 1.3; color: #795548;">
              Note: Monthly fee must be paid by 10th - Late fee Rs.200 from 10-15 - Double late fee after 15th.
            </div>
          </div>
          
          <!-- Footer - Compact -->
          <div style="
            text-align: center;
            font-size: 4.5px;
            color: #666;
            padding-top: 0.8mm;
            border-top: 0.5px dashed #ccc;
            margin-top: 0.4mm;
          ">
            Date: ${slipData.issueDate} | Time: ${slipData.time} | Ph: ${slipData.academyPhone}
          </div>
        </div>

        <!-- OFFICE COPY (BOTTOM) -->
        <div style="
          width: 100%;
          height: 50%;
          background: #ffffff;
          padding: 2mm;
          display: flex;
          flex-direction: column;
          gap: 1.2mm;
          position: relative;
          overflow: hidden;
        ">
          <!-- Copy Label -->
          <div style="
            position: absolute;
            top: 1.2mm;
            right: 1.2mm;
            background: #4CAF50;
            color: white;
            padding: 0.4mm 2mm;
            border-radius: 0.8mm;
            font-size: 6px;
            font-weight: bold;
            z-index: 10;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          ">
            OFFICE COPY
          </div>

          <!-- Academy Header -->
          <div style="
            background: #2196F3;
            color: white;
            padding: 1.2mm;
            text-align: center;
            border-radius: 1mm;
            margin-bottom: 1.2mm;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.2mm;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            ${slipData.logoType === 'emoji' ? `
              <div style="font-size: 10px; background: white; border-radius: 50%; width: 6mm; height: 6mm; display: flex; align-items: center; justify-content: center; color: #2196F3; border: 0.5px solid #ddd;">${slipData.academyLogo}</div>
            ` : slipData.logoType === 'image' ? `
              <img src="${slipData.academyLogo}" style="height: 5mm; width: auto; border-radius: 2px; border: 0.5px solid rgba(255,255,255,0.5);" alt="Logo" />
            ` : `
              <div style="font-size: 10px; background: white; border-radius: 50%; width: 6mm; height: 6mm; display: flex; align-items: center; justify-content: center; color: #2196F3; border: 0.5px solid #ddd;">🏫</div>
            `}
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 8.5px; font-weight: bold; letter-spacing: 0.2px;">${slipData.academyName}</div>
              <div style="font-size: 5px; opacity: 0.9;">${slipData.academyAddress}</div>
            </div>
          </div>

          <!-- Student Details with Admission Date -->
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.6mm;
            padding: 1mm;
            background: #f8f9fa;
            border-radius: 0.8mm;
            border: 0.5px solid #ddd;
            font-size: 6.5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-bottom: 0.4mm;
          ">
            <div><strong>ID:</strong> ${slipData.studentId}</div>
            <div><strong>Name:</strong> ${slipData.studentName}</div>
            <div><strong>Father:</strong> ${slipData.fatherName}</div>
            <div><strong>Course:</strong> ${slipData.course}</div>
            <div colspan="2" style="grid-column: span 2; text-align: center; margin-top: 0.5mm; padding-top: 0.5mm; border-top: 0.5px dashed #ddd;">
              <strong>📅 Admission:</strong> ${slipData.admissionDateFormatted}
            </div>
          </div>

          <!-- Fee Summary - UPDATED ORDER -->
          <div style="
            padding: 1mm;
            background: #f8f9fa;
            border-radius: 0.8mm;
            border: 0.5px solid #ddd;
            font-size: 6.5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-bottom: 0.8mm;
          ">
            <div style="font-size: 7px; font-weight: bold; text-align: center; margin-bottom: 0.8mm; border-bottom: 0.5px solid #ccc; padding-bottom: 0.6mm; color: #2196F3;">
              FEE SUMMARY
            </div>
            
            <!-- First: Show installments months with fees -->
            ${slipData.installments.slice(0, 3).map(inst => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.4mm; padding: 0.2mm 0;">
                <div>${inst.monthName} ${inst.year}:</div>
                <div style="font-weight: bold; color: ${inst.due === 0 ? '#1b5e20' : '#333'};">${slipData.currency} ${formatCurrency(inst.amount)}</div>
              </div>
            `).join('')}
            
            ${slipData.installments.length > 3 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.4mm; padding: 0.2mm 0; color: #666; font-size: 6px;">
                <div>+ ${slipData.installments.length - 3} more months:</div>
                <div style="font-weight: bold;">${slipData.currency} ${formatCurrency(slipData.tuitionFee - slipData.installments.slice(0, 3).reduce((sum, inst) => sum + inst.amount, 0))}</div>
              </div>
            ` : ''}
            
            <!-- Second: Show Extra Fees -->
            ${slipData.extraFeesTotal > 0 ? `
              <div style="border-top: 0.5px dashed #ccc; margin: 0.5mm 0; padding-top: 0.5mm;">
                ${slipData.extraFees.slice(0, 2).map(fee => `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.3mm; padding: 0.1mm 0; font-size: 6.2px;">
                    <div>${fee.name}:</div>
                    <div style="font-weight: bold; color: #7b1fa2;">${slipData.currency} ${formatCurrency(fee.amount)}</div>
                  </div>
                `).join('')}
                
                ${slipData.extraFees.length > 2 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.3mm; padding: 0.1mm 0; color: #666; font-size: 5.8px;">
                    <div>+ ${slipData.extraFees.length - 2} more fees:</div>
                    <div style="font-weight: bold;">${slipData.currency} ${formatCurrency(slipData.extraFeesTotal - slipData.extraFees.slice(0, 2).reduce((sum, fee) => sum + fee.amount, 0))}</div>
                  </div>
                ` : ''}
                
                <div style="display: flex; justify-content: space-between; margin-top: 0.3mm; padding-top: 0.3mm; border-top: 0.5px dotted #ccc; font-weight: bold;">
                  <div>Total Extra Fees:</div>
                  <div style="color: #7b1fa2;">${slipData.currency} ${formatCurrency(slipData.extraFeesTotal)}</div>
                </div>
              </div>
            ` : ''}
            
            <!-- Third: Show Total Amount -->
            <div style="
              display: flex; 
              justify-content: space-between; 
              font-weight: bold; 
              padding: 0.6mm 0; 
              border-top: 0.5px solid #ccc; 
              background: #e8f5e8; 
              margin: 0 -1mm; 
              padding-left: 1mm; 
              padding-right: 1mm; 
              margin-top: 0.6mm;
              font-size: 7px;
            ">
              <div>TOTAL AMOUNT:</div>
              <div style="color: #1b5e20;">
                ${slipData.currency} ${formatCurrency(slipData.totalFee)}
              </div>
            </div>
            
            <!-- Fourth: Show Total Paid -->
            <div style="
              display: flex; 
              justify-content: space-between; 
              font-weight: bold; 
              padding: 0.6mm 0; 
              border-top: 0.5px solid #ccc; 
              background: #fff3cd; 
              margin: 0 -1mm; 
              padding-left: 1mm; 
              padding-right: 1mm; 
              margin-top: 0.2mm;
              font-size: 6.8px;
            ">
              <div>TOTAL PAID:</div>
              <div style="color: #1b5e20;">
                ${slipData.currency} ${formatCurrency(slipData.totalPaid)}
              </div>
            </div>
          </div>

          <!-- Installment Status -->
          <div style="
            padding: 1mm;
            background: #f8f9fa;
            border-radius: 0.8mm;
            border: 0.5px solid #ddd;
            flex-grow: 1;
            font-size: 6.5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-bottom: 0.8mm;
            max-height: 28mm;
            overflow: hidden;
          ">
            <div style="font-size: 7px; font-weight: bold; text-align: center; margin-bottom: 0.6mm; border-bottom: 0.5px solid #ccc; padding-bottom: 0.5mm; color: #2196F3;">
              INSTALLMENT STATUS (${slipData.installments.length})
            </div>
            
            <!-- Installment Stats -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.8mm; padding: 0.5mm 0; border-bottom: 0.5px dashed #ccc; background: linear-gradient(to right, #e8f5e8, #fff3cd, #ffebee); border-radius: 0.5mm; padding-left: 0.8mm; padding-right: 0.8mm;">
              <div style="text-align: center; flex: 1;">
                <div style="color: #1b5e20; font-weight: bold; font-size: 8px;">${slipData.paidInstallments.length}</div>
                <div style="font-size: 4.5px; color: #666;">PAID</div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="color: #c62828; font-weight: bold; font-size: 8px;">${slipData.overdueInstallments.length}</div>
                <div style="font-size: 4.5px; color: #666;">OVERDUE</div>
              </div>
              <div style="text-align: center; flex: 1;">
                <div style="color: #f57c00; font-weight: bold; font-size: 8px;">${slipData.pendingInstallments.length}</div>
                <div style="font-size: 4.5px; color: #666;">PENDING</div>
              </div>
            </div>
            
            <!-- Installment List -->
            <div style="max-height: 14mm; overflow-y: auto; padding-right: 0.6mm; font-size: 6px;">
              ${slipData.installments.slice(0, 2).map(inst => {
                let statusColor, statusIcon, bgColor;
                if (inst.status === 'paid') {
                  statusColor = '#1b5e20';
                  statusIcon = '✓';
                  bgColor = '#e8f5e8';
                } else if (inst.status === 'overdue') {
                  statusColor = '#c62828';
                  statusIcon = '⚠';
                  bgColor = '#ffebee';
                } else if (inst.status === 'partial') {
                  statusColor = '#f57c00';
                  statusIcon = '⏳';
                  bgColor = '#fff3cd';
                } else {
                  statusColor = '#666';
                  statusIcon = '•';
                  bgColor = '#f5f5f5';
                }
                
                return `
                <div style="
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 0.4mm; 
                  font-size: 6px; 
                  align-items: center;
                  padding: 0.5mm;
                  background: ${bgColor};
                  border-radius: 0.5mm;
                  border-left: 1.2px solid ${statusColor};
                ">
                  <div style="display: flex; align-items: center; gap: 0.5mm;">
                    <span style="color: ${statusColor}; font-weight: bold; font-size: 6px;">${statusIcon}</span>
                    <span style="font-weight: 500;">${inst.monthName} ${inst.year}</span>
                  </div>
                  <div style="text-align: right; min-width: 20mm;">
                    <div style="font-size: 5.5px;">
                      <span style="color: #333;">${slipData.currency} ${formatCurrency(inst.amount)}</span>
                      <span style="color: ${inst.due === 0 ? '#1b5e20' : '#c62828'}; margin-left: 2mm; font-weight: ${inst.due === 0 ? 'normal' : 'bold'}">
                        ${inst.due === 0 ? '(Paid)' : `(Due: ${slipData.currency} ${formatCurrency(inst.due)})`}
                      </span>
                    </div>
                  </div>
                </div>
                `;
              }).join('')}
              ${slipData.installments.length > 2 ? `
                <div style="
                  text-align: center; 
                  font-size: 5px; 
                  color: #666; 
                  padding: 0.3mm; 
                  background: #e3f2fd; 
                  border-radius: 0.3mm;
                  margin-top: 0.3mm;
                ">
                  +${slipData.installments.length - 2} more installments
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Thanks Message -->
          <div style="
            padding: 0.8mm;
            background: linear-gradient(135deg, #e8f5e8, #e3f2fd);
            border-radius: 0.6mm;
            border: 0.5px solid #4CAF50;
            font-size: 6px;
            text-align: center;
            font-weight: bold;
            color: #1b5e20;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            margin-top: 0.4mm;
          ">
            🏛️ OFFICE COPY - COMPUTER GENERATED
          </div>
          
          <!-- Footer -->
          <div style="
            text-align: center;
            font-size: 4.5px;
            color: #666;
            padding-top: 0.8mm;
            border-top: 0.5px dashed #ccc;
            margin-top: 0.4mm;
          ">
            Phone: ${slipData.academyPhone} | Generated: ${slipData.issueDate} ${slipData.time}
          </div>
        </div>
      </div>
    `;
  };

  // Create slip container for canvas
  const createSlipContainer = (slipData) => {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 95mm;
      height: 185mm;
      background: white;
      padding: 0;
      font-family: 'Arial', sans-serif;
      box-sizing: border-box;
      margin: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    `;
    
    container.innerHTML = generateSlipHTML(slipData);
    document.body.appendChild(container);
    
    return container;
  };

  // Generate slip canvas
  const generateSlipCanvas = async (student) => {
    const slipData = generateSlipData(student);
    const container = createSlipContainer(slipData);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: container.offsetWidth,
        height: container.offsetHeight,
        windowWidth: container.offsetWidth,
        windowHeight: container.offsetHeight
      });
      
      return canvas;
    } finally {
      if (container && container.parentNode) {
        document.body.removeChild(container);
      }
    }
  };

  // Generate PDF for single student
  const generatePDF = async (student) => {
    if (!student) return;
    setLoading(true);
    setCurrentStudent(student);
    
    try {
      const canvas = await generateSlipCanvas(student);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const slipWidth = 95;
      const slipHeight = 185;
      
      const x = (pageWidth - slipWidth) / 2;
      const y = (pageHeight - slipHeight) / 2;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      pdf.addImage(imgData, 'PNG', x, y, slipWidth, slipHeight, '', 'MEDIUM');
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(33, 150, 243);
      pdf.text(`${academyConfig.name || "Academy"} Receipt`, pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Student: ${student.name}`, pageWidth / 2, 25, { align: 'center' });
      pdf.text(`ID: ${student.studentId} | Course: ${student.course} | Admission: ${formatAdmissionDate(student.admissionDate || student.admission_date)}`, pageWidth / 2, 29, { align: 'center' });
      
      pdf.save(`${academyConfig.name || 'Academy'}-Receipt-${student.name}-${student.studentId}.pdf`);
      
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
      setCurrentStudent(null);
    }
  };

  // Generate PDF for ALL students - 3 per row in A4 landscape
  const generatePDFForAll = async () => {
    if (activeStudents.length === 0) {
      alert('No active students to download');
      return;
    }

    setDownloadingAll(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = 297;
      const pageHeight = 210;
      
      const columns = 3;
      const slipWidth = 95;
      const slipHeight = 185;
      
      const startX = 3;
      const startY = 10;
      const gapX = 3;
      
      const totalStudents = activeStudents.length;
      const slipsPerPage = columns;
      const totalPages = Math.ceil(totalStudents / slipsPerPage);
      
      let slipIndex = 0;
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Header for each page
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(33, 150, 243);
        pdf.text(academyConfig.name || "ACADEMY", pageWidth / 2, 8, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text("Fee Receipts - All Active Students", pageWidth / 2, 12, { align: 'center' });
        
        pdf.setFontSize(8);
        pdf.text(`Page ${page + 1} of ${totalPages}`, pageWidth / 2, 16, { align: 'center' });
        
        for (let col = 0; col < columns && slipIndex < totalStudents; col++) {
          const x = startX + (col * (slipWidth + gapX));
          const y = startY + 8;
          
          const student = activeStudents[slipIndex];
          
          try {
            const canvas = await generateSlipCanvas(student);
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            pdf.addImage(imgData, 'PNG', x, y, slipWidth, slipHeight, '', 'MEDIUM');
            
            // Add small footer below each slip
            pdf.setFontSize(6);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(100, 100, 100);
            
            const displayName = student.name.length > 20 ? 
              student.name.substring(0, 20) + "..." : student.name;
            
            pdf.text(displayName, x + slipWidth/2, y + slipHeight + 2, { 
              align: 'center', 
              maxWidth: slipWidth - 2 
            });
            
            pdf.setFontSize(5);
            const admissionDate = student.admissionDate || student.admission_date;
            pdf.text(`ID: ${student.studentId} | Admission: ${formatAdmissionDate(admissionDate).substring(0, 15)}`, x + slipWidth/2, y + slipHeight + 4, { 
              align: 'center', 
              maxWidth: slipWidth - 2 
            });
            
            slipIndex++;
            
          } catch (error) {
            console.error(`Error generating slip for ${student.name}:`, error);
            slipIndex++;
          }
        }
        
        // Page footer
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`, 5, pageHeight - 5);
        pdf.text(`Students: ${Math.min(slipIndex, totalStudents)}/${totalStudents}`, pageWidth - 15, pageHeight - 5);
      }
      
      const fileName = `${academyConfig.name || 'Academy'}-All-Receipts-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloadingAll(false);
    }
  };

  // Print Slip Function
  const printSlip = (student) => {
    if (!student) return;
    setPrinting(true);
    setCurrentStudent(student);
    
    try {
      const slipData = generateSlipData(student);
      
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Receipt - ${student.name}</title>
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .no-print {
                display: none !important;
              }
              
              .print-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: Arial, sans-serif;
            }
            
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 10mm;
              background: #f5f5f5;
            }
            
            .print-controls {
              position: fixed;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              padding: 10px;
              border-radius: 5px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              z-index: 1000;
              display: flex;
              gap: 10px;
            }
            
            .print-btn {
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
              font-size: 12px;
            }
            
            .print-btn.print {
              background: #4CAF50;
              color: white;
            }
            
            .print-btn.close {
              background: #f44336;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="print-controls no-print">
            <button onclick="window.print()" class="print-btn print">🖨️ Print Receipt</button>
            <button onclick="window.close()" class="print-btn close">✕ Close</button>
          </div>
          
          <div class="print-container">
            ${generateSlipHTML(slipData)}
          </div>
          
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
            
            window.onafterprint = () => {
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
    } catch (error) {
      console.error('Print Error:', error);
      setPrinting(false);
      setCurrentStudent(null);
    }
  };

  // Prepare WhatsApp sharing
  const prepareWhatsAppShare = async (student) => {
    if (!student) return;
    
    setSharing(true);
    setCurrentStudent(student);
    
    try {
      const canvas = await generateSlipCanvas(student);
      const imageData = canvas.toDataURL('image/png');
      
      const slipData = generateSlipData(student);
      
      // Create installment months text
      const installmentMonthsText = slipData.installments.slice(0, 3).map(inst => 
        `• ${inst.monthName} ${inst.year}: ${slipData.currency} ${formatCurrency(inst.amount)}`
      ).join('\n');
      
      // Create extra fees text
      const extraFeesText = slipData.extraFees.length > 0 ? 
        `\n💸 *Extra Fees:*\n${slipData.extraFees.map(fee => 
          `• ${fee.name}: ${slipData.currency} ${formatCurrency(fee.amount)}`
        ).join('\n')}` : '';
      
      const message = `*${slipData.academyName} Fee Receipt*

👨‍🎓 *Student Details:*
• ID: ${slipData.studentId}
• Name: ${slipData.studentName}
• Father: ${slipData.fatherName}
• Course: ${slipData.course}
• Admission: ${slipData.admissionDateFormatted}

💰 *Fee Summary:*
${installmentMonthsText}
${slipData.installments.length > 3 ? `• +${slipData.installments.length - 3} more months: ${slipData.currency} ${formatCurrency(slipData.tuitionFee - slipData.installments.slice(0, 3).reduce((sum, inst) => sum + inst.amount, 0))}\n` : ''}
${extraFeesText}

📊 *Total Amount: ${slipData.currency} ${formatCurrency(slipData.totalFee)}*
✅ *Total Paid: ${slipData.currency} ${formatCurrency(slipData.totalPaid)}*

📅 *Installment Status:*
• Paid: ${slipData.paidInstallments.length} months
• Overdue: ${slipData.overdueInstallments.length} months
• Pending: ${slipData.pendingInstallments.length} months

📅 Date: ${slipData.issueDate}
📍 ${slipData.academyAddress}
📞 ${slipData.academyPhone}`;
      
      setWhatsAppImage(imageData);
      setWhatsAppMessage(message);
      setShowWhatsAppPopup(true);
      
    } catch (error) {
      console.error('WhatsApp Share Error:', error);
      alert('Error generating receipt for WhatsApp.');
    } finally {
      setSharing(false);
    }
  };

  // Direct WhatsApp sharing
  const directWhatsAppShare = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const encodedMessage = encodeURIComponent(whatsAppMessage);
    
    if (isMobile) {
      window.open(`whatsapp://send?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
    }
    
    setTimeout(() => setShowWhatsAppPopup(false), 1000);
  };

  // Download image
  const downloadWhatsAppImage = () => {
    const link = document.createElement('a');
    link.href = whatsAppImage;
    link.download = `${academyConfig.name || 'Academy'}-Receipt-${currentStudent?.name || 'student'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Popup Component
  const WhatsAppPopup = () => {
    if (!showWhatsAppPopup) return null;
    
    return (
      <div style={styles.popupOverlay}>
        <div style={styles.popupContainer}>
          <div style={styles.popupHeader}>
            <h3 style={styles.popupTitle}>📱 Share Receipt</h3>
            <button 
              onClick={() => setShowWhatsAppPopup(false)}
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>
          
          <div style={styles.popupContent}>
            <div style={styles.imagePreview}>
              <img 
                src={whatsAppImage} 
                alt="Receipt" 
                style={styles.previewImage}
              />
            </div>
            
            <div style={styles.shareOptions}>
              <button
                onClick={directWhatsAppShare}
                style={styles.whatsappBtn}
              >
                <FaWhatsapp size={16} />
                <span>Share on WhatsApp</span>
              </button>
              
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => downloadWhatsAppImage()}
                  style={styles.downloadBtn}
                >
                  <FaDownload size={14} />
                  <span>Download Image</span>
                </button>
                
                <button
                  onClick={() => currentStudent && generatePDF(currentStudent)}
                  style={styles.pdfBtn}
                >
                  <FaFilePdf size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Student Card Component
  const StudentCard = ({ student }) => {
    const slipData = generateSlipData(student);
    const isProcessing = loading && currentStudent?.studentId === student.studentId;
    const isPrinting = printing && currentStudent?.studentId === student.studentId;
    const isSharing = sharing && currentStudent?.studentId === student.studentId;
    
    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.avatar}>
            <FaUser size={14} />
          </div>
          <div style={styles.studentInfo}>
            <div style={styles.studentName}>
              {student.name}
              <button 
                onClick={() => copyStudentId(student.studentId)}
                style={styles.copyButton}
                title="Copy Student ID"
              >
                <FaCopy size={10} />
                {copiedStudentId === student.studentId ? (
                  <span style={styles.copiedText}>Copied!</span>
                ) : (
                  <span style={styles.copyText}>Copy ID</span>
                )}
              </button>
            </div>
            <div style={styles.studentDetails}>
              <span style={styles.studentId}>ID: {student.studentId}</span>
              <span style={styles.courseBadge}>{student.course}</span>
            </div>
            {/* Admission Date Display */}
            <div style={styles.admissionDateRow}>
              <FaCalendarDay size={10} style={{color: '#0369a1'}} />
              <span style={styles.admissionDateText}>
                Admission: {formatAdmissionDate(student.admissionDate || student.admission_date)}
              </span>
            </div>
          </div>
        </div>
        
        <div style={styles.quickInfo}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Father:</span>
            <span style={styles.infoValue}>{slipData.fatherName}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Total Amount:</span>
            <span style={{
              color: '#1e293b',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              <FaRupeeSign size={10} /> {formatCurrency(slipData.totalFee)}
            </span>
          </div>
        </div>
        
        {/* Fee Summary in Card */}
        <div style={styles.feeSummaryCard}>
          <div style={styles.feeSummaryTitle}>
            <FaMoneyBillAlt size={12} style={{ marginRight: '4px' }} />
            Fee Summary
          </div>
          
          {/* Installment Months */}
          <div style={styles.installmentMonths}>
            {slipData.installments.slice(0, 2).map(inst => (
              <div key={inst.month} style={styles.installmentMonthItem}>
                <div style={styles.monthName}>{inst.monthName} {inst.year}</div>
                <div style={styles.monthAmount}>
                  <FaRupeeSign size={9} /> {formatCurrency(inst.amount)}
                </div>
              </div>
            ))}
            {slipData.installments.length > 2 && (
              <div style={styles.moreMonths}>
                +{slipData.installments.length - 2} more months
              </div>
            )}
          </div>
          
          {/* Extra Fees */}
          {slipData.extraFees.length > 0 && (
            <div style={styles.extraFeesCard}>
              <div style={styles.extraFeesTitle}>Extra Fees:</div>
              {slipData.extraFees.slice(0, 2).map(fee => (
                <div key={fee.id} style={styles.extraFeeItem}>
                  <div style={styles.feeName}>{fee.name}</div>
                  <div style={styles.feeAmount}>
                    <FaRupeeSign size={9} /> {formatCurrency(fee.amount)}
                  </div>
                </div>
              ))}
              {slipData.extraFees.length > 2 && (
                <div style={styles.moreFees}>
                  +{slipData.extraFees.length - 2} more fees
                </div>
              )}
            </div>
          )}
          
          {/* Total Amount */}
          <div style={styles.totalAmountCard}>
            <div style={styles.totalLabel}>Total Amount:</div>
            <div style={styles.totalAmount}>
              <FaRupeeSign size={12} /> {formatCurrency(slipData.totalFee)}
            </div>
          </div>
          
          {/* Total Paid */}
          <div style={styles.totalPaidCard}>
            <div style={styles.totalLabel}>Total Paid:</div>
            <div style={{...styles.totalAmount, color: '#27ae60'}}>
              <FaRupeeSign size={12} /> {formatCurrency(slipData.totalPaid)}
            </div>
          </div>
        </div>
        
        {/* Installment Summary */}
        <div style={styles.installmentSummary}>
          <div style={styles.installmentTitle}>
            <FaCalendarAlt size={12} style={{ marginRight: '4px' }} />
            Installment Status (${slipData.installments.length})
          </div>
          <div style={styles.installmentStats}>
            <div style={styles.installmentStat}>
              <div style={{...styles.statIcon, background: '#e8f5e9'}}>
                <FaCheck color="#1b5e20" size={10} />
              </div>
              <div>
                <div style={styles.statNumber}>{slipData.paidInstallments.length}</div>
                <div style={styles.statLabel}>Paid</div>
              </div>
            </div>
            <div style={styles.installmentStat}>
              <div style={{...styles.statIcon, background: '#ffebee'}}>
                <FaExclamationTriangle color="#c62828" size={10} />
              </div>
              <div>
                <div style={styles.statNumber}>{slipData.overdueInstallments.length}</div>
                <div style={styles.statLabel}>Overdue</div>
              </div>
            </div>
            <div style={styles.installmentStat}>
              <div style={{...styles.statIcon, background: '#fff3e0'}}>
                <FaClock color="#f57c00" size={10} />
              </div>
              <div>
                <div style={styles.statNumber}>{slipData.pendingInstallments.length}</div>
                <div style={styles.statLabel}>Pending</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={styles.actionButtons}>
          <button
            onClick={() => generatePDF(student)}
            disabled={isProcessing || isPrinting || isSharing || downloadingAll}
            style={isProcessing ? styles.btnProcessing : styles.btnPdf}
            title="Download PDF"
          >
            {isProcessing ? (
              <span style={styles.spinner}>⏳</span>
            ) : (
              <FaFilePdf size={14} />
            )}
            <span style={styles.btnText}>PDF</span>
          </button>
          
          <button
            onClick={() => printSlip(student)}
            disabled={isProcessing || isPrinting || isSharing || downloadingAll}
            style={isPrinting ? styles.btnProcessing : styles.btnPrint}
            title="Print"
          >
            {isPrinting ? (
              <span style={styles.spinner}>⏳</span>
            ) : (
              <FaPrint size={14} />
            )}
            <span style={styles.btnText}>Print</span>
          </button>
          
          <button
            onClick={() => prepareWhatsAppShare(student)}
            disabled={isProcessing || isPrinting || isSharing || downloadingAll}
            style={isSharing ? styles.btnProcessing : styles.btnWhatsapp}
            title="Share on WhatsApp"
          >
            {isSharing ? (
              <span style={styles.spinner}>⏳</span>
            ) : (
              <FaWhatsapp size={14} />
            )}
            <span style={styles.btnText}>Share</span>
          </button>
        </div>
        
        <div style={styles.pdfInfo}>
          <span style={styles.infoIcon}>📄</span>
          <span style={styles.infoText}>Student Copy (Yellow) + Office Copy (White) | New Fee Summary</span>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <WhatsAppPopup />
      
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>📋</span>
            Fee Receipt Generator
          </h1>
          <div style={styles.subtitle}>
            Student Copy (Yellow) + Office Copy (White) | New Fee Summary with Installment Months First
          </div>
        </div>
        <div style={styles.headerRight}>
          {activeStudents.length > 0 && (
            <button
              onClick={generatePDFForAll}
              disabled={downloadingAll}
              style={downloadingAll ? styles.downloadAllBtnProcessing : styles.downloadAllBtn}
              title="Download all receipts as PDF"
            >
              <FaDownload size={12} />
              <span style={styles.downloadAllText}>
                {downloadingAll ? 'Processing...' : `Download All (${activeStudents.length})`}
              </span>
            </button>
          )}
          <div style={styles.countBadge}>
            {activeStudents.length} Active Students
          </div>
        </div>
      </div>
      
      <div style={styles.infoCards}>
        <div style={styles.infoCard}>
          <div style={{...styles.infoCardIcon, background: '#e0f2fe', color: '#0369a1'}}>📄</div>
          <div style={styles.infoCardContent}>
            <div style={styles.infoCardTitle}>New Fee Summary</div>
            <div style={styles.infoCardText}>Installment months first, then extra fees, then total amount</div>
          </div>
        </div>
        
        <div style={styles.infoCard}>
          <div style={{...styles.infoCardIcon, background: '#f0f9ff', color: '#0c4a6e'}}>📅</div>
          <div style={styles.infoCardContent}>
            <div style={styles.infoCardTitle}>Admission Date</div>
            <div style={styles.infoCardText}>Admission date included in receipts</div>
          </div>
        </div>
        
        <div style={styles.infoCard}>
          <div style={{...styles.infoCardIcon, background: '#f0fdf4', color: '#166534'}}>📱</div>
          <div style={styles.infoCardContent}>
            <div style={styles.infoCardTitle}>Easy Sharing</div>
            <div style={styles.infoCardText}>PDF, Print, WhatsApp sharing options</div>
          </div>
        </div>
      </div>
      
      <div style={styles.content}>
        {activeStudents.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>👨‍🎓</div>
            <h3 style={styles.emptyTitle}>No Active Students Found</h3>
            <p style={styles.emptyText}>Add students to generate fee receipts</p>
          </div>
        ) : (
          <div style={styles.studentsGrid}>
            {activeStudents.map((student) => (
              <StudentCard key={student.studentId || student.id} student={student} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: '15px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px',
    padding: '15px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  titleIcon: {
    fontSize: '24px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  downloadAllBtn: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
  },
  downloadAllBtnProcessing: {
    padding: '10px 16px',
    background: '#94a3b8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  downloadAllText: {
    fontSize: '13px',
  },
  countBadge: {
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
  },
  infoCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  infoCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s',
  },
  infoCardIcon: {
    fontSize: '24px',
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '2px',
  },
  infoCardText: {
    fontSize: '12px',
    color: '#64748b',
  },
  content: {
    marginTop: '5px',
  },
  studentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '15px',
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '15px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1f5f9',
  },
  avatar: {
    width: '44px',
    height: '44px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
    fontSize: '16px',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  copyText: {
    fontSize: '11px',
  },
  copiedText: {
    fontSize: '10px',
    color: '#10B981',
    fontWeight: '600',
  },
  studentDetails: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '4px',
  },
  studentId: {
    fontSize: '11px',
    color: 'white',
    background: '#6366f1',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  courseBadge: {
    fontSize: '11px',
    color: 'white',
    background: '#8b5cf6',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  admissionDateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#0369a1',
    fontWeight: '600',
  },
  admissionDateText: {
    fontSize: '11px',
  },
  quickInfo: {
    marginBottom: '12px',
    padding: '10px',
    background: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '13px',
  },
  infoLabel: {
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    color: '#1e293b',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  
  // New Fee Summary Card Styles
  feeSummaryCard: {
    marginBottom: '12px',
    padding: '10px',
    background: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  feeSummaryTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
  },
  installmentMonths: {
    marginBottom: '8px',
  },
  installmentMonthItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
    padding: '4px 0',
    borderBottom: '1px dashed #e2e8f0',
  },
  monthName: {
    fontSize: '11px',
    color: '#1e293b',
    fontWeight: '600',
  },
  monthAmount: {
    fontSize: '11px',
    color: '#1e293b',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  moreMonths: {
    fontSize: '10px',
    color: '#64748b',
    textAlign: 'center',
    padding: '4px',
    background: '#f1f5f9',
    borderRadius: '4px',
    marginTop: '4px',
  },
  extraFeesCard: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #e2e8f0',
  },
  extraFeesTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#7b1fa2',
    marginBottom: '4px',
  },
  extraFeeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px',
    fontSize: '10px',
  },
  feeName: {
    color: '#1e293b',
    maxWidth: '60%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  feeAmount: {
    color: '#7b1fa2',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  moreFees: {
    fontSize: '9px',
    color: '#64748b',
    textAlign: 'center',
    padding: '3px',
    background: '#f1f5f9',
    borderRadius: '4px',
    marginTop: '4px',
  },
  totalAmountCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    padding: '6px',
    background: '#e8f5e9',
    borderRadius: '4px',
    border: '1px solid #c8e6c9',
  },
  totalPaidCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px',
    padding: '6px',
    background: '#fff3cd',
    borderRadius: '4px',
    border: '1px solid #ffeaa7',
  },
  totalLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1e293b',
  },
  totalAmount: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#1b5e20',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  
  installmentSummary: {
    marginBottom: '15px',
    padding: '10px',
    background: '#f0f9ff',
    borderRadius: '6px',
    border: '1px solid #bae6fd',
  },
  installmentTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
  },
  installmentStats: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  installmentStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statNumber: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#1e293b',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '2px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  btnPdf: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  btnPrint: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  btnWhatsapp: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  btnProcessing: {
    flex: 1,
    padding: '10px',
    background: '#94a3b8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  btnText: {
    fontSize: '12px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  pdfInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    background: '#e0f2fe',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#0369a1',
  },
  infoIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: '11px',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    background: 'white',
    borderRadius: '8px',
    marginTop: '20px',
    border: '2px dashed #e2e8f0',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '15px',
    color: '#cbd5e1',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  
  // WhatsApp Popup Styles
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  popupContainer: {
    background: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  },
  popupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #e2e8f0',
    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: 'white',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  },
  popupTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    fontSize: '16px',
    color: 'white',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  popupContent: {
    padding: '20px',
  },
  imagePreview: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  shareOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  whatsappBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  downloadBtn: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  pdfBtn: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
};

// Add global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', sans-serif;
  }
  
  button {
    font-family: inherit;
    outline: none;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.15);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .infoCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  @media (max-width: 768px) {
    .studentsGrid {
      grid-template-columns: 1fr !important;
    }
    
    .header {
      flex-direction: column;
      align-items: stretch;
    }
    
    .headerRight {
      flex-direction: column;
      align-items: stretch;
    }
    
    .infoCards {
      grid-template-columns: 1fr;
    }
    
    .popupContainer {
      margin: 10px;
      max-height: 70vh;
    }
    
    .downloadAllBtn, .downloadAllBtnProcessing {
      width: 100%;
    }
    
    .countBadge {
      width: 100%;
      text-align: center;
    }
    
    .buttonGroup {
      flex-direction: column;
    }
  }
  
  @media print {
    @page {
      margin: 0;
    }
    
    body * {
      visibility: hidden;
    }
    
    .print-container, .print-container * {
      visibility: visible;
    }
    
    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Slip;