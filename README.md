# nuxt-portfolio-dev
a portfolio for developers w/ a blog powered by [Notion](https://www.notion.so/) 

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/aymaneMx/nuxt-portfolio-dev)

Demo: https://prana-wijaya.netlify.app/


**Features** 

- :smiling_face_with_three_hearts: minimal and clean portfolio 
- :last_quarter_moon: the dark/light mode (Auto detect the system color-mode)
- :iphone: responsive (tablet & mobile friendly)
- :gear: render articles from [Notion](https://www.notion.so/) :rocket:
- :star: fetches your Github pinned projects with most stars
- :dizzy: Eslint & Prettier configured
- :chart_with_upwards_trend: google analytics integration 
- :zap: generate sitemap (visit /sitemap.xml)
- :rocket: one click deployment to netlify 

### Prerequisites

1. create [Notion](https://www.notion.so/) account 
2. duplicate [this template](https://www.notion.so/f906db55071f471eb418879a2d0b3c7f?v=202b2d8603af4b3c86a93963287d3729) by clicking on "duplicate" button located at the top of the page.
3. make your notion table public (by clicking on "share" button located at the top of the page)
4. grab the table id from the table link:
eg: 
```
link: https://www.notion.so/f906db55071f471eb418879a2d0b3c7f?v=202b2d8603af4b3c86a93963287d3729
id: f906db55071f471eb418879a2d0b3c7f
```
5. do the same thing for about page id (we gonna use it as an env variable NOTION_ABOUT_PAGE_ID)
5. get your Google analytics id (optional)
6. now you can click to the deploy button and fill the netlify form

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/aymaneMx/nuxt-portfolio-dev)



### Build Setup

create a `.env` file with the following variables

```
BASE_URL="https://prana-wijaya.netlify.app/"
DEV_DESCRIPTION="a passionate Javascript developer from Indonesia who loves to build and deliver quality products."
DEV_GITHUB_LINK="https://github.com/pranahonk"
DEV_LINKEDIN_LINK="https://www.linkedin.com/in/prana-wijaya/"
DEV_LOGO="Prana"
DEV_NAME="Prana Apsara Wijaya"
DEV_ROLE="Software Engineer"
DEV_TWITTER_LINK="https://twitter.com/pranahonk"
GITHUB_USERNAME="pranahonk"
NOTION_ABOUT_PAGE_ID="34f33e041bc74cea89530902deef0012"
NOTION_PORTFOLIO_PAGE_ID="316c052484be4a62b8c39bb5dcd36c01"
NOTION_TABLE_ID="f906db55071f471eb418879a2d0b3c7f"


then:

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev
```


### Sites using this template 🌎
List of portfolios that are using this template.

- [AymaneMx's Blog](https://aymanemx.com)

if you're using it too, we'd be happy to [feature](https://github.com/aymaneMx/nuxt-portfolio-dev/issues/26) you here 

### Credits 

- :moon: The dark mode : [eggsy](https://github.com/eggsy/website)
- :art: the minimal design : [Monotone](https://github.com/dev-ggaurav/Monotone)
- :star: The open source section : [mouadziani](https://github.com/MouadZIANI/mouadziani.com) and [smakosh](https://github.com/smakosh/smakosh.com)

