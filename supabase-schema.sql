-- Create survey_sessions table
CREATE TABLE survey_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey_responses table
CREATE TABLE survey_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id INTEGER NOT NULL,
    rating TEXT NOT NULL CHECK (rating IN ('love', 'neutral', 'hate')),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES survey_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, user_id) -- Ensure one rating per activity per user
);

-- Create indexes for better performance
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_activity_id ON survey_responses(activity_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at);
CREATE INDEX idx_survey_sessions_user_id ON survey_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public survey)
-- Allow anyone to read/write survey data
CREATE POLICY "Anyone can insert survey sessions" ON survey_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own survey sessions" ON survey_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can read survey sessions" ON survey_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert survey responses" ON survey_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update survey responses" ON survey_responses
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can read survey responses" ON survey_responses
    FOR SELECT USING (true);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_survey_sessions_updated_at 
    BEFORE UPDATE ON survey_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at 
    BEFORE UPDATE ON survey_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create custom_activities table for admin task management
CREATE TABLE custom_activities (
    id INTEGER PRIMARY KEY,
    pillar INTEGER NOT NULL CHECK (pillar IN (1, 2, 3, 4)),
    pillar_name TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for custom_activities
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read custom activities (public survey)
CREATE POLICY "Anyone can read custom activities" ON custom_activities
    FOR SELECT USING (true);

-- Allow anyone to manage custom activities (for admin functionality)
CREATE POLICY "Anyone can manage custom activities" ON custom_activities
    FOR ALL USING (true);

-- Create trigger for custom_activities updated_at
CREATE TRIGGER update_custom_activities_updated_at 
    BEFORE UPDATE ON custom_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create client_activity_visibility table for hiding specific activities from specific clients
CREATE TABLE client_activity_visibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT NOT NULL, -- Could be user_id or a specific client identifier
    activity_id INTEGER NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, activity_id) -- One visibility setting per client per activity
);

-- Enable RLS for client_activity_visibility
ALTER TABLE client_activity_visibility ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/manage visibility settings (for admin functionality)
CREATE POLICY "Anyone can read visibility settings" ON client_activity_visibility
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage visibility settings" ON client_activity_visibility
    FOR ALL USING (true);

-- Create trigger for client_activity_visibility updated_at
CREATE TRIGGER update_client_activity_visibility_updated_at 
    BEFORE UPDATE ON client_activity_visibility 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for analytics
CREATE VIEW survey_analytics AS
SELECT 
    activity_id,
    rating,
    COUNT(*) as response_count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY activity_id) as percentage
FROM survey_responses
GROUP BY activity_id, rating
ORDER BY activity_id, rating;