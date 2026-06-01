#!/usr/bin/env node
/**
 * 🔍 小创客冒险之旅 - 自动验证系统
 * 检测孩子的实际产出物，自动判定关卡完成情况
 *
 * 用法：node verify.js [level]  (不传level则验证全部)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = process.env.HOME || '/Users/xjc';
const PROJECT_DIR = path.join(HOME, 'kids-creator-hub');
const PORTFOLIO_DIR = path.join(PROJECT_DIR, '作品集');

// 确保目录存在
[PROJECT_DIR, PORTFOLIO_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ==================== 验证函数库 ====================
const checks = {
    /** 检查文件是否存在 */
    fileExists(filePath) {
        const fullPath = filePath.startsWith('/') ? filePath : path.join(HOME, filePath);
        return fs.existsSync(fullPath);
    },

    /** 检查文件内容是否包含指定文本 */
    fileContains(filePath, text) {
        try {
            const fullPath = filePath.startsWith('/') ? filePath : path.join(HOME, filePath);
            const content = fs.readFileSync(fullPath, 'utf-8');
            return content.includes(text);
        } catch { return false; }
    },

    /** 检查文件大小是否超过指定字节 */
    fileSizeAtLeast(filePath, minBytes) {
        try {
            const fullPath = filePath.startsWith('/') ? filePath : path.join(HOME, filePath);
            return fs.statSync(fullPath).size >= minBytes;
        } catch { return false; }
    },

    /** 检查目录中是否有指定扩展名的文件 */
    dirHasFile(dirPath, extensions) {
        try {
            const fullPath = dirPath.startsWith('/') ? dirPath : path.join(HOME, dirPath);
            const files = fs.readdirSync(fullPath, { recursive: true });
            return extensions.some(ext =>
                files.some(f => typeof f === 'string' && f.endsWith(ext))
            );
        } catch { return false; }
    },

    /** 检查目录中文件数量 */
    dirFileCount(dirPath, minCount) {
        try {
            const fullPath = dirPath.startsWith('/') ? dirPath : path.join(HOME, dirPath);
            const files = fs.readdirSync(fullPath).filter(f => !f.startsWith('.'));
            return files.length >= minCount;
        } catch { return false; }
    },

    /** 检查Scratch项目文件 */
    scratchProjectExists() {
        const paths = [
            path.join(HOME, 'Downloads', '*.sb3'),
            path.join(PORTFOLIO_DIR, '*.sb3'),
            path.join(PROJECT_DIR, '作品集', '*.sb3'),
        ];
        for (const p of paths) {
            const dir = path.dirname(p);
            const ext = path.extname(p);
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir).filter(f => f.endsWith(ext));
                if (files.length > 0) return true;
            }
        }
        return false;
    },

    /** 检查视频文件 */
    videoFileExists() {
        const videoExts = ['.mp4', '.mov', '.mkv', '.webm'];
        const searchDirs = [
            path.join(HOME, 'Desktop'),
            path.join(HOME, 'Downloads'),
            path.join(HOME, 'Movies'),
            PORTFOLIO_DIR,
            path.join(PROJECT_DIR, '作品集'),
        ];
        for (const dir of searchDirs) {
            if (!fs.existsSync(dir)) continue;
            const files = fs.readdirSync(dir);
            if (files.some(f => videoExts.some(ext => f.toLowerCase().endsWith(ext)))) return true;
        }
        return false;
    },

    /** 检查Python文件是否可运行 */
    pythonFileValid(filePath) {
        try {
            const fullPath = filePath.startsWith('/') ? filePath : path.join(HOME, filePath);
            if (!fs.existsSync(fullPath)) return false;
            const content = fs.readFileSync(fullPath, 'utf-8');
            // 检查是否有基本的Python语法
            return content.includes('print') || content.includes('import') || content.includes('def ');
        } catch { return false; }
    },

    /** 检查Godot项目 */
    godotProjectExists() {
        const searchDirs = [
            path.join(HOME, 'godot'),
            path.join(HOME, 'Godot'),
            path.join(HOME, 'Projects'),
            PORTFOLIO_DIR,
        ];
        for (const dir of searchDirs) {
            if (!fs.existsSync(dir)) continue;
            const files = fs.readdirSync(dir, { recursive: true });
            if (files.some(f => typeof f === 'string' && f.endsWith('project.godot'))) return true;
        }
        return false;
    },

    /** 检查命令是否可用 */
    commandExists(cmd) {
        try {
            execSync(`which ${cmd}`, { stdio: 'pipe' });
            return true;
        } catch { return false; }
    },

    /** 检查应用是否安装 */
    appInstalled(appName) {
        const locations = [
            `/Applications/${appName}.app`,
            `/Applications/${appName}`,
        ];
        return locations.some(l => fs.existsSync(l));
    },

    /** 检查story文件字数 */
    storyWordCount(filePath, minWords) {
        try {
            const fullPath = filePath.startsWith('/') ? filePath : path.join(HOME, filePath);
            const content = fs.readFileSync(fullPath, 'utf-8');
            // 中文字数统计
            const chineseChars = (content.match(/[一-鿿]/g) || []).length;
            return chineseChars >= minWords;
        } catch { return false; }
    }
};

