import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpInput } from "@/components/auth/otp-input";

describe("OtpInput", () => {
  it("renders 6 input fields", () => {
    render(<OtpInput value="" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("calls onChange with combined value when typing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    await user.click(inputs[0]);
    await user.keyboard("1");
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("fills all fields from pasted value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    await user.click(inputs[0]);
    await user.paste("123456");
    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("displays current value across fields", () => {
    render(<OtpInput value="12" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs[0].value).toBe("1");
    expect(inputs[1].value).toBe("2");
    expect(inputs[2].value).toBe("");
  });
});
