
export interface VoiceListRes {
    voices: string[];
}

export interface LLMProvidersRes {
    textLLMProviders: string[];
    imageLLMProviders: string[];
}

export interface StorySegment {
    text: string;         // 故事文本内容
    image_prompt: string; // 图像生成提示词
}

export interface StoryGenerateReq {
    text_llm_provider?: string; // Text LLM provider
    text_llm_model?: string; // Text LLM model
    segments: number; // 分段数量 (1-10)
    language?: Language; // 故事语言
    story_prompt?: string; // 故事提示词，测试模式不需要，非测试模式必填
    story_setting?: string; // 故事设定，可选
}

export interface StoryGenerateRes {
    success: boolean;
    data?: {
        segments: StorySegment[];
    };
    message: string | null;
}

export interface VideoGenerateReq {
    text_llm_provider?: string; // Text LLM provider
    image_llm_provider?: string; // Image LLM provider
    text_llm_model?: string; // Text LLM model
    image_llm_model?: string; // Image LLM model
    test_mode?: boolean; // 是否为测试模式
    task_id?: string; // 任务ID，测试模式才需要
    segments: number; // 分段数量 (1-10)
    language?: Language; // 故事语言
    story_prompt?: string; // 故事提示词，测试模式不需要，非测试模式必填
    image_style?: string; // 图片风格，测试模式不需要，非测试模式必填
    voice_name: string; // 语音名称，需要和语言匹配
    voice_rate: number; // 语音速率，默认写1
    story_segments?: StorySegment[]; // 故事段落，从StoryConfirmation组件获取
}

// 假设 Language 和 ImageStyle 是其他接口或枚举
export type Language = "zh-CN" | "zh-TW" |  "en-US" | "ja-JP" | "ko-KR";

export interface VideoGenerateRes {
    success: boolean;
    data?: {
        video_url: string; // 视频 URL
    };
    message: string | null;
}