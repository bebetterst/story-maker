import React, { useState } from 'react';
import { Modal, Input, Button, Typography, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './index.module.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface StorySegment {
  text: string;
  image_prompt: string;
}

interface StoryConfirmationProps {
  visible: boolean;
  storySegments: StorySegment[];
  onCancel: () => void;
  onConfirm: (segments: StorySegment[]) => void;
}

const StoryConfirmation: React.FC<StoryConfirmationProps> = ({
  visible,
  storySegments,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [editedSegments, setEditedSegments] = useState<StorySegment[]>(storySegments || []);

  // 当storySegments变化时更新editedSegments
  React.useEffect(() => {
    if (storySegments && storySegments.length > 0) {
      setEditedSegments([...storySegments]);
    }
  }, [storySegments]);

  const handleTextChange = (index: number, value: string) => {
    const newSegments = [...editedSegments];
    newSegments[index] = { ...newSegments[index], text: value };
    setEditedSegments(newSegments);
  };

  const handleImagePromptChange = (index: number, value: string) => {
    const newSegments = [...editedSegments];
    newSegments[index] = { ...newSegments[index], image_prompt: value };
    setEditedSegments(newSegments);
  };

  const handleConfirm = () => {
    // 验证所有段落都有内容
    const hasEmptySegment = editedSegments.some(segment => !segment.text.trim() || !segment.image_prompt.trim());
    if (hasEmptySegment) {
      message.error(t('storyConfirmation.emptySegmentError'));
      return;
    }
    onConfirm(editedSegments);
  };

  return (
    <Modal
      title={t('storyConfirmation.title')}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="back" onClick={onCancel}>
          {t('storyConfirmation.cancel')}
        </Button>,
        <Button key="submit" type="primary" onClick={handleConfirm}>
          {t('storyConfirmation.confirm')}
        </Button>,
      ]}
    >
      <div className={styles.confirmationContainer}>
        <Text className={styles.instructions}>
          {t('storyConfirmation.instructions')}
        </Text>
        
        {editedSegments.map((segment, index) => (
          <div key={index} className={styles.segmentContainer}>
            <Title level={5} style={{ marginBottom: '4px', marginTop: '0px' }}>{t('storyConfirmation.segment')} {index + 1}</Title>
            
            <div className={styles.textSection}>
              <Text strong style={{ display: 'block', marginBottom: '2px' }}>{t('storyConfirmation.storyText')}</Text>
              <TextArea
                value={segment.text}
                onChange={(e) => handleTextChange(index, e.target.value)}
                autoSize={{ minRows: 3, maxRows: 6 }}
                className={styles.textArea}
              />
            </div>
            
            <div className={styles.promptSection}>
              <Text strong style={{ display: 'block', marginBottom: '2px' }}>{t('storyConfirmation.imagePrompt')}</Text>
              <TextArea
                value={segment.image_prompt}
                onChange={(e) => handleImagePromptChange(index, e.target.value)}
                autoSize={{ minRows: 2, maxRows: 4 }}
                className={styles.textArea}
              />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default StoryConfirmation;