import { NotionAPI } from "notion-client";

export default defineEventHandler(async (event) => {
  const pageId = event?.context?.params?.pageId;

  if (!pageId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Page ID is required'
    });
  }

  const api = new NotionAPI();
  const page = await api.getPage(pageId);

  return page;
});
