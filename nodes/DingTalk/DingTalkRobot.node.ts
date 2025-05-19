import { IExecuteFunctions } from 'n8n-core';
import {
	IBinaryData,
	INodeExecutionData,
	INodeParameters,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import crypto from 'crypto';
import axios from 'axios';
import Util, * as $Util from '@alicloud/tea-util';
import RobotClient, * as $RobotClient from '@alicloud/dingtalk/dist/robot_1_0/client';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import AuthClient, * as $AuthClient from '@alicloud/dingtalk/dist/oauth2_1_0/client';
import * as $tea from '@alicloud/tea-typescript';
import FormData from 'form-data';
import fs from 'fs'

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
				name: 'dingTalkCustomRobotApi',
				required: true,
				displayOptions: {
					show: {
						type: ['customRobot'],
					},
				},
			},
			{
				name: 'dingTalkCompanyApi',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
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
						// description: '企业内部开发机器人',
						action: '企业内部开发机器人',
					},
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
				// description: '是否使用JSON格式数据模式',
				displayOptions: {
					show: {
						type: ['customRobot', 'companyInternalRobot'],
					},
				},
			},
			{
				displayName: '数据内容',
				name: 'json',
				type: 'json',
				default: '',
				required: true,
				// description: '数据内容',
				displayOptions: {
					show: {
						type: ['customRobot', 'companyInternalRobot'],
						enableJsonMode: [true],
					},
				},
			},
			{
				displayName: '用户集合',
				name: 'userIds',
				required: true,
				// description: '用户集合',
				placeholder: '添加用户',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
					},
				},
				default: {},
				options: [
					{
						name: 'users',
						displayName: '用户',
						values: [
							{
								displayName: '用户电话',
								name: 'mobile',
								type: 'number',
								default: '',
								// description: '用户电话',
							},
						],
					},
				],
			},
			{
				displayName: '消息类型',
				name: 'msgKey',
				type: 'options',
				required: true,
				options: [
					{
						name: 'sampleActionCard2类型',
						value: 'sampleActionCard2',
						description: '竖向两个按钮类型',
					},
					{
						name: 'sampleActionCard3类型',
						value: 'sampleActionCard3',
						description: '竖向三个按钮类型',
					},
					{
						name: 'sampleActionCard4类型',
						value: 'sampleActionCard4',
						description: '竖向四个按钮类型',
					},
					{
						name: 'sampleActionCard5类型',
						value: 'sampleActionCard5',
						description: '竖向五个按钮类型',
					},
					{
						name: 'sampleActionCard6类型',
						value: 'sampleActionCard6',
						description: '横向两个个按钮类型',
					},
					{
						name: 'sampleActionCard类型',
						value: 'sampleActionCard',
						description: '单按钮类型',
					},
					{
						name: 'sampleImageMsg类型',
						value: 'sampleImageMsg',
					},
					{
						name: 'sampleLink类型',
						value: 'sampleLink',
					},
					{
						name: 'sampleMarkdown类型',
						value: 'sampleMarkdown',
					},
					{
						name: 'sampleText类型',
						value: 'sampleText',
					},
					{
						name: 'sampleFile文件类型',
						value: 'sampleFile',
					}
				],
				default: 'sampleText',
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
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
						name: 'ActionCard类型',
						value: 'actionCard',
					},
					{
						name: 'FeedCard类型',
						value: 'feedCard',
					},
					{
						name: 'Link类型',
						value: 'link',
					},
					{
						name: 'Markdown类型',
						value: 'markdown',
					},
					{
						name: 'Text类型',
						value: 'text',
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
				placeholder: '',
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
				description: '被@人的手机号，多个用,隔开',
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
				displayName: '被@人的用户Userid',
				name: 'atUserIds',
				type: 'string',
				default: '',
				description: '被@人的用户userid，多个用,隔开',
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
				displayName: '消息内容',
				name: 'content',
				type: 'string',
				default: '',
				required: true,
				placeholder: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						enableJsonMode: [false],
						type: ['companyInternalRobot'],
						msgKey: ['sampleText'],
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
						msgtype: ['markdown', 'actionCard'],
					},
				},
			},
			{
				displayName: 'Markdown格式的消息',
				name: 'markdownText',
				type: 'string',
				default: '',
				required: true,
				placeholder: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['markdown', 'actionCard'],
					},
				},
			},
			{
				displayName: '消息标题',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['customRobot'],
						enableJsonMode: [false],
						msgtype: ['link'],
					},
				},
			},
			{
				displayName: '消息标题',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: [
							'sampleMarkdown',
							'sampleLink',
							'sampleActionCard',
							'sampleActionCard2',
							'sampleActionCard3',
							'sampleActionCard4',
							'sampleActionCard5',
							'sampleActionCard6',
						],
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
				description:
					'点击消息跳转的URL，打开方式如下：\n移动端，在钉钉客户端内打开\nPC端 默认侧边栏打开、希望在外部浏览器打开',
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
				description:
					'点击消息跳转的URL，打开方式如下：\n移动端，在钉钉客户端内打开\nPC端 默认侧边栏打开、希望在外部浏览器打开',
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard'],
					},
				},
			},
			{
				displayName: '单个按钮的标题',
				name: 'singleTitle',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard'],
					},
				},
			},
			{
				displayName: '点击消息跳转的URL',
				name: 'messageUrl',
				type: 'string',
				default: '',
				required: true,
				description:
					'点击消息跳转的URL，打开方式如下：\n移动端，在钉钉客户端内打开\nPC端 默认侧边栏打开、希望在外部浏览器打开',
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleLink'],
					},
				},
			},
			{
				displayName: '点击消息跳转的URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description:
					'点击消息跳转的URL，打开方式如下：\n移动端，在钉钉客户端内打开\nPC端 默认侧边栏打开、希望在外部浏览器打开',
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
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleLink'],
					},
				},
			},
			{
				displayName: '图片URL',
				name: 'photoURL',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleImageMsg'],
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
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: [
							'sampleMarkdown',
							'sampleLink',
							'sampleActionCard',
							'sampleActionCard2',
							'sampleActionCard3',
							'sampleActionCard4',
							'sampleActionCard5',
							'sampleActionCard6',
						],
					},
				},
			},
			{
				displayName: '按钮1标题',
				name: 'actionTitle1',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: [
							'sampleActionCard2',
							'sampleActionCard3',
							'sampleActionCard4',
							'sampleActionCard5',
						],
					},
				},
			},
			{
				displayName: '按钮2标题',
				name: 'actionTitle2',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: [
							'sampleActionCard2',
							'sampleActionCard3',
							'sampleActionCard4',
							'sampleActionCard5',
						],
					},
				},
			},
			{
				displayName: '按钮3标题',
				name: 'actionTitle3',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard3', 'sampleActionCard4', 'sampleActionCard5'],
					},
				},
			},
			{
				displayName: '按钮4标题',
				name: 'actionTitle4',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard4', 'sampleActionCard5'],
					},
				},
			},
			{
				displayName: '按钮5标题',
				name: 'actionTitle5',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard5'],
					},
				},
			},
			{
				displayName: '按钮1链接',
				name: 'actionURL1',
				type: 'string',
				default: '',
				required: true,
				placeholder: '',
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: [
							'sampleActionCard2',
							'sampleActionCard3',
							'sampleActionCard4',
							'sampleActionCard5',
						],
					},
				},
			},
			{
				displayName: '按钮2链接',
				name: 'actionURL2',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: [
							'sampleActionCard2',
							'sampleActionCard3',
							'sampleActionCard4',
							'sampleActionCard5',
						],
					},
				},
			},
			{
				displayName: '按钮3链接',
				name: 'actionURL3',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard3', 'sampleActionCard4', 'sampleActionCard5'],
					},
				},
			},
			{
				displayName: '按钮4链接',
				name: 'actionURL4',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard4', 'sampleActionCard5'],
					},
				},
			},
			{
				displayName: '按钮5链接',
				name: 'actionURL5',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard5'],
					},
				},
			},
			{
				displayName: '横向按钮1标题',
				name: 'buttonTitle1',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard6'],
					},
				},
			},
			{
				displayName: '横向按钮2标题',
				name: 'buttonTitle2',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard6'],
					},
				},
			},
			{
				displayName: '横向按钮2跳转链接',
				name: 'actionTitle1',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard6'],
					},
				},
			},
			{
				displayName: '横向按钮1跳转链接',
				name: 'buttonUrl1',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleActionCard6'],
					},
				},
			},
			{
				displayName: '按钮集合',
				name: 'btns',
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
			{
				displayName: '文件名称',
				name: 'fileName',
				type: 'string',
				default: '表格.xlsx',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleFile'],
					}
				}
			},
			{
				displayName: '文件类型',
				name: 'fileType',
				type: 'string',
				default: 'xlsx',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleFile'],
					}
				},
				hint: '文件类型，支持xlsx、pdf、zip、rar、doc、docx格式。',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						type: ['companyInternalRobot'],
						enableJsonMode: [false],
						msgKey: ['sampleFile'],
					}
				},
				hint: 'The name of the input binary field containing the file to be uploaded',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const type = this.getNodeParameter('type', 0);
		const items = this.getInputData();
		if (type === 'customRobot') {
			const credentials = await this.getCredentials('dingTalkCustomRobotApi');

			const timestamp = Date.parse(new Date().toString());
			const stringToSign = `${timestamp}\n${credentials.webhookSign}`;
			const signBase64 = crypto
				.createHmac('sha256', credentials.webhookSign as string)
				.update(stringToSign)
				.digest('base64');
			const sign = encodeURIComponent(signBase64);
			const url = credentials.webhookSign
				? `${credentials.webhookUrl}&timestamp=${timestamp}&sign=${sign}`
				: (credentials.webhookUrl as string);
			const result = [];

			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					// let item = items[itemIndex] as INodeExecutionData;
					const enableJsonMode = this.getNodeParameter('enableJsonMode', itemIndex) as boolean;
					const msgtype = enableJsonMode
						? null
						: (this.getNodeParameter('msgtype', itemIndex) as string);
					const data = { msgtype } as any;

					if (enableJsonMode) {
						const json = this.getNodeParameter('json', itemIndex) as object;
						Object.assign(data, json);
					} else if ('text' === msgtype || 'markdown' === msgtype) {
						const isAtAll = this.getNodeParameter('isAtAll', itemIndex);
						const atMobiles = isAtAll
							? null
							: (this.getNodeParameter('atMobiles', itemIndex) as string)?.split(',');
						const atUserIds = isAtAll
							? null
							: (this.getNodeParameter('atUserIds', itemIndex) as string)?.split(',');
						data.at = { isAtAll };
						if (atMobiles && atMobiles.length > 0) {
							data.at.atMobiles = atMobiles;
						}
						if (atUserIds && atUserIds.length > 0) {
							data.at.atUserIds = atUserIds;
						}

						if ('text' === msgtype) {
							data.text = {
								content: this.getNodeParameter('content', itemIndex),
							};
						} else if ('markdown' === msgtype) {
							data.markdown = {
								title: this.getNodeParameter('title', itemIndex),
								text: this.getNodeParameter('markdownText', itemIndex),
							};
						}
					} else if ('link' === msgtype) {
						data.link = {
							text: this.getNodeParameter('text', itemIndex),
							title: this.getNodeParameter('title', itemIndex),
							picUrl: this.getNodeParameter('picUrl', itemIndex) || '',
							messageUrl: this.getNodeParameter('url', itemIndex),
						};
					} else if ('actionCard' === msgtype) {
						data.actionCard = {
							title: this.getNodeParameter('title', itemIndex),
							text: this.getNodeParameter('markdownText', itemIndex),
						};
						const btnOrientation = this.getNodeParameter('btnOrientation', itemIndex);
						if (btnOrientation) {
							data.actionCard.btnOrientation = btnOrientation;
						}
						const isSingleButton = this.getNodeParameter('isSingleButton', itemIndex) as boolean;
						if (isSingleButton) {
							data.actionCard.singleTitle = this.getNodeParameter('singleTitle', itemIndex);
							data.actionCard.singleURL = this.getNodeParameter('singleURL', itemIndex);
						} else {
							const btns = this.getNodeParameter('btns', itemIndex) as INodeParameters;
							data.actionCard.btns = btns.buttons;
						}
					} else if ('feedCard' === msgtype) {
						const lks = this.getNodeParameter('lks', itemIndex) as INodeParameters;
						data.feedCard = {
							links: lks.links,
						};
					}
					console.log(data);
					const res = await axios.post(url, data, {
						headers: {
							'Content-Type': 'application/json',
						},
					});
					result.push({ json: res.data });
				} catch (error) {
					if (this.continueOnFail()) {
						result.push({
							json: this.getInputData(itemIndex)[0].json,
							error,
							pairedItem: itemIndex,
						});
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
		} else if (type === 'companyInternalRobot') {
			const credentials = await this.getCredentials('dingTalkCompanyApi');
			const config = new $OpenApi.Config({});
			config.protocol = credentials.protocol as string;
			config.regionId = credentials.regionId as string;
			const robotClient = new RobotClient(config);
			const oauth2Client = new AuthClient(config);
			const getAccessTokenRequest = new $AuthClient.GetAccessTokenRequest({
				appKey: credentials.accessKeyId,
				appSecret: credentials.accessKeySecret,
			});
			const accessTokenResult = await oauth2Client.getAccessToken(getAccessTokenRequest);
			const token = accessTokenResult?.body?.accessToken;
			const batchSendOTOHeaders = new $RobotClient.BatchSendOTOHeaders({});
			if (!token) {
				throw new NodeOperationError(this.getNode(), 'get token fail');
			}
			const getUserIdByMobileUrl =
				'https://oapi.dingtalk.com/topapi/v2/user/getbymobile?access_token=' + token;
			const result = [];
			const robotCode = credentials.robotCode as string;
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					const enableJsonMode = this.getNodeParameter('enableJsonMode', itemIndex) as boolean;
					const msgKey = enableJsonMode
						? null
						: (this.getNodeParameter('msgKey', itemIndex) as string);
					const data = {} as any;
					batchSendOTOHeaders.xAcsDingtalkAccessToken = token;
					if (enableJsonMode) {
						const json = JSON.parse(this.getNodeParameter('json', itemIndex) as string);
						Object.assign(data, json);
						const batchSendOTORequest = new $RobotClient.BatchSendOTORequest(data);
						await robotClient.batchSendOTOWithOptions(
							batchSendOTORequest,
							batchSendOTOHeaders,
							new $Util.RuntimeOptions({}),
						);
					} else {
						const nodeParameters = JSON.parse(JSON.stringify(this.getNode().parameters));
						const userIds: { users: [] } = nodeParameters?.userIds;
						const userIdList: string[] = [];
						let failUser = [];
						for (let i = 0; i < userIds.users.length; i++) {
							const user: { mobile: any } = userIds.users[i];
							const mobile = user.mobile;
							const res = await axios.post(
								getUserIdByMobileUrl,
								{ mobile: mobile },
								{
									headers: {
										'Content-Type': 'application/json',
									},
								},
							);
							if (res?.data?.errcode !== 0) {
								failUser.push(mobile);
							} else {
								userIdList.push(res?.data?.result?.userid);
							}
						}
						if (failUser && failUser.length > 0) {
							result.push({ json: { failUser: failUser } });
						}
						if (!userIdList || userIdList.length === 0) {
							return this.prepareOutputData(result);
						}

						delete nodeParameters.type;
						delete nodeParameters.enableJsonMode;
						delete nodeParameters.userIds;
						delete nodeParameters.msgKey;
						let sendMsgParams = {} as Record<string, any>;
						// tslint:disable-next-line:forin
						for (const nodeParametersKey in nodeParameters) {
							// @ts-ignore
							sendMsgParams[nodeParametersKey] = this.getNodeParameter(
								nodeParametersKey,
								itemIndex,
							);
						}
						if (msgKey == 'sampleFile') {
							const binaryPropertyName = sendMsgParams.binaryPropertyName;
							// @ts-ignorex
							const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName) as IBinaryData;
							const uploadMediaUrl = 'https://oapi.dingtalk.com/media/upload?access_token=' + token;

							const formData = new FormData();
							formData.append('media', fs.createReadStream(`${binaryData.directory}/${binaryData.fileName}`));
							formData.append('type', 'file');
								const response = await axios.post(uploadMediaUrl, formData, {
								headers: {
									...formData.getHeaders()
								},
							});
							sendMsgParams.mediaId = response.data.media_id;
						}
						let sendParams = {
							robotCode: robotCode,
							msgKey: msgKey,
							userIds: userIdList,
							msgParam: JSON.stringify(sendMsgParams).replace(/\\\\/g, '\\'),
						};
						// console.log(sendParams);
						const batchSendOTORequest = new $RobotClient.BatchSendOTORequest(sendParams);
						const sendRes = await robotClient.batchSendOTOWithOptions(
							batchSendOTORequest,
							batchSendOTOHeaders,
							new $Util.RuntimeOptions({}),
						);
						result.push({ json: sendRes.body });
					}
				} catch (error) {
					if (this.continueOnFail()) {
						result.push({
							json: this.getInputData(itemIndex)[0].json,
							error,
							pairedItem: itemIndex,
						});
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
				return this.prepareOutputData(result as any);
			}

			return this.prepareOutputData([]);
		}

		// {
		// 	robotCode: credentials.robotCode,
		// 	userIds: [
		// 		"16546535415453805"
		// 	],
		// 	msgKey: "sampleMarkdown",
		// 	msgParam: "{\"text\": \"hello text\",\"title\": \"hello title\"}",
		// }

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
