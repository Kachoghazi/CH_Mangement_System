import React, { useEffect, useState } from "react";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("students_data")) || [
      { 
        id: 1, 
        studentName: "Shazia", 
        fatherName: "Kkk", 
        dob: "2005-05-12", 
        phone: "0355443428", 
        course: "Web Development", 
        admissionDate: "2025-01-01", 
        address: "Karachi, Pakistan", 
        status: "Active",
        email: "shazia@example.com"
      },
      { 
        id: 2, 
        studentName: "Shazia DDD", 
        fatherName: "Kkk", 
        dob: "2006-03-15", 
        phone: "0355443428", 
        course: "Graphics Design", 
        admissionDate: "2025-02-10", 
        address: "Lahore, Pakistan", 
        status: "Active",
        email: "shazia.ddd@example.com"
      },
      { 
        id: 3, 
        studentName: "Arifa", 
        fatherName: "G", 
        dob: "2004-11-22", 
        phone: "03117880000", 
        course: "Python", 
        admissionDate: "2025-01-15", 
        address: "Islamabad, Pakistan", 
        status: "Active",
        email: "arifa@example.com"
      }
    ];
    setStudents(saved);
  }, []);

  const handleEdit = (id) => {
    alert("Edit student with ID: " + id);
  };

  const handleDelete = (id) => {
    const studentToDelete = students.find(s => s.id === id);
    if (window.confirm(`Are you sure you want to delete ${studentToDelete?.studentName}? This action cannot be undone.`)) {
      const updated = students.filter((s) => s.id !== id);
      setStudents(updated);
      localStorage.setItem("students_data", JSON.stringify(updated));
      alert("Student deleted successfully!");
    }
  };

  const handleViewDetails = (student) => {
    alert(`Student Details:\n\nName: ${student.studentName}\nFather: ${student.fatherName}\nCourse: ${student.course}\nStatus: ${student.status}\nPhone: ${student.phone}\nEmail: ${student.email || 'N/A'}\nAddress: ${student.address}`);
  };

  // Filter students based on search and status
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="student-list">
      <div className="list-header">
        <h2>📋 Student Directory</h2>
        <div className="header-actions">
          <span className="student-count">
            Total Students: <strong>{students.length}</strong>
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="list-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, father, course, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>

        <div className="filters">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="table-container">
        <table className="student-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Name</th>
              <th>Father</th>
              <th>Course</th>
              <th>Phone</th>
              <th>Admission Date</th>
              <th>Address</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No students found</p>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => (
                <tr key={student.id} className="student-row">
                  <td className="serial">{index + 1}</td>
                  <td>
                    <span className="id-badge">{student.id}</span>
                  </td>
                  <td className="student-name-cell">
                    <div className="student-avatar">👤</div>
                    <div>
                      <div className="name">{student.studentName}</div>
                      {student.email && (
                        <div className="student-email">{student.email}</div>
                      )}
                    </div>
                  </td>
                  <td>{student.fatherName}</td>
                  <td>
                    <span className="course-tag">{student.course}</span>
                  </td>
                  <td className="phone-cell">
                    <a href={`tel:${student.phone}`} className="phone-link">
                      📞 {student.phone}
                    </a>
                  </td>
                  <td>{student.admissionDate}</td>
                  <td className="address-cell">{student.address}</td>
                  <td>
                    <span className={`status-badge status-${student.status.toLowerCase()}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="action-buttons">
                      <button
                        className="btn-edit action-btn"
                        onClick={() => handleEdit(student.id)}
                        title="Edit Student"
                      >
                        <span className="btn-icon">✏️</span>
                        <span className="btn-text">Edit</span>
                      </button>
                      <button
                        className="btn-delete action-btn"
                        onClick={() => handleDelete(student.id)}
                        title="Delete Student"
                      >
                        <span className="btn-icon">🗑️</span>
                        <span className="btn-text">Delete</span>
                      </button>
                      <button
                        className="btn-view action-btn"
                        onClick={() => handleViewDetails(student)}
                        title="View Details"
                      >
                        <span className="btn-icon">👁️</span>
                        <span className="btn-text">View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {filteredStudents.length > 0 && (
        <div className="table-footer">
          <div className="table-summary">
            Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          <div className="table-actions">
            <button className="btn-refresh" onClick={() => window.location.reload()}>
              ↻ Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;