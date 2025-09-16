import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ meetingId: string }>;
}

// GET /api/meetings/[meetingId] - 获取会议信息
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { meetingId } = await params;

    const { data: meeting, error } = await supabase
      .from('active_meetings_with_count')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('is_connected', true);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        name: meeting.name,
        isPublic: meeting.is_public,
        maxParticipants: meeting.max_participants,
        currentParticipants: meeting.current_participants,
        hostId: meeting.host_id,
        createdAt: meeting.created_at,
        participants: participants?.map(p => ({
          id: p.id,
          nickname: p.nickname,
          isHost: p.is_host,
          isMuted: p.is_muted,
          isConnected: p.is_connected,
          joinedAt: p.joined_at
        })) || []
      }
    });
  } catch (error) {
    console.error('Error in GET /api/meetings/[meetingId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/meetings/[meetingId] - 更新会议状态
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { meetingId } = await params;
    const body = await request.json();
    const { action, participantId } = body;

    if (action === 'end') {
      const { error } = await supabase
        .from('meetings')
        .update({ 
          status: 'ended', 
          ended_at: new Date().toISOString() 
        })
        .eq('id', meetingId);

      if (error) {
        console.error('Error ending meeting:', error);
        return NextResponse.json({ error: 'Failed to end meeting' }, { status: 500 });
      }

      // Mark all participants as disconnected
      await supabase
        .from('participants')
        .update({ 
          is_connected: false, 
          left_at: new Date().toISOString() 
        })
        .eq('meeting_id', meetingId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in PUT /api/meetings/[meetingId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}