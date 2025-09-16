import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/signaling - 发送信令数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, fromParticipant, toParticipant, signalType, signalData } = body;

    if (!meetingId || !fromParticipant || !toParticipant || !signalType || !signalData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store signaling data
    const { data: signal, error } = await supabase
      .from('signaling')
      .insert({
        meeting_id: meetingId,
        from_participant: fromParticipant,
        to_participant: toParticipant,
        signal_type: signalType,
        signal_data: signalData
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing signal:', error);
      return NextResponse.json({ error: 'Failed to send signal' }, { status: 500 });
    }

    return NextResponse.json({ success: true, signalId: signal.id });
  } catch (error) {
    console.error('Error in POST /api/signaling:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/signaling - 获取未处理的信令数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');
    const meetingId = searchParams.get('meetingId');

    if (!participantId || !meetingId) {
      return NextResponse.json({ error: 'Missing participantId or meetingId' }, { status: 400 });
    }

    // Get unprocessed signals for this participant
    const { data: signals, error } = await supabase
      .from('signaling')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('to_participant', participantId)
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching signals:', error);
      return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
    }

    // Mark signals as processed
    if (signals && signals.length > 0) {
      const signalIds = signals.map(s => s.id);
      await supabase
        .from('signaling')
        .update({ processed: true })
        .in('id', signalIds);
    }

    return NextResponse.json({ 
      signals: signals?.map(s => ({
        id: s.id,
        fromParticipant: s.from_participant,
        toParticipant: s.to_participant,
        signalType: s.signal_type,
        signalData: s.signal_data,
        createdAt: s.created_at
      })) || []
    });
  } catch (error) {
    console.error('Error in GET /api/signaling:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}