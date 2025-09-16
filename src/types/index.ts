export interface Meeting {
  id: string;
  name: string;
  password: string;
  isPublic: boolean;
  maxParticipants: number;
  currentParticipants: number;
  hostId: string;
  createdAt: Date;
  participants: Participant[];
}

export interface Participant {
  id: string;
  nickname: string;
  isHost: boolean;
  isMuted: boolean;
  isConnected: boolean;
  joinedAt: Date;
}

export interface CreateMeetingData {
  name: string;
  password: string;
  isPublic: boolean;
  maxParticipants: number;
  ownerUserId?: string;
  ownerToken?: string;
}

export interface JoinMeetingData {
  meetingId: string;
  password: string;
  nickname: string;
}

export interface MeetingState {
  meeting: Meeting | null;
  participants: Participant[];
  currentUser: Participant | null;
  isConnected: boolean;
  error: string | null;
}

export interface WebRTCConnection {
  peerId: string;
  peer: any; // SimplePeer instance
  stream?: MediaStream;
}

export interface SocketEvents {
  'meeting:join': (data: { meetingId: string; password: string; nickname: string }) => void;
  'meeting:leave': (data: { meetingId: string; participantId: string }) => void;
  'meeting:create': (data: CreateMeetingData) => void;
  'meeting:end': (data: { meetingId: string }) => void;
  'participant:mute': (data: { meetingId: string; participantId: string; isMuted: boolean }) => void;
  'meetings:list': () => void;
  'meeting:search': (query: string) => void;
}

// 新增身份验证相关接口
export interface OwnerVerificationData {
  ownerToken: string;
  ownerUserId: string;
}

export interface OwnerVerificationResponse {
  isOwner: boolean;
  hostId?: string;
}