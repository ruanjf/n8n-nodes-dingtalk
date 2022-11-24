// This file is auto-generated, don't edit it
import Util from '@alicloud/tea-util';
import dingtalkoauth2_1_0, * as $dingtalkoauth2_1_0 from '@alicloud/dingtalk/dist/oauth2_1_0/client';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import * as $tea from '@alicloud/tea-typescript';


export class Client {

	/**
	 * 使用 Token 初始化账号Client
	 * @return Client
	 * @throws Exception
	 */
	static createClient(): dingtalkoauth2_1_0 {
		const config = new $OpenApi.Config({ });
		config.protocol = "https";
		config.regionId = "central";
		return new dingtalkoauth2_1_0(config);
	}

	static async main(args: string[]): Promise<void> {
		const client = Client.createClient();
		const getAccessTokenRequest = new $dingtalkoauth2_1_0.GetAccessTokenRequest({
			appKey: "dingay9fysadlw2x7cvn",
			appSecret: "EdjsARXaKjsO5RfSmfGqqFgxUGI1eJd3bFclxfCpilN7maMz34-iknKhbGxnaDxc",
		});
		const getAccessTokenResponse = await client.getAccessToken(getAccessTokenRequest);
		console.log(getAccessTokenResponse);

	}

}

Client.main(process.argv.slice(2));
