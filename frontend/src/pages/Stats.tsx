import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import './stats.css';

type StatResponse = {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  completed: number;
  incomplete: number;
  streakDays: number;
  topicBreakdown?: {
    learningTopicId: string;
    learningTopicName: string;
    correct: number;
    wrong: number;
    total: number;
    correctRate: number;
    wrongRate: number;
  }[];
};

const Stats = () => {
  const [stats, setStats] = useState<StatResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const { total, correct, wrong, accuracy, completed, incomplete, streakDays, topicBreakdown } = useMemo(() => {
    if (!stats)
      return {
        total: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        completed: 0,
        incomplete: 0,
        streakDays: 0,
        topicBreakdown: []
      };
    return stats;
  }, [stats]);

  const completionAngle =
    completed + incomplete === 0 ? 0 : (completed / (completed + incomplete)) * 360;

  return (
    <div className="page stats-page">
      <div className="card stats-hero">
        <div>
          <h2>Thống kê học tập</h2>
          <p className="muted">Tổng quan tiến độ luyện tập của bạn.</p>
        </div>
      </div>

      <div className="card stats-counters">
        <div className="stat-item">
          <div className="stat-label">Đã làm</div>
          <div className="stat-value">{loading ? '...' : `${total} câu`}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Làm đúng</div>
          <div className="stat-value correct">{loading ? '...' : `${correct} câu`}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Làm sai</div>
          <div className="stat-value wrong">{loading ? '...' : `${wrong} câu`}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Chính xác</div>
          <div className="stat-value accuracy">{loading ? '...' : `${accuracy}%`}</div>
        </div>
      </div>

      <div className="card stats-chart">
        <h3>Tỉ lệ hoàn thành đúng</h3>
        <div className="chart-row">
          <div
            className="donut"
            style={{
              background: `conic-gradient(#3ed8a4 ${completionAngle}deg, #e8eef7 0deg)`
            }}
          >
            <div className="donut-hole" />
          </div>
          <div className="legend">
            <div className="legend-item">
              <span className="dot dot-complete" />
              Đúng: {loading ? '...' : `${completed} câu`}
            </div>
            <div className="legend-item">
              <span className="dot dot-incomplete" />
              Sai: {loading ? '...' : `${incomplete} câu`}
            </div>
          </div>
        </div>
      </div>

      <div className="card stats-history">
        <h3>Lịch sử học bài</h3>
        <p className="muted">
          Streak hiện tại: <strong>{loading ? '...' : `${streakDays} ngày`}</strong>. Chuỗi ngày liên tiếp
          bạn có làm bài.
        </p>
        
      </div>

      <div className="card stats-history">
        <h3>Phân bố đúng/sai theo chủ đề học tập</h3>
        <div className="topic-table">
          <div className="topic-row header">
            <span>Chủ đề</span>
            <span>Đúng (%)</span>
            <span>Sai (%)</span>
          </div>
          {(topicBreakdown || []).map((t) => (
            <div className="topic-row" key={t.learningTopicId}>
              <span>{t.learningTopicName}</span>
              <span className="correct">{loading ? '...' : `${t.correctRate}%`}</span>
              <span className="wrong">{loading ? '...' : `${t.wrongRate}%`}</span>
            </div>
          ))}
          {!topicBreakdown?.length && <p className="muted">Chưa có dữ liệu đúng/sai theo Learning Topic.</p>}
        </div>
      </div>
    </div>
  );
};

export default Stats;
