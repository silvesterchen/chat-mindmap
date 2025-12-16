# Chat MindMap Tool
🚀 告别线性对话桎梏，开启思维可视化新纪元！

一款画布式的AI对话工具，支持AI助手对话和上下文记忆。借助本工具可以实现两个agent一问一答帮你梳理思路、调研、头脑风暴。而你只需要帮助agent选择问哪个问题。

> ✨ 模仿flowith交互方式开发，MacOS/Windows双系统适配（Windows已优化启动体验）

<img width="1702" height="807" alt="image" src="https://github.com/user-attachments/assets/304f8f18-6257-4dbb-86de-3571cfbedf71" />
演示视频：https://www.bilibili.com/video/BV1YGqhBKEf6/?vd_source=724965bec351ba7062c785c9203557e1

## 🎯 核心价值：为什么选择Chat MindMap？
- 🧠 **网状思维可视化**：逻辑关联一眼看透，告别对话刷屏找重点～
- 💡 **节点串联发散灵感**：复杂逻辑直观呈现，比线性对话更懂你的思考节奏！
- 🎨 **画布式逻辑拆解**：主题关联一键搭建，思维不设限，梳理更高效～

## 📌 适用场景
✅ 项目规划 - 需求拆解，任务分配，进度把控  
✅ 学习笔记 - 知识梳理，概念关联，复习高效  
✅ 头脑风暴 - 创意发散，方案对比，决策清晰  
✅ 问题分析 - 根因追溯，解决方案，风险评估  

## 🔧 核心功能
- 思维导图编辑（双击编辑、字体调整、节点缩放、一键布局优化）
- AI助手对话（打断功能、5轮上下文记忆、可定制智能建议）
- LLM模型配置（多配置保存/切换，满足不同场景需求）
- 对话历史持久化（按导图隔离，保存至文件，灵感永不丢失）
- 文件管理（创建/重命名/删除导图/文件夹，管理一目了然）
  
- 后续添加场景模板（项目规划/学习笔记预设模板，开箱即用） <!-- 若已开发模板可保留，未开发可注释此句 -->

## 📂 项目结构
- 后端: /chat_mindmap/backend (FastAPI)
- 前端: /chat_mindmap/frontend (React/Vite)

## 📋 前置条件
- 安装Python 3.8+
- 安装Node.js 16+
- 安装npm 8+

## ⚡ 启动步骤（1分钟上手）
### 方式一：一键启动（推荐）

1. 打开终端，进入项目根目录:

   ```bash
   cd chat_mindmap
   
   ```
2. 运行启动脚本:

   ```bash
   macos使用：
   chmod +x start.sh
   ./start.sh
   
   windwos使用：
   start.bat
   
   ```
3. 程序将自动安装依赖，自动启动后端和前端服务，按 `Ctrl+C` 可同时关闭。

### 方式二：手动启动

1. 启动后端服务
   1. 打开终端，进入后端目录:

   ```bash
   cd /chat_mindmap/backend
   
   ```
   2. 创建并激活虚拟环境（可选但推荐）:

   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   # 或 venv\Scripts\activate  # Windows
   
   ```
   3. 安装后端依赖:

   ```bash
   pip install -r requirements.txt
   
   ```
   4. 启动FastAPI服务器:
   
   ```bash
   python main.py
      
   ```
   
   - 服务器默认运行在 [http://0.0.0.0:8000](http://0.0.0.0:8000)
   - 若端口8000被占用，可杀死占用进程（参考常见问题）后重新启动

2. 启动前端服务
   1. 打开新终端，进入前端目录:

   ```bash
   cd /chat_mindmap/frontend
   
   ```
   2. 安装前端依赖:

   ```bash
   npm install
   
   ```
   3. 启动Vite开发服务器:

   ```bash
   npm run dev
   
   ```
   - 服务器默认运行在 [http://localhost:3000](http://localhost:3000)

3. 访问程序
在浏览器中输入 http://localhost:3000 即可体验！

## ❓ 常见问题（速查）
| 问题现象 | 解决方案 |
|----------|----------|
| 后端8000端口被占用 | lsof -ti:8000 查看进程ID → kill -9 进程ID（macOS/Linux）；<br>Windows：netstat -ano | findstr :8000 查看PID → taskkill /F /PID 进程ID |
| 前端依赖安装失败 | rm -rf node_modules package-lock.json（macOS/Linux）/<br>rd /s /q node_modules package-lock.json（Windows）→ 重新执行 npm install |
| Vite命令未找到 | 确认Node.js/npm已安装 → 重新执行 npm install 安装依赖 |
| Windows启动脚本无响应 | 右键点击 start.bat → 选择「以管理员身份运行」 |

## 🎬 用户案例（欢迎投稿！）
> 点击[Issues](https://github.com/silvesterchen/chat-mindmap/issues)分享你的使用场景（格式：场景+效果，如“学习场景：用工具梳理机器学习知识点，复习效率提升50%”），优质案例将展示在这里～
- 案例1：@XXX - 用Chat MindMap梳理考研政治章节逻辑，30分钟关联5个核心考点，复习时无需反复翻书
- 案例2：@XXX - 双Agent协作拆解产品需求，1小时完成“用户登录模块”的流程梳理，避免需求遗漏

## 🤝 共建计划
如果你熟悉FastAPI/React技术栈，或有新功能想法，欢迎提交PR（Pull Request）参与开发！  
当前待开发优先级功能：
1. 导图导出为PNG/PDF格式（高频需求）
2. 云端同步功能（多设备数据互通）
3. 更多LLM模型适配（扩展使用场景）

成功合并PR的贡献者，将在下方「贡献者」区署名，并获得「定制化功能优先开发权」（你的需求将优先排期实现）！

### 贡献者
- [silvesterchen](https://github.com/silvesterchen)（项目发起人）
- （期待你的名字在这里！）

## 📞 反馈与交流
- 功能建议/BUG反馈：提交[Issues](https://github.com/silvesterchen/chat-mindmap/issues)
- 使用疑问：在Issues留言或评论区交流，24小时内回复～
