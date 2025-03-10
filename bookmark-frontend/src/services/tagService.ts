import api from './api';
import { Bookmark, PaginatedResponse } from './bookmarkService';

export interface Tag {
  id: number;
  name: string;
  created_at: string;
  is_ai_generated: boolean;
  bookmark_count?: number;
}

export interface TagDetail extends Tag {
  statistics: {
    total_bookmarks: number;
    recent_bookmarks: Bookmark[];
  }
}

export interface TagCreateData {
  name: string;
  is_ai_generated?: boolean;
}

export interface TagUpdateData {
  name?: string;
  is_ai_generated?: boolean;
}

export const tagService = {
  async getTags(params?: Record<string, any>): Promise<Tag[]> {
    const response = await api.get('/tags/', { params });
    return response.data.results;
  },

  async getTag(id: number): Promise<Tag> {
    const response = await api.get(`/tags/${id}/`);
    return response.data;
  },

  async createTag(data: TagCreateData): Promise<Tag> {
    const response = await api.post('/tags/', data);
    return response.data;
  },

  async updateTag(id: number, data: TagUpdateData): Promise<Tag> {
    const response = await api.patch(`/tags/${id}/`, data);
    return response.data;
  },

  async deleteTag(id: number): Promise<void> {
    await api.delete(`/tags/${id}/`);
  },

  async getTagBookmarks(id: number): Promise<PaginatedResponse<Bookmark>> {
    const response = await api.get(`/tags/${id}/bookmarks/`);
    return response.data;
  },

  async getPopularTags(limit = 10): Promise<Tag[]> {
    const response = await api.get('/tags/popular/', { params: { limit } });
    return response.data;
  },

  async getUnusedTags(): Promise<Tag[]> {
    const response = await api.get('/tags/unused/');
    return response.data;
  },

  async bulkDeleteTags(tagIds: number[]): Promise<{ detail: string }> {
    const response = await api.post('/tags/bulk-delete/', { tag_ids: tagIds });
    return response.data;
  },

  async mergeTags(sourceTagIds: number[], targetTagId: number): Promise<{ detail: string }> {
    const response = await api.post('/tags/merge/', {
      source_tag_ids: sourceTagIds,
      target_tag_id: targetTagId
    });
    return response.data;
  },

  async getTagDetail(id: number): Promise<TagDetail> {
    const response = await api.get(`/tags/${id}/details/`);
    return response.data;
  }
};
