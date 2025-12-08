import './stats.css';

const mockStats = {
  total: 44,
  correct: 38,
  wrong: 6,
  accuracy: 86.36,
  completedLessons: 175,
  incompleteLessons: 38
};

const Stats = () => {
  const { total, correct, wrong, accuracy, completedLessons, incompleteLessons } = mockStats;
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
          <div className="stat-value">{total} câu</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Làm đúng</div>
          <div className="stat-value correct">{correct} câu</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Làm sai</div>
          <div className="stat-value wrong">{wrong} câu</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Chính xác</div>
          <div className="stat-value accuracy">{accuracy}%</div>
        </div>
      </div>

      <div className="card stats-chart">
        <h3>Tỉ lệ hoàn thành khóa học</h3>
        <div className="chart-row">
          <div
            className="donut"
            style={{
              background: `conic-gradient(#3ed8a4 ${(completedLessons / (completedLessons + incompleteLessons)) * 360}deg, #e8eef7 0deg)`
            }}
          >
            <div className="donut-hole" />
          </div>
          <div className="legend">
            <div className="legend-item">
              <span className="dot dot-complete" />
              Hoàn thành: {completedLessons} bài
            </div>
            <div className="legend-item">
              <span className="dot dot-incomplete" />
              Chưa hoàn thành: {incompleteLessons} bài
            </div>
          </div>
        </div>
      </div>

      <div className="card stats-history">
        <h3>Lịch sử học bài</h3>
        <p className="muted">Chưa có dữ liệu. Bắt đầu làm bài để xem tiến độ của bạn.</p>
      </div>
    </div>
  );
};

export default Stats;
