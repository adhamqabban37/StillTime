
import { SavedItem, SavedItemSource } from '../types.ts';

export function parseAndCreateSavedItem(url: string): SavedItem {
    let source: SavedItemSource = 'Web';
    let title = `Article: ${new URL(url).hostname}`;
    let duration = 10; // Default reading time
    let thumbnail;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        source = 'YouTube';
        title = 'YouTube Video';
        duration = 15; // Mock duration
        // In a real app, you'd use the YouTube API to get title, thumbnail, and duration
        try {
            const videoId = new URL(url).searchParams.get('v');
            if (videoId) {
                thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                title = `Video: ${videoId}`;
            }
        } catch (e) { console.error("Could not parse YouTube URL", e); }
    } else if (url.includes('instagram.com')) {
        source = 'Instagram';
        title = 'Instagram Post';
        duration = 5;
    }

    return {
        id: new Date().toISOString(),
        url,
        source,
        title,
        thumbnail,
        duration,
        addedAt: new Date().toISOString(),
        status: 'inbox',
    };
}
