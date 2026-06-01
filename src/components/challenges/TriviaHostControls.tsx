// components/challenges/TriviaHostControls.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Play,
  Pause,
  SkipForward,
  Users,
  Timer,
  CheckCircle,
  XCircle,
  Trophy,
  Zap,
  Clock,
  Star,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Award,
  Target,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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
  is_used: boolean;
  question_type: string;
  accepted_answers: string[];
  case_sensitive: boolean;
}

interface TriviaSelection {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
  selected_answer: number;
  is_correct: boolean;
  points_earned: number;
  response_time_ms: number;
  question_shown_at: string;
  answer_submitted_at: string;
}

export function TriviaHostControls({
  challenge,
  onClose,
}: {
  challenge: any;
  onClose: () => void;
}) {
  const { supabase } = useAuth();

  // Game State
  const [gamePhase, setGamePhase] = useState<
    "setup" | "spinning" | "question" | "answer" | "reveal" | "leaderboard"
  >("setup");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(
    null,
  );

  // Selection State
  const [selectedPlayer, setSelectedPlayer] = useState<TriviaSelection | any>(
    null,
  );

  // Answer State
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const timerRef = useRef<NodeJS.Timeout>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Question Management
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TriviaQuestion | null>(
    null,
  );
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer_index: 0,
    difficulty: "medium",
    points_value: 100,
    time_limit_seconds: 5,
    category: "",
    explanation: "",
    question_type: "multiple_choice",
    accepted_answers: [] as string[],
    case_sensitive: false,
  });

  // Host messages
  const [hostMessage, setHostMessage] = useState("");
  const [hostMessages, setHostMessages] = useState<
    Array<{ text: string; time: string }>
  >([]);
  const [participantQueue, setParticipantQueue] = useState<any[]>([]);
  const [currentSelectionId, setCurrentSelectionId] = useState<string | null>(
    null,
  );

  // Get next participant in queue
  const getNextParticipant = async () => {
    if (!currentQuestion) {
      toast.error("Select a question first");
      return;
    }

    try {
      const { data } = await supabase.rpc("get_next_queued_participant", {
        p_challenge_id: challenge.id,
        p_current_question_id: currentQuestion.id,
      });

      if (data?.success) {
        setSelectedPlayer(data);
        setCurrentSelectionId(data.selection_id);
        setGamePhase("question");
        startTimer();

        toast.success(
          `${data.user_name} (Ticket #${data.ticket_number}) is up!`,
        );
      } else {
        toast.error(data?.error || "No participants available");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Pass to next participant
  const passToNext = async (reason: string = "wrong_answer") => {
    if (!currentSelectionId) return;

    try {
      const { data } = await supabase.rpc("pass_to_next_participant", {
        p_selection_id: currentSelectionId,
        p_reason: reason,
      });

      if (data?.all_attempted) {
        toast.info("All participants have attempted this question");
        setGamePhase("reveal");
        return;
      }

      if (data?.success) {
        setSelectedPlayer(data);
        setCurrentSelectionId(data.selection_id);
        setGamePhase("question");
        startTimer();

        toast.success(
          `Passed to ${data.user_name} (Ticket #${data.ticket_number})`,
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Load questions
  const loadQuestions = useCallback(async () => {
    const { data } = await supabase
      .from("challenge_trivia_questions")
      .select("*")
      .eq("challenge_id", challenge.id)
      .order("display_order", { ascending: true });

    setQuestions(data || []);
  }, [challenge.id, supabase]);

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    const { data } = await supabase.rpc("get_trivia_leaderboard", {
      p_challenge_id: challenge.id,
      p_limit: 20,
    });

    setLeaderboard(data || []);
  }, [challenge.id, supabase]);

  useEffect(() => {
    loadQuestions();
    loadLeaderboard();
  }, [loadQuestions, loadLeaderboard]);

  // Real-time subscription for answers
  useEffect(() => {
    const channel = supabase
      .channel(`trivia-host-${challenge.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "challenge_trivia_selections",
          filter: `challenge_id=eq.${challenge.id}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated.status === "answered" || updated.status === "timeout") {
            setSelectedPlayer(updated);
            setShowAnswer(true);
            loadLeaderboard();
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [challenge.id, supabase, loadLeaderboard]);

  // Start timer for question
  const startTimer = () => {
    const timeLimit = currentQuestion?.time_limit_seconds || 5;
    setTimeLeft(timeLimit);
    setShowAnswer(false);
    setAnswerRevealed(false);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && timerRef.current) {
          clearInterval(timerRef.current);
          setGamePhase("answer");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Skip current question
  const skipQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGamePhase("leaderboard");
    setShowAnswer(false);

    if (currentQuestion) {
      markQuestionUsed(currentQuestion.id);
    }
  };

  // Reveal answer
  const revealAnswer = () => {
    setAnswerRevealed(true);
    setGamePhase("reveal");

    // Broadcast answer to live display
    if (currentQuestion && selectedPlayer) {
      supabase.from("challenge_live_ticker").insert({
        challenge_id: challenge.id,
        user_name: selectedPlayer.user_name || "Player",
        action_text: selectedPlayer.is_correct
          ? "✅ Correct answer!"
          : "❌ Wrong answer!",
        points_awarded: selectedPlayer.points_earned || 0,
      });
    }
  };

  // Next question
  const nextQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentQuestion) {
      markQuestionUsed(currentQuestion.id);
    }

    setCurrentQuestion(null);
    setSelectedPlayer(null);
    setShowAnswer(false);
    setAnswerRevealed(false);
    setGamePhase("setup");
  };

  // Mark question as used
  const markQuestionUsed = async (questionId: string) => {
    await supabase
      .from("challenge_trivia_questions")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", questionId);

    loadQuestions();
  };

  // Select question to use
  const selectQuestion = (question: TriviaQuestion) => {
    setCurrentQuestion(question);
    setGamePhase("setup");
    toast.success(
      `Question selected: ${question.question.substring(0, 50)}...`,
    );
  };

  // Save new/edit question
  const saveQuestion = async () => {
    if (!newQuestion.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    try {
      const questionData = {
        challenge_id: challenge.id,
        ...newQuestion,
        display_order: questions.length,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from("challenge_trivia_questions")
          .update(questionData)
          .eq("id", editingQuestion.id);
        if (error) {
          console.log("Error adding new question", error);
          throw error;
        }
        toast.success("Question updated!");
      } else {
        const { error } = await supabase
          .from("challenge_trivia_questions")
          .insert(questionData);
        if (error) {
          console.log("Error adding new question", error);
          throw error;
        }
        toast.success("Question added!");
      }

      setShowQuestionEditor(false);
      setEditingQuestion(null);
      resetQuestionForm();
      loadQuestions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetQuestionForm = () => {
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correct_answer_index: 0,
      difficulty: "medium",
      points_value: 100,
      time_limit_seconds: 5,
      category: "",
      explanation: "",
      question_type: "multiple_choice",
      accepted_answers: [],
      case_sensitive: false,
    });
  };

  // Send host message
  const sendHostMessage = () => {
    if (!hostMessage.trim()) return;

    setHostMessages((prev) => [
      ...prev,
      {
        text: hostMessage,
        time: new Date().toISOString(),
      },
    ]);

    // Broadcast to live ticker
    supabase.from("challenge_live_ticker").insert({
      challenge_id: challenge.id,
      user_name: "Host",
      action_text: `📢 ${hostMessage}`,
      points_awarded: 0,
    });

    setHostMessage("");
  };

  // Declare winner
  const declareWinner = async () => {
    if (leaderboard.length === 0) return;

    const winner = leaderboard[0];

    await supabase.from("challenge_live_ticker").insert({
      challenge_id: challenge.id,
      user_name: winner.full_name,
      action_text: `🏆 WINNER! ${winner.total_score} points with ${winner.correct_answers}/${winner.questions_answered} correct!`,
      points_awarded: winner.total_score,
    });

    toast.success(`${winner.full_name} declared winner!`);
  };

  // Load participant queue
  const loadParticipantQueue = useCallback(async () => {
    const { data } = await supabase.rpc("get_trivia_queue_status", {
      p_challenge_id: challenge.id,
    });

    setParticipantQueue(data || []);
  }, [challenge.id, supabase]);

  // Load queue on mount and periodically
  useEffect(() => {
    loadParticipantQueue();
    const interval = setInterval(loadParticipantQueue, 5000);
    return () => clearInterval(interval);
  }, [loadParticipantQueue]);

  return (
    <div className="space-y-6">
      {/* Game Phase Indicator */}
      <div className="flex items-center gap-2">
        <Badge
          className={cn(
            "text-lg px-3 py-1",
            gamePhase === "spinning" && "bg-yellow-500 animate-pulse",
            gamePhase === "question" && "bg-blue-500",
            gamePhase === "reveal" && "bg-green-500",
          )}
        >
          {gamePhase === "setup" && "Ready"}
          {gamePhase === "spinning" && "🎡 Spinning..."}
          {gamePhase === "question" && "⏱️ Answering..."}
          {gamePhase === "answer" && "⏰ Time's Up!"}
          {gamePhase === "reveal" && "👀 Revealing"}
          {gamePhase === "leaderboard" && "🏆 Results"}
        </Badge>
      </div>

      <Tabs defaultValue="game">
        <TabsList>
          <TabsTrigger value="game">Game Control</TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({questions.filter((q) => !q.is_used).length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* Game Control Tab */}
        <TabsContent value="game" className="space-y-4">
          {/* Question Selection */}
          {!currentQuestion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Question</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {questions
                    .filter((q) => !q.is_used)
                    .map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                        onClick={() => selectQuestion(q)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{q.question}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {q.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {q.points_value} pts
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {q.time_limit_seconds}s
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Question Display */}
          {currentQuestion && (
            <>
              <Card className="border-2 border-yellow-500/30">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <Badge className="mb-2">
                      {currentQuestion.difficulty} •{" "}
                      {currentQuestion.points_value} pts •{" "}
                      {currentQuestion.time_limit_seconds}s
                    </Badge>
                    <h3 className="text-xl font-bold">
                      {currentQuestion.question}
                    </h3>
                  </div>

                  {/* Answer Options Preview */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {currentQuestion.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-2 rounded border text-sm",
                          answerRevealed &&
                            idx === currentQuestion.correct_answer_index
                            ? "border-green-500 bg-green-500/20"
                            : "border-muted",
                        )}
                      >
                        <span className="font-bold">
                          {String.fromCharCode(65 + idx)}.
                        </span>{" "}
                        {option}
                      </div>
                    ))}
                  </div>

                  {/* Timer Display */}
                  {(gamePhase === "question" || gamePhase === "answer") && (
                    <div className="text-center mb-4">
                      <div
                        className={cn(
                          "text-4xl font-bold",
                          timeLeft <= 2
                            ? "text-red-500 animate-pulse"
                            : "text-yellow-500",
                        )}
                      >
                        {timeLeft}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        seconds remaining
                      </p>
                    </div>
                  )}

                  {/* Selected Player */}
                  {selectedPlayer && (
                    <div className="p-3 rounded-lg bg-purple-500/10 mb-4">
                      <p className="font-medium">
                        Answering: {selectedPlayer.user_name}
                      </p>
                      {selectedPlayer.status === "answered" && (
                        <div className="flex items-center gap-2 mt-1">
                          {selectedPlayer.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>
                            {selectedPlayer.is_correct ? "Correct!" : "Wrong!"}
                            {selectedPlayer.points_earned > 0 &&
                              ` (+${selectedPlayer.points_earned} pts)`}
                          </span>
                          {selectedPlayer.response_time_ms && (
                            <span className="text-xs text-muted-foreground">
                              (
                              {(selectedPlayer.response_time_ms / 1000).toFixed(
                                1,
                              )}
                              s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {gamePhase === "setup" && (
                      <Button
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                        onClick={getNextParticipant}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Call Next Participant
                      </Button>
                    )}

                    {(gamePhase === "question" || gamePhase === "answer") &&
                      !answerRevealed && (
                        <>
                          <Button className="flex-1" onClick={revealAnswer}>
                            <Eye className="h-4 w-4 mr-2" />
                            Reveal Answer
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => passToNext("wrong_answer")}
                          >
                            <SkipForward className="h-4 w-4 mr-2" />
                            Pass to Next
                          </Button>
                        </>
                      )}

                    {answerRevealed && (
                      <>
                        {selectedPlayer?.is_correct ? (
                          <Button
                            className="flex-1 bg-green-600"
                            onClick={nextQuestion}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Correct! Next Question
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 bg-orange-600"
                            onClick={() => passToNext("wrong_answer")}
                          >
                            <SkipForward className="h-4 w-4 mr-2" />
                            Pass to Next Player
                          </Button>
                        )}
                      </>
                    )}

                    <Button variant="outline" onClick={skipQuestion}>
                      Skip Question
                    </Button>
                  </div>

                  {/* Explanation */}
                  {answerRevealed && currentQuestion.explanation && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10">
                      <p className="text-sm font-medium">Explanation:</p>
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participant Queue Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participant Queue ({participantQueue.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {participantQueue.map((p) => (
                      <div
                        key={p.ticket_number}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          p.current_status === "answering" &&
                            "bg-yellow-500/10 border border-yellow-500/30",
                          p.current_status === "eliminated" &&
                            "bg-red-500/10 opacity-50",
                          p.current_status === "waiting" && "bg-muted/30",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Badge className="text-lg font-mono">
                            #{p.ticket_number}
                          </Badge>
                          <div>
                            <p className="font-medium">{p.user_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Score: {p.total_score} • {p.correct_answers}/
                              {p.questions_answered} correct
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            p.current_status === "answering" &&
                              "bg-yellow-500 text-white animate-pulse",
                            p.current_status === "waiting" &&
                              "bg-blue-500/20 text-blue-400",
                            p.current_status === "eliminated" &&
                              "bg-red-500/20 text-red-400",
                          )}
                        >
                          {p.current_status}
                        </Badge>
                      </div>
                    ))}

                    {participantQueue.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No participants yet. Players join via Spin & Win!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">All Questions</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingQuestion(null);
                  resetQuestionForm();
                  setShowQuestionEditor(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            </div>

            <div className="space-y-2">
              {questions.map((q) => (
                <Card key={q.id} className={cn(q.is_used && "opacity-50")}>
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{q.question}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{q.difficulty}</Badge>
                          <Badge variant="outline">{q.points_value} pts</Badge>
                          <Badge variant="outline">
                            {q.time_limit_seconds}s
                          </Badge>
                          {q.is_used && <Badge variant="secondary">Used</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingQuestion(q);
                            setNewQuestion({
                              question: q.question,
                              options: q.options,
                              correct_answer_index: q.correct_answer_index,
                              difficulty: q.difficulty,
                              points_value: q.points_value,
                              time_limit_seconds: q.time_limit_seconds,
                              category: q.category || "",
                              explanation: q.explanation || "",
                              question_type: q.question_type || "",
                              accepted_answers: q.accepted_answers || [],
                              case_sensitive: q.case_sensitive,
                            });
                            setShowQuestionEditor(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await supabase
                              .from("challenge_trivia_questions")
                              .delete()
                              .eq("id", q.id);
                            loadQuestions();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Current Standings</h3>
              <Button size="sm" onClick={declareWinner}>
                <Trophy className="h-4 w-4 mr-1" />
                Declare Winner
              </Button>
            </div>

            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.user_id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    idx === 0
                      ? "bg-yellow-500/10 border border-yellow-500/30"
                      : "bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {idx === 0
                        ? "🥇"
                        : idx === 1
                          ? "🥈"
                          : idx === 2
                            ? "🥉"
                            : `#${idx + 1}`}
                    </span>
                    <div>
                      <p className="font-bold">{entry.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.correct_answers}/{entry.questions_answered}{" "}
                        correct • {entry.accuracy}% accuracy
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{entry.total_score}</p>
                    {entry.current_streak > 0 && (
                      <p className="text-xs text-orange-500">
                        {entry.current_streak}🔥 streak
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Send a message to viewers..."
                value={hostMessage}
                onChange={(e) => setHostMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendHostMessage()}
              />
              <Button onClick={sendHostMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {hostMessages.map((msg, idx) => (
                <div key={idx} className="p-2 rounded bg-muted/30 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.time), {
                      addSuffix: true,
                    })}
                  </span>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Question Editor Dialog */}
      <Dialog open={showQuestionEditor} onOpenChange={setShowQuestionEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "Modify the question details and save to update."
                : "Fill in the details for your new trivia question."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Question Type</Label>
                <Select
                  value={newQuestion.question_type || "multiple_choice"}
                  onValueChange={(v) =>
                    setNewQuestion({ ...newQuestion, question_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">
                      Multiple Choice
                    </SelectItem>
                    <SelectItem value="true_false">True / False</SelectItem>
                    <SelectItem value="open_ended">
                      Open Ended (Type Answer)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={newQuestion.difficulty}
                  onValueChange={(v) =>
                    setNewQuestion({ ...newQuestion, difficulty: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Answer options - only show for multiple choice */}
            {(newQuestion.question_type === "multiple_choice" ||
              !newQuestion.question_type) && (
              <div>
                <Label>Answer Options</Label>
                <div className="space-y-2">
                  {newQuestion.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="font-bold w-6">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[idx] = e.target.value;
                          setNewQuestion({
                            ...newQuestion,
                            options: newOptions,
                          });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="mt-2">Correct Answer</Label>
                  <Select
                    value={newQuestion.correct_answer_index.toString()}
                    onValueChange={(v) =>
                      setNewQuestion({
                        ...newQuestion,
                        correct_answer_index: parseInt(v),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">A</SelectItem>
                      <SelectItem value="1">B</SelectItem>
                      <SelectItem value="2">C</SelectItem>
                      <SelectItem value="3">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* True/False answer */}
            {newQuestion.question_type === "true_false" && (
              <div>
                <Label>Correct Answer</Label>
                <Select
                  value={newQuestion.correct_answer_index.toString()}
                  onValueChange={(v) =>
                    setNewQuestion({
                      ...newQuestion,
                      correct_answer_index: parseInt(v),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">True</SelectItem>
                    <SelectItem value="1">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Open-ended accepted answers */}
            {newQuestion.question_type === "open_ended" && (
              <div>
                <Label>Accepted Answers (comma-separated)</Label>
                <Input
                  placeholder="e.g., nairobi, Nairobi, NAIROBI"
                  value={newQuestion.accepted_answers?.join(", ") || ""}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      accepted_answers: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={newQuestion.case_sensitive || false}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        case_sensitive: e.target.checked,
                      })
                    }
                    id="case-sensitive"
                  />
                  <Label htmlFor="case-sensitive" className="text-sm">
                    Case sensitive
                  </Label>
                </div>
              </div>
            )}
            <div>
              <Label>Question *</Label>
              <Textarea
                value={newQuestion.question}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, question: e.target.value })
                }
                placeholder="Enter your trivia question..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Time (seconds)</Label>
                <Input
                  type="number"
                  value={newQuestion.time_limit_seconds}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      time_limit_seconds: parseInt(e.target.value),
                    })
                  }
                  min={3}
                  max={30}
                />
              </div>
              <div>
                <Label>Points Value</Label>
                <Input
                  type="number"
                  value={newQuestion.points_value}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      points_value: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={newQuestion.category}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, category: e.target.value })
                  }
                  placeholder="e.g., Sports, History"
                />
              </div>
            </div>

            <div>
              <Label>Explanation (shown after answer)</Label>
              <Textarea
                value={newQuestion.explanation}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    explanation: e.target.value,
                  })
                }
                placeholder="Explain why this is the correct answer..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowQuestionEditor(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveQuestion}>
              {editingQuestion ? "Update" : "Add"} Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
