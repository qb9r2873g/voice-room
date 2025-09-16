import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET /api/meetings - 获取公开的活跃会议列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = supabase
      .from('active_meetings_with_count')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    return NextResponse.json({ meetings: meetings || [] });
  } catch (error) {
    console.error('Error in GET /api/meetings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/meetings - 创建新会议
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password, isPublic, maxParticipants = 6 } = body;

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        name,
        password_hash: passwordHash,
        is_public: isPublic,
        max_participants: maxParticipants,
        host_id: 'temp-host-id' // Will be updated when host joins
      })
      .select()
      .single();

    if (meetingError) {
      console.error('Error creating meeting:', meetingError);
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