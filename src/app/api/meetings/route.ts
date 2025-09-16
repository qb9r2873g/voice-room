import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

// 生成会议ID
function generateMeetingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/meetings - 创建新会议
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password, isPublic, maxParticipants, ownerToken, ownerUserId } = body;

    // 验证必需的身份信息
    if (!ownerToken || !ownerUserId) {
      return NextResponse.json({ error: 'Missing owner authentication' }, { status: 400 });
    }

    // 验证请求参数
    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    if (maxParticipants && (maxParticipants < 2 || maxParticipants > 10)) {
      return NextResponse.json({ error: 'Max participants must be between 2 and 10' }, { status: 400 });
    }

    // 生成唯一的会议ID
    let meetingId = generateMeetingId();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existingMeeting } = await supabase
        .from('meetings')
        .select('id')
        .eq('id', meetingId)
        .single();

      if (!existingMeeting) {
        break;
      }

      meetingId = generateMeetingId();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique meeting ID' }, { status: 500 });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建会议
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        id: meetingId,
        name,
        password_hash: passwordHash,
        is_public: isPublic !== false, // 默认为公开
        max_participants: maxParticipants || 6,
        owner_token: ownerToken,
        owner_user_id: ownerUserId,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting:', error);
      return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        name: meeting.name,
        isPublic: meeting.is_public,
        maxParticipants: meeting.max_participants,
        createdAt: meeting.created_at
      }
    });
  } catch (error) {
    console.error('Error in POST /api/meetings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/meetings - 获取公开会议列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = supabase
      .from('active_meetings_with_count')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // 如果有搜索参数，添加搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    const formattedMeetings = meetings?.map(meeting => ({
      id: meeting.id,
      name: meeting.name,
      isPublic: meeting.is_public,
      maxParticipants: meeting.max_participants,
      currentParticipants: meeting.current_participants,
      createdAt: meeting.created_at
    })) || [];

    return NextResponse.json({ meetings: formattedMeetings });
  } catch (error) {
    console.error('Error in GET /api/meetings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}