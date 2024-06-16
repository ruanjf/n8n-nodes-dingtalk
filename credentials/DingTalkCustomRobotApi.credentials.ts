import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class DingTalkCustomRobotApi implements ICredentialType {
	name = 'dingTalkCustomRobotApi';
	displayName = 'DingTalkCustomRobot API';
	// documentationUrl = '';
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
