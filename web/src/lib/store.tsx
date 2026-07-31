import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  ADMIN_CREDENTIALS,
  buildDownloadEvents,
  buildFeedback,
  buildNotifications,
  buildResources,
  buildUsers,
} from "./seed";
import {
  deleteCloudCollection,
  deleteCloudResource,
  fetchCloudBookmarks,
  fetchCloudCollections,
  fetchCloudDownloadEvents,
  fetchCloudFeedback,
  fetchCloudNotifications,
  fetchCloudResources,
  fetchCloudUsers,
  incrementCloudDownloads,
  incrementCloudViews,
  insertCloudDownloadEvent,
  insertCloudFeedback,
  isSupabaseConfigured,
  markCloudNotificationRead,
  removeResourceFolder,
  seedCloudIfEmpty,
  toggleCloudBookmark,
  upsertCloudCollection,
  upsertCloudNotification,
  upsertCloudResource,
  upsertCloudUser,
} from "./cloud";
import type {
  AppNotification,
  Collection,
  DownloadEvent,
  Feedback,
  FeedbackKind,
  LearningResource,
  PortalUser,
  ResourceStatus,
  ResourceVersion,
  Session,
} from "./types";

const STORAGE_KEY = "sdo-batangas-lrms:v1";
const VIEWER_ID = "public";

interface PersistedShape {
  resources: LearningResource[];
  feedback: Feedback[];
  bookmarks: string[];
  collections: Collection[];
  notifications: AppNotification[];
  users: PortalUser[];
  session: Session | null;
  history: { resourceId: string; at: string }[];
  extraDownloads: DownloadEvent[];
}

interface LrmsValue extends PersistedShape {
  downloadEvents: DownloadEvent[];
  cloudReady: boolean;
  cloudSyncing: boolean;
  login: (username: string, password: string) => boolean;
  continueAsViewer: () => void;
  logout: () => void;
  addResources: (records: LearningResource[]) => void;
  updateResource: (id: string, patch: Partial<LearningResource>) => void;
  deleteResource: (id: string) => void;
  setResourceStatus: (id: string, status: ResourceStatus) => void;
  addVersion: (id: string, version: ResourceVersion) => void;
  registerDownload: (id: string) => void;
  registerView: (id: string) => void;
  toggleBookmark: (id: string) => void;
  createCollection: (name: string, description: string) => string;
  deleteCollection: (id: string) => void;
  toggleInCollection: (collectionId: string, resourceId: string) => void;
  addFeedback: (resourceId: string, author: string, stars: number, comment: string, kind: FeedbackKind) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toggleUserActive: (id: string) => void;
}

const LrmsContext = createContext<LrmsValue | null>(null);

function defaultState(): PersistedShape {
  const resources = buildResources();
  return {
    resources,
    feedback: buildFeedback(resources),
    bookmarks: [resources[0].id, resources[5].id],
    collections: [
      {
        id: "COL-0001",
        name: "Catch-Up Fridays — Reading",
        description: "Materials ready to print for weekly reading remediation sessions.",
        resourceIds: [resources[5].id, resources[1].id],
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ],
    notifications: buildNotifications(resources),
    users: buildUsers(),
    session: null,
    history: [],
    extraDownloads: [],
  };
}

function loadState(): PersistedShape {
  const base = defaultState();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    const resources = (parsed.resources ?? []).map((r) => ({
      ...r,
      storagePath: r.storagePath ?? null,
    }));
    return {
      resources: resources.length ? resources : base.resources,
      feedback: parsed.feedback ?? base.feedback,
      bookmarks: parsed.bookmarks ?? base.bookmarks,
      collections: parsed.collections ?? base.collections,
      notifications: parsed.notifications ?? base.notifications,
      users: parsed.users ?? base.users,
      session: parsed.session ?? null,
      history: parsed.history ?? [],
      extraDownloads: parsed.extraDownloads ?? [],
    };
  } catch (error) {
    console.warn("LRMS: could not restore saved state, starting fresh.", error);
    return base;
  }
}

