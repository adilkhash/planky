import api from './api';

export interface Tag {
  id: number;
  name: string;
}

export interface Bookmark {
  id: number;
  url: string;
  title: string;
  description: string | null;
  notes: string | null;  // Added notes field
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
  notes?: string;  // Added notes field
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
  notes?: string;  // Added notes field
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

  async getFavoriteBookmarks(): Promise<PaginatedResponse<Bookmark>> {
    const response = await api.get('/bookmarks/favorites/');
    return response.data;
  },

  async getPinnedBookmarks(): Promise<PaginatedResponse<Bookmark>> {
    const response = await api.get('/bookmarks/pinned/');
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

  async getBookmarksByTag(tagId: number): Promise<PaginatedResponse<Bookmark>> {
    const response = await api.get('/bookmarks/', { params: { tag_id: tagId } });
    return response.data;
  }
};
