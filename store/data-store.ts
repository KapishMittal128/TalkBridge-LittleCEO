import { create } from 'zustand';
import { dataStorage } from '@/lib/data-storage';
import { getActiveUsername, getAuthSnapshot } from '@/contexts/AuthContext';
import { deleteTrainingCard, fetchTrainedCards, resetTrainingCard } from '@/lib/recognition';
import { STARTER_CATEGORIES, STARTER_SOUND_CARDS } from '@/constants/categories';

const DATA_KEY_PREFIX = 'talkbridge_data_';

export interface Category {
  id: string;
  profile_id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SoundCard {
  id: string;
  profile_id: string;
  category_id: string;
  label: string;
  normalized_label: string;
  phrase_output: string;
  icon_name: string | null;
  is_favorite: boolean;
  is_emergency: boolean;
  is_active: boolean;
  training_status: 'draft' | 'ready' | 'needs_more_samples';
  sample_count: number;
  enrollment_quality?: 'poor' | 'fair' | 'good';
  distinctiveness_status?: 'good' | 'close' | 'poor';
  consistency_score?: number;
  recommended_action?: string | null;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InteractionLog {
  id: string;
  profile_id: string;
  phrase_output: string;
  confidence: number;
  sound_card_id: string | null;
  created_at: string;
}

interface PersistedPayload {
  v: 1;
  categories: Category[];
  soundCards: SoundCard[];
  history: InteractionLog[];
}

interface RemoteCard {
  sound_card_id?: string;
  label?: string;
  phrase_output?: string;
  sample_count?: number;
  enrollment_quality?: 'poor' | 'fair' | 'good';
  distinctiveness_status?: 'good' | 'close' | 'poor';
  consistency_score?: number;
  recommended_action?: string | null;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, '-');
}

function categoriesKey(username: string) {
  return `${DATA_KEY_PREFIX}${username}_categories`;
}

function cardsKey(username: string) {
  return `${DATA_KEY_PREFIX}${username}_cards`;
}

function historyKey(username: string) {
  return `${DATA_KEY_PREFIX}${username}_history`;
}

async function getStorageIdentity() {
  const username = (await getActiveUsername()) ?? getAuthSnapshot().user ?? 'guest';
  const profileId = getAuthSnapshot().profile?.id ?? `profile-${username}`;
  return { username, profileId };
}

function blankPayload(): PersistedPayload {
  return {
    v: 1,
    categories: [],
    soundCards: [],
    history: [],
  };
}

function buildStarterPayload(profileId: string): PersistedPayload {
  const createdAt = nowIso();
  const categories: Category[] = STARTER_CATEGORIES.map((category) => ({
    id: category.id,
    profile_id: profileId,
    name: category.name,
    slug: category.slug,
    icon_name: category.icon_name,
    sort_order: category.sort_order,
    is_default: true,
    created_at: createdAt,
    updated_at: createdAt,
  }));

  const categoryIdBySlug = new Map(categories.map((category) => [category.slug, category.id]));
  const soundCards: SoundCard[] = STARTER_SOUND_CARDS.map((card) => ({
    id: card.id,
    profile_id: profileId,
    category_id: categoryIdBySlug.get(card.categorySlug) ?? categories[0]?.id ?? '',
    label: card.label,
    normalized_label: normalizeLabel(card.label),
    phrase_output: card.phrase_output,
    icon_name: card.icon_name,
    is_favorite: card.is_favorite,
    is_emergency: card.is_emergency,
    is_active: true,
    training_status: 'draft',
    sample_count: 0,
    enrollment_quality: undefined,
    distinctiveness_status: undefined,
    consistency_score: undefined,
    recommended_action: null,
    usage_count: 0,
    last_used_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  }));

  return {
    v: 1,
    categories,
    soundCards,
    history: [],
  };
}

function parseList<T>(raw: string | null): T[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function getTrainingStatus(sampleCount: number): SoundCard['training_status'] {
  if (sampleCount >= 3) {
    return 'ready';
  }
  if (sampleCount > 0) {
    return 'needs_more_samples';
  }
  return 'draft';
}

async function loadPayload(username: string): Promise<PersistedPayload> {
  const [categoriesRaw, cardsRaw, historyRaw] = await Promise.all([
    dataStorage.getItem(categoriesKey(username)),
    dataStorage.getItem(cardsKey(username)),
    dataStorage.getItem(historyKey(username)),
  ]);

  const categories = parseList<Category>(categoriesRaw);
  const soundCards = parseList<SoundCard>(cardsRaw);
  const history = parseList<InteractionLog>(historyRaw);

  if (!categories && !soundCards && !history) {
    return blankPayload();
  }

  return {
    v: 1,
    categories: categories ?? [],
    soundCards: soundCards ?? [],
    history: history ?? [],
  };
}

async function savePayload(username: string, payload: PersistedPayload) {
  await Promise.all([
    dataStorage.setItem(categoriesKey(username), JSON.stringify(payload.categories)),
    dataStorage.setItem(cardsKey(username), JSON.stringify(payload.soundCards)),
    dataStorage.setItem(historyKey(username), JSON.stringify(payload.history)),
  ]);
}

function syncRemoteCards(
  payload: PersistedPayload,
  remoteCards: RemoteCard[],
  profileId: string,
): PersistedPayload {
  const byId = new Map<string, RemoteCard>();
  const byLabel = new Map<string, RemoteCard>();

  for (const remoteCard of remoteCards) {
    if (remoteCard.sound_card_id) {
      byId.set(remoteCard.sound_card_id, remoteCard);
    }
    if (remoteCard.label) {
      byLabel.set(normalizeLabel(remoteCard.label), remoteCard);
    }
  }

  const soundCards: SoundCard[] = payload.soundCards.map((card) => {
    const remoteMatch =
      byId.get(card.id) ??
      byLabel.get(normalizeLabel(card.label));

    if (!remoteMatch) {
      if (card.sample_count > 0) {
        return {
          ...card,
          sample_count: 0,
          training_status: 'draft' as const,
          enrollment_quality: undefined,
          distinctiveness_status: undefined,
          consistency_score: undefined,
          recommended_action: null,
          updated_at: nowIso(),
        };
      }

      return card;
    }

    if (remoteMatch.sound_card_id) {
      byId.delete(remoteMatch.sound_card_id);
    }
    if (remoteMatch.label) {
      byLabel.delete(normalizeLabel(remoteMatch.label));
    }

    const sampleCount = Number(remoteMatch.sample_count ?? 0);
    return {
      ...card,
      sample_count: Number.isFinite(sampleCount) ? sampleCount : 0,
      training_status: getTrainingStatus(Number.isFinite(sampleCount) ? sampleCount : 0),
      enrollment_quality: remoteMatch.enrollment_quality,
      distinctiveness_status: remoteMatch.distinctiveness_status,
      consistency_score:
        Number.isFinite(Number(remoteMatch.consistency_score)) ? Number(remoteMatch.consistency_score) : undefined,
      recommended_action: remoteMatch.recommended_action ?? null,
      updated_at: nowIso(),
    };
  });

  const appendedCards = [...soundCards];
  const t = nowIso();

  for (const remoteCard of byId.values()) {
    const label = (remoteCard.label ?? '').trim();
    const sampleCount = Number(remoteCard.sample_count ?? 0);

    if (!remoteCard.sound_card_id || !label) {
      continue;
    }

    appendedCards.push({
      id: remoteCard.sound_card_id,
      profile_id: profileId,
      category_id: '',
      label,
      normalized_label: normalizeLabel(label),
      phrase_output: (remoteCard.phrase_output ?? label).trim(),
      icon_name: null,
      is_favorite: false,
      is_emergency: false,
      is_active: true,
      training_status: getTrainingStatus(Number.isFinite(sampleCount) ? sampleCount : 0),
      sample_count: Number.isFinite(sampleCount) ? sampleCount : 0,
      enrollment_quality: remoteCard.enrollment_quality,
      distinctiveness_status: remoteCard.distinctiveness_status,
      consistency_score:
        Number.isFinite(Number(remoteCard.consistency_score)) ? Number(remoteCard.consistency_score) : undefined,
      recommended_action: remoteCard.recommended_action ?? null,
      usage_count: 0,
      last_used_at: null,
      created_at: t,
      updated_at: t,
    });
  }

  return {
    v: 1,
    categories: payload.categories,
    soundCards: appendedCards,
    history: payload.history,
  };
}

interface DataState {
  dataHydrated: boolean;
  activeUsername: string | null;
  categories: Category[];
  soundCards: SoundCard[];
  history: InteractionLog[];
  isLoading: boolean;
  isSynced: boolean;
  error: string | null;
}

interface DataActions {
  initializeData: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchCardsByCategory: (categoryId: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  createCategory: (category: Partial<Category>) => Promise<Category>;
  createCard: (card: Partial<SoundCard>) => Promise<void>;
  toggleFavorite: (cardId: string, isFavorite: boolean) => Promise<void>;
  resetCardTraining: (cardId: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  updateCardTrainingStatus: (
    cardId: string,
    status: 'ready' | 'draft' | 'needs_more_samples',
    sampleCount: number,
    calibration?: {
      enrollment_quality?: 'poor' | 'fair' | 'good';
      distinctiveness_status?: 'good' | 'close' | 'poor';
      consistency_score?: number;
      recommended_action?: string | null;
    },
  ) => Promise<void>;
  recordRecognition: (entry: {
    phrase_output: string;
    confidence: number;
    sound_card_id: string | null;
  }) => Promise<void>;
  incrementCardUsage: (cardId: string) => Promise<void>;
  clearData: () => Promise<void>;
}

export const useDataStore = create<DataState & DataActions>((set, get) => ({
  dataHydrated: false,
  activeUsername: null,
  categories: [],
  soundCards: [],
  history: [],
  isLoading: false,
  isSynced: false,
  error: null,

  initializeData: async () => {
    const { username, profileId } = await getStorageIdentity();
    if (get().dataHydrated && get().activeUsername === username && get().isSynced) {
      return;
    }

    set({ isLoading: true, isSynced: false, error: null });

    try {
      let payload = await loadPayload(username);
      if (payload.categories.length === 0 && payload.soundCards.length === 0) {
        payload = buildStarterPayload(profileId);
      }

      try {
        const remoteCards = await fetchTrainedCards(username);
        payload = syncRemoteCards(payload, remoteCards, profileId);
      } catch {
        /* fall back silently to local state */
      }

      await savePayload(username, payload);

      set({
        activeUsername: username,
        categories: payload.categories,
        soundCards: payload.soundCards,
        history: payload.history,
        dataHydrated: true,
        isLoading: false,
        isSynced: true,
      });
    } catch (e) {
      set({
        activeUsername: username,
        error: e instanceof Error ? e.message : 'Failed to load data',
        isLoading: false,
        dataHydrated: true,
        isSynced: true,
      });
    }
  },

  fetchCategories: async () => {
    await get().initializeData();
  },

  fetchCardsByCategory: async () => {
    set({ isLoading: true });
    await get().initializeData();
    set({ isLoading: false });
  },

  fetchHistory: async () => {
    await get().initializeData();
  },

  clearHistory: async () => {
    await get().initializeData();
    const username = get().activeUsername ?? (await getStorageIdentity()).username;
    const { categories, soundCards } = get();
    set({ history: [] });
    await savePayload(username, {
      v: 1,
      categories,
      soundCards,
      history: [],
    });
  },

  createCategory: async (category) => {
    await get().initializeData();
    const { username, profileId } = await getStorageIdentity();
    const t = nowIso();
    const trimmedName = (category.name ?? '').trim();
    if (!trimmedName) {
      throw new Error('Please enter a category name before saving.');
    }

    const categories = get().categories;
    const nextSlug = (category.slug ?? normalizeLabel(trimmedName) ?? `category-${Date.now()}`).slice(0, 64);
    if (categories.some((existing) => existing.slug === nextSlug || existing.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('A category with this name already exists.');
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      profile_id: profileId,
      name: trimmedName,
      slug: nextSlug,
      icon_name: category.icon_name ?? null,
      sort_order: category.sort_order ?? 10,
      is_default: false,
      created_at: t,
      updated_at: t,
      ...category,
    };
    const nextCategories = [...categories, newCategory];
    const soundCards = get().soundCards;
    const history = get().history;
    set({ categories: nextCategories, activeUsername: username });
    await savePayload(username, { v: 1, categories: nextCategories, soundCards, history });
    return newCategory;
  },

  createCard: async (card) => {
    await get().initializeData();
    const categories = get().categories;
    const categoryId = (card.category_id ?? '').trim();
    if (!categoryId || !categories.some((category) => category.id === categoryId)) {
      throw new Error('Please choose a valid category before saving the card.');
    }

    const { username, profileId } = await getStorageIdentity();
    const t = nowIso();
    const label = (card.label ?? '').trim();
    const phrase = (card.phrase_output ?? label).trim();
    if (!label) {
      throw new Error('Please enter a phrase before saving the card.');
    }

    const newCard: SoundCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      profile_id: profileId,
      category_id: categoryId,
      label,
      normalized_label: card.normalized_label ?? label.toLowerCase().replace(/\s+/g, '-'),
      phrase_output: phrase,
      icon_name: card.icon_name ?? null,
      is_favorite: card.is_favorite ?? false,
      is_emergency: card.is_emergency ?? false,
      is_active: true,
      training_status: 'draft',
      sample_count: 0,
      usage_count: 0,
      last_used_at: null,
      created_at: t,
      updated_at: t,
    };
    const soundCards = [...get().soundCards, newCard];
    const history = get().history;
    set({ soundCards, activeUsername: username });
    await savePayload(username, { v: 1, categories, soundCards, history });
  },

  toggleFavorite: async (cardId, isFavorite) => {
    await get().initializeData();
    const username = get().activeUsername ?? (await getStorageIdentity()).username;
    const categories = get().categories;
    const soundCards = get().soundCards.map((c) =>
      c.id === cardId ? { ...c, is_favorite: isFavorite, updated_at: nowIso() } : c,
    );
    const history = get().history;
    set({ soundCards, activeUsername: username });
    await savePayload(username, { v: 1, categories, soundCards, history });
  },

  resetCardTraining: async (cardId) => {
    await get().initializeData();
    const username = get().activeUsername ?? (await getStorageIdentity()).username;
    const categories = get().categories;
    const history = get().history;
    await resetTrainingCard(cardId);

    const soundCards = get().soundCards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            sample_count: 0,
            training_status: 'draft' as const,
            enrollment_quality: undefined,
            distinctiveness_status: undefined,
            consistency_score: undefined,
            recommended_action: null,
            updated_at: nowIso(),
          }
        : card,
    );

    set({ soundCards, activeUsername: username });
    await savePayload(username, { v: 1, categories, soundCards, history });
  },

  deleteCard: async (cardId) => {
    await get().initializeData();
    const username = get().activeUsername ?? (await getStorageIdentity()).username;
    const categories = get().categories;
    await deleteTrainingCard(cardId);

    const soundCards = get().soundCards.filter((card) => card.id !== cardId);
    const history = get().history.filter((entry) => entry.sound_card_id !== cardId);

    set({ soundCards, history, activeUsername: username });
    await savePayload(username, { v: 1, categories, soundCards, history });
  },

  deleteCategory: async (categoryId) => {
    await get().initializeData();
    const username = get().activeUsername ?? (await getStorageIdentity()).username;
    const cardsInCategory = get().soundCards.filter((card) => card.category_id === categoryId);
    if (cardsInCategory.length > 0) {
      throw new Error('Delete or move the phrases in this category first.');
    }

    const categories = get().categories.filter((category) => category.id !== categoryId);
    const soundCards = get().soundCards;
    const history = get().history;

    set({ categories, activeUsername: username });
    await savePayload(username, { v: 1, categories, soundCards, history });
  },

  updateCardTrainingStatus: async (cardId, status, sampleCount, calibration) => {
    await get().initializeData();
    const username = get().activeUsername ?? (await getStorageIdentity()).username;
    const categories = get().categories;
    const soundCards = get().soundCards.map((c) =>
      c.id === cardId
        ? {
            ...c,
            training_status: status,
            sample_count: sampleCount,
            enrollment_quality: calibration?.enrollment_quality ?? c.enrollment_quality,
            distinctiveness_status: calibration?.distinctiveness_status ?? c.distinctiveness_status,
            consistency_score:
              calibration?.consistency_score ?? c.consistency_score,
            recommended_action:
              calibration?.recommended_action ?? c.recommended_action ?? null,
            updated_at: nowIso(),
          }
        : c,
    );
    const history = get().history;
    set({ soundCards, activeUsername: username });
    await savePayload(username, { v: 1, categories, soundCards, history });
  },

  recordRecognition: async ({ phrase_output, confidence, sound_card_id }) => {
    await get().initializeData();
    const { username, profileId } = await getStorageIdentity();
    const categories = get().categories;
    const soundCards = get().soundCards;
    const entry: InteractionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      profile_id: profileId,
      phrase_output,
      confidence,
      sound_card_id,
      created_at: nowIso(),
    };
    const history = [entry, ...get().history].slice(0, 200);
    set({ history, activeUsername: username });
    await savePayload(username, { v: 1, categories, soundCards, history });
  },

  incrementCardUsage: async (cardId) => {
    await get().initializeData();
    const username = get().activeUsername ?? (await getStorageIdentity()).username;
    const categories = get().categories;
    const soundCards = get().soundCards.map((c) =>
      c.id === cardId
        ? {
            ...c,
            usage_count: c.usage_count + 1,
            last_used_at: nowIso(),
            updated_at: nowIso(),
          }
        : c,
    );
    const history = get().history;
    set({ soundCards, activeUsername: username });
    await savePayload(username, { v: 1, categories, soundCards, history });
  },

  clearData: async () => {
    set({
      dataHydrated: false,
      activeUsername: null,
      categories: [],
      soundCards: [],
      history: [],
      isLoading: false,
      isSynced: false,
      error: null,
    });
  },
}));
