import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useTargetAreas } from '../hooks/useTargetAreas';
import { useTargetAudiences } from '../hooks/useTargetAudiences';
import { languages as languagesApi } from '../services/api';
import { ads } from '../services/api';
import { API_BASE } from '../constants';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import ErrorAlert from '../components/layout/ErrorAlert';
import Stepper from '../components/ui/Stepper';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FileUpload from '../components/ui/FileUpload';
import TargetAreaSelector from '../components/ads/TargetAreaSelector';
import AudienceSelector from '../components/ads/AudienceSelector';
import LanguageSelector from '../components/ads/LanguageSelector';
import ReviewCard from '../components/ads/ReviewCard';

const fadeIn = `@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`;

export default function CreateAd() {
  const { dark } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const {
    states, cities, localities,
    selectedState, setSelectedState,
    selectedCity, setSelectedCity,
  } = useTargetAreas();

  const { audiences, loading: audLoading } = useTargetAudiences();
  const [languageOptions, setLanguageOptions] = useState([]);
  const [langLoading, setLangLoading] = useState(true);

  useEffect(() => {
    languagesApi.list()
      .then(setLanguageOptions)
      .catch(() => {})
      .finally(() => setLangLoading(false));
  }, []);

  const [selectedLocalities, setSelectedLocalities] = useState([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [asset, setAsset] = useState(null);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);

  const toggleLocality = (loc) => {
    setSelectedLocalities((prev) =>
      prev.some((l) => l.id === loc.id) ? prev.filter((l) => l.id !== loc.id) : [...prev, loc]
    );
  };

  const toggleAudience = (id) => {
    setSelectedAudienceIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleLanguage = (id) => {
    setSelectedLanguageIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const canContinue = () => {
    if (step === 1) return selectedState && selectedCity && selectedLocalities.length > 0;
    if (step === 2) return selectedAudienceIds.length > 0;
    if (step === 3) return selectedLanguageIds.length > 0;
    if (step === 4) return title.trim().length >= 3;
    return true;
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setSubmitting(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', csvFile);
      const result = await fetch(`${API_BASE}/ads/bulk_create/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access')}` },
        body: form,
      });
      if (!result.ok) {
        const err = await result.json().catch(() => ({}));
        throw new Error(err.error || 'Bulk upload failed');
      }
      const data = await result.json();
      navigate('/manager/dashboard', { state: { bulkResult: data } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvFileChange = (file) => {
    setCsvFile(file);
    if (!file) { setCsvPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter(Boolean);
      setCsvPreview(lines.slice(0, 6));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        target_area_ids: selectedLocalities.map((l) => l.id),
        target_audience_ids: selectedAudienceIds,
        language_ids: selectedLanguageIds,
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
      };
      if (asset) payload.asset = asset;

      const created = await ads.create(payload);
      navigate(`/ads/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout fullWidth>
      <style>{fadeIn}</style>
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Create New Campaign" description="Follow the steps to build your advertisement" />

        <div className="mb-10">
          <Stepper current={step} />
        </div>

        <div className={`rounded-2xl p-6 sm:p-8 transition-all duration-500 ${
          dark ? 'bg-neutral-900/80 backdrop-blur-xl border border-amber-500/15 shadow-[0_0_60px_rgba(217,160,50,0.05)]' : 'bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm'
        }`}>
          {step === 1 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div>
                <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Select Target Areas</h2>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>Choose the locations for your ad campaign</p>
              </div>
              <TargetAreaSelector
                states={states} cities={cities} localities={localities}
                selectedState={selectedState} onStateChange={setSelectedState}
                selectedCity={selectedCity} onCityChange={setSelectedCity}
                selectedLocalities={selectedLocalities} onToggleLocality={toggleLocality}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div>
                <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Define Target Audience</h2>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>Who should see your advertisement?</p>
              </div>
              <AudienceSelector audiences={audiences} selectedIds={selectedAudienceIds} onToggle={toggleAudience} loading={audLoading} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div>
                <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Select Languages</h2>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>Choose languages for your ad campaign</p>
              </div>
              <LanguageSelector languages={languageOptions} selectedIds={selectedLanguageIds} onToggle={toggleLanguage} loading={langLoading} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
              <div>
                <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Ad Content</h2>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>Create your advertisement copy and upload assets</p>
              </div>
              <Input label="Campaign Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Summer Sale 2026" />
              <Input label="Description" textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your ad campaign..." />

              <div className="relative">
                <div className={`absolute inset-0 flex items-center ${dark ? 'text-neutral-700' : 'text-stone-300'}`}><div className="w-full border-t" /></div>
                <div className="relative flex justify-center">
                  <span className={`px-3 text-[10px] font-medium uppercase tracking-widest ${dark ? 'bg-neutral-900 text-neutral-600' : 'bg-white text-stone-400'}`}>Or</span>
                </div>
              </div>

              <FileUpload label="Upload Asset (Image/PDF)" value={asset} onChange={setAsset} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
              <div>
                <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Ad Schedule</h2>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>Set campaign start and end dates (optional)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Start Date" type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} />
                <Input label="End Date" type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
              <div>
                <h2 className={`text-lg font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>Review &amp; Submit</h2>
                <p className={`text-sm mt-0.5 transition-colors duration-500 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>Verify your campaign details before submitting</p>
              </div>

              <div className="space-y-4">
                <ReviewCard title="Target Areas" onEdit={() => setStep(1)}>
                  {selectedLocalities.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {selectedLocalities.slice(0, 5).map((loc) => (
                          <span key={loc.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-600'}`}>
                            {loc.locality || loc.city}
                          </span>
                        ))}
                        {selectedLocalities.length > 5 && <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>+{selectedLocalities.length - 5} more</span>}
                      </div>
                      <p className={`text-xs mt-1 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>{selectedState} &gt; {selectedCity}</p>
                    </>
                  ) : <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Not set</p>}
                </ReviewCard>

                <ReviewCard title="Target Audience" onEdit={() => setStep(2)}>
                  {selectedAudienceIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {audiences.filter((a) => selectedAudienceIds.includes(a.id)).map((aud) => (
                        <span key={aud.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-600'}`}>
                          {aud.profile} ({aud.age_min}-{aud.age_max})
                        </span>
                      ))}
                    </div>
                  ) : <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Not set</p>}
                </ReviewCard>

                <ReviewCard title="Languages" onEdit={() => setStep(3)}>
                  {selectedLanguageIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {languageOptions.filter((l) => selectedLanguageIds.includes(l.id)).map((lang) => (
                        <span key={lang.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-600'}`}>
                          {lang.name}
                        </span>
                      ))}
                    </div>
                  ) : <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Not set</p>}
                </ReviewCard>

                <ReviewCard title="Ad Content" onEdit={() => setStep(4)}>
                  <p className={`text-sm font-medium ${dark ? 'text-neutral-100' : 'text-neutral-900'}`}>{title || 'Untitled'}</p>
                  {description && <p className={`text-xs mt-0.5 line-clamp-2 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>{description}</p>}
                  {asset && <p className={`text-xs mt-1 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Asset: {asset.name}</p>}
                </ReviewCard>

                <ReviewCard title="Schedule" onEdit={() => setStep(5)}>
                  {scheduledStart || scheduledEnd ? (
                    <div className="text-xs space-y-0.5">
                      {scheduledStart && <p className={dark ? 'text-neutral-400' : 'text-stone-500'}>Start: {new Date(scheduledStart).toLocaleString()}</p>}
                      {scheduledEnd && <p className={dark ? 'text-neutral-400' : 'text-stone-500'}>End: {new Date(scheduledEnd).toLocaleString()}</p>}
                    </div>
                  ) : <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Not set (immediate, no expiry)</p>}
                </ReviewCard>
              </div>

              <div className={`rounded-xl p-4 ${dark ? 'bg-neutral-800/50 border border-neutral-700' : 'bg-stone-50 border border-stone-200'}`}>
                <h3 className={`text-sm font-semibold mb-2 ${dark ? 'text-neutral-200' : 'text-neutral-800'}`}>Bulk Import via CSV</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-neutral-500' : 'text-stone-400'}`}>Upload a CSV file to create multiple ads at once. Columns: title, description, state, city, locality, audience_profile, language, scheduled_start, scheduled_end</p>
                <div className="flex items-center gap-3">
                  <input type="file" accept=".csv" onChange={(e) => handleCsvFileChange(e.target.files[0] || null)} className={`text-sm ${dark ? 'text-neutral-300' : 'text-neutral-700'}`} />
                  {csvFile && (
                    <Button variant="secondary" size="sm" onClick={handleCsvUpload} loading={submitting} disabled={submitting}>
                      Upload & Create
                    </Button>
                  )}
                </div>
                {csvPreview && (
                  <pre className={`mt-3 text-[10px] leading-relaxed overflow-x-auto p-2 rounded ${dark ? 'bg-neutral-900 text-neutral-400' : 'bg-white text-stone-500'}`}>
                    {csvPreview.join('\n')}
                  </pre>
                )}
              </div>

              <ErrorAlert message={error} onDismiss={() => setError('')} />
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: dark ? 'rgba(217,160,50,0.1)' : 'rgba(217,160,50,0.2)' }}>
            <div>
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back
                </Button>
              )}
            </div>
            <div>
              {step < 6 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue()}>
                  Continue
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Button>
              ) : (
                <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit for Approval
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
