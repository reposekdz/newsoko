import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { MessageCircle, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

interface ProductQAProps {
  productId: number;
  isSeller?: boolean;
}

export function ProductQA({ productId, isSeller = false }: ProductQAProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const result = await api.getProductQuestions(productId);
      if (result.success) {
        setQuestions(result.questions);
      }
    } catch (error) {
      toast({ title: 'Failed to load questions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      const result = await api.askProductQuestion(productId, newQuestion);
      if (result.success) {
        toast({ title: 'Question posted!' });
        setNewQuestion('');
        fetchQuestions();
      }
    } catch (error) {
      toast({ title: 'Failed to post question', variant: 'destructive' });
    }
  };

  const submitAnswer = async (questionId: number) => {
    if (!answer.trim()) return;

    try {
      const result = await api.answerProductQuestion(questionId, answer);
      if (result.success) {
        toast({ title: 'Answer posted!' });
        setAnswer('');
        setAnsweringId(null);
        fetchQuestions();
      } else {
        toast({ title: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to post answer', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Questions & Answers ({questions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSeller && (
          <div className="space-y-2">
            <Textarea
              placeholder="Ask a question about this product..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
            />
            <Button onClick={askQuestion} disabled={!newQuestion.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Ask Question
            </Button>
          </div>
        )}

        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No questions yet</p>
            <p className="text-sm">Be the first to ask!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="border rounded-lg p-4 space-y-3">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">Q: {q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {q.user_name} • {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span className="text-xs">{q.helpful_count}</span>
                    </Button>
                  </div>
                </div>

                {q.answer ? (
                  <div className="pl-4 border-l-2 border-primary">
                    <Badge className="mb-2">Answer</Badge>
                    <p className="text-sm">{q.answer}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {q.answerer_name} • {new Date(q.answered_at).toLocaleDateString()}
                    </p>
                  </div>
                ) : isSeller ? (
                  answeringId === q.id ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Type your answer..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => submitAnswer(q.id)} size="sm">
                          Post Answer
                        </Button>
                        <Button onClick={() => setAnsweringId(null)} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setAnsweringId(q.id)} variant="outline" size="sm">
                      Answer
                    </Button>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not answered yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
