"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/shared/Loading"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Custom icons for OAuth providers
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="#1877F2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

type Provider = "google" | "apple" | "facebook"

interface ProviderConfig {
  name: string
  provider: Provider
  icon: React.FC<{ className?: string }>
}

const providers: ProviderConfig[] = [
  { name: "Google", provider: "google", icon: GoogleIcon },
  { name: "Apple", provider: "apple", icon: AppleIcon },
  { name: "Facebook", provider: "facebook", icon: FacebookIcon },
]

export function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = React.useState<Provider | null>(null)

  const handleOAuthSignIn = async (provider: Provider) => {
    setLoadingProvider(provider)

    try {
      const supabase = createClient()
      const currentPath = window.location.pathname + window.location.search
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(currentPath)}`,
        },
      })

      if (error) {
        toast.error("Erreur", {
          description: "Impossible de se connecter. Veuillez réessayer.",
        })
        setLoadingProvider(null)
      }
      // If no error, the user will be redirected to the OAuth provider
    } catch {
      toast.error("Erreur", {
        description: "Une erreur est survenue.",
      })
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {providers.map((item) => {
          const Icon = item.icon
          const isLoading = loadingProvider === item.provider
          const isDisabled = loadingProvider !== null

          return (
            <Button
              key={item.provider}
              variant="outline"
              onClick={() => handleOAuthSignIn(item.provider)}
              disabled={isDisabled}
              className="w-full"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Icon className="size-5" />
              )}
              <span className="sr-only">{item.name}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
