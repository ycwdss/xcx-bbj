//let ajaxUrl = 'https://scm-h5.urfresh.cn'
let ajaxUrl = 'https://scm-h5-test-office.urfresh.cn'
//通用Ajax请求接口
let fetch = (url, datas, callback) => {
    wx.request({
        url: ajaxUrl + url,
        method: 'POST',
        data: {
            reqData: JSON.stringify(datas),
            reqTime: +new Date(),
            jsessionid: wx.getStorageSync('userInfo') ? wx.getStorageSync('userInfo').jsessionid : ''
        },
        header: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        complete: function (res) {
            if (res.statusCode == 200) {
               // res.data.resultCode = -1
                //登录超时
                if (res.data.resultCode == -1 || res.data.remark == '登录超时') {
                    wx.hideLoading()
                    wx.showLoading({
                        title: '登录超时，请重新登录！',
                    })
                    //退出清空数据
                    wx.clearStorageSync();
                    setTimeout(function () {
                        wx.redirectTo({url: '../login/login'})
                    }, 2000)
                } else {
                    callback.call(null, res.data);
                }
            } else {
                wx.hideLoading()
                wx.showModal({
                    title: '温馨提示',
                    content: '服务器错误' + (res.statusCode || '，连接超时')
                })
            }

        }
    })
}
//时间转换
let change = (createTimestamp) => {
    Date.prototype.format = function (format) {
        if (isNaN(this)) return '';
        var o = {
            'm+': this.getMonth() + 1,
            'd+': this.getDate(),
            'h+': this.getHours(),
            'n+': this.getMinutes(),
            's+': this.getSeconds(),
            'S': this.getMilliseconds(),
            'W': ["日", "一", "二", "三", "四", "五", "六"][this.getDay()],
            'q+': Math.floor((this.getMonth() + 3) / 3)
        };
        if (format.indexOf('am/pm') >= 0) {
            format = format.replace('am/pm', (o['h+'] >= 12) ? '下午' : '上午');
            if (o['h+'] >= 12) o['h+'] -= 12;
        }
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    }
    var postYear = new Date(createTimestamp).format('yyyy');
    var postMonth = new Date(createTimestamp).format('mm');
    var postDate = new Date(createTimestamp).format('dd');
    var postHours = new Date(createTimestamp).format('hh');
    var postMinutes = new Date(createTimestamp).format('nn');
    return postYear + '-' + postMonth + '-' + postDate
}

let rank = (property) => {
    return function (a, b) {
        var value1 = a[property];
        var value2 = b[property];
        return value1 - value2;
    }
}

module.exports = {
    fetch: fetch,
    change: change,
    rank: rank
}
