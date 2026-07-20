import { useEffect, useState, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, MapPin, X } from 'lucide-react';

export interface POI {
  id: string;
  name: string;
  category: string;
  color: string;
  icon: string;
  lat: number;
  lng: number;
  description?: string;
  vendorId?: string;
}

const POI_CATEGORIES = [
  'stage', 'food_vendor', 'beverage_vendor', 'shop_and_service', 'staff_and_medical'
] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  stage: '🎵',
  food_vendor: '🍔',
  beverage_vendor: '🍺',
  shop_and_service: '🛒',
  staff_and_medical: '🏥',
};

const CATEGORY_LABEL: Record<string, string> = {
  stage: 'Stage',
  food_vendor: 'Food Vendor',
  beverage_vendor: 'Beverage Vendor',
  shop_and_service: 'Shop & Service',
  staff_and_medical: 'Staff & Medical',
};

const DEFAULT_COLORS: Record<string, string> = {
  stage: '#EF4444',
  food_vendor: '#F59E0B',
  beverage_vendor: '#3B82F6',
  shop_and_service: '#8B5CF6',
  staff_and_medical: '#DC2626',
};

interface POIManagerProps {
  onPOIsChanged: (pois: POI[]) => void;
  onRequestMapClick: (callback: (lat: number, lng: number) => void) => void;
  selectedPOIId: string | null;
  onSelectPOI: (id: string | null) => void;
}

