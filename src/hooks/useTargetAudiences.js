import { useState, useEffect } from 'react';
import { targetAudiences } from '../services/api';

export function useTargetAudiences() {
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    targetAudiences.list()
      .then(setAudiences)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { audiences, loading };
}
