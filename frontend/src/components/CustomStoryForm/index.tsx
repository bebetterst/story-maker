import React, { useState, CSSProperties } from 'react';
import { Button, Form, Input, Upload, message, Card, Modal, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, EyeOutlined, ImportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { generateCustomVideo } from '../../services/index';
import { useVideoStore } from "../../stores/index";
import styles from './index.module.css';
import type { UploadFile, UploadProps, UploadChangeParam, RcFile } from 'antd/es/upload/interface';

interface CustomStorySegment {
  text: string;
  image: File | null;
  imagePreview?: string;
}

// 定义自定义故事段落的接口
interface CustomStorySegment {
  text: string;
  image: File | null;
  imagePreview?: string;
}

const CustomStoryForm: React.FC = () => {
  const { t } = useTranslation();
  const { setVideoUrl } = useVideoStore();
  const [form] = Form.useForm();
  const [segments, setSegments] = useState<CustomStorySegment[]>([{ text: '', image: null, imagePreview: '' }]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');

  const handleTextChange = (index: number, value: string) => {
    const newSegments = [...segments];
    newSegments[index].text = value;
    setSegments(newSegments);
  };

  const handleImageChange = (info: UploadChangeParam<UploadFile<any>>, index: number) => {
    const { fileList } = info;
    if (fileList.length > 0) {
      const file = fileList[0];
      const newSegments = [...segments];
      newSegments[index].image = file.originFileObj || null;
      
      // 确保有预览URL
      if (file.originFileObj) {
        // 为新上传的文件创建预览URL
        getBase64(file.originFileObj).then(preview => {
          const updatedSegments = [...segments];
          updatedSegments[index].imagePreview = preview;
          setSegments(updatedSegments);
        });
      } else {
        newSegments[index].imagePreview = file.url || file.preview;
        setSegments(newSegments);
      }
    }
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const addSegment = () => {
    setSegments([...segments, { text: '', image: null, imagePreview: '' }]);
  };

  const removeSegment = (index: number) => {
    if (segments.length > 1) {
      const newSegments = [...segments];
      newSegments.splice(index, 1);
      setSegments(newSegments);
    } else {
      message.warning(t('customStory.minimumSegment'));
    }
  };

  const handleCancel = () => setPreviewOpen(false);

  const showImportModal = () => {
    setImportModalVisible(true);
  };

  const handleImportCancel = () => {
    setImportModalVisible(false);
    setMarkdownContent('');
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdownContent(e.target.value);
  };

  const parseMarkdownContent = () => {
    if (!markdownContent.trim()) {
      message.warning(t('customStory.emptyMarkdown') || '请输入Markdown内容');
      return;
    }

    // 使用空行分割段落
    const paragraphs = markdownContent.split(/\n\s*\n/);
    
    if (paragraphs.length === 0) {
      message.warning(t('customStory.invalidMarkdown') || '无效的Markdown内容');
      return;
    }

    // 提取第一段作为标题（如果有#标记则去掉）
    let title = paragraphs[0].replace(/^#+\s*/, '').trim();
    setStoryTitle(title);
    
    // 剩余段落作为故事内容
    const storySegments = paragraphs.slice(1).map(paragraph => ({
      text: paragraph.trim(),
      image: null,
      imagePreview: ''
    }));
    
    // 确保至少有一个段落
    if (storySegments.length === 0) {
      storySegments.push({ text: '', image: null, imagePreview: '' });
    }
    
    setSegments(storySegments);
    setImportModalVisible(false);
    setMarkdownContent('');
    message.success(t('customStory.importSuccess') || '导入成功');
  };

  const onFinish = async () => {
    // 验证标题和所有段落都有文本和图片
    if (!storyTitle.trim()) {
      message.error(t('customStory.titleRequired') || '请输入视频主题');
      return;
    }
    
    const isValid = segments.every((segment, index) => {
      if (!segment.text.trim()) {
        message.error(t('customStory.textRequired', { index: index + 1 }));
        return false;
      }
      if (!segment.image) {
        message.error(t('customStory.imageRequired', { index: index + 1 }));
        return false;
      }
      return true;
    });

    if (!isValid) return;

    setLoading(true);
    message.loading(t('customStory.generating'), 0);

    try {
      // 准备表单数据
      const formData = new FormData();
      
      // 添加基本信息
      formData.append('voice_name', form.getFieldValue('voice_name') || 'zh-CN-XiaoxiaoNeural');
      formData.append('voice_rate', String(form.getFieldValue('voice_rate') || 1.0));
      formData.append('custom_mode', 'true');
      formData.append('story_prompt', storyTitle); // 添加视频主题作为标题
      
      // 添加段落数量
      formData.append('segments', String(segments.length));
      
      // 添加每个段落的文本和图片
      segments.forEach((segment) => {
        formData.append(`segment_texts`, segment.text);
        if (segment.image) {
          formData.append(`segment_images`, segment.image);
        }
      });
      
      // 使用服务函数发送请求
      const result = await generateCustomVideo(formData);
      
      message.destroy();
      
      if (result.success) {
        message.success(t('customStory.success'));
        if (result.data?.video_url) {
          setVideoUrl(result.data.video_url);
        }
      } else {
        throw new Error(result.message || t('customStory.error'));
      }
    } catch (error) {
      message.error(`${t('customStory.error')}: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Generate custom video error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 图片操作按钮的样式

  const actionButtonStyle: CSSProperties = {
    margin: '0 4px',
    color: '#fff',
    fontSize: '16px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '50%',
    padding: '8px',
    cursor: 'pointer',
  };

  return (
    <div className={styles.formDiv}>
      <Form
        form={form}
        name="customStory"
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
        style={{ width: '100%', maxWidth: '1280px', minWidth: '650px', flex: '1 1 auto', overflow: 'auto' }}
        initialValues={{ voice_name: 'zh-CN-XiaoxiaoNeural', voice_rate: 1.0 }}
        autoComplete="off"
        layout="vertical"
        size="small"
      >
        <div style={{ display: 'flex', marginBottom: '16px' }}>
          <Form.Item
            label={t('customStory.storyTitle') || '故事主题'}
            required
            className={styles.titleInput}
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Input 
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder={t('customStory.storyTitlePlaceholder') || '请输入故事主题（将用作历史记录中的标题）'}
            />
          </Form.Item>
          <Button
            type="default"
            icon={<ImportOutlined />}
            onClick={showImportModal}
            style={{ marginLeft: '16px', marginTop: '29px' }}
          >
            {t('customStory.importMarkdown') || '导入Markdown'}
          </Button>
        </div>
        
        {segments.map((segment, index) => (
          <Card 
            key={index} 
            className={styles.segmentCard}
            size="small"
            bordered={true}
          >
            <Row gutter={16} align="top">
              <Col span={16}>
                <Form.Item
                  label={`${t('customStory.text').replace('文本内容', '故事内容')}${index + 1}`}
                  required
                >
                  <Input.TextArea 
                    rows={5} 
                    value={segment.text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    placeholder={t('customStory.textPlaceholder')}
                    style={{ height: '120px', resize: 'vertical', maxHeight: '300px' }}
                  />
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item
                  label={t('customStory.image')}
                  required
                >
                  <div className={styles.imageContainer}>
                    <Upload
                      listType="picture-card"
                      maxCount={1}
                      beforeUpload={() => false}
                      onChange={(info) => handleImageChange(info, index)}
                      onPreview={handlePreview}
                      fileList={segment.image ? [{
                        uid: `-${index}`,
                        name: segment.image.name,
                        status: 'done' as const,
                        url: segment.imagePreview,
                        originFileObj: segment.image as RcFile
                      }] : []}
                      className={styles.imageUpload}
                      showUploadList={false}
                    >
                      {!segment.image ? (
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>{t('customStory.upload')}</div>
                        </div>
                      ) : (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <img 
                            src={segment.imagePreview} 
                            alt="上传图片" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '2px', backgroundColor: '#f0f0f0' }} 
                          />
                          <div className={styles.imageActions}>
                            <Tooltip title="预览">
                              <EyeOutlined style={actionButtonStyle} onClick={(e) => {
                                e.stopPropagation();
                                if (segment.imagePreview) {
                                  setPreviewImage(segment.imagePreview);
                                  setPreviewOpen(true);
                                  setPreviewTitle(`图片 ${index + 1}`);
                                }
                              }} />
                            </Tooltip>
                            <Tooltip title="重新上传">
                              <UploadOutlined style={actionButtonStyle} />
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </Upload>
                  </div>
                </Form.Item>
              </Col>
              <Col span={1} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Tooltip title={segments.length > 1 ? t('customStory.removeSegment') : ''}>
                  <div 
                    className={`${styles.deleteIcon} ${segments.length <= 1 ? 'disabled' : ''}`}
                    onClick={() => segments.length > 1 && removeSegment(index)}
                  >
                    <DeleteOutlined />
                  </div>
                </Tooltip>
              </Col>
            </Row>
          </Card>
        ))}
        
        <div className={styles.buttonGroup}>
          <Button 
            icon={<PlusOutlined />} 
            onClick={addSegment}
            className={styles.addButton}
          >
            {t('customStory.addSegment')}
          </Button>
          
          <Button 
            type="primary" 
            onClick={onFinish}
            loading={loading}
            icon={<UploadOutlined />}
            className={styles.submitButton}
          >
            {t('customStory.submit')}
          </Button>
        </div>
      </Form>
      
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="preview" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', backgroundColor: '#f0f0f0' }} src={previewImage} />
      </Modal>

      <Modal
        open={importModalVisible}
        title={t('customStory.importMarkdownTitle') || 'Markdown导入'}
        onCancel={handleImportCancel}
        onOk={parseMarkdownContent}
        okText={t('customStory.import') || '导入'}
        cancelText={t('customStory.cancel') || '取消'}
        width={700}
      >
        <div style={{ marginBottom: '16px' }}>
          {t('customStory.importMarkdownTip') || '请粘贴Markdown格式的故事内容，第一段将作为标题，后续段落将自动分段。'}
        </div>
        <Input.TextArea
          rows={15}
          value={markdownContent}
          onChange={handleMarkdownChange}
          placeholder={t('customStory.markdownPlaceholder') || '# 故事标题\n\n第一个段落\n\n第二个段落\n\n...'}
          style={{ resize: 'vertical' }}
        />
      </Modal>
    </div>
  );
};

export default CustomStoryForm;