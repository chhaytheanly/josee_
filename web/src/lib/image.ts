export const getImageUrl = (path?: string) => {
    if (!path)
        return '';

    if (path.startsWith('http'))
        return path;

    return `http://localhost:8000/${path}`;
}