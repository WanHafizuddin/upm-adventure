import type { ClueInventory } from './clues';

export interface DialogueChoice {
  text: string;
  /** Id of the node this choice leads to, or null to end the conversation. */
  next: string | null;
  /** If set, the choice can only be picked while the player holds this clue. */
  requiresClue?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  /** Flag turned on when the player reaches this node. */
  setsFlag?: string;
  choices: DialogueChoice[];
}

export function isChoiceAvailable(choice: DialogueChoice, inventory: ClueInventory): boolean {
  return choice.requiresClue === undefined || inventory.has(choice.requiresClue);
}

/**
 * The node the conversation moves to after picking `index`.
 * Returns null when the choice ends the conversation, and `node` itself
 * when the index or the link is invalid (so a data mistake never crashes the game).
 */
export function resolveChoice(
  node: DialogueNode,
  index: number,
  nodes: Readonly<Record<string, DialogueNode>>,
): DialogueNode | null {
  const choice = node.choices[index];
  if (choice === undefined) return node;
  if (choice.next === null) return null;
  return nodes[choice.next] ?? node;
}
