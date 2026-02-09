// utils/courseDatabase.js - COMPLETE WORKING VERSION
const courseDB = {
  // ====================
  // 1. COURSE FUNCTIONS
  // ====================
  getAllCourses() {
    try {
      const courses = JSON.parse(localStorage.getItem('courses') || '[]');
      return Array.isArray(courses) ? courses : [];
    } catch (error) {
      return [];
    }
  },

  getCourseById(courseId) {
    const courses = this.getAllCourses();
    return courses.find(c => c.id === courseId) || null;
  },

  addCourse(courseData) {
    try {
      const courses = this.getAllCourses();
      const newCourse = {
        id: `course_${Date.now()}`,
        ...courseData,
        createdAt: new Date().toISOString()
      };
      courses.push(newCourse);
      localStorage.setItem('courses', JSON.stringify(courses));
      return newCourse;
    } catch (error) {
      return null;
    }
  },

  updateCourse(courseId, courseData) {
    try {
      const courses = this.getAllCourses();
      const index = courses.findIndex(c => c.id === courseId);
      if (index >= 0) {
        courses[index] = {
          ...courses[index],
          ...courseData,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('courses', JSON.stringify(courses));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  deleteCourse(courseId) {
    try {
      const courses = this.getAllCourses();
      const updatedCourses = courses.filter(c => c.id !== courseId);
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      return true;
    } catch (error) {
      return false;
    }
  },

  // ======================
  // 2. GENERAL FEE FUNCTIONS
  // ======================
  getAllGeneralFees() {
    try {
      const fees = JSON.parse(localStorage.getItem('generalFees') || '[]');
      return fees.map(fee => ({
        ...fee,
        feeName: fee.feeName || "Unnamed Fee",
        amount: Number(fee.amount) || 0
      }));
    } catch (error) {
      return [];
    }
  },

  getGeneralFeeById(feeId) {
    const fees = this.getAllGeneralFees();
    return fees.find(f => f.id === feeId) || null;
  },

  addGeneralFee(feeData) {
    try {
      const fees = this.getAllGeneralFees();
      const newFee = {
        id: `fee_${Date.now()}`,
        ...feeData,
        createdAt: new Date().toISOString()
      };
      fees.push(newFee);
      localStorage.setItem('generalFees', JSON.stringify(fees));
      return newFee;
    } catch (error) {
      return null;
    }
  },

  updateGeneralFee(feeId, feeData) {
    try {
      const fees = this.getAllGeneralFees();
      const index = fees.findIndex(f => f.id === feeId);
      if (index >= 0) {
        fees[index] = {
          ...fees[index],
          ...feeData,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('generalFees', JSON.stringify(fees));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  deleteGeneralFee(feeId) {
    try {
      const fees = this.getAllGeneralFees();
      const updatedFees = fees.filter(f => f.id !== feeId);
      localStorage.setItem('generalFees', JSON.stringify(updatedFees));
      return true;
    } catch (error) {
      return false;
    }
  },

  // ======================
  // 3. COURSE FEE FUNCTIONS
  // ======================
  getAllCourseFees() {
    try {
      const courseFees = JSON.parse(localStorage.getItem('courseFees') || '[]');
      return courseFees.map(fee => ({
        ...fee,
        feeName: fee.feeName || "Tuition Fee",
        amount: Number(fee.amount) || 0,
        courseId: fee.courseId || '',
        courseTitle: fee.courseTitle || ''
      }));
    } catch (error) {
      return [];
    }
  },

  getCourseFeeByCourseId(courseId) {
    const courseFees = this.getAllCourseFees();
    return courseFees.find(fee => fee.courseId == courseId) || null;
  },

  getCourseFeeById(feeId) {
    const courseFees = this.getAllCourseFees();
    return courseFees.find(fee => fee.id == feeId) || null;
  },

  addCourseFee(feeData) {
    try {
      const courseFees = this.getAllCourseFees();
      
      // Check if fee for this course already exists
      const existingFee = courseFees.find(fee => fee.courseId == feeData.courseId);
      if (existingFee) {
        console.warn('Course fee already exists for this course:', feeData.courseId);
        return null;
      }
      
      const newFee = {
        id: `coursefee_${Date.now()}`,
        ...feeData,
        createdAt: new Date().toISOString()
      };
      courseFees.push(newFee);
      localStorage.setItem('courseFees', JSON.stringify(courseFees));
      return newFee;
    } catch (error) {
      console.error('Error adding course fee:', error);
      return null;
    }
  },

  updateCourseFee(feeId, feeData) {
    try {
      const courseFees = this.getAllCourseFees();
      const index = courseFees.findIndex(f => f.id == feeId);
      if (index >= 0) {
        courseFees[index] = {
          ...courseFees[index],
          ...feeData,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('courseFees', JSON.stringify(courseFees));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating course fee:', error);
      return false;
    }
  },

  deleteCourseFee(feeId) {
    try {
      const courseFees = this.getAllCourseFees();
      const updatedCourseFees = courseFees.filter(f => f.id !== feeId);
      localStorage.setItem('courseFees', JSON.stringify(updatedCourseFees));
      console.log('✅ Course fee deleted:', feeId);
      return true;
    } catch (error) {
      console.error('Error deleting course fee:', error);
      return false;
    }
  },

  // ======================
  // 4. STUDENT FUNCTIONS
  // ======================
  getAllStudents() {
    try {
      const students = JSON.parse(localStorage.getItem('students') || '[]');
      return students;
    } catch (error) {
      return [];
    }
  },

  getStudentById(studentId) {
    const students = this.getAllStudents();
    return students.find(s => s.studentId === studentId) || null;
  },

  addStudent(studentData) {
    try {
      const students = this.getAllStudents();
      const existingIndex = students.findIndex(s => s.studentId === studentData.studentId);
      
      if (existingIndex >= 0) {
        students[existingIndex] = {
          ...students[existingIndex],
          ...studentData,
          updatedAt: new Date().toISOString()
        };
      } else {
        students.push({
          ...studentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem('students', JSON.stringify(students));
      return true;
    } catch (error) {
      return false;
    }
  },

  deleteStudent(studentId) {
    try {
      const students = this.getAllStudents();
      const updatedStudents = students.filter(s => s.studentId !== studentId);
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      return true;
    } catch (error) {
      return false;
    }
  },

  // ======================
  // 5. DATABASE MANAGEMENT
  // ======================
  exportAllData() {
    try {
      const courses = this.getAllCourses();
      const generalFees = this.getAllGeneralFees();
      const courseFees = this.getAllCourseFees();
      const students = this.getAllStudents();
      
      const allData = {
        courses,
        generalFees,
        courseFees,
        students,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      // Create download link
      const dataStr = JSON.stringify(allData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `course_database_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      return allData;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  },

  importAllData(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            
            // Validate imported data
            if (!data.courses || !Array.isArray(data.courses)) {
              throw new Error('Invalid data format: courses array not found');
            }
            
            // Save all data to localStorage
            localStorage.setItem('courses', JSON.stringify(data.courses || []));
            localStorage.setItem('generalFees', JSON.stringify(data.generalFees || []));
            localStorage.setItem('courseFees', JSON.stringify(data.courseFees || []));
            localStorage.setItem('students', JSON.stringify(data.students || []));
            
            resolve(data);
          } catch (parseError) {
            reject(new Error('Invalid JSON file: ' + parseError.message));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
  },

  // ======================
  // 6. STATISTICS FUNCTION
  // ======================
  getStats() {
    try {
      const courses = this.getAllCourses();
      const generalFees = this.getAllGeneralFees();
      const courseFees = this.getAllCourseFees();
      const students = this.getAllStudents();
      
      const totalCourseRevenue = students.reduce((sum, student) => sum + (Number(student.totalFee) || 0), 0);
      const totalPaid = students.reduce((sum, student) => sum + (Number(student.feePaid) || 0), 0);
      const totalDue = totalCourseRevenue - totalPaid;
      
      return {
        courses: courses.length,
        generalFees: generalFees.length,
        courseFees: courseFees.length,
        students: students.length,
        totalCourseRevenue,
        totalPaid,
        totalDue,
        collectionRate: totalCourseRevenue > 0 ? ((totalPaid / totalCourseRevenue) * 100).toFixed(1) : 0
      };
    } catch (error) {
      return {
        courses: 0,
        generalFees: 0,
        courseFees: 0,
        students: 0,
        totalCourseRevenue: 0,
        totalPaid: 0,
        totalDue: 0,
        collectionRate: 0
      };
    }
  },

  // ======================
  // 7. UTILITY FUNCTIONS
  // ======================
  saveAll(dataType, data) {
    try {
      localStorage.setItem(dataType, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  },

  // ======================
  // 8. INITIALIZATION
  // ======================
  initializeDefaultData() {
    try {
      // Initialize courses if empty
      let courses = this.getAllCourses();
      if (courses.length === 0) {
        const defaultCourses = [
          { 
            id: "course_1", 
            title: "Web Development", 
            fees: 15000, 
            months: 6, 
            description: "Full stack web development",
            category: "technology",
            admissionOpen: true
          },
          { 
            id: "course_2", 
            title: "Graphic Design", 
            fees: 12000, 
            months: 4, 
            description: "Adobe Photoshop and Illustrator",
            category: "design",
            admissionOpen: true
          }
        ];
        localStorage.setItem('courses', JSON.stringify(defaultCourses));
      }
      
      // Initialize general fees if empty
      let fees = this.getAllGeneralFees();
      if (fees.length === 0) {
        const defaultFees = [
          { id: "fee_1", feeName: "Registration Fee", amount: 1000, category: "admission" },
          { id: "fee_2", feeName: "Exam Fee", amount: 500, category: "exam" },
          { id: "fee_3", feeName: "Certificate Fee", amount: 800, category: "certificate" }
        ];
        localStorage.setItem('generalFees', JSON.stringify(defaultFees));
      }
      
      // Initialize course fees if empty
      let courseFees = this.getAllCourseFees();
      if (courseFees.length === 0) {
        // Create course fees from existing courses
        courses = this.getAllCourses();
        const defaultCourseFees = courses.map(course => ({
          id: `coursefee_${course.id}`,
          courseId: course.id,
          courseTitle: course.title,
          feeName: 'Tuition Fee',
          amount: course.fees || 0,
          description: course.description || '',
          createdAt: new Date().toISOString()
        }));
        localStorage.setItem('courseFees', JSON.stringify(defaultCourseFees));
      }
      
      // Initialize students if empty
      if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify([]));
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing default data:', error);
      return false;
    }
  },

  // ======================
  // 9. DATA VALIDATION
  // ======================
  validateData() {
    const courses = this.getAllCourses();
    const courseFees = this.getAllCourseFees();
    
    // Check for orphaned course fees
    const orphanedFees = courseFees.filter(fee => {
      return !courses.some(course => course.id == fee.courseId);
    });
    
    return {
      isValid: orphanedFees.length === 0,
      orphanedFees,
      totalCourses: courses.length,
      totalCourseFees: courseFees.length
    };
  }
};

// Auto-initialize default data
courseDB.initializeDefaultData();

export default courseDB;