import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from '../types/survey';

interface ClientVisibilityManagerProps {
  activities: Activity[];
  clients: Array<{ userId: string; totalResponses: number }>;
}

interface VisibilitySettings {
  [clientId: string]: {
    [activityId: number]: boolean; // true = hidden
  };
}

export const ClientVisibilityManager: React.FC<ClientVisibilityManagerProps> = ({ 
  activities, 
  clients 
}) => {
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>({});
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>('');

  useEffect(() => {
    loadVisibilitySettings();
  }, []);

  const loadVisibilitySettings = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_activity_visibility')
        .select('*');

      if (error) throw error;

      const settings: VisibilitySettings = {};
      data.forEach((row: any) => {
        if (!settings[row.client_id]) {
          settings[row.client_id] = {};
        }
        settings[row.client_id][row.activity_id] = row.is_hidden;
      });

      setVisibilitySettings(settings);
    } catch (error) {
      console.error('Error loading visibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivityVisibility = async (clientId: string, activityId: number) => {
    if (!supabase) return;

    const currentlyHidden = visibilitySettings[clientId]?.[activityId] || false;
    const newHidden = !currentlyHidden;

    try {
      // Update local state optimistically
      setVisibilitySettings(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          [activityId]: newHidden
        }
      }));

      // Update database
      const { error } = await supabase
        .from('client_activity_visibility')
        .upsert({
          client_id: clientId,
          activity_id: activityId,
          is_hidden: newHidden
        }, {
          onConflict: 'client_id,activity_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating visibility:', error);
      // Revert local state on error
      loadVisibilitySettings();
    }
  };

  const getVisibleActivitiesCount = (clientId: string) => {
    const hiddenCount = Object.values(visibilitySettings[clientId] || {})
      .filter(hidden => hidden).length;
    return activities.length - hiddenCount;
  };

  const pillarOptions = [
    { id: 1, name: 'Content & Communication' },
    { id: 2, name: 'Marketing & Promotion' },
    { id: 3, name: 'Proactive Outreach' },
    { id: 4, name: 'Ongoing Relationship' }
  ];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading visibility settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded">
        <h3 className="font-semibold text-lg mb-2">Client Activity Visibility</h3>
        <p className="text-purple-700">Control which activities are visible to specific clients</p>
      </div>

      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Client:</label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Choose a client...</option>
          {clients.map((client) => (
            <option key={client.userId} value={client.userId}>
              {client.userId.substring(0, 20)}... 
              ({getVisibleActivitiesCount(client.userId)}/{activities.length} activities visible)
            </option>
          ))}
        </select>
      </div>

      {selectedClient && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">
              Activities for: {selectedClient.substring(0, 30)}...
            </h4>
            <p className="text-sm text-gray-600">
              {getVisibleActivitiesCount(selectedClient)} of {activities.length} visible
            </p>
          </div>

          {/* Group by pillar */}
          {pillarOptions.map(pillar => {
            const pillarActivities = activities.filter(a => a.pillar === pillar.id);
            
            return (
              <div key={pillar.id} className="border rounded-lg p-4">
                <h5 className="font-medium text-lg mb-3">{pillar.name}</h5>
                
                <div className="space-y-2">
                  {pillarActivities.map(activity => {
                    const isHidden = visibilitySettings[selectedClient]?.[activity.id] || false;
                    
                    return (
                      <div 
                        key={activity.id}
                        className={`flex items-center justify-between p-3 border rounded ${
                          isHidden ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex-1">
                          <h6 className="font-medium">{activity.name}</h6>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${
                            isHidden ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {isHidden ? 'Hidden' : 'Visible'}
                          </span>
                          
                          <button
                            onClick={() => toggleActivityVisibility(selectedClient, activity.id)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              isHidden 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {isHidden ? 'Show' : 'Hide'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {clients.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No clients found. Client visibility controls will appear here once clients start using the survey.
        </div>
      )}
    </div>
  );
};