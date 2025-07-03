import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { SupabaseSurveyService } from '../services/supabaseSurveyService';
import { TaskManager } from './TaskManager';
import { ClientVisibilityManager } from './ClientVisibilityManager';
import { Activity } from '../types/survey';

interface ClientSummary {
  userId: string;
  clientId?: string;
  totalResponses: number;
  completedAt?: string;
  topServices: Array<{
    activityId: number;
    activityName: string;
    rating: string;
  }>;
}

interface AnalyticsData {
  activity_id: number;
  rating: string;
  response_count: number;
  percentage: number;
}

interface AdminDashboardProps {
  activities: Activity[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activities: allActivities }) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'clients' | 'analytics' | 'tasks' | 'visibility'>('clients');
  const [currentActivities, setCurrentActivities] = useState<Activity[]>(allActivities);

  const checkPassword = () => {
    // Simple password check - you should use proper auth in production
    if (password === 'admin123') {
      setAuthenticated(true);
      setShowAdmin(true);
      loadClientData();
    } else {
      alert('Incorrect password');
    }
  };

  const loadClientData = async () => {
    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }

    try {
      setLoading(true);

      // Get all sessions with responses
      const { data: sessions, error: sessionsError } = await supabase
        .from('survey_sessions')
        .select(`
          *,
          survey_responses (
            activity_id,
            rating,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Process data into client summaries
      const summaries: ClientSummary[] = sessions.map((session: any) => {
        const responses = session.survey_responses || [];
        const loveResponses = responses
          .filter((r: any) => r.rating === 'love')
          .map((r: any) => ({
            activityId: r.activity_id,
            activityName: allActivities.find((a: Activity) => a.id === r.activity_id)?.name || 'Unknown',
            rating: r.rating
          }))
          .slice(0, 5); // Top 5 loved services

        return {
          userId: session.user_id,
          totalResponses: responses.length,
          completedAt: session.completed_at,
          topServices: loveResponses
        };
      });

      setClients(summaries);
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await SupabaseSurveyService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const exportAllData = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV
      let csv = 'User ID,Activity ID,Activity Name,Rating,Comment,Timestamp\n';
      data.forEach((row: any) => {
        const activity = allActivities.find((a: Activity) => a.id === row.activity_id);
        const comment = row.comment || '';
        csv += `"${row.user_id}","${row.activity_id}","${activity?.name || 'Unknown'}","${row.rating}","${comment}","${row.created_at}"\n`;
      });

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-survey-responses-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getActivityName = (activityId: number) => {
    const activity = allActivities.find((a: Activity) => a.id === activityId);
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

  const handleTasksUpdate = (updatedTasks: Activity[]) => {
    setCurrentActivities(updatedTasks);
    console.log('Tasks updated:', updatedTasks.length, 'activities');
  };

  if (!authenticated) {
    return (
      <div className="mt-8 p-6 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Admin Dashboard</h3>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Enter admin password"
            className="px-3 py-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
          />
          <button
            onClick={checkPassword}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!showAdmin) return null;

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={exportAllData}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export All Data
          </button>
          <button
            onClick={() => setShowAdmin(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Hide Dashboard
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'clients'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Client Responses
        </button>
        <button
          onClick={() => {
            setActiveTab('analytics');
            if (analytics.length === 0) loadAnalytics();
          }}
          className={`px-4 py-2 font-medium ${
            activeTab === 'analytics'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Response Analytics
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'tasks'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Task Management
        </button>
        <button
          onClick={() => setActiveTab('visibility')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'visibility'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Client Visibility
        </button>
      </div>

      {/* Client Responses Tab */}
      {activeTab === 'clients' && (
        <>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-lg mb-2">Summary</h3>
                <p>Total Clients: {clients.length}</p>
                <p>Completed Surveys: {clients.filter(c => c.completedAt).length}</p>
                <p>In Progress: {clients.filter(c => !c.completedAt).length}</p>
                <p className="text-sm text-blue-600 mt-2">Note: One session per client (simplified session management)</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Individual Client Responses</h3>
                {clients.map((client, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">User: {client.userId.substring(0, 20)}...</p>
                        <p className="text-sm text-gray-600">
                          Responses: {client.totalResponses} / 80 ({Math.round((client.totalResponses / 80) * 100)}%)
                          {client.completedAt && ' ✅ Completed'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {client.completedAt 
                          ? new Date(client.completedAt).toLocaleString()
                          : 'In Progress'}
                      </p>
                    </div>
                    
                    {client.topServices.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Top Valued Services (👍):</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {client.topServices.map((service, idx) => (
                            <li key={idx}>{service.activityName}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Response Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          {analyticsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading analytics across all clients...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold text-lg mb-2">Response Analytics</h3>
                <p className="text-green-700">Aggregated data across all survey responses</p>
              </div>

              {analytics.length > 0 ? (
                <div className="space-y-4">
                  {/* Group analytics by activity */}
                  {(() => {
                    const analyticsMap = analytics.reduce((acc, item) => {
                      if (!acc[item.activity_id]) {
                        acc[item.activity_id] = {};
                      }
                      acc[item.activity_id][item.rating] = item;
                      return acc;
                    }, {} as Record<number, Record<string, AnalyticsData>>);

                    return Object.entries(analyticsMap)
                      .slice(0, 15) // Show top 15 for now
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
                            
                            <div className="flex gap-4 mb-3">
                              {['love', 'neutral', 'hate'].map(rating => {
                                const data = ratings[rating];
                                const count = data ? data.response_count : 0;
                                const percentage = data ? data.percentage.toFixed(1) : '0.0';
                                
                                return (
                                  <div key={rating} className="flex items-center gap-2">
                                    <span className="text-xl">{getRatingEmoji(rating)}</span>
                                    <span className={`font-medium ${
                                      rating === 'love' ? 'text-green-600' :
                                      rating === 'neutral' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {count} ({percentage}%)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Progress bars */}
                            <div className="space-y-1">
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
                      });
                  })()}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No analytics data available yet. Responses will appear here once clients start submitting surveys.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Task Management Tab */}
      {activeTab === 'tasks' && (
        <TaskManager onTasksUpdate={handleTasksUpdate} />
      )}

      {/* Client Visibility Tab */}
      {activeTab === 'visibility' && (
        <ClientVisibilityManager 
          activities={currentActivities} 
          clients={clients.map(c => ({ userId: c.userId, totalResponses: c.totalResponses }))}
        />
      )}
    </div>
  );
};