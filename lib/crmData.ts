import { Account } from './crmTypes';

export const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Meridian Financial Group',
    industry: 'Banking & Finance',
    segment: 'Enterprise',
    description: 'A leading financial services conglomerate with operations across 14 countries. Their digital transformation initiative is the primary opportunity — they are modernizing core banking infrastructure and replacing legacy systems. Key decision-making sits with the CTO office and the Chief Digital Officer. Relationship with the procurement head is strong but the technical evaluators are still warming up.',
    website: 'meridianfg.com',
    location: 'Mumbai, India',
    owner: 'Priya Nair',
    stakeholders: [
      { id: 's1', name: 'Arjun Kapoor', role: 'Chief Digital Officer', email: 'a.kapoor@meridianfg.com', phone: '+91 98200 11234', isPrimary: true, notes: 'Final budget approver. Prefers executive briefings on Fridays.' },
      { id: 's2', name: 'Sunita Rao', role: 'VP Engineering', email: 's.rao@meridianfg.com', phone: '+91 98200 55678', notes: 'Technical champion. Very detail-oriented, send deep-dive docs.' },
      { id: 's3', name: 'Rahul Mehta', role: 'Head of Procurement', email: 'r.mehta@meridianfg.com', isPrimary: false, notes: 'Drives vendor selection process. Friendly — knows Priya from a previous engagement.' },
    ],
    pastProjects: [
      { id: 'pp1', name: 'AML Compliance Platform', year: 2022, revenue: 4800000, status: 'Completed', description: 'Built anti-money laundering detection pipeline for retail banking division.' },
      { id: 'pp2', name: 'Data Lake Migration', year: 2023, revenue: 2200000, status: 'Completed', description: 'Migrated 8 years of transaction data to cloud-native data lake.' },
      { id: 'pp3', name: 'Real-time Fraud Detection PoC', year: 2024, revenue: 350000, status: 'Completed', description: 'Proof-of-concept for ML-based card fraud detection.' },
    ],
    opportunities: [
      { id: 'opp1', name: 'Core Banking Modernization', value: 12000000, stage: 'Proposal', closeDate: '2026-09-30', probability: 45, description: 'Full rip-and-replace of their 20-year-old core banking system. 3-year engagement.' },
      { id: 'opp2', name: 'Customer Data Platform', value: 3500000, stage: 'Qualified', closeDate: '2026-07-15', probability: 65, description: 'Unified CDP to consolidate customer data from 6 business units.' },
    ],
    tasks: [
      { id: 't1', title: 'Send RFP response for Core Banking', status: 'In progress', priority: 'Critical', dueDate: '2026-06-20', assignee: 'Priya Nair', opportunityId: 'opp1', createdAt: 1718000000000, comments: [] },
      { id: 't2', title: 'Schedule executive briefing with Arjun Kapoor', status: 'To do', priority: 'High', dueDate: '2026-06-17', assignee: 'Priya Nair', createdAt: 1718001000000, comments: [] },
      { id: 't3', title: 'Share CDP case studies with Sunita Rao', status: 'Done', priority: 'Medium', dueDate: '2026-06-10', assignee: 'Dev Sharma', opportunityId: 'opp2', createdAt: 1717900000000, comments: [] },
      { id: 't4', title: 'Align on contract terms with Rahul Mehta', status: 'To do', priority: 'High', dueDate: '2026-07-01', assignee: 'Priya Nair', opportunityId: 'opp1', createdAt: 1718002000000, comments: [] },
      { id: 't5', title: 'QBR preparation — Q2 business review deck', status: 'To do', priority: 'Medium', dueDate: '2026-06-25', assignee: 'Dev Sharma', createdAt: 1718003000000, comments: [] },
    ],
    createdAt: 1700000000000,
  },
  {
    id: 'acc-2',
    name: 'NovaTech Logistics',
    industry: 'Supply Chain & Logistics',
    segment: 'Mid-Market',
    description: 'A fast-growing third-party logistics player that has expanded from regional to pan-India operations in 3 years. They are investing heavily in warehouse automation and route optimization. The founding team is still hands-on in decisions — the CEO doubles as the product sponsor. They tend to move fast but need strong hand-holding on technical scoping. Budget cycles run April–March.',
    website: 'novatechlog.in',
    location: 'Bengaluru, India',
    owner: 'Dev Sharma',
    stakeholders: [
      { id: 's4', name: 'Meera Iyer', role: 'CEO & Co-founder', email: 'm.iyer@novatechlog.in', isPrimary: true, notes: 'Visionary, moves fast. Responds well to ROI framing. Dislikes long email threads.' },
      { id: 's5', name: 'Vikram Bhat', role: 'CTO', email: 'v.bhat@novatechlog.in', phone: '+91 99001 77890', notes: 'Strong engineering background. Will scrutinize architecture proposals closely.' },
      { id: 's6', name: 'Ananya Singh', role: 'Head of Operations', email: 'a.singh@novatechlog.in', notes: 'Day-to-day sponsor for the warehouse project. Very responsive on WhatsApp.' },
    ],
    pastProjects: [
      { id: 'pp4', name: 'Route Optimization Engine v1', year: 2023, revenue: 900000, status: 'Completed', description: 'Built ML-powered route optimization reducing delivery cost by 18%.' },
      { id: 'pp5', name: 'Warehouse Management System', year: 2024, revenue: 1400000, status: 'Ongoing', description: 'Custom WMS for 3 fulfillment centers, currently in Phase 2.' },
    ],
    opportunities: [
      { id: 'opp3', name: 'Warehouse Automation — Phase 3', value: 2800000, stage: 'Negotiation', closeDate: '2026-06-30', probability: 75, description: 'Expand WMS to 5 new fulfillment centers with robotics integration.' },
      { id: 'opp4', name: 'Real-time Tracking Platform', value: 1100000, stage: 'Prospecting', closeDate: '2026-10-31', probability: 30, description: 'End-to-end shipment visibility platform for enterprise customers.' },
    ],
    tasks: [
      { id: 't6', title: 'Finalize SOW for Phase 3', status: 'In progress', priority: 'Critical', dueDate: '2026-06-18', assignee: 'Dev Sharma', opportunityId: 'opp3', createdAt: 1718010000000, comments: [] },
      { id: 't7', title: 'Demo real-time tracking prototype to Meera', status: 'To do', priority: 'High', dueDate: '2026-07-05', assignee: 'Dev Sharma', opportunityId: 'opp4', createdAt: 1718011000000, comments: [] },
      { id: 't8', title: 'Resolve Phase 2 WMS bugs before new contract sign', status: 'Blocked', priority: 'Critical', dueDate: '2026-06-15', assignee: 'Tech Team', createdAt: 1718012000000, comments: [] },
      { id: 't9', title: 'Send invoice for WMS Phase 2 milestone 3', status: 'Done', priority: 'Low', dueDate: '2026-06-05', assignee: 'Finance', createdAt: 1717800000000, comments: [] },
    ],
    createdAt: 1705000000000,
  },
  {
    id: 'acc-3',
    name: 'Cerulean Healthcare',
    industry: 'Healthcare & Life Sciences',
    segment: 'Enterprise',
    description: 'A hospital network operating 28 hospitals and 120+ clinics across Tier 1 and Tier 2 cities. Under new CISO-led mandate to overhaul digital health infrastructure by FY27. The main challenge is navigating a complex internal politics between the IT team (conservative) and clinical operations (pro-innovation). Compliance with DPDP Act 2023 is a key driver for all tech decisions.',
    website: 'ceruleanhc.in',
    location: 'Delhi NCR, India',
    owner: 'Tanvi Kapila',
    stakeholders: [
      { id: 's7', name: 'Dr. Rohan Verma', role: 'Chief Medical Officer', email: 'r.verma@ceruleanhc.in', isPrimary: true, notes: 'Clinical outcomes are his north star. Frame everything around patient impact.' },
      { id: 's8', name: 'Simran Joshi', role: 'CISO', email: 's.joshi@ceruleanhc.in', phone: '+91 98111 34567', notes: 'Controls all vendor security assessments. Very thorough — expect 4-6 week infosec review.' },
      { id: 's9', name: 'Arun Pillai', role: 'VP IT Infrastructure', email: 'a.pillai@ceruleanhc.in', notes: 'Skeptical of vendors. Needs proof-of-concept before any commitment. Warm up slowly.' },
    ],
    pastProjects: [
      { id: 'pp6', name: 'Patient Data Interoperability', year: 2021, revenue: 3200000, status: 'Completed', description: 'HL7/FHIR-based integration across 10 hospital systems.' },
      { id: 'pp7', name: 'Telemedicine Platform', year: 2022, revenue: 1800000, status: 'Completed', description: 'White-label teleconsultation app with 500k+ registered users.' },
    ],
    opportunities: [
      { id: 'opp5', name: 'Clinical Data Platform', value: 7500000, stage: 'Qualified', closeDate: '2026-11-30', probability: 40, description: 'Unified clinical data repository with AI-powered analytics for 28 hospitals.' },
      { id: 'opp6', name: 'DPDP Compliance Suite', value: 1200000, stage: 'Proposal', closeDate: '2026-07-31', probability: 70, description: 'End-to-end data privacy compliance tooling for patient records.' },
    ],
    tasks: [
      { id: 't10', title: 'Complete security questionnaire from Simran Joshi', status: 'In progress', priority: 'High', dueDate: '2026-06-19', assignee: 'Tanvi Kapila', opportunityId: 'opp6', createdAt: 1718020000000, comments: [] },
      { id: 't11', title: 'Draft DPDP compliance proposal', status: 'Done', priority: 'High', dueDate: '2026-06-12', assignee: 'Tanvi Kapila', opportunityId: 'opp6', createdAt: 1718021000000, comments: [] },
      { id: 't12', title: 'Set up PoC environment for Arun Pillai', status: 'To do', priority: 'Medium', dueDate: '2026-07-10', assignee: 'Tech Team', opportunityId: 'opp5', createdAt: 1718022000000, comments: [] },
      { id: 't13', title: 'Introduce Dr. Verma to our CMO — build exec relationship', status: 'To do', priority: 'Low', dueDate: '2026-06-30', assignee: 'Tanvi Kapila', createdAt: 1718023000000, comments: [] },
    ],
    createdAt: 1710000000000,
  },
  {
    id: 'acc-4',
    name: 'Starforge Media',
    industry: 'Media & Entertainment',
    segment: 'SMB',
    description: 'An independent digital content studio producing OTT content and brand videos. Rapidly scaling from 40 to 120 employees this year. Their pain points are fragmented post-production workflows and growing infrastructure costs. Budget is tight but they move quickly when they see a demo that clicks. The founding CTO writes the checks himself — no lengthy procurement cycles.',
    website: 'stargforgemedia.com',
    location: 'Mumbai, India',
    owner: 'Priya Nair',
    stakeholders: [
      { id: 's10', name: 'Kabir Malhotra', role: 'CTO & Co-founder', email: 'kabir@starforgemedia.com', phone: '+91 90000 12345', isPrimary: true, notes: 'Technical and decisive. A quick 30-min Zoom can close a deal.' },
      { id: 's11', name: 'Zara Khan', role: 'Head of Post Production', email: 'zara@starforgemedia.com', notes: 'End user and internal champion. She brings the business case to Kabir.' },
    ],
    pastProjects: [
      { id: 'pp8', name: 'Cloud Render Pipeline', year: 2024, revenue: 280000, status: 'Completed', description: 'Migrated on-prem render farm to cloud-based pipeline.' },
    ],
    opportunities: [
      { id: 'opp7', name: 'Unified Media Asset Management', value: 450000, stage: 'Negotiation', closeDate: '2026-06-30', probability: 80, description: 'MAM system to centralize post-production assets across 3 studios.' },
    ],
    tasks: [
      { id: 't14', title: 'Get signed MSA from Kabir', status: 'In progress', priority: 'Critical', dueDate: '2026-06-16', assignee: 'Priya Nair', opportunityId: 'opp7', createdAt: 1718030000000, comments: [] },
      { id: 't15', title: 'Coordinate onboarding timeline with Zara', status: 'To do', priority: 'Medium', dueDate: '2026-06-22', assignee: 'Dev Sharma', opportunityId: 'opp7', createdAt: 1718031000000, comments: [] },
    ],
    createdAt: 1715000000000,
  },
];
