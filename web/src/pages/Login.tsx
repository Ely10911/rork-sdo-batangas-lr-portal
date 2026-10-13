import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, AtSign, Eye, EyeOff, KeyRound, Lock, ShieldCheck, UserRound, UserRoundPlus } from "lucide-react";

import { Eyebrow } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DIVISION } from "@/lib/taxonomy";
import { useLrms } from "@/lib/store";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginViewer, continueAsViewer } = useLrms();
  const [mode, setMode] = useState<"admin" | "viewer">("admin");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [viewerEmail, setViewerEmail] = useState<string>("");
  const [reveal, setReveal] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const submitAdmin = (event: React.FormEvent) => {
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

  const submitViewer = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await loginViewer(viewerEmail);
    setBusy(false);
    if (result.ok) {
      toast.success("Welcome back! You are signed in to the viewer portal.");
      navigate("/browse");
    } else {
      setError(result.error ?? "We could not sign you in. Please try again.");
    }
  };

  return (
    <div className="ink-panel relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="grid-lines absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-gold-soft/15 blur-[100px]" />

      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_400px] lg:items-center">
        <div className="animate-fade-rise">
          <div className="flex items-center gap-3">
            <span className="relative grid h-12 w-12 place-items-center rounded-full border border-gold/60 bg-gold-deep">
              <span className="absolute inset-[3px] rounded-full border border-gold/25" />
              <ShieldCheck className="h-5 w-5 text-gold" strokeWidth={1.7} />
            </span>
            <div>
              <Eyebrow className="text-gold-soft">Secure access</Eyebrow>
              <p className="font-display text-lg font-bold text-white">LRMS Administrator Console</p>
            </div>
          </div>

          <h1 className="mt-8 max-w-xl font-display text-4xl font-bold leading-[1.08] text-white md:text-5xl">
            Manage the learning resource archive of Batangas.
          </h1>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-white/65">
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
              <li key={item} className="flex items-start gap-2 text-[13px] text-white/70">
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
              className="focus-ring inline-flex items-center gap-2 rounded-sm border border-white/25 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:border-gold hover:text-gold-soft"
            >
              Continue as public viewer <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/register"
              className="focus-ring inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2.5 text-[13px] font-bold text-gold-deep transition-colors hover:bg-gold-soft"
            >
              <UserRoundPlus className="h-4 w-4" strokeWidth={2.2} /> Register as a viewer
            </Link>
            <Link to="/" className="text-[13px] text-white/55 underline hover:text-white">
              Back to portal home
            </Link>
          </div>
        </div>

        <div className="animate-fade-rise rounded-lg border border-white/12 bg-white/[0.06] p-6 backdrop-blur-md">
          {/* Sign-in type switch */}
          <div className="grid grid-cols-2 gap-1 rounded-sm border border-white/12 bg-gold-deep/50 p-1" role="tablist" aria-label="Sign-in type">
            {(
              [
                { id: "admin", label: "Administrator" },
                { id: "viewer", label: "Viewer" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => {
                  setMode(tab.id);
                  setError("");
                }}
                className={cn(
                  "focus-ring rounded-sm px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors",
                  mode === tab.id ? "bg-gold text-gold-deep" : "text-white/55 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "admin" ? (
            <>
              <p className="eyebrow mt-5 text-gold-soft">Restricted area</p>
              <h2 className="mt-1.5 font-display text-2xl font-bold text-white">System Administrator sign-in</h2>
              <p className="mt-1 text-[12px] text-white/50">{DIVISION}</p>

              <form onSubmit={submitAdmin} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-white/60">Username</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      placeholder="Enter administrator username"
                      className="h-10 rounded-sm border-white/20 bg-gold-deep/60 pl-9 text-[13px] text-white placeholder:text-white/30 focus-visible:ring-gold"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-white/60">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={reveal ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      className="h-10 rounded-sm border-white/20 bg-gold-deep/60 pl-9 pr-10 text-[13px] text-white placeholder:text-white/30 focus-visible:ring-gold"
                    />
                    <button
                      type="button"
                      onClick={() => setReveal((r) => !r)}
                      aria-label={reveal ? "Hide password" : "Show password"}
                      className="focus-ring absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-sm text-white/50 hover:text-white"
                    >
                      {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                {error && (
                  <p className="rounded-sm border border-destructive/40 bg-destructive/15 px-3 py-2 text-[12px] text-white">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    "focus-ring flex w-full items-center justify-center gap-2 rounded-sm bg-gold px-4 py-2.5 text-[13px] font-bold text-gold-deep transition-all hover:bg-gold-soft active:scale-[0.99]",
                    busy && "opacity-70",
                  )}
                >
                  <KeyRound className="h-4 w-4" strokeWidth={2.2} />
                  {busy ? "Verifying credentials…" : "Sign in to console"}
                </button>
              </form>

              <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/40">
                Unauthorized access to this system is punishable under Philippine law (RA 10175). All sign-in attempts are
                logged.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow mt-5 text-gold-soft">Registered viewers</p>
              <h2 className="mt-1.5 font-display text-2xl font-bold text-white">Sign in as a viewer</h2>
              <p className="mt-1 text-[12px] text-white/50">
                Use the email address you registered with to sync your account on this device.
              </p>

              <form onSubmit={submitViewer} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-white/60">Email address</span>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      value={viewerEmail}
                      onChange={(event) => setViewerEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="name@deped.gov.ph"
                      className="h-10 rounded-sm border-white/20 bg-gold-deep/60 pl-9 text-[13px] text-white placeholder:text-white/30 focus-visible:ring-gold"
                    />
                  </div>
                </label>

                {error && (
                  <p className="rounded-sm border border-destructive/40 bg-destructive/15 px-3 py-2 text-[12px] text-white">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    "focus-ring flex w-full items-center justify-center gap-2 rounded-sm bg-gold px-4 py-2.5 text-[13px] font-bold text-gold-deep transition-all hover:bg-gold-soft active:scale-[0.99]",
                    busy && "opacity-70",
                  )}
                >
                  <KeyRound className="h-4 w-4" strokeWidth={2.2} />
                  {busy ? "Checking your account…" : "Sign in to viewer portal"}
                </button>
              </form>

              <p className="mt-5 border-t border-white/10 pt-4 text-[12px] text-white/55">
                Don&apos;t have an account yet?{" "}
                <Link to="/register" className="font-bold text-gold-soft underline hover:text-gold">
                  Register as a viewer
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
