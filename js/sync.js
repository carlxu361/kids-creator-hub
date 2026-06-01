// ============================================
// 云端同步模块 - 小创客冒险之旅
// ============================================

const Sync = {
    _debounceTimer: null,
    _isSyncing: false,

    // 从云端加载数据并合并
    async syncFromCloud() {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return;

        try {
            // 获取用户的关卡完成记录
            const { data: levels } = await sb
                .from('user_levels')
                .select('*')
                .eq('user_id', Auth.user.id);

            // 获取用户的步骤完成记录
            const { data: steps } = await sb
                .from('user_progress')
                .select('*')
                .eq('user_id', Auth.user.id);

            // 合并到本地状态
            if (levels) {
                levels.forEach(l => {
                    S.done[l.level_id] = true;
                });
            }

            if (steps) {
                steps.forEach(s => {
                    if (s.completed) {
                        S.steps[`l${s.level_id}s${s.step_index}`] = true;
                    }
                });
            }

            // 重新计算 XP
            S.xp = 0;
            Object.keys(S.done).forEach(id => {
                const level = L.find(l => l.id === parseInt(id));
                if (level) S.xp += level.xp;
            });

            // 保存到本地
            saveS();
            updateStats();
            if (cur) selectLevel(cur);

        } catch (e) {
            console.warn('Sync from cloud failed:', e);
        }
    },

    // 将本地数据迁移到云端（首次登录时）
    async migrateToCloud() {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return;

        showToastI('☁️', '正在同步进度到云端...');

        try {
            // 1. 同步关卡完成记录
            const levelInserts = Object.keys(S.done).map(id => ({
                user_id: Auth.user.id,
                level_id: parseInt(id),
                xp_earned: L.find(l => l.id === parseInt(id))?.xp || 0,
                completed_at: new Date().toISOString()
            }));

            if (levelInserts.length > 0) {
                await sb.from('user_levels').upsert(levelInserts, {
                    onConflict: 'user_id,level_id'
                });
            }

            // 2. 同步步骤完成记录
            const stepInserts = [];
            Object.keys(S.steps).forEach(key => {
                if (S.steps[key]) {
                    const match = key.match(/l(\d+)s(\d+)/);
                    if (match) {
                        stepInserts.push({
                            user_id: Auth.user.id,
                            level_id: parseInt(match[1]),
                            step_index: parseInt(match[2]),
                            completed: true,
                            completed_at: new Date().toISOString()
                        });
                    }
                }
            });

            if (stepInserts.length > 0) {
                await sb.from('user_progress').upsert(stepInserts, {
                    onConflict: 'user_id,level_id,step_index'
                });
            }

            // 3. 更新用户 XP 和计数
            const levelCount = Object.keys(S.done).length;
            const stepCount = Object.values(S.steps).filter(v => v).length;

            await Auth.updateProfile({
                xp: S.xp,
                level_count: levelCount,
                step_count: stepCount
            });

            // 4. 标记迁移完成
            localStorage.setItem('kh-migrated', 'true');

            showToastI('✅', '进度同步完成！');

        } catch (e) {
            console.error('Migration failed:', e);
            showToastI('⚠️', '同步失败，本地数据已保留');
        }
    },

    // 保存当前状态到云端（防抖调用）
    debouncedSave() {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this.saveToCloud(), 500);
    },

    // 保存到云端
    async saveToCloud() {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn() || this._isSyncing) return;

        this._isSyncing = true;

        try {
            // 更新用户 XP 和计数
            const levelCount = Object.keys(S.done).length;
            const stepCount = Object.values(S.steps).filter(v => v).length;

            await Auth.updateProfile({
                xp: S.xp,
                level_count: levelCount,
                step_count: stepCount
            });

            // 更新活跃时间
            await Auth.updateActivity();

        } catch (e) {
            console.warn('Save to cloud failed:', e);
        } finally {
            this._isSyncing = false;
        }
    },

    // 保存单个步骤状态
    async saveStepStatus(levelId, stepIndex, completed) {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return;

        try {
            await sb.from('user_progress').upsert({
                user_id: Auth.user.id,
                level_id: levelId,
                step_index: stepIndex,
                completed: completed,
                completed_at: completed ? new Date().toISOString() : null
            }, {
                onConflict: 'user_id,level_id,step_index'
            });
        } catch (e) {
            console.warn('Save step status failed:', e);
        }
    },

    // 保存关卡完成状态
    async saveLevelStatus(levelId, completed) {
        const sb = getSupabase();
        if (!sb || !Auth.isLoggedIn()) return;

        const level = L.find(l => l.id === levelId);
        if (!level) return;

        try {
            if (completed) {
                await sb.from('user_levels').upsert({
                    user_id: Auth.user.id,
                    level_id: levelId,
                    xp_earned: level.xp,
                    completed_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,level_id'
                });

                // 记录活动
                await sb.from('activities').insert({
                    user_id: Auth.user.id,
                    activity_type: 'level_complete',
                    data: { level_id: levelId, level_title: level.title, xp: level.xp }
                });
            } else {
                await sb.from('user_levels')
                    .delete()
                    .eq('user_id', Auth.user.id)
                    .eq('level_id', levelId);
            }
        } catch (e) {
            console.warn('Save level status failed:', e);
        }
    }
};
