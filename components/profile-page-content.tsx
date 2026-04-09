import { AccountProfileManager } from "@/components/account-profile-manager";
import type {
  AuthenticatedUser,
  CareRelationship,
  LinkedPatientSummary,
} from "@/lib/medic-types";

function mapRelationships(
  records: CareRelationship[] | LinkedPatientSummary[],
) {
  return records.map((item) =>
    "relatedDisplayName" in item
      ? {
          id: item.id,
          subtitle: `${item.memberRole.replace("_", " ")} / ${item.relationshipStatus}`,
          title: item.relatedDisplayName,
        }
      : {
          id: item.relationshipId,
          subtitle: `patient link / ${item.relationshipStatus}`,
          title: item.patientDisplayName,
        },
  );
}

export function ProfilePageContent(props: {
  heading: string;
  records: CareRelationship[] | LinkedPatientSummary[];
  roleNotes?: string[];
  shortcuts?: Array<{
    href: string;
    label: string;
  }>;
  user: AuthenticatedUser;
}) {
  return (
    <AccountProfileManager
      heading={props.heading}
      relationships={mapRelationships(props.records)}
      roleNotes={props.roleNotes}
      shortcuts={props.shortcuts}
      user={props.user}
    />
  );
}
