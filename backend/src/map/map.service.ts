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
   * Admin POI `category` values already match the mobile `type` enum exactly
   * (stage, food_vendor, beverage_vendor, shop_and_service, staff_and_medical).
   * Seed-script infrastructure POIs use looser categories (info, medical, food),
   * so those are normalized here. Unknown categories fall back to a safe default
   * rather than emitting an out-of-enum value that mobile can't render.
   */
  private readonly CATEGORY_TO_TYPE: Record<string, PoiType> = {
    // Admin-authored (already valid enum values)
    stage: 'stage',
    food_vendor: 'food_vendor',
    beverage_vendor: 'beverage_vendor',
    shop_and_service: 'shop_and_service',
    staff_and_medical: 'staff_and_medical',
    // Seed-script / legacy categories -> nearest enum member
    food: 'food_vendor',
    beverage: 'beverage_vendor',
    medical: 'staff_and_medical',
    staff: 'staff_and_medical',
    info: 'shop_and_service',
    shop: 'shop_and_service',
    service: 'shop_and_service',
  };

  private readonly DEFAULT_TYPE: PoiType = 'shop_and_service';

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
        pois.push({
          id: doc.id,
          type: this.mapCategoryToType(d.category),
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
