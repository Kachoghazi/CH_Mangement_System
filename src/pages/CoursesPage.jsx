// pages/CoursesPage.jsx - UPDATED VERSION
import React, { useState, useEffect } from "react";
import courseDB from "../utils/courseDatabase";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [dbStats, setDbStats] = useState(null);

  const [form, setForm] = useState({
    title: "",
    months: "",
    fees: "",
    admissionOpen: true,
    isPromoted: false,
  });

  // Calculate total fees when months or fees change
  const [totalFees, setTotalFees] = useState(0);

  useEffect(() => {
    const monthsNum = Number(form.months) || 0;
    const feesNum = Number(form.fees) || 0;
    setTotalFees(monthsNum * feesNum);
  }, [form.months, form.fees]);

  // Load courses from database
  useEffect(() => {
    const loadCourses = () => {
      setLoading(true);
      const loadedCourses = courseDB.getAllCourses();
      console.log("📚 Loaded courses from DB:", loadedCourses.length);
      setCourses(loadedCourses);
      setDbStats(courseDB.getStats());
      setLoading(false);
    };

    loadCourses();

    // Auto-save on page unload
    const handleBeforeUnload = () => {
      console.log("💾 Auto-saving before page close...");
      courseDB.saveAll();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      courseDB.saveAll();
      setDbStats(courseDB.getStats());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!form.title.trim()) {
      alert("Please enter course title");
      return;
    }

    const monthsNum = Number(form.months);
    const feesNum = Number(form.fees);

    if (isNaN(monthsNum) || monthsNum <= 0) {
      alert("Please enter valid duration (positive number)");
      return;
    }

    if (isNaN(feesNum) || feesNum < 0) {
      alert("Please enter valid fee amount");
      return;
    }

    // Calculate total fees
    const calculatedTotalFees = monthsNum * feesNum;

    const courseData = {
      title: form.title.trim(),
      months: monthsNum,
      fees: feesNum,
      totalFees: calculatedTotalFees, // Add totalFees field
      admissionOpen: form.admissionOpen,
      isPromoted: form.isPromoted,
    };

    if (editingCourseId) {
      // Update course
      const updated = courseDB.updateCourse(editingCourseId, courseData);
      if (updated) {
        setCourses(courseDB.getAllCourses());
        setDbStats(courseDB.getStats());
        alert("✅ Course updated successfully!");
      }
      setEditingCourseId(null);
    } else {
      // Add new course
      const newCourse = courseDB.addCourse(courseData);
      setCourses(courseDB.getAllCourses());
      setDbStats(courseDB.getStats());
      alert(`✅ Course "${newCourse.title}" added successfully!\n\nTotal Fees: ₹${calculatedTotalFees.toLocaleString()} (${monthsNum} months × ₹${feesNum.toLocaleString()})`);
    }

    // Reset form
    setForm({
      title: "",
      months: "",
      fees: "",
      admissionOpen: true,
      isPromoted: false,
    });
    setShowForm(false);
  };

  const handleEdit = (course) => {
    setForm({
      title: course.title,
      months: course.months.toString(),
      fees: course.fees.toString(),
      admissionOpen: course.admissionOpen,
      isPromoted: course.isPromoted,
    });
    setEditingCourseId(course.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this course?\n\nThis cannot be undone!")) {
      courseDB.deleteCourse(id);
      setCourses(courseDB.getAllCourses());
      setDbStats(courseDB.getStats());
      alert("✅ Course deleted successfully!");
    }
  };

  // Styles
  const styles = {
    page: { 
      padding: "20px", 
      fontFamily: "Arial, sans-serif", 
      maxWidth: "1200px", 
      margin: "auto",
      background: "#f8fafc",
      minHeight: "100vh"
    },
    header: { 
      color: "#1e293b",
      marginBottom: "15px"
    },
    button: {
      background: "#3b82f6",
      color: "#fff",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      margin: "5px"
    },
    dangerButton: {
      background: "#dc2626",
      color: "#fff",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      margin: "5px"
    },
    successButton: {
      background: "#10b981",
      color: "#fff",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      margin: "5px"
    },
    form: { 
      background: "#ffffff", 
      padding: "25px", 
      borderRadius: "12px", 
      marginBottom: "25px", 
      border: "2px solid #e5e7eb", 
      maxWidth: "500px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    input: { 
      width: "100%", 
      padding: "12px", 
      marginBottom: "15px", 
      borderRadius: "8px", 
      border: "2px solid #cbd5e1",
      fontSize: "16px"
    },
    coursesGrid: { 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
      gap: "25px",
      marginTop: "20px"
    },
    card: { 
      background: "#ffffff", 
      padding: "20px", 
      borderRadius: "12px", 
      border: "2px solid #e5e7eb",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      position: "relative"
    },
    totalFeesBox: {
      background: "#f0fdf4",
      border: "2px solid #bbf7d0",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "15px",
      textAlign: "center"
    },
    monthFeesBox: {
      background: "#fef3c7",
      border: "2px solid #fcd34d",
      borderRadius: "8px",
      padding: "8px",
      marginBottom: "10px",
      fontSize: "14px"
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <h2>📚 Loading courses...</h2>
        <p>Please wait while we load your data from database.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 5px 0", color: "#1e293b" }}>📚 Permanent Courses Database</h1>
        <p style={{ margin: "0", color: "#64748b" }}>Data saved permanently - Auto-calculates total fees!</p>
      </div>

      {/* Database Stats */}
      <div style={{ 
        background: "#e0f2fe", 
        padding: "15px", 
        borderRadius: "10px", 
        marginBottom: "20px",
        border: "1px solid #7dd3fc"
      }}>
        <div>
          <h3 style={{ margin: "0 0 10px 0", color: "#0369a1" }}>💾 Database Status</h3>
          <p style={{ margin: "0", color: "#0c4a6e" }}>
            <strong>Courses:</strong> {dbStats?.totalCourses || 0} | 
            <strong> Last Saved:</strong> {dbStats?.lastUpdated || 'Never'} | 
            <strong> Auto-save:</strong> Every 30 seconds
          </p>
        </div>
      </div>

      {/* Add New Course Button */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setShowForm(true)} style={styles.button}>
          ➕ Add New Course
        </button>
      </div>

      {/* Course Form */}
      {showForm && (
        <form style={styles.form} onSubmit={handleSubmit}>
          <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>
            {editingCourseId ? "✏️ Edit Course" : "📝 Add New Course"}
          </h3>
          
          <input
            type="text"
            name="title"
            placeholder="Course Title *"
            value={form.title}
            onChange={handleChange}
            required
            style={styles.input}
          />
          
          <div>
            <input
              type="number"
              name="months"
              placeholder="Duration (Months) *"
              value={form.months}
              onChange={handleChange}
              required
              min="1"
              style={styles.input}
            />
            
            <input
              type="number"
              name="fees"
              placeholder="Monthly Fees (₹) *"
              value={form.fees}
              onChange={handleChange}
              required
              min="0"
              style={styles.input}
            />

            {/* Auto-calculated Total Fees Display */}
            {form.months && form.fees && (
              <div style={styles.totalFeesBox}>
                <div style={{ fontSize: "13px", color: "#374151", marginBottom: "5px" }}>
                  🧮 Auto-calculated Total Course Fees:
                </div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#10b981" }}>
                  ₹{totalFees.toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "5px" }}>
                  ({form.months} months × ₹{Number(form.fees).toLocaleString()} per month)
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input 
                type="checkbox" 
                name="admissionOpen" 
                checked={form.admissionOpen} 
                onChange={handleChange}
                style={{ width: "18px", height: "18px" }}
              />
              ✅ Admission Open
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input 
                type="checkbox" 
                name="isPromoted" 
                checked={form.isPromoted} 
                onChange={handleChange}
                style={{ width: "18px", height: "18px" }}
              />
              ⭐ Promoted Course
            </label>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => setShowForm(false)} style={styles.dangerButton}>
              ❌ Cancel
            </button>
            <button type="submit" style={styles.successButton}>
              {editingCourseId ? "💾 Update Course" : "💾 Save Course"}
            </button>
          </div>
        </form>
      )}

      {/* Courses List */}
      <div>
        <h2 style={{ color: "#475569", marginBottom: "15px" }}>
          📋 All Courses ({courses.length})
          {courses.length === 0 && (
            <span style={{ color: "#dc2626", fontSize: "14px", marginLeft: "10px" }}>
              (No courses yet. Add your first course!)
            </span>
          )}
        </h2>
        
        {courses.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px 20px", 
            background: "#ffffff",
            borderRadius: "12px",
            border: "2px dashed #cbd5e1"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>📚</div>
            <h3 style={{ margin: "0 0 10px 0", color: "#64748b" }}>
              No courses in database
            </h3>
            <p style={{ margin: "0 0 20px 0", color: "#94a3b8" }}>
              Your database is empty. Add your first course.
            </p>
            <button
              style={{ ...styles.button, background: "#3b82f6" }}
              onClick={() => setShowForm(true)}
            >
              ➕ Add First Course
            </button>
          </div>
        ) : (
          <div style={styles.coursesGrid}>
            {courses.map((course) => {
              // Calculate total fees for display
              const courseTotalFees = course.totalFees || (course.months * course.fees);
              
              return (
                <div key={course.id} style={styles.card}>
                  {/* Promoted Badge */}
                  {course.isPromoted && (
                    <div style={{
                      position: "absolute",
                      top: "-10px",
                      right: "15px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "white",
                      padding: "5px 15px",
                      borderRadius: "15px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                    }}>
                      ⭐ Promoted
                    </div>
                  )}
                  
                  <h3 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "18px" }}>
                    {course.title}
                  </h3>
                  
                  <div style={{ marginBottom: "15px" }}>
                    {/* Monthly Fees */}
                    <div style={styles.monthFeesBox}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Monthly Fees:</span>
                        <span style={{ fontWeight: "bold", color: "#92400e" }}>
                          ₹{course.fees.toLocaleString()}/month
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#78350f" }}>
                        <span>Duration:</span>
                        <span>{course.months} months</span>
                      </div>
                    </div>
                    
                    {/* Total Course Fees */}
                    <div style={styles.totalFeesBox}>
                      <div style={{ fontSize: "14px", color: "#374151", marginBottom: "5px" }}>
                        Total Course Fees:
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
                        ₹{courseTotalFees.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "5px" }}>
                        ({course.months} × ₹{course.fees.toLocaleString()})
                      </div>
                    </div>
                    
                    {/* Admission Status */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "10px"
                    }}>
                      <span style={{ color: "#475569" }}>
                        <strong>Admission:</strong>
                      </span>
                      <span style={{
                        background: course.admissionOpen ? "#d1fae5" : "#fee2e2",
                        color: course.admissionOpen ? "#065f46" : "#991b1b",
                        padding: "6px 15px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}>
                        {course.admissionOpen ? "✅ Open" : "❌ Closed"}
                      </span>
                    </div>
                    
                    {/* Created Date */}
                    <div style={{ 
                      margin: "10px 0 0 0", 
                      color: "#94a3b8", 
                      fontSize: "11px",
                      textAlign: "center",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "10px"
                    }}>
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                      onClick={() => handleEdit(course)}
                      style={{ ...styles.button, background: "#f59e0b", flex: 1 }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(course.id)}
                      style={{ ...styles.button, background: "#dc2626", flex: 1 }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: "40px", 
        padding: "20px", 
        background: "#f0f9ff", 
        borderRadius: "12px",
        border: "1px solid #bae6fd"
      }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#0369a1" }}>✅ How This Permanent Database Works</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#475569" }}>🧮 Auto-Calculated Fees</h4>
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#64748b", fontSize: "14px" }}>
              <li><strong>Total Fees = Duration × Monthly Fees</strong></li>
              <li>Example: 3 months × ₹3000 = ₹9000 total</li>
              <li>Auto-calculated when adding/editing</li>
              <li>Displayed clearly in course cards</li>
            </ul>
          </div>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#475569" }}>💾 Permanent Storage</h4>
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#64748b", fontSize: "14px" }}>
              <li><strong>Auto-save:</strong> Every 30 seconds automatically</li>
              <li><strong>Multiple backups:</strong> 4 different storage locations</li>
              <li><strong>Before page close:</strong> Auto-save on tab close</li>
              <li><strong>URL backup:</strong> Data saved in URL as emergency</li>
            </ul>
          </div>
          <div>
            <h4 style={{ margin: "0 0 10px 0", color: "#475569" }}>📁 Backup & Restore</h4>
            <ul style={{ margin: "0", paddingLeft: "20px", color: "#64748b", fontSize: "14px" }}>
              <li><strong>Data is saved automatically</strong> in your browser</li>
              <li>Use same browser for consistency</li>
              <li>Close browser properly (don't force quit)</li>
              <li>Database is permanent until browser cache is cleared</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;