import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Upload, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';

const DM={"6,464.20":"Other","Accounting, Audit and Tax Services (B2B)":"FinTech","Accounting, Audit and Tax Services (B2C)":"FinTech","Broadcasting, Radio and Television":"Gaming & Media","Computers, Parts and Peripherals":"Hardware & IoT","Movies, Music and Entertainment":"Gaming & Media","Other Metals, Minerals and Mining":"Industrials & Energy","Other Restaurants, Hotels and Leisure":"Travel, Dining & Hospitality","67.22":"Other","Accessories":"Retail & Consumer Brands","Aerospace and Defense":"Industrials & Energy","Agricultural Chemicals":"Industrials & Energy","Air":"Logistics & Transportation","Alternative Energy Equipment":"Industrials & Energy","Aluminum Mining":"Industrials & Energy","Animal Husbandry":"Agriculture & AgTech","Animal Textiles":"Retail & Consumer Brands","Application Software":"Enterprise SaaS","Application Specific Semiconductors":"Hardware & IoT","Aquaculture":"Agriculture & AgTech","Asset Management":"FinTech","Automation/Workflow Software":"Enterprise SaaS","Automotive":"Industrials & Energy","Automotive Insurance":"FinTech","BPO/Outsource Services":"HR Tech","Beverages":"Food & Beverages","Biotechnology":"HealthTech & Life Sciences","Brokerage":"FinTech","Building Products":"Real Estate & Construction","Buildings and Property":"Real Estate & Construction","Business Equipment and Supplies":"Retail & Consumer Brands","Business/Productivity Software":"Enterprise SaaS","Clinics/Outpatient Services":"HealthTech & Life Sciences","Clothing":"Retail & Consumer Brands","Commercial/Professional Insurance":"FinTech","Commodity Chemicals":"Industrials & Energy","Communication Software":"Enterprise SaaS","Connectivity Products":"Hardware & IoT","Construction and Engineering":"Real Estate & Construction","Consulting Services (B2B)":"Other","Consumer Finance":"FinTech","Cultivation":"Agriculture & AgTech","Database Software":"Enterprise SaaS","Decision/Risk Analysis":"Enterprise SaaS","Department Stores":"Retail & Consumer Brands","Diagnostic Equipment":"HealthTech & Life Sciences","Discovery Tools (Healthcare)":"HealthTech & Life Sciences","Distributors (Healthcare)":"HealthTech & Life Sciences","Distributors/Wholesale":"Logistics & Transportation","Drug Delivery":"HealthTech & Life Sciences","Drug Discovery":"HealthTech & Life Sciences","Education and Training Services (B2B)":"EdTech","Educational Software":"EdTech","Educational and Training Services (B2C)":"EdTech","Elder and Disabled Care":"HealthTech & Life Sciences","Electric Utilities":"Industrials & Energy","Electrical Equipment":"Hardware & IoT","Electronic Equipment and Instruments":"Hardware & IoT","Electronics (B2C)":"Hardware & IoT","Energy Infrastructure":"Industrials & Energy","Energy Marketing":"Industrials & Energy","Energy Production":"Industrials & Energy","Energy Storage":"Industrials & Energy","Energy Traders and Brokers":"Industrials & Energy","Energy Transportation":"Industrials & Energy","Enterprise Systems (Healthcare)":"HealthTech & Life Sciences","Entertainment Software":"Gaming & Media","Environmental Services (B2B)":"Industrials & Energy","Fiberoptic Equipment":"Hardware & IoT","Financial Software":"FinTech","Food Products":"Food & Beverages","Footwear":"Retail & Consumer Brands","Forestry Processing":"Industrials & Energy","General Merchandise Stores":"Retail & Consumer Brands","General Purpose Semiconductors":"Hardware & IoT","Generating Revenue":"Other","Home Furnishings":"Retail & Consumer Brands","Horticulture":"Agriculture & AgTech","Hospitals/Inpatient Services":"HealthTech & Life Sciences","Hotels and Resorts":"Travel, Dining & Hospitality","Household Appliances":"Retail & Consumer Brands","Human Capital Services":"HR Tech","IT Consulting and Outsourcing":"DevOps & Infrastructure","Industrial Chemicals":"Industrials & Energy","Industrial Supplies and Parts":"Industrials & Energy","Information Services (B2C)":"Gaming & Media","Infrastructure":"DevOps & Infrastructure","Insurance Brokers":"FinTech","International Banks":"FinTech","Internet Retail":"E-commerce & Marketplace Tech","Internet Service Providers":"DevOps & Infrastructure","Internet Software":"Enterprise SaaS","Investment Banks":"FinTech","Laboratory Services (Healthcare)":"HealthTech & Life Sciences","Legal Services (B2B)":"Other","Legal Services (B2C)":"Other","Leisure Facilities":"Gaming & Media","Logistics":"Logistics & Transportation","Machinery (B2B)":"Industrials & Energy","Marine":"Logistics & Transportation","Media and Information Services (B2B)":"Marketing & Sales Tech","Medical Records Systems":"HealthTech & Life Sciences","Medical Supplies":"HealthTech & Life Sciences","Metal Containers and Packaging":"Industrials & Energy","Monitoring Equipment":"HealthTech & Life Sciences","Multi-line Chemicals":"Industrials & Energy","Multi-line Insurance":"FinTech","Multi-line Mining":"Industrials & Energy","Multimedia and Design Software":"Gaming & Media","National Banks":"FinTech","Network Management Software":"DevOps & Infrastructure","Office Electronics":"Hardware & IoT","Office Services (B2B)":"Other","Oil and Gas Equipment":"Industrials & Energy","Other Agriculture":"Agriculture & AgTech","Other Capital Markets/Institutions":"FinTech","Other Commercial Banks":"FinTech","Other Commercial Products":"Other","Other Commercial Services":"Other","Other Communications and Networking":"DevOps & Infrastructure","Other Consumer Durables":"Retail & Consumer Brands","Other Consumer Non-Durables":"Retail & Consumer Brands","Other Containers and Packaging":"Industrials & Energy","Other Devices and Supplies":"Hardware & IoT","Other Energy Services":"Industrials & Energy","Other Equipment":"Industrials & Energy","Other Financial Services":"FinTech","Other Hardware":"Hardware & IoT","Other Healthcare Services":"HealthTech & Life Sciences","Other Healthcare Technology Systems":"HealthTech & Life Sciences","Other Insurance":"FinTech","Other Materials":"Industrials & Energy","Other Media":"Gaming & Media","Other Pharmaceuticals and Biotechnology":"HealthTech & Life Sciences","Other Semiconductors":"Hardware & IoT","Other Services (B2C Non-Financial)":"Other","Other Textiles":"Industrials & Energy","Other Transportation":"Logistics & Transportation","Outcome Management (Healthcare)":"HealthTech & Life Sciences","Paper Containers and Packaging":"Industrials & Energy","Personal Products":"Retail & Consumer Brands","Pharmaceuticals":"HealthTech & Life Sciences","Plastic Containers and Packaging":"Industrials & Energy","Practice Management (Healthcare)":"HealthTech & Life Sciences","Precious Metals and Minerals Mining":"Industrials & Energy","Printing Services (B2B)":"Other","Private Equity":"FinTech","Production (Semiconductors)":"Hardware & IoT","Profitable":"Other","Publishing":"Gaming & Media","Rail":"Logistics & Transportation","Raw Materials (Non-Wood)":"Industrials & Energy","Real Estate Investment Trusts (REITs)":"Real Estate & Construction","Real Estate Services (B2C)":"Real Estate & Construction","Recreational Goods":"Retail & Consumer Brands","Regional Banks":"FinTech","Restaurants and Bars":"Travel, Dining & Hospitality","Road":"Logistics & Transportation","Security Services (B2B)":"Other","Social Content":"Gaming & Media","Social/Platform Software":"Gaming & Media","Software Development Applications":"DevOps & Infrastructure","Specialized Finance":"FinTech","Specialty Chemicals":"Industrials & Energy","Specialty Retail":"Retail & Consumer Brands","Surgical Devices":"HealthTech & Life Sciences","Synthetic Textiles":"Industrials & Energy","Systems and Information Management":"Enterprise SaaS","Telecommunications Service Providers":"DevOps & Infrastructure","Therapeutic Devices":"HealthTech & Life Sciences","Thrifts and Mortgage Finance":"FinTech","Venture Capital-Backed":"Other","Vertical Market Software":"Enterprise SaaS","Wireless Communications Equipment":"Hardware & IoT"};
const DM_FIXED={...DM,"Casinos and Gaming":"Gaming & Media","Energy Exploration":"Industrials & Energy","Gas Utilities":"Industrials & Energy","Gold Mining":"Industrials & Energy","Holding Companies":"Other","Life and Health Insurance":"FinTech","Luxury Goods":"Retail & Consumer Brands","Managed Care":"HealthTech & Life Sciences","Operating Systems Software":"Enterprise SaaS","Other Apparel":"Retail & Consumer Brands","Other Business Products and Services":"Other","Other Chemicals and Gases":"Industrials & Energy","Other Energy":"Industrials & Energy","Other Healthcare":"HealthTech & Life Sciences","Other Utilities":"Industrials & Energy","Property and Casualty Insurance":"FinTech","Special Purpose Acquisition Company (SPAC)":"FinTech"};
const DC=["Agriculture & AgTech","Cybersecurity","DevOps & Infrastructure","E-commerce & Marketplace Tech","EdTech","Enterprise SaaS","FinTech","Food & Beverages","Gaming & Media","HR Tech","Hardware & IoT","HealthTech & Life Sciences","Industrials & Energy","Logistics & Transportation","Marketing & Sales Tech","Other","Real Estate & Construction","Retail & Consumer Brands","Travel, Dining & Hospitality"];
const COVR={"Groq":"DevOps & Infrastructure","Figma (NYS: FIG)":"Enterprise SaaS","Matterport":"Enterprise SaaS","Frame.io":"Enterprise SaaS","Mir":"FinTech","Cognito (Network Management Software)":"Cybersecurity"};
const CYBER=new Set(["Pangea (Palo Alto, California)","Accurics","Adaptive Mobile Security","Adlumin","Airgap","Alsid","Apolicy","Area 1 Security","Arqit (NAS: ARQQ)","Attivo Networks","Auth0","BehavioSec","BizSecure","BlackHorse Solutions","BluBracket","Blue Hexagon","Bricata","Bridgecrew","Build.Security","Clumio","Cmd (Network Management Software)","Cognito (Network Management Software)","Cybersprint","Cylance","Cyral","DFLabs","Dig Security","DocFox","Exium","Featurespace","Foreseeti","Gem (Network Management Software)","Groupsense","Guardian Firewall","Guardum","Hents_","ID Quantique","ID R&D","IPKeys Power Partners","Illuria","InfoSum","Infocyte","IntSights","Intrigue (Network Management Software)","Ionic Security","IronNet","K2 Cyber Security","Kivera","Lakera","Malizen","Mandiant","MergeBase","Myseum (NAS: MYSE)","NTT Application Security","Neosec","Netskope (NAS: NTSK)","NeuVector","Neuro-ID","Next DLP","Noetic","Nok Nok","Noname Security","Nth Party","Omen Technologies","PatternEx","Perception Point","PixelPin","Polar Security","Prompt Security","Protect AI","Raito (Network Management Software)","Red Canary","Reposify","Rezilion","Rhebo","RiskIQ","Rubrik (NYS: RBRK)","SafeBase","SecureAppbox","SecureCircle","SentinelOne (NYS: S)","ShieldX","Sidertia","Siemplify","Singular Key","SmartAxiom","Sora (Network Management Software)","Sqreen","Swascan","TAC Security (NSE: TAC)","Tego Cyber (PINX: TGCB)","Tehama","Threat Stack","Threat Status","TrapX Security","TruSTAR (Network Management Software)","TurgenSec","Vectrix (Network Management Software)","Verifiable Credentials","Veza","VocaliD","Wandera","WiteSand","Yubico (STO: YUBICO)","ZecOps","Zilla Security"]);
const USS={AL:1,AK:1,AZ:1,AR:1,CA:1,CO:1,CT:1,DE:1,FL:1,GA:1,HI:1,ID:1,IL:1,IN:1,IA:1,KS:1,KY:1,LA:1,ME:1,MD:1,MA:1,MI:1,MN:1,MS:1,MO:1,MT:1,NE:1,NV:1,NH:1,NJ:1,NM:1,NY:1,NC:1,ND:1,OH:1,OK:1,OR:1,PA:1,RI:1,SC:1,SD:1,TN:1,TX:1,UT:1,VT:1,VA:1,WA:1,WV:1,WI:1,WY:1,DC:1};
const RM={"United States":"North America","Canada":"North America","Mexico":"North America","United Kingdom":"Europe","Germany":"Europe","France":"Europe","Sweden":"Europe","Switzerland":"Europe","Denmark":"Europe","Netherlands":"Europe","Spain":"Europe","Italy":"Europe","Ireland":"Europe","Norway":"Europe","Finland":"Europe","Belgium":"Europe","Austria":"Europe","Portugal":"Europe","Poland":"Europe","Czech Republic":"Europe","Romania":"Europe","Greece":"Europe","Hungary":"Europe","Luxembourg":"Europe","Estonia":"Europe","Latvia":"Europe","Lithuania":"Europe","China":"Asia","Japan":"Asia","South Korea":"Asia","India":"Asia","Singapore":"Asia","Hong Kong":"Asia","Taiwan":"Asia","Thailand":"Asia","Vietnam":"Asia","Indonesia":"Asia","Malaysia":"Asia","Philippines":"Asia","Israel":"Middle East","UAE":"Middle East","United Arab Emirates":"Middle East","Saudi Arabia":"Middle East","Turkey":"Middle East","Brazil":"Latin America","Argentina":"Latin America","Chile":"Latin America","Colombia":"Latin America","Australia":"Oceania","New Zealand":"Oceania","South Africa":"Africa","Nigeria":"Africa","Kenya":"Africa","Egypt":"Africa"};
const CL=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#6366f1','#84cc16','#e11d48','#0ea5e9','#a855f7','#22c55e','#eab308','#dc2626','#7c3aed'];

