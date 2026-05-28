import React from 'react';

export function TaskCard({ task, onMove, onDelete, nextText }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

  return (
    <div style={{ 
      background: 'white', 
      padding: '15px', 
      borderRadius: '8px', 
      marginBottom: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderLeft: isOverdue ? '4px solid #ff5252' : '4px solid #4CAF50'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{task.title}</h4>
        <button onClick={onDelete} style={{ color: '#ccc', cursor: 'pointer', border: 'none', background: 'none', fontSize: '18px' }}>
          ×
        </button>
      </div>
      
      {task.description && (
        <p style={{ fontSize: '13px', color: '#666', margin: '5px 0' }}>{task.description}</p>
      )}

      {task.deadline && (
        <div style={{ 
          fontSize: '11px', 
          marginTop: '10px',
          color: isOverdue ? '#ff5252' : '#999',
          fontWeight: isOverdue ? 'bold' : 'normal'
        }}>
          ⏱ {new Date(task.deadline).toLocaleDateString()}
        </div>
      )}

      {nextText && (
        <button 
          onClick={onMove} 
          style={{ 
            marginTop: '12px', 
            width: '100%', 
            padding: '6px', 
            cursor: 'pointer', 
            fontSize: '12px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          {nextText}
        </button>
      )}
    </div>
  );
}