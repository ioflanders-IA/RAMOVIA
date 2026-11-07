import { ExpenseRecord, Job } from '../types';

export const DEFAULT_CATEGORIES: { id: string; label: string }[] = [
  { id: 'carburante', label: 'Benzina / Carburante' },
  { id: 'sacchi', label: 'Sacchi Verde' },
  { id: 'smaltimento', label: 'Smaltimento Verde' },
  { id: 'materiale', label: 'Materiali & Concimi' },
  { id: 'attrezzatura', label: 'Nuova Attrezzatura' },
  { id: 'noleggio', label: 'Noleggio Mezzi' },
  { id: 'manutenzione', label: 'Manutenzione Macchinari' },
  { id: 'manodopera', label: 'Manodopera' },
  { id: 'stipendio', label: 'Stipendi / Compensi' },
  { id: 'generale', label: 'Spese Generali' },
  { id: 'altro', label: 'Altro Costo' },
];

export const CATEGORY_STORAGE_KEY = 'ramovia_custom_expense_categories';
export const RENAMED_CATEGORIES_KEY = 'ramovia_renamed_expense_categories';

export const getSavedCustomCategories = (): string[] => {
  try {
    const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveCustomCategories = (categories: string[]): void => {
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Errore nel salvataggio delle categorie personalizzate:', e);
  }
};

export const getRenamedCategoriesMap = (): Record<string, string> => {
  try {
    const saved = localStorage.getItem(RENAMED_CATEGORIES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const saveRenamedCategory = (oldKey: string, newLabel: string): void => {
  try {
    const current = getRenamedCategoriesMap();
    current[oldKey.trim().toLowerCase()] = newLabel.trim();
    // Also canonical key if applicable
    const canonical = getCanonicalCategoryKey(oldKey);
    if (canonical) {
      current[canonical.toLowerCase()] = newLabel.trim();
    }
    localStorage.setItem(RENAMED_CATEGORIES_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Errore nel salvataggio del rinomino categoria:', e);
  }
};

export const getCanonicalCategoryKey = (category: string): string => {
  if (!category) return '';
  const lower = category.trim().toLowerCase();
  switch (lower) {
    case 'benzina':
    case 'carburante':
    case 'benzina / carburante':
      return 'carburante';
    case 'sacchi':
    case 'sacchi verde':
      return 'sacchi';
    case 'smaltimento':
    case 'smaltimento verde':
      return 'smaltimento';
    case 'materiale':
    case 'materiali':
    case 'materiali & concimi':
      return 'materiale';
    case 'attrezzatura':
    case 'nuova attrezzatura':
      return 'attrezzatura';
    case 'noleggio':
    case 'noleggio mezzi':
      return 'noleggio';
    case 'manutenzione':
    case 'manutenzione macchinari':
      return 'manutenzione';
    case 'manodopera':
    case 'stipendio':
    case 'manodopera / stipendi':
    case 'stipendi / compensi':
      return 'manodopera';
    case 'generale':
    case 'spese generali':
      return 'generale';
    case 'altro':
    case 'altro costo':
      return 'altro';
    default:
      return lower;
  }
};

export const isSameCategory = (catA?: string, catB?: string): boolean => {
  if (!catA || !catB) return false;
  const aTrim = catA.trim().toLowerCase();
  const bTrim = catB.trim().toLowerCase();
  if (aTrim === bTrim) return true;

  const canonicalA = getCanonicalCategoryKey(aTrim);
  const canonicalB = getCanonicalCategoryKey(bTrim);
  return canonicalA === canonicalB;
};

export const getCombinedCategoryList = (
  expenses: ExpenseRecord[] = [],
  jobs: Job[] = []
): { id: string; label: string }[] => {
  const renamedMap = getRenamedCategoriesMap();

  const result: { id: string; label: string }[] = DEFAULT_CATEGORIES.map((dc) => {
    const canonical = dc.id.toLowerCase();
    const renamed = renamedMap[canonical] || renamedMap[dc.label.toLowerCase()];
    return {
      id: dc.id,
      label: renamed || dc.label,
    };
  });

  const knownLabels = new Set(result.map((c) => c.label.toLowerCase()));
  const knownIds = new Set(result.map((c) => c.id.toLowerCase()));

  const addIfNotExists = (rawCat?: string) => {
    if (!rawCat || !rawCat.trim()) return;
    const trimmed = rawCat.trim();
    const lower = trimmed.toLowerCase();
    const renamed = renamedMap[lower] || trimmed;
    const renamedLower = renamed.toLowerCase();

    if (!knownLabels.has(renamedLower) && !knownIds.has(renamedLower)) {
      knownLabels.add(renamedLower);
      result.push({ id: renamed, label: renamed });
    }
  };

  // 1. Saved custom categories in localStorage
  const saved = getSavedCustomCategories();
  saved.forEach(addIfNotExists);

  // 2. Categories from registered expenses
  expenses.forEach((e) => addIfNotExists(e.category));

  // 3. Categories from job costs
  jobs.forEach((j) => {
    (j.costs || []).forEach((c) => addIfNotExists(c.category));
  });

  return result;
};
