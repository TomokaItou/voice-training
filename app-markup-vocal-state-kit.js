// Static markup for Vocal State Kit v1 multimodal recording prototype.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.vocalStateKit = String.raw`
    <section class="vocal-state-page" id="vocalStateKitPage" hidden>
      <header class="vocal-state-header">
        <div>
          <span class="game-label">Vocal State Kit v1</span>
          <h1>多模态录制实验</h1>
          <p>同步采集麦克风、摄像头，并预留 EGG 通道。先建立状态估计的数据管线。</p>
        </div>
        <button id="vocalStateBackButton" class="secondary" type="button">返回首页</button>
      </header>

      <main class="vocal-state-layout">
        <section class="vocal-state-card vocal-state-recorder">
          <div class="vocal-state-preview-wrap">
            <video id="vocalStatePreview" class="vocal-state-preview" playsinline muted></video>
            <canvas id="vocalStateCanvas" class="vocal-state-canvas" width="320" height="240" hidden></canvas>
          </div>
          <div class="vocal-state-recorder-copy">
            <span class="game-label" id="vocalStatePhaseLabel">Ready</span>
            <h2 id="vocalStateTitle">录 5–10 秒稳定音或短句</h2>
            <ul class="vocal-state-cues">
              <li>请正对摄像头。</li>
              <li>唱一个稳定音或短句。</li>
              <li>保持头部不要大幅移动。</li>
            </ul>
            <div class="vocal-state-channel-row" aria-label="输入通道状态">
              <span id="vocalStateMicStatus">麦克风：待授权</span>
              <span id="vocalStateCameraStatus">摄像头：待授权</span>
              <span id="vocalStateEggStatus">EGG：未连接 / 待接入</span>
            </div>
            <div class="vocal-state-actions">
              <button id="vocalStatePrimaryButton" type="button">开始多模态录制</button>
              <button id="vocalStateStopButton" class="secondary" type="button" hidden>停止录制</button>
            </div>
            <p id="vocalStateStatus" class="vocal-state-status">准备好后开始。第一版只做采集和基础证据。</p>
          </div>
        </section>

        <section class="vocal-state-results" id="vocalStateResults" hidden>
          <article class="vocal-state-result-card">
            <span class="game-label">声音结果</span>
            <h2 id="vocalStateAudioTitle">等待录制</h2>
            <p id="vocalStateAudioSummary">音高、音量、亮度和稳定性会显示在这里。</p>
          </article>
          <article class="vocal-state-result-card">
            <span class="game-label">外部动作</span>
            <h2 id="vocalStateVideoTitle">等待录制</h2>
            <p id="vocalStateVideoSummary">嘴形、下巴和头部姿态会显示在这里。</p>
          </article>
          <article class="vocal-state-result-card">
            <span class="game-label">声门状态</span>
            <h2>EGG 未连接</h2>
            <p id="vocalStateEggSummary">已预留 eggSignal、contactQuotient、closureStability 字段，后续可接音频接口、USB 或蓝牙设备。</p>
          </article>

          <section class="vocal-state-feedback">
            <span class="game-label">AI 多模态反馈</span>
            <div id="vocalStateFeedbackBody"></div>
          </section>

          <details class="vocal-state-details">
            <summary>展开详情</summary>
            <pre id="vocalStateDebugJson">{}</pre>
          </details>
        </section>
      </main>
    </section>
  `;
})();
