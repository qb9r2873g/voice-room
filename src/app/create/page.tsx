'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { useMeeting } from '@/contexts/MeetingContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const createMeetingSchema = z.object({
  name: z.string().min(1, '会议名称不能为空').max(50, '会议名称不能超过50个字符'),
  password: z.string().min(4, '密码至少4位').max(20, '密码不能超过20位'),
  isPublic: z.boolean()
});

type CreateMeetingForm = z.infer<typeof createMeetingSchema>;

export default function CreateMeetingPage() {
  const router = useRouter();
  const { createMeeting } = useMeeting();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = useForm<CreateMeetingForm>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      name: '',
      password: '',
      isPublic: true
    }
  });

  const isPublic = watch('isPublic');

  const onSubmit = async (data: CreateMeetingForm) => {
    try {
      setLoading(true);
      const meetingId = await createMeeting({
        ...data,
        maxParticipants: 6 // 默认设置为6人
      });
      // 存储会议密码到 localStorage
      localStorage.setItem(`meeting_${meetingId}_password`, data.password);
      
      // 创建者直接加入会议，无需密码验证
      router.push(`/room/${meetingId}?owner=true`);
    } catch (error) {
      console.error('Failed to create meeting:', error);
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
              <h1 className="text-2xl font-bold text-gray-900">创建会议</h1>
              <p className="text-gray-600 text-sm mt-1">设置你的语音聊天室</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Meeting Name */}
            <div>
              <Input
                label="会议名称"
                placeholder="输入会议名称..."
                {...register('name')}
                error={errors.name?.message}
                helperText="其他用户将看到这个名称"
              />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Input
                  label="会议密码"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="设置会议密码..."
                  {...register('password')}
                  error={errors.password?.message}
                  helperText="用户需要输入密码才能加入会议"
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

            {/* Public/Private */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                会议可见性
              </label>
              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        className="sr-only"
                      />
                      <div className={`border rounded-lg p-4 transition-colors ${
                        field.value === true
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">公开会议</div>
                            <div className="text-sm text-gray-600">在首页显示，任何人都可以发现</div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        className="sr-only"
                      />
                      <div className={`border rounded-lg p-4 transition-colors ${
                        field.value === false
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium text-gray-900">私人会议</div>
                            <div className="text-sm text-gray-600">只能通过会议号加入</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Meeting Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">会议设置</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 最大参与人数：6人</li>
                <li>• 支持语音通话</li>
                <li>• 主持人可以管理参与者</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '创建中...' : '创建会议'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}