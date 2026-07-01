// Static training markup for the voice training app shell.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.training = String.raw`<main class="app" id="appWindow" hidden>
      <header>
        <h1 id="appTitle">实时音高曲线</h1>
        <p id="appDescription">允许麦克风权限后，对着手机唱歌即可看到音高变化。</p>
      </header>

      <section class="controls">
        <div class="controls-side">
          <button id="backToHomeButton" class="secondary sidebar-toggle">← 返回</button>
          <button id="sidebarToggle" class="secondary sidebar-toggle" aria-expanded="false">设置</button>
        </div>
      </section>

      <section class="fix-one-thing-panel" id="fixOneThingPanel" hidden>
        <div class="fix-stage-card">
          <span class="label">今日任务卡</span>
          <strong id="fixOneThingStageTitle">唱一句</strong>
          <p id="fixOneThingStageCopy">先录一句 5-15 秒的声音，Mira 会只选一个最值得修正的问题。</p>
          <div class="fix-task-meta">
            <span id="fixOneThingEstimatedTime">预计时间：5分钟</span>
            <span id="fixOneThingRepeatProgress">第 0/10 次</span>
          </div>
        </div>

        <div class="fix-focus-card">
          <span class="label">你当前最值得修正的问题</span>
          <h2 id="fixOneThingProblem">等待录音</h2>
          <p id="fixOneThingTaskReason">先完成第一句录音。</p>
          <div class="fix-impact-row">
            <span>影响程度</span>
            <strong id="fixOneThingImpact">--</strong>
          </div>
        </div>

        <section class="why-this-task-card" id="fixOneThingWhyCard">
          <span class="label">为什么先练这个？</span>
          <p id="fixOneThingWhyLine1">先录一句，Mira 会解释为什么选这个任务。</p>
          <p id="fixOneThingWhyLine2">解释只会围绕当前任务。</p>
          <p id="fixOneThingWhyLine3">不会推荐第二个练习。</p>
        </section>

        <div class="fix-exercise-card">
          <span class="label">怎么练</span>
          <h3 id="fixOneThingExerciseTitle">先完成第一句录音</h3>
          <p id="fixOneThingExerciseCopy">Mira 会根据这一句生成 30 秒练习任务。</p>
          <ol class="fix-coach-steps" id="fixOneThingCoachSteps">
            <li>Step 1：听目标片段</li>
            <li>Step 2：轻声模仿一次</li>
            <li>Step 3：正常音量唱一次</li>
            <li>Step 4：保存最好的一次</li>
            <li>Step 5：和历史最佳对比</li>
          </ol>
          <span id="fixOneThingDuration" class="fix-duration">预计时间：5分钟</span>
          <strong id="fixOneThingFocusPoint" class="fix-focus-point">重点：只追求一个动作变好。</strong>
        </div>

        <div class="fix-active-card" id="fixOneThingActiveCard" hidden>
          <span class="label">训练中</span>
          <strong id="fixOneThingActiveTarget">当前目标：--</strong>
          <span id="fixOneThingCountdown" class="fix-countdown">剩余：30秒</span>
          <span id="fixOneThingBestAttempt" class="fix-best-attempt">本次最佳：--</span>
        </div>

        <div class="fix-action-row">
          <button id="fixOneThingPrimaryButton" type="button">录制第一句</button>
          <button id="fixOneThingResetButton" class="secondary" type="button">重新开始</button>
        </div>

        <section class="fix-result-card" id="fixOneThingResultCard" hidden>
          <span class="label">当前进步</span>
          <div class="fix-comparison">
            <strong id="fixOneThingMetricName">--</strong>
            <span id="fixOneThingMetricBefore">--</span>
            <span aria-hidden="true">→</span>
            <span id="fixOneThingMetricAfter">--</span>
          </div>
          <p id="fixOneThingImprovement">再录一次后，Mira 会判断是否进步。</p>
          <strong id="fixOneThingXp">XP +0</strong>
        </section>

        <section class="fix-training-plan" aria-label="今日训练">
          <span class="label">今日训练</span>
          <ul id="fixOneThingTrainingPlan">
            <li data-fix-plan="breathiness">□ 漏气感</li>
            <li data-fix-plan="closure">□ 闭合方式</li>
            <li data-fix-plan="unknown">□ 稳定基线</li>
          </ul>
        </section>

        <details class="fix-evidence-panel">
          <summary><span>高级分析证据</span><small>默认不用看，给复查时使用</small></summary>
          <dl class="fix-evidence-grid">
            <div><dt>漏气感</dt><dd id="fixEvidenceBreathiness">--</dd></div>
            <div><dt>闭合方式</dt><dd id="fixEvidencePitch">--</dd></div>
            <div><dt>稳定度</dt><dd id="fixEvidenceFocus">--</dd></div>
          </dl>
        </details>
      </section>

      <section class="training-feedback" id="trainingFeedbackPanel">
        <div>
          <span class="label">练习建议</span>
          <h2 id="trainingFeedbackTitle">先开始一次练习</h2>
          <p id="trainingFeedbackText">系统会把音高、稳定度和录音结果翻译成下一步练习建议。</p>
        </div>
        <span id="trainingFeedbackBadge" class="training-feedback-badge">等待</span>
      </section>

      <section class="game-reward-panel" id="gameRewardPanel" hidden aria-live="polite">
        <div>
          <span class="game-label">关卡结算</span>
          <h2 id="gameRewardTitle">练习完成</h2>
          <p id="gameRewardText">继续完成今日任务，升级会更快。</p>
        </div>
        <div class="game-reward-score">
          <strong id="gameRewardGrade">A</strong>
          <span id="gameRewardXp">+0 XP</span>
        </div>
      </section>

      <section class="mira-feedback-panel" id="miraFeedbackPanel" hidden aria-live="polite">
        <div class="mira-feedback-header">
          <div>
            <span class="game-label">Voice Navigation System</span>
            <h2>Mira 的导航反馈</h2>
            <p id="miraFeedbackStatus">等待本次声音坐标</p>
          </div>
          <span class="mira-feedback-orb" aria-hidden="true">✦</span>
        </div>
        <div class="mira-feedback-grid">
          <article>
            <span>鼓励</span>
            <p id="miraFeedbackEncouragement">唱完这一遍后，Mira 会帮你整理导航方向。</p>
          </article>
          <article>
            <span>主要观察</span>
            <p id="miraFeedbackObservation">今天只看最值得修改的一处。</p>
          </article>
          <article>
            <span>下一步动作</span>
            <p id="miraFeedbackNextStep">完成一次跟唱后生成声音坐标。</p>
          </article>
        </div>
        <button id="miraFeedbackRepeatButton" class="hall-primary-action" type="button">
          按 Mira 的建议再练一次
        </button>
      </section>

      <section class="breath-dashboard" id="breathDashboard" hidden>
        <div class="breath-score-panel">
          <span class="label">出气控制评分</span>
          <span class="breath-score-value" id="breathScoreHeroValue">--%</span>
          <span class="breath-score-caption">保持平稳、连续的气流，不要一开始就用最大气流。</span>
        </div>
        <div class="breath-state-panel">
          <div class="breath-voice-summary">
            <span class="label">声音类型</span>
            <span class="breath-state-value" id="breathVoiceHeroValue">--</span>
          </div>
          <div class="breath-state-meta">
            <div>
              <span class="label">气流稳定度</span>
              <span class="value" id="breathStabilityHeroValue">--%</span>
            </div>
            <div>
              <span class="label">持续时间</span>
              <span class="value" id="breathDurationHeroValue">0.0s</span>
            </div>
          </div>
        </div>
      </section>

      <details class="breath-detail-panel" id="breathDetailPanel" hidden>
        <summary>
          <span>详细数据</span>
          <small>出气力度、高频气声、气流噪声</small>
        </summary>
        <div class="breath-metric-strip">
          <div>
            <span class="label">出气力度</span>
            <span class="value" id="breathEffortHeroValue">--%</span>
          </div>
          <div>
            <span class="label">高频气声</span>
            <span class="value" id="breathNoiseHeroValue">--%</span>
          </div>
          <div>
            <span class="label">漏气噪声</span>
            <span class="value" id="breathLeakHeroValue">--%</span>
          </div>
          <div>
            <span class="label">环境校准</span>
            <span class="value" id="breathCalibrationHeroValue">未校准</span>
          </div>
        </div>
      </details>

      <section class="readout">
        <div>
          <span class="label">当前音高</span>
          <span class="value" id="pitchValue">-- Hz</span>
        </div>
        <div>
          <span class="label">音名</span>
          <span class="value" id="noteValue">--</span>
        </div>
        <div class="breath-readout" hidden>
          <span class="label">出气评分</span>
          <span class="value" id="breathFlowValue">--%</span>
        </div>
        <div class="breath-readout" hidden>
          <span class="label">气流强度</span>
          <span class="value" id="breathEffortValue">--%</span>
        </div>
        <div class="breath-readout" hidden>
          <span class="label">高频气声</span>
          <span class="value" id="breathNoiseValue">--%</span>
        </div>
        <div class="breath-readout" hidden>
          <span class="label">漏气噪声</span>
          <span class="value" id="breathLeakValue">--%</span>
        </div>
        <div class="breath-readout" hidden>
          <span class="label">声音类型</span>
          <span class="value" id="breathVoiceTypeValue">--</span>
        </div>
        <div class="breath-readout" hidden>
          <span class="label">稳定度 / 持续</span>
          <span class="value" id="breathStabilityValue">-- / 0.0s</span>
        </div>
        <div class="breath-readout" hidden>
          <span class="label">环境校准</span>
          <span class="value" id="breathCalibrationValue">未校准</span>
        </div>
      </section>

      <section class="pitch-score-dashboard" id="pitchScoreDashboard" hidden>
        <div class="pitch-score-main">
          <span class="label">当前音高</span>
          <span class="pitch-score-value" id="pitchScoreValue">--</span>
          <span class="pitch-score-caption" id="pitchScoreCaption">开始检测后，对准目标音持续发声。</span>
        </div>
        <div class="pitch-score-grid">
          <div>
            <span class="label">音名</span>
            <span class="value" id="pitchScoreTargetValue">300 Hz</span>
          </div>
          <div>
            <span class="label">当前偏差</span>
            <span class="value" id="pitchScoreCentsValue">-- cents</span>
          </div>
          <div>
            <span class="label">稳定度</span>
            <span class="value" id="pitchScoreStabilityValue">--%</span>
          </div>
          <div>
            <span class="label">命中率</span>
            <span class="value" id="pitchScoreHitRateValue">--%</span>
          </div>
          <div>
            <span class="label">平均偏差</span>
            <span class="value" id="pitchScoreAverageValue">-- cents</span>
          </div>
          <div>
            <span class="label">有效覆盖</span>
            <span class="value" id="pitchScoreCoverageValue">--%</span>
          </div>
        </div>
      </section>

      <section class="range-dashboard" id="rangeDashboard" hidden>
        <div class="range-main">
          <span class="label" id="rangeStageLabel">音域训练模式</span>
          <span class="range-value" id="rangeSpanValue">--</span>
          <span class="range-caption" id="rangeCaption">点击开始检测后，从舒适低音滑到高音，再回到中声区。</span>
        </div>
        <div class="range-track-panel" id="rangeTrackPanel" hidden>
          <div class="range-track-labels">
            <span id="rangeTrackLowValue">最低音 --</span>
            <span id="rangeTrackCurrentValue">当前音 --</span>
            <span id="rangeTrackHighValue">最高音 --</span>
          </div>
          <div class="range-track">
            <span class="range-track-fill" id="rangeTrackFill"></span>
            <span class="range-track-current" id="rangeTrackCurrent"></span>
          </div>
          <div class="range-track-caption" id="rangeTrackCaption">最低音 ← 当前音 → 最高音</div>
        </div>
        <div class="range-grid">
          <div class="range-live-metric">
            <span class="label">当前音</span>
            <span class="value" id="rangeCurrentValue">--</span>
          </div>
          <div class="range-result-metric">
            <span class="label">最低稳定音</span>
            <span class="value" id="rangeLowestValue">--</span>
          </div>
          <div class="range-result-metric">
            <span class="label">最高稳定音</span>
            <span class="value" id="rangeHighestValue">--</span>
          </div>
          <div class="range-result-metric">
            <span class="label">舒适音区</span>
            <span class="value" id="rangeComfortValue">--</span>
          </div>
          <div class="range-result-metric">
            <span class="label">稳定度</span>
            <span class="value" id="rangeStabilityValue">--%</span>
          </div>
          <div class="range-sample-metric">
            <span class="label">有效采样</span>
            <span class="value" id="rangeSampleValue">0</span>
          </div>
        </div>
        <p class="range-feedback" id="rangeFeedback" hidden>测试结束后会给出下一步练习建议。</p>
        <div class="range-actions">
          <button id="rangeSaveButton" class="secondary" type="button" disabled>保存本次结果</button>
          <button id="rangeResetButton" class="secondary" type="button">重新测试</button>
          <button id="rangeHistoryToggleButton" class="secondary" type="button">查看历史</button>
        </div>
      </section>

      <section class="range-history-panel" id="rangeHistoryPanel" hidden>
        <div class="range-history-header">
          <div>
            <h2>音域历史</h2>
            <span id="rangeHistorySummary">还没有保存记录</span>
          </div>
          <button id="rangeClearHistoryButton" class="secondary" type="button" disabled>清空历史</button>
        </div>
        <ol id="rangeHistoryList" class="range-history-list"></ol>
      </section>

      <section class="rhythm-dashboard" id="rhythmDashboard" hidden>
        <div class="rhythm-main">
          <span class="label">节奏评分</span>
          <span class="rhythm-score-value" id="rhythmScoreValue">--</span>
          <span class="rhythm-caption" id="rhythmCaption">设置 BPM 后点击开始，跟着高亮拍点发短音。</span>
        </div>
        <div class="rhythm-controls">
          <label class="field">
            <span class="label">BPM</span>
            <input id="rhythmBpmInput" class="input" type="number" min="40" max="220" step="1" value="90" />
          </label>
          <label class="field">
            <span class="label">拍号</span>
            <select id="rhythmMeterSelect" class="select">
              <option value="4">4/4</option>
              <option value="3">3/4</option>
              <option value="2">2/4</option>
            </select>
          </label>
          <label class="field">
            <span class="label">节奏型</span>
            <select id="rhythmPatternSelect" class="select">
              <option value="quarter">四分拍</option>
              <option value="eighth">八分拍</option>
              <option value="backbeat">二四拍</option>
            </select>
          </label>
          <label class="field">
            <span class="label">难度</span>
            <select id="rhythmDifficultySelect" class="select">
              <option value="easy">宽松</option>
              <option value="normal" selected>标准</option>
              <option value="hard">严格</option>
            </select>
          </label>
          <label class="toggle rhythm-click-toggle">
            <input type="checkbox" id="rhythmClickToggle" checked />
            <span class="toggle-pill"></span>
            <span class="toggle-text">节拍器</span>
          </label>
          <label class="toggle rhythm-song-toggle">
            <input type="checkbox" id="rhythmSongToggle" disabled />
            <span class="toggle-pill"></span>
            <span class="toggle-text">歌曲节奏</span>
          </label>
          <button id="rhythmExtractButton" class="secondary" type="button" disabled>提取当前歌曲</button>
          <button id="rhythmResetButton" class="secondary" type="button">重置</button>
        </div>
        <div class="rhythm-source" id="rhythmSourceStatus">上传歌曲后会自动提取 BPM 和拍点。</div>
        <div class="rhythm-track" id="rhythmTrack" aria-label="节奏拍点">
          <span data-beat="0">1</span>
          <span data-beat="1">2</span>
          <span data-beat="2">3</span>
          <span data-beat="3">4</span>
        </div>
        <div class="rhythm-grid">
          <div>
            <span class="label">命中率</span>
            <span class="value" id="rhythmHitRateValue">--%</span>
          </div>
          <div>
            <span class="label">平均偏差</span>
            <span class="value" id="rhythmAverageOffsetValue">-- ms</span>
          </div>
          <div>
            <span class="label">连击</span>
            <span class="value" id="rhythmStreakValue">0</span>
          </div>
          <div>
            <span class="label">最近一次</span>
            <span class="value" id="rhythmLastOffsetValue">--</span>
          </div>
        </div>
      </section>

      <section class="song-target-panel is-collapsed" id="songTargetPanel">
        <div class="song-target-header">
          <div>
            <h2>当前歌曲</h2>
            <p>按顺序完成一遍：准备歌曲、跟唱录音、自动复盘、只修一个重点。</p>
          </div>
          <button
            id="songTargetCollapseButton"
            class="secondary song-target-collapse-button"
            type="button"
            aria-expanded="false"
            aria-controls="songTargetContent"
          >
            设置
          </button>
        </div>
        <div class="song-target-content" id="songTargetContent" hidden>
          <div class="practice-flow" id="songPracticeFlow">
            <div class="practice-flow-header">
              <div>
                <h3 id="songPracticeSongTitle">还没有选择歌曲</h3>
                <p id="songPracticeFlowHint">选好歌曲后就可以开始唱。</p>
              </div>
              <span id="songPracticeFlowState" class="practice-flow-state">等待歌曲</span>
            </div>
            <div class="song-practice-meta">
              <span id="songPracticeTargetStatus">目标曲线：未生成</span>
              <span id="songPracticeAccompanimentStatus">伴奏：未选择</span>
            </div>
            <ol class="practice-flow-steps" aria-label="跟唱流程">
              <li id="songPracticeStepSong">
                <span>1</span>
                <strong>准备歌曲</strong>
              </li>
              <li id="songPracticeStepTarget">
                <span>2</span>
                <strong>生成目标</strong>
              </li>
              <li id="songPracticeStepRecord">
                <span>3</span>
                <strong>跟唱录音</strong>
              </li>
              <li id="songPracticeStepReview">
                <span>4</span>
                <strong>复盘下一遍</strong>
              </li>
            </ol>
            <div class="practice-flow-actions">
              <button id="songPracticeChooseButton" class="secondary" type="button">选择歌曲</button>
              <button id="songPracticeStartButton" type="button" disabled>开始跟唱</button>
            </div>
            <div class="song-chart-placeholder" id="songChartPlaceholder" hidden>
              录音后将在这里显示你的音高曲线和目标曲线
            </div>
          </div>

          <section class="song-practice-review" id="songPracticeReviewPanel" hidden>
            <div class="song-practice-review-header">
              <div>
                <span class="label">Mira 导航卡</span>
                <h3 id="songPracticeReviewTitle">等待完成一遍跟唱</h3>
              </div>
              <span id="songPracticeReviewBadge" class="song-practice-review-badge">等待</span>
            </div>
            <div class="song-practice-review-body">
              <p id="songPracticeReviewSummary">跟唱结束后会在这里看到本轮结果。</p>
              <p id="songPracticeReviewNextStep">下一遍会给你一个明确动作。</p>
            </div>
            <section class="song-practice-drill-card mira-navigation-card" id="songPracticeNavigationCard" hidden>
              <div class="song-practice-drill-header">
                <div>
                  <span class="label">现在只修这一句</span>
                  <strong id="songPracticeNavigationSegment">--</strong>
                </div>
                <span id="songPracticeDrillBadge" class="song-practice-drill-badge">等待</span>
              </div>
              <p id="songPracticeNavigationIssue">完成跟唱后，Mira 会自动定位最值得修的一句。</p>
              <p id="songPracticeNavigationAdvice" class="mira-navigation-advice">下一步会变成一个很小的动作。</p>
              <p id="songPracticeNavigationProgress" class="mira-navigation-progress">练完后 Mira 会告诉你有没有进步。</p>
              <div class="mira-navigation-actions">
                <button id="songPracticeStartFixButton" type="button">开始修这一句</button>
                <button id="songPracticePlayTargetSegmentButton" class="secondary" type="button" disabled>听目标</button>
                <button id="songPracticeRecordSegmentButton" class="secondary" type="button" disabled>录这一句</button>
              </div>
              <div class="mira-navigation-loop-actions">
                <button id="songPracticePracticeAgainButton" class="secondary" type="button" disabled>再练一次</button>
                <button id="songPracticeNextIssueButton" class="secondary" type="button" disabled>下一处</button>
                <button id="songPracticeBackOverviewButton" class="secondary" type="button">回到总览</button>
              </div>
            </section>
            <details class="song-practice-detail-report">
              <summary>查看分数</summary>
              <div class="song-practice-review-grid" aria-label="跟唱复盘指标">
                <div>
                  <span class="label">综合</span>
                  <span class="value" id="songPracticeReviewScore">--</span>
                </div>
                <div>
                  <span class="label">音准</span>
                  <span class="value" id="songPracticeReviewPitch">--</span>
                </div>
                <div>
                  <span class="label">节奏</span>
                  <span class="value" id="songPracticeReviewRhythm">--</span>
                </div>
                <div>
                  <span class="label">覆盖</span>
                  <span class="value" id="songPracticeReviewCoverage">--</span>
                </div>
              </div>
            </details>
            <section class="song-practice-drill-card" id="songPracticeDrillCard" hidden>
              <div class="song-practice-drill-header">
                <div>
                  <span class="label">练习小抄</span>
                  <strong id="songPracticeDrillSegment">--</strong>
                </div>
              </div>
              <p id="songPracticeDrillReason">完成跟唱后会自动定位最值得复盘的片段。</p>
              <ol class="song-practice-drill-steps" aria-label="片段练习步骤">
                <li id="songPracticeDrillStepListen">先回放重点片段，确认问题位置。</li>
                <li id="songPracticeDrillStepSlow">慢速或轻声唱 2 遍，只盯一个动作。</li>
                <li id="songPracticeDrillStepReturn">第 3 遍稳定后，再回到整段跟唱。</li>
              </ol>
            </section>
            <div class="song-practice-review-actions">
              <button id="songPracticeRepeatButton" type="button">整段再唱一遍</button>
              <button id="songPracticeReplaySegmentButton" class="secondary" type="button" disabled>回放重点片段</button>
              <button id="songPracticeReplayButton" class="secondary" type="button" disabled>回放录音</button>
              <button id="songPracticeReviewLibraryButton" class="secondary" type="button">查看录音库</button>
            </div>
          </section>

          <details class="song-assets-details song-target-details">
            <summary>
              <span>高级分析</span>
              <small>曲线、音量、共振峰、导出</small>
            </summary>
            <label class="toggle song-target-toggle">
              <input type="checkbox" id="songPitchToggle" checked />
              <span class="toggle-pill"></span>
              <span class="toggle-text">显示目标曲线</span>
            </label>
            <div class="song-target-controls">
              <div class="controls-inline song-target-playback">
                <button id="playSongPitchButton" class="secondary" disabled>播放</button>
                <button id="pauseSongPitchButton" class="secondary" disabled>暂停</button>
                <button id="stopSongPitchButton" class="secondary" disabled>停止</button>
              </div>
              <button id="clearSongPitchButton" class="secondary" disabled>清除曲线</button>
            </div>
            <div class="song-target-status">
              <div>
                <span class="label">提取状态</span>
                <span class="value" id="songPitchStatus">未加载</span>
              </div>
              <div>
                <span class="label">播放状态</span>
                <span class="value" id="songPitchPlaybackStatus">未加载</span>
              </div>
              <div>
                <span class="label">曲线信息</span>
                <span class="value" id="songPitchStats">--</span>
              </div>
              <div>
                <span class="label">训练结果</span>
                <span class="value" id="songTrainingResult">--</span>
              </div>
            </div>
          </details>
          <details class="song-assets-details">
            <summary>
              <span>乐谱 / 歌词 / 导出</span>
              <small>查看自动生成素材和编辑结果</small>
            </summary>
            <div class="vocal-score-panel" id="vocalScorePanel">
              <div class="vocal-score-header">
                <div>
                  <h3>人声乐谱</h3>
                  <span id="vocalScoreStatus">上传歌曲后自动生成</span>
                </div>
                <div class="controls-inline vocal-score-actions">
                  <div class="vocal-score-view-switch" aria-label="乐谱显示方式">
                    <button
                      id="vocalScoreStaffViewButton"
                      class="vocal-score-view-button active"
                      type="button"
                      aria-pressed="true"
                    >
                      五线谱
                    </button>
                    <button
                      id="vocalScoreJianpuViewButton"
                      class="vocal-score-view-button"
                      type="button"
                      aria-pressed="false"
                    >
                      简谱
                    </button>
                  </div>
                  <button id="copyVocalScoreButton" class="secondary" type="button" disabled>复制简谱</button>
                  <button id="downloadVocalScoreXmlButton" class="secondary" type="button" disabled>下载 MusicXML</button>
                  <button id="downloadVocalScoreCsvButton" class="secondary" type="button" disabled>下载 CSV</button>
                </div>
              </div>
              <div class="vocal-score-sheet" id="vocalScoreSheet">
                <canvas id="vocalScoreCanvas" width="960" height="260"></canvas>
              </div>
              <div class="vocal-score-jianpu-sheet" id="vocalScoreJianpuSheet" hidden>
                <canvas id="vocalScoreJianpuCanvas" width="960" height="360"></canvas>
              </div>
              <pre id="vocalScoreText" class="vocal-score-text" hidden>上传歌曲后，会把主旋律音高整理成可读简谱，并可导出 MusicXML 到打谱软件继续编辑。</pre>
            </div>
            <div class="song-lyrics-panel" id="songLyricsPanel">
              <div class="song-lyrics-header">
                <div>
                  <h3>歌词识别</h3>
                  <span>识别入口已移到录音库</span>
                </div>
                <div class="controls-inline song-lyrics-actions">
                  <button id="saveSongLyricsEditButton" class="secondary" type="button" disabled>保存编辑</button>
                  <button id="copySongLyricsButton" class="secondary" type="button" disabled>复制</button>
                  <button id="downloadSongLyricsButton" class="secondary" type="button" disabled>下载</button>
                </div>
              </div>
              <div class="song-lyrics-progress" id="songLyricsProgress" hidden>
                <div class="song-lyrics-progress-bar">
                  <span id="songLyricsProgressFill"></span>
                </div>
                <span id="songLyricsProgressText">准备识别...</span>
              </div>
              <textarea id="songLyricsText" class="song-lyrics-text" spellcheck="false">上传歌曲后，可以读取内嵌歌词，也可以启动本地 Whisper 服务后点击“Whisper识别”。</textarea>
              <div class="song-lyrics-alignment" id="songLyricsAlignmentPanel" hidden>
                <div class="song-lyrics-alignment-header">
                  <div>
                    <h3>歌词音高对应</h3>
                    <span id="songLyricsAlignmentStatus">等待歌词和音高曲线</span>
                  </div>
                  <button id="copySongLyricsAlignmentButton" class="secondary" type="button" disabled>复制映射</button>
                </div>
                <div id="songLyricsAlignmentText" class="song-lyrics-alignment-text"></div>
              </div>
            </div>
          </details>
        </div>
      </section>

      <section class="memory-dashboard" id="memoryDashboard" hidden>
        <div class="memory-zone-card" id="memoryZoneCard">
          <div>
            <span class="label" id="memoryStageLabel">目标音色保持训练</span>
            <span class="memory-zone-title" id="memoryZoneTitle">录一段完整路径</span>
            <span class="memory-zone-copy" id="memoryZoneCopy">自然声音 → 接近目标 → 保持目标 → 回到自然。系统会分析你最容易丢失哪些音色特征。</span>
          </div>
          <span class="memory-zone-badge" id="memoryZoneBadge">--</span>
        </div>
        <div class="memory-path-panel" id="memoryPathPanel">
          <span>自然声音</span>
          <span>接近目标</span>
          <span>保持目标</span>
          <span>回到自然</span>
        </div>
        <div class="memory-controls">
          <label class="field">
            <span class="label">目标音色</span>
            <select id="memoryTargetSelect" class="select">
              <option value="brightStable">明亮稳定元音</option>
              <option value="clearSoft">清晰柔和闭合</option>
              <option value="darkWarm">偏暗温暖共鸣</option>
              <option value="lightBreathy">轻气声过渡</option>
            </select>
          </label>
          <label class="field">
            <span class="label">尝试路径</span>
            <select id="memoryPathSelect" class="select">
              <option value="neutralBright">neutral → bright</option>
              <option value="breathyClear">breathy → clear</option>
              <option value="darkBright">dark → bright</option>
              <option value="pressedRelease">pressed → release</option>
              <option value="softLoud">soft → loud</option>
              <option value="sovtReset">SOVT reset</option>
              <option value="siren">siren approach</option>
            </select>
          </label>
          <label class="field">
            <span class="label">下一步练习方向</span>
            <select id="memoryInstructionSelect" class="select">
              <option value="auto">自动选择</option>
              <option value="reduceBreathiness">减少气声 / 提高声源稳定</option>
              <option value="healthyClosure">增加健康闭合</option>
              <option value="releasePressed">释放压紧闭合</option>
              <option value="keepBreathy">保留气声色彩</option>
            </select>
          </label>
          <button id="memoryAnalyzeButton" class="secondary" disabled>分析最近录音</button>
        </div>
        <div class="memory-result-panel" id="memoryResultPanel" hidden>
          <div>
            <span class="label">最容易丢失的特征</span>
            <strong id="memoryLostFeatures">等待分析</strong>
          </div>
          <div>
            <span class="label">主要问题</span>
            <p id="memoryMainProblem">录音结束后会显示你在哪一步最容易回到自然状态。</p>
          </div>
          <div>
            <span class="label">下一步练习建议</span>
            <p id="memoryNextAdvice">每次只改变一个音色特征，不要同时追求所有目标。</p>
          </div>
        </div>
        <details class="memory-research-panel" id="memoryResearchPanel" hidden>
          <summary>
            <span>详细数据 / 研究模式</span>
            <small>Esound、E[u]、Rε、φSN、φEtex</small>
          </summary>
        <div class="memory-metrics">
          <div>
            <span class="label">目标误差 Esound</span>
            <span class="value" id="memorySoundError">--</span>
          </div>
          <div>
            <span class="label">隐藏负荷 E[u]</span>
            <span class="value" id="memoryHiddenLoad">--</span>
          </div>
          <div>
            <span class="label">协调复杂度 Rε</span>
            <span class="value" id="memoryRank">--</span>
          </div>
          <div>
            <span class="label">恢复延迟 R[K]</span>
            <span class="value" id="memoryRecovery">--</span>
          </div>
          <div>
            <span class="label">声源稳定 ΦSN</span>
            <span class="value" id="memoryPhiSn">--</span>
          </div>
          <div>
            <span class="label">包络纹理 ΦEtex</span>
            <span class="value" id="memoryPhiEtex">--</span>
          </div>
          <div>
            <span class="label">估计气声</span>
            <span class="value" id="memoryBreathiness">--</span>
          </div>
          <div>
            <span class="label">估计闭合</span>
            <span class="value" id="memoryClosure">--</span>
          </div>
        </div>
        <div class="memory-control-field" id="memoryControlField">
          <div>
            <span class="label">研究模式：控制场判断</span>
            <span class="memory-field-title" id="memoryControlTitle">等待控制场分析</span>
            <span class="memory-field-copy" id="memoryControlCopy">
              S84 思路：比较目标差距和教学指令的预计移动方向，而不只判断当前声音像不像目标。
            </span>
          </div>
          <span class="memory-field-score" id="memoryControlScore">--</span>
        </div>
        </details>
        <div class="memory-recommendation" id="memoryRecommendation">暂无路径推荐。</div>
      </section>

      <section class="s88-dashboard" id="s88Dashboard" data-phase="needs-target" hidden>
        <div class="s88-status-row">
          <span>目标音色：<strong id="s88TargetStepStatus">未上传</strong></span>
          <span>当前录音：<strong id="s88RecordingStepStatus">未录制</strong></span>
          <span>分析状态：<strong id="s88AnalysisStepStatus">等待</strong></span>
        </div>
        <section class="s88-recommendation-card">
          <span class="label">推荐动作</span>
          <h2 id="s88TrajectoryValue">先准备目标和录音</h2>
          <div class="s88-confidence-row">
            <span id="s88RecommendationStars">☆☆☆☆☆</span>
            <span id="s88RecommendationConfidence">等待对比</span>
          </div>
          <p id="s88Advice">先录制当前声音并上传目标声音，系统会推荐下一步动作。</p>
        </section>

        <div class="s88-path-diagram" id="s88PathDiagram" aria-label="动作路径">
          <span>当前声音</span>
          <strong id="s88PathAction">推荐动作</strong>
          <span>目标音色</span>
        </div>

        <div class="s88-guidance-grid">
          <div>
            <span class="label">练习方法</span>
            <p id="s88PracticeMethod">准备好目标音色和当前录音后，这里会给出具体练法。</p>
          </div>
          <div>
            <span class="label">为什么练这个</span>
            <p id="s88Reason">分析完成后，这里会解释为什么优先练这个动作。</p>
          </div>
        </div>

        <div class="s88-result-actions" id="s88ResultActions" hidden>
          <button id="s88RerecordButton" class="secondary" type="button">重新录制</button>
          <button id="s88AdvancedToggleButton" class="ghost" type="button">查看高级分析</button>
        </div>

        <section class="s88-action-grid" aria-label="完整动作分析">
          <article class="s88-action-card" id="s88BreathinessCard">
            <span class="label">气声</span>
            <strong id="s88BreathinessAdvice">--</strong>
            <span class="s88-action-strength" id="s88BreathinessStrength">--</span>
            <p id="s88BreathinessCopy">上传目标声音并对比录音后显示调整方向。</p>
          </article>
          <article class="s88-action-card" id="s88ClosureCard">
            <span class="label">闭合</span>
            <strong id="s88ClosureAdvice">--</strong>
            <span class="s88-action-strength" id="s88ClosureStrength">--</span>
            <p id="s88ClosureCopy">系统会判断需要更清晰闭合，还是放松压力。</p>
          </article>
          <article class="s88-action-card" id="s88TwangCard">
            <span class="label">集中度</span>
            <strong id="s88TwangAdvice">--</strong>
            <span class="s88-action-strength" id="s88TwangStrength">--</span>
            <p id="s88TwangCopy">练习声音集中度和明亮感，不只看高频能量。</p>
          </article>
          <article class="s88-action-card" id="s88OnsetCard">
            <span class="label">起音</span>
            <strong id="s88OnsetAdvice">--</strong>
            <span class="s88-action-strength" id="s88OnsetStrength">--</span>
            <p id="s88OnsetCopy">系统会关注开始发声的前 300 ms 是否过硬或过软。</p>
          </article>
        </section>

        <div class="s88-target-panel">
          <div>
            <span class="label">目标声音对比</span>
            <strong id="s88TargetStatus">尚未上传目标声音</strong>
            <span id="s88MatchingStatus">目标匹配：等待目标音频</span>
          </div>
          <label class="s88-target-library-field">
            <span class="label">从录音库选择</span>
            <select id="s88TargetLibrarySelect" class="select">
              <option value="">录音库暂无可用录音</option>
            </select>
          </label>
          <input id="s88TargetInput" class="file-input" type="file" accept="audio/*" />
          <button id="s88CompareButton" class="secondary" type="button" disabled>对比最近录音</button>
          <span id="s88UserStatus">录制你的声音后，对比目标声音并生成动作建议。</span>
        </div>

        <details class="s88-advanced-panel" id="s88AdvancedPanel">
          <summary>
            <span>高级分析</span>
            <small>phi、耦合和动作特征</small>
          </summary>
          <div class="s88-advanced-grid">
            <div>
              <span class="label">Delta phiSN</span>
              <span class="value" id="s88PhiSnDelta">--</span>
            </div>
            <div>
              <span class="label">Delta phiEtex</span>
              <span class="value" id="s88PhiEtexDelta">--</span>
            </div>
            <div>
              <span class="label">Twang-like path</span>
              <span class="value" id="s88TwangValue">--%</span>
            </div>
            <div>
              <span class="label">Onset hardness</span>
              <span class="value" id="s88OnsetValue">--%</span>
            </div>
            <div>
              <span class="label">Pitch/loudness coupling</span>
              <span class="value" id="s88CouplingValue">--</span>
            </div>
            <div>
              <span class="label">Action residual</span>
              <span class="value" id="s88ResidualValue">--</span>
            </div>
            <div>
              <span class="label">matchedSegmentCount</span>
              <span class="value" id="s88MatchedSegmentCount">--</span>
            </div>
            <div>
              <span class="label">matchingQuality</span>
              <span class="value" id="s88MatchingQuality">--</span>
            </div>
            <div>
              <span class="label">pitchDifference</span>
              <span class="value" id="s88PitchDifference">--</span>
            </div>
            <div>
              <span class="label">vowelDistance</span>
              <span class="value" id="s88VowelDistance">--</span>
            </div>
            <div>
              <span class="label">loudnessDifference</span>
              <span class="value" id="s88LoudnessDifference">--</span>
            </div>
            <div>
              <span class="label">targetContaminationScore</span>
              <span class="value" id="s88TargetContaminationScore">--</span>
            </div>
          </div>
        </details>
      </section>

      <div class="score-chart-placeholder" id="scoreChartPlaceholder" hidden>
        开始检测后将在这里显示实时音高曲线
      </div>

      <section class="breath-report" id="breathReport" hidden>
        <div class="breath-report-header">
          <h2>本次反馈</h2>
          <span id="breathReportSummary">--</span>
        </div>
        <div class="breath-report-grid">
          <div>
            <span class="label">平均评分</span>
            <span class="value" id="breathReportAverage">--%</span>
          </div>
          <div>
            <span class="label">峰值评分</span>
            <span class="value" id="breathReportPeak">--%</span>
          </div>
          <div>
            <span class="label">平均气流</span>
            <span class="value" id="breathReportEffort">--%</span>
          </div>
          <div>
            <span class="label">平均高频气声</span>
            <span class="value" id="breathReportHighFrequency">--%</span>
          </div>
          <div>
            <span class="label">平均漏气噪声</span>
            <span class="value" id="breathReportLeakNoise">--%</span>
          </div>
          <div>
            <span class="label">主导类型</span>
            <span class="value" id="breathReportVoiceType">--</span>
          </div>
          <div>
            <span class="label">中断次数</span>
            <span class="value" id="breathReportBreaks">--</span>
          </div>
        </div>
        <p id="breathReportFeedback" class="breath-report-feedback">--</p>
      </section>

      <div class="breath-chart-placeholder" id="breathChartPlaceholder" hidden>
        开始检测后，这里会显示你的气流稳定曲线
      </div>

      <section class="chart">
        <div class="chart-practice-feedback" id="s88LiveFeedbackPanel" hidden>
          <div>
            <span class="label">实时练习反馈</span>
            <strong id="s88LiveFeedback">等待开始练习</strong>
          </div>
        </div>
        <div class="meter-column" id="volumeMeterColumn">
          <div class="meter" id="volumeMeter">
            <span class="meter-title">音量</span>
            <div class="meter-bar" id="volumeMeterBar"></div>
            <div class="meter-ticks">
              <span>0 dB</span>
              <span>-20</span>
              <span>-40</span>
              <span>-60</span>
            </div>
          </div>
        </div>
        <canvas id="pitchCanvas" width="720" height="360"></canvas>
        <div class="meter-column" id="tiltMeterColumn">
          <div class="meter" id="tiltMeter">
            <span class="meter-title">倾斜</span>
            <div class="meter-bar" id="tiltMeterBar"></div>
            <div class="meter-ticks">
              <span>+30</span>
              <span>+10</span>
              <span>-10</span>
              <span>-30</span>
            </div>
          </div>
        </div>
        <div class="chart-legend">
          <span id="chartLegendLow">低音</span>
          <span id="chartLegendHigh">高音</span>
        </div>
      </section>

      <details class="curve-switcher-details" id="curveSwitcherDetails" hidden>
        <summary>
          <span>高级分析</span>
          <small>曲线、音量、共振峰</small>
        </summary>
        <section class="curve-switcher" id="curveSwitcher" hidden>
          <button id="songGameViewButton" class="curve-tab active" type="button">游戏谱面</button>
          <button id="curvePitchButton" class="curve-tab" type="button">分析曲线</button>
          <button id="curveVolumeButton" class="curve-tab" type="button">音量曲线</button>
          <button id="curveFormantButton" class="curve-tab" type="button">共振峰曲线</button>
        </section>
      </details>

      <section class="practice-controls" id="practiceControls">
        <div class="controls-main">
          <button id="startButton" data-task-control="curve classic score breath range spectrogram volume formants memory rhythm action">开始练习</button>
          <button id="pauseButton" class="secondary" data-task-control="curve classic score breath range spectrogram volume formants memory rhythm action" disabled>暂停</button>
          <button id="stopButton" data-task-control="curve classic score breath range spectrogram volume formants memory rhythm action" disabled>停止</button>
          <button id="recordButton" class="secondary" hidden aria-hidden="true">开始录音</button>
          <button id="stopRecordButton" class="secondary" hidden aria-hidden="true" disabled>停止录音</button>
          <button id="breathCalibrateButton" class="secondary breath-control" data-task-control="breath" hidden>校准环境</button>
          <button id="breathDetailToggleButton" class="secondary breath-control" data-task-control="breath" hidden>查看详细数据</button>
          <div class="status" id="status">未开始</div>
        </div>
      </section>

      <section class="offline-window-control" id="offlineWindowControl" hidden>
        <div class="offline-window-meta">
          <span id="offlineWindowStartValue">0.00s</span>
          <span id="offlineWindowEndValue">12.00s</span>
        </div>
        <input
          type="range"
          id="offlineWindowRange"
          min="0"
          max="0"
          step="0.1"
          value="0"
          aria-label="离线音高曲线进度"
        />
        <div class="offline-window-meta">
          <span>当前窗口</span>
          <span id="offlineWindowDurationValue">--</span>
        </div>
      </section>

      <section class="pitch-inspector" id="pitchInspectorPanel" hidden>
        <span class="label">选中音高</span>
        <span class="value" id="selectedPitchValue">--</span>
        <span class="hint" id="selectedPitchHint">点击音高曲线查看对应时间点</span>
      </section>

      <section class="recording-timeline" id="recordingTimelinePanel" hidden>
        <div class="timeline-header">
          <div>
            <h2>录音时间轴</h2>
            <span id="recordingTimelineStatus">录音后可点击时间轴回放</span>
          </div>
          <button id="timelinePlayPauseButton" class="secondary" disabled>播放</button>
        </div>
        <canvas id="recordingTimelineCanvas" width="720" height="96"></canvas>
        <div class="waveform-detail">
          <div>
            <span class="label">当前片段</span>
            <span class="value" id="waveformTimeValue">--</span>
          </div>
          <canvas id="waveformPreviewCanvas" width="720" height="120"></canvas>
        </div>
      </section>

      <div class="resize-handle resize-handle-top" data-resize="n" aria-hidden="true"></div>
      <div class="resize-handle resize-handle-right" data-resize="e" aria-hidden="true"></div>
      <div class="resize-handle resize-handle-bottom" data-resize="s" aria-hidden="true"></div>
      <div class="resize-handle resize-handle-left" data-resize="w" aria-hidden="true"></div>
      <div class="resize-handle resize-handle-top-left" data-resize="nw" aria-hidden="true"></div>
      <div class="resize-handle resize-handle-top-right" data-resize="ne" aria-hidden="true"></div>
      <div class="resize-handle resize-handle-bottom-right" data-resize="se" aria-hidden="true"></div>
      <div class="resize-handle resize-handle-bottom-left" data-resize="sw" aria-hidden="true"></div>
    </main>

    `;
})();