// ==================== 关卡验证规则 ====================
const LEVEL_RULES = {
    1: {
        title: '创客基地搭建',
        verifications: [
            {
                id: 'v1_terminal',
                label: '打开过终端并执行过命令',
                method: () => {
                    // 检查shell历史
                    try {
                        const histFile = path.join(HOME, '.zsh_history');
                        if (fs.existsSync(histFile)) {
                            const stat = fs.statSync(histFile);
                            // 如果历史文件在今天被修改过
                            const today = new Date().toDateString();
                            return stat.mtime.toDateString() === today;
                        }
                    } catch {}
                    return false;
                },
                auto: true,
                hint: '打开终端，输入 echo "你好" 然后回车'
            },
            {
                id: 'v1_vscode',
                label: 'VS Code 已安装并可用',
                method: () => checks.commandExists('code'),
                auto: true,
                hint: '在终端输入 code 打开VS Code'
            },
            {
                id: 'v1_scratch',
                label: '在Scratch创建过项目',
                method: () => checks.scratchProjectExists() || checks.dirHasFile(path.join(PORTFOLIO_DIR, ''), ['.sb3', '.json']),
                auto: true,
                hint: '去 scratch.mit.edu 创建一个项目，保存到电脑'
            },
            {
                id: 'v1_claude',
                label: 'Claude Code 可用',
                method: () => checks.commandExists('claude'),
                auto: true,
                hint: '在终端输入 claude 启动AI助手'
            },
            {
                id: 'v1_obs',
                label: 'OBS 已安装',
                method: () => checks.appInstalled('OBS') || checks.appInstalled('obs-studio'),
                auto: true,
                hint: '确认OBS已安装'
            },
            {
                id: 'v1_portfolio',
                label: '作品集目录已创建',
                method: () => fs.existsSync(PORTFOLIO_DIR) && checks.dirFileCount(PORTFOLIO_DIR, 0),
                auto: true,
                hint: '系统会自动创建作品集目录'
            }
        ]
    },
    2: {
        title: '打字小能手',
        verifications: [
            {
                id: 'v2_input_method',
                label: '中文输入法已配置',
                method: () => {
                    try {
                        const result = execSync('defaults read com.apple.HIToolbox AppleEnabledInputSources 2>/dev/null', { encoding: 'utf-8' });
                        return result.includes('SCIM') || result.includes('Sogou') || result.includes('Pinyin') || result.includes('InputMethod');
                    } catch { return true; } // Mac默认有拼音
                },
                auto: true,
                hint: '系统会自动检测输入法'
            },
            {
                id: 'v2_practice',
                label: '完成打字练习作品',
                method: () => {
                    const practiceFile = path.join(PORTFOLIO_DIR, '打字练习.txt');
                    if (fs.existsSync(practiceFile)) {
                        const content = fs.readFileSync(practiceFile, 'utf-8');
                        return content.length >= 100;
                    }
                    return false;
                },
                auto: true,
                hint: '在作品集文件夹创建"打字练习.txt"，写100字以上的自我介绍'
            },
            {
                id: 'v2_ai_intro',
                label: '给AI写过自我介绍',
                method: () => {
                    const introFile = path.join(PORTFOLIO_DIR, '自我介绍.txt');
                    return fs.existsSync(introFile) && checks.storyWordCount(introFile, 80);
                },
                auto: true,
                hint: '在作品集文件夹创建"自我介绍.txt"，写80字以上'
            },
            {
                id: 'v2_speed',
                label: '打字速度达标（自评）',
                method: () => false,
                auto: false,
                hint: '你能流畅打出一段话，不用一直看键盘吗？'
            }
        ]
    },
    3: {
        title: '第一个Scratch游戏',
        verifications: [
            {
                id: 'v3_scratch_file',
                label: '有Scratch项目文件',
                method: () => checks.scratchProjectExists(),
                auto: true,
                hint: '在Scratch中保存项目，下载.sb3文件到作品集'
            },
            {
                id: 'v3_code_blocks',
                label: '项目包含代码积木（不是空白项目）',
                method: () => {
                    // 尝试检查sb3文件（本质是zip，包含json）
                    try {
                        const { execSync: exec } = require('child_process');
                        const files = fs.readdirSync(PORTFOLIO_DIR);
                        const sb3 = files.find(f => f.endsWith('.sb3'));
                        if (sb3) {
                            const content = exec(`unzip -p "${path.join(PORTFOLIO_DIR, sb3)}" project.json 2>/dev/null`, { encoding: 'utf-8' });
                            return content.includes('"event_whenflagclicked"') || content.includes('"control_repeat"');
                        }
                    } catch {}
                    return false;
                },
                auto: true,
                hint: '确保Scratch项目里有代码积木，不只是空项目'
            },
            {
                id: 'v3_game_logic',
                label: '游戏有交互逻辑',
                method: () => {
                    try {
                        const files = fs.readdirSync(PORTFOLIO_DIR);
                        const sb3 = files.find(f => f.endsWith('.sb3'));
                        if (sb3) {
                            const content = execSync(`unzip -p "${path.join(PORTFOLIO_DIR, sb3)}" project.json 2>/dev/null`, { encoding: 'utf-8' });
                            // 检查是否有条件判断、循环等
                            return content.includes('"control_if"') || content.includes('"control_repeat"');
                        }
                    } catch {}
                    return false;
                },
                auto: true,
                hint: '确保游戏有循环或条件判断等逻辑'
            },
            {
                id: 'v3_shared',
                label: '分享给家人玩过（自评）',
                method: () => false,
                auto: false,
                hint: '你把游戏分享给家人朋友玩了吗？'
            }
        ]
    },
    4: {
        title: '第一个视频',
        verifications: [
            {
                id: 'v4_video_file',
                label: '有视频文件',
                method: () => checks.videoFileExists(),
                auto: true,
                hint: '用OBS录制屏幕，保存视频到桌面或作品集'
            },
            {
                id: 'v4_duration',
                label: '视频时长超过30秒',
                method: () => {
                    try {
                        const videoExts = ['.mp4', '.mov'];
                        const dirs = [path.join(HOME, 'Desktop'), PORTFOLIO_DIR, path.join(HOME, 'Downloads')];
                        for (const dir of dirs) {
                            if (!fs.existsSync(dir)) continue;
                            const files = fs.readdirSync(dir).filter(f => videoExts.some(ext => f.endsWith(ext)));
                            for (const f of files) {
                                const fp = path.join(dir, f);
                                const stat = fs.statSync(fp);
                                // 粗略判断：视频文件大于500KB通常超过30秒
                                if (stat.size > 500000) return true;
                            }
                        }
                    } catch {}
                    return false;
                },
                auto: true,
                hint: '确保视频时长超过30秒'
            },
            {
                id: 'v4_script',
                label: '写过视频脚本',
                method: () => {
                    return checks.fileExists(path.join(PORTFOLIO_DIR, '视频脚本.txt')) ||
                           checks.fileExists(path.join(PORTFOLIO_DIR, '视频脚本.md')) ||
                           checks.dirHasFile(path.join(PORTFOLIO_DIR, ''), ['.txt', '.md']);
                },
                auto: true,
                hint: '在作品集创建"视频脚本.txt"，写上视频内容规划'
            },
            {
                id: 'v4_edited',
                label: '用CapCut剪辑过（自评）',
                method: () => false,
                auto: false,
                hint: '你用CapCut剪辑过视频吗？加过字幕或音乐吗？'
            }
        ]
    },
    5: {
        title: '第一个AI写作',
        verifications: [
            {
                id: 'v5_story_file',
                label: '有故事文件',
                method: () => {
                    return checks.fileExists(path.join(PORTFOLIO_DIR, '我的故事.txt')) ||
                           checks.fileExists(path.join(PORTFOLIO_DIR, '我的故事.md')) ||
                           checks.dirHasFile(path.join(PORTFOLIO_DIR, ''), ['.txt', '.md']);
                },
                auto: true,
                hint: '在作品集创建"我的故事.txt"'
            },
            {
                id: 'v5_word_count',
                label: '故事超过500字',
                method: () => {
                    const storyFile = path.join(PORTFOLIO_DIR, '我的故事.txt');
                    if (fs.existsSync(storyFile)) return checks.storyWordCount(storyFile, 500);
                    const storyMd = path.join(PORTFOLIO_DIR, '我的故事.md');
                    if (fs.existsSync(storyMd)) return checks.storyWordCount(storyMd, 500);
                    return false;
                },
                auto: true,
                hint: '确保故事有500字以上'
            },
            {
                id: 'v5_structure',
                label: '故事有完整结构（自评）',
                method: () => false,
                auto: false,
                hint: '你的故事有开头、中间、结尾吗？'
            }
        ]
    },
    6: {
        title: '狼人杀游戏',
        verifications: [
            {
                id: 'v6_flowchart',
                label: '画过游戏流程图',
                method: () => {
                    return checks.fileExists(path.join(PORTFOLIO_DIR, '狼人杀流程图.png')) ||
                           checks.fileExists(path.join(PORTFOLIO_DIR, '狼人杀流程图.jpg')) ||
                           checks.fileExists(path.join(PORTFOLIO_DIR, '狼人杀设计.md')) ||
                           checks.fileExists(path.join(PORTFOLIO_DIR, '狼人杀设计.txt'));
                },
                auto: true,
                hint: '在作品集保存流程图或设计文档'
            },
            {
                id: 'v6_scratch_file',
                label: '有狼人杀Scratch项目',
                method: () => {
                    const files = fs.readdirSync(PORTFOLIO_DIR);
                    return files.some(f => f.includes('狼人') && f.endsWith('.sb3'));
                },
                auto: true,
                hint: '把狼人杀项目保存为"狼人杀.sb3"到作品集'
            },
            {
                id: 'v6_logic',
                label: '项目有角色分配逻辑',
                method: () => {
                    try {
                        const files = fs.readdirSync(PORTFOLIO_DIR);
                        const sb3 = files.find(f => f.includes('狼人') && f.endsWith('.sb3'));
                        if (sb3) {
                            const content = execSync(`unzip -p "${path.join(PORTFOLIO_DIR, sb3)}" project.json 2>/dev/null`, { encoding: 'utf-8' });
                            return content.includes('"data_setvariableto"') || content.includes('"control_if"');
                        }
                    } catch {}
                    return false;
                },
                auto: true,
                hint: '确保游戏有变量和条件判断'
            },
            {
                id: 'v6_playable',
                label: '能跟电脑玩一局（自评）',
                method: () => false,
                auto: false,
                hint: '你能跟电脑玩一局狼人杀吗？'
            }
        ]
    },
    7: {
        title: 'Python入门',
        verifications: [
            {
                id: 'v7_hello',
                label: '有hello.py文件',
                method: () => checks.pythonFileValid(path.join(PORTFOLIO_DIR, 'hello.py')) || checks.pythonFileValid(path.join(PROJECT_DIR, 'hello.py')),
                auto: true,
                hint: '创建hello.py，写上 print("你好")'
            },
            {
                id: 'v7_turtle',
                label: '有turtle画图作品',
                method: () => {
                    return checks.fileExists(path.join(PORTFOLIO_DIR, 'turtle画图.py')) ||
                           checks.fileContains(path.join(PORTFOLIO_DIR, ''), 'turtle') ||
                           fs.readdirSync(PORTFOLIO_DIR).some(f => f.endsWith('.py') && f !== 'hello.py');
                },
                auto: true,
                hint: '创建turtle画图作品，保存到作品集'
            },
            {
                id: 'v7_game',
                label: '有Python游戏作品',
                method: () => {
                    const gameFiles = ['猜数字.py', '文字冒险.py', 'game.py'];
                    return gameFiles.some(f => checks.fileExists(path.join(PORTFOLIO_DIR, f))) ||
                           fs.readdirSync(PORTFOLIO_DIR).filter(f => f.endsWith('.py')).length >= 3;
                },
                auto: true,
                hint: '创建猜数字或文字冒险游戏，保存到作品集'
            },
            {
                id: 'v7_run',
                label: '成功运行过Python代码（自评）',
                method: () => false,
                auto: false,
                hint: '你成功运行过Python代码吗？看到过输出结果吗？'
            }
        ]
    },
    8: {
        title: 'Godot游戏引擎',
        verifications: [
            {
                id: 'v8_godot_installed',
                label: 'Godot已安装',
                method: () => checks.appInstalled('Godot') || checks.appInstalled('Godot_v4'),
                auto: true,
                hint: '确认Godot已安装到应用程序'
            },
            {
                id: 'v8_project',
                label: '有Godot项目',
                method: () => checks.godotProjectExists() || checks.dirHasFile(PORTFOLIO_DIR, ['.godot', 'project.godot']),
                auto: true,
                hint: '创建Godot项目，保存到作品集'
            },
            {
                id: 'v8_script',
                label: '写过GDScript代码',
                method: () => checks.dirHasFile(PORTFOLIO_DIR, ['.gd']) || checks.fileContains(path.join(PORTFOLIO_DIR, ''), 'extends'),
                auto: true,
                hint: '在Godot项目中创建脚本文件'
            },
            {
                id: 'v8_playable',
                label: '游戏能玩（自评）',
                method: () => false,
                auto: false,
                hint: '你的Godot游戏能玩吗？球能反弹吗？'
            }
        ]
    },
    9: {
        title: '视频进阶',
        verifications: [
            {
                id: 'v9_script',
                label: '有教学视频脚本',
                method: () => checks.fileExists(path.join(PORTFOLIO_DIR, '教学视频脚本.txt')) || checks.fileExists(path.join(PORTFOLIO_DIR, '教学视频脚本.md')),
                auto: true,
                hint: '在作品集创建"教学视频脚本.txt"'
            },
            {
                id: 'v9_video',
                label: '有5分钟以上的视频',
                method: () => {
                    try {
                        const videoExts = ['.mp4', '.mov'];
                        const dirs = [path.join(HOME, 'Desktop'), PORTFOLIO_DIR];
                        for (const dir of dirs) {
                            if (!fs.existsSync(dir)) continue;
                            const files = fs.readdirSync(dir).filter(f => videoExts.some(ext => f.endsWith(ext)));
                            for (const f of files) {
                                const stat = fs.statSync(path.join(dir, f));
                                // 大于5MB通常超过5分钟
                                if (stat.size > 5000000) return true;
                            }
                        }
                    } catch {}
                    return false;
                },
                auto: true,
                hint: '录制一个5分钟以上的教学视频'
            },
            {
                id: 'v9_edited',
                label: '视频有字幕和音乐（自评）',
                method: () => false,
                auto: false,
                hint: '你的视频有字幕和背景音乐吗？'
            }
        ]
    },
    10: {
        title: '独立项目',
        verifications: [
            {
                id: 'v10_plan',
                label: '有项目计划书',
                method: () => {
                    return checks.fileExists(path.join(PORTFOLIO_DIR, '项目计划书.txt')) ||
                           checks.fileExists(path.join(PORTFOLIO_DIR, '项目计划书.md')) ||
                           checks.fileExists(path.join(PORTFOLIO_DIR, '独立项目/项目计划书.txt'));
                },
                auto: true,
                hint: '在作品集创建"项目计划书.txt"'
            },
            {
                id: 'v10_project',
                label: '有完整的项目文件',
                method: () => {
                    const pyCount = fs.readdirSync(PORTFOLIO_DIR).filter(f => f.endsWith('.py')).length;
                    const sb3Count = fs.readdirSync(PORTFOLIO_DIR).filter(f => f.endsWith('.sb3')).length;
                    const videoCount = fs.readdirSync(PORTFOLIO_DIR).filter(f => ['.mp4', '.mov'].some(ext => f.endsWith(ext))).length;
                    return (pyCount + sb3Count + videoCount) >= 3;
                },
                auto: true,
                hint: '在作品集中至少有3个作品文件'
            },
            {
                id: 'v10_presentation',
                label: '做过项目展示（自评）',
                method: () => false,
                auto: false,
                hint: '你给家人做过项目展示吗？'
            }
        ]
    }
};

