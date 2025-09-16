'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MeetingRedirectProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MeetingRedirect({ params }: MeetingRedirectProps) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    // Redirect to the correct room path
    router.replace(`/room/${id}`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>重定向中...</p>
      </div>
    </div>
  );
}