import { useRef } from 'react';
import { useVideoStore } from "../../stores/index";
import styles from './index.module.css';
import HistoryVideoList from './HistoryVideoList';
export default function VideoResult(props: any) {

    const { videoUrl } = useVideoStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    
    return (
        <div className={styles.videoResultWrapper}>
            <div className={styles.videoContainer} key={videoUrl}>
                {videoUrl ? (
                    <video ref={videoRef} controls className={styles.videoEl}>
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <div className={styles.videoPlaceholder}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="2" y1="7" x2="7" y2="7"></line>
                            <line x1="2" y1="17" x2="7" y2="17"></line>
                            <line x1="17" y1="17" x2="22" y2="17"></line>
                            <line x1="17" y1="7" x2="22" y2="7"></line>
                        </svg>
                        <p>视频预览区</p>
                        <p className={styles.videoHint}>生成故事后将在此处显示视频</p>
                    </div>
                )}
            </div>
            <HistoryVideoList />
        </div>
    )
}