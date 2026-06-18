Page({
  data: {
    matches: [],
    loading: false,
    emptyText: '还没有发现合适的人，稍后再来看看吧',
    currentBatch: 0
  },

  onLoad() {
    this.fetchMatches();
  },

  normalizeTags(tags) {
    if (Array.isArray(tags)) {
      return [...new Set(tags.map(tag => String(tag).trim()).filter(Boolean))];
    }

    if (typeof tags === 'string') {
      return [
        ...new Set(
          tags
            .split(/[,，、\s]+/)
            .map(tag => tag.trim())
            .filter(Boolean)
        )
      ];
    }

    return [];
  },

  getBioKeywords(text = '') {
    const raw = String(text || '').trim();
    if (!raw) return [];

    const normalized = raw
      .replace(/[。，“”‘’；;！!？?\n\r\t]/g, ' ')
      .replace(/[()（）【】[\]{}]/g, ' ')
      .replace(/[\/|]/g, ' ')
      .trim();

    if (!normalized) return [];

    const splitWords = normalized
      .split(/[,\s，、]+/)
      .map(item => item.trim())
      .filter(Boolean);

    const compactChinese = normalized.replace(/\s+/g, '');
    const chineseChunks = [];
    if (/[\u4e00-\u9fa5]/.test(compactChinese)) {
      for (let i = 0; i < compactChinese.length - 1; i += 1) {
        const bi = compactChinese.slice(i, i + 2);
        if (/^[\u4e00-\u9fa5]{2}$/.test(bi)) chineseChunks.push(bi);
      }
      for (let i = 0; i < compactChinese.length - 2; i += 1) {
        const tri = compactChinese.slice(i, i + 3);
        if (/^[\u4e00-\u9fa5]{3}$/.test(tri)) chineseChunks.push(tri);
      }
    }

    return [
      ...new Set(
        [...splitWords, ...chineseChunks]
          .map(item => item.trim())
          .filter(item => item.length >= 2)
      )
    ].slice(0, 20);
  },

  getCurrentUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const userId = wx.getStorageSync('userId') || '';
    const openid = wx.getStorageSync('openid') || '';

    return {
      _id: userId || userInfo._id || '',
      _openid: openid || userInfo._openid || '',
      nickname: userInfo.nickname || '',
      age: Number(userInfo.age) || 0,
      gender: userInfo.gender || '',
      orientation: userInfo.orientation || '',
      city: userInfo.city || '',
      education: userInfo.education || '',
      bio: userInfo.bio || '',
      wechat: userInfo.wechat || '',
      relationshipGoal: userInfo.relationshipGoal || '',
      longDistance: userInfo.longDistance || '',
      routine: userInfo.routine || '',
      workStyle: userInfo.workStyle || '',
      preferredAgeRange: userInfo.preferredAgeRange || { min: null, max: null }
    };
  },

  async getCurrentUserResult(db, userId) {
    if (!userId) return null;

    try {
      const res = await db.collection('test_results').doc(userId).get();
      return res.data || null;
    } catch (err) {
      console.error('获取当前用户测试结果失败', err);
      return null;
    }
  },

  async fetchAllDocs(collectionName, pageSize = 100) {
    const db = wx.cloud.database();
    let list = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const res = await db.collection(collectionName).skip(skip).limit(pageSize).get();
      const chunk = Array.isArray(res.data) ? res.data : [];
      list = list.concat(chunk);

      if (chunk.length < pageSize) {
        hasMore = false;
      } else {
        skip += pageSize;
      }
    }

    return list;
  },

  buildCandidate(userItem, resultItem) {
    const fallbackNickname = userItem._id
      ? `用户_${String(userItem._id).slice(-4)}`
      : '神秘用户';

    let avatar = userItem.avatar;

    if (!avatar) {
      if (userItem.gender === '男') {
        avatar = '/images/avatar/male.jpg';
      } else if (userItem.gender === '女') {
        avatar = '/images/avatar/female.jpg';
      } else {
        avatar = '/images/avatar/default.jpg';
      }
    }

    return {
      id: userItem._id || '',
      openid: userItem._openid || '',
      nickname: userItem.nickname || fallbackNickname,
      age: Number(userItem.age) || 18,
      gender: userItem.gender || '',
      orientation: userItem.orientation || '',
      city: userItem.city || '未知',
      education: userItem.education || '',
      bio: userItem.bio || '这个人还没有留下自我介绍',
      wechat: userItem.wechat || '',
      relationshipGoal: userItem.relationshipGoal || '',
      avatar,
      longDistance: userItem.longDistance || '',
      routine: userItem.routine || '',
      workStyle: userItem.workStyle || '',
      preferredAgeRange: userItem.preferredAgeRange || { min: null, max: null },
      type: resultItem?.type || '未测出类型',
      subType: resultItem?.subType || '',
      tags: this.normalizeTags(resultItem?.tags || []),
      radarSummary: resultItem?.radarSummary || null,
      analysis: resultItem?.analysis || '',
      reportSections: resultItem?.reportSections || [],
      percent: Number(resultItem?.percent) || 0
    };
  },

  isWithinAgeRange(age, range = {}) {
    const value = Number(age) || 0;
    const min = range && range.min != null ? Number(range.min) : null;
    const max = range && range.max != null ? Number(range.max) : null;

    if (!value) return true;
    if (min != null && value < min) return false;
    if (max != null && value > max) return false;
    return true;
  },

  isAgeCompatible(candidate, currentUserInfo) {
    const candidateAge = Number(candidate.age) || 0;
    const selfAge = Number(currentUserInfo.age) || 0;

    const currentAcceptsCandidate = this.isWithinAgeRange(candidateAge, currentUserInfo.preferredAgeRange);
    const candidateAcceptsCurrent = this.isWithinAgeRange(selfAge, candidate.preferredAgeRange);

    return currentAcceptsCandidate && candidateAcceptsCurrent;
  },

  isDistanceCompatible(candidate, currentUserInfo) {
    const selfLongDistance = currentUserInfo.longDistance || '';
    const candidateLongDistance = candidate.longDistance || '';

    const sameCity =
      currentUserInfo.city &&
      candidate.city &&
      currentUserInfo.city === candidate.city;

    if (sameCity) return true;

    const selfRejects = selfLongDistance === '不接受';
    const candidateRejects = candidateLongDistance === '不接受';

    if (selfRejects || candidateRejects) {
      return false;
    }

    return true;
  },

  isGenderAccepted(targetGender, orientation) {
    if (!orientation || orientation === '都可以') return true;
    if (!targetGender) return false;
    return targetGender === orientation;
  },

  isOrientationCompatible(candidate, currentUserInfo) {
    const currentAcceptsCandidate = this.isGenderAccepted(candidate.gender, currentUserInfo.orientation);
    const candidateAcceptsCurrent = this.isGenderAccepted(currentUserInfo.gender, candidate.orientation);
    return currentAcceptsCandidate && candidateAcceptsCurrent;
  },

  calcOverlapScore(listA = [], listB = [], maxScore = 20) {
    if (!listA.length && !listB.length) return Math.round(maxScore * 0.28);
    if (!listA.length || !listB.length) return Math.round(maxScore * 0.12);

    const common = listA.filter(item => listB.includes(item)).length;
    const base = Math.max(listA.length, listB.length) || 1;

    return Math.round((common / base) * maxScore);
  },

  calcTypeScore(candidateType, currentType) {
    if (!candidateType && !currentType) return 4;
    if (!candidateType || !currentType) return 3;
    if (candidateType === currentType) return 18;

    const softPairs = [
      ['稳定共建型', '理性协同型'],
      ['深度共鸣型', '热诚行动型'],
      ['自主边界型', '理性协同型'],
      ['安全依恋型', '稳定陪伴型'],
      ['成长共创型', '稳定共建型'],
      ['慢热观察型', '自主边界型']
    ];

    const isSoftMatch = softPairs.some(pair =>
      pair.includes(candidateType) && pair.includes(currentType)
    );

    return isSoftMatch ? 12 : 5;
  },

  calcGoalScore(candidateGoal, currentGoal) {
    if (!candidateGoal && !currentGoal) return 4;
    if (!candidateGoal || !currentGoal) return 2;
    return candidateGoal === currentGoal ? 14 : 5;
  },

  calcRoutineScore(candidateRoutine, currentRoutine) {
    if (!candidateRoutine && !currentRoutine) return 3;
    if (!candidateRoutine || !currentRoutine) return 2;
    return candidateRoutine === currentRoutine ? 10 : 4;
  },

  calcWorkScore(candidateWork, currentWork) {
    if (!candidateWork && !currentWork) return 3;
    if (!candidateWork || !currentWork) return 2;
    return candidateWork === currentWork ? 10 : 4;
  },

  calcAgeScore(candidateAge, currentAge, preferredAgeRange, candidatePreferredAgeRange) {
    const age = Number(candidateAge) || 0;
    const selfAge = Number(currentAge) || 0;

    if (!age || !selfAge) return 4;

    const currentAcceptsCandidate = this.isWithinAgeRange(age, preferredAgeRange);
    const candidateAcceptsCurrent = this.isWithinAgeRange(selfAge, candidatePreferredAgeRange);

    if (currentAcceptsCandidate && candidateAcceptsCurrent) return 14;
    if (currentAcceptsCandidate || candidateAcceptsCurrent) return 8;

    const gap = Math.abs(age - selfAge);
    if (gap <= 2) return 6;
    if (gap <= 5) return 4;
    return 2;
  },

  calcBioScore(candidateBio, currentBio) {
    const itemKeywords = this.getBioKeywords(candidateBio);
    const userKeywords = this.getBioKeywords(currentBio);
    return this.calcOverlapScore(itemKeywords, userKeywords, 12);
  },

  calcTagScore(candidateTags, currentTags) {
    return this.calcOverlapScore(candidateTags, currentTags, 14);
  },

  calcRadarScore(candidateRadar, currentRadar) {
    if (!candidateRadar && !currentRadar) return 5;
    if (!candidateRadar || !currentRadar) return 3;

    const keys = ['emotionalNeed', 'rationality', 'independence', 'commitment', 'action'];
    let distance = 0;

    keys.forEach(key => {
      distance += Math.abs(Number(candidateRadar[key] || 0) - Number(currentRadar[key] || 0));
    });

    if (distance <= 4) return 22;
    if (distance <= 8) return 18;
    if (distance <= 12) return 14;
    if (distance <= 16) return 10;
    return 5;
  },

  calcComplementScore(candidateRadar, currentRadar) {
    if (!candidateRadar || !currentRadar) return 3;

    let score = 0;

    const c = candidateRadar;
    const u = currentRadar;

    if (Number(u.emotionalNeed) >= 8 && Number(c.commitment) >= 7) score += 4;
    if (Number(u.commitment) >= 8 && Number(c.action) >= 7) score += 4;
    if (Number(u.independence) >= 8 && Number(c.independence) >= 6) score += 3;
    if (Number(u.action) >= 8 && Number(c.rationality) >= 6) score += 3;
    if (Number(u.rationality) >= 8 && Number(c.emotionalNeed) >= 6) score += 3;
    if (Math.abs(Number(u.independence) - Number(c.emotionalNeed)) <= 3) score += 2;

    return Math.max(2, Math.min(18, score || 3));
  },

  calcGenderPriorityScore(candidateGender, currentGender, orientation) {
    if (!candidateGender) return 2;
    if (!orientation || orientation === '都可以') return 8;
    return candidateGender === orientation ? 12 : 0;
  },

  calcCityScore(candidateCity, currentCity, selfLongDistance, candidateLongDistance) {
    if (!candidateCity || !currentCity) return 4;

    if (candidateCity === currentCity) return 14;

    const selfAccepts = selfLongDistance === '接受' || selfLongDistance === '短期接受';
    const candidateAccepts = candidateLongDistance === '接受' || candidateLongDistance === '短期接受';

    if (selfAccepts && candidateAccepts) return 8;

    return 3;
  },

  calcProfileCompleteness(candidate) {
    let score = 0;

    if (candidate.type && candidate.type !== '未测出类型') score += 1;
    if (candidate.radarSummary) score += 1;
    if (candidate.tags && candidate.tags.length) score += 1;
    if (candidate.bio && candidate.bio !== '这个人还没有留下自我介绍') score += 1;
    if (candidate.relationshipGoal) score += 1;
    if (candidate.routine) score += 1;
    if (candidate.workStyle) score += 1;
    if (candidate.city && candidate.city !== '未知') score += 1;
    if (candidate.age) score += 1;

    return score / 9;
  },

  calcDimensionScores(candidate, currentUserInfo, currentUserResult) {
    const currentType = currentUserResult?.type || '';
    const currentTags = this.normalizeTags(currentUserResult?.tags || []);
    const currentRadar = currentUserResult?.radarSummary || null;

    const typeScore = this.calcTypeScore(candidate.type, currentType);
    const tagScore = this.calcTagScore(candidate.tags, currentTags);
    const cityScore = this.calcCityScore(
      candidate.city,
      currentUserInfo.city,
      currentUserInfo.longDistance,
      candidate.longDistance
    );
    const goalScore = this.calcGoalScore(candidate.relationshipGoal, currentUserInfo.relationshipGoal);
    const routineScore = this.calcRoutineScore(candidate.routine, currentUserInfo.routine);
    const workScore = this.calcWorkScore(candidate.workStyle, currentUserInfo.workStyle);
    const ageScore = this.calcAgeScore(
      candidate.age,
      currentUserInfo.age,
      currentUserInfo.preferredAgeRange,
      candidate.preferredAgeRange
    );
    const bioScore = this.calcBioScore(candidate.bio, currentUserInfo.bio);
    const radarScore = this.calcRadarScore(candidate.radarSummary, currentRadar);
    const complementScore = this.calcComplementScore(candidate.radarSummary, currentRadar);
    const genderPriorityScore = this.calcGenderPriorityScore(
      candidate.gender,
      currentUserInfo.gender,
      currentUserInfo.orientation
    );

    const personality = Math.max(20, Math.min(100, Math.round(((typeScore + radarScore) / 40) * 100)));
    const interest = Math.max(20, Math.min(100, Math.round(((tagScore + bioScore) / 26) * 100)));
    const resonance = Math.max(20, Math.min(100, Math.round(((bioScore + goalScore + complementScore) / 44) * 100)));
    const distance = Math.max(20, Math.min(100, Math.round(((cityScore + ageScore + routineScore) / 38) * 100)));
    const future = Math.max(20, Math.min(100, Math.round(((goalScore + workScore + radarScore) / 46) * 100)));

    let similarity = Math.round(
      personality * 0.26 +
      interest * 0.12 +
      resonance * 0.18 +
      distance * 0.14 +
      future * 0.22 +
      Math.max(0, Math.min(100, Math.round((complementScore / 18) * 100))) * 0.05 +
      Math.max(0, Math.min(100, Math.round((genderPriorityScore / 12) * 100))) * 0.03
    );

    const completeness = this.calcProfileCompleteness(candidate);
    const completenessFactor = 0.82 + completeness * 0.18;
    similarity = Math.round(similarity * completenessFactor);

    return {
      similarity: Math.max(28, Math.min(98, similarity)),
      dimensions: {
        personality,
        interest,
        resonance,
        distance,
        future,
        complement: Math.max(20, Math.min(100, Math.round((complementScore / 18) * 100)))
      }
    };
  },

  buildReason(candidate, currentUserInfo, dimensions, currentUserResult) {
    const reasons = [];
    const currentRadar = currentUserResult?.radarSummary || null;
    const candidateRadar = candidate.radarSummary || null;

    if (candidate.city && currentUserInfo.city && candidate.city === currentUserInfo.city) {
      reasons.push('你们同城，现实接触更方便');
    }

    if (
      candidate.relationshipGoal &&
      currentUserInfo.relationshipGoal &&
      candidate.relationshipGoal === currentUserInfo.relationshipGoal
    ) {
      reasons.push(`你们的关系目标都偏向「${candidate.relationshipGoal}」`);
    }

    if (candidate.type && candidate.type !== '未测出类型') {
      reasons.push(`Ta 的关系风格偏「${candidate.type}」，和你的节奏有呼应`);
    }

    if (currentRadar && candidateRadar) {
      if (Number(currentRadar.emotionalNeed) >= 8 && Number(candidateRadar.commitment) >= 7) {
        reasons.push('你比较需要回应，Ta 的稳定投入能带来安心感');
      } else if (Number(currentRadar.independence) >= 8 && Number(candidateRadar.independence) >= 6) {
        reasons.push('你们都比较尊重边界，相处会更舒服');
      } else if (Number(currentRadar.action) >= 8 && Number(candidateRadar.rationality) >= 6) {
        reasons.push('你偏主动，Ta 较稳定理性，容易形成互补');
      } else if (Number(currentRadar.rationality) >= 8 && Number(candidateRadar.emotionalNeed) >= 6) {
        reasons.push('你重逻辑，Ta 有情绪回应，关系里更容易有温度');
      }
    }

    if (dimensions.future >= 75) {
      reasons.push('你们对长期关系的方向比较一致');
    }

    if (dimensions.personality >= 75) {
      reasons.push('你们在相处方式上有不错的同频感');
    }

    if (candidate.tags.length) {
      reasons.push(`关键词接近：${candidate.tags.slice(0, 2).join(' / ')}`);
    }

    return [...new Set(reasons)].slice(0, 3);
  },

  isSelfUser(user, currentUserInfo) {
    const selfId = currentUserInfo._id || '';
    const selfOpenid = currentUserInfo._openid || '';

    if (selfId && user._id && selfId === user._id) return true;
    if (selfOpenid && user._openid && selfOpenid === user._openid) return true;

    return false;
  },

  async fetchMatches() {
    this.setData({ loading: true });
    wx.showLoading({ title: '匹配中...' });

    try {
      const db = wx.cloud.database();
      const currentUserInfo = this.getCurrentUserInfo();
      const currentUserId = currentUserInfo._id;

      if (!currentUserId) {
        throw new Error('当前用户信息不存在');
      }

      const currentUserResult = await this.getCurrentUserResult(db, currentUserId);

      const [users, results] = await Promise.all([
        this.fetchAllDocs('users', 100),
        this.fetchAllDocs('test_results', 100)
      ]);

      const resultMap = {};
      results.forEach(item => {
        if (!item.userId) return;
        const old = resultMap[item.userId];
        if (!old) {
          resultMap[item.userId] = item;
          return;
        }

        const oldTime = old.updateTime ? new Date(old.updateTime).getTime() : 0;
        const newTime = item.updateTime ? new Date(item.updateTime).getTime() : 0;
        if (newTime >= oldTime) {
          resultMap[item.userId] = item;
        }
      });

      const scoredList = users
        .filter(user => !this.isSelfUser(user, currentUserInfo))
        .map(user => {
          const resultItem = resultMap[user._id] || null;
          return this.buildCandidate(user, resultItem);
        })
        .filter(candidate => this.isOrientationCompatible(candidate, currentUserInfo))
        .filter(candidate => this.isAgeCompatible(candidate, currentUserInfo))
        .filter(candidate => this.isDistanceCompatible(candidate, currentUserInfo))
        .map(candidate => {
          const scoreData = this.calcDimensionScores(candidate, currentUserInfo, currentUserResult);
          return {
            ...candidate,
            similarity: scoreData.similarity,
            dimensions: scoreData.dimensions,
            reasons: this.buildReason(candidate, currentUserInfo, scoreData.dimensions, currentUserResult)
          };
        })
        .sort((a, b) => {
          if (b.similarity !== a.similarity) return b.similarity - a.similarity;
          return (b.percent || 0) - (a.percent || 0);
        });

      const batchSize = 12;
      const start = (this.data.currentBatch * batchSize) % Math.max(batchSize, scoredList.length || batchSize);
      const display = scoredList.slice(start, start + batchSize);
      const finalDisplay = display.length ? display : scoredList.slice(0, batchSize);

      this.setData({
        matches: finalDisplay,
        emptyText: scoredList.length ? '' : '暂时没有找到符合你条件的人'
      });
    } catch (e) {
      console.error('查询失败:', e);
      wx.showToast({
        title: '匹配失败，请稍后重试',
        icon: 'none'
      });

      this.setData({
        matches: [],
        emptyText: '匹配失败，请检查云数据库或网络'
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  refreshMatches() {
    this.setData({
      currentBatch: this.data.currentBatch + 1
    }, () => {
      this.fetchMatches();
    });
  },

  onShareAppMessage() {
    const firstUser = this.data.matches[0] || {};
    return {
      title: `向你推荐一位可能同频的人：${firstUser.nickname || '神秘用户'}`,
      path: '/pages/home/home'
    };
  },

  viewContact(e) {
    const index = e.currentTarget.dataset.index;
    const user = this.data.matches[index];

    if (!user) {
      wx.showToast({
        title: '用户信息加载中',
        icon: 'none'
      });
      return;
    }

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

    wx.vibrateShort({ type: 'light' });

    const userParam = JSON.stringify({
      id: user.id || '',
      nickname: user.nickname || '匿名',
      age: user.age || 18,
      gender: user.gender || '',
      city: user.city || '未知',
      type: user.type || '未测出类型',
      subType: user.subType || '',
      bio: user.bio || '',
      wechat: user.wechat || '',
      tags: user.tags || [],
      avatar,
      similarity: user.similarity || 0,
      dimensions: user.dimensions || {},
      reasons: user.reasons || [],
      relationshipGoal: user.relationshipGoal || '',
      routine: user.routine || '',
      workStyle: user.workStyle || '',
      analysis: user.analysis || ''
    });

    wx.navigateTo({
      url: `/pages/contact/contact?user=${encodeURIComponent(userParam)}`,
      fail: (err) => {
        console.error('跳转失败', err);
        wx.showToast({
          title: '无法打开详情页',
          icon: 'none'
        });
      }
    });
  }
});