function pCountry(hq){if(!hq?.trim())return'Unknown';const p=hq.replace(/"/g,'').split(',').map(s=>s.trim());if(p.length<2)return'Unknown';const l=p[p.length-1];if(USS[l]||(l.length===2&&/^[A-Z]{2}$/.test(l)))return'United States';return l||'Unknown';}
function pYear(d){if(!d)return null;let m=d.match(/(\d{1,2})-(\w{3})-(\d{4})/);if(m)return+m[3];m=d.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)return+m[3];m=d.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return+m[1];return null;}
function pSize(r){const v=r['Deal Size']||r['Deal Value']||'';if(!v)return null;const n=parseFloat(v.toString().replace(/[^0-9.-]/g,''));return isNaN(n)?null:n;}
const normCode=v=>(v||'').toString().replace(/\r/g,'').trim().replace(/^"(.*)"$/,'$1').replace(/\*/g,'');
function gCat(row,level,mp){const nm=row['Companies']||'';if(COVR[nm])return COVR[nm];if(/rivian/i.test(nm))return'Logistics & Transportation';if(CYBER.has(nm))return'Cybersecurity';if(level==='custom')return mp[normCode(row['Primary Industry Code'])||'Unknown']||'Unmapped';const f=level==='sector'?'Primary Industry Sector':level==='group'?'Primary Industry Group':'Primary Industry Code';return row[f]||'Unknown';}
function gName(r){return r['Companies']||r['Company Name']||'—';}
function gHQ(r){return r['HQ Location']||r['Company HQ Location']||'—';}
function gAcq(r){return(r['Investors']||'').replace(/\([^()]*\)/g,'').replace(/\s+/g,' ').trim()||'—';}
const fmt=n=>n!=null?`$${n.toLocaleString(undefined,{maximumFractionDigits:1})}M`:'—';
const pNum=s=>{if(!s)return null;const n=parseFloat(s.toString().replace(/[^0-9.-]/g,''));return isNaN(n)?null:n;};
const fmtFilterSize=v=>v>=1000?`$${(v/1000).toFixed(v>=10000?0:1)}B`:`$${Math.round(v)}M`;
const parseDealText=text=>{const lines=text.split('\n').filter(l=>l.trim());let hdrs=lines[0].split('\t').map(h=>h.trim().replace(/\r/g,'')),dlm='\t';if(hdrs.length===1){hdrs=lines[0].split(',').map(h=>h.trim().replace(/\r/g,''));dlm=',';}const clean=v=>{const s=(v??'').toString().trim().replace(/\r/g,'');return s.startsWith('"')&&s.endsWith('"')?s.slice(1,-1):s;};const parsed=lines.slice(1).map(line=>{const v=line.split(dlm);const o={};hdrs.forEach((h,i)=>{o[h]=clean(v[i]);});if(o['Primary Industry Code'])o['Primary Industry Code']=normCode(o['Primary Industry Code']);return o;});const codes=[...new Set(parsed.map(d=>d['Primary Industry Code']).filter(Boolean))].sort();return{parsed,hdrs,codes};};

const DealDetail=({deal,onClose,customCategory})=>{
  const fields=[['Category',customCategory],['Deal Type',deal['Deal Type']],['Deal Date',deal['Deal Date']],['Deal Size',fmt(pSize(deal))],['HQ',gHQ(deal)],['Employees',deal['Employees']],['Investors',deal['Investors']],['New Investors',deal['New Investors']],['Implied EV',fmt(pNum(deal['Implied EV']))],['Post Valuation',fmt(pNum(deal['Post Valuation']))],['Revenue',fmt(pNum(deal['Revenue']))],['EBITDA',fmt(pNum(deal['EBITDA']))],['Net Income',fmt(pNum(deal['Net Income']))],['Val/Revenue',pNum(deal['Valuation/Revenue'])?pNum(deal['Valuation/Revenue']).toFixed(1)+'x':null],['Val/EBITDA',pNum(deal['Valuation/EBITDA'])?pNum(deal['Valuation/EBITDA']).toFixed(1)+'x':null],['Raised to Date',fmt(pNum(deal['Raised to Date']))],['Industries',deal['All Industries']],['Verticals',deal['Verticals']],['Keywords',deal['Keywords']]];
  return(<div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:12,marginBottom:8}}>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><h4 style={{fontSize:14,fontWeight:700}}>{gName(deal)}</h4><button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:16}}>×</button></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>{fields.map(([l,v])=>v&&v!=='—'&&!String(v).includes('NaN')?<div key={l} style={{fontSize:11}}><span style={{color:'#64748b',fontWeight:500}}>{l}: </span><span style={{color:'#1e293b'}}>{v}</span></div>:null)}</div>
  </div>);
};

