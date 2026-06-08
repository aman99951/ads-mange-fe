/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { ads } from '../services/api';

export function useAdList() {
  const [adsList, setAdsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ads.list();
      setAdsList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  return { ads: adsList, loading, error, refetch: fetchAds };
}

export function useAd(id) {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAd = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ads.get(id);
      setAd(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAd(); }, [fetchAd]);

  return { ad, loading, error, refetch: fetchAd };
}
