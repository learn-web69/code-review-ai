/**
 * Example: Browser Extension Integration for GitHub PR Review
 *
 * This example shows how to integrate the /tools/review endpoint
 * into a browser extension that adds AI Q&A to GitHub PR reviews.
 */

// ============================================================================
// 1. Content Script - Runs on GitHub PR pages
// ============================================================================

class GitHubPRAssistant {
  constructor() {
    this.apiBaseUrl = "http://localhost:3000";
    this.currentRepoId = this.extractRepoId();
    this.walkthroughSteps = null;
  }

  /**
   * Extract repository ID from GitHub URL
   */
  extractRepoId() {
    const match = window.location.href.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return `${match[1]}_${match[2]}`;
    }
    return null;
  }

  /**
   * Get selected code from GitHub's diff view
   */
  getSelectedCode() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      return null;
    }

    // Try to determine file and line number from selection
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const lineElement = this.findLineElement(container);

    if (lineElement) {
      const lineNumber = this.extractLineNumber(lineElement);
      const fileName = this.extractFileName(lineElement);

      return {
        code: selectedText,
        file: fileName,
        line: lineNumber,
      };
    }

    return { code: selectedText };
  }

  /**
   * Find the closest line element in GitHub's diff view
   */
  findLineElement(node) {
    let current = node;
    while (current && current !== document.body) {
      if (
        current.classList &&
        (current.classList.contains("blob-code") ||
          current.classList.contains("diff-line"))
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Extract line number from GitHub's diff view
   */
  extractLineNumber(element) {
    const lineCell = element.querySelector("[data-line-number]");
    if (lineCell) {
      return lineCell.getAttribute("data-line-number");
    }
    return null;
  }

  /**
   * Extract file name from GitHub's diff view
   */
  extractFileName(element) {
    const fileHeader = element.closest(".file");
    if (fileHeader) {
      const fileInfo = fileHeader.querySelector("[data-path]");
      if (fileInfo) {
        return fileInfo.getAttribute("data-path");
      }
    }
    return null;
  }

  /**
   * Fetch PR walkthrough if available
   */
  async fetchWalkthrough() {
    if (this.walkthroughSteps) {
      return this.walkthroughSteps;
    }

    try {
      const prUrl = window.location.href;
      const response = await fetch(`${this.apiBaseUrl}/review-pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pr_url: prUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        this.walkthroughSteps = data.steps;
        return this.walkthroughSteps;
      }
    } catch (error) {
      console.error("Failed to fetch walkthrough:", error);
    }

    return null;
  }

  /**
   * Ask a question about code
   */
  async askQuestion(question, includeWalkthrough = true) {
    if (!this.currentRepoId) {
      throw new Error("Could not determine repository ID");
    }

    const codeContext = this.getSelectedCode();
    const walkthrough = includeWalkthrough
      ? await this.fetchWalkthrough()
      : null;

    const payload = {
      repo_id: this.currentRepoId,
      question,
      ...codeContext,
      ...(walkthrough && { walkthrough }),
    };

    console.log("Sending question to AI:", payload);

    const response = await fetch(`${this.apiBaseUrl}/tools/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get answer");
    }

    return await response.json();
  }

  /**
   * Display answer in a popup/modal
   */
  displayAnswer(result) {
    // Create a modal overlay
    const modal = document.createElement("div");
    modal.className = "ai-assistant-modal";
    modal.innerHTML = `
      <div class="ai-assistant-content">
        <button class="ai-assistant-close">&times;</button>
        <h2>AI Answer</h2>
        
        <div class="ai-answer">
          <p>${this.formatAnswer(result.answer)}</p>
        </div>
        
        ${
          result.relatedContext.length > 0
            ? `
          <div class="ai-context">
            <h3>Related Context</h3>
            ${this.formatRelatedContext(result.relatedContext)}
          </div>
        `
            : ""
        }
        
        <div class="ai-metadata">
          <span class="confidence ${result.confidence}">${
      result.confidence
    } confidence</span>
          ${
            result.sources.length > 0
              ? `<span class="sources">Sources: ${result.sources.join(
                  ", "
                )}</span>`
              : ""
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add close handler
    modal.querySelector(".ai-assistant-close").addEventListener("click", () => {
      modal.remove();
    });

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  formatAnswer(answer) {
    // Convert markdown-style code blocks to HTML
    return answer
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }

  formatRelatedContext(contexts) {
    return contexts
      .map(
        (ctx, idx) => `
        <div class="context-item">
          <div class="context-header">
            <strong>${ctx.file}</strong>
            ${ctx.chunkName ? `- ${ctx.chunkName}` : ""}
            ${ctx.chunkType ? `(${ctx.chunkType})` : ""}
            ${
              ctx.relevanceScore
                ? `<span class="relevance">${(ctx.relevanceScore * 100).toFixed(
                    0
                  )}%</span>`
                : ""
            }
          </div>
          <pre><code>${this.escapeHtml(ctx.chunk)}</code></pre>
        </div>
      `
      )
      .join("");
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================================================
// 2. UI Integration - Add question input to GitHub PR page
// ============================================================================

function initializeUI() {
  const assistant = new GitHubPRAssistant();

  // Add a floating button to GitHub's PR page
  const button = document.createElement("button");
  button.id = "ai-assistant-trigger";
  button.innerHTML = "🤖 Ask AI";
  button.className = "ai-assistant-trigger";
  document.body.appendChild(button);

  button.addEventListener("click", () => {
    const question = prompt("Ask a question about the selected code:");
    if (question) {
      handleQuestion(question, assistant);
    }
  });

  // Add keyboard shortcut (Ctrl/Cmd + Shift + A)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
      e.preventDefault();
      const question = prompt("Ask a question about the selected code:");
      if (question) {
        handleQuestion(question, assistant);
      }
    }
  });
}

async function handleQuestion(question, assistant) {
  try {
    // Show loading indicator
    showLoadingIndicator();

    // Get answer from API
    const result = await assistant.askQuestion(question);

    // Hide loading indicator
    hideLoadingIndicator();

    // Display answer
    assistant.displayAnswer(result);
  } catch (error) {
    hideLoadingIndicator();
    alert(`Error: ${error.message}`);
  }
}

function showLoadingIndicator() {
  const loader = document.createElement("div");
  loader.id = "ai-assistant-loader";
  loader.className = "ai-assistant-loader";
  loader.innerHTML = "🤖 Thinking...";
  document.body.appendChild(loader);
}

function hideLoadingIndicator() {
  const loader = document.getElementById("ai-assistant-loader");
  if (loader) {
    loader.remove();
  }
}

// ============================================================================
// 3. Styles (inject into page)
// ============================================================================

const styles = `
  .ai-assistant-trigger {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: #0366d6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
  }

  .ai-assistant-trigger:hover {
    background: #0256c2;
  }

  .ai-assistant-loader {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    font-size: 18px;
    z-index: 10001;
  }

  .ai-assistant-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .ai-assistant-content {
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    position: relative;
  }

  .ai-assistant-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }

  .ai-assistant-close:hover {
    color: #000;
  }

  .ai-answer {
    margin: 16px 0;
    padding: 16px;
    background: #f6f8fa;
    border-radius: 6px;
    line-height: 1.6;
  }

  .ai-context {
    margin-top: 24px;
  }

  .context-item {
    margin: 12px 0;
    padding: 12px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
  }

  .context-header {
    margin-bottom: 8px;
    font-size: 14px;
  }

  .relevance {
    float: right;
    color: #0366d6;
    font-weight: 600;
  }

  .context-item pre {
    margin: 0;
    padding: 8px;
    background: #f6f8fa;
    border-radius: 4px;
    overflow-x: auto;
  }

  .ai-metadata {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e1e4e8;
    font-size: 12px;
    color: #666;
  }

  .confidence {
    padding: 4px 8px;
    border-radius: 4px;
    margin-right: 12px;
  }

  .confidence.high {
    background: #d4edda;
    color: #155724;
  }

  .confidence.medium {
    background: #fff3cd;
    color: #856404;
  }

  .confidence.low {
    background: #f8d7da;
    color: #721c24;
  }
`;

function injectStyles() {
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

// ============================================================================
// 4. Initialize on GitHub PR pages
// ============================================================================

if (
  window.location.hostname === "github.com" &&
  window.location.pathname.includes("/pull/")
) {
  injectStyles();
  initializeUI();
  console.log("GitHub PR AI Assistant initialized!");
}
