import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // URL бэкенда Андрея (проверь порт!)
            const response = await axios.post('http://127.0.0.1:8000/api/register/', formData);
            alert('Регистрация успешна!');
            navigate('/login'); // Переходим на вход после успеха
        } catch (error) {
            console.error('Ошибка регистрации:', error.response?.data);
            alert('Ошибка: ' + JSON.stringify(error.response?.data));
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
            <h2>Регистрация (Project 17)</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Имя пользователя" 
                    onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    required 
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Пароль" 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    required 
                />
                <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Создать аккаунт</button>
            </form>
        </div>
    );
};

export default Register;