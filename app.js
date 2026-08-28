import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

        const db = createClient(
            'https://adydoupjiloapeuclsvr.supabase.co',
            'sb_publishable_13AfLUbqgYm9bkju8x84RA_eJtiLe1g'
        );

        let selectedPerson = null;
        let currentTab = 'today';
        let selectedPeriod = 'today';
        let quickPerson = null;
        let selectedCategory = 'place';
        let categoryFilter = 'all';
        let items = [];
        let pendingCompletionId = null;
        let selectedRating = 0;

        function toUiItem(row) {
            return {
                id: String(row.id),
                text: row.title,
                date: row.target_date || null,
                person: Number(row.person) || 1,
                completed: !!row.completed,
                createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
                completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
                rating: row.rating == null ? null : Number(row.rating),
                period: row.period || 'someday',
                category: row.category || 'activity',
                note: row.note || null
            };
        }

        async function refreshItems() {
            const { data, error } = await db.from('wishlist_items').select('*').order('created_at', { ascending: false });
            if (error) {
                console.error('読み込みエラー:', error);
                return;
            }
            items = (data || []).map(toUiItem);
            renderItems();
            if (document.getElementById('memoriesView').classList.contains('active')) renderMemories();
        }

        async function insertItem(payload) {
            const { error } = await db.from('wishlist_items').insert(payload);
            if (error) throw error;
            await refreshItems();
        }

        async function updateItem(itemId, payload) {
            const { error } = await db.from('wishlist_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', Number(itemId));
            if (error) throw error;
            await refreshItems();
        }

        window.selectPerson = function(person) {
            selectedPerson = person;
            document.getElementById('person1Btn').classList.remove('active-person1');
            document.getElementById('person2Btn').classList.remove('active-person2');
            if (person === 1) document.getElementById('person1Btn').classList.add('active-person1');
            else document.getElementById('person2Btn').classList.add('active-person2');
        };

        window.addItem = async function() {
            const text = document.getElementById('itemInput').value.trim();
            const date = document.getElementById('dateInput').value;
            if (!text) return alert('やりたいことを入力してください');
            if (!selectedPerson) return alert('記入者を選択してください');
            try {
                await insertItem({
                    title: text,
                    target_date: date || null,
                    person: selectedPerson,
                    completed: false,
                    period: 'someday',
                    category: 'activity'
                });
                document.getElementById('itemInput').value = '';
                document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
            } catch (error) { alert('追加エラー: ' + error.message); }
        };

        window.toggleComplete = async function(itemId, completed) {
            if (completed) {
                const item = items.find(i => i.id === String(itemId));
                if (!item) return;
                pendingCompletionId = String(itemId);
                selectedRating = 0;
                document.getElementById('ratingItemTitle').textContent = item.text || '';
                document.querySelectorAll('.rating-star').forEach(b => b.classList.remove('active'));
                document.getElementById('ratingCaption').textContent = '星をタップして満足度を記録';
                document.getElementById('saveRatingBtn').disabled = true;
                document.getElementById('ratingModal').classList.add('active');
                return;
            }
            try {
                await updateItem(itemId, { completed: false, completed_at: null, rating: null });
            } catch (error) { alert('更新エラー: ' + error.message); }
        };

        window.selectRating = function(rating) {
            selectedRating = rating;
            const captions = ['', 'うーん', 'まあまあ', 'よかった', 'かなり満足', '最高！'];
            document.querySelectorAll('.rating-star').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.rating) <= rating));
            document.getElementById('ratingCaption').textContent = `${rating} / 5　${captions[rating]}`;
            document.getElementById('saveRatingBtn').disabled = false;
        };

        window.closeRatingModal = function() {
            document.getElementById('ratingModal').classList.remove('active');
            pendingCompletionId = null;
            selectedRating = 0;
        };

        window.saveCompletionWithRating = async function() {
            if (!pendingCompletionId || !selectedRating) return;
            try {
                await updateItem(pendingCompletionId, {
                    completed: true,
                    completed_at: new Date().toISOString(),
                    rating: selectedRating
                });
                document.getElementById('ratingModal').classList.remove('active');
                pendingCompletionId = null;
                selectedRating = 0;
            } catch (error) { alert('更新エラー: ' + error.message); }
        };

        window.deleteItem = async function(itemId) {
            if (!itemId || !window.confirm('本当に削除しますか？')) return;
            try {
                const { error } = await db.from('wishlist_items').delete().eq('id', Number(itemId));
                if (error) throw error;
                items = items.filter(item => item.id !== String(itemId));
                renderItems();
                if (document.getElementById('memoriesView').classList.contains('active')) renderMemories();
            } catch (error) {
                console.error('削除エラー:', error);
                alert('削除エラー: ' + error.message);
            }
        };

        window.switchTab = function(tab, el) {
            currentTab = tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            (el || document.querySelector(`[data-tab="${tab}"]`))?.classList.add('active');
            renderItems();
        };

        window.openMemories = function(){ document.getElementById('mainView').classList.add('hidden'); document.getElementById('memoriesView').classList.add('active'); document.querySelector('.fab-add').style.display='none'; renderMemories(); window.scrollTo({top:0,behavior:'smooth'}); };
        window.closeMemories = function(){ document.getElementById('memoriesView').classList.remove('active'); document.getElementById('mainView').classList.remove('hidden'); document.querySelector('.fab-add').style.display='block'; window.scrollTo({top:0,behavior:'smooth'}); };
        window.openAddModal = function(){ document.getElementById('addModal').classList.add('active'); setTimeout(()=>document.getElementById('quickItemInput').focus(),50); };
        window.closeAddModal = function(){ document.getElementById('addModal').classList.remove('active'); };
        window.selectPeriod = function(period){ selectedPeriod=period; document.querySelectorAll('.period-btn').forEach(b=>b.classList.toggle('active',b.dataset.period===period)); };
        window.selectQuickPerson = function(person){ quickPerson=person; document.getElementById('quickPerson1').classList.toggle('active-person1',person===1); document.getElementById('quickPerson2').classList.toggle('active-person2',person===2); };
        window.selectQuickCategory = function(category){ selectedCategory=category; document.querySelectorAll('[data-quick-category]').forEach(b=>b.classList.toggle('active',b.dataset.quickCategory===category)); };
        window.selectCategoryFilter = function(category){ categoryFilter=category; document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.category===category)); renderItems(); };

        window.addQuickItem = async function(){
            const text=document.getElementById('quickItemInput').value.trim();
            if(!text) return alert('やりたいことを入力してください');
            if(!quickPerson) return alert('発案者を選択してください');
            try{
                await insertItem({ title:text, person:quickPerson, period:selectedPeriod, category:selectedCategory, completed:false, target_date:null });
                document.getElementById('quickItemInput').value='';
                closeAddModal();
                switchTab(selectedPeriod);
            }catch(error){ alert('追加エラー: '+error.message); }
        };

        window.moveItem = async function(itemId, period){
            try { await updateItem(itemId, { period }); }
            catch(error){ alert('更新エラー: '+error.message); }
        };

        window.changeTheme = function(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('wishlistTheme', theme);
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
            document.querySelector(`[data-theme="${theme}"]`)?.classList.add('active');
        };

        window.toggleSettings = function() { document.getElementById('settingsPanel').classList.toggle('active'); };

        window.updatePersonNames = function() {
            const person1 = document.getElementById('person1Name').value.trim() || '人1';
            const person2 = document.getElementById('person2Name').value.trim() || '人2';
            localStorage.setItem('person1Name', person1);
            localStorage.setItem('person2Name', person2);
            document.getElementById('person1Btn').textContent = person1;
            document.getElementById('person2Btn').textContent = person2;
            document.getElementById('quickPerson1').textContent = person1;
            document.getElementById('quickPerson2').textContent = person2;
            renderItems();
        };

        if (!localStorage.getItem('person1Name') || localStorage.getItem('person1Name') === '人1' || localStorage.getItem('person1Name') === 'たつさん') localStorage.setItem('person1Name', 'たつ');
        if (!localStorage.getItem('person2Name') || localStorage.getItem('person2Name') === '人2') localStorage.setItem('person2Name', 'なみーちゃん');

        const person1Name = localStorage.getItem('person1Name') || 'たつ';
        const person2Name = localStorage.getItem('person2Name') || 'なみーちゃん';
        document.getElementById('person1Name').value = person1Name;
        document.getElementById('person2Name').value = person2Name;
        document.getElementById('person1Btn').textContent = person1Name;
        document.getElementById('person2Btn').textContent = person2Name;
        document.getElementById('quickPerson1').textContent = person1Name;
        document.getElementById('quickPerson2').textContent = person2Name;

        document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
        const savedTheme = localStorage.getItem('wishlistTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        setTimeout(() => document.querySelector(`[data-theme="${savedTheme}"]`)?.classList.add('active'), 100);

        function renderItems() {
            const container = document.getElementById('itemsContainer');
            const normalized = items.map(i => ({...i, period: i.period || 'someday', category: i.category || 'activity'}));
            const active = normalized.filter(i=>!i.completed);
            const doneItems=normalized.filter(i=>i.completed);
            const groups = {today:active.filter(i=>i.period==='today'),week:active.filter(i=>i.period==='week'),month:active.filter(i=>i.period==='month'),someday:active.filter(i=>i.period==='someday')};
            ['today','week','month','someday'].forEach(k=>document.getElementById(k+'Count').textContent=groups[k].length);
            document.getElementById('doneCount').textContent=doneItems.length;
            const rawDisplayItems=groups[currentTab] || [];
            const displayItems=categoryFilter==='all' ? rawDisplayItems : rawDisplayItems.filter(i=>i.category===categoryFilter);
            const person1Name=localStorage.getItem('person1Name')||'たつ'; const person2Name=localStorage.getItem('person2Name')||'なみーちゃん';
            let hero = currentTab==='today' ? `<div class="today-hero"><h2>今日、なんかする？</h2><p>今日やりたいことをここに集めよう。＋から10秒で追加できる。</p></div>` : '';
            if(displayItems.length===0){ container.innerHTML=hero+`<div class="empty-state"><div class="empty-state-icon">✨</div><p>ここはまだ空っぽです</p></div>`; return; }
            const labels={today:'今日',week:'今週',month:'今月',someday:'いつか'};
            const categoryLabels={place:'📍 行きたい',food:'🍴 食べたい',activity:'🎯 やりたい',buy:'🛍 買いたい'};
            container.innerHTML=hero+displayItems.map(item=>`
              <div class="item-card">
                <div class="item-header"><div><div class="item-title">${item.text}</div><div style="margin-top:8px"><span class="category-badge">${categoryLabels[item.category]||'🎯 やりたい'}</span></div></div><div class="item-meta"><span class="person-badge person${item.person}">${item.person===1?person1Name:person2Name}</span></div></div>
                ${!item.completed ? `<div class="move-row">${Object.entries(labels).filter(([k])=>k!==item.period).map(([k,v])=>`<button class="move-btn" onclick="moveItem('${item.id}','${k}')">→ ${v}</button>`).join('')}</div>`:''}
                <div style="display:flex;gap:10px;margin-top:14px">${!item.completed?`<button class="complete-btn" onclick="toggleComplete('${item.id}',true)">✓ やった！</button>`:`<button class="uncomplete-btn" onclick="toggleComplete('${item.id}',false)">↩ 戻す</button>`}<button type="button" class="delete-btn" data-delete-id="${item.id}">🗑️ 削除</button></div>
              </div>`).join('');
        }

        function renderMemories(){
            const c=document.getElementById('memoriesContainer');
            const done=items.filter(i=>i.completed).sort((a,b)=>(b.completedAt||b.createdAt||0)-(a.completedAt||a.createdAt||0));
            const categoryLabels={place:'📍 行った場所',food:'🍴 食べたもの',activity:'🎯 やったこと',buy:'🛍 買ったもの'};
            const counts={place:0,food:0,activity:0,buy:0}; done.forEach(i=>counts[i.category||'activity']++);
            const rated=done.filter(i=>Number(i.rating)>=1 && Number(i.rating)<=5);
            const avgRating=rated.length ? (rated.reduce((sum,i)=>sum+Number(i.rating),0)/rated.length).toFixed(1) : null;
            const summary=`<div class="memory-summary"><h2>${done.length}個の思い出</h2><p>ふたりで「やった！」にした記録。</p><div class="memory-stats"><span class="memory-stat">📍 ${counts.place}</span><span class="memory-stat">🍴 ${counts.food}</span><span class="memory-stat">🎯 ${counts.activity}</span><span class="memory-stat">🛍 ${counts.buy}</span>${avgRating ? `<span class="memory-stat">★ 平均 ${avgRating}</span>` : ''}</div></div>`;
            if(!done.length){ c.innerHTML=summary+'<div class="empty-state"><div class="empty-state-icon">📖</div><p>まだ思い出はありません</p></div>'; return; }
            let html=summary, lastMonth='';
            done.forEach(item=>{
                const d=new Date(item.completedAt||item.createdAt||Date.now());
                const month=`${d.getFullYear()}年${d.getMonth()+1}月`;
                if(month!==lastMonth){ html+=`<h3 class="memory-month">${month}</h3>`; lastMonth=month; }
                const rating=Number(item.rating)||0;
                const stars=rating ? `<div class="memory-rating"><span class="star">${'★'.repeat(rating)}</span><span class="rating-text">${rating}/5</span></div>` : `<div class="memory-rating"><span class="rating-text">未評価</span></div>`;
                html+=`<div class="memory-card"><div class="memory-date"><strong>${d.getDate()}</strong>${['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()]}</div><div><div class="item-title">${item.text}</div><span class="category-badge">${categoryLabels[item.category||'activity']}</span>${stars}<div class="memory-actions"><button class="uncomplete-btn" onclick="toggleComplete('${item.id}',false); setTimeout(renderMemories,150)">↩ 戻す</button><button type="button" class="delete-btn" data-delete-id="${item.id}">🗑️ 削除</button></div></div></div>`;
            }); c.innerHTML=html;
        }

        document.getElementById('memoriesContainer').addEventListener('click', function(e){ const b=e.target.closest('[data-delete-id]'); if(!b)return; e.preventDefault(); e.stopPropagation(); deleteItem(b.dataset.deleteId).then(()=>renderMemories()); });
        document.getElementById('itemsContainer').addEventListener('click', function(e) { const deleteButton = e.target.closest('[data-delete-id]'); if (!deleteButton) return; e.preventDefault(); e.stopPropagation(); deleteItem(deleteButton.dataset.deleteId); });
        const legacyItemInput = document.getElementById('itemInput');
        if (legacyItemInput) legacyItemInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') addItem(); });

        await refreshItems();
        setInterval(refreshItems, 15000);
