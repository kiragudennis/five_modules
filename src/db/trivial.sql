-- Trivia questions table
CREATE TABLE IF NOT EXISTS challenge_trivia_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    
    -- Question content
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of possible answers: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0 AND correct_answer_index <= 3),
    
    -- Difficulty & Scoring
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'bonus')),
    points_value INTEGER DEFAULT 100,
    time_limit_seconds INTEGER DEFAULT 5, -- Default 5 seconds
    
    -- Ordering
    display_order INTEGER DEFAULT 0,
    
    -- Status tracking
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    
    -- Metadata
    category TEXT,
    explanation TEXT,
    image_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trivia rounds/sessions (a live session can have multiple rounds)
CREATE TABLE IF NOT EXISTS challenge_trivia_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    
    -- Round info
    round_number INTEGER NOT NULL,
    theme TEXT,
    host_message TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Rules for this round
    points_multiplier NUMERIC DEFAULT 1.0,
    time_limit_override INTEGER, -- Override default time limit
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trivia round questions (which questions in which round)
CREATE TABLE IF NOT EXISTS challenge_trivia_round_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES challenge_trivia_rounds(id) ON DELETE CASCADE,
    question_id UUID REFERENCES challenge_trivia_questions(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'answered', 'timeout', 'skipped')),
    
    -- Track who answered
    answered_by UUID REFERENCES users(id),
    answered_at TIMESTAMPTZ,
    was_correct BOOLEAN,
    points_awarded INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trivia participant selection (from spinning wheel)
CREATE TABLE IF NOT EXISTS challenge_trivia_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    round_id UUID REFERENCES challenge_trivia_rounds(id) ON DELETE CASCADE,
    question_id UUID REFERENCES challenge_trivia_questions(id) ON DELETE CASCADE,
    
    -- Selected participant (from wheel spin)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    selected_by_spin_id UUID REFERENCES spin_attempts(id),
    
    -- Answer tracking
    selected_answer INTEGER CHECK (selected_answer >= 0 AND selected_answer <= 3),
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    
    -- Time tracking
    question_shown_at TIMESTAMPTZ,
    answer_submitted_at TIMESTAMPTZ,
    response_time_ms INTEGER, -- How fast they answered
    
    -- Status
    status TEXT DEFAULT 'selected' CHECK (status IN ('selected', 'answering', 'answered', 'timeout', 'skipped')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trivia leaderboard (real-time)
CREATE TABLE IF NOT EXISTS challenge_trivia_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    total_score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    fastest_response_ms INTEGER,
    average_response_ms INTEGER,
    
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    
    last_answered_at TIMESTAMPTZ,
    
    UNIQUE(challenge_id, user_id)
);

-- Indexes
CREATE INDEX idx_trivia_questions_challenge ON challenge_trivia_questions(challenge_id, is_used);
CREATE INDEX idx_trivia_rounds_challenge ON challenge_trivia_rounds(challenge_id, status);
CREATE INDEX idx_trivia_selections_challenge ON challenge_trivia_selections(challenge_id, status);
CREATE INDEX idx_trivia_scores_challenge ON challenge_trivia_scores(challenge_id, total_score DESC);

-- Enable RLS
ALTER TABLE challenge_trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_round_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_trivia_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view questions" ON challenge_trivia_questions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view trivia scores" ON challenge_trivia_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their answers" ON challenge_trivia_selections
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can manage trivia" ON challenge_trivia_questions
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage rounds" ON challenge_trivia_rounds
    FOR ALL USING (public.is_admin());

-- Functions

