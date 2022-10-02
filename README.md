# n8n-nodes-dingtalk

[![NPM badge](https://img.shields.io/npm/v/n8n-nodes-dingtalk.svg)](https://www.npmjs.com/package/n8n-nodes-dingtalk)

For [钉钉](https://dingtalk.com)

## 功能

### 机器人

#### 自定义机器人

[文档](https://open.dingtalk.com/document/group/custom-robot-access)

0. JSON格式
<img width="352" alt="image" src="https://user-images.githubusercontent.com/509251/193441704-a109656a-87cc-4597-ba11-d03d968fff40.png">


1. text类型
<img width="357" alt="image" src="https://user-images.githubusercontent.com/509251/193441488-848868b4-fdf4-4f4c-a331-a042af46d9dd.png">

2. link类型
<img width="350" alt="image" src="https://user-images.githubusercontent.com/509251/193441511-4a31d827-ee1b-4f4d-91d7-61373903e7c9.png">

3. markdown类型
<img width="380" alt="image" src="https://user-images.githubusercontent.com/509251/193441552-f47d40cd-061f-4bf8-b2c9-78f662809243.png">

4. 整体跳转ActionCard类型
<img width="360" alt="image" src="https://user-images.githubusercontent.com/509251/193441654-c36e5a81-0321-4043-9688-b648a04521bf.png">

5. 独立跳转ActionCard类型
<img width="357" alt="image" src="https://user-images.githubusercontent.com/509251/193441661-633fda05-464d-4297-b657-4077d0725be0.png">

6. FeedCard类型
<img width="350" alt="image" src="https://user-images.githubusercontent.com/509251/193441683-807cb657-abae-4ac9-9ad1-01616e0fdba0.png">


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
