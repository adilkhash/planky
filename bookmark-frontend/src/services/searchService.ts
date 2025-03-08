import api from './api';
import { Bookmark, PaginatedResponse } from './bookmarkService';

export interface SearchQuery {
  q?: string;
  tag_id?: number;
  tag_name?: string;
  is_favorite?: boolean;
  is_pinned?: boolean;
  page?: number;
  ordering?: string;
}

export interface SearchHistory {
  id: number;
  query: string;
  timestamp: string;
}

export interface SearchSuggestions {
  tags: Array<{
    id: number;
    name: string;
  }>;
  titles: Array<{
    id: number;
    title: string;
  }>;
}

export const searchService = {
  /**
   * Search bookmarks with various filters
   */
  async searchBookmarks(params: SearchQuery): Promise<PaginatedResponse<Bookmark>> {
    const response = await api.get('/bookmarks/search/', { params });
    return response.data;
  },

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(query: string): Promise<SearchSuggestions> {
    if (!query || query.length < 2) {
      return { tags: [], titles: [] };
    }

    const response = await api.get('/bookmarks/search_suggestions/', {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Get recent search history
   */
  async getRecentSearches(): Promise<SearchHistory[]> {
    const response = await api.get('/bookmarks/recent_searches/');
    return response.data;
  },

  /**
   * Save a search query to history
   * In a real implementation, this would call an API endpoint
   */
  async saveSearchQuery(query: string): Promise<void> {
    // This would normally be an API call to save the search history
    // For now, we'll just log it to console
    console.log('Saving search query:', query);

    // Example API call (commented out):
    // await api.post('/bookmarks/save_search/', { query });

    // Instead, we'll save to localStorage for the demo
    const searches = this.getSearchesFromLocalStorage();
    const newSearch = {
      id: Date.now(),
      query,
      timestamp: new Date().toISOString()
    };

    const updatedSearches = [newSearch, ...searches.slice(0, 9)]; // Keep only 10 most recent
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  },

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    // This would normally be an API call to clear the search history
    // For now, we'll just clear localStorage
    localStorage.removeItem('recentSearches');
  },

  /**
   * Helper to get searches from localStorage (for demo purposes)
   */
  getSearchesFromLocalStorage(): SearchHistory[] {
    try {
      const searchesJson = localStorage.getItem('recentSearches');
      if (searchesJson) {
        return JSON.parse(searchesJson);
      }
    } catch (error) {
      console.error('Error parsing search history from localStorage:', error);
    }
    return [];
  }
};
