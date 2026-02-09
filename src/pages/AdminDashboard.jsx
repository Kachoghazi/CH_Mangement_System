import React from "react";

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div className="row">
        <div className="col-lg-3 col-6">
          <div className="small-box bg-info">
            <div className="inner">
              <h3>150</h3>
              <p>Students</p>
            </div>
            <div className="icon">
              <i className="fas fa-user-graduate"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
