import uitoolkit from '@zoom/videosdk-ui-toolkit';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ChatMessage {
    content: string;
    sender: string;
    timestamp: number;
}

export async function testVideoAudioToggle(container: HTMLElement): Promise<boolean> {
    try {
        console.log("testVideoAudioToggle: Opening preview...");
        await uitoolkit.openPreview(container); 
        await delay(1000);
        console.log("testVideoAudioToggle: Closing preview...");
        await uitoolkit.closePreview(container);
        return true;
    } catch (error) {
        console.error('Video/Audio preview test failed:', error);
        return false;
    }
}

export async function testScreenSharing(container: HTMLElement): Promise<boolean> {
    try {
        console.log("testScreenSharing: Showing share component features...");
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
        console.log("testChatSystem: Showing chat component features...");
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
        console.log("testParticipantList: Showing users component features...");
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