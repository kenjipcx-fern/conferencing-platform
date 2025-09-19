import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SessionState, Session, Attendee, Question, WebRTCPeer, Notification } from '@/types';

interface SessionStore extends SessionState {
  // Actions
  setSession: (session: Session) => void;
  updateSession: (updates: Partial<Session>) => void;
  addAttendee: (attendee: Attendee) => void;
  removeAttendee: (attendeeId: string) => void;
  updateAttendee: (attendeeId: string, updates: Partial<Attendee>) => void;
  setCurrentUser: (attendee: Attendee) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  removeQuestion: (questionId: string) => void;
  setConnectionStatus: (status: SessionState['connectionStatus']) => void;
  addWebRTCPeer: (peerId: string, peer: WebRTCPeer) => void;
  removeWebRTCPeer: (peerId: string) => void;
  updateWebRTCPeer: (peerId: string, updates: Partial<WebRTCPeer>) => void;
  setLocalStream: (stream: MediaStream | undefined) => void;
  setScreenShareStream: (stream: MediaStream | undefined) => void;
  setIsPresenter: (isPresenter: boolean) => void;
  setIsMuted: (isMuted: boolean) => void;
  setIsVideoOff: (isVideoOff: boolean) => void;
  setIsScreenSharing: (isScreenSharing: boolean) => void;
  reset: () => void;
}

const initialState: SessionState = {
  attendees: [],
  questions: [],
  connectionStatus: 'disconnected',
  webrtcPeers: new Map(),
  isPresenter: false,
  isMuted: true,
  isVideoOff: true,
  isScreenSharing: false,
};

export const useSessionStore = create<SessionStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setSession: (session) =>
        set(
          (state) => ({ ...state, session }),
          false,
          'setSession'
        ),

      updateSession: (updates) =>
        set(
          (state) => ({
            ...state,
            session: state.session ? { ...state.session, ...updates } : undefined,
          }),
          false,
          'updateSession'
        ),

      addAttendee: (attendee) =>
        set(
          (state) => ({
            ...state,
            attendees: [...state.attendees, attendee],
          }),
          false,
          'addAttendee'
        ),

      removeAttendee: (attendeeId) =>
        set(
          (state) => ({
            ...state,
            attendees: state.attendees.filter((a) => a.id !== attendeeId),
          }),
          false,
          'removeAttendee'
        ),

      updateAttendee: (attendeeId, updates) =>
        set(
          (state) => ({
            ...state,
            attendees: state.attendees.map((a) =>
              a.id === attendeeId ? { ...a, ...updates } : a
            ),
          }),
          false,
          'updateAttendee'
        ),

      setCurrentUser: (attendee) =>
        set(
          (state) => ({ ...state, currentUser: attendee }),
          false,
          'setCurrentUser'
        ),

      addQuestion: (question) =>
        set(
          (state) => ({
            ...state,
            questions: [question, ...state.questions],
          }),
          false,
          'addQuestion'
        ),

      updateQuestion: (questionId, updates) =>
        set(
          (state) => ({
            ...state,
            questions: state.questions.map((q) =>
              q.id === questionId ? { ...q, ...updates } : q
            ),
          }),
          false,
          'updateQuestion'
        ),

      removeQuestion: (questionId) =>
        set(
          (state) => ({
            ...state,
            questions: state.questions.filter((q) => q.id !== questionId),
          }),
          false,
          'removeQuestion'
        ),

      setConnectionStatus: (status) =>
        set(
          (state) => ({ ...state, connectionStatus: status }),
          false,
          'setConnectionStatus'
        ),

      addWebRTCPeer: (peerId, peer) =>
        set(
          (state) => ({
            ...state,
            webrtcPeers: new Map(state.webrtcPeers.set(peerId, peer)),
          }),
          false,
          'addWebRTCPeer'
        ),

      removeWebRTCPeer: (peerId) =>
        set(
          (state) => {
            const newPeers = new Map(state.webrtcPeers);
            newPeers.delete(peerId);
            return { ...state, webrtcPeers: newPeers };
          },
          false,
          'removeWebRTCPeer'
        ),

      updateWebRTCPeer: (peerId, updates) =>
        set(
          (state) => {
            const currentPeer = state.webrtcPeers.get(peerId);
            if (!currentPeer) return state;
            
            const newPeers = new Map(state.webrtcPeers);
            newPeers.set(peerId, { ...currentPeer, ...updates });
            return { ...state, webrtcPeers: newPeers };
          },
          false,
          'updateWebRTCPeer'
        ),

      setLocalStream: (stream) =>
        set(
          (state) => ({ ...state, localStream: stream }),
          false,
          'setLocalStream'
        ),

      setScreenShareStream: (stream) =>
        set(
          (state) => ({ ...state, screenShareStream: stream }),
          false,
          'setScreenShareStream'
        ),

      setIsPresenter: (isPresenter) =>
        set(
          (state) => ({ ...state, isPresenter }),
          false,
          'setIsPresenter'
        ),

      setIsMuted: (isMuted) =>
        set(
          (state) => ({ ...state, isMuted }),
          false,
          'setIsMuted'
        ),

      setIsVideoOff: (isVideoOff) =>
        set(
          (state) => ({ ...state, isVideoOff }),
          false,
          'setIsVideoOff'
        ),

      setIsScreenSharing: (isScreenSharing) =>
        set(
          (state) => ({ ...state, isScreenSharing }),
          false,
          'setIsScreenSharing'
        ),

      reset: () =>
        set(
          () => ({ ...initialState, webrtcPeers: new Map() }),
          false,
          'reset'
        ),
    }),
    {
      name: 'session-store',
    }
  )
);
