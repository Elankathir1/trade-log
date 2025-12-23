/**
 * TradeLog Pro Terminal - Static JS Engine
 */

// --- GLOBAL STATE ---
const AppState = {
    trades: [],
    role: 'USER',
    activeView: 'dashboard',
    charts: {},
    calendar: {
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    }
};

// --- UTILS ---
const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const saveState = () => {
    localStorage.setItem('tradelog_db_trades', JSON.stringify(AppState.trades));
    localStorage.setItem('tradelog_db_role', AppState.role);
};
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

// --- INITIALIZE FROM STORAGE ---
try {
    const storedTrades = localStorage.getItem('tradelog_db_trades');
    const storedRole = localStorage.getItem('tradelog_db_role');
    if (storedTrades) AppState.trades = JSON.parse(storedTrades);
    if (storedRole) AppState.role = storedRole;
} catch (e) {
    console.error("Local storage sync failed", e);
}

// --- GLOBAL ATTACHMENTS (Exposed to window for HTML onclicks) ---

window.openModal = function(type, data = null) {
    if (AppState.role === 'GUEST' && type === 'trade') {
        alert("Guest accounts are restricted to view-only access.");
        return;
    }
    const overlay = document.getElementById('modal-overlay');
    const modalTrade = document.getElementById('modal-trade');
    if (overlay) overlay.classList.remove('hidden');
    if (modalTrade) modalTrade.classList.remove('hidden');

    const form = document.getElementById('trade-form');
    if (form) form.reset();
    
    const fId = document.getElementById('f-id');
    const fDate = document.getElementById('f-date');
    const mTitle = document.getElementById('trade-modal-title');

    if (fId) fId.value = '';
    if (fDate) fDate.value = new Date().toISOString().split('T')[0];
    if (mTitle) mTitle.innerText = 'New Execution';

    if (data) {
        if (mTitle) mTitle.innerText = 'Modify Record';
        if (fId) fId.value = data.id;
        document.getElementById('f-symbol').value = data.symbol;
        document.getElementById('f-side').value = data.side;
        document.getElementById('f-entry').value = data.entryPrice;
        document.getElementById('f-exit').value = data.exitPrice || '';
        document.getElementById('f-qty').value = data.qty;
        if (fDate) fDate.value = data.date;
    }
};

window.closeModal = function() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
};

window.computeKPIs = function() {
    const closed = AppState.trades.filter(t => t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '');
    let net = 0, wins = 0;

    closed.forEach(t => {
        const p = (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.qty) * (t.side === 'LONG' ? 1 : -1);
        net += p;
        if (p > 0) wins++;
    });

    const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
    
    const kpiPnl = document.getElementById('kpi-pnl');
    const kpiWinRate = document.getElementById('kpi-winrate');
    const kpiTrades = document.getElementById('kpi-trades');
    const kpiBalance = document.getElementById('kpi-balance');

    if (kpiPnl) {
        kpiPnl.innerText = (net >= 0 ? '+' : '') + usd(net);
        kpiPnl.className = `text-3xl font-black tracking-tighter ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (kpiWinRate) kpiWinRate.innerText = `${winRate.toFixed(1)}%`;
    if (kpiTrades) kpiTrades.innerText = AppState.trades.length;
    if (kpiBalance) kpiBalance.innerText = usd(100000 + net);

    window.renderRecentFeed();
};

window.navigate = function(viewId) {
    const views = ['dashboard', 'journal', 'calendar', 'analytics', 'ai', 'admin'];
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        const btn = document.querySelector(`[data-nav="${v}"]`);
        if (el) el.classList.toggle('hidden', v !== viewId);
        if (btn) btn.classList.toggle('active', v === viewId);
    });

    const titleEl = document.getElementById('view-title');
    if (titleEl) titleEl.innerText = viewId;
    AppState.activeView = viewId;

    if (viewId === 'dashboard' || viewId === 'analytics') window.initCharts();
    if (viewId === 'journal') window.renderTable();
    if (viewId === 'calendar') window.renderCalendar();
    
    // Auto-close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }
};

window.renderTable = function(filter = '') {
    const tbody = document.getElementById('trade-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const display = AppState.trades.filter(t => t.symbol.toLowerCase().includes(filter.toLowerCase()));
    
    if (display.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-8 py-20 text-center text-slate-500 italic">No executions found.</td></tr>`;
        return;
    }

    [...display].reverse().forEach(t => {
        const isClosed = t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '';
        const pnl = isClosed ? (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.qty) * (t.side === 'LONG' ? 1 : -1) : null;
        
        const tr = document.createElement('tr');
        tr.className = 'group transition-colors hover:bg-slate-800/20';
        tr.innerHTML = `
            <td class="px-8 py-6 font-bold text-slate-100 uppercase tracking-tight">${t.symbol}</td>
            <td class="px-8 py-6"><span class="px-3 py-1 rounded-lg text-[9px] font-black tracking-widest ${t.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}">${t.side}</span></td>
            <td class="px-8 py-6 text-sm font-medium text-slate-400">${usd(t.entryPrice)}</td>
            <td class="px-8 py-6 text-sm font-medium text-slate-400">${isClosed ? usd(t.exitPrice) : 'OPEN'}</td>
            <td class="px-8 py-6 text-right font-black ${pnl === null ? 'text-slate-500' : (pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}">${pnl !== null ? usd(pnl) : '---'}</td>
            <td class="px-8 py-6 text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick='window.editTradeById("${t.id}")' class="p-2 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onclick='window.deleteTradeById("${t.id}")' class="p-2 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.renderRecentFeed = function() {
    const feed = document.getElementById('recent-feed');
    if (!feed) return;
    feed.innerHTML = '';
    const recent = [...AppState.trades].reverse().slice(0, 5);
    
    if (recent.length === 0) {
        feed.innerHTML = '<p class="text-slate-500 text-center py-20 italic">No historical executions.</p>';
        return;
    }

    recent.forEach(t => {
        const isClosed = t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '';
        const pnl = isClosed ? (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.qty) * (t.side === 'LONG' ? 1 : -1) : 0;
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-5 bg-slate-800/20 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer';
        div.onclick = () => window.openModal('trade', t);
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center ${t.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="${t.side === 'LONG' ? 'm17 7-10 10M7 7h10v10' : 'm7 17 10-10M17 17V7H7'}"/></svg>
                </div>
                <div>
                    <h5 class="font-black text-slate-100 text-sm uppercase">${t.symbol}</h5>
                    <p class="text-[9px] text-slate-500 uppercase font-black tracking-widest">${t.date}</p>
                </div>
            </div>
            <p class="font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${isClosed ? usd(pnl) : 'OPEN'}</p>
        `;
        feed.appendChild(div);
    });
};

