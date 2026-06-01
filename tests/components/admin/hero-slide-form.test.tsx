import { describe, it, expect, vi, beforeEach } from "vitest";

const { uploadMock } = vi.hoisted(() => ({
  uploadMock: vi.fn().mockResolvedValue({ path: "/api/media/banners/123-x.png" }),
}));
vi.mock("@/lib/actions/admin-upload", () => ({ uploadBannerImage: uploadMock }));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";

const noop = vi.fn().mockResolvedValue({});

beforeEach(() => vi.clearAllMocks());

describe("HeroSlideForm", () => {
  it("ne propose plus de champ URL d'image", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.queryByPlaceholderText("https://...")).toBeNull();
  });

  it("affiche un bouton d'ajout d'image (upload)", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.getByRole("button", { name: /ajouter une image/i })).toBeDefined();
  });

  it("affiche l'aperçu live de la bannière", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.getByText("Aperçu")).toBeDefined();
  });

  it("appelle uploadBannerImage quand un fichier est choisi", async () => {
    const { container } = render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "promo.png", { type: "image/png" });
    await userEvent.upload(input, file);
    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
    const fd = uploadMock.mock.calls[0][0] as FormData;
    expect(fd.get("file")).toBeInstanceOf(File);
  });
});
