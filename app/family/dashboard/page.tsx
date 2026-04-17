import { CaregiverHomeDashboard } from "@/components/caregiver-home-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { getCareMemberDashboardData } from "@/lib/db/medic-data";

type FamilyDashboardPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function FamilyDashboardPage({
  searchParams,
}: FamilyDashboardPageProps) {
  const user = await requireRole("family_member");
  const resolvedSearchParams = await searchParams;
  const dashboard = await getCareMemberDashboardData({
    patientUserId: resolvedSearchParams.patientId ?? null,
    userId: user.userId,
  });

  if (!dashboard) {
    return null;
  }

  return <CaregiverHomeDashboard dashboard={dashboard} role="family_member" />;
}