export function LrmsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedShape>(() => loadState());
  const [cloudReady, setCloudReady] = useState<boolean>(false);
  const [cloudSyncing, setCloudSyncing] = useState<boolean>(false);
  const hydrated = useRef<boolean>(false);

  // Persist to localStorage on every change (acts as an offline cache + fallback).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("LRMS: state could not be persisted.", error);
    }
  }, [state]);

  // Hydrate from the cloud on mount. The cloud is the source of truth; the
  // local cache is shown first so the UI renders instantly, then cloud data
  // replaces it once loaded. If Supabase isn't configured we stay local-only.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      hydrated.current = true;
      setCloudReady(true);
      return;
    }
    let cancelled = false;
    setCloudSyncing(true);
    (async () => {
      const seeded = defaultState().resources;
      await seedCloudIfEmpty(seeded);
      const [resources, feedback, bookmarks, collections, notifications, users, extraDownloads] = await Promise.all([
        fetchCloudResources(),
        fetchCloudFeedback(),
        fetchCloudBookmarks(),
        fetchCloudCollections(),
        fetchCloudNotifications(),
        fetchCloudUsers(),
        fetchCloudDownloadEvents(),
      ]);
      if (cancelled) return;
      setState((prev) => ({
        ...prev,
        resources: resources.length ? resources : prev.resources,
        feedback: feedback.length ? feedback : prev.feedback,
        bookmarks: bookmarks.length ? bookmarks : prev.bookmarks,
        collections: collections.length ? collections : prev.collections,
        notifications: notifications.length ? notifications : prev.notifications,
        users: users.length ? users : prev.users,
        extraDownloads,
        history: prev.history,
        session: prev.session,
      }));
      hydrated.current = true;
      setCloudSyncing(false);
      setCloudReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const seededDownloads = useMemo<DownloadEvent[]>(() => buildDownloadEvents(buildResources()), []);

  const downloadEvents = useMemo<DownloadEvent[]>(
    () => [...seededDownloads, ...state.extraDownloads],
    [seededDownloads, state.extraDownloads],
  );

  const login = useCallback((username: string, password: string): boolean => {
    const ok = username.trim() === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
    if (ok) {
      setState((prev) => ({
        ...prev,
        session: { role: "admin", name: "Division LRMS Administrator", username: ADMIN_CREDENTIALS.username },
      }));
    }
    return ok;
  }, []);

  const continueAsViewer = useCallback(() => {
    setState((prev) => ({ ...prev, session: { role: "viewer", name: "Public Viewer", username: "public" } }));
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, session: null }));
  }, []);

  const addResources = useCallback((records: LearningResource[]) => {
    setState((prev) => {
      const notifications: AppNotification[] = records
        .filter((r) => r.status === "published")
        .map((r) => ({
          id: `n-${r.id}-${Date.now()}`,
          kind: "resource" as const,
          title: `New learning resource: ${r.title}`,
          body: `${r.resourceType} · ${r.gradeLevel} ${r.learningArea} · uploaded by ${r.author}.`,
          at: new Date().toISOString(),
          read: false,
          resourceId: r.id,
        }));
      records.forEach((record) => void upsertCloudResource(record));
      notifications.forEach((note) => void upsertCloudNotification(note));
      return {
        ...prev,
        resources: [...records, ...prev.resources],
        notifications: [...notifications, ...prev.notifications],
      };
    });
  }, []);

  const updateResource = useCallback((id: string, patch: Partial<LearningResource>) => {
    setState((prev) => {
      const next = prev.resources.map((r) => (r.id === id ? { ...r, ...patch } : r));
      const updated = next.find((r) => r.id === id);
      if (updated) void upsertCloudResource(updated);
      return { ...prev, resources: next };
    });
  }, []);

  const deleteResource = useCallback((id: string) => {
    setState((prev) => {
      void deleteCloudResource(id);
      void removeResourceFolder(id);
      return {
        ...prev,
        resources: prev.resources.filter((r) => r.id !== id),
        bookmarks: prev.bookmarks.filter((b) => b !== id),
        collections: prev.collections.map((c) => ({ ...c, resourceIds: c.resourceIds.filter((r) => r !== id) })),
      };
    });
  }, []);

  const setResourceStatus = useCallback((id: string, status: ResourceStatus) => {
    setState((prev) => {
      const target = prev.resources.find((r) => r.id === id);
      const shouldNotify = Boolean(target) && status === "published" && target?.status !== "published";
      const notifications: AppNotification[] =
        shouldNotify && target
          ? [
              {
                id: `n-${id}-${Date.now()}`,
                kind: "resource",
                title: `New learning resource: ${target.title}`,
                body: `${target.resourceType} · ${target.gradeLevel} ${target.learningArea} is now available for download.`,
                at: new Date().toISOString(),
                read: false,
                resourceId: id,
              },
              ...prev.notifications,
            ]
          : prev.notifications;
      const next = prev.resources.map((r) =>
        r.id === id ? { ...r, status, dateUploaded: status === "published" ? new Date().toISOString() : r.dateUploaded } : r,
      );
      const updated = next.find((r) => r.id === id);
      if (updated) void upsertCloudResource(updated);
      if (shouldNotify && target) notifications.forEach((note) => void upsertCloudNotification(note));
      return { ...prev, resources: next, notifications };
    });
  }, []);

  const addVersion = useCallback((id: string, version: ResourceVersion) => {
    setState((prev) => {
      const next = prev.resources.map((r) =>
        r.id === id
          ? {
              ...r,
              version: version.version,
              fileName: version.fileName,
              fileSizeKB: version.fileSizeKB,
              versions: [...r.versions, version],
              dateUploaded: version.uploadedAt,
            }
          : r,
      );
      const updated = next.find((r) => r.id === id);
      if (updated) void upsertCloudResource(updated);
      return { ...prev, resources: next };
    });
  }, []);

  const registerDownload = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.resources.find((r) => r.id === id);
      if (!target) return prev;
      const at = new Date().toISOString();
      const event: DownloadEvent = {
        id: `${id}-live-${Date.now()}`,
        resourceId: id,
        at,
        subOffice: target.subOffice,
        school: target.school,
      };
      void incrementCloudDownloads(id);
      void insertCloudDownloadEvent(event);
      return {
        ...prev,
        resources: prev.resources.map((r) => (r.id === id ? { ...r, downloads: r.downloads + 1 } : r)),
        history: [{ resourceId: id, at }, ...prev.history.filter((h) => h.resourceId !== id)].slice(0, 40),
        extraDownloads: [...prev.extraDownloads, event],
      };
    });
  }, []);

  const registerView = useCallback((id: string) => {
    setState((prev) => {
      void incrementCloudViews(id);
      return {
        ...prev,
        resources: prev.resources.map((r) => (r.id === id ? { ...r, views: r.views + 1 } : r)),
      };
    });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setState((prev) => {
      const exists = prev.bookmarks.includes(id);
      void toggleCloudBookmark(id, !exists);
      return {
        ...prev,
        bookmarks: exists ? prev.bookmarks.filter((b) => b !== id) : [id, ...prev.bookmarks],
      };
    });
  }, []);

  const createCollection = useCallback((name: string, description: string): string => {
    const id = `COL-${Date.now().toString().slice(-6)}`;
    const collection: Collection = { id, name, description, resourceIds: [], createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, collections: [...prev.collections, collection] }));
    void upsertCloudCollection(collection);
    return id;
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setState((prev) => ({ ...prev, collections: prev.collections.filter((c) => c.id !== id) }));
    void deleteCloudCollection(id);
  }, []);

  const toggleInCollection = useCallback((collectionId: string, resourceId: string) => {
    setState((prev) => {
      const next = prev.collections.map((c) => {
        if (c.id !== collectionId) return c;
        const inside = c.resourceIds.includes(resourceId);
        return {
          ...c,
          resourceIds: inside ? c.resourceIds.filter((r) => r !== resourceId) : [...c.resourceIds, resourceId],
        };
      });
      const updated = next.find((c) => c.id === collectionId);
      if (updated) void upsertCloudCollection(updated);
      return { ...prev, collections: next };
    });
  }, []);

  const addFeedback = useCallback(
    (resourceId: string, author: string, stars: number, comment: string, kind: FeedbackKind) => {
      const feedback: Feedback = {
        id: `${resourceId}-fb-${Date.now()}`,
        resourceId,
        author,
        stars,
        comment,
        kind,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, feedback: [feedback, ...prev.feedback] }));
      void insertCloudFeedback(feedback);
    },
    [],
  );

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    void markCloudNotificationRead(id, true);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => {
      prev.notifications.forEach((n) => void markCloudNotificationRead(n.id, true));
      return { ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) };
    });
  }, []);

  const toggleUserActive = useCallback((id: string) => {
    setState((prev) => {
      const next = prev.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
      const updated = next.find((u) => u.id === id);
      if (updated) void upsertCloudUser(updated);
      return { ...prev, users: next };
    });
  }, []);

  const value = useMemo<LrmsValue>(
    () => ({
      ...state,
      downloadEvents,
      cloudReady,
      cloudSyncing,
      login,
      continueAsViewer,
      logout,
      addResources,
      updateResource,
      deleteResource,
      setResourceStatus,
      addVersion,
      registerDownload,
      registerView,
      toggleBookmark,
      createCollection,
      deleteCollection,
      toggleInCollection,
      addFeedback,
      markNotificationRead,
      markAllNotificationsRead,
      toggleUserActive,
    }),
    [
      state,
      downloadEvents,
      cloudReady,
      cloudSyncing,
      login,
      continueAsViewer,
      logout,
      addResources,
      updateResource,
      deleteResource,
      setResourceStatus,
      addVersion,
      registerDownload,
      registerView,
      toggleBookmark,
      createCollection,
      deleteCollection,
      toggleInCollection,
      addFeedback,
      markNotificationRead,
      markAllNotificationsRead,
      toggleUserActive,
    ],
  );

  return <LrmsContext.Provider value={value}>{children}</LrmsContext.Provider>;
}

