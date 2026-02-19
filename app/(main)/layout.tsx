import { AppBar } from "@/components/layout/app-bar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppBar />
      <main>{children}</main>
    </>
  );
}
