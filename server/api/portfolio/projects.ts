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
      id: '1',
      title: 'OccuMed Job Analysis Portal',
      description: 'A comprehensive platform for managing occupational medical information with secure authentication, dynamic data tables, and advanced filtering capabilities.',
      fullDescription: 'I developed the Occu-Med Job Analysis Portal, a comprehensive platform for managing occupational medical information. My responsibilities included building the secure login and registration system, and creating the main dashboard for handling referrals, results, and client reports. I engineered a dynamic data table with advanced filtering and pagination, and a multi-step modal for creating new referrals. The application features a clean, professional UI built with a focus on user experience and data management.',
      techStack: ['.NET / C#', 'Vue.js', 'Tailwind CSS', 'RESTful APIs'],
      liveUrl: 'https://nusameta.com',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_2025-07-21_at_12.38.14.png',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_2025-07-21_at_12.38.14.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_2025-07-21_at_12.38.21.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_2025-07-21_at_12.39.07.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_2025-07-21_at_12.39.21.png'
      ],
      gradient: getRandomGradient(),
      features: [
        'Secure login and registration system',
        'Dynamic data table with advanced filtering',
        'Multi-step modal for creating referrals',
        'Professional dashboard for managing reports',
        'Advanced pagination and data management',
        'Clean and responsive UI/UX design',
        'Cross-platform authentication'
      ],
      challenges: [
        'Implementing secure authentication mechanisms',
        'Creating complex data filtering and pagination',
        'Building intuitive multi-step forms',
        'Ensuring responsive design across devices'
      ],
      learnings: [
        'Advanced .NET / C# backend development',
        'Vue.js component architecture and state management',
        'Tailwind CSS for rapid UI development',
        'Full-stack development best practices'
      ],
      role: 'Full Stack Developer',
      company: 'Nusameta',
      duration: 'Nov 2023 - Jun 2025'
    },
    {
      id: '2',
      title: 'MyBoost Kedai Merchant Platform',
      description: 'A modern, mobile-responsive React web application for merchant management within the MyBoost ecosystem, featuring credit systems and order management.',
      fullDescription: 'Developed and maintained a comprehensive merchant management platform featuring secure login with device fingerprinting, merchant onboarding, BoostTempo credit system with multi-step forms, order management, and promotional campaigns. Built with modern React architecture and integrated with multiple APIs for seamless user experience.',
      techStack: ['React 17', 'Redux Toolkit', 'Ant Design', 'Tailwind CSS', 'React Query', 'Docker'],
      liveUrl: 'https://myboost.id',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_20221031_092647.jpg',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_20221031_092647.jpg',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/IMG_2685.jpg',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/IMG_2683.jpg',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/IMG_2684.jpg'
      ],
      gradient: getRandomGradient(),
      features: [
        'Secure login with device fingerprinting',
        'Merchant registration and onboarding',
        'BoostTempo credit system with multi-step forms',
        'Comprehensive order management',
        'Reward points and voucher system',
        'User profile and address management',
        'Mobile-responsive design'
      ],
      challenges: [
        'Implementing complex credit application workflows',
        'Integrating camera for document uploads',
        'Managing complex state across multiple features',
        'Ensuring mobile responsiveness and performance'
      ],
      learnings: [
        'Advanced React patterns and hooks',
        'Redux Toolkit for state management',
        'Component-based architecture design',
        'CI/CD with Docker and Bitbucket Pipelines'
      ],
      role: 'Senior Software Engineer',
      company: 'Axiata Digital Services Indonesia',
      duration: 'Oct 2022 - Oct 2023'
    },
    {
      id: '3',
      title: 'RCTI+ Streaming Platform',
      description: 'A mobile application with AVOD and live streaming services, featuring microservices architecture, PWA capabilities, and advanced video streaming.',
      fullDescription: 'RCTI+ is a mobile application with AVOD (audio and video service on demand) and live streaming services. This app is ad-driven and free. Built using Next.js with microservices architecture, featuring search recommendations, service workers for caching, and cross-platform WebView integration.',
      techStack: ['Next.js', 'React', 'TypeScript', 'Redux', 'Video.js', 'GraphQL', 'PWA'],
      liveUrl: 'https://rctiplus.com/',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/rplus.jpg',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/rplus.jpg',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled-min.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled_(1)-min.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled_(2)-min.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%201.png'
      ],
      gradient: getRandomGradient(),
      features: [
        'Live streaming and video on demand',
        'Search recommendations and history',
        'Microservices architecture',
        'Service workers for offline caching',
        'Cross-platform WebView integration',
        'Progressive Web App (PWA)',
        'Advanced video player with HLS support'
      ],
      challenges: [
        'Building microservices architecture for mobile web',
        'Implementing service workers for caching',
        'Cross-platform WebView compatibility',
        'Video streaming optimization'
      ],
      learnings: [
        'Next.js SSR and static generation',
        'Advanced video streaming technologies',
        'PWA development and service workers',
        'Microservices architecture patterns'
      ],
      role: 'Software Engineer',
      company: 'RCTI+',
      duration: 'Mar 2021 - Sep 2022'
    },
    {
      id: '4',
      title: 'Telunjuk Shopping Search Engine',
      description: 'A comprehensive shopping search engine that compares prices across multiple e-commerce platforms, built with Nuxt.js and advanced analytics.',
      fullDescription: 'Telunjuk is a shopping search engine that acts as your best friend in finding, comparing prices, and buying the things you need. The platform displays shopping recommendations with prices, discounts, and promos from dozens of trusted online stores. Led platform revamp from CodeIgniter to Nuxt.js with significant performance improvements.',
      techStack: ['Nuxt.js', 'Vue.js', 'Elasticsearch', 'BigQuery', 'Google Analytics'],
      liveUrl: 'https://www.telunjuk.com/',
      codeUrl: 'https://github.com/pranahonk/telunjuk-vue',
      openSource: true,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%202.png',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%202.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%203.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%204.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%205.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%206.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%207.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%208.png'
      ],
      gradient: getRandomGradient(),
      features: [
        'Multi-platform price comparison',
        'Product search and recommendations',
        'Real-time price tracking',
        'Integration with major e-commerce platforms',
        'Advanced analytics and reporting',
        'A/B testing for conversion optimization',
        'Atomic design component system'
      ],
      challenges: [
        'Platform migration from CodeIgniter to Nuxt.js',
        'Implementing data pipelines from Elasticsearch to BigQuery',
        'Optimizing conversion rates through A/B testing',
        'Managing large-scale product data'
      ],
      learnings: [
        'Nuxt.js SSR and performance optimization',
        'Data pipeline architecture',
        'A/B testing and conversion optimization',
        'Atomic design principles'
      ],
      role: 'Senior Software Engineer (Front End)',
      company: 'Telunjuk.com',
      duration: 'Oct 2020 - Feb 2021'
    },
    {
      id: '5',
      title: 'Blanja E-commerce Marketplace',
      description: 'A joint-venture marketplace between Telkom Indonesia and eBay, featuring comprehensive e-commerce functionality and payment integrations.',
      fullDescription: 'Blanja is a joint-venture between Telkom Indonesia and eBay with thousands of merchants offering various products. Built comprehensive checkout system, payment integrations including credit card processing and KAI train ticketing, and collaborated on platform-wide improvements.',
      techStack: ['Vue.js', 'JavaScript', 'RESTful APIs', 'Payment Gateways'],
      liveUrl: 'https://blanja.com/',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%209.png',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%209.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2010.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2011.png'
      ],
      gradient: getRandomGradient(),
      features: [
        'Comprehensive e-commerce marketplace',
        'Multiple payment gateway integrations',
        'Credit card processing system',
        'KAI train ticketing integration',
        'Modular checkout system',
        'Partnership with major banks',
        'Scalable microservices architecture'
      ],
      challenges: [
        'Integrating multiple payment gateways',
        'Building modular and scalable checkout system',
        'Managing high-traffic e-commerce platform',
        'Cross-functional collaboration with multiple teams'
      ],
      learnings: [
        'E-commerce platform development',
        'Payment gateway integration',
        'Microservices architecture',
        'Cross-functional team collaboration'
      ],
      role: 'Software Engineer (Front End Developer)',
      company: 'BLANJA.com',
      duration: 'Nov 2019 - Oct 2020'
    },
    {
      id: '6',
      title: 'Indoesports Media Platform',
      description: 'An esports industry media platform covering tournaments, game information, and business news with full-stack Laravel and React implementation.',
      fullDescription: 'Indoesports operates in the Indonesian esports industry ecosystem with active media products since 2017. Built comprehensive platform featuring UI/UX design, full-stack development with Laravel and React, and YouTube API integration for video content management.',
      techStack: ['Laravel', 'React', 'PHP', 'Adobe XD', 'YouTube API', 'JavaScript'],
      liveUrl: 'https://www.indoesports.com/',
      codeUrl: 'https://github.com/pranahonk/indoesports-laravel',
      openSource: true,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2013.png',
      gradient: getRandomGradient(),
      features: [
        'Esports news and tournament coverage',
        'YouTube API integration for video content',
        'Full-stack Laravel + React architecture',
        'RESTful API design and implementation',
        'Adobe XD prototyping and design',
        'Responsive web application',
        'Social media integration'
      ],
      challenges: [
        'Creating high-fidelity prototypes with Adobe XD',
        'Integrating third-party YouTube API',
        'Building full-stack Laravel + React solution',
        'Managing complex content management system'
      ],
      learnings: [
        'Full-stack development with Laravel and React',
        'UI/UX design and prototyping',
        'Third-party API integration',
        'RESTful API design patterns'
      ],
      role: 'Full Stack Developer',
      company: 'PT. INDOESPORTS KARYA INDONESIA',
      duration: 'Nov 2018 - Oct 2019'
    },
    {
      id: '7',
      title: 'Compas Business Intelligence',
      description: 'E-commerce market insight platform providing actionable business intelligence tools for strategic decision making.',
      fullDescription: 'Compas is developed by the Telunjuk team, focusing on business intelligence tools for e-commerce market insights. The platform provides actionable insights to empower strategic decisions for online businesses.',
      techStack: ['Vue.js', 'Business Intelligence', 'Data Analytics', 'JavaScript'],
      liveUrl: 'https://compas.co.id/',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%208.png',
      gradient: getRandomGradient(),
      features: [
        'E-commerce market insights',
        'Business intelligence dashboard',
        'Actionable data analytics',
        'Strategic decision support tools',
        'Real-time market data',
        'Comprehensive reporting system',
        'Data visualization components'
      ],
      challenges: [
        'Processing large volumes of market data',
        'Creating intuitive business intelligence dashboard',
        'Implementing real-time data analytics',
        'Designing actionable insight presentations'
      ],
      learnings: [
        'Business intelligence platform development',
        'Data visualization and analytics',
        'Market data processing',
        'Strategic business tool design'
      ],
      role: 'Front End Developer',
      company: 'Telunjuk.com',
      duration: 'Oct 2020 - Feb 2021'
    },
    {
      id: '8',
      title: 'Sakoo Sales Management Platform',
      description: 'A web-based application integrating offline and online sales channels with comprehensive business management features.',
      fullDescription: 'Sakoo is a web-based application that provides and integrates offline and online sales channels to help business owners increase effectiveness and efficiency in selling. Features include stock management, transactions, customer data, and product catalogs.',
      techStack: ['Web Technologies', 'JavaScript', 'Database Management'],
      liveUrl: 'https://app.sakoo.id/login',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2012.png',
      gradient: getRandomGradient(),
      features: [
        'Offline and online sales integration',
        'Stock management system',
        'Transaction processing',
        'Customer data management',
        'Product catalog management',
        'Business efficiency tools',
        'Multi-channel sales support'
      ],
      challenges: [
        'Integrating offline and online sales channels',
        'Building comprehensive inventory management',
        'Creating efficient transaction processing',
        'Designing user-friendly business tools'
      ],
      learnings: [
        'Multi-channel sales platform development',
        'Inventory and stock management systems',
        'Business process automation',
        'Customer relationship management'
      ],
      role: 'Software Developer',
      company: 'Independent Project',
      duration: 'Project Timeline'
    },
    {
      id: '9',
      title: 'Xetia AI Platform',
      description: 'An Artificial Intelligence platform capable of performing various analyses using cutting-edge technology for instant digital activities.',
      fullDescription: 'Xetia is a company with a strong hold in Artificial Intelligence, capable of carrying out various analyses by utilizing the most updated technology to perform all digital activities instantly.',
      techStack: ['AI/ML', 'JavaScript', 'Modern Web Technologies'],
      liveUrl: 'https://xetia.io/',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2017.png',
      gradient: getRandomGradient(),
      features: [
        'Artificial Intelligence analysis tools',
        'Real-time digital activity processing',
        'Advanced analytics platform',
        'Cutting-edge technology integration',
        'Instant data processing',
        'Automated decision making',
        'Scalable AI infrastructure'
      ],
      challenges: [
        'Implementing cutting-edge AI technologies',
        'Creating real-time analysis capabilities',
        'Building scalable AI infrastructure',
        'Ensuring instant processing performance'
      ],
      learnings: [
        'AI/ML platform development',
        'Real-time data processing',
        'Advanced analytics implementation',
        'Cutting-edge technology integration'
      ],
      role: 'AI Platform Developer',
      company: 'Xetia',
      duration: 'Project Timeline'
    },
    {
      id: '10',
      title: 'Brilian Muda Health CMS',
      description: 'A content management system developed for Kalbe Farma in the health sector, providing comprehensive healthcare content management.',
      fullDescription: 'Brilian Muda is a vendor in the health sector. During my time there, I developed a comprehensive Content Management System (CMS) project in collaboration with Kalbe Farma, focusing on healthcare content management and digital health solutions.',
      techStack: ['CMS Development', 'PHP', 'Healthcare Systems'],
      liveUrl: 'https://www.brilianmuda.com/',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2021.png',
      gradient: getRandomGradient(),
      features: [
        'Healthcare content management',
        'Kalbe Farma integration',
        'Medical content organization',
        'User-friendly CMS interface',
        'Healthcare data management',
        'Content workflow automation',
        'Secure health information handling'
      ],
      challenges: [
        'Building healthcare-compliant CMS',
        'Integrating with Kalbe Farma systems',
        'Ensuring medical data security',
        'Creating intuitive content management workflows'
      ],
      learnings: [
        'Healthcare industry requirements',
        'CMS architecture and development',
        'Medical data compliance',
        'Healthcare system integration'
      ],
      role: 'CMS Developer',
      company: 'Brilian Muda',
      duration: 'Project Timeline'
    }
  ];
}
