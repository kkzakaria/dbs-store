export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center p-4">
      {children}
    </div>
  );
}
