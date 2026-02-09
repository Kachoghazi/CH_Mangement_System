// utils/courseDatabase.js
class CourseDatabase {
  constructor() {
    this.storageKey = 'course_database_v2';
    this.backupKey = 'course_backup';
    this.courses = this.loadCourses();
    
    // Window close hone se pehle save
    window.addEventListener('beforeunload', () => this.saveAll());
  }

  // Database main save karein
  saveAll() {
    try {
      // Main storage
      localStorage.setItem(this.storageKey, JSON.stringify(this.courses));
      
      // Backup storage
      localStorage.setItem(this.backupKey, JSON.stringify(this.courses));
      
      // Session storage (short term)
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.courses));
      
      // URL main bhi save (emergency backup)
      if (this.courses.length > 0) {
        const encoded = btoa(encodeURIComponent(JSON.stringify(this.courses)));
        if (encoded.length < 2000) { // URL length limit
          history.replaceState({}, '', `?backup=${encoded}`);
        }
      }
      
      console.log('💾 Database saved:', this.courses.length, 'courses');
      return true;
    } catch (error) {
      console.error('Save error:', error);
      return false;
    }
  }

  // Database se load karein
  loadCourses() {
    try {
      // Try multiple sources
      let data = localStorage.getItem(this.storageKey);
      
      if (!data) {
        // Try backup
        data = localStorage.getItem(this.backupKey);
      }
      
      if (!data) {
        // Try session storage
        data = sessionStorage.getItem(this.storageKey);
      }
      
      if (!data) {
        // Try URL backup
        const urlParams = new URLSearchParams(window.location.search);
        const backup = urlParams.get('backup');
        if (backup) {
          data = decodeURIComponent(atob(backup));
        }
      }
      
      if (data) {
        const parsed = JSON.parse(data);
        console.log('📂 Database loaded:', parsed.length, 'courses');
        return Array.isArray(parsed) ? parsed : [];
      }
      
      console.log('📂 Database: No data found');
      return [];
    } catch (error) {
      console.error('Load error:', error);
      return [];
    }
  }

  // Course add karein
  addCourse(course) {
    const newCourse = {
      ...course,
      id: Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.courses.push(newCourse);
    this.saveAll();
    return newCourse;
  }

  // Course update karein
  updateCourse(id, updatedData) {
    const index = this.courses.findIndex(c => c.id === id);
    if (index !== -1) {
      this.courses[index] = {
        ...this.courses[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      this.saveAll();
      return this.courses[index];
    }
    return null;
  }

  // Course delete karein
  deleteCourse(id) {
    this.courses = this.courses.filter(c => c.id !== id);
    this.saveAll();
    return true;
  }

  // Saare courses get karein
  getAllCourses() {
    return [...this.courses];
  }

  // Export courses as file
  exportCourses() {
    const data = JSON.stringify(this.courses, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return this.courses.length;
  }

  // Import courses from file
  importCourses(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            this.courses = imported;
            this.saveAll();
            resolve(this.courses.length);
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  // Database clear karein
  clearDatabase() {
    this.courses = [];
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.backupKey);
    sessionStorage.removeItem(this.storageKey);
    return true;
  }

  // Database stats
  getStats() {
    return {
      totalCourses: this.courses.length,
      lastUpdated: this.courses.length > 0 
        ? new Date(this.courses[0].updatedAt || this.courses[0].createdAt).toLocaleString()
        : 'Never',
      storageUsed: JSON.stringify(this.courses).length
    };
  }
}

// Single instance create karein
const courseDB = new CourseDatabase();
export default courseDB;