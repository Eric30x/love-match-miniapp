Page({
  data: {
    user: null,
    reasons: [],
    metricList: [],
    opener: "哈喽，我是从小程序匹配推荐里看到你的，感觉你还蛮真诚的，想来打个招呼～"
  },

  onLoad(options) {
    if (!options.user) {
      wx.showToast({
        title: '缺少用户信息',
        icon: 'none'
      });
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(options.user));
      const safeUser = this.buildSafeUser(user);
      const reasons = this.generateReasons(safeUser);
      const metricList = this.buildMetricList(safeUser);

      this.setData({
        user: safeUser,
        reasons,
        metricList
      });
    } catch (e) {
      console.error('解析用户失败', e);
      wx.showToast({
        title: '用户信息解析失败',
        icon: 'none'
      });
    }
  },

  buildSafeUser(user = {}) {
    let avatar = user.avatar;

    if (!avatar) {
      if (user.gender === '男') {
        avatar = '/images/avatar/male.jpg';
      } else if (user.gender === '女') {
        avatar = '/images/avatar/female.jpg';
      } else {
        avatar = '/images/avatar/default.jpg';
      }
    }

    return {
      id: user.id || '',
      nickname: user.nickname || '神秘用户',
      age: Number(user.age) || 18,
      gender: user.gender || '',
      orientation: user.orientation || '',
      city: user.city || '未知',
      type: user.type || '未测出类型',
      subType: user.subType || '',
      bio: user.bio || '这个人暂时没有留下自我介绍',
      wechat: user.wechat || '',
      avatar,
      tags: Array.isArray(user.tags) ? user.tags : [],
      similarity: Number(user.similarity) || 0,
      dimensions: user.dimensions || {},
      reasons: Array.isArray(user.reasons) ? user.reasons : [],
      relationshipGoal: user.relationshipGoal || '',
      routine: user.routine || '',
      workStyle: user.workStyle || '',
      analysis: user.analysis || ''
    };
  },

  avatarError() {
    this.setData({
      'user.avatar': '/images/avatar/default.jpg'
    });
  },

  generateReasons(user) {
    const reasons = [];

    if (user.reasons && user.reasons.length) {
      reasons.push(...user.reasons);
    }

    if (user.similarity >= 90) {
      reasons.push('你们属于高匹配区间，可以从轻松聊天开始，慢慢了解彼此。');
    } else if (user.similarity >= 75) {
      reasons.push('整体适配度较高，适合从日常分享中建立熟悉感。');
    } else if (user.similarity >= 60) {
      reasons.push('你们有一定同频点，也许真实交流后会有新的惊喜。');
    } else {
      reasons.push('虽然不是最相似的一类，但也可能存在互补吸引。');
    }

    if (user.type && user.type !== '未测出类型') {
      reasons.push(`Ta 的关系风格偏「${user.type}」`);
    }

    if (user.subType) {
      reasons.push(`Ta 的偏好更接近「${user.subType}」`);
    }

    if (user.relationshipGoal) {
      reasons.push(`当前关系目标：${user.relationshipGoal}`);
    }

    if (user.routine) {
      reasons.push(`作息风格：${user.routine}`);
    }

    return [...new Set(reasons)].slice(0, 5);
  },

  buildMetricList(user) {
    const d = user.dimensions || {};
    const similarity = Number(user.similarity) || 0;

    const personality = Number(d.personality) || Math.max(25, Math.min(100, similarity));
    const interest = Number(d.interest) || Math.max(20, Math.min(100, similarity - 6));
    const resonance = Number(d.resonance) || Math.max(22, Math.min(100, similarity - 8));
    const distance = Number(d.distance) || Math.max(28, Math.min(100, similarity - 4));
    const future = Number(d.future) || Math.max(30, Math.min(100, similarity + 2));

    const normalize = (value) => Math.max(0, Math.min(100, Math.round(value)));

    return [
      {
        label: '人格匹配',
        value: normalize(personality),
        width: `${normalize(personality)}%`
      },
      {
        label: '兴趣匹配',
        value: normalize(interest),
        width: `${normalize(interest)}%`
      },
      {
        label: '共振程度',
        value: normalize(resonance),
        width: `${normalize(resonance)}%`
      },
      {
        label: '现实适配',
        value: normalize(distance),
        width: `${normalize(distance)}%`
      },
      {
        label: '未来一致性',
        value: normalize(future),
        width: `${normalize(future)}%`
      }
    ];
  },

  copyOpener() {
    wx.setClipboardData({
      data: this.data.opener,
      success: () => {
        wx.showToast({
          title: '开场白已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  copyWechat() {
    if (!this.data.user || !this.data.user.wechat) {
      wx.showToast({
        title: '对方暂未公开微信',
        icon: 'none'
      });
      return;
    }

    wx.vibrateShort({ type: 'medium' });

    wx.setClipboardData({
      data: this.data.user.wechat,
      success: () => {
        wx.showToast({
          title: '微信已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  onShareAppMessage() {
    const name = this.data.user?.nickname || '神秘用户';

    return {
      title: `向你推荐一位可能同频的人：${name}`,
      path: '/pages/home/home'
    };
  }
});
