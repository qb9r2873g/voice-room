'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Users, Lock } from 'lucide-react';
import { useMeeting } from '@/contexts/MeetingContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Meeting } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { getPublicMeetings, searchMeetings } = useMeeting();
  const [searchQuery, setSearchQuery] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const publicMeetings = await getPublicMeetings();
      setMeetings(publicMeetings);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchMeetings(query);
        setMeetings(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      loadMeetings();
    }
  };

  const handleJoinMeeting = (meetingId: string) => {
    router.push(`/join/${meetingId}`);
  };

  const handleCreateMeeting = () => {
    router.push('/create');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voice Room</h1>
              <p className="text-gray-600 mt-1">匿名语音聊天室</p>
            </div>
            <Button onClick={handleCreateMeeting} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              创建会议
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="搜索会议名称或会议号..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {searchQuery ? '搜索结果' : '正在进行的公开会议'}
            </h2>
            {!searchQuery && (
              <Button variant="outline" onClick={loadMeetings}>
                刷新
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">加载中...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {searchQuery ? '未找到匹配的会议' : '暂无进行中的公开会议'}
              </h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? '尝试其他搜索关键词' : '创建一个新会议开始聊天吧'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateMeeting} className="mt-4">
                  创建会议
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {meeting.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        会议号: {meeting.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {meeting.currentParticipants}/{meeting.maxParticipants}
                      </span>
                    </div>
                    <div className="text-xs">
                      {new Date(meeting.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleJoinMeeting(meeting.id)}
                    className="w-full"
                    disabled={meeting.currentParticipants >= meeting.maxParticipants}
                  >
                    {meeting.currentParticipants >= meeting.maxParticipants
                      ? '会议已满'
                      : '加入会议'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
