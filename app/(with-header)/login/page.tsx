import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sheet-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
