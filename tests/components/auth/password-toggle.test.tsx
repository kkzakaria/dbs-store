import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordToggle } from "@/components/auth/password-toggle";

describe("PasswordToggle", () => {
  it("shows eye icon when type is password", () => {
    render(<PasswordToggle type="password" onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /afficher/i })).toBeInTheDocument();
  });

  it("shows eye-off icon when type is text", () => {
    render(<PasswordToggle type="text" onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /masquer/i })).toBeInTheDocument();
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<PasswordToggle type="password" onToggle={onToggle} />);
    await user.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
