import { create } from 'zustand'

interface VideoStore {
    videoUrl: string;
    setVideoUrl: (url: string) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  videoUrl: "",
  setVideoUrl: (url: string) => set({ videoUrl: url }),
}))