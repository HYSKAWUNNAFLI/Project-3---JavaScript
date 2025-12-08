import { useMemo, useState } from 'react';
import api from '../api/client';
import QuestionCard from '../components/QuestionCard';
import { useAuth } from '../context/AuthContext';

type Question = {
  id: string;
  prompt: string;
  choices: string[];
  topic?: { name?: string; gradeLevel?: number } | null;
};

type Summary = {
  strengths: { topicId: string; topicName: string; gradeLevel: number; accuracy: number }[];
  weaknesses: { topicId: string; topicName: string; gradeLevel: number; accuracy: number }[];
  score: number;
  total: number;
};

const PlacementTest = () => {
  const { user } = useAuth();
  const [grade, setGrade] = useState(user?.gradeLevel || 1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const startTest = async () => {
    setLoading(true);
    setSummary(null);
    setAnswers({});
    try {
      const res = await api.get('/questions', { params: { grade, limit: 12 } });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const submitTest = async () => {
    const payload = {
      mode: 'PLACEMENT',
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] ?? -1
      }))
    };
    try {
      const res = await api.post('/quiz/submit', payload);
      setSummary({
        strengths: res.data.strengths || [],
        weaknesses: res.data.weaknesses || [],
        score: res.data.score,
        total: res.data.totalQuestions
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Thi đầu vào</h2>
        <p className="muted">
          Hệ thống chấm tự động và trả về chủ đề mạnh/yếu để bạn tập trung.
        </p>
        <div className="form grid-two">
          <label>
            Chọn khối để khảo sát
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((g) => (
                <option key={g} value={g}>
                  Lớp {g}
                </option>
              ))}
            </select>
          </label>
          <button onClick={startTest} className="button primary" disabled={loading}>
            {loading ? 'Đang chuẩn bị...' : 'Bắt đầu bài test'}
          </button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div>
              <h3>Câu hỏi ({answeredCount}/{questions.length})</h3>
              <p className="muted">Chọn câu trả lời cho từng câu.</p>
            </div>
            <button className="button" onClick={submitTest}>
              Nộp bài
            </button>
          </div>
          <div className="stack">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                selectedIndex={answers[q.id]}
                onSelect={(choice) => setAnswers((prev) => ({ ...prev, [q.id]: choice }))}
              />
            ))}
          </div>
        </div>
      )}

      {summary && (
        <div className="card">
          <h3>Kết quả</h3>
          <div className="result-box">
            <strong>
              Điểm: {summary.score}/{summary.total}
            </strong>
            <p className="muted">Các chủ đề gợi ý dựa trên độ chính xác.</p>
          </div>
          <div className="grid-two">
            <div>
              <h4>Chủ đề mạnh</h4>
              <ul className="list">
                {summary.strengths.length === 0 && <li className="muted">Chưa xác định.</li>}
                {summary.strengths.map((s) => (
                  <li key={s.topicId}>
                    <div>
                      <strong>{s.topicName}</strong>
                      <p className="muted">Lớp {s.gradeLevel}</p>
                    </div>
                    <span className="pill success">{s.accuracy}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Chủ đề cần cải thiện</h4>
              <ul className="list">
                {summary.weaknesses.length === 0 && <li className="muted">Bạn đang làm rất tốt!</li>}
                {summary.weaknesses.map((s) => (
                  <li key={s.topicId}>
                    <div>
                      <strong>{s.topicName}</strong>
                      <p className="muted">Lớp {s.gradeLevel}</p>
                    </div>
                    <span className="pill warn">{s.accuracy}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTest;
