import { ReactNode, useEffect, useSyncExternalStore } from "react";

export type Language = { code: string; name: string };

export type Node = {
  id: string;
  parent_id: string | null;
  type: string;
  title: string;
  path: string | null;
  is_published: boolean;
  sort_order: number;
};

export type Hadeeth = {
  id: string;
  node_id: string;
  referenceNumber: number;
  reportedBy: string;
  arabic: string;
  tamil: string;
  english: string;
  grade?: string;
  notes?: string;
  isPublished: boolean;
};

type DB = {
  nodes: Node[];
  hadeeth: Hadeeth[];
  languages: Language[];
  isLoading: boolean;
  error: string | null;
};

type RawLanguage = {
  code: string;
  name?: string;
};

type RawNode = {
  id: string;
  parent_id?: string | null;
  type?: string;
  title?: string;
  path?: string | null;
  is_published?: boolean;
  isPublished?: boolean;
  sort_order?: number;
};

type RawHadeeth = {
  id: string;
  node_id?: string;
  chapter_id?: string;
  arabic?: string;
  tamil?: string;
  english?: string;
  grade?: string;
  referenceNumber?: string | number;
  reference_number?: string | number;
  refernce_number?: string | number;
  reportedBy?: string;
  reported_by?: string;
  isPublished?: boolean;
  is_published?: boolean;
};

type RawCache = {
  languages: RawLanguage[];
  nodes: RawNode[];
  hadeeth: RawHadeeth[];
};

const initialState: DB = {
  nodes: [],
  hadeeth: [],
  languages: [],
  isLoading: true,
  error: null,
};

let state: DB = initialState;
let rawCache: RawCache = {
  languages: [],
  nodes: [],
  hadeeth: [],
};
let loadPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(updater: (current: DB) => DB) {
  state = updater(state);
  emit();
}

function getSnapshot() {
  return state;
}

