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

function getPortfolioProjects() {
  return [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with modern UI/UX, payment integration, and admin dashboard for managing products and orders.',
      fullDescription: 'This comprehensive e-commerce platform was built from the ground up to provide a seamless shopping experience for both customers and administrators. The project showcases advanced features including user authentication, product catalog management, shopping cart functionality, secure payment processing, and real-time inventory tracking.',
      techStack: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      liveUrl: 'https://example.com',
      codeUrl: 'https://github.com/example',
      coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
      gradient: 'from-red-400 via-pink-500 to-blue-600',
      features: [
        'User authentication and authorization',
        'Product catalog with search and filtering',
        'Shopping cart and wishlist functionality',
        'Secure payment integration with Stripe',
        'Admin dashboard for inventory management',
        'Order tracking and email notifications',
        'Responsive design for all devices'
      ],
      challenges: [
        'Implementing secure payment processing',
        'Optimizing database queries for large product catalogs',
        'Creating a scalable admin interface',
        'Ensuring mobile responsiveness across all pages'
      ],
      learnings: [
        'Advanced React patterns and state management',
        'Payment gateway integration best practices',
        'Database optimization techniques',
        'E-commerce security considerations'
      ]
    },
    {
      id: '2',
      title: 'Task Management App',
      description: 'A collaborative task management application with real-time updates, team collaboration features, and project tracking.',
      fullDescription: 'A modern task management solution built to enhance team productivity and project coordination. This application features real-time collaboration, intuitive drag-and-drop interfaces, and comprehensive project analytics to help teams stay organized and meet deadlines.',
      techStack: ['Vue.js', 'Express', 'Socket.io', 'PostgreSQL'],
      liveUrl: 'https://example.com',
      codeUrl: 'https://github.com/example',
      coverImage: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
      gradient: 'from-purple-400 via-pink-500 to-red-500',
      features: [
        'Real-time task updates and notifications',
        'Drag-and-drop task organization',
        'Team collaboration and comments',
        'Project progress tracking',
        'Time tracking and reporting',
        'File attachments and sharing',
        'Custom task categories and labels'
      ],
      challenges: [
        'Implementing real-time synchronization',
        'Managing complex state across multiple users',
        'Optimizing performance for large datasets',
        'Creating intuitive user workflows'
      ],
      learnings: [
        'WebSocket implementation with Socket.io',
        'Vue.js composition API patterns',
        'Real-time data synchronization strategies',
        'UX design for productivity applications'
      ]
    },
    {
      id: '3',
      title: 'Weather Dashboard',
      description: 'A responsive weather application with location-based forecasts, interactive maps, and detailed weather analytics.',
      fullDescription: 'An interactive weather dashboard that provides comprehensive weather information with beautiful visualizations. Features location-based forecasts, historical weather data, and interactive maps to help users plan their activities based on weather conditions.',
      techStack: ['JavaScript', 'API Integration', 'Chart.js', 'CSS3'],
      liveUrl: 'https://example.com',
      codeUrl: 'https://github.com/example',
      coverImage: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop',
      gradient: 'from-blue-400 via-purple-500 to-pink-500',
      features: [
        'Location-based weather forecasts',
        'Interactive weather maps',
        'Historical weather data analysis',
        'Weather alerts and notifications',
        'Multiple location tracking',
        'Detailed weather metrics and charts',
        'Responsive design for mobile devices'
      ],
      challenges: [
        'Integrating multiple weather APIs',
        'Creating responsive data visualizations',
        'Handling geolocation and permissions',
        'Optimizing API call frequency'
      ],
      learnings: [
        'Working with multiple external APIs',
        'Data visualization with Chart.js',
        'Geolocation API implementation',
        'Performance optimization techniques'
      ]
    },
    {
      id: '4',
      title: 'Social Media Analytics',
      description: 'A comprehensive analytics dashboard for social media performance tracking with data visualization and reporting features.',
      fullDescription: 'A powerful analytics platform designed to help businesses and content creators understand their social media performance. Features comprehensive data visualization, automated reporting, and actionable insights to improve social media strategy.',
      techStack: ['Python', 'Django', 'D3.js', 'Redis'],
      liveUrl: 'https://example.com',
      codeUrl: 'https://github.com/example',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
      gradient: 'from-green-400 via-blue-500 to-purple-600',
      features: [
        'Multi-platform social media integration',
        'Advanced data visualization with D3.js',
        'Automated report generation',
        'Engagement metrics and trends',
        'Competitor analysis tools',
        'Custom dashboard creation',
        'Export capabilities for presentations'
      ],
      challenges: [
        'Integrating multiple social media APIs',
        'Processing large datasets efficiently',
        'Creating custom data visualizations',
        'Implementing real-time data updates'
      ],
      learnings: [
        'Python data processing techniques',
        'Advanced D3.js visualization patterns',
        'Redis caching strategies',
        'Social media API integration'
      ]
    },
    {
      id: '5',
      title: 'Learning Management System',
      description: 'An educational platform with course management, student progress tracking, and interactive learning modules.',
      fullDescription: 'A comprehensive learning management system designed for modern education needs. Features course creation tools, student progress tracking, interactive assessments, and multimedia content support to create engaging learning experiences.',
      techStack: ['Next.js', 'Prisma', 'TypeScript', 'Tailwind'],
      liveUrl: 'https://example.com',
      codeUrl: 'https://github.com/example',
      coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
      gradient: 'from-yellow-400 via-orange-500 to-red-500',
      features: [
        'Course creation and management',
        'Student progress tracking',
        'Interactive quizzes and assessments',
        'Video content streaming',
        'Discussion forums and messaging',
        'Grade book and reporting',
        'Mobile-responsive learning interface'
      ],
      challenges: [
        'Implementing secure user authentication',
        'Creating scalable video content delivery',
        'Building interactive assessment tools',
        'Optimizing for mobile learning'
      ],
      learnings: [
        'Next.js full-stack development',
        'Prisma ORM for complex data models',
        'TypeScript best practices',
        'Educational technology UX patterns'
      ]
    },
    {
      id: '6',
      title: 'Fitness Tracking App',
      description: 'A mobile-first fitness application with workout tracking, nutrition planning, and progress visualization features.',
      fullDescription: 'A comprehensive fitness companion app designed to help users achieve their health and fitness goals. Features workout tracking, nutrition planning, progress visualization, and social features to keep users motivated and engaged.',
      techStack: ['React Native', 'Firebase', 'Redux', 'Chart.js'],
      liveUrl: 'https://example.com',
      codeUrl: 'https://github.com/example',
      coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      gradient: 'from-indigo-400 via-purple-500 to-pink-500',
      features: [
        'Workout tracking and planning',
        'Nutrition logging and meal planning',
        'Progress visualization and analytics',
        'Social features and challenges',
        'Wearable device integration',
        'Custom workout creation',
        'Offline mode support'
      ],
      challenges: [
        'Implementing offline data synchronization',
        'Creating smooth mobile animations',
        'Integrating with health APIs',
        'Managing complex state in mobile apps'
      ],
      learnings: [
        'React Native development best practices',
        'Mobile app performance optimization',
        'Firebase real-time database usage',
        'Health and fitness app UX design'
      ]
    }
  ];
}