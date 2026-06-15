import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { targetAreas, targetAudiences } from '../services/api';
import AppLayout from '../components/layout/AppLayout';
import ErrorAlert from '../components/layout/ErrorAlert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const c = (k) => colors[k];

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className={`rounded-2xl p-6 animate-pulse ${dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-stone-100 border border-stone-200'}`}>
              <div className={`h-6 w-48 rounded mb-4 ${dark ? 'bg-neutral-800' : 'bg-stone-200'}`} />
              {[1, 2, 3, 4].map(j => (
                <div key={j} className={`h-8 rounded-lg mb-2 ${dark ? 'bg-neutral-800/60' : 'bg-stone-200/60'}`} />
              ))}
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>Target Management</h1>
          <p className={`text-sm mt-0.5 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>Manage target areas and audience profiles</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/manager/dashboard')}>Back to Dashboard</Button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Target Areas */}
        <div className={`rounded-2xl p-6 transition-all duration-500 animate-fade-in-up animate-delay-100 hover-lift ${
          dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-white border border-stone-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-purple-500`} />
              <h2 className={`text-lg font-bold transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>Target Areas</h2>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              dark ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-stone-100 text-stone-500 border border-stone-200'
            }`}>
              {areas.length} {areas.length === 1 ? 'area' : 'areas'}
            </span>
          </div>
          {areas.length === 0 ? (
            <p className={`text-sm py-8 text-center transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>No areas loaded</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
              {areas.map((area) => (
                <div key={area.id} className={`px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 border ${
                  dark ? 'bg-neutral-800/40 text-neutral-400 border-neutral-800 hover:border-amber-500/20' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-amber-300 hover:bg-white'
                }`}>
                  <span className="font-semibold">{area.state}</span>
                  <span className={`mx-1.5 ${dark ? 'text-neutral-600' : 'text-stone-300'}`}>→</span>
                  {area.city}{area.locality ? <span className={`mx-1.5 ${dark ? 'text-neutral-600' : 'text-stone-300'}`}>→</span> : ''}{area.locality || ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audience Profiles */}
        <div className={`rounded-2xl p-6 transition-all duration-500 animate-fade-in-up animate-delay-200 hover-lift ${
          dark ? 'bg-neutral-900/60 border border-neutral-800' : 'bg-white border border-stone-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500`} />
              <h2 className={`text-lg font-bold transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>Audience Profiles</h2>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              dark ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-stone-100 text-stone-500 border border-stone-200'
            }`}>
              {audiences.length} {audiences.length === 1 ? 'profile' : 'profiles'}
            </span>
          </div>

          {/* Add Audience Form */}
          <div className={`p-5 rounded-xl mb-5 border transition-all duration-300 ${
            dark ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50/70 border-amber-200'
          }`}>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-widest mb-2 transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>New Profile</label>
                <Input value={newAudience.profile}
                  onChange={(e) => setNewAudience(prev => ({ ...prev, profile: e.target.value }))}
                  placeholder="e.g., Electricians, Plumbers" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Min Age" type="number" value={newAudience.age_min}
                  onChange={(e) => setNewAudience(prev => ({ ...prev, age_min: e.target.value }))} />
                <Input label="Max Age" type="number" value={newAudience.age_max}
                  onChange={(e) => setNewAudience(prev => ({ ...prev, age_max: e.target.value }))} />
              </div>
              <Button onClick={handleAddAudience} loading={audLoading}
                disabled={!newAudience.profile || !newAudience.age_min || !newAudience.age_max}
                className="w-full shadow-lg shadow-amber-500/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Audience Profile
              </Button>
            </div>
          </div>

          {/* Audience List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {audiences.length === 0 ? (
              <p className={`text-sm py-4 text-center transition-colors duration-500 ${c(dark ? 'dark' : 'light').textMuted}`}>No audience profiles yet</p>
            ) : (
              audiences.map(aud => (
                <div key={aud.id} className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 border ${
                  dark ? 'bg-neutral-800/40 border-neutral-800 hover:border-amber-500/20' : 'bg-stone-50 border-stone-200 hover:border-amber-300 hover:bg-white'
                }`}>
                  <span className={`font-semibold transition-colors duration-500 ${c(dark ? 'dark' : 'light').text}`}>{aud.profile}</span>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      dark ? 'bg-neutral-700/50 text-neutral-400' : 'bg-white text-stone-500 border border-stone-200'
                    }`}>{aud.age_min}-{aud.age_max} yrs</span>
                    <button onClick={() => handleDeleteAudience(aud.id)}
                      className={`p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                        dark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
