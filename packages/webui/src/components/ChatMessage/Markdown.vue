<template>
  <div class="markdown-body" v-html="html" @click="onClick"></div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { ElMessage } from "element-plus";
import { ref, watch } from "vue";

// 创建MarkdownIt实例，并配置highlight.js作为代码高亮工具
const md: MarkdownIt = new MarkdownIt({
  highlight: function (str: string, lang: string) {
    const icon = `<svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M1.05908 7.97856C1.05908 8.75175 1.68588 9.37856 2.45908 9.37856L4.55558 9.37839L4.55595 11.6059C4.55595 12.3791 5.18276 13.0059 5.95595 13.0059H11.5404C12.3136 13.0059 12.9404 12.3791 12.9404 11.6059V6.02149C12.9404 5.24829 12.3136 4.62149 11.5404 4.62149L9.44333 4.62131L9.4435 2.39414C9.4435 1.62094 8.8167 0.994141 8.0435 0.994141H2.45908C1.68588 0.994141 1.05908 1.62094 1.05908 2.39414V7.97856ZM7.81016 2.39414C7.93903 2.39414 8.0435 2.49861 8.0435 2.62747V7.74522C8.0435 7.87409 7.93903 7.97856 7.81016 7.97856H2.69242C2.56355 7.97856 2.45908 7.87409 2.45908 7.74522V2.62747C2.45908 2.49861 2.56355 2.39414 2.69242 2.39414H7.81016ZM9.4435 7.97856L9.44333 6.02131L11.307 6.02147C11.4359 6.0215 11.5403 6.12596 11.5404 6.25482V11.3726C11.5404 11.5014 11.4359 11.6059 11.307 11.6059H6.18929C6.06044 11.6059 5.95598 11.5014 5.95592 11.3726L5.95558 9.37839L8.0435 9.37856C8.8167 9.37856 9.4435 8.75175 9.4435 7.97856Z" fill="currentColor"></path></svg>`;
    const button = `<button class="code-copy-button">${icon}</button>`;
    let code = "";

    // 如果存在对应的语言，优先使用对应的语言进行高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        code = hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true,
        }).value;
      } catch (__) {}
    }

    // 如果不存在对应的语言或语言存在但无法正确解析，则使用自动语法高亮
    code ||= hljs.highlightAuto(str).value;

    return `<pre class="hljs"><code>${code}</code>${button}</pre>`;
  },
});

const props = defineProps<{
  markdown: string;
}>();

let html = ref("");
let frameId = 0;

// 监听 markdown 变化，动态更新 html
watch(
  () => props.markdown,
  (newValue) => {
    // 取消上一次的动画帧请求
    cancelAnimationFrame(frameId);
    // 延迟执行，等待空闲后再进行渲染
    frameId = requestAnimationFrame(() => {
      html.value = md.render(newValue);
    });
  },
  {
    immediate: true,
  }
);

function onClick(e: MouseEvent) {
  console.log("onClick", e.target);
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
}
</script>

