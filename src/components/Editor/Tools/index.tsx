import TextEditor from '../TextEditor';
import VoiceEditor from '../VoiceEditor';
import InpaintingEditor from '../InpaintingEditor';
import type { LineType } from '../InpaintingEditor';
import DragDropEditor, { type DroppedElement } from '../DragDropEditor';

interface BaseToolProps {
  onPromptChange: (prompt: string) => void;
  prompt: string;
}

export const TextTool = ({ onPromptChange, prompt }: BaseToolProps) => (
  <TextEditor onPromptChange={onPromptChange} prompt={prompt} />
);

export const VoiceTool = ({ onPromptChange, prompt }: BaseToolProps) => (
  <VoiceEditor onPromptChange={onPromptChange} prompt={prompt} />
);

interface InpaintingToolProps extends BaseToolProps {
  lines: LineType[];
  onLinesChange: (lines: LineType[]) => void;
  imageUrl?: string | null;
}

export const InpaintingTool = ({ onPromptChange, prompt, lines, onLinesChange, imageUrl }: InpaintingToolProps) => (
  <InpaintingEditor onPromptChange={onPromptChange} prompt={prompt} lines={lines} onLinesChange={onLinesChange} imageUrl={imageUrl} />
);

interface DragDropToolProps extends BaseToolProps {
  placedElements: DroppedElement[];
  onElementsChange: (elements: DroppedElement[]) => void;
  imageUrl?: string | null;
}

export const DragDropTool = ({ onPromptChange, prompt, placedElements, onElementsChange, imageUrl }: DragDropToolProps) => (
  <DragDropEditor onPromptChange={onPromptChange} prompt={prompt} placedElements={placedElements} onElementsChange={onElementsChange} imageUrl={imageUrl} />
);
