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
        system_prompt = "You are a helpful assistant integrated into a Mind Map application. Keep your answers concise and suitable for insertion into a mind map node."
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
