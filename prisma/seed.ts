import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data…');
  await prisma.pastProject.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();

  // Config
  await prisma.config.upsert({ where:{key:'industries'}, update:{values:['Banking & Finance','Supply Chain & Logistics','Healthcare & Life Sciences','Media & Entertainment','Technology','Manufacturing','Retail','Real Estate','Education','Government','Telecom','Energy']}, create:{key:'industries',values:['Banking & Finance','Supply Chain & Logistics','Healthcare & Life Sciences','Media & Entertainment','Technology','Manufacturing','Retail','Real Estate','Education','Government','Telecom','Energy']} });
  await prisma.config.upsert({ where:{key:'teamMembers'}, update:{values:['Priya Nair','Dev Sharma','Tanvi Kapila','Rohan Mehta','Sneha Iyer','Tech Team','Finance']}, create:{key:'teamMembers',values:['Priya Nair','Dev Sharma','Tanvi Kapila','Rohan Mehta','Sneha Iyer','Tech Team','Finance']} });
  await prisma.config.upsert({ where:{key:'oppStages'}, update:{values:['Prospecting','Qualified','Proposal','Negotiation','Closed Won','Closed Lost']}, create:{key:'oppStages',values:['Prospecting','Qualified','Proposal','Negotiation','Closed Won','Closed Lost']} });
  await prisma.config.upsert({ where:{key:'accountGroups'}, update:{values:['Tata Group','Reliance Group','Adani Group','Public Sector']}, create:{key:'accountGroups',values:['Tata Group','Reliance Group','Adani Group','Public Sector']} });

  console.log('Seeding accounts…');

  // ── 1. Tata Steel ──────────────────────────────────────────────
  await prisma.account.create({ data: {
    name: 'Tata Steel Limited', industry: 'Manufacturing', segment: 'Enterprise',
    owner: 'Priya Nair', location: 'Mumbai, Maharashtra', website: 'tatasteel.com',
    group: 'Tata Group',
    description: "India's largest integrated steel manufacturer. Key stakeholder is VP of Digital Transformation. Decision cycle ~3 months. Budget cycle resets in Q2.",
    contacts: { create: [
      { name:'Rajiv Mehta', role:'VP Digital Transformation', email:'r.mehta@tatasteel.com', phone:'+91 98765 43210', whatsapp:true, isPrimary:true, notes:'Prefers morning calls before 10am. Very analytical, wants data-driven proposals.' },
      { name:'Sunita Rao', role:'IT Director', email:'s.rao@tatasteel.com', phone:'+91 87654 32109', whatsapp:false, isPrimary:false, notes:'Technical gatekeeper. Needs to sign off on architecture before Rajiv.' },
      { name:'Arjun Tata', role:'CFO', email:'a.tata@tatasteel.com', phone:'+91 76543 21098', whatsapp:true, isPrimary:false, notes:'Final budget approver. Only meets for deals above ₹2Cr.' },
    ]},
    tasks: { create: [
      { title:'Send proposal for AI analytics platform', description:'Prepare executive deck with ROI model and send via email. Include 3 case studies from manufacturing sector.', priority:'Critical', status:'In progress', dueDate: new Date('2026-06-20'), assignee:'Priya Nair', category:'Proposal', comments:['Draft sent to Tanvi for review','Feedback incorporated — revised deck ready'] },
      { title:'Schedule QBR meeting with Rajiv', description:'Quarterly business review — Q2 results and roadmap for H2', priority:'High', status:'To do', dueDate: new Date('2026-06-28'), assignee:'Dev Sharma', category:'Meeting', comments:[] },
      { title:'Follow up on POC results', priority:'Medium', status:'Done', dueDate: new Date('2026-06-05'), assignee:'Priya Nair', category:'Follow-up', comments:['POC results positive — 22% efficiency gain reported','Rajiv shared results with his CTO','CTO wants to see scale proposal'] },
      { title:'Negotiate SLA terms with legal', description:'Legal flagged clause 7.3 on uptime guarantees. Need to align with our standard 99.5% SLA.', priority:'High', status:'In progress', dueDate: new Date('2026-06-25'), assignee:'Tanvi Kapila', category:'Legal', comments:['Sent revised terms','Legal counter-proposed 99.7% — checking feasibility with Tech Team'] },
      { title:'Set up sandbox environment for demo', priority:'Medium', status:'Done', dueDate: new Date('2026-06-10'), assignee:'Tech Team', category:'Demo', comments:['Sandbox ready with 6 months of historical data loaded'] },
      { title:'Collect testimonial from Rajiv post-POC', priority:'Low', status:'To do', dueDate: new Date('2026-07-15'), assignee:'Priya Nair', category:'Follow-up', comments:[] },
    ]},
    opportunities: { create: [
      { title:'AI Analytics Platform', stage:'Proposal', value:4500000, probability:60, closeDate: new Date('2026-08-31'), notes:'Strong interest from VP. Competing with SAP offer — our edge is faster deployment and lower TCO.' },
      { title:'ERP Integration Middleware', stage:'Qualified', value:2200000, probability:40, closeDate: new Date('2026-10-15'), notes:'Awaiting budget approval from CFO. Blocked till Q3 budget unlock.' },
      { title:'Predictive Maintenance Suite', stage:'Prospecting', value:1800000, probability:20, closeDate: new Date('2026-12-31'), notes:'Early conversations with plant managers. Not yet escalated to IT.' },
    ]},
    pastProjects: { create: [
      { name:'Steel 4.0 Digital Twin Pilot', revenue:1800000, year:2024, description:'Digital twin for blast furnaces — 14% energy savings achieved.' },
      { name:'Supply Chain Visibility Dashboard', revenue:950000, year:2023, description:'Real-time supply chain tracking across 12 plants and 40+ logistics partners.' },
      { name:'Quality Control ML Model', revenue:620000, year:2022, description:'Vision-based defect detection on rolling mills — reduced scrap rate by 8%.' },
    ]},
  }});

  // ── 2. TCS ─────────────────────────────────────────────────────
  await prisma.account.create({ data: {
    name: 'Tata Consultancy Services', industry: 'Technology', segment: 'Enterprise',
    owner: 'Dev Sharma', location: 'Bangalore, Karnataka', website: 'tcs.com',
    group: 'Tata Group',
    description: 'Global IT services giant. Multiple business units. Key contact in the Digital Initiatives group. TCS is also a potential reseller partner for Southeast Asia deals.',
    contacts: { create: [
      { name:'Ananya Singh', role:'Global Head of Procurement', email:'a.singh@tcs.com', phone:'+91 76543 21098', whatsapp:true, isPrimary:true, notes:'Very process-oriented. Always asks for references. Responds quickly on WhatsApp.' },
      { name:'Vikram Iyer', role:'Head of Digital Initiatives', email:'v.iyer@tcs.com', phone:'+91 65432 10987', whatsapp:false, isPrimary:false, notes:'Champion within TCS. We should loop him into all technical conversations.' },
      { name:'Pooja Nambiar', role:'Chief Data Officer', email:'p.nambiar@tcs.com', phone:'+91 54321 09876', whatsapp:true, isPrimary:false, notes:'New CDO as of Jan 2026. Very interested in data mesh architecture.' },
    ]},
    tasks: { create: [
      { title:'Legal review of Master Service Agreement', description:'Get legal to review MSA draft — focus on IP ownership clause and exit provisions', priority:'High', status:'In progress', dueDate: new Date('2026-06-18'), assignee:'Dev Sharma', category:'Legal', comments:['Sent to legal team on June 10','Legal responded — 3 clauses need revision','Counter-draft sent back to TCS'] },
      { title:'Product demo for TCS Digital team', description:'Demo of Analytics-as-a-Service platform. Audience: 12 people including CDO.', priority:'Medium', status:'To do', dueDate: new Date('2026-07-02'), assignee:'Tanvi Kapila', category:'Demo', comments:[] },
      { title:'Discuss reseller partnership structure', description:'TCS expressed interest in white-labelling our platform for APAC clients', priority:'High', status:'To do', dueDate: new Date('2026-07-10'), assignee:'Dev Sharma', category:'Meeting', comments:[] },
      { title:'Send pricing sheet for Analytics-as-a-Service', priority:'Critical', status:'Done', dueDate: new Date('2026-06-08'), assignee:'Dev Sharma', category:'Proposal', comments:['Sent enterprise pricing with 3 tiers','TCS requested volume discount for 500+ user tier'] },
      { title:'Reference call with Tata Steel team', description:'Arrange for TCS to speak with Rajiv Mehta about our AI platform', priority:'Medium', status:'To do', dueDate: new Date('2026-07-05'), assignee:'Priya Nair', category:'Follow-up', comments:[] },
    ]},
    opportunities: { create: [
      { title:'Analytics-as-a-Service (AaaS)', stage:'Negotiation', value:12000000, probability:75, closeDate: new Date('2026-07-31'), notes:'In final pricing negotiation. TCS wants 18-month lock-in at 15% discount. We can offer 12%.' },
      { title:'APAC Reseller Partnership', stage:'Qualified', value:8500000, probability:45, closeDate: new Date('2026-10-31'), notes:'Early stage. TCS wants to evaluate one quarter of co-selling first.' },
    ]},
    pastProjects: { create: [
      { name:'Data Lakehouse Migration', revenue:3400000, year:2024, description:'Migrated 3 legacy data warehouses to unified lakehouse architecture. 40% query speed improvement.' },
      { name:'Real-time BI Platform', revenue:2100000, year:2023, description:'Built real-time dashboards for 3 TCS business units. 800+ active daily users.' },
    ]},
  }});

  // ── 3. Infosys ─────────────────────────────────────────────────
  await prisma.account.create({ data: {
    name: 'Infosys Limited', industry: 'Technology', segment: 'Enterprise',
    owner: 'Tanvi Kapila', location: 'Pune, Maharashtra', website: 'infosys.com',
    description: 'Tier-1 IT services. Focus on Infosys Cobalt cloud division. Long sales cycle (9-12 months). RFP process is mandatory for all deals above ₹50L.',
    contacts: { create: [
      { name:'Kiran Bose', role:'Cloud Procurement Lead', email:'k.bose@infosys.com', phone:'+91 65432 10987', whatsapp:false, isPrimary:true, notes:'Prefers email. Very detail-oriented — always reads every line of proposals.' },
      { name:'Meera Joshi', role:'SVP Cloud Services', email:'m.joshi@infosys.com', phone:'+91 54321 09876', whatsapp:true, isPrimary:false, notes:'Executive sponsor. Hard to reach but very influential. Best approached at industry events.' },
      { name:'Suresh Pillai', role:'Enterprise Architect', email:'s.pillai@infosys.com', phone:'+91 43210 98765', whatsapp:true, isPrimary:false, notes:'Technical evaluator for RFPs. Prefers open-source compatible solutions.' },
    ]},
    tasks: { create: [
      { title:'RFP response — Cloud Observability Suite', description:'Full written response to Infosys RFP #2026-CO-004. 40-page document required.', priority:'Critical', status:'In progress', dueDate: new Date('2026-06-22'), assignee:'Tanvi Kapila', category:'Proposal', comments:['Section 1-3 complete','Technical sections assigned to Suresh review','Awaiting pricing sign-off from Finance'] },
      { title:'Meet Suresh Pillai — architecture walkthrough', description:'30-min technical call to walk through our observability stack. He wants to see OTel compatibility.', priority:'High', status:'To do', dueDate: new Date('2026-06-19'), assignee:'Tech Team', category:'Meeting', comments:[] },
      { title:'Competitive analysis — vs Datadog', description:'Infosys shortlisted us and Datadog. Need clear competitive positioning doc.', priority:'High', status:'Done', dueDate: new Date('2026-06-12'), assignee:'Tanvi Kapila', category:'Proposal', comments:['Completed 4-page comparison','Price advantage is our strongest differentiator — 38% lower TCO'] },
      { title:'Follow up on RFP submission', priority:'Medium', status:'To do', dueDate: new Date('2026-06-30'), assignee:'Tanvi Kapila', category:'Follow-up', comments:[] },
      { title:'Schedule executive briefing with Meera Joshi', description:'Try to get 30 mins with SVP before RFP decision. Warm intro through mutual contact at NASSCOM.', priority:'Low', status:'Blocked', dueDate: new Date('2026-07-05'), assignee:'Dev Sharma', category:'Meeting', comments:['NASSCOM contact not responding','Trying alternate route via LinkedIn'] },
    ]},
    opportunities: { create: [
      { title:'Cloud Observability Suite', stage:'Proposal', value:8000000, probability:35, closeDate: new Date('2026-09-30'), notes:'RFP response in progress. Decision expected by end of July. Long shortlist — 4 vendors.' },
      { title:'DataOps Platform Pilot', stage:'Prospecting', value:1200000, probability:15, closeDate: new Date('2026-12-31'), notes:'Meera mentioned this in passing. Not officially scoped yet.' },
    ]},
    pastProjects: { create: [
      { name:'APM Proof of Concept', revenue:180000, year:2025, description:'3-month paid POC for application performance monitoring. Strong results but deal stalled post-POC.' },
    ]},
  }});

  // ── 4. Reliance Retail ─────────────────────────────────────────
  await prisma.account.create({ data: {
    name: 'Reliance Retail Ventures', industry: 'Retail', segment: 'Mid-Market',
    owner: 'Priya Nair', location: 'Delhi, NCR', website: 'relianceretail.com',
    group: 'Reliance Group',
    description: "Fastest growing retail chain in India. 2,000+ stores. Interested in customer analytics and loyalty platform integration. Seasonal budget peaks in Oct-Nov ahead of Diwali campaigns.",
    contacts: { create: [
      { name:'Deepak Verma', role:'Head of Analytics', email:'d.verma@relianceretail.com', phone:'+91 43210 98765', whatsapp:true, isPrimary:true, notes:'Very data-savvy. Loves dashboards. Prefers to test things himself before presenting to leadership.' },
      { name:'Ritu Sharma', role:'VP Marketing', email:'r.sharma@relianceretail.com', phone:'+91 32109 87654', whatsapp:true, isPrimary:false, notes:'Business sponsor. Wants to see uplift in loyalty programme NPS before committing.' },
    ]},
    tasks: { create: [
      { title:'Share retail analytics case studies', description:'Send 3 relevant case studies — focus on loyalty and customer segmentation use cases', priority:'Medium', status:'Done', dueDate: new Date('2026-06-12'), assignee:'Priya Nair', category:'Follow-up', comments:['Sent 3 case studies via email','Deepak responded positively — especially liked the Shoppers Stop case'] },
      { title:'Loyalty platform live demo', description:'Full demo of loyalty platform with Reliance Retail sample data. Deepak wants to see churn prediction module.', priority:'High', status:'In progress', dueDate: new Date('2026-06-22'), assignee:'Priya Nair', category:'Demo', comments:['Demo environment set up','Sample data loaded for demo'] },
      { title:'Proposal for Phase 1 pilot', description:'6-month pilot covering 200 stores in Delhi NCR. Include success KPIs and expansion roadmap.', priority:'High', status:'To do', dueDate: new Date('2026-07-01'), assignee:'Tanvi Kapila', category:'Proposal', comments:[] },
      { title:'Check integration requirements with Jio POS systems', priority:'Medium', status:'To do', dueDate: new Date('2026-07-08'), assignee:'Tech Team', category:'Technical', comments:[] },
      { title:'Discuss Diwali campaign timeline', description:'Reliance wants platform ready before Oct for Diwali campaigns. Check if timeline is feasible.', priority:'Critical', status:'To do', dueDate: new Date('2026-06-25'), assignee:'Priya Nair', category:'Meeting', comments:[] },
    ]},
    opportunities: { create: [
      { title:'Customer Analytics & Loyalty Platform', stage:'Qualified', value:3200000, probability:55, closeDate: new Date('2026-09-30'), notes:'Budget confirmed by VP Marketing. Decision before end of Q2. Need to beat Salesforce proposal.' },
      { title:'Diwali Campaign Intelligence Module', stage:'Prospecting', value:800000, probability:30, closeDate: new Date('2026-08-15'), notes:'Fast-track opportunity if loyalty deal closes early. Deepak mentioned it informally.' },
    ]},
    pastProjects: { create: [
      { name:'Delhi Pilot Analytics', revenue:420000, year:2025, description:'3-month analytics pilot across 50 Delhi stores. 18% increase in repeat purchases recorded.' },
      { name:'Customer Segmentation Model', revenue:280000, year:2024, description:'Built 5-segment model for loyalty tier targeting. Used in current Jio campaign.' },
    ]},
  }});

  // ── 5. HDFC Bank ───────────────────────────────────────────────
  await prisma.account.create({ data: {
    name: 'HDFC Bank Limited', industry: 'Banking & Finance', segment: 'Enterprise',
    owner: 'Rohan Mehta', location: 'Mumbai, Maharashtra', website: 'hdfcbank.com',
    description: "India's largest private sector bank. RBI-regulated — all vendor onboarding requires InfoSec audit and data localisation compliance. Procurement cycle is 6-9 months minimum.",
    contacts: { create: [
      { name:'Sanjay Kapoor', role:'Chief Technology Officer', email:'s.kapoor@hdfcbank.com', phone:'+91 98112 34567', whatsapp:false, isPrimary:true, notes:'Very conservative on cloud vendors. Data sovereignty is top concern. Prefers on-prem or private cloud.' },
      { name:'Naina Reddy', role:'Head of Data & Analytics', email:'n.reddy@hdfcbank.com', phone:'+91 87223 45678', whatsapp:true, isPrimary:false, notes:'Progressive thinker. Champions our cause internally. Best ally in the account.' },
      { name:'Prakash Gupta', role:'VP Vendor Management', email:'p.gupta@hdfcbank.com', phone:'+91 76334 56789', whatsapp:false, isPrimary:false, notes:'Runs procurement process. Stickler for compliance documentation.' },
    ]},
    tasks: { create: [
      { title:'Submit InfoSec compliance questionnaire', description:'400-question security audit required by HDFC InfoSec team before any pilot can begin', priority:'Critical', status:'In progress', dueDate: new Date('2026-06-24'), assignee:'Tech Team', category:'Legal', comments:['First 200 questions completed','Legal reviewed data residency section','Remaining 200 questions in progress'] },
      { title:'Data localisation architecture review', description:'HDFC requires all data to stay within Indian data centres. Need to architect India-only deployment.', priority:'High', status:'To do', dueDate: new Date('2026-07-05'), assignee:'Tech Team', category:'Technical', comments:[] },
      { title:'Exec meeting with Sanjay Kapoor', description:'30-min intro meeting. Focus on security-first positioning and RBI compliance credentials.', priority:'High', status:'Done', dueDate: new Date('2026-06-05'), assignee:'Rohan Mehta', category:'Meeting', comments:['Good meeting — Sanjay warmed up once we showed ISO 27001 certificate','Follow-up scheduled for July'] },
      { title:'Send ISO 27001 and SOC 2 certificates', priority:'Medium', status:'Done', dueDate: new Date('2026-06-08'), assignee:'Rohan Mehta', category:'Follow-up', comments:['Certificates shared via secure email portal'] },
      { title:'Propose fraud detection pilot scope', description:'Naina wants to pilot fraud detection on UPI transaction data. Define pilot scope: 1M transactions, 90 days.', priority:'High', status:'To do', dueDate: new Date('2026-07-12'), assignee:'Rohan Mehta', category:'Proposal', comments:[] },
      { title:'Arrange reference call with Axis Bank', description:'HDFC wants to speak with a banking peer about our platform. Arrange ref call with Axis Bank team.', priority:'Medium', status:'To do', dueDate: new Date('2026-07-18'), assignee:'Rohan Mehta', category:'Follow-up', comments:[] },
    ]},
    opportunities: { create: [
      { title:'Fraud Detection & Risk Analytics Platform', stage:'Qualified', value:15000000, probability:35, closeDate: new Date('2026-11-30'), notes:'High-value but slow deal. InfoSec audit is the current bottleneck. Naina is the internal champion.' },
      { title:'Customer 360 Data Platform', stage:'Prospecting', value:9000000, probability:20, closeDate: new Date('2027-03-31'), notes:'Very early. Naina mentioned it as next-year initiative. Budget not allocated yet.' },
    ]},
    pastProjects: { create: [
      { name:'AML Transaction Monitoring POC', revenue:350000, year:2024, description:'3-month proof of concept for anti-money laundering. 94% detection accuracy vs 87% with legacy system.' },
    ]},
  }});

  // ── 6. Apollo Hospitals ────────────────────────────────────────
  await prisma.account.create({ data: {
    name: 'Apollo Hospitals Enterprise', industry: 'Healthcare & Life Sciences', segment: 'Mid-Market',
    owner: 'Sneha Iyer', location: 'Chennai, Tamil Nadu', website: 'apollohospitals.com',
    description: 'Leading private hospital group. 70+ hospitals across India. Key interest: clinical data analytics and patient outcome prediction. ABDM-compliant data handling required.',
    contacts: { create: [
      { name:'Dr. Kavitha Rao', role:'Chief Medical Information Officer', email:'k.rao@apollohospitals.com', phone:'+91 98445 67890', whatsapp:true, isPrimary:true, notes:'Clinician-turned-technologist. Wants outcomes improvement, not just cost cutting. Very passionate.' },
      { name:'Arun Menon', role:'IT Infrastructure Head', email:'a.menon@apollohospitals.com', phone:'+91 87556 78901', whatsapp:false, isPrimary:false, notes:'Technical gatekeeper. Concerned about HL7/FHIR compatibility.' },
    ]},
    tasks: { create: [
      { title:'Demo clinical analytics dashboard to Dr. Kavitha', description:'Show patient readmission prediction model using Apollo\'s anonymised sample data', priority:'High', status:'To do', dueDate: new Date('2026-06-26'), assignee:'Sneha Iyer', category:'Demo', comments:[] },
      { title:'Confirm ABDM compliance readiness', description:'Apollo requires ABDM (Ayushman Bharat Digital Mission) compliance. Confirm our platform meets standards.', priority:'Critical', status:'In progress', dueDate: new Date('2026-06-20'), assignee:'Tech Team', category:'Legal', comments:['ABDM compliance checklist reviewed','2 gaps identified — working on fixes'] },
      { title:'Send proposal for Phase 1 (5 hospitals)', description:'Start with 5 hospitals pilot: Chennai, Hyderabad, Mumbai, Delhi, Bangalore', priority:'High', status:'To do', dueDate: new Date('2026-07-03'), assignee:'Sneha Iyer', category:'Proposal', comments:[] },
      { title:'Introductory call with Arun Menon', priority:'Medium', status:'Done', dueDate: new Date('2026-06-10'), assignee:'Tech Team', category:'Meeting', comments:['Good call — Arun confirmed HL7 FHIR R4 is their standard','He will review our API documentation'] },
      { title:'Research Apollo EMR system (Epic vs local)', description:'Need to know which EMR they use for integration planning', priority:'Low', status:'Done', dueDate: new Date('2026-06-11'), assignee:'Sneha Iyer', category:'Technical', comments:['Apollo uses proprietary EMR for most hospitals plus Epic in premium facilities'] },
    ]},
    opportunities: { create: [
      { title:'Clinical Analytics & Patient Outcomes Platform', stage:'Proposal', value:5500000, probability:45, closeDate: new Date('2026-09-30'), notes:'Strong clinical champion in Dr. Kavitha. IT team is cautious. ABDM compliance is the gate.' },
      { title:'Operational Efficiency Dashboard', stage:'Prospecting', value:1800000, probability:25, closeDate: new Date('2026-12-31'), notes:'COO mentioned wanting OT utilisation and bed occupancy analytics. Not formally scoped.' },
    ]},
    pastProjects: { create: [
      { name:'Patient Satisfaction Analytics Pilot', revenue:220000, year:2025, description:'Analysed CSAT survey data for 3 hospitals. Identified top 5 drivers of patient dissatisfaction.' },
    ]},
  }});

  // ── 7. Adani Ports ─────────────────────────────────────────────
  await prisma.account.create({ data: {
    name: 'Adani Ports and SEZ', industry: 'Supply Chain & Logistics', segment: 'Enterprise',
    owner: 'Dev Sharma', location: 'Ahmedabad, Gujarat', website: 'adaniports.com',
    group: 'Adani Group',
    description: "India's largest port operator. 14 ports. Interested in IoT-based vessel tracking, cargo analytics, and predictive port congestion management.",
    contacts: { create: [
      { name:'Harish Bhat', role:'Head of Digital Transformation', email:'h.bhat@adaniports.com', phone:'+91 98776 54321', whatsapp:true, isPrimary:true, notes:'Aggressive timeline expectations. Wants POC live within 60 days of sign-off.' },
      { name:'Preeti Shah', role:'CTO', email:'p.shah@adaniports.com', phone:'+91 87665 43210', whatsapp:false, isPrimary:false, notes:'Technical authority. Very interested in edge computing for pier-side IoT.' },
      { name:'Mahesh Choudhary', role:'Operations Director', email:'m.choudhary@adaniports.com', phone:'+91 76554 32109', whatsapp:true, isPrimary:false, notes:'End user. Wants reduced vessel turnaround time as primary success metric.' },
    ]},
    tasks: { create: [
      { title:'POC proposal for Mundra Port', description:'Design 60-day POC covering vessel tracking and cargo scan analytics at Mundra Port', priority:'Critical', status:'In progress', dueDate: new Date('2026-06-21'), assignee:'Dev Sharma', category:'Proposal', comments:['First draft complete','Tech Team reviewing IoT integration architecture','Harish wants draft by Friday'] },
      { title:'Meeting with Preeti Shah — edge computing architecture', description:'CTO wants to understand how we handle IoT data at the pier where connectivity is poor', priority:'High', status:'To do', dueDate: new Date('2026-06-25'), assignee:'Tech Team', category:'Meeting', comments:[] },
      { title:'Competitive check — vs Siemens Logistics', description:'Adani shortlisted us and Siemens. Research Siemens India port solution.', priority:'Medium', status:'Done', dueDate: new Date('2026-06-14'), assignee:'Dev Sharma', category:'Research', comments:['Siemens strength: hardware integration','Our strength: AI/ML layer and software flexibility','Recommend positioning on total cost of ownership'] },
      { title:'Arrange site visit to Mundra Port', description:'Dev + Tech Lead to visit Mundra Port to understand physical layout for IoT sensor placement', priority:'Medium', status:'To do', dueDate: new Date('2026-07-08'), assignee:'Dev Sharma', category:'Technical', comments:[] },
      { title:'Draft commercial terms sheet', priority:'High', status:'To do', dueDate: new Date('2026-07-01'), assignee:'Dev Sharma', category:'Legal', comments:[] },
    ]},
    opportunities: { create: [
      { title:'Port Intelligence Platform — Mundra', stage:'Proposal', value:11000000, probability:50, closeDate: new Date('2026-09-30'), notes:'Starting with Mundra (largest port). Success there opens 13 more ports. Land-and-expand strategy.' },
      { title:'Cargo Analytics — Hazira Port', stage:'Prospecting', value:3500000, probability:20, closeDate: new Date('2027-01-31'), notes:'Harish mentioned Hazira as next phase if Mundra goes well.' },
    ]},
    pastProjects: { create: [
      { name:'Logistics Visibility Dashboard', revenue:750000, year:2024, description:'Built real-time cargo visibility dashboard for road freight operations.' },
    ]},
  }});

  // ── 8. BSNL ────────────────────────────────────────────────────
  await prisma.account.create({ data: {
    name: 'BSNL (Bharat Sanchar Nigam)', industry: 'Telecom', segment: 'Enterprise',
    owner: 'Sneha Iyer', location: 'New Delhi, NCR', website: 'bsnl.in',
    group: 'Public Sector',
    description: 'Government-owned telecom. Budget-constrained but massive scale. Decisions require multi-level approvals including MoC clearance. GEM procurement portal mandatory.',
    contacts: { create: [
      { name:'Rajendra Prasad', role:'Director (IT)', email:'r.prasad@bsnl.in', phone:'+011 2301 5678', whatsapp:false, isPrimary:true, notes:'Senior ITS officer. Very process-driven. All proposals must go through official channels on GEM portal.' },
      { name:'Anita Krishnamurthy', role:'Joint General Manager (Data)', email:'a.krishnamurthy@bsnl.in', phone:'+011 2301 6789', whatsapp:true, isPrimary:false, notes:'Technical champion. More progressive than leadership. Understands modern analytics well.' },
    ]},
    tasks: { create: [
      { title:'Register on GEM portal for BSNL procurement', description:'All government vendors must be registered on Government e-Marketplace (GEM) before submitting bids', priority:'Critical', status:'Done', dueDate: new Date('2026-05-30'), assignee:'Finance', category:'Legal', comments:['GEM registration complete — ID: GEM/2026/B/3412788','SME classification confirmed'] },
      { title:'Respond to RFQ for Network Analytics Platform', description:'BSNL issued RFQ on GEM for network performance analytics. Must respond by June 30.', priority:'Critical', status:'In progress', dueDate: new Date('2026-06-30'), assignee:'Sneha Iyer', category:'Proposal', comments:['RFQ downloaded and reviewed','Price discovery done','Technical bid drafted — awaiting Finance sign-off on commercial bid'] },
      { title:'Meeting with Anita Krishnamurthy', description:'Informal briefing to understand evaluation criteria before submission', priority:'Medium', status:'Done', dueDate: new Date('2026-06-09'), assignee:'Sneha Iyer', category:'Meeting', comments:['Very helpful — Anita confirmed that cost is 60% weightage in evaluation','Technical demo is 40%','Advised on budget range: ₹2-4Cr'] },
      { title:'Prepare demo for network analytics', description:'Demo must show BSNL-specific KPIs: call drop rate, ARPU trends, tower uptime analysis', priority:'High', status:'To do', dueDate: new Date('2026-07-05'), assignee:'Tech Team', category:'Demo', comments:[] },
      { title:'Confirm Make-in-India compliance', description:'Government tenders require minimum 50% local value addition under MeitY guidelines', priority:'High', status:'Blocked', dueDate: new Date('2026-06-22'), assignee:'Finance', category:'Legal', comments:['Compliance team unsure about open-source component origin counts','Waiting for legal opinion'] },
    ]},
    opportunities: { create: [
      { title:'Network Performance Analytics Platform', stage:'Proposal', value:3500000, probability:30, closeDate: new Date('2026-09-30'), notes:'GEM tender. Low margin but high reference value for other PSU deals. Must bid strategically.' },
    ]},
    pastProjects: { create: [
      { name:'Tower Uptime Monitoring Pilot', revenue:180000, year:2025, description:'3-month pilot monitoring 500 towers in Delhi circle. 97.2% uptime visibility achieved.' },
    ]},
  }});

  console.log('Seed complete — 8 accounts created.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
