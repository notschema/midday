import type { EditorDoc } from "../types";

// Optimized version that maintains core functionality but is more efficient
export function formatEditorContent(doc?: EditorDoc): JSX.Element | null {
  if (!doc || !doc.content) {
    return null;
  }
  
  return (
    <div tw="flex flex-col text-white">
      {doc.content.map((node, nodeIndex) => {
        if (node.type === "paragraph" && node.content) {
          return (
            <p key={`p-${nodeIndex}`} tw="flex flex-col mb-0">
              {node.content.map((inline, inlineIndex) => {
                // Handle text nodes
                if (inline.type === "text" && inline.text) {
                  // Simplified style calculation
                  const hasMarks = inline.marks && inline.marks.length > 0;
                  const isBold = hasMarks && inline.marks.some(m => m.type === "bold");
                  const isItalic = hasMarks && inline.marks.some(m => m.type === "italic");
                  
                  let style = "text-[22px]";
                  if (isBold) style += " font-medium";
                  if (isItalic) style += " italic";
                  
                  return (
                    <span key={`t-${nodeIndex}-${inlineIndex}`} tw={style}>
                      {inline.text}
                    </span>
                  );
                }
                
                // Handle line breaks
                if (inline.type === "hardBreak") {
                  return <br key={`br-${nodeIndex}-${inlineIndex}`} />;
                }
                
                return null;
              })}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
