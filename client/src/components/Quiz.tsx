import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { AlertCircle, CheckCircle2, XCircle, Volume2, VolumeX, Mic } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { audioManager } from '../lib/audioManager';

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('audioEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Fonction pour lire du texte avec Web Speech API
  const speak = (text: string) => {
    if (!isAudioEnabled || !('speechSynthesis' in window)) return;

    // Arrêter toute lecture en cours
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9; // Vitesse légèrement ralentie pour meilleure compréhension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
    
    // Feedback tactile
    audioManager.provideFeedback('tap');
  };

  // Lire la question courante automatiquement
  useEffect(() => {
    if (isAudioEnabled && !result) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        // Attendre 500ms avant de lire pour éviter les lectures multiples
        const timer = setTimeout(() => {
          const optionDText = currentQuestion.optionD ? ` Option D: ${currentQuestion.optionD}.` : '';
          const fullText = `Question ${currentQuestionIndex + 1}. ${currentQuestion.question}. Option A: ${currentQuestion.optionA}. Option B: ${currentQuestion.optionB}. Option C: ${currentQuestion.optionC}.${optionDText}`;
          speak(fullText);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentQuestionIndex, isAudioEnabled, result]);

  // Reconnaissance vocale pour les réponses
  const startVoiceRecognition = (questionId: number) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      
      // Détecter la réponse (A, B, C, D ou "option A", "option B", etc.)
      let detectedAnswer: 'A' | 'B' | 'C' | 'D' | null = null;
      
      if (transcript.includes('a') || transcript.includes('option a')) {
        detectedAnswer = 'A';
      } else if (transcript.includes('b') || transcript.includes('option b') || transcript.includes('bé')) {
        detectedAnswer = 'B';
      } else if (transcript.includes('c') || transcript.includes('option c') || transcript.includes('cé')) {
        detectedAnswer = 'C';
      } else if (transcript.includes('d') || transcript.includes('option d') || transcript.includes('dé')) {
        detectedAnswer = 'D';
      }

      if (detectedAnswer) {
        handleAnswerChange(questionId, detectedAnswer);
        speak(`Réponse ${detectedAnswer} enregistrée.`);
      } else {
        speak('Je n\'ai pas compris. Dites A, B, C ou D.');
      }
      
      setIsListening(false);
    };

    recognition.onerror = () => {
      speak('Erreur de reconnaissance vocale. Réessayez.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    speak('Dites votre réponse : A, B, C ou D.');
  };

  const handleAnswerChange = (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions ont une réponse
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      const message = `Veuillez répondre à toutes les questions (${unansweredQuestions.length} restantes)`;
      alert(message);
      speak(message);
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
      
      // Annoncer le résultat vocalement
      if (isAudioEnabled) {
        if (quizResult.passed) {
          speak(`Félicitations ! Vous avez obtenu ${quizResult.score} pourcent. Vous avez validé le cours !`);
        } else {
          speak(`Vous avez obtenu ${quizResult.score} pourcent. Il faut au moins 70 pourcent pour valider. Réessayez !`);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du quiz:', error);
      const errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      alert(errorMessage);
      speak(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
    speak('Vous pouvez recommencer le quiz.');
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (result) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.passed ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Félicitations ! 🎉
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
              <Button onClick={handleRetry} variant="outline" size="lg">
                Repasser le quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quiz de validation</CardTitle>
            <CardDescription>
              Répondez à toutes les questions pour valider le cours. Score minimum : 70%
            </CardDescription>
          </div>
          {isAudioEnabled ? (
            <Volume2 className="h-6 w-6 text-green-600" />
          ) : (
            <VolumeX className="h-6 w-6 text-gray-400" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} sur {questions.length}</span>
            <span>{Object.keys(answers).length} réponses</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question courante */}
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
              {currentQuestionIndex + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h3 className="font-bold text-xl text-gray-900">{currentQuestion.question}</h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => speak(currentQuestion.question)}
                  className="flex-shrink-0"
                  title="Écouter la question"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
              </div>

              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value as 'A' | 'B' | 'C' | 'D')}
              >
                <div className="space-y-4">
                  {/* Boutons de réponse GÉANTS pour accessibilité tactile */}
                  <div
                    className={`flex items-center space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQuestion.id] === 'A'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleAnswerChange(currentQuestion.id, 'A')}
                  >
                    <RadioGroupItem value="A" id={`q${currentQuestion.id}-a`} className="w-6 h-6" />
                    <Label htmlFor={`q${currentQuestion.id}-a`} className="flex-1 cursor-pointer text-lg">
                      <span className="font-bold text-indigo-700 mr-3 text-xl">A.</span>
                      {currentQuestion.optionA}
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQuestion.id] === 'B'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleAnswerChange(currentQuestion.id, 'B')}
                  >
                    <RadioGroupItem value="B" id={`q${currentQuestion.id}-b`} className="w-6 h-6" />
                    <Label htmlFor={`q${currentQuestion.id}-b`} className="flex-1 cursor-pointer text-lg">
                      <span className="font-bold text-indigo-700 mr-3 text-xl">B.</span>
                      {currentQuestion.optionB}
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQuestion.id] === 'C'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleAnswerChange(currentQuestion.id, 'C')}
                  >
                    <RadioGroupItem value="C" id={`q${currentQuestion.id}-c`} className="w-6 h-6" />
                    <Label htmlFor={`q${currentQuestion.id}-c`} className="flex-1 cursor-pointer text-lg">
                      <span className="font-bold text-indigo-700 mr-3 text-xl">C.</span>
                      {currentQuestion.optionC}
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {/* Bouton de reconnaissance vocale */}
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => startVoiceRecognition(currentQuestion.id)}
                  disabled={isListening}
                  className="gap-2"
                >
                  <Mic className={`h-5 w-5 ${isListening ? 'text-red-600 animate-pulse' : ''}`} />
                  {isListening ? 'Écoute en cours...' : 'Répondre vocalement'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation entre questions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            ← Précédent
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length < questions.length}
              size="lg"
              className="px-8"
            >
              {isSubmitting ? 'Validation...' : 'Valider le quiz'}
            </Button>
          ) : (
            <Button
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Suivant →
            </Button>
          )}
        </div>

        {Object.keys(answers).length < questions.length && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Répondez à toutes les questions avant de valider ({questions.length - Object.keys(answers).length} restantes)
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
