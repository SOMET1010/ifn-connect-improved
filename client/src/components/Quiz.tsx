import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface QuizQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string | null;
}

interface QuizProps {
  courseId: number;
  questions: QuizQuestion[];
  onSubmit: (answers: { questionId: number; answer: 'A' | 'B' | 'C' | 'D' }[]) => Promise<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    message: string;
  }>;
}

export function Quiz({ courseId, questions, onSubmit }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    message: string;
  } | null>(null);

  const handleAnswerChange = (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions ont une réponse
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      alert(`Veuillez répondre à toutes les questions (${unansweredQuestions.length} restantes)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
      }));

      const quizResult = await onSubmit(formattedAnswers);
      setResult(quizResult);
    } catch (error) {
      console.error('Erreur lors de la soumission du quiz:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.passed ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Félicitations !
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                Score insuffisant
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className={result.passed ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}>
            <AlertDescription className="text-lg">
              {result.message}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{result.score}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{result.correctAnswers}</div>
              <div className="text-sm text-gray-600">Bonnes réponses</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{result.totalQuestions}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
          </div>

          {result.passed ? (
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                Vous avez validé ce cours avec succès ! Vous pouvez maintenant télécharger votre certificat.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                Vous devez obtenir au moins 70% pour valider le cours. Révisez le contenu et réessayez !
              </p>
              <Button onClick={handleRetry} variant="outline">
                Repasser le quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Quiz de validation</CardTitle>
        <CardDescription>
          Répondez à toutes les questions pour valider le cours. Score minimum requis : 70%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-4">{question.question}</h3>
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswerChange(question.id, value as 'A' | 'B' | 'C' | 'D')}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="A" id={`q${question.id}-a`} />
                      <Label htmlFor={`q${question.id}-a`} className="flex-1 cursor-pointer">
                        <span className="font-medium text-indigo-700 mr-2">A.</span>
                        {question.optionA}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="B" id={`q${question.id}-b`} />
                      <Label htmlFor={`q${question.id}-b`} className="flex-1 cursor-pointer">
                        <span className="font-medium text-indigo-700 mr-2">B.</span>
                        {question.optionB}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="C" id={`q${question.id}-c`} />
                      <Label htmlFor={`q${question.id}-c`} className="flex-1 cursor-pointer">
                        <span className="font-medium text-indigo-700 mr-2">C.</span>
                        {question.optionC}
                      </Label>
                    </div>
                    {question.optionD && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="D" id={`q${question.id}-d`} />
                        <Label htmlFor={`q${question.id}-d`} className="flex-1 cursor-pointer">
                          <span className="font-medium text-indigo-700 mr-2">D.</span>
                          {question.optionD}
                        </Label>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-gray-600">
            {Object.keys(answers).length} / {questions.length} questions répondues
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < questions.length}
            size="lg"
          >
            {isSubmitting ? 'Validation en cours...' : 'Valider le quiz'}
          </Button>
        </div>

        {Object.keys(answers).length < questions.length && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Veuillez répondre à toutes les questions avant de valider le quiz.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
