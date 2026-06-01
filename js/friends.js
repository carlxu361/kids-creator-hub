// ============================================
// 好友系统模块 - 小创客冒险之旅
// ============================================

const Friends = {
    // 发送好友请求
    async sendRequest(inviteCode) {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return { error: '未登录' };

        const code = inviteCode.toUpperCase().trim();
        if (code.length !== 8) return { error: '邀请码格式错误' };

        try {
            // 查找目标用户
            const { data: targetUser, error: findError } = await sb
                .from('users')
                .select('id, display_name, avatar_emoji')
                .eq('invite_code', code)
                .single();

            if (findError || !targetUser) return { error: '找不到该用户' };
            if (targetUser.id === Auth.user.id) return { error: '不能添加自己为好友' };

            // 检查是否已经是好友
            const { data: existing } = await sb
                .from('friendships')
                .select('*')
                .or(`and(requester_id.eq.${Auth.user.id},addressee_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},addressee_id.eq.${Auth.user.id})`)
                .single();

            if (existing) {
                if (existing.status === 'accepted') return { error: '已经是好友了' };
                return { error: '已发送过请求，等待对方确认' };
            }

            // 发送请求
            const { error: insertError } = await sb
                .from('friendships')
                .insert({
                    requester_id: Auth.user.id,
                    addressee_id: targetUser.id,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            // 记录活动
            await sb.from('activities').insert({
                user_id: Auth.user.id,
                activity_type: 'friend_request',
                data: { target_name: targetUser.display_name }
            });

            return { success: true, name: targetUser.display_name };

        } catch (e) {
            console.error('Send friend request failed:', e);
            return { error: '发送失败，请重试' };
        }
    },

    // 获取好友列表
    async getFriends() {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return [];

        try {
            const { data, error } = await sb
                .from('friendships')
                .select(`
                    status,
                    created_at,
                    requester:users!friendships_requester_id_fkey(id, display_name, avatar_emoji, xp, level_count, streak_count),
                    addressee:users!friendships_addressee_id_fkey(id, display_name, avatar_emoji, xp, level_count, streak_count)
                `)
                .or(`requester_id.eq.${Auth.user.id},addressee_id.eq.${Auth.user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 格式化数据
            return (data || []).map(f => {
                const isRequester = f.requester.id === Auth.user.id;
                const friend = isRequester ? f.addressee : f.requester;
                return {
                    friendship: f,
                    friend: friend,
                    status: f.status,
                    isIncoming: !isRequester && f.status === 'pending'
                };
            });

        } catch (e) {
            console.error('Get friends failed:', e);
            return [];
        }
    },

    // 接受好友请求
    async acceptRequest(requesterId) {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return false;

        try {
            const { error } = await sb
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('requester_id', requesterId)
                .eq('addressee_id', Auth.user.id);

            if (error) throw error;

            // 记录活动
            await sb.from('activities').insert({
                user_id: Auth.user.id,
                activity_type: 'friend_accept',
                data: { friend_id: requesterId }
            });

            return true;
        } catch (e) {
            console.error('Accept request failed:', e);
            return false;
        }
    },

    // 拒绝/删除好友
    async removeFriend(friendId) {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return false;

        try {
            const { error } = await sb
                .from('friendships')
                .delete()
                .or(`and(requester_id.eq.${Auth.user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${Auth.user.id})`);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Remove friend failed:', e);
            return false;
        }
    },

    // 获取好友的进度
    async getFriendProgress(friendId) {
        const sb = getSupabase();
        if (!sb) return null;

        try {
            const { data: profile } = await sb
                .from('users')
                .select('*')
                .eq('id', friendId)
                .single();

            const { data: levels } = await sb
                .from('user_levels')
                .select('level_id')
                .eq('user_id', friendId);

            const { data: steps } = await sb
                .from('user_progress')
                .select('level_id, step_index, completed')
                .eq('user_id', friendId)
                .eq('completed', true);

            return {
                profile,
                completedLevels: (levels || []).map(l => l.level_id),
                completedSteps: (steps || []).map(s => `l${s.level_id}s${s.step_index}`)
            };
        } catch (e) {
            console.error('Get friend progress failed:', e);
            return null;
        }
    },

    // 获取待处理的好友请求数量
    async getPendingCount() {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return 0;

        try {
            const { count } = await sb
                .from('friendships')
                .select('*', { count: 'exact', head: true })
                .eq('addressee_id', Auth.user.id)
                .eq('status', 'pending');

            return count || 0;
        } catch (e) {
            return 0;
        }
    },

    // 显示好友列表模态框
    async showFriendModal() {
        const friends = await this.getFriends();
        const pendingCount = friends.filter(f => f.isIncoming).length;

        const accepted = friends.filter(f => f.status === 'accepted');
        const pending = friends.filter(f => f.status === 'pending');

        const html = `
        <div class="modal-overlay" id="friendModal" onclick="if(event.target===this)this.remove()">
            <div class="modal" style="max-width:500px">
                <h2>👥 好友列表</h2>

                <div style="display:flex;gap:8px;margin-bottom:16px">
                    <input type="text" id="addFriendCode" placeholder="输入好友邀请码" maxlength="8"
                        style="flex:1;text-transform:uppercase;letter-spacing:2px">
                    <button class="modal-btn pri" style="width:auto;padding:10px 20px" onclick="Friends.handleAddFriend()">添加</button>
                </div>

                ${pending.length > 0 ? `
                <div style="margin-bottom:16px">
                    <div style="font-size:.85em;color:var(--warning);margin-bottom:8px">📩 待确认的请求 (${pending.length})</div>
                    ${pending.map(f => `
                        <div class="friend-item">
                            <span class="avatar">${f.friend.avatar_emoji}</span>
                            <div class="info">
                                <div class="name">${f.friend.display_name}</div>
                                <div class="stats">XP: ${f.friend.xp || 0}</div>
                            </div>
                            <div class="actions">
                                <button class="qbtn" style="padding:4px 10px;font-size:.8em" onclick="Friends.handleAccept('${f.friend.id}')">✓ 接受</button>
                                <button class="qbtn" style="padding:4px 10px;font-size:.8em;color:var(--danger)" onclick="Friends.handleReject('${f.friend.id}')">✗ 拒绝</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div>
                    <div style="font-size:.85em;color:var(--dim);margin-bottom:8px">👫 好友 (${accepted.length})</div>
                    ${accepted.length > 0 ? `
                    <div class="friend-list">
                        ${accepted.map(f => `
                            <div class="friend-item">
                                <span class="avatar">${f.friend.avatar_emoji}</span>
                                <div class="info">
                                    <div class="name">${f.friend.display_name}</div>
                                    <div class="stats">⭐ ${f.friend.xp || 0} XP · 🏆 ${f.friend.level_count || 0} 关</div>
                                </div>
                                <div class="actions">
                                    <button class="qbtn" style="padding:4px 10px;font-size:.8em" onclick="Friends.showFriendProgress('${f.friend.id}')">查看</button>
                                    <button class="qbtn" style="padding:4px 10px;font-size:.8em" onclick="PK.showChallengeModal('${f.friend.id}', '${f.friend.display_name}')">⚔️ PK</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ` : '<p style="color:var(--dim);font-size:.9em;text-align:center;padding:20px">还没有好友，分享你的邀请码吧！</p>'}
                </div>

                <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1)">
                    <label style="font-size:.85em;color:var(--dim);margin-bottom:6px;display:block">我的邀请码</label>
                    <div class="invite-code" style="cursor:pointer" onclick="Friends.copyInviteCode()">${Auth.getInviteCode()} 📋</div>
                </div>

                <button class="modal-btn sec" style="margin-top:12px" onclick="document.getElementById('friendModal').remove()">关闭</button>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    // 处理添加好友
    async handleAddFriend() {
        const input = document.getElementById('addFriendCode');
        const code = input.value.trim();

        if (code.length !== 8) {
            showToastI('⚠️', '请输入8位邀请码');
            return;
        }

        const result = await this.sendRequest(code);
        if (result.error) {
            showToastI('❌', result.error);
        } else {
            showToastI('✅', `已向 ${result.name} 发送好友请求！`);
            input.value = '';
        }
    },

    // 处理接受请求
    async handleAccept(requesterId) {
        const success = await this.acceptRequest(requesterId);
        if (success) {
            showToastI('✅', '已添加好友！');
            document.getElementById('friendModal')?.remove();
            this.showFriendModal(); // 刷新列表
        } else {
            showToastI('❌', '操作失败');
        }
    },

    // 处理拒绝请求
    async handleReject(friendId) {
        const success = await this.removeFriend(friendId);
        if (success) {
            showToastI('👋', '已拒绝');
            document.getElementById('friendModal')?.remove();
            this.showFriendModal();
        }
    },

    // 复制邀请码
    copyInviteCode() {
        const code = Auth.getInviteCode();
        navigator.clipboard.writeText(code).then(() => {
            showToastI('📋', '邀请码已复制！');
        });
    },

    // 显示好友进度
    async showFriendProgress(friendId) {
        const data = await this.getFriendProgress(friendId);
        if (!data) {
            showToastI('❌', '无法获取好友进度');
            return;
        }

        const html = `
        <div class="modal-overlay" id="friendProgressModal" onclick="if(event.target===this)this.remove()">
            <div class="modal" style="max-width:500px">
                <h2>${data.profile.avatar_emoji} ${data.profile.display_name} 的进度</h2>

                <div style="display:flex;gap:16px;margin-bottom:20px">
                    <div style="text-align:center;flex:1">
                        <div style="font-size:1.5em;font-weight:700;color:var(--warning)">${data.profile.xp || 0}</div>
                        <div style="font-size:.8em;color:var(--dim)">经验值</div>
                    </div>
                    <div style="text-align:center;flex:1">
                        <div style="font-size:1.5em;font-weight:700;color:var(--success)">${data.profile.level_count || 0}</div>
                        <div style="font-size:.8em;color:var(--dim)">完成关卡</div>
                    </div>
                    <div style="text-align:center;flex:1">
                        <div style="font-size:1.5em;font-weight:700;color:var(--info)">${data.profile.streak_count || 0}</div>
                        <div style="font-size:.8em;color:var(--dim)">连续天数</div>
                    </div>
                </div>

                <div style="font-size:.85em;color:var(--dim);margin-bottom:10px">关卡进度</div>
                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px">
                    ${L.map(l => {
                        const done = data.completedLevels.includes(l.id);
                        return `<div style="text-align:center;padding:8px;border-radius:8px;background:${done ? 'rgba(0,184,148,.15)' : 'rgba(255,255,255,.05)'}">
                            <div style="font-size:1.5em">${l.icon}</div>
                            <div style="font-size:.7em;color:${done ? 'var(--success)' : 'var(--dim)'}">${done ? '✓' : `${data.completedSteps.filter(s => s.startsWith(`l${l.id}`)).length}/${l.steps.length}`}</div>
                        </div>`;
                    }).join('')}
                </div>

                <button class="modal-btn sec" onclick="document.getElementById('friendProgressModal').remove()">关闭</button>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }
};
