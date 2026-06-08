import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { targetAreas, targetAudiences } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ManagerTargetAreas() {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [areas, setAreas] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [newAudience, setNewAudience] = useState({ profile: '', age_min: '', age_max: '' });
  const [audLoading, setAudLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      targetAreas.getStates().then(async (states) => {
        const allAreas = [];
        for (const state of states) {
          const cities = await targetAreas.getCities(state);
          for (const city of cities) {
            const locs = await targetAreas.getLocalities(state, city);
            allAreas.push(...locs);
          }
        }
        setAreas(allAreas);
      }),
      targetAudiences.list().then(setAudiences),
    ]).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const handleAddAudience = async () => {
    if (!newAudience.profile || !newAudience.age_min || !newAudience.age_max) return;
    setAudLoading(true);
    try {
      const created = await targetAudiences.create(newAudience);
      setAudiences(prev => [...prev, created]);
      setNewAudience({ profile: '', age_min: '', age_max: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setAudLoading(false);
    }
  };

  const handleDeleteAudience = async (id) => {
    try {
      await targetAudiences.delete(id);
      setAudiences(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={`h-20 rounded-2xl animate-pulse ${dark ? 'bg-neutral-900' : 'bg-stone-100'}`} />)}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Target Management</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-neutral-500' : 'text-stone-500'}`}>Manage target areas and audience profiles</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/manager/dashboard')}>Back to Dashboard</Button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`rounded-2xl p-6 ${dark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-white border border-stone-200 shadow-sm'}`}>
          <h2 className={`text-lg font-bold mb-4 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Target Areas ({areas.length})</h2>
          {areas.length === 0 ? (
            <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>No areas loaded</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1">
              {areas.map(area => (
                <div key={area.id} className={`px-3 py-2 rounded-lg text-xs ${dark ? 'bg-neutral-800/60 text-neutral-400' : 'bg-stone-50 text-stone-600'}`}>
                  <span className="font-medium">{area.state}</span> &gt; {area.city}{area.locality ? ` > ${area.locality}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`rounded-2xl p-6 ${dark ? 'bg-neutral-900/50 border border-neutral-800' : 'bg-white border border-stone-200 shadow-sm'}`}>
          <h2 className={`text-lg font-bold mb-4 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Audience Profiles ({audiences.length})</h2>

          <div className="space-y-3 mb-6">
            <Input label="Profile Name" value={newAudience.profile}
              onChange={(e) => setNewAudience(prev => ({ ...prev, profile: e.target.value }))}
              placeholder="e.g., Electricians, Plumbers" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Min Age" type="number" value={newAudience.age_min}
                onChange={(e) => setNewAudience(prev => ({ ...prev, age_min: e.target.value }))} />
              <Input label="Max Age" type="number" value={newAudience.age_max}
                onChange={(e) => setNewAudience(prev => ({ ...prev, age_max: e.target.value }))} />
            </div>
            <Button onClick={handleAddAudience} loading={audLoading} disabled={!newAudience.profile || !newAudience.age_min || !newAudience.age_max}>
              Add Audience
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {audiences.map(aud => (
              <div key={aud.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${dark ? 'bg-neutral-800/60' : 'bg-stone-50'}`}>
                <span className={`font-medium ${dark ? 'text-neutral-200' : 'text-neutral-700'}`}>{aud.profile}</span>
                <div className="flex items-center gap-3">
                  <span className={dark ? 'text-neutral-500' : 'text-stone-400'}>{aud.age_min}-{aud.age_max} yrs</span>
                  <button onClick={() => handleDeleteAudience(aud.id)} className="text-red-500 hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
