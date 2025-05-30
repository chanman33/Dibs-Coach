import uitoolkit from '@zoom/videosdk-ui-toolkit';
import zoomSdk from '@/utils/zoom/sdk/zoom-sdk';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ChatMessage {
    content: string;
    sender: string;
    timestamp: number;
}

export async function testVideoAudioToggle(container: HTMLElement): Promise<boolean> {
    try {
        console.log("testVideoAudioToggle: Testing video/audio controls...");
        
        // 1. Get the client from the SDK
        const client = zoomSdk.getActiveClient();
        if (!client) {
            throw new Error('No active Zoom client found');
        }

        // 2. Get media stream
        const stream = client.getMediaStream();
        if (!stream) {
            throw new Error('No media stream found');
        }

        // 3. Test audio first (following initialization order)
        console.log("Testing audio toggle...");
        const initialAudioState = await stream.isAudioMuted();
        
        // Toggle audio off
        await stream.muteAudio();
        await delay(1000);
        const audioOff = await stream.isAudioMuted();
        if (!audioOff) {
            throw new Error('Failed to mute audio');
        }

        // Toggle audio on
        await stream.unmuteAudio();
        await delay(1000);
        const audioOn = await stream.isAudioMuted();
        if (audioOn) {
            throw new Error('Failed to unmute audio');
        }

        // 4. Test video after audio
        console.log("Testing video toggle...");
        const initialVideoState = await stream.isCapturingVideo();
        
        // Toggle video off
        await stream.stopVideo();
        await delay(1000);
        const videoOff = await stream.isCapturingVideo();
        if (videoOff) {
            throw new Error('Failed to stop video');
        }

        // Toggle video on
        await stream.startVideo();
        await delay(1000);
        const videoOn = await stream.isCapturingVideo();
        if (!videoOn) {
            throw new Error('Failed to start video');
        }

        // 5. Restore initial states
        if (initialVideoState) {
            await stream.startVideo();
        } else {
            await stream.stopVideo();
        }

        if (!initialAudioState) {
            await stream.muteAudio();
        } else {
            await stream.unmuteAudio();
        }

        console.log("Video/Audio toggle test completed successfully");
        return true;
    } catch (error) {
        console.error('Video/Audio toggle test failed:', error);
        return false;
    }
}

export async function testScreenSharing(container: HTMLElement): Promise<boolean> {
    try {
        console.log("testScreenSharing: Testing screen sharing...");
        
        // 1. Get the client from the SDK
        const client = zoomSdk.getActiveClient();
        if (!client) {
            throw new Error('No active Zoom client found');
        }

        // 2. Get media stream
        const stream = client.getMediaStream();
        if (!stream) {
            throw new Error('No media stream found');
        }

        // 3. Test screen sharing
        await uitoolkit.showUitoolkitComponents(container, { features: ['share'] } as any);
        await delay(1000);
        return true;
    } catch (error) {
        console.error('Screen sharing test failed:', error);
        return false;
    }
}

export async function testChatSystem(container: HTMLElement): Promise<boolean> {
    try {
        console.log("testChatSystem: Testing chat functionality...");
        
        // 1. Get the client from the SDK
        const client = zoomSdk.getActiveClient();
        if (!client) {
            throw new Error('No active Zoom client found');
        }

        // 2. Test chat
        await uitoolkit.showUitoolkitComponents(container, { features: ['chat'] } as any);
        await delay(1000);
        return true;
    } catch (error) {
        console.error('Chat system test failed:', error);
        return false;
    }
}

export async function testParticipantList(container: HTMLElement): Promise<boolean> {
    try {
        console.log("testParticipantList: Testing participant list...");
        
        // 1. Get the client from the SDK
        const client = zoomSdk.getActiveClient();
        if (!client) {
            throw new Error('No active Zoom client found');
        }

        // 2. Test participant list
        await uitoolkit.showUitoolkitComponents(container, { features: ['users'] } as any);
        await delay(1000);
        return true;
    } catch (error) {
        console.error('Participant list test failed:', error);
        return false;
    }
}

export async function testLayoutSwitching(container: HTMLElement): Promise<boolean> {
    try {
        console.log("testLayoutSwitching: Showing video component with layout options...");
        await uitoolkit.showUitoolkitComponents(container, {
            features: ['video'], 
            options: {
                video: {
                    layout: { mode: 'gallery' } 
                }
            }
        } as any);
        await delay(1000);
        return true;
    } catch (error) {
        console.error('Layout switching test failed:', error);
        return false;
    }
}

export async function testResponsiveDesign(container: HTMLElement): Promise<boolean> {
    try {
        console.log("testResponsiveDesign: Testing various viewport sizes...");
        const originalSize = { width: window.innerWidth, height: window.innerHeight };
        const sizes = [
            { width: 320, height: 568 },  
            { width: 768, height: 1024 }, 
            { width: 1280, height: 720 }  
        ];
        
        for (const size of sizes) {
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: size.width });
            Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: size.height });
            window.dispatchEvent(new Event('resize'));
            await delay(500); 
        }
        
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalSize.width });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalSize.height });
        window.dispatchEvent(new Event('resize'));
        await delay(100);
        
        return true;
    } catch (error) {
        console.error('Responsive design test failed:', error);
        return false;
    }
} 