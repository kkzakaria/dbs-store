import "@testing-library/jest-dom/vitest";

// jsdom n'implémente pas les object URLs — stub pour les aperçus d'upload.
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = () => "blob:mock";
  URL.revokeObjectURL = () => {};
}