export function POIManager({ onPOIsChanged, onRequestMapClick, selectedPOIId, onSelectPOI }: POIManagerProps) {
  const [pois, setPois] = useState<POI[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', category: 'stage', color: '#EF4444', icon: '🎵',
    lat: 0, lng: 0, description: '', vendorId: '',
  });
  const [pickingLocation, setPickingLocation] = useState(false);

  const fetchPOIs = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'mapPOIs'));
      const items: POI[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as POI));
      setPois(items);
      onPOIsChanged(items);
    } catch (err) {
      console.error('Failed to fetch POIs:', err);
    }
  }, [onPOIsChanged]);

  useEffect(() => { fetchPOIs(); }, [fetchPOIs]);

  const resetForm = () => {
    setFormData({ name: '', category: 'stage', color: '#EF4444', icon: '🎵', lat: 0, lng: 0, description: '', vendorId: '' });
    setEditingId(null);
    setShowForm(false);
    setPickingLocation(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.lat || !formData.lng) return;
    try {
      const data = {
        name: formData.name.trim(),
        category: formData.category,
        color: formData.color,
        icon: formData.icon,
        lat: formData.lat,
        lng: formData.lng,
        description: formData.description || '',
        vendorId: formData.vendorId || '',
      };
      if (editingId) {
        await updateDoc(doc(db, 'mapPOIs', editingId), data);
      } else {
        await addDoc(collection(db, 'mapPOIs'), data);
      }
      resetForm();
      await fetchPOIs();
    } catch (err) {
      console.error('Failed to save POI:', err);
      alert('Failed to save POI');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this POI?')) return;
    try {
      await deleteDoc(doc(db, 'mapPOIs', id));
      await fetchPOIs();
      if (selectedPOIId === id) onSelectPOI(null);
    } catch (err) {
      console.error('Failed to delete POI:', err);
    }
  };

  const handleEdit = (poi: POI) => {
    setFormData({
      name: poi.name, category: poi.category, color: poi.color, icon: poi.icon,
      lat: poi.lat, lng: poi.lng, description: poi.description || '', vendorId: poi.vendorId || '',
    });
    setEditingId(poi.id);
    setShowForm(true);
  };

  const handlePickLocation = () => {
    setPickingLocation(true);
    onRequestMapClick((lat, lng) => {
      setFormData(prev => ({ ...prev, lat, lng }));
      setPickingLocation(false);
    });
  };

  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        className="p-3 border-t border-[#F5F5DC]/10 cursor-pointer hover:bg-white/5 flex items-center gap-2 text-[#F5F5DC]/70"
      >
        <ChevronRight className="h-4 w-4" />
        <MapPin className="h-4 w-4" />
        <span className="text-sm font-medium">POIs ({pois.length})</span>
      </div>
    );
  }

  return (
    <div className="border-t border-[#F5F5DC]/10 flex flex-col max-h-[50%]">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-[#F5F5DC]/10">
        <button onClick={() => setCollapsed(true)} className="flex items-center gap-2 text-[#F5F5DC]/80 hover:text-[#F5F5DC]">
          <ChevronDown className="h-4 w-4" />
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-bold">POIs ({pois.length})</span>
        </button>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#6BBF59]/20 text-[#6BBF59] text-xs font-medium hover:bg-[#6BBF59]/30"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-3 border-b border-[#F5F5DC]/10 bg-[#2E4031]/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#F5F5DC]">{editingId ? 'Edit POI' : 'New POI'}</span>
            <button onClick={resetForm} className="text-[#F5F5DC]/40 hover:text-[#F5F5DC]"><X className="h-4 w-4" /></button>
          </div>
          <input
            type="text" placeholder="Name" value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            className="w-full px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-sm placeholder:text-[#F5F5DC]/30 focus:outline-none focus:ring-1 focus:ring-[#6BBF59]/50"
          />
          <div className="flex gap-2">
            <select
              value={formData.category}
              onChange={e => {
                const cat = e.target.value;
                setFormData(p => ({ ...p, category: cat, color: DEFAULT_COLORS[cat] || p.color, icon: CATEGORY_EMOJI[cat] || p.icon }));
              }}
              className="flex-1 px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-sm focus:outline-none"
            >
              {POI_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {CATEGORY_LABEL[c]}</option>)}
            </select>
            <input
              type="color" value={formData.color}
              onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
              className="w-10 h-8 rounded border border-[#F5F5DC]/20 bg-[#1C2B20] cursor-pointer"
            />
          </div>
          <input
            type="text" placeholder="Icon (emoji)" value={formData.icon}
            onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
            className="w-full px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-sm placeholder:text-[#F5F5DC]/30 focus:outline-none"
          />
          <div className="flex gap-2 items-center">
            <input
              type="number" step="any" placeholder="Lat" value={formData.lat || ''}
              onChange={e => setFormData(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))}
              className="flex-1 px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-xs font-mono focus:outline-none"
            />
            <input
              type="number" step="any" placeholder="Lng" value={formData.lng || ''}
              onChange={e => setFormData(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))}
              className="flex-1 px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-xs font-mono focus:outline-none"
            />
            <button
              onClick={handlePickLocation}
              className={`px-2 py-1.5 rounded text-xs font-medium ${pickingLocation ? 'bg-[#6BBF59] text-[#1C2B20]' : 'bg-[#2E4031] text-[#F5F5DC]/70 hover:bg-[#2E4031]/80 border border-[#F5F5DC]/10'}`}
            >
              {pickingLocation ? '📍 Click map...' : '📍 Pick'}
            </button>
          </div>
          <input
            type="text" placeholder="Description (optional)" value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            className="w-full px-2 py-1.5 rounded bg-[#1C2B20] border border-[#F5F5DC]/20 text-[#F5F5DC] text-sm placeholder:text-[#F5F5DC]/30 focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.lat || !formData.lng}
            className="w-full px-3 py-2 rounded bg-[#6BBF59] text-[#1C2B20] font-bold text-sm hover:bg-[#6BBF59]/90 disabled:opacity-40"
          >
            {editingId ? 'Update POI' : 'Add POI'}
          </button>
        </div>
      )}

      {/* POI List */}
      <div className="flex-1 overflow-y-auto">
        {pois.length === 0 ? (
          <div className="p-3 text-sm text-[#F5F5DC]/40 text-center">No POIs yet</div>
        ) : (
          pois.map(poi => (
            <div
              key={poi.id}
              onClick={() => onSelectPOI(poi.id)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-[#F5F5DC]/5 ${
                selectedPOIId === poi.id ? 'bg-[#6BBF59]/15 ring-1 ring-inset ring-[#6BBF59]/30' : 'hover:bg-white/5'
              }`}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: poi.color }} />
              <span className="text-sm shrink-0">{poi.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#F5F5DC]/90 truncate">{poi.name}</div>
                <div className="text-xs text-[#F5F5DC]/40">{poi.category}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); handleEdit(poi); }} className="p-1 text-[#F5F5DC]/30 hover:text-[#6BBF59]">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={e => { e.stopPropagation(); handleDelete(poi.id); }} className="p-1 text-[#F5F5DC]/30 hover:text-red-400">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
