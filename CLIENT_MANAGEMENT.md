# Client Management Guide

## Sending Survey Links to Clients

### Method 1: Unique URLs (Recommended)
Send each client a personalized link:
```
https://yourapp.netlify.app/?client=CompanyName
https://yourapp.netlify.app/?client=ABC_Corp_2024
```

Benefits:
- Automatic client identification
- No login required
- Easy to track responses per client

### Method 2: Access Codes
Give clients a code to enter when they start.

## Accessing Client Results

### 1. Admin Dashboard (Built-in)
- Visit your app and scroll to bottom
- Click "Admin Dashboard"
- Password: `admin123` (change in production!)
- Features:
  - View all responses
  - See completion status
  - Export all data as CSV
  - View top valued services

### 2. Supabase Dashboard
- Login to app.supabase.com
- Go to Table Editor
- **survey_responses**: Individual ratings
- **survey_sessions**: User sessions
- **SQL Editor** for custom queries:

```sql
-- Get all responses for a specific client
SELECT * FROM survey_responses 
WHERE user_id LIKE '%ABC_Company%'
ORDER BY created_at DESC;

-- Get summary by rating type
SELECT 
  rating,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM survey_responses
GROUP BY rating;

-- Get most valued services
SELECT 
  sr.activity_id,
  COUNT(*) as love_count
FROM survey_responses sr
WHERE sr.rating = 'love'
GROUP BY sr.activity_id
ORDER BY love_count DESC
LIMIT 10;
```

### 3. Netlify Environment Setup
Add to Netlify environment variables:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Segregating Clients

### Current System
- Each browser gets unique ID
- Stored in localStorage
- Anonymous by default

### Enhanced Options

#### Option 1: Client Parameter (Easy)
Modify the survey to capture client from URL:
```javascript
// In App.tsx or a custom hook
const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('client') || 'anonymous';
```

#### Option 2: Client Selection Screen
Add a dropdown/input for client to identify themselves.

#### Option 3: Email Collection
Add optional email field for follow-up.

## Best Practices

1. **Test First**
   - Send yourself a test link
   - Complete survey
   - Verify data in Supabase

2. **Client Instructions**
   - "Please complete all 80 questions"
   - "Your responses are saved automatically"
   - "Use the same device/browser to resume"

3. **Monitoring**
   - Check Supabase daily
   - Export data regularly
   - Follow up with incomplete surveys

4. **Privacy**
   - No personal data collected by default
   - Each user gets anonymous ID
   - Consider GDPR compliance if needed

## Deployment Checklist

- [ ] Deploy to Netlify
- [ ] Set environment variables
- [ ] Test with a sample survey
- [ ] Create client links/codes
- [ ] Prepare client instructions
- [ ] Set up monitoring routine
- [ ] Change admin password
- [ ] Test data export