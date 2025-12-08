import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [message, setMessage] = useState('Đang xác thực...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    const run = async () => {
      if (error) {
        setMessage(`Đăng nhập thất bại: ${error}`);
        return;
      }
      if (!token) {
        setMessage('Thiếu token từ máy chủ.');
        return;
      }
      try {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        const res = await api.get('/auth/me');
        login(token, res.data.user);
        navigate('/dashboard');
      } catch (e) {
        console.error(e);
        setMessage('Không thể xác thực tài khoản.');
      }
    };

    run();
  }, [location.search, login, navigate]);

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h2>Đang đăng nhập...</h2>
        <p className="muted">{message}</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
