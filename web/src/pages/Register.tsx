import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Building2, Landmark, Mail, UserRound } from "lucide-react";

import { Eyebrow } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DIVISION, SCHOOL_NAMES, SUB_OFFICE_NAMES } from "@/lib/taxonomy";
import { useLrms } from "@/lib/store";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared classes for the native selects so they match the dark card style. */
const selectClasses =
  "h-10 w-full appearance-none rounded-sm border border-white/20 bg-gold-deep/60 px-3 text-[13px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export default function Register() {
  const navigate = useNavigate();
  const { registerViewer } = useLrms();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [subOffice, setSubOffice] = useState<string>("");
  const [school, setSchool] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const valid = name.trim().length >= 2 && EMAIL_PATTERN.test(email.trim()) && subOffice !== "" && school !== "";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) {
      setError("Please complete all fields with a valid email address.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await registerViewer({
      name: name.trim(),
      email: email.trim(),
      subOffice,
      school,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Registration failed. Please try again.");
      return;
    }
    toast.success("Welcome! Your viewer account has been created.", {
      description: "You are now signed in to the Learning Resource Portal.",
    });
    navigate("/browse");
  };

  return (
    <div className="ink-panel relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="grid-lines absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-gold-soft/15 blur-[100px]" />

      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_440px] lg:items-center">
        <div className="animate-fade-rise">
          <div className="flex items-center gap-3">
            <span className="relative grid h-12 w-12 place-items-center rounded-full border border-gold/60 bg-gold-deep">
              <span className="absolute inset-[3px] rounded-full border border-gold/25" />
              <BadgeCheck className="h-5 w-5 text-gold" strokeWidth={1.7} />
            </span>
            <div>
              <Eyebrow className="text-gold-soft">Viewer registration</Eyebrow>
              <p className="font-display text-lg font-bold text-white">Learning Resource Portal</p>
            </div>
          </div>

          <h1 className="mt-8 max-w-xl font-display text-4xl font-bold leading-[1.08] text-white md:text-5xl">
            Create your free viewer account.
          </h1>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-white/65">
            Registered viewers from schools and sub-offices across {DIVISION} can bookmark materials, build collections,
            and get notified when new learning resources are published for their school.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Save and organize resources into collections",
              "Get notified of newly published LRs",
              "Your account is verified against your school",
              "Free for all DepEd Batangas personnel",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-white/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="focus-ring inline-flex items-center gap-2 rounded-sm border border-white/25 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:border-gold hover:text-gold-soft"
            >
              <ArrowLeft className="h-4 w-4" /> Administrator sign-in
            </Link>
            <Link to="/" className="text-[13px] text-white/55 underline hover:text-white">
              Back to portal home
            </Link>
          </div>
        </div>

        <div className="animate-fade-rise rounded-lg border border-white/12 bg-white/[0.06] p-6 backdrop-blur-md">
          <p className="eyebrow text-gold-soft">Public portal</p>
          <h2 className="mt-1.5 font-display text-2xl font-bold text-white">Register as a viewer</h2>
          <p className="mt-1 text-[12px] text-white/50">Use your official DepEd email address if available.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-white/60">Complete name</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Juan M. Dela Cruz"
                  className="h-10 rounded-sm border-white/20 bg-gold-deep/60 pl-9 text-[13px] text-white placeholder:text-white/30 focus-visible:ring-gold"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-white/60">Email address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. jdelacruz@deped.gov.ph"
                  className="h-10 rounded-sm border-white/20 bg-gold-deep/60 pl-9 text-[13px] text-white placeholder:text-white/30 focus-visible:ring-gold"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-white/60">
                <Landmark className="h-3.5 w-3.5 text-gold/70" /> Sub-Office / Unit
              </span>
              <select
                value={subOffice}
                onChange={(event) => setSubOffice(event.target.value)}
                className={cn(selectClasses, subOffice === "" && "text-white/30")}
                aria-label="Sub-Office / Unit"
              >
                <option value="" disabled className="bg-gold-deep text-white/40">
                  Select your sub-office / unit
                </option>
                {SUB_OFFICE_NAMES.map((office) => (
                  <option key={office} value={office} className="bg-gold-deep text-white">
                    {office}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-white/60">
                <Building2 className="h-3.5 w-3.5 text-gold/70" /> School
              </span>
              <select
                value={school}
                onChange={(event) => setSchool(event.target.value)}
                className={cn(selectClasses, school === "" && "text-white/30")}
                aria-label="School"
              >
                <option value="" disabled className="bg-gold-deep text-white/40">
                  Select your school
                </option>
                {SCHOOL_NAMES.map((schoolName) => (
                  <option key={schoolName} value={schoolName} className="bg-gold-deep text-white">
                    {schoolName}
                  </option>
                ))}
              </select>
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
              <BadgeCheck className="h-4 w-4" strokeWidth={2.2} />
              {busy ? "Creating your account…" : "Create my viewer account"}
            </button>
          </form>

          <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/40">
            By registering you agree that your name, school, and sub-office may be shown to division administrators for
            verification and reporting purposes, in accordance with the Data Privacy Act (RA 10173).
          </p>
        </div>
      </div>
    </div>
  );
}
