// components/ContactSelector.jsx
import React, { useState } from 'react';
import './ContactSelector.css';

const ContactSelector = ({ selectedContacts, onContactsChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customNumber, setCustomNumber] = useState('');

  // Mock data - replace with API call
  const contactGroups = {
    students: [
      { id: 1, name: 'Rahul Sharma', phone: '+911234567890', class: '10A' },
      { id: 2, name: 'Priya Patel', phone: '+911234567891', class: '10A' },
      { id: 3, name: 'Amit Kumar', phone: '+911234567892', class: '10B' },
    ],
    parents: [
      { id: 4, name: 'Mr. Sharma', phone: '+911234567893', student: 'Rahul' },
      { id: 5, name: 'Mrs. Patel', phone: '+911234567894', student: 'Priya' },
      { id: 6, name: 'Mr. Kumar', phone: '+911234567895', student: 'Amit' },
    ],
  };

  const handleAddContact = (contact) => {
    if (!selectedContacts.some(c => c.id === contact.id)) {
      onContactsChange([...selectedContacts, contact]);
    }
  };

  const handleRemoveContact = (id) => {
    onContactsChange(selectedContacts.filter(contact => contact.id !== id));
  };

  const handleAddCustom = () => {
    if (customNumber && customNumber.length >= 10) {
      const newContact = {
        id: Date.now(),
        name: `Custom - ${customNumber}`,
        phone: customNumber,
        custom: true
      };
      onContactsChange([...selectedContacts, newContact]);
      setCustomNumber('');
    }
  };

  const filteredStudents = contactGroups.students.filter(
    student => student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParents = contactGroups.parents.filter(
    parent => parent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="contact-selector">
      <h3>Select Recipients</h3>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Custom Number Input */}
      <div className="custom-number-section">
        <div className="input-group">
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={customNumber}
            onChange={(e) => setCustomNumber(e.target.value)}
            className="custom-input"
          />
          <button 
            onClick={handleAddCustom}
            disabled={!customNumber || customNumber.length < 10}
            className="add-btn"
          >
            Add
          </button>
        </div>
      </div>

      {/* Contact Groups */}
      <div className="contact-groups">
        <div className="group">
          <h4>Students ({filteredStudents.length})</h4>
          <div className="contact-list">
            {filteredStudents.map(student => (
              <div key={student.id} className="contact-item">
                <input
                  type="checkbox"
                  checked={selectedContacts.some(c => c.id === student.id)}
                  onChange={() => 
                    selectedContacts.some(c => c.id === student.id)
                      ? handleRemoveContact(student.id)
                      : handleAddContact(student)
                  }
                />
                <div className="contact-info">
                  <span className="contact-name">{student.name}</span>
                  <span className="contact-detail">Class: {student.class}</span>
                </div>
                <span className="contact-phone">{student.phone}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="group">
          <h4>Parents ({filteredParents.length})</h4>
          <div className="contact-list">
            {filteredParents.map(parent => (
              <div key={parent.id} className="contact-item">
                <input
                  type="checkbox"
                  checked={selectedContacts.some(c => c.id === parent.id)}
                  onChange={() => 
                    selectedContacts.some(c => c.id === parent.id)
                      ? handleRemoveContact(parent.id)
                      : handleAddContact(parent)
                  }
                />
                <div className="contact-info">
                  <span className="contact-name">{parent.name}</span>
                  <span className="contact-detail">Parent of: {parent.student}</span>
                </div>
                <span className="contact-phone">{parent.phone}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="selected-contacts">
          <h4>Selected ({selectedContacts.length})</h4>
          <div className="selected-list">
            {selectedContacts.map(contact => (
              <div key={contact.id} className="selected-item">
                <span>{contact.name}</span>
                <button 
                  onClick={() => handleRemoveContact(contact.id)}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSelector;