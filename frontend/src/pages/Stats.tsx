import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import './stats.css';

type TopicBreakdown = {
  learningTopicId: string;
  learningTopicName: string;
  correct: number;
  wrong: number;
  total: number;
  correctRate: number;
  wrongRate: number;
};

type StatResponse = {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  completed: number;
  incomplete: number;
  streakDays: number;
  topicBreakdown: TopicBreakdown[];
};

const emptyStats: StatResponse = {
  total: 0,
  correct: 0,
  wrong: 0,
  accuracy: 0,
  completed: 0,
  incomplete: 0,
  streakDays: 0,
  topicBreakdown: []
};

const Stats = () => {
  const [stats, setStats] = useState<StatResponse>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats({ ...emptyStats, ...res.data });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const { total, correct, wrong, accuracy, completed, incomplete, streakDays, topicBreakdown } =
    useMemo(() => stats, [stats]);

  const completionAngle =
    completed + incomplete === 0 ? 0 : (completed / (completed + incomplete)) * 360;

  const formatRate = (value: number) => `${value.toFixed(2)}%`;

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
          <div className="stat-value accuracy">
            {loading ? '...' : formatRate(accuracy)}
          </div>
        </div>
      </div>

      <div className="card stats-chart">
        <h3>Tỉ lệ hoàn thành khóa học</h3>
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
              Hoàn thành: {loading ? '...' : `${completed} câu`}
            </div>
            <div className="legend-item">
              <span className="dot dot-incomplete" />
              Chưa hoàn thành: {loading ? '...' : `${incomplete} câu`}
            </div>
          </div>
        </div>
      </div>

      <div className="card stats-breakdown">
        <div className="section-header">
          <h3>Tỉ lệ đúng/sai theo chủ đề</h3>
          <p className="muted">
            Dữ liệu lấy trực tiếp từ bảng quiz_attempts, nhóm theo Learning Topic.
          </p>
        </div>
        {loading ? (
          <p className="muted">Đang tải...</p>
        ) : topicBreakdown.length === 0 ? (
          <p className="muted">Chưa có dữ liệu. Hãy làm bài để xem thống kê.</p>
        ) : (
          <div className="table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Chủ đề</th>
                  <th>Tổng</th>
                  <th>Đúng</th>
                  <th>Sai</th>
                  <th>% Đúng</th>
                  <th>% Sai</th>
                </tr>
              </thead>
              <tbody>
                {topicBreakdown.map((topic) => (
                  <tr key={topic.learningTopicId}>
                    <td className="topic-name">{topic.learningTopicName}</td>
                    <td>{topic.total}</td>
                    <td className="correct">{topic.correct}</td>
                    <td className="wrong">{topic.wrong}</td>
                    <td className="correct">{formatRate(topic.correctRate)}</td>
                    <td className="wrong">{formatRate(topic.wrongRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card stats-history">
        <h3>Lịch sử học bài</h3>
        <p className="muted">
          Lịch sử tính theo ngày có phát sinh bài làm (quiz_attempts). Làm bài mỗi ngày để duy trì chuỗi ngày học.
        </p>
        <div className="streak-box">
          <div>Streak hiện tại</div>
          <strong>{loading ? '...' : `${streakDays} ngày liên tiếp`}</strong>
        </div>
        <p className="muted">
          Khi bạn tiếp tục hoàn thành bài tập, số liệu ở trên sẽ cập nhật theo thời gian thực.
        </p>
      </div>
    </div>
  );
};

export default Stats;
