export interface StorySegment {
  text: string;         // 故事文本内容
  image_prompt: string; // 图像生成提示词
}

export interface StoryConfirmationProps {
  visible: boolean;                      // 对话框是否可见
  storySegments: StorySegment[];         // 故事段落数据
  onCancel: () => void;                  // 取消回调
  onConfirm: (segments: StorySegment[]) => void; // 确认回调
}