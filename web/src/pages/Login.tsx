import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, ShieldCheck, UserRound } from "lucide-react";

import { Eyebrow } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DIVISION } from "@/lib/taxonomy";
import { useLrms } from "@/lib/store";

export default function Login() {
  const navigate = useNavigate();
  const { login, continueAsViewer } = useLrms();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [reveal, setReveal] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    window.setTimeout(() => {
      const ok = login(username, password);
      setBusy(false);
      if (ok) {
        toast.success("Signed in as Division LRMS Administrator");
        navigate("/admin");
      } else {
        setError("Invalid credentials. Access is restricted to authorized division personnel.");
      }
    }, 420);
  };

  return (
    <div className="ink-panel relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="grid-lines absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-verdigris/15 blur-[100px]" />

      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_400px] lg:items-center">
        <div className="animate-fade-rise">
          <div className="flex items-center gap-3">
            <span className="relative grid h-12 w-12 place-items-center rounded-full border border-gold/60 bg-ink-deep">
              <span className="absolute inset-[3px] rounded-full border border-gold/25" />
              <ShieldCheck className="h-5 w-5 text-gold" strokeWidth={1.7} />
            </span>
            <div>
              <Eyebrow className="text-gold-soft">Secure access</Eyebrow>
              <p className="font-display text-lg font-bold text-parchment">LRMS Administrator Console</p>
            </div>
          </div>

          <h1 className="mt-8 max-w-xl font-display text-4xl font-bold leading-[1.08] text-parchment md:text-5xl">
            Manage the learning resource archive of Batangas.
          </h1>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-parchment/65">
            Sign in to upload and quality-assure materials, manage metadata and versions, monitor downloads, and generate
            division-level utilization reports.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Batch upload with metadata capture",
              "Draft, review and publish workflow",
              "Version replacement with audit trail",
              "Reports exportable to Excel, CSV & PDF",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-parchment/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                continueAsViewer();
                navigate("/browse");
              }}
              className="focus-ring inline-flex items-center gap-2 rounded-sm border border-parchment/25 px-4 py-2.5 text-[13px] font-medium text-parchment transition-colors hover:border-gold hover:text-gold-soft"
            >
              Continue as public viewer <ArrowRight className="h-4 w-4" />
            </button>
            <Link to="/" className="text-[13px] text-parchment/55 underline hover:text-parchment">
              Back to portal home
            </Link>
          </div>
        </div>

        <div className="animate-fade-rise rounded-lg border border-parchment/12 bg-parchment/[0.06] p-6 backdrop-blur-md">
          <p className="eyebrow text-gold-soft">Restricted area</p>
          <h2 className="mt-1.5 font-display text-2xl font-bold text-parchment">System Administrator sign-in</h2>
          <p className="mt-1 text-[12px] text-parchment/50">{DIVISION}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-parchment/60">Username</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment/40" />
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Enter administrator username"
                  className="h-10 rounded-sm border-parchment/20 bg-ink-deep/60 pl-9 text-[13px] text-parchment placeholder:text-parchment/30 focus-visible:ring-gold"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-parchment/60">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment/40" />
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={reveal ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="h-10 rounded-sm border-parchment/20 bg-ink-deep/60 pl-9 pr-10 text-[13px] text-parchment placeholder:text-parchment/30 focus-visible:ring-gold"
                />
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  className="focus-ring absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-sm text-parchment/50 hover:text-parchment"
                >
                  {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-sm border border-destructive/40 bg-destructive/15 px-3 py-2 text-[12px] text-parchment">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className={cn(
                "focus-ring flex w-full items-center justify-center gap-2 rounded-sm bg-gold px-4 py-2.5 text-[13px] font-bold text-ink-deep transition-all hover:bg-gold-soft active:scale-[0.99]",
                busy && "opacity-70",
              )}
            >
              <KeyRound className="h-4 w-4" strokeWidth={2.2} />
              {busy ? "Verifying credentials…" : "Sign in to console"}
            </button>
          </form>

          <p className="mt-5 border-t border-parchment/10 pt-4 text-[11px] leading-relaxed text-parchment/40">
            Unauthorized access to this system is punishable under Philippine law (RA 10175). All sign-in attempts are
            logged.
          </p>
        </div>
      </div>
    </div>
  );
}
