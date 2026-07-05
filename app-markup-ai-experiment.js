// Static markup for AI experiment mode.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.aiExperiment = String.raw`
    <section class="ai-experiment-page" id="aiExperimentPage" hidden>
      <header class="ai-experiment-header">
        <div>
          <span class="game-label">AI Experiment</span>
          <h1>AI实验模式</h1>
          <p>让 AI 用一次小实验判断你现在最该练什么。</p>
        </div>
        <button id="aiExperimentBackButton" class="secondary" type="button">返回首页</button>
      </header>

      <main class="ai-experiment-layout">
        <section class="ai-experiment-card" id="aiExperimentCurrentCard">
          <span class="game-label" id="aiExperimentStepLabel">Probe</span>
          <h2 id="aiExperimentTitle">先听一下你现在的状态</h2>
          <p id="aiExperimentMessage">我先听一下你现在的状态。请录一段 5–10 秒的短声音。</p>
          <div class="ai-experiment-primary-action">
            <button id="aiExperimentPrimaryButton" type="button">开始实验</button>
            <button id="aiExperimentStopButton" class="secondary" type="button" hidden>停止录音</button>
          </div>
          <p class="ai-experiment-status" id="aiExperimentStatus">准备开始。</p>
        </section>

        <section class="ai-experiment-output" id="aiExperimentHypothesisPanel" hidden>
          <span class="game-label">Hypothesis</span>
          <h2>当前猜测</h2>
          <div class="ai-experiment-feedback-block">
            <strong>观察到：</strong>
            <ul id="aiExperimentObservationList"></ul>
          </div>
          <div class="ai-experiment-feedback-block">
            <strong>AI猜测：</strong>
            <p id="aiExperimentGuessText">--</p>
          </div>
          <div class="ai-experiment-feedback-block">
            <strong>现在只验证一件事：</strong>
            <p id="aiExperimentVerifyText">--</p>
          </div>
          <details class="ai-experiment-why" id="aiExperimentWhyDetails">
            <summary>为什么这么说？</summary>
            <ul id="aiExperimentWhyList"></ul>
          </details>
        </section>
        <section class="ai-experiment-output" id="aiExperimentExercisePanel" hidden>
          <span class="game-label">Exercise</span>
          <h2 id="aiExperimentExerciseTitle">短练习</h2>
          <p id="aiExperimentExerciseGoal">--</p>
          <ol id="aiExperimentExerciseSteps"></ol>
        </section>

        <section class="ai-experiment-output" id="aiExperimentResultPanel" hidden>
          <span class="game-label">Result</span>
          <h2>实验结论</h2>
          <p><strong>结果：</strong><span id="aiExperimentResultText">--</span></p>
          <p><strong>变化：</strong><span id="aiExperimentChangeText">--</span></p>
          <p><strong>下一步：</strong><span id="aiExperimentNextText">--</span></p>
        </section>

        <details class="ai-experiment-details" id="aiExperimentDetails">
          <summary>查看详细数据</summary>
          <pre id="aiExperimentDebugJson">{}</pre>
        </details>
      </main>
    </section>
  `;
})();
