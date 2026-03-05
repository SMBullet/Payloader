/* Payloader — Favorites Manager (localStorage) */

const FAVORITES_KEY = 'payloader-favorites';

const FavoritesManager = {
  load() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
    catch { return []; }
  },

  save(list) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  },

  isFav(moduleKey, code) {
    return this.load().some(f => f.moduleKey === moduleKey && f.code === code);
  },

  toggle(entry) {
    // entry: { moduleKey, moduleName, icon, code, description, category }
    const list = this.load();
    const idx  = list.findIndex(f => f.moduleKey === entry.moduleKey && f.code === entry.code);
    if (idx >= 0) {
      list.splice(idx, 1);
      this.save(list);
      return false; // removed
    }
    list.unshift({ ...entry, added: Date.now() });
    this.save(list);
    return true; // added
  },

  count() { return this.load().length; },

  clear() { localStorage.removeItem(FAVORITES_KEY); }
};
