import React from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { getSelectVoiceList } from '../../utils/index';
import { VOICE_LANGUAGES_LABELS } from '../../constants';

interface SettingsModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  form: any; // Form实例
  allVoiceList: string[];
  nowVoiceList: string[];
  setNowVoiceList: (list: string[]) => void;
  llmProviders: { textLLMProviders: string[], imageLLMProviders: string[] };
}

type FieldType = {
  text_llm_provider?: string;
  image_llm_provider?: string;
  text_llm_model?: string;
  image_llm_model?: string;
  resolution?: string;
  language?: string;
  voice_name: string;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onCancel,
  onOk,
  form,
  allVoiceList,
  nowVoiceList,
  setNowVoiceList,
  llmProviders
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('settingsModal.title')}
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <h3>{t('settingsModal.modelSettings')}</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item<FieldType>
            label={t('storyForm.txtLLMProvider')}
            name="text_llm_provider"
            rules={[{ required: true, message: t('storyForm.txtLLMProviderMissMsg') }]}
            style={{ flex: 1 }}
          >
            <Select>
              {
                llmProviders.textLLMProviders.map((provider) => (
                  <Select.Option key={provider} value={provider}>{provider}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.txtLLMModel')}
            name="text_llm_model"
            rules={[{ required: true, message: t('storyForm.txtLLMModelMissMsg') }]}
            style={{ flex: 1 }}
          >
            <Input placeholder={t('storyForm.textLLMPlaceholder')} />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item<FieldType>
            label={t('storyForm.imgLLMProvider')}
            name="image_llm_provider"
            rules={[{ required: true, message: t('storyForm.imgLLMProviderMissMsg') }]}
            style={{ flex: 1 }}
          >
            <Select>
              {
                llmProviders.imageLLMProviders.map((provider) => (
                  <Select.Option key={provider} value={provider}>{provider}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.imgLLMModel')}
            name="image_llm_model"
            rules={[{ required: true, message: t('storyForm.imgLLMModelMissMsg') }]}
            style={{ flex: 1 }}
          >
            <Input placeholder={t('storyForm.imageLLMPlaceholder')} />
          </Form.Item>
        </div>
        <Form.Item<FieldType>
          label={t('storyForm.resolution')}
          name="resolution"
          rules={[{ required: true, message: t('storyForm.resolutionMissMsg') }]}
        >
          <Input placeholder={t('storyForm.resolutionPlaceholder')} />
        </Form.Item>

        <h3>{t('settingsModal.voiceSettings')}</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Form.Item<FieldType>
            label={t('storyForm.videoLanguage')}
            name="language"
            rules={[{ required: true, message: t('storyForm.videoLanguageMissMsg') }]}
            style={{ flex: 1 }}
          >
            <Select
              onChange={(value) => {
                let voiceList = getSelectVoiceList(value, allVoiceList);
                setNowVoiceList(voiceList);
                form.setFieldsValue({ voice_name: voiceList[0]?.replace('-Female', '').replace('-Male', '') });
              }}
            >
              {
                VOICE_LANGUAGES_LABELS.map((language) => (
                  <Select.Option key={language.value} value={language.value}>{language.label}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.voiceName')}
            name="voice_name"
            rules={[{ required: true, message: t('storyForm.voiceNameMissMsg') }]}
            style={{ flex: 1 }}
          >
            <Select>
              {
                nowVoiceList.map((voice) => (
                  <Select.Option key={voice} value={voice.replace('-Female', '').replace('-Male', '')}>{voice}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default SettingsModal;