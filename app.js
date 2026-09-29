const APP_VERSION='v6.2';
const state={months:{},month:'',chart:null,missingCenter:'',missingRank:'count'};
const RESTAURANT_MAPPING = window.RESTAURANT_MAPPING || {};
const CLASSIFICATION_OVERRIDES = window.CLASSIFICATION_OVERRIDES || {};
function applyMapping(row){const m=RESTAURANT_MAPPING[norm(row.restaurant)];if(m){row.restaurant_code=row.restaurant_code||m.code||'';row.center=m.center||row.center||'';row.group=m.group||row.group||'';}else{row.center=row.center||'未對應';}return row;}
const DIMENSION_ORDER=['速度','品質','正確性','外送異常','其他'];
const ISSUE_ORDER=['遲到/配送時效','餐點品質','包裝/外觀','食安/異物','漏餐/缺品','錯餐/品項錯誤','外送交付','服務態度/處理','系統/訂購/優惠','價格/份量','多重問題/主因不明','其他/無法判斷'];
const ISSUE_DIMENSION={
 '遲到/配送時效':'速度',
 '餐點品質':'品質','包裝/外觀':'外送異常','食安/異物':'品質',
 '漏餐/缺品':'正確性','錯餐/品項錯誤':'正確性',
 '外送交付':'其他','服務態度/處理':'其他','系統/訂購/優惠':'其他','價格/份量':'其他','多重問題/主因不明':'其他','其他/無法判斷':'其他','無評論':'其他'
};
const rules={
 '遲到/配送時效':['遲到','延遲','超時','太慢','很慢','慢了','慢到','久等','等很久','等太久','等待太久','等了一個','等了快','等了將近','等超過','一個多小時','一個小時','1小時','半個多小時','50分鐘','40分鐘','30分鐘','送太久','送很久','時間太久','時間過長','晚到','才送到','才拿到','追餐','預計時間','超過預定','超過時間'],
 '漏餐/缺品':['少了','少一','少兩','少給','少送','漏餐','漏送','沒送','沒有送','沒有附','沒附','未附','缺少','缺了','漏掉','沒拿到','沒有拿到','沒收到','未收到','沒給','沒有給','忘了給','缺餐','送錯餐','送錯品','餐點送錯','拿錯','錯餐','給錯','品項錯','口味錯','數量錯','內容錯','做錯','不是我點','點A送B','錯誤餐點'],
 '錯餐/品項錯誤':['__不使用__'],
 '餐點品質':['沒氣','沒有氣','無氣','氣泡不足','像糖水','白開水','油耗味','冷掉','冷的','冷了','都冷','不熱','溫的','難吃','不好吃','很乾','太乾','柴','太油','油耗味','油味','不脆','軟掉','軟趴趴','濕軟','焦掉','焦黑','炸太久','炸過頭','生的','沒熟','臭','異味','不新鮮','口感','品質','味道','太鹹','太淡','太辣','變質','不好咬','硬'],
 '包裝/外觀':['包裝','灑出','灑了','打翻','倒了','倒的','流出來','外漏','漏出','破掉','破損','壓壞','擠壓','散掉','湯汁','盒子開','袋子破'],
 '食安/異物':['異物','頭髮','毛髮','蟲','蟑螂','蒼蠅','塑膠','鐵絲','發霉','酸掉'],
 '外送交付':['送錯地方','送錯地址','放錯地方','找不到地址','沒有打電話','沒打電話','未聯絡','沒聯絡','放門口','送到別人','送錯地點','外送員找不到'],
 '服務態度/處理':['態度','客服','服務','沒禮貌','不耐煩','口氣','電話沒人接','沒人接','無人接聽','不處理','沒有處理','處理方式','回覆','客訴','抱怨','通知'],
 '系統/訂購/優惠':['app','APP','系統','無法下單','不能下單','不能點','點餐','訂購','訂餐','優惠券','優惠','折扣','付款','刷卡','發票','網站','網頁','會員','點數','兌換'],
 '價格/份量':['太貴','很貴','價格','價錢','份量','太少','縮水','CP值','不划算']
};
const itemRules={飲料:['飲料','可樂','雪碧','紅茶','奶茶','咖啡','汽水'],蛋撻:['蛋撻','蛋塔'],薯條點心:['薯條','雞塊','點心','脆薯','薯餅','雞米花'],炸雞主餐:['炸雞','雞腿','雞翅','漢堡','堡','捲','主餐'],醬料:['醬','番茄醬','辣醬'],餐具用品:['吸管','餐具','紙巾','湯匙','叉子']};
function norm(s){return String(s??'').trim()}
function num(v){if(v===null||v===undefined||norm(v)==='')return null;let n=Number(v);return Number.isFinite(n)?n:null}
function hasAny(t,arr){return arr.some(k=>t.includes(k))}
function findCol(headers,terms){const h=headers.map(x=>norm(x));for(const t of terms){let i=h.findIndex(x=>x===t);if(i>=0)return i}for(const t of terms){let i=h.findIndex(x=>x.includes(t));if(i>=0)return i}return -1}
function dimensionOf(main){return ISSUE_DIMENSION[main]||'其他'}
function keywordHits(text,arr){let score=0;for(const k of arr){if(text.includes(k))score+=Math.max(1,Math.min(4,k.length/2));}return score}
function classify(text){
 text=norm(text);if(!text)return {main:'無評論',dimension:'其他',tags:[],items:[],confidence:'低'};
 // 已人工檢視過的 M8 評論使用校正版，後續月份再走規則引擎。
 let override=CLASSIFICATION_OVERRIDES[text];
 let scores={},tags=[];
 for(const [k,ks] of Object.entries(rules)){let sc=keywordHits(text,ks);if(sc>0){scores[k]=sc;tags.push(k)}}
 let main='其他/無法判斷',confidence='低';
 if(override){main=override;confidence='高';if(!tags.includes(main)&&rules[main])tags.unshift(main)}
 else if(tags.length){
   // 明確因果/強調語句提高主因權重。
   for(const k of tags){for(const w of rules[k]){if(text.includes('因為'+w)||text.includes('主要是'+w)||text.includes('最不能接受'+w)||text.startsWith(w))scores[k]+=5}}
   // 「就算了/還/結果」後方問題通常是顧客最後強調的不滿。
   for(const cue of ['結果','還','竟然','就算了']){let pos=text.lastIndexOf(cue);if(pos>=0){let tail=text.slice(pos);for(const k of tags)if(hasAny(tail,rules[k]))scores[k]+=3}}
   let ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);main=ranked[0][0];confidence=ranked.length===1||ranked[0][1]>=ranked[1][1]+2?'高':'中';
   if(ranked.length>1&&ranked[0][1]===ranked[1][1]&&text.length<18){main='多重問題/主因不明';confidence='低'}
 }
 let items=[];if(tags.includes('漏餐/缺品')||main==='漏餐/缺品')for(const [k,ks] of Object.entries(itemRules))if(hasAny(text,ks))items.push(k);if((tags.includes('漏餐/缺品')||main==='漏餐/缺品')&&!items.length)items=['未說明品項'];
 return {main,dimension:dimensionOf(main),tags,items,confidence};
}
function stableDate(v){if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,19);let s=norm(v);return s.replace(/\.000Z$/,'').replace(/Z$/,'')}
function detectMonth(rows,dateIdx){for(const r of rows){let v=r[dateIdx];if(v instanceof Date&&!isNaN(v))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}`;if(typeof v==='number'&&window.XLSX){let d=XLSX.SSF.parse_date_code(v);if(d)return `${d.y}-${String(d.m).padStart(2,'0')}`;}let s=norm(v);let m=s.match(/(20\d{2})[\/\-.年](\d{1,2})/);if(m)return `${m[1]}-${m[2].padStart(2,'0')}`;}return prompt('無法從日期欄辨識月份，請輸入報告月份，例如 2026-09：','2026-09')||''}
function loadLocal(){try{state.months=JSON.parse(localStorage.getItem('gesMonths')||'{}')}catch{};for(const m of Object.keys(state.months)){let seen=new Set(),clean=[];for(let r of (state.months[m].rows||[])){if(r.score===0||r.score===null||r.score===undefined)continue;let c=classify(r.comment);Object.assign(r,{main:c.main,dimension:c.dimension,tags:c.tags,items:c.items,confidence:c.confidence,date:stableDate(r.date)});let k=rowKey(r);if(seen.has(k))continue;seen.add(k);clean.push(r)}state.months[m].rows=clean;state.months[m].version=APP_VERSION}saveLocal();const ks=Object.keys(state.months).sort();if(ks.length){state.month=ks.at(-1);refreshMonthSelect();render()}}
function saveLocal(){localStorage.setItem('gesMonths',JSON.stringify(state.months))}
function refreshMonthSelect(){const s=document.querySelector('#monthSelect');let ks=Object.keys(state.months).sort().reverse();s.innerHTML=ks.length?ks.map(m=>`<option ${m===state.month?'selected':''}>${m}</option>`).join(''):'<option value="">尚未匯入月份</option>'}
async function repairPowerBIWorkbook(arrayBuffer){
 // Power BI 有些匯出檔把 worksheet dimension 寫成 A1，SheetJS 會因此只解析第一格。
 // 必須在 XLSX.read 之前直接修正 worksheet XML，讀完後再修已經太晚。
 if(!window.JSZip) return arrayBuffer;
 const zip=await JSZip.loadAsync(arrayBuffer);
 const names=Object.keys(zip.files).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n));
 let changed=false;
 for(const name of names){
   let xml=await zip.file(name).async('string');
   const refs=[...xml.matchAll(/<c\s+[^>]*r="([A-Z]+)(\d+)"/g)];
   if(!refs.length) continue;
   let maxRow=1,maxCol=1;
   for(const m of refs){
     maxRow=Math.max(maxRow,Number(m[2]));
     let col=0; for(const ch of m[1]) col=col*26+(ch.charCodeAt(0)-64);
     maxCol=Math.max(maxCol,col);
   }
   let colName=''; let n=maxCol; while(n){n--;colName=String.fromCharCode(65+(n%26))+colName;n=Math.floor(n/26)}
   const ref=`A1:${colName}${maxRow}`;
   if(/<dimension\s+ref="A1"\s*\/>/.test(xml)){xml=xml.replace(/<dimension\s+ref="A1"\s*\/>/,`<dimension ref="${ref}"/>`);changed=true}
   else if(/<dimension\s+ref="[^"]+"\s*\/>/.test(xml)){
     const old=(xml.match(/<dimension\s+ref="([^"]+)"/)||[])[1]||'';
     if(old!==ref){xml=xml.replace(/<dimension\s+ref="[^"]+"\s*\/>/,`<dimension ref="${ref}"/>`);changed=true}
   }
   zip.file(name,xml);
 }
 return changed ? await zip.generateAsync({type:'arraybuffer',compression:'DEFLATE'}) : arrayBuffer;
}
function rowKey(r){return [stableDate(r.date),norm(r.restaurant),r.score===null?'':String(r.score),norm(r.comment)].join('¦')}
async function importFile(file){const original=await file.arrayBuffer();const data=await repairPowerBIWorkbook(original);const wb=XLSX.read(data,{type:'array',cellDates:true});let best=null;for(const sn of wb.SheetNames){const ws=wb.Sheets[sn];let a=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});if(!a.length)continue;let hi=a.findIndex(r=>r.some(c=>norm(c).includes('OSAT')));if(hi<0)hi=0;let headers=a[hi].map(norm);let score=findCol(headers,['綜合評級（OSAT、Google、外送平台）','綜合評級','OSAT整體滿意度','整體滿意度']);let comment=findCol(headers,['OSAT整體滿意度評論','整體滿意度評論','OSAT評論']);let rest=findCol(headers,['餐廳_名稱','餐廳名稱','餐廳','Restaurant']);if(score>=0&&comment>=0&&rest>=0){best={a,hi,headers,score,comment,rest};break}}
 if(!best)throw new Error('找不到必要欄位：餐廳、OSAT分數、OSAT整體滿意度評論。');
 const {a,hi,headers,score,comment,rest}=best;const date=findCol(headers,['日期','填寫時間','Survey Date','Date']);const center=findCol(headers,['中心','外送中心']);const group=findCol(headers,['Group','group']);const code=findCol(headers,['餐廳代碼','餐廳編號','Restaurant Code']);let month=detectMonth(a.slice(hi+1),date);if(!month)return;
 let rows=a.slice(hi+1).filter(r=>norm(r[rest])||num(r[score])!==null).map((r,i)=>{let sc=num(r[score]);let txt=norm(r[comment]);let c=classify(txt);return applyMapping({id:i+1,restaurant:norm(r[rest]),restaurant_code:code>=0?norm(r[code]):'',center:center>=0?norm(r[center]):'',group:group>=0?norm(r[group]):'',score:sc,comment:txt,isLow:sc!==null&&sc>=1&&sc<=3,hasComment:!!txt,main:c.main,dimension:c.dimension,tags:c.tags,items:c.items,confidence:c.confidence,date:date>=0?stableDate(r[date]):''})});
 // 同月份採逐筆去重：日期＋餐廳＋評分＋評論完全相同視為同一筆。
 let previous=state.months[month]?.rows||[];
 // 自動淘汰舊版解析錯誤留下的 1 筆資料。
 if((state.months[month]?.version||'')!==APP_VERSION && previous.length<=1 && rows.length>1) previous=[];
 const seen=new Set(); const merged=[]; let duplicateCount=0;
 for(const r of [...previous,...rows]){const k=rowKey(r);if(seen.has(k)){duplicateCount++;continue}seen.add(k);merged.push(r)}
 const added=Math.max(0,merged.length-previous.length);
 state.months[month]={file:file.name,rows:merged,version:APP_VERSION};state.month=month;saveLocal();refreshMonthSelect();render();
 const valid=rows.filter(r=>r.score!==null).length, lowN=rows.filter(r=>r.isLow).length, oneN=rows.filter(r=>r.score===1).length;
 const mapped=rows.filter(r=>r.center&&r.center!=='未對應').length, unmapped=rows.length-mapped;
 showImportCheck({read:rows.length,valid,low:lowN,one:oneN,mapped,unmapped,added,duplicateCount,file:file.name});
 toast(`成功解析 ${rows.length.toLocaleString()} 筆｜新增 ${added.toLocaleString()}｜重複排除 ${duplicateCount.toLocaleString()}`)}
function showImportCheck(x){const e=document.querySelector('#importCheck');if(!e)return;e.style.display='block';e.innerHTML=`<h3>匯入檢查｜${esc(x.file)}</h3><div class="kpi-grid">${kpi('成功解析',x.read.toLocaleString(),'Excel資料列')}${kpi('有效評分',x.valid.toLocaleString(),'應與問卷筆數一致')}${kpi('1～3分',x.low.toLocaleString(),'低分資料')}${kpi('1分',x.one.toLocaleString(),'嚴重低分')}${kpi('Mapping成功',x.mapped.toLocaleString(),`未對應 ${x.unmapped.toLocaleString()} 筆`)}${kpi('重複排除',x.duplicateCount.toLocaleString(),`新增 ${x.added.toLocaleString()} 筆`)}</div>`}
function current(){return state.months[state.month]?.rows||[]}function low(){return current().filter(r=>r.isLow)}function comments(){return low().filter(r=>r.hasComment)}
function pct(a,b){return b?100*a/b:0}function fmtp(v){return `${v.toFixed(1)}%`}function esc(s){return norm(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function groupBy(arr,key){let m={};for(const r of arr){let k=typeof key==='function'?key(r):r[key];(m[k||'未對應']??=[]).push(r)}return m}
function kpi(label,value,note=''){return `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="note">${note}</div></div>`}
function render(){const all=current(),lo=low(),co=comments();document.querySelector('#dataStatus').textContent=all.length?`${state.month}｜${all.length.toLocaleString()} 筆`:'尚未匯入資料';const dc=Object.fromEntries(DIMENSION_ORDER.map(d=>[d,co.filter(r=>(r.dimension||dimensionOf(r.main))===d).length]));document.querySelector('#kpis').innerHTML=[kpi('有效問卷',all.filter(r=>r.score!==null).length.toLocaleString(),'當月匯入'),kpi('1～3分',lo.length.toLocaleString(),`低分率 ${fmtp(pct(lo.length,all.filter(r=>r.score!==null).length))}`),kpi('速度為主因',dc['速度'].toLocaleString(),fmtp(pct(dc['速度'],co.length))),kpi('品質為主因',dc['品質'].toLocaleString(),fmtp(pct(dc['品質'],co.length))),kpi('正確性為主因',dc['正確性'].toLocaleString(),fmtp(pct(dc['正確性'],co.length))),kpi('1分件數',lo.filter(r=>r.score===1).length.toLocaleString(),'嚴重低分')].join('');renderIssues(co);renderCenters(all);renderRestaurants(all);renderMissing(co);renderComments();renderTrend();renderFinding(all,co)}
function renderIssues(co){let dimCnt=Object.fromEntries(DIMENSION_ORDER.map(d=>[d,0]));for(const r of co)dimCnt[r.dimension||dimensionOf(r.main)]++;let dimData=DIMENSION_ORDER.map(d=>[d,dimCnt[d]]).filter(x=>x[1]);if(state.chart)state.chart.destroy();state.chart=new Chart(document.querySelector('#issueChart'),{type:'bar',data:{labels:dimData.map(x=>x[0]),datasets:[{label:'主因筆數',data:dimData.map(x=>x[1])}]},options:{responsive:true,plugins:{legend:{display:false}}}});let cnt={};for(const k of ISSUE_ORDER)cnt[k]=0;for(const r of co)cnt[r.main]=(cnt[r.main]||0)+1;let detail=Object.entries(cnt).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);document.querySelector('#issueTable').innerHTML=`<div class="grid2"><div class="card"><h3>外送核心構面</h3>${table(['構面','主因筆數','占有文字低分'],dimData.map(([d,v])=>[d,v,fmtp(pct(v,co.length))]))}</div><div class="card"><h3>細項原因</h3>${table(['構面','主要不滿','主因筆數','占有文字低分','有提及筆數'],detail.map(([k,v])=>[dimensionOf(k),k,v,fmtp(pct(v,co.length)),co.filter(r=>r.tags.includes(k)).length]))}</div></div>`}

function centerStats(all){return Object.entries(groupBy(all,'center')).map(([c,rs])=>{let valid=rs.filter(r=>r.score!==null),lo=valid.filter(r=>r.isLow),co=lo.filter(r=>r.hasComment),main=topMain(co);return{c,survey:valid.length,low:lo.length,rate:pct(lo.length,valid.length),share:0,main,dimension:dimensionOf(main)}}).map(x=>({...x,share:pct(x.low,all.filter(r=>r.isLow).length)})).sort((a,b)=>b.low-a.low)}
function renderCenters(all){let s=centerStats(all);let rows=s.map(x=>[x.c,x.survey,x.low,fmtp(x.rate),fmtp(x.share),x.dimension,x.main]);document.querySelector('#centerTable').innerHTML=table(['中心','問卷數','1～3分','低分率','占市場低分','主要構面','主要問題'],rows);document.querySelector('#centerDetail').innerHTML=`<div class="card">${table(['中心','問卷數','低分件數','低分率','市場低分貢獻','主要構面','主要問題'],rows)}</div>`;let fs=document.querySelector('#filterCenter'),cur=fs.value;fs.innerHTML='<option value="">全部中心</option>'+s.map(x=>`<option>${esc(x.c)}</option>`).join('');fs.value=cur}
function topMain(co){let m={};for(const r of co)m[r.main]=(m[r.main]||0)+1;return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0]||'-'}
function restaurantStats(all){return Object.entries(groupBy(all,'restaurant')).map(([name,rs])=>{let valid=rs.filter(r=>r.score!==null),lo=valid.filter(r=>r.isLow),co=lo.filter(r=>r.hasComment);return{name,center:rs.find(r=>r.center)?.center||'未對應',group:rs.find(r=>r.group)?.group||'',survey:valid.length,low:lo.length,rate:pct(lo.length,valid.length),one:lo.filter(r=>r.score===1).length,main:topMain(co),dimension:dimensionOf(topMain(co))}}).filter(x=>x.low).sort((a,b)=>(b.low-a.low)||(b.rate-a.rate))}
function renderRestaurants(all){let rs=restaurantStats(all);document.querySelector('#restaurantTable').innerHTML=`<div class="card"><div class="scroll">${table(['中心','Group','餐廳','問卷數','低分件數','低分率','1分','主要構面','主要問題'],rs.map(x=>[x.center,x.group,x.name,x.survey,x.low,fmtp(x.rate),x.one,x.dimension,x.main]))}</div></div>`}
function renderMissing(co){
 const all=current();
 const centers=[...new Set(all.map(r=>r.center||'未對應'))].sort();
 let miss=co.filter(r=>r.main==='漏餐/缺品'||r.tags.includes('漏餐/缺品'));
 if(state.missingCenter)miss=miss.filter(r=>(r.center||'未對應')===state.missingCenter);
 let base=state.missingCenter?all.filter(r=>(r.center||'未對應')===state.missingCenter):all;
 let items={};for(const r of miss)for(const i of (r.items||[]))items[i]=(items[i]||0)+1;
 let grouped=Object.entries(groupBy(miss,'restaurant')).map(([name,v])=>{
   const sample=base.filter(r=>r.restaurant===name&&r.score!==null).length;
   const count=v.length,rate=pct(count,sample);
   const itemCount={};for(const r of v)for(const i of (r.items||[]))itemCount[i]=(itemCount[i]||0)+1;
   const topItems=Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]).join('、')||'未說明品項';
   return {center:v[0]?.center||'未對應',group:v[0]?.group||'',name,count,sample,rate,topItems,comments:v.map(x=>x.comment)};
 });
 grouped.sort((a,b)=>state.missingRank==='rate'?(b.rate-a.rate)||(b.count-a.count):(b.count-a.count)||(b.rate-a.rate));
 const totalSurvey=base.filter(r=>r.score!==null).length;
 const restaurantCount=new Set(miss.map(r=>r.restaurant)).size;
 const topItem=Object.entries(items).sort((a,b)=>b[1]-a[1])[0]?.[0]||'-';
 const filterHtml=`<div class="filters"><select id="missingCenter"><option value="">全市場</option>${centers.map(c=>`<option value="${esc(c)}" ${c===state.missingCenter?'selected':''}>${esc(c)}</option>`).join('')}</select><select id="missingRank"><option value="count" ${state.missingRank==='count'?'selected':''}>依漏餐筆數排名</option><option value="rate" ${state.missingRank==='rate'?'selected':''}>依漏餐率排名</option></select></div>`;
 const kpis=`<div class="kpi-grid">${kpi('漏餐評論',miss.length.toLocaleString(),state.missingCenter||'全市場')}${kpi('涉及餐廳',restaurantCount.toLocaleString(),'有漏餐反映')}${kpi('最常漏品項',topItem,Object.entries(items).sort((a,b)=>b[1]-a[1])[0]?.[1]?`${Object.entries(items).sort((a,b)=>b[1]-a[1])[0][1]} 次提及`:'尚無資料')}${kpi('漏餐率',fmtp(pct(miss.length,totalSurvey)),'漏餐評論 ÷ 有效問卷')}</div>`;
 const rankRows=grouped.map((x,i)=>[i+1,x.center,x.group,x.name,x.count,x.sample,fmtp(x.rate),x.topItems]);
 const commentRows=grouped.flatMap(x=>x.comments.map(c=>[x.center,x.group,x.name,c]));
 document.querySelector('#missingContent').innerHTML=`${filterHtml}${kpis}<div class="grid2"><div class="card"><h3>漏餐品項排名</h3>${table(['排名','品項','提及次數'],Object.entries(items).sort((a,b)=>b[1]-a[1]).map((x,i)=>[i+1,x[0],x[1]]))}</div><div class="card"><h3>漏餐餐廳排名</h3><div class="scroll">${table(['排名','中心','Group','餐廳','漏餐筆數','有效問卷','漏餐率','主要漏品'],rankRows)}</div></div></div><div class="card" style="margin-top:16px"><h3>漏餐原始評論</h3><div class="scroll">${table(['中心','Group','餐廳','顧客評論'],commentRows)}</div></div>`;
 document.querySelector('#missingCenter').onchange=e=>{state.missingCenter=e.target.value;renderMissing(comments())};
 document.querySelector('#missingRank').onchange=e=>{state.missingRank=e.target.value;renderMissing(comments())};
}
function renderComments(){let co=comments(),fc=document.querySelector('#filterCenter')?.value||'',fi=document.querySelector('#filterIssue')?.value||'',ft=(document.querySelector('#filterText')?.value||'').trim();let issues=[...new Set(co.map(r=>r.main))].sort(),sel=document.querySelector('#filterIssue'),old=sel.value;sel.innerHTML='<option value="">全部主因</option>'+issues.map(x=>`<option>${esc(x)}</option>`).join('');sel.value=old;co=co.filter(r=>(!fc||r.center===fc)&&(!fi||r.main===fi)&&(!ft||(r.restaurant+r.comment).includes(ft)));document.querySelector('#commentsTable').innerHTML=`<div class="card"><div class="scroll">${table(['中心','Group','餐廳','分數','主要構面','主要不滿','其他標籤','漏餐品項','顧客評論'],co.map(r=>[r.center||'未對應',r.group,r.restaurant,r.score,r.dimension||dimensionOf(r.main),r.main,r.tags.join('、'),r.items.join('、'),r.comment]))}</div></div>`}
function renderFinding(all,co){if(!all.length){document.querySelector('#finding').innerHTML='匯入當月 GES Excel 後自動產生。';return}let dims=Object.fromEntries(DIMENSION_ORDER.map(d=>[d,co.filter(r=>(r.dimension||dimensionOf(r.main))===d).length]));let centers=centerStats(all).filter(x=>x.c!=='未對應').slice(0,2);let t=`<b>${state.month} 市場方向</b><br>1～3分共 <b>${low().length}</b> 筆，其中有文字評論 <b>${co.length}</b> 筆。<br><br>外送核心構面：<b>速度</b> ${dims['速度']}筆 (${fmtp(pct(dims['速度'],co.length))})、<b>品質</b> ${dims['品質']}筆 (${fmtp(pct(dims['品質'],co.length))})、<b>正確性</b> ${dims['正確性']}筆 (${fmtp(pct(dims['正確性'],co.length))})、<b>外送異常</b> ${dims['外送異常']}筆 (${fmtp(pct(dims['外送異常'],co.length))})。`;if(centers.length)t+=`<br><br>低分件數較集中的中心為 ${centers.map(x=>`<b>${x.c}</b> ${x.low}筆`).join('、')}。`;t+=`<br><br><span class="empty">※ 主因代表顧客文字中的主要不滿；速度、品質、正確性為外送三大核心構面；傾倒／外漏／包裝破損獨立列為外送異常，不等同 DMS 可驗證的營運根因。</span>`;document.querySelector('#finding').innerHTML=t}

function renderTrend(){let ks=Object.keys(state.months).sort(),idx=ks.indexOf(state.month);if(idx<=0){document.querySelector('#trendContent').innerHTML='至少匯入兩個月份後，即可比較改善、持續異常與惡化餐廳。';return}let prev=ks[idx-1],curStats=restaurantStats(state.months[state.month].rows),preStats=restaurantStats(state.months[prev].rows),pm=Object.fromEntries(preStats.map(x=>[x.name,x]));let out=curStats.filter(x=>pm[x.name]).map(x=>{let p=pm[x.name],d=x.rate-p.rate;let st=d<=-3?'改善':d>=3?'惡化':'持續關注';return[x.center,x.name,fmtp(p.rate),fmtp(x.rate),`${d>=0?'+':''}${d.toFixed(1)} pp`,st,x.main]}).sort((a,b)=>parseFloat(b[4])-parseFloat(a[4]));document.querySelector('#trendContent').innerHTML=`<h3>${prev} → ${state.month}</h3>${table(['中心','餐廳','上月低分率','本月低分率','變化','狀態','本月主要問題'],out)}`}
function table(headers,rows){return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map((c,i)=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="empty">目前沒有資料</td></tr>`}</tbody></table>`}
function exportAnalysis(){let rs=restaurantStats(current()),co=comments();let wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rs),'餐廳分析');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(co.map(r=>({中心:r.center,Group:r.group,餐廳:r.restaurant,分數:r.score,主要構面:r.dimension||dimensionOf(r.main),主要不滿:r.main,問題標籤:r.tags.join('、'),漏餐品項:r.items.join('、'),評論:r.comment}))),'評論明細');XLSX.writeFile(wb,`GES分析_${state.month||'未指定'}.xlsx`)}
function toast(t){let e=document.querySelector('#toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',2600)}
document.querySelector('#importBtn').onclick=()=>document.querySelector('#fileInput').click();document.querySelector('#fileInput').onchange=e=>e.target.files[0]&&importFile(e.target.files[0]).catch(err=>alert(err.message));document.querySelector('#monthSelect').onchange=e=>{state.month=e.target.value;render()};document.querySelectorAll('.tab:not(.disabled)').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#'+b.dataset.page).classList.add('active')});['filterCenter','filterIssue'].forEach(id=>document.querySelector('#'+id).onchange=renderComments);document.querySelector('#filterText').oninput=renderComments;document.querySelector('#exportBtn').onclick=exportAnalysis;loadLocal();
