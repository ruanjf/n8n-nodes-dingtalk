# n8n-nodes-dingtalk

[![NPM badge](https://img.shields.io/npm/v/n8n-nodes-dingtalk.svg)](https://www.npmjs.com/package/n8n-nodes-dingtalk)

For [钉钉](https://dingtalk.com)

## 功能

### 机器人

#### 自定义机器人

[文档](https://open.dingtalk.com/document/group/custom-robot-access)

## 本地安装

1. 启动n8n`npx n8n`

2. 下载插件并开启编译

```shell
$ cd ~/git
$ git clone https://github.com/ruanjf/n8n-nodes-dingtalk.git
$ cd n8n-nodes-dingtalk
$ npm run dev
```

3. 安装本地依赖

```shell
$ cd ~/.n8n/nodes/
$ npm install ../../git/n8n-nodes-dingtalk
```

4. 重启`n8n`

## 示例workflow

导入demo
[test/dingding-workflow-robot.json](https://github.com/ruanjf/n8n-nodes-dingtalk/raw/main/test/dingding-workflow-robot.json)

## License

[MIT](https://github.com/ruanjf/n8n-nodes-dingtalk/blob/main/LICENSE.md)
