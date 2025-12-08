import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import QuestionCard from '../components/QuestionCard';
import { useAuth } from '../context/AuthContext';

type Topic = { id: string; name: string; gradeLevel: number };
type Question = { id: string; prompt: string; choices: string[]; topic?: Topic };
type Result = { score: number; totalQuestions: number };

const Practice = () => {
  const { user } = useAuth();
  const [grade, setGrade] = useState<number>(user?.gradeLevel || 1);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [limit, setLimit] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTopics = async () => {
      const res = await api.get('/topics', { params: { grade } });
      setTopics(res.data.topics || []);
      setTopicId(res.data.topics?.[0]?.id || '');
    };
    loadTopics();
  }, [grade]);

  const fetchQuestions = async () => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const res = await api.get('/questions', {
        params: { topicId, difficulty, limit, grade }
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const handleSubmit = async () => {
    if (questions.length === 0) return;
    const payload = {
      mode: 'PRACTICE',
      topicId: topicId || undefined,
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] ?? -1
      }))
    };
    try {
      const res = await api.post('/quiz/submit', payload);
      setResult({
        score: res.data.score,
        totalQuestions: res.data.totalQuestions
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Luyện tập theo chủ đề</h2>
        <div className="form grid-three">
          <label>
            Khối
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((g) => (
                <option key={g} value={g}>
                  Lớp {g}
                </option>
              ))}
            </select>
          </label>
          <label>
            Chủ đề
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Độ khó
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </label>
          <label>
            Số câu
            <input
              type="number"
              min={1}
              max={30}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </label>
          <button type="button" className="button primary" onClick={fetchQuestions} disabled={loading}>
            {loading ? 'Đang tải...' : 'Lấy câu hỏi'}
          </button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div>
              <h3>Danh sách câu hỏi</h3>
              <p className="muted">
                Đã chọn {answeredCount}/{questions.length} câu
              </p>
            </div>
            <button className="button" onClick={handleSubmit}>
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
          {result && (
            <div className="result-box">
              <strong>
                Kết quả: {result.score}/{result.totalQuestions}
              </strong>
              <p className="muted">
                Tiếp tục luyện tập chủ đề này hoặc chuyển sang độ khó khác để thử thách bản thân.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Practice;
