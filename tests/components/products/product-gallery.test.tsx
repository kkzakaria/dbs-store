// tests/components/products/product-gallery.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGallery } from "@/components/products/product-gallery";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

describe("ProductGallery", () => {
  it("affiche l'image principale", () => {
    render(<ProductGallery images={["/img1.jpg"]} name="iPhone 16" />);
    expect(screen.getByAltText("iPhone 16")).toBeInTheDocument();
  });

  it("utilise le placeholder quand le tableau est vide", () => {
    render(<ProductGallery images={[]} name="iPhone 16" />);
    const img = screen.getByAltText("iPhone 16") as HTMLImageElement;
    expect(img.src).toContain("placeholder.svg");
  });

  it("n'affiche pas les miniatures quand il n'y a qu'une image", () => {
    render(<ProductGallery images={["/img1.jpg"]} name="iPhone 16" />);
    expect(screen.queryByAltText("iPhone 16 vue 1")).not.toBeInTheDocument();
  });

  it("affiche les miniatures quand il y a plusieurs images", () => {
    render(<ProductGallery images={["/img1.jpg", "/img2.jpg"]} name="iPhone 16" />);
    expect(screen.getByAltText("iPhone 16 vue 1")).toBeInTheDocument();
    expect(screen.getByAltText("iPhone 16 vue 2")).toBeInTheDocument();
  });

  it("change l'image principale au clic sur une miniature", async () => {
    render(<ProductGallery images={["/img1.jpg", "/img2.jpg"]} name="iPhone 16" />);
    const thumbnails = screen.getAllByRole("button");
    await userEvent.click(thumbnails[1]);
    const mainImg = screen.getByAltText("iPhone 16") as HTMLImageElement;
    expect(mainImg.src).toContain("img2.jpg");
  });
});
