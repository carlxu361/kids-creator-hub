// ============================================
// PK 对战模块 - 小创客冒险之旅
// ============================================

const PK = {
    activeChallenge: null,
    subscription: null,

    // 发起 PK 挑战
    async createChallenge(opponentId, levelId) {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return { error: '未登录' };

        try {
            const { data, error } = await sb
                .from('pk_challenges')
                .insert({
                    challenger_id: Auth.user.id,
                    opponent_id: opponentId,
                    level_id: levelId,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // 记录活动
            await sb.from('activities').insert({
                user_id: Auth.user.id,
                activity_type: 'pk_challenge',
                data: { challenge_id: data.id, level_id: levelId, opponent_id: opponentId }
            });

            return { success: true, challenge: data };
        } catch (e) {
            console.error('Create challenge failed:', e);
            return { error: '发起挑战失败' };
        }
    },

    // 接受挑战
    async acceptChallenge(challengeId) {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return false;

        try {
            const { error } = await sb
                .from('pk_challenges')
                .update({
                    status: 'active',
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', challengeId)
                .eq('opponent_id', Auth.user.id);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Accept challenge failed:', e);
            return false;
        }
    },

    // 记录步骤完成
    async recordStep(challengeId, stepIndex) {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return;

        try {
            await sb.from('pk_progress').upsert({
                challenge_id: challengeId,
                user_id: Auth.user.id,
                step_index: stepIndex,
                completed: true,
                completed_at: new Date().toISOString()
            }, {
                onConflict: 'challenge_id,user_id,step_index'
            });

            // 更新分数
            await this.updateScores(challengeId);
        } catch (e) {
            console.warn('Record PK step failed:', e);
        }
    },

    // 更新比分
    async updateScores(challengeId) {
        const sb = getSupabase();
        if (!sb) return;

        try {
            const { data: challenge } = await sb
                .from('pk_challenges')
                .select('*')
                .eq('id', challengeId)
                .single();

            if (!challenge || challenge.status !== 'active') return;

            const { data: progress } = await sb
                .from('pk_progress')
                .select('*')
                .eq('challenge_id', challengeId)
                .eq('completed', true);

            const level = L.find(l => l.id === challenge.level_id);
            if (!level) return;

            const totalSteps = level.steps.length;
            let challengerScore = 0;
            let opponentScore = 0;
            let challengerDone = 0;
            let opponentDone = 0;

            (progress || []).forEach(p => {
                if (p.user_id === challenge.challenger_id) {
                    challengerScore++;
                    challengerDone++;
                } else {
                    opponentScore++;
                    opponentDone++;
                }
            });

            // 更新分数
            await sb
                .from('pk_challenges')
                .update({
                    challenger_score: challengerScore,
                    opponent_score: opponentScore
                })
                .eq('id', challengeId);

            // 检查是否完成
            if (challengerDone >= totalSteps || opponentDone >= totalSteps) {
                let winnerId = null;
                if (challengerDone >= totalSteps && opponentDone >= totalSteps) {
                    // 都完成了，比较谁先完成最后一步
                    const challengerLast = progress
                        .filter(p => p.user_id === challenge.challenger_id)
                        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
                    const opponentLast = progress
                        .filter(p => p.user_id === challenge.opponent_id)
                        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
                    winnerId = new Date(challengerLast.completed_at) < new Date(opponentLast.completed_at)
                        ? challenge.challenger_id : challenge.opponent_id;
                } else {
                    winnerId = challengerDone >= totalSteps ? challenge.challenger_id : challenge.opponent_id;
                }

                await sb
                    .from('pk_challenges')
                    .update({
                        status: 'completed',
                        winner_id: winnerId,
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', challengeId);
            }
        } catch (e) {
            console.warn('Update PK scores failed:', e);
        }
    },

    // 获取活跃挑战
    async getActiveChallenges() {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return [];

        try {
            const { data } = await sb
                .from('pk_challenges')
                .select(`
                    *,
                    challenger:users!pk_challenges_challenger_id_fkey(id, display_name, avatar_emoji),
                    opponent:users!pk_challenges_opponent_id_fkey(id, display_name, avatar_emoji)
                `)
                .or(`challenger_id.eq.${Auth.user.id},opponent_id.eq.${Auth.user.id}`)
                .in('status', ['pending', 'active'])
                .order('created_at', { ascending: false });

            return data || [];
        } catch (e) {
            console.error('Get active challenges failed:', e);
            return [];
        }
    },

    // 订阅挑战实时更新
    subscribeToChallenge(challengeId, onUpdate) {
        const sb = getSupabase();
        if (!sb) return;

        this.subscription = sb
            .channel(`pk-${challengeId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'pk_progress',
                filter: `challenge_id=eq.${challengeId}`
            }, onUpdate)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'pk_challenges',
                filter: `id=eq.${challengeId}`
            }, onUpdate)
            .subscribe();
    },

    // 取消订阅
    unsubscribe() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    },

    // 显示发起 PK 模态框
    showChallengeModal(friendId, friendName) {
        const html = `
        <div class="modal-overlay" id="pkModal" onclick="if(event.target===this)this.remove()">
            <div class="modal">
                <h2>⚔️ 向 ${friendName} 发起挑战</h2>
                <p style="color:var(--dim);margin-bottom:16px;font-size:.9em">选择一个关卡进行 PK 对战！</p>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
                    ${L.map(l => `
                        <div class="qbtn" style="justify-content:flex-start;padding:12px" onclick="PK.handleChallenge('${friendId}', ${l.id})">
                            <span style="font-size:1.3em">${l.icon}</span>
                            <div>
                                <div style="font-weight:600;font-size:.9em">${l.title}</div>
                                <div style="font-size:.75em;color:var(--dim)">${l.steps.length} 步骤 · ${l.xp} XP</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button class="modal-btn sec" onclick="document.getElementById('pkModal').remove()">取消</button>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    // 处理发起挑战
    async handleChallenge(friendId, levelId) {
        document.getElementById('pkModal')?.remove();

        const result = await this.createChallenge(friendId, levelId);
        if (result.error) {
            showToastI('❌', result.error);
        } else {
            const level = L.find(l => l.id === levelId);
            showToastI('⚔️', `已向对手发起 ${level.title} 挑战！`);
        }
    },

    // 显示 PK 状态横幅
    async showPKBanner(challenge) {
        const level = L.find(l => l.id === challenge.level_id);
        if (!level) return '';

        const isChallenger = challenge.challenger_id === Auth.user.id;
        const opponent = isChallenger ? challenge.opponent : challenge.challenger;
        const myScore = isChallenger ? challenge.challenger_score : challenge.opponent_score;
        const opScore = isChallenger ? challenge.opponent_score : challenge.challenger_score;

        return `
        <div class="pk-banner">
            <div class="pk-vs">VS</div>
            <div style="flex:1">
                <div style="font-weight:600;margin-bottom:4px">${level.icon} ${level.title}</div>
                <div style="font-size:.85em;color:var(--dim)">
                    对手: ${opponent.avatar_emoji} ${opponent.display_name}
                    · 分数: ${myScore} vs ${opScore}
                </div>
                <div class="pk-progress" style="margin-top:6px">
                    ${level.steps.map((_, i) => `<div class="pk-dot ${i < myScore ? 'done' : ''}">${i < myScore ? '✓' : ''}</div>`).join('')}
                </div>
            </div>
            ${challenge.status === 'pending' && !isChallenger ? `
                <button class="qbtn pri" style="padding:6px 14px" onclick="PK.handleAccept('${challenge.id}')">接受挑战</button>
            ` : ''}
            ${challenge.status === 'active' ? `
                <div style="font-size:.8em;color:var(--warning)">进行中</div>
            ` : ''}
        </div>`;
    },

    // 处理接受挑战
    async handleAccept(challengeId) {
        const success = await this.acceptChallenge(challengeId);
        if (success) {
            showToastI('⚔️', '挑战已接受！开始吧！');
            if (cur) selectLevel(cur); // 刷新当前页面
        } else {
            showToastI('❌', '接受失败');
        }
    }
};
