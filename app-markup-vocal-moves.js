// Static Vocal Move Library markup for the voice training app shell.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.vocalMoves = String.raw`<section class="vocal-move-page" id="vocalMoveLibraryPage" hidden>
      <div class="vocal-move-page-card">
        <div class="vocal-move-header">
          <div>
            <span class="launcher-kicker">Vocal Move Library</span>
            <h1>动作图鉴</h1>
            <p>不用唱完整首，先把一个很小的声音动作练亮。</p>
          </div>
          <div class="vocal-move-header-actions">
            <button id="vocalMoveBackHomeButton" class="secondary" type="button">返回首页</button>
          </div>
        </div>

        <section class="vocal-move-overview" id="vocalMoveOverviewPanel">
          <div class="vocal-move-page-intro">
            <strong>今天只修一个小动作。</strong>
            <span>找到一次成功就算赢。</span>
          </div>
          <div class="vocal-move-grid" id="vocalMoveGrid" aria-live="polite"></div>
        </section>

        <section class="vocal-move-detail" id="vocalMoveDetailPanel" hidden>
          <button id="vocalMoveBackToListButton" class="secondary vocal-move-back-button" type="button">返回图鉴</button>
          <div class="vocal-move-detail-hero">
            <span class="vocal-move-code" id="vocalMoveDetailCode">A1</span>
            <div>
              <span class="game-label" id="vocalMoveDetailCategory">BREATH</span>
              <h2 id="vocalMoveDetailName">句尾轻收</h2>
              <p id="vocalMoveDetailDescription">把句尾轻轻放下。</p>
            </div>
          </div>
          <div class="vocal-move-detail-grid">
            <section class="vocal-move-detail-card">
              <span class="label">为什么重要</span>
              <p id="vocalMoveDetailWhy">让声音收得更温柔。</p>
            </section>
            <section class="vocal-move-detail-card">
              <span class="label">练习目标</span>
              <p id="vocalMoveDetailGoal">今天只找一次稳定的轻收。</p>
            </section>
            <section class="vocal-move-detail-card vocal-move-tips-card">
              <span class="label">练习提示</span>
              <ul id="vocalMoveDetailTips"></ul>
            </section>
            <section class="vocal-move-detail-card">
              <span class="label">示例片段</span>
              <ul class="vocal-move-examples" id="vocalMoveDetailExamples"></ul>
            </section>
          </div>
          <div class="vocal-move-detail-actions">
            <button id="vocalMoveStartPracticeButton" type="button">开始 3 分钟练习</button>
            <button id="vocalMoveCollectButton" class="secondary" type="button">收藏一次成功样本</button>
          </div>
          <section class="vocal-move-samples">
            <div class="recording-library-header">
              <div>
                <h3>最近成功样本</h3>
                <span id="vocalMoveSampleStatus">还没有采集样本</span>
              </div>
            </div>
            <div class="vocal-move-sample-list" id="vocalMoveSampleList"></div>
          </section>
        </section>

        <section class="vocal-move-practice" id="vocalMovePracticePanel" hidden>
          <div class="vocal-move-practice-main">
            <span class="game-label">3 Minute Move</span>
            <h2 id="vocalMovePracticeTitle">今天只修一个小动作。</h2>
            <p id="vocalMovePracticeGoal">不用唱完整首，先把这一秒变好听。</p>
            <div class="vocal-move-timer" id="vocalMoveTimer">03:00</div>
            <p id="vocalMovePracticeHint">找到一次成功就算赢。</p>
          </div>
          <div class="vocal-move-practice-actions">
            <button id="vocalMoveTimerToggleButton" type="button">开始计时</button>
            <button id="vocalMovePracticeCollectButton" class="secondary" type="button">收藏这次成功样本</button>
            <button id="vocalMovePracticeDoneButton" class="secondary" type="button">回到动作详情</button>
          </div>
        </section>
      </div>
    </section>

    <div class="vocal-move-sample-modal" id="vocalMoveSampleModal" hidden>
      <div class="vocal-move-sample-dialog" role="dialog" aria-modal="true" aria-labelledby="vocalMoveSampleModalTitle">
        <div>
          <span class="game-label">Magic Sample</span>
          <h2 id="vocalMoveSampleModalTitle">采集一次成功样本</h2>
          <p>这不是考试，是采集魔法样本。</p>
        </div>
        <label class="field">
          <span class="label">这次哪里做对了？</span>
          <input id="vocalMoveSampleWinInput" class="input" type="text" placeholder="例如：句尾没有硬收，声音更轻了" />
        </label>
        <label class="field">
          <span class="label">自评分</span>
          <select id="vocalMoveSampleRatingSelect" class="select">
            <option value="5">5 · 闪闪发光</option>
            <option value="4">4 · 很接近</option>
            <option value="3" selected>3 · 抓到感觉</option>
            <option value="2">2 · 有一点线索</option>
            <option value="1">1 · 先存为线索</option>
          </select>
        </label>
        <label class="field">
          <span class="label">备注</span>
          <textarea id="vocalMoveSampleNoteInput" class="input vocal-move-note-input" rows="3" placeholder="可以写下身体感觉、歌词、音高或今天的小发现"></textarea>
        </label>
        <div class="vocal-move-modal-actions">
          <button id="vocalMoveSampleSaveButton" type="button">保存样本</button>
          <button id="vocalMoveSampleCancelButton" class="secondary" type="button">先不保存</button>
        </div>
      </div>
    </div>`;
})();
