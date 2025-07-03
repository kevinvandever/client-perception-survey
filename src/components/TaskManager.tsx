import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { activities as defaultActivities } from '../data/activities';
import { Activity } from '../types/survey';

interface TaskManagerProps {
  onTasksUpdate: (tasks: Activity[]) => void;
}

interface EditingActivity extends Activity {
  isNew?: boolean;
  isEditing?: boolean;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ onTasksUpdate }) => {
  const [activities, setActivities] = useState<EditingActivity[]>(defaultActivities);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    pillar: 1,
    pillarName: 'Content & Communication',
    name: '',
    description: ''
  });

  // Load custom activities from database (if any)
  useEffect(() => {
    loadCustomActivities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCustomActivities = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('custom_activities')
        .select('*')
        .order('id');

      if (error && error.code !== 'PGRST116') {
        console.log('Custom activities table not found, using defaults');
        return;
      }

      if (data && data.length > 0) {
        const customActivities: Activity[] = data.map((row: any) => ({
          id: row.id,
          pillar: row.pillar,
          pillarName: row.pillar_name,
          name: row.name,
          description: row.description
        }));
        setActivities(customActivities);
        onTasksUpdate(customActivities);
      }
    } catch (error) {
      console.log('Using default activities');
    }
  };

  const saveToDatabase = async (updatedActivities: Activity[]) => {
    if (!supabase) {
      console.log('Supabase not configured, changes only local');
      return;
    }

    try {
      setLoading(true);
      
      // Delete all existing custom activities
      await supabase.from('custom_activities').delete().neq('id', 0);
      
      // Insert updated activities
      const customActivitiesData = updatedActivities.map(activity => ({
        id: activity.id,
        pillar: activity.pillar,
        pillar_name: activity.pillarName,
        name: activity.name,
        description: activity.description
      }));

      const { error } = await supabase
        .from('custom_activities')
        .insert(customActivitiesData);

      if (error) throw error;
      
      console.log('Activities saved to database');
    } catch (error) {
      console.error('Error saving to database:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = () => {
    const maxId = Math.max(...activities.map(a => a.id));
    const activity: EditingActivity = {
      id: maxId + 1,
      pillar: newActivity.pillar || 1,
      pillarName: newActivity.pillarName || 'Content & Communication',
      name: newActivity.name || '',
      description: newActivity.description || '',
      isNew: true
    };

    const updatedActivities = [...activities, activity];
    setActivities(updatedActivities);
    onTasksUpdate(updatedActivities);
    saveToDatabase(updatedActivities);
    
    setNewActivity({ pillar: 1, pillarName: 'Content & Communication', name: '', description: '' });
    setShowAddForm(false);
  };

  const handleEditActivity = (id: number, field: keyof Activity, value: string | number) => {
    const updatedActivities = activities.map(activity => 
      activity.id === id 
        ? { ...activity, [field]: value }
        : activity
    );
    setActivities(updatedActivities);
    onTasksUpdate(updatedActivities);
    saveToDatabase(updatedActivities);
  };

  const handleDeleteActivity = (id: number) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      const updatedActivities = activities.filter(activity => activity.id !== id);
      setActivities(updatedActivities);
      onTasksUpdate(updatedActivities);
      saveToDatabase(updatedActivities);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset all activities to defaults? This will remove any custom activities.')) {
      setActivities(defaultActivities);
      onTasksUpdate(defaultActivities);
      saveToDatabase(defaultActivities);
    }
  };

  const pillarOptions = [
    { id: 1, name: 'Content & Communication' },
    { id: 2, name: 'Marketing & Promotion' },
    { id: 3, name: 'Proactive Outreach' },
    { id: 4, name: 'Ongoing Relationship' }
  ];

  const getPillarColor = (pillar: number) => {
    const colors = {
      1: 'border-blue-500 bg-blue-50',
      2: 'border-green-500 bg-green-50',
      3: 'border-purple-500 bg-purple-50',
      4: 'border-orange-500 bg-orange-50'
    };
    return colors[pillar as keyof typeof colors] || 'border-gray-500 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Task Management</h3>
          <p className="text-sm text-gray-600">Add, edit, or remove survey activities</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showAddForm ? 'Cancel' : 'Add Activity'}
          </button>
          <button
            onClick={resetToDefaults}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Add New Activity Form */}
      {showAddForm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Add New Activity</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={newActivity.pillar}
                onChange={(e) => {
                  const pillar = parseInt(e.target.value);
                  const pillarName = pillarOptions.find(p => p.id === pillar)?.name || '';
                  setNewActivity({ ...newActivity, pillar, pillarName });
                }}
                className="w-full p-2 border rounded"
              >
                {pillarOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Activity Name</label>
              <input
                type="text"
                value={newActivity.name}
                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., Weekly Market Reports"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Describe what this service includes..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddActivity}
              disabled={!newActivity.name || !newActivity.description}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Add Activity
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        {pillarOptions.map(pillar => {
          const pillarActivities = activities.filter(a => a.pillar === pillar.id);
          
          return (
            <div key={pillar.id} className={`border-l-4 ${getPillarColor(pillar.id)} p-4 rounded`}>
              <h4 className="font-semibold text-lg mb-3">{pillar.name} ({pillarActivities.length})</h4>
              
              <div className="space-y-2">
                {pillarActivities.map(activity => (
                  <div key={activity.id} className="bg-white border rounded p-3">
                    {editingId === activity.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={activity.name}
                          onChange={(e) => handleEditActivity(activity.id, 'name', e.target.value)}
                          className="w-full p-2 border rounded font-medium"
                        />
                        <textarea
                          value={activity.description}
                          onChange={(e) => handleEditActivity(activity.id, 'description', e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium">{activity.name}</h5>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <span className="text-xs text-gray-500">ID: {activity.id}</span>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => setEditingId(activity.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Saving changes...</p>
        </div>
      )}
    </div>
  );
};