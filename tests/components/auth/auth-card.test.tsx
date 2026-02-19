import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthCard } from "@/components/auth/auth-card";

describe("AuthCard", () => {
  it("renders title", () => {
    render(
      <AuthCard title="Connexion" description="Connectez-vous">
        <div>content</div>
      </AuthCard>
    );
    expect(screen.getByText("Connexion")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <AuthCard title="Connexion" description="Connectez-vous">
        <div>content</div>
      </AuthCard>
    );
    expect(screen.getByText("Connectez-vous")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <AuthCard title="Connexion" description="Connectez-vous">
        <div>test content</div>
      </AuthCard>
    );
    expect(screen.getByText("test content")).toBeInTheDocument();
  });

  it("renders DBS Store logo", () => {
    render(
      <AuthCard title="Connexion" description="Connectez-vous">
        <div>content</div>
      </AuthCard>
    );
    expect(screen.getByText("DBS Store")).toBeInTheDocument();
  });
});
