import type { Event } from '@/types';
import { computeFestivalDay } from '@/lib/scheduleGrid';

// Mock data for #169-#172 development, matching the production schedule shape:
// Apogee / Bayou / Gallery stages, 2 festival days, includes a post-midnight
// set to exercise the 6am-6am day-boundary rule, plus one of each blockType.
const raw: Array<Omit<Event, 'festivalDay'>> = [
  { id: 'm1', name: 'Gates Open Ambient', stage: 'Apogee', date: '2026-07-10', startTime: '10:00', endTime: '11:00', artists: ['House Selector'], blockType: 'artist_set' },
  { id: 'm2', name: 'Stage Line Check', stage: 'Apogee', date: '2026-07-10', startTime: '11:00', endTime: '11:30', artists: [], blockType: 'setup' },
  { id: 'm3', name: 'Movement Workshop', stage: 'Gallery', date: '2026-07-10', startTime: '12:00', endTime: '13:00', artists: ['Flow Collective'], blockType: 'workshop' },
  { id: 'm4', name: 'Rising Stars Showcase', stage: 'Bayou', date: '2026-07-10', startTime: '13:00', endTime: '14:30', artists: ['Flux', 'Ember', 'Tide'], blockType: 'artist_set' },
  { id: 'm5', name: 'Sound Bath', stage: 'Gallery', date: '2026-07-10', startTime: '14:00', endTime: '15:00', artists: ['Zen Beats'], blockType: 'workshop' },
  { id: 'm6', name: 'Electric Dreams', stage: 'Apogee', date: '2026-07-10', startTime: '15:00', endTime: '16:30', artists: ['Electric Dreams'], blockType: 'artist_set' },
  { id: 'm7', name: 'Vendor Notice: Curfew Reminder', stage: 'Bayou', date: '2026-07-10', startTime: '16:30', endTime: '17:00', artists: [], blockType: 'special', description: 'Announce 11pm sound curfew' },
  { id: 'm8', name: 'Sunset Headliner: Prism', stage: 'Apogee', date: '2026-07-10', startTime: '18:00', endTime: '20:00', artists: ['Prism'], blockType: 'artist_set' },
  { id: 'm9', name: 'Afrobeats Night', stage: 'Bayou', date: '2026-07-10', startTime: '19:00', endTime: '21:00', artists: ['Afro Pulse', 'Rhythm Nation'], blockType: 'artist_set' },
  { id: 'm10', name: 'Closing Headliner: Aurora', stage: 'Apogee', date: '2026-07-10', startTime: '21:00', endTime: '23:00', artists: ['Aurora'], blockType: 'artist_set' },
  // Post-midnight set (Sat 2am-4am, real date 07-11) — belongs under Friday's column per day-boundary rule
  { id: 'm11', name: 'After Hours: Void', stage: 'Bayou', date: '2026-07-11', startTime: '02:00', endTime: '04:00', artists: ['Void'], blockType: 'artist_set' },

  // Day 2 (Saturday column, 07-11 06:00 -> 07-12 06:00)
  { id: 'm12', name: 'Morning Yoga & Music', stage: 'Gallery', date: '2026-07-11', startTime: '09:00', endTime: '10:30', artists: ['Zen Beats'], blockType: 'workshop' },
  { id: 'm13', name: 'Stage Line Check', stage: 'Bayou', date: '2026-07-11', startTime: '10:30', endTime: '11:00', artists: [], blockType: 'setup' },
  { id: 'm14', name: 'Brunch Beats', stage: 'Apogee', date: '2026-07-11', startTime: '11:00', endTime: '13:00', artists: ['DJ Mimosa'], blockType: 'artist_set' },
  { id: 'm15', name: 'Drum Circle', stage: 'Gallery', date: '2026-07-11', startTime: '13:00', endTime: '14:30', artists: ['Community'], blockType: 'workshop' },
  { id: 'm16', name: 'House Collective', stage: 'Apogee', date: '2026-07-11', startTime: '15:00', endTime: '17:00', artists: ['House Collective'], blockType: 'artist_set' },
  { id: 'm17', name: 'Soul Revival', stage: 'Bayou', date: '2026-07-11', startTime: '16:00', endTime: '17:30', artists: ['Soul Revival'], blockType: 'artist_set' },
  { id: 'm18', name: 'Techno Takeover', stage: 'Bayou', date: '2026-07-11', startTime: '20:00', endTime: '23:00', artists: ['Static'], blockType: 'artist_set' },
  { id: 'm19', name: 'Silent Disco', stage: 'Apogee', date: '2026-07-11', startTime: '23:00', endTime: '23:59', artists: ['Various'], blockType: 'artist_set' },
];

export const mockScheduleEvents: Event[] = raw.map((e) => ({
  ...e,
  festivalDay: computeFestivalDay(e.date, e.startTime),
}));
