import {
	IExecuteFunctions
} from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	INodePropertyOptions,
} from 'n8n-workflow';
import crypto from 'crypto';
import axios from 'axios';

// import RobotClient, * as $RobotClient from "@alicloud/dingtalk/dist/robot_1_0/client";
// import * as OpenApi from "@alicloud/openapi-client";
// import * as Util from "@alicloud/tea-util";

export class DingTalkRobot implements INodeType {
	description: INodeTypeDescription = {
		displayName: '钉钉机器人',
		name: 'dingTalkRobot',
		icon: 'file:dingtalk.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["msgtype"]}}',
		description: '钉钉机器人API',
		defaults: {
			name: '钉钉机器人',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'dingtalk',
				required: true,
				displayOptions: {
					show: {
						type: ['dingtalk'],
					},
				},
			},
			{
				name: 'dingTalkCustomRobot',
				required: true,
				displayOptions: {
					show: {
						type: ['customRobot'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				required: true,
				noDataExpression: true,
				options: [
					{
						name: '自定义机器人',
						value: 'customRobot',
						description: '自定义机器人存在限流, 每分钟20次',
						action: '自定义机器人',
					},
					{
						name: '企业内部开发机器人',
						value: 'companyInternalRobot',
						description: '企业内部开发机器人',
						action: '企业内部开发机器人',
					},
				],
				default: 'customRobot',
			},
			{
				displayName: '消息类型',
				name: 'msgtype',
				type: 'options',
				required: true,
				options: [
					{
						name: 'text类型',
						value: 'text',
						description: 'text类型',
					},
					{
						name: 'link类型',
						value: 'link',
						description: 'link类型',
					},
					{
						name: 'markdown类型',
						value: 'markdown',
						description: 'markdown类型',
					},
					{
						name: 'ActionCard类型',
						value: 'actionCard',
						description: 'ActionCard类型',
					},
					{
						name: 'FeedCard类型',
						value: 'feedCard',
						description: 'FeedCard类型',
					},
				],
				default: 'text',
			},
			{
				displayName: '被@人的手机号',
				name: 'atMobiles',
				type: 'string',
				default: null,
				required: false,
				description: '被@人的手机号',
				displayOptions: {
					show: {
						type: ['customRobot'],
						msgtype: ['text', 'markdown'],
					},
				},
			},
			{
				displayName: '被@人的用户userid',
				name: 'atUserIds',
				type: 'string',
				default: null,
				required: false,
				description: '被@人的用户userid',
				displayOptions: {
					show: {
						type: ['customRobot'],
						msgtype: ['text', 'markdown'],
					},
				},
			},
			{
				displayName: '是否@所有人',
				name: 'isAtAll',
				type: 'boolean',
				default: false,
				required: false,
				placeholder: '',
				description: '是否@所有人',
				displayOptions: {
					show: {
						type: ['customRobot'],
						msgtype: ['text', 'markdown'],
					},
				},
			},
			{
				displayName: '消息内容',
				name: 'content',
				type: 'json',
				default: '',
				required: true,
				placeholder: '',
				description: '消息内容',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						type: ['customRobot'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const type = this.getNodeParameter('type', 0)
		if (type === 'customRobot') {
			const credentials = await this.getCredentials('dingTalkCustomRobot');

			const timestamp = Date.parse(new Date().toString());
			const stringToSign = `${timestamp}\n${credentials.webhookSign}`;
			const signBase64 = crypto.createHmac('sha256', credentials.webhookSign as string).update(stringToSign).digest("base64");
			const sign = encodeURIComponent(signBase64);
			const url = credentials.webhookSign ? `${credentials.webhookUrl}&timestamp=${timestamp}&sign=${sign}` : credentials.webhookUrl as string

			const result = []
			const items = this.getInputData();
			let item: INodeExecutionData;

			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					item = items[itemIndex];
					const msgtype = this.getNodeParameter('msgtype', itemIndex) as string
					const content = this.getNodeParameter('content', itemIndex) as any

					const data = { msgtype } as any

					if ('text' === msgtype || 'markdown' === msgtype) {
						const atMobiles = this.getNodeParameter('atMobiles', itemIndex) as string[]
						const atUserIds = this.getNodeParameter('atUserIds', itemIndex) as string[]
						const isAtAll = this.getNodeParameter('isAtAll', itemIndex)
						data.at = { isAtAll };
						if (atMobiles && atMobiles.length > 0) {
							data.at.atMobiles = atMobiles
						}
						if (atUserIds && atUserIds.length > 0) {
							data.at.atUserIds = atUserIds
						}

						if ('text' === msgtype) {
							data.text = content;
						} else if ('markdown' === msgtype) {
							data.markdown = content
						}
					} else if ('link' === msgtype) {
						data.link = content
					} else if ('actionCard' === msgtype) {
						data.actionCard = content
					} else if ('feedCard' === msgtype) {
						data.feedCard = content
					}

					const res = await axios.post(url, data, {
						headers: {
							'Content-Type': 'application/json'
						}
					})
					result.push({ json: res.data })
				} catch (error) {
					if (this.continueOnFail()) {
						result.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
					} else {
						if (error.context) {
							error.context.itemIndex = itemIndex;
							throw error;
						}
						throw new NodeOperationError(this.getNode(), error, {
							itemIndex,
						});
					}
				}
			}

			return this.prepareOutputData(result);
		}

		// // 创建客户端
		// const rbClient = new RobotClient(new OpenApi.Config({
		// 	endpoint: "your endpoint",
		// 	accessKeyId: "your access key id",
		// 	accessKeySecret: "your access key secret",
		// 	type: "access_key",
		// 	regionId: "cn-hangzhou"
		// }));
		// // 初始化 runtimeObject
		// const runtimeObject = new Util.RuntimeOptions({});


		return this.prepareOutputData([]);
	}
}
