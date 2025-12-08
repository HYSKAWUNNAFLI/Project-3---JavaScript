import { useEffect, useState } from 'react';
import api from '../api/client';
import QuestionCard from '../components/QuestionCard';
import { useAuth } from '../context/AuthContext';

type Topic = { id: string; name: string; gradeLevel: number };
type Question = { id: string; prompt: string; choices: string[]; topic?: Topic };

const BattleBot = () => {
  const { user } = useAuth();
  const [grade, setGrade] = useState(user?.gradeLevel || 1);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ userScore: number; botScore: number; result: string } | null>(
    null
  );

  useEffect(() => {
    const loadTopics = async () => {
      const res = await api.get('/topics', { params: { grade } });
      setTopics(res.data.topics || []);
      setTopicId(res.data.topics?.[0]?.id || '');
    };
    loadTopics();
  }, [grade]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions', {
        params: { topicId, difficulty, limit: 5, grade }
      });
      setQuestions(res.data.questions || []);
      setAnswers({});
      setResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  const submitBattle = async () => {
    const payload = {
      topicId: topicId || undefined,
      difficulty,
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] ?? -1
      }))
    };
    try {
      const res = await api.post('/battle/submit', payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Đấu Toán với bot</h2>
        <p className="muted">
          Hệ thống mô phỏng đối thủ theo độ khó, chấm điểm ngay sau khi nộp.
        </p>
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
            Độ khó bot
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </label>
          <button className="button primary" onClick={fetchQuestions}>
            Lấy câu hỏi
          </button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div>
              <h3>Câu hỏi đấu bot</h3>
              <p className="muted">
                Trả lời nhanh và chính xác để vượt qua bot {difficulty.toLowerCase()}.
              </p>
            </div>
            <button className="button" onClick={submitBattle}>
              Nộp và xem kết quả
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
                Bạn {result.result === 'WIN' ? 'thắng' : result.result === 'DRAW' ? 'hòa' : 'thua'} •{' '}
                {result.userScore}:{result.botScore}
              </strong>
              <p className="muted">
                Thử độ khó khác hoặc chủ đề mới để cải thiện tốc độ phản xạ.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BattleBot;