<style lang="scss" scoped>
.dark .markdown-body:deep() {
  color-scheme: dark;
  --color-prettylights-syntax-comment: #8b949e;
  --color-prettylights-syntax-constant: #79c0ff;
  --color-prettylights-syntax-entity: #d2a8ff;
  --color-prettylights-syntax-storage-modifier-import: #c9d1d9;
  --color-prettylights-syntax-entity-tag: #7ee787;
  --color-prettylights-syntax-keyword: #ff7b72;
  --color-prettylights-syntax-string: #a5d6ff;
  --color-prettylights-syntax-variable: #ffa657;
  --color-prettylights-syntax-brackethighlighter-unmatched: #f85149;
  --color-prettylights-syntax-invalid-illegal-text: #f0f6fc;
  --color-prettylights-syntax-invalid-illegal-bg: #8e1519;
  --color-prettylights-syntax-carriage-return-text: #f0f6fc;
  --color-prettylights-syntax-carriage-return-bg: #b62324;
  --color-prettylights-syntax-string-regexp: #7ee787;
  --color-prettylights-syntax-markup-list: #f2cc60;
  --color-prettylights-syntax-markup-heading: #1f6feb;
  --color-prettylights-syntax-markup-italic: #c9d1d9;
  --color-prettylights-syntax-markup-bold: #c9d1d9;
  --color-prettylights-syntax-markup-deleted-text: #ffdcd7;
  --color-prettylights-syntax-markup-deleted-bg: #67060c;
  --color-prettylights-syntax-markup-inserted-text: #aff5b4;
  --color-prettylights-syntax-markup-inserted-bg: #033a16;
  --color-prettylights-syntax-markup-changed-text: #ffdfb6;
  --color-prettylights-syntax-markup-changed-bg: #5a1e02;
  --color-prettylights-syntax-markup-ignored-text: #c9d1d9;
  --color-prettylights-syntax-markup-ignored-bg: #1158c7;
  --color-prettylights-syntax-meta-diff-range: #d2a8ff;
  --color-prettylights-syntax-brackethighlighter-angle: #8b949e;
  --color-prettylights-syntax-sublimelinter-gutter-mark: #484f58;
  --color-prettylights-syntax-constant-other-reference-link: #a5d6ff;
  --color-fg-default: #e6edf3;
  --color-fg-muted: #848d97;
  --color-fg-subtle: #6e7681;
  --color-canvas-default: #0d1117;
  --color-canvas-subtle: #161b22;
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-neutral-muted: rgba(110, 118, 129, 0.4);
  --color-accent-fg: #2f81f7;
  --color-accent-emphasis: #1f6feb;
  --color-success-fg: #3fb950;
  --color-success-emphasis: #238636;
  --color-attention-fg: #d29922;
  --color-attention-emphasis: #9e6a03;
  --color-attention-subtle: rgba(187, 128, 9, 0.15);
  --color-danger-fg: #f85149;
  --color-danger-emphasis: #da3633;
  --color-done-fg: #a371f7;
  --color-done-emphasis: #8957e5;

  pre code.hljs {
    display: block;
    overflow-x: auto;
    padding: 1em;
  }

  code.hljs {
    padding: 3px 5px;
  }

  .hljs {
    // color: #c9d1d9;
    // background: #0d1117;
    color: var(--color-fg-default);
    background-color: var(--color-canvas-subtle);
  }

  .hljs-doctag,
  .hljs-keyword,
  .hljs-meta .hljs-keyword,
  .hljs-template-tag,
  .hljs-template-variable,
  .hljs-type,
  .hljs-variable.language_ {
    color: #ff7b72;
  }

  .hljs-title,
  .hljs-title.class_,
  .hljs-title.class_.inherited__,
  .hljs-title.function_ {
    color: #d2a8ff;
  }

  .hljs-attr,
  .hljs-attribute,
  .hljs-literal,
  .hljs-meta,
  .hljs-number,
  .hljs-operator,
  .hljs-variable,
  .hljs-selector-attr,
  .hljs-selector-class,
  .hljs-selector-id {
    color: #79c0ff;
  }

  .hljs-regexp,
  .hljs-string,
  .hljs-meta .hljs-string {
    color: #a5d6ff;
  }

  .hljs-built_in,
  .hljs-symbol {
    color: #ffa657;
  }

  .hljs-comment,
  .hljs-code,
  .hljs-formula {
    color: #8b949e;
  }

  .hljs-name,
  .hljs-quote,
  .hljs-selector-tag,
  .hljs-selector-pseudo {
    color: #7ee787;
  }

  .hljs-subst {
    color: #c9d1d9;
  }

  .hljs-section {
    color: #1f6feb;
    font-weight: bold;
  }

  .hljs-bullet {
    color: #f2cc60;
  }

  .hljs-emphasis {
    color: #c9d1d9;
    font-style: italic;
  }

  .hljs-strong {
    color: #c9d1d9;
    font-weight: bold;
  }

  .hljs-addition {
    color: #aff5b4;
    background-color: #033a16;
  }

  .hljs-deletion {
    color: #ffdcd7;
    background-color: #67060c;
  }
}

