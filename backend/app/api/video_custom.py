from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
import os
import uuid
import shutil
from loguru import logger
from app.services.video import create_video_with_scenes, generate_voice
from app.schemas.video import VideoGenerateResponse, StoryScene
from app.utils.utils import extract_id, task_dir

router = APIRouter()

@router.post("/generate_custom")
async def generate_custom_video(
    segments: int = Form(...),
    voice_name: str = Form(...),
    voice_rate: float = Form(1.0),
    custom_mode: bool = Form(True),
    story_prompt: str = Form(""),
    segment_images: List[UploadFile] = File(None),
    segment_texts: List[str] = Form(None)
):
    """生成自定义故事视频"""
    try:
        # 创建任务ID和目录
        task_id = str(uuid.uuid4())
        current_task_dir = os.path.join(task_dir(), task_id)
        os.makedirs(current_task_dir, exist_ok=True)
        
        # 处理上传的图片和文本
        story_scenes = []
        
        # 检查是否提供了足够的图片和文本
        if len(segment_images) < segments or len(segment_texts) < segments:
            raise HTTPException(status_code=400, detail="未提供足够的图片或文本")
        
        # 保存图片并创建场景
        for i in range(segments):
            # 保存图片
            image_file = os.path.join(current_task_dir, f"{i+1}.png")
            with open(image_file, "wb") as buffer:
                shutil.copyfileobj(segment_images[i].file, buffer)
            
            # 创建场景对象
            scene = StoryScene(
                text=segment_texts[i],
                image_prompt="",  # 自定义模式不需要图片提示词
                url=image_file
            )
            story_scenes.append(scene)
        
        # 保存故事信息
        story_info = {
            "custom_mode": True,
            "segments": segments,
            "voice_name": voice_name,
            "voice_rate": voice_rate,
            "story_prompt": story_prompt
        }
        
        # 将故事信息保存到文件
        import json
        with open(os.path.join(current_task_dir, "story.json"), "w", encoding="utf-8") as f:
            json.dump(story_info, f, ensure_ascii=False, indent=2)
        
        # 生成视频
        video_file = await create_video_with_scenes(
            current_task_dir,
            story_scenes,
            voice_name,
            voice_rate,
            False  # 不是测试模式
        )
        
        # 返回视频URL
        video_url = f"http://127.0.0.1:8000/tasks/{task_id}/video.mp4"
        return VideoGenerateResponse(
            success=True,
            data={"video_url": video_url}
        )
    except Exception as e:
        logger.error(f"Failed to generate custom video: {str(e)}")
        return VideoGenerateResponse(
            success=False,
            message=str(e)
        )