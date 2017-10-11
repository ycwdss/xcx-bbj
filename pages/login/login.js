let util = require('../../utils/util.js');

Page({
    data: {
        userName: '',
        passWord: '',
        flag: true,
    },
    onShow() {
        //若用户名和密码都存在时直接跳转到拣货页
        if (wx.getStorageSync("userInfo")) {
            wx.switchTab({url: '../index/index'});
        }
    },
    //用户名和密码输入框事件
    bindUserName(e) {
        this.setData({
            userName: e.detail.value
        })
    },
    bindPassWord(e) {
        this.setData({
            passWord: e.detail.value
        })
    },
    bindLogin() {
        const that = this
        if (that.data.flag) {
            that.setData({
                flag: false
            })
            if (!that.data.userName || !that.data.passWord) {
                that.setData({
                    flag: true,
                })
                wx.showModal({
                    title: '温馨提示',
                    content: '账号或密码不能为空，请重新输入!'
                })
            } else {
                that.setData({
                    flag: true
                })
                wx.showToast({
                    title: '登录中…',
                    icon: 'loading',
                    duration: 10000
                })
                util.fetch('/urfresh/wms/app/v1/doLogin', {
                    userName: that.data.userName,
                    password: that.data.passWord
                }, res => {
                    console.log(res)
                    wx.hideToast()
                    if (res.result) {
                        //登录后用户名存入本地
                        wx.setStorageSync('userInfo', res.content);
                        //登录后站点信息存入本地
                        wx.switchTab({url: '../index/index'})
                    } else {
                        wx.showModal({
                            title: '温馨提示',
                            content: res.remark
                        })
                    }
                })
            }
        }
    }
})