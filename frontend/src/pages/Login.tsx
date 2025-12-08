import { type FormEvent, useState } from 'react';
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

  const oauthBase = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return apiUrl.replace(/\/api$/, '');
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

  const handleOAuth = (provider: 'google' | 'facebook') => {
    window.location.href = `${oauthBase}/api/auth/oauth/${provider}`;
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h1>Chào mừng trở lại</h1>
        <p className="muted">Đăng nhập để tiếp tục luyện tập Toán cùng MathKid.</p>
        <div className="stack">
          <button className="button oauth google" type="button" onClick={() => handleOAuth('google')}>
            <span className="oauth-icon">G</span> Sign up with Google
          </button>
          <button className="button oauth facebook" type="button" onClick={() => handleOAuth('facebook')}>
            <span className="oauth-icon">f</span> Sign up with Facebook
          </button>
        </div>
        <div className="muted" style={{ margin: '8px 0' }}>
          — hoặc đăng nhập bằng email —
        </div>
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
      </div>
    </div>
  );
};

export default Login;
