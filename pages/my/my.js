let util = require('../../utils/util.js');

Page({
    data: {},
    logOut() {
        const userInfo = wx.getStorageSync("userInfo") //获取用户信息
        wx.showToast({
            title: '正在退出…',
            icon: 'loading',
            duration: 5000
        })
        util.fetch('/urfresh/wms/app/v1/logOut', {
            userId: userInfo.id
        }, res => {
            console.log(res)
            wx.hideToast()
            if (res.result) {
                //退出登录清空数据
                wx.clearStorageSync();
                //登录后站点信息存入本地
                wx.redirectTo({url: '../login/login'})

            } else {
                wx.showModal({
                    title: '温馨提示',
                    content: res.remark
                })
            }
        })
    }
})
