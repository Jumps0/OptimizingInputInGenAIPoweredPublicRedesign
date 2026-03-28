interface TextEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

const TextEditor = ({ prompt, onPromptChange }: TextEditorProps) => {
  return (
    <div className="space-y-4 w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 mb-2">
          Describe your redesign
        </label>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="E.g., Add wooden benches, plant more trees, and create a small fountain in the center..."
          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-gray-700"
        />
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>Be specific about the elements you want to change.</span>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Tips for better results:</h4>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Mention specific materials (wood, stone, metal)</li>
          <li>Describe lighting (sunny, sunset, evening)</li>
          <li>Specify styles (modern, classical, eco-friendly)</li>
        </ul>
      </div>
    </div>
  );
};

export default TextEditor;
