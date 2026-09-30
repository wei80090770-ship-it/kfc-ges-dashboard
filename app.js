const APP_VERSION='v8.9';
const SUPABASE_URL='https://piccgvophhtnmggwwobn.supabase.co';
const SUPABASE_KEY='sb_publishable_2SPa8TbrgAhbglUKdk3VGg_9DvRriFP';
const GES_TABLE='ges_responses';
const state={months:{},month:'',chart:null,globalCenter:'',restaurantRank:'low',missingRank:'count',complaints:[],thirdParty:[],complaintSource:'all',complaintCenter:'',complaintRestaurantCode:''};
const RESTAURANT_MAPPING = window.RESTAURANT_MAPPING || {};
const CLASSIFICATION_OVERRIDES = window.CLASSIFICATION_OVERRIDES || {};
function applyMapping(row){const m=RESTAURANT_MAPPING[norm(row.restaurant)];if(m){row.restaurant_code=row.restaurant_code||m.code||'';row.center=m.center||row.center||'';row.group=m.group||row.group||'';}else{row.center=row.center||'未對應';}return row;}
const DIMENSION_ORDER=['速度','品質','正確性','外送異常','服務/處理','系統/訂購','價格/份量','其他'];
const ISSUE_ORDER=['遲到/配送時效','過早送達','餐點品質','包裝/外觀','食安/異物','漏餐/缺品','錯餐/品項錯誤','外送交付','服務態度/處理','系統/訂購/優惠','價格/份量','多重問題/主因不明','其他/無法判斷'];
const ISSUE_DIMENSION={
 '遲到/配送時效':'速度','過早送達':'速度',
 '餐點品質':'品質','食安/異物':'品質',
 '包裝/外觀':'外送異常',
 '漏餐/缺品':'正確性','錯餐/品項錯誤':'正確性',
 '外送交付':'服務/處理','服務態度/處理':'服務/處理',
 '系統/訂購/優惠':'系統/訂購','價格/份量':'價格/份量',
 '多重問題/主因不明':'其他','其他/無法判斷':'其他','無評論':'其他'
};
const rules={
 '遲到/配送時效':['遲到','晚了一小時','晚了','一延再延','一直延後','延後','未按時','沒有按時','備餐久','取餐久','等外送','延遲','延誤','超時','太慢','很慢','慢了','慢到','久等','等很久','等太久','等待太久','等了一個','等了快','等了將近','等超過','一個多小時','一個小時','1小時','半個多小時','50分鐘','40分鐘','30分鐘','送太久','送很久','時間太久','時間過長','晚到','才送到','追餐','超過預定','超過時間','預估外送時間與實際不符','預計送達時間跟實際','未準時','沒有準時','配送速度','外送速度有待改善'],
 '過早送達':['提早送達','提早送到','提前送達','提前送到','過早送達','過早送到','太早送到','太早送達','提早了','提前了','預定時間前'],
 '漏餐/缺品':['餐點缺漏','餐點遺漏','東西送的不齊','送的不齊','少餐點','少東西','少餐','漏東西','沒醬','沒有醬','未附醬','沒餐具','沒有餐具','沒吸管','沒有吸管','沒手套','沒有手套','贈品未收到','贈品沒收到','缺餐','漏餐','漏送','少送','少給','少了','少一','少兩','缺少','缺了','漏掉','沒附','未附','沒有附','沒給','未給','沒有給','忘了給','沒拿到','沒有拿到','沒收到','未收到','沒提供','未提供','沒有提供','欠東西','漏放','少放','贈品沒給','餐具都沒有','一包都沒有','都沒提供'],
 '錯餐/品項錯誤':['送錯餐','點錯送錯','去冰.*正常冰','無糖.*有糖','有糖.*無糖','點.{0,10}收到','點.{0,10}來的是','送錯單','送錯品','餐點送錯','餐點有誤','餐點錯','拿錯','錯餐','給錯','品項錯','品項有誤','口味錯','數量錯','數量不對','內容錯','做錯','不是我點','點A送B','錯誤餐點','來的是','全辣','全不辣'],
 '餐點品質':['沒氣','偏乾','偏軟','不酥','不酥脆','酸腐味','酸味','腥','炸雞軟','皮軟','餐點不夠熱','不夠熱','沒有氣','無氣','氣泡不足','像糖水','白開水','油耗味','冷掉','冷的','冷了','都冷','不熱','溫的','難吃','不好吃','很乾','太乾','乾柴','柴','太油','油味','不脆','軟掉','軟趴趴','濕軟','焦掉','焦黑','炸太久','炸過頭','生的','沒熟','臭','異味','不新鮮','口感','品質','味道','太鹹','太淡','太辣','變質','不好咬','很硬','肉很硬','雞腥味','不入味','美味程度不足','不好吃'],
 '包裝/外觀':['飲料封裝不當','盒子凹陷','盒子壓扁','被壓在一起','壓在一起','雞汁漏','湯漏','醬汁漏','包裝破損','包裝','灑出','灑了','撒出','撒了','打翻','倒翻','飲料倒','飲料漏','飲料破','流出來','外漏','漏出','破掉','破損','壓壞','擠壓','變形','散掉','湯汁','盒子開','袋子破','封膜裂開','浸泡','濕掉','紙袋濕'],
 '食安/異物':['異物','頭髮','毛髮','蟲','蟑螂','蒼蠅','塑膠','鐵絲','發霉','酸掉','水瀉','食安','食品安全'],
 '外送交付':['送錯地方','送錯地址','放錯地方','找不到地址','找不到位置','沒有打電話','沒打電話','未聯絡','沒聯絡','放門口','丟在門口','送到別人','送錯地點','外送員找不到','沒有送到具體','不看備註','地址錯','地址不完整'],
 '服務態度/處理':['態度差','態度極差','沒禮貌','不耐煩','口氣不好','電話沒人接','無人接聽','不處理','沒有處理','沒處理','處理方式','客服沒回','客服未回','沒有回覆','沒回覆','未回覆','無法聯絡客服','客服忙線','沒通知','未通知','沒有通知','沒告知','未告知','沒有告知','客訴沒處理','服務差'],
 '系統/訂購/優惠':['app問題','APP問題','系統問題','系統顯示','系統未更新','進度未更新','時間未更新','外送地圖','地圖','無法下單','不能下單','無法點餐','不能點餐','優惠券','優惠','折扣','付款問題','刷卡問題','發票問題','網站問題','網頁問題','會員問題','點數','兌換','訂單消失','被取消','取消訂單'],
 '價格/份量':['太貴','很貴','價格','價錢','份量','太少','縮水','CP值','不划算','份量不足','少得離譜','變小']
};
const itemRules={飲料:['飲料','可樂','雪碧','紅茶','奶茶','咖啡','汽水'],蛋撻:['蛋撻','蛋塔'],薯條點心:['薯條','雞塊','點心','脆薯','薯餅','雞米花'],炸雞主餐:['炸雞','雞腿','雞翅','漢堡','堡','捲','主餐'],醬料:['醬','番茄醬','辣醬','胡椒'],餐具用品:['吸管','餐具','紙巾','湯匙','叉子','手套']};
function norm(s){return String(s??'').trim()}
function num(v){if(v===null||v===undefined||norm(v)==='')return null;let n=Number(v);return Number.isFinite(n)?n:null}
function hasAny(t,arr){return arr.some(k=>t.includes(k))}
function findCol(headers,terms){const h=headers.map(x=>norm(x));for(const t of terms){let i=h.findIndex(x=>x===t);if(i>=0)return i}for(const t of terms){let i=h.findIndex(x=>x.includes(t));if(i>=0)return i}return -1}
function dimensionOf(main){return ISSUE_DIMENSION[main]||'其他'}
function keywordHits(text,arr){let score=0;for(const k of arr){if(text.includes(k))score+=Math.max(1,Math.min(6,k.length/2));}return score}
function classify(text){
 text=norm(text);if(!text)return {main:'無評論',dimension:'其他',tags:[],items:[],confidence:'低',positiveOnly:false};
 // 先辨識「純正向」評論。低分問卷仍保留在問卷母數，但不列入問題分析。
 const positiveRe=/(很滿意|非常滿意|滿意|很好|很棒|很讚|很親切|很有禮貌|態度佳|態度很好|服務很好|服務很棒|效率很棒|送餐很快|外送快速|準時送達|準時到達|準時抵達|提早且準時|餐點好吃|很好吃|美味|優質|nice|great|good|good service|thank|thanks|感謝|謝謝|送時間很準時|送餐時間很準時|still hot)/i;
 const negativeRe=/(不滿|失望|不好|很差|太差|爛|遲到|延遲|延誤|超時|晚到|太慢|很慢|等很久|等太久|冷掉|不熱|難吃|油耗|沒氣|乾柴|很乾|太乾|不脆|軟掉|漏餐|漏送|少送|少給|缺少|缺餐|沒附|未附|沒有附|沒給|未給|送錯|品項錯|口味錯|數量錯|灑|撒|漏出|外漏|打翻|破損|壓壞|擠壓|態度差|不耐煩|沒通知|未通知|沒告知|未告知|找不到|送錯地址|系統問題|無法下單|優惠.*問題|太貴|份量.*少|縮水|變小|很小|異物|毛髮|沒熟|水瀉|晚了|延後|一延再延|未按時|餐點遺漏|送的不齊|偏乾|偏軟|不酥|酸腐|腥味|盒子凹|壓在一起)/i;
 const positiveOnly=positiveRe.test(text)&&!negativeRe.test(text);
 if(positiveOnly)return {main:'正向意見',dimension:'正向意見',tags:[],items:[],confidence:'高',positiveOnly:true};
 let override=CLASSIFICATION_OVERRIDES[text];
 let scores={},tags=[];
 for(const [k,ks] of Object.entries(rules)){let sc=keywordHits(text,ks);if(sc>0){scores[k]=sc;tags.push(k)}}
 // 高辨識度語意：先用完整語句判斷，避免「訂購、外送、服務」等一般字眼誤判。
 const strong=[];
 const addStrong=(k,n=12)=>{scores[k]=(scores[k]||0)+n;if(!tags.includes(k))tags.push(k);strong.push(k)};
 if(/(餐點缺漏|漏餐|漏送|少送|少給|缺少|缺餐|漏放|沒附|未附|沒有附|沒給|未給|沒有給|沒提供|未提供|沒有提供|欠東西)/i.test(text))addStrong('漏餐/缺品');
 if(/(送錯餐|送錯單|餐點有誤|餐點錯|品項有誤|品項錯|口味錯|數量(錯|不對)|給錯|拿錯|送錯品|全辣|全不辣)/i.test(text))addStrong('錯餐/品項錯誤',14);
 if(/(飲料.*(灑|撒|漏|倒|破)|封裝不當|湯汁.*(灑|漏)|包裝.*(破|損)|擠壓.*(爛|變形)|紙袋.*(濕|爛))/i.test(text))addStrong('包裝/外觀',15);
 if(/(提早|提前|過早|太早).{0,10}(送達|送到|到了|抵達)/i.test(text)||/(預定|預約).{0,12}(結果|卻).{0,8}(提早|提前)/i.test(text))addStrong('過早送達',15);
 if(/(遲到|延遲|延誤|超時|晚到|等很久|等太久|送太久|超過.{0,8}(預定|預計|時間)|晚.{0,6}(分鐘|小時).{0,8}(送達|送到|到))/i.test(text))addStrong('遲到/配送時效',14);
 if(/(預估|預計|系統).{0,12}(時間|送達).{0,12}(實際|不符|差|延後|未更新)/i.test(text))addStrong('遲到/配送時效',8);
 if(/(外送地圖|地圖.*(怪|錯|特別)|APP.*(錯|問題|無法)|系統.*(錯|問題|未更新|沒更新)|進度.*(未更新|沒更新)|訂單.*(消失|取消))/i.test(text))addStrong('系統/訂購/優惠',13);
 if(/(外送員|客服|店員|人員).{0,16}(態度|沒禮貌|不耐煩|口氣|不處理|沒回|未回|沒通知|未通知)/i.test(text))addStrong('服務態度/處理',12);
 if(/(找不到地址|找不到位置|送錯地址|送錯地方|放錯地方|丟在.*門口|沒打電話|沒有打電話|不看備註)/i.test(text))addStrong('外送交付',13);
 if(/(冷掉|不熱|難吃|油耗味|沒氣|沒有氣|不脆|軟掉|乾柴|太乾|焦黑|異味|雞腥味|不入味|口感.*(差|不好)|美味程度不足)/i.test(text))addStrong('餐點品質',11);
 if(/(份量.*(少|不足)|縮水|少得離譜|太貴|價格.*(高|貴)|變小|雞塊.{0,4}(很小|太小)|餐點.{0,4}(很小|太小))/i.test(text))addStrong('價格/份量',12);
 // v8.9：以事件語意補強短句與常見自然語句，避免明確案件掉入『其他』。
 if(/(晚了|延後|一延再延|一直延|未按時|沒有按時|備餐.{0,4}(久|慢)|取餐.{0,4}(久|慢)|等外送|送餐.{0,6}(久|慢))/i.test(text))addStrong('遲到/配送時效',13);
 if(/(餐點遺漏|東西.{0,4}(不齊|沒齊)|少餐點|少餐|少東西|漏東西|沒.{0,4}(醬|餐具|吸管|手套)|沒有.{0,4}(醬|餐具|吸管|手套)|贈品.{0,6}(沒收到|未收到|沒給))/i.test(text))addStrong('漏餐/缺品',14);
 if(/(去冰.{0,10}(正常冰|有冰)|無糖.{0,10}(有糖|正常糖)|點.{0,12}(收到|來的|送來).{0,12}(不是|卻是|變成)|主餐.{0,8}(漢堡).{0,16}(紙包雞))/i.test(text))addStrong('錯餐/品項錯誤',15);
 if(/(偏乾|偏軟|不酥|不酥脆|酸腐味|腥味|很腥|皮.{0,4}(軟|不脆)|餐點.{0,6}不夠熱|炸雞.{0,6}(軟|乾))/i.test(text))addStrong('餐點品質',13);
 if(/(盒子.{0,6}(凹|壓|變形)|蛋塔.{0,8}(壓|擠)|雞汁.{0,6}(漏|流)|湯汁?.{0,6}(漏|流)|醬汁.{0,6}(漏|流))/i.test(text))addStrong('包裝/外觀',15);
 if(/((第三方|外送員).{0,18}(不知道送到哪|沒送到|未送到)|顯示.{0,8}送達.{0,12}(沒收到|未收到)|餐點.{0,8}(不見|消失))/i.test(text))addStrong('外送交付',15);
 let main='其他/無法判斷',confidence='低';
 // v8.6 以新版語意規則優先；舊 override 只在新版完全沒有辨識結果時補位，避免舊分類鎖死錯誤。
 if(tags.length){
   for(const k of tags){for(const w of (rules[k]||[])){if(text.includes('因為'+w)||text.includes('主要是'+w)||text.includes('最不能接受'+w)||text.startsWith(w))scores[k]=(scores[k]||0)+5}}
   for(const cue of ['結果','竟然','就算了','重點是','最不能接受']){let pos=text.lastIndexOf(cue);if(pos>=0){let tail=text.slice(pos);for(const k of tags)if(hasAny(tail,rules[k]||[]))scores[k]=(scores[k]||0)+3}}
   let ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);main=ranked[0][0];confidence=strong.includes(main)||ranked.length===1||ranked[0][1]>=ranked[1][1]+4?'高':'中';
   if(ranked.length>1&&ranked[0][1]===ranked[1][1]&&!strong.length&&text.length<18){main='多重問題/主因不明';confidence='低'}
 } else if(override && override!=='其他/無法判斷'){main=override;confidence='中';if(rules[main])tags.push(main)}
 // 正向文字本身不應成為負面主因；只有正向詞且沒有具體問題時保留無法判斷。
 if(/(準時送達|送餐很快|外送快速|態度非常好|服務很好|很滿意)/i.test(text)&&tags.length===1&&['遲到/配送時效','服務態度/處理'].includes(main)){main='其他/無法判斷';confidence='低'}
 let items=[];if(tags.includes('漏餐/缺品')||tags.includes('錯餐/品項錯誤')||['漏餐/缺品','錯餐/品項錯誤'].includes(main))for(const [k,ks] of Object.entries(itemRules))if(hasAny(text,ks))items.push(k);if((tags.includes('漏餐/缺品')||tags.includes('錯餐/品項錯誤')||['漏餐/缺品','錯餐/品項錯誤'].includes(main))&&!items.length)items=['未說明品項'];
 return {main,dimension:dimensionOf(main),tags,items,confidence,positiveOnly:false};
}

