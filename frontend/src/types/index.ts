// Backend API Types (shared with backend)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
  providerId: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  title: string;
  description?: string;
  slug: string;
  status: 'scheduled' | 'live' | 'ended';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  maxAttendees: number;
  allowQuestions: boolean;
  allowAnonymousQuestions: boolean;
  moderateQuestions: boolean;
  requireRegistration: boolean;
  enableRecording: boolean;
  branding?: {
    backgroundColor?: string;
    textColor?: string;
    logoUrl?: string;
    customCss?: string;
  };
  settings: {
    webrtcEnabled?: boolean;
    screenShareEnabled?: boolean;
    chatEnabled?: boolean;
    waitingRoomEnabled?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Attendee {
  id: string;
  sessionId: string;
  name?: string;
  email?: string;
  avatar?: string;
  isAnonymous: boolean;
  webrtcPeerId?: string;
  socketId?: string;
  status: 'waiting' | 'joined' | 'left';
  joinedAt: string;
  leftAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Question {
  id: string;
  sessionId: string;
  attendeeId?: string;
  content: string;
  authorName?: string;
  isAnonymous: boolean;
  status: 'pending' | 'approved' | 'answered' | 'rejected';
  priority: number;
  upvotes: number;
  downvotes: number;
  answer?: string;
  answeredAt?: string;
  answeredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionVote {
  id: string;
  questionId: string;
  attendeeId?: string;
  voteType: 'up' | 'down';
  ipAddress?: string;
  createdAt: string;
}

export interface SessionAnalytics {
  id: string;
  sessionId: string;
  timestamp: string;
  eventType: string;
  eventData?: {
    attendeeId?: string;
    questionId?: string;
    connectionType?: string;
    duration?: number;
    quality?: string;
  };
  attendeeCount: number;
  activeConnections: number;
  questionsCount: number;
}

// Frontend-specific types
export interface WebRTCPeer {
  id: string;
  stream?: MediaStream;
  connection?: RTCPeerConnection;
  isPresenter: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  screenShare?: MediaStream;
}

export interface SessionState {
  session?: Session;
  attendees: Attendee[];
  questions: Question[];
  currentUser?: Attendee;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  webrtcPeers: Map<string, WebRTCPeer>;
  localStream?: MediaStream;
  screenShareStream?: MediaStream;
  isPresenter: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export interface UIState {
  sidebarOpen: boolean;
  questionsPanelOpen: boolean;
  settingsPanelOpen: boolean;
  fullscreen: boolean;
  darkMode: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Socket.io event types
export interface SocketEvents {
  // Session events
  'session:join': (data: { sessionId: string; attendeeInfo: Partial<Attendee> }) => void;
  'session:leave': (data: { sessionId: string; attendeeId: string }) => void;
  'session:attendee-joined': (data: { attendee: Attendee }) => void;
  'session:attendee-left': (data: { attendeeId: string }) => void;
  'session:status-changed': (data: { sessionId: string; status: Session['status'] }) => void;

  // Question events
  'question:submit': (data: { question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'> }) => void;
  'question:new': (data: { question: Question }) => void;
  'question:vote': (data: { questionId: string; voteType: 'up' | 'down' }) => void;
  'question:voted': (data: { questionId: string; upvotes: number; downvotes: number }) => void;
  'question:answered': (data: { question: Question }) => void;
  'question:status-changed': (data: { questionId: string; status: Question['status'] }) => void;

  // WebRTC signaling events
  'webrtc:offer': (data: { peerId: string; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { peerId: string; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: { peerId: string; candidate: RTCIceCandidateInit }) => void;
  'webrtc:peer-connected': (data: { peerId: string; isPresenter: boolean }) => void;
  'webrtc:peer-disconnected': (data: { peerId: string }) => void;
  'webrtc:stream-started': (data: { peerId: string; type: 'camera' | 'screen' }) => void;
  'webrtc:stream-stopped': (data: { peerId: string; type: 'camera' | 'screen' }) => void;

  // Analytics events
  'analytics:track': (data: Omit<SessionAnalytics, 'id' | 'timestamp'>) => void;
}

// Form types
export interface SessionFormData {
  title: string;
  description?: string;
  scheduledAt?: Date;
  maxAttendees: number;
  allowQuestions: boolean;
  allowAnonymousQuestions: boolean;
  moderateQuestions: boolean;
  requireRegistration: boolean;
  enableRecording: boolean;
  branding?: Session['branding'];
  settings: Session['settings'];
}

export interface AttendeeJoinFormData {
  name?: string;
  email?: string;
}

export interface QuestionFormData {
  content: string;
  isAnonymous: boolean;
}
