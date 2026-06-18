App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库');
    } else {
      wx.cloud.init({
        env: 'cloud1-5g0r0fa1e7c3d859',  // 在云开发控制台可以看到
        traceUser: true
      });
    }

    // 获取用户openid
    this.getOpenId();
  },

  async getOpenId() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOpenid'
      });
      
      wx.setStorageSync('openid', res.result.openid);
    } catch (err) {
      console.error('获取openid失败', err);
    }
  },

  globalData: {
    userInfo: null,
    openid: null
  }
});