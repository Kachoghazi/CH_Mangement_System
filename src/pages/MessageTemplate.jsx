// components/MessageTemplate.jsx
import React, { useState } from 'react';
import './MessageTemplate.css';

const MessageTemplate = ({ onSelectTemplate, templates }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [variables, setVariables] = useState({});

  const templateConfig = {
    attendance: [
      { key: 'name', label: 'Parent Name', placeholder: 'Parent Name' },
      { key: 'student', label: 'Student Name', placeholder: 'Student Name' },
      { key: 'status', label: 'Status', placeholder: 'Present/Absent' }
    ],
    fee: [
      { key: 'month', label: 'Month', placeholder: 'January 2024' },
      { key: 'amount', label: 'Amount', placeholder: '5000' },
      { key: 'date', label: 'Due Date', placeholder: '15th January' }
    ],
    exam: [
      { key: 'class', label: 'Class', placeholder: '10th Grade' },
      { key: 'details', label: 'Exam Details', placeholder: 'Maths: 20th Jan, Science: 22nd Jan' }
    ],
    event: [
      { key: 'eventName', label: 'Event Name', placeholder: 'Annual Day' },
      { key: 'date', label: 'Date', placeholder: '25th January' },
      { key: 'time', label: 'Time', placeholder: '5:00 PM' }
    ],
    holiday: [
      { key: 'date', label: 'Holiday Date', placeholder: '26th January' },
      { key: 'occasion', label: 'Occasion', placeholder: 'Republic Day' },
      { key: 'resumeDate', label: 'Classes Resume', placeholder: '27th January' }
    ]
  };

  const handleTemplateClick = (key) => {
    setSelectedTemplate(key);
    const initialVars = {};
    templateConfig[key]?.forEach(field => {
      initialVars[field.key] = '';
    });
    setVariables(initialVars);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, variables);
    }
  };

  return (
    <div className="message-templates">
      <h4>Quick Templates</h4>
      <div className="template-buttons">
        {Object.keys(templates).map(key => (
          <button
            key={key}
            className={`template-btn ${selectedTemplate === key ? 'active' : ''}`}
            onClick={() => handleTemplateClick(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <div className="variables-form">
          <h5>Fill Details:</h5>
          {templateConfig[selectedTemplate]?.map(field => (
            <div key={field.key} className="variable-input">
              <label>{field.label}:</label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={variables[field.key] || ''}
                onChange={(e) => 
                  setVariables({...variables, [field.key]: e.target.value})
                }
              />
            </div>
          ))}
          <button 
            className="apply-btn"
            onClick={handleApply}
            disabled={!selectedTemplate}
          >
            Apply Template
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageTemplate;