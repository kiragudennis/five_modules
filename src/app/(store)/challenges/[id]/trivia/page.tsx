// app/(store)/challenges/[challengeId]/trivia/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle, XCircle, Timer, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TriviaChallengePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { supabase, profile } = useAuth();

  const [selection, setSelection] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myScore, setMyScore] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout>(null);
  const startTimeRef = useRef<number>(null);

  // Real-time subscription for being selected
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`trivia-selection-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_trivia_selections",
          filter: `challenge_id=eq.${challengeId} AND user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newSelection = payload.new;
          setSelection(newSelection);
          loadQuestion(newSelection.question_id);
          startTimer();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [challengeId, profile?.id]);

  const loadQuestion = async (questionId: string) => {
    const { data } = await supabase
      .from("challenge_trivia_questions")
      .select("*")
      .eq("id", questionId)
      .single();

    setQuestion(data);
    setIsAnswering(true);
    setShowResult(false);
    setSelectedAnswer(null);
    setAnswerResult(null);
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setTimeLeft(question?.time_limit_seconds || 5);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && timerRef.current) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    setIsAnswering(false);
    setShowResult(true);
    setAnswerResult({
      is_correct: false,
      points_earned: 0,
      message: "Time's up! ⏰",
    });

    // Submit timeout
    if (selection?.id) {
      supabase
        .from("challenge_trivia_selections")
        .update({ status: "timeout" })
        .eq("id", selection.id);
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (!isAnswering || selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    setIsAnswering(false);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const { data, error } = await supabase.rpc("submit_trivia_answer", {
        p_selection_id: selection.id,
        p_answer_index: answerIndex,
      });

      if (error) throw error;

      setAnswerResult(data);
      setShowResult(true);

      if (data.is_correct) {
        toast.success(`Correct! +${data.points_earned} points`);
      } else {
        toast.error("Wrong answer!");
      }

      loadLeaderboard();
      loadMyScore();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const loadLeaderboard = async () => {
    const { data } = await supabase.rpc("get_trivia_leaderboard", {
      p_challenge_id: challengeId,
      p_limit: 20,
    });

    setLeaderboard(data || []);
  };

  const loadMyScore = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from("challenge_trivia_scores")
      .select("*")
      .eq("challenge_id", challengeId)
      .eq("user_id", profile.id)
      .single();

    setMyScore(data);
  };

  useEffect(() => {
    loadLeaderboard();
    if (profile?.id) loadMyScore();
  }, [challengeId, profile?.id]);

  if (!isAnswering && !showResult && !selection) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Waiting for Selection</h2>
            <p className="text-muted-foreground mb-6">Loading...</p>

            {/* My Stats */}
            {myScore && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-yellow-600">
                    {myScore.total_score}
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-green-600">
                    {myScore.correct_answers}/{myScore.questions_answered}
                  </p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-purple-600">
                    {myScore.current_streak}🔥
                  </p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              </div>
            )}

            {/* Mini Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="text-left">
                <h3 className="font-semibold mb-3">Top Players</h3>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, idx) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {idx === 0
                            ? "🥇"
                            : idx === 1
                              ? "🥈"
                              : idx === 2
                                ? "🥉"
                                : `#${idx + 1}`}
                        </span>
                        <span
                          className={cn(
                            entry.user_id === profile?.id &&
                              "font-bold text-yellow-600",
                          )}
                        >
                          {entry.full_name}
                        </span>
                      </div>
                      <span className="font-bold">{entry.total_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          {/* Question Display */}
          {question && (
            <>
              {/* Timer Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <Badge
                    className={cn(
                      timeLeft <= 2
                        ? "bg-red-500"
                        : timeLeft <= 3
                          ? "bg-yellow-500"
                          : "bg-green-500",
                    )}
                  >
                    <Timer className="h-3 w-3 mr-1" />
                    {timeLeft}s
                  </Badge>
                  <Badge variant="outline">
                    {question.points_value} points
                  </Badge>
                </div>
                <Progress
                  value={(timeLeft / (question.time_limit_seconds || 5)) * 100}
                  className={cn(
                    timeLeft <= 2
                      ? "bg-red-200"
                      : timeLeft <= 3
                        ? "bg-yellow-200"
                        : "bg-green-200",
                  )}
                />
              </div>

              {/* Question */}
              <h2 className="text-xl font-bold mb-6">{question.question}</h2>

              {/* Answer Options */}
              <div className="space-y-3">
                {question.options?.map((option: string, idx: number) => (
                  <Button
                    key={idx}
                    variant={
                      showResult && idx === question.correct_answer_index
                        ? "default"
                        : showResult &&
                            idx === selectedAnswer &&
                            !answerResult?.is_correct
                          ? "destructive"
                          : selectedAnswer === idx
                            ? "default"
                            : "outline"
                    }
                    className={cn(
                      "w-full justify-start text-left h-auto py-4 px-6",
                      isAnswering && "hover:scale-102 transition-transform",
                    )}
                    onClick={() => handleAnswer(idx)}
                    disabled={!isAnswering || selectedAnswer !== null}
                  >
                    <span className="font-bold mr-3">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {option}
                    {showResult && idx === question.correct_answer_index && (
                      <CheckCircle className="h-5 w-5 ml-auto text-green-500" />
                    )}
                    {showResult &&
                      idx === selectedAnswer &&
                      !answerResult?.is_correct && (
                        <XCircle className="h-5 w-5 ml-auto text-red-500" />
                      )}
                  </Button>
                ))}
              </div>

              {/* Result Display */}
              {showResult && answerResult && (
                <div
                  className={cn(
                    "mt-6 p-4 rounded-lg",
                    answerResult.is_correct
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-red-500/10 border border-red-500/30",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {answerResult.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-bold">
                      {answerResult.is_correct ? "Correct!" : "Wrong!"}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p>
                      Points earned:{" "}
                      <span className="font-bold">
                        +{answerResult.points_earned}
                      </span>
                    </p>
                    {answerResult.speed_bonus > 0 && (
                      <p className="text-green-600">
                        ⚡ Speed bonus: +{answerResult.speed_bonus}
                      </p>
                    )}
                    {answerResult.streak_bonus > 0 && (
                      <p className="text-purple-600">
                        🔥 Streak bonus: +{answerResult.streak_bonus}
                      </p>
                    )}
                    {answerResult.response_time_ms && (
                      <p className="text-muted-foreground">
                        Response time:{" "}
                        {(answerResult.response_time_ms / 1000).toFixed(1)}s
                      </p>
                    )}
                  </div>

                  {question.explanation && (
                    <div className="mt-3 pt-3 border-t flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <p className="text-sm">{question.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
