'use client';

import { useEffect, useRef } from 'react';
import { ZoomClient, ZoomStream } from '@/utils/types/zoom';

interface ZoomVideoProps {
  client: ZoomClient;
  stream: ZoomStream;
  className?: string;
}

export default function ZoomVideo({ client, stream, className = '' }: ZoomVideoProps) {
  const videoRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !stream) return;

    const startVideo = async () => {
      try {
        // Start rendering video on the canvas
        stream.renderVideo(
          videoRef.current as HTMLCanvasElement,
          client.getCurrentUserInfo().userId,
          1280, // width
          720,  // height
          0,    // x position
          0,    // y position
          3     // video quality - high
        );
      } catch (error) {
        console.error('[ZOOM_VIDEO_ERROR]', error);
      }
    };

    startVideo();

    // Cleanup
    return () => {
      try {
        if (stream && videoRef.current) {
          stream.stopRenderVideo(
            videoRef.current as HTMLCanvasElement,
            client.getCurrentUserInfo().userId
          );
        }
      } catch (error) {
        console.error('[ZOOM_VIDEO_CLEANUP_ERROR]', error);
      }
    };
  }, [client, stream]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={videoRef}
        className="w-full h-full object-cover"
      />
    </div>
  );
} 