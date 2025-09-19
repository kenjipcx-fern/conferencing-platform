import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UIState, Notification } from '@/types';

interface UIStore extends UIState {
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setQuestionsPanelOpen: (open: boolean) => void;
  toggleQuestionsPanel: () => void;
  setSettingsPanelOpen: (open: boolean) => void;
  toggleSettingsPanel: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
  setDarkMode: (darkMode: boolean) => void;
  toggleDarkMode: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const initialState: UIState = {
  sidebarOpen: true,
  questionsPanelOpen: false,
  settingsPanelOpen: false,
  fullscreen: false,
  darkMode: false,
  notifications: [],
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setSidebarOpen: (open) =>
          set(
            (state) => ({ ...state, sidebarOpen: open }),
            false,
            'setSidebarOpen'
          ),

        toggleSidebar: () =>
          set(
            (state) => ({ ...state, sidebarOpen: !state.sidebarOpen }),
            false,
            'toggleSidebar'
          ),

        setQuestionsPanelOpen: (open) =>
          set(
            (state) => ({ ...state, questionsPanelOpen: open }),
            false,
            'setQuestionsPanelOpen'
          ),

        toggleQuestionsPanel: () =>
          set(
            (state) => ({ ...state, questionsPanelOpen: !state.questionsPanelOpen }),
            false,
            'toggleQuestionsPanel'
          ),

        setSettingsPanelOpen: (open) =>
          set(
            (state) => ({ ...state, settingsPanelOpen: open }),
            false,
            'setSettingsPanelOpen'
          ),

        toggleSettingsPanel: () =>
          set(
            (state) => ({ ...state, settingsPanelOpen: !state.settingsPanelOpen }),
            false,
            'toggleSettingsPanel'
          ),

        setFullscreen: (fullscreen) =>
          set(
            (state) => ({ ...state, fullscreen }),
            false,
            'setFullscreen'
          ),

        toggleFullscreen: () => {
          const newFullscreen = !get().fullscreen;
          
          if (newFullscreen) {
            document.documentElement.requestFullscreen?.();
          } else {
            document.exitFullscreen?.();
          }

          set(
            (state) => ({ ...state, fullscreen: newFullscreen }),
            false,
            'toggleFullscreen'
          );
        },

        setDarkMode: (darkMode) => {
          if (darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }

          set(
            (state) => ({ ...state, darkMode }),
            false,
            'setDarkMode'
          );
        },

        toggleDarkMode: () => {
          const newDarkMode = !get().darkMode;
          
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }

          set(
            (state) => ({ ...state, darkMode: newDarkMode }),
            false,
            'toggleDarkMode'
          );
        },

        addNotification: (notification) => {
          const id = Date.now().toString();
          const timestamp = new Date();
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp,
          };

          set(
            (state) => ({
              ...state,
              notifications: [newNotification, ...state.notifications.slice(0, 9)], // Keep max 10 notifications
            }),
            false,
            'addNotification'
          );

          // Auto-remove notification after duration
          if (notification.duration !== -1) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration || 5000);
          }
        },

        removeNotification: (id) =>
          set(
            (state) => ({
              ...state,
              notifications: state.notifications.filter((n) => n.id !== id),
            }),
            false,
            'removeNotification'
          ),

        clearNotifications: () =>
          set(
            (state) => ({ ...state, notifications: [] }),
            false,
            'clearNotifications'
          ),
      }),
      {
        name: 'ui-store',
        // Only persist dark mode and sidebar preferences
        partialize: (state) => ({
          darkMode: state.darkMode,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);
