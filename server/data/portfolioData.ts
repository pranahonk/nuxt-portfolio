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

export function getPortfolioProjects() {
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
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%201.png',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%201.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%202.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%203.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%204.png'
      ],
      gradient: getRandomGradient(),
      features: [
        'Secure login with device fingerprinting',
        'Comprehensive merchant onboarding',
        'BoostTempo credit system integration',
        'Multi-step form workflows',
        'Order management dashboard',
        'Promotional campaign tools',
        'Mobile-responsive design',
        'Real-time data synchronization'
      ],
      challenges: [
        'Implementing device fingerprinting security',
        'Building complex multi-step forms',
        'Integrating multiple payment systems',
        'Creating responsive mobile-first design'
      ],
      learnings: [
        'Advanced React patterns and hooks',
        'Redux Toolkit for state management',
        'Mobile-first responsive design',
        'API integration best practices'
      ],
      role: 'Frontend Developer',
      company: 'MyBoost',
      duration: 'Aug 2022 - Oct 2023'
    },
    {
      id: '3',
      title: 'Alkitab: Offline Indonesian Bible App',
      description: 'A comprehensive offline Bible application for Indonesian users, featuring multiple translations, search functionality, and reading plans.',
      fullDescription: 'Developed a feature-rich offline Bible application specifically designed for Indonesian users. The app includes multiple Bible translations, advanced search capabilities, reading plans, bookmarking system, and note-taking features. Built with a focus on offline functionality and user experience.',
      techStack: ['React Native', 'SQLite', 'AsyncStorage', 'Native Modules'],
      liveUrl: 'https://play.google.com/store/apps/details?id=com.alkitab.offline',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%205.png',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%205.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%206.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%207.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%208.png'
      ],
      gradient: getRandomGradient(),
      features: [
        'Multiple Indonesian Bible translations',
        'Advanced search functionality',
        'Reading plans and schedules',
        'Bookmarking and note-taking',
        'Offline functionality',
        'Dark/light theme support',
        'Font size customization',
        'Cross-reference system'
      ],
      challenges: [
        'Implementing efficient offline data storage',
        'Creating fast text search algorithms',
        'Building intuitive reading interface',
        'Optimizing app performance for older devices'
      ],
      learnings: [
        'React Native mobile development',
        'SQLite database optimization',
        'Offline-first application architecture',
        'Mobile UI/UX best practices'
      ],
      role: 'Mobile App Developer',
      company: 'Independent Project',
      duration: 'Jan 2021 - Dec 2021'
    },
    {
      id: '4',
      title: 'Rplus Inventory Management System',
      description: 'A comprehensive inventory management system for retail businesses, featuring real-time stock tracking, automated reordering, and detailed analytics.',
      fullDescription: 'Developed a robust inventory management system designed for retail businesses. The system provides real-time stock tracking, automated reordering capabilities, supplier management, and comprehensive analytics dashboard. Built with scalability and ease of use in mind.',
      techStack: ['Laravel', 'Vue.js', 'MySQL', 'Redis', 'Chart.js'],
      liveUrl: 'https://rplus-inventory.com',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/rplus.jpg',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/rplus.jpg'
      ],
      gradient: getRandomGradient(),
      features: [
        'Real-time inventory tracking',
        'Automated reordering system',
        'Supplier management',
        'Analytics dashboard',
        'Barcode scanning integration',
        'Multi-location support',
        'Report generation',
        'User role management'
      ],
      challenges: [
        'Building real-time inventory updates',
        'Creating complex analytics dashboard',
        'Implementing automated reordering logic',
        'Ensuring data consistency across locations'
      ],
      learnings: [
        'Laravel framework mastery',
        'Real-time data synchronization',
        'Complex business logic implementation',
        'Database optimization techniques'
      ],
      role: 'Full Stack Developer',
      company: 'Rplus Solutions',
      duration: 'Mar 2020 - Dec 2020'
    },
    {
      id: '5',
      title: 'E-Commerce Platform',
      description: 'A modern e-commerce platform with advanced features including multi-vendor support, payment integration, and comprehensive admin dashboard.',
      fullDescription: 'Built a comprehensive e-commerce platform supporting multiple vendors, integrated payment systems, inventory management, and detailed analytics. The platform includes customer management, order processing, and a powerful admin dashboard for business insights.',
      techStack: ['Node.js', 'Express', 'MongoDB', 'React', 'Stripe API'],
      liveUrl: 'https://ecommerce-demo.com',
      codeUrl: 'https://github.com/example',
      openSource: true,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%209.png',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%209.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2010.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2011.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2012.png'
      ],
      gradient: getRandomGradient(),
      features: [
        'Multi-vendor marketplace',
        'Integrated payment processing',
        'Advanced product catalog',
        'Order management system',
        'Customer reviews and ratings',
        'Inventory tracking',
        'Analytics dashboard',
        'Mobile-responsive design'
      ],
      challenges: [
        'Building scalable multi-vendor architecture',
        'Implementing secure payment processing',
        'Creating efficient search and filtering',
        'Ensuring platform security and compliance'
      ],
      learnings: [
        'Full-stack JavaScript development',
        'Payment gateway integration',
        'Scalable application architecture',
        'E-commerce business logic'
      ],
      role: 'Full Stack Developer',
      company: 'Independent Project',
      duration: 'Jun 2019 - Feb 2020'
    },
    {
      id: '6',
      title: 'Task Management Application',
      description: 'A collaborative task management application with real-time updates, team collaboration features, and project tracking capabilities.',
      fullDescription: 'Developed a comprehensive task management application designed for team collaboration. Features include real-time updates, project organization, task assignment, progress tracking, and team communication tools. Built with modern web technologies for optimal performance.',
      techStack: ['React', 'Node.js', 'Socket.io', 'PostgreSQL', 'Material-UI'],
      liveUrl: 'https://taskmanager-demo.com',
      codeUrl: 'https://github.com/example',
      openSource: true,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2013.png',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2013.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2014.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2015.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2016.png'
      ],
      gradient: getRandomGradient(),
      features: [
        'Real-time collaboration',
        'Project organization',
        'Task assignment and tracking',
        'Team communication tools',
        'Progress visualization',
        'Deadline management',
        'File sharing capabilities',
        'Activity timeline'
      ],
      challenges: [
        'Implementing real-time synchronization',
        'Building intuitive user interface',
        'Creating efficient notification system',
        'Ensuring data consistency across users'
      ],
      learnings: [
        'Real-time web application development',
        'WebSocket implementation with Socket.io',
        'Collaborative software design patterns',
        'User experience optimization'
      ],
      role: 'Full Stack Developer',
      company: 'Independent Project',
      duration: 'Sep 2018 - May 2019'
    },
    {
      id: '7',
      title: 'Social Media Dashboard',
      description: 'A comprehensive social media management dashboard for businesses to manage multiple platforms, schedule posts, and analyze engagement metrics.',
      fullDescription: 'Created a powerful social media management tool that allows businesses to manage multiple social media accounts from a single dashboard. Features include post scheduling, engagement analytics, content calendar, and team collaboration tools.',
      techStack: ['Vue.js', 'Laravel', 'MySQL', 'Redis', 'Social Media APIs'],
      liveUrl: 'https://socialdash-demo.com',
      codeUrl: 'https://github.com/example',
      openSource: false,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_20221031_092647.jpg',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_20221031_092647.jpg'
      ],
      gradient: getRandomGradient(),
      features: [
        'Multi-platform social media management',
        'Post scheduling and automation',
        'Engagement analytics and reporting',
        'Content calendar visualization',
        'Team collaboration tools',
        'Hashtag research and suggestions',
        'Performance tracking',
        'Custom reporting dashboard'
      ],
      challenges: [
        'Integrating multiple social media APIs',
        'Building complex scheduling system',
        'Creating comprehensive analytics dashboard',
        'Handling rate limits and API restrictions'
      ],
      learnings: [
        'Social media API integration',
        'Complex scheduling algorithms',
        'Data visualization techniques',
        'Third-party service integration'
      ],
      role: 'Full Stack Developer',
      company: 'Independent Project',
      duration: 'Jan 2018 - Aug 2018'
    },
    {
      id: '8',
      title: 'Point of Sale System',
      description: 'A modern point of sale system for retail businesses, featuring inventory management, sales tracking, and customer relationship management.',
      fullDescription: 'Developed a comprehensive point of sale system designed for retail businesses. The system integrates inventory management, sales processing, customer data management, and business analytics in a user-friendly interface.',
      techStack: ['Electron', 'React', 'SQLite', 'Node.js', 'Thermal Printer API'],
      liveUrl: 'https://pos-system-demo.com',
      codeUrl: 'https://github.com/example',
      openSource: true,
      coverImage: 'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_2022_1110_150947.jpg',
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Screenshot_2022_1110_150947.jpg'
      ],
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
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2017.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2018.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2019.png',
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2020.png'
      ],
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
      images: [
        'https://raw.githubusercontent.com/pranahonk/ImagesCDN/master/Untitled%2021.png'
      ],
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

export function getProjectById(id: string) {
  const projects = getPortfolioProjects();
  return projects.find(project => project.id === id);
}
