// Static library markup for the voice training app shell.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.library = String.raw`<section class="library-page" id="libraryPage" hidden>
      <div class="library-page-card">
        <div class="library-page-header">
          <div>
            <span class="launcher-kicker">素材库</span>
            <h1 id="libraryPageTitle">录音库</h1>
            <p id="libraryPageDescription">管理录音、歌曲目标和分析结果。</p>
          </div>
          <div class="library-page-actions">
            <button id="libraryOpenCurveButton" type="button">去音高曲线</button>
            <button id="libraryBackButton" class="secondary" type="button">← 返回首页</button>
          </div>
        </div>

        <div class="library-page-switcher" aria-label="素材库切换">
          <button id="recordingLibraryTabButton" class="curve-tab active" type="button">录音库</button>
          <button id="successLibraryTabButton" class="curve-tab" type="button">我的最佳时刻</button>
          <button id="accompanimentLibraryTabButton" class="curve-tab" type="button">伴奏库</button>
        </div>

        <section class="library-tools" id="libraryToolsPanel">
          <div class="library-tool-card">
            <div>
              <h2>上传歌曲</h2>
              <p>导入歌曲后会生成目标曲线，并保存到录音库。</p>
            </div>
            <input type="file" id="songPitchInput" accept="audio/*" class="file-input song-target-file" />
          </div>
          <div class="library-tool-card">
            <div>
              <h2>人声/伴奏分离</h2>
              <p id="songSeparationStatus" class="song-separation-status">上传歌曲后会自动尝试分离人声和伴奏。</p>
            </div>
            <button id="separateSongButton" class="secondary" type="button" disabled>分离当前歌曲</button>
          </div>
          <div class="library-tool-card lyrics-tool-card">
            <div>
              <h2>歌词语音识别</h2>
              <p id="songLyricsStatus">上传歌曲或人声后，可以启动本地 Whisper 服务识别歌词。</p>
            </div>
            <div class="controls-inline song-lyrics-actions">
              <select id="songLyricsLanguageSelect" class="select song-lyrics-language" aria-label="Whisper识别语言">
                <option value="auto">自动</option>
                <option value="ja">日语</option>
                <option value="zh">中文</option>
                <option value="en">英语</option>
                <option value="ko">韩语</option>
              </select>
              <select id="songLyricsModelSelect" class="select song-lyrics-model" aria-label="Whisper模型">
                <option value="small" selected>small 快</option>
                <option value="medium">medium 准</option>
                <option value="large-v3">large-v3 最准</option>
                <option value="base">base 很快</option>
              </select>
              <button id="transcribeSongLyricsButton" class="secondary" type="button" disabled>Whisper识别</button>
            </div>
          </div>
        </section>

        <section class="recording-library library-page-panel" id="recordingLibraryPanel">
          <div class="recording-library-header">
            <div>
              <h2>录音库</h2>
              <span id="recordingLibraryStatus">暂无录音</span>
            </div>
          </div>
          <div class="recording-library-list" id="recordingLibraryList"></div>
        </section>

        <section class="recording-library accompaniment-library library-page-panel" id="accompanimentLibraryPanel" hidden>
          <div class="recording-library-header">
            <div>
              <h2>伴奏库</h2>
              <span id="accompanimentLibraryStatus">暂无伴奏</span>
            </div>
          </div>
          <div class="recording-library-list" id="accompanimentLibraryList"></div>
        </section>

        <section class="recording-library success-library library-page-panel" id="successLibraryPanel" hidden>
          <div class="recording-library-header">
            <div>
              <h2>我的最佳时刻</h2>
              <span id="successLibraryStatus">Mira 会自动收藏你的好状态</span>
            </div>
          </div>
          <div class="success-library-summary" id="successLibrarySummary">
            <span>今天 --</span>
            <span>本周 --</span>
            <span>本月 --</span>
            <span>历史最佳 --</span>
          </div>
          <div class="recording-library-list success-library-list" id="successLibraryList"></div>
          <section class="success-compare-panel" id="successComparePanel" hidden>
            <div class="success-compare-header">
              <div>
                <span class="label">Why Was This Better?</span>
                <h3>为什么这次更好？</h3>
                <p id="successCompareSubtitle">Mira 会把这次好状态和一条普通录音放在一起看。</p>
              </div>
              <button class="secondary recording-library-action" id="successCompareCloseButton" type="button">收起</button>
            </div>
            <div class="success-compare-controls">
              <label>
                成功样本 B
                <select id="successCompareSampleSelect"></select>
              </label>
              <label>
                对比样本 A
                <select id="successCompareBaselineSelect"></select>
              </label>
            </div>
            <div class="success-compare-body" id="successCompareBody"></div>
          </section>
        </section>
      </div>
    </section>

    `;
})();
