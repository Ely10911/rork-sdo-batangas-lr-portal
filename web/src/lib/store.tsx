import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { Database } from "@/integrations/supabase/types";

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
  fetchCloudVisitorCount,
  getOrCreateVisitorId,
  resetVisitorId,
  setVisitorId,
  heartbeatVisitor,
  incrementCloudDownloads,
  incrementCloudViews,
  insertCloudDownloadEvent,
  insertCloudFeedback,
  isSupabaseConfigured,
  markCloudNotificationRead,
  removeResourceFolder,
  rowToCollection,
  rowToDownloadEvent,
  rowToFeedback,
  rowToNotification,
  rowToPortalUser,
  rowToResource,
  seedCloudIfEmpty,
  subscribeToCloudChanges,
  subscribeToPresence,
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

const SESSION_KEY = "sdo-batangas-lrms:session";
const KNOWN_ACCOUNTS_KEY = "sdo-batangas-lrms:viewer-accounts";

/** Merge cloud user rows with local-only accounts (e.g. registrations whose
 *  cloud write was interrupted) so neither source can evict the other. */
function mergeUsers(cloudRows: PortalUser[], local: PortalUser[]): PortalUser[] {
  const ids = new Set(cloudRows.map((u) => u.id));
  return [...cloudRows, ...local.filter((u) => !ids.has(u.id))];
}

/** Persistent directory of viewer accounts registered on this device, so
 *  sign-in keeps working across reloads even if a cloud write never landed. */
function loadKnownAccounts(): PortalUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KNOWN_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as PortalUser[]) : [];
  } catch {
    return [];
  }
}

function rememberAccount(user: PortalUser): void {
  if (typeof window === "undefined") return;
  try {
    const known = loadKnownAccounts().filter((u) => u.email?.toLowerCase() !== user.email?.toLowerCase());
    window.localStorage.setItem(KNOWN_ACCOUNTS_KEY, JSON.stringify([user, ...known].slice(0, 50)));
  } catch {
    // Storage unavailable — sign-in will rely on the cloud instead.
  }
}

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
  /** Number of users currently online (real-time Presence). */
  activeUsers: number;
  /** Total unique visitors ever recorded. */
  totalVisitors: number;
  login: (username: string, password: string) => boolean;
  continueAsViewer: () => void;
  /** Self-service viewer registration. Returns an error message on failure. */
  registerViewer: (input: { name: string; email: string; subOffice: string; school: string }) => Promise<{ ok: boolean; error?: string }>;
  /** Sign in as a registered viewer using the email they registered with. */
  loginViewer: (email: string) => Promise<{ ok: boolean; error?: string }>;
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

function emptyState(): PersistedShape {
  return {
    resources: [],
    feedback: [],
    bookmarks: [],
    collections: [],
    notifications: [],
    users: [],
    session: null,
    history: [],
    extraDownloads: [],
  };
}

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn("LRMS: session could not be persisted.", error);
  }
}

