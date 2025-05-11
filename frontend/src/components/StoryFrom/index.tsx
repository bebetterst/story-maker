import React, { useState, useEffect } from 'react';
import type { FormProps } from 'antd';
import { Button, Form, Input, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next'
import { getVoiceList, getLLMProviders, generateVideo, generateStory } from '../../services/index';
import { VOICE_LANGUAGES, VOICE_LANGUAGES_LABELS } from '../../constants';
import type { Language } from '../../interfaces';
import { getSelectVoiceList } from '../../utils/index';
import styles from './index.module.css'
import { useVideoStore } from "../../stores/index";
import StoryConfirmation from '../StoryConfirmation';
import SettingsModal from '../SettingsModal';
import { StorySegment } from '../../components/StoryConfirmation/types';

type FieldType = {
    text_llm_provider?: string; // Text LLM provider
    image_llm_provider?: string; // Image LLM provider
    text_llm_model?: string; // Text LLM model
    image_llm_model?: string; // Image LLM model
    resolution?: string; // 分辨率
    test_mode?: boolean; // 是否为测试模式
    task_id?: string; // 任务ID，测试模式才需要
    segments: number; // 分段数量 (1-10)
    language?: Language; // 故事语言
    story_prompt?: string; // 故事提示词，测试模式不需要，非测试模式必填
    story_setting?: string; // 故事设定，可选
    image_style?: string; // 图片风格，测试模式不需要，非测试模式必填
    voice_name: string; // 语音名称，需要和语言匹配
    voice_rate: number; // 语音速率，默认写1
};


const App: React.FC = () => {
    const { setVideoUrl }  = useVideoStore();
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [allVoiceList, setAllVoiceList] = useState<string[]>([]);
    const [nowVoiceList, setNowVoiceList] = useState<string[]>([]);
    const [llmProviders, setLLMProviders] = useState<{ textLLMProviders: string[], imageLLMProviders: string[] }>({ textLLMProviders: [], imageLLMProviders: [] });
    const [confirmationVisible, setConfirmationVisible] = useState<boolean>(false);
    const [settingsVisible, setSettingsVisible] = useState<boolean>(false);
    const [storySegments, setStorySegments] = useState<StorySegment[]>([]);
    useEffect(() => {
        console.log('useEffect');
        getLLMProviders().then(res => {
            console.log('llmProviders', res);
            setLLMProviders(res);
        }).catch(err => {
            console.log(err);
        })
        getVoiceList({ area: VOICE_LANGUAGES }).then(res => {
            console.log('voiceList', res?.voices);
            if (res?.voices?.length > 0) {
                setAllVoiceList(res?.voices);
                // 设置默认语言和语音名称
                const defaultLanguage = VOICE_LANGUAGES_LABELS[0]?.value as Language;
                const defaultVoiceList = getSelectVoiceList(defaultLanguage, res?.voices);
                form.setFieldsValue({ 
                    language: defaultLanguage,
                    voice_name: defaultVoiceList[0]?.replace('-Female', '').replace('-Male', '') 
                });
                setNowVoiceList(defaultVoiceList);
            }
        }).catch(err => {
            console.log(err);
        })
    }, [form]);
    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        console.log('Success:', values);
        
        // 确保必要的设置参数已经设置，特别是语言和语音名称
        const formValues = form.getFieldsValue();
        const updatedValues = { ...values };
        let needsUpdate = false;
        
        // 检查语言设置
        if (!formValues.language && allVoiceList.length > 0) {
            const defaultLanguage = VOICE_LANGUAGES_LABELS[0]?.value as Language;
            updatedValues.language = defaultLanguage;
            needsUpdate = true;
        }
        
        // 检查语音名称设置
        if (!formValues.voice_name && allVoiceList.length > 0) {
            const language = updatedValues.language || formValues.language;
            const voiceList = getSelectVoiceList(language, allVoiceList);
            if (voiceList.length > 0) {
                updatedValues.voice_name = voiceList[0]?.replace('-Female', '').replace('-Male', '');
                needsUpdate = true;
            }
        }
        
        // 检查LLM提供商和模型设置
        if (!formValues.text_llm_provider && llmProviders.textLLMProviders?.length > 0) {
            updatedValues.text_llm_provider = llmProviders.textLLMProviders[0];
            needsUpdate = true;
        }
        
        if (!formValues.image_llm_provider && llmProviders.imageLLMProviders?.length > 0) {
            updatedValues.image_llm_provider = llmProviders.imageLLMProviders[0];
            needsUpdate = true;
        }
        
        if (!formValues.text_llm_model) {
            updatedValues.text_llm_model = 'deepseek-v3';
            needsUpdate = true;
        }
        
        if (!formValues.image_llm_model) {
            updatedValues.image_llm_model = 'flux-dev';
            needsUpdate = true;
        }
        
        if (!formValues.resolution) {
            updatedValues.resolution = '1024*1024';
            needsUpdate = true;
        }
        
        // 如果有更新，则更新表单值
        if (needsUpdate) {
            form.setFieldsValue(updatedValues);
        }
        
        message.loading('Generating Story, please wait...', 0);
        generateStory(updatedValues).then(res => {
            message.destroy();
            if (res?.success === false) {
                throw new Error(res?.message || 'Generate Story Failed');
            }
            console.log('generateStory res', res);
            message.success('Generate Story Success');
            if (res?.data?.segments) {
                setStorySegments(res.data.segments);
                // 确保在API返回故事段落数据后再显示确认对话框
                setConfirmationVisible(true);
            }
        }).catch(err => {
            message.error('Generate Story Failed: ' + err?.message || JSON.stringify(err), 10);
            console.log('generateStory err', err);
        })
    };
    
    const handleStoryCancel = () => {
        setConfirmationVisible(false);
    };
    
    const handleStoryConfirm = (segments: StorySegment[]) => {
        setConfirmationVisible(false);
        message.loading('Generating Video, please wait...', 0);
        
        // 获取表单值并确保所有必要参数都已设置
        const formValues = form.getFieldsValue();
        const updatedValues = { ...formValues };
        let needsUpdate = false;
        
        // 检查语言设置
        if (!formValues.language && allVoiceList.length > 0) {
            const defaultLanguage = VOICE_LANGUAGES_LABELS[0]?.value as Language;
            updatedValues.language = defaultLanguage;
            needsUpdate = true;
        }
        
        // 检查语音名称设置
        if (!formValues.voice_name && allVoiceList.length > 0) {
            const language = updatedValues.language || formValues.language;
            const voiceList = getSelectVoiceList(language, allVoiceList);
            if (voiceList.length > 0) {
                updatedValues.voice_name = voiceList[0]?.replace('-Female', '').replace('-Male', '');
                needsUpdate = true;
            }
        }
        
        // 如果有更新，则更新表单值
        if (needsUpdate) {
            form.setFieldsValue(updatedValues);
        }
        
        // 将编辑后的故事段落添加到请求中
        const requestData = {
            ...updatedValues,
            story_segments: segments
        };
        generateVideo(requestData).then(res => {
            message.destroy();
            if (res?.success === false) {
                throw new Error(res?.message || 'Generate Video Failed');
            }
            console.log('generateVideo res', res);
            message.success('Generate Video Success');
            if (res?.data?.video_url) {
                setVideoUrl(res?.data?.video_url);
            }
        }).catch(err => {
            message.error('Generate Video Failed: ' + err?.message || JSON.stringify(err), 10);
            console.log('generateVideo err', err);
        });
    };
    
    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    
    const handleSettingsOpen = () => {
        setSettingsVisible(true);
    };
    
    const handleSettingsCancel = () => {
        setSettingsVisible(false);
    };
    
    const handleSettingsOk = () => {
        setSettingsVisible(false);
    };
    useEffect(() => {
        form.setFieldsValue({
            text_llm_provider: llmProviders.textLLMProviders?.[0],
            image_llm_provider: llmProviders.imageLLMProviders?.[0],
            text_llm_model: 'deepseek-v3',
            image_llm_model: 'flux-dev',
         });
      }, [llmProviders.imageLLMProviders, llmProviders.textLLMProviders]);
    return (
        <div className={styles.formDiv}>
            <Form
                form={form}
                name="basic"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                initialValues={{ remember: true, resolution: '1024*1024' }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <div className={styles.formSection}>
                    <Form.Item<FieldType>
                        label={t('storyForm.textPrompt')}
                        name="story_prompt"
                        rules={[{ required: true, message: t('storyForm.textPromptMissMsg') }]}
                    >
                        <Input.TextArea rows={4} placeholder={t('storyForm.storyPromptPlaceholder')} />
                    </Form.Item>
                    <Form.Item<FieldType>
                        label={t('storyForm.storySetting')}
                        name="story_setting"
                        rules={[{ required: false, message: t('storyForm.storySettingMissMsg') }]}
                    >
                        <Input.TextArea rows={4} placeholder={t('storyForm.storySettingPlaceholder')} />
                    </Form.Item>
                    <Form.Item<FieldType>
                        label={t('storyForm.segments')}
                        name="segments"
                        rules={[{ required: true, message: t('storyForm.segmentsMissMsg'), min: 1, max: 10 }]}
                    >
                        <Input type='number' min={1} max={10} placeholder="3" />
                    </Form.Item>
                </div>
                <Form.Item label={null} className={styles.submitButtonContainer}>
                    <div className={styles.buttonGroup}>
                        <Button 
                            icon={<SettingOutlined />} 
                            onClick={handleSettingsOpen}
                            size="large"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {t('settingsModal.settings')}
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            size="large"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {t('storyForm.submit')}
                        </Button>
                    </div>
                </Form.Item>
            </Form>
            
            {/* 故事确认对话框 */}
            <StoryConfirmation
                visible={confirmationVisible}
                storySegments={storySegments}
                onCancel={handleStoryCancel}
                onConfirm={handleStoryConfirm}
            />
            
            {/* 设置模态框 */}
            <SettingsModal
                visible={settingsVisible}
                onCancel={handleSettingsCancel}
                onOk={handleSettingsOk}
                form={form}
                allVoiceList={allVoiceList}
                nowVoiceList={nowVoiceList}
                setNowVoiceList={setNowVoiceList}
                llmProviders={llmProviders}
            />
        </div>
    )
}

export default App;