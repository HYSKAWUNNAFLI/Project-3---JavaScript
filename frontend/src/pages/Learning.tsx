import { useEffect, useState } from 'react';
import api from '../api/client';
import QuestionCard from '../components/QuestionCard';
import { useAuth } from '../context/AuthContext';

type LearningTopic = {
  id: string;
  name: string;
  gradeLevel: number;
  description?: string | null;
  _count?: { questions: number };
};

type Question = {
  id: string;
  prompt: string;
  choices: string[];
  learningTopic?: LearningTopic | null;
};

const Learning = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; totalQuestions: number; accuracy: number } | null>(null);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const res = await api.get('/learning-topics');
        setTopics(res.data.topics || []);
        setSelectedId(res.data.topics?.[0]?.id || '');
      } catch (e) {
        console.error(e);
      }
    };
    loadTopics();
  }, []);

  const fetchQuestions = async () => {
    if (!selectedId) return;
    setLoading(true);
    setAnswers({});
    setResult(null);
    try {
      const res = await api.get(`/learning-topics/${selectedId}/questions`, { params: { limit: 10 } });
      setQuestions(res.data.questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedId || questions.length === 0) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.post(`/learning-topics/${selectedId}/submit`, {
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedIndex: answers[q.id] ?? -1
        }))
      });
      setResult({
        score: res.data.score,
        totalQuestions: res.data.totalQuestions,
        accuracy: res.data.accuracy
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Học tập</h2>
        <p className="muted">Chọn chủ đề khối {user?.gradeLevel ?? 5}, mỗi lần lấy 10 câu hỏi ngẫu nhiên.</p>
        <div className="grid-two">
          <label>
            Chủ đề
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Khối {t.gradeLevel}) {t._count ? `- ${t._count.questions} câu` : ''}
                </option>
              ))}
            </select>
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="button primary" onClick={fetchQuestions} disabled={loading || !selectedId}>
              {loading ? 'Đang tải...' : 'Lấy 10 câu'}
            </button>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div>
              <h3>10 câu hỏi ngẫu nhiên</h3>
              <p className="muted">Chọn đáp án cho từng câu.</p>
            </div>
            <button className="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
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
          {result && (
            <div className="result-box">
              <strong>
                Kết quả: {result.score}/{result.totalQuestions} câu đúng ({result.accuracy}%)
              </strong>
              <p className="muted">Điểm này đã được lưu vào thống kê.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Learning;
