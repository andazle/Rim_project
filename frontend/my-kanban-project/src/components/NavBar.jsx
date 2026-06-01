import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUser } from '../api';

/**
 * Верхняя панель навигации, общая для всех внутренних страниц
 * (Доска, Дэшборд, Интерактивная схема) с кнопкой выхода.
 */
export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const links = [
    { to: '/kanban', label: 'Доска' },
    { to: '/dashboard', label: 'Дэшборд' },
    { to: '/scheme', label: 'Схема' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 24px',
        background: '#ffffff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <span style={{ fontWeight: 'bold', fontSize: '18px', marginRight: '20px' }}>
        Project 17
      </span>

      {links.map((link) => {
        const active = location.pathname === link.to;
        return (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              background: active ? '#007bff' : '#f0f2f5',
              color: active ? 'white' : '#333',
            }}
          >
            {link.label}
          </button>
        );
      })}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#666', fontSize: '14px' }}>{currentUser}</span>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

export default NavBar;
