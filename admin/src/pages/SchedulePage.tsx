import { ScheduleEditor } from '@/components/schedule/ScheduleEditor';

export function SchedulePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Schedule</h1>
      <p className="text-muted-foreground">
        Drag/resize schedule editor — Apogee, Bayou, Gallery. Currently on mocked data
        pending backend #166 (blockType/festivalDay). Drag-to-move (#170) and
        drag-to-resize (#171) land next.
      </p>
      <ScheduleEditor />
    </div>
  );
}
