import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

type Attempt = {
  id: string;
  mode: 'PRACTICE' | 'PLACEMENT' | 'QUIZ';
  score: number;
  totalQuestions: number;
  createdAt: string;
  topic?: { name: string | null } | null;
};

type Battle = {
  id: string;
  difficulty: string;
  userScore: number;
  botScore: number;
  result: string;
  createdAt: string;
  topic?: { name: string | null } | null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [a, b] = await Promise.all([
          api.get('/quiz/attempts'),
          api.get('/battle/history')
        ]);
        setAttempts(a.data.attempts || []);
        setBattles(b.data.battles || []);
      } catch (err) {
        console.warn('Could not load history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const lastAttempt = attempts[0];

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="pill subtle">Xin chào, {user?.name}</p>
          <h1>
            Sẵn sàng chinh phục Toán lớp {user?.gradeLevel}? <span>MathKid</span> ở đây để hỗ trợ.
          </h1>
          <p className="muted">
            Luyện tập theo chủ đề, làm bài đầu vào để biết điểm mạnh, và đấu bot để tăng tốc phản xạ.
          </p>
          <div className="actions">
            <Link to="/practice" className="button primary">
              Luyện tập ngay
            </Link>
            <Link to="/placement" className="button ghost">
              Làm bài đầu vào
            </Link>
          </div>
        </div>
        <div className="highlight-card">
          <p>Tiến độ gần đây</p>
          {lastAttempt ? (
            <strong>
              {lastAttempt.score}/{lastAttempt.totalQuestions} câu đúng
            </strong>
          ) : (
            <strong>Chưa có bài luyện</strong>
          )}
          <span className="muted">
            {lastAttempt?.topic?.name ? lastAttempt.topic.name : 'Chọn chủ đề để bắt đầu'}
          </span>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Lịch sử luyện tập</h3>
          {loading && <p className="muted">Đang tải...</p>}
          {!loading && attempts.length === 0 && <p className="muted">Chưa có dữ liệu.</p>}
          <ul className="list">
            {attempts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.mode === 'PLACEMENT' ? 'Placement' : 'Practice'}</strong>
                  <p className="muted">
                    {new Date(a.createdAt).toLocaleString()} • {a.topic?.name || 'Nhiều chủ đề'}
                  </p>
                </div>
                <span className="pill">
                  {a.score}/{a.totalQuestions}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Kết quả đấu bot</h3>
          {loading && <p className="muted">Đang tải...</p>}
          {!loading && battles.length === 0 && <p className="muted">Chưa có dữ liệu.</p>}
          <ul className="list">
            {battles.slice(0, 5).map((b) => (
              <li key={b.id}>
                <div>
                  <strong>{b.topic?.name || 'Tổng hợp'}</strong>
                  <p className="muted">
                    {new Date(b.createdAt).toLocaleString()} • {b.difficulty}
                  </p>
                </div>
                <span className={`pill ${b.result.toLowerCase()}`}>
                  {b.result} {b.userScore}:{b.botScore}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Bắt đầu nhanh</h3>
          <div className="stack">
            <Link to="/practice" className="button block">
              Luyện theo chủ đề
            </Link>
            <Link to="/placement" className="button block ghost">
              Thi đầu vào
            </Link>
            <Link to="/battle" className="button block ghost">
              Đấu bot
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
