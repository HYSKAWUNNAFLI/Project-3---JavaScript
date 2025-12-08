import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active-link' : '');

  return (
    <header className="navbar">
      <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/logo.jpg" alt="MathKid Logo" style={{ height: '50px', width: 'auto' }} />
        <span className="brand-name">MathKid</span>
      </div>

      <nav>
        {token ? (
          <>
            <NavLink to="/dashboard" className={linkClass}>
              Trang chủ
            </NavLink>
            <NavLink to="/dashboard" className={linkClass}>
              Học Tập
            </NavLink>
            <NavLink to="/practice" className={linkClass}>
              Luyện tập
            </NavLink>
            <NavLink to="/placement" className={linkClass}>
              Thi đầu vào
            </NavLink>
            <NavLink to="/battle" className={linkClass}>
              Đấu bot
            </NavLink>
            <NavLink to="/stats" className={linkClass}>
              Thống kê
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login">Đăng nhập</NavLink>
            <NavLink to="/register">Đăng ký</NavLink>
          </>
        )}
      </nav>

      {token && user && (
        <div className="user-box">
          <div className="user-meta">
            <strong>{user.name}</strong>
            <span style={{ fontSize: '0.8em', color: '#666' }}>Khối {user.gradeLevel}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Thoát
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
