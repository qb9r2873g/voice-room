'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useMeeting } from '@/contexts/MeetingContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const joinMeetingSchema = z.object({
  nickname: z.string().min(1, '昵称不能为空').max(20, '昵称不能超过20个字符'),
  password: z.string().min(1, '密码不能为空')
});

type JoinMeetingForm = z.infer<typeof joinMeetingSchema>;

interface JoinMeetingPageProps {
  params: Promise<{
    meetingId: string;
  }>;
}

export default function JoinMeetingPage({ params }: JoinMeetingPageProps) {
  const router = useRouter();
  const { joinMeeting, error } = useMeeting();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { meetingId } = use(params);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<JoinMeetingForm>({
    resolver: zodResolver(joinMeetingSchema),
    defaultValues: {
      nickname: '',
      password: ''
    }
  });

  const onSubmit = async (data: JoinMeetingForm) => {
    try {
      setLoading(true);
      await joinMeeting({
        meetingId,
        password: data.password,
        nickname: data.nickname
      });
      router.push(`/room/${meetingId}`);
    } catch (error) {
      console.error('Failed to join meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack} className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">加入会议</h1>
              <p className="text-gray-600 text-sm mt-1">会议号: {meetingId}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Meeting Info */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              准备加入会议
            </h2>
            <p className="text-gray-600">
              请设置你的昵称并输入会议密码
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Join Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nickname */}
            <div>
              <div className="relative">
                <Input
                  label="昵称"
                  placeholder="输入你在会议中的昵称..."
                  {...register('nickname')}
                  error={errors.nickname?.message}
                  helperText="其他参与者将看到这个昵称"
                />
                <div className="absolute right-3 top-8 text-gray-400">
                  <User className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Input
                  label="会议密码"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="输入会议密码..."
                  {...register('password')}
                  error={errors.password?.message}
                  helperText="请向会议主持人获取密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '加入中...' : '加入会议'}
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              遇到问题？请确保你有正确的会议密码
            </p>
            <Button
              variant="outline"
              onClick={handleBack}
              className="mt-2"
            >
              返回首页
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}