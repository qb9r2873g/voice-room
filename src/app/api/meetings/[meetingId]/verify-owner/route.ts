import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ meetingId: string }>;
}

// POST /api/meetings/[meetingId]/verify-owner - 验证创建者身份
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { meetingId } = await params;
    const body = await request.json();
    const { ownerToken, ownerUserId } = body;

    if (!ownerToken || !ownerUserId) {
      return NextResponse.json({ error: 'Missing owner credentials' }, { status: 400 });
    }

    // 从数据库查询会议的创建者信息
    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('owner_token, owner_user_id, host_id')
      .eq('id', meetingId)
      .eq('status', 'active')
      .single();

    if (error || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // 验证创建者令牌和用户ID
    const isValidOwner = meeting.owner_token === ownerToken && 
                        meeting.owner_user_id === ownerUserId;

    if (!isValidOwner) {
      return NextResponse.json({ error: 'Invalid owner credentials' }, { status: 403 });
    }

    return NextResponse.json({ 
      isOwner: true,
      hostId: meeting.host_id 
    });
  } catch (error) {
    console.error('Error in POST /api/meetings/[meetingId]/verify-owner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}