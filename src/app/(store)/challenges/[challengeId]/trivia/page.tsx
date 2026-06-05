// app/(store)/challenges/[challengeId]/trivia/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  CheckCircle,
  XCircle,
  Timer,
  Lightbulb,
  Users,
  Ticket,
  Clock,
  Zap,
  Flame,
  Trophy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  difficulty: string;
  points_value: number;
  time_limit_seconds: number;
  category: string;
  explanation: string;
  display_order: number;
}

interface TriviaSelection {
  id: string;
  challenge_id: string;
  question_id: string;
  user_id: string;
  participant_id: string;
  ticket_number: number;
  queue_position: number;
  attempt_number: number;
  selected_answer: number | null;
  is_correct: boolean | null;
  points_earned: number;
  question_shown_at: string;
  answer_submitted_at: string | null;
  response_time_ms: number | null;
  status:
    | "queued"
    | "current"
    | "answered"
    | "timeout"
    | "passed"
    | "skipped"
    | "eliminated";
}

interface TriviaScore {
  total_score: number;
  correct_answers: number;
  questions_answered: number;
  current_streak: number;
  best_streak: number;
  accuracy: number;
}

interface QueueStatus {
  ticket_number: number;
  user_name: string;
  queue_position: number;
  is_active: boolean;
  total_score: number;
  questions_answered: number;
  correct_answers: number;
  current_status: "answering" | "eliminated" | "waiting";
}

