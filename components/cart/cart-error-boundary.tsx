"use client";
import { Component, ReactNode } from "react";
import { useCartStore } from "@/lib/cart";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class CartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[cart] Erreur de rendu — réinitialisation du panier:", error);
    useCartStore.persist.clearStorage();
    useCartStore.setState({ items: [] });
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
