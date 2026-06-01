import { describe, it, expect, vi, beforeEach } from "vitest";

const { uploadMock } = vi.hoisted(() => ({ uploadMock: vi.fn() }));
vi.mock("@/lib/actions/admin-upload", () => ({ uploadProductImage: uploadMock }));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUploader } from "@/components/admin/image-uploader";

beforeEach(() => vi.clearAllMocks());

function fileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("ImageUploader", () => {
  it("uploade plusieurs fichiers et les ajoute aux images existantes", async () => {
    uploadMock
      .mockResolvedValueOnce({ path: "/api/media/products/a.png" })
      .mockResolvedValueOnce({ path: "/api/media/products/b.png" });
    const onChange = vi.fn();
    const { container } = render(<ImageUploader images={["/existing.png"]} onChange={onChange} />);

    await userEvent.upload(fileInput(container), [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ]);

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledWith([
      "/existing.png",
      "/api/media/products/a.png",
      "/api/media/products/b.png",
    ]);
  });

  it("en échec partiel : garde les succès et affiche le nom + la raison du fichier échoué", async () => {
    uploadMock
      .mockResolvedValueOnce({ error: "Type de fichier non autorisé: x" })
      .mockResolvedValueOnce({ path: "/api/media/products/ok.png" });
    const onChange = vi.fn();
    const { container } = render(<ImageUploader images={[]} onChange={onChange} />);

    await userEvent.upload(fileInput(container), [
      new File(["bad"], "bad.gif", { type: "image/gif" }),
      new File(["ok"], "ok.png", { type: "image/png" }),
    ]);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["/api/media/products/ok.png"]));
    const err = await screen.findByText(/bad\.gif/);
    expect(err.textContent).toMatch(/non autorisé/i);
  });

  it("retire une image quand on clique sur le bouton de suppression", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader images={["/a.png", "/b.png"]} onChange={onChange} />
    );
    // Un seul bouton par image (la dropzone est un div, pas un bouton).
    const removeButtons = container.querySelectorAll("button");
    expect(removeButtons).toHaveLength(2);
    await userEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(["/b.png"]);
  });
});
