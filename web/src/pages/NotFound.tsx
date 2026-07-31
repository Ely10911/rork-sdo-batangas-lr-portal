import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("LRMS 404: route not found —", location.pathname);
  }, [location.pathname]);

  return (
    <div className="ink-panel relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="grid-lines absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-[100px]" />
      <div className="relative max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/50 bg-gold/12">
          <FileQuestion className="h-6 w-6 text-gold" strokeWidth={1.7} />
        </span>
        <p className="eyebrow mt-6 text-gold-soft">Error 404 · Record not found</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-parchment">
          This page is not in the division archive.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-parchment/60">
          The page you requested may have been moved, archived, or the link may be incorrect. Return to the portal home
          or search the learning resource catalog instead.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="focus-ring inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2.5 text-[13px] font-bold text-ink-deep hover:bg-gold-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Portal home
          </Link>
          <Link
            to="/browse"
            className="focus-ring rounded-sm border border-parchment/25 px-4 py-2.5 text-[13px] font-medium text-parchment hover:border-gold hover:text-gold-soft"
          >
            Search the catalog
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
