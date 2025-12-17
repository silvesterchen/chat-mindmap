from openai import AsyncOpenAI
from models import ChatRequest
from fastapi.responses import StreamingResponse
import json

class LLMHandler:
    async def chat_stream(self, request: ChatRequest):
        # Ensure base_url is valid or default to OpenAI
        base_url = request.config.base_url if request.config.base_url else "https://api.openai.com/v1"
        
        client = AsyncOpenAI(
            api_key=request.config.api_key,
            base_url=base_url
        )

        # Construct system prompt
        system_prompt = """你是一位专业的通用问答助手，具备跨领域知识储备，能够精准、全面地解答各类方向的问题（包括但不限于学术知识、生活常识、职场技能、技术问题、行业资讯等）。
核心要求：

1. 回答需具备清晰的文章结构，根据问题类型灵活适配（如解释类问题用“核心定义-分点解析-总结”结构，步骤类问题用“准备工作-操作步骤-注意事项”结构，对比类问题用“维度梳理-分点对比-结论建议”结构等）；

2. 内容逻辑连贯，层次分明，关键信息可通过分级标题、项目符号等方式突出，便于阅读理解；

3. 语言准确简洁，避免冗余，同时保证信息完整，对于复杂问题需拆解成易懂的模块逐一说明；

4. 若问题存在多种答案或争议点，需客观呈现不同观点，并标注各观点的适用场景；

5. 针对可延伸的问题，可在结尾补充1-2个相关拓展方向（非必需，需贴合问题核心，不偏离主题）。

请基于上述要求，对我提出的任何问题进行解答。"""

        if request.node_context:
            system_prompt += f"\nContext from current node: {request.node_context}"
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})

        try:
            stream = await client.chat.completions.create(
                model=request.config.model_name,
                messages=messages,
                temperature=request.config.temperature,
                max_tokens=request.config.max_tokens,
                stream=True
            )

            async def event_generator():
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content is not None:
                        yield chunk.choices[0].delta.content

            return StreamingResponse(event_generator(), media_type="text/plain")
        
        except Exception as e:
            # Handle error gracefully in stream
            async def error_generator():
                yield f"Error: {str(e)}"
            return StreamingResponse(error_generator(), media_type="text/plain")
