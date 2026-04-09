import { AppShell } from "@/components/app-shell";
import {
  listActivityPlansForPatient,
  listAppointmentsForPatient,
  listMedicationsForPatient,
} from "@/lib/db/medic-data";
import { formatDateTime, formatDayList, formatTimeList } from "@/lib/display";
import { requireRole } from "@/lib/auth/dal";

export default async function PatientSchedulePage() {
  const user = await requireRole("patient");
  const [medications, activities, appointments] = await Promise.all([
    listMedicationsForPatient(user.userId),
    listActivityPlansForPatient(user.userId),
    listAppointmentsForPatient(user.userId),
  ]);

  return (
    <AppShell
      user={user}
      title="Patient Schedule"
      description="Combined view of medication reminders, wellness routines, and appointments."
      links={[
        { href: "/patient/dashboard", label: "Home" },
        { href: "/patient/medications", label: "Medications" },
        { href: "/patient/health-info", label: "Health Info" },
        { href: "/wellness", label: "Wellness" },
      ]}
    >
      <section className="grid gap-6 lg:grid-cols-3">
        <ScheduleColumn
          title="Medication"
          items={medications.map((item) => ({
            subtitle: `${formatTimeList(item.scheduleTimes)} / ${formatDayList(item.scheduleDays)}`,
            title: item.name,
          }))}
        />
        <ScheduleColumn
          title="Routines"
          items={activities.map((item) => ({
            subtitle: `${item.frequencyType} / ${formatDayList(item.daysOfWeek)}`,
            title: item.title,
          }))}
        />
        <ScheduleColumn
          title="Appointments"
          items={appointments.map((item) => ({
            subtitle: formatDateTime(item.appointmentAt),
            title: item.title,
          }))}
        />
      </section>
    </AppShell>
  );
}

function ScheduleColumn(props: {
  items: Array<{
    subtitle: string;
    title: string;
  }>;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {props.title}
      </h2>
      <div className="mt-4 grid gap-4">
        {props.items.length === 0 ? (
          <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
            No scheduled items yet.
          </p>
        ) : (
          props.items.map((item) => (
            <article
              key={`${props.title}-${item.title}-${item.subtitle}`}
              className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
            >
              <p className="text-lg font-semibold text-[var(--foreground)]">{item.title}</p>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                {item.subtitle}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
