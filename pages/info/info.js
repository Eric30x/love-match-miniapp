Page({
  data: {
    nickname: '',
    age: '',
    gender: '',
    orientation: '',
    city: '',
    education: '',
    wechat: '',
    bio: '',

    relationshipGoal: '',
    longDistance: '',
    routine: '',
    workStyle: '',
    preferredAgeMin: '',
    preferredAgeMax: '',

    ageRange: Array.from({ length: 73 }, (_, i) => i + 18),
    educationRange: ['高中及以下', '大专', '本科', '硕士', '博士及以上'],
    genderRange: ['男', '女', '其他'],
    orientationRange: ['男', '女', '都可以'],
    relationshipGoalRange: ['认真恋爱', '以结婚为前提', '先认识再看', '轻社交慢了解'],
    longDistanceRange: ['接受', '短期接受', '不接受'],
    routineRange: ['早睡早起', '规律作息', '偏夜猫子', '不固定'],
    workStyleRange: ['未工作','基本不加班', '偶尔加班', '经常加班', '时间不固定'],

    canSubmit: false
  },
  onLoad() {
    this.loadExistingUser();
  },
  async loadExistingUser() {
    try {
      const db = wx.cloud.database();
  
      const loginRes = await wx.cloud.callFunction({
        name: 'getOpenid'
      });
  
      const openid = loginRes?.result?.openid;
      if (!openid) return;
  
      const userRes = await db.collection('users')
        .where({
          _openid: openid
        })
        .limit(1)
        .get();
  
      if (!userRes.data.length) return;
  
      const user = userRes.data[0];
  
      this.setData({
        nickname: user.nickname || '',
        age: user.age || '',
        gender: user.gender || '',
        orientation: user.orientation || '',
        city: user.city || '',
        education: user.education || '',
        wechat: user.wechat || '',
        bio: user.bio || '',
        relationshipGoal: user.relationshipGoal || '',
        longDistance: user.longDistance || '',
        routine: user.routine || '',
        workStyle: user.workStyle || '',
        preferredAgeMin: user.preferredAgeRange?.min || '',
        preferredAgeMax: user.preferredAgeRange?.max || ''
      }, () => {
        this.checkCanSubmit();
      });
  
      wx.setStorageSync('openid', openid);
      wx.setStorageSync('userId', user._id);
      wx.setStorageSync('userInfo', user);
    } catch (err) {
      console.error('读取已有用户资料失败', err);
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value || '';

    if (field === 'nickname') value = value.slice(0, 20);
    if (field === 'city') value = value.slice(0, 20);
    if (field === 'wechat') value = value.slice(0, 30);
    if (field === 'bio') value = value.slice(0, 200);

    this.setData({ [field]: value }, this.checkCanSubmit);
  },

  onAgeChange(e) {
    const age = this.data.ageRange[e.detail.value];
    this.setData({ age }, this.checkCanSubmit);
  },

  onGenderChange(e) {
    const orientation = this.data.orientationRange[e.detail.value];
    this.setData({ gender: e.detail.value }, this.checkCanSubmit);
  },
  onOrientationChange(e) {
    const orientation = this.data.orientationRange[e.detail.value];
    this.setData({ orientation: e.detail.value  }, this.checkCanSubmit);
  },

  onEducationChange(e) {
    const education = this.data.educationRange[e.detail.value];
    this.setData({ education }, this.checkCanSubmit);
  },

  onRelationshipGoalChange(e) {
    const relationshipGoal = this.data.relationshipGoalRange[e.detail.value];
    this.setData({ relationshipGoal }, this.checkCanSubmit);
  },

  onLongDistanceChange(e) {
    const longDistance = this.data.longDistanceRange[e.detail.value];
    this.setData({ longDistance }, this.checkCanSubmit);
  },

  onRoutineChange(e) {
    const routine = this.data.routineRange[e.detail.value];
    this.setData({ routine }, this.checkCanSubmit);
  },

  onWorkStyleChange(e) {
    const workStyle = this.data.workStyleRange[e.detail.value];
    this.setData({ workStyle }, this.checkCanSubmit);
  },

  onPreferredAgeMinChange(e) {
    const preferredAgeMin = this.data.ageRange[e.detail.value];
    this.setData({ preferredAgeMin }, this.checkCanSubmit);
  },

  onPreferredAgeMaxChange(e) {
    const preferredAgeMax = this.data.ageRange[e.detail.value];
    this.setData({ preferredAgeMax }, this.checkCanSubmit);
  },

  checkCanSubmit() {
    const {
      nickname,
      age,
      gender,
      orientation,
      relationshipGoal,
      longDistance,
      routine,
      workStyle
    } = this.data;

    const can =
      typeof nickname === 'string' &&
      nickname.trim().length >= 2 &&
      Number(age) >= 18 &&
      !!gender &&
      !!orientation &&
      !!relationshipGoal &&
      !!longDistance &&
      !!routine &&
      !!workStyle;

    this.setData({ canSubmit: can });
  },

  validateForm() {
    const {
      nickname,
      age,
      gender,
      orientation,
      city,
      wechat,
      bio,
      relationshipGoal,
      longDistance,
      routine,
      workStyle,
      preferredAgeMin,
      preferredAgeMax
    } = this.data;

    if (!nickname || nickname.trim().length < 2) {
      wx.showToast({ title: '昵称至少2个字', icon: 'none' });
      return false;
    }

    if (!age || Number(age) < 18) {
      wx.showToast({ title: '请选择合法年龄', icon: 'none' });
      return false;
    }

    if (!gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return false;
    }
    if (!orientation) {
      wx.showToast({ title: '请选择想匹配的性别', icon: 'none' });
      return false;
    }
    if (!relationshipGoal) {
      wx.showToast({ title: '请选择婚恋目标', icon: 'none' });
      return false;
    }

    if (!longDistance) {
      wx.showToast({ title: '请选择是否接受异地', icon: 'none' });
      return false;
    }

    if (!routine) {
      wx.showToast({ title: '请选择作息类型', icon: 'none' });
      return false;
    }

    if (!workStyle) {
      wx.showToast({ title: '请选择工作节奏', icon: 'none' });
      return false;
    }

    if (city && city.trim().length > 20) {
      wx.showToast({ title: '城市信息过长', icon: 'none' });
      return false;
    }


    if (bio && bio.trim().length > 200) {
      wx.showToast({ title: '自我介绍请控制在200字内', icon: 'none' });
      return false;
    }

    if (preferredAgeMin && preferredAgeMax && Number(preferredAgeMin) > Number(preferredAgeMax)) {
      wx.showToast({ title: '理想年龄范围不正确', icon: 'none' });
      return false;
    }

    return true;
  },

  async submitInfo() {
    let avatar = '/images/avatar/default.png';

    if (this.data.gender === '男') {
  avatar = '/images/avatar/male.png';
    } else if (this.data.gender === '女') {
       avatar = '/images/avatar/female.png';
    }
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请先完善必填信息', icon: 'none' });
      return;
    }
  
    if (!this.validateForm()) return;
  
    const db = wx.cloud.database();
  
    const userInfo = {
      nickname: this.data.nickname.trim(),
      age: Number(this.data.age),
      gender: this.data.gender,
      orientation: this.data.orientation,
      avatar: avatar,
      city: (this.data.city || '').trim(),
      education: this.data.education || '',
      wechat: (this.data.wechat || '').trim(),
      bio: (this.data.bio || '').trim(),
      relationshipGoal: this.data.relationshipGoal,
      longDistance: this.data.longDistance,
      routine: this.data.routine,
      workStyle: this.data.workStyle,
      preferredAgeRange: {
        min: this.data.preferredAgeMin ? Number(this.data.preferredAgeMin) : null,
        max: this.data.preferredAgeMax ? Number(this.data.preferredAgeMax) : null
      },
      profileVersion: 'v3.0',
      updateTime: db.serverDate()
    };
  
    wx.showLoading({ title: '保存中...' });
  
    try {
      // 1. 获取当前微信用户 openid
      const loginRes = await wx.cloud.callFunction({
        name: 'getOpenid'
      });
  
      const openid = loginRes?.result?.openid;
      if (!openid) {
        throw new Error('获取 openid 失败');
      }
  
      // 2. 查询当前 openid 是否已经有用户资料
      const userRes = await db.collection('users')
        .where({
          _openid: openid
        })
        .limit(1)
        .get();
  
      let userId = '';
  
      if (userRes.data.length > 0) {
        // 已存在：更新原记录
        const existingUser = userRes.data[0];
        userId = existingUser._id;
  
        await db.collection('users')
          .doc(userId)
          .update({
            data: userInfo
          });
      } else {
        // 不存在：新增
        const addRes = await db.collection('users').add({
          data: {
            ...userInfo,
            createTime: db.serverDate()
          }
        });
  
        userId = addRes._id;
      }
  
      // 3. 本地缓存保持同一个 userId
      wx.setStorageSync('openid', openid);
      wx.setStorageSync('userId', userId);
      wx.setStorageSync('userInfo', {
        ...userInfo,
        _id: userId
      });
  
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
  
      wx.navigateTo({
        url: '/pages/test/test'
      });
    } catch (err) {
      wx.hideLoading();
      console.error('保存用户信息失败', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '资料仅用于匹配推荐。微信号默认不公开，建议在双方互相认可后再决定是否展示联系方式。',
      showCancel: false
    });
  }
});