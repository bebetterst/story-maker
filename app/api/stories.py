from logging import Logger
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..schemas.story import Story, StoryCreate, StoryUpdate
from ..services.story import story_service
from loguru import logger

router = APIRouter()

class StorySegment(BaseModel):
    text: str
    image_prompt: str

class StoryGenerateResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class StoryGenerateRequest(BaseModel):
    text_llm_provider: Optional[str] = None
    image_llm_provider: Optional[str] = None
    text_llm_model: Optional[str] = None
    image_llm_model: Optional[str] = None
    resolution: Optional[str] = None
    test_mode: Optional[bool] = False
    task_id: Optional[str] = None
    segments: int
    language: Optional[str] = None
    story_prompt: Optional[str] = None
    story_setting: Optional[str] = None
    image_style: Optional[str] = None
    voice_name: str
    voice_rate: Optional[float] = 1.0


@router.post("/generate", response_model=StoryGenerateResponse)
async def generate_story(request: StoryGenerateRequest = Body(...)):
    """
    生成故事及其图像提示词
    """
    try:
        # 调用LLM服务生成故事
        from ..services.llm import llm_service
        from ..schemas.llm import StoryGenerationRequest
        from ..models.const import Language
        
        # 转换请求格式
        llm_request = StoryGenerationRequest(
            story_prompt=request.story_prompt,
            language=request.language or Language.CHINESE_CN,
            segments=request.segments,
            story_setting=request.story_setting,
            text_llm_provider=request.text_llm_provider,
            image_llm_provider=request.image_llm_provider,
            text_llm_model=request.text_llm_model,
            image_llm_model=request.image_llm_model,
            resolution=request.resolution
        )
        
        # 调用LLM服务生成故事
        segments = await llm_service.generate_story(llm_request)
        logger.info(f"Generated story segments: {segments}")
        return StoryGenerateResponse(
            success=True,
            message="故事生成成功",
            data={
                "segments": segments
            }
        )
    except Exception as e:
        return StoryGenerateResponse(
            success=False,
            message=f"故事生成失败: {str(e)}"
        )

@router.get("/", response_model=List[Story])
async def list_stories(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """
    获取故事列表
    """
    return story_service.get_stories(skip=skip, limit=limit)


@router.post("/", response_model=Story)
async def create_story(story: StoryCreate):
    """
    创建新故事
    """
    return story_service.create_story(story)


@router.get("/{story_id}", response_model=Story)
async def get_story(story_id: str):
    """
    获取特定故事的详细信息
    """
    story = story_service.get_story(story_id)
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@router.put("/{story_id}", response_model=Story)
async def update_story(story_id: str, story: StoryUpdate):
    """
    更新故事信息
    """
    updated_story = story_service.update_story(story_id, story)
    if updated_story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return updated_story


@router.delete("/{story_id}")
async def delete_story(story_id: str):
    """
    删除故事
    """
    if not story_service.delete_story(story_id):
        raise HTTPException(status_code=404, detail="Story not found")
    return {"message": "Story deleted successfully"}
