# Client Perception Survey App

A React TypeScript application for collecting and analyzing client feedback on real estate services, powered by Supabase for real-time data storage and analytics.

## Features

- ✅ **80 Real Estate Services** across 4 categories
- ✅ **Real-time Data Storage** with Supabase
- ✅ **Multi-user Support** with unique user tracking
- ✅ **Progress Tracking** with live statistics
- ✅ **Response Analytics** with visual dashboards
- ✅ **CSV Export** with timestamps
- ✅ **Offline Fallback** to localStorage
- ✅ **Session Tracking** for completion analytics

## Quick Start

### 1. Setup Supabase
Follow the detailed guide in `SUPABASE_SETUP.md`

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Install & Run
```bash
npm install
npm start
```

Visit `http://localhost:3001`

## Deployment to Netlify

### 1. Build the App
```bash
npm run build
```

### 2. Deploy to Netlify
- Drag the `build` folder to [Netlify Drop](https://app.netlify.com/drop), OR
- Connect your GitHub repo to Netlify for auto-deployment

### 3. Set Environment Variables
In Netlify dashboard → Site settings → Environment variables:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Project Structure

```
src/
├── components/          # React components
│   ├── SurveyHeader.tsx
│   ├── SurveyStats.tsx
│   ├── ActivityItem.tsx
│   ├── SurveySummary.tsx
│   └── AnalyticsDashboard.tsx
├── data/
│   └── activities.ts    # Survey questions data
├── lib/
│   └── supabase.ts      # Supabase client config
├── services/
│   ├── surveyService.ts        # Original localStorage service
│   └── supabaseSurveyService.ts # Supabase-powered service
├── types/
│   └── survey.ts        # TypeScript interfaces
└── App.tsx              # Main application component
```

## Database Schema

### Tables
- **`survey_sessions`** - Track user sessions and completion
- **`survey_responses`** - Store individual activity ratings
- **`survey_analytics`** - View for aggregated response data

### Data Flow
1. User gets unique ID stored in browser
2. Ratings saved to Supabase + localStorage backup
3. Session tracking for completion analytics
4. Real-time analytics available via dashboard

## Features for Clients

### For Survey Takers
- Clean, intuitive interface
- Progress tracking
- Instant save/restore
- Works offline with sync when online

### For Survey Administrators
- Real-time response monitoring in Supabase dashboard
- Analytics dashboard showing response patterns
- CSV export with full timestamp data
- Session completion tracking
- Multi-user support with unique identification

## Analytics & Monitoring

### Supabase Dashboard
- **Table Editor**: View all responses in real-time
- **SQL Editor**: Run custom analytics queries
- **API Logs**: Monitor usage and performance

### Built-in Analytics
- Response distribution by service
- Completion rates
- User engagement metrics
- Export capabilities

## Security & Privacy

- **Row Level Security** enabled on all tables
- **Public access** configured for survey functionality
- **No personal data** collected by default
- **Unique user IDs** for tracking without identification
- **Secure API keys** via environment variables

## Support

For issues or questions:
1. Check `SUPABASE_SETUP.md` for setup problems
2. Verify environment variables are set correctly
3. Check browser console for error messages
4. Ensure Supabase project is properly configured

## License

Unlicensed - For client demonstration purposes