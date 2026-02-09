import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Eye, Edit, Trash2, DollarSign, 
  Phone, Book, Calendar, User, MapPin, 
  GraduationCap, AlertCircle
} from "lucide-react";

const StudentList = ({ 
  students = [], 
  setStudents, 
  onEditStudent,
  onCollectFees,
  systemSettings = {}
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [viewingStudent, setViewingStudent] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Filter and sort students
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch = 
        student.name?.toLowerCase().includes(search.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        student.course?.toLowerCase().includes(search.toLowerCase()) ||
        student.phone?.includes(search);
      
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "paid" && (student.feePaid || 0) >= (student.totalFee || 0)) ||
        (filterStatus === "unpaid" && (student.feePaid || 0) === 0) ||
        (filterStatus === "partial" && (student.feePaid || 0) > 0 && (student.feePaid || 0) < (student.totalFee || 0));
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name?.localeCompare(b.name);
        case "date":
          return new Date(b.admissionDate) - new Date(a.admissionDate);
        case "fee":
          return (b.totalFee || 0) - (a.totalFee || 0);
        case "due":
          return ((b.totalFee || 0) - (b.feePaid || 0)) - ((a.totalFee || 0) - (a.feePaid || 0));
        default:
          return 0;
      }
    });

  // Delete student
  const handleDelete = (studentId) => {
    if (window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      const updatedStudents = students.filter(s => s.studentId !== studentId);
      setStudents(updatedStudents);
      
      // Also remove related fees
      const fees = JSON.parse(localStorage.getItem("studentFees") || "[]");
      const updatedFees = fees.filter(f => f.studentId !== studentId);
      localStorage.setItem("studentFees", JSON.stringify(updatedFees));
    }
  };

  // Handle collect fees - with safety check
  const handleCollectFeesClick = (student) => {
    console.log("Collect fees clicked for:", student.name);
    
    if (typeof onCollectFees === 'function') {
      onCollectFees(student);
    } else {
      // Fallback if function not provided
      localStorage.setItem('currentStudentForFees', JSON.stringify(student));
      navigate(`/collect-fees?studentId=${student.studentId}`);
    }
  };

  // Handle edit student
  const handleEditClick = (student) => {
    if (typeof onEditStudent === 'function') {
      onEditStudent(student);
    } else {
      // Fallback if function not provided
      localStorage.setItem('editingStudent', JSON.stringify(student));
      navigate("/new-admission");
    }
  };

  // Calculate fee summary
  const calculateFeeSummary = (student) => {
    const totalFee = Number(student.totalFee) || 0;
    const paid = Number(student.feePaid) || 0;
    const due = Math.max(0, totalFee - paid);
    const percentage = totalFee > 0 ? Math.round((paid / totalFee) * 100) : 0;
    
    return { totalFee, paid, due, percentage };
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `${systemSettings.currency || '₹'}${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  // Modal component
  const StudentDetailModal = ({ student, onClose }) => {
    const summary = calculateFeeSummary(student);
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="modal-header">
            <div>
              <h2 className="modal-title">Student Details</h2>
              <p className="modal-subtitle">
                Complete information about {student.name}
              </p>
            </div>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {/* Student Info Grid */}
            <div className="info-grid">
              <div className="info-card">
                <div className="info-label">Student ID</div>
                <div className="info-value">{student.studentId}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Student Name</div>
                <div className="info-value">{student.name}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Father's Name</div>
                <div className="info-value">{student.fatherName || "N/A"}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Date of Birth</div>
                <div className="info-value">{student.dob || "N/A"}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Phone Number</div>
                <div className="info-value">{student.phone || "N/A"}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Email</div>
                <div className="info-value">{student.email || "N/A"}</div>
              </div>
            </div>

            {/* Course Information */}
            <div className="section">
              <h3 className="section-title">
                <Book size={20} />
                Course Information
              </h3>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-label">Course Name</div>
                  <div className="info-value">{student.course}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Admission Date</div>
                  <div className="info-value">{student.admissionDate}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Duration</div>
                  <div className="info-value">{student.duration || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Fee Information */}
            <div className="section">
              <h3 className="section-title">
                <DollarSign size={20} />
                Fee Information
              </h3>
              
              {/* Fee Breakdown */}
              {student.selectedFeeTypes && student.selectedFeeTypes.length > 0 ? (
                <div className="fee-breakdown">
                  {student.selectedFeeTypes.map((fee, index) => (
                    <div key={index} className="fee-item">
                      <div className="fee-name">{fee.feeName}</div>
                      <div className="fee-amount">{formatCurrency(fee.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fee-item">
                  <div className="fee-name">Course Fee</div>
                  <div className="fee-amount">{formatCurrency(student.totalFee)}</div>
                </div>
              )}

              {/* Fee Summary */}
              <div className="fee-summary">
                <div className="summary-row">
                  <span>Total Course Fee:</span>
                  <strong>{formatCurrency(summary.totalFee)}</strong>
                </div>
                <div className="summary-row">
                  <span>Amount Paid:</span>
                  <strong style={{ color: "#10b981" }}>{formatCurrency(summary.paid)}</strong>
                </div>
                <div className="summary-row">
                  <span>Remaining Due:</span>
                  <strong style={{ 
                    color: summary.due === 0 ? "#10b981" : 
                           summary.due === summary.totalFee ? "#ef4444" : "#f59e0b"
                  }}>
                    {formatCurrency(summary.due)}
                  </strong>
                </div>
                
                {/* Progress Bar */}
                <div className="progress-section">
                  <div className="progress-label">
                    Payment Progress: {summary.percentage}%
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${summary.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            {student.address && (
              <div className="section">
                <h3 className="section-title">
                  <MapPin size={20} />
                  Address
                </h3>
                <div className="address-card">
                  {student.address}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleCollectFeesClick(student);
                  onClose();
                }}
              >
                <DollarSign size={18} />
                Collect Fees
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  handleEditClick(student);
                  onClose();
                }}
              >
                <Edit size={18} />
                Edit Student
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(`Delete ${student.name}?`)) {
                    handleDelete(student.studentId);
                    onClose();
                  }
                }}
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="student-list-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student List</h1>
          <p className="page-subtitle">
            Manage all student records and fee payments
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{students.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Fees</div>
            <div className="stat-value">
              {formatCurrency(students.reduce((sum, s) => sum + (s.totalFee || 0), 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, ID, course, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Students</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          
          <select 
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date (Newest)</option>
            <option value="fee">Sort by Fee (High to Low)</option>
            <option value="due">Sort by Due (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Details</th>
              <th>Course</th>
              <th>Fee Status</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <AlertCircle size={48} />
                  <p>No students found</p>
                  <p className="empty-subtitle">
                    {search ? 'Try a different search term' : 'Add your first student using New Admission'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => {
                const summary = calculateFeeSummary(student);
                
                return (
                  <tr key={student.studentId}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="student-info">
                        <div className="student-name">{student.name}</div>
                        <div className="student-meta">
                          <span className="student-id">ID: {student.studentId}</span>
                          <span className="student-date">
                            <Calendar size={12} /> {student.admissionDate}
                          </span>
                        </div>
                        {student.fatherName && (
                          <div className="student-father">
                            Father: {student.fatherName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="course-info">
                        <Book size={16} />
                        <span>{student.course}</span>
                      </div>
                    </td>
                    <td>
                      <div className="fee-status">
                        <div className="fee-amounts">
                          <span className="fee-total">{formatCurrency(summary.totalFee)}</span>
                          <span className="fee-separator">→</span>
                          <span className={`fee-paid ${summary.due === 0 ? 'paid' : ''}`}>
                            {formatCurrency(summary.paid)}
                          </span>
                        </div>
                        <div className="fee-progress">
                          <div className="progress-bar-small">
                            <div 
                              className="progress-fill-small"
                              style={{ width: `${summary.percentage}%` }}
                            />
                          </div>
                          <span className="fee-due">
                            Due: {formatCurrency(summary.due)}
                          </span>
                        </div>
                        <div className={`status-badge ${
                          summary.due === 0 ? 'status-paid' :
                          summary.due === summary.totalFee ? 'status-unpaid' : 'status-partial'
                        }`}>
                          {summary.due === 0 ? 'Paid' : 
                           summary.due === summary.totalFee ? 'Unpaid' : 'Partial'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-phone">
                          <Phone size={14} />
                          {student.phone || "N/A"}
                        </div>
                        {student.email && (
                          <div className="contact-email">
                            {student.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => setViewingStudent(student)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditClick(student)}
                          title="Edit Student"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="action-btn fee-btn"
                          onClick={() => handleCollectFeesClick(student)}
                          title="Collect Fees"
                        >
                          <DollarSign size={18} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(student.studentId)}
                          title="Delete Student"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Student Count */}
      <div className="table-footer">
        <div className="student-count">
          Showing {filteredStudents.length} of {students.length} students
        </div>
        {students.length > 0 && (
          <div className="fee-summary-total">
            <span>Total Fees Due:</span>
            <strong>
              {formatCurrency(filteredStudents.reduce((sum, s) => {
                const total = s.totalFee || 0;
                const paid = s.feePaid || 0;
                return sum + Math.max(0, total - paid);
              }, 0))}
            </strong>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {viewingStudent && (
        <StudentDetailModal 
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
        />
      )}

      <style jsx>{`
        .student-list-container {
          padding: 20px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .page-subtitle {
          color: #64748b;
          margin-top: 8px;
          font-size: 16px;
        }

        .header-stats {
          display: flex;
          gap: 15px;
        }

        .stat-card {
          background: white;
          padding: 15px 25px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          min-width: 150px;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          padding: 12px 20px;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          flex: 1;
          max-width: 400px;
        }

        .search-input {
          border: none;
          background: transparent;
          font-size: 16px;
          width: 100%;
          outline: none;
          color: #1e293b;
        }

        .filters {
          display: flex;
          gap: 15px;
        }

        .filter-select {
          padding: 12px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          background: white;
          cursor: pointer;
          outline: none;
        }

        .table-wrapper {
          background: white;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .students-table {
          width: 100%;
          border-collapse: collapse;
        }

        .students-table thead {
          background: #f1f5f9;
          border-bottom: 2px solid #e2e8f0;
        }

        .students-table th {
          padding: 18px 20px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .students-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s;
        }

        .students-table tbody tr:hover {
          background: #f8fafc;
        }

        .students-table td {
          padding: 20px;
          vertical-align: top;
        }

        .student-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .student-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 16px;
        }

        .student-meta {
          display: flex;
          gap: 15px;
          font-size: 13px;
          color: #64748b;
        }

        .student-father {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }

        .course-info {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #475569;
          font-weight: 500;
        }

        .fee-status {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .fee-amounts {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fee-total {
          color: #64748b;
          font-size: 14px;
          text-decoration: line-through;
        }

        .fee-separator {
          color: #94a3b8;
        }

        .fee-paid {
          color: #10b981;
          font-weight: 600;
          font-size: 16px;
        }

        .fee-paid.paid {
          color: #059669;
        }

        .fee-progress {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .progress-bar-small {
          flex: 1;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill-small {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: 3px;
        }

        .fee-due {
          font-size: 13px;
          color: #ef4444;
          font-weight: 600;
          min-width: 100px;
          text-align: right;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          width: fit-content;
        }

        .status-paid {
          background: #d1fae5;
          color: #065f46;
        }

        .status-partial {
          background: #fef3c7;
          color: #92400e;
        }

        .status-unpaid {
          background: #fee2e2;
          color: #dc2626;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .contact-phone {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 14px;
        }

        .contact-email {
          color: #64748b;
          font-size: 13px;
          word-break: break-all;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
        }

        .view-btn {
          background: #f1f5f9;
          color: #475569;
        }

        .view-btn:hover {
          background: #e2e8f0;
          transform: translateY(-2px);
        }

        .edit-btn {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .edit-btn:hover {
          background: #bfdbfe;
          transform: translateY(-2px);
        }

        .fee-btn {
          background: #d1fae5;
          color: #065f46;
        }

        .fee-btn:hover {
          background: #a7f3d0;
          transform: translateY(-2px);
        }

        .delete-btn {
          background: #fee2e2;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #fecaca;
          transform: translateY(-2px);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .empty-state svg {
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-subtitle {
          margin-top: 10px;
          font-size: 14px;
          color: #94a3b8;
        }

        .table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: white;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }

        .student-count {
          color: #64748b;
          font-size: 14px;
        }

        .fee-summary-total {
          font-size: 16px;
          color: #1e293b;
        }

        .fee-summary-total strong {
          color: #ef4444;
          margin-left: 10px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 25px 30px;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .modal-subtitle {
          margin: 5px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 30px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .info-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .info-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 16px;
          color: #1e293b;
          font-weight: 600;
        }

        .section {
          margin-bottom: 30px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }

        .fee-breakdown {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 25px;
        }

        .fee-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f1f5f9;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .fee-name {
          font-weight: 600;
          color: #475569;
        }

        .fee-amount {
          font-weight: 700;
          color: #1d4ed8;
          font-size: 16px;
        }

        .fee-summary {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 25px;
          border-radius: 16px;
          color: white;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .progress-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .progress-label {
          margin-bottom: 10px;
          font-size: 14px;
          color: #cbd5e1;
        }

        .progress-bar {
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #3b82f6);
          border-radius: 5px;
        }

        .address-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          white-space: pre-line;
          line-height: 1.6;
          color: #1e293b;
          font-size: 15px;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          margin-top: 30px;
          justify-content: center;
        }

        .btn {
          padding: 12px 25px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 2px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
          transform: translateY(-2px);
        }

        .btn-danger {
          background: #fee2e2;
          color: #dc2626;
          border: 2px solid #fecaca;
        }

        .btn-danger:hover {
          background: #fecaca;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          
          .header-stats {
            width: 100%;
          }
          
          .controls-bar {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-box {
            max-width: 100%;
          }
          
          .filters {
            flex-direction: column;
          }
          
          .action-buttons {
            flex-wrap: wrap;
          }
          
          .modal-content {
            width: 95%;
            margin: 10px;
          }
          
          .modal-actions {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentList;