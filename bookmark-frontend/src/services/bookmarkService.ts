import api from './api';

export interface Tag {
  id: number;
  name: string;
  created_at?: string;
  is_ai_generated?: boolean;
  bookmark_count?: number;
}

export interface Bookmark {
  id: number;
  url: string;
  title: string;
  description: string | null;
  notes: string | null;
  favicon_url: string | null;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  is_pinned: boolean;
  tags: Tag[];
}

export interface BookmarkCreateData {
  url: string;
  title: string;
  description?: string;
  notes?: string;
  favicon_url?: string;
  is_favorite?: boolean;
  is_pinned?: boolean;
  tag_ids?: number[];
  tag_names?: string[];
}

export interface BookmarkUpdateData {
  url?: string;
  title?: string;
  description?: string;
  notes?: string;
  favicon_url?: string;
  is_favorite?: boolean;
  is_pinned?: boolean;
  tag_ids?: number[];
  tag_names?: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BookmarkStats {
  total_bookmarks: number;
  favorite_bookmarks: number;
  pinned_bookmarks: number;
  total_tags: number;
  recent_tags: {
    id: number;
    name: string;
    count: number;
  }[];
}

interface UrlMetadata {
  title: string | null;
  description: string | null;
  url: string;
  error?: string;
}

export const bookmarkService = {
  async getBookmarks(params?: Record<string, any>): Promise<PaginatedResponse<Bookmark>> {
    const response = await api.get('/bookmarks/', { params });
    return response.data;
  },

  async getBookmark(id: number): Promise<Bookmark> {
    const response = await api.get(`/bookmarks/${id}/`);
    return response.data;
  },

  async createBookmark(data: BookmarkCreateData): Promise<Bookmark> {
    const response = await api.post('/bookmarks/', data);
    return response.data;
  },

  async updateBookmark(id: number, data: BookmarkUpdateData): Promise<Bookmark> {
    const response = await api.patch(`/bookmarks/${id}/`, data);
    return response.data;
  },

  async deleteBookmark(id: number): Promise<void> {
    await api.delete(`/bookmarks/${id}/`);
  },

  async getFavoriteBookmarks(params?: Record<string, any>): Promise<PaginatedResponse<Bookmark>> {
    const response = await api.get('/bookmarks/favorites/', { params });
    return response.data;
  },

  async getPinnedBookmarks(params?: Record<string, any>): Promise<PaginatedResponse<Bookmark>> {
    const response = await api.get('/bookmarks/pinned/', { params });
    return response.data;
  },

  async addTagToBookmark(bookmarkId: number, tagId: number): Promise<Bookmark> {
    const response = await api.post(`/bookmarks/${bookmarkId}/add_tag/`, { tag_id: tagId });
    return response.data;
  },

  async addTagNameToBookmark(bookmarkId: number, tagName: string): Promise<Bookmark> {
    const response = await api.post(`/bookmarks/${bookmarkId}/add_tag/`, { tag_name: tagName });
    return response.data;
  },

  async removeTagFromBookmark(bookmarkId: number, tagId: number): Promise<Bookmark> {
    const response = await api.post(`/bookmarks/${bookmarkId}/remove_tag/`, { tag_id: tagId });
    return response.data;
  },

  async getBookmarksByTag(tagId: number, params?: Record<string, any>): Promise<PaginatedResponse<Bookmark>> {
    const queryParams = { tag_id: tagId, ...params };
    const response = await api.get('/bookmarks/', { params: queryParams });
    return response.data;
  },

  // Search-related methods

  async searchBookmarks(
    query: string,
    filters?: {
      tags?: number[];
      favorite?: boolean;
      pinned?: boolean;
    },
    page = 1
  ): Promise<PaginatedResponse<Bookmark>> {
    const params: Record<string, any> = { page };

    if (query) {
      params.search = query;
    }

    if (filters?.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }

    if (filters?.favorite) {
      params.is_favorite = true;
    }

    if (filters?.pinned) {
      params.is_pinned = true;
    }

    const response = await api.get('/bookmarks/', { params });
    return response.data;
  },

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const response = await api.get('/bookmarks/search_suggestions/', { params: { q: query } });
    return response.data;
  },

  async getBookmarkStats(): Promise<BookmarkStats> {
    const response = await api.get('/bookmarks/stats/');
    return response.data;
  },

  async fetchUrlMetadata(url: string): Promise<UrlMetadata> {
    const response = await api.post('/bookmarks/fetch_metadata/', { url });
    return response.data;
  }
};
