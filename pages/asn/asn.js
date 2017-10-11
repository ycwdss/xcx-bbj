let util = require('../../utils/util.js');
const qiniuUploader = require("../../utils/qiniuUploader");


Page({
    data: {
        diff: false,//显示差异
        asnCode: '',
        asnId: '',
        warehouseId: '',
        asnVal: '',//商品条码或者名称
        asnDetail: [],//asn详情
        asnAllDiff: [],//asn所有差异的详情
        currentTab: 0,//当前切换
        winWidth: 0,
        winHeight: 0,//系统高度
        badArr: ['-请选择坏品原因-'],//坏品原因数组
        badCode: ['Default'],//坏品原因code
        qiNiuToken: '',//七牛token
        picKey: [],
        badInfoOptions: [],//所有坏品信息
    },
    onLoad(options) {
        console.log(options)
        this.setData({
            warehouseId: options.warehouseId,
            asnId: options.asnId,
            asnCode: options.asnCode
        })
        this.asnDetailAjax();
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
        //坏品原因
        that.badReason()
        //七牛上传获取token
        util.fetch('/urfresh/wms//app/v1/getQiNiuToken', {}, res => {
            if (res.result) {
                that.setData({
                    qiNiuToken: res.content
                })
            } else {
                wx.hideLoading() //关闭加载中
                wx.showModal({
                    title: '温馨提示',
                    content: '获取token出错'
                })
            }
        })
    },
    scanCode() {
        const that = this
        wx.scanCode({
            success: function (res) {
                that.setData({
                    asnVal: res.result
                })
                that.asnDetailAjax();
            }
        })
    },
    //输入查询条件
    bindAsnVal(e) {
        this.setData({
            asnVal: e.detail.value,
        })
    },
    //清空输入条件
    bindDelFill() {
        this.setData({
            asnVal: ''
        })
    },
    //查询asn明细
    bindAsnDetail() {
        this.asnDetailAjax()
    },
    //查询asn明细数据请求
    asnDetailAjax() {
        const that = this
        wx.hideLoading()
        wx.showLoading({
            title: '加载中...',
        })
        //清空有数据
        that.setData({
            picKey: [],
            asnDetail: [],
            asnAllDiff: [],
            badInfoOptions: [],
        })
        let tab = [];
        util.fetch('/urfresh/wms/app/v1/queryAsnDetailGroupByTemp', {
                warehouseId: that.data.warehouseId,
                asnId: that.data.asnId,
                skuInfo: that.data.asnVal
            }, res => {
                wx.hideLoading() //关闭加载中
                if (res.result) {
                    res.content.forEach((item, index) => {
                            if (item.appAsnDetailEntities !== null) {
                                tab.push(index);
                            }
                        }
                    )
                    that.setData({
                        currentTab: tab[0],
                        asnDetail: res.content,
                    })
                }
                else {
                    wx.showModal({
                        title: '温馨提示',
                        content: res.content || '未知错误'
                    })
                }
            }
        )
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
    }
    ,
    //滑块滑动
    bindSwiper(e) {
        this.setData({
            currentTab: e.detail.current
        });
    },

    //坏品原因
    badReason() {
        const that = this
        util.fetch('/urfresh/wms/app/v1/queryDmReason', {
            warehouseId: that.data.warehouseId
        }, res => {
            if (res.result) {
                res.content.map(item => {
                    that.data.badArr.push(item.description)
                    that.data.badCode.push(item.configCode)
                    that.setData({
                        badArr: that.data.badArr,
                        badCode: that.data.badCode
                    })
                })
            } else {
                wx.showModal({
                    title: '温馨提示',
                    content: res.content || '未知错误'
                })
            }
        })
    },
    //点击添加坏品数量
    bindShowBad(e) {
        console.log(e)
        const that = this
        const id = e.target.dataset.id
        that.data.asnDetail.forEach((item, index) => {
            const appAsnDetailEntities = that.data.asnDetail[index].appAsnDetailEntities
            if (appAsnDetailEntities !== null) {
                appAsnDetailEntities.map(item => {
                    if (item.id === id) {
                        item.badReason = item.badReason === undefined ? [] : item.badReason
                        item.badImages = item.badImages === undefined ? [] : item.badImages
                        item.badNum = item.badNum === undefined ? [] : item.badNum
                        item.badStr = item.badStr === undefined ? [] : item.badStr
                        item.badCode = item.badCode === undefined ? [] : item.badCode
                        item.picKey = item.picKey === undefined ? [] : item.picKey
                        item.badReason.push({
                            index: 0,
                            option: that.data.badArr
                        })
                        item.badImages.push([])
                        item.badNum.push('')
                        item.badStr.push('')
                        item.badCode.push('')
                        item.picKey.push([])
                    }
                })
            }
        })
        that.setData({
            asnDetail: that.data.asnDetail,
        })
    },
    //选择坏品原因
    pickerReason(e) {
        const that = this
        const id = e.target.dataset.id //第几个商品
        const badIndex = parseInt(e.target.dataset.badindex) //第几个坏品原因
        const selectedIndex = parseInt(e.detail.value); //选择了哪个坏品
        console.log(badIndex)
        console.log(selectedIndex)

        let badReasonArr = []//保存
        that.data.asnDetail.forEach((item, index) => {
            const appAsnDetailEntities = that.data.asnDetail[index].appAsnDetailEntities
            if (appAsnDetailEntities !== null) {
                appAsnDetailEntities.map(item => {
                        if (item.id === id) {
                            //检测是否重复选择了
                            item.badReason.forEach((item, index) => {
                                //去除当前和默认选择原因的，写入数组
                                if (index !== badIndex && item.index !== 0) {
                                    badReasonArr.push(item.index)
                                }
                                return item
                            })
                            if (badReasonArr.includes(selectedIndex)) {
                                wx.showModal({
                                    title: '温馨提示',
                                    content: '坏品原因不能重复选择，请重新选择！',
                                })
                            } else {
                                item.badReason[badIndex].index = selectedIndex
                                item.badStr[badIndex] = selectedIndex === 0 ? '' : that.data.badArr[selectedIndex]
                                item.badCode[badIndex] = selectedIndex === 0 ? '' : that.data.badCode[selectedIndex]
                            }
                        }
                    }
                )
            }
        })
        that.setData({
            asnDetail: that.data.asnDetail,
        })
    },
    //实收好品数量
    bindReceiveGoodNum(e) {
        console.log(e)
        const that = this
        const planNum = parseInt(e.target.dataset.plannum)
        const goodNum = parseInt(e.detail.value)
        const id = e.target.dataset.id
        let num = '';
        let totalBadNum = 0

        that.data.asnDetail.forEach((item, index) => {
            const appAsnDetailEntities = that.data.asnDetail[index].appAsnDetailEntities
            if (appAsnDetailEntities !== null) {
                appAsnDetailEntities.map(item => {
                    if (item.id === id) {
                        //没有清空
                        //如果输入坏品
                        if (item.badNum !== undefined) {
                            item.badNum.forEach(item => {
                                if (item === '') {
                                    item = 0
                                }
                                totalBadNum += parseInt(item)
                            })
                        } else {
                            totalBadNum = 0
                        }

                        if (goodNum >= 0) {
                            item.isDiff = true;
                            item.goodNum = goodNum;
                            console.log('哈哈哈' + totalBadNum)
                            console.log('哈哈哈' + parseInt(totalBadNum))
                            num = goodNum + parseInt(totalBadNum) - planNum;
                        } else {//清空了
                            item.goodNum = '';
                            if (parseInt(totalBadNum) > 0) {
                                item.isDiff = true;
                                num = parseInt(totalBadNum) - planNum;
                            } else {
                                item.isDiff = false;
                            }
                        }
                        item.diffNum = num;
                    }
                    return item;
                })

            }
        })
        that.setData({
            asnDetail: that.data.asnDetail,
        })
    },
    //实收坏品数量
    bindReceiveBadNum(e) {
        const that = this
        const id = e.target.dataset.id
        const planNum = parseInt(e.target.dataset.plannum)
        const badIndex = e.target.dataset.badindex
        let totalBadNum = 0
        let num = 0
        let badVal = 0
        console.log(e.detail.value)

        if (e.detail.value === '' || parseInt(e.detail.value) <= 0) {
            badVal = '';
        } else {
            badVal = parseInt(e.detail.value)
        }
        that.data.asnDetail.forEach((item, index) => {
            const appAsnDetailEntities = that.data.asnDetail[index].appAsnDetailEntities
            if (appAsnDetailEntities !== null) {
                appAsnDetailEntities.map(item => {
                    if (item.id === id) {
                        item.badNum[badIndex] = badVal
                        item.isDiff = true;
                        //坏品总和
                        item.badNum.forEach((numItem, numIndex) => {
                            if (numItem === '') {
                                numItem = 0
                            }
                            totalBadNum += parseInt(numItem)
                        })
                        if (item.goodNum !== undefined && item.goodNum !== '') {
                            num = parseInt(totalBadNum) + parseInt(item.goodNum) - planNum;
                        } else {
                            num = parseInt(totalBadNum) - planNum;
                        }
                        item.diffNum = num;
                    }
                    return item;
                })
            }
        })
        that.setData({
            asnDetail: that.data.asnDetail,
        })
    },
    //选择图片
    chooseImage(e) {
        const that = this
        const badIndex = e.target.dataset.badindex
        const id = e.target.dataset.id
        wx.showActionSheet({
            itemList: ['拍照', '从相册中选择'],
            itemColor: "#333",
            success: function (res) {
                if (!res.cancel) {
                    if (res.tapIndex == 0) {
                        that.chooseWxImage('camera', badIndex, id)
                    } else if (res.tapIndex == 1) {
                        that.chooseWxImage('album', badIndex, id)
                    }
                }
            }
        })
    },
    //选择图片
    chooseWxImage(type, badIndex, id) {
        const that = this
        that.data.asnDetail.forEach((item, index) => {
            const appAsnDetailEntities = that.data.asnDetail[index].appAsnDetailEntities
            if (appAsnDetailEntities !== null) {
                appAsnDetailEntities.map(item => {
                    if (item.id === id) {
                        wx.chooseImage({
                            count: 6, // 默认9
                            sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
                            sourceType: [type], // 可以指定来源是相册还是相机，默认二者都有
                            success: function (res) {
                                // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                                item.badImages[badIndex] = [...item.badImages[badIndex], ...res.tempFilePaths]
                                that.setData({
                                    asnDetail: that.data.asnDetail,
                                })
                            }
                        })
                    }
                    return item;
                })
            }
        })
    },
    //图片预览
    previewImage(e) {
        const that = this
        const id = e.target.dataset.id
        const current = e.target.dataset.src
        const badIndex = e.target.dataset.badindex //添加的坏品几个区域
        that.data.asnDetail.forEach((item, index) => {
            const appAsnDetailEntities = that.data.asnDetail[index].appAsnDetailEntities
            if (appAsnDetailEntities !== null) {
                appAsnDetailEntities.map(item => {
                    if (item.id === id) {
                        wx.previewImage({
                            current: current,
                            urls: item.badImages[badIndex]
                        })
                    }
                    return item;
                })
            }
        })

    },
    //删除图片
    bindDelImg(e) {
        const that = this
        const id = e.target.dataset.id
        const badIndex = e.target.dataset.badindex //添加的坏品几个区域
        const badImgIndex = e.target.dataset.badimgindex //添加的图片的index
        console.log(id, badIndex, badImgIndex)
        that.data.asnDetail.forEach((item, index) => {
            const appAsnDetailEntities = that.data.asnDetail[index].appAsnDetailEntities
            if (appAsnDetailEntities !== null) {
                appAsnDetailEntities.map(item => {
                    if (item.id === id) {
                        item.badImages[badIndex].splice(badImgIndex, 1)
                    }
                    return item;
                })
            }
        })
        that.setData({
            asnDetail: that.data.asnDetail,
        })
    },
    //保存收货
    bindSave(e) {
        console.log(e)
        const that = this
        const id = e.target.dataset.id
        const skuId = e.target.dataset.skuid
        const goodNum = e.target.dataset.goodnum

        let badInfo = []
        let badOptions = []
        let badImagesArr = []
        let badAll = []
        let flag = 0

        wx.hideLoading()
        wx.showLoading({
            title: '保存中...',
        })
        that.setData({
            picKey: [],
        })

        that.data.asnDetail.forEach((item, index) => {
            const appAsnDetailEntities = that.data.asnDetail[index].appAsnDetailEntities
            if (appAsnDetailEntities !== null) {
                appAsnDetailEntities.map(item => {
                        if (item.id === id) {
                            //如果说没有点击原因
                            if (item.badImages === undefined) {
                                //没有好品输入数量
                                if (item.goodNum === undefined || item.goodNum === '' || parseInt(item.goodNum) === 0) {
                                    wx.hideLoading()//关闭加载中
                                    wx.showModal({
                                        title: '温馨提示',
                                        content: '请输入收货数量！'
                                    })
                                } else {
                                    //多收的话有弹窗
                                    if (parseInt(item.diffNum) > 0) {
                                        wx.hideLoading()//关闭加载中
                                        wx.showModal({
                                            title: '多收确认',
                                            content: '本次保存后，将超过发货数' + item.diffNum + item.receiveUnitName + '！',
                                            success: function (res) {
                                                if (res.confirm) {
                                                    console.log('用户点击确定')
                                                    that.saveAjax(id, skuId, goodNum)
                                                }
                                            }
                                        })

                                    } else {
                                        //少收的话直接跳过
                                        that.saveAjax(id, skuId, goodNum)
                                    }
                                }
                            } else if (item.badImages !== undefined) {
                                //抽出每一项组合成对象
                                item.badImages.forEach((citem, cindex) => {
                                    return badInfo.push(
                                        {
                                            badImages: item.badImages[cindex],
                                            badNum: item.badNum[cindex],
                                            badStr: item.badStr[cindex],
                                            badCode: item.badCode[cindex],
                                            picKey: item.picKey[cindex]
                                        }
                                    )
                                })

                                //遍历，在抽出符合条件的
                                badInfo.forEach((badItem, badindex) => {
                                    if ((badItem.badImages.length > 0 && badItem.badNum === '' && badItem.badCode === '') ||
                                        (badItem.badImages.length === 0 && badItem.badNum !== '' && badItem.badCode === '') ||
                                        (badItem.badImages.length === 0 && badItem.badNum === '' && badItem.badCode !== '') ||
                                        (badItem.badImages.length > 0 && badItem.badNum !== '' && badItem.badCode === '') ||
                                        (badItem.badImages.length > 0 && badItem.badNum === '' && badItem.badCode !== '') ||
                                        (badItem.badImages.length === 0 && badItem.badNum !== '' && badItem.badCode !== '')
                                    ) {
                                        flag = 1 //部分输入
                                    } else if (badItem.badImages.length !== 0 && badItem.badNum !== '' && badItem.badCode !== '') {
                                        //都输入 抽出符合条件的
                                        badOptions.push({
                                            badImages: badItem.badImages,
                                            badNum: badItem.badNum,
                                            badCode: badItem.badCode,
                                            badStr: badItem.badStr,
                                        })
                                    }
                                    //没有输入的
                                    if (badItem.badImages.length === 0 && badItem.badNum === '' && badItem.badCode === '') {
                                        badAll.push({
                                            badImages: badItem.badImages,
                                            badNum: badItem.badNum,
                                            badCode: badItem.badCode,
                                            badStr: badItem.badStr,
                                        })
                                    }
                                })

                                if (badInfo.length === badAll.length) {
                                    console.log('坏品都没有输入')
                                    //没有好品输入数量
                                    console.log('好品数量啊啊啊' + item.goodNum)
                                    if (item.goodNum === undefined || item.goodNum === '' || parseInt(item.goodNum) === 0) {
                                        wx.hideLoading()//关闭加载中
                                        wx.showModal({
                                            title: '温馨提示',
                                            content: '请输入收货数量！'
                                        })
                                    } else {
                                        //多收的话有弹窗
                                        if (parseInt(item.diffNum) > 0) {
                                            wx.hideLoading()//关闭加载中
                                            wx.showModal({
                                                title: '多收确认',
                                                content: '本次保存后，将超过发货数' + item.diffNum + item.receiveUnitName + '！',
                                                success: function (res) {
                                                    if (res.confirm) {
                                                        console.log('用户点击确定')
                                                        that.saveAjax(id, skuId, goodNum)
                                                    }
                                                }
                                            })

                                        } else {
                                            //少收的话直接跳过
                                            that.saveAjax(id, skuId, goodNum)
                                        }
                                    }
                                }
                                //不符合条件的
                                console.log('flag' + flag)
                                if (flag === 1) {
                                    wx.hideLoading()//关闭加载中
                                    wx.showModal({
                                        title: '温馨提示',
                                        content: '请把已填坏品原因列补充完成！'
                                    })
                                }

                                //符合条件的坏品原因在遍历上传
                                console.log(badOptions)
                                if (flag !== 1) {
                                    badOptions.forEach((opItem, opIndex) => {
                                        let timeStamp = +new Date()
                                        let picMark = ''
                                        console.log(opItem.badImages)
                                        badImagesArr = [...badImagesArr, ...opItem.badImages]
                                        opItem.badImages.forEach((imgItem, index) => {
                                            qiniuUploader.upload(imgItem, (res) => {
                                                console.log(res.key)
                                                picMark += res.key + ';'
                                                console.log(picMark)
                                                that.data.picKey.push(res.key)
                                                that.data.badInfoOptions[opIndex] = {
                                                    receiveBadQty: opItem.badNum,
                                                    damagedReason: opItem.badCode,
                                                    damagedReasonDesc: opItem.badStr,
                                                    picKey: picMark
                                                }
                                                that.setData({
                                                    badInfoOptions: that.data.badInfoOptions
                                                })
                                            }, (error) => {
                                                wx.hideLoading()//关闭加载中
                                                wx.showModal({
                                                    title: '温馨提示',
                                                    content: '图片上传失败，' + JSON.stringify(error)
                                                })
                                            }, {
                                                region: 'ECN', // 华东区
                                                uptoken: that.data.qiNiuToken,
                                                key: timeStamp + imgItem.substr(-8),
                                            });
                                        })
                                        that.setData({
                                            badImagesArr: that.data.badImagesArr,
                                            picKey: that.data.picKey
                                        })

                                    })
                                }
                                console.log(badImagesArr.length)
                                console.log(that.data.picKey.length)
                                var timer = setInterval(() => {
                                    if (badImagesArr.length === that.data.picKey.length && that.data.picKey.length !== 0 && badImagesArr.length !== 0) {
                                        clearInterval(timer);
                                        //多收的话有弹窗
                                        if (parseInt(item.diffNum) > 0) {
                                            wx.hideLoading()//关闭加载中
                                            wx.showModal({
                                                title: '多收确认',
                                                content: '本次保存后，将超过发货数' + item.diffNum + item.receiveUnitName + '！',
                                                success: function (res) {
                                                    if (res.confirm) {
                                                        console.log('用户点击确定')
                                                        that.saveAjax(id, skuId, goodNum)
                                                    }
                                                }
                                            })
                                        } else {
                                            //少收的话直接跳过
                                            that.saveAjax(id, skuId, goodNum)
                                        }
                                    }
                                }, 200)
                            }
                        }
                    }
                )
            }
        })

    },
    //保存ajax
    saveAjax(id, skuId, goodNum) {
        const that = this
        util.fetch('/urfresh/wms/app/v1/receivePutaway', {
            id: id,
            skuId: skuId,
            actReceiveGoodQty: goodNum,
            warehouseId: that.data.warehouseId,
            asnHeaderId: that.data.asnId,
            userId: wx.getStorageSync("userInfo").id,
            userName: wx.getStorageSync("userInfo").userName,
            receiveBadEntities: that.data.badInfoOptions
        }, res => {
            wx.hideLoading()
            that.setData({
                badInfoOptions: [],
            })
            if (res.result) {
                that.setData({
                    asnDetail: res.content,
                })
                wx.showToast({
                    title: '保存成功！',
                    icon: 'success',
                    duration: 1000,
                    image: './../../images/get.png'
                })
            } else {
                wx.showModal({
                    title: '温馨提示',
                    content: res.content || '未知错误'
                })
            }
        })
    },
    //确认完成
    bindOk() {
        const that = this
        let diffArr = []
        //显示此asn下所有的差异
        util.fetch('/urfresh/wms/app/v1/queryAsnReceiveDetailResult', {
            warehouseId: that.data.warehouseId,
            asnNo: that.data.asnCode,
            userId: wx.getStorageSync("userInfo").id,
            userName: wx.getStorageSync("userInfo").userName
        }, res => {
            if (res.result) {
                console.log(res)
                //显示差异内容
                res.content.asnReceiveDetails.forEach((item, index) => {
                        const receiveDetails = item.receiveDetails
                        if (receiveDetails !== null) {
                            receiveDetails.map(item => {
                                diffArr.push(item)
                                item.diffNum = -item.discrepantCount
                                return item;
                            })
                        }
                        return diffArr;
                    }
                )
                that.setData({
                    asnAllDiff: diffArr.sort(util.rank('diffNum')),
                    diff: true,//显示差异
                })
            } else {
                wx.showModal({
                    title: '温馨提示',
                    content: res.content || '未知错误'
                })
            }
        })
    },
    //取消
    bindCancel() {
        this.setData({
            asnAllDiff: [],//清空数据
            diff: false,//关闭差异
        })
    },
    //确认差异
    bindMake() {
        const that = this
        util.fetch('/urfresh/wms/app/v1/confirmFinishReceive', {
            warehouseId: that.data.warehouseId,
            asnNo: that.data.asnCode,
            userId: wx.getStorageSync("userInfo").id,
            userName: wx.getStorageSync("userInfo").userName
        }, res => {
            wx.hideLoading()
            if (res.result) {
                wx.showToast({
                    title: '确认成功！',
                    icon: 'success',
                    duration: 1000,
                    image: './../../images/get.png'
                })
                setTimeout(() => {
                    wx.switchTab({
                        url: '../index/index'
                    });
                }, 1000)
            } else {
                wx.showModal({
                    title: '温馨提示',
                    content: res.content || '未知错误'
                })
            }
        })
    },
    //预览图片
    bindPreviewImg(e) {
        let urls = Array.from(e.target.dataset.urls)
        wx.previewImage({
            current: '',
            urls: urls,
        })
    }
})
