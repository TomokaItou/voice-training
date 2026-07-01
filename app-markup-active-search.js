// Static Active Voice Search markup for the voice training app shell.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.activeSearch = String.raw`<section class="active-search-page" id="activeSearchPage" hidden>
      <div class="active-search-card">
        <div class="active-search-header">
          <div>
            <span class="launcher-kicker">Active Voice Search</span>
            <h1>Find Better Voice</h1>
            <p>3分钟找到今天最好的一句。短一点，快一点，找到一次成功就算赢。</p>
          </div>
          <button id="activeSearchBackHomeButton" class="secondary" type="button">返回首页</button>
        </div>

        <section class="active-search-setup" id="activeSearchSetupPanel">
          <div class="active-search-setup-copy">
            <span class="game-label">Step 1</span>
            <h2>选择今天要搜索的练习单位</h2>
            <p>不用唱完整首。只选一个 2–5 秒的小声音，Mira 会帮你试出今天更好的状态。</p>
          </div>
          <div class="active-search-unit-grid" role="group" aria-label="练习单位">
            <button class="active-search-unit active" type="button" data-active-unit="vowel">
              <strong>一个元音</strong>
              <span>啊 / 哦 / mi</span>
            </button>
            <button class="active-search-unit" type="button" data-active-unit="reading">
              <strong>一句话朗读</strong>
              <span>像说话一样找入口</span>
            </button>
            <button class="active-search-unit" type="button" data-active-unit="lyric">
              <strong>一句歌词</strong>
              <span>只截一句，不唱整首</span>
            </button>
            <button class="active-search-unit" type="button" data-active-unit="clip">
              <strong>2–5 秒短片段</strong>
              <span>今天只把这一秒变好听</span>
            </button>
          </div>
          <label class="field active-search-prompt-field">
            <span class="label">今天要发出的内容</span>
            <input id="activeSearchExerciseInput" class="input" type="text" value="啊" />
          </label>
          <button id="activeSearchBeginButton" type="button">开始搜索</button>
        </section>

        <section class="active-search-run" id="activeSearchRunPanel" hidden>
          <div class="active-search-progress">
            <span id="activeSearchProgressText">1 / 10</span>
            <div class="active-search-progress-track" aria-hidden="true">
              <span id="activeSearchProgressFill"></span>
            </div>
          </div>
          <div class="active-search-task-card">
            <span class="game-label">Micro Task</span>
            <h2 id="activeSearchPromptText">比刚才更轻一点</h2>
            <p id="activeSearchExerciseText">练习内容：啊</p>
            <strong id="activeSearchRecordStatus">准备录 3 秒。不追求满分，只找一个更好的线索。</strong>
          </div>
          <div class="active-search-run-actions">
            <button id="activeSearchRecordButton" type="button">录这一条</button>
            <button id="activeSearchSkipButton" class="secondary" type="button">跳过这个提示</button>
            <button id="activeSearchFinishButton" class="secondary" type="button">直接看结果</button>
          </div>
          <div class="active-search-attempt-strip" id="activeSearchAttemptStrip" aria-live="polite"></div>
        </section>

        <section class="active-search-results" id="activeSearchResultsPanel" hidden>
          <div class="active-search-result-hero">
            <span class="game-label">Search Complete</span>
            <h2 id="activeSearchResultTitle">找到了。今天最值得保存的是第 1 次。</h2>
            <p id="activeSearchResultSummary">它比其他样本更稳定，起音也更顺。明天练习前先听它 3 遍。</p>
          </div>
          <div class="active-search-top-list" id="activeSearchTopList"></div>
          <div class="active-search-result-actions">
            <button id="activeSearchSaveBestButton" type="button">保存最佳样本</button>
            <button id="activeSearchNewRoundButton" class="secondary" type="button">基于最佳再搜一轮</button>
            <button id="activeSearchRestartButton" class="secondary" type="button">重新开始</button>
          </div>
        </section>
      </div>
    </section>`;
})();
