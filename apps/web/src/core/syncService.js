import { supabase } from './supabaseClient.js';
import { getState, setState } from '../store.js';

/**
 * syncService.js — Real-time Data Synchronization
 * Handles instant updates across devices using Supabase Realtime.
 */

class SyncService {
  constructor() {
    this.channels = new Map();
    this.isAuthenticated = false;
    this.currentUser = null;
    this.libraryStore = null;
  }

  /**
   * Initialize sync service with application stores
   * @param {Object} options 
   */
  async init({ libraryStore }) {
    this.libraryStore = libraryStore;
    
    // Initial sync of current user state
    this.currentUser = getState('currentUser');
    this.isAuthenticated = getState('isAuthenticated');

    if (this.isAuthenticated && this.currentUser?.id) {
      this.subscribe();
    }
  }

  /**
   * Subscribe to Supabase Realtime channels
   */
  subscribe() {
    const userId = this.currentUser?.id;
    if (!userId) return;

    console.log('[SyncService] 📡 Subscribing to real-time updates...');

    // 1. Library Sync Channel
    const libraryChannel = supabase
      .channel(`sync:library:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'followed_anime', filter: `user_id=eq.${userId}` },
        (payload) => this.handleLibraryChange(payload)
      )
      .subscribe();

    // 2. Profile Sync Channel
    const profileChannel = supabase
      .channel(`sync:profile:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${userId}` },
        (payload) => this.handleProfileChange(payload)
      )
      .subscribe();

    // 3. Settings Sync Channel
    const settingsChannel = supabase
      .channel(`sync:settings:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${userId}` },
        (payload) => this.handleSettingsChange(payload)
      )
      .subscribe();

    this.channels.set('library', libraryChannel);
    this.channels.set('profile', profileChannel);
    this.channels.set('settings', settingsChannel);
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribe() {
    this.channels.forEach(channel => supabase.removeChannel(channel));
    this.channels.clear();
  }

  /**
   * Handle changes to followed_anime table
   */
  handleLibraryChange(payload) {
    if (!this.libraryStore) return;

    const { eventType, new: newItem, old: oldItem } = payload;
    console.log('[SyncService] Library change received:', eventType);

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const normalized = {
        malId: newItem.mal_id,
        title: newItem.title,
        image: newItem.image || '',
        status: newItem.status,
        progress: newItem.next_episode,
        episodes: newItem.total_episodes,
        updatedAt: Date.parse(newItem.last_checked || newItem.updated_at)
      };
      
      // Upsert but avoid infinite loops if it was a local change
      // Note: libraryStore.init or custom internal update should be used 
      // to avoid triggering another cloud push if possible.
      this.libraryStore.upsert(normalized, normalized.status);

      // Notify cloudSync to not push this change back
      window.dispatchEvent(new CustomEvent('animex:library-sync-received', { detail: normalized }));
    } else if (eventType === 'DELETE') {
      this.libraryStore.remove(oldItem.mal_id);
    }
  }

  /**
   * Handle changes to user_profiles table
   */
  handleProfileChange(payload) {
    if (payload.eventType === 'DELETE') return;
    
    console.log('[SyncService] Profile change received');
    const data = payload.new;
    const profile = {
      name: data.name,
      bio: data.bio,
      avatar: data.avatar,
      banner: data.banner,
      mal: data.mal,
      al: data.al
    };

    // Update localStorage to trigger UI refresh (if userFeatures is listening)
    localStorage.setItem('animex_profile_v1', JSON.stringify(profile));
    
    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('animex:profile-sync', { detail: profile }));
  }

  /**
   * Handle changes to user_settings table
   */
  handleSettingsChange(payload) {
    if (payload.eventType === 'DELETE') return;

    console.log('[SyncService] Settings change received');
    const data = payload.new;
    const settings = {
      darkTheme: data.dark_theme,
      notifications: data.notifications,
      autoplay: data.autoplay,
      dataSaver: data.data_saver,
      titleLang: data.title_lang,
      defaultStatus: data.default_status,
      accentColor: data.accent_color
    };

    localStorage.setItem('animex_settings_v1', JSON.stringify(settings));
    
    // Update global store
    setState({
      theme: settings.darkTheme ? 'dark' : 'light',
      accentColor: settings.accentColor
    });

    window.dispatchEvent(new CustomEvent('animex:settings-sync', { detail: settings }));
  }
}

export const syncService = new SyncService();
