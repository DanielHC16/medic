import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";

describe("CareMemberBottomNav", () => {
  it("uses the shared join route for family members", () => {
    render(<CareMemberBottomNav activeItem="home" role="family_member" />);

    expect(screen.getByRole("link", { name: "Join" })).toHaveAttribute("href", "/join");
  });

  it("keeps join unscoped and scopes caregiver patient routes", () => {
    render(
      <CareMemberBottomNav
        activeItem="home"
        patientUserId="patient-123"
        role="caregiver"
      />,
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/caregiver/dashboard?patientId=patient-123",
    );
    expect(screen.getByRole("link", { name: "Join" })).toHaveAttribute("href", "/join");
  });
});
