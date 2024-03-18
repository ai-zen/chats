import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { ElMessage } from "element-plus";

// 创建MarkdownIt实例，并配置highlight.js作为代码高亮工具
const md: MarkdownIt = new MarkdownIt({
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          "</code></pre>"
        );
      } catch (__) {}
    }
    return (
      '<pre class="hljs"><code>' +
      hljs.highlightAuto(str).value +
      "</code></pre>"
    );
  },
});

// 为代码块添加复制按钮
md.renderer.rules.code_block = (
  tokens: { [x: string]: any },
  idx: string | number
) => {
  const token = tokens[idx];
  const content = token.content.trim();
  const icon = `<svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M1.05908 7.97856C1.05908 8.75175 1.68588 9.37856 2.45908 9.37856L4.55558 9.37839L4.55595 11.6059C4.55595 12.3791 5.18276 13.0059 5.95595 13.0059H11.5404C12.3136 13.0059 12.9404 12.3791 12.9404 11.6059V6.02149C12.9404 5.24829 12.3136 4.62149 11.5404 4.62149L9.44333 4.62131L9.4435 2.39414C9.4435 1.62094 8.8167 0.994141 8.0435 0.994141H2.45908C1.68588 0.994141 1.05908 1.62094 1.05908 2.39414V7.97856ZM7.81016 2.39414C7.93903 2.39414 8.0435 2.49861 8.0435 2.62747V7.74522C8.0435 7.87409 7.93903 7.97856 7.81016 7.97856H2.69242C2.56355 7.97856 2.45908 7.87409 2.45908 7.74522V2.62747C2.45908 2.49861 2.56355 2.39414 2.69242 2.39414H7.81016ZM9.4435 7.97856L9.44333 6.02131L11.307 6.02147C11.4359 6.0215 11.5403 6.12596 11.5404 6.25482V11.3726C11.5404 11.5014 11.4359 11.6059 11.307 11.6059H6.18929C6.06044 11.6059 5.95598 11.5014 5.95592 11.3726L5.95558 9.37839L8.0435 9.37856C8.8167 9.37856 9.4435 8.75175 9.4435 7.97856Z" fill="currentColor"></path></svg>`;
  return `<pre><code class="language-${token.info.trim()} hljs">${md.utils.escapeHtml(
    content
  )}</code><button class="code-copy-button">${icon}</button></pre>\n`;
};

// 绑定点击事件监听器到复制按钮
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains("code-copy-button")) {
    const codeElement = target.previousElementSibling as HTMLElement;
    if (codeElement) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(codeElement);
      selection!.removeAllRanges();
      selection!.addRange(range);

      try {
        document.execCommand("copy");
        selection!.removeAllRanges();
        ElMessage.success("复制成功！");
      } catch (err) {
        ElMessage.error("复制失败！");
      }
    }
  }
});

// 导出md实例
export default md;