function normalize(raw: RawCache): DB {
  const nodeHadithCounts = new Map<string, number>();

  for (const item of raw.hadeeth) {
    const nid = item.node_id || item.chapter_id || "";
    nodeHadithCounts.set(nid, (nodeHadithCounts.get(nid) || 0) + 1);
  }

  const nodes = raw.nodes.map((node) => ({
    id: node.id,
    parent_id: node.parent_id ?? null,
    type: node.type || "node",
    title: node.title || "Untitled",
    path: node.path || null,
    is_published: node.is_published ?? node.isPublished ?? true,
    sort_order: node.sort_order ?? 0,
  }));

  const hadeeth = raw.hadeeth.map((item) => ({
    id: item.id,
    node_id: item.node_id || item.chapter_id || "",
    referenceNumber: Number(
      item.reference_number ?? item.referenceNumber ?? item.refernce_number ?? 0
    ),
    reportedBy: String(item.reported_by || item.reportedBy || ""),
    arabic: String(item.arabic || ""),
    tamil: String(item.tamil || ""),
    english: String(item.english || ""),
    grade: String(item.grade || ""),
    notes: "",
    isPublished: Boolean(item.is_published ?? item.isPublished ?? true),
  }));

  const languages = raw.languages.map((language) => ({
    code: language.code,
    name: language.name || language.code,
  }));

  return {
    nodes,
    hadeeth,
    languages,
    isLoading: false,
    error: null,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const API = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const url = `${API}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(message || `Network error when fetching ${url}`);
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function loadAll() {
  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  const nodesPath = isAdmin ? "/api/admin/nodes" : "/api/public/nodes";
  const hadeethPath = isAdmin ? "/api/admin/hadeeth" : "/api/public/hadeeth";

  const [languages, nodes, hadeeth] = await Promise.all([
    apiFetch<RawLanguage[]>("/api/languages"),
    apiFetch<RawNode[]>(nodesPath),
    apiFetch<RawHadeeth[]>(hadeethPath),
  ]);

  rawCache = { languages, nodes, hadeeth };
  setState(() => normalize(rawCache));
}

function initializeDB() {
  if (!loadPromise) {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    loadPromise = loadAll()
      .catch((error: Error) => {
        setState((current) => ({
          ...current,
          isLoading: false,
          error: error.message || "Unable to load data from the backend.",
        }));
      })
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
}

export function DBProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void initializeDB();
  }, []);

  return children;
}

export function useDB(): DB {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getChildren(nodes: Node[], parentId: string | null): Node[] {
  return nodes
    .filter((n) => n.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
}

export function getAncestors(nodes: Node[], id: string): Node[] {
  const result: Node[] = [];
  let current = nodes.find((n) => n.id === id);
  while (current?.parent_id) {
    const parent = nodes.find((n) => n.id === current!.parent_id);
    if (parent) {
      result.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }
  return result;
}

export function getHadithByNode(hadeeth: Hadeeth[], nodeId: string): Hadeeth[] {
  return hadeeth
    .filter((h) => h.node_id === nodeId)
    .sort((a, b) => a.referenceNumber - b.referenceNumber);
}

export function getDescendantNodeIds(nodes: Node[], parentId: string): string[] {
  const ids: string[] = [parentId];
  const children = nodes.filter((n) => n.parent_id === parentId);
  for (const child of children) {
    ids.push(...getDescendantNodeIds(nodes, child.id));
  }
  return ids;
}

export const db = {
  getAll: () => state,
  getNode: (id: string) => state.nodes.find((n) => n.id === id),
  getRootNodes: () => getChildren(state.nodes, null),
  getChildren: (parentId: string) => getChildren(state.nodes, parentId),
  getAncestors: (id: string) => getAncestors(state.nodes, id),
  getHadeethByNode: (nodeId: string) => getHadithByNode(state.hadeeth, nodeId),
  getHadeethById: (id: string) => state.hadeeth.find((h) => h.id === id),
  getDescendantNodeIds: (parentId: string) => getDescendantNodeIds(state.nodes, parentId),
  refresh: () => initializeDB(),
  upsertNode: async (node: { id?: string; parent_id?: string | null; type?: string; title: string; is_published?: boolean }) => {
    const payload = {
      parent_id: node.parent_id ?? null,
      type: node.type || "node",
      title: node.title,
      is_published: node.is_published ?? true,
    };

    if (node.id && rawCache.nodes.some((n) => n.id === node.id)) {
      await apiFetch(`/api/admin/nodes/${node.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/admin/nodes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await loadAll();
  },
  deleteNode: async (id: string) => {
    await apiFetch(`/api/admin/nodes/${id}`, { method: "DELETE" });
    await loadAll();
  },
  upsertHadeeth: async (item: {
    id?: string;
    node_id: string;
    referenceNumber?: number;
    arabic?: string;
    tamil?: string;
    english?: string;
    reportedBy?: string;
    grade?: string;
    isPublished?: boolean;
  }) => {
    const payload = {
      node_id: item.node_id,
      reference_number: item.referenceNumber || 0,
      arabic: item.arabic || "",
      tamil: item.tamil || "",
      english: item.english || "",
      reported_by: item.reportedBy || "",
      grade: item.grade || "",
      is_published: item.isPublished ?? true,
    };

    if (item.id && rawCache.hadeeth.some((h) => h.id === item.id)) {
      await apiFetch(`/api/admin/hadeeth/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/admin/hadeeth", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await loadAll();
  },
  deleteHadeeth: async (id: string) => {
    await apiFetch(`/api/admin/hadeeth/${id}`, { method: "DELETE" });
    await loadAll();
  },
  upsertLanguage: async (language: Language) => {
    const payload = {
      code: language.code.trim().toLowerCase(),
      name: language.name.trim(),
      nativeName: language.name.trim(),
      direction: "ltr",
    };
    const existing = rawCache.languages.find((l) => l.code === payload.code);

    if (existing) {
      await apiFetch(`/api/admin/languages/${payload.code}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/admin/languages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await loadAll();
  },
  deleteLanguage: async (code: string) => {
    await apiFetch(`/api/admin/languages/${code}`, { method: "DELETE" });
    await loadAll();
  },
};
