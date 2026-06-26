import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useStore = create((set, get) => ({
  issues: [],
  isLoading: false,
  error: null,
  socket: null,
  
  // UI States
  isReportFormOpen: false,
  setReportFormOpen: (isOpen) => set({ isReportFormOpen: isOpen }),
  manualLocation: null,
  setManualLocation: (location) => set({ manualLocation: location }),
  needsManualLocation: false,
  setNeedsManualLocation: (needs) => set({ needsManualLocation: needs }),
  
  // Fetch all issues initially
  fetchIssues: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/issues`);
      if (response.data.success) {
        set({ issues: response.data.issues, isLoading: false, error: null });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Actions for Optimistic Updates and WebSocket events
  addNewIssue: (newIssue) => {
    // Prevent duplicates in real-time feed
    const { issues } = get();
    if (!issues.find(i => i._id === newIssue._id)) {
      set({ issues: [newIssue, ...issues] });
    }
  },

  updateIssue: (updatedIssue) => {
    set(state => ({
      issues: state.issues.map(issue => 
        issue._id === updatedIssue._id ? updatedIssue : issue
      )
    }));
  },

  // API Call Helpers that also optimistically update the state
  upvoteIssue: async (issueId) => {
    try {
      const response = await axios.put(`${API_URL}/issues/${issueId}/upvote`);
      if (response.data.success) {
        get().updateIssue(response.data.issue);
      }
    } catch (error) {
      console.error('Failed to upvote:', error);
    }
  },

  resolveIssue: async (issueId, token) => {
    try {
      const response = await axios.put(`${API_URL}/admin/issues/${issueId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().updateIssue(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to resolve:', error);
      throw error;
    }
  },

  // Initialize Socket Connection
  connectSocket: () => {
    const currentSocket = get().socket;
    if (currentSocket) return;

    // Ensure we connect to the base URL, not the /api suffix
    const socketUrl = API_URL.replace('/api', '');
    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => console.log('Zustand WebSocket Connected'));
    
    newSocket.on('new_issue', (issue) => {
        console.log('Real-time new issue received via socket!', issue);
        get().addNewIssue(issue);
    });
    
    newSocket.on('issue_updated', (issue) => {
        console.log('Real-time issue update received via socket!', issue);
        get().updateIssue(issue);
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
