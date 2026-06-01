// ============================================
// 认证模块 - 小创客冒险之旅
// ============================================

const Auth = {
    user: null,
    session: null,
    profile: null,

    // 初始化认证
    async init() {
        const sb = getSupabase();
        if (!sb) return this.offlineMode();

        try {
            // 获取当前会话
            const { data: { session } } = await sb.auth.getSession();
            this.session = session;

            if (session) {
                await this.loadProfile(session.user.id);
                return true;
            }

            // 检查本地是否有旧数据需要迁移
            const localData = localStorage.getItem('kh-s');
            if (localData) {
                return 'needs_migration';
            }

            return 'needs_setup';
        } catch (e) {
            console.warn('Auth init failed:', e);
            return this.offlineMode();
        }
    },

    // 离线模式（无 Supabase）
    offlineMode() {
        this.user = null;
        this.profile = null;
        return 'offline';
    },

    // 匿名登录
    async signInAnonymously() {
        const sb = getSupabase();
        if (!sb) return null;

        try {
            const { data, error } = await sb.auth.signInAnonymously();
            if (error) throw error;
            this.session = data.session;
            this.user = data.user;
            return data.user;
        } catch (e) {
            console.error('Sign in failed:', e);
            return null;
        }
    },

    // 创建用户资料
    async createProfile(displayName, avatarEmoji) {
        const sb = getSupabase();
        if (!sb || !this.user) return null;

        // 生成邀请码
        const inviteCode = this.generateInviteCode();

        try {
            const { data, error } = await sb
                .from('users')
                .insert({
                    id: this.user.id,
                    display_name: displayName,
                    avatar_emoji: avatarEmoji,
                    invite_code: inviteCode,
                    xp: 0,
                    level_count: 0,
                    step_count: 0,
                    streak_count: 0,
                    last_active_date: new Date().toISOString().split('T')[0],
                    parental_consent: false
                })
                .select()
                .single();

            if (error) throw error;
            this.profile = data;
            return data;
        } catch (e) {
            console.error('Create profile failed:', e);
            return null;
        }
    },

    // 加载用户资料
    async loadProfile(userId) {
        const sb = getSupabase();
        if (!sb) return null;

        try {
            const { data, error } = await sb
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            this.profile = data;
            return data;
        } catch (e) {
            console.error('Load profile failed:', e);
            return null;
        }
    },

    // 更新用户资料
    async updateProfile(updates) {
        const sb = getSupabase();
        if (!sb || !this.user) return null;

        try {
            const { data, error } = await sb
                .from('users')
                .update(updates)
                .eq('id', this.user.id)
                .select()
                .single();

            if (error) throw error;
            this.profile = { ...this.profile, ...data };
            return data;
        } catch (e) {
            console.error('Update profile failed:', e);
            return null;
        }
    },

    // 更新最后活跃时间（含打卡逻辑）
    async updateActivity() {
        if (!this.profile) return;

        const today = new Date().toISOString().split('T')[0];
        const lastDate = this.profile.last_active_date;

        let streak = this.profile.streak_count || 0;

        if (lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (lastDate === yesterday) {
                streak += 1; // 连续打卡
            } else {
                streak = 1; // 断了，重新开始
            }
        }

        await this.updateProfile({
            last_active: new Date().toISOString(),
            last_active_date: today,
            streak_count: streak
        });
    },

    // 生成8位邀请码
    generateInviteCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // 检查是否已登录
    isLoggedIn() {
        return !!this.session;
    },

    // 获取用户头像
    getAvatar() {
        return this.profile?.avatar_emoji || '🐱';
    },

    // 获取用户昵称
    getDisplayName() {
        return this.profile?.display_name || '小创客';
    },

    // 获取邀请码
    getInviteCode() {
        return this.profile?.invite_code || '';
    },

    // 显示登录/注册模态框
    showAuthModal(isMigration = false) {
        const avatars = ['🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯', '🐸', '🐵', '🦄', '🐲'];
        let selectedAvatar = avatars[0];

        const html = `
        <div class="modal-overlay" id="authModal">
            <div class="modal">
                <h2>${isMigration ? '🔄 保存你的进度' : '🎮 欢迎来到小创客冒险之旅！'}</h2>
                <p style="color:var(--dim);margin-bottom:16px;font-size:.9em">
                    ${isMigration
                        ? '登录后，你的学习进度将保存到云端，在任何设备上都能继续！'
                        : '选择一个你喜欢的昵称和头像，开始冒险吧！'
                    }
                </p>

                <label style="font-size:.85em;color:var(--dim);margin-bottom:6px;display:block">选择头像</label>
                <div class="avatar-grid" id="avatarGrid">
                    ${avatars.map((a, i) => `
                        <div class="avatar-opt ${i === 0 ? 'selected' : ''}" onclick="Auth.selectAvatar(this, '${a}')">${a}</div>
                    `).join('')}
                </div>

                <label style="font-size:.85em;color:var(--dim);margin-bottom:6px;display:block">取个昵称（2-20个字）</label>
                <input type="text" id="authName" placeholder="小创客" maxlength="20" minlength="2"
                    style="margin-bottom:16px">

                <button class="modal-btn pri" onclick="Auth.handleRegister(${isMigration})">
                    ${isMigration ? '🚀 登录并保存进度' : '🚀 开始冒险'}
                </button>
                ${isMigration ? `
                <button class="modal-btn sec" onclick="Auth.skipAuth()">
                    跳过，以后再说
                </button>
                ` : ''}
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    // 选择头像
    selectAvatar(el, emoji) {
        document.querySelectorAll('.avatar-opt').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        this._selectedAvatar = emoji;
    },

    // 处理注册
    async handleRegister(isMigration) {
        const nameInput = document.getElementById('authName');
        const name = nameInput.value.trim();

        if (name.length < 2) {
            nameInput.style.borderColor = 'var(--danger)';
            showToastI('⚠️', '昵称至少需要2个字');
            return;
        }

        const avatar = this._selectedAvatar || '🐱';

        // 显示加载状态
        const btn = document.querySelector('.modal-btn.pri');
        btn.textContent = '⏳ 创建中...';
        btn.disabled = true;

        try {
            // 1. 匿名登录
            const user = await this.signInAnonymously();
            if (!user) {
                showToastI('❌', '登录失败，请重试');
                btn.textContent = '🚀 开始冒险';
                btn.disabled = false;
                return;
            }

            // 2. 创建资料
            const profile = await this.createProfile(name, avatar);
            if (!profile) {
                showToastI('❌', '创建资料失败');
                btn.textContent = '🚀 开始冒险';
                btn.disabled = false;
                return;
            }

            // 3. 如果是迁移，同步本地数据到云端
            if (isMigration) {
                await Sync.migrateToCloud();
            }

            // 4. 关闭模态框
            this.closeAuthModal();

            // 5. 更新 UI
            this.updateUI();
            showToastI('🎉', `欢迎，${name}！`);

            // 6. 播放欢迎音
            if (typeof sndWelcome === 'function') sndWelcome();

        } catch (e) {
            console.error('Registration failed:', e);
            showToastI('❌', '注册失败，请重试');
            btn.textContent = '🚀 开始冒险';
            btn.disabled = false;
        }
    },

    // 跳过认证
    skipAuth() {
        localStorage.setItem('kh-skip-auth', 'true');
        this.closeAuthModal();
    },

    // 关闭模态框
    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.remove();
    },

    // 更新顶部栏 UI
    updateUI() {
        const statsEl = document.querySelector('.stats');
        if (!statsEl) return;

        // 检查是否已有用户信息
        let userEl = document.getElementById('userInfo');
        if (!userEl) {
            userEl = document.createElement('div');
            userEl.id = 'userInfo';
            userEl.className = 'user-info';
            userEl.onclick = () => this.showProfileMenu();
            statsEl.prepend(userEl);
        }

        if (this.profile) {
            userEl.innerHTML = `
                <span class="avatar">${this.profile.avatar_emoji}</span>
                <span class="name">${this.profile.display_name}</span>
                ${this.profile.streak_count > 0 ? `<span class="streak-badge">🔥${this.profile.streak_count}</span>` : ''}
            `;
            userEl.style.display = 'flex';
        } else {
            userEl.style.display = 'none';
        }
    },

    // 显示个人菜单
    showProfileMenu() {
        // 简单实现：显示一个包含邀请码的弹窗
        const html = `
        <div class="modal-overlay" id="profileModal" onclick="if(event.target===this)this.remove()">
            <div class="modal">
                <h2>${this.getAvatar()} ${this.getDisplayName()}</h2>

                <div style="margin-bottom:16px">
                    <label style="font-size:.85em;color:var(--dim);margin-bottom:6px;display:block">我的邀请码</label>
                    <div class="invite-code">${this.getInviteCode()}</div>
                    <p style="font-size:.8em;color:var(--dim);margin-top:6px">分享给朋友，让他们添加你为好友！</p>
                </div>

                <div style="display:flex;gap:16px;margin-bottom:16px">
                    <div style="text-align:center;flex:1">
                        <div style="font-size:1.5em;font-weight:700;color:var(--warning)">${this.profile?.xp || 0}</div>
                        <div style="font-size:.8em;color:var(--dim)">经验值</div>
                    </div>
                    <div style="text-align:center;flex:1">
                        <div style="font-size:1.5em;font-weight:700;color:var(--success)">${this.profile?.level_count || 0}</div>
                        <div style="font-size:.8em;color:var(--dim)">完成关卡</div>
                    </div>
                    <div style="text-align:center;flex:1">
                        <div style="font-size:1.5em;font-weight:700;color:var(--info)">${this.profile?.streak_count || 0}</div>
                        <div style="font-size:.8em;color:var(--dim)">连续天数</div>
                    </div>
                </div>

                <button class="modal-btn sec" onclick="document.getElementById('profileModal').remove()">关闭</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
};
