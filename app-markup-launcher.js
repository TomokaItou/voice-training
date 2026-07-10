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
          <button class="home-tab" type="button" data-home-tab-button="course" aria-selected="false">课程</button>
          <button class="home-tab" type="button" data-home-tab-button="songs" aria-selected="false">歌曲</button>
          <button class="home-tab" type="button" data-home-tab-button="mine" aria-selected="false">我的</button>
        </nav>

        <section class="mira-hero mira-classroom mira-state-idle" data-home-section="today" data-component="TodayHero" data-mira-room-state="idle" aria-label="Mira 3D 声乐教室">
          <div class="classroom-scene" id="miraClassroomScene">
            <div class="classroom-back-wall" aria-hidden="true">
              <span class="classroom-window"></span>
              <span class="classroom-poster">Mira Room</span>
              <span class="classroom-light"></span>
            </div>
            <div class="classroom-floor" aria-hidden="true"></div>

            <button class="classroom-hotspot classroom-screen" id="classroomScreenButton" type="button" aria-label="查看 Mira 的反馈屏幕">
              <span class="screen-label">Mirror Screen</span>
              <svg viewBox="0 0 220 92" role="img" aria-label="音高曲线预览">
                <path d="M8 62 C 34 42, 49 78, 75 52 S 124 38, 148 54 S 186 78, 212 34" />
                <circle cx="148" cy="54" r="5" />
                <circle cx="212" cy="34" r="5" />
              </svg>
              <small id="classroomScreenStatus">等你唱完后，反馈会出现在这里。</small>
            </button>

            <button class="classroom-hotspot classroom-stand" id="classroomStandButton" type="button" aria-label="打开谱架，选择歌曲或练习片段">
              <span class="stand-paper">
                <strong id="todayRecommendationSong">《炉心融解》</strong>
                <small id="todayRecommendationSegment">副歌第一句，15 秒</small>
              </span>
              <span class="stand-stem"></span>
              <span class="stand-feet"></span>
            </button>

            <button class="classroom-hotspot classroom-mic" id="classroomMicButton" type="button" aria-label="点击麦克风开始录一句">
              <span class="mic-head"></span>
              <span class="mic-body"></span>
              <span class="mic-ring"></span>
              <strong>录一句</strong>
            </button>

            <button class="classroom-mira" id="classroomMiraButton" type="button" aria-label="点击 Mira 开始今天的练习">
              <span class="mira-star-orbit"></span>
              <span class="mira-sparkles" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span class="mira-listening-waves" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <img class="mira-character" src="assets/mira-coach-cutout.png" alt="" />
            </button>

            <div class="classroom-task-card" id="classroomTaskCard">
              <span class="game-label">Mira 今日小课</span>
              <h1>今天只练这一句</h1>
              <p id="miraStateBubble" aria-live="polite">我在练习室等你。点我，或者点麦克风开始。</p>
              <div class="classroom-task-meta">
                <strong id="todayRecommendationTime">预计 30 秒</strong>
                <span id="todayRecommendationNextStep">完成后 Mira 只挑一个重点说。</span>
              </div>
              <ul id="todayRecommendationReasons" class="classroom-reasons">
                <li>适合你当前音域</li>
                <li>今天只练一句</li>
                <li>练完再决定下一步</li>
              </ul>
              <div class="mira-actions">
                <button id="startTodayTrainingButton" class="hall-primary-action" type="button">开始今天的练习</button>
                <button id="classroomPracticeAgainButton" class="secondary classroom-next-action" type="button" hidden>再来一次</button>
              </div>
            </div>

            <div class="classroom-reward" id="classroomReward" aria-hidden="true">
              <span>完成</span>
            </div>
          </div>

          <div class="beginner-quest-preview" id="beginnerQuestPreview">
            <span id="beginnerQuestPreviewLevel">目标</span>
            <div>
              <strong id="beginnerQuestPreviewTitle">完成 1 个 Vocal Task</strong>
              <small id="beginnerQuestPreviewMeta">Mira 会一步一步带你做完</small>
            </div>
          </div>

          <div class="home-quick-links" aria-label="歌曲快捷入口" hidden>
            <span>想唱别的歌？</span>
            <button id="homeQuickChooseSongButton" class="home-link-button" type="button">搜索歌曲</button>
            <button id="homeQuickMySongsButton" class="home-link-button" type="button">我的歌曲</button>
            <button id="homeQuickAccompanimentButton" class="home-link-button" type="button">伴奏库</button>
          </div>
          <section class="vocaloid-recommendation-section" aria-label="Vocaloid 推荐" hidden>
            <div class="vocaloid-recommendation-header">
              <span>Vocaloid 推荐</span>
              <small>相近难度，适合短句练习</small>
            </div>
            <div class="vocaloid-recommendation-list" id="vocaloidRecommendationList"></div>
          </section>
        </section>

        <section class="active-search-entry-card" id="aiCourseEntryCard" data-home-section="course" hidden>
          <div class="today-vocal-move-copy">
            <span class="game-label">Mira Course</span>
            <h2>像上课一样，一句一句来。</h2>
            <p>Mira 先给一句目标，你唱一句，她反馈一句，再带你进入下一句。</p>
            <small>轻声起音、稳定气息、闭合控制、连音和歌曲片段都会在后台自动安排。</small>
          </div>
          <div class="today-vocal-move-actions">
            <button id="openAiCourseButton" type="button">开始 Mira 课程</button>
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

        <section class="flow-training-route mira-practice-flow" id="flowPage" data-home-section="flow" data-component="MiraPracticeFlow" data-mira-practice-state="today_task" aria-label="Mira 今日练习调度" hidden style="display: none;">
          <div class="main-route-header">
            <span class="game-label">Mira Live Lesson</span>
            <div>
              <h2>听 Mira，说完你就唱。</h2>
              <p>文字只做字幕；练习会由 Mira 的声音往前带。</p>
            </div>
          </div>

          <section class="mira-voice-stage" aria-label="Mira 语音舞台">
            <div class="mira-voice-avatar" aria-hidden="true">
              <img src="assets/mira-coach-cutout.png" alt="" />
              <span></span>
            </div>
            <div class="mira-voice-copy">
              <span id="miraVoiceMood">Mira</span>
              <p id="miraVoiceSubtitle" aria-live="polite">今天 Mira 会直接带你练一句。</p>
              <small data-mira-voice-status>VOICEVOX</small>
            </div>
            <button id="miraVoiceMuteButton" class="secondary mira-voice-mute" type="button" data-mira-voice-toggle aria-pressed="false">语音开</button>
          </section>

          <ol class="mainline-steps route-steps mira-flow-steps" aria-label="Mira 练习流程">
            <li data-mira-step="today_task">今日任务</li>
            <li data-mira-step="record_once">录一句</li>
            <li data-mira-step="mira_feedback">Mira 反馈</li>
            <li data-mira-step="auto_route">下一步</li>
          </ol>

          <div class="route-workspace" data-component="TrainingFlowPanel">
            <section class="route-panel mira-flow-panel mira-flow-today" data-mira-panel="today_task" aria-label="今日任务">
              <span class="route-step-number">1</span>
              <div class="mira-flow-dialogue">
                <span class="game-label">Mira</span>
                <h2 id="miraFlowTeacherLine">“今天先别想整首歌，我们只练这一句。”</h2>
                <p id="miraFlowTaskSegment">《炉心融解》副歌第一句，15 秒</p>
              </div>
              <div class="route-recommendation-summary">
                <strong id="routeRecommendationSong">《炉心融解》</strong>
                <span id="routeRecommendationSegment">副歌第一句，15 秒</span>
                <small id="routeRecommendationReason">目标：让高音 F5 更稳定，不要挤嗓子。</small>
              </div>
              <div class="mira-flow-actions">
                <button id="miraPracticeRecordButton" type="button">开始录音</button>
                <button id="miraPracticePrepareSongButton" class="secondary" type="button">换成我的歌</button>
              </div>
            </section>

            <section class="route-panel mira-flow-panel mira-flow-record" data-mira-panel="record_once" aria-label="录一句">
              <span class="route-step-number">2</span>
              <span class="practice-tag">你来唱</span>
              <h2>“唱完这一句就停。”</h2>
              <p>页面只保留歌词、录音和字幕。Mira 会在你唱完后直接回应。</p>
              <div class="mira-flow-actions">
                <button id="miraPracticeOpenRecorderButton" type="button">打开录音页</button>
                <button id="miraPracticeShowFeedbackButton" class="secondary" type="button">我唱完了，看反馈</button>
              </div>
            </section>

            <section class="route-panel mira-flow-panel mira-flow-feedback" data-mira-panel="mira_feedback" aria-label="Mira 反馈">
              <span class="route-step-number">3</span>
              <div class="mira-feedback-summary">
                <span class="game-label">字幕</span>
                <h2 id="miraFeedbackHeadline">“很好。”</h2>
                <p id="miraFeedbackGoodPoint">刚刚已经比上一遍稳定。</p>
                <p id="miraFeedbackOneThing">这次第一个字轻一点。</p>
              </div>
              <div class="mira-flow-actions">
                <button id="miraPracticeRepeatButton" type="button">再唱一次</button>
                <button id="miraPracticeSwitchRouteButton" class="secondary" type="button">换个练法</button>
              </div>
            </section>

            <section class="route-panel mira-flow-panel mira-flow-auto" data-mira-panel="auto_route" aria-label="Mira 自动安排下一步">
              <span class="route-step-number">4</span>
              <div>
                <span class="game-label">Mira 下一步</span>
                <h2 id="miraAutoRouteTitle">“这次只改一个地方。”</h2>
                <p id="miraAutoRouteReason">后台会自动选择练法，Mira 只把下一句话说给你听。</p>
              </div>
              <div class="mira-auto-route-card" id="miraAutoRouteCard">
                <strong id="miraAutoRouteTask">保持同样轻度，再唱 30 秒。</strong>
                <small id="miraAutoRouteHiddenEngine">后台：Fix One Thing</small>
              </div>
              <div class="mira-flow-actions">
                <button id="miraAutoRouteStartButton" type="button">开始这个练法</button>
                <button id="miraAutoRouteBackButton" class="secondary" type="button">回到今日任务</button>
              </div>
            </section>
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

        <details class="launcher-secondary launcher-lab-details" data-home-section="mine" hidden>
          <summary>
            <span>
              <strong>实验室 Lab</strong>
              <small>高级用户和开发者手动测试</small>
            </span>
          </summary>
          <div class="lab-intro">
            <p>这些是实验功能。日常练习中 Mira 会自动调用它们，高级用户也可以在这里手动测试。</p>
          </div>
          <div class="tool-list lab-tool-list">
            <button class="mode-button compact-tool memory-mode" type="button" data-lab-action="ai_teacher">
              <span class="mode-title">AI Vocal Teacher</span>
              <span class="mode-desc">Probe Memory Loop</span>
            </button>
            <button class="mode-button compact-tool secondary-mode" type="button" data-lab-action="active_search">
              <span class="mode-title">Active Voice Search</span>
              <span class="mode-desc">找出今天最好的一遍</span>
            </button>
            <button class="mode-button compact-tool action-path-mode" type="button" data-lab-action="ai_experiment">
              <span class="mode-title">AI Experiment</span>
              <span class="mode-desc">一次小实验判断方向</span>
            </button>
            <button class="mode-button compact-tool range-mode" type="button" data-lab-action="vocal_state">
              <span class="mode-title">Vocal State Kit</span>
              <span class="mode-desc">多模态录制实验</span>
            </button>
            <button class="mode-button compact-tool score-mode" type="button" data-lab-action="fix">
              <span class="mode-title">Fix One Thing</span>
              <span class="mode-desc">只修一个问题</span>
            </button>
            <button class="mode-button compact-tool secondary-mode" type="button" data-lab-action="history">
              <span class="mode-title">分析历史</span>
              <span class="mode-desc">查看录音与复盘</span>
            </button>
          </div>
        </details>

        <details class="launcher-secondary launcher-tools-details" data-home-section="mine" hidden>
          <summary>
            <span>
              <strong>工具箱</strong>
              <small>单项练习、观察分析和旧版实验入口</small>
            </span>
          </summary>
          <div class="tools-workbench" aria-label="工具分组">
            <section class="tool-section tool-section-practice" aria-label="单项练习">
              <div class="tool-section-header">
                <span>练习工具</span>
                <small>今天只想修一个能力时</small>
              </div>
              <div class="tool-grid tool-grid-practice">
                <button id="openVocalMoveLibraryButton" class="mode-button compact-tool memory-mode" type="button">
                  <span class="mode-title">动作图鉴</span>
                  <span class="mode-desc">每天只练一个小动作</span>
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
              </div>
            </section>

            <section class="tool-section tool-section-diagnostics" aria-label="观察与诊断">
              <div class="tool-section-header">
                <span>观察与诊断</span>
                <small>需要看曲线、跨度或能量时</small>
              </div>
              <div class="tool-list">
                <button id="openRangeModeButton" class="mode-button compact-tool range-mode" type="button" data-training-mode="range">
                  <span class="mode-title">音域测量</span>
                  <span class="mode-desc">记录稳定跨度</span>
                </button>
                <button id="openClassicPitchModeButton" class="mode-button compact-tool secondary-mode" type="button" data-training-mode="classic">
                  <span class="mode-title">经典音高曲线</span>
                  <span class="mode-desc">直接看实时曲线</span>
                </button>
                <button id="openSpectrogramModeButton" class="mode-button compact-tool secondary-mode" type="button" data-training-mode="spectrogram">
                  <span class="mode-title">频谱图</span>
                  <span class="mode-desc">看泛音和能量</span>
                </button>
              </div>
            </section>

            <section class="tool-section tool-section-lab" aria-label="实验室">
              <div class="tool-section-header">
                <span>实验室</span>
                <small>保留旧研究入口，不放进主训练流</small>
              </div>
              <div class="tool-list">
                <button id="openMemoryModeButton" class="mode-button compact-tool memory-mode" type="button" data-training-mode="memory">
                  <span class="mode-title">记忆感知</span>
                  <span class="mode-desc">分析保持和恢复路径</span>
                </button>
                <button id="openActionPathModeButton" class="mode-button compact-tool action-path-mode" type="button" data-training-mode="action">
                  <span class="mode-title">动作路径 S88</span>
                  <span class="mode-desc">Twang 与起音轨迹</span>
                </button>
              </div>
            </section>
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
