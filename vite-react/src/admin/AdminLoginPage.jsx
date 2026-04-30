import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import knsLogo from '../assets/images/knslogo.png';
import huleImg from '../assets/images/HULE.png';
import Swal from 'sweetalert2';
import './admincss/adminlogin.css';

const ADMIN_ACCOUNTS = {
    [import.meta.env.VITE_ADMIN_AVR0_USERNAME]: {
        password: import.meta.env.VITE_ADMIN_AVR0_PASSWORD,
        role: import.meta.env.VITE_ADMIN_AVR0_ROLE,
        label: import.meta.env.VITE_ADMIN_AVR0_LABEL,
    },
    [import.meta.env.VITE_ADMIN_COMLAB2_USERNAME]: {
        password: import.meta.env.VITE_ADMIN_COMLAB2_PASSWORD,
        role: import.meta.env.VITE_ADMIN_COMLAB2_ROLE,
        label: import.meta.env.VITE_ADMIN_COMLAB2_LABEL,
    },
    [import.meta.env.VITE_ADMIN_JPCSADMIN_USERNAME]: {
        password: import.meta.env.VITE_ADMIN_JPCSADMIN_PASSWORD,
        role: import.meta.env.VITE_ADMIN_JPCSADMIN_ROLE,
        label: import.meta.env.VITE_ADMIN_JPCSADMIN_LABEL,
    },
};

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAllowed, setIsAllowed] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Admin Login";
        const checkDevice = () => {
            setIsAllowed(window.innerWidth >= 1024);
        };
        checkDevice();
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, []);

    useEffect(() => {
        const admin = localStorage.getItem("admin_token");
        if (admin) navigate("/admin/dashboard");
    }, [navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const account = ADMIN_ACCOUNTS[username.trim()];
        if (account && account.password === password) {
            localStorage.setItem("admin_token", "secure_token_here");
            localStorage.setItem("admin_role", account.role);
            localStorage.setItem("admin_label", account.label);
            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: `Welcome, ${account.label}!`,
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                navigate('/admin/dashboard');
            });
        } else {
            setError('Invalid username or password.');
        }
    };

    if (!isAllowed) {
        return (
            <div className="srp-blocked">
                <div className="srp-blocked-content">
                    <img src={huleImg} alt="Blocked" className="srp-blocked-img" />
                    <h1 className="srp-blocked-title">THIS PAGE IS NOT AVAILABLE</h1>
                    <p className="srp-blocked-text">
                        Nice try. This portal isn't for phones.
                    </p>
                    <p className="srp-blocked-security">
                        MONITORED BY JPCS SECURITY SYSTEM
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-login-wrapper">
            <ul className="bg-squares">
                <li></li><li></li><li></li><li></li><li></li>
                <li></li><li></li><li></li><li></li><li></li>
            </ul>
            <div className="admin-login-container">
                <div className="login-card">
                    <div className="login-header">
                        <img src={knsLogo} alt="KNS Logo" className="login-logo-img" />
                        <h1 className="login-title">Admin Portal Login</h1>
                        <p className="login-subtitle">Kolehiyo Ng Subic Admission Test</p>
                    </div>
                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && <div className="error-message-box">{error}</div>}
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <button type="submit" className="login-btn">Login</button>
                    </form>
                </div>
            </div>
        </div>
    );
}