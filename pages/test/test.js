Page({
  data: {
    current: 0,
    total: 36,
    selectedIndexes: [],
    answers: [],
    questions: [],
    currentOptions: []
  },

  onLoad() {
    const questions = this.buildPaper();
    const answers = questions.map(() => []);

    this.setData({
      questions,
      total: questions.length,
      answers,
      current: 0,
      selectedIndexes: []
    });

    this.refreshCurrentOptions();
    this.saveCurrentPaper(questions);
    this.checkSavedResult();
  },

  getPaperStorageKey() {
    const userId = wx.getStorageSync('userId') || 'guest';
    return `current_test_paper_${userId}`;
  },

  getResultStorageKey() {
    const userId = wx.getStorageSync('userId') || 'guest';
    return `test_result_${userId}`;
  },

  saveCurrentPaper(questions) {
    wx.setStorageSync(this.getPaperStorageKey(), questions);
  },

  buildPaper() {
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
  },

  checkSavedResult() {
    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    const local = wx.getStorageSync(this.getResultStorageKey());
    if (local && local.type && local.algorithmVersion === 'v6.1') {
      this.restoreCompletedTestState(local.answers);
      wx.navigateTo({
        url: `/pages/result/result?result=${encodeURIComponent(JSON.stringify(local))}`
      });
    }
  },

  restoreCompletedTestState(savedAnswers) {
    const total = this.data.questions.length;
    const answers = Array.isArray(savedAnswers) && savedAnswers.length === total
      ? savedAnswers.map(item => this.normalizeAnswer(item))
      : new Array(total).fill([]);

    const lastIndex = total - 1;
    const lastSelected = this.normalizeAnswer(answers[lastIndex]);

    this.setData({
      total,
      answers,
      current: lastIndex,
      selectedIndexes: lastSelected
    });

    this.refreshCurrentOptions();
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

  refreshCurrentOptions() {
    const question = this.data.questions[this.data.current] || {};
    const selectedIndexes = this.data.selectedIndexes || [];
    const letters = ['A', 'B', 'C', 'D'];

    const currentOptions = (question.options || []).map((text, index) => ({
      index,
      letter: letters[index] || '',
      text,
      active: selectedIndexes.includes(index)
    }));

    this.setData({ currentOptions });
  },

  selectOption(e) {
    const index = Number(e.currentTarget.dataset.index);
    const question = this.data.questions[this.data.current] || {};
    const maxSelect = question.maxSelect || 1;
    let selectedIndexes = [...this.data.selectedIndexes];

    if (maxSelect === 1) {
      selectedIndexes = [index];
    } else if (selectedIndexes.includes(index)) {
      selectedIndexes = selectedIndexes.filter(item => item !== index);
    } else if (selectedIndexes.length >= maxSelect) {
      wx.showToast({
        title: `这一题最多选 ${maxSelect} 项`,
        icon: 'none'
      });
      return;
    } else {
      selectedIndexes.push(index);
    }

    const answers = [...this.data.answers];
    answers[this.data.current] = [...selectedIndexes];

    wx.vibrateShort({ type: 'light' });

    this.setData({
      selectedIndexes,
      answers
    }, () => {
      this.refreshCurrentOptions();
    });
  },

  prevQuestion() {
    if (this.data.current > 0) {
      const prev = this.data.current - 1;
      this.setData({
        current: prev,
        selectedIndexes: this.normalizeAnswer(this.data.answers[prev])
      }, () => {
        this.refreshCurrentOptions();
      });
    }
  },

  nextQuestion() {
    const question = this.data.questions[this.data.current] || {};
    const selectedCount = this.data.selectedIndexes.length;
    const minSelect = question.minSelect || 1;

    if (selectedCount < minSelect) {
      wx.showToast({
        title: question.multi ? `请至少选择 ${minSelect} 项` : '请选择一个选项',
        icon: 'none'
      });
      return;
    }

    if (this.data.current === this.data.total - 1) {
      wx.vibrateShort({ type: 'medium' });
      wx.navigateTo({
        url: `/pages/result/result?answers=${encodeURIComponent(JSON.stringify(this.data.answers))}&paper=${encodeURIComponent(JSON.stringify(this.data.questions))}`
      });
      return;
    }

    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });

    const next = this.data.current + 1;
    this.setData({
      current: next,
      selectedIndexes: this.normalizeAnswer(this.data.answers[next])
    }, () => {
      this.refreshCurrentOptions();
    });
  }
});
