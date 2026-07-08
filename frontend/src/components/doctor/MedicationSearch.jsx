import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { doctorService } from '../../services/doctorService';

const MedicationSearch = ({ onSelectMedication, selectedMedications = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMedications = async (value) => {
    try {
      setLoading(true);
      const meds = await doctorService.searchMedications(value, 5);
      setSuggestions(meds || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Không thể tìm thuốc:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value?.trim()) {
      debounceRef.current = setTimeout(() => fetchMedications(value.trim()), 250);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (medication) => {
    const isAlreadySelected = selectedMedications.some(
      (med) => med.id === medication.id || med.name === medication.name
    );
    if (isAlreadySelected) return;

    let dosages = [];
    let frequencies = [];
    try {
      dosages = typeof medication.commonDosages === 'string'
        ? JSON.parse(medication.commonDosages || '[]')
        : medication.commonDosages || [];
    } catch { dosages = medication.commonDosages ? [medication.commonDosages] : []; }
    try {
      frequencies = typeof medication.commonFrequencies === 'string'
        ? JSON.parse(medication.commonFrequencies || '[]')
        : medication.commonFrequencies || [];
    } catch { frequencies = medication.commonFrequencies ? [medication.commonFrequencies] : []; }

    onSelectMedication({
      id: medication.id,
      medicationId: medication.id,
      name: medication.name,
      medicationName: medication.name,
      genericName: medication.genericName,
      category: medication.category,
      dosage: dosages[0] || '',
      frequency: frequencies[0] || '',
      commonDosages: dosages,
      commonFrequencies: frequencies,
      quantity: 0,
      instructions: '',
      unit: medication.unit || (medication.name?.toLowerCase().includes('gói') ? 'gói' : 'viên'),
    });
    setSearchTerm('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          placeholder="Tìm thuốc (VD: Paracetamol, Panadol...)"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-400">
              {loading ? 'Đang tìm...' : 'Không tìm thấy thuốc'}
            </p>
          ) : (
            suggestions.map((medication) => {
              const isSelected = selectedMedications.some(
                (med) => med.id === medication.id || med.name === medication.name
              );
              return (
                <button
                  key={medication.id}
                  type="button"
                  disabled={isSelected}
                  onClick={() => handleSelect(medication)}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-100 last:border-0 transition-colors ${
                    isSelected ? 'bg-neutral-50 opacity-60 cursor-not-allowed' : 'hover:bg-neutral-50'
                  }`}
                >
                  <p className="text-sm font-medium text-neutral-900">{medication.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {medication.genericName} · {medication.category}
                    {isSelected && ' · Đã thêm'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MedicationSearch;
