import { PatientProfilePage } from "@/components/patient-profile-page";
import { requireRole } from "@/lib/auth/dal";

export default async function ProfilePage() {
  const user = await requireRole("patient");

  return (
    <PatientProfilePage
      user={{
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImageDataUrl: user.profileImageDataUrl,
      }}
    />
  );
}
