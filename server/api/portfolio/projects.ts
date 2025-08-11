export default defineEventHandler(async (event) => {
  // Static portfolio projects array sourced from the provided Notion-like data
  return getPortfolioProjects();
});

function getRandomGradient() {
  const gradients = [
    'from-red-400 via-pink-500 to-blue-600',
    'from-purple-400 via-pink-500 to-red-500',
    'from-blue-400 via-purple-500 to-pink-500',
    'from-green-400 via-blue-500 to-purple-600',
    'from-yellow-400 via-orange-500 to-red-500',
    'from-indigo-400 via-purple-500 to-pink-500'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

function getPortfolioProjects() {
  return [
    {
      id: 'occumed',
      title: 'OccuMed',
      description: 'Occu-Med Job Analysis Portal for managing occupational medical information with secure auth, dashboard, referrals and reports.',
      fullDescription:
        'I developed the Occu-Med Job Analysis Portal, a comprehensive platform for managing occupational medical information. My responsibilities included building the secure login and registration system, and creating the main dashboard for handling referrals, results, and client reports. I engineered a dynamic data table with advanced filtering and pagination, and a multi-step modal for creating new referrals. The application features a clean, professional UI built with a focus on user experience and data management.',
      techStack: ['.NET / C#', 'Vue.js', 'Tailwind CSS', 'Full-Stack Development', 'Data Visualization'],
      liveUrl: '#',
      codeUrl: '#',
      // Intentionally omit coverImage because provided attachments are not publicly accessible
      gradient: getRandomGradient(),
      features: [
        'Secure login and registration',
        'Dashboard for referrals, results, and reports',
        'Dynamic data table with filtering and pagination',
        'Multi-step referral creation flow'
      ],
      challenges: [],
      learnings: []
    },
    {
      id: 'rctiplus',
      title: 'RCTI+',
      description: 'Mobile app offering AVOD and live streaming services by PT MNC Digital Indonesia.',
      fullDescription:
        'RCTI+ is a mobile application with AVOD (audio and video service on demand) and live streaming services. This app is ad-driven and free. This application was developed by PT MNC Digital Indonesia, a subsidiary of Media Nusantara Citra.',
      techStack: [],
      liveUrl: 'https://rctiplus.com/',
      codeUrl: '#',
      gradient: getRandomGradient(),
      features: [],
      challenges: [],
      learnings: []
    },
    {
      id: 'telunjuk',
      title: 'Telunjuk',
      description: 'Shopping search engine to compare prices and buy from trusted online stores.',
      fullDescription:
        'Telunjuk is a shopping search engine that acts as your best friend in finding, comparing prices, and buying the things you need. Just type in the product or item you are looking for, Telunjuk will display shopping recommendations for that product, complete with prices, discounts, and other interesting promos from dozens of trusted online stores such as Tokopedia, Blibli, Shopee and many other online stores for Telunjuk!',
      techStack: [],
      liveUrl: 'https://www.telunjuk.com/',
      codeUrl: '#',
      gradient: getRandomGradient(),
      features: [],
      challenges: [],
      learnings: []
    },
    {
      id: 'compas',
      title: 'Compas',
      description: 'E-commerce market insight tools delivering actionable business intelligence.',
      fullDescription:
        'Compas is developed by the team that brought Telunjuk.com, a technology company based in Jakarta, Indonesia. We focus on business intelligence tools, namely e-commerce market insight, that provide actionable insights to empower you to make strategic decisions for your greater online business.',
      techStack: [],
      liveUrl: 'https://compas.co.id/',
      codeUrl: '#',
      gradient: getRandomGradient(),
      features: [],
      challenges: [],
      learnings: []
    },
    {
      id: 'sakoo',
      title: 'Sakoo',
      description: 'Web app integrating offline and online sales channels with stock, transactions, CRM, and catalog features.',
      fullDescription:
        'Sakoo is a web-based application that provides and integrates offline and online sales channels so that it can help business owners to increase effectiveness and efficiency in selling. Sakoo provides features in the form of stock management, transactions, customer data, and product catalogs.',
      techStack: [],
      liveUrl: 'https://app.sakoo.id/login',
      codeUrl: '#',
      gradient: getRandomGradient(),
      features: [],
      challenges: [],
      learnings: []
    },
    {
      id: 'blanja',
      title: 'Blanja',
      description: 'Online marketplace joint venture between Telkom Indonesia and eBay.',
      fullDescription:
        'Blanja is a joint-venture between Telkom Indonesia and eBay. Having a concept as an Online-Marketplace, BLANJA.com has more than thousands of merchants that offer a variety of products from its various categories. As an online shopping medium, apart from a wide variety of products, it also has cooperative relationships with a number of leading banks in the country such as Mandiri, BNI, BCA, BRI, BTN, Mega, Niaga, ANZ, BII, and so on. BLANJA.com is actually a market place site resulting from a joint venture between Telkomsel\'s parent company, Telkom Indonesia and eBay, which is under the umbrella of PT Metra Plasa.',
      techStack: [],
      liveUrl: 'http://blanja.com/',
      codeUrl: '#',
      gradient: getRandomGradient(),
      features: [],
      challenges: [],
      learnings: []
    },
    {
      id: 'indoesports',
      title: 'Indoesports',
      description: 'Indonesian esports media covering tournaments, games, and business news since 2017.',
      fullDescription:
        'Indoesports is a company that operates and lives in the Indonesian esports industry ecosystem. INDOESPORTS has active media products since 2017. Through two ways, namely the official website (www.indoesports.com) and social media (Instagram @indo.esports). INDOESPORTS media actively covers and reports about the world of esports, from tournaments, the latest game information to the latest news about the esports business.',
      techStack: [],
      liveUrl: 'https://www.indoesports.com/',
      codeUrl: '#',
      gradient: getRandomGradient(),
      features: [],
      challenges: [],
      learnings: []
    },
    {
      id: 'xetia',
      title: 'Xetia',
      description: 'AI-focused company delivering instant digital analysis using the latest technology.',
      fullDescription:
        'Xetia are companies that have a strong hold in the field of Artificial Intelligence, able to carry out various analyzes by utilizing the most updated technology to perform all digital activities instantly.',
      techStack: [],
      liveUrl: 'https://xetia.io/',
      codeUrl: '#',
      gradient: getRandomGradient(),
      features: [],
      challenges: [],
      learnings: []
    },
    {
      id: 'brilian-muda',
      title: 'Brilian Muda',
      description: 'Health sector vendor; delivered a CMS project with Kalbe Farma.',
      fullDescription:
        'Brilian Muda is one of vendor in health sector, when I am here I did the project with Kalbe farma to make CMS.',
      techStack: [],
      liveUrl: 'https://www.brilianmuda.com/',
      codeUrl: '#',
      gradient: getRandomGradient(),
      features: [],
      challenges: [],
      learnings: []
    }
  ];
}
