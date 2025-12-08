import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="brand" onClick={() => navigate('/')}>
        <span className="brand-dot" />
        <span>MathKid</span>
      </div>
      <nav>
        {token && (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/practice">Luyện tập</NavLink>
            <NavLink to="/placement">Thi đầu vào</NavLink>
            <NavLink to="/battle">Đấu bot</NavLink>
          </>
        )}
        {!token && (
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
            <span>Khối {user.gradeLevel}</span>
          </div>
          <button onClick={handleLogout}>Thoát</button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
