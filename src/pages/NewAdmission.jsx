import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Minus,
  Calculator,
  AlertCircle,
  Calendar,
  Percent,
  Tag,
  BadgePercent,
  ArrowRight,
} from 'lucide-react';
import courseDB from '../utils/courseDatabase'; // Import course database

const NewAdmission = ({ addStudent, editingStudent = null }) => {
  const navigate = useNavigate();
  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // State for courses and fees from database
  const [courses, setCourses] = useState([]);
  const [courseFeesData, setCourseFeesData] = useState([]); // Course fees from FeesType
  const [extraFees, setExtraFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExtraFees, setSelectedExtraFees] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseFeeData, setSelectedCourseFeeData] = useState(null); // Course fee data from FeesType
  const [installmentMonthsList, setInstallmentMonthsList] = useState([]);
  const [existingStudentIds, setExistingStudentIds] = useState([]);

  // States for Discount feature
  const [discountType, setDiscountType] = useState('fixed'); // "fixed" or "percentage"
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    admissionDate: todayDate,
    admissionMonth: currentMonth,
    name: '',
    fatherName: '',
    course: '',
    address: '',
    phone: '',
    dob: '',
    gender: 'male',
    feePaid: 0,
    installmentPlan: 'full',
    numberOfInstallments: 1,
    email: '',
    installmentStartMonth: currentMonth,
    discountAmount: 0, // Added discount amount
    discountReason: '', // Added discount reason
    discountType: 'fixed', // Added discount type
  });

  const [errors, setErrors] = useState({});

  // Load data from database on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Load courses from database
        const loadedCourses = courseDB.getAllCourses();
        console.log('Loaded courses from database:', loadedCourses);
        setCourses(loadedCourses);

        // Load course fees from database (from FeesType)
        const loadedCourseFees = courseDB.getAllCourseFees();
        console.log('Loaded course fees from database:', loadedCourseFees);
        setCourseFeesData(loadedCourseFees);

        // Load general fees from database
        const loadedGeneralFees = courseDB.getAllGeneralFees();
        console.log('Loaded general fees from database:', loadedGeneralFees);

        // Transform database structure to match component structure
        const transformedFees = loadedGeneralFees.map((fee) => ({
          id: fee.id,
          name: fee.feeName,
          amount: Number(fee.amount),
          description: fee.description || '',
          category: 'extra',
        }));
        setExtraFees(transformedFees);

        // Load existing student IDs for uniqueness check
        const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
        const studentIds = existingStudents.map((s) => s.studentId);
        setExistingStudentIds(studentIds);

        setLoading(false);
      } catch (error) {
        console.error('Error loading data from database:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate student ID on component mount
  useEffect(() => {
    if (editingStudent) return; // Don't generate new ID when editing

    const generateUniqueStudentId = () => {
      const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
      const existingIds = existingStudents.map((s) => s.studentId);

      let newId;
      let counter = 1;

      do {
        newId = `CH-${counter.toString().padStart(3, '0')}`;
        counter++;
      } while (existingIds.includes(newId) && counter < 1000);

      // Update lastStudentId in localStorage
      const idNumber = parseInt(newId.replace('CH-', ''));
      localStorage.setItem('lastStudentId', idNumber);

      return newId;
    };

    const studentId = generateUniqueStudentId();

    setFormData((prev) => ({
      ...prev,
      studentId: studentId,
    }));
  }, [editingStudent]);

  // Calculate installment start month based on admission date - FIXED VERSION
  const calculateInstallmentStartMonth = (admissionDate) => {
    if (!admissionDate) {
      const now = new Date();
      return {
        month: months[now.getMonth()],
        year: now.getFullYear(),
      };
    }

    const date = new Date(admissionDate);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    console.log('Calculating installment start month:', {
      admissionDate,
      day,
      monthIndex,
      monthName: months[monthIndex],
      year,
    });

    // If admission is after 20th of the month, start installments from next month
    if (day > 20) {
      let nextMonthIndex = monthIndex + 1;
      let nextYear = year;

      if (nextMonthIndex >= 12) {
        nextMonthIndex = 0;
        nextYear = year + 1;
      }

      const result = {
        month: months[nextMonthIndex],
        year: nextYear,
      };

      console.log('Admission after 20th, starting from next month:', result);
      return result;
    } else {
      const result = {
        month: months[monthIndex],
        year: year,
      };

      console.log('Admission on or before 20th, starting from same month:', result);
      return result;
    }
  };

  // Calculate totals - NOW USING FEESTYPE DATA
  const monthlyFee = selectedCourseFeeData
    ? Number(selectedCourseFeeData.amount)
    : selectedCourse
      ? Number(selectedCourse.fees)
      : 0;
  const courseDuration = selectedCourse ? Number(selectedCourse.months) : 0;
  const totalCourseFees = monthlyFee * courseDuration; // Monthly fee × Duration

  const extraFeesTotal = selectedExtraFees.reduce((total, fee) => total + fee.amount, 0);
  const totalBeforeDiscount = totalCourseFees + extraFeesTotal;

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!discountValue || parseFloat(discountValue) <= 0) return 0;

    let discount = 0;
    if (discountType === 'percentage') {
      const percentage = Math.min(100, Math.max(0, parseFloat(discountValue) || 0));
      discount = (totalBeforeDiscount * percentage) / 100;
    } else {
      discount = Math.min(totalBeforeDiscount, parseFloat(discountValue) || 0);
    }

    return discount;
  };

  const discountAmount = calculateDiscountAmount();
  const totalFee = totalBeforeDiscount - discountAmount;
  const feeDue = totalFee - formData.feePaid;

  // Generate list of installment months - FIXED VERSION
  const generateInstallmentMonths = () => {
    console.log('Generating installment months...', {
      installmentPlan: formData.installmentPlan,
      numberOfInstallments: formData.numberOfInstallments,
      admissionDate: formData.admissionDate,
    });

    if (formData.installmentPlan !== 'installment' || !formData.numberOfInstallments) {
      console.log('Not installment plan or no installments specified');
      setInstallmentMonthsList([]);
      return;
    }

    const { month: startMonth, year: startYear } = calculateInstallmentStartMonth(
      formData.admissionDate,
    );
    const startMonthIndex = months.indexOf(startMonth);

    console.log('Start month details:', {
      startMonth,
      startYear,
      startMonthIndex,
      monthsList: months,
    });

    const monthsList = [];
    let currentYear = startYear;
    let monthIndex = startMonthIndex;

    console.log('Generating months list for', formData.numberOfInstallments, 'installments');

    for (let i = 0; i < formData.numberOfInstallments; i++) {
      monthsList.push({
        month: months[monthIndex],
        year: currentYear,
        installmentNumber: i + 1,
        amount: calculateInstallmentAmount(),
      });

      // Move to next month
      monthIndex++;
      if (monthIndex >= 12) {
        monthIndex = 0;
        currentYear++;
      }
    }

    console.log('Generated months list:', monthsList);
    setInstallmentMonthsList(monthsList);
  };

  // Handle editing student
  useEffect(() => {
    if (editingStudent && courses.length > 0) {
      setFormData({
        studentId: editingStudent.studentId,
        admissionDate: editingStudent.admissionDate || todayDate,
        admissionMonth: editingStudent.admissionMonth || currentMonth,
        name: editingStudent.name || '',
        fatherName: editingStudent.fatherName || '',
        course: editingStudent.course || '',
        address: editingStudent.address || '',
        phone: editingStudent.phone || '',
        dob: editingStudent.dob || '',
        gender: editingStudent.gender || 'male',
        feePaid: editingStudent.feePaid || 0,
        installmentPlan: editingStudent.installmentPlan || 'full',
        numberOfInstallments: editingStudent.numberOfInstallments || 1,
        email: editingStudent.email || '',
        installmentStartMonth: editingStudent.installmentStartMonth || currentMonth,
        discountAmount: editingStudent.discountAmount || 0,
        discountReason: editingStudent.discountReason || '',
        discountType: editingStudent.discountType || 'fixed',
      });

      if (editingStudent.course) {
        const course = courses.find((c) => c.title === editingStudent.course);
        setSelectedCourse(course);

        // Find course fee data from FeesType
        if (course) {
          const courseFeeData = courseFeesData.find(
            (fee) => fee.courseId.toString() === course.id.toString(),
          );
          setSelectedCourseFeeData(courseFeeData);
        }
      }

      if (editingStudent.selectedExtraFees) {
        setSelectedExtraFees(editingStudent.selectedExtraFees);
      }

      if (editingStudent.installmentMonthsList) {
        setInstallmentMonthsList(editingStudent.installmentMonthsList);
      }

      // Set discount states if available
      if (editingStudent.discountAmount && editingStudent.discountAmount > 0) {
        setDiscountType(editingStudent.discountType || 'fixed');
        setDiscountValue(editingStudent.discountAmount.toString());
        setDiscountReason(editingStudent.discountReason || '');
      }
    }
  }, [editingStudent, courses, courseFeesData]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: '' }));

    if (name === 'course') {
      const course = courses.find((c) => c.title === value);
      setSelectedCourse(course);

      // Find course fee data from FeesType
      if (course) {
        const courseFeeData = courseFeesData.find(
          (fee) => fee.courseId.toString() === course.id.toString(),
        );
        setSelectedCourseFeeData(courseFeeData);
      } else {
        setSelectedCourseFeeData(null);
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === 'feePaid') {
      const paid = Number(value);
      if (paid > totalFee) {
        setErrors((prev) => ({ ...prev, feePaid: 'Fee paid cannot exceed total fee' }));
      }
      setFormData((prev) => ({
        ...prev,
        feePaid: paid > totalFee ? totalFee : paid < 0 ? 0 : paid,
      }));
    } else if (name === 'installmentPlan') {
      const newData = {
        ...formData,
        installmentPlan: value,
        numberOfInstallments: value === 'installment' ? 3 : 1,
      };
      setFormData(newData);

      // Calculate installment start month based on admission date
      if (value === 'installment') {
        const { month, year } = calculateInstallmentStartMonth(newData.admissionDate);
        console.log('Setting installment start month:', { month, year });
        setFormData((prev) => ({
          ...prev,
          installmentStartMonth: month,
        }));
      }
    } else if (name === 'numberOfInstallments') {
      const num = Math.max(1, Math.min(12, Number(value)));
      setFormData((prev) => ({
        ...prev,
        numberOfInstallments: num,
      }));
    } else if (name === 'phone') {
      const phoneRegex = /^[0-9]{10,11}$/;
      const phoneValue = value.replace(/\D/g, '');
      if (phoneValue && !phoneRegex.test(phoneValue)) {
        setErrors((prev) => ({ ...prev, phone: 'Phone must be 10-11 digits' }));
      }
      setFormData((prev) => ({ ...prev, [name]: phoneValue }));
    } else if (name === 'admissionDate') {
      // When admission date changes, update admission month and installment start month
      const date = new Date(value);
      const monthName = months[date.getMonth()];
      const day = date.getDate();

      console.log('Admission date changed:', {
        date: value,
        monthName,
        day,
      });

      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: value,
          admissionMonth: monthName,
        };

        // If installment plan is selected, update installment start month
        if (prev.installmentPlan === 'installment') {
          const { month } = calculateInstallmentStartMonth(value);
          console.log('Updating installment start month to:', month);
          newData.installmentStartMonth = month;
        }

        return newData;
      });
    } else if (name === 'studentId') {
      // Check for duplicate student ID
      const studentId = value.toUpperCase();
      const isDuplicate =
        existingStudentIds.includes(studentId) &&
        (!editingStudent || studentId !== editingStudent.studentId);

      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          studentId: 'This Student ID already exists. Please use a unique ID.',
        }));
      }

      setFormData((prev) => ({ ...prev, [name]: studentId }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle extra fee selection
  const handleExtraFeeSelect = (fee) => {
    if (selectedExtraFees.some((f) => f.id === fee.id)) {
      setSelectedExtraFees((prev) => prev.filter((f) => f.id !== fee.id));
    } else {
      setSelectedExtraFees((prev) => [...prev, fee]);
    }
  };

  // Calculate installment amount (only for course fee) - FIXED VERSION
  const calculateInstallmentAmount = () => {
    if (formData.installmentPlan === 'installment' && formData.numberOfInstallments > 0) {
      // Calculate paid amount that applies to course fee
      const totalPaidForCourse = Math.min(formData.feePaid, totalCourseFees);
      const remainingCourseFee = Math.max(0, totalCourseFees - totalPaidForCourse);

      if (remainingCourseFee <= 0) return 0;

      const amount = Math.ceil(remainingCourseFee / formData.numberOfInstallments);
      console.log('Calculating installment amount:', {
        totalPaidForCourse,
        remainingCourseFee,
        numberOfInstallments: formData.numberOfInstallments,
        amount,
      });
      return amount;
    }
    return 0;
  };

  const installmentAmount = calculateInstallmentAmount();

  // Generate installment months whenever relevant data changes
  useEffect(() => {
    console.log('Effect triggered for installment months generation');
    generateInstallmentMonths();
  }, [
    formData.installmentPlan,
    formData.numberOfInstallments,
    formData.admissionDate,
    formData.feePaid,
    totalCourseFees,
  ]);

  // Apply discount function
  const handleApplyDiscount = () => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      setErrors((prev) => ({
        ...prev,
        discount: 'Please enter a valid discount value!',
      }));
      return;
    }

    // Update form data with discount
    setFormData((prev) => ({
      ...prev,
      discountAmount: discountAmount,
      discountReason: discountReason,
      discountType: discountType,
    }));

    setShowDiscountModal(false);

    // Show success message
    alert(`✅ Discount of PKR ${discountAmount.toLocaleString()} applied successfully!`);
  };

  // Clear discount
  const handleClearDiscount = () => {
    setDiscountValue('');
    setDiscountReason('');
    setDiscountType('fixed');
    setFormData((prev) => ({
      ...prev,
      discountAmount: 0,
      discountReason: '',
      discountType: 'fixed',
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else {
      // Check for duplicate student ID
      const isDuplicate = existingStudents.some(
        (student) =>
          student.studentId === formData.studentId &&
          (!editingStudent || student.studentId !== editingStudent.studentId),
      );

      if (isDuplicate) {
        newErrors.studentId = 'This Student ID already exists. Please use a unique ID.';
      }
    }

    if (!formData.name.trim()) newErrors.name = 'Student name is required';
    if (!formData.fatherName.trim()) newErrors.fatherName = "Father's name is required";
    if (!formData.course) newErrors.course = 'Course is required';
    if (formData.phone && formData.phone.length < 10)
      newErrors.phone = 'Phone must be at least 10 digits';
    if (formData.feePaid > totalFee) newErrors.feePaid = 'Fee paid cannot exceed total fee';

    // Validate installment plan
    if (formData.installmentPlan === 'installment') {
      if (formData.numberOfInstallments < 2 || formData.numberOfInstallments > 12) {
        newErrors.numberOfInstallments = 'Installments must be between 2 and 12';
      }
    }

    // Check if course has fee set in FeesType
    if (formData.course && selectedCourse && !selectedCourseFeeData) {
      newErrors.course =
        "This course doesn't have a fee set in Fees Management. Please set fee first.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fix all errors before submitting');
      return;
    }

    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }

    // Check if course has fee set
    if (!selectedCourseFeeData) {
      alert("This course doesn't have a fee set in Fees Management. Please set fee first.");
      return;
    }

    // Prepare student data
    const studentData = {
      ...formData,
      totalFee,
      feeDue,
      courseFee: totalCourseFees, // Now storing total course fees
      monthlyFee: monthlyFee, // Store monthly fee separately
      courseDuration: courseDuration, // Store duration
      extraFees: extraFeesTotal,
      selectedExtraFees,
      installmentMonths:
        formData.installmentPlan === 'installment' ? formData.numberOfInstallments : 1,
      admissionDate: formData.admissionDate || todayDate,
      installmentMonthsList:
        formData.installmentPlan === 'installment' ? installmentMonthsList : [],
      installmentStartMonth: formData.installmentStartMonth,
      discountAmount: discountAmount,
      discountReason: discountReason,
      discountType: discountType,
      createdAt: editingStudent ? editingStudent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      paymentStatus: feeDue === 0 ? 'fully_paid' : formData.feePaid === 0 ? 'unpaid' : 'partial',
    };

    console.log('Saving student data:', studentData);

    try {
      // Save to localStorage
      const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');

      if (editingStudent) {
        // Update existing student
        const updatedStudents = existingStudents.map((s) =>
          s.studentId === editingStudent.studentId ? studentData : s,
        );
        localStorage.setItem('students', JSON.stringify(updatedStudents));
      } else {
        // Add new student
        const updatedStudents = [...existingStudents, studentData];
        localStorage.setItem('students', JSON.stringify(updatedStudents));

        // Update student ID counter
        const studentIdNum = parseInt(formData.studentId.replace('CH-', ''));
        localStorage.setItem('lastStudentId', studentIdNum);

        // Create initial payment record if there's an initial payment
        if (formData.feePaid > 0) {
          const existingFees = JSON.parse(localStorage.getItem('studentFees') || '[]');
          const initialPaymentRecord = {
            id: `${Date.now()}-ADM`,
            studentId: formData.studentId,
            studentName: formData.name,
            amount: formData.feePaid,
            date: formData.admissionDate || todayDate,
            method: 'cash',
            transactionId: `ADM-${formData.studentId}-${Date.now()}`,
            type: 'admission',
            status: 'completed',
            description: 'Initial payment at admission',
            timestamp: new Date().toISOString(),
          };
          existingFees.push(initialPaymentRecord);
          localStorage.setItem('studentFees', JSON.stringify(existingFees));
          console.log('Created initial payment record:', initialPaymentRecord);
        }
      }

      // Call parent function if provided
      if (addStudent) {
        addStudent(studentData);
      }

      // Show success message
      let message = editingStudent
        ? `✅ Student updated successfully!\nStudent ID: ${formData.studentId}`
        : `✅ Student added successfully!\nStudent ID: ${formData.studentId}\nTotal Fee: PKR${totalFee.toLocaleString()}`;

      if (discountAmount > 0) {
        message += `\nDiscount Applied: PKR${discountAmount.toLocaleString()}`;
      }

      if (formData.installmentPlan === 'installment' && installmentMonthsList.length > 0) {
        const installmentMonthsStr = installmentMonthsList
          .map((m) => `${m.month} ${m.year}`)
          .join(', ');
        message += `\n\nInstallment Schedule:\n${installmentMonthsStr}\n\nInstallment Amount: PKR${installmentAmount.toLocaleString()}/month`;
      }

      alert(message);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving student:', error);
      alert('❌ Error saving student: ' + error.message);
    }
  };

  // Reset form
  const handleReset = () => {
    const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const existingIds = existingStudents.map((s) => s.studentId);

    let newId;
    let counter = 1;

    do {
      newId = `CH-${counter.toString().padStart(3, '0')}`;
      counter++;
    } while (existingIds.includes(newId) && counter < 1000);

    setFormData({
      studentId: newId,
      admissionDate: todayDate,
      admissionMonth: currentMonth,
      name: '',
      fatherName: '',
      course: '',
      address: '',
      phone: '',
      dob: '',
      gender: 'male',
      feePaid: 0,
      installmentPlan: 'full',
      numberOfInstallments: 1,
      email: '',
      installmentStartMonth: currentMonth,
      discountAmount: 0,
      discountReason: '',
      discountType: 'fixed',
    });

    setSelectedCourse(null);
    setSelectedCourseFeeData(null);
    setSelectedExtraFees([]);
    setInstallmentMonthsList([]);
    setDiscountValue('');
    setDiscountReason('');
    setDiscountType('fixed');
    setErrors({});
  };

  // Discount Modal Component
  const DiscountModal = () => (
    <div
      style={{
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
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          width: '100%',
          maxWidth: 450,
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Percent size={20} />
            <h3 style={{ margin: 0, fontSize: 18 }}>Apply Discount</h3>
          </div>
          <button
            onClick={() => {
              setShowDiscountModal(false);
              setDiscountValue('');
              setDiscountReason('');
              setDiscountType('fixed');
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
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div
            style={{
              background: '#fffbeb',
              padding: 12,
              borderRadius: 6,
              marginBottom: 20,
              border: '1px solid #fcd34d',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#92400e',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertCircle size={12} /> Summary
            </div>
            <div style={{ fontSize: 11, color: '#b45309' }}>
              • Original Amount: PKR {totalBeforeDiscount.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#b45309' }}>
              • Selected Items: Course Fee + {selectedExtraFees.length} Extra Fees
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 5,
                fontWeight: '600',
                fontSize: 13,
                color: '#475569',
              }}
            >
              Discount Type
            </label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button
                onClick={() => setDiscountType('fixed')}
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
                  gap: 5,
                }}
              >
                <BadgePercent size={14} /> Fixed Amount
              </button>
              <button
                onClick={() => setDiscountType('percentage')}
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
                  gap: 5,
                }}
              >
                <Percent size={14} /> Percentage
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 5,
                fontWeight: '600',
                fontSize: 13,
                color: '#475569',
              }}
            >
              Discount {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (PKR)'}
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
                  fontWeight: 'bold',
                }}
                placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                min="0"
                max={discountType === 'percentage' ? '100' : totalBeforeDiscount}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontWeight: 'bold',
                  fontSize: 12,
                }}
              >
                {discountType === 'percentage' ? '%' : 'PKR'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              {discountType === 'percentage'
                ? `Max: 100% (PKR ${totalBeforeDiscount.toLocaleString()})`
                : `Max: PKR ${totalBeforeDiscount.toLocaleString()}`}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 5,
                fontWeight: '600',
                fontSize: 13,
                color: '#475569',
              }}
            >
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
                fontSize: 13,
              }}
              placeholder="e.g., Early bird discount, Referral, etc."
            />
          </div>

          {discountValue && parseFloat(discountValue) > 0 && (
            <div
              style={{
                background: '#f0fdf4',
                padding: 12,
                borderRadius: 6,
                marginBottom: 20,
                border: '1px solid #10b981',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#065f46',
                  marginBottom: 4,
                }}
              >
                Preview:
              </div>
              <div style={{ fontSize: 11, color: '#059669' }}>
                • Original: PKR {totalBeforeDiscount.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#d97706' }}>
                • Discount:{' '}
                {discountType === 'percentage'
                  ? `${discountValue}% (PKR ${discountAmount.toLocaleString()})`
                  : `PKR ${discountAmount.toLocaleString()}`}
              </div>
              <div style={{ fontSize: 11, fontWeight: 'bold', color: '#10b981', marginTop: 2 }}>
                • Final Amount: PKR {totalFee.toLocaleString()}
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
                background:
                  !discountValue || parseFloat(discountValue) <= 0 ? '#94a3b8' : '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor:
                  !discountValue || parseFloat(discountValue) <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 'bold',
                fontSize: 13,
              }}
            >
              <Tag size={14} />
              Apply Discount
            </button>
            <button
              onClick={() => {
                setShowDiscountModal(false);
                setDiscountValue('');
                setDiscountReason('');
                setDiscountType('fixed');
              }}
              style={{
                padding: '10px 15px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Styles
  const styles = {
    container: {
      padding: '20px',
      background: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', sans-serif",
    },
    card: {
      background: 'white',
      padding: '25px',
      borderRadius: '15px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
      maxWidth: '1000px',
      margin: '0 auto',
    },
    header: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: '2px solid #e2e8f0',
    },
    formRow: { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' },
    formGroup: { flex: '1', minWidth: '200px' },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#475569',
      fontSize: '13px',
    },
    requiredLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#dc2626',
      fontSize: '13px',
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      background: '#f8fafc',
    },
    errorInput: { borderColor: '#dc2626', background: '#fef2f2' },
    select: {
      width: '100%',
      padding: '12px 15px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      background: '#f8fafc',
      cursor: 'pointer',
    },
    textarea: {
      width: '100%',
      padding: '12px 15px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      background: '#f8fafc',
      minHeight: '100px',
      fontFamily: 'inherit',
    },
    errorMessage: {
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '5px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    feeTypeSection: {
      marginTop: '25px',
      marginBottom: '25px',
      padding: '20px',
      background: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #cbd5e1',
    },
    feeTypeHeader: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    extraFeeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '10px',
      marginTop: '15px',
    },
    extraFeeCard: {
      padding: '15px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      background: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    extraFeeCardSelected: {
      borderColor: '#3b82f6',
      background: '#dbeafe',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
    },
    summaryCard: {
      background: '#1e293b',
      padding: '20px',
      borderRadius: '12px',
      marginTop: '15px',
      color: 'white',
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px',
      marginTop: '10px',
    },
    summaryItem: {
      textAlign: 'center',
      padding: '12px',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.1)',
    },
    summaryLabel: { fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' },
    summaryValue: { fontSize: '20px', fontWeight: '700', color: 'white' },
    paymentSection: {
      background: '#f1f5f9',
      padding: '20px',
      borderRadius: '12px',
      marginTop: '15px',
      border: '1px solid #e2e8f0',
    },
    installmentSection: {
      background: '#e0f2fe',
      padding: '15px',
      borderRadius: '10px',
      marginTop: '15px',
      border: '1px dashed #0ea5e9',
    },
    installmentNote: {
      fontSize: '12px',
      color: '#0369a1',
      marginTop: '10px',
      padding: '8px',
      background: 'rgba(14, 165, 233, 0.1)',
      borderRadius: '6px',
    },
    buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' },
    submitButton: {
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '14px 30px',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    resetButton: {
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0',
      padding: '14px 30px',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    admissionMonthSection: {
      background: '#f0f9ff',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '15px',
      border: '1px solid #bae6fd',
    },
    admissionMonthHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
    },
    courseInfo: {
      background: '#e0f2fe',
      padding: '15px',
      borderRadius: '8px',
      marginTop: '10px',
      borderLeft: '4px solid #0ea5e9',
    },
    installmentSchedule: {
      background: '#f0fdf4',
      padding: '15px',
      borderRadius: '8px',
      marginTop: '15px',
      border: '1px solid #bbf7d0',
    },
    installmentMonthCard: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 15px',
      background: 'white',
      borderRadius: '6px',
      marginBottom: '8px',
      border: '1px solid #dcfce7',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    warningBox: {
      background: '#fef3c7',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #f59e0b',
      marginTop: '10px',
    },
    debugInfo: {
      background: '#f3f4f6',
      padding: '10px',
      borderRadius: '6px',
      marginTop: '10px',
      fontSize: '12px',
      color: '#6b7280',
      border: '1px dashed #d1d5db',
    },
    discountButton: {
      background: discountAmount > 0 ? '#f59e0b' : '#f1f5f9',
      color: discountAmount > 0 ? 'white' : '#475569',
      border: discountAmount > 0 ? '1px solid #d97706' : '1px solid #e2e8f0',
      padding: '10px 15px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      fontWeight: 'bold',
      fontSize: '13px',
      marginTop: '10px',
      width: '100%',
    },
    discountAppliedSection: {
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      padding: '12px',
      borderRadius: '8px',
      marginTop: '15px',
      border: '1px solid #fcd34d',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.header}>Loading Data...</h2>
          <p>Please wait while we load courses and fees from database.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>
          {editingStudent ? '✏️ Edit Student' : '🎓 New Student Admission'}
        </h2>

        <div
          style={{
            background: '#e0f2fe',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '15px',
            border: '1px solid #7dd3fc',
            fontSize: '13px',
            color: '#0369a1',
          }}
        >
          <strong>Student ID:</strong> {formData.studentId}
          {!editingStudent && (
            <div style={{ fontSize: '12px', marginTop: '5px', color: '#0c4a6e' }}>
              ℹ️ Student ID is auto-generated and checked for uniqueness
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.requiredLabel}>Student ID *</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
                style={{ ...styles.input, ...(errors.studentId && styles.errorInput) }}
                placeholder="CH-001"
                disabled={editingStudent} // Prevent changing ID when editing
              />
              {errors.studentId && (
                <div style={styles.errorMessage}>
                  <AlertCircle size={12} /> {errors.studentId}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>
                {editingStudent ? 'Student ID cannot be changed' : 'Auto-generated unique ID'}
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Admission Date</label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                style={styles.input}
                max={todayDate}
              />
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                Admission Month: <strong>{formData.admissionMonth}</strong>
              </div>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.requiredLabel}>Student Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{ ...styles.input, ...(errors.name && styles.errorInput) }}
                placeholder="Enter full name"
              />
              {errors.name && (
                <div style={styles.errorMessage}>
                  <AlertCircle size={12} /> {errors.name}
                </div>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.requiredLabel}>Father's Name *</label>
              <input
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                required
                style={{ ...styles.input, ...(errors.fatherName && styles.errorInput) }}
                placeholder="Enter father's name"
              />
              {errors.fatherName && (
                <div style={styles.errorMessage}>
                  <AlertCircle size={12} /> {errors.fatherName}
                </div>
              )}
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.requiredLabel}>Course *</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                style={{ ...styles.select, ...(errors.course && styles.errorInput) }}
              >
                <option value="">Select Course</option>
                {courses.map((c) => {
                  const courseFee = courseFeesData.find(
                    (fee) => fee.courseId.toString() === c.id.toString(),
                  );
                  const totalFee = courseFee ? Number(courseFee.amount) * Number(c.months) : 0;

                  return (
                    <option key={c.id} value={c.title}>
                      {c.title} ({c.months} months) -{' '}
                      {courseFee
                        ? `PKR${courseFee.amount}/month (Total: PKR${totalFee})`
                        : 'Fee not set'}
                    </option>
                  );
                })}
              </select>
              {errors.course && (
                <div style={styles.errorMessage}>
                  <AlertCircle size={12} /> {errors.course}
                </div>
              )}

              {selectedCourse && (
                <div style={styles.courseInfo}>
                  <div>
                    <strong>Course:</strong> {selectedCourse.title}
                  </div>
                  <div>
                    <strong>Duration:</strong> {courseDuration} months
                  </div>

                  {selectedCourseFeeData ? (
                    <>
                      <div>
                        <strong>Monthly Fee:</strong> PKR{monthlyFee.toLocaleString()}/month
                      </div>
                      <div
                        style={{
                          background: '#d1fae5',
                          padding: '8px',
                          borderRadius: '6px',
                          marginTop: '8px',
                          border: '2px solid #10b981',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontWeight: 'bold', color: '#065f46' }}>
                            Total Course Fees:
                          </span>
                          <span
                            style={{
                              fontWeight: 'bold',
                              color: '#065f46',
                              fontSize: '18px',
                            }}
                          >
                            PKR{totalCourseFees.toLocaleString()}
                          </span>
                        </div>
                        <div
                          style={{
                            textAlign: 'center',
                            fontSize: '11px',
                            color: '#047857',
                            marginTop: '3px',
                          }}
                        >
                          ({monthlyFee.toLocaleString()} × {courseDuration} months)
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={styles.warningBox}>
                      <div style={{ color: '#92400e', fontWeight: 'bold', marginBottom: '5px' }}>
                        ⚠️ Fee Not Set
                      </div>
                      <div style={{ fontSize: '12px', color: '#92400e' }}>
                        This course doesn't have a fee set in Fees Management. Please set the fee in
                        Fees Management page first.
                      </div>
                    </div>
                  )}

                  {selectedCourse.description && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Description:</strong> {selectedCourse.description}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{ ...styles.input, ...(errors.phone && styles.errorInput) }}
                placeholder="03001234567"
                maxLength={11}
              />
              {errors.phone && (
                <div style={styles.errorMessage}>
                  <AlertCircle size={12} /> {errors.phone}
                </div>
              )}
            </div>
          </div>

          {/* Extra Fees Section */}
          <div style={styles.feeTypeSection}>
            <h3 style={styles.feeTypeHeader}>💰 Extra Fees (Optional)</h3>

            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '15px' }}>
              Select any extra fees that apply. These will be added to the total fee and must be
              paid separately from installment payments.
            </p>

            {extraFees.length === 0 ? (
              <div
                style={{
                  padding: '15px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '15px',
                }}
              >
                <p style={{ margin: 0, color: '#92400e' }}>
                  No extra fees available. Add extra fees from Fees Management page.
                </p>
              </div>
            ) : (
              <div style={styles.extraFeeGrid}>
                {extraFees.map((fee) => {
                  const isSelected = selectedExtraFees.some((f) => f.id === fee.id);
                  return (
                    <div
                      key={fee.id}
                      onClick={() => handleExtraFeeSelect(fee)}
                      style={{
                        ...styles.extraFeeCard,
                        ...(isSelected ? styles.extraFeeCardSelected : {}),
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '5px' }}>
                        {fee.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>
                        Amount: PKR{fee.amount}
                      </div>
                      {fee.description && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>
                          {fee.description}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '11px',
                          color: isSelected ? '#1e40af' : '#64748b',
                          fontWeight: isSelected ? '600' : '400',
                        }}
                      >
                        {isSelected ? '✓ Selected' : 'Click to select'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Discount Section */}
            <button
              type="button"
              onClick={() => setShowDiscountModal(true)}
              style={styles.discountButton}
            >
              {discountAmount > 0 ? (
                <>
                  <Percent size={14} />
                  Discount Applied: -PKR {discountAmount.toLocaleString()}
                </>
              ) : (
                <>
                  <Tag size={14} />
                  Apply Discount
                </>
              )}
            </button>

            {discountAmount > 0 && (
              <div style={styles.discountAppliedSection}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BadgePercent size={16} color="#d97706" />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 14, color: '#92400e' }}>
                        Discount Applied
                      </div>
                      <div style={{ fontSize: 11, color: '#b45309' }}>
                        {discountType === 'percentage'
                          ? `${discountValue}%`
                          : `PKR ${discountValue}`}
                        {discountReason && ` - ${discountReason}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClearDiscount}
                    style={{
                      padding: '4px 8px',
                      background: '#fee2e2',
                      border: '1px solid #fecaca',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#dc2626',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Fee Summary */}
            <div style={styles.summaryCard}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}
              >
                <Calculator size={20} color="#cbd5e1" />
                <h4 style={{ margin: '0', color: 'white', fontSize: '16px' }}>💰 Fee Summary</h4>
              </div>

              <div style={styles.summaryGrid}>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Course Fee</div>
                  <div style={styles.summaryValue}>PKR{totalCourseFees.toLocaleString()}</div>
                </div>

                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Extra Fees</div>
                  <div style={styles.summaryValue}>PKR{extraFeesTotal.toLocaleString()}</div>
                </div>

                {discountAmount > 0 && (
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryLabel}>Discount</div>
                    <div style={{ ...styles.summaryValue, color: '#f59e0b' }}>
                      -PKR{discountAmount.toLocaleString()}
                    </div>
                  </div>
                )}

                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Total Amount</div>
                  <div style={styles.summaryValue}>PKR{totalFee.toLocaleString()}</div>
                </div>

                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Fee Paid</div>
                  <div
                    style={{
                      ...styles.summaryValue,
                      color: formData.feePaid > 0 ? '#10b981' : 'white',
                    }}
                  >
                    PKR{formData.feePaid.toLocaleString()}
                  </div>
                </div>

                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Fee Due</div>
                  <div
                    style={{
                      ...styles.summaryValue,
                      color: feeDue === 0 ? '#10b981' : feeDue === totalFee ? '#ef4444' : '#f59e0b',
                    }}
                  >
                    PKR{feeDue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div style={styles.paymentSection}>
              <div style={styles.formGroup}>
                <label style={styles.requiredLabel}>Fee Paid Amount *</label>
                <input
                  type="number"
                  name="feePaid"
                  value={formData.feePaid}
                  onChange={handleChange}
                  min="0"
                  max={totalFee}
                  style={{
                    ...styles.input,
                    fontWeight: '600',
                    fontSize: '16px',
                    padding: '14px',
                    borderColor: formData.feePaid > 0 ? '#10b981' : '#e2e8f0',
                    ...(errors.feePaid && styles.errorInput),
                  }}
                  placeholder="Enter paid amount"
                />
                {errors.feePaid && (
                  <div style={styles.errorMessage}>
                    <AlertCircle size={12} /> {errors.feePaid}
                  </div>
                )}
              </div>

              {/* Installment Plan (Only for Course Fee) */}
              <div style={styles.installmentSection}>
                <label style={styles.label}>Installment Plan (Course Fee Only)</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#475569',
                    }}
                  >
                    <input
                      type="radio"
                      name="installmentPlan"
                      value="full"
                      checked={formData.installmentPlan === 'full'}
                      onChange={handleChange}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#3b82f6',
                        cursor: 'pointer',
                      }}
                    />
                    Full Payment
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#475569',
                    }}
                  >
                    <input
                      type="radio"
                      name="installmentPlan"
                      value="installment"
                      checked={formData.installmentPlan === 'installment'}
                      onChange={handleChange}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#3b82f6',
                        cursor: 'pointer',
                      }}
                    />
                    Installment Payment
                  </label>
                </div>

                {formData.installmentPlan === 'installment' && totalCourseFees > 0 && (
                  <>
                    <div style={{ marginTop: '15px' }}>
                      <label style={styles.label}>Number of Installments (Course Fee Only)</label>
                      <select
                        name="numberOfInstallments"
                        value={formData.numberOfInstallments}
                        onChange={handleChange}
                        style={{
                          ...styles.select,
                          ...(errors.numberOfInstallments && styles.errorInput),
                        }}
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                          <option key={num} value={num}>
                            {num} Installments
                          </option>
                        ))}
                      </select>
                      {errors.numberOfInstallments && (
                        <div style={styles.errorMessage}>
                          <AlertCircle size={12} /> {errors.numberOfInstallments}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: '15px',
                        padding: '15px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#475569' }}>
                          Total Course Fee:
                        </span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                          PKR{totalCourseFees.toLocaleString()}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#475569' }}>Paid for Course:</span>
                        <span style={{ fontWeight: '600', color: '#10b981' }}>
                          PKR{Math.min(formData.feePaid, totalCourseFees).toLocaleString()}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#475569' }}>
                          Remaining Course Fee:
                        </span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                          PKR
                          {Math.max(
                            0,
                            totalCourseFees - Math.min(formData.feePaid, totalCourseFees),
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '2px solid #e2e8f0',
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>
                          Installment Amount:
                        </span>
                        <span style={{ fontWeight: '700', color: '#3b82f6', fontSize: '18px' }}>
                          PKR{installmentAmount.toLocaleString()}/month
                        </span>
                      </div>
                    </div>

                    {/* Installment Schedule Display */}
                    {installmentMonthsList.length > 0 && (
                      <div style={styles.installmentSchedule}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '10px',
                          }}
                        >
                          <Calendar size={16} color="#16a34a" />
                          <h5 style={{ margin: 0, color: '#166534', fontSize: '14px' }}>
                            Installment Schedule (Starting from {formData.installmentStartMonth})
                          </h5>
                        </div>

                        {installmentMonthsList.map((monthData, index) => (
                          <div key={index} style={styles.installmentMonthCard}>
                            <div
                              style={{
                                background: '#dcfce7',
                                color: '#166534',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}
                            >
                              {monthData.installmentNumber}
                            </div>
                            <div>
                              <div
                                style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}
                              >
                                {monthData.month} {monthData.year}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                Installment Amount: PKR{installmentAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={styles.installmentNote}>
                      <strong>Note:</strong>
                      <ul style={{ margin: '5px 0 0 0', paddingLeft: '15px' }}>
                        <li>
                          Installments apply only to Course Fee (PKR
                          {totalCourseFees.toLocaleString()})
                        </li>
                        <li>
                          Extra Fees (PKR{extraFeesTotal.toLocaleString()}) must be paid in full at
                          admission
                        </li>
                        <li>
                          If admission date is after 20th of month, installments start from next
                          month
                        </li>
                        <li>
                          Monthly Fee: PKR{monthlyFee.toLocaleString()}/month × {courseDuration}{' '}
                          months = PKR{totalCourseFees.toLocaleString()}
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                max={todayDate}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                {['male', 'female', 'other'].map((g) => (
                  <label
                    key={g}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#475569',
                    }}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={formData.gender === g}
                      onChange={handleChange}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#3b82f6',
                        cursor: 'pointer',
                      }}
                    />
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="student@example.com"
              />
            </div>
          </div>

          {/* Address */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Enter complete address..."
              rows="3"
            />
          </div>

          {/* Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={selectedCourse && !selectedCourseFeeData} // Disable if course fee not set
            >
              {editingStudent ? '📝 Update Student' : '✅ Submit Admission'}
            </button>
            <button type="button" style={styles.resetButton} onClick={handleReset}>
              🔄 Reset Form
            </button>
            <button
              type="button"
              style={{ ...styles.resetButton, background: '#f1f5f9' }}
              onClick={() => navigate('/dashboard')}
            >
              ↩️ Back to Dashboard
            </button>
          </div>

          {selectedCourse && !selectedCourseFeeData && (
            <div
              style={{
                marginTop: '15px',
                padding: '15px',
                background: '#fee2e2',
                borderRadius: '8px',
                border: '2px solid #dc2626',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <AlertCircle size={20} color="#dc2626" />
                <h4 style={{ margin: 0, color: '#dc2626' }}>⚠️ Course Fee Not Set</h4>
              </div>
              <p style={{ margin: '0 0 10px 0', color: '#991b1b' }}>
                The selected course "{selectedCourse.title}" doesn't have a fee set in Fees
                Management.
              </p>
              <p style={{ margin: '0', color: '#991b1b' }}>
                Please go to <strong>Fees Management</strong> page and set the fee for this course
                first.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && <DiscountModal />}
    </div>
  );
};

export default NewAdmission;
