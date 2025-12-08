import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const oauthBase = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return apiUrl.replace(/\/api$/, '');
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.get('/auth/oauth/config');
        setGoogleEnabled(res.data.googleEnabled);
      } catch {
        setGoogleEnabled(false);
      }
    };
    loadConfig();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Đăng nhập thất bại, thử lại.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = () => {
    window.location.href = `${oauthBase}/api/auth/oauth/google`;
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h1>Chào mừng trở lại</h1>
        <p className="muted">Đăng nhập để tiếp tục luyện tập Toán cùng MathKid.</p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hoc.sinh@example.com"
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="muted">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
        <div className="stack oauth-stack">
          <button
            className="button oauth google"
            type="button"
            disabled={!googleEnabled}
            onClick={handleOAuth}
            title={googleEnabled ? '' : 'Google OAuth chưa được cấu hình'}
          >
            <span className="oauth-icon">G</span> Đăng nhập với Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
