// Static markup for AI vocal teacher v0.1.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.aiVocalTeacher = String.raw`
    <section class="ai-teacher-page" id="aiVocalTeacherPage" hidden>
      <header class="ai-teacher-header">
        <div>
          <span class="game-label">AI 一对一声乐老师</span>
          <h1>Lesson Mode</h1>
          <p id="aiTeacherStepText">我先听一条短声音。今天只练一件事，练完马上复测。</p>
        </div>
        <button id="aiTeacherBackHomeButton" class="secondary" type="button">返回首页</button>
      </header>

      <main class="ai-teacher-layout">
        <section class="ai-teacher-current">
          <div class="ai-teacher-phase" id="aiTeacherPhaseLabel">声音扫描</div>
          <h2 id="aiTeacherTaskName">第一步：录一个稳定的 /a/</h2>
          <p id="aiTeacherTaskInstruction">请舒服地唱 “aaaaaa”</p>
          <div class="ai-teacher-duration" id="aiTeacherDurationHint">持续 2 到 4 秒</div>

          <div class="ai-teacher-progress-meter" aria-label="Voice Scan Progress">
            <div class="ai-teacher-progress-header">
              <span>Voice Scan Progress</span>
              <strong id="aiTeacherProgressPercent">0%</strong>
            </div>
            <div class="ai-teacher-progress-track" aria-hidden="true">
              <span id="aiTeacherProgressFill"></span>
            </div>
            <small id="aiTeacherAttemptCounter">已完成 0 / 25 条录音</small>
          </div>

          <div class="ai-teacher-recording-indicator" id="aiTeacherRecordingIndicator" hidden>
            <div class="ai-teacher-breath-circle" aria-hidden="true">
              <span></span>
              <span></span>
            </div>
            <div>
              <strong>正在听你唱……</strong>
              <p>保持 2 到 4 秒，我会自动保存。</p>
            </div>
          </div>

          <div class="ai-teacher-feedback" id="aiTeacherInstantFeedback" hidden></div>

          <div class="ai-teacher-actions">
            <button id="aiTeacherStartButton" type="button">开始录音</button>
            <button id="aiTeacherSongFirstButton" class="secondary" type="button">用歌曲短句开始</button>
            <button id="aiTeacherRecordButton" type="button" disabled hidden>继续录下一次</button>
            <button id="aiTeacherStopButton" class="secondary" type="button" disabled hidden>停止录音</button>
            <button id="aiTeacherAnalyzeButton" type="button" disabled hidden>查看诊断</button>
          </div>
          <p class="ai-teacher-status" id="aiTeacherStatus">不用唱完整首歌。每条只要 2 到 4 秒。</p>
        </section>

        <section class="ai-teacher-progress" aria-label="练习进度">
          <h2>今天的声音扫描</h2>
          <div id="aiTeacherTaskList" class="ai-teacher-task-list"></div>
        </section>
      </main>

      <section class="ai-teacher-results" id="aiTeacherResults" hidden>
        <section class="ai-teacher-action-card" id="aiTeacherActionCard">
          <span class="game-label">今日练习计划</span>
          <div class="ai-teacher-action-step">
            <strong>① 今天目标</strong>
            <p id="aiTeacherMainFinding">--</p>
          </div>
          <div class="ai-teacher-action-step">
            <strong>② 今天只做</strong>
            <p id="aiTeacherOneThing">--</p>
          </div>
          <div class="ai-teacher-action-step">
            <strong>③ 怎么做</strong>
            <p id="aiTeacherPracticeInstruction">--</p>
          </div>
          <button id="aiTeacherStartPracticeButton" type="button">开始今日练习</button>
          <button id="aiTeacherContinuePracticeButton" type="button" hidden>继续这个练习</button>
          <button id="aiTeacherSimplerPracticeButton" class="secondary" type="button" hidden>换一个更简单的练习</button>
          <small>详细分析已收起，想看数据可以展开。</small>
        </section>

        <details class="ai-teacher-details" id="aiTeacherDetailsPanel">
          <summary>专业模式</summary>
          <div id="aiTeacherDetailsContent"></div>
        </details>

        <section class="ai-teacher-memory-dashboard" id="aiTeacherMemoryDashboard" aria-label="Learner Memory">
          <div class="ai-teacher-section-header">
            <div>
              <span class="game-label">Learner Memory</span>
              <h2>Memory Dashboard</h2>
            </div>
            <button id="aiTeacherResearchToggleButton" class="secondary" type="button">Research Mode</button>
          </div>
          <div id="aiTeacherMemoryBars" class="ai-teacher-memory-bars"></div>
          <div id="aiTeacherMemoryTimeline" class="ai-teacher-memory-timeline"></div>
        </section>

        <section class="ai-teacher-diary" id="aiTeacherDiaryPanel">
          <span class="game-label">AI Teacher Diary</span>
          <p id="aiTeacherDiaryText">完成训练后，我会写下这次观察。</p>
        </section>

        <div class="ai-teacher-result-summary">
          <div>
            <span class="game-label">我先帮你看这一处</span>
            <h2 id="aiTeacherDominantTask">--</h2>
            <p id="aiTeacherDiagnosis">完成 25 条短录音后，我会告诉你先练哪个方向。</p>
            <p id="aiTeacherTrendText" class="ai-teacher-trend-text">趋势会在多次训练后出现。</p>
          </div>
          <div class="ai-teacher-score-card">
            <span>Confidence</span>
            <strong id="aiTeacherConfidenceScore">--</strong>
            <small id="aiTeacherConfidenceHint">继续录几次，我会更确定。</small>
          </div>
          <div class="ai-teacher-score-card">
            <span>Instability</span>
            <strong id="aiTeacherDominantScore">--</strong>
          </div>
        </div>

        <div class="ai-teacher-hypothesis" id="aiTeacherHypothesisPanel">
          <span class="label">我目前认为</span>
          <div id="aiTeacherHypothesisList"></div>
        </div>

        <div class="ai-teacher-direction">
          <span class="label">主要变化方向</span>
          <strong id="aiTeacherDominantFeatures">--</strong>
        </div>
        <div class="ai-teacher-best-attempt" id="aiTeacherBestAttemptPanel" hidden>
          <div>
            <span class="label">这组里最值得听的对比</span>
            <strong id="aiTeacherBestAttemptText">本轮最稳定的一次：--</strong>
            <p id="aiTeacherBestAttemptWhy">这条最接近你目前真正能做到的状态。</p>
          </div>
          <div class="ai-teacher-playback-actions">
            <button id="aiTeacherPlayBestButton" class="secondary" type="button">播放最佳录音</button>
            <button id="aiTeacherPlayWorstButton" class="secondary" type="button">播放最不稳定录音</button>
          </div>
        </div>
        <div class="ai-teacher-recommendation">
          <span class="label">接下来试试</span>
          <p id="aiTeacherRecommendation">--</p>
          <button id="aiTeacherStartReprobeButton" type="button" disabled>练完了，开始复测</button>
        </div>

        <details class="ai-teacher-explainability" id="aiTeacherExplainabilityPanel">
          <summary>为什么这么判断？</summary>
          <div id="aiTeacherExplainabilityBody"></div>
        </details>

        <section class="ai-teacher-research" id="aiTeacherResearchPanel" hidden>
          <div class="ai-teacher-section-header">
            <div>
              <span class="game-label">Research Mode</span>
              <h2>Estimator Snapshot</h2>
            </div>
          </div>
          <pre id="aiTeacherResearchJson"></pre>
        </section>

        <div class="ai-teacher-estimates" id="aiTeacherEstimateList"></div>
      </section>

      <section class="ai-teacher-comparison" id="aiTeacherComparison" hidden>
        <span class="game-label">复测结果</span>
        <h2 id="aiTeacherComparisonTitle">等待复测</h2>
        <div class="ai-teacher-comparison-grid">
          <div>
            <span>Before instability</span>
            <strong id="aiTeacherBeforeScore">--</strong>
          </div>
          <div>
            <span>After instability</span>
            <strong id="aiTeacherAfterScore">--</strong>
          </div>
          <div>
            <span>Change</span>
            <strong id="aiTeacherChangeScore">--</strong>
          </div>
        </div>
        <p id="aiTeacherComparisonText">现在我们再录同一个任务 5 次，看看练习有没有让这个方向更稳定。</p>
      </section>
    </section>
  `;
})();
