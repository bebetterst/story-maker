import { useEffect, useState } from 'react';
import { useVideoStore } from '../../stores';
import { request } from '../../utils/request';
import styles from './HistoryVideoList.module.css';
import { useTranslation } from 'react-i18next';

interface HistoryVideo {
  task_id: string;
  video_url: string;
  created_time: number;
  created_time_str: string;
  story_prompt: string;
  custom_mode?: boolean;
}

interface HistoryVideoResponse {
  success: boolean;
  data?: {
    videos: HistoryVideo[];
  };
  message?: string;
}

export default function HistoryVideoList() {
  const [historyVideos, setHistoryVideos] = useState<HistoryVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const { setVideoUrl } = useVideoStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchHistoryVideos();
  }, []);

  const fetchHistoryVideos = async () => {
    setLoading(true);
    try {
      const response = await request<HistoryVideoResponse>({
        url: '/api/video/history',
        method: 'get',
      });
      
      if (response.success && response.data?.videos) {
        setHistoryVideos(response.data.videos);
      }
    } catch (error) {
      console.error(t('historyVideo.fetchError'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoUrl: string) => {
    setVideoUrl(videoUrl);
  };

  if (historyVideos.length === 0 && !loading) {
    return (
      <div className={styles.historyContainer}>
        <h3 className={styles.historyTitle}>{t('historyVideo.title')}</h3>
        <div className={styles.loading}>{t('historyVideo.noVideos', '暂无历史视频')}</div>
      </div>
    );
  }

  return (
    <div className={styles.historyContainer}>
      <h3 className={styles.historyTitle}>{t('historyVideo.title')}</h3>
      {loading ? (
        <div className={styles.loading}>{t('historyVideo.loading')}</div>
      ) : (
        <div className={styles.videoList}>
          {historyVideos.map((video) => (
            <div 
              key={video.task_id} 
              className={styles.videoItem}
              onClick={() => handleVideoClick(video.video_url)}
            >
              <div className={styles.videoInfo}>
                <div className={styles.videoPrompt} title={video.story_prompt}>
                  {video.custom_mode === true 
                    ? `[custom] ${video.story_prompt || t('historyVideo.noTitle')}` 
                    : `[AI] ${video.story_prompt || t('historyVideo.noTitle')}`}
                </div>
                <div className={styles.videoTime}>{video.created_time_str}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}