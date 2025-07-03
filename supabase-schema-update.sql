-- Add comment column to survey_responses table
ALTER TABLE survey_responses 
ADD COLUMN comment TEXT;

-- Update the analytics view to include comment data
DROP VIEW IF EXISTS survey_analytics;

CREATE VIEW survey_analytics AS
SELECT 
    activity_id,
    rating,
    COUNT(*) as response_count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY activity_id) as percentage
FROM survey_responses
GROUP BY activity_id, rating
ORDER BY activity_id, rating;

-- Create a new view for detailed responses with comments
CREATE VIEW survey_responses_detailed AS
SELECT 
    sr.id,
    sr.activity_id,
    sr.rating,
    sr.comment,
    sr.user_id,
    sr.session_id,
    sr.created_at,
    sr.updated_at,
    ss.completed_at,
    ss.user_agent
FROM survey_responses sr
LEFT JOIN survey_sessions ss ON sr.session_id = ss.id
ORDER BY sr.created_at DESC;