window.renderCalendar = function() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('cal-title');
    if (!grid || !title) return;

    grid.innerHTML = '';
    const { month, year } = AppState.calendar;
    const date = new Date(year, month, 1);
    title.innerText = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayIdx = (date.getDay() + 6) % 7; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIdx; i++) grid.appendChild(Object.assign(document.createElement('div'), {className: 'calendar-day empty'}));

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayTrades = AppState.trades.filter(t => t.date === dateStr);
        let dailyPnl = 0;
        dayTrades.forEach(t => { 
            if (t.exitPrice) dailyPnl += (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.qty) * (t.side === 'LONG' ? 1 : -1);
        });

        const cell = document.createElement('div');
        cell.className = `calendar-day rounded-2xl p-4 flex flex-col justify-between cursor-pointer ${dailyPnl > 0 ? 'border-emerald-500/20 bg-emerald-500/5' : dailyPnl < 0 ? 'border-rose-500/20 bg-rose-500/5' : ''}`;
        cell.onclick = () => { if(dayTrades.length > 0) { window.navigate('journal'); window.renderTable(dateStr); } };

        const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
        if (isToday) cell.classList.add('today');

        cell.innerHTML = `
            <span class="text-[10px] font-black text-slate-500">${d}</span>
            <div class="text-center">
                ${dailyPnl !== 0 ? `<p class="text-[10px] font-black ${dailyPnl > 0 ? 'text-emerald-400' : 'text-rose-400'}">${usd(dailyPnl)}</p>` : ''}
                ${dayTrades.length > 0 ? `<p class="text-[8px] font-bold text-slate-500 uppercase mt-1">${dayTrades.length} Trades</p>` : ''}
            </div>
        `;
        grid.appendChild(cell);
    }
};

window.calPrev = function() { AppState.calendar.month--; if(AppState.calendar.month < 0){ AppState.calendar.month = 11; AppState.calendar.year--; } window.renderCalendar(); };
window.calNext = function() { AppState.calendar.month++; if(AppState.calendar.month > 11){ AppState.calendar.month = 0; AppState.calendar.year++; } window.renderCalendar(); };

