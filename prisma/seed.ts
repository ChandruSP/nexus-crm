import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  // Config
  await prisma.config.upsert({ where:{key:'industries'}, update:{}, create:{key:'industries',values:['Banking & Finance','Supply Chain & Logistics','Healthcare & Life Sciences','Media & Entertainment','Technology','Manufacturing','Retail','Real Estate','Education','Government','Telecom','Energy']} });
  await prisma.config.upsert({ where:{key:'teamMembers'}, update:{}, create:{key:'teamMembers',values:['Priya Nair','Dev Sharma','Tanvi Kapila','Tech Team','Finance']} });
  await prisma.config.upsert({ where:{key:'oppStages'}, update:{}, create:{key:'oppStages',values:['Prospecting','Qualified','Proposal','Negotiation','Closed Won','Closed Lost']} });
  await prisma.config.upsert({ where:{key:'accountGroups'}, update:{}, create:{key:'accountGroups',values:['Tata Group']} });

  // Accounts
  const tatasteel = await prisma.account.create({
    data: {
      name: 'Tata Steel Limited', industry: 'Manufacturing', segment: 'Enterprise',
      owner: 'Priya Nair', location: 'Mumbai, Maharashtra', website: 'tatasteel.com',
      description: "India's largest integrated steel manufacturer. Key stakeholder is VP of Digital Transformation. Decision cycle ~3 months.",
      group: 'Tata Group',
      contacts: { create: [
        { name:'Rajiv Mehta', role:'VP Digital Transformation', email:'r.mehta@tatasteel.com', phone:'+91 98765 43210', isPrimary:true, notes:'Prefers morning calls.' },
        { name:'Sunita Rao', role:'IT Director', email:'s.rao@tatasteel.com', phone:'+91 87654 32109', isPrimary:false, notes:'Technical decision maker.' },
      ]},
      tasks: { create: [
        { title:'Send proposal for AI analytics', description:'Prepare deck and send', priority:'Critical', status:'In Progress', dueDate: new Date('2026-06-20'), assignee:'Priya Nair', category:'Proposal', comments:[] },
        { title:'Schedule QBR meeting', priority:'High', status:'To Do', dueDate: new Date('2026-06-25'), assignee:'Dev Sharma', category:'Meeting', comments:[] },
        { title:'Follow up on POC results', priority:'Medium', status:'Done', dueDate: new Date('2026-06-10'), assignee:'Priya Nair', category:'Follow-up', comments:['POC results positive, moving to proposal stage.'] },
      ]},
      opportunities: { create: [
        { title:'AI Analytics Platform', stage:'Proposal', value:4500000, probability:60, closeDate: new Date('2026-08-31'), notes:'Strong interest from VP.' },
        { title:'ERP Integration', stage:'Qualified', value:2200000, probability:40, closeDate: new Date('2026-10-15'), notes:'Awaiting budget approval.' },
      ]},
      pastProjects: { create: [
        { name:'Steel 4.0 Pilot', revenue:1800000, year:2024, description:'Digital twin pilot for blast furnaces.' },
        { name:'Supply Chain Dashboard', revenue:950000, year:2023, description:'Real-time supply chain visibility.' },
      ]},
    },
  });

  await prisma.account.create({
    data: {
      name: 'Tata Consultancy Services', industry: 'Technology', segment: 'Enterprise',
      owner: 'Dev Sharma', location: 'Bangalore, Karnataka', website: 'tcs.com',
      description: 'Global IT services giant. Multiple business units. Key contact in the Digital Initiatives group.',
      group: 'Tata Group',
      contacts: { create: [
        { name:'Ananya Singh', role:'Global Head of Procurement', email:'a.singh@tcs.com', phone:'+91 76543 21098', isPrimary:true, notes:'Very process-oriented.' },
      ]},
      tasks: { create: [
        { title:'Legal review of MSA', description:'Get legal to review master service agreement', priority:'High', status:'In Progress', dueDate: new Date('2026-06-18'), assignee:'Dev Sharma', category:'Legal', comments:[] },
        { title:'Product demo for TCS Digital', priority:'Medium', status:'To Do', dueDate: new Date('2026-06-30'), assignee:'Tanvi Kapila', category:'Demo', comments:[] },
      ]},
      opportunities: { create: [
        { title:'Analytics-as-a-Service', stage:'Negotiation', value:12000000, probability:75, closeDate: new Date('2026-07-31'), notes:'In final pricing negotiation.' },
      ]},
      pastProjects: { create: [
        { name:'Data Lakehouse Migration', revenue:3400000, year:2024, description:'Migrated 3 data warehouses to lakehouse.' },
      ]},
    },
  });

  await prisma.account.create({
    data: {
      name: 'Infosys Limited', industry: 'Technology', segment: 'Enterprise',
      owner: 'Tanvi Kapila', location: 'Pune, Maharashtra', website: 'infosys.com',
      description: 'Tier-1 IT services. Focus on Infosys Cobalt cloud division. Long sales cycle.',
      contacts: { create: [
        { name:'Kiran Bose', role:'Cloud Procurement Lead', email:'k.bose@infosys.com', phone:'+91 65432 10987', isPrimary:true, notes:'Prefers email.' },
        { name:'Meera Joshi', role:'SVP Cloud Services', email:'m.joshi@infosys.com', phone:'+91 54321 09876', isPrimary:false, notes:'Executive sponsor.' },
      ]},
      tasks: { create: [
        { title:'RFP response draft', description:'Write response to Infosys RFP', priority:'Critical', status:'To Do', dueDate: new Date('2026-06-17'), assignee:'Tanvi Kapila', category:'Proposal', comments:[] },
      ]},
      opportunities: { create: [
        { title:'Cloud Observability Suite', stage:'Prospecting', value:8000000, probability:25, closeDate: new Date('2026-12-31'), notes:'Early stage, building relationship.' },
      ]},
    },
  });

  await prisma.account.create({
    data: {
      name: 'Reliance Retail Ventures', industry: 'Retail', segment: 'Mid-Market',
      owner: 'Priya Nair', location: 'Delhi, NCR', website: 'relianceretail.com',
      description: 'Fastest growing retail chain. Interested in customer analytics and loyalty platform integration.',
      contacts: { create: [
        { name:'Deepak Verma', role:'Head of Analytics', email:'d.verma@relianceretail.com', phone:'+91 43210 98765', isPrimary:true, notes:'Very data savvy.' },
      ]},
      tasks: { create: [
        { title:'Share case study', description:'Send relevant retail case studies', priority:'Medium', status:'Done', dueDate: new Date('2026-06-12'), assignee:'Priya Nair', category:'Follow-up', comments:['Sent 3 case studies via email.'] },
        { title:'Loyalty platform demo', priority:'High', status:'To Do', dueDate: new Date('2026-06-22'), assignee:'Priya Nair', category:'Demo', comments:[] },
      ]},
      opportunities: { create: [
        { title:'Customer Analytics Platform', stage:'Qualified', value:3200000, probability:50, closeDate: new Date('2026-09-30'), notes:'Budget confirmed.' },
      ]},
      pastProjects: { create: [
        { name:'Pilot Analytics', revenue:420000, year:2025, description:'3-month analytics pilot.' },
      ]},
    },
  });

  console.log('Seed complete.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
