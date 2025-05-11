import { useState } from 'react';
import StoryForm from './components/StoryFrom';
import CustomStoryForm from './components/CustomStoryForm';
import './App.css'
import LanguageSelect from './components/LanguageSelect';
import VideoResult from './components/VideoResult';
import './locales/index';
import { Radio } from 'antd';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  const [storyMode, setStoryMode] = useState<'ai' | 'custom'>('ai');

  return (
    <div className="app">
      <LanguageSelect />
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
        <Radio.Group 
          value={storyMode} 
          onChange={(e) => setStoryMode(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="ai">{t('app.aiGenerated')}</Radio.Button>
          <Radio.Button value="custom">{t('app.customStory')}</Radio.Button>
        </Radio.Group>
      </div>
      <div className="appMainArea">
        {storyMode === 'ai' ? <StoryForm /> : <CustomStoryForm />}
        <VideoResult />
      </div>
    </div>
  )
}

export default App
