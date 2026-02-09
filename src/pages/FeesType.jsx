// src/pages/FeesTypeFinal.jsx
import React, { useState, useEffect } from 'react';
import courseDB from '../utils/courseDatabase';

const FeesType = () => {
  console.log('🚀 FeesTypeFinal Component Loaded');

  // ========== STATES ==========
  const [generalFees, setGeneralFees] = useState([]);
  const [courseFees, setCourseFees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState(null);
  
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  
  const [editingCourseFee, setEditingCourseFee] = useState(null);
  
  const [generalForm, setGeneralForm] = useState({
    feeName: '',
    amount: '',
    description: ''
  });
  
  const [courseForm, setCourseForm] = useState({
    courseId: '',
    feeName: 'Tuition Fee',
    monthlyAmount: '', // Changed from amount to monthlyAmount
    description: ''
  });

  // Calculate total fees when monthly amount changes
  const [totalFees, setTotalFees] = useState(0);

  useEffect(() => {
    const monthlyAmountNum = Number(courseForm.monthlyAmount) || 0;
    const selectedCourse = courses.find(c => c.id.toString() === courseForm.courseId);
    const monthsNum = selectedCourse ? Number(selectedCourse.months) || 0 : 0;
    setTotalFees(monthlyAmountNum * monthsNum);
  }, [courseForm.monthlyAmount, courseForm.courseId, courses]);

  // ========== LOAD ALL DATA ==========
  useEffect(() => {
    const loadAllData = () => {
      console.log('📂 Loading all data from Database...');
      setLoading(true);
      
      try {
        // Load courses
        const loadedCourses = courseDB.getAllCourses();
        console.log('📚 Courses found:', loadedCourses.length);
        setCourses(loadedCourses);
        
        // Load general fees
        const loadedGeneralFees = courseDB.getAllGeneralFees();
        console.log('💰 General fees found:', loadedGeneralFees.length);
        setGeneralFees(loadedGeneralFees);
        
        // Load course fees
        const loadedCourseFees = courseDB.getAllCourseFees();
        console.log('🎓 Course fees found:', loadedCourseFees.length);
        setCourseFees(loadedCourseFees);
        
        // Get database stats
        const stats = courseDB.getStats();
        console.log('📊 Database stats:', stats);
        setDbStats(stats);
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();

    // Auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      loadAllData();
      console.log('🔄 Auto-refresh data');
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, []);

  // ========== UPDATE COURSE FEE IN DATABASE ==========
  const updateCourseFeeInDatabase = (courseId, newMonthlyAmount) => {
    console.log(`🔄 Updating course ${courseId} monthly fee to: ${newMonthlyAmount}`);
    
    try {
      // Update course in database
      const success = courseDB.updateCourse(courseId, { 
        fees: Number(newMonthlyAmount) 
      });
      
      if (success) {
        // Update local state
        setCourses(courseDB.getAllCourses());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating course fee:', error);
      return false;
    }
  };

  // ========== DATA INTEGRITY CHECK ==========
  const cleanupOrphanedFees = () => {
    console.log('🔍 Checking for orphaned fees...');
    
    try {
      const validation = courseDB.validateData();
      
      if (validation.orphanedFees.length > 0) {
        console.log(`Found ${validation.orphanedFees.length} orphaned fees:`, validation.orphanedFees);
        
        if (window.confirm(`Found ${validation.orphanedFees.length} orphaned fees (courses not found). Do you want to clean them up?`)) {
          validation.orphanedFees.forEach(fee => {
            courseDB.deleteCourseFee(fee.id);
          });
          
          // Refresh data
          setCourseFees(courseDB.getAllCourseFees());
          setDbStats(courseDB.getStats());
          alert(`✅ Removed ${validation.orphanedFees.length} orphaned fees`);
        }
      } else {
        alert('✅ No orphaned fees found. All data is clean!');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert('❌ Error during cleanup');
    }
  };

  // ========== GENERAL FEES FUNCTIONS ==========
  const openGeneralModal = () => {
    console.log('📝 Opening general fee modal');
    setGeneralForm({
      feeName: '',
      amount: '',
      description: ''
    });
    setShowGeneralModal(true);
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveGeneralFee = (e) => {
    e.preventDefault();
    console.log('💾 Saving general fee:', generalForm);
    
    if (!generalForm.feeName || !generalForm.amount) {
      alert('Please enter fee name and amount');
      return;
    }

    try {
      const feeData = {
        feeName: generalForm.feeName,
        amount: Number(generalForm.amount),
        description: generalForm.description
      };

      // Save to database
      const newFee = courseDB.addGeneralFee(feeData);
      
      if (newFee) {
        // Update state
        setGeneralFees(courseDB.getAllGeneralFees());
        setDbStats(courseDB.getStats());
        
        alert(`✅ "${generalForm.feeName}" fee added successfully!\n\nNote: This fee will now appear in New Admission page.`);
        
        // Reset form and close modal
        setGeneralForm({
          feeName: '',
          amount: '',
          description: ''
        });
        setShowGeneralModal(false);
      } else {
        alert('❌ Failed to save fee. Please try again.');
      }
    } catch (error) {
      console.error('Error saving general fee:', error);
      alert('❌ Error saving fee');
    }
  };

  const deleteGeneralFee = (id) => {
    console.log('🗑️ Deleting general fee:', id);
    if (window.confirm('Are you sure you want to delete this fee?')) {
      try {
        courseDB.deleteGeneralFee(id);
        setGeneralFees(courseDB.getAllGeneralFees());
        setDbStats(courseDB.getStats());
        alert('✅ Fee deleted successfully!');
      } catch (error) {
        console.error('Error deleting general fee:', error);
        alert('❌ Error deleting fee');
      }
    }
  };

  // ========== COURSE FEES FUNCTIONS ==========
  const openCourseModal = (course = null) => {
    console.log('📝 Opening course fee modal for:', course);
    
    if (course) {
      // Editing existing course fee or setting fee for specific course
      const existingFee = courseDB.getCourseFeeByCourseId(course.id);
      
      if (existingFee) {
        // Editing existing fee
        setEditingCourseFee(existingFee);
        setCourseForm({
          courseId: existingFee.courseId.toString(),
          feeName: existingFee.feeName || 'Tuition Fee',
          monthlyAmount: existingFee.amount || '', // Changed from amount to monthlyAmount
          description: existingFee.description || ''
        });
      } else {
        // Setting new fee for this course
        setEditingCourseFee(null);
        setCourseForm({
          courseId: course.id.toString(),
          feeName: 'Tuition Fee',
          monthlyAmount: course.fees || '', // Changed from amount to monthlyAmount
          description: ''
        });
      }
    } else {
      // Adding new course fee (from Add button)
      setEditingCourseFee(null);
      
      // Set default course if available
      let defaultCourseId = '';
      let defaultMonthlyAmount = '';
      
      if (courses.length > 0) {
        defaultCourseId = courses[0].id.toString();
        defaultMonthlyAmount = courses[0].fees || '';
      }
      
      setCourseForm({
        courseId: defaultCourseId,
        feeName: 'Tuition Fee',
        monthlyAmount: defaultMonthlyAmount, // Changed from amount to monthlyAmount
        description: ''
      });
    }
    
    setShowCourseModal(true);
  };

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    
    setCourseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveCourseFee = (e) => {
    e.preventDefault();
    console.log('💾 Saving course fee:', courseForm);
    
    if (!courseForm.courseId || !courseForm.monthlyAmount) {
      alert('Please select a course and enter monthly amount');
      return;
    }

    try {
      const selectedCourse = courses.find(c => c.id.toString() === courseForm.courseId);
      if (!selectedCourse) {
        alert('Selected course not found!');
        return;
      }

      // Calculate total fees
      const monthlyAmountNum = Number(courseForm.monthlyAmount);
      const monthsNum = Number(selectedCourse.months) || 0;
      const totalCourseFees = monthlyAmountNum * monthsNum;

      const feeData = {
        courseId: courseForm.courseId,
        courseTitle: selectedCourse.title,
        feeName: courseForm.feeName,
        amount: monthlyAmountNum, // Store as monthly amount
        totalFees: totalCourseFees, // Add total fees field
        description: courseForm.description,
        months: monthsNum // Store duration for reference
      };

      // ✅ IMPORTANT: Update the course fee in the courses database
      const courseUpdateSuccess = updateCourseFeeInDatabase(courseForm.courseId, courseForm.monthlyAmount);
      
      if (!courseUpdateSuccess) {
        alert('❌ Failed to update course fee in Courses database');
        return;
      }

      if (editingCourseFee) {
        // Update existing fee
        const updated = courseDB.updateCourseFee(editingCourseFee.id, feeData);
        if (updated) {
          setCourseFees(courseDB.getAllCourseFees());
          setDbStats(courseDB.getStats());
          alert(`✅ Fee for "${selectedCourse.title}" updated successfully!\n\n• Monthly Fee: ₹${monthlyAmountNum.toLocaleString()}\n• Duration: ${monthsNum} months\n• Total Course Fees: ₹${totalCourseFees.toLocaleString()}`);
        } else {
          alert('❌ Failed to update fee. Please try again.');
          return;
        }
      } else {
        // Check if fee for this course already exists
        const existingFee = courseDB.getCourseFeeByCourseId(courseForm.courseId);
        if (existingFee) {
          alert(`A fee for "${selectedCourse.title}" already exists. Please edit the existing fee.`);
          return;
        }

        // Add new fee
        const newFee = courseDB.addCourseFee(feeData);
        if (newFee) {
          setCourseFees(courseDB.getAllCourseFees());
          setDbStats(courseDB.getStats());
          alert(`✅ Fee for "${selectedCourse.title}" added successfully!\n\n• Monthly Fee: ₹${monthlyAmountNum.toLocaleString()}\n• Duration: ${monthsNum} months\n• Total Course Fees: ₹${totalCourseFees.toLocaleString()}`);
        } else {
          alert('❌ Failed to add fee. Please try again.');
          return;
        }
      }
      
      // Reset form
      if (courses.length > 0) {
        setCourseForm({
          courseId: courses[0].id.toString(),
          feeName: 'Tuition Fee',
          monthlyAmount: courses[0].fees || '',
          description: ''
        });
      } else {
        setCourseForm({
          courseId: '',
          feeName: 'Tuition Fee',
          monthlyAmount: '',
          description: ''
        });
      }
      
      setEditingCourseFee(null);
      setShowCourseModal(false);
      
    } catch (error) {
      console.error('Error saving course fee:', error);
      alert('❌ Error saving course fee');
    }
  };

  const deleteCourseFee = (id) => {
    console.log('🗑️ Deleting course fee:', id);
    
    try {
      const feeToDelete = courseDB.getCourseFeeById(id);
      if (!feeToDelete) {
        alert('Fee not found!');
        return;
      }
      
      const course = courses.find(c => c.id.toString() === feeToDelete.courseId.toString());
      const courseName = course ? course.title : `Course ID: ${feeToDelete.courseId}`;
      
      if (window.confirm(`Are you sure you want to delete the fee for "${courseName}"?\n\nNote: This will NOT delete the course itself, only the fee record.`)) {
        courseDB.deleteCourseFee(id);
        
        // Refresh all data
        setCourseFees(courseDB.getAllCourseFees());
        setDbStats(courseDB.getStats());
        alert('✅ Course fee deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting course fee:', error);
      alert('❌ Error deleting course fee');
    }
  };

  // Helper function to find course by ID
  const findCourseById = (courseId) => {
    if (!courseId && courseId !== 0) {
      console.warn('findCourseById: courseId is undefined or null');
      return null;
    }
    
    const course = courses.find(course => {
      return course.id.toString() === courseId.toString();
    });
    
    return course || null;
  };

  // ========== DATABASE MANAGEMENT ==========
  const handleExportAll = () => {
    try {
      const exported = courseDB.exportAllData();
      if (exported) {
        alert(`✅ Database exported successfully!\n\nTotal: ${exported.courses.length} courses, ${exported.generalFees.length} general fees, ${exported.courseFees.length} course fees`);
      } else {
        alert('❌ Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('❌ Error exporting data');
    }
  };

  const handleImportAll = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (window.confirm(`Import "${file.name}"?\n\nThis will replace ALL current data.`)) {
        try {
          await courseDB.importAllData(file);
          
          // Reload all data
          setCourses(courseDB.getAllCourses());
          setGeneralFees(courseDB.getAllGeneralFees());
          setCourseFees(courseDB.getAllCourseFees());
          setDbStats(courseDB.getStats());
          
          alert('✅ Database imported successfully!');
        } catch (error) {
          alert('❌ Error importing file: ' + error.message);
        }
      }
    };
    
    input.click();
  };

  const handleRefreshData = () => {
    setCourses(courseDB.getAllCourses());
    setGeneralFees(courseDB.getAllGeneralFees());
    setCourseFees(courseDB.getAllCourseFees());
    setDbStats(courseDB.getStats());
    alert('🔄 Data refreshed from database!');
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>📂 Loading Database...</h2>
        <p>Please wait while we load your data</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#2c3e50',
        marginBottom: '10px'
      }}>
        💰 Permanent Fee Types Management
      </h1>
      <p style={{ 
        textAlign: 'center', 
        color: '#7f8c8d',
        marginBottom: '30px'
      }}>
        All data saved permanently - Auto-calculates total fees!
      </p>

      {/* Database Status */}
      <div style={{ 
        background: '#e0f2fe', 
        padding: '15px', 
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #7dd3fc'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>💾 Permanent Database</h3>
            <p style={{ margin: '0', color: '#0c4a6e' }}>
              <strong>Courses:</strong> {dbStats?.courses || 0} | 
              <strong> General Fees:</strong> {dbStats?.generalFees || 0} | 
              <strong> Course Fees:</strong> {dbStats?.courseFees || 0} | 
              <strong> Students:</strong> {dbStats?.students || 0}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRefreshData}
              style={{
                padding: '8px 16px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={cleanupOrphanedFees}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🧹 Cleanup
            </button>
            <button
              onClick={handleExportAll}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📤 Export All
            </button>
            <button
              onClick={handleImportAll}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📥 Import
            </button>
          </div>
        </div>
      </div>

      {/* Two Columns Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '30px',
        marginTop: '30px'
      }}>
        
        {/* LEFT COLUMN: Course-wise Fees */}
        <div style={{ 
          background: 'white', 
          borderRadius: '10px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <div>
              <h2 style={{ 
                margin: '0', 
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                🎓 Course-wise Fees
              </h2>
              <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
                Set monthly tuition fees for each course (Updates Courses page)
              </p>
            </div>
            <button
              onClick={() => openCourseModal()}
              style={{
                padding: '10px 20px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ➕ Add Course Fee
            </button>
          </div>

          {/* Courses List */}
          {courses.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              background: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666', fontSize: '16px' }}>
                📚 No courses available.
              </p>
              <p style={{ color: '#999', marginTop: '10px' }}>
                Add courses from Courses page first
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {/* Render all course fees */}
              {courseFees.map(fee => {
                const course = findCourseById(fee.courseId);
                
                // Handle missing course
                if (!course) {
                  return (
                    <div 
                      key={fee.id}
                      style={{
                        background: '#fee2e2',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #fca5a5'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px'
                      }}>
                        <span style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ⚠️ Course Missing
                        </span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => deleteCourseFee(fee.id)}
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                      
                      <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>
                        Course ID: {fee.courseId} (Not Found)
                      </h3>
                      
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: '#7f8c8d' }}>Fee Type:</span>
                          <span style={{ fontWeight: '500' }}>{fee.feeName}</span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: '#7f8c8d' }}>Monthly Fee:</span>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: '#dc2626'
                          }}>
                            ₹{fee.amount}
                          </span>
                        </div>
                        
                        <div style={{ 
                          marginTop: '10px',
                          padding: '8px',
                          background: '#fee2e2',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <p style={{ 
                            margin: '0', 
                            color: '#dc2626',
                            fontSize: '12px'
                          }}>
                            ℹ️ The associated course was not found. Click "Cleanup" button above to remove orphaned fees.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Calculate total fees for this course
                const monthlyAmount = Number(fee.amount) || 0;
                const months = Number(course.months) || 0;
                const totalCourseFees = monthlyAmount * months;
                
                // Normal rendering for valid course fee
                return (
                  <div 
                    key={fee.id}
                    style={{
                      background: '#f8fafc',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <span style={{
                        background: '#e3f2fd',
                        color: '#1565c0',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        🎓 Course Fee
                      </span>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => openCourseModal(course)}
                          style={{
                            background: '#fef3c7',
                            color: '#d97706',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteCourseFee(fee.id)}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    
                    <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
                      {course.title}
                    </h3>
                    
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      {/* Monthly Fee */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ color: '#7f8c8d' }}>Monthly Fee:</span>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: '#f59e0b',
                          fontSize: '16px'
                        }}>
                          ₹{monthlyAmount.toLocaleString()}/month
                        </span>
                      </div>
                      
                      {/* Duration */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#7f8c8d' }}>Duration:</span>
                        <span style={{ fontWeight: '500' }}>{months} months</span>
                      </div>
                      
                      {/* TOTAL COURSE FEES - HIGHLIGHTED */}
                      <div style={{ 
                        background: '#d1fae5',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '2px solid #10b981',
                        marginTop: '5px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ 
                            color: '#065f46',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            Total Course Fees:
                          </span>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: '#065f46',
                            fontSize: '20px'
                          }}>
                            ₹{totalCourseFees.toLocaleString()}
                          </span>
                        </div>
                        <div style={{ 
                          textAlign: 'center',
                          fontSize: '11px',
                          color: '#047857',
                          marginTop: '3px'
                        }}>
                          ({months} × ₹{monthlyAmount.toLocaleString()})
                        </div>
                      </div>
                      
                      {fee.description && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: '#7f8c8d' }}>Description:</span>
                          <span>{fee.description}</span>
                        </div>
                      )}
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#7f8c8d' }}>Status:</span>
                        <span style={{
                          background: course.admissionOpen ? '#d5f4e6' : '#ffeaea',
                          color: course.admissionOpen ? '#27ae60' : '#e74c3c',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {course.admissionOpen ? '✅ Open' : '❌ Closed'}
                        </span>
                      </div>
                      
                      <div style={{ 
                        marginTop: '10px',
                        padding: '8px',
                        background: '#e0f2fe',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <p style={{ 
                          margin: '0', 
                          color: '#0369a1',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ℹ️ Synced with Courses page
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Courses Without Fees */}
              {courses
                .filter(course => !courseFees.some(fee => fee.courseId == course.id))
                .map(course => {
                  // Calculate total fees for course without fee record
                  const monthlyAmount = Number(course.fees) || 0;
                  const months = Number(course.months) || 0;
                  const totalCourseFees = monthlyAmount * months;
                  
                  return (
                  <div 
                    key={course.id}
                    style={{
                      background: '#fef3c7',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '2px dashed #f59e0b'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <span style={{
                        background: '#fef3c7',
                        color: '#d97706',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ No Fee Set
                      </span>
                      <button
                        onClick={() => openCourseModal(course)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ➕ Set Fee
                      </button>
                    </div>
                    
                    <h3 style={{ margin: '0 0 15px 0', color: '#92400e' }}>
                      {course.title}
                    </h3>
                    
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {/* Current Monthly Fee */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#7f8c8d' }}>Monthly Fee:</span>
                        <span style={{ 
                          fontWeight: 'bold',
                          color: monthlyAmount ? '#f59e0b' : '#dc2626'
                        }}>
                          {monthlyAmount ? `₹${monthlyAmount}/month` : 'Not set'}
                        </span>
                      </div>
                      
                      {/* Duration */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#7f8c8d' }}>Duration:</span>
                        <span>{months} months</span>
                      </div>
                      
                      {/* Total Course Fees */}
                      {monthlyAmount > 0 && months > 0 && (
                        <div style={{ 
                          background: '#d1fae5',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #10b981'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between'
                          }}>
                            <span style={{ 
                              color: '#065f46',
                              fontWeight: 'bold',
                              fontSize: '13px'
                            }}>
                              Total Course Fees:
                            </span>
                            <span style={{ 
                              fontWeight: 'bold', 
                              color: '#065f46'
                            }}>
                              ₹{totalCourseFees.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#7f8c8d' }}>Status:</span>
                        <span style={{
                          background: course.admissionOpen ? '#d5f4e6' : '#ffeaea',
                          color: course.admissionOpen ? '#27ae60' : '#e74c3c',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {course.admissionOpen ? '✅ Open' : '❌ Closed'}
                        </span>
                      </div>
                      
                      <div style={{ 
                        marginTop: '10px',
                        padding: '8px',
                        background: '#fffbeb',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <p style={{ 
                          margin: '0', 
                          color: '#92400e',
                          fontSize: '12px'
                        }}>
                          Click "Set Fee" to add tuition fee. This will update course in Courses page.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: General Fee Types */}
        <div style={{ 
          background: 'white', 
          borderRadius: '10px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <div>
              <h2 style={{ 
                margin: '0', 
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                💵 General Fee Types
              </h2>
              <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
                Manage admission, exam, and other fees (Available in New Admission)
              </p>
            </div>
            <button
              onClick={openGeneralModal}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ➕ Add General Fee
            </button>
          </div>

          {/* General Fees List */}
          {generalFees.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              background: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666', fontSize: '16px' }}>
                💰 No general fee types added yet
              </p>
              <p style={{ color: '#999', marginTop: '5px', fontSize: '14px' }}>
                These fees will appear in New Admission page
              </p>
              <button
                onClick={openGeneralModal}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#10b981',
                  border: '2px solid #10b981',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Add First General Fee
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {generalFees.map(fee => (
                <div 
                  key={fee.id}
                  style={{
                    background: '#f0f9ff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <span style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      💵 General Fee
                    </span>
                    <button
                      onClick={() => deleteGeneralFee(fee.id)}
                      style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  
                  <h3 style={{ margin: '0 0 15px 0', color: '#0369a1' }}>
                    {fee.feeName}
                  </h3>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#7f8c8d' }}>Amount:</span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: '#27ae60',
                        fontSize: '18px'
                      }}>
                        ₹{fee.amount}
                      </span>
                    </div>
                    
                    {fee.description && (
                      <div>
                        <span style={{ color: '#7f8c8d' }}>Description:</span>
                        <p style={{ 
                          margin: '5px 0 0 0',
                          color: '#475569',
                          fontSize: '14px'
                        }}>
                          {fee.description}
                        </p>
                      </div>
                    )}
                    
                    <div style={{ 
                      marginTop: '10px',
                      padding: '8px',
                      background: '#d5f4e6',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <p style={{ 
                        margin: '0', 
                        color: '#065f46',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ✅ Available in New Admission
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* General Fee Modal */}
      {showGeneralModal && (
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
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowGeneralModal(false)}
        >
          <div 
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: '0', color: '#2c3e50' }}>➕ Add General Fee</h2>
              <button
                onClick={() => setShowGeneralModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={saveGeneralFee}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    Fee Name *
                  </label>
                  <input
                    type="text"
                    name="feeName"
                    placeholder="e.g., Admission Fee, Exam Fee, Library Fee"
                    value={generalForm.feeName}
                    onChange={handleGeneralChange}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter amount"
                    value={generalForm.amount}
                    onChange={handleGeneralChange}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="Short description"
                    value={generalForm.description}
                    onChange={handleGeneralChange}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ 
                  padding: '12px',
                  background: '#e0f2fe',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <p style={{ 
                    margin: '0', 
                    color: '#0369a1',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}>
                    ℹ️ Note: This fee will be available in New Admission page for student enrollment.
                  </p>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '15px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowGeneralModal(false)}
                  style={{
                    padding: '12px 25px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 25px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px'
                  }}
                >
                  ✅ Add Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Fee Modal */}
      {showCourseModal && (
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
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => {
            setShowCourseModal(false);
            setEditingCourseFee(null);
          }}
        >
          <div 
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: '0', color: '#2c3e50' }}>
                {editingCourseFee ? '✏️ Edit Course Fee' : '🎓 Add Course Fee'}
              </h2>
              <button
                onClick={() => {
                  setShowCourseModal(false);
                  setEditingCourseFee(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={saveCourseFee}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    Select Course *
                  </label>
                  <select
                    name="courseId"
                    value={courseForm.courseId}
                    onChange={handleCourseChange}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      background: 'white'
                    }}
                    required
                    disabled={editingCourseFee !== null}
                  >
                    <option value="">-- Select a Course --</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title} - {course.months} months
                      </option>
                    ))}
                  </select>
                  {editingCourseFee && (
                    <p style={{ 
                      margin: '5px 0 0 0', 
                      color: '#666',
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      Note: Course cannot be changed when editing existing fee.
                    </p>
                  )}
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    Fee Type *
                  </label>
                  <input
                    type="text"
                    name="feeName"
                    value={courseForm.feeName}
                    onChange={handleCourseChange}
                    placeholder="e.g., Tuition Fee"
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    Monthly Fee (₹) *
                  </label>
                  <input
                    type="number"
                    name="monthlyAmount"
                    placeholder="Enter monthly fee"
                    value={courseForm.monthlyAmount}
                    onChange={handleCourseChange}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                
                {/* Auto-calculated Total Fees Display */}
                {courseForm.courseId && courseForm.monthlyAmount && (
                  <div style={{ 
                    background: '#d1fae5',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '2px solid #10b981'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '5px'
                    }}>
                      <span style={{ color: '#065f46', fontWeight: 'bold' }}>Course Duration:</span>
                      <span>{courses.find(c => c.id.toString() === courseForm.courseId)?.months || 0} months</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '5px'
                    }}>
                      <span style={{ color: '#065f46', fontWeight: 'bold' }}>Monthly Fee:</span>
                      <span>₹{Number(courseForm.monthlyAmount).toLocaleString()}/month</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '2px solid #10b981'
                    }}>
                      <span style={{ color: '#065f46', fontWeight: 'bold', fontSize: '16px' }}>Total Course Fees:</span>
                      <span style={{ 
                        color: '#065f46', 
                        fontWeight: 'bold', 
                        fontSize: '20px'
                      }}>
                        ₹{totalFees.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ 
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#047857',
                      marginTop: '5px'
                    }}>
                      ({courses.find(c => c.id.toString() === courseForm.courseId)?.months || 0} × ₹{Number(courseForm.monthlyAmount).toLocaleString()})
                    </div>
                  </div>
                )}
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g., Course tuition fee"
                    value={courseForm.description}
                    onChange={handleCourseChange}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ 
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <p style={{ 
                    margin: '0', 
                    color: '#92400e',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}>
                    ⚠️ Important: This will update the course fee in Courses page as well!
                  </p>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '15px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseModal(false);
                    setEditingCourseFee(null);
                  }}
                  style={{
                    padding: '12px 25px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 25px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px'
                  }}
                >
                  {editingCourseFee ? '✅ Update Fee' : '✅ Add Course Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px',
        background: '#f0f9ff',
        borderRadius: '10px',
        border: '1px solid #bae6fd'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#0369a1' }}>
          📋 Permanent Database Features
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>🧮 Auto-Calculated Total Fees</h4>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b' }}>
              <li><strong>Total Fees = Monthly Fee × Duration</strong></li>
              <li>Example: ₹3000/month × 3 months = ₹9000 total</li>
              <li>Auto-calculated when adding/editing</li>
              <li>Displayed clearly in course cards</li>
            </ul>
          </div>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>💾 Data Safety</h4>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b' }}>
              <li><strong>Auto-save:</strong> Every 30 seconds automatically</li>
              <li><strong>Multiple backups:</strong> 4 storage locations</li>
              <li><strong>Page close protection:</strong> Auto-save before unload</li>
              <li><strong>URL backup:</strong> Emergency restore from URL</li>
            </ul>
          </div>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>📁 Backup & Restore</h4>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#64748b' }}>
              <li><strong>Export All:</strong> Download complete database</li>
              <li><strong>Import All:</strong> Restore from backup file</li>
              <li><strong>Refresh:</strong> Force reload from database</li>
              <li><strong>Sync:</strong> Real-time updates with Courses page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesType;