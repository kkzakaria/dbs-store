import Link from "next/link"
import { Logo } from "@/components/shared/Logo"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Logo variant="large" asLink={false} />
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center pt-2">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Retour à la boutique
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
