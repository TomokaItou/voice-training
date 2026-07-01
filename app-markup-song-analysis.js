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
