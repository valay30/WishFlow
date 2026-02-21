export const uploadToImageKit = async (file) => {
    const url = 'https://upload.imagekit.io/api/v1/files/upload';

    // Note: For a production app, uploading should be signed by a backend.
    // For this pure frontend app, we use the private key directly.
    const privateKey = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("Missing VITE_IMAGEKIT_PRIVATE_KEY in .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name || "wishflow_image_" + Date.now());

    const encodedKey = btoa(privateKey + ":");

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${encodedKey}`
        },
        body: formData
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to upload image to ImageKit");
    }

    const data = await response.json();
    return data.url; // The public ImageKit URL
};
