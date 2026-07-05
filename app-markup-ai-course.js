// Static markup for the AI course system.
(function () {
  window.voiceTrainingMarkupParts = window.voiceTrainingMarkupParts || {};
  window.voiceTrainingMarkupParts.aiCourse = String.raw`
    <section class="ai-course-page" id="aiCoursePage" hidden>
      <header class="ai-course-header">
        <div>
          <span class="game-label">AI Course</span>
          <h1>AI课程</h1>
          <p>长期陪你练唱歌，但今天只练一件事。</p>
        </div>
        <button id="aiCourseBackButton" class="secondary" type="button">返回首页</button>
      </header>

      <main class="ai-course-layout">
        <section class="ai-course-card ai-course-current" id="aiCourseCurrentCard">
          <div class="ai-course-current-top">
            <span class="game-label" id="aiCourseLevel">基础阶段 Lv.1</span>
            <span class="ai-course-time" id="aiCourseEstimatedTime">预计 6 分钟</span>
          </div>
          <h2 id="aiCourseLessonName">轻声起音</h2>
          <p id="aiCourseLessonGoal">今天只练起音更轻、更稳。</p>
          <div class="ai-course-stats" aria-label="课程进度">
            <span><strong id="aiCourseCompletedCount">0</strong> 节已完成</span>
            <span><strong id="aiCourseStreak">0</strong> 天连续练习</span>
          </div>
          <div class="ai-course-progress" aria-hidden="true">
            <span id="aiCourseProgressBar"></span>
          </div>
          <p class="ai-course-skill-summary" id="aiCourseSkillSummary">能力档案正在初始化。</p>
          <div class="ai-course-actions">
            <button id="aiCoursePrimaryButton" type="button">开始课程</button>
            <button id="aiCourseStopButton" class="secondary" type="button" hidden>停止录音</button>
          </div>
          <p class="ai-course-status" id="aiCourseStatus">准备好了。</p>
        </section>

        <section class="ai-course-card ai-course-step" id="aiCourseLessonPanel">
          <span class="game-label">Lesson</span>
          <h2 id="aiCourseStepTitle">听示范 / 看说明</h2>
          <p id="aiCourseStepMessage">先看今天的目标，再录一小段声音。</p>
          <ol id="aiCourseInstructionList"></ol>
        </section>

        <section class="ai-course-card ai-course-step" id="aiCourseFeedbackPanel" hidden>
          <span class="game-label">AI Feedback</span>
          <h2>AI只反馈一件事</h2>
          <p id="aiCourseFeedbackText">--</p>
        </section>

        <section class="ai-course-card ai-course-step" id="aiCourseExercisePanel" hidden>
          <span class="game-label">Exercise</span>
          <h2 id="aiCourseExerciseTitle">短练习</h2>
          <p id="aiCourseExerciseGoal">--</p>
          <ol id="aiCourseExerciseSteps"></ol>
        </section>

        <section class="ai-course-card ai-course-step" id="aiCourseResultPanel" hidden>
          <span class="game-label">Result</span>
          <h2 id="aiCourseResultTitle">这节课完成了吗？</h2>
          <p><strong>结果：</strong><span id="aiCourseResultText">--</span></p>
          <p><strong>变化：</strong><span id="aiCourseChangeText">--</span></p>
          <p><strong>下一课：</strong><span id="aiCourseNextLessonText">--</span></p>
        </section>

        <details class="ai-course-details" id="aiCourseDetails">
          <summary>查看课程档案和详细数据</summary>
          <pre id="aiCourseDebugJson">{}</pre>
        </details>
      </main>
    </section>
  `;
})();