export function useLrms(): LrmsValue {
  const ctx = useContext(LrmsContext);
  if (!ctx) throw new Error("useLrms must be used inside <LrmsProvider>");
  return ctx;
}

/** Average rating and review count for a resource. */
export function useRating(resourceId: string): { average: number; count: number } {
  const { feedback } = useLrms();
  return useMemo(() => {
    const rows = feedback.filter((f) => f.resourceId === resourceId && f.stars > 0);
    if (rows.length === 0) return { average: 0, count: 0 };
    return { average: rows.reduce((sum, r) => sum + r.stars, 0) / rows.length, count: rows.length };
  }, [feedback, resourceId]);
}

/** Rating lookup for every resource, used by lists and analytics. */
export function useRatingIndex(): Record<string, { average: number; count: number }> {
  const { feedback } = useLrms();
  return useMemo(() => {
    const index: Record<string, { sum: number; count: number }> = {};
    feedback.forEach((f) => {
      if (f.stars <= 0) return;
      const entry = index[f.resourceId] ?? { sum: 0, count: 0 };
      entry.sum += f.stars;
      entry.count += 1;
      index[f.resourceId] = entry;
    });
    const out: Record<string, { average: number; count: number }> = {};
    Object.entries(index).forEach(([id, entry]) => {
      out[id] = { average: entry.sum / entry.count, count: entry.count };
    });
    return out;
  }, [feedback]);
}
