/**
 * Created by feng on 2018/3/26.
 */

//登录
$(function () {

    let token;
    let userId;
    let phone;
    let formData;
    let formDataReject;

    let orderNo;//订单编号
    let query = null;
    let queryMeitong = null;
    let hasMore;
    let hasMoreMeitong;
    let page = 1;
    let pageMeitong = 1;
    let pullRefreshY = 0;//我的表单(电子券)列表页，下拉刷新距离标志
    let pullRefreshYMeitong = 0;//我的表单(美通卡)列表页，下拉刷新距离标志
    let submitting = false;//防止今日表单重复提交

    let fromMyFormFlag = true; //默认详情来自我的订单

    let orderNoReject;//驳回订单编号
    let queryReject = null;
    let queryRejectMeitong = null;
    let hasMoreReject;
    let hasMoreRejectMeitong;
    let pageReject = 1;
    let pageRejectMeitong = 1;
    let pullRefreshYReject = 0;//驳回表单列表页，下拉刷新距离标志
    let pullRefreshYRejectMeitong = 0;//驳回表单列表页，下拉刷新距离标志
    let submittingReject = false;//防止今日表单重复提交

    let repasswordSaving = false;
    let modifying = false;

    let rejectFlag = false;

    let exchangeType = 0;//默认是电子券（记录表单用）
    let exchangeTypeSearch = 0;//默认是电子券（查询订单用）
    let exchangeTypeModify = 0;//默认是电子券（修改订单用）
    let exchangeTypeRejectSearch = 0;//默认是电子券（查询驳回表单用）
    let exchangeTypeAddNew = 0; //默认是电子券（新增表单用）
    let dianziPullRefreshing = false;
    let meitongPullRefreshing = false;
    let dianziPullRefreshingReject = false;
    let meitongPullRefreshingReject = false;

    let addNewSaving = false;

    //登录
    login();

    function login() {
        let logining = false;
        $('#submit').on('tap', () => {
            let username = $('#username').val();
            let password = $('#password').val();
            if (!username || !password) {
                if (!username) {
                    $('#warning').text('请输入账号').show();
                    $('#username').focus();
                }
                if (!password) {
                    $('#warning').text('请输入密码').show();
                    $('#password').focus();
                }
            } else {
                $('#warning').css({display: 'none'});
                password = md5(password).toUpperCase();
                let data = {username, password};

                if (!logining) {
                    logining = true;
                    $.ajax({
                        url: domain + '/login',
                        type: 'POST',
                        cache: true,
                        dataType: 'json',
                        data,
                        success: (result) => {
                            if (result.code == 'SUCCESS') {
                                //console.log(result, 'login--data');
                                token = result.token;
                                userId = result.userId;

                                sessionStorage.setItem('loginFlag', result.loginFlag);
                                //初始化底部导航点击事件
                                footNav();
                                if (result.loginFlag == 1) {
                                    //非原始密码登录，跳转到记录表单页
                                    $('#record').show().siblings().hide();
                                    record();
                                    //非原始密码登录，修改密码页添加返回按钮，
                                    $('#repassword .header-bar .left').html('<i class="iconfont icon-back"></i>');
                                    rePasswordBack();

                                    getReject();//查看是否有驳回表单

                                } else {
                                    //如果是原始密码登录，则跳转到修改密码页
                                    $('#repassword').show();
                                    $('#info-box').hide();
                                    $('#myAccount').show().siblings().hide();
                                    getAccountInfo();//获取手机号
                                }


                                //置空账号和密码框
                                $('#username').val('');
                                $('#password').val('');

                            } else {
                                $('#warning').text(result.msg).show();
                                layer.open({
                                    content: result.msg
                                    , skin: 'msg'
                                    , time: 3 //2秒后自动关闭
                                });
                            }
                        },
                        error: (err) => {
                            console.log(err);
                            layer.open({
                                content: err
                                , skin: 'msg'
                                , time: 3 //2秒后自动关闭
                            });
                        },
                        complete: (result) => {
                            logining = false;
                        }
                    });
                }

            }

        });
    }

    //登录成功后需先查看是否有驳回表单
    function getReject() {
        $.ajax({
            url: domain + '/order/reject/count',
            type: 'GET',
            dataType: 'json',
            headers: {
                token,
                userId
            },
            success: (result) => {
                if (result.code == 'SUCCESS') {
                    if (result.count > 0) {
                        rejectFlag = true;
                        let reject = $('.reject');
                        if (result.rejectReason && result.rejectReason != null) {
                            $('.reject-reason').text("(驳回理由：" + result.rejectReason + ")");
                        }else {
                            $('.reject-reason').text('');
                        }
                        reject.show();
                    }
                } else {
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                }
            },
            error: (err) => {
                console.log(err);
            },
            complete: () => {

            }
        })
    }


    //底部导航
    function footNav() {
        let submitFormFlag = false;
        let getAccountInfoFlag = false;

        let loginFlag = sessionStorage.getItem('loginFlag');
        if (loginFlag == 1) {
            $('footer').off('tap');//去除底部导航的不可点击事件
            $('footer .record').off('tap');
            $('footer .record').on('tap', function () {
                $('#record').show().siblings().hide();

            });
            $('footer .my-form').off('tap');
            $('footer .my-form').on('tap', function () {
                $('#my-form').show().siblings().hide();
                if ($(window).scrollTop() > 0) {
                    $(window).scrollTop(0);
                }

                myScroll.refresh();
                myScrollMeitong.refresh();
                myScrollReject.refresh();
                myScrollRejectMeitong.refresh();
                if (!submitFormFlag) {
                    query = null;
                    page = 1;
                    submitForm();
                    submitFormFlag = true
                }

            });
            $('footer .my-account').off('tap');
            $('footer .my-account').on('tap', function () {
                $('#myAccount').show().siblings().hide();

                if (!getAccountInfoFlag) {

                    getAccountInfo();
                    getAccountInfoFlag = true;
                }

            });
        } else {
            //底部导航不可点击状态
            $('footer').on('tap', function () {
                layer.open({
                    content: '修改密码后才可以正常使用',
                    skin: 'msg',
                    time: 3
                })
            })
        }

    }


    /*修改密码*/
    rePassword();

    function rePassword() {//static
        let timer = null;
        $('#get-identify').on('tap', getIdentify);

        //获取验证码
        function getIdentify() {
            let oldPassword = $('#old-password').val();
            let newPassword = $('#new-password').val();
            let newPasswordAgain = $('#new-password-again').val();

            if (!!oldPassword && !!newPassword && !!newPasswordAgain && newPassword == newPasswordAgain) {

                //验证通过开始倒计时
                let num = 60;
                clearInterval(timer);
                $('#time').text(num + 's');
                timer = setInterval(() => {
                    num--;
                    if (num >= 0) {
                        $('#time').text(num + 's');
                    } else {
                        clearInterval(timer);
                        $('#time').text('重新获取');
                        $('#get-identify').on('tap', getIdentify);//添加点击事件
                    }
                }, 1000);
                $('#get-identify').off('tap', getIdentify);//去除点击事件

                $.ajax({
                    url: domain + '/sms',
                    type: 'POST',
                    cache: true,
                    dataType: 'json',
                    data: {phone, type: '1'},
                    headers: {
                        token,
                        userId
                    },
                    success: (result) => {
                        if (result.code == 'SUCCESS') {
                            //啥也不干

                        } else {
                            $('#tips').text(result.msg).show();
                            loginAgain(result.code);
                            layer.open({
                                content: result.msg
                                , skin: 'msg'
                                , time: 3 //2秒后自动关闭
                            });
                        }

                    },
                    error: (err) => {
                        console.log(err);
                    }
                })
            } else {
                if (!oldPassword) {
                    $('#tips').text('请输入旧密码').parent().show();
                } else if (!newPassword) {
                    $('#tips').text('请输入新密码').parent().show();
                } else if (!newPasswordAgain) {
                    $('#tips').text('请再次输入新密码').parent().show();
                } else if (newPassword != newPasswordAgain) {
                    $('#tips').text('密码输入不一致，请重新输入').parent().show();
                }
            }
        }

        //保存密码
        $('#save').on('tap', savePassword);

        function savePassword() {

            let oldPassword = $('#old-password').val();
            let newPassword = $('#new-password').val();
            let newPasswordAgain = $('#new-password-again').val();
            let identify = $('#identify').val();
            if (!!oldPassword && !!newPassword && !!newPasswordAgain && !!identify && newPassword == newPasswordAgain) {
                // 需md5加密并转大写！
                oldPassword = md5(oldPassword).toUpperCase();
                newPassword = md5(newPassword).toUpperCase();
                newPasswordAgain = md5(newPasswordAgain).toUpperCase();
                //$('#save').off('tap');
                if (!repasswordSaving) {
                    repasswordSaving = true;
                    $.ajax({
                        url: domain + '/repassword',
                        type: 'POST',
                        cache: true,
                        dataType: 'json',
                        data: {oldPassword, newPassword, confirmPassword: newPasswordAgain, smsCode: identify},
                        headers: {
                            token,
                            userId
                        },
                        success: (result) => {
                            if (result.code == 'SUCCESS') {
                                $('#login').show().siblings().hide();//跳转到登录页
                                $('#repassword').hide();
                                $('#info-box').show();
                                $('#repassword input').val('');

                                //修改密码成功后初始化获取验证码
                                clearInterval(timer);
                                $('#time').text('获取验证码');
                                $('#get-identify').off('tap');
                                $('#get-identify').on('tap', getIdentify);//添加点击事件

                            } else {
                                loginAgain(result.code);
                                layer.open({
                                    content: result.msg
                                    , skin: 'msg'
                                    , time: 3 //2秒后自动关闭
                                });
                                $('#tips').text(result.msg).css({display: 'block'});
                            }

                        },
                        error: (err) => {
                            console.log(err);
                        },
                        complete: (result) => {
                            //$('#save').on('tap',savePassword);
                            repasswordSaving = false;
                        }
                    })
                }


            } else {
                if (!oldPassword) {
                    $('#tips').text('请输入原密码').parent().show();
                } else if (!newPassword) {
                    $('#tips').text('请输入新密码').parent().show();
                } else if (!newPasswordAgain) {
                    $('#tips').text('请再次输入新密码').parent().show();
                } else if (!identify) {
                    $('#tips').text('请输入验证码').parent().show();
                } else if (newPassword != newPasswordAgain) {
                    $('#tips').text('密码输入不一致，请重新输入').parent().show();
                }

            }
        }
    }

    //如果不是第一次登录，则修改密码页添加返回按钮
    function rePasswordBack() {
        $('#repassword .header-bar .left .icon-back').on('tap', function () {
            $('#info-box').show();
            $('#repassword').hide();
            $('#repassword form input').val('');
        })
    }

    /*我的账户*/
    //点击修改密码
    $('#change-password').on('tap', function () {
        $('#info-box').hide();
        $('#repassword').show();
    });

    //点击退出登录
    $('#exit').on('tap', function () {
        $.ajax({
            url: domain + '/logout',
            type: 'POST',
            cache: true,
            dataType: 'json',
            data: {},
            headers: {
                token,
                userId
            },
            success: (result) => {

                if (result.code == 'SUCCESS') {
                    window.location.reload();
                    $('#login').show().siblings().hide();
                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                }
            },
            error: (err) => {
                //console.log(err);
                layer.open({
                    content: err
                    , skin: 'msg'
                    , time: 3 //2秒后自动关闭
                });
            }
        });


    });

    //获取账户信息
    function getAccountInfo() {
        //console.log(token, userId, 'token,userId');
        $.ajax({
            url: domain + '/info',
            type: 'GET',
            cache: true,
            dataType: 'json',
            data: {},
            headers: {
                token,
                userId
            },
            success: (result) => {

                if (result.code == 'SUCCESS') {
                    //修改密码页
                    phone = result.phone;
                    let handlePhone = result.phone.substr(0, 3) + '****' + result.phone.substr(7, 11);
                    $('#phone').text(handlePhone);//修改密码页
                    //我的账户页
                    $('#my-name').text(result.branchName);
                    $('#my-account').text(result.username);

                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });

                    $('#warning').text(result.msg).show();
                }
            },
            error: (err) => {
                console.log(err);
            }
        });
    }


    /*记录表单*/
    function record() {

        let timer = null;
        let saving = false;

        getForm();//获取表单

        function getForm() {
            $.ajax({
                url: domain + '/form',
                type: 'GET',
                dataType: 'json',
                cache: true,
                headers: {
                    token,
                    userId
                },
                success: (result) => {
                    if (result.code == 'SUCCESS') {
                        formData = result;
                        //绑定数据
                        bindFormData(result);


                        if (result.formExchangeType && result.formExchangeType == 1) {
                            //给美通卡最小面值输入框绑定input事件
                            $('#meitongMin').on('change', function () {

                                let val = Number($(this).val());
                                if (!isNaN(val)) {
                                    if (val < result.meitongNumberMin) {
                                        $(this).val('');
                                        layer.open({
                                            content: '此项起兑量必须大于等于' + result.meitongNumberMin + '！'
                                            , skin: 'msg'
                                            , time: 3 //3秒后自动关闭
                                        })
                                    }
                                } else {
                                    $(this).val('');
                                    layer.open({
                                        content: '请输入有效正整数！'
                                        , skin: 'msg'
                                        , time: 3 //3秒后自动关闭
                                    })
                                }

                            });

                            //给电子券和美通卡按钮绑定点击事件
                            $('#formExchangeType .exchangeTypeList li').on('tap', function () {
                                if (!$(this).hasClass('active')) {
                                    $(this).addClass('active').siblings().removeClass('active');
                                    let thisIndex = $(this).index();
                                    exchangeType = thisIndex;
                                    if (thisIndex == 0) {
                                        $('#dianzi-list').show();
                                        $('#meitong-list').hide();
                                        $('#meitong-list input').val('');
                                    } else if (thisIndex == 1) {
                                        $('#meitong-list').show();
                                        $('#dianzi-list').hide();
                                        $('#dianzi-list input').val('');
                                    }

                                }

                            });

                        }


                        //有验证码时并且今日未提交过表单，才可获取验证码(submitFlag为0已提交过，为1未提交过)
                        if (result.formPhoneAuthc == 1 && result.submitFlag == 1) {
                            $('#get-custom-identify').off('tap');
                            $('#get-custom-identify').on('tap', getCustomIdentify);
                        }
                        if (result.formPhoneAuthc == 1 && result.submitFlag == 0) {
                            $('#get-custom-identify').css({color: '#ccc'});
                        }
                        //如果今天已经提交过，则不允许再提交（去除点击提交事件）
                        if (result.submitFlag == 1) {
                            $('#save-form').off('tap');
                            $('#save-form').on('tap', saveForm);

                        } else {
                            $('#save-form').css({color: '#ccc'});
                        }
                    } else {
                        loginAgain(result.code);
                        layer.open({
                            content: result.msg
                            , skin: 'msg'
                            , time: 3 //3秒后自动关闭
                        })
                    }
                },
                error: (err) => {
                    console.log(err);
                }
            })
        }

        //绑定表单数据
        function bindFormData(result) {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            let dateNow = year + '-' + month + '-' + day;


            let str1 = ``;
            let str2 = ``;
            let str3 = ``;
            if (result.formName == 1) {
                str1 += `<li class="item custom-name">
        <div class="left name">姓名</div>
        <input type="text" id="custom-name" placeholder="请输入姓名">
      </li>`
            }
            if (result.formIdCard == 1) {
                str1 += `<li class="item custom-id">
        <div class="left id">身份证号码</div>
        <input type="text" id="custom-id" placeholder="请输入身份证号">
      </li>`
            }
            if (result.formPhone == 1) {
                str1 += `<li class="item custom-phone">
        <div class="left phone">手机号码</div>
        <input type="text" id="custom-phone" placeholder="请输入银行预留手机号">
      </li>`
            }
            if (result.formPhoneAuthc == 1) {
                str1 += `<li class="item custom-identify">
        <input type="text" placeholder="请输入验证码" id="custom-identify">
        <div class="get-custom-identify" id="get-custom-identify"><span class="line"></span> <p id="time_">获取验证码</p></div>
      </li>`
            }
            if (result.formTicket == 1) {

                str2 += `<div class="tittle">
                    券码信息
                  </div>`;
                if (result.formExchangeType == 1) {
                    str2 += `<div class="formExchangeType" id="formExchangeType">
                        <div class="prefix">
                          兑换类型
                        </div>
                        <ul class="exchangeTypeList">
                          <li class="dianzi active">
                            电子券
                          </li>
                          <li class="meitong">
                            美通卡
                          </li>
                        </ul>
                      </div>
                      `;
                }

                if (result.formTicketList && result.formTicketList.length) {

                    str2 += `<div class="list dianzi-list" id="dianzi-list">
                        <div class="list-item header">
                          <div class="left">券码面值</div>
                          <div class="right">数量</div>
                        </div>`;

                    //绑定电子券记录表单
                    for (let i = 0; i < result.formTicketList.length; i++) {
                        let item = result.formTicketList[i];
                        str2 += `<div class="list-item item">
        <div class="left">${item.faceValue}</div>
        <input type="text" class="right" placeholder="输入兑换张数" ticket-code=${item.formTicketCode}>
      </div>`
                    }
                    if(result.formExchangeType==1){
                        str2 += `<div class="meitong-tips" id="meitong-tips">
                      <span class="iconfont icon-tishi1"></span>
                      如需同时兑换电子券和美通卡，需分别获取验证码，保存各自表单。
                    </div>`
                    }

                    str2 += `</div>`;

                }

                //绑定美通卡记录表单
                if (result.formExchangeType == 1 && result.formMeitongTicketList && result.formMeitongTicketList.length) {
                    str2 += `<div class="list meitong-list" id="meitong-list">
                        <div class="list-item header">
                          <div class="left">券码面值</div>
                          <div class="right">数量</div>
                        </div>`;
                    let meitongLength = result.formMeitongTicketList.length;

                    for (let i = 0; i < meitongLength; i++) {
                        let item = result.formMeitongTicketList[i];

                        if (result.meitongFaceMin == item.amount) {//给美通卡最小面值的输入框加唯一id
                            str2 += `<div class="list-item item">
        <div class="left">${item.amount}元</div>
        <input type="text" class="right" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode} id="meitongMin">
      </div>`
                        } else {
                            str2 += `<div class="list-item item">
        <div class="left">${item.amount}元</div>
        <input type="text" class="right" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode}>
      </div>`
                        }

                    }
                    str2 += `<div class="meitong-tips" id="meitong-tips">
                      <span class="iconfont icon-tishi1" style="display:inline-block"></span>
                      
                      美通卡兑换最小面值${result.meitongFaceMin}元，${result.meitongNumberMin}张起兑。
                      <p>如需同时兑换电子券和美通卡，需分别获取验证码，保存各自表单。</p>

                      
                    </div>`;
                    str2 += `</div>`;

                }

            }
            if (result.formDate == 1) {
                str3 += `<div class="tittle">
      日期
    </div>
    
    <input class="select-date" id="select-date" type="text" readonly="" name="input_date" placeholder="请选择日期" data-lcalendar="${dateNow},2030-12-31" />`
            }

            $('#custom-info').html(str1);
            $('#custom-ticket').html(str2);
            $('#custom-date').html(str3);

            if (result.formDate == 1) {
                let calendar = new lCalendar();
                calendar.init({
                    'trigger': '#select-date',
                    'type': 'date'
                });
            }

        }

        //获取验证码
        function getCustomIdentify() {

            let flag = null;

            let customPhone = $('#custom-phone').val();
            if (!!customPhone) {
                flag = isPoneAvailable(customPhone);
            } else {
                layer.open({
                    content: '请输入手机号码！！'
                    , skin: 'msg'
                    , time: 2 //2秒后自动关闭
                });
                return;
            }

            if (flag) {

                //验证通过开始倒计时
                let num = 60;
                clearInterval(timer);
                $('#time_').text(num + 's');
                timer = setInterval(() => {
                    num--;
                    if (num >= 0) {
                        $('#time_').text(num + 's');
                    } else {
                        clearInterval(timer);
                        $('#time_').text('重新获取');
                        $('#get-custom-identify').on('tap', getCustomIdentify);//添加点击事件
                    }
                }, 1000);
                $('#get-custom-identify').off('tap', getCustomIdentify);//去除点击事件

                $.ajax({
                    url: domain + '/sms',
                    type: 'POST',
                    cache: true,
                    dataType: 'json',
                    data: {phone: customPhone, type: '2'},
                    headers: {
                        token,
                        userId
                    },
                    success: (result) => {
                        if (result.code == 'SUCCESS') {
                            //啥也不干


                        } else {
                            loginAgain(result.code);
                            layer.open({
                                content: result.msg
                                , skin: 'msg'
                                , time: 3 //3秒后自动关闭
                            })
                        }

                    },
                    error: (err) => {
                        console.log(err);
                    }
                })
            } else {
                layer.open({
                    content: '手机号码格式输入有误！！'
                    , skin: 'msg'
                    , time: 2 //2秒后自动关闭
                });
            }
        }

        //保存表单
        function saveForm() {
            //console.log('保存记录的表单')
            let data = {exchangeType};
            let name = $('#custom-name').val();
            let idCard = $('#custom-id').val();
            let customPhone = $('#custom-phone').val();
            let smsCode = $('#custom-identify').val();
            if (formData.formName == 1) {
                if (!!name) {
                    if (name.length < 15) {
                        data.name = name;
                    } else {
                        layer.open({
                            content: '姓名长度过长'
                            , skin: 'msg'
                            , time: 2 //2秒后自动关闭
                        });
                        return;
                    }

                } else {
                    layer.open({
                        content: '请输入姓名'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }
            }
            if (formData.formIdCard == 1) {
                if (!!idCard) {
                    //验证身份证号是否合法
                    if (isCardNo(idCard)) {
                        data.idCard = idCard;
                    } else {
                        layer.open({
                            content: '身份证号格式输入有误'
                            , skin: 'msg'
                            , time: 2 //2秒后自动关闭
                        });
                        return;
                    }

                } else {
                    layer.open({
                        content: '请输入身份证号'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }
            }
            if (formData.formPhone == 1) {
                if (!!customPhone) {
                    if (isPoneAvailable(customPhone)) {
                        data.phone = customPhone;
                    } else {
                        layer.open({
                            content: '手机号码格式输入有误！'
                            , skin: 'msg'
                            , time: 2 //2秒后自动关闭
                        });
                        return;
                    }
                } else {
                    layer.open({
                        content: '请输入手机号码'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }
            }
            if (formData.formPhoneAuthc == 1) {
                if (!!smsCode) {
                    data.smsCode = smsCode;
                } else {
                    layer.open({
                        content: '请输入验证码！'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }
            }
            //券码数量的验证
            if (formData.formTicket == 1) {
                let ticketArr = [];
                let valArr = [];//收集用户填写的券码数量，验证非空用

                if (exchangeType == 0) {//如果当前选择的是电子券
                    $('#dianzi-list input[class=right]').each((index, item) => {
                        let itemObj = {};
                        let val = $(item).val();
                        valArr.push(val);
                        itemObj.formTicketCode = $(item).attr('ticket-code');
                        itemObj.total = val;
                        ticketArr.push(itemObj);
                    });
                }
                if (exchangeType == 1) {//如果当前选择的是美通卡
                    $('#meitong-list input[class=right]').each((index, item) => {
                        let itemObj = {};
                        let val = $(item).val();
                        valArr.push(val);
                        itemObj.formTicketMeitongCode = $(item).attr('ticket-code');
                        itemObj.total = val;
                        ticketArr.push(itemObj);
                    });
                }


                if (valArr.some(item => !!item == true)) {
                    if (valArr.every(item => isNaN(item) == false)) {
                        if (exchangeType == 0) {
                            data.ticketList = ticketArr;
                        }
                        if (exchangeType == 1) {
                            data.meitongTicketList = ticketArr;
                        }

                    } else {
                        layer.open({
                            content: '券码数量必须为数字！'
                            , skin: 'msg'
                            , time: 2 //2秒后自动关闭
                        });
                        return;
                    }
                } else {
                    layer.open({
                        content: '请至少填写一种券码数量！'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }

                //验证美通卡最小面值是不是输入的大于起兑额
                if (exchangeType == 1 && !!$('#meitongMin').val()) {
                    if ($('#meitongMin').val() < formData.meitongNumberMin) {
                        layer.open({
                            content : '起兑量必须大于等于' +formData.meitongNumberMin+'！'
                            , skin: 'msg'
                            , time: 2 //2秒后自动关闭
                        });
                        return;
                    }

                }
            }
            if (formData.formDate == 1) {
                let date = $('#select-date').val();
                if (!!date) {
                    data.date = date;
                } else {
                    layer.open({
                        content: '请选择日期！'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }
            }


            if (!saving) {
                saving = true;
                $.ajax({
                    url: domain + '/order/save',
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json;charset=utf-8',
                    cache: true,
                    data: JSON.stringify(data),
                    headers: {
                        token,
                        userId
                    },
                    success: (result) => {
                        //提示成功，并清空数据
                        if (result.code == 'SUCCESS') {
                            layer.open({
                                content: '保存成功'
                                , skin: 'msg'
                                , time: 2 //2秒后自动关闭
                            });
                            $('#record .custom input').val('');
                            $('#record .ticket input').val('');
                            $('#record .date input').val('');

                            //保存成功获取验证码恢复初始状态
                            clearInterval(timer);
                            $('#time_').text('获取验证码');

                            //防止验证码倒计时已经结束，先卸载再添加
                            $('#get-custom-identify').off('tap');
                            $('#get-custom-identify').on('tap', getCustomIdentify);//添加点击事件

                        } else {
                            loginAgain(result.code);
                            layer.open({
                                content: result.msg
                                , skin: 'msg'
                                , time: 3 //2秒后自动关闭
                            });
                        }
                    },
                    error: (err) => {
                        console.log(err);
                    },
                    complete: (result) => {
                        //$('#save-form').on('tap',saveForm);
                        // $('#save-form').attr('disabled',false);
                        saving = false;
                    }

                })
            }


        }


    }


    /*提交表单*/

    //点击提交表单（提交后今日不可再提交）
    $('#submit-form').on('tap', function () {
        if (!rejectFlag) {
            if (!submitting) {

                $.dialog({
                    type: 'confirm',
                    //titleText:'我是标题',
                    onClickOk: function () {

                        submitting = true;
                        $.ajax({
                            url: domain + '/order/submit',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                orderNo
                            },
                            headers: {
                                token,
                                userId
                            },
                            success: (result) => {
                                if (result.code == 'SUCCESS') {
                                    $('#have-submit').show();
                                    $('#order-list').hide();

                                    //提交后去除记录表单页的点击事件，并修改样式为死灰色
                                    $('#get-custom-identify').off('tap').css({color: '#ccc'});

                                    $('#save-form').off('tap').css({color: '#ccc'});

                                } else {
                                    loginAgain(result.code);
                                    layer.open({
                                        content: result.msg
                                        , skin: 'msg'
                                        , time: 3 //2秒后自动关闭
                                    });
                                }
                            },
                            error: (err) => {
                                console.log(err);
                            },
                            complete: (result) => {
                                submitting = false;
                            }
                        })
                    },
                    onClickCancel: function () {
                        //
                    },
                    contentHtml: '<p style="text-align: center">确定要提交表单？</p>'
                });

            }
        } else {
            layer.open({
                content: '驳回表单处理后才可以提交今日表单哦！'
                , skin: 'msg'
                , time: 3 //2秒后自动关闭
            });
        }


    });
    //点击查询
    //查询input框有内容时，查询按钮可点击（电子券）
    $('#search').on('input', function () {
        if (this.value.length == 0) {
            $('#search-btn').off('tap', searchList).css({borderColor: '#ccc', color: '#ccc'});

        } else {
            $('#search-btn')
                .css({borderColor: '#3ca9c8', color: '#3ca9c8'})
                .off('tap')
                .on('tap', searchList);
        }
    });

    function searchList() {
        query = $('#search').val();
        //初始化page，并清空列表
        page = 1;
        $('#wrapper .list').html('');
        if (!dianziPullRefreshing) {
            submitForm();
        }

    }

    //点击查询
    //查询input框有内容时，查询按钮可点击(美通卡列表)
    $('#search-meitong').on('input', function () {

        if (this.value.length == 0) {
            $('#search-btn-meitong').off('tap', searchMeitongList).css({borderColor: '#ccc', color: '#ccc'});

        } else {
            $('#search-btn-meitong')
                .css({borderColor: '#3ca9c8', color: '#3ca9c8'})
                .off('tap')
                .on('tap', searchMeitongList);
        }
    });

    function searchMeitongList() {
        queryMeitong = $('#search-meitong').val();
        //初始化page，并清空列表
        pageMeitong = 1;
        $('#wrapper-meitong .list').html('');
        if (!meitongPullRefreshing) {
            submitFormMeitong();
        }

    }

    //电子券列表
    let myScroll = new IScroll('#wrapper', {
        scrollX: true,
        // interactiveScrollbars: true,
        // shrinkScrollbars: 'scale',
        // fadeScrollbars: true,
        // scrollY:true,
        probeType: 2,
        mouseWheel: true,
        scrollbars: false,
        // bounce:false,
        //bindToWrapper:true
    });
    myScroll.on("scroll", function () {
        pullRefreshY = this.y;
        //console.log(pullRefreshY,'scroll')
        if (this.y > 0) {

            if (this.y > 50) {
                $('#pull-refresh-box').css({height: '50'});
                $('#pull-refresh').html('<span class="iconfont icon-xiangshang"></span>释放立即刷新');

            } else {
                $('#pull-refresh-box').css({height: this.y});
                $('#pull-refresh').html('<span class="iconfont icon-xiangxia"></span>继续下拉刷新');

            }
        }

    });
    myScroll.on("scrollEnd", function () {
        if (pullRefreshY > 0) {
            //下拉刷新提示框恢复原位
            $('#pull-refresh-box').animate({height: 0});
            if (pullRefreshY > 50) {
                $('#load-more').text('正在努力加载数据...').show();
                //console.log('松手立即刷新');
                //执行刷新操作
                page = 1;
                query = null;
                $('#search').val('');
                $('#wrapper .list').html('');
                $('#search-btn').off('tap').css({borderColor: '#ccc', color: '#ccc'});
                if (!dianziPullRefreshing) {
                    submitForm();
                    getReject();
                }

            }
        }

        if (this.wrapperHeight - this.y >= this.scrollerHeight) {
            if (hasMore) {
                //请求数据
                $('#load-more').text('正在努力加载数据...').show();
                getFormList();
            } else {
                $('#load-more').text('没有更多数据了').show();
            }

        }

    });

    //美通卡列表
    let myScrollMeitong = new IScroll('#wrapper-meitong', {
        scrollX: true,
        // interactiveScrollbars: true,
        // shrinkScrollbars: 'scale',
        // fadeScrollbars: true,
        // scrollY:true,
        probeType: 2,
        mouseWheel: true,
        scrollbars: false,
        // bounce:false,
        //bindToWrapper:true
    });
    myScrollMeitong.on("scroll", function () {
        pullRefreshYMeitong = this.y;
        //console.log(pullRefreshY,'scroll')
        if (this.y > 0) {

            if (this.y > 50) {
                $('#pull-refresh-box-meitong').css({height: '50'});
                $('#pull-refresh-meitong').html('<span class="iconfont icon-xiangshang"></span>释放立即刷新');

            } else {
                $('#pull-refresh-box-meitong').css({height: this.y});
                $('#pull-refresh-meitong').html('<span class="iconfont icon-xiangxia"></span>继续下拉刷新');

            }
        }

    });
    myScrollMeitong.on("scrollEnd", function () {
        if (pullRefreshYMeitong > 0) {
            //下拉刷新提示框恢复原位
            $('#pull-refresh-box-meitong').animate({height: 0});
            if (pullRefreshYMeitong > 50) {
                $('#load-more-meitong').text('正在努力加载数据...').show();
                //console.log('松手立即刷新');
                //执行刷新操作
                pageMeitong = 1;
                queryMeitong = null;
                $('#search-meitong').val('');
                $('#wrapper-meitong .list').html('');
                $('#search-btn-meitong').off('tap').css({borderColor: '#ccc', color: '#ccc'});

                if (!meitongPullRefreshing) {
                    submitFormMeitong();
                    getReject();
                }

            }
        }

        if (this.wrapperHeight - this.y >= this.scrollerHeight) {
            if (hasMoreMeitong) {
                //请求数据
                $('#load-more-meitong').text('正在努力加载数据...').show();
                getFormListMeitong();
            } else {
                $('#load-more-meitong').text('没有更多数据了').show();
            }

        }

    });


    dianMeiListTab();

    //点击我的表单--新增表单页面的选项卡
    function dianMeiListTab() {
        let submitMeitongListFlag = false;
        $('#exchangeTypeListSearch li').on('tap', function () {

            let thisIndex = $(this).index();

            exchangeTypeSearch = thisIndex;

            if (!$(this).hasClass('active')) {
                $(this).addClass('active').siblings().removeClass('active');
            }

            if (thisIndex == 0) {
                //显示电子群列表，隐藏美通卡列表
                $('#dianzi-order-list').show();
                $('#meitong-order-list').hide();
                myScroll.refresh();
            }
            if (thisIndex == 1) {
                //显示美通卡列表，隐藏电子券列表
                $('#meitong-order-list').show();
                $('#dianzi-order-list').hide();
                myScrollMeitong.refresh();

                if (!submitMeitongListFlag) {
                    submitFormMeitong();
                    submitMeitongListFlag = true;
                }
            }
        });
    }


    //获取电子券列表
    function submitForm() {

        dianziPullRefreshing = true;

        getFormHeader();

        //获取表格生成表头
        function getFormHeader() {
            $.ajax({
                url: domain + '/form',
                type: 'GET',
                dataType: 'json',
                cache: true,
                headers: {
                    token,
                    userId
                },
                success: (result) => {
                    let scrollerWidth = 7.8;
                    if (result.code == 'SUCCESS') {
                        formData = result;
                        if (result.submitFlag == 1) {

                            //如果有兑换类型，显示电子券和美通卡的选项卡
                            if (result.formExchangeType == 1) {
                                $('#exchangeTypeListSearchBox').show();
                            }

                            let str = `<li class="header clearBoth">
        <div class="index floatL">序号</div>`;
                            if (result.formName == 1) {
                                str += `<div class="name floatL">姓名</div>`;
                                scrollerWidth += 1.5;
                            }
                            if (result.formIdCard == 1) {
                                str += `<div class="card-id floatL">身份证号</div>`;
                                scrollerWidth += 3.2;
                            }
                            if (result.formPhone == 1) {
                                str += `<div class="phone floatL">手机号</div>`;
                                scrollerWidth += 2;
                            }
                            if (result.formTicket == 1) {
                                str += `<div class="coupon floatL">券码面值/数量</div>`;
                                scrollerWidth += 2;
                            }
                            if (result.formDate == 1) {
                                str += `<div class="date floatL">日期</div>`;
                                scrollerWidth += 2;
                            }

                            str += `<div class="modify-person floatL">提交人</div>
        <div class="last-modify-person floatL">最后修改人</div>
        <div class="time floatL">最后修改时间</div></li>`;


                            $('#wrapper .list').html(str);
                            $('#scroller').css({width: scrollerWidth + 'rem'});

                            /*$('#wrapper-meitong .list').html(str);
              $('#scroller-meitong').css({ width : scrollerWidth + 'rem' });*/

                            //获取列表数据
                            getFormList();
                        } else {
                            $('#order-list').hide();
                            $('#have-submit').show();
                        }


                    } else {
                        loginAgain(result.code);
                        layer.open({
                            content: result.msg
                            , skin: 'msg'
                            , time: 3 //2秒后自动关闭
                        });
                    }
                },
                error: (err) => {
                    console.log(err);
                }
            })
        }


    }

    //获取电子券列表数据
    function getFormList() {
        $.ajax({
            url: domain + '/order/query',
            type: "GET",
            cache: true,
            dataType: 'json',
            data: {
                query,
                page,
                exchangeType: 0
            },
            headers: {
                token,
                userId
            },
            success: (result) => {
                if (result.code == 'SUCCESS') {
                    orderNo = result.orderNo;//存储订单号
                    hasMore = result.list && result.list.length == 20 ? true : false;//是否还有数据（恰好最后一组是20条的时候就尴尬了）


                    let str = ``;
                    let list = result.list;
                    if (list && list.length) {
                        for (let i = 0; i < list.length; i++) {
                            let item = list[i];
                            str += `<li detail-code=${item.detailCode} class="form-item clearBoth"><div class="index floatL">${i + (page - 1) * 20 + 1}</div>`;
                            if (item.name) {
                                str += `<div class="name floatL">${item.name}</div>`;
                            }
                            if (item.idCard) {
                                str += `<div class="card-id floatL">${item.idCard}</div>`;
                            }
                            if (item.phone) {
                                str += `<div class="phone floatL">${item.phone}</div>`;
                            }
                            if (item.ticketList) {
                                str += `<div class="coupon floatL">`;
                                for (let j = 0; j < item.ticketList.length; j++) {
                                    let ticketItem = item.ticketList[j];
                                    str += `<p>${ticketItem.faceValue}/${ticketItem.total}张；</p>`
                                }
                                str += `</div>`;
                            }
                            if (item.date) {
                                str += `<div class="date floatL">${item.date}</div>`;
                            }

                            str += `<div class="modify-person floatL">${item.createBy ? item.createBy : '--'}</div><div class="last-modify-person floatL">${item.modifyBy ? item.modifyBy : '--'}</div><div class="time floatL">${item.modifyTime ? item.modifyTime : '--'}</div></li>`;

                        }
                    }
                    $('#wrapper .list').append(str);

                    if ($('#scroller').css('height') <= $('#wrapper').css('height')) {
                        $('#scroller').css('height', $('#wrapper').css('height') + '1px');
                    }


                    //绑定点击进入详情事件
                    goDetail();

                    myScroll.refresh();//刷新iscroll


                    page++;

                    if (!hasMore) {
                        $('#load-more').text('没有更多数据了').show();

                    } else {
                        $('#load-more').hide();
                    }

                    //如果只有一种卡券或者三种以上。。。
                    $('#wrapper .scroller .list .coupon').each(function (index, item) {
                        if ($(item).find('p').length == 1) {
                            $(item).css({lineHeight: '0.68rem'});
                        }
                        if ($(item).find('p').length >= 3) {
                            $(item).parent().css({lineHeight: $(item).find('p').length * 0.34 + 'rem'})
                        }
                    });

                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                }
            },
            error: (err) => {
                console.log(err);
            },
            complete: () => {
                dianziPullRefreshing = false;
            }
        })

    }

    //获取美通卡列表
    function submitFormMeitong() {

        meitongPullRefreshing = true;

        getFormHeader();

        //获取表格生成表头
        function getFormHeader() {
            $.ajax({
                url: domain + '/form',
                type: 'GET',
                dataType: 'json',
                cache: true,
                headers: {
                    token,
                    userId
                },
                success: (result) => {
                    let scrollerWidth = 7.8;
                    if (result.code == 'SUCCESS') {
                        formData = result;
                        if (result.submitFlag == 1) {

                            //如果有兑换类型，显示电子券和美通卡的选项卡
                            if (result.formExchangeType == 1) {
                                $('#exchangeTypeListSearchBox').show();
                            }

                            let str = `<li class="header clearBoth">
        <div class="index floatL">序号</div>`;
                            if (result.formName == 1) {
                                str += `<div class="name floatL">姓名</div>`;
                                scrollerWidth += 1.5;
                            }
                            if (result.formIdCard == 1) {
                                str += `<div class="card-id floatL">身份证号</div>`;
                                scrollerWidth += 3.2;
                            }
                            if (result.formPhone == 1) {
                                str += `<div class="phone floatL">手机号</div>`;
                                scrollerWidth += 2;
                            }
                            if (result.formTicket == 1) {
                                str += `<div class="coupon floatL">券码面值/数量</div>`;
                                scrollerWidth += 2;
                            }
                            if (result.formDate == 1) {
                                str += `<div class="date floatL">日期</div>`;
                                scrollerWidth += 2;
                            }

                            str += `<div class="modify-person floatL">提交人</div>
        <div class="last-modify-person floatL">最后修改人</div>
        <div class="time floatL">最后修改时间</div></li>`;


                            $('#wrapper-meitong .list').html(str);
                            $('#scroller-meitong').css({width: scrollerWidth + 'rem'});

                            //获取列表数据
                            getFormListMeitong();
                        } else {
                            $('#order-list').hide();
                            $('#have-submit').show();
                        }


                    } else {
                        loginAgain(result.code);
                        layer.open({
                            content: result.msg
                            , skin: 'msg'
                            , time: 3 //2秒后自动关闭
                        });
                    }
                },
                error: (err) => {
                    console.log(err);
                }
            })
        }

    }

    //获取美通卡列表数据
    function getFormListMeitong() {
        $.ajax({
            url: domain + '/order/query',
            type: "GET",
            cache: true,
            dataType: 'json',
            data: {
                query: queryMeitong,
                page: pageMeitong,
                exchangeType: 1
            },
            headers: {
                token,
                userId
            },
            success: (result) => {
                if (result.code == 'SUCCESS') {
                    orderNo = result.orderNo;//存储订单号
                    hasMoreMeitong = result.list && result.list.length == 20 ? true : false;//是否还有数据（恰好最后一组是20条的时候就尴尬了）


                    let str = ``;
                    let list = result.list;
                    if (list && list.length) {
                        for (let i = 0; i < list.length; i++) {
                            let item = list[i];
                            str += `<li detail-code=${item.detailCode} class="form-item clearBoth"><div class="index floatL">${i + (pageMeitong - 1) * 20 + 1}</div>`;
                            if (item.name) {
                                str += `<div class="name floatL">${item.name}</div>`;
                            }
                            if (item.idCard) {
                                str += `<div class="card-id floatL">${item.idCard}</div>`;
                            }
                            if (item.phone) {
                                str += `<div class="phone floatL">${item.phone}</div>`;
                            }
                            if (item.meitongTicketList) {
                                str += `<div class="coupon floatL">`;
                                for (let j = 0; j < item.meitongTicketList.length; j++) {
                                    let ticketItem = item.meitongTicketList[j];
                                    str += `<p>${ticketItem.amount}元/${ticketItem.total}张；</p>`
                                }
                                str += `</div>`;
                            }
                            if (item.date) {
                                str += `<div class="date floatL">${item.date}</div>`;
                            }

                            str += `<div class="modify-person floatL">${item.createBy ? item.createBy : '--'}</div><div class="last-modify-person floatL">${item.modifyBy ? item.modifyBy : '--'}</div><div class="time floatL">${item.modifyTime ? item.modifyTime : '--'}</div></li>`;

                        }
                    }
                    $('#wrapper-meitong .list').append(str);

                    if ($('#scroller-meitong').css('height') <= $('#wrapper').css('height')) {
                        $('#scroller-meitong').css('height', $('#wrapper').css('height') + '1px');
                    }


                    //绑定点击进入详情事件
                    goDetail();

                    myScrollMeitong.refresh();//刷新iscroll


                    pageMeitong++;

                    if (!hasMoreMeitong) {
                        $('#load-more-meitong').text('没有更多数据了').show();

                    } else {
                        $('#load-more-meitong').hide();
                    }

                    //如果只有一种卡券或者三种以上。。。
                    $('#wrapper-meitong .scroller .list .coupon').each(function (index, item) {
                        if ($(item).find('p').length == 1) {
                            $(item).css({lineHeight: '0.68rem'});
                        }
                        if ($(item).find('p').length >= 3) {
                            $(item).parent().css({lineHeight: $(item).find('p').length * 0.34 + 'rem'})
                        }
                    });

                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                }
            },
            error: (err) => {
                console.log(err);
            },
            complete: () => {
                meitongPullRefreshing = false;
            }
        })

    }


    //跳转详情页
    function goDetail() {
        $('.scroller .list .form-item').off('tap');
        $('.scroller .list .form-item').on('tap', function () {
            //详情页显示，列表页隐藏
            $('#order-detail').show().siblings().hide();
            let detailCode = $(this).attr('detail-code');
            sessionStorage.setItem('detailCode', detailCode);
            let serialNumber = $(this).find('.index').text();
            sessionStorage.setItem('serialNumber', serialNumber);
            getDetailData();
        });
    }

    //列表页面和修改详情页面都要用（所以放在全局）
    function getDetailData() {
        let detailCode = sessionStorage.getItem('detailCode');
        let serialNumber = sessionStorage.getItem('serialNumber');
        if (!detailCode) {
            alert('貌似木有详情订单编号哦');
            return;
        }
        $.ajax({
            url: domain + '/order/detail',
            type: 'GET',
            dataType: 'json',
            cache: true,
            data: {
                detailCode
            },
            headers: {
                token,
                userId
            },
            success: (result) => {
                if (result.code == 'SUCCESS') {
                    window.detailData = result;
                    let str1 = ``;
                    let str2 = ``;
                    let str3 = ``;
                    if (!!result.detailCode) {
                        str1 += `<div class="index">
        <span class="icon"></span>
        <span class="name">序号：</span>
        <span class="num">${serialNumber}</span>
      </div>`
                    }
                    str1 += `<div class="info">`;
                    if (!!result.name) {
                        str1 += `
        <div class="name info-item">
          <span class="lable">姓名：</span>
          <span class="content">${result.name}</span>
        </div>`;
                    }
                    if (!!result.idCard) {
                        str1 += `<div class="id-card info-item">
          <span class="lable">身份证号：</span>
          <span class="content">${result.idCard}</span>
        </div>`;
                    }
                    if (!!result.phone) {
                        str1 += `<div class="phone info-item">
          <span class="lable">手机号：</span>
          <span class="content">${result.phone}</span>
        </div>`;
                    }
                    str1 += `</div>`; //str1完事

                    if (!result.exchangeType || result.exchangeType == 0) {
                        if (result.ticketList && result.ticketList.length) {
                            str2 += `<div class="index">
        <span class="icon"></span>
        <span class="name">券码面值/数量</span>
      </div>
      <ul class="ticket-list">
        <li class="ticket-item ticket-header">
          <div>券码面值</div>
          <div>数量</div>
        </li>`;
                            for (let i = 0; i < result.ticketList.length; i++) {
                                let ticketItem = result.ticketList[i];
                                str2 += `<li class="ticket-item">
          <div>${ticketItem.faceValue}</div>
          <div>${ticketItem.total}张</div>
        </li>`;

                            }
                            str2 += `</ul>`; //str2完事
                        }
                    }
                    if (result.exchangeType && result.exchangeType == 1) {
                        if (result.meitongTicketList && result.meitongTicketList.length) {
                            str2 += `<div class="index">
        <span class="icon"></span>
        <span class="name">券码面值/数量</span>
      </div>
      <ul class="ticket-list">
        <li class="ticket-item ticket-header">
          <div>券码面值</div>
          <div>数量</div>
        </li>`;
                            for (let i = 0; i < result.meitongTicketList.length; i++) {
                                let ticketItem = result.meitongTicketList[i];
                                str2 += `<li class="ticket-item">
          <div>${ticketItem.amount}元</div>
          <div>${ticketItem.total}张</div>
        </li>`;

                            }
                            str2 += `</ul>`; //str2完事
                        }
                    }


                    if (result.date) {
                        str3 += `<div>
        <span class="label">日期：</span>
        <span class="content">${result.date}</span>
      </div>`;
                    }
                    str3 += `<div>
        <span class="label">提交人：</span>
        <span class="content">${result.createBy}</span>
      </div>
      <div>
        <span class="label">最后修改人：</span>
        <span class="content">${result.modifyBy}</span>
      </div>
      <div>
        <span class="label">最后修改时间：</span>
        <span class="content">${result.modifyTime}</span>
      </div>`; //str3完事

                    $('#basic-info').html(str1);
                    $('#ticket-detail').html(str2);
                    $('#others').html(str3);

                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                    return;
                }
            },
            error: (err) => {
                console.log(err);
            }
        })
    }


    /*订单详情页*/
    orderDetail();

    function orderDetail() {
        $('#order-detail .header-bar .back').on('tap', function () {
            $('#my-form').show().siblings().hide();
            myScroll.refresh();
            myScrollMeitong.refresh();
            myScrollReject.refresh();
            myScrollRejectMeitong.refresh();
        });

        //点击修改
        $('#modify-btn').on('tap', function () {
            $('#modify-detail').show().siblings().hide();

            modifyDetail();

        })
        //点击删除
        $('#delete-btn').on('tap', function () {

            $.dialog({
                type: 'confirm',
                onClickOk: function () {
                    //请求删除订单接口
                    let detailCode = sessionStorage.getItem('detailCode');
                    let data = {detailCode};
                    $.ajax({
                        url: domain + '/order/reject/delete',
                        type: 'POST',
                        dataType: 'json',
                        contentType: 'application/json;charset=utf-8',
                        data: JSON.stringify(data),
                        headers: {
                            token,
                            userId
                        },
                        success: (result) => {
                            if (result.code == 'SUCCESS') {
                                layer.open({
                                    content : '删除成功'
                                    , skin : 'msg'
                                    , time : 2 //2秒后自动关闭
                                });
                                if (detailData.isReject == '0') {
                                    //正常表单
                                    $('#my-form').show();
                                    $('#order-list').show();
                                    $('#order-reject-list').hide();
                                    $('#order-detail').hide();

                                    myScroll.refresh();
                                    myScrollMeitong.refresh();
                                    myScrollReject.refresh();
                                    myScrollRejectMeitong.refresh();
                                } else {
                                    //驳回表单
                                    $('#my-form').show();
                                    $('#order-list').hide();
                                    $('#order-reject-list').show();
                                    $('#order-detail').hide();

                                    myScroll.refresh();
                                    myScrollMeitong.refresh();
                                    myScrollReject.refresh();
                                    myScrollRejectMeitong.refresh();
                                }

                                myScroll.refresh();
                                myScrollMeitong.refresh();
                                myScrollReject.refresh();
                                myScrollRejectMeitong.refresh();
                            } else {
                                layer.open({
                                    content: result.msg
                                    , skin: 'msg'
                                    , time: 3 //3秒后自动关闭
                                });
                            }

                        },
                        error: (err) => {
                            console.log(err);
                        },
                        complete: (result) => {

                        }
                    });
                },
                onClickCancel: function () {
                    //
                },
                contentHtml: '<p style="text-align: center">确认删除该用户数据吗？</p>'
            });
        });
    }


    /*修改订单详情*/
    $('#modify-detail .header-bar .back').on('tap', function () {
        $('#order-detail').show().siblings().hide();
    });

    function modifyDetail() {

        let timer = null;

        getFormOfModify();//获取表单

        function getFormOfModify() {

            //console.log(detailData.isReject,'isReject');

            if(detailData.isReject==0){//如果是今日表单的详情
                bindFormDataOfModify(formData);
                //有验证码时，获取验证码
                /*if (formData.formPhoneAuthc == 1) {
                 $('#get-modify-custom-identify').on('tap', getCustomIdentifyOfModify);
                 }*/
                //
                $('#modify-submit').off('tap');
                $('#modify-submit').on('tap', saveFormOfModify.bind(formData));


                if(formData.formExchangeType&&formData.formExchangeType==1){
                    //给美通卡最小面值输入框绑定input事件
                    $('#meitongMinModify').on('change',function () {

                        let val = Number($(this).val());
                        if(!isNaN(val)){
                            if(val<formData.meitongNumberMin){
                                $(this).val('');
                                layer.open({
                                    content : '此项起兑量必须大于等于' +formData.meitongNumberMin+'！'
                                    , skin : 'msg'
                                    , time : 3 //3秒后自动关闭
                                })
                            }
                        }else{
                            $(this).val('');
                            layer.open({
                                content : '请输入有效正整数！'
                                , skin : 'msg'
                                , time : 3 //3秒后自动关闭
                            })
                        }

                    });

                    //给电子券和美通卡按钮绑定点击事件
                    /*$('#formExchangeTypeModify .exchangeTypeList li').on('tap',function () {
                      if(!$(this).hasClass('active')){
                        $(this).addClass('active').siblings().removeClass('active');
                        let thisIndex = $(this).index();
                        exchangeTypeModify = thisIndex;
                        if(thisIndex==0){
                          $('#dianzi-list-modify').show();
                          $('#meitong-list-modify').hide();
                        }else if(thisIndex==1){
                          $('#meitong-list-modify').show();
                          $('#dianzi-list-modify').hide();
                        }

                      }

                    });*/

                }
            }
            if(detailData.isReject==1){//如果是驳回表单的详情
                if(formDataReject){
                    bindFormDataOfModify(formDataReject);
                    //有验证码时，获取验证码
                    /*if (formData.formPhoneAuthc == 1) {
                     $('#get-modify-custom-identify').on('tap', getCustomIdentifyOfModify);
                     }*/
                    //
                    $('#modify-submit').off('tap');
                    $('#modify-submit').on('tap', saveFormOfModify.bind(formDataReject));

                    if(formDataReject.formExchangeType&&formDataReject.formExchangeType==1){
                        //给美通卡最小面值输入框绑定input事件(修改详情)
                        $('#meitongMinModify').on('change',function () {

                            let val = Number($(this).val());
                            if(!isNaN(val)){
                                if(val<formDataReject.meitongNumberMin){
                                    $(this).val('');
                                    layer.open({
                                        content : '此项起兑量必须大于等于' +formDataReject.meitongNumberMin+'！'
                                        , skin : 'msg'
                                        , time : 3 //3秒后自动关闭
                                    })
                                }
                            }else{
                                $(this).val('');
                                layer.open({
                                    content : '请输入有效正整数！'
                                    , skin : 'msg'
                                    , time : 3 //3秒后自动关闭
                                })
                            }

                        });

                        //给电子券和美通卡按钮绑定点击事件（修改详情）
                        /*$('#formExchangeTypeModify .exchangeTypeList li').on('tap',function () {
                          if(!$(this).hasClass('active')){
                            $(this).addClass('active').siblings().removeClass('active');
                            let thisIndex = $(this).index();
                            exchangeTypeModify = thisIndex;
                            if(thisIndex==0){
                              $('#dianzi-list-modify').show();
                              $('#meitong-list-modify').hide();
                            }else if(thisIndex==1){
                              $('#meitong-list-modify').show();
                              $('#dianzi-list-modify').hide();
                            }

                          }

                        });*/

                    }
                }



            }


        }

        //绑定表单数据
        function bindFormDataOfModify(result) {
            /*
            * result可能为今日的表单数据，也可能是驳回表单的历史表单数据
            * */

            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            let dateNow = year + '-' + month + '-' + day;

            let str1 = ``;
            let str2 = ``;
            let str3 = ``;
            let name = JSON.stringify(detailData.name);
            if (result.formName == 1) {
                str1 += `<li class="item custom-name">
        <div class="left name">姓名</div>
        <input type="text" id="modify-custom-name" placeholder="请输入姓名" value=${name}>
      </li>`
            }
            if (result.formIdCard == 1) {
                str1 += `<li class="item custom-id">
        <div class="left id">身份证号码</div>
        <input type="text" id="modify-custom-id" placeholder="请输入身份证号" value=${detailData.idCard}>
      </li>`
            }
            if (result.formPhone == 1) {
                str1 += `<li class="item custom-phone">
        <div class="left phone">手机号码</div>
        <input type="text" id="modify-custom-phone" placeholder="请输入银行预留手机号" value=${detailData.phone} maxlength=11 >
      </li>`
            }
            /*if (result.formPhoneAuthc == 1) {
             str1 += `<li class="item custom-identify">
             <input type="text" placeholder="请输入验证码" id="modify-custom-identify">
             <div class="get-custom-identify" id="get-modify-custom-identify"><span class="line"></span> <p id="time_modify">获取验证码</p></div>
             </li>`
             }*/

            if (result.formTicket == 1) {

                //绑定电子券列表（无论formExchangeType是啥formTicketList必然存在,但detailData里的ticketList可能不存在（exchangeType=1时））
                if (result.formTicketList && result.formTicketList.length) {
                    str2 += `<div class="tittle">
                      券码信息
                   </div>`;

                    if(result.formExchangeType==1){
                        str2 += `<div class="formExchangeType" id="formExchangeTypeModify">
                        <div class="prefix">
                          兑换类型
                        </div>
                        <ul class="exchangeTypeList">
                          <li class="dianzi active">
                            电子券
                          </li>
                          <li class="meitong">
                            美通卡
                          </li>
                        </ul>
                      </div>
                      `;
                    }
                    str2 += `<div class="list dianzi-list" id="dianzi-list-modify">
                      <div class="list-item header">
                        <div class="left">券码面值</div>
                        <div class="right">数量</div>
                      </div>`;

                    if(detailData.exchangeType==0){
                        for (let i = 0; i < result.formTicketList.length; i++) {
                            let item = result.formTicketList[i];
                            let flag = true;

                            for (let j = 0; j < detailData.ticketList.length; j++) {
                                let detailItem = detailData.ticketList[j];
                                if (item.faceValue == detailItem.faceValue) {
                                    str2 += `<div class="list-item item">
        <div class="left">${item.faceValue}</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketCode} value=${detailItem ? detailItem.total : ''}>
      </div>`;
                                    flag = false;
                                    break;
                                }
                            }
                            if (flag) {
                                str2 += `<div class="list-item item">
        <div class="left">${item.faceValue}</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketCode} value=''>
      </div>`;
                            }
                        }
                        /*if(result.formExchangeType==1){
                          for (let i = 0; i < result.formTicketList.length; i++) {
                            let item = result.formTicketList[i];
                            str2 += `<div class="list-item item">
                    <div class="left">${item.faceValue}</div>
                    <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketCode}>
                  </div>`
                          }
                        }*/
                    }
                    if(detailData.exchangeType==1){



                        for (let i = 0; i < result.formTicketList.length; i++) {
                            let item = result.formTicketList[i];
                            str2 += `<div class="list-item item">
        <div class="left">${item.faceValue}</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketCode}>
      </div>`
                        }
                    }


                    str2 += `</div>`;

                }

                //绑定美通卡列表
                if(result.formExchangeType==1&&result.formMeitongTicketList&&result.formMeitongTicketList.length){
                    str2 += `<div class="list meitong-list" id="meitong-list-modify">
                        <div class="list-item header">
                          <div class="left">券码面值</div>
                          <div class="right">数量</div>
                        </div>`;
                    let meitongLength = result.formMeitongTicketList.length;
                    if(detailData.exchangeType==0){
                        for (let i = 0; i < meitongLength; i++) {
                            let item = result.formMeitongTicketList[i];

                            if(result.meitongFaceMin==item.amount){//给美通卡最小面值的输入框加唯一id
                                str2 += `<div class="list-item item">
        <div class="left">${item.amount}元</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode} id="meitongMinModify">
      </div>`
                            }else{
                                str2 += `<div class="list-item item">
        <div class="left">${item.amount}元</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode}>
      </div>`
                            }

                        }
                    }
                    if(detailData.exchangeType==1){
                        for (let i = 0; i < meitongLength; i++) {

                            let item = result.formMeitongTicketList[i];
                            let flag = true;

                            if(result.meitongFaceMin==item.amount){//美通卡最小面值加唯一id

                                for (let j = 0; j < detailData.meitongTicketList.length; j++) {
                                    let detailItem = detailData.meitongTicketList[j];

                                    if (item.amount == detailItem.amount) {
                                        str2 += `<div class="list-item item">
        <div class="left">${item.amount}元</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode} value=${detailItem ? detailItem.total : ''} id="meitongMinModify">
      </div>`;
                                        flag = false;
                                        break;
                                    }
                                }
                                if (flag) {
                                    str2 += `<div class="list-item item">
        <div class="left">${item.amount}元</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode} value='' id="meitongMinModify">
      </div>`;
                                }
                            }else{//非最小面值
                                for (let j = 0; j < detailData.meitongTicketList.length; j++) {
                                    let detailItem = detailData.meitongTicketList[j];

                                    if (item.amount == detailItem.amount) {
                                        str2 += `<div class="list-item item">
        <div class="left">${item.amount}元</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode} value=${detailItem ? detailItem.total : ''}>
      </div>`;
                                        flag = false;
                                        break;
                                    }
                                }
                                if (flag) {
                                    str2 += `<div class="list-item item">
        <div class="left">${item.amount}元</div>
        <input type="text" class="right-modify" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode} value=''>
      </div>`;
                                }
                            }

                        }
                    }


                    str2 += `<div class="meitong-tips" id="meitong-tips-modify">
                      <span class="iconfont icon-tishi1"></span>
                      美通卡兑换最小面值${result.meitongFaceMin}元，${result.meitongNumberMin}张起兑
                    </div>`;
                    str2 += `</div>`;

                }


            }

            if (result.formDate == 1) {
                str3 += `<div class="tittle">
      日期
    </div>
    
    <input class="select-date" id="modify-date" type="text" readonly="" name="input_date" placeholder="请选择日期" data-lcalendar="${dateNow},2030-12-31" value=${detailData.date} />`
            }

            $('#modify-custom-info').html(str1);
            $('#modify-custom-ticket').html(str2);
            $('#modify-custom-date-box').html(str3);

            exchangeTypeModify = detailData.exchangeType;
            if(exchangeTypeModify==1){
                $('#formExchangeTypeModify .exchangeTypeList .meitong').addClass('active').siblings().removeClass('active');
                $('#meitong-list-modify').show();
                $('#dianzi-list-modify').hide();

                $('#formExchangeTypeModify .exchangeTypeList .dianzi').css({
                    borderColor:'#ccc',
                    color:'#ccc'
                })
            }else{
                $('#formExchangeTypeModify .exchangeTypeList .meitong').css({
                    borderColor:'#ccc',
                    color:'#ccc'
                })
            }

            if (result.formDate == 1) {
                let calendar = new lCalendar();
                calendar.init({
                    'trigger' : '#modify-date',
                    'type' : 'date'
                });
            }

        }

        //获取验证码
        function getCustomIdentifyOfModify() {
            let flag = null;

            let customPhone = $('#modify-custom-phone').val();
            if (!!customPhone) {
                flag = isPoneAvailable(customPhone);
            } else {
                layer.open({
                    content : '请输入手机号码！！'
                    , skin : 'msg'
                    , time : 2 //2秒后自动关闭
                });
                return;
            }

            if (flag) {

                //验证通过开始倒计时
                let num = 60;
                clearInterval(timer);
                $('#time_').text(num);
                timer = setInterval(() => {
                    num--;
                    if (num >= 0) {
                        $('#time_modify').text(num);
                    } else {
                        clearInterval(timer);
                        $('#time_modify').text('重新获取');
                        $('#get-modify-custom-identify').on('tap', getCustomIdentifyOfModify);//添加点击事件
                    }
                }, 1000);
                $('#get-modify-custom-identify').off('tap', getCustomIdentifyOfModify);//去除点击事件

                $.ajax({
                    url : domain + '/sms',
                    type : 'POST',
                    cache : true,
                    dataType : 'json',
                    data : { phone : customPhone, type : '3' },
                    headers : {
                        token,
                        userId
                    },
                    success : (result) => {
                        if (result.code == 'SUCCESS') {
                            // console.log(result);


                        } else {
                            loginAgain(result.code);
                            layer.open({
                                content : result.msg
                                , skin : 'msg'
                                , time : 3 //3秒后自动关闭
                            })
                        }

                    },
                    error : (err) => {
                        console.log(err);
                    }
                })
            } else {
                layer.open({
                    content : '手机号码格式输入有误！！'
                    , skin : 'msg'
                    , time : 2 //2秒后自动关闭
                });
            }
        }

        //保存修改后的表单
        function saveFormOfModify() {
            let detailCode = sessionStorage.getItem('detailCode');
            let data;

            data = { orderNo:detailData.orderNo, detailCode, exchangeType:exchangeTypeModify };

            /*//判断是驳回表单还是新提交表单
            let reject = sessionStorage.getItem('reject');
            if(reject == 'yes'){
              data = { orderNo:orderNoReject, detailCode, exchangeType:exchangeTypeModify };
            }else{
              data = { orderNo:detailData.orderNo, detailCode, exchangeType:exchangeTypeModify };
            }*/


            let name = $('#modify-custom-name').val();
            let idCard = $('#modify-custom-id').val();
            let customPhone = $('#modify-custom-phone').val();
            let smsCode = $('#modify-custom-identify').val();
            if (this.formName == 1) {
                if (!!name) {
                    if (name.length < 15) {
                        data.name = name;
                    } else {
                        layer.open({
                            content : '姓名长度过长'
                            , skin : 'msg'
                            , time : 2 //2秒后自动关闭
                        });
                        return;
                    }
                } else {
                    layer.open({
                        content : '请输入姓名'
                        , skin : 'msg'
                        , time : 2 //2秒后自动关闭
                    });
                    return;
                }
            }
            if (this.formIdCard == 1) {
                if (!!idCard) {
                    //验证身份证号是否合法
                    if (isCardNo(idCard)) {
                        data.idCard = idCard;
                    } else {
                        layer.open({
                            content : '身份证号格式输入有误'
                            , skin : 'msg'
                            , time : 2 //2秒后自动关闭
                        });
                        return;
                    }

                } else {
                    layer.open({
                        content : '请输入身份证号'
                        , skin : 'msg'
                        , time : 2 //2秒后自动关闭
                    });
                    return;
                }
            }
            if (this.formPhone == 1) {
                if (!!customPhone) {
                    if (isPoneAvailable(customPhone)) {
                        data.phone = customPhone;
                    } else {
                        layer.open({
                            content : '手机号码格式输入有误！'
                            , skin : 'msg'
                            , time : 2 //2秒后自动关闭
                        });
                        return;
                    }
                } else {
                    layer.open({
                        content : '请输入手机号码'
                        , skin : 'msg'
                        , time : 2 //2秒后自动关闭
                    });
                    return;
                }
            }
            /*if (this.formPhoneAuthc == 1) {
             if (!!smsCode) {
             data.smsCode = smsCode;
             } else {
             layer.open({
             content: '请输入验证码！'
             , skin: 'msg'
             , time: 2 //2秒后自动关闭
             });
             return;
             }
             }*/
            //券码数量的验证
            if (this.formTicket == 1) {
                let ticketArr = [];
                let valArr = [];//验证非空用


                if(exchangeTypeModify==0){
                    $('#dianzi-list-modify input[class=right-modify]').each((index, item) => {
                        let itemObj = {};
                        let val = $(item).val();
                        valArr.push(val);
                        itemObj.formTicketCode = $(item).attr('ticket-code');
                        itemObj.total = val;
                        ticketArr.push(itemObj);
                    });
                }
                if(exchangeTypeModify==1){
                    $('#meitong-list-modify input[class=right-modify]').each((index, item) => {
                        let itemObj = {};
                        let val = $(item).val();
                        valArr.push(val);
                        itemObj.formTicketMeitongCode = $(item).attr('ticket-code');
                        itemObj.total = val;
                        ticketArr.push(itemObj);
                    });
                }


                if (valArr.some(item => !!item == true)) {
                    if (valArr.every(item => isNaN(item) == false)) {
                        if(exchangeTypeModify==0){
                            data.ticketList = ticketArr;
                        }
                        if(exchangeTypeModify==1){
                            data.meitongTicketList = ticketArr;
                        }

                    } else {
                        layer.open({
                            content : '券码数量必须为数字！'
                            , skin : 'msg'
                            , time : 2 //2秒后自动关闭
                        });
                        return;
                    }
                } else {
                    layer.open({
                        content : '请至少填写一种券码数量！'
                        , skin : 'msg'
                        , time : 2 //2秒后自动关闭
                    });
                    return;
                }

                //验证美通卡最小面值是不是输入的大于起兑额
                if(exchangeTypeModify==1 && !!$('#meitongMinModify').val()){

                    if(detailData.isReject==0){
                        if($('#meitongMinModify').val()<formData.meitongNumberMin){
                            layer.open({
                                content : '起兑量必须大于等于' +formData.meitongNumberMin+'！'
                                , skin : 'msg'
                                , time : 2 //2秒后自动关闭
                            });
                            return;
                        }
                    }
                    if(detailData.isReject==1){
                        if($('#meitongMinModify').val()<formDataReject.meitongNumberMin){
                            layer.open({
                                content : '起兑量必须大于等于' +formDataReject.meitongNumberMin+'！'
                                , skin : 'msg'
                                , time : 2 //2秒后自动关闭
                            });
                            return;
                        }
                    }

                }
            }
            if (this.formDate == 1) {
                let date = $('#modify-date').val();
                if (!!date) {
                    data.date = date;
                } else {
                    layer.open({
                        content : '请选择日期！'
                        , skin : 'msg'
                        , time : 2 //2秒后自动关闭
                    });
                    return;
                }
            }

            if (!modifying) {
                modifying = true;
                $.ajax({
                    url : domain + '/order/update',
                    type : 'POST',
                    dataType : 'json',
                    contentType : 'application/json;charset=utf-8',
                    cache : true,
                    data : JSON.stringify(data),
                    headers : {
                        token,
                        userId
                    },
                    success : (result) => {
                        //提示成功，并清空数据
                        if (result.code == 'SUCCESS') {
                            layer.open({
                                content : '修改订单成功'
                                , skin : 'msg'
                                , time : 2 //2秒后自动关闭
                            });
                            $('#modify-detail input').val('');

                            //跳转详情页
                            $('#order-detail').show();
                            $('#modify-detail').hide();
                            getDetailData();//更新详情数据

                            /*//修改成功后初始化获取验证码
                             clearInterval(timer);
                             $('#time_modify').text('获取验证码');
                             $('#get-modify-custom-identify').off('tap');
                             $('#get-modify-custom-identify').on('tap', getCustomIdentifyOfModify);*/
                        } else {
                            loginAgain(result.code);
                            layer.open({
                                content : result.msg
                                , skin : 'msg'
                                , time : 2 //2秒后自动关闭
                            });
                        }
                    },
                    error : (err) => {
                        console.log(err);
                    },
                    complete : (result)=> {
                        modifying = false;
                    }

                })
            }


        }

    }


    /*驳回表单(电子券)*/
    let myScrollReject = new IScroll('#wrapper-reject', {
        scrollX: true,
        // interactiveScrollbars: true,
        // shrinkScrollbars: 'scale',
        // fadeScrollbars: true,
        // scrollY:true,
        probeType: 2,
        mouseWheel: true,
        scrollbars: false,
        // bounce:false,
        //bindToWrapper:true
    });
    myScrollReject.on("scroll", function () {
        pullRefreshYReject = this.y;

        if (this.y > 0) {

            if (this.y > 50) {
                $('#pull-refresh-box-reject').css({height: '50'});
                $('#pull-refresh-reject').html('<span class="iconfont icon-xiangshang"></span>释放立即刷新');

            } else {
                $('#pull-refresh-box-reject').css({height: this.y});
                $('#pull-refresh-reject').html('<span class="iconfont icon-xiangxia"></span>继续下拉刷新');

            }
        }

    });
    myScrollReject.on("scrollEnd", function () {
        if (pullRefreshYReject > 0) {
            //下拉刷新提示框恢复原位
            $('#pull-refresh-box-reject').animate({height: 0});
            if (pullRefreshYReject > 50) {
                $('#load-more-reject').text('正在努力加载数据...').show();
                //执行刷新操作
                pageReject = 1;
                queryReject = null;
                $('#search-reject').val('');
                $('#wrapper-reject .list').html('');
                $('#search-reject-btn').off('tap').css({borderColor: '#ccc', color: '#ccc'});

                if (!dianziPullRefreshingReject) {
                    initRejectFormListDianzi();
                }

            }
        }

        //上拉加载
        if (this.wrapperHeight - this.y >= this.scrollerHeight) {
            if (hasMoreReject) {

                $('#load-more-reject').text('正在努力加载数据...').show();
                //请求数据
                getRejectFormListDianzi();
            } else {
                $('#load-more-reject').text('没有更多数据了').show();
            }

        }

    });

    /*驳回表单（美通卡）*/
    let myScrollRejectMeitong = new IScroll('#wrapper-reject-meitong', {
        scrollX: true,
        // interactiveScrollbars: true,
        // shrinkScrollbars: 'scale',
        // fadeScrollbars: true,
        // scrollY:true,
        probeType: 2,
        mouseWheel: true,
        scrollbars: false,
        // bounce:false,
        //bindToWrapper:true
    });
    myScrollRejectMeitong.on("scroll", function () {
        pullRefreshYRejectMeitong = this.y;

        if (this.y > 0) {
            if (this.y > 50) {
                $('#pull-refresh-box-reject-meitong').css({height: '50'});
                $('#pull-refresh-reject-meitong').html('<span class="iconfont icon-xiangshang"></span>释放立即刷新');

            } else {
                $('#pull-refresh-box-reject-meitong').css({height: this.y});
                $('#pull-refresh-reject-meitong').html('<span class="iconfont icon-xiangxia"></span>继续下拉刷新');

            }
        }

    });
    myScrollRejectMeitong.on("scrollEnd", function () {
        if (pullRefreshYRejectMeitong > 0) {
            //下拉刷新提示框恢复原位
            $('#pull-refresh-box-reject-meitong').animate({height: 0});
            if (pullRefreshYRejectMeitong > 50) {
                $('#load-more-reject-meitong').text('正在努力加载数据...').show();
                //执行刷新操作
                pageRejectMeitong = 1;
                queryRejectMeitong = null;
                $('#search-reject-meitong').val('');
                $('#wrapper-reject-meitong .list').html('');
                $('#search-reject-btn-meitong').off('tap').css({borderColor: '#ccc', color: '#ccc'});

                if (!meitongPullRefreshingReject) {
                    initRejectFormListMeitong();
                }

            }
        }

        //上拉加载
        if (this.wrapperHeight - this.y >= this.scrollerHeight) {
            if (hasMoreRejectMeitong) {

                $('#load-more-reject-meitong').text('正在努力加载数据...').show();
                //请求数据
                getRejectFormListMeitong();
            } else {
                $('#load-more-reject-meitong').text('没有更多数据了').show();
            }

        }

    });

    //进入驳回表单页
    reject();

    function reject() {//static
        let submitRejectFormFlag = false;
        $('.reject').on('tap', function () {
            $('#order-list').hide();
            $('#order-reject-list').show();
            if (!submitRejectFormFlag) {
                submitRejectFormFlag = true;
                initRejectFormListDianzi();
            } else {
                myScrollReject.refresh();
                myScrollRejectMeitong.refresh();
            }
            sessionStorage.setItem('reject', 'yes');//修改订单时判断是
        });
    }

    //退出驳回表单页返回新提交表单列表页面
    $('#order-reject-list .header-bar .back').on('tap', function () {
        $('#order-reject-list').hide();
        if (formData && formData.submitFlag == '1') {
            $('#order-list').show();
        } else {
            $('#have-submit').show();
        }

        myScroll.refresh();
        sessionStorage.setItem('reject', 'no');
    });

    //提交驳回表单
    $('#submit-reject-form').on('tap', function () {

        if (!submittingReject) {

            $.dialog({
                type: 'confirm',
                //titleText:'我是标题',
                onClickOk: function () {
                    //if(confirm('确定要提交驳回表单？')==false) return;
                    submittingReject = true;
                    $.ajax({
                        url: domain + '/order/reject/submit',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            orderNo: orderNoReject
                        },
                        headers: {
                            token,
                            userId
                        },
                        success: (result) => {
                            if (result.code == 'SUCCESS') {

                                //一日一表一驳回情况下，提交驳回成功后直接确定没有驳回表单了（后期可能要改成查询是否有订单接口）
                                sessionStorage.setItem('reject', 'no');

                                rejectFlag = false;
                                $('#order-reject-list').hide();

                                if (formData && formData.submitFlag == '1') {
                                    $('#order-list').show();
                                } else {
                                    $('#have-submit').show();
                                }

                                $('.reject').hide();

                                myScroll.refresh();

                                layer.open({
                                    content: result.msg
                                    , skin: 'msg'
                                    , time: 3 //2秒后自动关闭
                                });

                            } else {
                                loginAgain(result.code);
                                layer.open({
                                    content: result.msg
                                    , skin: 'msg'
                                    , time: 3 //2秒后自动关闭
                                });
                            }
                        },
                        error: (err) => {
                            console.log(err);
                        },
                        complete: (result) => {
                            submittingReject = false;
                        }
                    })
                },
                onClickCancel: function () {
                    //
                },
                contentHtml: '<p style="text-align: center">确定要提交驳回表单？</p>'
            });


        }
    })


    dianMeiListTabReject();

    //点击我的表单--驳回表单页面的选项卡
    function dianMeiListTabReject() {
        let submitMeitongListFlag = false;
        $('#exchangeTypeListRejectSearch li').on('tap', function () {

            let thisIndex = $(this).index();

            exchangeTypeRejectSearch = thisIndex;
            exchangeTypeAddNew = thisIndex;

            if (!$(this).hasClass('active')) {
                $(this).addClass('active').siblings().removeClass('active');
            }

            if (thisIndex == 0) {
                //显示电子群列表，隐藏美通卡列表
                $('#dianzi-list-reject').show();
                $('#meitong-list-reject').hide();
                myScrollReject.refresh();
            }
            if (thisIndex == 1) {
                //显示美通卡列表，隐藏电子券列表
                $('#meitong-list-reject').show();
                $('#dianzi-list-reject').hide();

                if (!submitMeitongListFlag) {
                    initRejectFormListMeitong();
                    submitMeitongListFlag = true;
                } else {
                    myScrollRejectMeitong.refresh();
                }
            }
        });
    }

    //获取电子券驳回列表信息
    function initRejectFormListDianzi() {
        dianziPullRefreshingReject = true;
        $.ajax({
            url: domain + '/order/reject/query',
            type: "GET",
            cache: true,
            dataType: 'json',
            data: {
                query: queryReject,
                page: pageReject,
                exchangeType: 0
            },
            headers: {
                token,
                userId
            },
            success: (result) => {
                if (result.code == 'SUCCESS') {
                    if (result.historyForm) {
                        formDataReject = result.historyForm;
                        bindFormListHeaderReject(result.historyForm);
                        if (result.historyForm.formExchangeType == 1) {
                            $('#exchangeTypeListRejectSearchBox').show();
                        }
                    }

                    orderNoReject = result.orderNo;//存储订单号
                    hasMoreReject = result.list && result.list.length == 20 ? true : false;//是否还有数据（恰好最后一组是20条的时候就尴尬了）


                    let str = ``;
                    let list = result.list;
                    if (list && list.length) {
                        for (let i = 0; i < list.length; i++) {
                            let item = list[i];
                            str += `<li detail-code=${item.detailCode} class="form-item clearBoth"><div class="index floatL">${i + (pageReject - 1) * 20 + 1}</div>`;
                            if (item.name) {
                                str += `<div class="name floatL">${item.name}</div>`;
                            }
                            if (item.idCard) {
                                str += `<div class="card-id floatL">${item.idCard}</div>`;
                            }
                            if (item.phone) {
                                str += `<div class="phone floatL">${item.phone}</div>`;
                            }
                            if (item.ticketList) {
                                str += `<div class="coupon floatL">`;
                                for (let j = 0; j < item.ticketList.length; j++) {
                                    let ticketItem = item.ticketList[j];
                                    str += `<p>${ticketItem.faceValue}/${ticketItem.total}张；</p>`
                                }
                                str += `</div>`;
                            }
                            if (item.date) {
                                str += `<div class="date floatL">${item.date}</div>`;
                            }

                            str += `<div class="modify-person floatL">${item.createBy ? item.createBy : '--'}</div><div class="last-modify-person floatL">${item.modifyBy ? item.modifyBy : '--'}</div><div class="time floatL">${item.modifyTime ? item.modifyTime : '--'}</div></li>`;

                        }
                    }
                    $('#wrapper-reject .list').append(str);

                    //绑定点击进入详情事件
                    goDetail();

                    myScrollReject.refresh();//刷新iscroll


                    pageReject++;

                    if (!hasMoreReject) {
                        $('#load-more-reject').text('没有更多数据了').show();
                    } else {
                        $('#load-more-reject').hide();
                    }

                    //如果只有一种卡券或者三种以上。。。
                    $('#wrapper-reject .scroller .list .coupon').each(function (index, item) {
                        if ($(item).find('p').length == 1) {
                            $(item).css({lineHeight: '0.68rem'});
                        }
                        if ($(item).find('p').length >= 3) {
                            $(item).parent().css({lineHeight: $(item).find('p').length * 0.34 + 'rem'})
                        }
                    });

                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                }
            },
            error: (err) => {
                console.log(err);
            },
            complete: () => {
                dianziPullRefreshingReject = false;
            }
        })
    }

    //获取电子券驳回列表信息
    function getRejectFormListDianzi() {
        $.ajax({
            url: domain + '/order/reject/query',
            type: "GET",
            cache: true,
            dataType: 'json',
            data: {
                query: queryReject,
                page: pageReject,
                exchangeType: 0
            },
            headers: {
                token,
                userId
            },
            success: (result) => {
                if (result.code == 'SUCCESS') {
                    if (result.historyForm) {
                        formDataReject = result.historyForm;
                    }

                    orderNoReject = result.orderNo;//存储订单号
                    hasMoreReject = result.list && result.list.length == 20 ? true : false;//是否还有数据（恰好最后一组是20条的时候就尴尬了）


                    let str = ``;
                    let list = result.list;
                    if (list && list.length) {
                        for (let i = 0; i < list.length; i++) {
                            let item = list[i];
                            str += `<li detail-code=${item.detailCode} class="form-item clearBoth"><div class="index floatL">${i + (pageReject - 1) * 20 + 1}</div>`;
                            if (item.name) {
                                str += `<div class="name floatL">${item.name}</div>`;
                            }
                            if (item.idCard) {
                                str += `<div class="card-id floatL">${item.idCard}</div>`;
                            }
                            if (item.phone) {
                                str += `<div class="phone floatL">${item.phone}</div>`;
                            }
                            if (item.ticketList) {
                                str += `<div class="coupon floatL">`;
                                for (let j = 0; j < item.ticketList.length; j++) {
                                    let ticketItem = item.ticketList[j];
                                    str += `<p>${ticketItem.faceValue}/${ticketItem.total}张；</p>`
                                }
                                str += `</div>`;
                            }
                            if (item.date) {
                                str += `<div class="date floatL">${item.date}</div>`;
                            }

                            str += `<div class="modify-person floatL">${item.createBy ? item.createBy : '--'}</div><div class="last-modify-person floatL">${item.modifyBy ? item.modifyBy : '--'}</div><div class="time floatL">${item.modifyTime ? item.modifyTime : '--'}</div></li>`;

                        }
                    }
                    $('#wrapper-reject .list').append(str);

                    //绑定点击进入详情事件
                    goDetail();

                    myScrollReject.refresh();//刷新iscroll


                    pageReject++;

                    if (!hasMoreReject) {
                        $('#load-more-reject').text('没有更多数据了').show();
                    } else {
                        $('#load-more-reject').hide();
                    }

                    //如果只有一种卡券或者三种以上。。。
                    $('#wrapper-reject .scroller .list .coupon').each(function (index, item) {
                        if ($(item).find('p').length == 1) {
                            $(item).css({lineHeight: '0.68rem'});
                        }
                        if ($(item).find('p').length >= 3) {
                            $(item).parent().css({lineHeight: $(item).find('p').length * 0.34 + 'rem'})
                        }
                    });

                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                }
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    //获取美通卡驳回列表
    function initRejectFormListMeitong() {
        meitongPullRefreshingReject = false;
        $.ajax({
            url: domain + '/order/reject/query',
            type: "GET",
            cache: true,
            dataType: 'json',
            data: {
                query: queryRejectMeitong,
                page: pageRejectMeitong,
                exchangeType: 1
            },
            headers: {
                token,
                userId
            },
            success: (result) => {
                if (result.code == 'SUCCESS') {
                    if (result.historyForm) {
                        formDataReject = result.historyForm;
                        bindFormListHeaderReject(result.historyForm);
                    }

                    orderNoReject = result.orderNo;//存储订单号
                    hasMoreRejectMeitong = result.list && result.list.length == 20 ? true : false;//是否还有数据（恰好最后一组是20条的时候就尴尬了）


                    let str = ``;
                    let list = result.list;
                    if (list && list.length) {
                        for (let i = 0; i < list.length; i++) {
                            let item = list[i];
                            str += `<li detail-code=${item.detailCode} class="form-item clearBoth"><div class="index floatL">${i + (pageRejectMeitong - 1) * 20 + 1}</div>`;
                            if (item.name) {
                                str += `<div class="name floatL">${item.name}</div>`;
                            }
                            if (item.idCard) {
                                str += `<div class="card-id floatL">${item.idCard}</div>`;
                            }
                            if (item.phone) {
                                str += `<div class="phone floatL">${item.phone}</div>`;
                            }
                            if (item.meitongTicketList) {
                                str += `<div class="coupon floatL">`;
                                for (let j = 0; j < item.meitongTicketList.length; j++) {
                                    let ticketItem = item.meitongTicketList[j];
                                    str += `<p>${ticketItem.amount}元/${ticketItem.total}张；</p>`
                                }
                                str += `</div>`;
                            }
                            if (item.date) {
                                str += `<div class="date floatL">${item.date}</div>`;
                            }

                            str += `<div class="modify-person floatL">${item.createBy ? item.createBy : '--'}</div><div class="last-modify-person floatL">${item.modifyBy ? item.modifyBy : '--'}</div><div class="time floatL">${item.modifyTime ? item.modifyTime : '--'}</div></li>`;

                        }
                    }
                    $('#wrapper-reject-meitong .list').append(str);

                    //绑定点击进入详情事件
                    goDetail();

                    myScrollRejectMeitong.refresh();//刷新iscroll


                    pageRejectMeitong++;

                    if (!hasMoreRejectMeitong) {
                        $('#load-more-reject-meitong').text('没有更多数据了').show();
                    } else {
                        $('#load-more-reject-meitong').hide();
                    }

                    //如果只有一种卡券或者三种以上。。。
                    $('#wrapper-reject-meitong .scroller .list .coupon').each(function (index, item) {
                        if ($(item).find('p').length == 1) {
                            $(item).css({lineHeight: '0.68rem'});
                        }
                        if ($(item).find('p').length >= 3) {
                            $(item).parent().css({lineHeight: $(item).find('p').length * 0.34 + 'rem'})
                        }
                    });

                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                }
            },
            error: (err) => {
                console.log(err);
            },
            complete: () => {
                meitongPullRefreshingReject = false;
            }
        })
    }

    //获取美通卡驳回列表
    function getRejectFormListMeitong() {
        $.ajax({
            url: domain + '/order/reject/query',
            type: "GET",
            cache: true,
            dataType: 'json',
            data: {
                query: queryRejectMeitong,
                page: pageRejectMeitong,
                exchangeType: 1
            },
            headers: {
                token,
                userId
            },
            success: (result) => {
                if (result.code == 'SUCCESS') {
                    if (result.historyForm) {
                        formDataReject = result.historyForm;
                    }

                    orderNoReject = result.orderNo;//存储订单号
                    hasMoreRejectMeitong = result.list && result.list.length == 20 ? true : false;//是否还有数据（恰好最后一组是20条的时候就尴尬了）


                    let str = ``;
                    let list = result.list;
                    if (list && list.length) {
                        for (let i = 0; i < list.length; i++) {
                            let item = list[i];
                            str += `<li detail-code=${item.detailCode} class="form-item clearBoth"><div class="index floatL">${i + (pageRejectMeitong - 1) * 20 + 1}</div>`;
                            if (item.name) {
                                str += `<div class="name floatL">${item.name}</div>`;
                            }
                            if (item.idCard) {
                                str += `<div class="card-id floatL">${item.idCard}</div>`;
                            }
                            if (item.phone) {
                                str += `<div class="phone floatL">${item.phone}</div>`;
                            }
                            if (item.meitongTicketList) {
                                str += `<div class="coupon floatL">`;
                                for (let j = 0; j < item.meitongTicketList.length; j++) {
                                    let ticketItem = item.meitongTicketList[j];
                                    str += `<p>${ticketItem.amount}元/${ticketItem.total}张；</p>`
                                }
                                str += `</div>`;
                            }
                            if (item.date) {
                                str += `<div class="date floatL">${item.date}</div>`;
                            }

                            str += `<div class="modify-person floatL">${item.createBy ? item.createBy : '--'}</div><div class="last-modify-person floatL">${item.modifyBy ? item.modifyBy : '--'}</div><div class="time floatL">${item.modifyTime ? item.modifyTime : '--'}</div></li>`;

                        }
                    }
                    $('#wrapper-reject .list').append(str);

                    //绑定点击进入详情事件
                    goDetail();

                    myScrollRejectMeitong.refresh();//刷新iscroll


                    pageRejectMeitong++;

                    if (!hasMoreRejectMeitong) {
                        $('#load-more-reject-meitong').text('没有更多数据了').show();
                    } else {
                        $('#load-more-reject-meitong').hide();
                    }

                    //如果只有一种卡券或者三种以上。。。
                    $('#wrapper-reject-meitong .scroller .list .coupon').each(function (index, item) {
                        if ($(item).find('p').length == 1) {
                            $(item).css({lineHeight: '0.68rem'});
                        }
                        if ($(item).find('p').length >= 3) {
                            $(item).parent().css({lineHeight: $(item).find('p').length * 0.34 + 'rem'})
                        }
                    });

                } else {
                    loginAgain(result.code);
                    layer.open({
                        content: result.msg
                        , skin: 'msg'
                        , time: 3 //2秒后自动关闭
                    });
                }
            },
            error: (err) => {
                console.log(err);
            }
        })
    }

    //添加按钮点击事件
    $(".new-data-box").on('tap', function () {
        $('#add-new-data').show().siblings().hide();
        exchangeTypeAddNew = 0;
        addRecord();
    });

    /* ------- 新增数据页面 ------- */

    //返回按钮点击事件
    $("#add-new-data .header-bar .back").on('tap', function () {
        $('#my-form').show().siblings().hide();

        myScroll.refresh();
        myScrollMeitong.refresh();
        myScrollReject.refresh();
        myScrollRejectMeitong.refresh();
    });

    //保存按钮点击事件
    $("#add-new-data .header-bar .save").on('tap', function () {
        saveAddNewForm();
    });

    function addRecord() {
        if (formDataReject) {
            let result = formDataReject;
            addNewFormData(result);

            if (result.formExchangeType && result.formExchangeType == 1) {
                //给美通卡最小面值输入框绑定input事件
                $('#add-new-meitong-min').on('change', function () {

                    let val = Number($(this).val());
                    if (!isNaN(val)) {
                        if (val < result.meitongNumberMin) {
                            $(this).val('');
                            layer.open({
                                content: '此项起兑量必须大于等于' + result.meitongNumberMin + '！'
                                , skin: 'msg'
                                , time: 3 //3秒后自动关闭
                            })
                        }
                    } else {
                        $(this).val('');
                        layer.open({
                            content: '请输入有效正整数！'
                            , skin: 'msg'
                            , time: 3 //3秒后自动关闭
                        })
                    }

                });

                //给电子券和美通卡按钮绑定点击事件
                $('#add-new-form-exchange-type .exchangeTypeList li').on('tap', function () {
                    if (!$(this).hasClass('active')) {
                        $(this).addClass('active').siblings().removeClass('active');
                        let thisIndex = $(this).index();
                        exchangeTypeAddNew = thisIndex;
                        if (thisIndex == 0) {
                            $('#add-new-dianzi-list').show();
                            $('#add-new-meitong-list').hide();
                            $('#add-new-meitong-list input').val('');
                        } else if (thisIndex == 1) {
                            $('#add-new-meitong-list').show();
                            $('#add-new-dianzi-list').hide();
                            $('#add-new-dianzi-list input').val('');
                        }

                    }

                });
            }
        }
        function addNewFormData(result) {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();

            let str1 = '';
            let str2 = '';
            let str3 = '';
            if (result.formName == 1) {
                str1 += '<li class = "item custom-name"><div class = "left name">姓名</div><input type="text" id="add-new-custom-name" placeholder="请输入姓名"></li>'
            }
            if (result.formIdCard == 1) {
                str1 += `<li class="item custom-id">
        			<div class="left id">身份证号码</div>
        			<input type="text" id="add-new-custom-id" placeholder="请输入身份证号">
     			</li>`
            }
            if (result.formPhone == 1) {
                str1 += `<li class="item custom-phone">
        			<div class="left phone">手机号码</div>
        			<input type="text" id="add-new-custom-phone" placeholder="请输入银行预留手机号">
      			</li>`
            }
            if (result.formTicket == 1) {
                str2 += `<div class="tittle">
                    券码信息
                </div>`;
                if (result.formExchangeType == 1) {
                    str2 += `<div class="formExchangeType" id="add-new-form-exchange-type">
                        <div class="prefix">
                          	兑换类型
                        </div>
                        <ul class="exchangeTypeList">
                          	<li class="dianzi active">
                            	电子券
                          	</li>
                          	<li class="meitong">
                            	美通卡
                          	</li>
                        </ul>
                      </div>`;
                }

                if (result.formTicketList && result.formTicketList.length) {
                    str2 += `<div class="list dianzi-list" id="add-new-dianzi-list">
                        <div class="list-item header">
                          	<div class="left">券码面值</div>
                          	<div class="right">数量</div>
                        </div>`;

                    //绑定电子券记录表单
                    for (let i = 0; i < result.formTicketList.length; i++) {
                        let item = result.formTicketList[i];
                        str2 += `<div class="list-item item">
        					<div class="left">${item.faceValue}</div>
        					<input type="text" class="right" placeholder="输入兑换张数" ticket-code=${item.formTicketCode}>
      					</div>`;
                    }
                    str2 += `</div>`;
                }

                //绑定美通卡记录表单
                if (result.formExchangeType == 1 && result.formMeitongTicketList && result.formMeitongTicketList.length) {
                    str2 += `<div class="list meitong-list" id="add-new-meitong-list">
                        <div class="list-item header">
                        <div class="left">券码面值</div>
                        <div class="right">数量</div>
                    </div>`;
                    let meitongLength = result.formMeitongTicketList.length;

                    for (let i = 0; i < meitongLength; i++) {
                        let item = result.formMeitongTicketList[i];

                        if (result.meitongFaceMin == item.amount) {//给美通卡最小面值的输入框加唯一id
                            str2 += `<div class="list-item item">
        						<div class="left">${item.amount}元</div>
        						<input type="text" class="right" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode} id="add-new-meitong-min">
      						</div>`;
                        } else {
                            str2 += `<div class="list-item item">
        						<div class="left">${item.amount}元</div>
        						<input type="text" class="right" placeholder="输入兑换张数" ticket-code=${item.formTicketMeitongCode}>
      						</div>`
                        }

                    }
                    str2 += `<div class="meitong-tips">
                      	<span class="iconfont icon-tishi1"></span>
                      	美通卡兑换最小面值${result.meitongFaceMin}元，${result.meitongNumberMin}张起兑
                    </div>`;
                    str2 += `</div>`;

                }

            }
            if (result.formDate == 1) {
                str3 += '<div class = "tittle">日期</div><input class="select-date" id="add-new-select-date" type="text" readonly="" name="input_date" placeholder="请选择日期" data-lcalendar="${dateNow},2030-12-31" />'
            }
            $('#add-new-custom-info').html(str1);
            $('#add-new-custom-ticket').html(str2);
            $('#add-new-custom-date').html(str3);

            if (result.formDate == 1) {
                let calendar = new lCalendar();
                calendar.init({
                    'trigger': '#add-new-select-date',
                    'type': 'date'
                });
            }

        }
    }

    //保存表单
    function saveAddNewForm() {
        let data = {};
        data.exchangeType = exchangeTypeAddNew;
        data.orderNo = orderNoReject;
        let name = $('#add-new-custom-name').val();
        let idCard = $('#add-new-custom-id').val();
        let customPhone = $('#add-new-custom-phone').val();
        if (formDataReject.formName == 1) {
            if (!!name) {
                if (name.length < 15) {
                    data.name = name;
                } else {
                    layer.open({
                        content: '姓名长度过长'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }

            } else {
                layer.open({
                    content: '请输入姓名'
                    , skin: 'msg'
                    , time: 2 //2秒后自动关闭
                });
                return;
            }
        }
        if (formDataReject.formIdCard == 1) {
            if (!!idCard) {
                //验证身份证号是否合法
                if (isCardNo(idCard)) {
                    data.idCard = idCard;
                } else {
                    layer.open({
                        content: '身份证号格式输入有误'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }

            } else {
                layer.open({
                    content: '请输入身份证号'
                    , skin: 'msg'
                    , time: 2 //2秒后自动关闭
                });
                return;
            }
        }
        if (formDataReject.formPhone == 1) {
            if (!!customPhone) {
                if (isPoneAvailable(customPhone)) {
                    data.phone = customPhone;
                } else {
                    layer.open({
                        content: '手机号码格式输入有误！'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }
            } else {
                layer.open({
                    content: '请输入手机号码'
                    , skin: 'msg'
                    , time: 2 //2秒后自动关闭
                });
                return;
            }
        }
        //券码数量的验证
        if (formDataReject.formTicket == 1) {
            let ticketArr = [];
            let valArr = [];//收集用户填写的券码数量，验证非空用
            if (exchangeTypeAddNew == 0) {//如果当前选择的是电子券
                $('#add-new-dianzi-list input[class=right]').each((index, item) => {
                    let itemObj = {};
                    let val = $(item).val();
                    valArr.push(val);
                    itemObj.formTicketCode = $(item).attr('ticket-code');
                    itemObj.total = val;
                    ticketArr.push(itemObj);
                });
            }
            if (exchangeTypeAddNew == 1) {//如果当前选择的是美通卡
                $('#add-new-meitong-list input[class=right]').each((index, item) => {
                    let itemObj = {};
                    let val = $(item).val();
                    valArr.push(val);
                    itemObj.formTicketMeitongCode = $(item).attr('ticket-code');
                    itemObj.total = val;
                    ticketArr.push(itemObj);
                });
            }


            if (valArr.some(item => !!item == true)) {
                if (valArr.every(item => isNaN(item) == false)) {
                    if (exchangeTypeAddNew == 0) {
                        data.ticketList = ticketArr;
                    }
                    if (exchangeTypeAddNew == 1) {
                        data.meitongTicketList = ticketArr;
                    }

                } else {
                    layer.open({
                        content: '券码数量必须为数字！'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }
            } else {
                layer.open({
                    content: '请至少填写一种券码数量！'
                    , skin: 'msg'
                    , time: 2 //2秒后自动关闭
                });
                return;
            }

            //验证美通卡最小面值是不是输入的大于起兑额
            if (exchangeTypeAddNew == 1 && !!$('#add-new-meitong-min').val()) {
                if ($('#add-new-meitong-min').val() < formData.meitongNumberMin) {
                    layer.open({
                        content: '起兑量必须大于' + formData.meitongNumberMin + '！'
                        , skin: 'msg'
                        , time: 2 //2秒后自动关闭
                    });
                    return;
                }

            }
        }
        if (formDataReject.formDate == 1) {
            let date = $('#add-new-select-date').val();
            if (!!date) {
                data.date = date;
            } else {
                layer.open({
                    content: '请选择日期！'
                    , skin: 'msg'
                    , time: 2 //2秒后自动关闭
                });
                return;
            }
        }


        if (!addNewSaving) {
            addNewSaving = true;
            $.ajax({
                url: domain + '/order/reject/save',
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json;charset=utf-8',
                cache: true,
                data: JSON.stringify(data),
                headers: {
                    token,
                    userId
                },
                success: (result) => {
                    //提示成功，并清空数据
                    if (result.code == 'SUCCESS') {
                        layer.open({
                            content: '保存成功'
                            , skin: 'msg'
                            , time: 2 //2秒后自动关闭
                        });
                        $('#add-new-data .custom input').val('');
                        $('#add-new-data .ticket input').val('');
                        $('#add-new-data .date input').val('');
                        $('#my-form').show();
                        $('#add-new-data').hide();

                        myScroll.refresh();
                        myScrollMeitong.refresh();
                        myScrollReject.refresh();
                        myScrollRejectMeitong.refresh();

                    } else {
                        loginAgain(result.code);
                        layer.open({
                            content: result.msg
                            , skin: 'msg'
                            , time: 3 //2秒后自动关闭
                        });
                    }
                },
                error: (err) => {
                    console.log(err);
                },
                complete: (result) => {
                    addNewSaving = false;
                }

            })
        }


    }



    //生成表单列表表头(驳回表单【每个订单的电子券和美通卡用的是同一个表单】)
    function bindFormListHeaderReject(formData) {
        let scrollerWidth = 7.8;
        let str = `<li class="header clearBoth">
        <div class="index floatL">序号</div>`;
        if (formData.formName == 1) {
            str += `<div class="name floatL">姓名</div>`;
            scrollerWidth += 1.5;
        }
        if (formData.formIdCard == 1) {
            str += `<div class="card-id floatL">身份证号</div>`;
            scrollerWidth += 3.2;
        }
        if (formData.formPhone == 1) {
            str += `<div class="phone floatL">手机号</div>`;
            scrollerWidth += 2;
        }
        if (formData.formTicket == 1) {
            str += `<div class="coupon floatL">券码面值/数量</div>`;
            scrollerWidth += 2;
        }
        if (formData.formDate == 1) {
            str += `<div class="date floatL">日期</div>`;
            scrollerWidth += 2;
        }

        str += `<div class="modify-person floatL">提交人</div>
        <div class="last-modify-person floatL">最后修改人</div>
        <div class="time floatL">最后修改时间</div></li>`;

        if (exchangeTypeRejectSearch == 0) {
            $('#wrapper-reject .list').html(str);
            $('#scroller-reject').css({width: scrollerWidth + 'rem'});
        }
        if (exchangeTypeRejectSearch == 1) {
            $('#wrapper-reject-meitong .list').html(str);
            $('#scroller-reject-meitong').css({width: scrollerWidth + 'rem'});
        }


    }


    //点击查询
    //查询input框有内容时，查询按钮可点击(驳回表单--电子券)
    $('#search-reject').on('input', function () {

        if (this.value.length == 0) {
            $('#search-reject-btn')
                .off('tap', searchRejectListDianzi)
                .css({borderColor: '#ccc', color: '#ccc'});

        } else {
            $('#search-reject-btn')
                .css({borderColor: '#3ca9c8', color: '#3ca9c8'})
                .off('tap', searchRejectListDianzi)
                .on('tap', searchRejectListDianzi);

        }
    });

    function searchRejectListDianzi() {
        queryReject = $('#search-reject').val();
        //初始化page，并清空列表
        pageReject = 1;
        $('#wrapper-reject .list').html('');
        if (!dianziPullRefreshingReject) {
            initRejectFormListDianzi();
        }

    }

    //点击查询
    //查询input框有内容时，查询按钮可点击(驳回表单-美通卡)
    $('#search-reject-meitong').on('input', function () {

        if (this.value.length == 0) {
            $('#search-reject-btn-meitong')
                .off('tap')
                .css({borderColor: '#ccc', color: '#ccc'});

        } else {
            $('#search-reject-btn-meitong')
                .css({borderColor: '#3ca9c8', color: '#3ca9c8'})
                .off('tap')
                .on('tap', searchRejectListMeitong);

        }
    });

    function searchRejectListMeitong() {
        queryRejectMeitong = $('#search-reject-meitong').val();
        //初始化page，并清空列表
        pageRejectMeitong = 1;
        $('#wrapper-reject-meitong .list').html('');
        if (!meitongPullRefreshingReject) {
            initRejectFormListMeitong();
        }

    }


    //code（状态码）处理
    function loginAgain(code) {
        if (code == 'TOKEN_INVALID') {
            $('#login').show().siblings().hide();
            window.location.reload();
        }
    }

    //手机号码验证
    function isPoneAvailable(str) {
        let myreg = /^[1][3,4,5,7,8][0-9]{9}$/;
        if (!myreg.test(str)) {
            return false;
        } else {
            return true;
        }
    }

    //身份证号验证
    function isCardNo(card) {
        // 身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X
        let reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        if (reg.test(card) === false) {
            return false;
        } else {
            return true;
        }

    }


});










