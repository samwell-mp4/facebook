// Background Service Worker - Snack Store BH Auto-Catálogo
console.log('💎 Snack Store BH Background Service Worker ativo!');

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const chunkSize = 0x8000;
    for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
    }
    return btoa(binary);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'LOAD_IMAGE') {
        const rawPath = message.path;
        const parts = rawPath.split('/');
        const encodedPath = parts.map(encodeURIComponent).join('/');
        const fileUrlEncoded = chrome.runtime.getURL(encodedPath);
        const fileUrlRaw = chrome.runtime.getURL(rawPath);

        fetch(fileUrlEncoded)
            .catch(() => fetch(fileUrlRaw))
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status + ' ao carregar ' + rawPath);
                return res.blob();
            })
            .then(async (blob) => {
                const buffer = await blob.arrayBuffer();
                const mime = blob.type || 'image/jpeg';
                const base64 = arrayBufferToBase64(buffer);
                const dataUrl = 'data:' + mime + ';base64,' + base64;

                sendResponse({
                    success: true,
                    dataUrl: dataUrl,
                    mimeType: mime,
                    fileName: message.fileName,
                    size: buffer.byteLength
                });
            })
            .catch(err => {
                sendResponse({
                    success: false,
                    error: err.message
                });
            });

        return true; // async
    }
});
