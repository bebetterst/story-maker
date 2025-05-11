from fastapi import APIRouter, HTTPException, Query
from loguru import logger
from app.services.video import generate_video, create_video_with_scenes, generate_voice
from app.schemas.video import VideoGenerateRequest, VideoGenerateResponse, StoryScene
import os
import json
import time
from app.utils.utils import extract_id, task_dir

router = APIRouter()

@router.post("/generate")
async def generate_video_endpoint(
    request: VideoGenerateRequest
):
    """生成视频"""
    try:
        video_file = await generate_video(request)
        task_id = extract_id(video_file)
        # 转换为相对路径
        video_url = "http://127.0.0.1:8000/tasks/" + task_id + "/video.mp4"
        return VideoGenerateResponse(
            success=True,
            data={"video_url": video_url}
        )
    except Exception as e:
        logger.error(f"Failed to generate video: {str(e)}")
        return VideoGenerateResponse(
            success=False,
            message=str(e)
        )

@router.get("/history")
async def get_video_history():
    """获取历史视频列表，按生成时间倒序排列"""
    try:
        # 获取任务目录
        tasks_dir = task_dir()
        video_list = []
        
        # 遍历任务目录
        if os.path.exists(tasks_dir):
            for task_id in os.listdir(tasks_dir):
                task_path = os.path.join(tasks_dir, task_id)
                video_path = os.path.join(task_path, "video.mp4")
                story_path = os.path.join(task_path, "story.json")
                
                # 只添加已生成MP4文件的任务
                if os.path.isdir(task_path) and os.path.exists(video_path):
                    # 获取视频创建时间
                    created_time = os.path.getctime(video_path)
                    
                    # 获取故事信息
                    story_info = {}
                    if os.path.exists(story_path):
                        try:
                            with open(story_path, "r", encoding="utf-8") as f:
                                story_info = json.load(f)
                        except Exception as e:
                            logger.error(f"Failed to load story info: {str(e)}")
                    
                    # 构建视频信息
                    video_info = {
                        "task_id": task_id,
                        "video_url": f"http://127.0.0.1:8000/tasks/{task_id}/video.mp4",
                        "created_time": created_time,
                        "created_time_str": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(created_time)),
                        "story_prompt": story_info.get("story_prompt", ""),
                        "custom_mode": story_info.get("custom_mode", False)
                    }
                    video_list.append(video_info)
        
        # 按创建时间倒序排序
        video_list.sort(key=lambda x: x["created_time"], reverse=True)
        
        return VideoGenerateResponse(
            success=True,
            data={"videos": video_list}
        )
    except Exception as e:
        logger.error(f"Failed to get video history: {str(e)}")
        return VideoGenerateResponse(
            success=False,
            message=str(e)
        )


