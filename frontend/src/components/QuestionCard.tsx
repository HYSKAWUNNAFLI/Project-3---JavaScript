type Question = {
  id: string;
  prompt: string;
  choices: string[];
  topic?: { name?: string; gradeLevel?: number } | null;
};

type Props = {
  question: Question;
  index: number;
  selectedIndex?: number;
  onSelect: (choiceIndex: number) => void;
};

const QuestionCard = ({ question, index, selectedIndex, onSelect }: Props) => {
  return (
    <div className="card question-card">
      <div className="question-meta">
        <span className="pill">Câu {index + 1}</span>
        {question.topic?.name && (
          <span className="pill subtle">
            {question.topic.name} {question.topic.gradeLevel ? `(Khối ${question.topic.gradeLevel})` : ''}
          </span>
        )}
      </div>
      <p className="question-text">{question.prompt}</p>
      <div className="choices">
        {question.choices.map((choice, i) => (
          <label key={i} className={`choice ${selectedIndex === i ? 'selected' : ''}`}>
            <input
              type="radio"
              checked={selectedIndex === i}
              onChange={() => onSelect(i)}
              name={`question-${question.id}`}
            />
            <span>{choice}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