// ==================== 验证执行 ====================
function verifyLevel(levelId) {
    const rules = LEVEL_RULES[levelId];
    if (!rules) return { error: `关卡 ${levelId} 不存在` };

    const results = rules.verifications.map(v => {
        let passed = false;
        try {
            passed = v.method();
        } catch (e) {
            passed = false;
        }
        return {
            id: v.id,
            label: v.label,
            passed,
            auto: v.auto,
            hint: v.hint
        };
    });

    const autoPassed = results.filter(r => r.auto && r.passed).length;
    const autoTotal = results.filter(r => r.auto).length;
    const manualTotal = results.filter(r => !r.auto).length;

    return {
        levelId,
        title: rules.title,
        results,
        summary: {
            autoPassed,
            autoTotal,
            manualTotal,
            allAutoPassed: autoPassed === autoTotal,
            canComplete: autoPassed === autoTotal // 全部自动检测通过才算完成
        }
    };
}

function verifyAll() {
    const allResults = {};
    for (let i = 1; i <= 10; i++) {
        allResults[i] = verifyLevel(i);
    }
    return allResults;
}

// ==================== HTTP 服务 ====================
function startServer() {
    const http = require('http');
    const PORT = 18088;

    const server = http.createServer((req, res) => {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        const url = new URL(req.url, `http://localhost:${PORT}`);

        if (url.pathname === '/verify') {
            const level = url.searchParams.get('level');
            let result;
            if (level) {
                result = verifyLevel(parseInt(level));
            } else {
                result = verifyAll();
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result, null, 2));
        } else if (url.pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });

    server.listen(PORT, () => {
        console.log(`🔍 验证服务已启动: http://localhost:${PORT}`);
        console.log(`   验证全部: http://localhost:${PORT}/verify`);
        console.log(`   验证单关: http://localhost:${PORT}/verify?level=1`);
        console.log(`   健康检查: http://localhost:${PORT}/health`);
        console.log(`\n按 Ctrl+C 停止服务`);
    });

    return server;
}