.markdown-body:deep() {
  color-scheme: light;
  --color-prettylights-syntax-comment: #57606a;
  --color-prettylights-syntax-constant: #0550ae;
  --color-prettylights-syntax-entity: #6639ba;
  --color-prettylights-syntax-storage-modifier-import: #24292f;
  --color-prettylights-syntax-entity-tag: #116329;
  --color-prettylights-syntax-keyword: #cf222e;
  --color-prettylights-syntax-string: #0a3069;
  --color-prettylights-syntax-variable: #953800;
  --color-prettylights-syntax-brackethighlighter-unmatched: #82071e;
  --color-prettylights-syntax-invalid-illegal-text: #f6f8fa;
  --color-prettylights-syntax-invalid-illegal-bg: #82071e;
  --color-prettylights-syntax-carriage-return-text: #f6f8fa;
  --color-prettylights-syntax-carriage-return-bg: #cf222e;
  --color-prettylights-syntax-string-regexp: #116329;
  --color-prettylights-syntax-markup-list: #3b2300;
  --color-prettylights-syntax-markup-heading: #0550ae;
  --color-prettylights-syntax-markup-italic: #24292f;
  --color-prettylights-syntax-markup-bold: #24292f;
  --color-prettylights-syntax-markup-deleted-text: #82071e;
  --color-prettylights-syntax-markup-deleted-bg: #ffebe9;
  --color-prettylights-syntax-markup-inserted-text: #116329;
  --color-prettylights-syntax-markup-inserted-bg: #dafbe1;
  --color-prettylights-syntax-markup-changed-text: #953800;
  --color-prettylights-syntax-markup-changed-bg: #ffd8b5;
  --color-prettylights-syntax-markup-ignored-text: #eaeef2;
  --color-prettylights-syntax-markup-ignored-bg: #0550ae;
  --color-prettylights-syntax-meta-diff-range: #8250df;
  --color-prettylights-syntax-brackethighlighter-angle: #57606a;
  --color-prettylights-syntax-sublimelinter-gutter-mark: #8c959f;
  --color-prettylights-syntax-constant-other-reference-link: #0a3069;
  --color-fg-default: #1f2328;
  --color-fg-muted: #656d76;
  --color-fg-subtle: #6e7781;
  --color-canvas-default: #ffffff;
  --color-canvas-subtle: #f6f8fa;
  --color-border-default: #d0d7de;
  --color-border-muted: hsla(210, 18%, 87%, 1);
  --color-neutral-muted: rgba(175, 184, 193, 0.2);
  --color-accent-fg: #0969da;
  --color-accent-emphasis: #0969da;
  --color-success-fg: #1a7f37;
  --color-success-emphasis: #1f883d;
  --color-attention-fg: #9a6700;
  --color-attention-emphasis: #9a6700;
  --color-attention-subtle: #fff8c5;
  --color-danger-fg: #d1242f;
  --color-danger-emphasis: #cf222e;
  --color-done-fg: #8250df;
  --color-done-emphasis: #8250df;

  pre code.hljs {
    display: block;
    overflow-x: auto;
    padding: 1em;
  }

  code.hljs {
    padding: 3px 5px;
  }

  .hljs {
    // color: #24292e;
    // background: #ffffff;
    color: var(--color-fg-default);
    background-color: var(--color-canvas-subtle);
  }

  .hljs-doctag,
  .hljs-keyword,
  .hljs-meta .hljs-keyword,
  .hljs-template-tag,
  .hljs-template-variable,
  .hljs-type,
  .hljs-variable.language_ {
    color: #d73a49;
  }

  .hljs-title,
  .hljs-title.class_,
  .hljs-title.class_.inherited__,
  .hljs-title.function_ {
    color: #6f42c1;
  }

  .hljs-attr,
  .hljs-attribute,
  .hljs-literal,
  .hljs-meta,
  .hljs-number,
  .hljs-operator,
  .hljs-variable,
  .hljs-selector-attr,
  .hljs-selector-class,
  .hljs-selector-id {
    color: #005cc5;
  }

  .hljs-regexp,
  .hljs-string,
  .hljs-meta .hljs-string {
    color: #032f62;
  }

  .hljs-built_in,
  .hljs-symbol {
    color: #e36209;
  }

  .hljs-comment,
  .hljs-code,
  .hljs-formula {
    color: #6a737d;
  }

  .hljs-name,
  .hljs-quote,
  .hljs-selector-tag,
  .hljs-selector-pseudo {
    color: #22863a;
  }

  .hljs-subst {
    color: #24292e;
  }

  .hljs-section {
    color: #005cc5;
    font-weight: bold;
  }

  .hljs-bullet {
    color: #735c0f;
  }

  .hljs-emphasis {
    color: #24292e;
    font-style: italic;
  }

  .hljs-strong {
    color: #24292e;
    font-weight: bold;
  }

  .hljs-addition {
    color: #22863a;
    background-color: #f0fff4;
  }

  .hljs-deletion {
    color: #b31d28;
    background-color: #ffeef0;
  }
}