const DollarTooltip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:8,padding:'8px 12px',fontSize:12}}>
    <p style={{fontWeight:600,marginBottom:2}}>{label}</p>
    {payload.map((p,i)=>p.value!=null?<p key={i} style={{color:p.color}}>{p.name}: {fmt(p.value)}</p>:null)}
  </div>);
};

const ExitDashboard=()=>{
  const [data,setData]=useState([]);
  const [catLevel,setCatLevel]=useState('custom');
  const [exitType,setExitType]=useState('all');
  const [debugInfo,setDebugInfo]=useState(null);
  const [showMapping,setShowMapping]=useState(false);
  const [selCat,setSelCat]=useState(null);
  const [expDeal,setExpDeal]=useState(null);
  const [expTop10,setExpTop10]=useState(null);
  const [catMap,setCatMap]=useState(DM_FIXED);
  const [allCodes,setAllCodes]=useState([]);
  const [custCats,setCustCats]=useState(DC);
  const [newCatName,setNewCatName]=useState('');
  const [searchF,setSearchF]=useState('');
  const [filterMapped,setFilterMapped]=useState('all');
  const [importSt,setImportSt]=useState('');
  const [startYr,setStartYr]=useState('2021');
  const [endYr,setEndYr]=useState('2025');
  const [dealMin,setDealMin]=useState(null);
  const [dealMax,setDealMax]=useState(null);
  const [locFilter,setLocFilter]=useState('all');
  const [catFilter,setCatFilter]=useState('all');
  const [showClear,setShowClear]=useState(false);
  const [exportPrev,setExportPrev]=useState(null);
  const [tab,setTab]=useState('overview');
  const [isBootLoading,setIsBootLoading]=useState(true);
  const [bootErr,setBootErr]=useState('');

  useEffect(()=>{let on=true;(async()=>{try{const r=await fetch('/VC_Exits_21-26_deal_data.txt');if(!r.ok)throw new Error(`HTTP ${r.status}`);const text=await r.text();const {parsed,hdrs,codes}=parseDealText(text);if(!on)return;setAllCodes(codes);setDebugInfo({totalRows:parsed.length,cols:hdrs.length});setData(parsed);}catch(e){if(on)setBootErr('Default dataset failed to load. You can still upload manually.');}finally{if(on)setIsBootLoading(false);}})();return()=>{on=false;};},[]);

  const scopedForSize=useMemo(()=>{
    if(!data.length)return[];const s=+startYr,e=+endYr;
    return data.filter(d=>{
      const y=pYear(d['Deal Date']);if(y!==null&&(y<s||y>e))return false;
      if(exitType==='IPO'&&!d['Deal Type']?.includes('IPO'))return false;
      if(exitType==='M&A'){const dt=d['Deal Type'];if(!dt||(!dt.includes('Merger/Acquisition')&&!dt.includes('Buyout/LBO')))return false;}
      if(locFilter!=='all'){const c=pCountry(gHQ(d)),r=RM[c]||'Other';if(locFilter!==c&&locFilter!==r)return false;}
      if(catFilter!=='all'&&gCat(d,catLevel,catMap)!==catFilter)return false;
      return pSize(d)!==null;
    });
  },[data,startYr,endYr,exitType,locFilter,catFilter,catLevel,catMap]);
  const dealSizeBounds=useMemo(()=>{
    const vals=scopedForSize.map(pSize).filter(v=>v!==null);
    if(!vals.length)return null;
    return{min:Math.floor(Math.min(...vals)),max:Math.ceil(Math.max(...vals))};
  },[scopedForSize]);
  const effDealMin=dealMin??dealSizeBounds?.min??0;
  const effDealMax=dealMax??dealSizeBounds?.max??0;
  useEffect(()=>{
    if(!dealSizeBounds)return;
    setDealMin(v=>v===null?dealSizeBounds.min:Math.max(dealSizeBounds.min,Math.min(v,dealSizeBounds.max)));
    setDealMax(v=>v===null?dealSizeBounds.max:Math.max(dealSizeBounds.min,Math.min(v,dealSizeBounds.max)));
  },[dealSizeBounds]);

  const filtered=useMemo(()=>scopedForSize.filter(d=>{const sz=pSize(d);return sz!==null&&sz>=effDealMin&&sz<=effDealMax;}),[scopedForSize,effDealMin,effDealMax]);

  const allByYr=useMemo(()=>{if(!data.length)return[];const s=+startYr,e=+endYr;return data.filter(d=>{const y=pYear(d['Deal Date']);return y===null||(y>=s&&y<=e);});},[data,startYr,endYr]);
  const avCountries=useMemo(()=>{const c={};data.forEach(d=>{const co=pCountry(gHQ(d));if(co&&co!=='Unknown')c[co]=(c[co]||0)+1;});return Object.entries(c).sort((a,b)=>b[1]-a[1]);},[data]);
  const avRegions=useMemo(()=>{const r={};avCountries.forEach(([c])=>{const reg=RM[c]||'Other';r[reg]=(r[reg]||0)+1;});return Object.entries(r).sort((a,b)=>b[1]-a[1]);},[avCountries]);
  const avCats=useMemo(()=>{const c={};allByYr.forEach(d=>{const cat=gCat(d,catLevel,catMap);c[cat]=(c[cat]||0)+1;});return Object.entries(c).sort((a,b)=>b[1]-a[1]);},[allByYr,catLevel,catMap]);

  const stats=useMemo(()=>{
    const total=filtered.length;
    const ipo=filtered.filter(d=>d['Deal Type']?.includes('IPO')).length;
    const ma=filtered.filter(d=>{const dt=d['Deal Type'];return dt&&(dt.includes('Merger/Acquisition')||dt.includes('Buyout/LBO'));}).length;
    const sizes=filtered.map(pSize).filter(v=>v!==null).sort((a,b)=>a-b);
    const median=sizes.length?sizes[Math.floor(sizes.length/2)]:null;
    const e=+endYr;const tY=filtered.filter(d=>pYear(d['Deal Date'])===e).length;const lY=filtered.filter(d=>pYear(d['Deal Date'])===e-1).length;
    const yoy=lY>0?((tY-lY)/lY*100):null;
    const cc={};filtered.forEach(d=>{const c=gCat(d,catLevel,catMap);cc[c]=(cc[c]||0)+1;});
    const topCat=Object.entries(cc).sort((a,b)=>b[1]-a[1])[0];
    return{total,ipo,ma,median,yoy,tY,lY,topCat,endY:e};
  },[filtered,catLevel,catMap,endYr]);

  const chartData=useMemo(()=>{const c={};filtered.forEach(d=>{const cat=gCat(d,catLevel,catMap);c[cat]=(c[cat]||0)+1;});return Object.entries(c).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value);},[filtered,catLevel,catMap]);

  const exitsTime=useMemo(()=>{
    const s=+startYr,e=+endYr,yrs=[];for(let y=s;y<=e;y++)yrs.push(y);
    const ct={},yc={};filtered.forEach(d=>{const y=pYear(d['Deal Date']),c=gCat(d,catLevel,catMap);if(!y)return;ct[c]=(ct[c]||0)+1;const k=''+y;if(!yc[k])yc[k]={};yc[k][c]=(yc[k][c]||0)+1;});
    const cats=Object.entries(ct).sort((a,b)=>b[1]-a[1]).map(([c])=>c);
    return{data:yrs.map(y=>{const row={year:''+y};cats.forEach(c=>{row[c]=yc[''+y]?.[c]||0;});return row;}),cats};
  },[filtered,startYr,endYr,catLevel,catMap]);

  const dealByCat=useMemo(()=>{
    const c={};filtered.forEach(d=>{const cat=gCat(d,catLevel,catMap),s=pSize(d);if(s!==null){if(!c[cat])c[cat]=[];c[cat].push(s);}});
    return Object.entries(c).map(([n,ss])=>{const sorted=[...ss].sort((a,b)=>a-b);return{name:n,avg:ss.reduce((a,b)=>a+b,0)/ss.length,median:sorted[Math.floor(sorted.length/2)],count:ss.length};}).sort((a,b)=>b.avg-a.avg);
  },[filtered,catLevel,catMap]);
  const dealByCatInsight=useMemo(()=>dealByCat.map(d=>({...d,gap:d.avg-d.median})).sort((a,b)=>b.gap-a.gap),[dealByCat]);

  const dealTime=useMemo(()=>{
    const s=+startYr,e=+endYr,yd={};
    filtered.forEach(d=>{const y=pYear(d['Deal Date']),sz=pSize(d);if(!y||sz===null)return;if(!yd[y])yd[y]={all:[],ipo:[],ma:[]};yd[y].all.push(sz);const dt=d['Deal Type']||'';if(dt.includes('IPO'))yd[y].ipo.push(sz);else if(dt.includes('Merger/Acquisition')||dt.includes('Buyout/LBO'))yd[y].ma.push(sz);});
    const med=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
    const r=[];for(let y=s;y<=e;y++){const d=yd[y]||{all:[],ipo:[],ma:[]};r.push({year:''+y,avg:avg(d.all),median:med(d.all),avgIPO:avg(d.ipo),medianIPO:med(d.ipo),avgMA:avg(d.ma),medianMA:med(d.ma)});}return r;
  },[filtered,startYr,endYr]);

  const ipoMaCat=useMemo(()=>{
    const c={};filtered.forEach(d=>{const cat=gCat(d,catLevel,catMap);if(!c[cat])c[cat]={IPO:0,'M&A':0,Other:0};const dt=d['Deal Type']||'';if(dt.includes('IPO'))c[cat].IPO++;else if(dt.includes('Merger/Acquisition')||dt.includes('Buyout/LBO'))c[cat]['M&A']++;else c[cat].Other++;});
    return Object.entries(c).map(([n,t])=>({name:n,...t,total:t.IPO+t['M&A']+t.Other})).sort((a,b)=>b.total-a.total);
  },[filtered,catLevel,catMap]);

  const top10=useMemo(()=>filtered.map(d=>({...d,_s:pSize(d)})).filter(d=>d._s!==null).sort((a,b)=>b._s-a._s).slice(0,10),[filtered]);

  const sizeHist=useMemo(()=>{
    const bk=[{l:'$0-10M',mn:0,mx:10},{l:'$10-50M',mn:10,mx:50},{l:'$50-100M',mn:50,mx:100},{l:'$100-250M',mn:100,mx:250},{l:'$250-500M',mn:250,mx:500},{l:'$500M-1B',mn:500,mx:1000},{l:'$1B-5B',mn:1000,mx:5000},{l:'$5B+',mn:5000,mx:Infinity}].map(b=>({...b,c:0}));
    filtered.forEach(d=>{const s=pSize(d);if(s!==null){const b=bk.find(b=>s>=b.mn&&s<b.mx);if(b)b.c++;}});return bk.map(b=>({name:b.l,count:b.c,min:b.mn,max:b.mx}));
  },[filtered]);

  const concen=useMemo(()=>{
    const s=+startYr,e=+endYr,r=[];
    for(let y=s;y<=e;y++){const yd=filtered.filter(d=>pYear(d['Deal Date'])===y),cc={};yd.forEach(d=>{const c=gCat(d,catLevel,catMap);cc[c]=(cc[c]||0)+1;});const t=yd.length;let hhi=0;if(t>0)Object.values(cc).forEach(c=>{const s2=c/t;hhi+=s2*s2;});r.push({year:''+y,activeCats:Object.keys(cc).length,hhi:Number(hhi.toFixed(3))});}return r;
  },[filtered,startYr,endYr,catLevel,catMap]);

  const byRegion=useMemo(()=>{const r={};filtered.forEach(d=>{const c=pCountry(gHQ(d)),reg=RM[c]||'Other';r[reg]=(r[reg]||0)+1;});return Object.entries(r).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value);},[filtered]);

  const catGeo=useMemo(()=>{
    const mx={},rs=new Set();filtered.forEach(d=>{const cat=gCat(d,catLevel,catMap),c=pCountry(gHQ(d)),reg=RM[c]||'Other';rs.add(reg);if(!mx[cat])mx[cat]={};mx[cat][reg]=(mx[cat][reg]||0)+1;});
    const regions=[...rs].sort();const rows=Object.entries(mx).map(([cat,rc])=>({category:cat,...rc,total:Object.values(rc).reduce((a,b)=>a+b,0)})).sort((a,b)=>b.total-a.total).slice(0,15);return{rows,regions};
  },[filtered,catLevel,catMap]);

  // File handlers
  const handleUpload=async(ev)=>{const file=ev.target.files[0];if(!file)return;try{const text=await file.text();const {parsed,hdrs,codes}=parseDealText(text);setAllCodes(codes);setDebugInfo({totalRows:parsed.length,cols:hdrs.length});setData(parsed);}catch(e){console.error(e);}};

  const handleImport=async(ev)=>{setImportSt('Reading...');const file=ev.target.files[0];if(!file){setImportSt('');return;}try{const text=await file.text();const lines=text.replace(/^\uFEFF/,'').trim().split('\n').filter(l=>l.trim());const nm={},nc=new Set();for(let i=1;i<lines.length;i++){const l=lines[i].trim();if(!l)continue;const r=[];let cur='',inQ=false;for(let j=0;j<l.length;j++){const ch=l[j];if(ch==='"')inQ=!inQ;else if(ch===','&&!inQ){r.push(cur.trim());cur='';}else cur+=ch;}r.push(cur.trim());if(r.length>=2){const code=r[0].replace(/"/g,'').trim(),cat=r[1].replace(/"/g,'').trim();if(code&&cat){nm[code]=cat;nc.add(cat);}}}setCustCats([...nc].sort());setCatMap(nm);setImportSt(`Imported ${Object.keys(nm).length}`);setTimeout(()=>setImportSt(''),3000);}catch(e){setImportSt('Error');}ev.target.value='';};

  const doExportMap=()=>{const rows=[['Industry Code','Custom Category']];(allCodes.length?allCodes:Object.keys(catMap)).forEach(c=>{const cat=catMap[c]||'';const esc=s=>(!s?'':s.includes(',')?`"${s}"`:s);rows.push([esc(c),esc(cat)]);});setExportPrev({title:'Export Mapping',content:rows.map(r=>r.join(',')).join('\n')});};
  const doExportCSV=()=>{setExportPrev({title:'Export Data',content:[['Category','Count'],...chartData.map(d=>[d.name,d.value])].map(r=>r.join(',')).join('\n')});};

  const updateMap=(code,cat)=>{const nm={...catMap,[code]:cat};setCatMap(nm);setCustCats([...new Set(Object.values(nm))].sort());};
  const addCat=()=>{if(newCatName?.trim()&&!custCats.includes(newCatName.trim()))setCustCats([...custCats,newCatName.trim()].sort());setNewCatName('');};
  const delCat=cat=>{setCustCats(custCats.filter(c=>c!==cat));const nm={...catMap};Object.keys(nm).forEach(c=>{if(nm[c]===cat)delete nm[c];});setCatMap(nm);};

  const mappingSuggestions=useMemo(()=>{
    if(!data.length)return{};
    const groupVotes={},sectorVotes={},industryVotes={},codeMeta={};
    const clean=v=>(v||'').toString().replace(/"/g,'').replace(/\*/g,'').trim();
    const inc=(obj,k,cat,w=1)=>{if(!k||!cat)return;if(!obj[k])obj[k]={};obj[k][cat]=(obj[k][cat]||0)+w;};
    const topK=obj=>{const e=Object.entries(obj||{}).sort((a,b)=>b[1]-a[1])[0];return e?e[0]:null;};
    const merge=(dst,src,w=1)=>{Object.entries(src||{}).forEach(([cat,score])=>{dst[cat]=(dst[cat]||0)+score*w;});};
    data.forEach(d=>{
      const code=clean(d['Primary Industry Code']);if(!code)return;
      const group=clean(d['Primary Industry Group']),sector=clean(d['Primary Industry Sector']);
      const inds=(d['All Industries']||'').toString().replace(/"/g,'').split(',').map(clean).filter(Boolean);
      if(!codeMeta[code])codeMeta[code]={group:{},sector:{},inds:{}};
      if(group)codeMeta[code].group[group]=(codeMeta[code].group[group]||0)+1;
      if(sector)codeMeta[code].sector[sector]=(codeMeta[code].sector[sector]||0)+1;
      inds.forEach(i=>{codeMeta[code].inds[i]=(codeMeta[code].inds[i]||0)+1;});
      const mapped=catMap[code]||DM_FIXED[code];
      if(mapped){inc(groupVotes,group,mapped,3);inc(sectorVotes,sector,mapped,2);inds.forEach(i=>inc(industryVotes,i,mapped,1));}
    });
    const out={};
    Object.entries(codeMeta).forEach(([code,meta])=>{
      if(catMap[code])return;
      const votes={};
      const g=topK(meta.group),s=topK(meta.sector);
      if(g)merge(votes,groupVotes[g],1.5);
      if(s)merge(votes,sectorVotes[s],1.0);
      Object.entries(meta.inds).sort((a,b)=>b[1]-a[1]).slice(0,3).forEach(([ind])=>merge(votes,industryVotes[ind],0.7));
      const best=Object.entries(votes).sort((a,b)=>b[1]-a[1])[0];
      if(best&&best[1]>0)out[code]=best[0];
    });
    return out;
  },[data,catMap]);

  const applyMappingSuggestions=()=>{
    const nm={...catMap};Object.entries(mappingSuggestions).forEach(([code,cat])=>{if(!nm[code])nm[code]=cat;});
    setCatMap(nm);setCustCats([...new Set([...custCats,...Object.values(nm)])].sort());
  };
  const suggestionCount=Object.keys(mappingSuggestions).length;

  const filtCodes=allCodes.filter(code=>{const ms=!searchF||code.toLowerCase().includes(searchF.toLowerCase());const mm=filterMapped==='all'?true:filterMapped==='mapped'?catMap[code]:!catMap[code];return ms&&mm;});

  // Click handlers
  const clickBar=b=>{if(!b?.name)return;setSelCat({name:b.name,companies:filtered.filter(r=>gCat(r,catLevel,catMap)===b.name)});setExpDeal(null);};
  const clickPie=(_,idx)=>{const item=chartData[idx];if(item)clickBar(item);};
  const clickHist=b=>{if(!b)return;const bk=sizeHist.find(x=>x.name===b.name);if(!bk)return;setSelCat({name:`Deals ${b.name}`,companies:filtered.filter(d=>{const s=pSize(d);return s!==null&&s>=bk.min&&s<bk.max;})});setExpDeal(null);};

  const getAcquirers=companies=>{
    const acq={};companies.forEach(c=>{const dt=c['Deal Type']||'';if(dt.includes('Merger/Acquisition')||dt.includes('Buyout/LBO')){const a=gAcq(c);if(a&&a!=='—'){if(!acq[a])acq[a]={count:0,total:0,cos:[]};acq[a].count++;const s=pSize(c);if(s)acq[a].total+=s;acq[a].cos.push(gName(c));}}});
    return Object.entries(acq).map(([n,d])=>({name:n,...d})).sort((a,b)=>b.total-a.total).slice(0,5);
  };

  // Upload screen
  if(isBootLoading){
    return(<div className="w-full min-h-screen bg-gray-50 p-6"><div className="max-w-3xl mx-auto"><div className="bg-white rounded-lg shadow-md p-8"><h2 className="text-xl font-semibold mb-2">Loading default dataset...</h2><p className="text-gray-600">Preparing VC exits data for 2021-2026.</p></div></div></div>);
  }

  if(!data.length){
    return(<div className="w-full min-h-screen bg-gray-50 p-6"><div className="max-w-3xl mx-auto">
      <h1 style={{fontSize:28,fontWeight:700,color:'#1e293b',marginBottom:24}}>VC Exit Analysis Dashboard</h1>
      <div className="bg-white rounded-lg shadow-md p-8"><div className="text-center mb-8">
        <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
        <h2 className="text-xl font-semibold mb-2">Upload Your PitchBook Data</h2>
        {bootErr&&<p className="text-red-600 mb-2">{bootErr}</p>}
        <p className="text-gray-600 mb-4">Save your Excel as tab-delimited .txt and upload</p>
        <label className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700">Choose File<input type="file" className="hidden" accept=".txt,.tsv,.csv" onChange={handleUpload}/></label>
      </div></div></div></div>);
  }

  const tabSt=t=>({padding:'8px 16px',fontSize:13,fontWeight:tab===t?600:400,color:tab===t?'#3b82f6':'#6b7280',cursor:'pointer',background:'none',border:'none',borderBottom:tab===t?'2px solid #3b82f6':'2px solid transparent'});

  return(
    <div className="w-full min-h-screen bg-gray-50 p-4" style={{fontSize:13}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#1e293b',marginBottom:16}}>VC Exit Analysis Dashboard</h1>
        {debugInfo&&<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:12,marginBottom:16,fontSize:13}}><strong style={{color:'#166534'}}>Data loaded:</strong> {debugInfo.totalRows} rows, {debugInfo.cols} columns, {allCodes.length} industry codes</div>}
        <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:'#374151'}}>
          <strong style={{display:'block',marginBottom:6,color:'#92400e'}}>Data Scope & Methodology</strong>
          <div>Source: PitchBook.</div>
          <div>Period: 2021 onward.</div>
          <div>Inclusion criteria: deals with available detail fields (for example deal size and investor/acquirer data).</div>
          <div>Geography: company HQ in the U.S., Canada, or Europe.</div>
          <div>Universe: formerly VC-backed companies only.</div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{fontSize:13,fontWeight:600}}>Filters</h3>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowMapping(!showMapping)} style={{background:'#7c3aed',color:'white',padding:'6px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:4}}><Edit2 style={{width:14,height:14}}/>Map Categories</button>
              <button onClick={doExportCSV} style={{background:'#059669',color:'white',padding:'6px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12}}>Export</button>
              {!showClear?<button onClick={()=>setShowClear(true)} style={{background:'#dc2626',color:'white',padding:'6px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12}}>Clear</button>
              :<span style={{display:'flex',gap:4,alignItems:'center'}}><button onClick={()=>{setCatMap({});setCustCats([]);setShowClear(false);}} style={{background:'#dc2626',color:'white',padding:'4px 8px',borderRadius:4,border:'none',cursor:'pointer',fontSize:11}}>Yes</button><button onClick={()=>setShowClear(false)} style={{background:'#9ca3af',color:'white',padding:'4px 8px',borderRadius:4,border:'none',cursor:'pointer',fontSize:11}}>No</button></span>}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr',gap:12}}>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,marginBottom:6}}>Time: {startYr} – {endYr}</label>
              <div style={{position:'relative',height:32,display:'flex',alignItems:'center'}}>
                <div style={{position:'absolute',left:0,right:0,height:4,backgroundColor:'#e5e7eb',borderRadius:2}}/>
                <input type="range" min="2021" max="2025" step="1" value={startYr} onChange={e=>{if(+e.target.value<=+endYr)setStartYr(e.target.value);}} style={{position:'absolute',left:0,right:0,appearance:'none',WebkitAppearance:'none',background:'transparent',pointerEvents:'none',height:32,width:'100%',zIndex:2}} className="rt"/>
                <input type="range" min="2021" max="2025" step="1" value={endYr} onChange={e=>{if(+e.target.value>=+startYr)setEndYr(e.target.value);}} style={{position:'absolute',left:0,right:0,appearance:'none',WebkitAppearance:'none',background:'transparent',pointerEvents:'none',height:32,width:'100%',zIndex:3}} className="rt"/>
                <style>{`.rt::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3);cursor:pointer;pointer-events:auto}.rt::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3);cursor:pointer;pointer-events:auto}`}</style>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#9ca3af',marginTop:2}}><span>2021</span><span>2022</span><span>2023</span><span>2024</span><span>2025</span></div>
            </div>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,marginBottom:6}}>Deal Size ($M)</label>
              <div style={{display:'flex',gap:6}}>
                <input type="number" min={dealSizeBounds?.min??0} max={effDealMax} step="1" value={effDealMin} onChange={e=>{if(e.target.value===''){setDealMin(null);return;}const v=+e.target.value;if(!Number.isNaN(v)&&v<=effDealMax)setDealMin(v);}} disabled={!dealSizeBounds} placeholder="Min" style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 8px',fontSize:12}}/>
                <input type="number" min={effDealMin} max={dealSizeBounds?.max??0} step="1" value={effDealMax} onChange={e=>{if(e.target.value===''){setDealMax(null);return;}const v=+e.target.value;if(!Number.isNaN(v)&&v>=effDealMin)setDealMax(v);}} disabled={!dealSizeBounds} placeholder="Max" style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 8px',fontSize:12}}/>
                <button onClick={()=>{if(dealSizeBounds){setDealMin(dealSizeBounds.min);setDealMax(dealSizeBounds.max);}}} disabled={!dealSizeBounds} style={{background:'#f3f4f6',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 8px',fontSize:11,cursor:'pointer'}}>Reset</button>
              </div>
              <div style={{fontSize:10,color:'#9ca3af',marginTop:4}}>Available in current scope: {fmtFilterSize(dealSizeBounds?.min??0)} – {fmtFilterSize(dealSizeBounds?.max??0)}</div>
            </div>
            <div><label style={{display:'block',fontSize:12,fontWeight:500,marginBottom:6}}>Location</label>
              <select value={locFilter} onChange={e=>setLocFilter(e.target.value)} style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 8px',fontSize:12}}>
                <option value="all">All Locations</option>
                <optgroup label="Regions">{avRegions.map(([r,c])=><option key={r} value={r}>{r} ({c})</option>)}</optgroup>
                <optgroup label="Countries">{avCountries.slice(0,30).map(([c,n])=><option key={c} value={c}>{c} ({n})</option>)}</optgroup>
              </select></div>
            <div><label style={{display:'block',fontSize:12,fontWeight:500,marginBottom:6}}>Category Level</label>
              <select value={catLevel} onChange={e=>{setCatLevel(e.target.value);setCatFilter('all');}} style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 8px',fontSize:12}}>
                <option value="custom">Omar's Re-mapped Categories</option>
                <option value="sector">PitchBook Industry Sector</option>
                <option value="group">PitchBook Industry Group</option>
                <option value="code">PitchBook Industry Code</option>
              </select></div>
            <div><label style={{display:'block',fontSize:12,fontWeight:500,marginBottom:6}}>Category</label>
              <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 8px',fontSize:12}}>
                <option value="all">All Categories</option>
                {avCats.map(([cat,cnt])=><option key={cat} value={cat}>{cat} ({cnt})</option>)}
              </select></div>
            <div><label style={{display:'block',fontSize:12,fontWeight:500,marginBottom:6}}>Exit Type</label>
              <select value={exitType} onChange={e=>setExitType(e.target.value)} style={{width:'100%',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 8px',fontSize:12}}>
                <option value="all">All Exits</option><option value="IPO">IPOs Only</option><option value="M&A">M&A / LBOs Only</option>
              </select></div>
          </div>
        </div>

        {/* MAPPING */}
        {showMapping&&<div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><h2 style={{fontSize:16,fontWeight:600}}>Omar's Re-mapped Categories</h2><button onClick={()=>setShowMapping(false)} style={{background:'none',border:'none',cursor:'pointer'}}><X style={{width:18,height:18,color:'#6b7280'}}/></button></div>
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
            <input type="text" value={newCatName} onChange={e=>setNewCatName(e.target.value)} onKeyPress={e=>e.key==='Enter'&&addCat()} placeholder="New category..." style={{border:'1px solid #d1d5db',borderRadius:6,padding:'6px 10px',fontSize:12,flex:1,minWidth:150}}/>
            <button onClick={addCat} style={{background:'#3b82f6',color:'white',padding:'6px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12}}>+ Add</button>
            <button onClick={doExportMap} style={{background:'#4b5563',color:'white',padding:'6px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12}}>Export</button>
            <label style={{background:'#4b5563',color:'white',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>Import<input type="file" style={{display:'none'}} accept=".csv,.txt" onChange={handleImport}/></label>
          </div>
          {importSt&&<div style={{padding:8,borderRadius:6,marginBottom:8,fontSize:12,background:importSt.includes('Imported')?'#dcfce7':'#fee2e2'}}>{importSt}</div>}
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <input type="text" value={searchF} onChange={e=>setSearchF(e.target.value)} placeholder="Search codes..." style={{border:'1px solid #d1d5db',borderRadius:6,padding:'4px 8px',fontSize:12,flex:1}}/>
            <select value={filterMapped} onChange={e=>setFilterMapped(e.target.value)} style={{border:'1px solid #d1d5db',borderRadius:6,padding:'4px 8px',fontSize:12}}>
              <option value="all">All ({allCodes.length})</option><option value="unmapped">Unmapped ({allCodes.filter(c=>!catMap[c]).length})</option><option value="mapped">Mapped ({Object.keys(catMap).length})</option>
            </select>
            <button onClick={applyMappingSuggestions} disabled={!suggestionCount} style={{background:suggestionCount?'#0f766e':'#9ca3af',color:'white',padding:'4px 8px',borderRadius:6,border:'none',cursor:suggestionCount?'pointer':'not-allowed',fontSize:12}}>
              Apply Suggestions ({suggestionCount})
            </button>
          </div>
          <div style={{maxHeight:250,overflowY:'auto',border:'1px solid #e5e7eb',borderRadius:6}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}><thead style={{position:'sticky',top:0,background:'#f3f4f6'}}><tr><th style={{textAlign:'left',padding:'6px 8px',fontSize:11}}>Code</th><th style={{textAlign:'left',padding:'6px 8px',fontSize:11}}>Category</th></tr></thead>
            <tbody>{filtCodes.map((code,i)=>{const sug=mappingSuggestions[code];return(<tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}><td style={{padding:'4px 8px',fontSize:11}}>{code}</td><td style={{padding:'4px 8px'}}><div style={{display:'flex',gap:6,alignItems:'center'}}><select value={catMap[code]||''} onChange={e=>updateMap(code,e.target.value)} style={{flex:1,border:'1px solid #d1d5db',borderRadius:4,padding:'2px 4px',fontSize:11}}><option value="">--</option>{sug&&!catMap[code]&&<option value={sug}>Suggested: {sug}</option>}{custCats.map(c=><option key={c} value={c}>{c}</option>)}</select>{sug&&!catMap[code]&&<button onClick={()=>updateMap(code,sug)} style={{background:'#dcfce7',color:'#166534',border:'1px solid #86efac',borderRadius:4,padding:'2px 6px',fontSize:10,cursor:'pointer'}}>Use</button>}</div></td></tr>);})}</tbody></table>
          </div>
        </div>}

        {exportPrev&&<div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><h3 style={{fontWeight:600}}>{exportPrev.title}</h3><button onClick={()=>setExportPrev(null)} style={{background:'none',border:'none',cursor:'pointer'}}><X style={{width:18,height:18}}/></button></div>
          <textarea readOnly value={exportPrev.content} style={{width:'100%',height:150,border:'1px solid #d1d5db',borderRadius:6,padding:8,fontSize:11,fontFamily:'monospace'}} onFocus={e=>e.target.select()}/>
        </div>}

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:16}}>
          {[{l:'Total Exits',v:stats.total.toLocaleString(),c:'#1e293b'},{l:'IPOs',v:stats.ipo.toLocaleString(),c:'#3b82f6'},{l:'M&A / LBOs',v:stats.ma.toLocaleString(),c:'#10b981'},{l:'Median Deal Size',v:stats.median!==null?fmt(stats.median):'—',c:'#f59e0b'},{l:`YoY (${stats.endY} vs ${stats.endY-1})`,v:stats.yoy!==null?`${stats.yoy>0?'+':''}${stats.yoy.toFixed(0)}%`:'—',c:stats.yoy>0?'#10b981':stats.yoy<0?'#ef4444':'#6b7280',s:`${stats.lY}→${stats.tY}`},{l:'Top Category',v:stats.topCat?stats.topCat[0]:'—',c:'#7c3aed',s:stats.topCat?`${stats.topCat[1]} exits`:'',fs:14}].map((k,i)=>
            <div key={i} className="bg-white rounded-lg shadow" style={{padding:12}}>
              <div style={{fontSize:11,color:'#6b7280'}}>{k.l}</div>
              <div style={{fontSize:k.fs||22,fontWeight:700,color:k.c}}>{k.v}</div>
              {k.s&&<div style={{fontSize:10,color:'#9ca3af'}}>{k.s}</div>}
            </div>)}
        </div>

        {/* TABS */}
        <div style={{display:'flex',borderBottom:'1px solid #e5e7eb',marginBottom:16}}>
          {['overview','trends','deals','geo'].map(t=><button key={t} style={tabSt(t)} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
        </div>

        {/* OVERVIEW */}
        {tab==='overview'&&<>
          <div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Exits by Category</h2>
            <ResponsiveContainer width="100%" height={Math.min(700,Math.max(420,chartData.length*28))}><BarChart data={chartData} layout="vertical" margin={{top:10,right:20,left:20,bottom:10}} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3"/><XAxis type="number" tick={{fontSize:11}} allowDecimals={false}/><YAxis type="category" dataKey="name" width={220} interval={0} tick={{fontSize:11}}/><Tooltip/>
              <Bar dataKey="value" fill="#3b82f6" name="Exits" cursor="pointer" onClick={clickBar}/>
            </BarChart></ResponsiveContainer>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div className="bg-white rounded-lg shadow-md" style={{padding:16}}>
              <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>IPO vs M&A Split by Category</h2>
              <ResponsiveContainer width="100%" height={Math.max(360,ipoMaCat.slice(0,15).length*24)}><BarChart data={ipoMaCat.slice(0,15)} layout="vertical" margin={{top:10,right:20,left:20,bottom:10}} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3"/><XAxis type="number" tick={{fontSize:11}} allowDecimals={false}/><YAxis type="category" dataKey="name" width={180} interval={0} tick={{fontSize:11}}/><Tooltip/><Legend/>
                <Bar dataKey="IPO" stackId="a" fill="#3b82f6" cursor="pointer" onClick={clickBar}/>
                <Bar dataKey="M&A" stackId="a" fill="#10b981" cursor="pointer" onClick={clickBar}/>
                <Bar dataKey="Other" stackId="a" fill="#d1d5db" cursor="pointer" onClick={clickBar}/>
              </BarChart></ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow-md" style={{padding:16}}>
              <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Distribution (Top 10)</h2>
              <ResponsiveContainer width="100%" height={350}><PieChart><Pie data={chartData.slice(0,10)} cx="50%" cy="50%" labelLine label={({name,percent})=>`${name}: ${(percent*100).toFixed(1)}%`} outerRadius={100} dataKey="value" onClick={clickPie} cursor="pointer">
                {chartData.slice(0,10).map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
            </div>
          </div>
        </>}

        {/* TRENDS */}
        {tab==='trends'&&<>
          <div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Exits Over Time by Category</h2>
            <ResponsiveContainer width="100%" height={400}><AreaChart data={exitsTime.data} margin={{top:10,right:10,left:10,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Legend wrapperStyle={{fontSize:11}}/>
              {exitsTime.cats.slice(0,12).map((cat,i)=><Area key={cat} type="monotone" dataKey={cat} stackId="1" fill={CL[i%CL.length]} stroke={CL[i%CL.length]} fillOpacity={0.6}/>)}
            </AreaChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Deal Size Over Time (Avg vs Median)</h2>
            <ResponsiveContainer width="100%" height={300}><LineChart data={dealTime} margin={{top:10,right:10,left:10,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`$${v}M`}/><Tooltip content={DollarTooltip}/><Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} name="Avg (All)" dot={{r:4}}/>
              <Line type="monotone" dataKey="median" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Median (All)" dot={{r:3}}/>
              <Line type="monotone" dataKey="avgIPO" stroke="#3b82f6" strokeWidth={2} name="Avg (IPO)" dot={{r:3}}/>
              <Line type="monotone" dataKey="medianIPO" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Median (IPO)" dot={{r:3}}/>
              <Line type="monotone" dataKey="avgMA" stroke="#10b981" strokeWidth={2} name="Avg (M&A)" dot={{r:3}}/>
              <Line type="monotone" dataKey="medianMA" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Median (M&A)" dot={{r:3}}/>
            </LineChart></ResponsiveContainer>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div className="bg-white rounded-lg shadow-md" style={{padding:16}}>
              <h2 style={{fontSize:15,fontWeight:600,marginBottom:6}}>Active Categories by Year</h2>
              <p style={{fontSize:12,color:'#6b7280',marginBottom:10}}>Count of categories with at least one exit in each year. Higher values indicate broader participation across categories.</p>
              <ResponsiveContainer width="100%" height={280}><BarChart data={concen} margin={{top:10,right:10,left:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}} allowDecimals={false}/><Tooltip/><Bar dataKey="activeCats" fill="#3b82f6" name="Active Categories"/>
              </BarChart></ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow-md" style={{padding:16}}>
              <h2 style={{fontSize:15,fontWeight:600,marginBottom:6}}>Concentration Index (HHI) by Year</h2>
              <p style={{fontSize:12,color:'#6b7280',marginBottom:10}}>HHI measures how concentrated exits are across categories. Higher HHI means exits are concentrated in fewer categories.</p>
              <ResponsiveContainer width="100%" height={280}><LineChart data={concen} margin={{top:10,right:10,left:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year" tick={{fontSize:12}}/><YAxis domain={[0,1]} tick={{fontSize:11}}/><Tooltip/><Line type="monotone" dataKey="hhi" stroke="#ef4444" strokeWidth={2} name="HHI" dot={{r:4}}/>
              </LineChart></ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:600,marginBottom:6}}>Deal Size by Category (Avg vs Median)</h2>
            <p style={{fontSize:12,color:'#6b7280',marginBottom:10}}>Sorted by Avg-Median gap to highlight categories where large outlier deals are pulling averages up.</p>
            <ResponsiveContainer width="100%" height={Math.max(420,dealByCatInsight.slice(0,15).length*28)}><BarChart data={dealByCatInsight.slice(0,15)} layout="vertical" margin={{top:10,right:20,left:20,bottom:10}} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3"/><XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`$${v}M`}/><YAxis type="category" dataKey="name" width={220} interval={0} tick={{fontSize:11}}/><Tooltip content={DollarTooltip}/><Legend/>
              <Bar dataKey="median" fill="#0f766e" name="Median ($M)" cursor="pointer" onClick={clickBar}/>
              <Bar dataKey="avg" fill="#ea580c" name="Average ($M)" cursor="pointer" onClick={clickBar}/>
            </BarChart></ResponsiveContainer>
          </div>
        </>}

        {/* DEALS */}
        {tab==='deals'&&<>
          <div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Deal Size Distribution</h2>
            <ResponsiveContainer width="100%" height={300}><BarChart data={sizeHist} margin={{top:10,right:10,left:10,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/>
              <Bar dataKey="count" fill="#8b5cf6" name="Deals" cursor="pointer" onClick={clickHist}/>
            </BarChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Top 10 Largest Deals</h2>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'2px solid #e5e7eb'}}>
                {['#','Company','Category','Type','Date','Size','HQ'].map(h=><th key={h} style={{textAlign:h==='Size'?'right':'left',padding:'8px 10px',fontSize:12,fontWeight:600}}>{h}</th>)}
              </tr></thead>
              <tbody>{top10.map((d,i)=><React.Fragment key={i}>
                <tr style={{borderBottom:'1px solid #f3f4f6',cursor:'pointer',background:expTop10===i?'#f8fafc':'transparent'}} onClick={()=>setExpTop10(expTop10===i?null:i)}>
                  <td style={{padding:'6px 10px',fontSize:12,color:'#9ca3af'}}>{i+1}</td>
                  <td style={{padding:'6px 10px',fontSize:12,fontWeight:500}}>{gName(d)} {expTop10===i?<ChevronUp style={{width:12,height:12,display:'inline'}}/>:<ChevronDown style={{width:12,height:12,display:'inline'}}/>}</td>
                  <td style={{padding:'6px 10px',fontSize:12,color:'#6b7280'}}>{gCat(d,catLevel,catMap)}</td>
                  <td style={{padding:'6px 10px',fontSize:12,color:'#6b7280'}}>{d['Deal Type']||'—'}</td>
                  <td style={{padding:'6px 10px',fontSize:12,color:'#6b7280'}}>{d['Deal Date']||'—'}</td>
                  <td style={{padding:'6px 10px',fontSize:12,fontWeight:600,textAlign:'right'}}>{fmt(d._s)}</td>
                  <td style={{padding:'6px 10px',fontSize:12,color:'#6b7280'}}>{gHQ(d)}</td>
                </tr>
                {expTop10===i&&<tr><td colSpan={7} style={{padding:'4px 10px'}}><DealDetail deal={d} customCategory={gCat(d,'custom',catMap)} onClose={()=>setExpTop10(null)}/></td></tr>}
              </React.Fragment>)}</tbody>
            </table>
          </div>
          <div className="bg-white rounded-lg shadow-md" style={{padding:16}}>
            <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Breakdown by Category</h2>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'2px solid #e5e7eb'}}>{['#','Category','Exits','%'].map(h=><th key={h} style={{textAlign:h==='Exits'||h==='%'?'right':'left',padding:'8px 10px',fontSize:12,fontWeight:600}}>{h}</th>)}</tr></thead>
              <tbody>{chartData.map((item,i)=><tr key={i} style={{borderBottom:'1px solid #f3f4f6',cursor:'pointer'}} onClick={()=>clickBar(item)}>
                <td style={{padding:'6px 10px',fontSize:12,color:'#9ca3af'}}>{i+1}</td>
                <td style={{padding:'6px 10px',fontSize:12}}>{item.name}</td>
                <td style={{padding:'6px 10px',fontSize:12,fontWeight:600,textAlign:'right'}}>{item.value}</td>
                <td style={{padding:'6px 10px',fontSize:12,color:'#6b7280',textAlign:'right'}}>{((item.value/stats.total)*100).toFixed(1)}%</td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}

        {/* GEO */}
        {tab==='geo'&&<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div className="bg-white rounded-lg shadow-md" style={{padding:16}}>
              <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Exits by Region</h2>
              <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={byRegion} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name}: ${(percent*100).toFixed(1)}%`} labelLine>
                {byRegion.map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow-md" style={{padding:16}}>
              <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Top Countries</h2>
              <ResponsiveContainer width="100%" height={300}><BarChart data={avCountries.slice(0,10).map(([n,v])=>({name:n,value:v}))} layout="vertical" margin={{top:10,right:10,left:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis type="number" tick={{fontSize:11}}/><YAxis type="category" dataKey="name" width={100} tick={{fontSize:10}}/><Tooltip/>
                <Bar dataKey="value" fill="#06b6d4" name="Exits"/>
              </BarChart></ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md" style={{padding:16,marginBottom:16}}>
            <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Category × Region</h2>
            <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{borderBottom:'2px solid #e5e7eb'}}>
                <th style={{textAlign:'left',padding:'6px 10px',fontSize:11,fontWeight:600}}>Category</th>
                {catGeo.regions.map(r=><th key={r} style={{textAlign:'center',padding:'6px 8px',fontSize:11,fontWeight:600}}>{r}</th>)}
                <th style={{textAlign:'center',padding:'6px 8px',fontSize:11,fontWeight:600}}>Total</th>
              </tr></thead>
              <tbody>{catGeo.rows.map((row,i)=>{const mx=Math.max(...catGeo.regions.map(r=>row[r]||0));return<tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                <td style={{padding:'4px 10px',fontSize:11,fontWeight:500}}>{row.category}</td>
                {catGeo.regions.map(r=>{const v=row[r]||0;const int=mx>0?v/mx:0;return<td key={r} style={{textAlign:'center',padding:'4px 8px',fontSize:11,background:v>0?`rgba(59,130,246,${.1+int*.5})`:'transparent',fontWeight:v>0?500:400,color:v>0?'#1e40af':'#d1d5db'}}>{v||'·'}</td>;})}
                <td style={{textAlign:'center',padding:'4px 8px',fontSize:11,fontWeight:600}}>{row.total}</td>
              </tr>;})}</tbody>
            </table></div>
          </div>
        </>}

      </div>

      {/* DETAIL MODAL */}
      {selCat&&(
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:24}} onClick={()=>{setSelCat(null);setExpDeal(null);}}>
          <div style={{backgroundColor:'white',borderRadius:12,boxShadow:'0 25px 50px rgba(0,0,0,0.25)',maxWidth:1000,width:'100%',maxHeight:'75vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
              <div><h2 style={{fontSize:16,fontWeight:600}}>{selCat.name}</h2><p style={{fontSize:12,color:'#6b7280'}}>{selCat.companies.length} companies</p></div>
              <button onClick={()=>{setSelCat(null);setExpDeal(null);}} style={{background:'#f3f4f6',borderRadius:8,padding:6,cursor:'pointer',border:'none'}}><X style={{width:16,height:16}}/></button>
            </div>
            <div style={{overflow:'auto',flex:1,padding:'12px 20px 20px'}}>
              {(()=>{
                const top5=selCat.companies.map(c=>({...c,_s:pSize(c)})).filter(c=>c._s!==null).sort((a,b)=>b._s-a._s).slice(0,5);
                if(!top5.length)return null;
                return(<div style={{marginBottom:16}}>
                  <h3 style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>Featured Deals</h3>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
                    {top5.map((d,i)=><button key={i} onClick={()=>setExpDeal(expDeal===i?null:i)}
                      style={{background:expDeal===i?'#eff6ff':'#f8fafc',border:expDeal===i?'1px solid #3b82f6':'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',cursor:'pointer',textAlign:'left',minWidth:150}}>
                      <div style={{fontSize:12,fontWeight:600}}>{gName(d)}</div>
                      <div style={{fontSize:11,color:'#6b7280'}}>{fmt(d._s)} · {d['Deal Type']||''}</div>
                      <div style={{fontSize:10,color:'#64748b'}}>{gCat(d,'custom',catMap)}</div>
                    </button>)}
                  </div>
                  {expDeal!==null&&top5[expDeal]&&<DealDetail deal={top5[expDeal]} customCategory={gCat(top5[expDeal],'custom',catMap)} onClose={()=>setExpDeal(null)}/>}
                </div>);
              })()}
              {(()=>{
                const acqs=getAcquirers(selCat.companies);
                if(!acqs.length)return null;
                return(<div style={{marginBottom:16}}>
                  <h3 style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>Top Acquirers</h3>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {acqs.map((a,i)=><div key={i} style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'6px 10px',fontSize:11}}>
                      <div style={{fontWeight:600,color:'#166534'}}>{a.name}</div>
                      <div style={{color:'#15803d'}}>{a.count} deal{a.count>1?'s':''} · {fmt(a.total)}</div>
                    </div>)}
                  </div>
                </div>);
              })()}
              <h3 style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}}>All Companies</h3>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{position:'sticky',top:0,backgroundColor:'white'}}><tr style={{borderBottom:'2px solid #e5e7eb'}}>
                  {['Company','Category','Date','Type','Size ($M)','HQ'].map(h=><th key={h} style={{textAlign:h.includes('Size')?'right':'left',padding:'8px 6px',fontSize:11,fontWeight:600}}>{h}</th>)}
                </tr></thead>
                <tbody>{selCat.companies.map((c,i)=>{const s=pSize(c);return<tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                  <td style={{padding:'5px 6px',fontSize:11,fontWeight:500}}>{gName(c)}</td>
                  <td style={{padding:'5px 6px',fontSize:11,color:'#475569'}}>{gCat(c,'custom',catMap)}</td>
                  <td style={{padding:'5px 6px',fontSize:11,color:'#6b7280'}}>{c['Deal Date']||'—'}</td>
                  <td style={{padding:'5px 6px',fontSize:11,color:'#6b7280'}}>{c['Deal Type']||'—'}</td>
                  <td style={{padding:'5px 6px',fontSize:11,textAlign:'right'}}>{s!==null?fmt(s):'—'}</td>
                  <td style={{padding:'5px 6px',fontSize:11,color:'#6b7280'}}>{gHQ(c)}</td>
                </tr>;})}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitDashboard;
