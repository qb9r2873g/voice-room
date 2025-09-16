'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useMeeting } from '@/contexts/MeetingContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { UserIdentityManager } from '@/lib/userIdentity';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingId = params.meetingId as string;
  const ownerParam = searchParams.get('owner');
  
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    meeting,
    participants,
    currentUser,
    isConnected,
    error,
    joinMeeting,
    joinAsOwner,
    leaveMeeting,
    endMeeting,
    toggleMute,
    refreshMeetingData
  } = useMeeting();

  const {
    localStream,
    connections,
    isAudioEnabled,
    toggleAudio,
    disconnectAll
  } = useWebRTC({ 
    meetingId, 
    participantId: currentUser?.id || ''
  });

  // Check if user is already in the meeting or needs to auto-join as owner
  useEffect(() => {
    const initializeRoom = async () => {
      setIsInitializing(true);

      // If user is already in a meeting, we're good
      if (currentUser && meeting) {
        setIsInitializing(false);
        return;
      }

      // Check if user should auto-join as owner
      if (ownerParam === 'true') {
        await handleOwnerAutoJoin();
      } else {
        // For regular users coming from join page, they should already be in the meeting
        // If not, redirect back to join page
        if (!currentUser) {
          router.push(`/join/${meetingId}`);
          return;
        }
      }

      setIsInitializing(false);
    };

    if (meetingId) {
      initializeRoom();
    }
  }, [meetingId, ownerParam, currentUser, meeting]);

  const handleOwnerAutoJoin = async () => {
    try {
      setIsJoining(true);
      setJoinError(null);

      // Get stored owner credentials
      const storedData = UserIdentityManager.getStoredMeetingData(meetingId);
      if (!storedData || !storedData.ownerToken || !storedData.ownerUserId) {
        setJoinError('Owner credentials not found. Please create a new meeting.');
        return;
      }

      const ownerNickname = `Host-${Date.now()}`;
      
      await joinAsOwner(meetingId, ownerNickname, {
        ownerToken: storedData.ownerToken,
        ownerUserId: storedData.ownerUserId
      });

      setNickname(ownerNickname);
    } catch (error) {
      console.error('Owner auto-join failed:', error);
      setJoinError(error instanceof Error ? error.message : 'Failed to join as owner');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinWithNickname = async () => {
    if (!nickname.trim()) {
      setJoinError('Please enter your nickname');
      return;
    }

    const storedPassword = localStorage.getItem(`meeting_${meetingId}_password`);
    if (!storedPassword) {
      setJoinError('No stored password found. Please go back to join page.');
      return;
    }

    try {
      setIsJoining(true);
      setJoinError(null);
      
      await joinMeeting({
        meetingId,
        password: storedPassword,
        nickname: nickname.trim()
      });
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    disconnectAll();
    leaveMeeting();
    router.push('/');
  };

  const handleEndMeeting = () => {
    if (confirm('Are you sure you want to end this meeting for everyone?')) {
      disconnectAll();
      endMeeting();
      router.push('/');
    }
  };

  const handleToggleMute = (participantId?: string) => {
    if (participantId === currentUser?.id || !participantId) {
      toggleAudio();
    }
    toggleMute(participantId);
  };

  // Play audio from remote streams
  useEffect(() => {
    if (audioRef.current && connections.length > 0) {
      const audioElement = audioRef.current;
      const audioContext = new AudioContext();
      const gainNode = audioContext.createGain();
      
      connections.forEach(conn => {
        if (conn.stream) {
          const source = audioContext.createMediaStreamSource(conn.stream);
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
        }
      });
    }
  }, [connections]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing || isJoining) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isInitializing ? 'Initializing room...' : 
             ownerParam === 'true' ? 'Joining as host...' : 'Joining meeting...'}
          </p>
        </div>
      </div>
    );
  }

  // If we need nickname but don't have currentUser (fallback case)
  if (!currentUser && !isJoining) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Join Meeting</h1>
          
          <div className="mb-4">
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Your Nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your nickname"
              maxLength={20}
            />
          </div>

          {joinError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {joinError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleJoinWithNickname}
              disabled={!nickname.trim()}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Join Meeting
            </button>
            
            <button
              onClick={() => router.push(`/join/${meetingId}`)}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Back to Join Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!meeting || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <audio ref={audioRef} autoPlay />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{meeting.name}</h1>
              <p className="text-sm text-gray-600">
                Meeting ID: {meeting.id} • {participants.length} participants
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              
              {currentUser.isHost && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Host
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Voice Conference</h2>
              
              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => handleToggleMute()}
                  className={`p-4 rounded-full text-white ${
                    isAudioEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isAudioEnabled ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {isAudioEnabled ? 'Microphone On' : 'Microphone Off'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {connections.length} peer connections
                  </p>
                </div>
              </div>

              {/* Connection Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Connection Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Local Audio:</span>
                    <span className={localStream ? 'text-green-600' : 'text-red-600'}>
                      {localStream ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Peer Connections:</span>
                    <span className="text-blue-600">{connections.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Participants Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Participants ({participants.length})
            </h2>
            
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`p-3 rounded-lg border ${
                    participant.id === currentUser.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {participant.nickname}
                        {participant.id === currentUser.id && ' (You)'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {participant.isHost && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            Host
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          participant.isConnected 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {participant.isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => participant.isMuted ? null : handleToggleMute(participant.id)}
                        className={`p-2 rounded ${
                          participant.isMuted 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                        }`}
                        disabled={participant.isMuted && !currentUser.isHost && participant.id !== currentUser.id}
                      >
                        {participant.isMuted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Meeting Controls */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <button
                  onClick={handleLeave}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  Leave Meeting
                </button>
                
                {currentUser.isHost && (
                  <button
                    onClick={handleEndMeeting}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                  >
                    End Meeting
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}