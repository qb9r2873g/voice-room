// 用户身份管理工具
export class UserIdentityManager {
  private static readonly USER_ID_KEY = 'voice_room_user_id';
  private static readonly OWNER_TOKENS_KEY = 'voice_room_owner_tokens';

  // 生成唯一用户ID
  static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取或创建用户ID
  static getUserId(): string {
    if (typeof window === 'undefined') return '';
    
    let userId = localStorage.getItem(this.USER_ID_KEY);
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
    return userId;
  }

  // 生成创建者令牌
  static generateOwnerToken(meetingId: string): string {
    const userId = this.getUserId();
    const timestamp = Date.now();
    const token = `owner_${meetingId}_${userId}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 存储令牌到localStorage
    const tokens = this.getOwnerTokens();
    tokens[meetingId] = token;
    localStorage.setItem(this.OWNER_TOKENS_KEY, JSON.stringify(tokens));
    
    return token;
  }

  // 获取创建者令牌
  static getOwnerToken(meetingId: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const tokens = this.getOwnerTokens();
    return tokens[meetingId] || null;
  }

  // 获取所有创建者令牌
  private static getOwnerTokens(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    
    try {
      const tokens = localStorage.getItem(this.OWNER_TOKENS_KEY);
      return tokens ? JSON.parse(tokens) : {};
    } catch {
      return {};
    }
  }

  // 清除特定会议的令牌
  static clearOwnerToken(meetingId: string): void {
    if (typeof window === 'undefined') return;
    
    const tokens = this.getOwnerTokens();
    delete tokens[meetingId];
    localStorage.setItem(this.OWNER_TOKENS_KEY, JSON.stringify(tokens));
  }

  // 验证是否为会议创建者
  static isOwner(meetingId: string): boolean {
    return this.getOwnerToken(meetingId) !== null;
  }

  // 获取存储的会议数据
  static getStoredMeetingData(meetingId: string): { ownerToken: string; ownerUserId: string } | null {
    if (typeof window === 'undefined') return null;
    
    const ownerToken = this.getOwnerToken(meetingId);
    const ownerUserId = this.getUserId();
    
    if (ownerToken && ownerUserId) {
      return { ownerToken, ownerUserId };
    }
    
    return null;
  }
}