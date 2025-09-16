import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ participantId: string }>;
}

// PUT /api/participants/[participantId] - 更新参与者状态
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { participantId } = await params;
    const body = await request.json();
    const { action, isMuted, isConnected } = body;

    let updateData: any = {};

    if (action === 'mute') {
      updateData.is_muted = isMuted;
    } else if (action === 'leave') {
      updateData.is_connected = false;
      updateData.left_at = new Date().toISOString();
    } else if (action === 'reconnect') {
      updateData.is_connected = true;
      updateData.left_at = null;
    } else if (typeof isConnected !== 'undefined') {
      updateData.is_connected = isConnected;
      if (!isConnected) {
        updateData.left_at = new Date().toISOString();
      }
    } else if (typeof isMuted !== 'undefined') {
      updateData.is_muted = isMuted;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 });
    }

    const { data: participant, error } = await supabase
      .from('participants')
      .update(updateData)
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating participant:', error);
      return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 });
    }

    return NextResponse.json({
      participant: {
        id: participant.id,
        nickname: participant.nickname,
        isHost: participant.is_host,
        isMuted: participant.is_muted,
        isConnected: participant.is_connected,
        joinedAt: participant.joined_at,
        leftAt: participant.left_at
      }
    });
  } catch (error) {
    console.error('Error in PUT /api/participants/[participantId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/participants/[participantId] - 删除参与者（离开会议）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { participantId } = await params;

    // Mark participant as disconnected instead of deleting
    const { data: participant, error } = await supabase
      .from('participants')
      .update({ 
        is_connected: false, 
        left_at: new Date().toISOString() 
      })
      .eq('id', participantId)
      .select('meeting_id')
      .single();

    if (error) {
      console.error('Error disconnecting participant:', error);
      return NextResponse.json({ error: 'Failed to leave meeting' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/participants/[participantId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}