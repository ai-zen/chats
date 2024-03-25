export function insertTextAtCursor(
  textarea: HTMLTextAreaElement,
  text: string
) {
  var startPos = textarea.selectionStart;
  var endPos = textarea.selectionEnd;

  // 在选中文本的起始位置和结束位置之间插入文本
  textarea.value =
    textarea.value.substring(0, startPos) +
    text +
    textarea.value.substring(endPos);

  // 将光标移动到插入文本的末尾
  textarea.selectionStart = startPos + text.length;
  textarea.selectionEnd = startPos + text.length;

  textarea.focus();

  return textarea.value;
}
