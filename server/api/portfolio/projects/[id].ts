import { getPortfolioProjects } from '~/server/data/portfolioData';

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required'
    });
  }

  const project = getProjectById(projectId);

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found'
    });
  }

  return project;
});

function getProjectById(id: string) {
  const projects = getPortfolioProjects();
  return projects.find(project => project.id === id);
}
