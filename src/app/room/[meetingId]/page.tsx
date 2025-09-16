'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users, 
  Settings,
  MoreVertical,
  Crown,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useMeeting } from '@/contexts/MeetingContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Button } from '@/components/ui/Button';
import { Participant } from '@/types';

interface MeetingRoomPageProps {
  params: Promise<{
    meetingId: string;
  }>;
}

export default function MeetingRoomPage({ params }: MeetingRoomPageProps) {
  const router = useRouter();
  const { meetingId } = use(params);
  const { 
    meeting, 
    participants, 
    currentUser, 
    isConnected,
    leaveMeeting, 
    endMeeting,
    toggleMute 
  } = useMeeting();

  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const {
    localStream,
    isAudioEnabled,
    toggleAudio,
    disconnectAll
  } = useWebRTC({
    meetingId,
    participantId: currentUser?.id || '',
    onStreamReceived: (stream, peerId) => {
      setRemoteStreams(prev => new Map(prev.set(peerId, stream)));
      
      // Play remote audio
      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      audioRefs.current.set(peerId, audio);
    },
    onStreamEnded: (peerId) => {
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(peerId);
        return newStreams;
      });
      
      const audio = audioRefs.current.get(peerId);
      if (audio) {
        audio.pause();
        audioRefs.current.delete(peerId);
      }
    }
  });

  const [showParticipants, setShowParticipants] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected && !meeting) {
      router.push('/');
    }
  }, [isConnected, meeting, router]);

  const handleLeave = () => {
    disconnectAll();
    leaveMeeting();
    router.push('/');
  };

  const handleEndMeeting = () => {
    disconnectAll();
    endMeeting();
    router.push('/');
  };

  const handleToggleMute = () => {
    toggleAudio();
    if (currentUser) {
      toggleMute(currentUser.id);
    }
  };

  const handleMuteParticipant = (participantId: string) => {
    if (currentUser?.isHost) {
      toggleMute(participantId);
    }
  };

  const getParticipantInitials = (nickname: string) => {
    return nickname.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!meeting || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>连接中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{meeting.name}</h1>
            <p className="text-sm text-gray-400">会议号: {meeting.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <Users className="w-4 h-4" />
              <span>{participants.length}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Participants Grid */}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center relative"
                >
                  {/* Host Crown */}
                  {participant.isHost && (
                    <div className="absolute top-2 left-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                    </div>
                  )}

                  {/* Participant Avatar */}
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl font-semibold">
                      {getParticipantInitials(participant.nickname)}
                    </span>
                  </div>

                  {/* Participant Info */}
                  <h3 className="text-lg font-medium text-center mb-2">
                    {participant.nickname}
                    {participant.id === currentUser.id && (
                      <span className="text-sm text-gray-400 ml-2">(你)</span>
                    )}
                  </h3>

                  {/* Audio Status */}
                  <div className="flex items-center gap-2">
                    {participant.isMuted ? (
                      <MicOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Mic className="w-4 h-4 text-green-400" />
                    )}
                    
                    {/* Audio indicator for remote streams */}
                    {participant.id !== currentUser.id && remoteStreams.has(participant.id) && (
                      <Volume2 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>

                  {/* Host Controls */}
                  {currentUser.isHost && participant.id !== currentUser.id && (
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMuteParticipant(participant.id)}
                        className="p-1 bg-gray-700 border-gray-600 hover:bg-gray-600"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center justify-center gap-4">
              {/* Mute/Unmute */}
              <Button
                onClick={handleToggleMute}
                className={`w-12 h-12 rounded-full ${
                  isAudioEnabled 
                    ? 'bg-gray-600 hover:bg-gray-500' 
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </Button>

              {/* Leave Meeting */}
              <Button
                onClick={handleLeave}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>

              {/* End Meeting (Host only) */}
              {currentUser.isHost && (
                <Button
                  onClick={handleEndMeeting}
                  variant="danger"
                  className="px-4 py-2"
                >
                  结束会议
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">
              参与者 ({participants.length}/{meeting.maxParticipants})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {getParticipantInitials(participant.nickname)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {participant.nickname}
                        {participant.id === currentUser.id && (
                          <span className="text-xs text-gray-400 ml-1">(你)</span>
                        )}
                      </p>
                      {participant.isHost && (
                        <p className="text-xs text-yellow-400">主持人</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.isMuted ? (
                      <MicOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Mic className="w-4 h-4 text-green-400" />
                    )}
                    {participant.isHost && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio elements for remote streams */}
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <audio
          key={peerId}
          ref={(el) => {
            if (el) {
              el.srcObject = stream;
              el.autoplay = true;
            }
          }}
          style={{ display: 'none' }}
        />
      ))}
    </div>
  );
}