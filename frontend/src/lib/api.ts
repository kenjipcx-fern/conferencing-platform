import { ApiResponse, PaginatedResponse, Session, Attendee, Question, User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || errorData?.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      
      // Handle different response formats
      if (data.success !== undefined) {
        return data;
      }
      
      // Wrap plain data in ApiResponse format
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<ApiResponse<{ status: string; timestamp: string; uptime: number; database: string; memory: object; environment: string }>> {
    return this.request('/health');
  }

  // Session endpoints
  async getSessions(page = 1, limit = 10): Promise<PaginatedResponse<Session>> {
    const response = await this.request<Session[]>(`/sessions?page=${page}&limit=${limit}`);
    // Mock pagination for now since backend doesn't have it yet
    return {
      data: response.data,
      pagination: {
        page,
        limit,
        total: response.data.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  async getSession(sessionId: string): Promise<ApiResponse<Session>> {
    return this.request(`/sessions/${sessionId}`);
  }

  async getSessionBySlug(slug: string): Promise<ApiResponse<Session>> {
    return this.request(`/sessions/slug/${slug}`);
  }

  async createSession(sessionData: Partial<Session>): Promise<ApiResponse<Session>> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<ApiResponse<Session>> {
    return this.request(`/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<void>> {
    return this.request(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async startSession(sessionId: string): Promise<ApiResponse<Session>> {
    return this.request(`/sessions/${sessionId}/start`, {
      method: 'POST',
    });
  }

  async endSession(sessionId: string): Promise<ApiResponse<Session>> {
    return this.request(`/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  }

  // Attendee endpoints
  async getSessionAttendees(sessionId: string): Promise<ApiResponse<Attendee[]>> {
    return this.request(`/sessions/${sessionId}/attendees`);
  }

  async joinSession(
    sessionId: string, 
    attendeeData: { name?: string; email?: string }
  ): Promise<ApiResponse<{ attendee: Attendee; session: Session }>> {
    return this.request(`/sessions/${sessionId}/join`, {
      method: 'POST',
      body: JSON.stringify(attendeeData),
    });
  }

  async leaveSession(sessionId: string, attendeeId: string): Promise<ApiResponse<void>> {
    return this.request(`/sessions/${sessionId}/attendees/${attendeeId}/leave`, {
      method: 'POST',
    });
  }

  async updateAttendee(
    sessionId: string, 
    attendeeId: string, 
    updates: Partial<Attendee>
  ): Promise<ApiResponse<Attendee>> {
    return this.request(`/sessions/${sessionId}/attendees/${attendeeId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Question endpoints
  async getSessionQuestions(sessionId: string): Promise<ApiResponse<Question[]>> {
    return this.request(`/sessions/${sessionId}/questions`);
  }

  async submitQuestion(
    sessionId: string,
    questionData: { content: string; isAnonymous: boolean; attendeeId?: string }
  ): Promise<ApiResponse<Question>> {
    return this.request(`/sessions/${sessionId}/questions`, {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  async voteQuestion(
    sessionId: string,
    questionId: string,
    voteType: 'up' | 'down',
    attendeeId?: string
  ): Promise<ApiResponse<Question>> {
    return this.request(`/sessions/${sessionId}/questions/${questionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType, attendeeId }),
    });
  }

  async updateQuestion(
    sessionId: string,
    questionId: string,
    updates: Partial<Question>
  ): Promise<ApiResponse<Question>> {
    return this.request(`/sessions/${sessionId}/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async answerQuestion(
    sessionId: string,
    questionId: string,
    answer: string
  ): Promise<ApiResponse<Question>> {
    return this.request(`/sessions/${sessionId}/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  async deleteQuestion(sessionId: string, questionId: string): Promise<ApiResponse<void>> {
    return this.request(`/sessions/${sessionId}/questions/${questionId}`, {
      method: 'DELETE',
    });
  }

  // User/Auth endpoints (placeholder for future implementation)
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Query keys for TanStack Query
export const queryKeys = {
  health: ['health'] as const,
  sessions: {
    all: ['sessions'] as const,
    list: (filters?: Record<string, any>) => ['sessions', 'list', filters] as const,
    detail: (id: string) => ['sessions', 'detail', id] as const,
    bySlug: (slug: string) => ['sessions', 'slug', slug] as const,
    attendees: (id: string) => ['sessions', id, 'attendees'] as const,
    questions: (id: string) => ['sessions', id, 'questions'] as const,
  },
  user: {
    current: ['user', 'current'] as const,
  },
} as const;