-- Select random participant via spinning wheel
CREATE OR REPLACE FUNCTION select_trivia_participant(
    p_challenge_id UUID,
    p_round_id UUID,
    p_question_id UUID,
    p_spin_game_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_selected_user_id UUID;
    v_user_name TEXT;
    v_selection_id UUID;
    v_result JSON;
BEGIN
    -- Use the spin game to select a random participant
    -- This integrates with your existing spinning wheel system
    SELECT user_id INTO v_selected_user_id
    FROM spin_attempts
    WHERE game_id = p_spin_game_id
    AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Fallback: select from challenge participants
        SELECT cp.user_id INTO v_selected_user_id
        FROM challenge_participants cp
        JOIN users u ON u.id = cp.user_id
        WHERE cp.challenge_id = p_challenge_id
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No participants available');
    END IF;
    
    -- Get user name
    SELECT COALESCE(full_name, 'Anonymous') INTO v_user_name
    FROM users WHERE id = v_selected_user_id;
    
    -- Create selection record
    INSERT INTO challenge_trivia_selections (
        challenge_id,
        round_id,
        question_id,
        user_id,
        status,
        question_shown_at
    ) VALUES (
        p_challenge_id,
        p_round_id,
        p_question_id,
        v_selected_user_id,
        'selected',
        NOW()
    )
    RETURNING id INTO v_selection_id;
    
    -- Add to live ticker
    INSERT INTO challenge_live_ticker (
        challenge_id,
        user_name,
        action_text,
        points_awarded
    ) VALUES (
        p_challenge_id,
        v_user_name,
        'Selected by the wheel! 🎡',
        0
    );
    
    RETURN json_build_object(
        'success', true,
        'selection_id', v_selection_id,
        'user_id', v_selected_user_id,
        'user_name', v_user_name
    );
END;
$$;

-- Submit trivia answer
CREATE OR REPLACE FUNCTION submit_trivia_answer(
    p_selection_id UUID,
    p_answer_index INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_selection challenge_trivia_selections%ROWTYPE;
    v_question challenge_trivia_questions%ROWTYPE;
    v_is_correct BOOLEAN;
    v_points_earned INTEGER := 0;
    v_response_time INTEGER;
    v_challenge RECORD;
    v_participant RECORD;
    v_streak_bonus INTEGER := 0;
    v_speed_bonus INTEGER := 0;
BEGIN
    -- Get selection
    SELECT * INTO v_selection
    FROM challenge_trivia_selections
    WHERE id = p_selection_id
    AND status IN ('selected', 'answering');
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid selection or already answered');
    END IF;
    
    -- Check time limit (5 seconds default)
    v_response_time := EXTRACT(MILLISECONDS FROM (NOW() - v_selection.question_shown_at))::INTEGER;
    
    -- Get question
    SELECT * INTO v_question
    FROM challenge_trivia_questions
    WHERE id = v_selection.question_id;
    
    -- Get challenge config
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = v_selection.challenge_id;
    
    -- Check answer
    v_is_correct := (p_answer_index = v_question.correct_answer_index);
    
    -- Calculate points
    IF v_is_correct THEN
        v_points_earned := COALESCE(v_question.points_value, 100);
        
        -- Speed bonus (faster = more points)
        IF v_response_time < 1000 THEN
            v_speed_bonus := 50; -- Lightning fast!
        ELSIF v_response_time < 2000 THEN
            v_speed_bonus := 25; -- Quick
        ELSIF v_response_time < 3000 THEN
            v_speed_bonus := 10; -- Good
        END IF;
        
        -- Streak bonus
        SELECT COALESCE(current_streak, 0) + 1 INTO v_streak_bonus
        FROM challenge_trivia_scores
        WHERE challenge_id = v_selection.challenge_id
        AND user_id = v_selection.user_id;
        
        IF v_streak_bonus >= 3 THEN
            v_streak_bonus := v_streak_bonus * 10; -- 10 bonus per streak
        ELSE
            v_streak_bonus := 0;
        END IF;
        
        v_points_earned := v_points_earned + v_speed_bonus + v_streak_bonus;
    END IF;
    
    -- Update selection
    UPDATE challenge_trivia_selections
    SET 
        selected_answer = p_answer_index,
        is_correct = v_is_correct,
        points_earned = v_points_earned,
        answer_submitted_at = NOW(),
        response_time_ms = v_response_time,
        status = 'answered'
    WHERE id = p_selection_id;
    
    -- Update or create trivia score
    INSERT INTO challenge_trivia_scores (
        challenge_id,
        user_id,
        total_score,
        questions_answered,
        correct_answers,
        wrong_answers,
        fastest_response_ms,
        average_response_ms,
        current_streak,
        best_streak,
        last_answered_at
    ) VALUES (
        v_selection.challenge_id,
        v_selection.user_id,
        v_points_earned,
        1,
        CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        CASE WHEN v_is_correct THEN 0 ELSE 1 END,
        v_response_time,
        v_response_time,
        CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (challenge_id, user_id) DO UPDATE
    SET 
        total_score = challenge_trivia_scores.total_score + v_points_earned,
        questions_answered = challenge_trivia_scores.questions_answered + 1,
        correct_answers = challenge_trivia_scores.correct_answers + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        wrong_answers = challenge_trivia_scores.wrong_answers + CASE WHEN v_is_correct THEN 0 ELSE 1 END,
        fastest_response_ms = LEAST(
            challenge_trivia_scores.fastest_response_ms, 
            v_response_time
        ),
        average_response_ms = (
            (challenge_trivia_scores.average_response_ms * challenge_trivia_scores.questions_answered + v_response_time) 
            / (challenge_trivia_scores.questions_answered + 1)
        ),
        current_streak = CASE WHEN v_is_correct 
            THEN challenge_trivia_scores.current_streak + 1 
            ELSE 0 
        END,
        best_streak = GREATEST(
            challenge_trivia_scores.best_streak,
            CASE WHEN v_is_correct THEN challenge_trivia_scores.current_streak + 1 ELSE 0 END
        ),
        last_answered_at = NOW();
    
    -- Update challenge participant score
    SELECT * INTO v_participant
    FROM challenge_participants
    WHERE challenge_id = v_selection.challenge_id
    AND user_id = v_selection.user_id;
    
    IF FOUND THEN
        UPDATE challenge_participants
        SET current_score = current_score + v_points_earned,
            last_action_at = NOW()
        WHERE id = v_participant.id;
    ELSE
        INSERT INTO challenge_participants (
            challenge_id,
            user_id,
            current_score,
            last_action_at
        ) VALUES (
            v_selection.challenge_id,
            v_selection.user_id,
            v_points_earned,
            NOW()
        );
    END IF;
    
    -- Add to live ticker
    INSERT INTO challenge_live_ticker (
        challenge_id,
        user_name,
        action_text,
        points_awarded
    )
    SELECT
        v_selection.challenge_id,
        u.full_name,
        CASE 
            WHEN v_is_correct THEN 'Correct answer! ✅ ' || 
                CASE WHEN v_speed_bonus > 0 THEN '(Speed bonus +' || v_speed_bonus || '!) ' ELSE '' END ||
                CASE WHEN v_streak_bonus > 0 THEN '(Streak +' || v_streak_bonus || '!)' ELSE '' END
            ELSE 'Wrong answer ❌'
        END,
        v_points_earned
    FROM users u
    WHERE u.id = v_selection.user_id;
    
    -- Record action
    INSERT INTO challenge_actions (
        challenge_id,
        user_id,
        action_type,
        points_awarded,
        action_metadata
    ) VALUES (
        v_selection.challenge_id,
        v_selection.user_id,
        'trivia_answer',
        v_points_earned,
        jsonb_build_object(
            'question_id', v_selection.question_id,
            'is_correct', v_is_correct,
            'response_time_ms', v_response_time,
            'speed_bonus', v_speed_bonus,
            'streak_bonus', v_streak_bonus
        )
    );
    
    -- Recalculate ranks
    PERFORM recalculate_challenge_ranks(v_selection.challenge_id);
    
    RETURN json_build_object(
        'success', true,
        'is_correct', v_is_correct,
        'points_earned', v_points_earned,
        'speed_bonus', v_speed_bonus,
        'streak_bonus', v_streak_bonus,
        'correct_answer', v_question.correct_answer_index,
        'response_time_ms', v_response_time,
        'explanation', v_question.explanation
    );
END;
$$;

-- Get trivia leaderboard
CREATE OR REPLACE FUNCTION get_trivia_leaderboard(
    p_challenge_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    total_score INTEGER,
    questions_answered INTEGER,
    correct_answers INTEGER,
    accuracy NUMERIC,
    fastest_response_ms INTEGER,
    average_response_ms INTEGER,
    current_streak INTEGER,
    best_streak INTEGER,
    current_rank INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.user_id,
        COALESCE(u.full_name, 'Anonymous') as full_name,
        ts.total_score,
        ts.questions_answered,
        ts.correct_answers,
        CASE 
            WHEN ts.questions_answered > 0 
            THEN ROUND((ts.correct_answers::NUMERIC / ts.questions_answered::NUMERIC) * 100, 1)
            ELSE 0
        END as accuracy,
        ts.fastest_response_ms,
        ts.average_response_ms,
        ts.current_streak,
        ts.best_streak,
        ROW_NUMBER() OVER (ORDER BY ts.total_score DESC)::INTEGER as current_rank
    FROM challenge_trivia_scores ts
    JOIN users u ON u.id = ts.user_id
    WHERE ts.challenge_id = p_challenge_id
    ORDER BY ts.total_score DESC
    LIMIT p_limit;
END;
$$;