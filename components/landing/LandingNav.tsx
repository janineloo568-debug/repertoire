"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export function LandingNav() {
  const { data: session } = useSession();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-sheet-border bg-sheet-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 sm:px-12">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-8 lg:gap-12">
          <Link href="/" className="font-display shrink-0 text-2xl font-bold tracking-[-0.6px] text-black">
            Repertoire
          </Link>
          <nav className="flex min-w-0 items-center gap-3 text-xs font-medium text-sheet-muted sm:gap-6 sm:text-sm">
            <Link href="/library" className="transition-colors hover:text-sheet-ink">
              Library
            </Link>
            <Link href="/suggestions" className="transition-colors hover:text-sheet-ink">
              Suggestions
            </Link>
            {session?.user ? (
              <Link href="/feed" className="transition-colors hover:text-sheet-ink">
                Feed
              </Link>
            ) : null}
            {session?.user ? (
              <Link href="/settings" className="transition-colors hover:text-sheet-ink">
                Settings
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          {session?.user ? (
            <>
              <span className="hidden max-w-[200px] truncate text-xs text-sheet-muted lg:inline">{session.user.email}</span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-sheet-border bg-white px-4 py-2 text-sm font-medium text-sheet-ink transition-colors hover:bg-sheet-cream"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-sheet-ink hover:underline">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-sheet-cream transition-colors hover:bg-neutral-900"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
