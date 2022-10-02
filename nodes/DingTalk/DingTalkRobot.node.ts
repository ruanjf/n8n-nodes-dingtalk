import {
	IExecuteFunctions
} from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodeParameters,
	NodeOperationError,
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
					// {
					// 	name: '企业内部开发机器人',
					// 	value: 'companyInternalRobot',
					// 	description: '企业内部开发机器人',
					// 	action: '企业内部开发机器人',
					// },
				],
				default: 'customRobot',
			},
			{
				displayName: '是否使用JSON格式数据模式',
				name: 'enableJsonMode',
				type: 'boolean',
				default: false,
				required: true,
				placeholder: 'JSON格式数据模式下自行构建数据结构',
				description: '是否使用JSON格式数据模式',
				displayOptions: {
					show: {
						type: ['customRobot'],
					},
				},
			},
			{
				displayName: '数据内容',
				name: 'json',
				type: 'json',
				default: '',
				required: true,
				description: '数据内容',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [true],
					},
				},
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
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
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
						enableJsonMode: [false],
						msgtype: ['text', 'markdown'],
					},
				},
			},
			{
				displayName: '被@人的手机号',
				name: 'atMobiles',
				type: 'string',
				default: '',
				required: false,
				description: '被@人的手机号',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['text', 'markdown'],
						isAtAll: [false],
					},
				},
			},
			{
				displayName: '被@人的用户userid',
				name: 'atUserIds',
				type: 'string',
				default: '',
				required: false,
				description: '被@人的用户userid',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['text', 'markdown'],
						isAtAll: [false],
					},
				},
			},
			{
				displayName: '消息内容',
				name: 'content',
				type: 'string',
				default: '',
				required: true,
				placeholder: '',
				description: '消息内容',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						enableJsonMode: [false],
						type: ['customRobot'],
						msgtype: ['text'],
					},
				},
			},
			{
				displayName: '消息标题',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				description: '首屏会话透出的展示内容',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['markdown','actionCard'],
					},
				},
			},
			{
				displayName: 'markdown格式的消息',
				name: 'markdownText',
				type: 'string',
				default: '',
				required: true,
				description: 'markdown格式的消息。',
				placeholder: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['markdown','actionCard'],
					},
				},
			},
			{
				displayName: '消息标题',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				description: '消息标题',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['link'],
					},
				},
			},
			{
				displayName: '是否单个按钮',
				name: 'isSingleButton',
				type: 'boolean',
				default: true,
				required: true,
				placeholder: '',
				description: '是否单个按钮',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['actionCard'],
					},
				},
			},
			{
				displayName: '单个按钮的标题',
				name: 'singleTitle',
				type: 'string',
				default: '',
				required: true,
				description: '单个按钮的标题',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['actionCard'],
						isSingleButton: [true],
					},
				},
			},
			{
				displayName: '点击消息跳转的URL',
				name: 'singleURL',
				type: 'string',
				default: '',
				required: true,
				description: '点击消息跳转的URL，打开方式如下：\n移动端，在钉钉客户端内打开\nPC端 默认侧边栏打开、希望在外部浏览器打开',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['actionCard'],
						isSingleButton: [true],
					},
				},
			},
			{
				displayName: '点击消息跳转的URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: '点击消息跳转的URL，打开方式如下：\n移动端，在钉钉客户端内打开\nPC端 默认侧边栏打开、希望在外部浏览器打开',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['link'],
					},
				},
			},
			{
				displayName: '图片URL',
				name: 'picUrl',
				type: 'string',
				default: '',
				required: false,
				description: '图片URL',
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['link'],
					},
				},
			},
			{
				displayName: '消息内容',
				name: 'text',
				type: 'string',
				default: '',
				required: true,
				description: '消息内容。如果太长只会部分展示。',
				placeholder: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['link'],
					},
				},
			},
			{
				displayName: '按钮集合',
				name: 'btns',
				description: '按钮集合',
				placeholder: '添加按钮',
				required: true,
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['actionCard'],
						isSingleButton: [false],
					},
				},
				default: {},
				options: [
					{
						name: 'buttons',
						displayName: '按钮',
						values: [
							{
								displayName: '按钮标题',
								name: 'title',
								type: 'string',
								default: '',
								description: '按钮的标题',
							},
							{
								displayName: '按钮跳转URL',
								name: 'actionURL',
								type: 'string',
								default: '',
								description: '点击消息跳转的URL',
							},
						],
					},
				],
			},
			{
				displayName: '排列方式',
				name: 'btnOrientation',
				type: 'options',
				default: '0',
				required: false,
				description: '排列方式',
				options: [
					{
						name: '按钮竖直排列',
						value: '0',
					},
					{
						name: '按钮横向排列',
						value: '1',
					},
				],
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['actionCard'],
					},
				},
			},
			{
				displayName: '链接集合',
				name: 'lks',
				required: true,
				description: '链接集合',
				placeholder: '添加链接',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['feedCard'],
					},
				},
				default: {},
				options: [
					{
						name: 'links',
						displayName: '链接',
						values: [
							{
								displayName: '链接标题',
								name: 'title',
								type: 'string',
								default: '',
								description: '单条信息文本',
							},
							{
								displayName: '链接URL',
								name: 'messageURL',
								type: 'string',
								default: '',
								description: '点击单条信息到跳转链接',
							},
							{
								displayName: '链接图片URL',
								name: 'picURL',
								type: 'string',
								default: '',
								description: '单条信息后面图片的URL',
							},
						],
					},
				],
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

			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					// let item = items[itemIndex] as INodeExecutionData;
					const enableJsonMode = this.getNodeParameter('enableJsonMode', itemIndex) as boolean
					const msgtype = enableJsonMode ? null : this.getNodeParameter('msgtype', itemIndex) as string
					const data = { msgtype } as any

					if (enableJsonMode) {
						const json = this.getNodeParameter('json', itemIndex) as object
						Object.assign(data, json)

					} else if ('text' === msgtype || 'markdown' === msgtype) {
						const isAtAll = this.getNodeParameter('isAtAll', itemIndex)
						const atMobiles = isAtAll ? null : this.getNodeParameter('atMobiles', itemIndex) as string[]
						const atUserIds = isAtAll ? null : this.getNodeParameter('atUserIds', itemIndex) as string[]
						data.at = { isAtAll };
						if (atMobiles && atMobiles.length > 0) {
							data.at.atMobiles = atMobiles
						}
						if (atUserIds && atUserIds.length > 0) {
							data.at.atUserIds = atUserIds
						}

						if ('text' === msgtype) {
							data.text = {
								"content": this.getNodeParameter('content', itemIndex),
							}
						} else if ('markdown' === msgtype) {
							data.markdown = {
								"title": this.getNodeParameter('title', itemIndex),
								"text": this.getNodeParameter('markdownText', itemIndex),
							}
						}

					} else if ('link' === msgtype) {
						data.link = {
							"text": this.getNodeParameter('text', itemIndex),
							"title": this.getNodeParameter('title', itemIndex),
							"picUrl": this.getNodeParameter('picUrl', itemIndex) || "",
							"messageUrl": this.getNodeParameter('url', itemIndex),
						}

					} else if ('actionCard' === msgtype) {
						data.actionCard = {
							"title": this.getNodeParameter('title', itemIndex),
							"text": this.getNodeParameter('markdownText', itemIndex),
						}
						const btnOrientation = this.getNodeParameter('btnOrientation', itemIndex)
						if (btnOrientation) {
							data.actionCard.btnOrientation = btnOrientation
						}
						const isSingleButton = this.getNodeParameter('isSingleButton', itemIndex) as boolean
						if (isSingleButton) {
							data.actionCard.singleTitle = this.getNodeParameter('singleTitle', itemIndex)
							data.actionCard.singleURL = this.getNodeParameter('singleURL', itemIndex)
						} else {
							const btns = this.getNodeParameter('btns', itemIndex) as INodeParameters
							data.actionCard.btns = btns.buttons
						}

					} else if ('feedCard' === msgtype) {
						const lks = this.getNodeParameter('lks', itemIndex) as INodeParameters
						data.feedCard = {
							links: lks.links
						}
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
