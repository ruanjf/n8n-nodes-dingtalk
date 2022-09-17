import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class DingTalkCustomRobot implements ICredentialType {
	name = 'dingTalkCustomRobot';
	displayName = 'DingTalkCustomRobot';
	documentationUrl = '';
	properties: INodeProperties[] = [
		{
			displayName: 'WebhookUrl',
			name: 'webhookUrl',
			type: 'string',
			default: '',
			required: true
		},
		{
			displayName: 'WebhookSign',
			name: 'webhookSign',
			type: 'string',
			default: null,
		},
	];
}
