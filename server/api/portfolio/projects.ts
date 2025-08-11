import { getPortfolioProjects } from '~/server/data/portfolioData';

export default defineEventHandler(async (event) => {
  return getPortfolioProjects();
});
