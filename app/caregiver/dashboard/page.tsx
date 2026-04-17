import { CaregiverHomeDashboard } from "@/components/caregiver-home-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { getCareMemberDashboardData } from "@/lib/db/medic-data";

type CaregiverDashboardPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function CaregiverDashboardPage({
  searchParams,
}: CaregiverDashboardPageProps) {
  const user = await requireRole("caregiver");
  const resolvedSearchParams = await searchParams;
  const dashboard = await getCareMemberDashboardData({
    patientUserId: resolvedSearchParams.patientId ?? null,
    userId: user.userId,
  });

  if (!dashboard) {
    return null;
  }

  return <CaregiverHomeDashboard dashboard={dashboard} />;
}
