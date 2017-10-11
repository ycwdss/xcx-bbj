let util = require('../../utils/util.js');
Page({
    data: {
        warehouseId: '',
        asnCode: '',
        asnDetail: [],//详情
        currentTab: 0,//当前切换
        winWidth: 0,
        winHeight: 0,//系统高度
    },

    onLoad(options) {
        console.log(options)
        this.setData({
            warehouseId: options.warehouseId,
            asnCode: options.asnCode   //'ASN20170814X3QMK'
        })
    },
    onShow() {
        const that = this
        //获取系统信息，页面的高宽
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    winWidth: res.windowWidth,
                    winHeight: res.windowHeight
                });
            }
        });
        that.ajax()
    },
    //数据请求
    ajax() {
        const that = this
        wx.hideLoading()
        wx.showLoading({
            title: '加载中...',
        })
        util.fetch('/urfresh/wms/app/v1/queryAsnReceiveDetailResult', {
            warehouseId: that.data.warehouseId,
            asnNo: that.data.asnCode,
            userId: wx.getStorageSync("userInfo").id,
            userName: wx.getStorageSync("userInfo").userName
        }, res => {
            wx.hideLoading()
            if (res.result) {
                that.setData({
                    asnDetail: res.content
                })
            } else {
                wx.showModal({
                    title: '温馨提示',
                    content: res.content || '未知错误'
                })
            }
        })
    },
    //切换区域
    bindTab(e) {
        let index = e.target.dataset.index
        if (this.data.currentTab === index) {
            return false;
        } else {
            this.setData({
                currentTab: index
            })
        }
    },
    //滑块滑动
    bindSwiper(e) {
        this.setData({
            currentTab: e.detail.current
        });
    },
    //预览图片
    bindPreviewImg(e) {
        let imgUrls = Array.from(e.target.dataset.urls)
        console.log(imgUrls)
        wx.previewImage({
            current: '',
            urls: imgUrls,
        })
    }
})
