import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import SignInPage from "@/app/sign-in/page";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("next/image", () => ({
  default: (props: ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) => {
    void props;
    return <span data-testid="next-image" />;
  },
}));

describe("SignInPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("does not show the install popup immediately when install becomes available", async () => {
    render(<SignInPage />);

    act(() => {
      window.dispatchEvent(new Event("beforeinstallprompt"));
    });

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Install MEDIC" })).not.toBeInTheDocument();
    });
  });

  it("submits credentials and redirects after a successful sign-in", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: true,
        redirectTo: "/patient/dashboard",
      }),
      ok: true,
      status: 200,
    } satisfies Partial<Response>);

    vi.stubGlobal("fetch", fetchMock);

    render(<SignInPage />);

    await userEvent.type(
      screen.getByPlaceholderText("Email or Phone Number"),
      "patient.demo@medic.local",
    );
    await userEvent.type(screen.getByPlaceholderText("Password"), "DemoPass123!");
    await userEvent.click(screen.getByRole("button", { name: "SIGN IN" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/login");
    expect(JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string)).toMatchObject({
      identifier: "patient.demo@medic.local",
      password: "DemoPass123!",
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/patient/dashboard");
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });
});
