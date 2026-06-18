Page({
  data: {
    type: '',
    subType: '',
    description: '',
    matchPercent: 0,
    resultColor: '',
    tags: [],
    analysis: '',
    suitableFor: [],
    unsuitableFor: [],
    adviceList: [],
    radarSummary: {},
    reportSections: [],
    emotionalNeedWidth: '0%',
    rationalityWidth: '0%',
    independenceWidth: '0%',
    commitmentWidth: '0%',
    actionWidth: '0%'
  },

  onLoad(options) {
    if (options.result) {
      const savedResult = JSON.parse(decodeURIComponent(options.result));
      this.fillResultData(savedResult);
      return;
    }

    if (options.answers) {
      const answers = JSON.parse(decodeURIComponent(options.answers));
      const paper = options.paper
        ? JSON.parse(decodeURIComponent(options.paper))
        : this.getCurrentPaper();

      const result = this.calculateAdvancedType(answers, paper);
      this.fillResultData(result);
      this.saveResult(answers, result, paper);
    }
  },

  getPaperStorageKey() {
    const userId = wx.getStorageSync('userId') || 'guest';
    return `current_test_paper_${userId}`;
  },

  getCurrentPaper() {
    const localPaper = wx.getStorageSync(this.getPaperStorageKey()) || [];
    if (Array.isArray(localPaper) && localPaper.length) return localPaper;
    return this.buildPaperFallback();
  },

  fillResultData(result) {
    this.setData({
      type: result.type || '',
      subType: result.subType || '',
      description: result.description || '',
      matchPercent: result.percent || 0,
      resultColor: result.color || '',
      tags: result.tags || [],
      analysis: result.analysis || '',
      suitableFor: result.suitableFor || [],
      unsuitableFor: result.unsuitableFor || [],
      adviceList: result.adviceList || [],
      radarSummary: result.radarSummary || {},
      reportSections: result.reportSections || [],
      emotionalNeedWidth: result.widths?.emotionalNeedWidth || ((result.radarSummary?.emotionalNeed || 0) * 10 + '%'),
      rationalityWidth: result.widths?.rationalityWidth || ((result.radarSummary?.rationality || 0) * 10 + '%'),
      independenceWidth: result.widths?.independenceWidth || ((result.radarSummary?.independence || 0) * 10 + '%'),
      commitmentWidth: result.widths?.commitmentWidth || ((result.radarSummary?.commitment || 0) * 10 + '%'),
      actionWidth: result.widths?.actionWidth || ((result.radarSummary?.action || 0) * 10 + '%')
    });
  },

  calculateAdvancedType(answers, inputPaper) {
    const paper = Array.isArray(inputPaper) && inputPaper.length ? inputPaper : this.getCurrentPaper();

    const selfDimension = this.createEmptyDimension();
    const relationDimension = this.createEmptyDimension();
    const preferenceDimension = this.createEmptyDimension();

    answers.forEach((rawAnswer, index) => {
      const question = paper[index];
      const selectedIndexes = this.normalizeAnswer(rawAnswer);
      if (!question || !selectedIndexes.length) return;

      let target = selfDimension;
      if (question.section === '关系观') {
        target = relationDimension;
      } else if (question.section === '择偶偏好') {
        target = preferenceDimension;
      }

      const weight = 1 / selectedIndexes.length;
      selectedIndexes.forEach((optionIndex) => {
        const config = question.maps?.[optionIndex];
        if (!config) return;
        Object.keys(config).forEach((key) => {
          target[key] += config[key] * weight;
        });
      });
    });

    const selfNormalized = this.normalizeDimension(selfDimension);
    const relationNormalized = this.normalizeDimension(relationDimension);
    const preferenceNormalized = this.normalizeDimension(preferenceDimension);

    const merged = {
      emotionalNeed: Math.round((selfNormalized.emotionalNeed + relationNormalized.emotionalNeed + preferenceNormalized.emotionalNeed) / 3),
      rationality: Math.round((selfNormalized.rationality + relationNormalized.rationality + preferenceNormalized.rationality) / 3),
      independence: Math.round((selfNormalized.independence + relationNormalized.independence + preferenceNormalized.independence) / 3),
      commitment: Math.round((selfNormalized.commitment + relationNormalized.commitment + preferenceNormalized.commitment) / 3),
      action: Math.round((selfNormalized.action + relationNormalized.action + preferenceNormalized.action) / 3)
    };

    const prototypes = [
      {
        type: '稳定共建型',
        tags: ['长期主义', '靠谱', '重视未来'],
        color: '#355C7D',
        description: '你的爱像一座慢慢点亮的灯塔，不急着喧哗，却始终朝向更长远的岸。你更安心于稳定投入、认真靠近，以及那种可以一起走向生活深处的关系。',
        ideal: { emotionalNeed: 5, rationality: 7, independence: 4, commitment: 9, action: 7 },
        suitableFor: ['责任感稳定的人', '愿意规划未来的人', '能把承诺慢慢兑现的人'],
        unsuitableFor: ['长期失联的人', '只会说漂亮话的人', '始终没有方向感的人'],
        adviceList: ['先看一致性，再交付更深的真心。', '把你对未来的期待轻轻说出来，会更容易遇见同路人。', '适合你的爱，往往安静，却很有力量。']
      },
      {
        type: '深度共鸣型',
        tags: ['共情强', '在意回应', '情感浓度高'],
        color: '#C06C84',
        description: '你会被真正的理解深深打动。对你而言，爱不是匆匆经过的热闹，而是有人愿意听见你、回应你，在细微处安放你的真心。',
        ideal: { emotionalNeed: 9, rationality: 5, independence: 3, commitment: 7, action: 6 },
        suitableFor: ['有共情力的人', '表达清晰的人', '回应稳定的人'],
        unsuitableFor: ['忽冷忽热的人', '回避表达的人', '态度长期模糊的人'],
        adviceList: ['你的需要并不麻烦，它只是需要被认真对待。', '别在模糊的回应里反复消耗自己。', '你更适合被持续回应，而不是被短暂热烈吸引。']
      },
      {
        type: '自主边界型',
        tags: ['独立', '清醒', '尊重边界'],
        color: '#6C5B7B',
        description: '你珍惜有呼吸感的亲密。你不是冷淡，只是明白真正舒服的爱，应该允许两个人在靠近时仍保有自己的轮廓。',
        ideal: { emotionalNeed: 4, rationality: 6, independence: 9, commitment: 5, action: 5 },
        suitableFor: ['尊重空间的人', '独立成熟的人', '不控制不消耗的人'],
        unsuitableFor: ['控制欲强的人', '过度依赖的人', '边界混乱的人'],
        adviceList: ['边界不是拒绝爱，而是让爱更久一点。', '早点说清自己的节奏，会比委屈配合更温柔。', '适合你的关系，不会把靠近变成压迫。']
      },
      {
        type: '理性协同型',
        tags: ['会沟通', '讲逻辑', '重协商'],
        color: '#2A9D8F',
        description: '你更信任那些能沟通、能协商、也愿意一起修补关系的人。比起反复拉扯，你更看重关系里的成熟、清醒和可修复性。',
        ideal: { emotionalNeed: 5, rationality: 9, independence: 5, commitment: 7, action: 7 },
        suitableFor: ['愿意沟通的人', '情绪稳定的人', '能复盘问题的人'],
        unsuitableFor: ['一冲突就逃避的人', '只讲情绪不肯面对问题的人', '拒绝沟通的人'],
        adviceList: ['把标准说清楚，比默默失望更有力量。', '你适合可以一起面对问题的人。', '理性是你的光，也别忘了留一点温度。']
      },
      {
        type: '热诚行动型',
        tags: ['主动', '推进感强', '修复意愿高'],
        color: '#E76F51',
        description: '你喜欢有心意，也有脚步声的关系。你会被明确、真诚、敢于靠近的人打动，因为爱在你这里，最好既有温度，也有落地的形状。',
        ideal: { emotionalNeed: 7, rationality: 5, independence: 4, commitment: 7, action: 9 },
        suitableFor: ['主动投入的人', '表达直接的人', '愿意推进关系的人'],
        unsuitableFor: ['拖延回避的人', '长期观望不行动的人', '态度模糊的人'],
        adviceList: ['看见行动，再决定把心放得多深。', '主动很好，也要记得给彼此留一点呼吸。', '适合你的爱，是热烈却不失分寸的。']
      },
      {
        type: '安全依恋型',
        tags: ['稳定回应', '安全感', '持续投入'],
        color: '#4E7AC7',
        description: '你在爱里很珍惜那份稳定的回音。你要的不是表面的热闹，而是一种能够慢慢沉进心里的安定感。',
        ideal: { emotionalNeed: 8, rationality: 6, independence: 4, commitment: 8, action: 6 },
        suitableFor: ['稳定回应的人', '态度清晰的人', '愿意长期投入的人'],
        unsuitableFor: ['忽近忽远的人', '长期暧昧的人', '不愿承诺的人'],
        adviceList: ['你需要稳定，并不代表你脆弱。', '多观察对方是否始终如一，会让你更安心。', '适合你的人，会让你的心慢慢安静下来。']
      },
      {
        type: '成长共创型',
        tags: ['共同成长', '现实合作', '目标一致'],
        color: '#3A7D44',
        description: '你期待关系不仅有心动，也有并肩向前的力量。真正打动你的，往往是那个愿意一起把生活过得更丰盛的人。',
        ideal: { emotionalNeed: 6, rationality: 7, independence: 5, commitment: 8, action: 8 },
        suitableFor: ['有目标感的人', '愿意共同进步的人', '现实层面能配合的人'],
        unsuitableFor: ['只讲感觉不落实的人', '长期停滞不前的人', '没有行动力的人'],
        adviceList: ['你适合既有温度，也有担当的人。', '把你想共同建设的生活说出来，很重要。', '对你来说，同频常常意味着一起成长。']
      },
      {
        type: '慢热观察型',
        tags: ['谨慎投入', '先观察', '慢慢确认'],
        color: '#8D6E63',
        description: '你不会轻易把心门全部推开，而是更愿意在时间里确认一个人值不值得靠近。你的慢，不是迟钝，而是一种认真。',
        ideal: { emotionalNeed: 5, rationality: 7, independence: 7, commitment: 6, action: 4 },
        suitableFor: ['不催促的人', '耐心稳定的人', '尊重节奏的人'],
        unsuitableFor: ['推进过猛的人', '情绪起伏过大的人', '边界模糊的人'],
        adviceList: ['慢一点没有关系，安心比速度更重要。', '你更适合先建立信任，再慢慢打开自己。', '别轻易否定慢热，它也是爱的诚意。']
      },
      {
        type: '情绪敏感型',
        tags: ['感受细腻', '高共情', '容易受氛围影响'],
        color: '#B565A7',
        description: '你对关系里的细枝末节有很高的感受力。这样的你，像能听见风向的人，也更需要温柔、稳定、不会把你晾在风里的回应。',
        ideal: { emotionalNeed: 9, rationality: 4, independence: 4, commitment: 6, action: 5 },
        suitableFor: ['细腻温柔的人', '会安抚的人', '有表达能力的人'],
        unsuitableFor: ['忽视感受的人', '回避沟通的人', '长期冷处理的人'],
        adviceList: ['敏感不是负担，它是你珍贵的感受力。', '你值得被温柔回应，而不是独自消化一切。', '越细腻的人，越需要稳定的关系气候。']
      },
      {
        type: '现实优先型',
        tags: ['务实', '稳定', '看长期落地'],
        color: '#607D8B',
        description: '你看待关系时有一种清醒的温度。你在意的不只是心动，还在意这份关系能不能真正落到生活里，成为可以依靠的存在。',
        ideal: { emotionalNeed: 4, rationality: 8, independence: 5, commitment: 9, action: 6 },
        suitableFor: ['有责任感的人', '现实靠谱的人', '价值观一致的人'],
        unsuitableFor: ['只有热情没有规划的人', '态度反复的人', '生活习惯混乱的人'],
        adviceList: ['现实标准不是冷漠，而是一种成熟。', '把关键条件尽早聊清楚，会减少很多内耗。', '在务实之外，也记得给爱一点温度。']
      },
      {
        type: '探索体验型',
        tags: ['重感觉', '体验感', '关系流动性'],
        color: '#F4A261',
        description: '你会被真实、新鲜、有生命力的关系吸引。你喜欢那种能让心轻轻亮起来的相处，也愿意为真诚而生动的人停留。',
        ideal: { emotionalNeed: 7, rationality: 4, independence: 6, commitment: 5, action: 8 },
        suitableFor: ['有趣主动的人', '愿意制造体验的人', '表达真实的人'],
        unsuitableFor: ['过于僵硬的人', '长期无回应的人', '缺乏投入的人'],
        adviceList: ['热烈很好，也记得留心长期稳定。', '你适合真实、生动、愿意回应的人。', '先看价值观，再享受心动，会更安心。']
      },
      {
        type: '稳定陪伴型',
        tags: ['温和', '持久', '舒服相处'],
        color: '#7CB342',
        description: '你不一定追求最炽烈的火光，却会被一盏长明的灯打动。温和、持久、踏实的陪伴，对你而言本身就是一种很深的浪漫。',
        ideal: { emotionalNeed: 6, rationality: 6, independence: 5, commitment: 8, action: 5 },
        suitableFor: ['温柔稳定的人', '情绪平和的人', '愿意长期相处的人'],
        unsuitableFor: ['情绪波动过大的人', '忽冷忽热的人', '长期缺席的人'],
        adviceList: ['平稳并不无聊，很多珍贵都藏在日常里。', '你更适合慢慢建立深度的人。', '舒服和安心，本来就是很好的爱的样子。']
      }
    ];

    const sorted = prototypes
      .map((item) => {
        const distance =
          Math.abs(merged.emotionalNeed - item.ideal.emotionalNeed) +
          Math.abs(merged.rationality - item.ideal.rationality) +
          Math.abs(merged.independence - item.ideal.independence) +
          Math.abs(merged.commitment - item.ideal.commitment) +
          Math.abs(merged.action - item.ideal.action);

        return { ...item, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    const best = sorted[0];
    const subType = this.getSubType(preferenceNormalized, relationNormalized);

    const answeredCount = Array.isArray(answers)
      ? answers.filter(item => this.normalizeAnswer(item).length > 0).length
      : 0;
    const completeness = paper.length ? answeredCount / paper.length : 1;

    const rawPercent = 100 - (best.distance / 40) * 26;
    const adjustedPercent = rawPercent * (0.92 + completeness * 0.08);
    const finalPercent = Math.max(72, Math.min(98, Number(adjustedPercent.toFixed(1))));

    const report = this.buildReport(best.type, subType, selfNormalized, relationNormalized, preferenceNormalized, merged);
    const analysis = report.map(item => `${item.title}：${item.content}`).join(' ');
    const description = `${best.description} 你的恋爱偏好更接近「${subType}」，说明你不仅会为心动停留，也很在意两个人靠近的方式，是否能让彼此都感到安稳、舒展。`;

    return {
      type: best.type,
      subType,
      description,
      tags: [...new Set([...(best.tags || []), subType])].slice(0, 4),
      color: best.color,
      percent: finalPercent,
      analysis,
      reportSections: report,
      suitableFor: best.suitableFor,
      unsuitableFor: best.unsuitableFor,
      adviceList: best.adviceList,
      radarSummary: merged,
      widths: {
        emotionalNeedWidth: `${merged.emotionalNeed * 10}%`,
        rationalityWidth: `${merged.rationality * 10}%`,
        independenceWidth: `${merged.independence * 10}%`,
        commitmentWidth: `${merged.commitment * 10}%`,
        actionWidth: `${merged.action * 10}%`
      }
    };
  },

  createEmptyDimension() {
    return {
      emotionalNeed: 0,
      rationality: 0,
      independence: 0,
      commitment: 0,
      action: 0
    };
  },

  normalizeAnswer(answer) {
    if (Array.isArray(answer)) {
      return [...new Set(answer.map(item => Number(item)).filter(item => !Number.isNaN(item)))];
    }
    if (answer === -1 || answer === undefined || answer === null || answer === '') {
      return [];
    }
    const num = Number(answer);
    return Number.isNaN(num) ? [] : [num];
  },

  normalizeDimension(dimension) {
    const normalize = (value) => {
      const result = 1 + Math.round((Number(value || 0) / 24) * 9);
      return Math.max(1, Math.min(10, result));
    };

    return {
      emotionalNeed: normalize(dimension.emotionalNeed),
      rationality: normalize(dimension.rationality),
      independence: normalize(dimension.independence),
      commitment: normalize(dimension.commitment),
      action: normalize(dimension.action)
    };
  },

  getSubType(preferenceRadar, relationRadar) {
    const mergedPreference = {
      emotionalNeed: Math.round((preferenceRadar.emotionalNeed + relationRadar.emotionalNeed) / 2),
      rationality: Math.round((preferenceRadar.rationality + relationRadar.rationality) / 2),
      independence: Math.round((preferenceRadar.independence + relationRadar.independence) / 2),
      commitment: Math.round((preferenceRadar.commitment + relationRadar.commitment) / 2),
      action: Math.round((preferenceRadar.action + relationRadar.action) / 2)
    };

    const list = [
      { name: '偏好高回应型', score: () => (mergedPreference.emotionalNeed >= 8 ? mergedPreference.emotionalNeed * 2 : 0) },
      { name: '偏好稳定负责型', score: () => (mergedPreference.commitment >= 8 ? mergedPreference.commitment + mergedPreference.rationality : 0) },
      { name: '偏好尊重边界型', score: () => (mergedPreference.independence >= 8 ? mergedPreference.independence * 2 : 0) },
      { name: '偏好主动推进型', score: () => (mergedPreference.action >= 8 ? mergedPreference.action * 2 : 0) },
      { name: '偏好成熟沟通型', score: () => (mergedPreference.rationality >= 8 ? mergedPreference.rationality * 2 : 0) },
      { name: '偏好长期共建型', score: () => (mergedPreference.commitment >= 8 && mergedPreference.action >= 7 ? mergedPreference.commitment + mergedPreference.action : 0) }
    ];

    const scored = list
      .map(item => ({ name: item.name, value: item.score() }))
      .sort((a, b) => b.value - a.value);

    return scored[0] && scored[0].value > 0 ? scored[0].name : '偏好稳定舒服型';
  },

  buildReport(type, subType, selfRadar, relationRadar, preferenceRadar, merged) {
    const styleMap = {
      '稳定共建型': '你在爱里更像一位稳稳掌灯的人，重视长期、认真与现实可落地的笃定感。',
      '深度共鸣型': '你在意情绪连接，也珍惜被理解的时刻；有回应的关系，才更容易让你放下心。',
      '自主边界型': '你需要有呼吸感的亲密，越被尊重，越能把真心慢慢交出去。',
      '理性协同型': '你会更信任成熟、清晰、能一起面对问题的关系。',
      '热诚行动型': '你喜欢有回应也有行动的爱，明确与真诚会让你更有安全感。',
      '安全依恋型': '你很重视持续、稳定、清晰的关系体验，希望两个人能慢慢建立可靠感。',
      '成长共创型': '你会被一起成长、一起建设生活的关系吸引，不只是心动，也看重并肩。',
      '慢热观察型': '你习惯在时间里确认一个人，节奏对了，心才会慢慢打开。',
      '情绪敏感型': '你对关系细节有很高的感受力，因此更需要温柔而稳定的回应。',
      '现实优先型': '你看待关系时比较务实清醒，更在意长期适配与现实落地。',
      '探索体验型': '你会被有温度、有生命力、有真实流动感的关系吸引。',
      '稳定陪伴型': '你珍惜温和、踏实、可持续的陪伴，越平稳，越容易让你安心。'
    };

    const selfParts = [];
    if (selfRadar.emotionalNeed >= 8) selfParts.push('你很重视回应与情绪连接');
    if (selfRadar.rationality >= 8) selfParts.push('你会用清晰和沟通来安放关系');
    if (selfRadar.independence >= 8) selfParts.push('你需要边界感，也需要独处恢复自己');
    if (selfRadar.commitment >= 8) selfParts.push('你对认真程度与长期投入看得很重');
    if (selfRadar.action >= 8) selfParts.push('你愿意用行动推动关系向前');

    const prefParts = [];
    if (preferenceRadar.emotionalNeed >= 8) prefParts.push('会回应、能共情');
    if (preferenceRadar.rationality >= 8) prefParts.push('成熟沟通、说得清楚');
    if (preferenceRadar.independence >= 8) prefParts.push('边界清晰、尊重节奏');
    if (preferenceRadar.commitment >= 8) prefParts.push('责任感稳定、态度明确');
    if (preferenceRadar.action >= 8) prefParts.push('有行动力、愿意推进');

    const riskParts = [];
    if (merged.emotionalNeed >= 8 && merged.independence >= 7) riskParts.push('你有时会一边想靠近，一边又本能地想保护自己');
    if (merged.commitment >= 8 && merged.action >= 8) riskParts.push('在遇到合适的人时，可能会比自己想象中推进得更快');
    if (merged.emotionalNeed >= 8 && merged.rationality <= 4) riskParts.push('在氛围很动人的时候，容易投入得比预期更深');
    if (merged.rationality >= 8 && merged.emotionalNeed <= 5) riskParts.push('你有时会把事情想得很明白，却忘了让感受也被听见');

    return [
      {
        title: '你的关系气质',
        content: styleMap[type] || '你对关系有较清晰的偏好，也知道自己会被怎样的相处打动。'
      },
      {
        title: '你在爱里的样子',
        content: selfParts.length
          ? `从这份答卷里看，${selfParts.join('，')}。这些不是负担，而是你心里真实的光。`
          : '你的状态整体比较平衡，不会特别偏向某一个极端，这让你在关系里更容易保有稳定感。'
      },
      {
        title: '你会被怎样的人吸引',
        content: `你的偏好更接近「${subType}」。通常来说，你会更容易被${prefParts.length ? prefParts.join('、') : '稳定舒服的人'}吸引，因为他们更容易让你感到安心、顺畅，也更接近你想停留的关系氛围。`
      },
      {
        title: '你可以温柔留意的地方',
        content: riskParts.length
          ? `也许你可以轻轻留意：${riskParts.join('；')}。这不是提醒你改变自己，而是希望你在靠近别人时，也别忘了照顾自己的节奏。`
          : '你的关系节奏整体比较稳。对你来说，重要的不是勉强自己改变，而是找到真正适配你的人。'
      },
      {
        title: '送给你的关系寄语',
        content: '更适合你的爱，不一定最喧哗，却会在细节里接住你的需要，尊重你的节奏，也愿意陪你把普通日子过成一首温柔的诗。'
      }
    ];
  },

  async saveResult(answers, result, paper) {
    const db = wx.cloud.database();
    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    const saveData = {
      userId,
      answers,
      type: result.type,
      subType: result.subType,
      percent: result.percent,
      description: result.description,
      tags: result.tags,
      analysis: result.analysis,
      reportSections: result.reportSections,
      suitableFor: result.suitableFor,
      unsuitableFor: result.unsuitableFor,
      adviceList: result.adviceList,
      radarSummary: result.radarSummary,
      color: result.color,
      widths: result.widths,
      paperSnapshot: Array.isArray(paper) ? paper : [],
      algorithmVersion: 'v6.1',
      updateTime: db.serverDate()
    };

    wx.setStorageSync(`test_result_${userId}`, saveData);

    try {
      await db.collection('test_results').doc(userId).set({
        data: {
          ...saveData,
          createTime: db.serverDate()
        }
      });
    } catch (err) {
      console.error('Save Failed', err);
    }
  },

  retakeTest() {
    const userId = wx.getStorageSync('userId');
    if (userId) {
      wx.removeStorageSync(`test_result_${userId}`);
      wx.removeStorageSync(`current_test_paper_${userId}`);
    }

    wx.redirectTo({
      url: '/pages/test/test'
    });
  },

  goToMatch() {
    wx.vibrateShort({ type: 'medium' });
    wx.navigateTo({ url: '/pages/match-list/match-list' });
  },

  onShareAppMessage() {
    return {
      title: `我测出了【${this.data.type}】，看看你和我是不是同频？`,
      path: '/pages/home/home',
      imageUrl: '/assets/share-cover.png'
    };
  },

  buildPaperFallback() {
    const self = [
      {
        section: '自我画像',
        question: '当一段关系刚刚开始发芽时，你通常会先留意什么？',
        options: ['对方是否愿意回应我的情绪', '我们是否谈得来、能稳定交流', '相处里有没有舒服的边界感', '对方会不会把喜欢落到行动里'],
        maps: [{ emotionalNeed: 2 }, { rationality: 1, commitment: 1 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '遇到误会时，你更像哪一种处理方式？',
        options: ['想尽快确认彼此还在意', '先理清事实，再慢慢谈', '需要一点时间整理自己', '希望尽快推动修复'],
        maps: [{ emotionalNeed: 2 }, { rationality: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '压力很大的那几天，你更需要伴侣怎样靠近你？',
        options: ['先抱抱我、接住我的情绪', '陪我梳理问题和轻重缓急', '给我一点安静和呼吸感', '陪我一起拆解并解决现实问题'],
        maps: [{ emotionalNeed: 2 }, { rationality: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '下面哪些状态，更容易让你在关系里安心？（可选 2 项）',
        multi: true,
        maxSelect: 2,
        options: ['对方会及时回应', '相处节奏稳定可预期', '彼此都有自己的空间', '承诺能一点点被兑现'],
        maps: [{ emotionalNeed: 2 }, { commitment: 1, rationality: 1 }, { independence: 2 }, { commitment: 2 }]
      },
      {
        section: '自我画像',
        question: '你更容易因为什么而心动？',
        options: ['被认真理解和照顾感受', '看见对方成熟、清晰、讲分寸', '感到轻松自在、不被消耗', '看见对方明确靠近和付出'],
        maps: [{ emotionalNeed: 2 }, { rationality: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '如果关系推进得很快，你内心最真实的反应更接近：',
        options: ['期待之余，也想确认是不是认真的', '会观察这份热度能否稳定下来', '会下意识想保留一点自己的节奏', '只要彼此明确，我愿意一起往前走'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '你希望自己在爱里被看见的部分是：',
        options: ['我的柔软与真心', '我的可靠与判断力', '我的边界与独立', '我的诚意与行动'],
        maps: [{ emotionalNeed: 2 }, { rationality: 1, commitment: 1 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '当你认真喜欢一个人时，你会更倾向于：',
        options: ['在意对方有没有回应细节', '思考这段关系是否值得长期投入', '喜欢归喜欢，仍要保留自我空间', '愿意主动示好或表达态度'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '你更怕关系里出现哪一种失衡？',
        options: ['情绪总是无人回应', '说过的话总落不了地', '边界被反复试探', '一直停在模糊里没有进展'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '下面哪些描述比较像你在亲密关系里的底色？（可选 2 项）',
        multi: true,
        maxSelect: 2,
        options: ['我对情绪流动很敏感', '我习惯先想清楚再表达', '我需要独处来恢复能量', '我不喜欢拖着问题不处理'],
        maps: [{ emotionalNeed: 2 }, { rationality: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '自我画像',
        question: '理想里的长期关系，更像哪幅画面？',
        options: ['彼此偏爱是看得见的', '两个人稳稳站在同一边', '靠近时舒服，分开时也安心', '能一起把生活慢慢搭建起来'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { commitment: 1, action: 1 }]
      },
      {
        section: '自我画像',
        question: '面对不确定性时，你更常用哪种方式保护自己？',
        options: ['反复确认对方的心意', '先观察事实，不急着下注', '收回一点投入，守住边界', '主动问清楚，避免反复消耗'],
        maps: [{ emotionalNeed: 2 }, { rationality: 2 }, { independence: 2 }, { action: 2 }]
      }
    ];

    const relation = [
      {
        section: '关系观',
        question: '在你心里，成熟的亲密关系首先应该具备什么？',
        options: ['情绪能被看见和安放', '承诺是清楚的，也会被兑现', '差异可以被尊重，不互相吞没', '遇事时有人愿意一起面对'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '你更相信哪一种方式，能让关系走得更长久？',
        options: ['持续回应彼此的感受', '稳定一致的责任感', '保有空间，也保有理解', '愿意一次次共同修复'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '当关系进入平淡期时，你最希望两个人还能保留什么？',
        options: ['交流里仍有温度', '生活里仍有可靠的秩序', '亲密之外也各自舒展', '能一起创造新的经历和推进'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '如果两个人性格差异很大，你更期待怎样相处？',
        options: ['先理解彼此感受，再谈对错', '把规则和边界聊清楚', '允许彼此保留原本的节奏', '发现问题就尽快磨合出方法'],
        maps: [{ emotionalNeed: 2 }, { rationality: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '你更认同下面哪句话？',
        options: ['爱是被一再回应', '爱是长期认真对待', '爱是靠近时仍能做自己', '爱是一起把想象变成现实'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '下面哪些关系品质，会让你觉得值得深深托付？（可选 2 项）',
        multi: true,
        maxSelect: 2,
        options: ['共情与回应', '稳定与担当', '边界与分寸', '主动与兑现'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '当现实压力突然变大时，你更希望伴侣：',
        options: ['先让我觉得自己不是一个人在扛', '保持稳定，不轻易失序', '给彼此一点空间调整呼吸', '和我并肩想办法往前推'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '对你来说，安全感更像来自：',
        options: ['被持续回应，不被晾在原地', '被认真计划进未来里', '我可以安心做自己', '我能看见对方清晰的行动'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '你更喜欢怎样的恋爱氛围？',
        options: ['有温度，也有表达', '安稳、清楚、可依赖', '轻松、舒展、不压迫', '明亮、积极、有共同方向'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '如果关系推进变慢，你更在意的往往是：',
        options: ['是不是不够在意彼此的感受', '是不是缺少长期诚意', '是不是节奏不匹配、开始消耗', '是不是没人愿意真正推动'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '你觉得一段好的关系，应该怎样面对冲突？',
        options: ['不逃避情绪，也不否认伤心', '愿意对问题负责并复盘', '允许暂停，但不侵犯彼此边界', '尽量把裂缝修补在当下'],
        maps: [{ emotionalNeed: 2 }, { rationality: 1, commitment: 1 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '关系观',
        question: '你最想从亲密关系里获得的，是哪一种深层感受？',
        options: ['归属感', '确定感', '自由感', '共建感'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      }
    ];

    const preference = [
      {
        section: '择偶偏好',
        question: '你更容易被哪一种表达方式打动？',
        options: ['会认真听，也会温柔回应', '说话清楚，答应的事会做到', '尊重我的节奏，不逼迫不越界', '喜欢会主动靠近，也会拿出行动'],
        maps: [{ emotionalNeed: 2 }, { commitment: 1, rationality: 1 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '如果要一起过日常，你最看重对方哪种能力？',
        options: ['照顾情绪氛围的能力', '处理现实问题的稳定度', '与人相处的边界感', '把想法落地的执行力'],
        maps: [{ emotionalNeed: 2 }, { commitment: 1, rationality: 1 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '下面哪些特质，会让你更愿意长期靠近？（可选 2 项）',
        multi: true,
        maxSelect: 2,
        options: ['有回应感', '有责任感', '有边界感', '有行动力'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '你更适合怎样的联系节奏？',
        options: ['日常里会主动分享和回应', '规律出现，让人心里有数', '不必时时在线，但心里有彼此', '沟通直接高效，重要的事会同步'],
        maps: [{ emotionalNeed: 2 }, { commitment: 1, rationality: 1 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '在冲突修复这件事上，你欣赏的人更像：',
        options: ['愿意安抚，也愿意表达在意', '愿意沟通，也愿意承担责任', '先冷静，但不会失联', '不拖延，会主动推动修复'],
        maps: [{ emotionalNeed: 2 }, { rationality: 1, commitment: 1 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '你更期待对方怎样表达喜欢？',
        options: ['让我感受到被惦记和被接住', '让我看到长期诚意和一致性', '尊重我的节奏，不急着占据全部生活', '明确而坦荡地靠近，不让我猜'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '你更愿意把真心交给哪类人？',
        options: ['情绪细腻，愿意共情的人', '靠谱踏实，言行一致的人', '成熟自持，边界清楚的人', '热诚坚定，遇事不后退的人'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '如果一起规划未来，你更希望对方带来什么？',
        options: ['有温度的支持与陪伴', '稳妥的长期安排', '尊重彼此理想和空间', '明确方向并愿意共同推进'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { commitment: 1, action: 1 }]
      },
      {
        section: '择偶偏好',
        question: '你最不适合被哪种状态长久包围？',
        options: ['忽冷忽热、情绪失联', '承诺很多、落实很少', '控制过度、边界模糊', '长期观望、迟迟不行动'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '你更想和哪一种人慢慢相守？',
        options: ['有温柔的人', '有担当的人', '有分寸的人', '有魄力的人'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '当你说“我想要稳定”，你心里更接近的是：',
        options: ['我想被持续地在意和回应', '我想被认真地计划进未来', '我想在爱里仍然保有自己', '我想看到彼此明确地往前走'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      },
      {
        section: '择偶偏好',
        question: '下面哪些伴侣特质，会让你觉得“这段关系值得期待”？（可选 2 项）',
        multi: true,
        maxSelect: 2,
        options: ['能接住情绪', '能守住承诺', '能尊重差异', '能主动修复与推进'],
        maps: [{ emotionalNeed: 2 }, { commitment: 2 }, { independence: 2 }, { action: 2 }]
      }
    ];

    return [...self, ...relation, ...preference].map((item, index) => ({
      ...item,
      questionId: `${item.section}_${index}`,
      minSelect: 1,
      maxSelect: item.multi ? (item.maxSelect || 2) : 1
    }));
  }
});