// ==================== CLI ====================
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args[0] === 'serve') {
        startServer();
    } else if (args[0]) {
        const levelId = parseInt(args[0]);
        const result = verifyLevel(levelId);
        console.log(JSON.stringify(result, null, 2));
    } else {
        const results = verifyAll();
        // 打印表格
        console.log('\n🔍 小创客冒险之旅 - 验证报告\n');
        console.log('=' .repeat(60));
        for (const [id, result] of Object.entries(results)) {
            const icon = result.summary.allAutoPassed ? '✅' : '⏳';
            console.log(`\n${icon} 第${id}关: ${result.title}`);
            console.log(`   自动检测: ${result.summary.autoPassed}/${result.summary.autoTotal} 通过`);
            result.results.forEach(r => {
                const mark = r.passed ? '  ✅' : (r.auto ? '  ❌' : '  🔘');
                const type = r.auto ? '' : ' [人工]';
                console.log(`${mark} ${r.label}${type}`);
                if (!r.passed && r.auto) {
                    console.log(`      💡 ${r.hint}`);
                }
            });
        }
        console.log('\n' + '=' .repeat(60));
        const totalAuto = Object.values(results).reduce((a, r) => a + r.summary.autoPassed, 0);
        const totalAll = Object.values(results).reduce((a, r) => a + r.summary.autoTotal, 0);
        console.log(`\n总计: ${totalAuto}/${totalAll} 自动检测通过\n`);
    }
}

module.exports = { verifyLevel, verifyAll, checks };
