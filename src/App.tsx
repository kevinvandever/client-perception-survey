import React, { useState, useEffect } from 'react';
import './App.css';
import { SurveyHeader } from './components/SurveyHeader';
import { SurveyStatsComponent } from './components/SurveyStats';
import { ActivityItem } from './components/ActivityItem';
import { SurveySummary } from './components/SurveySummary';
import { AdminDashboard } from './components/AdminDashboard';
import { activities as defaultActivities } from './data/activities';
import { SupabaseSurveyService } from './services/supabaseSurveyService';
import { Rating, SurveyStats, Activity } from './types/survey';
import { supabase } from './lib/supabase';

function App() {
  const [activities, setActivities] = useState<Activity[]>(defaultActivities);
  const [visibleActivities, setVisibleActivities] = useState<Activity[]>(defaultActivities);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [collapsedPillars, setCollapsedPillars] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<SurveyStats>({
    love: 0,
    neutral: 0,
    hate: 0,
    totalRated: 0,
    progress: 0
  });

  // Load custom activities and ratings on component mount
  useEffect(() => {
    const loadCustomActivities = async () => {
      if (!supabase) return defaultActivities;

      try {
        const { data, error } = await supabase
          .from('custom_activities')
          .select('*')
          .order('id');

        if (error && error.code !== 'PGRST116') {
          console.log('Custom activities table not found, using defaults');
          return defaultActivities;
        }

        if (data && data.length > 0) {
          const customActivities: Activity[] = data.map((row: any) => ({
            id: row.id,
            pillar: row.pillar,
            pillarName: row.pillar_name,
            name: row.name,
            description: row.description
          }));
          return customActivities;
        }
      } catch (error) {
        console.log('Using default activities');
      }
      
      return defaultActivities;
    };

    const loadVisibilitySettings = async (userId: string, allActivities: Activity[]) => {
      if (!supabase) return allActivities;

      try {
        const { data, error } = await supabase
          .from('client_activity_visibility')
          .select('*')
          .eq('client_id', userId)
          .eq('is_hidden', true);

        if (error) throw error;

        const hiddenActivityIds = new Set(data.map((row: any) => row.activity_id));
        return allActivities.filter(activity => !hiddenActivityIds.has(activity.id));
      } catch (error) {
        console.log('Error loading visibility settings, showing all activities');
        return allActivities;
      }
    };

    const loadData = async () => {
      try {
        const currentActivities = await loadCustomActivities();
        setActivities(currentActivities);
        
        // Get current user ID and load visible activities
        const userId = localStorage.getItem('survey_user_id') || 'unknown';
        const userVisibleActivities = await loadVisibilitySettings(userId, currentActivities);
        setVisibleActivities(userVisibleActivities);
        
        const loadedRatings = await SupabaseSurveyService.loadAllRatings(userVisibleActivities);
        setRatings(loadedRatings);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  // Update stats whenever ratings change
  useEffect(() => {
    const counts = { love: 0, neutral: 0, hate: 0 };
    let totalRated = 0;

    Object.values(ratings).forEach(rating => {
      if (rating) {
        counts[rating]++;
        totalRated++;
      }
    });

    const progress = Math.round((totalRated / visibleActivities.length) * 100);

    setStats({
      ...counts,
      totalRated,
      progress
    });
  }, [ratings, visibleActivities.length]);

  const handleRatingChange = async (activityId: number, rating: Rating) => {
    try {
      await SupabaseSurveyService.saveRating(activityId, rating);
      setRatings(prev => ({
        ...prev,
        [activityId]: rating
      }));
    } catch (error) {
      console.error('Error saving rating:', error);
      // Still update UI optimistically
      setRatings(prev => ({
        ...prev,
        [activityId]: rating
      }));
    }
  };

  const handleExport = async () => {
    try {
      await SupabaseSurveyService.downloadCSV(visibleActivities);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all ratings?')) {
      try {
        await SupabaseSurveyService.clearUserResponses();
        const emptyRatings: Record<number, Rating> = {};
        visibleActivities.forEach((activity: Activity) => {
          emptyRatings[activity.id] = null;
        });
        setRatings(emptyRatings);
      } catch (error) {
        console.error('Error resetting survey:', error);
      }
    }
  };

  const togglePillarCollapse = (pillarId: number) => {
    setCollapsedPillars(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pillarId)) {
        newSet.delete(pillarId);
      } else {
        newSet.add(pillarId);
      }
      return newSet;
    });
  };

  const isComplete = stats.totalRated === visibleActivities.length;
  const lovedActivities = visibleActivities.filter((a: Activity) => ratings[a.id] === 'love');

  // Mark session as complete when survey is finished
  useEffect(() => {
    if (isComplete) {
      SupabaseSurveyService.markSessionComplete().catch(console.error);
    }
  }, [isComplete]);

  // Group activities by pillar
  const pillars = Array.from(new Set(visibleActivities.map((a: Activity) => a.pillar)));
  const pillarColors: Record<number, string> = {
    1: 'border-blue-500',
    2: 'border-green-500',
    3: 'border-purple-500',
    4: 'border-orange-500'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <SurveyHeader />
        <SurveyStatsComponent stats={stats} />
        
        {/* Collapse/Expand All Controls */}
        <div className="mb-6 flex justify-end">
          <div className="flex gap-2">
            <button
              onClick={() => setCollapsedPillars(new Set())}
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={() => setCollapsedPillars(new Set(pillars))}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
        
        <div id="surveyContent">
          {pillars.map((pillarId: number) => {
            const pillarActivities = visibleActivities.filter((a: Activity) => a.pillar === pillarId);
            const pillarName = pillarActivities[0]?.pillarName || `Pillar ${pillarId}`;
            const isCollapsed = collapsedPillars.has(pillarId);
            const pillarRatedCount = pillarActivities.filter(a => ratings[a.id]).length;

            return (
              <div key={pillarId} className="mb-8">
                <button
                  onClick={() => togglePillarCollapse(pillarId)}
                  className={`w-full text-left flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border-l-4 ${pillarColors[pillarId]} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {pillarName}
                    </h2>
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {pillarRatedCount}/{pillarActivities.length} completed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {isCollapsed ? 'Show' : 'Hide'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {!isCollapsed && (
                  <div className="mt-4 space-y-3 pl-4">
                    {pillarActivities.map((activity: Activity) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        rating={ratings[activity.id]}
                        onRatingChange={handleRatingChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isComplete && (
          <SurveySummary
            lovedActivities={lovedActivities}
            onExport={handleExport}
            onReset={handleReset}
          />
        )}

        <AdminDashboard activities={activities} />
      </div>
    </div>
  );
}

export default App;
