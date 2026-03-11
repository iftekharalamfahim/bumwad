import puter from "@heyputer/puter.js";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
import {isHostedUrl} from "./utils";

export const signIn = async () => await puter.auth.signIn();
export const signOut =  () => puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }
}

export const createProject = async ({item}: CreateProjectParams):
Promise<DesignItem | null | undefined> =>{
    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource = projectId ?
        await uploadImageToHosting({
            hosting,
            url: item.sourceImage,
            projectId,
            label: "source"
        }) : null;

    const hostedRender = projectId && item.renderedImage ?
        await uploadImageToHosting({
            hosting,
            url: item.renderedImage,
            projectId,
            label: "rendered"
        }) : null;

    const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage)
    ? item.sourceImage : '');

    if(!resolvedSource) {
        console.warn(`Failed to host source image, skipping save.`)
        return null;
    }

    const resolvedRendered = hostedRender?.url
    ? hostedRender ?.url
        : item.renderedImage && isHostedUrl(item.renderedImage)
            ? item.renderedImage
            : undefined;

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRendered,
    }

    try {
        // Save project in the KV store directly using puter.kv
        const data = await puter.kv.get('projects');
        let existingProjects = [];
        if (data) {
            try {
                existingProjects = typeof data === 'string' ? JSON.parse(data) : data;
            } catch (e) {
                console.warn('Failed to parse projects from KV', e);
            }
        }
        const updatedProjects = [payload, ...(Array.isArray(existingProjects) ? existingProjects : [])];
        await puter.kv.set('projects', JSON.stringify(updatedProjects));
        return payload;
    } catch (e) {
        console.log('Failed to save project', e)
        return null;
    }
}