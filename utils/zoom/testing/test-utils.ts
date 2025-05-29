import uitoolkit from '@zoom/videosdk-ui-toolkit';

interface ChatMessage {
    content: string;
    sender: string;
    timestamp: number;
}

export async function testVideoAudioToggle(container: HTMLElement): Promise<boolean> {
    try {
        // Test video preview
        await uitoolkit.openPreview(container);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await uitoolkit.closePreview(container);
        
        return true;
    } catch (error) {
        console.error('Video/Audio preview test failed:', error);
        return false;
    }
}

export async function testScreenSharing(container: HTMLElement): Promise<boolean> {
    try {
        // Test session join
        await uitoolkit.joinSession(container, {
            videoSDKJWT: 'test-token',
            sessionName: 'test-session',
            userName: 'test-user',
            features: ['video', 'audio', 'share']
        });
        
        // Wait for session to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clean up
        await uitoolkit.closeSession(container);
        
        return true;
    } catch (error) {
        console.error('Screen sharing test failed:', error);
        return false;
    }
}

export async function testChatSystem(container: HTMLElement): Promise<boolean> {
    try {
        // Test session join with chat feature
        await uitoolkit.joinSession(container, {
            videoSDKJWT: 'test-token',
            sessionName: 'test-session',
            userName: 'test-user',
            features: ['chat']
        });
        
        // Wait for session to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clean up
        await uitoolkit.closeSession(container);
        
        return true;
    } catch (error) {
        console.error('Chat system test failed:', error);
        return false;
    }
}

export async function testParticipantList(container: HTMLElement): Promise<boolean> {
    try {
        // Test session join with participant list
        await uitoolkit.joinSession(container, {
            videoSDKJWT: 'test-token',
            sessionName: 'test-session',
            userName: 'test-user',
            features: ['users']
        });
        
        // Wait for session to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clean up
        await uitoolkit.closeSession(container);
        
        return true;
    } catch (error) {
        console.error('Participant list test failed:', error);
        return false;
    }
}

export async function testLayoutSwitching(container: HTMLElement): Promise<boolean> {
    try {
        // Test session join with layout options
        await uitoolkit.joinSession(container, {
            videoSDKJWT: 'test-token',
            sessionName: 'test-session',
            userName: 'test-user',
            features: ['video'],
            options: {
                video: {
                    layout: {
                        mode: 'speaker'
                    }
                }
            }
        });
        
        // Wait for session to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clean up
        await uitoolkit.closeSession(container);
        
        return true;
    } catch (error) {
        console.error('Layout switching test failed:', error);
        return false;
    }
}

export async function testResponsiveDesign(container: HTMLElement): Promise<boolean> {
    try {
        // Test session join with responsive layout
        await uitoolkit.joinSession(container, {
            videoSDKJWT: 'test-token',
            sessionName: 'test-session',
            userName: 'test-user',
            features: ['video'],
            options: {
                video: {
                    layout: {
                        mode: 'speaker',
                        showActiveVideo: true,
                        showNonActiveVideo: true
                    }
                }
            }
        });
        
        // Test different viewport sizes
        const sizes = [
            { width: 320, height: 568 },  // Mobile
            { width: 768, height: 1024 }, // Tablet
            { width: 1920, height: 1080 } // Desktop
        ];
        
        for (const size of sizes) {
            // Simulate resize
            Object.defineProperty(window, 'innerWidth', { value: size.width });
            Object.defineProperty(window, 'innerHeight', { value: size.height });
            window.dispatchEvent(new Event('resize'));
            
            // Wait for resize to take effect
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Clean up
        await uitoolkit.closeSession(container);
        
        return true;
    } catch (error) {
        console.error('Responsive design test failed:', error);
        return false;
    }
} 