import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookMarked, Building2, Hash, Search, Tag, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buildSuggestions, type Suggestion } from "@/lib/search";
import { useLrms } from "@/lib/store";

const KIND_ICON: Record<Suggestion["kind"], LucideIcon> = {
  resource: BookMarked,
  competency: Hash,
  keyword: Tag,
  author: UserRound,
  school: Building2,
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  size?: "hero" | "compact";
  className?: string;
}

export function SearchCommand({ value, onChange, onSubmit, placeholder, size = "compact", className }: Props) {
  const navigate = useNavigate();
  const { resources } = useLrms();
  const [open, setOpen] = useState<boolean>(false);
  const [cursor, setCursor] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => buildSuggestions(resources, value), [resources, value]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const commit = (suggestion: Suggestion) => {
    setOpen(false);
    if (suggestion.kind === "resource" && suggestion.resourceId) {
      navigate(`/resource/${suggestion.resourceId}`);
      return;
    }
    onChange(suggestion.label);
    onSubmit(suggestion.label);
  };

  const isHero = size === "hero";

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(false);
          onSubmit(value);
        }}
        className={cn(
          "flex items-center gap-2 border bg-card/95 shadow-plate transition-shadow focus-within:border-red",
          isHero ? "rounded-lg border-border/60 px-4 py-3" : "rounded-md border-border px-3 py-2",
        )}
      >
        <Search className={cn("shrink-0 text-red-dark", isHero ? "h-5 w-5" : "h-4 w-4")} strokeWidth={2} />
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setCursor(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setCursor((c) => Math.min(c + 1, suggestions.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setCursor((c) => Math.max(c - 1, -1));
            } else if (event.key === "Enter" && cursor >= 0 && suggestions[cursor]) {
              event.preventDefault();
              commit(suggestions[cursor]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder ?? "Search title, competency code, keyword, author or school…"}
          aria-label="Search learning resources"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted-foreground/80",
            isHero ? "text-base" : "text-sm",
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onSubmit("");
            }}
            aria-label="Clear search"
            className="focus-ring rounded-sm p-1 text-muted-foreground hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className={cn(
            "focus-ring shrink-0 rounded-sm bg-red font-medium text-white transition-colors hover:bg-red-dark",
            isHero ? "px-5 py-2 text-sm" : "px-3 py-1.5 text-[13px]",
          )}
        >
          Search
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 animate-fade-in overflow-hidden rounded-md border border-border bg-popover shadow-lift">
          <p className="eyebrow border-b border-border/70 bg-muted/60 px-3 py-2 text-muted-foreground">
            Auto-complete · {suggestions.length} match{suggestions.length > 1 ? "es" : ""}
          </p>
          <ul className="max-h-80 overflow-y-auto py-1">
            {suggestions.map((suggestion, i) => {
              const Icon = KIND_ICON[suggestion.kind];
              return (
                <li key={`${suggestion.kind}-${suggestion.label}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => commit(suggestion)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                      cursor === i ? "bg-red/12" : "hover:bg-muted/70",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-red-dark" strokeWidth={1.8} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{suggestion.label}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {suggestion.hint}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
