import React, { useState } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPlus,
  cilSearch,
  cilPrint,
  cilSend,
  cilMoney,
  cilCalendar,
} from '@coreui/icons';

const Payments = () => {
  const [payments, setPayments] = useState([
    {
      id: 'PYT-001',
      student: 'Ali Ahmed',
      studentId: 'CH2023-001',
      course: 'Full Stack Development',
      amount: 'PKR 15,000',
      date: '2023-11-01',
      method: 'Bank Transfer',
      status: 'Completed',
      receiptNo: 'RCT-2023-001'
    },
    {
      id: 'PYT-002',
      student: 'Fatima Khan',
      studentId: 'CH2023-012',
      course: 'Python Programming',
      amount: 'PKR 10,000',
      date: '2023-11-05',
      method: 'Cash',
      status: 'Completed',
      receiptNo: 'RCT-2023-002'
    },
    {
      id: 'PYT-003',
      student: 'Bilal Hussain',
      studentId: 'CH2023-023',
      course: 'Graphic Design',
      amount: 'PKR 8,000',
      date: '2023-11-10',
      method: 'JazzCash',
      status: 'Pending',
      receiptNo: 'RCT-2023-003'
    }
  ]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getMethodIcon = (method) => {
    switch(method) {
      case 'Bank Transfer': return '🏦';
      case 'Cash': return '💵';
      case 'JazzCash': return '📱';
      case 'EasyPaisa': return '📱';
      default: return '💳';
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + parseInt(p.amount.replace(/[^\d]/g, '')), 0);

  const formatCurrency = (amount) => {
    return `PKR ${amount.toLocaleString('en-PK')}`;
  };

  return (
    <CContainer fluid>
      <CRow className="mb-4">
        <CCol>
          <h3>Payment Management</h3>
        </CCol>
        <CCol className="text-end">
          <CButton color="primary" onClick={() => setShowPaymentModal(true)}>
            <CIcon icon={cilPlus} className="me-2" />
            Record Payment
          </CButton>
        </CCol>
      </CRow>

      {/* Payment Stats */}
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="text-center bg-primary text-white">
            <CCardBody>
              <div className="fs-3 fw-bold">{formatCurrency(totalRevenue)}</div>
              <div>Total Collected</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center bg-success text-white">
            <CCardBody>
              <div className="fs-3 fw-bold">{payments.filter(p => p.status === 'Completed').length}</div>
              <div>Successful Payments</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center bg-warning text-white">
            <CCardBody>
              <div className="fs-3 fw-bold">{payments.filter(p => p.status === 'Pending').length}</div>
              <div>Pending Payments</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard className="text-center bg-info text-white">
            <CCardBody>
              <div className="fs-3 fw-bold">PKR 84,500</div>
              <div>Outstanding Amount</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Search and Filter */}
      <CRow className="mb-4">
        <CCol md={6}>
          <CFormInput
            placeholder="Search payments by student name, ID, or receipt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CCol>
        <CCol md={3}>
          <CFormSelect>
            <option>All Payment Methods</option>
            <option>Cash</option>
            <option>Bank Transfer</option>
            <option>JazzCash</option>
            <option>EasyPaisa</option>
          </CFormSelect>
        </CCol>
        <CCol md={3}>
          <CFormSelect>
            <option>All Status</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Failed</option>
          </CFormSelect>
        </CCol>
      </CRow>

      {/* Payments Table */}
      <CCard>
        <CCardHeader>
          <strong>Recent Payments</strong>
        </CCardHeader>
        <CCardBody>
          <CTable responsive hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Payment ID</CTableHeaderCell>
                <CTableHeaderCell>Student</CTableHeaderCell>
                <CTableHeaderCell>Course</CTableHeaderCell>
                <CTableHeaderCell>Amount</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell>Method</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Receipt No.</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {payments.map((payment) => (
                <CTableRow key={payment.id}>
                  <CTableDataCell>
                    <strong>{payment.id}</strong>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div>{payment.student}</div>
                    <small className="text-muted">{payment.studentId}</small>
                  </CTableDataCell>
                  <CTableDataCell>{payment.course}</CTableDataCell>
                  <CTableDataCell className="fw-bold text-success">
                    {payment.amount}
                  </CTableDataCell>
                  <CTableDataCell>{payment.date}</CTableDataCell>
                  <CTableDataCell>
                    <span className="me-2">{getMethodIcon(payment.method)}</span>
                    {payment.method}
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={getStatusBadge(payment.status)}>
                      {payment.status}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <strong>{payment.receiptNo}</strong>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CButton size="sm" color="info" className="me-2">
                      <CIcon icon={cilPrint} />
                    </CButton>
                    <CButton size="sm" color="success" className="me-2">
                      <CIcon icon={cilSend} />
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Record Payment Modal */}
      <CModal visible={showPaymentModal} onClose={() => setShowPaymentModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Record New Payment</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormSelect label="Select Student">
                  <option>Select Student</option>
                  <option>Ali Ahmed (CH2023-001)</option>
                  <option>Fatima Khan (CH2023-012)</option>
                  <option>Bilal Hussain (CH2023-023)</option>
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormInput label="Course" value="Full Stack Development" readOnly />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput label="Total Course Fee" value="PKR 45,000" readOnly />
              </CCol>
              <CCol md={6}>
                <CFormInput label="Paid Amount" value="PKR 15,000" readOnly />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput label="Balance Due" value="PKR 30,000" readOnly />
              </CCol>
              <CCol md={6}>
                <CFormInput 
                  label="Payment Amount" 
                  placeholder="Enter payment amount"
                  type="number"
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormSelect label="Payment Method">
                  <option>Select Payment Method</option>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>JazzCash</option>
                  <option>EasyPaisa</option>
                  <option>Credit Card</option>
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormInput 
                  label="Transaction ID/Reference" 
                  placeholder="Enter transaction reference"
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormInput 
                  type="date" 
                  label="Payment Date" 
                  value={new Date().toISOString().split('T')[0]}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary">Record Payment</CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default Payments;