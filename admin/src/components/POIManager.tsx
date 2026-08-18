import { useEffect, useState, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { uploadPOIMarker, validateMarkerFile, getImageDisplayUrl } from '../lib/storage';
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
  // Optional custom marker image URL (logo/icon). When set, the mobile app
  // renders this image instead of the emoji `icon` (which stays as fallback).
  markerAsset?: string;
}

// Canonical 4-bucket taxonomy — replaces the old 5-value scheme (which had
// separate food/beverage/shop buckets) and the admin zone-editor's separate
// stage/camping/infrastructure/staff/vendors vocabulary. One taxonomy, used
// by this form, the backend's GET /map/pois, and mobile's marker rendering.
const POI_CATEGORIES = ['stage', 'infrastructure', 'staff', 'vendors'] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  stage: '🎵',
  infrastructure: 'ℹ️',
  staff: '👥',
  vendors: '🛒',
};

const CATEGORY_LABEL: Record<string, string> = {
  stage: 'Stage',
  infrastructure: 'Infrastructure',
  staff: 'Staff',
  vendors: 'Vendors',
};

const DEFAULT_COLORS: Record<string, string> = {
  stage: '#EF4444',
  infrastructure: '#3B82F6',
  staff: '#6B7280',
  vendors: '#F59E0B',
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
    lat: 0, lng: 0, description: '', vendorId: '', markerAsset: '',
  });
  const [pickingLocation, setPickingLocation] = useState(false);
  const [markerFile, setMarkerFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchPOIs = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'mapPOIs'));
      const items: POI[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as POI));
      setPois(items);
      onPOIsChanged(items);
      setLoadError(null);
    } catch (err) {
      console.error('Failed to fetch POIs:', err);
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, [onPOIsChanged]);

  useEffect(() => { fetchPOIs(); }, [fetchPOIs]);

  const resetForm = () => {
    setFormData({ name: '', category: 'stage', color: '#EF4444', icon: '🎵', lat: 0, lng: 0, description: '', vendorId: '', markerAsset: '' });
    setEditingId(null);
    setShowForm(false);
    setPickingLocation(false);
    setMarkerFile(null);
    setUploading(false);
  };

  const handleSave = async () => {
    const name = formData.name.trim();
    // 0,0 ("null island") is never a real festival POI, so treat the exact
    // pair as "not yet set" — but don't reject a single 0 component alone
    // (e.g. lat=0 with a real lng is a legitimate, if unlikely, coordinate).
    const hasValidLocation = Number.isFinite(formData.lat) && Number.isFinite(formData.lng)
      && (formData.lat !== 0 || formData.lng !== 0);
    // Previously used truthy checks (`!formData.lat || !formData.lng`), which
    // silently blocked saving ANY field — including name-only edits on an
    // existing POI — whenever lat or lng individually was 0, plus gave zero
    // feedback (a disabled button) when a brand-new POI's default 0,0 hadn't
    // been replaced with a picked location yet.
    if (!name || !hasValidLocation) {
      alert(!name
        ? 'Please enter a name for this POI.'
        : 'Please set a location — click "📍 Pick" and tap the map, or enter Lat/Lng directly.');
      return;
    }
    if (markerFile) {
      const validationErr = validateMarkerFile(markerFile);
      if (validationErr) { alert(validationErr); return; }
    }
    try {
      setUploading(true);
      const data: Record<string, unknown> = {
        name: formData.name.trim(),
        category: formData.category,
        color: formData.color,
        icon: formData.icon,
        lat: formData.lat,
        lng: formData.lng,
        description: formData.description || '',
        vendorId: formData.vendorId || '',
        markerAsset: formData.markerAsset || '',
      };

      // Determine the POI id up front so the marker upload path is stable.
      // For a new POI we create the doc first (need the id for the storage key),
      // then upload the image and patch the URL back onto the same doc.
      let poiId = editingId;
      if (!poiId) {
        const created = await addDoc(collection(db, 'mapPOIs'), data);
        poiId = created.id;
      }

      if (markerFile) {
        const url = await uploadPOIMarker(markerFile, poiId);
        data.markerAsset = url;
      }

      // Single authoritative write of the final shape (incl. any uploaded URL).
      await updateDoc(doc(db, 'mapPOIs', poiId), data);

      resetForm();
      await fetchPOIs();
    } catch (err) {
      console.error('Failed to save POI:', err);
      alert(`Failed to save POI: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
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
      markerAsset: poi.markerAsset || '',
    });
    setMarkerFile(null);
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

      {loadError && (
        <div className="px-3 py-2 text-xs text-red-300 bg-red-950/30 border-b border-red-900/40">
          Couldn't load POIs: {loadError}
        </div>
      )}

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
          {/* Custom marker logo/icon: uploads to Storage on save; falls back to emoji icon when unset. */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#F5F5DC]/50">Marker logo (optional — overrides emoji)</label>
            <div className="flex items-center gap-2">
              {(markerFile || formData.markerAsset) && (
                <img
                  src={markerFile ? URL.createObjectURL(markerFile) : (getImageDisplayUrl(formData.markerAsset) || undefined)}
                  alt="marker preview"
                  className="w-8 h-8 rounded object-contain bg-[#1C2B20] border border-[#F5F5DC]/20 shrink-0"
                />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={e => setMarkerFile(e.target.files?.[0] || null)}
                className="flex-1 text-xs text-[#F5F5DC]/70 file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-[#2E4031] file:text-[#F5F5DC]/80 file:text-xs file:cursor-pointer"
              />
              {formData.markerAsset && !markerFile && (
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, markerAsset: '' }))}
                  className="px-2 py-1 rounded text-xs bg-[#2E4031] text-red-300 hover:bg-[#2E4031]/80 border border-[#F5F5DC]/10 shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
            <span className="text-[10px] text-[#F5F5DC]/30">PNG/JPEG/WebP/SVG, max 2MB.</span>
          </div>
          <button
            onClick={handleSave}
            disabled={uploading}
            className="w-full px-3 py-2 rounded bg-[#6BBF59] text-[#1C2B20] font-bold text-sm hover:bg-[#6BBF59]/90 disabled:opacity-40"
          >
            {uploading ? 'Saving…' : editingId ? 'Update POI' : 'Add POI'}
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
