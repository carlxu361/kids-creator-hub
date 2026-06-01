// ============================================
// 排行榜模块 - 小创客冒险之旅
// ============================================

const Leaderboard = {
    // 获取全局排行榜
    async getGlobal(limit = 100) {
        const sb = getSupabase();
        if (!sb) return [];

        try {
            const { data, error } = await sb
                .from('users')
                .select('id, display_name, avatar_emoji, xp, level_count, streak_count')
                .order('xp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Get global leaderboard failed:', e);
            return [];
        }
    },

    // 获取好友排行榜
    async getFriends() {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return [];

        try {
            // 先获取好友 ID 列表
            const { data: friendships } = await sb
                .from('friendships')
                .select('requester_id, addressee_id')
                .eq('status', 'accepted')
                .or(`requester_id.eq.${Auth.user.id},addressee_id.eq.${Auth.user.id}`);

            const friendIds = (friendships || []).map(f =>
                f.requester_id === Auth.user.id ? f.addressee_id : f.requester_id
            );
            friendIds.push(Auth.user.id); // 包含自己

            const { data, error } = await sb
                .from('users')
                .select('id, display_name, avatar_emoji, xp, level_count, streak_count')
                .in('id', friendIds)
                .order('xp', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Get friends leaderboard failed:', e);
            return [];
        }
    },

    // 获取用户排名
    async getMyRank() {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return null;

        try {
            // 获取所有用户 XP，计算排名
            const { data: users } = await sb
                .from('users')
                .select('id, xp')
                .order('xp', { ascending: false });

            if (!users) return null;

            const myIndex = users.findIndex(u => u.id === Auth.user.id);
            return {
                rank: myIndex + 1,
                total: users.length,
                xp: Auth.profile?.xp || 0
            };
        } catch (e) {
            return null;
        }
    },

    // 显示排行榜模态框
    async showModal() {
        showToastI('📊', '加载排行榜...');

        const [global, friends, myRank] = await Promise.all([
            this.getGlobal(50),
            this.getFriends(),
            this.getMyRank()
        ]);

        const html = `
        <div class="modal-overlay" id="lbModal" onclick="if(event.target===this)this.remove()">
            <div class="modal" style="max-width:550px">
                <h2>🏆 排行榜</h2>

                ${myRank ? `
                <div style="text-align:center;padding:12px;background:rgba(108,92,231,.1);border-radius:10px;margin-bottom:16px">
                    <div style="font-size:.85em;color:var(--dim)">我的排名</div>
                    <div style="font-size:1.8em;font-weight:700;color:var(--warning)">第 ${myRank.rank} 名</div>
                    <div style="font-size:.8em;color:var(--dim)">共 ${myRank.total} 人 · ${myRank.xp} XP</div>
                </div>
                ` : ''}

                <div style="display:flex;gap:8px;margin-bottom:16px">
                    <button class="qbtn pri" style="flex:1" onclick="Leaderboard.switchTab('global')" id="lbTabGlobal">🌍 全球</button>
                    <button class="qbtn" style="flex:1" onclick="Leaderboard.switchTab('friends')" id="lbTabFriends">👫 好友</button>
                </div>

                <div id="lbContent">
                    ${this.renderList(global)}
                </div>

                <button class="modal-btn sec" style="margin-top:16px" onclick="document.getElementById('lbModal').remove()">关闭</button>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);

        // 缓存数据
        this._globalData = global;
        this._friendsData = friends;
    },

    // 渲染排行榜列表
    renderList(users) {
        if (users.length === 0) {
            return '<p style="text-align:center;color:var(--dim);padding:20px">暂无数据</p>';
        }

        return `
        <div class="leaderboard">
            ${users.map((u, i) => {
                const isMe = u.id === Auth.user?.id;
                const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

                return `
                <div class="lb-item ${isMe ? 'me' : ''}">
                    <div class="lb-rank ${rankClass}">${medal}</div>
                    <div class="lb-avatar">${u.avatar_emoji || '🐱'}</div>
                    <div class="lb-name">
                        ${u.display_name}
                        ${u.streak_count > 0 ? `<span class="streak-badge" style="font-size:.7em;padding:1px 6px">🔥${u.streak_count}</span>` : ''}
                    </div>
                    <div class="lb-xp">⭐ ${u.xp || 0}</div>
                </div>`;
            }).join('')}
        </div>`;
    },

    // 切换标签
    switchTab(tab) {
        const globalBtn = document.getElementById('lbTabGlobal');
        const friendsBtn = document.getElementById('lbTabFriends');
        const content = document.getElementById('lbContent');

        if (tab === 'global') {
            globalBtn.className = 'qbtn pri';
            friendsBtn.className = 'qbtn';
            content.innerHTML = this.renderList(this._globalData || []);
        } else {
            globalBtn.className = 'qbtn';
            friendsBtn.className = 'qbtn pri';
            content.innerHTML = this.renderList(this._friendsData || []);
        }
    }
};
