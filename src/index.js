/**
 * 支付宝 apiClient
 */

import moment from "moment";
import ramda from "ramda";
import qs from "qs";
import lodash from "lodash";
import crypto from "crypto";

const is = {
    object: (obj) => obj && !Array.isArray(obj) && typeof obj === "object"
};

const isPublicKey(str) => /^-----BEGIN PUBLIC KEY-----/.test(str) && /-----END PUBLIC KEY-----$/.test(str),
    isPrivateKey = (str) => /^-----BEGIN RSA PRIVATE KEY-----/.test(str) && /-----END RSA PRIVATE KEY-----$/.test(str);

/**
 * 基类, 提供一些基础方法
 */
class Alipay {

    /**
     * @param  {String} options.appId      应用id
     * @param  {String} options.uri        支付宝网关地址
     * @param  {String} options.publicKey  支付宝公钥
     * @param  {String} options.privateKey 支付宝私钥
     * @param  {Object} options.notifyUri  回调配置
     * @param  {String} signType           前面类型
     * @param  {String} charset            提交字符集
     */
    constructor({
        appId,
        uri,
        publicKey,
        privateKey,
        notifyUri = {},
        signType = "RSA2",
        charset = "utf-8"
    }) {
        if (!isPrivateKey(privatekey)) {
            privatekey = `-----BEGIN RSA PRIVATE KEY-----\n${privatekey}\n-----END RSA PRIVATE KEY-----`;
        }
        if (isPublicKey(publicKey)) {
            publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
        }
        this.appId = appId;
        this.url = uri;
        this.notifyUri = notifyUri;
        this.signType = signType;
        this.publicKey = publicKey;
        this.privatekey = privateKey;
        this.charset = charset;
        this.alipay_sdk = "alipay-rwson";
        this.version = "1.0";
    }

    /**
     * 构造参数
     * @param  {Object} obj 其他参数
     * @return {Object}
     */
    buildParams(obj = {}) {
        return {
            app_id: this.appId,
            charset: this.charset,
            sign_type: this.signType,
            version: this.version,
            ...obj
        };
    }

    /**
     * 签名所需的参数key进行排序并组织进新对象
     * @param  {Object} params 签名所需的参数
     * @return {Object}
     */
    sortParams(params) {
        const keys = Object.keys(params).sort(),
            res = {};
        for (let key of keys) {
            res[key] = params[key];
        }
        return res;
    }

    /**
     * 签名
     * @param  {Object} params     签名所需的参数
     * @param  {String} privatekey 私钥
     * @return {Object}
     */
    sign(params, privatekey) {
        params = this.sortParams(params);
        const sign = crypto.createSign("RSA-SHA256"),
            keys = Object.keys(params);
        let signed = [],
            signRes;
        for (let key of keys) {
            if (is.object(params[key])) {
                signed.push(`${key}=${JSON.stringify(params[key])}`);
            } else {
                signed.push(`${key}=${params[key]}`);
            }
        }

        try {
            signRes = sign.update(signed.join("&")).sign(privatekey, "base64");
            params.sign = signRes;
        } catch (e) {
            params.sign = false;
        }
        return params;
    }

    /**
     * 验证签名
     * @param  {Object} body  支付宝异步通知结果
     * @return {Boolean}
     */
    verifySign(body) {
        const {
            publicKey
        } = this,
        bodyCloned = this.sortParams(lodash.clone(body)),
        verify = crypto.createVerify("RSA-SHA256");
        delete bodyCloned.sign;
        delete bodyCloned.sign_type;

        console.log(bodyCloned);

        try {
            console.log(publicKey);
            return verify.update(sign).verify(publicKey, "base64");
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    /**
     * 构造请求所需参数
     * @param  {Object} params 原数据
     * @return {Object}
     */
    buildRequestData(params) {
        const keys = Object.keys(params);
        let cur;
        for (let key of keys) {
            cur = params[key];
            if (is.object(cur)) {
                params[key] = JSON.stringify(cur);
            }
        }
        return {
            param: qs.stringify(params, {
                encoder: encodeURIComponent
            }),
            bizContent: params.biz_content
        };
    }

    /**
     * 构建扫码支付表单
     * @param  {String} options.url        提交地址
     * @param  {String} options.param      公共参数urlQueryString
     * @param  {Object} options.bizContent 业务参数
     * @return {String}
     */
    buildRequestForm({ url, param, bizContent }) {
        const form = [];
        form.push(`<form id='pay' name='pay' action='${url}?${param}' method='post'>`);
        form.push(`<input type='hidden' name='biz_content' value='${JSON.stringify(bizContent)}' />`);
        form.push("</form>");
        form.push("<script>document.forms['pay'].submit();</script>");
        return form.join("");
    }
}

export default class AliPayClient extends Alipay {
    constructor(argus) {
        super(argus);
    }

    /**
     * 下单并购买
     * @param  {Number} options.outTradeNo  内部订单号
     * @param  {String} options.subject     订单标题
     * @param  {Object} options.body        订单描述
     * @param  {Number} options.productCode 产品编码
     * @param  {Number} options.totalAmount 订单总价
     * @return {Form String}
     */
    pay({
        outTradeNo,
        subject,
        body = "",
        productCode = "FAST_INSTANT_TRADE_PAY",
        totalAmount
    }) {
        const {
            url
        } = this,
        method = "alipay.trade.page.pay",
            bizContent = {
                out_trade_no: outTradeNo,
                product_code: productCode,
                total_amount: totalAmount,
                subject,
                body
            },
            params = this.buildRequestData(this.sign(this.buildParams({
                return_url: this.notifyUri.sync,
                notify_url: this.notifyUri.async,
                biz_content: JSON.stringify(bizContent),
                timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
                method
            }), this.privatekey)),
            form = this.buildRequestForm({
                url: this.url,
                ...params
            });
        return form;
    }
}