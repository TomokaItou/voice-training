// Static markup for song analysis page.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.songAnalysis = String.raw`
    <section class="song-analysis-page" id="songAnalysisPage" hidden>
      <header class="song-analysis-header">
        <div>
          <span class="game-label">Song Analysis</span>
          <h1>歌曲分析</h1>
          <p>上传一首歌，我会先把歌曲切成可练习的小片段。第一版只分析歌曲本身，不做声乐诊断。</p>
        </div>
        <button id="songAnalysisBackButton" class="secondary" type="button">返回首页</button>
      </header>

      <main class="song-analysis-layout">
        <section class="song-analysis-uploader">
          <div class="song-analysis-upload-box">
            <input id="songAnalysisInput" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/aac,.mp3,.wav,.m4a" />
            <div>
              <strong>上传歌曲音频</strong>
              <p>支持 mp3 / wav / m4a。上传后会自动估计 BPM、能量曲线、音高轨迹和乐句片段。</p>
            </div>
          </div>
          <div class="song-analysis-library-box">
            <div>
              <strong>从录音库选择歌曲</strong>
              <p>选择已经保存到录音库的歌曲或音频，直接进入歌曲分析。</p>
            </div>
            <div class="song-analysis-library-controls">
              <select id="songAnalysisLibrarySelect" aria-label="从录音库选择歌曲">
                <option value="">正在读取录音库...</option>
              </select>
              <button id="songAnalysisLoadLibraryButton" type="button" class="secondary">分析所选歌曲</button>
            </div>
          </div>
          <div class="song-analysis-song-card" id="songAnalysisSongCard" hidden>
            <div>
              <span class="label">当前歌曲</span>
              <h2 id="songAnalysisSongName">--</h2>
              <p id="songAnalysisSongMeta">--</p>
            </div>
            <audio id="songAnalysisAudio" controls></audio>
          </div>
          <p class="song-analysis-status" id="songAnalysisStatus">还没有上传歌曲。</p>
        </section>

        <section class="song-analysis-overview" id="songAnalysisOverview" hidden>
          <div class="song-analysis-stats">
            <div><span>时长</span><strong id="songAnalysisDuration">--</strong></div>
            <div><span>BPM</span><strong id="songAnalysisBpm">--</strong></div>
            <div><span>片段</span><strong id="songAnalysisSegmentCount">--</strong></div>
          </div>
          <canvas id="songAnalysisWaveformCanvas" width="960" height="180" aria-label="energy waveform"></canvas>
        </section>

        <section class="song-analysis-recommendation" id="songAnalysisRecommendation" hidden>
          <div>
            <span class="game-label">推荐练习顺序</span>
            <h2>先短、再中等、最后难。</h2>
            <p>不要默认从第一句开始。先找容易完成的小片段建立手感。</p>
          </div>
          <div id="songAnalysisOrderList" class="song-analysis-order-list"></div>
        </section>

        <section class="song-analysis-requirement" id="songAnalysisRequirementPanel" hidden>
          <div class="song-requirement-teacher-card" id="songRequirementTodayTaskCard"></div>
          <p class="song-requirement-summary-line" id="songRequirementSummaryLine">--</p>
          <div class="song-requirement-next-step" id="songRequirementNextStep" hidden></div>

          <details class="song-requirement-analysis-details">
            <summary>查看完整歌曲分析</summary>
            <div class="song-requirement-analysis-body">
              <div class="song-requirement-hero compact">
                <div>
                  <span class="game-label">Song Requirement</span>
                  <h2>完整歌曲分析</h2>
                  <p id="songRequirementAiSummary">--</p>
                </div>
                <div class="song-requirement-difficulty">
                  <span>总体难度</span>
                  <strong id="songRequirementDifficulty">--</strong>
                  <ul id="songRequirementDifficultyReasons"></ul>
                </div>
              </div>

              <div class="song-requirement-focus-row">
                <div class="song-requirement-today">
                  <span class="label">今天只关注</span>
                  <ol id="songRequirementTodayFocus"></ol>
                </div>
                <div>
                  <span class="label">最需要的能力</span>
                  <div id="songRequirementTopSkills" class="song-requirement-skill-list"></div>
                </div>
                <div>
                  <span class="label">你可能最容易卡住的地方</span>
                  <p id="songRequirementStuckPoint">--</p>
                </div>
              </div>

              <div class="song-requirement-map-block">
                <div class="song-analysis-section-title compact">
                  <div>
                    <span class="game-label">Mini Map</span>
                    <h2>关键难点位置</h2>
                  </div>
                </div>
                <div id="songRequirementMiniTimeline" class="song-requirement-mini-timeline"></div>
                <div id="songRequirementMiniDetail" class="song-requirement-mini-detail" hidden></div>
                <details class="song-requirement-full-map">
                  <summary>查看完整歌曲训练地图</summary>
                  <div class="song-requirement-legend">
                    <span class="easy">容易</span>
                    <span class="medium">中等</span>
                    <span class="hard">困难</span>
                    <span class="marker">关键难点</span>
                  </div>
                  <div id="songRequirementTimeline" class="song-requirement-timeline"></div>
                </details>
              </div>

              <div class="song-requirement-task-block">
                <div>
                  <span class="label">推荐练习顺序</span>
                  <div id="songRequirementOrderList" class="song-requirement-route-list"></div>
                </div>
                <div>
                  <span class="label">全部难点片段</span>
                  <div id="songRequirementTaskList" class="song-requirement-task-list"></div>
                </div>
              </div>

              <div class="song-requirement-grid">
                <div><strong>音域要求</strong><p id="songRequirementRange">--</p></div>
                <div><strong>音准要求</strong><p id="songRequirementPitch">--</p></div>
                <div><strong>节奏要求</strong><p id="songRequirementRhythm">--</p></div>
                <div><strong>气息要求</strong><p id="songRequirementBreath">--</p></div>
                <div><strong>咬字要求</strong><p id="songRequirementDiction">--</p></div>
                <div><strong>声区要求</strong><p id="songRequirementRegister">--</p></div>
                <div><strong>音色要求</strong><p id="songRequirementTone">--</p></div>
              </div>
            </div>
          </details>
        </section>
        <section class="song-analysis-segments" id="songAnalysisSegmentsPanel" hidden>
          <div class="song-analysis-section-title">
            <div>
              <span class="game-label">Practice Segments</span>
              <h2>可练习片段</h2>
            </div>
          </div>
          <div id="songAnalysisSegmentList" class="song-analysis-segment-list"></div>
        </section>
      </main>
    </section>
  `;
})();

