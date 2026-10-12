import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const SECTIONS = ["Dashboard", "Catalog", "Circulation", "Patrons"];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders the OpenStacks shell with tab navigation", () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(<App />);
    expect(screen.getByRole("heading", { name: "OpenStacks" })).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(SECTIONS);
    expect(screen.getByRole("tab", { name: "Dashboard" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches section content when a tab is selected", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(<App />);
    await user.click(screen.getByRole("tab", { name: "Circulation" }));
    expect(screen.getByRole("tab", { name: "Circulation" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText(/checkouts, returns/i)).toBeInTheDocument();
  });

  it("shows gateway status when the health check succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<App />);
    expect(await screen.findByText("Gateway ok")).toBeInTheDocument();
  });

  it("shows a connecting message when the gateway is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(<App />);
    expect(await screen.findByText("Connecting to gateway…")).toBeInTheDocument();
  });
});
