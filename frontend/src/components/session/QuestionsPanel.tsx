'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useSessionStore } from '@/store/session';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';

export function QuestionsPanel() {
  const { questions, session, currentUser } = useSessionStore();
  const [newQuestion, setNewQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || !currentUser || !session) return;

    setIsSubmitting(true);
    try {
      // Placeholder for actual question submission
      console.log('Submitting question:', {
        content: newQuestion.trim(),
        isAnonymous,
        attendeeId: currentUser.id,
      });
      
      // Reset form
      setNewQuestion('');
      setIsAnonymous(false);
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'answered':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Q&A ({questions.length})
        </h2>
      </div>

      {/* Submit Question */}
      {session?.allowQuestions && (
        <div className="p-4 border-b border-border">
          <div className="space-y-3">
            <Textarea
              placeholder="Ask a question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="resize-none"
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous-question"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={!session.allowAnonymousQuestions}
                />
                <label 
                  htmlFor="anonymous-question" 
                  className={`text-sm ${!session.allowAnonymousQuestions ? 'text-muted-foreground' : ''}`}
                >
                  Ask anonymously
                </label>
              </div>
              
              <Button
                size="sm"
                onClick={handleSubmitQuestion}
                disabled={!newQuestion.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No questions yet</p>
              {session?.allowQuestions && (
                <p className="text-xs mt-1">Be the first to ask!</p>
              )}
            </div>
          ) : (
            questions.map((question) => (
              <Card key={question.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          {question.isAnonymous ? 'Anonymous' : question.authorName || 'Unknown'}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`h-5 text-xs ${getStatusColor(question.status)} text-white`}
                        >
                          {question.status}
                        </Badge>
                      </div>
                      <p className="text-sm">{question.content}</p>
                    </div>
                  </div>
                </CardHeader>

                {question.answer && (
                  <CardContent className="pt-0">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="h-5 text-xs">
                          🎤 Answer
                        </Badge>
                        {question.answeredAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(question.answeredAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{question.answer}</p>
                    </div>
                  </CardContent>
                )}

                {/* Voting */}
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {question.upvotes}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        {question.downvotes}
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(question.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
