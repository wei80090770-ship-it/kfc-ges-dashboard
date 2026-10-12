/* GES v8.20: independent KPI records. SQL setup required before cloud editing. */
(()=>{
'use strict';
const N=['台北外送中心','新北外送中心','桃園外送中心','台中外送中心','台南外送中心','高雄外送中心','全市場'];
const F=['osat','sos','accuracy','taste','responses'];
const HEAD=['中心名稱','OSAT','SOS','餐點正確性','餐點好吃度','份數'];
const OP='f75f1b3d-39d5-4f4b-b211-7f423ffa8357';
const $=id=>document.getElementById(id);
const op=()=>authSession?.user?.id===OP;
let cloud=[],loaded=false,chart=null,yoy=null,preview=null;
function msg(t){$('kpiMessage').textContent=t}
function chosen(){return {year:Number($('kpiYear').value),month:Number($('kpiMonth').value)}}
function allRows(){const seeds=seedRows();if(!loaded)return seeds;const ids=new Set(cloud.map(r=>`${r.year}-${r.month}-${r.center}`));return [...seeds.filter(r=>!ids.has(`${r.year}-${r.month}-${r.center}`)),...cloud]}
function seedRows(){return Object.entries(window.GES_KPI_SEED||{}).flatMap(([m,rs])=>rs.map((a,i)=>({year:2026,month:Number(m),center:N[i],osat:a[0],sos:a[1],accuracy:a[2],taste:a[3],responses:a[4]})))}
function currentRows(){const {year,month}=chosen();return N.map(c=>allRows().find(r=>r.year===year&&r.month===month&&r.center===c)||{year,month,center:c,osat:null,sos:null,accuracy:null,taste:null,responses:null})}
function td(v){return v===null||v===undefined?'—':String(v)}
function renderTable(){let rs=currentRows();$('kpiGrid').innerHTML=`<div class="kpi-report"><div class="kpi-month-title">${chosen().year} M${chosen().month}</div><table class="kpi-table"><thead><tr>${HEAD.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rs.map(r=>`<tr class="${r.center==='全市場'?'market-total':''}"><td>${r.center}</td>${F.map((f,i)=>`<td class="${i<4&&r[f]!==null&&Number(r[f])<80?'below':''}">${td(r[f])}${i<4&&r[f]!==null?'%':''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 if(op()){$('kpiEditor').style.display='block';$('kpiInputs').innerHTML=`<div class="scroll"><table class="kpi-table"><thead><tr>${HEAD.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rs.map((r,i)=>`<tr><td>${r.center}</td>${F.map((f,j)=>`<td><input type="number" data-ri="${i}" data-field="${f}" min="0" ${j<4?'max="100" step="0.01"':'step="1"'} value="${r[f]??''}" style="width:76px"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`}else $('kpiEditor').style.display='none';
 renderCharts();}

function line(ctx, old, labels, datasets) {
  if (old) old.destroy();

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
        axis: 'x'
      },
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(items) {
              return items.length ? items[0].label : '';
            },
            label: function(context) {
              const value = context.parsed.y;

              return context.dataset.label + ': ' +
                (value === null ? '尚無資料' : value + '%');
            }
          }
        }
      },
      scales: {
        y: {
          min: 60,
          max: 100,
          ticks: {
            stepSize: 5,
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            display: true
          }
        },
        x: {
          grid: {
            display: true
          }
        }
      }
    }
  });
}

function renderCharts(){const year=chosen().year,metric=$('kpiMetric').value,rows=allRows();chart=line($('kpiChart'),chart,Array.from({length:12},(_,i)=>`M${i+1}`),N.slice(0,6).map(c=>({label:c,data:Array.from({length:12},(_,i)=>rows.find(r=>r.year===year&&r.month===i+1&&r.center===c)?.[metric]??null),spanGaps:false,tension:.15})));const center=$('kpiCompareCenter').value;yoy=line($('kpiYoYChart'),yoy,Array.from({length:12},(_,i)=>`M${i+1}`),[year-1,year].map(y=>({label:`${center} ${y}`,data:Array.from({length:12},(_,i)=>rows.find(r=>r.year===y&&r.month===i+1&&r.center===center)?.[metric]??null),tension:.15})));}
async function load(){try{cloud=await api('ges_monthly_kpi?select=year,month,center,osat,sos,accuracy,taste,responses&order=year.asc,month.asc');loaded=true;msg('已連線 Supabase；2026 M2～M8 尚未儲存的月份會以內建成績顯示。需要長期保存時，請由 OP 逐月儲存。')}catch(e){cloud=[];loaded=false;msg('目前顯示內建 M2～M8 預覽資料；請先在 Supabase SQL Editor 執行 SUPABASE_KPI_SETUP.sql，才能雲端儲存。 '+e.message)}renderTable()}
async function save(){if(!op())return alert('僅 OP 可修改');if(!loaded)return alert('尚未連接 KPI 資料表，請先執行 SQL');const {year,month}=chosen();const rs=N.map((center,i)=>{let r={year,month,center};for(let f of F){let el=document.querySelector(`#kpiInputs [data-ri="${i}"][data-field="${f}"]`);if(!el.value.trim())throw Error(`${center} 的 ${f} 尚未填寫`);let v=Number(el.value);if(!Number.isFinite(v)||v<0||(f!=='responses'&&v>100)||(f==='responses'&&!Number.isInteger(v)))throw Error(`${center} 的 ${f} 數值不正確`);r[f]=v}return r});try{await api('ges_monthly_kpi?on_conflict=year,month,center',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rs)});await load();alert('已儲存七筆月度成績')}catch(e){alert(e.message)}}
function excelRows(m){let year=chosen().year,rows=allRows();return N.map(c=>rows.find(r=>r.year===year&&r.month===m&&r.center===c)||{center:c})}
async function exportExcel(yearly){if(typeof ExcelJS==='undefined')return alert('Excel 元件尚未載入');const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet(yearly?'年度成績':'月度成績');ws.columns=[{width:22},{width:13},{width:13},{width:18},{width:18},{width:14}];const months=yearly?Array.from({length:12},(_,i)=>i+1):[chosen().month];let rowNum=1;
 for(const m of months){ws.mergeCells(rowNum,1,rowNum,6);let title=ws.getCell(rowNum,1);title.value=`${chosen().year} M${m}`;title.alignment={horizontal:'center'};title.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFD9EEF5'}};title.font={bold:true};for(let c=1;c<=6;c++)ws.getCell(rowNum,c).border=border();rowNum++;let h=ws.getRow(rowNum++);HEAD.forEach((v,i)=>{let cell=h.getCell(i+1);cell.value=v;cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFDCF1DC'}};cell.font={bold:true};cell.border=border();cell.alignment={horizontal:'center'}});
 for(const r of excelRows(m)){let rr=ws.getRow(rowNum++);[r.center,...F.map(f=>r[f]??null)].forEach((v,i)=>{let cell=rr.getCell(i+1);cell.value=v;cell.border=border();cell.alignment={horizontal:i===0?'left':'center'};if(i>0&&i<5){cell.numFmt='0.##"%"';if(v!==null&&v<80)cell.font={color:{argb:'FFFF0000'}}}if(r.center==='全市場'){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF00'}};cell.font={bold:true,...(i>0&&i<5&&v!==null&&v<80?{color:{argb:'FFFF0000'}}:{})}}})}rowNum+=2;}
 const b=await wb.xlsx.writeBuffer();download(new Blob([b],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`GES_${chosen().year}_${yearly?'年度':`M${chosen().month}`}_成績.xlsx`)}
function border(){return {top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}}}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function csvJson(x,name){download(new Blob([JSON.stringify(x,null,2)],{type:'application/json;charset=utf-8'}),name)}
const storageMap={ges:{table:'ges_responses',col:'report_month'},'080':{table:'complaint_records',col:'report_month',source:'080'},'4128':{table:'complaint_records',col:'report_month',source:'4128'},third:{table:'third_party_orders',col:'report_month'}};
function storageQuery(){const t=$('storageType').value,m=$('storageMonth').value;if(!/^\d{4}-\d{2}$/.test(m))throw Error('請選擇月份');if(t==='ges_monthly_kpi'){let [y,mo]=m.split('-');return `ges_monthly_kpi?year=eq.${y}&month=eq.${Number(mo)}`}let spec=storageMap[t];return `${spec.table}?${spec.col}=eq.${encodeURIComponent(m)}${spec.source?`&source_type=eq.${spec.source}`:""}`}
async function previewStorage(){preview=null;$('storageDelete').disabled=true;try{const q=storageQuery();const rows=await api(q+'&select=*');preview={q,rows,kind:$('storageType').value,month:$('storageMonth').value};$('storageResult').textContent=`找到 ${rows.length} 筆。請先備份，再決定是否清除。`;if(op()&&rows.length)$('storageDelete').disabled=false}catch(e){$('storageResult').textContent=`無法預覽：${e.message}。此類資料表名稱需先確認，系統不會刪除。`}}
async function deleteStorage(){if(!op()||!preview||!preview.rows.length)return;let s=`DELETE ${preview.rows.length}`;let entered=prompt(`即將永久刪除 ${preview.kind} ${preview.month} 共 ${preview.rows.length} 筆。請輸入「${s}」確認：`);if(entered!==s)return;try{await api(preview.q,{method:'DELETE',headers:{Prefer:'return=minimal'}});$('storageResult').textContent='雲端刪除已送出，請重新預覽確認';preview=null;$('storageDelete').disabled=true;await cacheClear();if($('storageType').value==='ges_monthly_kpi')await load()}catch(e){alert('刪除失敗：'+e.message)}}
function guard(){const editable=op();for(const id of ['importBtn','import080Btn','import4128Btn','import3rdBtn']){const el=$(id);if(el)el.style.display=editable?'':'none'}$('storageAdmin').style.display=editable?'block':'none';$('kpiEditor').style.display=editable?'block':'none';}
function init(){for(let i=1;i<=12;i++)$('kpiMonth').add(new Option(`M${i}`,i));$('kpiMonth').value='8';for(let n of N)$('kpiCompareCenter').add(new Option(n,n));$('kpiLoad').onclick=load;$('kpiMonth').onchange=renderTable;$('kpiYear').onchange=renderTable;$('kpiMetric').onchange=renderCharts;$('kpiCompareCenter').onchange=renderCharts;$('kpiSave').onclick=()=>save().catch(e=>alert(e.message));$('kpiExportMonth').onclick=()=>exportExcel(false).catch(e=>alert(e.message));$('kpiExportYear').onclick=()=>exportExcel(true).catch(e=>alert(e.message));$('kpiExportChart').onclick=()=>downloadDataURL($('kpiChart').toDataURL('image/png'));$('storagePreview').onclick=previewStorage;$('storageBackup').onclick=()=>preview?csvJson(preview.rows,`${preview.kind}_${preview.month}_backup.json`):alert('請先預覽');$('storageDelete').onclick=deleteStorage;$('storageCache').onclick=async()=>{await cacheClear();alert('本機快取已清除')};for(const id of ['storageType','storageMonth'])$(id).onchange=()=>{preview=null;$('storageDelete').disabled=true;$('storageResult').textContent='請重新預覽'};document.addEventListener('click',e=>{if(e.target.closest('[data-page="kpi"]')){guard();load()}if(e.target.closest('[data-page="storage"]'))guard()});document.querySelector('#loginForm')?.addEventListener('submit',()=>setTimeout(guard,1500));guard();renderTable()}
function downloadDataURL(data){const a=document.createElement('a');a.href=data;a.download=`GES_${chosen().year}_趨勢.png`;a.click()}
init();
})();