window.initCharts = function() {
    const commonOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9, weight: 'bold' } } }, y: { grid: { color: '#1e293b' }, border: { display: false }, ticks: { color: '#475569', font: { size: 9, weight: 'bold' } } } } };

    if (AppState.activeView === 'dashboard') {
        const ctx = document.getElementById('equityChart');
        if (!ctx) return;
        if (AppState.charts.equity) AppState.charts.equity.destroy();

        let bal = 0;
        const closed = [...AppState.trades].filter(t => t.exitPrice).sort((a,b) => new Date(a.date) - new Date(b.date));
        const data = closed.map(t => {
            bal += (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.qty) * (t.side === 'LONG' ? 1 : -1);
            return bal;
        });

        AppState.charts.equity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i + 1),
                datasets: [{ data, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.05)', fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0 }]
            },
            options: commonOpts
        });
    }

    if (AppState.activeView === 'analytics') {
        const ctxB = document.getElementById('analyticsBarChart');
        if (ctxB) {
            if (AppState.charts.bar) AppState.charts.bar.destroy();
            const symbolMap = {};
            AppState.trades.forEach(t => {
                const p = t.exitPrice ? (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.qty) * (t.side === 'LONG' ? 1 : -1) : 0;
                symbolMap[t.symbol] = (symbolMap[t.symbol] || 0) + p;
            });
            AppState.charts.bar = new Chart(ctxB, {
                type: 'bar',
                data: { labels: Object.keys(symbolMap), datasets: [{ data: Object.values(symbolMap), backgroundColor: Object.values(symbolMap).map(v => v >= 0 ? '#10b981' : '#f43f5e'), borderRadius: 12 }] },
                options: commonOpts
            });
        }

        const ctxP = document.getElementById('analyticsPieChart');
        if (ctxP) {
            if (AppState.charts.pie) AppState.charts.pie.destroy();
            const closed = AppState.trades.filter(t => t.exitPrice);
            const wins = closed.filter(t => (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * (t.side === 'LONG' ? 1 : -1) > 0).length;
            const losses = closed.length - wins;

            AppState.charts.pie = new Chart(ctxP, {
                type: 'doughnut',
                data: { labels: ['Win', 'Loss'], datasets: [{ data: [wins, losses], backgroundColor: ['#10b981', '#f43f5e'], borderWidth: 0 }] },
                options: { ...commonOpts, cutout: '80%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#64748b', font: { weight: 'bold' } } } } }
            });
        }
    }
};

window.saveTrade = function(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('f-id').value || generateUUID();
    const trade = {
        id,
        symbol: document.getElementById('f-symbol').value.toUpperCase(),
        side: document.getElementById('f-side').value,
        entryPrice: document.getElementById('f-entry').value,
        exitPrice: document.getElementById('f-exit').value || null,
        qty: document.getElementById('f-qty').value,
        date: document.getElementById('f-date').value
    };

    const idx = AppState.trades.findIndex(t => t.id === id);
    if (idx > -1) AppState.trades[idx] = trade;
    else AppState.trades.push(trade);

    saveState();
    window.computeKPIs();
    window.closeModal();
    window.navigate(AppState.activeView);
};

window.deleteTradeById = function(id) {
    if (confirm('Permanently purge record?')) {
        AppState.trades = AppState.trades.filter(t => t.id !== id);
        saveState();
        window.computeKPIs();
        window.navigate(AppState.activeView);
    }
};

window.editTradeById = function(id) {
    const t = AppState.trades.find(x => x.id === id);
    if (t) window.openModal('trade', t);
};

window.changeRole = function(val) {
    AppState.role = val;
    const label = document.getElementById('role-label');
    if (label) label.innerText = val;
    saveState();
    window.navigate('dashboard');
};

window.unlockAdmin = function() {
    const passInput = document.getElementById('admin-pass');
    const pass = passInput ? passInput.value : '';
    if (pass === '123') {
        const lock = document.getElementById('admin-lock');
        const panel = document.getElementById('admin-panel');
        if (lock) lock.classList.add('hidden');
        if (panel) panel.classList.remove('hidden');
    } else {
        alert('Access Denied.');
    }
};

window.factoryReset = function() {
    if (confirm('Factory reset local terminal?')) {
        localStorage.clear();
        location.reload();
    }
};

window.exportData = function() {
    const blob = new Blob([JSON.stringify(AppState)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `archive_${Date.now()}.json`;
    a.click();
};

window.runMockAudit = function() {
    const btn = document.querySelector('[onclick="window.runMockAudit()"]');
    if (btn) {
        btn.innerText = "Processing...";
        btn.disabled = true;
    }
    setTimeout(() => {
        const report = document.getElementById('audit-report');
        if (report) report.classList.remove('hidden');
        if (btn) btn.innerText = "Complete";
    }, 1200);
};

// --- STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    const roleSelector = document.getElementById('role-selector');
    const roleLabel = document.getElementById('role-label');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (roleSelector) roleSelector.value = AppState.role;
    if (roleLabel) roleLabel.innerText = AppState.role;
    if (overlay) overlay.onclick = window.toggleSidebar;
    
    window.computeKPIs();
    window.navigate('dashboard');
});