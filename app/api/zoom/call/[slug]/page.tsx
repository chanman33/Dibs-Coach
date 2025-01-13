'use client';

import { useRef, useState, CSSProperties } from "react";
import ZoomVideo, { type VideoClient, VideoQuality } from "@zoom/videosdk";
import { Button } from "@/components/ui/button";
import { PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";

interface VideocallProps {
  slug: string;
  jwt: string;
}

const videoPlayerStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '10px',
  padding: '10px',
  minHeight: '400px',
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
};

export default function Videocall({ slug, jwt }: VideocallProps) {
  const [inSession, setInSession] = useState(false);
  const client = useRef(ZoomVideo.createClient());
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const joinSession = async () => {
    try {
      // Initialize the client
      await client.current.init("en-US", "Global");
      
      // Set up video state change listener
      client.current.on("peer-video-state-change", (payload) => {
        renderVideo(payload);
      });

      // Generate a random username
      const userName = `User-${Date.now().toString().slice(-4)}`;
      
      // Join the session
      await client.current.join(slug, jwt, userName);
      setInSession(true);

      // Start audio and video
      const mediaStream = client.current.getMediaStream();
      await mediaStream.startAudio();
      await mediaStream.startVideo();
      
      // Update states
      setIsAudioMuted(false);
      setIsVideoMuted(false);

      // Render initial video
      await renderVideo({ 
        action: "Start", 
        userId: client.current.getCurrentUserInfo()?.userId 
      });
    } catch (error) {
      console.error("Failed to join session:", error);
    }
  };

  const renderVideo = async (event: { action: "Start" | "Stop"; userId: number }) => {
    if (!videoContainerRef.current) return;

    const mediaStream = client.current.getMediaStream();
    
    if (event.action === "Stop") {
      const element = await mediaStream.detachVideo(event.userId);
      if (Array.isArray(element)) {
        element.forEach(el => el.remove());
      } else {
        element?.remove();
      }
    } else {
      const videoElement = await mediaStream.attachVideo(event.userId, VideoQuality.Video_360P);
      if (videoElement && 'nodeName' in videoElement) {
        videoContainerRef.current.appendChild(videoElement);
      }
    }
  };

  const toggleVideo = async () => {
    const mediaStream = client.current.getMediaStream();
    if (isVideoMuted) {
      await mediaStream.startVideo();
      await renderVideo({ 
        action: "Start", 
        userId: client.current.getCurrentUserInfo()?.userId 
      });
    } else {
      await mediaStream.stopVideo();
      await renderVideo({ 
        action: "Stop", 
        userId: client.current.getCurrentUserInfo()?.userId 
      });
    }
    setIsVideoMuted(!isVideoMuted);
  };

  const toggleAudio = async () => {
    const mediaStream = client.current.getMediaStream();
    if (isAudioMuted) {
      await mediaStream.startAudio();
    } else {
      await mediaStream.stopAudio();
    }
    setIsAudioMuted(!isAudioMuted);
  };

  const leaveSession = async () => {
    try {
      client.current.off("peer-video-state-change", (payload) => renderVideo(payload));
      await client.current.leave();
      setInSession(false);
      setIsVideoMuted(true);
      setIsAudioMuted(true);
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error("Failed to leave session:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-semibold">
        Session: {slug}
      </h1>
      
      <div 
        ref={videoContainerRef}
        style={inSession ? videoPlayerStyle : { display: 'none' }}
        className="video-container"
      />

      <div className="flex justify-center gap-4">
        {!inSession ? (
          <Button onClick={joinSession} variant="default">
            Join Session
          </Button>
        ) : (
          <>
            <Button onClick={toggleVideo} variant="outline">
              {isVideoMuted ? <VideoOff /> : <Video />}
            </Button>
            <Button onClick={toggleAudio} variant="outline">
              {isAudioMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button onClick={leaveSession} variant="destructive">
              <PhoneOff />
            </Button>
          </>
        )}
      </div>
    </div>
  );
} 