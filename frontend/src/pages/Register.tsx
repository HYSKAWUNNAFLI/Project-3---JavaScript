import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gradeLevel, setGradeLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, gradeLevel });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Đăng ký thất bại, thử lại.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h1>Tạo tài khoản</h1>
        <p className="muted">Bắt đầu hành trình luyện Toán từ lớp 1 đến lớp 5.</p>
        <form onSubmit={handleSubmit} className="form grid-two">
          <label>
            Họ tên
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Lớp hiện tại
            <select value={gradeLevel} onChange={(e) => setGradeLevel(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((g) => (
                <option key={g} value={g}>
                  Khối {g}
                </option>
              ))}
            </select>
          </label>
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
              placeholder="Tối thiểu 6 ký tự"
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>
        <p className="muted">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
