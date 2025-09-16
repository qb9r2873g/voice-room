# ICE 服务器配置说明

## 关于 ICE 服务器

WebRTC 需要 ICE (Interactive Connectivity Establishment) 服务器来帮助建立点对点连接，特别是在 NAT (Network Address Translation) 环境下。

## 当前配置的服务器

### 1. 中国大陆友好的 STUN 服务器

#### 腾讯云 STUN 服务器
- `stun:stun.tencent-cloud.com:3478`
- `stun:stun.qq.com:3478`
- **状态**: 免费，在中国大陆可用
- **推荐指数**: ⭐⭐⭐⭐⭐

#### 阿里云 STUN 服务器
- `stun:stun.aliyun.com:3478`
- **状态**: 免费，在中国大陆可用
- **推荐指数**: ⭐⭐⭐⭐⭐

### 2. 国际通用 STUN 服务器

#### Metered STUN 服务器
- `stun:stun.relay.metered.ca:80`
- **状态**: 免费套餐可用
- **全球可用性**: 很好
- **推荐指数**: ⭐⭐⭐⭐

#### STUN Protocol 标准服务器
- `stun:stun.stunprotocol.org:3478`
- **状态**: 免费，全球可用
- **推荐指数**: ⭐⭐⭐⭐

#### Cloudflare STUN 服务器
- `stun:stun.cloudflare.com:3478`
- **状态**: 免费，全球可用
- **在中国大陆**: 相对稳定
- **推荐指数**: ⭐⭐⭐⭐

### 3. Google STUN 服务器 (备用)

- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- **状态**: 免费
- **中国大陆可用性**: ❌ 不稳定，经常被阻断
- **推荐指数**: ⭐⭐

## 服务器选择策略

### 自动故障转移
WebRTC 会自动尝试列表中的服务器，如果一个服务器不可用，会尝试下一个。我们的配置顺序：

1. **优先使用中国大陆友好的服务器** (腾讯云、阿里云)
2. **备用国际通用服务器** (Metered、STUN Protocol、Cloudflare)
3. **最后尝试 Google 服务器** (可能在中国大陆不可用)

### 性能优化配置

```javascript
config: {
  iceServers: [...],
  iceCandidatePoolSize: 10  // 预生成更多 ICE 候选者，提高连接成功率
}
```

## 地区使用建议

### 中国大陆用户
- ✅ 腾讯云和阿里云服务器应该是最稳定的选择
- ✅ Cloudflare 通常也能正常工作
- ⚠️ Google 服务器可能无法访问

### 国际用户
- ✅ 所有配置的服务器都应该可以正常工作
- ✅ Google 服务器通常是最快的选择

### 企业网络环境
- ⚠️ 某些企业防火墙可能阻止 STUN 流量
- 💡 可能需要配置 TURN 服务器作为中继

## 高级配置选项

### TURN 服务器配置 (需要付费服务)

如果 STUN 服务器不足以建立连接，可以添加 TURN 服务器：

```javascript
{
  urls: 'turn:your-turn-server.com:3478',
  username: 'your-username',
  credential: 'your-password'
}
```

#### 推荐的 TURN 服务提供商：

1. **Xirsys** - 专业 WebRTC 服务
2. **Twilio** - 提供 STUN/TURN 服务
3. **Metered** - 免费套餐 + 付费升级
4. **腾讯云实时音视频** - 中国大陆用户的好选择

### 环境变量配置

可以通过环境变量动态配置 ICE 服务器：

```env
# .env.local
NEXT_PUBLIC_STUN_SERVERS=stun:stun.tencent-cloud.com:3478,stun:stun.aliyun.com:3478
NEXT_PUBLIC_TURN_SERVER_URL=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=your-username
NEXT_PUBLIC_TURN_CREDENTIAL=your-password
```

## 故障排除

### 连接失败的常见原因

1. **防火墙阻止**
   - 检查网络防火墙设置
   - 确保允许 UDP 流量

2. **服务器不可用**
   - 在浏览器控制台查看 WebRTC 连接日志
   - 尝试不同的 STUN 服务器

3. **复杂网络环境**
   - 某些企业网络需要 TURN 服务器
   - 考虑使用付费的 TURN 服务

### 测试 STUN 服务器

可以使用在线工具测试 STUN 服务器的可用性：
- [WebRTC Troubleshooter](https://test.webrtc.org/)
- [STUN Server Test](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)

## 成本考虑

### 免费资源限制
- **STUN 服务器**: 通常完全免费
- **TURN 服务器**: 通常按流量或时长收费

### 付费升级建议
如果应用有以下需求，建议考虑付费 TURN 服务：
- 企业级可靠性要求
- 复杂网络环境下的连接保证
- 大量用户并发连接

## 监控和日志

### WebRTC 连接状态监控

```javascript
peer.on('error', (error) => {
  console.error('WebRTC Error:', error);
  // 可以发送到监控服务
});

peer.on('connect', () => {
  console.log('WebRTC Connected successfully');
});
```

### 推荐的监控指标
- 连接成功率
- 连接建立时间
- 音频质量指标
- 断线重连次数

---

**注意**: ICE 服务器的可用性可能随时间变化，建议定期测试和更新配置。