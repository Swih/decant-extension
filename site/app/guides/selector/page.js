import TipBox from '../../../components/TipBox';

export const metadata = { title: 'DOM Picker' };

export default function SelectorPage() {
  return (
    <>
      <h1>DOM Picker</h1>
      <p className="subtitle">Select and extract specific elements from any page.</p>

      <h2>What is DOM Picker?</h2>
      <p>
        DOM Picker is a visual selector tool that lets you click on any element to extract
        just that part of the page. It is useful when you only need a specific section — an
        article body, a table, a sidebar, or any other visible element.
      </p>

      <h2>How to Use</h2>
      <ol className="steps">
        <li>Open the Decant popup and click the cursor/picker icon (next to Extract)</li>
        <li>The popup closes and the page enters selection mode</li>
        <li>Hover over elements — they highlight with a purple overlay</li>
        <li>Click the element you want to extract</li>
        <li>The content is extracted and copied to your clipboard</li>
      </ol>

      <h2>Tips</h2>
      <TipBox>
        <p>Press <kbd>ESC</kbd> at any time to cancel the picker and return to normal browsing.</p>
      </TipBox>
      <ul>
        <li>Hover highlights show the element boundaries so you can precisely target the right section.</li>
        <li>Works with any visible DOM element — divs, articles, tables, sections, and more.</li>
        <li>The extracted content respects your current format setting (Markdown/JSON/MCP).</li>
      </ul>

      <h2>Use Cases</h2>
      <ul>
        <li>Extract just the comments section from a blog post</li>
        <li>Grab a specific data table from a report</li>
        <li>Extract a sidebar widget or navigation list</li>
        <li>Pick a single article from a multi-article page</li>
      </ul>
    </>
  );
}