export default function TriviaChallengePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  // Game state
  const [gamePhase, setGamePhase] = useState<
    "loading" | "waiting" | "answering" | "result" | "eliminated"
  >("loading");
  const [currentSelection, setCurrentSelection] =
    useState<TriviaSelection | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(
    null,
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const questionShownAtRef = useRef<number | null>(null);

  // Score and queue
  const [myScore, setMyScore] = useState<TriviaScore | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [queueParticipants, setQueueParticipants] = useState<QueueStatus[]>([]);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!profile?.id || !challengeId) return;

    try {
      // Load my score
      const { data: scoreData } = await supabase
        .from("challenge_trivia_scores")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (scoreData) {
        setMyScore(scoreData);
      } else {
        // Set default score
        setMyScore({
          total_score: 0,
          correct_answers: 0,
          questions_answered: 0,
          current_streak: 0,
          best_streak: 0,
          accuracy: 0,
        });
      }

      // Check if I'm eliminated
      const { data: eliminationCheck } = await supabase
        .from("challenge_trivia_selections")
        .select("status")
        .eq("challenge_id", challengeId)
        .eq("user_id", profile.id)
        .eq("status", "eliminated")
        .limit(1);

      if (eliminationCheck && eliminationCheck.length > 0) {
        setGamePhase("eliminated");
        return;
      }

      // Check if I have a current selection (currently answering)
      const { data: currentSelectionData } = await supabase
        .from("challenge_trivia_selections")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("user_id", profile.id)
        .in("status", ["current", "answered"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentSelectionData) {
        setCurrentSelection(currentSelectionData);

        if (currentSelectionData.status === "current") {
          // I'm currently answering - load the question
          await loadQuestion(currentSelectionData.question_id);
          setGamePhase("answering");

          // Calculate remaining time
          if (currentSelectionData.question_shown_at) {
            const shownAt = new Date(
              currentSelectionData.question_shown_at,
            ).getTime();
            const timeLimit = (currentQuestion?.time_limit_seconds || 5) * 1000;
            const elapsed = Date.now() - shownAt;
            const remaining = Math.max(
              0,
              Math.ceil((timeLimit - elapsed) / 1000),
            );

            if (remaining > 0) {
              startTimer(remaining);
            } else {
              // Time already expired
              setGamePhase("result");
              setAnswerResult({
                is_correct: false,
                points_earned: 0,
                message: "Time's up! ⏰",
              });
            }
          }
        } else if (currentSelectionData.status === "answered") {
          // I already answered - show result
          await loadQuestion(currentSelectionData.question_id);
          setGamePhase("result");
          setSelectedAnswer(currentSelectionData.selected_answer);
          setAnswerResult({
            is_correct: currentSelectionData.is_correct,
            points_earned: currentSelectionData.points_earned,
            message: currentSelectionData.is_correct
              ? "Correct! 🎉"
              : "Wrong! 😔",
          });
        }
      } else {
        // No current selection - waiting for host to call me
        setGamePhase("waiting");

        // Load queue position
        await loadQueueStatus();
      }

      // Load leaderboard
      await loadLeaderboard();
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Failed to load game data");
      setGamePhase("loading");
    }
  }, [challengeId, profile?.id, supabase]);

  // Load question details
  const loadQuestion = async (questionId: string) => {
    const { data } = await supabase
      .from("challenge_trivia_questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (data) {
      setCurrentQuestion(data);
    }
  };

  // Load leaderboard
  const loadLeaderboard = async () => {
    const { data } = await supabase.rpc("get_trivia_leaderboard", {
      p_challenge_id: challengeId,
      p_limit: 20,
    });

    setLeaderboard(data || []);
  };

  // Load queue status for this user
  const loadQueueStatus = async () => {
    if (!profile?.id) return;

    try {
      const { data } = await supabase.rpc("get_trivia_queue_status", {
        p_challenge_id: challengeId,
      });

      if (data) {
        setQueueParticipants(data);

        // Find my position
        const myStatus = data.find(
          (p: QueueStatus) =>
            p.user_name === profile.full_name || p.user_name === profile.email,
        );

        if (myStatus) {
          setQueueStatus(myStatus);
        }
      }
    } catch (error) {
      console.error("Error loading queue status:", error);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!profile?.id || !challengeId) return;

    loadInitialData();

    // Subscribe to my selections
    const selectionChannel = supabase
      .channel(`trivia-player-${challengeId}-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_trivia_selections",
          filter: `challenge_id=eq.${challengeId} AND user_id=eq.${profile.id}`,
        },
        async (payload) => {
          const selection = payload.new as TriviaSelection;

          if (payload.eventType === "INSERT") {
            if (selection.status === "current") {
              // Host selected me!
              setCurrentSelection(selection);
              await loadQuestion(selection.question_id);
              setGamePhase("answering");
              setSelectedAnswer(null);
              setAnswerResult(null);
              questionShownAtRef.current = Date.now();

              // Start timer with question's time limit
              if (currentQuestion?.time_limit_seconds) {
                startTimer(currentQuestion.time_limit_seconds);
              } else {
                // Load question first then start timer
                const { data: questionData } = await supabase
                  .from("challenge_trivia_questions")
                  .select("time_limit_seconds")
                  .eq("id", selection.question_id)
                  .single();

                startTimer(questionData?.time_limit_seconds || 5);
              }
            }
          } else if (payload.eventType === "UPDATE") {
            setCurrentSelection(selection);

            if (selection.status === "answered") {
              // My answer was processed
              setGamePhase("result");
              if (timerRef.current) clearInterval(timerRef.current);
              setSelectedAnswer(selection.selected_answer);
              setAnswerResult({
                is_correct: selection.is_correct,
                points_earned: selection.points_earned,
                message: selection.is_correct ? "Correct! 🎉" : "Wrong! 😔",
              });

              // Reload score
              await loadInitialData();

              if (selection.is_correct) {
                toast.success(`Correct! +${selection.points_earned} points`);
              } else {
                toast.error("Wrong answer!");
              }
            } else if (selection.status === "timeout") {
              // Time ran out
              setGamePhase("result");
              if (timerRef.current) clearInterval(timerRef.current);
              setAnswerResult({
                is_correct: false,
                points_earned: 0,
                message: "Time's up! ⏰",
              });
            } else if (selection.status === "passed") {
              // Host passed to next player
              setGamePhase("waiting");
              if (timerRef.current) clearInterval(timerRef.current);
              toast.info("Question passed to next player");
              await loadQueueStatus();
            } else if (selection.status === "eliminated") {
              // I was eliminated
              setGamePhase("eliminated");
              toast.error("You've been eliminated from the game");
            }
          }
        },
      )
      .subscribe();

    // Subscribe to leaderboard updates
    const leaderboardChannel = supabase
      .channel(`trivia-leaderboard-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_trivia_scores",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          loadLeaderboard();
          loadQueueStatus();
        },
      )
      .subscribe();

    return () => {
      selectionChannel.unsubscribe();
      leaderboardChannel.unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [challengeId, profile?.id, supabase, loadInitialData]);

  // Timer logic
  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Don't auto-submit - the host will handle timeout via real-time
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle answer submission
  const handleAnswer = async (answerIndex: number) => {
    if (
      gamePhase !== "answering" ||
      selectedAnswer !== null ||
      !currentSelection ||
      isSubmitting
    ) {
      return;
    }

    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);

    try {
      const responseTimeMs = questionShownAtRef.current
        ? Date.now() - questionShownAtRef.current
        : 0;

      // Submit answer via RPC
      const { data, error } = await supabase.rpc("submit_trivia_answer", {
        p_selection_id: currentSelection.id,
        p_answer_index: answerIndex,
        p_response_time_ms: responseTimeMs,
      });

      if (error) throw error;

      // The real-time subscription will handle the result display
      toast.success("Answer submitted!");
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      toast.error(error.message || "Failed to submit answer");
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (gamePhase === "loading") {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Loading Game</h2>
            <p className="text-muted-foreground">
              Setting up your trivia experience...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Eliminated state
  if (gamePhase === "eliminated") {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Eliminated</h2>
            <p className="text-muted-foreground mb-6">
              You've been eliminated from this round. Better luck next time!
            </p>

            {myScore && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-yellow-600">
                    {myScore.total_score}
                  </p>
                  <p className="text-xs text-muted-foreground">Final Score</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-green-600">
                    {myScore.correct_answers}/{myScore.questions_answered}
                  </p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-purple-600">
                    {myScore.current_streak}🔥
                  </p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              </div>
            )}

            <Button onClick={() => router.push(`/challenges/${challengeId}`)}>
              View Challenge Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting state
  if (gamePhase === "waiting") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6 max-w-4xl mx-auto">
          {/* Waiting Card */}
          <Card>
            <CardContent className="p-12 text-center">
              <Brain className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2">Waiting for Your Turn</h2>
              <p className="text-muted-foreground mb-2">
                The host will call participants one at a time to answer
                questions
              </p>

              {queueStatus && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Ticket className="h-5 w-5 text-blue-500" />
                  <span className="font-bold">
                    Your Ticket: #{queueStatus.ticket_number}
                  </span>
                  <Badge variant="outline">
                    Position #{queueStatus.queue_position}
                  </Badge>
                </div>
              )}

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Stay ready! When selected, you'll have limited time to answer
                </span>
              </div>
            </CardContent>
          </Card>

          {/* My Stats */}
          {myScore && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">My Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <p className="text-2xl font-bold text-yellow-600">
                      {myScore.total_score}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Score</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <p className="text-2xl font-bold text-green-600">
                      {myScore.correct_answers}/{myScore.questions_answered}
                    </p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <p className="text-2xl font-bold text-blue-600">
                      {myScore.accuracy}%
                    </p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <p className="text-2xl font-bold text-purple-600">
                      {myScore.current_streak}🔥
                    </p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Queue Participants */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Participant Queue</h3>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {queueParticipants.length} participants
                </Badge>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {queueParticipants.map((participant) => (
                  <div
                    key={participant.ticket_number}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      participant.current_status === "answering" &&
                        "bg-yellow-500/10 border border-yellow-500/30",
                      participant.current_status === "eliminated" &&
                        "bg-red-500/10 opacity-50",
                      participant.user_name ===
                        (profile?.full_name || profile?.email) &&
                        "ring-2 ring-blue-500",
                      participant.current_status === "waiting" && "bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="text-lg font-mono">
                        #{participant.ticket_number}
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {participant.user_name}
                          {participant.user_name ===
                            (profile?.full_name || profile?.email) && (
                            <span className="text-blue-500 ml-1">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score: {participant.total_score} •{" "}
                          {participant.correct_answers}/
                          {participant.questions_answered}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        participant.current_status === "answering" &&
                          "bg-yellow-500 text-white animate-pulse",
                        participant.current_status === "waiting" &&
                          "bg-blue-500/20 text-blue-400",
                        participant.current_status === "eliminated" &&
                          "bg-red-500/20 text-red-400",
                      )}
                    >
                      {participant.current_status}
                    </Badge>
                  </div>
                ))}

                {queueParticipants.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No participants in queue yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mini Leaderboard */}
          {leaderboard.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Top Players</h3>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, idx) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between p-2 rounded"
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Answering state
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          {currentQuestion && (
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
                      timeLeft <= 2 && "animate-pulse",
                    )}
                  >
                    <Timer className="h-3 w-3 mr-1" />
                    {timeLeft}s
                  </Badge>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      <Zap className="h-3 w-3 mr-1" />
                      {currentQuestion.points_value} pts
                    </Badge>
                    <Badge variant="outline">
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={
                    (timeLeft / (currentQuestion.time_limit_seconds || 5)) * 100
                  }
                  className={cn(
                    "h-2",
                    timeLeft <= 2
                      ? "bg-red-200"
                      : timeLeft <= 3
                        ? "bg-yellow-200"
                        : "bg-green-200",
                  )}
                />
              </div>

              {/* Question */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.category && (
                  <Badge variant="secondary" className="text-xs">
                    {currentQuestion.category}
                  </Badge>
                )}
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.options?.map((option: string, idx: number) => (
                  <Button
                    key={idx}
                    variant={
                      gamePhase === "result" &&
                      idx === currentQuestion.correct_answer_index
                        ? "default"
                        : gamePhase === "result" &&
                            idx === selectedAnswer &&
                            !answerResult?.is_correct
                          ? "destructive"
                          : selectedAnswer === idx
                            ? "default"
                            : "outline"
                    }
                    className={cn(
                      "w-full justify-start text-left h-auto py-4 px-6 text-base",
                      gamePhase === "answering" &&
                        !isSubmitting &&
                        "hover:scale-[1.02] transition-transform",
                      isSubmitting && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => handleAnswer(idx)}
                    disabled={
                      gamePhase !== "answering" ||
                      selectedAnswer !== null ||
                      isSubmitting
                    }
                  >
                    <span className="font-bold mr-3 text-lg">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="flex-1">{option}</span>
                    {gamePhase === "result" &&
                      idx === currentQuestion.correct_answer_index && (
                        <CheckCircle className="h-5 w-5 ml-2 text-green-500 flex-shrink-0" />
                      )}
                    {gamePhase === "result" &&
                      idx === selectedAnswer &&
                      !answerResult?.is_correct && (
                        <XCircle className="h-5 w-5 ml-2 text-red-500 flex-shrink-0" />
                      )}
                  </Button>
                ))}
              </div>

              {/* Submitting indicator */}
              {isSubmitting && (
                <div className="mt-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-yellow-500" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Submitting answer...
                  </p>
                </div>
              )}

              {/* Result Display */}
              {gamePhase === "result" && answerResult && (
                <div
                  className={cn(
                    "mt-6 p-6 rounded-lg border",
                    answerResult.is_correct
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30",
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {answerResult.is_correct ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <span className="text-lg font-bold">
                      {answerResult.message}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Points earned:</span>
                      <span className="font-bold text-lg">
                        {answerResult.is_correct ? "+" : ""}
                        {answerResult.points_earned}
                      </span>
                    </div>

                    {answerResult.speed_bonus > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>⚡ Speed bonus:</span>
                        <span className="font-bold">
                          +{answerResult.speed_bonus}
                        </span>
                      </div>
                    )}

                    {answerResult.streak_bonus > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>🔥 Streak bonus:</span>
                        <span className="font-bold">
                          +{answerResult.streak_bonus}
                        </span>
                      </div>
                    )}

                    {answerResult.response_time_ms && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Response time:</span>
                        <span>
                          {(answerResult.response_time_ms / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>

                  {currentQuestion.explanation && (
                    <div className="mt-4 pt-4 border-t flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{currentQuestion.explanation}</p>
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
