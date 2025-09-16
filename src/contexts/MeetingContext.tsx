'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Meeting, Participant, MeetingState, CreateMeetingData, JoinMeetingData, OwnerVerificationData, OwnerVerificationResponse } from '@/types';

interface MeetingContextType extends MeetingState {
  createMeeting: (data: CreateMeetingData) => Promise<string>;
  joinMeeting: (data: JoinMeetingData) => Promise<void>;
  leaveMeeting: () => void;
  endMeeting: () => void;
  toggleMute: (participantId?: string) => void;
  getPublicMeetings: () => Promise<Meeting[]>;
  searchMeetings: (query: string) => Promise<Meeting[]>;
  refreshMeetingData: () => Promise<void>;
  verifyOwner: (meetingId: string, data: OwnerVerificationData) => Promise<OwnerVerificationResponse>;
  joinAsOwner: (meetingId: string, nickname: string, data: OwnerVerificationData) => Promise<void>;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

type MeetingAction =
  | { type: 'SET_MEETING'; payload: Meeting }
  | { type: 'SET_PARTICIPANTS'; payload: Participant[] }
  | { type: 'SET_CURRENT_USER'; payload: Participant }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_PARTICIPANT'; payload: Participant }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'UPDATE_PARTICIPANT'; payload: Participant }
  | { type: 'CLEAR_MEETING' };

const meetingReducer = (state: MeetingState, action: MeetingAction): MeetingState => {
  switch (action.type) {
    case 'SET_MEETING':
      return { ...state, meeting: action.payload };
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_PARTICIPANT':
      return { ...state, participants: [...state.participants, action.payload] };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.id !== action.payload)
      };
    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'CLEAR_MEETING':
      return {
        meeting: null,
        participants: [],
        currentUser: null,
        isConnected: false,
        error: null
      };
    default:
      return state;
  }
};

const initialState: MeetingState = {
  meeting: null,
  participants: [],
  currentUser: null,
  isConnected: false,
  error: null
};

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(meetingReducer, initialState);

  const createMeeting = async (data: CreateMeetingData): Promise<string> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create meeting');
      }

      const { meeting } = await response.json();
      return meeting.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create meeting';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const verifyOwner = async (meetingId: string, data: OwnerVerificationData): Promise<OwnerVerificationResponse> => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/verify-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify owner');
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify owner';
      throw new Error(errorMessage);
    }
  };

  const joinAsOwner = async (meetingId: string, nickname: string, data: OwnerVerificationData): Promise<void> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // First verify owner
      const verification = await verifyOwner(meetingId, data);
      if (!verification.isOwner) {
        throw new Error('Invalid owner credentials');
      }

      // Get meeting password from localStorage (stored during creation)
      const storedPassword = localStorage.getItem(`meeting_password_${meetingId}`);
      if (!storedPassword) {
        throw new Error('Meeting password not found');
      }

      // Join as regular participant but mark as host
      const response = await fetch(`/api/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          password: storedPassword,
          isOwner: true,
          ownerToken: data.ownerToken,
          ownerUserId: data.ownerUserId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join as owner');
      }

      const { participant, meeting } = await response.json();
      
      dispatch({ type: 'SET_MEETING', payload: meeting });
      dispatch({ type: 'SET_CURRENT_USER', payload: participant });
      dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join as owner';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const joinMeeting = async (data: JoinMeetingData): Promise<void> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await fetch(`/api/meetings/${data.meetingId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: data.nickname,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join meeting');
      }

      const { participant, meeting } = await response.json();
      
      dispatch({ type: 'SET_MEETING', payload: meeting });
      dispatch({ type: 'SET_CURRENT_USER', payload: participant });
      dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join meeting';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const leaveMeeting = async () => {
    try {
      if (state.currentUser) {
        await fetch(`/api/participants/${state.currentUser.id}`, {
          method: 'DELETE',
        });
      }
      dispatch({ type: 'CLEAR_MEETING' });
    } catch (error) {
      console.error('Error leaving meeting:', error);
      dispatch({ type: 'CLEAR_MEETING' });
    }
  };

  const endMeeting = async () => {
    try {
      if (state.meeting && state.currentUser?.isHost) {
        await fetch(`/api/meetings/${state.meeting.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'end' }),
        });
      }
      dispatch({ type: 'CLEAR_MEETING' });
    } catch (error) {
      console.error('Error ending meeting:', error);
      dispatch({ type: 'CLEAR_MEETING' });
    }
  };

  const toggleMute = async (participantId?: string) => {
    const targetId = participantId || state.currentUser?.id;
    if (!targetId) return;

    const participant = state.participants.find(p => p.id === targetId);
    if (!participant) return;

    try {
      const response = await fetch(`/api/participants/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mute',
          isMuted: !participant.isMuted,
        }),
      });

      if (response.ok) {
        const { participant: updatedParticipant } = await response.json();
        dispatch({ type: 'UPDATE_PARTICIPANT', payload: updatedParticipant });
        
        if (targetId === state.currentUser?.id) {
          dispatch({ type: 'SET_CURRENT_USER', payload: updatedParticipant });
        }
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const getPublicMeetings = async (): Promise<Meeting[]> => {
    try {
      const response = await fetch('/api/meetings');
      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }
      const { meetings } = await response.json();
      return meetings;
    } catch (error) {
      console.error('Error fetching public meetings:', error);
      return [];
    }
  };

  const searchMeetings = async (query: string): Promise<Meeting[]> => {
    try {
      const response = await fetch(`/api/meetings?search=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search meetings');
      }
      const { meetings } = await response.json();
      return meetings;
    } catch (error) {
      console.error('Error searching meetings:', error);
      return [];
    }
  };

  const refreshMeetingData = async () => {
    if (!state.meeting) return;

    try {
      const response = await fetch(`/api/meetings/${state.meeting.id}`);
      if (response.ok) {
        const { meeting } = await response.json();
        dispatch({ type: 'SET_MEETING', payload: meeting });
        dispatch({ type: 'SET_PARTICIPANTS', payload: meeting.participants });
      }
    } catch (error) {
      console.error('Error refreshing meeting data:', error);
    }
  };

  // Refresh meeting data periodically
  useEffect(() => {
    if (!state.meeting || !state.isConnected) return;

    const interval = setInterval(refreshMeetingData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [state.meeting, state.isConnected]);

  const value: MeetingContextType = {
    ...state,
    createMeeting,
    joinMeeting,
    leaveMeeting,
    endMeeting,
    toggleMute,
    getPublicMeetings,
    searchMeetings,
    refreshMeetingData,
    verifyOwner,
    joinAsOwner
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}