import React, { useState, useEffect } from 'react';
import { SupabaseSurveyService } from '../services/supabaseSurveyService';
import { activities } from '../data/activities';

interface AnalyticsData {
  activity_id: number;
  rating: string;
  response_count: number;
  percentage: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Try Supabase first, fallback to localStorage
        try {
          const data = await SupabaseSurveyService.getAnalytics();
          setAnalytics(data);
        } catch (supabaseError) {
          console.log('Supabase not configured, using localStorage analytics');
          // Generate analytics from localStorage
          const localAnalytics = generateLocalStorageAnalytics();
          setAnalytics(localAnalytics);
          setUsingLocalStorage(true);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (showAnalytics) {
      loadData();
    }
  }, [showAnalytics]);


  const generateLocalStorageAnalytics = (): AnalyticsData[] => {
    const analyticsData: AnalyticsData[] = [];
    const ratingCounts: Record<number, Record<string, number>> = {};

    // Count ratings for each activity from localStorage
    activities.forEach(activity => {
      const rating = localStorage.getItem(`rating_${activity.id}`);
      if (rating) {
        if (!ratingCounts[activity.id]) {
          ratingCounts[activity.id] = { love: 0, neutral: 0, hate: 0 };
        }
        ratingCounts[activity.id][rating] = (ratingCounts[activity.id][rating] || 0) + 1;
      }
    });

    // Convert to analytics format
    Object.entries(ratingCounts).forEach(([activityIdStr, ratings]) => {
      const activityId = parseInt(activityIdStr);
      const totalForActivity = Object.values(ratings).reduce((sum, count) => sum + count, 0);
      
      Object.entries(ratings).forEach(([rating, count]) => {
        if (count > 0) {
          analyticsData.push({
            activity_id: activityId,
            rating,
            response_count: count,
            percentage: (count / totalForActivity) * 100
          });
        }
      });
    });

    return analyticsData;
  };

  const getActivityName = (activityId: number) => {
    const activity = activities.find(a => a.id === activityId);
    return activity ? activity.name : `Activity ${activityId}`;
  };

  const getRatingEmoji = (rating: string) => {
    switch (rating) {
      case 'love': return '👍';
      case 'neutral': return '😐';
      case 'hate': return '👎';
      default: return '❓';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'love': return 'text-green-600';
      case 'neutral': return 'text-yellow-600';
      case 'hate': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!showAnalytics) {
    return (
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
        <button
          onClick={() => setShowAnalytics(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          View Response Analytics
        </button>
        <p className="text-sm text-gray-600 mt-2">
          See how all users have rated different services
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  // Group analytics by activity
  const analyticsMap = analytics.reduce((acc, item) => {
    if (!acc[item.activity_id]) {
      acc[item.activity_id] = {};
    }
    acc[item.activity_id][item.rating] = item;
    return acc;
  }, {} as Record<number, Record<string, AnalyticsData>>);

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Response Analytics</h2>
          {usingLocalStorage && (
            <p className="text-sm text-yellow-600 mt-1">
              📊 Showing your local responses • Set up Supabase for multi-user analytics
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAnalytics(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Hide Analytics
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(analyticsMap)
          .slice(0, 10) // Show top 10 for now
          .map(([activityIdStr, ratings]) => {
            const activityId = parseInt(activityIdStr);
            const activityName = getActivityName(activityId);
            const totalResponses = Object.values(ratings).reduce(
              (sum, r) => sum + r.response_count, 0
            );

            return (
              <div key={activityId} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{activityName}</h3>
                <div className="text-sm text-gray-600 mb-3">
                  {totalResponses} total response{totalResponses !== 1 ? 's' : ''}
                </div>
                
                <div className="flex gap-4">
                  {['love', 'neutral', 'hate'].map(rating => {
                    const data = ratings[rating];
                    const count = data ? data.response_count : 0;
                    const percentage = data ? data.percentage.toFixed(1) : '0.0';
                    
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-xl">{getRatingEmoji(rating)}</span>
                        <span className={`font-medium ${getRatingColor(rating)}`}>
                          {count} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bars */}
                <div className="mt-3 space-y-1">
                  {['love', 'neutral', 'hate'].map(rating => {
                    const data = ratings[rating];
                    const percentage = data ? data.percentage : 0;
                    
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <div className="w-16 text-xs text-gray-500">
                          {getRatingEmoji(rating)} {rating}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              rating === 'love' ? 'bg-green-500' :
                              rating === 'neutral' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {Object.keys(analyticsMap).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No response data available yet.
        </div>
      )}
    </div>
  );
};