Page({
  data: {
    isAgreed: false // 默认不勾选协议，符合规范
  },

  // 切换协议勾选状态
  toggleAgreement() {
    this.setData({
      isAgreed: !this.data.isAgreed
    });
  },

  // 点击开始按钮
  handleStart() {
    if (!this.data.isAgreed) {
      wx.showToast({
        title: '请先阅读并同意用户协议',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    wx.showLoading({ title: '加载中...' });
    
    // 模拟跳转逻辑
    setTimeout(() => {
      wx.hideLoading();
      wx.navigateTo({ url: '/pages/info/info' });
      wx.showToast({
        title: '进入测试',
        icon: 'success'
      });
    }, 800);
  }
})