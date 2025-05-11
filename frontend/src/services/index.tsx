import { request } from "../utils/request";

// 定义接口类型
interface VoiceListRes {
  voices: Array<{
    name: string;
    locale: string;
    gender?: string;
    [key: string]: any;
  }>;
}

interface LLMProvidersRes {
  providers: Array<{
    name: string;
    models: string[];
    [key: string]: any;
  }>;
}

interface StoryGenerateReq {
  prompt: string;
  llm_provider?: string;
  llm_model?: string;
  [key: string]: any;
}

interface StoryGenerateRes {
  story: string;
  segments?: string[];
  [key: string]: any;
}

interface VideoGenerateReq {
  story: string;
  voice_name?: string;
  voice_rate?: number;
  [key: string]: any;
}

interface VideoGenerateRes {
  video_url: string;
  [key: string]: any;
}

export async function getVoiceList(data: {area: string[]}): Promise<VoiceListRes> {
    return request<VoiceListRes>({
        url: "/api/voice/voices",
        method: "post",
        data,
    });
}

export async function getLLMProviders(): Promise<LLMProvidersRes> {
    return request<LLMProvidersRes>({
        url: "/api/llm/providers",
        method: "get",
    });
}

export async function generateStory(data: StoryGenerateReq): Promise<StoryGenerateRes> {
    return request<StoryGenerateRes>({
        url: "/api/story/generate",
        method: "post",
        data,
    });
}

export async function generateVideo(data: VideoGenerateReq): Promise<VideoGenerateRes> {
    return request<VideoGenerateRes>({
        url: "/api/video/generate",
        method: "post",
        data,
    });
}

export async function generateCustomVideo(formData: FormData): Promise<VideoGenerateRes> {
    // 确保custom_mode标记为true
    if (!formData.has('custom_mode')) {
        formData.append('custom_mode', 'true');
    }
    
    // 确保story_prompt存在，这将作为视频标题
    if (!formData.has('story_prompt') || !formData.get('story_prompt')) {
        console.warn('警告: 自定义视频没有设置标题(story_prompt)');
    }
    
    return fetch('http://127.0.0.1:8000/api/video/generate_custom', {
        method: 'POST',
        body: formData,
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}