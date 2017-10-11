let util = require('../../utils/util.js');
//获取应用实例
Page({
    data: {
        index: 0,
        siteArray: [],
        warehouseId: '',
        userId: '',
        startDate: '',//开始时间
        endDate: '',//结束时间
        asnCode: '',//asn单号
        refOrderCode: '',//关联单号
        asnOrder: [],//asn订单

        loadMore: false,//加载更多
        loadMoreMsg: '',//加载更多文字
        currentPage: 1,//当前页数
        pageSize:10,//每次加载显示多少个
        totalPage: '',//总页数
        dataNull: false,//查询结果是否为空
    },
    onShow() {
        this.query();
    },
    onLoad() {
        const that = this
        //获取站点
        const userInfo = wx.getStorageSync("userInfo") //获取用户信息
        //设置查询时间
        let nowTime = +new Date();
        let weekTime = +new Date(nowTime - 3 * 24 * 3600 * 1000);

        that.setData({
            userId: userInfo.id,
            startDate: util.change(weekTime),
            endDate: util.change(nowTime),
        })
        that.querySite(that.data.userId)
    },
    //选择站点
    pickerSite(e) {
        const that = this
        let index = e.detail.value
        that.setData({
            index: index,
            warehouseId: that.data.siteArray[index].warehouseId
        });
    },
    //开始时间
    pickerStartDate(e) {
        this.setData({
            startDate: e.detail.value
        })
    },
    //结束时间
    pickerEndDate(e) {
        this.setData({
            endDate: e.detail.value
        })
    },
    //输入asn单号
    bindAsnCode(e) {
        console.log(e)
        this.setData({
            asnCode: e.detail.value
        })
    },
    //清空asn单号
    bindDelAsnCode() {
        this.setData({
            asnCode: ''
        })
    },
    //关联单号
    bindRefCode(e) {
        this.setData({
            refOrderCode: e.detail.value
        })
    },
    //关联单号
    bindDelRefOrderCode() {
        this.setData({
            refOrderCode: ''
        })
    },
    //到达底部
    onReachBottom() {
        console.log('到底部了')
        const that = this
        this.setData({
            loadMore: true,
            loadMoreMsg: '加载中...',//文字提示
            currentPage: that.data.currentPage + 1,
        })
        if (that.data.currentPage <= that.data.totalPage) {
            that.ajax(that.data.currentPage);
        } else {
            that.setData({
                loadMore: true,
                loadMoreMsg: '数据加载完成',//文字提示
            })
        }
    },
    //查询
    query() {
        const that = this
        that.setData({
            asnOrder: [],//点击查询的时候清空数据
            currentPage: 1,
        })
        that.ajax(that.data.currentPage);
    },
    //获取数据
    ajax(currentPage) {
        const that = this
        wx.hideLoading()
        wx.showLoading({
            title: '加载中...',
        })
        util.fetch('/urfresh/wms/app/v1/queryAsnForReceive', {
            warehouseId: that.data.warehouseId,
            userId: that.data.userId,
            startTime: that.data.startDate + ' 00:01:01',
            endTime: that.data.endDate + ' 23:59:59',
            asnCode: that.data.asnCode,
            refOrderCode: that.data.refOrderCode,
            currentPage: currentPage,
            pageSize: that.data.pageSize
        }, res => {
            wx.hideLoading()//关闭正在加载中
            if (res.result) {
                //站点有数据
                if (res.content.totalCount > 0) {
                    let ansOrder = res.content.appAsnHeaderEntities
                    let totalPage = res.content.totalPage
                    ansOrder.map(item => {
                        item.gmtCreate = util.change(item.gmtCreate)
                        return item
                    })
                    that.setData({
                        asnOrder: that.data.asnOrder.concat(ansOrder),
                        totalPage: totalPage,
                        dataNull: false,//查询有数据
                    })
                } else {
                    //站点没有数据
                    that.setData({
                        asnOrder: [],//清空所有数据
                        totalPage: '',//清空总页数
                        dataNull: true,//查询无数据
                        loadMore: false,//加载更多
                    })
                }
            } else {
                that.setData({
                    asnOrder: [],//清空所有数据
                    totalPage: '',//清空总页数
                    dataNull: true,//查询无数据
                    loadMore: false,//加载更多
                })
            }
        })
    },
    //查看详情
    bindResult(e) {
        console.log(e)
        const warehouseId = this.data.warehouseId
        const asnCode = e.target.dataset.asncode
        const asnId = e.target.dataset.asnid
        const orderStatus = e.target.dataset.orderstatus
        //收货完成
        if (orderStatus === '99') {
            wx.navigateTo({
                url: './../detail/detail?warehouseId=' + `${warehouseId}` + '&asnCode=' + `${asnCode}`
            })
        } else {
            wx.navigateTo({
                url: './../asn/asn?warehouseId=' + `${warehouseId}` + '&asnId=' + `${asnId}` + '&asnCode=' + `${asnCode}`
            })
        }

    },
    //获取站点
    querySite(userId) {
        const that = this
        //获取站点列表
        util.fetch("/urfresh/wms/app/v1/queryWhList", {
                userId: userId,
            },
            res => {
                if (res.result) {
                    that.setData({
                        siteArray: res.content,
                        warehouseId: res.content[0].warehouseId//默认值
                    })
                } else {
                    wx.showModal({
                        title: '温馨提示',
                        content: res.content || '未知错误'
                    })
                }
            }
        )
    }
})
