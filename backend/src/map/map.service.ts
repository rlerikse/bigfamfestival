import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { Poi, PoiType } from './interfaces/poi.interface';

/**
 * Reads map POIs from Firestore and returns them in the shape the mobile app
 * expects. Two data sources are merged:
 *
 *  1. `mapPOIs` collection  — POIs authored in the admin panel (vendors, stages,
 *     medical, etc.). Each doc carries a `category` field that maps 1:1 to the
 *     mobile `type` enum for admin-authored values.
 *  2. `config/mapStages` doc — the seeded stage placements (Apogee, Bayou, ...).
 *     These are stage POIs that predate the admin POI editor; included so the
 *     map shows real stages even before an admin re-authors them.
 *
 * Before this endpoint existed, GET /map/pois 404'd and the mobile app silently
 * fell back to hardcoded mock stages near Brooklyn, MI. This is the real source.
 */
@Injectable()
export class MapService {
  private readonly logger = new Logger(MapService.name);
  private readonly poiCollection = 'mapPOIs';
  private readonly stagesDocPath = 'config/mapStages';

  /**
   * Canonical 4-bucket taxonomy (stage / infrastructure / staff / vendors) —
   * unifies what used to be 3 separate, inconsistent category vocabularies
   * across admin/mobile/backend (see MEMORY known-issues for the migration).
   * Legacy/seed-script values (info, medical, food, food_vendor, etc.) are
   * normalized here so historical documents keep rendering correctly without
   * a hard data migration being required for every value.
   */
  private readonly CATEGORY_TO_TYPE: Record<string, PoiType> = {
    // Canonical (already valid enum values)
    stage: 'stage',
    infrastructure: 'infrastructure',
    staff: 'staff',
    vendors: 'vendors',
    // Legacy pre-migration values -> nearest canonical bucket
    info: 'infrastructure',
    medical: 'infrastructure',
    camping: 'infrastructure',
    food: 'vendors',
    beverage: 'vendors',
    shop: 'vendors',
    service: 'vendors',
    food_vendor: 'vendors',
    beverage_vendor: 'vendors',
    shop_and_service: 'vendors',
    staff_and_medical: 'staff',
  };

  /**
   * Fallback type for unknown categories. Matches mobile's resolveCategory()
   * default so an unexpected value renders consistently on both ends.
   * Normalization above should mean mobile never sees a truly unknown string,
   * but we keep the fallbacks aligned to avoid surprises.
   */
  private readonly DEFAULT_TYPE: PoiType = 'vendors';

  constructor(private readonly firestoreService: FirestoreService) {}

  async getPois(): Promise<Poi[]> {
    const [adminPois, stagePois] = await Promise.all([
      this.readAdminPois(),
      this.readSeededStages(),
    ]);

    // De-dupe by id: an admin-authored POI wins over a seeded stage with the
    // same id, since the admin panel is the source of truth once edited.
    const byId = new Map<string, Poi>();
    for (const poi of stagePois) byId.set(poi.id, poi);
    for (const poi of adminPois) byId.set(poi.id, poi);
    return Array.from(byId.values());
  }

  private mapCategoryToType(category: unknown): PoiType {
    if (typeof category !== 'string') return this.DEFAULT_TYPE;
    return this.CATEGORY_TO_TYPE[category.toLowerCase()] ?? this.DEFAULT_TYPE;
  }

  private isFiniteNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v);
  }

  private async readAdminPois(): Promise<Poi[]> {
    try {
      const snap = await this.firestoreService.db
        .collection(this.poiCollection)
        .get();

      const pois: Poi[] = [];
      for (const doc of snap.docs) {
        const d = doc.data() ?? {};
        // Skip records without usable coordinates rather than emitting NaN.
        if (!this.isFiniteNumber(d.lat) || !this.isFiniteNumber(d.lng)) {
          this.logger.warn(`Skipping POI ${doc.id}: missing/invalid lat/lng`);
          continue;
        }
        const type = this.mapCategoryToType(d.category);
        pois.push({
          id: doc.id,
          category: type,
          type,
          name: typeof d.name === 'string' ? d.name : '',
          location: { lat: d.lat, long: d.lng },
          description:
            typeof d.description === 'string' && d.description.length > 0
              ? d.description
              : undefined,
          color: typeof d.color === 'string' ? d.color : undefined,
          icon: typeof d.icon === 'string' ? d.icon : undefined,
          markerAsset:
            typeof d.markerAsset === 'string' && d.markerAsset.length > 0
              ? d.markerAsset
              : undefined,
        });
      }
      return pois;
    } catch (err) {
      // Don't fail the whole endpoint if the admin collection read errors;
      // log and return what we can (stages still surface).
      this.logger.error(
        `Failed to read ${this.poiCollection}: ${(err as Error).message}`,
      );
      return [];
    }
  }

  private async readSeededStages(): Promise<Poi[]> {
    try {
      const doc = await this.firestoreService.db.doc(this.stagesDocPath).get();
      if (!doc.exists) return [];

      const data = doc.data() ?? {};
      const stages = data.stages ?? {};
      if (typeof stages !== 'object') return [];

      const pois: Poi[] = [];
      for (const [key, raw] of Object.entries(stages as Record<string, any>)) {
        const s = raw ?? {};
        if (!this.isFiniteNumber(s.lat) || !this.isFiniteNumber(s.lng)) {
          continue;
        }
        pois.push({
          id: `stage-${key}`,
          category: 'stage',
          type: 'stage',
          name: typeof s.name === 'string' ? s.name : key,
          location: { lat: s.lat, long: s.lng },
          color: typeof s.color === 'string' ? s.color : undefined,
        });
      }
      return pois;
    } catch (err) {
      this.logger.error(
        `Failed to read ${this.stagesDocPath}: ${(err as Error).message}`,
      );
      return [];
    }
  }
}
