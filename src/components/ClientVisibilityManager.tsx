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

interface DefaultVisibilitySettings {
  [activityId: number]: boolean; // true = hidden by default
}

export const ClientVisibilityManager: React.FC<ClientVisibilityManagerProps> = ({ 
  activities, 
  clients 
}) => {
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>({});
  const [defaultVisibilitySettings, setDefaultVisibilitySettings] = useState<DefaultVisibilitySettings>({});
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'default' | 'client-specific'>('default');

  useEffect(() => {
    loadVisibilitySettings();
  }, []);

  const loadVisibilitySettings = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Load client-specific settings
      const { data, error } = await supabase
        .from('client_activity_visibility')
        .select('*');

      if (error) throw error;

      const settings: VisibilitySettings = {};
      const defaultSettings: DefaultVisibilitySettings = {};
      
      data.forEach((row: any) => {
        if (row.client_id === 'DEFAULT') {
          // Default settings for all new clients
          defaultSettings[row.activity_id] = row.is_hidden;
        } else {
          // Client-specific settings
          if (!settings[row.client_id]) {
            settings[row.client_id] = {};
          }
          settings[row.client_id][row.activity_id] = row.is_hidden;
        }
      });

      setVisibilitySettings(settings);
      setDefaultVisibilitySettings(defaultSettings);
    } catch (error) {
      console.error('Error loading visibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDefaultVisibility = async (activityId: number) => {
    if (!supabase) return;

    const currentlyHidden = defaultVisibilitySettings[activityId] || false;
    const newHidden = !currentlyHidden;

    try {
      // Update local state optimistically
      setDefaultVisibilitySettings(prev => ({
        ...prev,
        [activityId]: newHidden
      }));

      // Update database
      const { error } = await supabase
        .from('client_activity_visibility')
        .upsert({
          client_id: 'DEFAULT',
          activity_id: activityId,
          is_hidden: newHidden
        }, {
          onConflict: 'client_id,activity_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating default visibility:', error);
      // Revert local state on error
      loadVisibilitySettings();
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

  const getDefaultVisibleActivitiesCount = () => {
    const hiddenCount = Object.values(defaultVisibilitySettings)
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
        <p className="text-purple-700">Control which activities are visible to clients</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('default')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'default'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Default Settings
            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {getDefaultVisibleActivitiesCount()}/{activities.length} visible
            </span>
          </button>
          <button
            onClick={() => setActiveTab('client-specific')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'client-specific'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Client-Specific Settings
            <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {clients.length} clients
            </span>
          </button>
        </nav>
      </div>

      {/* Default Settings Tab */}
      {activeTab === 'default' && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Default Activity Visibility</h4>
            <p className="text-blue-700 text-sm">
              These settings apply to all new clients. Existing clients with custom settings will not be affected.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Currently showing {getDefaultVisibleActivitiesCount()} of {activities.length} activities by default
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
                    const isHidden = defaultVisibilitySettings[activity.id] || false;
                    
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
                            {isHidden ? 'Hidden by default' : 'Visible by default'}
                          </span>
                          
                          <button
                            onClick={() => toggleDefaultVisibility(activity.id)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              isHidden 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {isHidden ? 'Show by default' : 'Hide by default'}
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

      {/* Client-Specific Settings Tab */}
      {activeTab === 'client-specific' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Client-Specific Overrides</h4>
            <p className="text-yellow-700 text-sm">
              Override default settings for individual clients. These settings take precedence over default settings.
            </p>
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
      )}
    </div>
  );
};