# alipay-webpay-sdk

支付宝nodejs版网页扫码sdk

#### usage


```bash
npm install alipay-webpay-sdk --save

```

```javascript

import AliPayClient from "alipay-webpay-sdk";

const alipay = new AliPayClient({见实例化参数列表});

```

#### apipay.pay参数列表

| 参数名        | 意义/类型         | 必须           | 默认值 |
|:-------------|:-------------|:------------- |:-------------|
| appId | 应用id/String | 是 | N/A |
| url | 支付宝网关地址/String | 是 | N/A |
| notifyUri | 同异步通知地址, 包含async(异步)和sync(两个属性)/Object | 是 | N/A |
| publicKey | 支付宝公钥/String | 是 | N/A |
| privatekey | 支付宝私钥/String | 是 | N/A |
| signType | 签名类型, RSA类型的还没做支持/String | 否 | RSA2 |
| charset | 提交字符集 | 否 | utf-8 |


#### API

| 方法名        | 意义           |
|:------------- |:-------------|
| `alipay.pay({见apipay.pay参数})`  | 创建网页扫码支付的表单 |
| `alipay.verifySign(支付宝返回的请求主体)` | 验证支付宝签名 |


#### apipay.pay参数列表

| 参数名        | 意义/类型         | 必须           | 默认值 |
|:------------- |:-------------|:------------- |:-------------|
| outTradeNo | 内部订单号, 请求支付宝网页支付之前, 应该自己先生成一个内部订单号/String | 是 | N/A |
| subject | 订单标题/String | 是 | N/A |
| body | 订单描述/String | 否 | "" |
| productCode | 产品编码/String | 否 | FAST_INSTANT_TRADE_PAY |
| totalAmount | 订单总价, 分为单位/Number | 是 | N/A |