.markdown-body:deep() {
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  margin: 0;
  color: var(--color-fg-default);
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;

  > p:first-child {
    margin-block-start: 0px;
  }

  > p:last-child {
    margin-block-end: 0px;
  }

  details,
  figcaption,
  figure {
    display: block;
  }

  summary {
    display: list-item;
  }

  [hidden] {
    display: none !important;
  }

  a {
    background-color: transparent;
    color: var(--color-accent-fg);
    text-decoration: none;
  }

  abbr[title] {
    border-bottom: none;
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
  }

  b,
  strong {
    font-weight: var(--base-text-weight-semibold, 600);
  }

  dfn {
    font-style: italic;
  }

  h1 {
    margin: 0.67em 0;
    font-weight: var(--base-text-weight-semibold, 600);
    padding-bottom: 0.3em;
    font-size: 2em;
    border-bottom: 1px solid var(--color-border-muted);
  }

  mark {
    background-color: var(--color-attention-subtle);
    color: var(--color-fg-default);
  }

  small {
    font-size: 90%;
  }

  sub,
  sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  sub {
    bottom: -0.25em;
  }

  sup {
    top: -0.5em;
  }

  img {
    border-style: none;
    max-width: 100%;
    box-sizing: content-box;
    background-color: var(--color-canvas-default);
    border-radius: 6px;
    display: block;
    margin: 0.5em 0;
  }

  code,
  kbd,
  pre,
  samp {
    font-family: monospace;
    font-size: 1em;
  }

  figure {
    margin: 1em 40px;
  }

  hr {
    box-sizing: content-box;
    overflow: hidden;
    background: transparent;
    border-bottom: 1px solid var(--color-border-muted);
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: var(--color-border-default);
    border: 0;
  }

  input {
    font: inherit;
    margin: 0;
    overflow: visible;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  [type="button"],
  [type="reset"],
  [type="submit"] {
    -webkit-appearance: button;
    appearance: button;
  }

  [type="checkbox"],
  [type="radio"] {
    box-sizing: border-box;
    padding: 0;
  }

  [type="number"]::-webkit-inner-spin-button,
  [type="number"]::-webkit-outer-spin-button {
    height: auto;
  }

  [type="search"]::-webkit-search-cancel-button,
  [type="search"]::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }

  ::-webkit-input-placeholder {
    color: inherit;
    opacity: 0.54;
  }

  ::-webkit-file-upload-button {
    -webkit-appearance: button;
    appearance: button;
    font: inherit;
  }

  a:hover {
    text-decoration: underline;
  }

  ::placeholder {
    color: var(--color-fg-subtle);
    opacity: 1;
  }

  table {
    border-spacing: 0;
    border-collapse: collapse;
    display: block;
    width: max-content;
    max-width: 100%;
    overflow: auto;
  }

  td,
  th {
    padding: 0;
  }

  details summary {
    cursor: pointer;
  }

  details:not([open]) > *:not(summary) {
    display: none !important;
  }

  a:focus,
  [role="button"]:focus,
  input[type="radio"]:focus,
  input[type="checkbox"]:focus {
    outline: 2px solid var(--color-accent-fg);
    outline-offset: -2px;
    box-shadow: none;
  }

  a:focus:not(:focus-visible),
  [role="button"]:focus:not(:focus-visible),
  input[type="radio"]:focus:not(:focus-visible),
  input[type="checkbox"]:focus:not(:focus-visible) {
    outline: solid 1px transparent;
  }

  a:focus-visible,
  [role="button"]:focus-visible,
  input[type="radio"]:focus-visible,
  input[type="checkbox"]:focus-visible {
    outline: 2px solid var(--color-accent-fg);
    outline-offset: -2px;
    box-shadow: none;
  }

  a:not([class]):focus,
  a:not([class]):focus-visible,
  input[type="radio"]:focus,
  input[type="radio"]:focus-visible,
  input[type="checkbox"]:focus,
  input[type="checkbox"]:focus-visible {
    outline-offset: 0;
  }

  kbd {
    display: inline-block;
    padding: 3px 5px;
    font: 11px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
      Liberation Mono, monospace;
    line-height: 10px;
    color: var(--color-fg-default);
    vertical-align: middle;
    background-color: var(--color-canvas-subtle);
    border: solid 1px var(--color-neutral-muted);
    border-bottom-color: var(--color-neutral-muted);
    border-radius: 6px;
    box-shadow: inset 0 -1px 0 var(--color-neutral-muted);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: var(--base-text-weight-semibold, 600);
    line-height: 1.25;
  }

  h2 {
    font-weight: var(--base-text-weight-semibold, 600);
    padding-bottom: 0.3em;
    font-size: 1.5em;
    border-bottom: 1px solid var(--color-border-muted);
  }

  h3 {
    font-weight: var(--base-text-weight-semibold, 600);
    font-size: 1.25em;
  }

  h4 {
    font-weight: var(--base-text-weight-semibold, 600);
    font-size: 1em;
  }

  h5 {
    font-weight: var(--base-text-weight-semibold, 600);
    font-size: 0.875em;
  }

  h6 {
    font-weight: var(--base-text-weight-semibold, 600);
    font-size: 0.85em;
    color: var(--color-fg-muted);
  }

  p {
    margin-top: 0;
    margin-bottom: 10px;
  }

  blockquote {
    margin: 0;
    padding: 0 1em;
    color: var(--color-fg-muted);
    border-left: 0.25em solid var(--color-border-default);
  }

  ul,
  ol {
    margin-top: 0;
    margin-bottom: 0;
    padding-left: 2em;
  }

  ol ol,
  ul ol {
    list-style-type: lower-roman;
  }

  ul ul ol,
  ul ol ol,
  ol ul ol,
  ol ol ol {
    list-style-type: lower-alpha;
  }

  dd {
    margin-left: 0;
  }

  tt,
  code,
  samp {
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
      Liberation Mono, monospace;
    font-size: 12px;
  }

  pre {
    margin-top: 0;
    margin-bottom: 0;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
      Liberation Mono, monospace;
    font-size: 12px;
    word-wrap: normal;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
    appearance: none;
  }

  > *:first-child {
    margin-top: 0 !important;
  }

  > *:last-child {
    margin-bottom: 0 !important;
  }

  a:not([href]) {
    color: inherit;
    text-decoration: none;
  }

  p,
  blockquote,
  ul,
  ol,
  dl,
  table,
  pre,
  details {
    margin-top: 0;
    margin-bottom: 16px;
  }

  blockquote > :first-child {
    margin-top: 0;
  }

  blockquote > :last-child {
    margin-bottom: 0;
  }

  h1 tt,
  h1 code,
  h2 tt,
  h2 code,
  h3 tt,
  h3 code,
  h4 tt,
  h4 code,
  h5 tt,
  h5 code,
  h6 tt,
  h6 code {
    padding: 0 0.2em;
    font-size: inherit;
  }

  summary h1,
  summary h2,
  summary h3,
  summary h4,
  summary h5,
  summary h6 {
    display: inline-block;
  }

  summary h1,
  summary h2 {
    padding-bottom: 0;
    border-bottom: 0;
  }

  ol[type="a s"] {
    list-style-type: lower-alpha;
  }

  ol[type="A s"] {
    list-style-type: upper-alpha;
  }

  ol[type="i s"] {
    list-style-type: lower-roman;
  }

  ol[type="I s"] {
    list-style-type: upper-roman;
  }

  ol[type="1"] {
    list-style-type: decimal;
  }

  div > ol:not([type]) {
    list-style-type: decimal;
  }

  ul ul,
  ul ol,
  ol ol,
  ol ul {
    margin-top: 0;
    margin-bottom: 0;
  }

  li > p {
    margin-top: 16px;
  }

  li + li {
    margin-top: 0.25em;
  }

  dl {
    padding: 0;
  }

  dl dt {
    padding: 0;
    margin-top: 16px;
    font-size: 1em;
    font-style: italic;
    font-weight: var(--base-text-weight-semibold, 600);
  }

  dl dd {
    padding: 0 16px;
    margin-bottom: 16px;
  }

  table th {
    font-weight: var(--base-text-weight-semibold, 600);
  }

  table th,
  table td {
    padding: 6px 13px;
    border: 1px solid var(--color-border-default);
  }

  table td > :last-child {
    margin-bottom: 0;
  }

  table tr {
    background-color: var(--color-canvas-default);
    border-top: 1px solid var(--color-border-muted);
  }

  table tr:nth-child(2n) {
    background-color: var(--color-canvas-subtle);
  }

  // table thead tr {
  //   background-color: var(--color-canvas-subtle);
  // }

  // table tbody tr:nth-child(2n + 1) {
  //   background-color: var(--color-canvas-subtle);
  // }

  table img {
    background-color: transparent;
  }

  img[align="right"] {
    padding-left: 20px;
  }

  img[align="left"] {
    padding-right: 20px;
  }

  samp {
    font-size: 85%;
  }

  del code {
    text-decoration: inherit;
  }

  code br,
  tt br {
    display: none;
  }

  :not(pre) > {
    code,
    tt {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      white-space: break-spaces;
      background-color: var(--color-neutral-muted);
      border-radius: 6px;
    }
  }

  pre > code {
    display: block;
    font-family: Consolas, Menlo, Courier, monospace;
    font-size: 0.9em;
    padding: 1em;
    overflow-x: auto;
    border-radius: 6px;
    border: thin solid var(--color-border-muted);
  }

  pre {
    position: relative;
  }

  pre > code + .code-copy-button {
    background-color: #999;
    color: #fff;
    opacity: 0.5;
    width: 24px;
    height: 24px;
    font-size: 14px;
    position: absolute;
    right: 6px;
    top: 6px;
    appearance: none;
    border: none;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;

    > svg {
      width: 12px;
      height: 12px;
      display: block;
      pointer-events: none;
    }

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
