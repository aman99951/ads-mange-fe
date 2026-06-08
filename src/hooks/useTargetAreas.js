/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { targetAreas } from '../services/api';

export function useTargetAreas() {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    targetAreas.getStates().then(setStates).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedState) {
      setSelectedCity('');
      setCities([]);
      setLocalities([]);
      targetAreas.getCities(selectedState).then(setCities).catch(() => {});
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedState && selectedCity) {
      setLocalities([]);
      targetAreas.getLocalities(selectedState, selectedCity).then(setLocalities).catch(() => {});
    }
  }, [selectedState, selectedCity]);

  return {
    states, cities, localities,
    selectedState, setSelectedState,
    selectedCity, setSelectedCity,
  };
}
