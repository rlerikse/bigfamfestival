import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SegmentedControl } from '@/components/shared/SegmentedControl';
import { EventsListView } from '@/components/events/EventsListView';
import { EventsScheduleView } from '@/components/events/EventsScheduleView';
import { Input } from '@/components/ui/input';
import { STAGES } from '@/lib/constants';

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'list';
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const setView = (v: string) => {
    setSearchParams({ view: v });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <SegmentedControl
          options={[
            { value: 'list', label: 'List' },
            { value: 'schedule', label: 'Schedule' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {/* Shared filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(e) => setUpcomingOnly(e.target.checked)}
            className="rounded border-input"
          />
          Upcoming only
        </label>
      </div>

      {/* View */}
      {view === 'list' ? (
        <EventsListView search={search} stage={stageFilter} upcomingOnly={upcomingOnly} />
      ) : (
        <EventsScheduleView search={search} stage={stageFilter} />
      )}
    </div>
  );
}
