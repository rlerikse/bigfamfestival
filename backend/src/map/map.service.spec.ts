import { Test, TestingModule } from '@nestjs/testing';
import { MapService } from './map.service';
import { FirestoreService } from '../config/firestore/firestore.service';

/**
 * Builds a fake FirestoreService whose `mapPOIs` collection and `config/mapStages`
 * doc return the provided fixtures, so we can assert the storage->mobile mapping
 * without hitting real Firestore.
 */
function makeFirestore(opts: {
  poiDocs?: Array<{ id: string; data: Record<string, unknown> }>;
  stages?: Record<string, unknown> | null;
}) {
  const poiDocs = (opts.poiDocs ?? []).map((d) => ({
    id: d.id,
    data: () => d.data,
  }));

  const db = {
    collection: (name: string) => {
      if (name !== 'mapPOIs') throw new Error(`unexpected collection ${name}`);
      return { get: async () => ({ docs: poiDocs }) };
    },
    doc: (path: string) => {
      if (path !== 'config/mapStages')
        throw new Error(`unexpected doc ${path}`);
      return {
        get: async () => ({
          exists: opts.stages !== null && opts.stages !== undefined,
          data: () => ({ stages: opts.stages ?? {} }),
        }),
      };
    },
  };

  return { db } as unknown as FirestoreService;
}

async function build(fs: FirestoreService): Promise<MapService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [MapService, { provide: FirestoreService, useValue: fs }],
  }).compile();
  return mod.get(MapService);
}

describe('MapService', () => {
  it('maps an admin POI to the mobile contract shape', async () => {
    const svc = await build(
      makeFirestore({
        poiDocs: [
          {
            id: 'vendor-1',
            data: {
              name: 'Taco Truck',
              category: 'vendors',
              lat: 42.058,
              lng: -84.2575,
              color: '#F59E0B',
              icon: '🌮',
              description: 'Best tacos',
              markerAsset: 'https://cdn/x.png',
            },
          },
        ],
        stages: null,
      }),
    );
    const pois = await svc.getPois();
    expect(pois).toEqual([
      {
        id: 'vendor-1',
        category: 'vendors',
        type: 'vendors',
        name: 'Taco Truck',
        location: { lat: 42.058, long: -84.2575 },
        description: 'Best tacos',
        color: '#F59E0B',
        icon: '🌮',
        markerAsset: 'https://cdn/x.png',
      },
    ]);
  });

  it('normalizes legacy/seed categories and falls back for unknowns', async () => {
    const svc = await build(
      makeFirestore({
        poiDocs: [
          {
            id: 'a',
            data: { name: 'Med', category: 'medical', lat: 1, lng: 2 },
          },
          { id: 'b', data: { name: 'Info', category: 'info', lat: 1, lng: 2 } },
          {
            id: 'c',
            data: { name: 'Mystery', category: 'zzz', lat: 1, lng: 2 },
          },
        ],
      }),
    );
    const byId = Object.fromEntries(
      (await svc.getPois()).map((p) => [p.id, p.type]),
    );
    expect(byId.a).toBe('infrastructure');
    expect(byId.b).toBe('infrastructure');
    expect(byId.c).toBe('vendors'); // default fallback (matches mobile)
  });

  it('skips POIs with missing/invalid coordinates', async () => {
    const svc = await build(
      makeFirestore({
        poiDocs: [
          { id: 'ok', data: { name: 'ok', category: 'stage', lat: 1, lng: 2 } },
          { id: 'bad', data: { name: 'bad', category: 'stage' } },
        ],
      }),
    );
    const pois = await svc.getPois();
    expect(pois.map((p) => p.id)).toEqual(['ok']);
  });

  it('emits category (mobile reads poi.category) equal to type', async () => {
    const svc = await build(
      makeFirestore({
        poiDocs: [
          {
            id: 'x',
            data: { name: 'x', category: 'vendors', lat: 1, lng: 2 },
          },
        ],
      }),
    );
    const [poi] = await svc.getPois();
    expect(poi.category).toBe('vendors');
    expect(poi.category).toBe(poi.type);
  });

  it('includes seeded stages with stage- prefixed ids', async () => {
    const svc = await build(
      makeFirestore({
        stages: {
          apogee: {
            lat: 42.057,
            lng: -84.2572,
            name: 'Apogee',
            color: '#EF4444',
          },
        },
      }),
    );
    const pois = await svc.getPois();
    expect(pois).toContainEqual({
      id: 'stage-apogee',
      category: 'stage',
      type: 'stage',
      name: 'Apogee',
      location: { lat: 42.057, long: -84.2572 },
      color: '#EF4444',
    });
  });

  it('admin POI overrides a seeded stage with the same id', async () => {
    const svc = await build(
      makeFirestore({
        poiDocs: [
          {
            id: 'stage-apogee',
            data: {
              name: 'Apogee (edited)',
              category: 'stage',
              lat: 9,
              lng: 9,
            },
          },
        ],
        stages: {
          apogee: {
            lat: 42.057,
            lng: -84.2572,
            name: 'Apogee',
            color: '#EF4444',
          },
        },
      }),
    );
    const pois = await svc.getPois();
    const apogee = pois.filter((p) => p.id === 'stage-apogee');
    expect(apogee).toHaveLength(1);
    expect(apogee[0].name).toBe('Apogee (edited)');
    expect(apogee[0].location).toEqual({ lat: 9, long: 9 });
  });
});
