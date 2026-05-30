// app/(admin)/admin/marketing/challenges/social-submissions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Loader2,
  Clock,
  Filter,
  Search,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Music,
  Globe,
  Flag,
  Check,
  X,
  MessageSquare,
  Calendar,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SocialSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  post_url: string;
  platform: string;
  hashtag: string;
  caption: string;
  screenshot_url: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  reviewer_id: string;
  review_notes: string;
  points_awarded: number;
  bonus_points: number;
  created_at: string;
  updated_at: string;
  // Joined data
  users?: {
    full_name: string;
    email: string;
  };
  challenges?: {
    name: string;
    challenge_type: string;
    scoring_config: any;
  };
}

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  tiktok: Music,
  linkedin: Globe,
  youtube: Youtube,
  other: Globe,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-700 border-blue-300",
  twitter: "bg-sky-100 text-sky-700 border-sky-300",
  instagram: "bg-pink-100 text-pink-700 border-pink-300",
  tiktok: "bg-gray-100 text-gray-700 border-gray-300",
  linkedin: "bg-blue-200 text-blue-800 border-blue-400",
  youtube: "bg-red-100 text-red-700 border-red-300",
  other: "bg-purple-100 text-purple-700 border-purple-300",
};

export default function SocialSubmissionsAdminPage() {
  const { supabase } = useAuth();
  const [submissions, setSubmissions] = useState<SocialSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] =
    useState<SocialSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [bonusPoints, setBonusPoints] = useState(0);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
  });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("challenge_social_submissions")
        .select(
          `
          *,
          users:user_id(full_name, email),
          challenges:challenge_id(name, challenge_type, scoring_config)
        `,
        )
        .order("created_at", { ascending: false });

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      if (platformFilter !== "all") {
        query = query.eq("platform", platformFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSubmissions(data || []);

      // Calculate stats
      const { data: allSubmissions } = await supabase
        .from("challenge_social_submissions")
        .select("status");

      if (allSubmissions) {
        setStats({
          pending: allSubmissions.filter((s) => s.status === "pending").length,
          approved: allSubmissions.filter((s) => s.status === "approved")
            .length,
          rejected: allSubmissions.filter((s) => s.status === "rejected")
            .length,
          flagged: allSubmissions.filter((s) => s.status === "flagged").length,
        });
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [supabase, activeTab, platformFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("social-submissions-admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_social_submissions",
        },
        () => {
          fetchSubmissions();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, fetchSubmissions]);

  const handleApprove = async (submission: SocialSubmission) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc(
        "process_social_submission_approval",
        {
          p_submission_id: submission.id,
          p_reviewer_id: (await supabase.auth.getUser()).data.user?.id,
          p_notes: reviewNotes,
          p_bonus_points: bonusPoints,
        },
      );

      if (error) throw error;

      toast.success(
        `Submission approved! +${data.points_awarded} points awarded`,
      );
      setReviewDialogOpen(false);
      setReviewNotes("");
      setBonusPoints(0);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve submission");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (submission: SocialSubmission) => {
    if (!reviewNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc("reject_social_submission", {
        p_submission_id: submission.id,
        p_reviewer_id: (await supabase.auth.getUser()).data.user?.id,
        p_notes: reviewNotes,
      });

      if (error) throw error;

      toast.success("Submission rejected");
      setReviewDialogOpen(false);
      setReviewNotes("");
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject submission");
    } finally {
      setProcessing(false);
    }
  };

  const handleFlag = async (submission: SocialSubmission) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("challenge_social_submissions")
        .update({
          status: "flagged",
          review_notes: "Flagged for further review",
          updated_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (error) throw error;

      toast.success("Submission flagged for review");
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const openReviewDialog = (submission: SocialSubmission) => {
    setSelectedSubmission(submission);
    setReviewNotes("");
    setBonusPoints(
      submission.challenges?.scoring_config?.bonus_for_verified || 25,
    );
    setReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: any;
      }
    > = {
      pending: { label: "Pending", variant: "secondary", icon: Clock },
      approved: { label: "Approved", variant: "default", icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
      flagged: { label: "Flagged", variant: "destructive", icon: Flag },
    };
    const c = config[status];
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.hashtag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.post_url?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Social Share Submissions</h1>
          <p className="text-muted-foreground mt-1">
            Review and verify social media challenge submissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card
          className={cn(
            "cursor-pointer",
            activeTab === "pending" && "ring-2 ring-yellow-500",
          )}
          onClick={() => setActiveTab("pending")}
        >
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer",
            activeTab === "approved" && "ring-2 ring-green-500",
          )}
          onClick={() => setActiveTab("approved")}
        >
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.approved}</p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer",
            activeTab === "rejected" && "ring-2 ring-red-500",
          )}
          onClick={() => setActiveTab("rejected")}
        >
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.rejected}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer",
            activeTab === "flagged" && "ring-2 ring-orange-500",
          )}
          onClick={() => setActiveTab("flagged")}
        >
          <CardContent className="p-4 text-center">
            <Flag className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.flagged}</p>
            <p className="text-sm text-muted-foreground">Flagged</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user, hashtag, or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="flagged">Flagged</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
          <p className="text-muted-foreground">
            {activeTab === "pending"
              ? "All caught up! No pending submissions to review."
              : "No submissions match your filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const PlatformIcon = PLATFORM_ICONS[submission.platform] || Globe;
            const platformColor = PLATFORM_COLORS[submission.platform] || "";

            return (
              <Card
                key={submission.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left - Submission Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn("gap-1", platformColor)}>
                          <PlatformIcon className="h-3 w-3" />
                          {submission.platform}
                        </Badge>
                        {getStatusBadge(submission.status)}
                        {submission.points_awarded > 0 && (
                          <Badge variant="outline">
                            <Trophy className="h-3 w-3 mr-1" />+
                            {submission.points_awarded +
                              submission.bonus_points}{" "}
                            pts
                          </Badge>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {submission.users?.full_name || "Anonymous"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {submission.users?.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Challenge: {submission.challenges?.name}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Hashtag:</span>{" "}
                          <span className="text-purple-600">
                            #{submission.hashtag}
                          </span>
                        </p>
                        {submission.caption && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {submission.caption}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Submitted{" "}
                          {formatDistanceToNow(
                            new Date(submission.created_at),
                            { addSuffix: true },
                          )}
                        </span>
                      </div>

                      {submission.review_notes && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm font-medium">Review Notes:</p>
                          <p className="text-sm text-muted-foreground">
                            {submission.review_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right - Actions */}
                    <div className="flex flex-col gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(submission.post_url, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Post
                      </Button>
                      {submission.screenshot_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(submission.screenshot_url, "_blank")
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Screenshot
                        </Button>
                      )}
                      {submission.status === "pending" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openReviewDialog(submission)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Social Share Submission</DialogTitle>
            <DialogDescription>
              Verify the post content and decide whether to approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6 py-4">
              {/* Submission Details */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">User:</span>
                  <span>{selectedSubmission.users?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Platform:</span>
                  <Badge
                    className={PLATFORM_COLORS[selectedSubmission.platform]}
                  >
                    {selectedSubmission.platform}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Hashtag:</span>
                  <span className="text-purple-600">
                    #{selectedSubmission.hashtag}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Challenge:</span>
                  <span>{selectedSubmission.challenges?.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Post URL:</span>
                  <a
                    href={selectedSubmission.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-2 text-sm break-all"
                  >
                    {selectedSubmission.post_url}
                  </a>
                </div>
                {selectedSubmission.caption && (
                  <div>
                    <span className="text-sm font-medium">Caption:</span>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {selectedSubmission.caption}
                    </p>
                  </div>
                )}
              </div>

              {/* Review Actions */}
              <div className="space-y-4">
                <div>
                  <Label>Bonus Points</Label>
                  <Input
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(parseInt(e.target.value))}
                    placeholder="Bonus points for quality content"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Base points:{" "}
                    {selectedSubmission.challenges?.scoring_config
                      ?.points_per_hashtag || 75}
                  </p>
                </div>

                <div>
                  <Label>Review Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this submission..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedSubmission)}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve & Award Points
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(selectedSubmission)}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFlag(selectedSubmission)}
                  disabled={processing}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flag
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
