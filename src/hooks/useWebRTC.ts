'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { WebRTCConnection } from '@/types';

interface UseWebRTCProps {
  meetingId: string;
  participantId: string;
  onStreamReceived?: (stream: MediaStream, peerId: string) => void;
  onStreamEnded?: (peerId: string) => void;
}

export function useWebRTC({ meetingId, participantId, onStreamReceived, onStreamEnded }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connections, setConnections] = useState<Map<string, WebRTCConnection>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const localStreamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, WebRTCConnection>>(new Map());
  const signalingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false // For voice-only chat room
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Enable audio by default
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioEnabled;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, [isAudioEnabled]);

  // Send signaling data
  const sendSignal = useCallback(async (toParticipant: string, signalType: string, signalData: any) => {
    try {
      await fetch('/api/signaling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          fromParticipant: participantId,
          toParticipant,
          signalType,
          signalData,
        }),
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  }, [meetingId, participantId]);

  // Poll for incoming signals
  const pollSignals = useCallback(async () => {
    try {
      const response = await fetch(`/api/signaling?participantId=${participantId}&meetingId=${meetingId}`);
      if (response.ok) {
        const { signals } = await response.json();
        
        for (const signal of signals) {
          const { fromParticipant, signalType, signalData } = signal;
          
          if (signalType === 'offer') {
            // Handle incoming offer
            const peer = createPeerConnection(fromParticipant, false);
            if (peer) {
              peer.signal(signalData);
            }
          } else if (signalType === 'answer') {
            // Handle answer
            const connection = connectionsRef.current.get(fromParticipant);
            if (connection?.peer) {
              connection.peer.signal(signalData);
            }
          } else if (signalType === 'ice-candidate') {
            // Handle ICE candidate
            const connection = connectionsRef.current.get(fromParticipant);
            if (connection?.peer) {
              connection.peer.signal(signalData);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error polling signals:', error);
    }
  }, [meetingId, participantId]);

  // Create peer connection
  const createPeerConnection = useCallback((peerId: string, initiator: boolean = false) => {
    if (!localStreamRef.current) return null;

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          // 腾讯云 STUN 服务器 (中国大陆友好)
          { urls: 'stun:stun.tencent-cloud.com:3478' },
          { urls: 'stun:stun.qq.com:3478' },
          
          // 阿里云 STUN 服务器 (中国大陆友好)  
          { urls: 'stun:stun.aliyun.com:3478' },
          
          // 国际通用 STUN 服务器
          { urls: 'stun:stun.relay.metered.ca:80' },
          { urls: 'stun:stun.stunprotocol.org:3478' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          
          // Google STUN 服务器 (备用，可能在中国大陆不可用)
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      }
    });

    const connection: WebRTCConnection = {
      peerId,
      peer
    };

    peer.on('signal', (data) => {
      console.log('Sending signal to peer', peerId, data);
      
      let signalType = 'ice-candidate';
      if (data.type === 'offer') signalType = 'offer';
      else if (data.type === 'answer') signalType = 'answer';
      
      sendSignal(peerId, signalType, data);
    });

    peer.on('stream', (stream) => {
      console.log('Received stream from peer', peerId);
      connection.stream = stream;
      onStreamReceived?.(stream, peerId);
    });

    peer.on('error', (error) => {
      console.error('Peer connection error:', error);
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', peerId);
      onStreamEnded?.(peerId);
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(peerId);
        connectionsRef.current = newConnections;
        return newConnections;
      });
    });

    setConnections(prev => {
      const newConnections = new Map(prev);
      newConnections.set(peerId, connection);
      connectionsRef.current = newConnections;
      return newConnections;
    });

    return peer;
  }, [sendSignal, onStreamReceived, onStreamEnded]);

  // Connect to a peer
  const connectToPeer = useCallback((peerId: string) => {
    return createPeerConnection(peerId, true);
  }, [createPeerConnection]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Disconnect from a peer
  const disconnectFromPeer = useCallback((peerId: string) => {
    const connection = connectionsRef.current.get(peerId);
    if (connection?.peer) {
      connection.peer.destroy();
    }
    
    setConnections(prev => {
      const newConnections = new Map(prev);
      newConnections.delete(peerId);
      connectionsRef.current = newConnections;
      return newConnections;
    });
  }, []);

  // Disconnect from all peers
  const disconnectAll = useCallback(() => {
    connectionsRef.current.forEach((connection) => {
      if (connection.peer) {
        connection.peer.destroy();
      }
    });
    
    setConnections(new Map());
    connectionsRef.current = new Map();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
      signalingIntervalRef.current = null;
    }
  }, []);

  // Initialize stream and start signaling polling
  useEffect(() => {
    if (!participantId || !meetingId) return;

    initializeLocalStream().catch(console.error);
    
    // Start polling for signals
    signalingIntervalRef.current = setInterval(pollSignals, 2000); // Poll every 2 seconds
    
    return () => {
      disconnectAll();
    };
  }, [meetingId, participantId, initializeLocalStream, pollSignals, disconnectAll]);

  return {
    localStream,
    connections: Array.from(connections.values()),
    isAudioEnabled,
    initializeLocalStream,
    connectToPeer,
    toggleAudio,
    disconnectFromPeer,
    disconnectAll
  };
}