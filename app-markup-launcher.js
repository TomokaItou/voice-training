// Static launcher markup for the voice training app shell.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.launcher = String.raw`    <section class="mode-launcher" id="modeLauncher" data-home-tab="today">
      <div class="mode-launcher-card">
        <div class="hall-topbar">
          <div class="hall-brand">
            <span class="launcher-kicker">Voice Navigation System</span>
            <strong>Mira 声音导航员</strong>
          </div>
          <div class="hall-topbar-actions">
            <div class="mira-bgm-control" id="miraBgmControl">
              <button id="bgmToggleButton" class="mira-bgm-button" type="button" aria-pressed="true" title="暂停/继续 BGM">
                ♪
              </button>
              <div class="mira-bgm-copy">
                <strong id="bgmStatusText">Mira BGM</strong>
                <label class="mira-bgm-volume">
                  <span>音量</span>
                  <input id="bgmVolumeRange" type="range" min="0" max="100" step="1" value="14" />
                </label>
              </div>
            </div>
            <div class="hall-player-pill">
              <span id="gameLevelValue">Lv.1</span>
              <strong id="gameSingerTitle">见习歌手</strong>
            </div>
          </div>
        </div>

        <nav class="home-main-tabs" aria-label="主导航">
          <button class="home-tab is-active" type="button" data-home-tab-button="today" aria-selected="true">今天</button>
          <button class="home-tab" type="button" data-home-tab-button="flow" aria-selected="false">流程</button>
          <button class="home-tab" type="button" data-home-tab-button="songs" aria-selected="false">歌曲</button>
          <button class="home-tab" type="button" data-home-tab-button="teacher" aria-selected="false">AI老师</button>
          <button class="home-tab" type="button" data-home-tab-button="mine" aria-selected="false">我的</button>
        </nav>

        <section class="mira-hero mira-state-idle" data-home-section="today" data-component="TodayHero" aria-label="Mira 声音导航">
          <div class="mira-stage">
            <div class="mira-star-orbit"></div>
            <div class="mira-sparkles" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="mira-listening-waves" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <img class="mira-character" src="assets/mira-coach-cutout.png" alt="" />
            <div class="mira-state-bubble" id="miraStateBubble" aria-live="polite">我在等你</div>
          </div>

          <div class="voice-navigation-deck">
            <div class="mira-dialogue">
              <span class="game-label">Mira 新手陪练</span>
              <h1>今天练 30 秒</h1>
              <p>不用想太多，先完成一个小动作。</p>
              <div class="mira-actions">
                <button id="startTodayTrainingButton" class="hall-primary-action" type="button">开始今天训练</button>
                <button id="miraSongButton" class="secondary home-secondary-shortcut" type="button">选择目标歌曲</button>
              </div>
              <div class="beginner-quest-preview" id="beginnerQuestPreview">
                <span id="beginnerQuestPreviewLevel">目标</span>
                <div>
                  <strong id="beginnerQuestPreviewTitle">完成 1 个 Vocal Task</strong>
                  <small id="beginnerQuestPreviewMeta">Mira 会一步一步带你做完</small>
                </div>
              </div>
              <div class="home-quick-links" aria-label="歌曲快捷入口">
                <button id="homeQuickChooseSongButton" class="home-link-button" type="button">选歌</button>
                <button id="homeQuickMySongsButton" class="home-link-button" type="button">我的歌曲</button>
                <button id="homeQuickAccompanimentButton" class="home-link-button" type="button">伴奏库</button>
              </div>
            </div>

          </div>
        </section>

        <section class="daily-challenge-card" id="dailyChallengeEntry" data-home-section="mine" hidden>
          <div>
            <span class="game-label">Mira Daily</span>
            <h2>今日30秒挑战</h2>
            <p>不想唱也可以练。</p>
          </div>
          <button id="dailyChallengeStartButton" type="button">开始今日挑战</button>
        </section>

        <section class="daily-challenge-panel" id="dailyChallengePanel" data-home-section="mine" hidden>
          <div class="daily-challenge-header">
            <div>
              <span class="game-label">Listening Challenge</span>
              <h2>听两段，选更好听的一段。</h2>
              <p id="dailyChallengeStatus">30 秒内完成，不需要唱歌，也不会失败。</p>
            </div>
            <button id="dailyChallengeCloseButton" class="secondary" type="button">返回首页</button>
          </div>
          <div class="daily-challenge-options" aria-label="A/B 听力挑战">
            <button id="dailyChallengePlayAButton" class="daily-audio-button" type="button">
              <span>Step 1</span>
              <strong>播放 A</strong>
            </button>
            <button id="dailyChallengePlayBButton" class="daily-audio-button" type="button">
              <span>Step 2</span>
              <strong>播放 B</strong>
            </button>
          </div>
          <div class="daily-challenge-choices">
            <button id="dailyChallengeChooseAButton" type="button">A 更好</button>
            <button id="dailyChallengeChooseBButton" type="button">B 更好</button>
            <button id="dailyChallengeUnsureButton" class="secondary" type="button">听不出来</button>
          </div>
          <section class="daily-challenge-result" id="dailyChallengeResult" hidden>
            <span class="label">Mira 的答案</span>
            <h3 id="dailyChallengeAnswer">A 更好。</h3>
            <p id="dailyChallengeExplanation">原因：A 的音高更稳，尾音没有明显晃动。</p>
            <strong id="dailyChallengeReward">今日挑战完成 · +10 XP</strong>
            <div class="daily-challenge-result-actions">
              <button id="dailyChallengeFixButton" class="secondary" type="button">用这句做5分钟练习</button>
              <button id="dailyChallengeDoneButton" type="button">结束，回首页</button>
            </div>
          </section>
        </section>

        <section class="today-vocal-move-card" id="todayVocalMoveCard" data-home-section="teacher" hidden>
          <div class="today-vocal-move-copy">
            <span class="game-label">今日动作</span>
            <h2 id="todayVocalMoveName">B2 高音不喊</h2>
            <p id="todayVocalMoveGoal">目标：保持轻薄音色，不通过加大音量冲高音</p>
            <small id="todayVocalMoveDescription">不用唱完整首，先把这一秒变好听。</small>
          </div>
          <div class="today-vocal-move-actions">
            <button id="todayVocalMoveStartButton" type="button">开始练习</button>
            <button id="todayVocalMoveShuffleButton" class="secondary" type="button">换一个动作</button>
            <button id="todayVocalMoveLibraryButton" class="secondary" type="button">查看动作图鉴</button>
          </div>
        </section>

        <section class="active-search-entry-card" id="activeSearchEntryCard" data-home-section="teacher" hidden>
          <div class="today-vocal-move-copy">
            <span class="game-label">Active Voice Search</span>
            <h2>Find Better Voice</h2>
            <p>3分钟找到今天最好的一句</p>
            <small>不用唱完整首，短录 2–5 秒，Mira 帮你找出 Top 3。</small>
          </div>
          <div class="today-vocal-move-actions">
            <button id="openActiveSearchButton" type="button">开始搜索</button>
          </div>
        </section>

        <section class="active-search-entry-card" id="aiVocalTeacherEntryCard" data-home-section="teacher" hidden>
          <div class="today-vocal-move-copy">
            <span class="game-label">AI Vocal Teacher v0.1</span>
            <h2>Probe Memory Loop</h2>
            <p>5 个 probe，每个 5 次，估计最不稳定的声音记忆方向。</p>
            <small>录音 → 协方差 → dominant direction → 推荐练习 → re-probe。</small>
          </div>
          <div class="today-vocal-move-actions">
            <button id="openAiVocalTeacherButton" type="button">开始 AI 声乐老师</button>
          </div>
        </section>

        <section class="teacher-tools-card" data-home-section="teacher" aria-label="AI 老师工具" hidden>
          <div>
            <span class="game-label">AI 老师</span>
            <h2>需要单独修一处时</h2>
            <p>这里放诊断、闭环练习和历史复盘，不占用首页。</p>
          </div>
          <div class="teacher-tools-grid">
            <button id="aiTeacherFixOneThingButton" class="secondary" type="button">Fix One Thing</button>
            <button id="aiTeacherHistoryButton" class="secondary" type="button">分析历史</button>
          </div>
        </section>

        <section class="song-center" id="songAnalysisEntryCard" data-home-section="songs" aria-label="歌曲中心" hidden>
          <div class="song-center-header">
            <div>
              <span class="game-label">歌曲中心</span>
              <h2>选择一首歌</h2>
              <p>选择一首歌，Mira 会帮你拆成可以练的小片段。</p>
            </div>
            <button id="songCenterUploadButton" class="secondary" type="button">上传歌曲</button>
          </div>

          <section class="song-center-search" aria-label="搜索歌曲">
            <form id="songSearchForm" class="song-search-form">
              <input
                id="songSearchInput"
                class="input"
                type="text"
                placeholder="搜索歌曲 / 歌手 / 关键词"
                required
              />
              <button id="songSearchButton" type="submit">搜索</button>
            </form>
            <p id="songSearchStatus" class="song-search-status">想自由选歌时，从这里开始。</p>
            <ul id="songSearchResults" class="song-search-results" aria-live="polite"></ul>
          </section>

          <div class="song-center-shortcuts" aria-label="歌曲快捷入口">
            <button id="songCenterAudioLibraryButton" class="song-center-shortcut" type="button">
              <span>音频库</span>
              <small>录音和目标音频</small>
            </button>
            <button id="songCenterAccompanimentButton" class="song-center-shortcut" type="button">
              <span>伴奏库</span>
              <small>加载伴奏练习</small>
            </button>
            <button id="songCenterMaterialsButton" class="song-center-shortcut" type="button">
              <span>素材库</span>
              <small>录音、最佳时刻</small>
            </button>
            <button id="songCenterMySongsButton" class="song-center-shortcut" type="button">
              <span>我的歌曲</span>
              <small>继续之前的目标</small>
            </button>
          </div>

          <section class="song-center-recents" aria-label="最近练习">
            <div class="song-center-section-title">
              <h3>最近练习</h3>
              <button id="songCenterRefreshRecentsButton" class="home-link-button" type="button">刷新</button>
            </div>
            <div id="songCenterRecentList" class="song-center-recent-list">
              <p class="song-center-empty">还没有最近练习。先搜索或上传一首歌吧。</p>
            </div>
          </section>

          <section class="song-center-analysis-card" aria-label="歌曲分析">
            <div>
              <span class="game-label">Song Analysis</span>
              <h3>歌曲分析</h3>
              <p>上传一首歌后，自动分段、估算难度，并推荐练习顺序。</p>
            </div>
            <button id="openSongAnalysisButton" type="button">进入歌曲分析</button>
          </section>
        </section>

        <section class="beginner-practice-panel" id="beginnerPracticePanel" data-home-section="beginner" hidden>
          <div class="beginner-practice-copy">
            <span class="game-label" id="beginnerPracticeLevel">Lv0 · 只听</span>
            <h2 id="beginnerPracticeTitle">今天不用唱歌。先听 10 秒就可以。</h2>
            <p id="beginnerPracticeDescription">把目标片段听一遍，只要找到一个你喜欢的声音瞬间。</p>
          </div>
          <div class="beginner-practice-meta">
            <span id="beginnerPracticeEstimatedTime">约 30 秒</span>
            <span id="beginnerPracticeRequirements">不需要发声 · 不需要录音</span>
          </div>
          <div class="beginner-practice-condition">
            <span class="label">完成条件</span>
            <strong id="beginnerPracticeCondition">听完一次，并在心里选出最喜欢的一句。</strong>
          </div>
          <div class="beginner-practice-actions">
            <button id="beginnerPracticeCompleteButton" type="button">完成今日小练习</button>
            <button id="beginnerPracticeSkipButton" class="secondary" type="button">今天换简单一点</button>
            <button id="beginnerPracticeSingButton" class="secondary" type="button">我想直接唱歌</button>
          </div>
          <p class="beginner-practice-feedback" id="beginnerPracticeFeedback">Mira 只看你有没有开始，不评价你唱得好不好。</p>
        </section>

        <section class="flow-training-route" id="flowPage" data-home-section="flow" data-component="FlowPage" aria-label="今日主训练路线" hidden style="display: none;">
          <div class="main-route-header">
            <span class="game-label">准备好了再唱</span>
            <div>
              <h2>完成小任务后，再进入正式闭环。</h2>
              <p>歌曲、录音、分析都很难，但它们不是第一步。</p>
            </div>
          </div>

          <ol class="mainline-steps route-steps" aria-label="今日导航流程">
            <li>低门槛热身</li>
            <li>选择目标声音</li>
            <li>跟唱短片段</li>
            <li>Fix One Thing</li>
          </ol>

          <div class="route-workspace" data-component="TrainingFlowPanel">
            <section class="song-search-card route-panel route-song-card" aria-label="选择目标歌曲">
              <span class="route-step-number">1</span>
              <h2>选择目标声音</h2>
              <form id="routeSongSearchForm" class="song-search-form">
                <input
                  id="routeSongSearchInput"
                  class="input"
                  type="text"
                  placeholder="输入歌曲名或歌手，如：夜曲 / 周杰伦"
                  required
                />
                <button id="routeSongSearchButton" type="submit" class="secondary">搜索</button>
              </form>
              <p class="song-search-status">找一首今天想靠近的歌，先把目标定住。</p>
              <ul class="song-search-results" aria-live="polite"></ul>
            </section>

            <button id="openCurveModeButton" class="mode-button practice-card practice-card-primary training-entry-main route-panel route-start-card" type="button" data-training-mode="curve">
              <span class="route-step-number">2</span>
              <span class="practice-tag">主训练</span>
              <span class="mode-title">跟唱录一遍</span>
              <span class="mode-desc">先完整唱一次，不急着改。</span>
              <span class="practice-action">开始录一遍</span>
            </button>

            <section class="route-panel route-review-card" aria-label="回看训练结果">
              <span class="route-step-number">3</span>
              <div>
                <h2>找到偏差</h2>
                <p>Mira 会从这一遍里挑出最值得先修的一句。</p>
              </div>
              <div class="route-library-actions">
                <button id="openRecordingLibraryButton" class="mode-button library-mode" type="button">
                  <span class="mode-title">查看录音复盘</span>
                  <span class="mode-desc" id="recordingLibraryEntryStatus">暂无录音</span>
                </button>
                <button id="openAccompanimentLibraryButton" class="mode-button library-mode accompaniment-mode" type="button">
                  <span class="mode-title">伴奏库</span>
                  <span class="mode-desc" id="accompanimentLibraryEntryStatus">暂无伴奏</span>
                </button>
              </div>
            </section>

            <button id="openFixOneThingButton" class="mode-button practice-card route-panel route-fix-card" type="button" data-training-mode="fix">
              <span class="route-step-number">4</span>
              <span class="practice-tag">闭环训练</span>
              <span class="mode-title">Fix One Thing</span>
              <span class="mode-desc">练 30 秒，再判断有没有变好。</span>
              <span class="practice-action">修这一处</span>
            </button>
          </div>
        </section>

        <details class="game-player-details" data-home-section="mine" hidden>
          <summary>
            <span>
              <strong>成长记录</strong>
              <small>XP、连续天数和今日任务</small>
            </span>
          </summary>
          <section class="game-player-panel" id="gamePlayerPanel" aria-label="次级导航状态">
            <div class="game-player-card game-player-level">
              <div>
                <span class="game-label">导航等级</span>
                <strong id="gameLevelDisplay">Lv.1 见习歌手</strong>
              </div>
              <span id="gameStreakValue">今天开练</span>
            </div>
            <div class="game-player-card game-player-xp">
              <div class="game-xp-header">
                <span class="game-label">当前经验</span>
                <strong id="gameXpValue">0 / 120 XP</strong>
              </div>
              <div class="game-xp-track" aria-hidden="true">
                <span id="gameXpFill"></span>
              </div>
              <p id="gameNextLevelHint" class="game-next-level">距离下一级还差 120 XP</p>
              <div class="singer-skill-grid" aria-label="能力维度">
                <span>音准</span>
                <span>节奏</span>
                <span>气息</span>
                <span>共鸣</span>
                <span>稳定性</span>
              </div>
            </div>
            <div class="game-player-card game-player-quests">
              <div class="game-xp-header">
                <span class="game-label">今日导航</span>
                <strong id="gameQuestProgress">0 / 3</strong>
              </div>
              <ul id="gameQuestList" class="game-quest-list"></ul>
            </div>
          </section>
        </details>

        <details class="launcher-secondary launcher-tools-details" data-home-section="mine" hidden>
          <summary>
            <span>
              <strong>高级工具</strong>
              <small>需要单项练习或更细分析时再打开</small>
            </span>
          </summary>
          <div class="tool-grid">
            <button id="openVocalMoveLibraryButton" class="mode-button compact-tool memory-mode" type="button">
              <span class="mode-title">动作图鉴</span>
              <span class="mode-desc">每天只练一个小动作</span>
            </button>
            <button id="openClassicPitchModeButton" class="mode-button compact-tool secondary-mode" type="button" data-training-mode="classic">
              <span class="mode-title">经典音高曲线</span>
              <span class="mode-desc">直接看实时曲线</span>
            </button>
            <button id="openPitchScoreModeButton" class="mode-button compact-tool score-mode" type="button" data-training-mode="score">
              <span class="mode-title">稳定音高</span>
              <span class="mode-desc">单练音准</span>
            </button>
            <button id="openBreathModeButton" class="mode-button compact-tool breath-mode" type="button" data-training-mode="breath">
              <span class="mode-title">减少气声</span>
              <span class="mode-desc">单练气息</span>
            </button>
            <button id="openRhythmModeButton" class="mode-button compact-tool rhythm-mode" type="button" data-training-mode="rhythm">
              <span class="mode-title">贴回拍点</span>
              <span class="mode-desc">单练节奏</span>
            </button>
            <button id="openRangeModeButton" class="mode-button compact-tool range-mode" type="button" data-training-mode="range">
              <span class="mode-title">音域测量</span>
              <span class="mode-desc">记录稳定跨度</span>
            </button>
            <button id="openSpectrogramModeButton" class="mode-button compact-tool secondary-mode" type="button" data-training-mode="spectrogram">
              <span class="mode-title">频谱图</span>
              <span class="mode-desc">看泛音和能量</span>
            </button>
            <button id="openMemoryModeButton" class="mode-button compact-tool memory-mode" type="button" data-training-mode="memory">
              <span class="mode-title">记忆感知</span>
              <span class="mode-desc">分析保持和恢复路径</span>
            </button>
            <button id="openActionPathModeButton" class="mode-button compact-tool action-path-mode" type="button" data-training-mode="action">
              <span class="mode-title">动作路径 S88</span>
              <span class="mode-desc">Twang 与起音轨迹</span>
            </button>
          </div>
        </details>

        <details class="readiness-card" id="readinessCard" data-home-section="mine" hidden>
          <summary class="readiness-summary">
            <span>
              <strong>本机服务检查</strong>
              <small>麦克风、Demucs、Whisper</small>
            </span>
          </summary>
          <div class="readiness-card-body" aria-labelledby="readinessTitle">
            <div class="readiness-card-header">
              <div>
                <h2 id="readinessTitle">本机能力检查</h2>
                <p>需要人声分离、歌词识别或麦克风异常排查时再打开这里。</p>
              </div>
              <button id="runReadinessCheckButton" class="secondary" type="button">重新检查</button>
            </div>
            <div class="readiness-grid" id="readinessCheckGrid" aria-live="polite">
              <div class="readiness-item" data-check="microphone">
                <span class="readiness-dot" aria-hidden="true"></span>
                <strong>麦克风</strong>
                <span>等待检查</span>
              </div>
              <div class="readiness-item" data-check="secure">
                <span class="readiness-dot" aria-hidden="true"></span>
                <strong>安全页面</strong>
                <span>等待检查</span>
              </div>
              <div class="readiness-item" data-check="demucs">
                <span class="readiness-dot" aria-hidden="true"></span>
                <strong>Demucs 分离</strong>
                <span>等待检查</span>
              </div>
              <div class="readiness-item" data-check="whisper">
                <span class="readiness-dot" aria-hidden="true"></span>
                <strong>Whisper 歌词</strong>
                <span>等待检查</span>
              </div>
            </div>
            <p id="readinessStatus" class="readiness-status">展开后会检查一次；本地服务未启动时仍可使用浏览器内置练习功能。</p>
            <div class="readiness-actions">
              <button id="copyDemucsCommandButton" class="secondary" type="button">复制 Demucs 启动命令</button>
              <button id="copyWhisperCommandButton" class="secondary" type="button">复制 Whisper 启动命令</button>
            </div>
          </div>
        </details>
      </div>
    </section>

    `;
})();
