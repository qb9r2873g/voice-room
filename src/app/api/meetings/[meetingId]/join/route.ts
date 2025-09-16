import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{ meetingId: string }>;
}

// POST /api/meetings/[meetingId]/join - 加入会议
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { meetingId } = await params;
    const body = await request.json();
    const { nickname, password, isOwner, ownerToken, ownerUserId } = body;

    if (!nickname || !password) {
      return NextResponse.json({ error: 'Nickname and password are required' }, { status: 400 });
    }

    // Get meeting and verify password
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .eq('status', 'active')
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found or has ended' }, { status: 404 });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, meeting.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // If claiming to be owner, verify credentials
    let verifiedAsOwner = false;
    if (isOwner && ownerToken && ownerUserId) {
      // Verify owner token and user ID
      const tokenMatch = await bcrypt.compare(ownerToken, meeting.owner_token);
      const userIdMatch = ownerUserId === meeting.owner_user_id;
      
      if (tokenMatch && userIdMatch) {
        verifiedAsOwner = true;
      } else {
        return NextResponse.json({ error: 'Invalid owner credentials' }, { status: 401 });
      }
    }

    // Check if meeting is full
    const { data: currentParticipants, error: participantCountError } = await supabase
      .from('participants')
      .select('id')
      .eq('meeting_id', meetingId)
      .eq('is_connected', true);

    if (participantCountError) {
      console.error('Error checking participant count:', participantCountError);
      return NextResponse.json({ error: 'Failed to check meeting capacity' }, { status: 500 });
    }

    if (currentParticipants && currentParticipants.length >= meeting.max_participants) {
      return NextResponse.json({ error: 'Meeting is full' }, { status: 400 });
    }

    // Determine if this participant should be the host
    // Owner is always host, otherwise first participant is host
    const isHost = verifiedAsOwner || (!currentParticipants || currentParticipants.length === 0);

    // Create participant
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        meeting_id: meetingId,
        nickname,
        is_host: isHost,
        is_muted: false,
        is_connected: true
      })
      .select()
      .single();

    if (participantError) {
      console.error('Error creating participant:', participantError);
      return NextResponse.json({ error: 'Failed to join meeting' }, { status: 500 });
    }

    // Update meeting host_id if this is the host
    if (isHost) {
      await supabase
        .from('meetings')
        .update({ host_id: participant.id })
        .eq('id', meetingId);
    }

    return NextResponse.json({
      participant: {
        id: participant.id,
        nickname: participant.nickname,
        isHost: participant.is_host,
        isMuted: participant.is_muted,
        isConnected: participant.is_connected,
        joinedAt: participant.joined_at
      },
      meeting: {
        id: meeting.id,
        name: meeting.name,
        isPublic: meeting.is_public,
        maxParticipants: meeting.max_participants,
        hostId: isHost ? participant.id : meeting.host_id,
        createdAt: meeting.created_at
      }
    });
  } catch (error) {
    console.error('Error in POST /api/meetings/[meetingId]/join:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}