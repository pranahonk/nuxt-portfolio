<template>
  <div class="wrapper-small md:px-10">
    <div class="mt-5">
      <Hero/>
    </div>

    <Blogs :posts="posts" title="Featured blogs"/>
    <Projects :projects="projects"/>
  </div>
</template>

<script>
export default {
  async asyncData({ $axios, $notion, $config: { githubUsername, notionTableId } }) {
    const projects = await $axios
      .get(
        'https://api.github.com/search/repositories?q=user:' + githubUsername + '&sort=stars&per_page=3'
      )
      .catch((errors) =>{
        throw new Error(errors);
      })
    const pageTable = await $notion.getPageTable(notionTableId);
    const posts = pageTable.filter((page) => page.public)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .filter((x,idx) => idx < 5)
    return { posts, projects: projects?.data?.items }
  }
}
</script>