function classifyPreservingKnown(row){
 const fresh=classify(row?.comment||'');
 if(fresh.positiveOnly)return fresh;
 const oldMain=norm(row?.main||row?.primary_issue||row?.issue||'');
 const unusable=new Set(['','其他/無法判斷','多重問題/主因不明','無評論','正向意見']);
 // 新規則能明確辨識時採新結果；新規則無法辨識時保留歷史已知分類，避免把既有正確分類洗成「其他」。
 if(!unusable.has(fresh.main))return fresh;
 if(oldMain && !unusable.has(oldMain)){
   const oldTags=Array.isArray(row?.tags)?row.tags.filter(Boolean):[];
   return {main:oldMain,dimension:dimensionOf(oldMain),tags:[...new Set([oldMain,...oldTags])],items:Array.isArray(row?.items)?row.items:[],confidence:'中',positiveOnly:false};
 }
 return fresh;
}
function stableDate(v){if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,19);let s=norm(v);return s.replace(/\.000Z$/,'').replace(/Z$/,'')}
function detectMonth(rows,dateIdx){for(const r of rows){let v=r[dateIdx];if(v instanceof Date&&!isNaN(v))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}`;if(typeof v==='number'&&window.XLSX){let d=XLSX.SSF.parse_date_code(v);if(d)return `${d.y}-${String(d.m).padStart(2,'0')}`;}let s=norm(v);let m=s.match(/(20\d{2})[\/\-.年](\d{1,2})/);if(m)return `${m[1]}-${m[2].padStart(2,'0')}`;}return prompt('無法從日期欄辨識月份，請輸入報告月份，例如 2026-09：','2026-09')||''}
async function api(path,options={}){
 const headers={apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',...(options.headers||{})};
 const res=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers});
 if(!res.ok){let msg=await res.text();throw new Error(`Supabase ${res.status}: ${msg}`)}
 if(res.status===204)return null; const txt=await res.text(); return txt?JSON.parse(txt):null;
}
async function sha256(text){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function loadCloud(preferredMonth=''){
 try{
   document.querySelector('#dataStatus').textContent='正在讀取 Supabase…';
   let month=preferredMonth||state.month;
   if(!month){
     try{const ms=await api('dashboard_ges_months?select=report_month,row_count&order=report_month.desc');month=ms?.[0]?.report_month||'';state.availableMonths=(ms||[]).map(x=>x.report_month)}
     catch(_){const latest=await api(`${GES_TABLE}?select=report_month&order=report_month.desc&limit=1`);month=latest?.[0]?.report_month||'';state.availableMonths=month?[month]:[]}
   }
   state.months={};
   if(month){
     const data=await fetchAllWhere(GES_TABLE,'id,report_month,payload',`report_month=eq.${encodeURIComponent(month)}`);
     for(const x of (data||[])){
       const m=x.report_month||x.payload?.month||''; if(!m||!x.payload)continue;
       const r=x.payload; let c=classifyPreservingKnown(r);Object.assign(r,{main:c.main,dimension:c.dimension,tags:c.tags,items:c.items,confidence:c.confidence,positiveOnly:!!c.positiveOnly,date:stableDate(r.date)});applyMapping(r);
       (state.months[m]??={file:'Supabase',rows:[],version:APP_VERSION}).rows.push(r);
     }
     for(const m of Object.keys(state.months)){const seen=new Set();state.months[m].rows=state.months[m].rows.filter(r=>{const k=rowKey(r);if(seen.has(k))return false;seen.add(k);return r.score!==0&&r.score!==null&&r.score!==undefined})}
   }
   state.month=month; refreshMonthSelect(); render(); await loadAuxCloud(month);
 }catch(err){console.error(err);document.querySelector('#dataStatus').textContent='Supabase 連線失敗';alert('Supabase 讀取失敗。請先執行 ZIP 內 setup_supabase.sql。\n\n'+err.message)}
}
async function saveRowsToCloud(month,file,rows){
 const existing=await fetchAllWhere(GES_TABLE,'id,row_hash',`report_month=eq.${encodeURIComponent(month)}`);
 const seen=new Set((existing||[]).map(x=>x.row_hash)); const batch=[]; let duplicateCount=0;
 for(const r of rows){const h=await sha256(rowKey(r));if(seen.has(h)){duplicateCount++;continue}seen.add(h);batch.push({report_month:month,row_hash:h,source_file:file,payload:{...r,month}})}
 for(let i=0;i<batch.length;i+=500){await api(GES_TABLE,{method:'POST',headers:{Prefer:'return=minimal,resolution=ignore-duplicates'},body:JSON.stringify(batch.slice(i,i+500))})}
 return {added:batch.length,duplicateCount};
}
function refreshMonthSelect(){const s=document.querySelector('#monthSelect');let ks=(state.availableMonths?.length?state.availableMonths:Object.keys(state.months)).slice().sort().reverse();if(state.month&&!ks.includes(state.month))ks.unshift(state.month);s.innerHTML=ks.length?ks.map(m=>`<option ${m===state.month?'selected':''}>${m}</option>`).join(''):'<option value="">尚未匯入月份</option>'}
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
 let rows=a.slice(hi+1).filter(r=>norm(r[rest])||num(r[score])!==null).map((r,i)=>{let sc=num(r[score]);let txt=norm(r[comment]);let c=classify(txt);return applyMapping({id:i+1,restaurant:norm(r[rest]),restaurant_code:code>=0?norm(r[code]):'',center:center>=0?norm(r[center]):'',group:group>=0?norm(r[group]):'',score:sc,comment:txt,isLow:sc!==null&&sc>=1&&sc<=3,hasComment:!!txt,main:c.main,dimension:c.dimension,tags:c.tags,items:c.items,confidence:c.confidence,positiveOnly:!!c.positiveOnly,date:date>=0?stableDate(r[date]):''})});
 // 同月份採逐筆去重：日期＋餐廳＋評分＋評論完全相同視為同一筆。
 const saved=await saveRowsToCloud(month,file.name,rows); const added=saved.added, duplicateCount=saved.duplicateCount;
 await loadCloud(); state.month=month; refreshMonthSelect(); render();
 const valid=rows.filter(r=>r.score!==null).length, lowN=rows.filter(r=>r.isLow).length, oneN=rows.filter(r=>r.score===1).length;
 const mapped=rows.filter(r=>r.center&&r.center!=='未對應').length, unmapped=rows.length-mapped;
 showImportCheck({read:rows.length,valid,low:lowN,one:oneN,mapped,unmapped,added,duplicateCount,file:file.name});
 toast(`成功解析 ${rows.length.toLocaleString()} 筆｜新增 ${added.toLocaleString()}｜重複排除 ${duplicateCount.toLocaleString()}`)}
function showImportCheck(x){const e=document.querySelector('#importCheck');if(!e)return;e.style.display='block';e.innerHTML=`<h3>匯入檢查｜${esc(x.file)}</h3><div class="kpi-grid">${kpi('成功解析',x.read.toLocaleString(),'Excel資料列')}${kpi('有效評分',x.valid.toLocaleString(),'應與問卷筆數一致')}${kpi('1～3分',x.low.toLocaleString(),'低分資料')}${kpi('1分',x.one.toLocaleString(),'嚴重低分')}${kpi('Mapping成功',x.mapped.toLocaleString(),`未對應 ${x.unmapped.toLocaleString()} 筆`)}${kpi('重複排除',x.duplicateCount.toLocaleString(),`新增 ${x.added.toLocaleString()} 筆`)}</div>`}
function current(){return state.months[state.month]?.rows||[]}function low(){return current().filter(r=>r.isLow)}function comments(){return low().filter(r=>r.hasComment&&!r.positiveOnly)}
function centerFiltered(rows){return state.globalCenter?rows.filter(r=>(r.center||'未對應')===state.globalCenter):rows}
function availableCenters(){return [...new Set(current().map(r=>r.center||'未對應'))].filter(Boolean).sort()}
function syncGlobalCenterFilters(){const opts='<option value="">全市場</option>'+availableCenters().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');document.querySelectorAll('.global-center-filter').forEach(s=>{s.innerHTML=opts;s.value=state.globalCenter;s.onchange=e=>{state.globalCenter=e.target.value;render();}})}
function pct(a,b){return b?100*a/b:0}function fmtp(v){return `${v.toFixed(1)}%`}function esc(s){return norm(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function groupBy(arr,key){let m={};for(const r of arr){let k=typeof key==='function'?key(r):r[key];(m[k||'未對應']??=[]).push(r)}return m}
function kpi(label,value,note=''){return `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="note">${note}</div></div>`}
function render(){syncGlobalCenterFilters();const all=current(),lo=low(),co=comments();document.querySelector('#dataStatus').textContent=all.length?`${state.month}｜${all.length.toLocaleString()} 筆`:'尚未匯入資料';const dc=Object.fromEntries(DIMENSION_ORDER.map(d=>[d,co.filter(r=>(r.dimension||dimensionOf(r.main))===d).length]));document.querySelector('#kpis').innerHTML=[kpi('有效問卷',all.filter(r=>r.score!==null).length.toLocaleString(),'當月匯入'),kpi('1～3分',lo.length.toLocaleString(),`低分率 ${fmtp(pct(lo.length,all.filter(r=>r.score!==null).length))}`),kpi('速度為主因',dc['速度'].toLocaleString(),fmtp(pct(dc['速度'],co.length))),kpi('品質為主因',dc['品質'].toLocaleString(),fmtp(pct(dc['品質'],co.length))),kpi('正確性為主因',dc['正確性'].toLocaleString(),fmtp(pct(dc['正確性'],co.length))),kpi('1分件數',lo.filter(r=>r.score===1).length.toLocaleString(),'嚴重低分')].join('');renderIssues(co);renderCenters(all);renderRestaurants(all);renderMissing(co);renderComments();renderTrend();renderFinding(all,co);renderGesTime();renderComplaints()}
function renderIssues(co){let marketCnt=Object.fromEntries(DIMENSION_ORDER.map(d=>[d,0]));for(const r of co)marketCnt[r.dimension||dimensionOf(r.main)]++;let marketData=DIMENSION_ORDER.map(d=>[d,marketCnt[d]]).filter(x=>x[1]);if(state.chart)state.chart.destroy();state.chart=new Chart(document.querySelector('#issueChart'),{type:'bar',data:{labels:marketData.map(x=>x[0]),datasets:[{label:'主因筆數',data:marketData.map(x=>x[1])}]},options:{responsive:true,plugins:{legend:{display:false}}}});let fco=centerFiltered(co),dimCnt=Object.fromEntries(DIMENSION_ORDER.map(d=>[d,0]));for(const r of fco)dimCnt[r.dimension||dimensionOf(r.main)]++;let dimData=DIMENSION_ORDER.map(d=>[d,dimCnt[d]]).filter(x=>x[1]);let cnt={};for(const k of ISSUE_ORDER)cnt[k]=0;for(const r of fco)cnt[r.main]=(cnt[r.main]||0)+1;let detail=Object.entries(cnt).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);document.querySelector('#issueTable').innerHTML=`<div class="grid2"><div class="card"><h3>${state.globalCenter||'全市場'}－外送核心構面</h3>${table(['構面','主因筆數','占有文字低分'],dimData.map(([d,v])=>[d,v,fmtp(pct(v,fco.length))]))}</div><div class="card"><h3>細項原因</h3>${table(['構面','主要不滿','主因筆數','占有文字低分','有提及筆數'],detail.map(([k,v])=>[dimensionOf(k),k,v,fmtp(pct(v,fco.length)),fco.filter(r=>r.tags.includes(k)).length]))}</div></div>`}

function centerStats(all){return Object.entries(groupBy(all,'center')).map(([c,rs])=>{let valid=rs.filter(r=>r.score!==null),lo=valid.filter(r=>r.isLow),co=lo.filter(r=>r.hasComment),main=topMain(co);return{c,survey:valid.length,low:lo.length,rate:pct(lo.length,valid.length),share:0,main,dimension:dimensionOf(main)}}).map(x=>({...x,share:pct(x.low,all.filter(r=>r.isLow).length)})).sort((a,b)=>b.low-a.low)}
function renderCenters(all){let s=centerStats(all);if(state.globalCenter)s=s.filter(x=>x.c===state.globalCenter);let rows=s.map(x=>[x.c,x.survey,x.low,fmtp(x.rate),fmtp(x.share),x.dimension,x.main]);document.querySelector('#centerTable').innerHTML=table(['中心','問卷數','1～3分','低分率','占市場低分','主要構面','主要問題'],rows);document.querySelector('#centerDetail').innerHTML=`<div class="card">${table(['中心','問卷數','低分件數','低分率','市場低分貢獻','主要構面','主要問題'],rows)}</div>`}
function topMain(co){let m={};for(const r of co)m[r.main]=(m[r.main]||0)+1;return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0]||'-'}
function restaurantStats(all){return Object.entries(groupBy(all,'restaurant')).map(([name,rs])=>{let valid=rs.filter(r=>r.score!==null),lo=valid.filter(r=>r.isLow),co=lo.filter(r=>r.hasComment);return{name,center:rs.find(r=>r.center)?.center||'未對應',group:rs.find(r=>r.group)?.group||'',survey:valid.length,low:lo.length,rate:pct(lo.length,valid.length),one:lo.filter(r=>r.score===1).length,main:topMain(co),dimension:dimensionOf(topMain(co))}}).filter(x=>x.low).sort((a,b)=>(b.low-a.low)||(b.rate-a.rate))}
function renderRestaurants(all){let rs=restaurantStats(centerFiltered(all));if(state.restaurantRank==='rate')rs.sort((a,b)=>(b.rate-a.rate)||(b.low-a.low));else if(state.restaurantRank==='one')rs.sort((a,b)=>(b.one-a.one)||(b.low-a.low));else if(state.restaurantRank==='missing'){const miss=comments().filter(r=>(r.main==='漏餐/缺品'||r.tags.includes('漏餐/缺品'))&&( !state.globalCenter||r.center===state.globalCenter));const mc={};miss.forEach(r=>mc[r.restaurant]=(mc[r.restaurant]||0)+1);rs.sort((a,b)=>(mc[b.name]||0)-(mc[a.name]||0)||(b.low-a.low));}else rs.sort((a,b)=>(b.low-a.low)||(b.rate-a.rate));document.querySelector('#restaurantTable').innerHTML=`<div class="card"><div class="scroll">${table(['排名','中心','Group','餐廳','問卷數','低分件數','低分率','1分','主要構面','主要問題'],rs.map((x,i)=>[i+1,x.center,x.group,x.name,x.survey,x.low,fmtp(x.rate),x.one,x.dimension,x.main]))}</div></div>`}
function renderMissing(co){
 const all=current();
 let miss=co.filter(r=>r.main==='漏餐/缺品'||r.tags.includes('漏餐/缺品'));
 if(state.globalCenter)miss=miss.filter(r=>(r.center||'未對應')===state.globalCenter);
 let base=centerFiltered(all);
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
 const filterHtml=`<div class="filters"><select id="missingRank"><option value="count" ${state.missingRank==='count'?'selected':''}>依漏餐筆數排名</option><option value="rate" ${state.missingRank==='rate'?'selected':''}>依漏餐率排名</option></select></div>`;
 const kpis=`<div class="kpi-grid">${kpi('漏餐評論',miss.length.toLocaleString(),state.globalCenter||'全市場')}${kpi('涉及餐廳',restaurantCount.toLocaleString(),'有漏餐反映')}${kpi('最常漏品項',topItem,Object.entries(items).sort((a,b)=>b[1]-a[1])[0]?.[1]?`${Object.entries(items).sort((a,b)=>b[1]-a[1])[0][1]} 次提及`:'尚無資料')}${kpi('漏餐率',fmtp(pct(miss.length,totalSurvey)),'漏餐評論 ÷ 有效問卷')}</div>`;
 const rankRows=grouped.map((x,i)=>[i+1,x.center,x.group,x.name,x.count,x.sample,fmtp(x.rate),x.topItems]);
 const commentRows=grouped.flatMap(x=>x.comments.map(c=>[x.center,x.group,x.name,c]));
 document.querySelector('#missingContent').innerHTML=`${filterHtml}${kpis}<div class="grid2"><div class="card"><h3>漏餐品項排名</h3>${table(['排名','品項','提及次數'],Object.entries(items).sort((a,b)=>b[1]-a[1]).map((x,i)=>[i+1,x[0],x[1]]))}</div><div class="card"><h3>漏餐餐廳排名</h3><div class="scroll">${table(['排名','中心','Group','餐廳','漏餐筆數','有效問卷','漏餐率','主要漏品'],rankRows)}</div></div></div><div class="card" style="margin-top:16px"><h3>漏餐原始評論</h3><div class="scroll">${table(['中心','Group','餐廳','顧客評論'],commentRows)}</div></div>`;
 document.querySelector('#missingRank').onchange=e=>{state.missingRank=e.target.value;renderMissing(comments())};
}
function renderComments(){let co=centerFiltered(comments()),fi=document.querySelector('#filterIssue')?.value||'',ft=(document.querySelector('#filterText')?.value||'').trim();let issues=[...new Set(co.map(r=>r.main))].sort(),sel=document.querySelector('#filterIssue'),old=sel.value;sel.innerHTML='<option value="">全部主因</option>'+issues.map(x=>`<option>${esc(x)}</option>`).join('');sel.value=old;co=co.filter(r=>(!fi||r.main===fi)&&(!ft||(r.restaurant+r.comment).includes(ft)));document.querySelector('#commentsTable').innerHTML=`<div class="card"><div class="scroll">${table(['中心','Group','餐廳','分數','主要構面','主要不滿','其他標籤','漏餐品項','顧客評論'],co.map(r=>[r.center||'未對應',r.group,r.restaurant,r.score,r.dimension||dimensionOf(r.main),r.main,r.tags.join('、'),r.items.join('、'),r.comment]))}</div></div>`}
function renderFinding(all,co){if(!all.length){document.querySelector('#finding').innerHTML='匯入當月 GES Excel 後自動產生。';return}let dims=Object.fromEntries(DIMENSION_ORDER.map(d=>[d,co.filter(r=>(r.dimension||dimensionOf(r.main))===d).length]));let centers=centerStats(all).filter(x=>x.c!=='未對應').slice(0,2);let t=`<b>${state.month} 市場方向</b><br>1～3分共 <b>${low().length}</b> 筆，其中有文字評論 <b>${co.length}</b> 筆。<br><br>外送核心構面：<b>速度</b> ${dims['速度']}筆 (${fmtp(pct(dims['速度'],co.length))})、<b>品質</b> ${dims['品質']}筆 (${fmtp(pct(dims['品質'],co.length))})、<b>正確性</b> ${dims['正確性']}筆 (${fmtp(pct(dims['正確性'],co.length))})、<b>外送異常</b> ${dims['外送異常']}筆 (${fmtp(pct(dims['外送異常'],co.length))})。`;if(centers.length)t+=`<br><br>低分件數較集中的中心為 ${centers.map(x=>`<b>${x.c}</b> ${x.low}筆`).join('、')}。`;t+=`<br><br><span class="empty">※ 主因代表顧客文字中的主要不滿；速度、品質、正確性為外送三大核心構面；傾倒／外漏／包裝破損獨立列為外送異常，不等同 DMS 可驗證的營運根因。</span>`;document.querySelector('#finding').innerHTML=t}

async function ensurePreviousMonthForTrend(){let ks=(state.availableMonths||[]).slice().sort(),idx=ks.indexOf(state.month);if(idx<=0)return;let prev=ks[idx-1];if(state.months[prev])return;try{let data=await fetchAllWhere(GES_TABLE,'id,report_month,payload',`report_month=eq.${encodeURIComponent(prev)}`),rows=[];for(const x of data||[]){if(!x.payload)continue;let r=x.payload,c=classifyPreservingKnown(r);Object.assign(r,{main:c.main,dimension:c.dimension,tags:c.tags,items:c.items,confidence:c.confidence,positiveOnly:!!c.positiveOnly,date:stableDate(r.date)});applyMapping(r);rows.push(r)}let seen=new Set();rows=rows.filter(r=>{let k=rowKey(r);if(seen.has(k))return false;seen.add(k);return r.score!==0&&r.score!==null&&r.score!==undefined});state.months[prev]={file:'Supabase',rows,version:APP_VERSION}}catch(e){console.warn('上月改善追蹤資料讀取失敗',e)}}
function renderTrend(){let ks=Object.keys(state.months).sort(),idx=ks.indexOf(state.month);if(idx<=0){document.querySelector('#trendContent').innerHTML='至少匯入兩個月份後，即可比較改善、持續異常與惡化餐廳。';return}let prev=ks[idx-1],curStats=restaurantStats(state.months[state.month].rows),preStats=restaurantStats(state.months[prev].rows),pm=Object.fromEntries(preStats.map(x=>[x.name,x]));let out=curStats.filter(x=>pm[x.name]&&(!state.globalCenter||x.center===state.globalCenter)).map(x=>{let p=pm[x.name],d=x.rate-p.rate;let st=d<=-3?'改善':d>=3?'惡化':'持續關注';return[x.center,x.name,fmtp(p.rate),fmtp(x.rate),`${d>=0?'+':''}${d.toFixed(1)} pp`,st,x.main]}).sort((a,b)=>parseFloat(b[4])-parseFloat(a[4]));document.querySelector('#trendContent').innerHTML=`<h3>${prev} → ${state.month}</h3>${table(['中心','餐廳','上月低分率','本月低分率','變化','狀態','本月主要問題'],out)}`}
function table(headers,rows){return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map((c,i)=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="empty">目前沒有資料</td></tr>`}</tbody></table>`}
function exportAnalysis(){let rs=restaurantStats(current()),co=comments();let wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rs),'餐廳分析');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(co.map(r=>({中心:r.center,Group:r.group,餐廳:r.restaurant,分數:r.score,主要構面:r.dimension||dimensionOf(r.main),主要不滿:r.main,問題標籤:r.tags.join('、'),漏餐品項:r.items.join('、'),評論:r.comment}))),'評論明細');XLSX.writeFile(wb,`GES分析_${state.month||'未指定'}.xlsx`)}
function toast(t){let e=document.querySelector('#toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',2600)}

function dateParts(v){let d=v instanceof Date?v:null;if(!d&&typeof v==='number'&&window.XLSX){let x=XLSX.SSF.parse_date_code(v);if(x)d=new Date(x.y,x.m-1,x.d,x.H||0,x.M||0,x.S||0)}if(!d){let z=norm(v).replace(/年|月/g,'/').replace(/日/g,'');let q=new Date(z);if(!isNaN(q))d=q}if(!d)return {date:norm(v),day:'',hour:null,month:''};return {date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,day:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,hour:d.getHours(),month:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}}
function mealPeriod(h){if(h===null||h===undefined)return '無時間';if(h<11)return '11:00前';if(h<14)return '午餐';if(h<17)return '下午';if(h<21)return '晚餐';return '消夜'}
function renderGesTime(){let old=document.querySelector('#gesTimeAnalysis');if(!old){old=document.createElement('div');old.id='gesTimeAnalysis';document.querySelector('#issue').appendChild(old)}let rs=centerFiltered(comments()).filter(r=>r.date);let days={};let hours={};for(const r of rs){let p=dateParts(r.date);if(p.day)days[p.day]=(days[p.day]||0)+1;if(p.hour!==null){let k=`${String(p.hour).padStart(2,'0')}:00–${String((p.hour+1)%24).padStart(2,'0')}:00`;hours[k]=(hours[k]||0)+1}}let dr=Object.entries(days).sort((a,b)=>b[1]-a[1]).slice(0,20).map((x,i)=>[i+1,x[0],x[1]]),hr=Object.entries(hours).sort((a,b)=>b[1]-a[1]).map((x,i)=>[i+1,x[0],x[1]]);old.innerHTML=`<div class="grid2" style="margin-top:16px"><div class="card"><h3>需改善日期</h3>${table(['排名','日期','低分評論'],dr)}</div><div class="card"><h3>需改善時段</h3>${hr.length?table(['排名','時段','低分評論'],hr):'<div class="empty">GES 原始日期若沒有時間，無法判斷實際時段。</div>'}</div></div>`}
async function fetchAllWhere(table,select,filter=''){let out=[];const pageSize=1000;for(let from=0;;from+=pageSize){let qs=`${table}?select=${select}${filter?'&'+filter:''}&order=id.asc&offset=${from}&limit=${pageSize}`;let part=await api(qs)||[];out.push(...part);if(part.length<pageSize)break;}return out}
async function fetchAll(table,select){return fetchAllWhere(table,select,'')}
async function loadAuxCloud(month=state.month){
 try{
   if(!month){state.complaints=[];state.thirdParty=[];renderComplaints();return}
   const mf=`report_month=eq.${encodeURIComponent(month)}`;
   state.complaints=await fetchAllWhere('complaint_records','id,report_month,source_type,payload',mf);
   state.thirdParty=await fetchAllWhere('third_party_orders','id,report_month,payload',mf);
   buildThirdPartyIndex();renderComplaints();
 }catch(e){console.warn('客訴資料尚未建立',e)}
}
function buildThirdPartyIndex(){state.thirdPartyIndex=new Set();for(const x of state.thirdParty){let p=x.payload||{},day=dateParts(p.date).day,order=canonicalOrder(p.orderNo||'');if(day&&order)state.thirdPartyIndex.add(`${x.report_month}|${day}|${order}`)}}
function normalizeCenterName(v){let s=norm(v).replace(/\s/g,'');if(!s)return '';if(s.includes('外送共享中心'))return '新北';for(const c of ['台北','新北','桃園','台中','台南','高雄'])if(s.includes(c))return c;return ''}
function complaintCenterOf(r){
 // 4128：依該筆資料的餐廳／歸屬中心判斷，不用餐廳代碼猜中心。
 if(r.source==='4128'){return normalizeCenterName(r.restaurant)||normalizeCenterName(r.region)||normalizeCenterName(r.center)||'未對應'}
 // 080：只分析網路外送＋抱怨，中心以餐廳 mapping 為主。
 let m=RESTAURANT_MAPPING[norm(r.restaurant)];if(m?.center)return normalizeCenterName(m.center)||m.center;
 return normalizeCenterName(r.center)||normalizeCenterName(r.region)||'未對應'
}
function isValid080(r){
 if(r.source!=='080')return true;
 const channel=norm(r.channel),feedback=norm(r.feedbackType);
 // v7.4 以前已存入 Supabase 的 080 payload 沒有保存通路/意見類型欄位；先相容顯示，避免舊資料整批變 0。
 // 新匯入資料一律在匯入時嚴格限定「網路外送＋抱怨」。
 if(!channel&&!feedback)return true;
 return channel.includes('網路外送')&&feedback.includes('抱怨');
}
function complaintClass(text){let t=norm(text),c=classify(t);return c.main==='其他/無法判斷'&&hasAny(t,['遲到','晚到','太慢','延遲'])?'遲到/配送時效':c.main}
function normalizeOrder(s){return norm(s).replace(/\s/g,'').toUpperCase()}
function restaurantCodeOf(r){let s=normalizeOrder(r.orderNo||'');let m=s.match(/^(\d{3})-/);return m?m[1]:''}
function canonicalOrder(s){s=normalizeOrder(s);if(!s)return '';let m=s.match(/^(?:[^-]+-)?(\d{3})(\d{4})$/);if(m)return `${m[1]}-${m[2]}`;m=s.match(/^(\d{3})-(\d{4})$/);if(m)return `${m[1]}-${m[2]}`;let digits=s.replace(/\D/g,'');if(digits.length>=7)return `${digits.slice(-7,-4)}-${digits.slice(-4)}`;return s}
function isThirdPartyMatched(r){if(r.source!=='4128')return false;let order=canonicalOrder(r.orderNo),day=dateParts(r.date).day;if(!order||!day)return false;return state.thirdPartyIndex?.has(`${r.month}|${day}|${order}`)||false}
function isThirdPartyComplaint(r){if(r.source!=='4128'||complaintClass(r.comment)!=='遲到/配送時效')return null;return isThirdPartyMatched(r)}
function isEffectiveThirdPartyComplaint(r){if(!isThirdPartyMatched(r))return false;const k=complaintClass(r.comment);return !['漏餐/缺品','錯餐/品項錯誤','價格/份量','系統/訂購/優惠'].includes(k)}
function findAnyCol(h,terms){return findCol(h,terms)}
async function saveGeneric(tableName,month,file,source,rows){
 const filter=tableName==='complaint_records'?`report_month=eq.${encodeURIComponent(month)}&source_type=eq.${encodeURIComponent(source)}`:`report_month=eq.${encodeURIComponent(month)}`;
 const existing=await fetchAllWhere(tableName,'row_hash',filter);const seen=new Set((existing||[]).map(x=>x.row_hash));const batch=[];let duplicateCount=0;
 for(const r of rows){const h=await sha256(JSON.stringify(r));if(seen.has(h)){duplicateCount++;continue}seen.add(h);batch.push(tableName==='complaint_records'?{report_month:month,source_type:source,row_hash:h,source_file:file,payload:r}:{report_month:month,row_hash:h,source_file:file,payload:r})}
 for(let i=0;i<batch.length;i+=500)await api(tableName,{method:'POST',headers:{Prefer:'return=minimal,resolution=ignore-duplicates'},body:JSON.stringify(batch.slice(i,i+500))});return{read:rows.length,added:batch.length,duplicateCount}
}
async function importComplaint(file,source){
 let a=await readWorkbook(file);let hi=a.findIndex(r=>r.some(c=>['日期','顧客回饋內容','訂單編號'].some(k=>norm(c).includes(k))));if(hi<0)throw new Error('找不到客訴欄位');
 let h=a[hi].map(norm),date=findCol(h,['日期','進線時間','建立時間','發生時間']),comment=findCol(h,['顧客回饋內容','顧客意見','回饋內容','內容']),restaurant=findCol(h,['餐廳','餐廳名稱']),region=findCol(h,['區域']),type=findCol(h,['被抱怨型態']),order=findCol(h,['訂單編號','訂單號碼']);
 let channel=findAnyCol(h,['消費型態','消費方式','訂購方式','訂購型態','訂餐方式','通路','服務類型','訂單類型','來源']);let feedback=findAnyCol(h,['建議種類','意見類型','意見分類','案件類型','案件分類','回饋類型','反映類型','反應類型','類別']);
 let base=a.slice(hi+1).filter(r=>norm(r[comment])||norm(r[restaurant]));
 if(source==='080'){
   if(channel<0||feedback<0)throw new Error('080 找不到「網路外送」或「抱怨/建議/表揚」欄位，為避免誤算已停止匯入。');
   base=base.filter(r=>norm(r[channel]).includes('網路外送')&&norm(r[feedback]).includes('抱怨'));
 }
 let rows=base.map(r=>{let p=dateParts(r[date]);return{month:p.month,date:p.date,restaurant:restaurant>=0?norm(r[restaurant]):'',region:region>=0?norm(r[region]):'',center:'',complaintType:type>=0?norm(r[type]):'',orderNo:order>=0?norm(r[order]):'',restaurantCode:order>=0?(normalizeOrder(r[order]).match(/^(\d{3})-/)?.[1]||''):'',comment:comment>=0?norm(r[comment]):'',channel:channel>=0?norm(r[channel]):'',feedbackType:feedback>=0?norm(r[feedback]):''}});
 let month=rows.find(r=>r.month)?.month||prompt('請輸入月份，例如 2026-08','2026-08');if(!month)return;rows.forEach(r=>r.month=month);let result=await saveGeneric('complaint_records',month,file.name,source,rows);await loadAuxCloud(month);toast(`${source}：有效讀取 ${result.read} 筆｜新增 ${result.added} 筆｜重複排除 ${result.duplicateCount} 筆`)
}
async function importThird(file){let a=await readWorkbook(file);let hi=a.findIndex(r=>r.some(c=>['訂購號碼','third_party','餐廳(ID)'].some(k=>norm(c).includes(k))));if(hi<0)throw new Error('找不到第三方訂單欄位');let h=a[hi].map(norm),date=findCol(h,['落單時間','日期','訂單時間']),order=findCol(h,['訂購號碼','訂單編號']),party=findCol(h,['third_party','第三方']),restaurant=findCol(h,['餐廳(ID)','餐廳']);let rows=a.slice(hi+1).filter(r=>norm(r[order])).map(r=>{let p=dateParts(r[date]);return{month:p.month,date:p.date,orderNo:norm(r[order]),thirdParty:party>=0?norm(r[party]):'第三方',restaurant:restaurant>=0?norm(r[restaurant]):''}});let month=rows.find(r=>r.month)?.month||prompt('請輸入月份，例如 2026-08','2026-08');if(!month)return;rows.forEach(r=>r.month=month);let result=await saveGeneric('third_party_orders',month,file.name,'',rows);await loadAuxCloud(month);toast(`第三方訂單：讀取 ${result.read} 筆｜新增 ${result.added} 筆｜重複排除 ${result.duplicateCount} 筆`)}
function lateCodeStats(late){let g=groupBy(late,r=>restaurantCodeOf(r)||'無代碼');return Object.entries(g).map(([code,rs])=>{let days=groupBy(rs,r=>dateParts(r.date).day),topDay=Object.entries(days).filter(x=>x[0]).sort((a,b)=>b[1].length-a[1].length)[0];return{code,count:rs.length,days:Object.keys(days).filter(Boolean).length,topDay:topDay?.[0]||'-',topDayN:topDay?.[1].length||0,third:rs.filter(r=>isThirdPartyComplaint(r)===true).length,rows:rs}}).sort((a,b)=>b.count-a.count)}
function renderComplaints(){
 let month=state.month||'',raw=state.complaints.filter(x=>!month||x.report_month===month).map(x=>({...x.payload,source:x.source_type,month:x.report_month})).filter(isValid080);
 const six=['台北','新北','桃園','台中','台南','高雄'],sel=document.querySelector('#complaintCenter');if(sel){sel.innerHTML='<option value="">全市場</option>'+six.map(c=>`<option>${c}</option>`).join('');sel.value=state.complaintCenter}
 let rs=raw.filter(r=>(state.complaintSource==='all'||r.source===state.complaintSource)&&(!state.complaintCenter||complaintCenterOf(r)===state.complaintCenter));let n080=rs.filter(r=>r.source==='080').length,n4128=rs.filter(r=>r.source==='4128').length,late=rs.filter(r=>r.source==='4128'&&complaintClass(r.comment)==='遲到/配送時效'),third=late.filter(r=>isThirdPartyComplaint(r)===true),thirdEffective=rs.filter(isEffectiveThirdPartyComplaint);
 let days={};for(const r of rs){let d=dateParts(r.date).day;if(d)days[d]=(days[d]||0)+1}
 let issues={},issues080={},issues4128={};for(const r of rs){let k=complaintClass(r.comment);issues[k]=(issues[k]||0)+1;if(r.source==='080')issues080[k]=(issues080[k]||0)+1;if(r.source==='4128')issues4128[k]=(issues4128[k]||0)+1}
 let stats=lateCodeStats(late),codeSel=document.querySelector('#complaintRestaurantCode');if(codeSel){let old=state.complaintRestaurantCode;codeSel.innerHTML='<option value="">全部餐廳代碼</option>'+stats.map(x=>`<option value="${esc(x.code)}">${esc(x.code)}（${x.count}筆）</option>`).join('');if(stats.some(x=>x.code===old)){codeSel.value=old}else{state.complaintRestaurantCode='';codeSel.value=''}}
 let chosen=state.complaintRestaurantCode?stats.find(x=>x.code===state.complaintRestaurantCode):null,detail='';
 if(chosen){let dd=Object.entries(groupBy(chosen.rows,r=>dateParts(r.date).day)).filter(x=>x[0]).map(([d,v])=>[d,v.length]).sort((a,b)=>a[0].localeCompare(b[0]));detail=`<div class="card" style="margin-top:16px"><h3>${esc(chosen.code)} 餐廳代碼｜遲到發生分析</h3><div class="kpi-grid">${kpi('遲到抱怨',chosen.count,'筆')}${kpi('發生天數',chosen.days,'天')}${kpi('最高日期',chosen.topDay,`${chosen.topDayN} 筆`)}${kpi('第三方遲到',chosen.third,'筆')}</div><h3>日期分布</h3>${table(['日期','遲到筆數'],dd)}</div>`}
 let issueTable=state.complaintSource==='all'?table(['問題','080','4128','合計'],Object.keys(issues).sort((a,b)=>issues[b]-issues[a]).map(k=>[k,issues080[k]||0,issues4128[k]||0,issues[k]||0])):table(['問題','件數'],Object.entries(issues).sort((a,b)=>b[1]-a[1]));
 let e=document.querySelector('#complaintContent');if(!e)return;e.className='';e.innerHTML=`<div class="kpi-grid">${kpi('080 網路外送抱怨',n080,'僅網路外送＋抱怨')}${kpi('4128 抱怨',n4128,'全部為外送訂單')}${kpi('4128 遲到',late.length,'與問題分類中的 4128 遲到一致')}${kpi('第三方有效抱怨',thirdEffective.length,'排除：漏餐/錯餐、價格、系統問題')}${kpi('其中第三方遲到',third.length,`日期＋訂單號配對｜第三方訂單 ${state.thirdParty.length.toLocaleString()} 筆`)}</div><div class="grid2"><div class="card"><h3>問題分類${state.complaintSource==='all'?'｜來源拆分':''}</h3>${issueTable}</div><div class="card"><h3>抱怨日期</h3>${table(['日期','件數'],Object.entries(days).sort((a,b)=>b[1]-a[1]).slice(0,31))}</div></div><div class="card" style="margin-top:16px"><h3>4128 遲到｜餐廳代碼排名</h3>${table(['餐廳代碼','遲到筆數','發生天數','最高日期','第三方遲到'],stats.map(x=>[x.code,x.count,x.days,`${x.topDay} (${x.topDayN})`,x.third]))}</div>${detail}<div class="card" style="margin-top:16px"><h3>4128 遲到明細</h3><div class="scroll">${table(['日期','餐廳代碼','中心','餐廳/歸屬','訂單編號','第三方','內容'],late.filter(r=>!state.complaintRestaurantCode||restaurantCodeOf(r)===state.complaintRestaurantCode).map(r=>[dateParts(r.date).day,restaurantCodeOf(r),complaintCenterOf(r),r.restaurant,r.orderNo,isThirdPartyComplaint(r)?'是':'否',r.comment]))}</div></div>`
}
document.querySelector('#importBtn').onclick=()=>document.querySelector('#fileInput').click();document.querySelector('#fileInput').onchange=e=>e.target.files[0]&&importFile(e.target.files[0]).catch(err=>alert(err.message));document.querySelector('#monthSelect').onchange=e=>{loadCloud(e.target.value)};document.querySelectorAll('.tab:not(.disabled)').forEach(b=>b.onclick=async()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#'+b.dataset.page).classList.add('active');if(b.dataset.page==='trend'){document.querySelector('#trendContent').innerHTML='正在讀取上月資料…';await ensurePreviousMonthForTrend();renderTrend()}});document.querySelector('#filterIssue').onchange=renderComments;document.querySelector('#restaurantRank').onchange=e=>{state.restaurantRank=e.target.value;renderRestaurants(current())};document.querySelector('#filterText').oninput=renderComments;document.querySelector('#exportBtn').onclick=exportAnalysis;document.querySelector('#import080Btn').onclick=()=>document.querySelector('#file080').click();document.querySelector('#import4128Btn').onclick=()=>document.querySelector('#file4128').click();document.querySelector('#import3rdBtn').onclick=()=>document.querySelector('#file3rd').click();document.querySelector('#file080').onchange=e=>e.target.files[0]&&importComplaint(e.target.files[0],'080').catch(x=>alert(x.message));document.querySelector('#file4128').onchange=e=>e.target.files[0]&&importComplaint(e.target.files[0],'4128').catch(x=>alert(x.message));document.querySelector('#file3rd').onchange=e=>e.target.files[0]&&importThird(e.target.files[0]).catch(x=>alert(x.message));document.querySelector('#complaintSource').onchange=e=>{state.complaintSource=e.target.value;renderComplaints()};document.querySelector('#complaintCenter').onchange=e=>{state.complaintCenter=e.target.value;renderComplaints()};document.querySelector('#complaintRestaurantCode').onchange=e=>{state.complaintRestaurantCode=e.target.value;renderComplaints()};loadCloud();
