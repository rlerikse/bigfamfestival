import type { Event } from '@/types';

// Sample events data for development/demo
export const mockEvents: Event[] = [
  // Friday
  { id: 'e1', name: 'Opening Ceremony', stage: 'Main Stage', date: '2026-07-10', startTime: '16:00', endTime: '17:00', artists: ['MC Hosts'], description: 'Festival opening' },
  { id: 'e2', name: 'DJ Warmup Set', stage: 'DJ Tent', date: '2026-07-10', startTime: '16:30', endTime: '18:00', artists: ['DJ Solar'], description: 'Warm up vibes' },
  { id: 'e3', name: 'Acoustic Sunset', stage: 'Acoustic Corner', date: '2026-07-10', startTime: '17:00', endTime: '18:30', artists: ['River Jade'] },
  { id: 'e4', name: 'The Resonators', stage: 'Main Stage', date: '2026-07-10', startTime: '18:00', endTime: '19:30', artists: ['The Resonators'] },
  { id: 'e5', name: 'Bass Culture', stage: 'Second Stage', date: '2026-07-10', startTime: '18:30', endTime: '20:00', artists: ['Bass Culture'] },
  { id: 'e6', name: 'Midnight Groove', stage: 'DJ Tent', date: '2026-07-10', startTime: '20:00', endTime: '22:00', artists: ['DJ Neon', 'DJ Pulse'] },
  { id: 'e7', name: 'Headliner: Nova Collective', stage: 'Main Stage', date: '2026-07-10', startTime: '20:30', endTime: '22:30', artists: ['Nova Collective'] },
  { id: 'e8', name: 'Late Night Sessions', stage: 'Acoustic Corner', date: '2026-07-10', startTime: '21:00', endTime: '23:00', artists: ['Whisper Folk'] },

  // Saturday
  { id: 'e9', name: 'Morning Yoga & Music', stage: 'Acoustic Corner', date: '2026-07-11', startTime: '09:00', endTime: '10:30', artists: ['Zen Beats'] },
  { id: 'e10', name: 'Brunch Beats', stage: 'DJ Tent', date: '2026-07-11', startTime: '11:00', endTime: '13:00', artists: ['DJ Mimosa'] },
  { id: 'e11', name: 'Rising Stars Showcase', stage: 'Second Stage', date: '2026-07-11', startTime: '12:00', endTime: '14:00', artists: ['Flux', 'Ember', 'Tide'] },
  { id: 'e12', name: 'Drum Circle', stage: 'Acoustic Corner', date: '2026-07-11', startTime: '13:00', endTime: '14:30', artists: ['Community'] },
  { id: 'e13', name: 'Electric Dreams', stage: 'Main Stage', date: '2026-07-11', startTime: '15:00', endTime: '16:30', artists: ['Electric Dreams'] },
  { id: 'e14', name: 'House Collective', stage: 'DJ Tent', date: '2026-07-11', startTime: '15:00', endTime: '17:00', artists: ['House Collective'] },
  { id: 'e15', name: 'Soul Revival', stage: 'Second Stage', date: '2026-07-11', startTime: '16:00', endTime: '17:30', artists: ['Soul Revival'] },
  { id: 'e16', name: 'Sunset Headliner: Prism', stage: 'Main Stage', date: '2026-07-11', startTime: '18:00', endTime: '20:00', artists: ['Prism'] },
  { id: 'e17', name: 'Afrobeats Night', stage: 'Second Stage', date: '2026-07-11', startTime: '19:00', endTime: '21:00', artists: ['Afro Pulse', 'Rhythm Nation'] },
  { id: 'e18', name: 'Techno Takeover', stage: 'DJ Tent', date: '2026-07-11', startTime: '20:00', endTime: '23:00', artists: ['Void', 'Static'] },
  { id: 'e19', name: 'Closing Headliner: Aurora', stage: 'Main Stage', date: '2026-07-11', startTime: '21:00', endTime: '23:00', artists: ['Aurora'] },
  { id: 'e20', name: 'Silent Disco', stage: 'DJ Tent', date: '2026-07-11', startTime: '23:00', endTime: '01:00', artists: ['Various'] },

  // Sunday
  { id: 'e21', name: 'Recovery Brunch', stage: 'Acoustic Corner', date: '2026-07-12', startTime: '10:00', endTime: '12:00', artists: ['Gentle Souls'] },
  { id: 'e22', name: 'Jazz in the Park', stage: 'Second Stage', date: '2026-07-12', startTime: '12:00', endTime: '14:00', artists: ['The Jazz Quintet'] },
  { id: 'e23', name: 'Kids Stage', stage: 'Acoustic Corner', date: '2026-07-12', startTime: '13:00', endTime: '15:00', artists: ['Funtime Band'] },
  { id: 'e24', name: 'Farewell Set', stage: 'Main Stage', date: '2026-07-12', startTime: '15:00', endTime: '17:00', artists: ['Festival All-Stars'] },
];