export function LrmsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedShape>(() => ({ ...emptyState(), session: loadSession() }));
  const [cloudReady, setCloudReady] = useState<boolean>(false);
  const [cloudSyncing, setCloudSyncing] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);
  const mounted = useRef<boolean>(false);

  // Hydrate from the cloud on mount. The cloud is the single source of truth.
  // Local state is only an in-memory cache that realtime updates keep in sync.
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    if (!isSupabaseConfigured) {
      const resources = buildResources();
      setState((prev) => ({
        ...prev,
        resources,
        feedback: buildFeedback(resources),
        notifications: buildNotifications(resources),
        users: buildUsers(),
      }));
      setCloudReady(true);
      return;
    }

    let cancelled = false;
    setCloudSyncing(true);
    (async () => {
      const seeded = buildResources();
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
        resources,
        feedback,
        bookmarks,
        collections,
        notifications,
        users: mergeUsers(users, prev.users),
        extraDownloads,
      }));
      setCloudSyncing(false);
      setCloudReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to realtime changes so every browser/device stays in sync.
  useEffect(() => {
    if (!isSupabaseConfigured || !cloudReady) return;

    const refreshFor = (table: string) => {
      switch (table) {
        case "resources":
          void fetchCloudResources().then((rows) => setState((prev) => ({ ...prev, resources: rows })));
          break;
        case "feedback":
          void fetchCloudFeedback().then((rows) => setState((prev) => ({ ...prev, feedback: rows })));
          break;
        case "download_events":
          void fetchCloudDownloadEvents().then((rows) => setState((prev) => ({ ...prev, extraDownloads: rows })));
          break;
        case "collections":
          void fetchCloudCollections().then((rows) => setState((prev) => ({ ...prev, collections: rows })));
          break;
        case "bookmarks":
          void fetchCloudBookmarks().then((rows) => setState((prev) => ({ ...prev, bookmarks: rows })));
          break;
        case "notifications":
          void fetchCloudNotifications().then((rows) => setState((prev) => ({ ...prev, notifications: rows })));
          break;
        case "portal_users":
          void fetchCloudUsers().then((rows) => setState((prev) => ({ ...prev, users: mergeUsers(rows, prev.users) })));
          break;
      }
    };

    const unsubscribe = subscribeToCloudChanges((payload) => {
      // Apply the individual realtime payload optimistically when possible.
      if (payload.table === "resources" && payload.event !== "DELETE" && payload.new) {
        const resource = rowToResource(payload.new as unknown as Database["public"]["Tables"]["resources"]["Row"]);
        setState((prev) => {
          const exists = prev.resources.some((r) => r.id === resource.id);
          if (payload.event === "INSERT" || !exists) return { ...prev, resources: [resource, ...prev.resources] };
          return { ...prev, resources: prev.resources.map((r) => (r.id === resource.id ? resource : r)) };
        });
      } else if (payload.table === "resources" && payload.event === "DELETE") {
        const id = (payload.old as { id?: string })?.id;
        if (id) setState((prev) => ({ ...prev, resources: prev.resources.filter((r) => r.id !== id) }));
      } else if (payload.table === "feedback" && payload.event !== "DELETE" && payload.new) {
        const feedback = rowToFeedback(payload.new as unknown as Database["public"]["Tables"]["feedback"]["Row"]);
        setState((prev) => {
          const exists = prev.feedback.some((f) => f.id === feedback.id);
          if (exists) return { ...prev, feedback: prev.feedback.map((f) => (f.id === feedback.id ? feedback : f)) };
          return { ...prev, feedback: [feedback, ...prev.feedback] };
        });
      } else if (payload.table === "download_events" && payload.event === "INSERT" && payload.new) {
        const event = rowToDownloadEvent(payload.new as unknown as Database["public"]["Tables"]["download_events"]["Row"]);
        setState((prev) => ({ ...prev, extraDownloads: [event, ...prev.extraDownloads] }));
      } else if (payload.table === "collections" && payload.event !== "DELETE" && payload.new) {
        const collection = rowToCollection(payload.new as unknown as Database["public"]["Tables"]["collections"]["Row"]);
        setState((prev) => {
          const exists = prev.collections.some((c) => c.id === collection.id);
          if (exists) return { ...prev, collections: prev.collections.map((c) => (c.id === collection.id ? collection : c)) };
          return { ...prev, collections: [collection, ...prev.collections] };
        });
      } else if (payload.table === "collections" && payload.event === "DELETE") {
        const id = (payload.old as { id?: string })?.id;
        if (id) setState((prev) => ({ ...prev, collections: prev.collections.filter((c) => c.id !== id) }));
      } else if (payload.table === "bookmarks") {
        void fetchCloudBookmarks().then((rows) => setState((prev) => ({ ...prev, bookmarks: rows })));
      } else if (payload.table === "notifications" && payload.event !== "DELETE" && payload.new) {
        const notification = rowToNotification(payload.new as unknown as Database["public"]["Tables"]["notifications"]["Row"]);
        setState((prev) => {
          const exists = prev.notifications.some((n) => n.id === notification.id);
          if (exists) return { ...prev, notifications: prev.notifications.map((n) => (n.id === notification.id ? notification : n)) };
          return { ...prev, notifications: [notification, ...prev.notifications] };
        });
      } else if (payload.table === "portal_users" && payload.event !== "DELETE" && payload.new) {
        const user = rowToPortalUser(payload.new as unknown as Database["public"]["Tables"]["portal_users"]["Row"]);
        setState((prev) => {
          const exists = prev.users.some((u) => u.id === user.id);
          if (exists) return { ...prev, users: prev.users.map((u) => (u.id === user.id ? user : u)) };
          return { ...prev, users: [user, ...prev.users] };
        });
      }
      // Full refresh after a short delay to guarantee consistency.
      window.setTimeout(() => refreshFor(payload.table), 500);
    });

    return () => {
      unsubscribe?.();
    };
  }, [cloudReady]);

  const downloadEvents = useMemo<DownloadEvent[]>(() => [...state.extraDownloads], [state.extraDownloads]);

  const registeredEmail = state.session?.registered ? state.session.email : null;

  // Visitor tracking: heartbeat + real-time presence for active user count.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const visitorId = getOrCreateVisitorId();

    // Registered viewers keep their profile details on the visitor row.
    const profile = (() => {
      const session = loadSession();
      return session?.registered && session.email
        ? { name: session.name, email: session.email, school: session.school ?? "", subOffice: session.subOffice ?? "" }
        : undefined;
    })();

    // Register/heartbeat this visitor immediately.
    void heartbeatVisitor(visitorId, profile);
    void fetchCloudVisitorCount().then(setTotalVisitors);

    // Re-heartbeat every 60 seconds so last_active stays fresh.
    const heartbeatInterval = window.setInterval(() => {
      void heartbeatVisitor(visitorId, profile);
    }, 60_000);

    // Subscribe to real-time presence for active user count.
    const unsubscribePresence = subscribeToPresence(visitorId, (count) => {
      setActiveUsers(count);
    });

    // Refresh total visitor count periodically.
    const visitorCountInterval = window.setInterval(() => {
      void fetchCloudVisitorCount().then(setTotalVisitors);
    }, 30_000);

    // Also heartbeat on tab refocus.
    const handleFocus = () => void heartbeatVisitor(visitorId, profile);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(heartbeatInterval);
      window.clearInterval(visitorCountInterval);
      window.removeEventListener("focus", handleFocus);
      unsubscribePresence?.();
    };
    // Re-attach presence/heartbeats when the signed-in account changes (viewer
    // login adopts the account's visitor ID, sign-out returns to anonymous).
  }, [registeredEmail]);

  const login = useCallback((username: string, password: string): boolean => {
    const ok = username.trim() === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
    if (ok) {
      const session: Session = { role: "admin", name: "Division LRMS Administrator", username: ADMIN_CREDENTIALS.username };
      saveSession(session);
      setState((prev) => ({ ...prev, session }));
    }
    return ok;
  }, []);

  const continueAsViewer = useCallback(() => {
    const session: Session = { role: "viewer", name: "Public Viewer", username: "public" };
    saveSession(session);
    setState((prev) => ({ ...prev, session }));
  }, []);

  /** Self-service registration: creates/claims the visitor's portal_users row. */
  const registerViewer = useCallback(
    async (input: { name: string; email: string; subOffice: string; school: string }) => {
      const email = input.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Please enter a valid email address." };

      // Email uniqueness across every registered account (fresh read from the cloud).
      const allUsers = isSupabaseConfigured ? await fetchCloudUsers() : [];
      const duplicate = (allUsers.length > 0 ? allUsers : state.users).find(
        (u) => u.email && u.email.toLowerCase() === email && u.id !== getOrCreateVisitorId(),
      );
      if (duplicate) {
        return { ok: false, error: "This email address is already registered on the portal." };
      }

      const visitorId = getOrCreateVisitorId();
      const now = new Date().toISOString();
      const user: PortalUser = {
        id: visitorId,
        name: input.name.trim(),
        username: email,
        role: "visitor",
        email,
        school: input.school,
        subOffice: input.subOffice,
        lastActive: now,
        active: true,
      };
      void upsertCloudUser(user);
      rememberAccount(user);

      const session: Session = {
        role: "viewer",
        name: user.name,
        username: email,
        email,
        school: user.school,
        subOffice: user.subOffice,
        userId: visitorId,
        registered: true,
      };
      saveSession(session);
      setState((prev) => ({
        ...prev,
        session,
        users: [user, ...prev.users.filter((u) => u.id !== visitorId)],
      }));
      return { ok: true };
    },
    [state.users],
  );

  /** Sign in on this device with a previously registered viewer account. */
  const loginViewer = useCallback(
    async (rawEmail: string) => {
      const email = rawEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Please enter a valid email address." };
      }

      // Look the account up in the cloud, then the in-memory cache, then the
      // persistent directory of accounts registered on this device.
      const cloudUsers = isSupabaseConfigured ? await fetchCloudUsers() : [];
      const account = [...cloudUsers, ...state.users, ...loadKnownAccounts()].find(
        (u) => u.role === "visitor" && u.email && u.email.toLowerCase() === email,
      );
      if (!account) {
        return { ok: false, error: "No registered viewer account was found with this email address. Please register first." };
      }
      if (!account.active) {
        return { ok: false, error: "This account has been deactivated by the administrator." };
      }

      // Adopt the account identity on this device so presence, heartbeats and
      // analytics stay attached to the same portal_users row.
      setVisitorId(account.id);

      const session: Session = {
        role: "viewer",
        name: account.name,
        username: email,
        email,
        school: account.school,
        subOffice: account.subOffice,
        userId: account.id,
        registered: true,
      };
      saveSession(session);
      setState((prev) => ({
        ...prev,
        session,
        users: [account, ...prev.users.filter((u) => u.id !== account.id)],
      }));
      void heartbeatVisitor(account.id, {
        name: account.name,
        email,
        school: account.school ?? "",
        subOffice: account.subOffice ?? "",
      });
      return { ok: true };
    },
    [state.users],
  );

  const logout = useCallback(() => {
    saveSession(null);
    // Sign-out returns this device to anonymous tracking so the signed-out
    // account's portal_users row keeps its registered profile.
    resetVisitorId();
    setState((prev) => ({ ...prev, session: null }));
  }, []);

  const addResources = useCallback((records: LearningResource[]) => {
    records.forEach((record) => void upsertCloudResource(record));
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
    void deleteCloudResource(id);
    void removeResourceFolder(id);
    setState((prev) => ({
      ...prev,
      resources: prev.resources.filter((r) => r.id !== id),
      bookmarks: prev.bookmarks.filter((b) => b !== id),
      collections: prev.collections.map((c) => ({ ...c, resourceIds: c.resourceIds.filter((r) => r !== id) })),
    }));
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
        subOffices: target.subOffices,
        schools: target.schools,
      };
      void incrementCloudDownloads(id);
      void insertCloudDownloadEvent(event);
      return {
        ...prev,
        resources: prev.resources.map((r) => (r.id === id ? { ...r, downloads: r.downloads + 1 } : r)),
        history: [{ resourceId: id, at }, ...prev.history.filter((h) => h.resourceId !== id)].slice(0, 40),
        extraDownloads: [event, ...prev.extraDownloads],
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
      activeUsers,
      totalVisitors,
      login,
      continueAsViewer,
      registerViewer,
      loginViewer,
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
      activeUsers,
      totalVisitors,
      login,
      continueAsViewer,
      registerViewer,
      loginViewer,
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
