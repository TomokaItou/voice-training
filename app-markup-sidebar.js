// Static sidebar markup for the voice training app shell.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.sidebar = String.raw`<aside class="sidebar" id="sidebar" aria-hidden="true" hidden>
      <div class="sidebar-header">
        <h2>设置</h2>
        <button id="closeSidebarButton" class="secondary sidebar-close-button" type="button">关闭</button>
      </div>
      <details class="sidebar-card advanced-settings" data-task-section="curve classic spectrogram volume formants">
        <summary>
          <span>高级参数</span>
          <small>算法、频谱、刻度和显示细节</small>
        </summary>
      <div class="sidebar-card" data-task-section="formants spectrogram">
        <h2>共振峰 (Formants)</h2>
        <label class="toggle">
          <input type="checkbox" id="formantToggle" />
          <span class="toggle-pill"></span>
          <span class="toggle-text">启用检测</span>
        </label>
        <div class="formant-values">
          <div>
            <span class="label">F1</span>
            <span class="value" id="formantF1">— Hz</span>
          </div>
          <div>
            <span class="label">F2</span>
            <span class="value" id="formantF2">— Hz</span>
          </div>
        </div>
        <div class="formant-status" id="formantStatus"></div>
      </div>
      <div class="sidebar-card" data-task-section="curve classic">
        <h2>音高算法</h2>
        <label class="field">
          <span class="label">检测算法</span>
          <select id="pitchAlgorithmSelect" class="select">
            <option value="amdf">AMDF</option>
            <option value="autocorr">自相关</option>
            <option value="fft">频域（HPS）</option>
            <option value="yin" selected>YIN（默认）</option>
          </select>
        </label>
        <p class="hint">可切换不同音高检测算法进行对比。</p>
      </div>
      <div class="sidebar-card" data-task-section="curve classic spectrogram volume formants">
        <h2>音高刻度</h2>
        <label class="field">
          <span class="label">刻度模式</span>
          <select id="pitchScaleModeSelect" class="select">
            <option value="dynamic">移动刻度</option>
            <option value="fixed">固定刻度（50–500 Hz）</option>
            <option value="log" selected>对数刻度（动态）</option>
          </select>
        </label>
        <p class="hint">固定刻度下，范围保持 50–500 Hz，仅曲线移动。</p>
      </div>
      <div class="sidebar-card" data-task-section="curve classic spectrogram volume formants">
        <h2>显示模式</h2>
        <label class="field">
          <span class="label">视图</span>
          <select id="displayModeSelect" class="select">
            <option value="pitch">音高曲线</option>
            <option value="volume">音量曲线</option>
            <option value="formants">共振峰曲线</option>
            <option value="spectrogram">实时频谱图</option>
            <option value="breath">出气量测量</option>
          </select>
        </label>
        <label class="field">
          <span class="label">频谱叠加</span>
          <select id="spectrogramOverlaySelect" class="select">
            <option value="none">无</option>
            <option value="pitch">仅音高曲线</option>
            <option value="formants">仅共振峰曲线</option>
            <option value="both">音高 + 共振峰</option>
          </select>
        </label>
        <label class="toggle">
          <input type="checkbox" id="volumeMeterToggle" checked />
          <span class="toggle-pill"></span>
          <span class="toggle-text">显示音量条</span>
        </label>
        <label class="toggle">
          <input type="checkbox" id="tiltMeterToggle" checked />
          <span class="toggle-pill"></span>
          <span class="toggle-text">显示倾斜条</span>
        </label>
        <p class="hint">切换为频谱图时，画布显示实时声谱。</p>
      </div>
      <div class="sidebar-card" data-task-section="curve classic spectrogram volume formants">
        <h2>窗口缩放</h2>
        <label class="field">
          <span class="label">显示大小</span>
          <input
            type="range"
            id="canvasScaleRange"
            min="0.7"
            max="1.3"
            step="0.1"
            value="1"
          />
        </label>
        <div class="file-status">
          <span class="label">当前缩放</span>
          <span class="value" id="canvasScaleValue">100%</span>
        </div>
      </div>
      </details>
      <div class="sidebar-card" data-task-section="score">
        <h2>音准目标线</h2>
        <label class="toggle">
          <input type="checkbox" id="targetPitchToggle" checked />
          <span class="toggle-pill"></span>
          <span class="toggle-text">显示目标线</span>
        </label>
        <label class="field">
          <span class="label">目标音高 (Hz)</span>
          <input type="number" id="targetPitchInput" class="input" min="50" max="1000" step="1" value="300" />
        </label>
        <p class="hint">目标线会与实时音高曲线叠加显示，方便对齐练习。</p>
      </div>
      <div class="sidebar-card" data-task-section="curve classic">
        <h2>离线分析</h2>
        <input type="file" id="audioFileInput" accept="audio/*" class="file-input" />
        <button id="analyzeRecordingButton" class="secondary" disabled>分析最近录音</button>
        <button id="downloadRecordingButton" class="secondary" disabled>下载最近录音</button>
        <button id="clearFileButton" class="secondary" disabled>清除文件/返回实时</button>
        <div class="file-status">
          <span class="label">数据源</span>
          <span class="value" id="dataSourceValue">实时麦克风</span>
        </div>
        <div class="file-status">
          <span class="label">分析进度</span>
          <span class="value" id="analysisStatus">未开始</span>
        </div>
      </div>
      <div class="sidebar-card" data-task-section="curve classic">
        <h2>伴奏播放</h2>
        <input type="file" id="accompanimentInput" accept="audio/*" class="file-input" />
        <div class="controls-inline">
          <button id="playAccompanimentButton" class="secondary" disabled>播放</button>
          <button id="pauseAccompanimentButton" class="secondary" disabled>暂停</button>
          <button id="stopAccompanimentButton" class="secondary" disabled>停止</button>
        </div>
        <label class="field">
          <span class="label">伴奏音量</span>
          <input type="range" id="accompanimentVolume" min="0" max="1" step="0.05" value="0.7" />
        </label>
        <div class="file-status">
          <span class="label">状态</span>
          <span class="value" id="accompanimentStatus">未加载</span>
        </div>
        <button id="pitchAccuracyButton" class="secondary" disabled>音准模式评估</button>
        <div class="file-status">
          <span class="label">音准结果</span>
          <span class="value" id="pitchAccuracyResult">--</span>
        </div>
      </div>
    </aside>`;
})();
