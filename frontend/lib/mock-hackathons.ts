export const HACKATHONS_MOCK_DATA = [
  { 
    id: 'dsuc-hackathon-solana-edu', 
    title: 'DSUC HACKATHON : Education Ecosystem using Solana blockchain', 
    date: 'Jan 15 - Feb 15, 2026', 
    status: 'upcoming',
    participants: 0, // Initial participants
    prizePool: '$25,000 USDC',
    description: 'Build innovative solutions for the education sector leveraging the power of Solana blockchain. Focus on decentralized learning, credentialing, and community building.',
    tags: ['Education', 'Solana', 'DeFi', 'Community'],
    countdown: '03M : 05D : 10H', // Placeholder countdown
    timeline: [
        { id: 1, title: 'Registration Opens', date: 'Jan 01', status: 'pending' },
        { id: 2, title: 'Submission Deadline', date: 'Feb 10', status: 'pending' },
        { id: 3, title: 'Judging & Demo Day', date: 'Feb 15', status: 'pending' },
    ],
    prizes: [
      { rank: '1st Place', reward: '$12,000' },
      { rank: '2nd Place', reward: '$6,000' },
      { rank: '3rd Place', reward: '$3,000' },
      { rank: 'Community Choice', reward: '$2,000' },
      { rank: 'Best UI/UX', reward: '$2,000' },
    ],
    tasks: [
        { id: 1, text: 'Register for the Hackathon', done: false },
        { id: 2, text: 'Join DSUC Discord', done: false },
        { id: 3, text: 'Form a Team', done: false },
    ],
    tracks: [
        { title: 'Decentralized Learning Platforms', icon: 'Book', color: 'text-blue-400', image: 'https://images.unsplash.com/photo-1546410531-bb4696068285?w=800&auto=format&fit=crop' },
        { title: 'Blockchain-based Credentialing', icon: 'ShieldCheck', color: 'text-green-400', image: 'https://images.unsplash.com/photo-1621361284488-82ef10f7639d?w=800&auto=format&fit=crop' },
        { title: 'Educational DAOs & Community Tools', icon: 'Users', color: 'text-purple-400', image: 'https://images.unsplash.com/photo-1552588329-a726715b561c?w=800&auto=format&fit=crop' },
    ],
    leaderboard: [], // Empty initially
    resources: [
      { name: 'Solana Docs', icon: 'Code', link: 'https://docs.solana.com/' },
      { name: 'DSUC Discord', icon: 'MessageSquare', link: 'https://discord.gg/dsuc' },
    ],
    projectTicket: null,
    image_url: 'https://images.unsplash.com/photo-1596495578051-24750d42171f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  
  { 
    id: 'gimmehacks-winter-2025', 
    title: 'GIMMEHACKS Winter Season 2025', 
    date: 'Dec 01 - Dec 30, 2025', 
    status: 'active',
    participants: 342,
    prizePool: '$50,000 USDC',
    description: 'Build the next generation of decentralized applications on Solana. Focus areas include DeFi, NFTs, and Gaming. Participants will have access to exclusive workshops and mentorship from industry leaders.',
    tags: ['DeFi', 'NFT', 'Gaming', 'Solana'],
    countdown: '04D : 12H : 30M',
    timeline: [
        { id: 1, title: 'Registration Opens', date: 'Dec 01', status: 'done' },
        { id: 2, title: 'Team Formation Deadline', date: 'Dec 10', status: 'done' },
        { id: 3, title: 'Project Submission', date: 'Dec 20', status: 'active' },
        { id: 4, title: 'Community Voting', date: 'Dec 25', status: 'pending' },
        { id: 5, title: 'Demo Day & Winners', date: 'Dec 30', status: 'pending' },
    ],
    prizes: [
      { rank: '1st Place', reward: '$20,000' },
      { rank: '2nd Place', reward: '$10,000' },
      { rank: '3rd Place', reward: '$5,000' },
      { rank: 'Honorable Mention', reward: '$2,500' },
      { rank: 'Honorable Mention', reward: '$2,500' },
    ],
    tasks: [
        { id: 1, text: 'Join Discord Server', done: true },
        { id: 2, text: 'Create Team Profile', done: true },
        { id: 3, text: 'Submit Project Proposal', done: false },
        { id: 4, text: 'Upload Demo Video', done: false },
    ],
    tracks: [
        { title: 'DeFi Revolution', reward: '$5,000', icon: 'Zap', color: 'text-yellow-400', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop' },
        { title: 'NFT Utility', reward: '$3,000', icon: 'Disc', color: 'text-purple-400', image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop' },
        { title: 'Gaming & Metaverse', reward: '$4,000', icon: 'Target', color: 'text-green-400', image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&auto=format&fit=crop' },
        { title: 'Social Graph', reward: '$2,000', icon: 'Users', color: 'text-blue-400', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop' },
    ],
    leaderboard: [
        { rank: 1, name: 'Alpha Squad', points: 980 },
        { rank: 2, name: 'BlockBuilders', points: 945 },
        { rank: 3, name: 'ChainReaction', points: 890 },
    ],
    resources: [
      { name: 'API Documentation', icon: 'Github', link: 'https://docs.gimmeidea.xyz/api' },
      { name: 'Mentor Discord', icon: 'MessageSquare', link: 'https://discord.gg/gimmeidea' },
      { name: 'Submission Guide', icon: 'FileText', link: 'https://docs.gimmeidea.xyz/submission' },
    ],
    projectTicket: {
      id: '#8821',
      name: 'Project Alpha',
      team: 'SolanaGods',
      status: 'VERIFIED'
    },
    image_url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  { 
    id: 'gimmehacks-autumn-2025', 
    title: 'GIMMEHACKS Autumn Season 2025', 
    date: 'Sep 01 - Sep 30, 2025', 
    status: 'completed',
    participants: 210,
    prizePool: '$30,000 USDC',
    description: 'Focus on SocialFi and Community building tools. Explore new ways for users to interact and build communities on decentralized networks.',
    tags: ['SocialFi', 'DAO', 'Community'],
    countdown: 'Completed',
    timeline: [
        { id: 1, title: 'Registration Opens', date: 'Sep 01', status: 'done' },
        { id: 2, title: 'Team Formation Deadline', date: 'Sep 10', status: 'done' },
        { id: 3, title: 'Project Submission', date: 'Sep 20', status: 'done' },
        { id: 4, title: 'Community Voting', date: 'Sep 25', status: 'done' },
        { id: 5, title: 'Demo Day & Winners', date: 'Sep 30', status: 'done' },
    ],
    tasks: [],
    tracks: [
        { title: 'Decentralized Social', reward: '$10,000', icon: 'Users', color: 'text-blue-400' },
        { title: 'DAO Tooling', reward: '$10,000', icon: 'ShieldCheck', color: 'text-green-400' },
        { title: 'Community Engagement', reward: '$10,000', icon: 'MessageSquare', color: 'text-purple-400' },
    ],
    leaderboard: [
        { rank: 1, name: 'Community Builders', points: 720 },
        { rank: 2, name: 'Social Connect', points: 680 },
        { rank: 3, name: 'DAO Masters', points: 650 },
    ],
    resources: [
      { name: 'Project Showcase', icon: 'Monitor', link: 'https://gimmeidea.xyz/projects?tag=socialfi' },
      { name: 'Winner Interviews', icon: 'Mic', link: 'https://gimmeidea.xyz/blog/autumn-winners' },
    ],
    projectTicket: null
  },
  { 
    id: 'gimmehacks-summer-2025', 
    title: 'GIMMEHACKS Summer Season 2025', 
    date: 'Jun 01 - Jun 30, 2025', 
    status: 'completed',
    participants: 156,
    prizePool: '$20,000 USDC',
    description: 'Summer heat for blazing fast consumer crypto apps. Build user-friendly applications that bring crypto to the masses.',
    tags: ['Consumer', 'Mobile', 'UX'],
    countdown: 'Completed',
    timeline: [
        { id: 1, title: 'Registration Opens', date: 'Jun 01', status: 'done' },
        { id: 2, title: 'Team Formation Deadline', date: 'Jun 10', status: 'done' },
        { id: 3, title: 'Project Submission', date: 'Jun 20', status: 'done' },
        { id: 4, title: 'Community Voting', date: 'Jun 25', status: 'done' },
        { id: 5, title: 'Demo Day & Winners', date: 'Jun 30', status: 'done' },
    ],
    tasks: [],
    tracks: [
        { title: 'Mobile dApps', reward: '$10,000', icon: 'Smartphone', color: 'text-green-400' },
        { title: 'User Onboarding', reward: '$5,000', icon: 'UserPlus', color: 'text-blue-400' },
        { title: 'Cross-chain UX', reward: '$5,000', icon: 'RefreshCw', color: 'text-purple-400' },
    ],
    leaderboard: [
        { rank: 1, name: 'Mobile First', points: 550 },
        { rank: 2, name: 'Easy Crypto', points: 510 },
        { rank: 3, name: 'Smooth Sailing', points: 480 },
    ],
    resources: [
      { name: 'Design Principles', icon: 'SwatchBook', link: 'https://gimmeidea.xyz/design-guide' },
      { name: 'Developer Tools', icon: 'Code', link: 'https://docs.gimmeidea.xyz/dev-tools' },
    ],
    projectTicket: null
  },
];