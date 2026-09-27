# Campus Mystery — Day 1 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Day-1 vertical slice of the campus murder-mystery game — a player can move through one 3D location, talk to one suspect, pick up clues, connect evidence on a deduction board, and see a correct connection unlock new content — proving the full core loop end-to-end before any other days/suspects are built.

**Architecture:** Unity 2022.3 LTS project (URP 3D template). Game logic that can be pure C# (clue tracking, dialogue-choice gating, deduction-link validation, day-completion checking) is written as plain classes + ScriptableObject data and covered by Unity Test Framework EditMode (NUnit) tests. Scene wiring that requires Unity's runtime (player movement/camera, dialogue UI, deduction-board drag UI) is written as MonoBehaviours that call into the tested pure logic, verified with a manual Play Mode checklist instead of automated tests.

**Tech Stack:** Unity 2022.3 LTS, Universal Render Pipeline (URP), C#, Unity Test Framework (NUnit, EditMode), Unity's built-in UI (uGUI), [3D Free Modular Kit](https://assetstore.unity.com/packages/3d/environments/3d-free-modular-kit-85732) (free environment asset, reskinned).

## Global Constraints

- Camera/perspective: 3rd-person 3D (not top-down). Source: [2026-09-27-campus-mystery-game-design.md](../specs/2026-09-27-campus-mystery-game-design.md).
- Art direction: stylized-realistic, moody lighting carries the mood — not photorealism. No stealth/chase/antagonist-AI layer of any kind.
- Tone: noir-lite. No graphic gore; crime-scene detail stays implied via props, never shown directly.
- Setting must use a fictional campus name/branding only — never real UPM names, buildings, or branding, anywhere in code, data, or UI text.
- Environment art source is the free "3D Free Modular Kit" (generic/sci-fi themed by default) — it must be reskinned (retextured, redressed with school props) to read as a campus corridor/room, not used as-is.
- This plan implements **only** the Day-1 vertical slice: one location, one suspect, 2–3 clues, a partial deduction board, ending in at least one unlock. `ChapterManager` (multi-day gating) beyond a single day-completion check, `AccusationSystem` (final ending), the other two suspects, and the remaining locations are explicitly out of scope — they are follow-up plans once this slice is validated.

---

### Task 1: Unity Project Setup & Version Control

**Files:**
- Create: Unity project at repo root `C:\Users\My Pc\OneDrive\Desktop\upm-adventure` (Assets/, Packages/, ProjectSettings/)
- Create: `.gitignore` (extend existing repo-root `.gitignore`)
- Create: `Assets/_Project/Scripts/Runtime/` (empty, folder placeholder)
- Create: `Assets/_Project/Scripts/Tests/EditMode/` (empty, folder placeholder)
- Create: `Assets/_Project/Art/`, `Assets/_Project/Prefabs/`, `Assets/_Project/Scenes/` (empty, folder placeholders)

**Interfaces:**
- Produces: the Unity project itself, which every later task's files live inside.

- [ ] **Step 1: Create the Unity project**

  In Unity Hub: **New Project** → template **3D (URP)** → Project name `CampusMystery` → Location `C:\Users\My Pc\OneDrive\Desktop\upm-adventure` (so `Assets/`, `Packages/`, `ProjectSettings/` land at the repo root, alongside `docs/`) → Unity version **2022.3 LTS** (latest patch) → Create.

- [ ] **Step 2: Add Unity-specific ignores to `.gitignore`**

  Append to the existing `.gitignore`:

  ```
  # Unity
  [Ll]ibrary/
  [Tt]emp/
  [Oo]bj/
  [Bb]uild/
  [Bb]uilds/
  [Ll]ogs/
  [Mm]emoryCaptures/
  [Uu]ser[Ss]ettings/
  *.csproj
  *.sln
  *.suo
  *.user
  *.userprefs
  *.pidb
  *.booproj
  *.svd
  *.pdb
  *.mdb
  *.opendb
  *.VC.db
  sysinfo.txt
  crashlytics-build.properties
  ```

- [ ] **Step 3: Create the project folder skeleton**

  Inside the Unity Editor's Project window, create:
  - `Assets/_Project/Scripts/Runtime/`
  - `Assets/_Project/Scripts/Tests/EditMode/`
  - `Assets/_Project/Art/`
  - `Assets/_Project/Prefabs/`
  - `Assets/_Project/Scenes/`

  (Unity ignores empty folders in git; each will get a `.gitkeep`-style file once a real asset lands in it during a later task — no action needed now if they stay empty.)

- [ ] **Step 4: Commit**

  ```bash
  git add .gitignore Assets ProjectSettings Packages
  git commit -m "chore: scaffold Unity project (URP, 2022.3 LTS)"
  ```

---

### Task 2: Test Assemblies

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/CampusMystery.Runtime.asmdef`
- Create: `Assets/_Project/Scripts/Tests/EditMode/CampusMystery.Tests.EditMode.asmdef`
- Create: `Assets/_Project/Scripts/Tests/EditMode/SanityTest.cs`

**Interfaces:**
- Produces: assembly `CampusMystery.Runtime` (all game logic from Task 3 onward lives here), assembly `CampusMystery.Tests.EditMode` (all EditMode tests live here, references `CampusMystery.Runtime`).

- [ ] **Step 1: Create the runtime assembly definition**

  `Assets/_Project/Scripts/Runtime/CampusMystery.Runtime.asmdef`:

  ```json
  {
      "name": "CampusMystery.Runtime",
      "rootNamespace": "CampusMystery",
      "references": [],
      "includePlatforms": [],
      "excludePlatforms": [],
      "allowUnsafeCode": false,
      "overrideReferences": false,
      "autoReferenced": true,
      "defineConstraints": [],
      "noEngineReferences": false
  }
  ```

- [ ] **Step 2: Create the EditMode test assembly definition**

  `Assets/_Project/Scripts/Tests/EditMode/CampusMystery.Tests.EditMode.asmdef`:

  ```json
  {
      "name": "CampusMystery.Tests.EditMode",
      "rootNamespace": "CampusMystery.Tests",
      "references": [
          "CampusMystery.Runtime",
          "UnityEngine.TestRunner",
          "UnityEditor.TestRunner"
      ],
      "includePlatforms": [
          "Editor"
      ],
      "excludePlatforms": [],
      "allowUnsafeCode": false,
      "overrideReferences": true,
      "precompiledReferences": [
          "nunit.framework.dll"
      ],
      "autoReferenced": false,
      "defineConstraints": [
          "UNITY_INCLUDE_TESTS"
      ],
      "noEngineReferences": false
  }
  ```

- [ ] **Step 3: Write a sanity test**

  `Assets/_Project/Scripts/Tests/EditMode/SanityTest.cs`:

  ```csharp
  using NUnit.Framework;

  namespace CampusMystery.Tests
  {
      public class SanityTest
      {
          [Test]
          public void Addition_Works()
          {
              Assert.AreEqual(2, 1 + 1);
          }
      }
  }
  ```

- [ ] **Step 4: Run it**

  In Unity: **Window → General → Test Runner** → **EditMode** tab → **Run All**.
  Expected: `SanityTest.Addition_Works` passes (1 test, green).

- [ ] **Step 5: Commit**

  ```bash
  git add Assets/_Project/Scripts
  git commit -m "test: set up EditMode test assembly"
  ```

---

### Task 3: ClueData & ClueInventory

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Clues/ClueData.cs`
- Create: `Assets/_Project/Scripts/Runtime/Clues/ClueInventory.cs`
- Test: `Assets/_Project/Scripts/Tests/EditMode/ClueInventoryTests.cs`

**Interfaces:**
- Produces: `ClueData` (ScriptableObject: `clueId`, `displayName`, `description`), `ClueInventory` with `AddClue(ClueData)`, `HasClue(string clueId)`, `GetAllClues() : IReadOnlyCollection<ClueData>`. Used by Task 4 (dialogue gating) and Task 6/7 (deduction board).

- [ ] **Step 1: Write the failing tests**

  `Assets/_Project/Scripts/Tests/EditMode/ClueInventoryTests.cs`:

  ```csharp
  using NUnit.Framework;
  using UnityEngine;
  using CampusMystery.Clues;

  namespace CampusMystery.Tests
  {
      public class ClueInventoryTests
      {
          private ClueData MakeClue(string id)
          {
              var clue = ScriptableObject.CreateInstance<ClueData>();
              clue.clueId = id;
              clue.displayName = "Test Clue " + id;
              return clue;
          }

          [Test]
          public void HasClue_ReturnsFalse_WhenNotAdded()
          {
              var inventory = new ClueInventory();
              Assert.IsFalse(inventory.HasClue("torn_note"));
          }

          [Test]
          public void AddClue_ThenHasClue_ReturnsTrue()
          {
              var inventory = new ClueInventory();
              inventory.AddClue(MakeClue("torn_note"));
              Assert.IsTrue(inventory.HasClue("torn_note"));
          }

          [Test]
          public void AddClue_Twice_DoesNotDuplicate()
          {
              var inventory = new ClueInventory();
              inventory.AddClue(MakeClue("torn_note"));
              inventory.AddClue(MakeClue("torn_note"));
              Assert.AreEqual(1, inventory.GetAllClues().Count);
          }
      }
  }
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Test Runner → EditMode → Run All.
  Expected: FAIL to compile — `CampusMystery.Clues` namespace / `ClueData` / `ClueInventory` do not exist yet.

- [ ] **Step 3: Write the implementation**

  `Assets/_Project/Scripts/Runtime/Clues/ClueData.cs`:

  ```csharp
  using UnityEngine;

  namespace CampusMystery.Clues
  {
      [CreateAssetMenu(fileName = "NewClue", menuName = "CampusMystery/Clue")]
      public class ClueData : ScriptableObject
      {
          public string clueId;
          public string displayName;
          [TextArea] public string description;
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Clues/ClueInventory.cs`:

  ```csharp
  using System.Collections.Generic;

  namespace CampusMystery.Clues
  {
      public class ClueInventory
      {
          private readonly Dictionary<string, ClueData> _cluesById = new Dictionary<string, ClueData>();

          public void AddClue(ClueData clue)
          {
              if (clue == null || string.IsNullOrEmpty(clue.clueId)) return;
              _cluesById[clue.clueId] = clue;
          }

          public bool HasClue(string clueId)
          {
              return _cluesById.ContainsKey(clueId);
          }

          public IReadOnlyCollection<ClueData> GetAllClues()
          {
              return _cluesById.Values;
          }
      }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Test Runner → EditMode → Run All.
  Expected: 3 new tests pass (plus the Task 2 sanity test).

- [ ] **Step 5: Commit**

  ```bash
  git add Assets/_Project/Scripts
  git commit -m "feat: add ClueData and ClueInventory"
  ```

---

### Task 4: Dialogue Data Model & Choice Gating

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Dialogue/DialogueFlags.cs`
- Create: `Assets/_Project/Scripts/Runtime/Dialogue/DialogueChoice.cs`
- Create: `Assets/_Project/Scripts/Runtime/Dialogue/DialogueNode.cs`
- Create: `Assets/_Project/Scripts/Runtime/Dialogue/DialogueAvailability.cs`
- Test: `Assets/_Project/Scripts/Tests/EditMode/DialogueAvailabilityTests.cs`
- Test: `Assets/_Project/Scripts/Tests/EditMode/DialogueFlagsTests.cs`

**Interfaces:**
- Consumes: `ClueInventory.HasClue(string)` from Task 3.
- Produces: `DialogueFlags` (`Set(string, bool = true)`, `Get(string) : bool`), `DialogueChoice` (`choiceText`, `nextNodeId`, `requiredClueId`), `DialogueNode` (ScriptableObject: `nodeId`, `suspectId`, `bodyText`, `choices : List<DialogueChoice>`), `DialogueAvailability.IsChoiceAvailable(DialogueChoice, ClueInventory) : bool`. Used by Task 5 (DialogueRunner) and Task 6 (deduction unlocks write into `DialogueFlags`).

- [ ] **Step 1: Write the failing tests**

  `Assets/_Project/Scripts/Tests/EditMode/DialogueFlagsTests.cs`:

  ```csharp
  using NUnit.Framework;
  using CampusMystery.Dialogue;

  namespace CampusMystery.Tests
  {
      public class DialogueFlagsTests
      {
          [Test]
          public void Get_ReturnsFalse_ForUnsetFlag()
          {
              var flags = new DialogueFlags();
              Assert.IsFalse(flags.Get("heard_alibi_suspect_a"));
          }

          [Test]
          public void Set_ThenGet_ReturnsTrue()
          {
              var flags = new DialogueFlags();
              flags.Set("heard_alibi_suspect_a");
              Assert.IsTrue(flags.Get("heard_alibi_suspect_a"));
          }
      }
  }
  ```

  `Assets/_Project/Scripts/Tests/EditMode/DialogueAvailabilityTests.cs`:

  ```csharp
  using NUnit.Framework;
  using CampusMystery.Clues;
  using CampusMystery.Dialogue;

  namespace CampusMystery.Tests
  {
      public class DialogueAvailabilityTests
      {
          [Test]
          public void Choice_WithNoRequirement_IsAlwaysAvailable()
          {
              var choice = new DialogueChoice { choiceText = "Ask about the exam", nextNodeId = "n2" };
              var inventory = new ClueInventory();

              Assert.IsTrue(DialogueAvailability.IsChoiceAvailable(choice, inventory));
          }

          [Test]
          public void Choice_WithRequirement_UnavailableWithoutClue()
          {
              var choice = new DialogueChoice { choiceText = "Confront about the note", nextNodeId = "n3", requiredClueId = "torn_note" };
              var inventory = new ClueInventory();

              Assert.IsFalse(DialogueAvailability.IsChoiceAvailable(choice, inventory));
          }

          [Test]
          public void Choice_WithRequirement_AvailableOnceClueHeld()
          {
              var choice = new DialogueChoice { choiceText = "Confront about the note", nextNodeId = "n3", requiredClueId = "torn_note" };
              var inventory = new ClueInventory();
              var clue = UnityEngine.ScriptableObject.CreateInstance<ClueData>();
              clue.clueId = "torn_note";
              inventory.AddClue(clue);

              Assert.IsTrue(DialogueAvailability.IsChoiceAvailable(choice, inventory));
          }
      }
  }
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Test Runner → EditMode → Run All.
  Expected: FAIL to compile — `DialogueFlags`, `DialogueChoice`, `DialogueAvailability` do not exist yet.

- [ ] **Step 3: Write the implementation**

  `Assets/_Project/Scripts/Runtime/Dialogue/DialogueFlags.cs`:

  ```csharp
  using System.Collections.Generic;

  namespace CampusMystery.Dialogue
  {
      public class DialogueFlags
      {
          private readonly Dictionary<string, bool> _flags = new Dictionary<string, bool>();

          public void Set(string flagId, bool value = true)
          {
              _flags[flagId] = value;
          }

          public bool Get(string flagId)
          {
              return _flags.TryGetValue(flagId, out var value) && value;
          }
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Dialogue/DialogueChoice.cs`:

  ```csharp
  using System;

  namespace CampusMystery.Dialogue
  {
      [Serializable]
      public class DialogueChoice
      {
          public string choiceText;
          public string nextNodeId;
          public string requiredClueId;
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Dialogue/DialogueNode.cs`:

  ```csharp
  using System.Collections.Generic;
  using UnityEngine;

  namespace CampusMystery.Dialogue
  {
      [CreateAssetMenu(fileName = "NewDialogueNode", menuName = "CampusMystery/Dialogue Node")]
      public class DialogueNode : ScriptableObject
      {
          public string nodeId;
          public string suspectId;
          [TextArea] public string bodyText;
          public List<DialogueChoice> choices = new List<DialogueChoice>();
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Dialogue/DialogueAvailability.cs`:

  ```csharp
  using CampusMystery.Clues;

  namespace CampusMystery.Dialogue
  {
      public static class DialogueAvailability
      {
          public static bool IsChoiceAvailable(DialogueChoice choice, ClueInventory inventory)
          {
              if (string.IsNullOrEmpty(choice.requiredClueId)) return true;
              return inventory.HasClue(choice.requiredClueId);
          }
      }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Test Runner → EditMode → Run All.
  Expected: all tests pass (Task 2 sanity + Task 3 clue tests + these 5 new tests).

- [ ] **Step 5: Commit**

  ```bash
  git add Assets/_Project/Scripts
  git commit -m "feat: add dialogue data model and choice gating"
  ```

---

### Task 5: DialogueRunner (Scene Wiring)

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Dialogue/DialogueRunner.cs`
- Create: `Assets/_Project/Scenes/DialogueTest.unity` (temporary scratch scene for manual verification)

**Interfaces:**
- Consumes: `DialogueNode`, `DialogueChoice`, `DialogueAvailability.IsChoiceAvailable`, `ClueInventory`, `DialogueFlags` (all from Task 4/3).
- Produces: `DialogueRunner.GetNextNode(DialogueNode current, int choiceIndex, Dictionary<string, DialogueNode> allNodesById) : DialogueNode` (pure, callable from later tasks/tests) plus a MonoBehaviour that drives simple UI Text + Buttons from it.

- [ ] **Step 1: Write the pure traversal method**

  `Assets/_Project/Scripts/Runtime/Dialogue/DialogueRunner.cs`:

  ```csharp
  using System.Collections.Generic;
  using System.Linq;
  using UnityEngine;
  using UnityEngine.UI;
  using CampusMystery.Clues;

  namespace CampusMystery.Dialogue
  {
      public class DialogueRunner : MonoBehaviour
      {
          [SerializeField] private Text bodyText;
          [SerializeField] private Button[] choiceButtons;
          [SerializeField] private Text[] choiceLabels;

          private Dictionary<string, DialogueNode> _nodesById;
          private ClueInventory _inventory;
          private DialogueFlags _flags;
          private DialogueNode _currentNode;

          public static DialogueNode GetNextNode(DialogueNode current, int choiceIndex, Dictionary<string, DialogueNode> allNodesById)
          {
              if (current == null || choiceIndex < 0 || choiceIndex >= current.choices.Count) return current;
              var nextId = current.choices[choiceIndex].nextNodeId;
              return allNodesById.TryGetValue(nextId, out var next) ? next : current;
          }

          public void StartDialogue(DialogueNode startNode, IEnumerable<DialogueNode> allNodes, ClueInventory inventory, DialogueFlags flags)
          {
              _nodesById = allNodes.ToDictionary(n => n.nodeId, n => n);
              _inventory = inventory;
              _flags = flags;
              ShowNode(startNode);
          }

          private void ShowNode(DialogueNode node)
          {
              _currentNode = node;
              bodyText.text = node.bodyText;

              for (int i = 0; i < choiceButtons.Length; i++)
              {
                  if (i < node.choices.Count)
                  {
                      var choice = node.choices[i];
                      bool available = DialogueAvailability.IsChoiceAvailable(choice, _inventory);
                      choiceButtons[i].gameObject.SetActive(true);
                      choiceButtons[i].interactable = available;
                      choiceLabels[i].text = choice.choiceText;

                      int capturedIndex = i;
                      choiceButtons[i].onClick.RemoveAllListeners();
                      choiceButtons[i].onClick.AddListener(() => OnChoiceSelected(capturedIndex));
                  }
                  else
                  {
                      choiceButtons[i].gameObject.SetActive(false);
                  }
              }
          }

          private void OnChoiceSelected(int choiceIndex)
          {
              var next = GetNextNode(_currentNode, choiceIndex, _nodesById);
              ShowNode(next);
          }
      }
  }
  ```

  Note: `DialogueRunner.GetNextNode` is `static` and takes plain data in — it is exercised directly (no Unity scene needed) in the next step even though it lives in a `MonoBehaviour` file.

- [ ] **Step 2: Add a traversal test for the pure method**

  `Assets/_Project/Scripts/Tests/EditMode/DialogueRunnerTests.cs`:

  ```csharp
  using System.Collections.Generic;
  using NUnit.Framework;
  using UnityEngine;
  using CampusMystery.Dialogue;

  namespace CampusMystery.Tests
  {
      public class DialogueRunnerTests
      {
          private DialogueNode MakeNode(string id, params DialogueChoice[] choices)
          {
              var node = ScriptableObject.CreateInstance<DialogueNode>();
              node.nodeId = id;
              node.choices = new List<DialogueChoice>(choices);
              return node;
          }

          [Test]
          public void GetNextNode_FollowsChoiceLink()
          {
              var nodeB = MakeNode("n2");
              var nodeA = MakeNode("n1", new DialogueChoice { choiceText = "Continue", nextNodeId = "n2" });
              var lookup = new Dictionary<string, DialogueNode> { { "n1", nodeA }, { "n2", nodeB } };

              var result = DialogueRunner.GetNextNode(nodeA, 0, lookup);

              Assert.AreEqual("n2", result.nodeId);
          }

          [Test]
          public void GetNextNode_InvalidIndex_StaysOnCurrentNode()
          {
              var nodeA = MakeNode("n1", new DialogueChoice { choiceText = "Continue", nextNodeId = "n2" });
              var lookup = new Dictionary<string, DialogueNode> { { "n1", nodeA } };

              var result = DialogueRunner.GetNextNode(nodeA, 5, lookup);

              Assert.AreEqual("n1", result.nodeId);
          }
      }
  }
  ```

  Run Test Runner → EditMode → Run All. Expected: both pass.

- [ ] **Step 3: Manually wire a test scene**

  Create `Assets/_Project/Scenes/DialogueTest.unity`:
  - Add a Canvas with one `Text` (body) and 3 `Button` + child `Text` (choice labels 0–2).
  - Add an empty GameObject `DialogueTestHarness` with the `DialogueRunner` component, wiring the `bodyText`/`choiceButtons`/`choiceLabels` fields in the Inspector.
  - Create 2 `DialogueNode` assets via **Assets → Create → CampusMystery → Dialogue Node** (`n1` with one choice pointing to `n2`, `n2` with no choices) to hand-test the flow.
  - Add a small bootstrap script (or Inspector-driven call) that calls `StartDialogue(n1, new[]{n1,n2}, new ClueInventory(), new DialogueFlags())` on Play.

- [ ] **Step 4: Manual playtest checklist**

  Press Play:
  - [ ] Body text shows node `n1`'s text.
  - [ ] Clicking the wired choice button advances to node `n2`'s text.
  - [ ] Unused choice buttons/slots are hidden (not just blank).

- [ ] **Step 5: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes
  git commit -m "feat: add DialogueRunner and manual dialogue test scene"
  ```

---

### Task 6: Deduction Solution Table & Validator

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionLink.cs`
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionSolutionTable.cs`
- Create: `Assets/_Project/Scripts/Runtime/Deduction/ConnectionResult.cs`
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionValidator.cs`
- Test: `Assets/_Project/Scripts/Tests/EditMode/DeductionValidatorTests.cs`

**Interfaces:**
- Produces: `DeductionValidator(DeductionSolutionTable table)` with `TryConnect(string clueId, string targetId) : ConnectionResult { bool IsValid; IReadOnlyList<string> UnlockedFlags; }`. Used by Task 7 (deduction board UI), which writes `UnlockedFlags` into the `DialogueFlags` from Task 4.

- [ ] **Step 1: Write the failing tests**

  `Assets/_Project/Scripts/Tests/EditMode/DeductionValidatorTests.cs`:

  ```csharp
  using System.Collections.Generic;
  using NUnit.Framework;
  using UnityEngine;
  using CampusMystery.Deduction;

  namespace CampusMystery.Tests
  {
      public class DeductionValidatorTests
      {
          private DeductionSolutionTable MakeTable(params DeductionLink[] links)
          {
              var table = ScriptableObject.CreateInstance<DeductionSolutionTable>();
              table.validLinks = new List<DeductionLink>(links);
              return table;
          }

          [Test]
          public void TryConnect_ValidPair_ReturnsValidWithFlags()
          {
              var link = new DeductionLink
              {
                  clueId = "torn_note",
                  targetId = "suspect_a",
                  targetType = "Suspect",
                  unlockFlags = new List<string> { "linked_note_to_suspect_a" }
              };
              var validator = new DeductionValidator(MakeTable(link));

              var result = validator.TryConnect("torn_note", "suspect_a");

              Assert.IsTrue(result.IsValid);
              CollectionAssert.AreEqual(new[] { "linked_note_to_suspect_a" }, result.UnlockedFlags);
          }

          [Test]
          public void TryConnect_UnknownPair_ReturnsInvalid()
          {
              var validator = new DeductionValidator(MakeTable());

              var result = validator.TryConnect("torn_note", "suspect_b");

              Assert.IsFalse(result.IsValid);
              Assert.IsEmpty(result.UnlockedFlags);
          }

          [Test]
          public void TryConnect_SamePairTwice_SecondTimeReturnsInvalid()
          {
              var link = new DeductionLink { clueId = "torn_note", targetId = "suspect_a", targetType = "Suspect", unlockFlags = new List<string>() };
              var validator = new DeductionValidator(MakeTable(link));

              validator.TryConnect("torn_note", "suspect_a");
              var second = validator.TryConnect("torn_note", "suspect_a");

              Assert.IsFalse(second.IsValid);
          }
      }
  }
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Test Runner → EditMode → Run All.
  Expected: FAIL to compile — `DeductionLink`, `DeductionSolutionTable`, `DeductionValidator` do not exist yet.

- [ ] **Step 3: Write the implementation**

  `Assets/_Project/Scripts/Runtime/Deduction/DeductionLink.cs`:

  ```csharp
  using System;
  using System.Collections.Generic;

  namespace CampusMystery.Deduction
  {
      [Serializable]
      public class DeductionLink
      {
          public string clueId;
          public string targetId;
          public string targetType; // "Suspect" | "Motive" | "Location"
          public List<string> unlockFlags = new List<string>();
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Deduction/DeductionSolutionTable.cs`:

  ```csharp
  using System.Collections.Generic;
  using UnityEngine;

  namespace CampusMystery.Deduction
  {
      [CreateAssetMenu(fileName = "NewDeductionSolutionTable", menuName = "CampusMystery/Deduction Solution Table")]
      public class DeductionSolutionTable : ScriptableObject
      {
          public List<DeductionLink> validLinks = new List<DeductionLink>();
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Deduction/ConnectionResult.cs`:

  ```csharp
  using System.Collections.Generic;

  namespace CampusMystery.Deduction
  {
      public class ConnectionResult
      {
          public bool IsValid;
          public IReadOnlyList<string> UnlockedFlags;
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Deduction/DeductionValidator.cs`:

  ```csharp
  using System;
  using System.Collections.Generic;
  using System.Linq;

  namespace CampusMystery.Deduction
  {
      public class DeductionValidator
      {
          private readonly DeductionSolutionTable _table;
          private readonly HashSet<(string clueId, string targetId)> _madeConnections = new HashSet<(string, string)>();

          public DeductionValidator(DeductionSolutionTable table)
          {
              _table = table;
          }

          public ConnectionResult TryConnect(string clueId, string targetId)
          {
              var key = (clueId, targetId);
              if (_madeConnections.Contains(key))
              {
                  return new ConnectionResult { IsValid = false, UnlockedFlags = Array.Empty<string>() };
              }

              var match = _table.validLinks.FirstOrDefault(l => l.clueId == clueId && l.targetId == targetId);
              if (match == null)
              {
                  return new ConnectionResult { IsValid = false, UnlockedFlags = Array.Empty<string>() };
              }

              _madeConnections.Add(key);
              return new ConnectionResult { IsValid = true, UnlockedFlags = match.unlockFlags };
          }
      }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Test Runner → EditMode → Run All. Expected: all tests pass, including the 3 new ones.

- [ ] **Step 5: Commit**

  ```bash
  git add Assets/_Project/Scripts
  git commit -m "feat: add deduction solution table and validator"
  ```

---

### Task 7: Deduction Board UI (Scene Wiring)

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionBoardController.cs`
- Create: `Assets/_Project/Scenes/DeductionBoardTest.unity` (temporary scratch scene for manual verification)

**Interfaces:**
- Consumes: `DeductionValidator.TryConnect` (Task 6), `DialogueFlags.Set` (Task 4).
- Produces: a working drag-and-connect UI that calls `DeductionValidator` and writes unlocked flags into `DialogueFlags` — this is what Task 10 wires into the full scene.

- [ ] **Step 1: Write the board controller**

  `Assets/_Project/Scripts/Runtime/Deduction/DeductionBoardController.cs`:

  ```csharp
  using UnityEngine;
  using UnityEngine.EventSystems;
  using CampusMystery.Dialogue;

  namespace CampusMystery.Deduction
  {
      public class DeductionBoardController : MonoBehaviour
      {
          [SerializeField] private LineRenderer dragLinePreview;

          private DeductionValidator _validator;
          private DialogueFlags _flags;
          private DeductionNodeView _dragSource;

          public void Initialize(DeductionValidator validator, DialogueFlags flags)
          {
              _validator = validator;
              _flags = flags;
          }

          public void BeginDrag(DeductionNodeView source)
          {
              _dragSource = source;
              dragLinePreview.positionCount = 2;
              dragLinePreview.enabled = true;
          }

          public void UpdateDrag(Vector3 worldPosition)
          {
              if (_dragSource == null) return;
              dragLinePreview.SetPosition(0, _dragSource.transform.position);
              dragLinePreview.SetPosition(1, worldPosition);
          }

          public void EndDrag(DeductionNodeView target)
          {
              dragLinePreview.enabled = false;
              if (_dragSource == null || target == null || target == _dragSource)
              {
                  _dragSource = null;
                  return;
              }

              var result = _validator.TryConnect(_dragSource.NodeId, target.NodeId);
              if (result.IsValid)
              {
                  foreach (var flag in result.UnlockedFlags)
                  {
                      _flags.Set(flag);
                  }
                  target.MarkConnected();
                  _dragSource.MarkConnected();
              }

              _dragSource = null;
          }
      }

      public class DeductionNodeView : MonoBehaviour, IPointerDownHandler, IPointerUpHandler
      {
          public string NodeId;
          [SerializeField] private DeductionBoardController board;
          [SerializeField] private Renderer nodeRenderer;

          public void OnPointerDown(PointerEventData eventData)
          {
              board.BeginDrag(this);
          }

          public void OnPointerUp(PointerEventData eventData)
          {
              board.EndDrag(this);
          }

          public void MarkConnected()
          {
              if (nodeRenderer != null) nodeRenderer.material.color = Color.green;
          }
      }
  }
  ```

- [ ] **Step 2: Manually build a test scene**

  Create `Assets/_Project/Scenes/DeductionBoardTest.unity`:
  - Add a `DeductionBoardController` on an empty GameObject, with a `LineRenderer` child assigned to `dragLinePreview`.
  - Add 2–3 simple 3D objects (cubes/quads) each with a `DeductionNodeView`, `NodeId` set (e.g. `torn_note`, `suspect_a`), `board` wired to the controller.
  - Add a small bootstrap script/Inspector call that builds a `DeductionSolutionTable` asset with one link (`torn_note` → `suspect_a`, unlockFlags = `["linked_note_to_suspect_a"]`) and calls `Initialize(new DeductionValidator(table), new DialogueFlags())`.

- [ ] **Step 3: Manual playtest checklist**

  Press Play:
  - [ ] Clicking-and-dragging from the `torn_note` node to the `suspect_a` node turns both green (valid connection).
  - [ ] Dragging from `torn_note` to an unrelated node does **not** turn them green (invalid connection, silently rejected).
  - [ ] Repeating the same valid drag a second time does not throw an error (idempotent, per `DeductionValidatorTests.TryConnect_SamePairTwice_SecondTimeReturnsInvalid`).

- [ ] **Step 4: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes
  git commit -m "feat: add deduction board drag-and-connect UI"
  ```

---

### Task 8: Day-1 Completion Check

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Chapters/DayRequirements.cs`
- Create: `Assets/_Project/Scripts/Runtime/Chapters/DayCompletion.cs`
- Test: `Assets/_Project/Scripts/Tests/EditMode/DayCompletionTests.cs`

**Interfaces:**
- Consumes: `DialogueFlags.Get(string)` (Task 4).
- Produces: `DayCompletion.IsDayComplete(DayRequirements, DialogueFlags) : bool`. Used by Task 10 to decide when to show the "Day 1 complete" beat.

- [ ] **Step 1: Write the failing tests**

  `Assets/_Project/Scripts/Tests/EditMode/DayCompletionTests.cs`:

  ```csharp
  using System.Collections.Generic;
  using NUnit.Framework;
  using UnityEngine;
  using CampusMystery.Chapters;
  using CampusMystery.Dialogue;

  namespace CampusMystery.Tests
  {
      public class DayCompletionTests
      {
          private DayRequirements MakeRequirements(params string[] flagIds)
          {
              var req = ScriptableObject.CreateInstance<DayRequirements>();
              req.requiredFlags = new List<string>(flagIds);
              return req;
          }

          [Test]
          public void IsDayComplete_FalseWhenFlagsMissing()
          {
              var requirements = MakeRequirements("met_suspect_a", "linked_note_to_suspect_a");
              var flags = new DialogueFlags();
              flags.Set("met_suspect_a");

              Assert.IsFalse(DayCompletion.IsDayComplete(requirements, flags));
          }

          [Test]
          public void IsDayComplete_TrueWhenAllFlagsSet()
          {
              var requirements = MakeRequirements("met_suspect_a", "linked_note_to_suspect_a");
              var flags = new DialogueFlags();
              flags.Set("met_suspect_a");
              flags.Set("linked_note_to_suspect_a");

              Assert.IsTrue(DayCompletion.IsDayComplete(requirements, flags));
          }
      }
  }
  ```

- [ ] **Step 2: Run tests to verify they fail**

  Test Runner → EditMode → Run All.
  Expected: FAIL to compile — `DayRequirements`, `DayCompletion` do not exist yet.

- [ ] **Step 3: Write the implementation**

  `Assets/_Project/Scripts/Runtime/Chapters/DayRequirements.cs`:

  ```csharp
  using System.Collections.Generic;
  using UnityEngine;

  namespace CampusMystery.Chapters
  {
      [CreateAssetMenu(fileName = "NewDayRequirements", menuName = "CampusMystery/Day Requirements")]
      public class DayRequirements : ScriptableObject
      {
          public List<string> requiredFlags = new List<string>();
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Chapters/DayCompletion.cs`:

  ```csharp
  using CampusMystery.Dialogue;

  namespace CampusMystery.Chapters
  {
      public static class DayCompletion
      {
          public static bool IsDayComplete(DayRequirements requirements, DialogueFlags flags)
          {
              foreach (var flagId in requirements.requiredFlags)
              {
                  if (!flags.Get(flagId)) return false;
              }
              return true;
          }
      }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  Test Runner → EditMode → Run All. Expected: all tests pass, including the 2 new ones.

- [ ] **Step 5: Commit**

  ```bash
  git add Assets/_Project/Scripts
  git commit -m "feat: add Day 1 completion check"
  ```

---

### Task 9: Player Controller (Scene Wiring)

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Player/PlayerController.cs`
- Create: `Assets/_Project/Scripts/Runtime/Player/InteractionTrigger.cs`

**Interfaces:**
- Produces: 3rd-person movement + camera-relative input, and an `InteractionTrigger` component that any NPC/clue object can carry to respond to player "interact" input. Task 10 places this on the player prefab and wires `InteractionTrigger`s to `DialogueRunner.StartDialogue` and `ClueInventory.AddClue`.

- [ ] **Step 1: Write the player controller**

  `Assets/_Project/Scripts/Runtime/Player/PlayerController.cs`:

  ```csharp
  using UnityEngine;

  namespace CampusMystery.Player
  {
      [RequireComponent(typeof(CharacterController))]
      public class PlayerController : MonoBehaviour
      {
          [SerializeField] private float moveSpeed = 4f;
          [SerializeField] private float rotationSpeed = 10f;
          [SerializeField] private Transform cameraTransform;
          [SerializeField] private float interactRadius = 1.5f;
          [SerializeField] private LayerMask interactableLayer;

          private CharacterController _controller;

          private void Awake()
          {
              _controller = GetComponent<CharacterController>();
          }

          private void Update()
          {
              HandleMovement();
              HandleInteract();
          }

          private void HandleMovement()
          {
              float h = Input.GetAxisRaw("Horizontal");
              float v = Input.GetAxisRaw("Vertical");
              Vector3 inputDir = new Vector3(h, 0f, v).normalized;
              if (inputDir.sqrMagnitude < 0.0001f) return;

              Vector3 forward = cameraTransform.forward; forward.y = 0f; forward.Normalize();
              Vector3 right = cameraTransform.right; right.y = 0f; right.Normalize();
              Vector3 moveDir = (forward * inputDir.z + right * inputDir.x).normalized;

              _controller.SimpleMove(moveDir * moveSpeed);

              Quaternion targetRotation = Quaternion.LookRotation(moveDir, Vector3.up);
              transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
          }

          private void HandleInteract()
          {
              if (!Input.GetKeyDown(KeyCode.E)) return;

              var hits = Physics.OverlapSphere(transform.position, interactRadius, interactableLayer);
              foreach (var hit in hits)
              {
                  var trigger = hit.GetComponent<InteractionTrigger>();
                  if (trigger != null)
                  {
                      trigger.Interact();
                      break;
                  }
              }
          }
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Player/InteractionTrigger.cs`:

  ```csharp
  using UnityEngine;
  using UnityEngine.Events;

  namespace CampusMystery.Player
  {
      public class InteractionTrigger : MonoBehaviour
      {
          [SerializeField] private UnityEvent onInteract;

          public void Interact()
          {
              onInteract?.Invoke();
          }
      }
  }
  ```

- [ ] **Step 2: Manually build a test scene**

  In a new or existing scratch scene:
  - Add a capsule with `CharacterController` + `PlayerController`, `cameraTransform` wired to the Main Camera, `interactableLayer` set to a new "Interactable" layer.
  - Position the Main Camera behind/above the capsule (simple 3rd-person offset, no follow-script needed yet — a static child-of-player transform is enough for this slice).
  - Add a cube on the "Interactable" layer with an `InteractionTrigger`, `onInteract` wired to `Debug.Log("Interacted!")` for now.

- [ ] **Step 3: Manual playtest checklist**

  Press Play:
  - [ ] WASD/arrow keys move the capsule relative to the camera's facing direction.
  - [ ] The capsule rotates to face its movement direction.
  - [ ] Standing near the cube and pressing `E` logs "Interacted!" in the Console.
  - [ ] Pressing `E` far from the cube does nothing.

- [ ] **Step 4: Commit**

  ```bash
  git add Assets/_Project/Scripts
  git commit -m "feat: add 3rd-person player controller and interaction trigger"
  ```

---

### Task 10: Wire the Full Day-1 Vertical Slice

**Files:**
- Create: `Assets/_Project/Scenes/Day1.unity`
- Create: `Assets/_Project/Scripts/Runtime/GameBootstrap.cs`
- Create: 1 suspect's content as data assets: `Assets/_Project/Art/Data/Suspects/SuspectA_Node1.asset`, `SuspectA_Node2.asset` (DialogueNode), `Assets/_Project/Art/Data/Clues/TornNote.asset`, `AlibiWitnessStatement.asset` (ClueData), `Assets/_Project/Art/Data/DeductionSolution.asset` (DeductionSolutionTable), `Assets/_Project/Art/Data/Day1Requirements.asset` (DayRequirements)

**Interfaces:**
- Consumes: every system produced in Tasks 3–9.
- Produces: the playable Day-1 vertical slice scene — the deliverable this whole plan exists to build.

- [ ] **Step 1: Reskin the environment**

  Import the [3D Free Modular Kit](https://assetstore.unity.com/packages/3d/environments/3d-free-modular-kit-85732) via the Unity Editor's Asset Store window. Build one small location (e.g. a short corridor + one room) from its modular pieces. Reskin: swap default materials for muted/desaturated ones, add school-appropriate dressing (a bench, lockers or shelving, signage text using the fictional campus name from the spec — never real UPM branding). Set up basic URP lighting: low ambient, one or two warm key lights, to get the moody stylized-realistic look.

- [ ] **Step 2: Author the suspect's dialogue content**

  Create 2 `DialogueNode` assets for suspect A:
  - `SuspectA_Node1`: `nodeId = "suspectA_1"`, `suspectId = "suspect_a"`, opening testimony/alibi text, one choice with no requirement (`"Ask something else"` → loops or ends) and one choice `requiredClueId = "torn_note"` (`"Ask about the note"` → `nextNodeId = "suspectA_2"`).
  - `SuspectA_Node2`: `nodeId = "suspectA_2"`, reaction once confronted with the note — this is where `flags.Set("linked_note_to_suspect_a")` conceptually lands (set by the deduction board in Step 4 below, not by this node directly).

- [ ] **Step 3: Author the clues**

  Create `TornNote` and `AlibiWitnessStatement` `ClueData` assets (`clueId = "torn_note"`, `clueId = "alibi_witness_statement"`) with short descriptions. Place them in the scene as pickup objects (simple prefab: mesh + `InteractionTrigger` whose `onInteract` calls into a small pickup script that calls `ClueInventory.AddClue`).

- [ ] **Step 4: Author the deduction data**

  Create `Day1Requirements` (`requiredFlags = ["met_suspect_a", "linked_note_to_suspect_a"]`) and `DeductionSolutionTable` with one `DeductionLink` (`clueId = "torn_note"`, `targetId = "suspect_a"`, `targetType = "Suspect"`, `unlockFlags = ["linked_note_to_suspect_a"]`).

- [ ] **Step 5: Bootstrap and wire the scene**

  `Assets/_Project/Scripts/Runtime/GameBootstrap.cs`:

  ```csharp
  using System.Collections.Generic;
  using UnityEngine;
  using CampusMystery.Clues;
  using CampusMystery.Dialogue;
  using CampusMystery.Deduction;
  using CampusMystery.Chapters;

  namespace CampusMystery
  {
      public class GameBootstrap : MonoBehaviour
      {
          [SerializeField] private DeductionSolutionTable solutionTable;
          [SerializeField] private DayRequirements day1Requirements;
          [SerializeField] private DeductionBoardController deductionBoard;

          private ClueInventory _clueInventory;
          private DialogueFlags _flags;
          private DeductionValidator _validator;

          private void Awake()
          {
              _clueInventory = new ClueInventory();
              _flags = new DialogueFlags();
              _validator = new DeductionValidator(solutionTable);
              deductionBoard.Initialize(_validator, _flags);
          }

          public ClueInventory ClueInventory => _clueInventory;
          public DialogueFlags Flags => _flags;

          public bool IsDay1Complete()
          {
              return DayCompletion.IsDayComplete(day1Requirements, _flags);
          }
      }
  }
  ```

  In `Day1.unity`:
  - Place the reskinned location from Step 1.
  - Place the `PlayerController` capsule (Task 9) in the location.
  - Place suspect A as an object with `InteractionTrigger` → calls `DialogueRunner.StartDialogue(SuspectA_Node1, new[]{SuspectA_Node1, SuspectA_Node2}, bootstrap.ClueInventory, bootstrap.Flags)`, with `bootstrap.Flags.Set("met_suspect_a")` also called on first interact.
  - Place the two clue pickups from Step 3.
  - Place the deduction board (Task 7) with its `DeductionSolutionTable` wired to the Step 4 asset, in a small side area or as a toggleable UI panel.
  - Add one `GameBootstrap` in the scene wired to the Step 4 assets and the deduction board.

- [ ] **Step 6: Full manual playtest checklist**

  Press Play on `Day1.unity`:
  - [ ] Player can walk from the entrance to every clue and to the suspect.
  - [ ] Picking up `TornNote` and `AlibiWitnessStatement` adds them to the inventory (verify via a temporary on-screen debug list or Console log).
  - [ ] Talking to suspect A before picking up `torn_note` does **not** show the "Ask about the note" choice; after picking it up, the choice appears.
  - [ ] Connecting `torn_note` → `suspect_a` on the deduction board turns both nodes green and does not error.
  - [ ] After that connection, `GameBootstrap.IsDay1Complete()` becomes true once `met_suspect_a` is also set (verify via a temporary debug button/log — a real "Day 1 complete" scene transition is out of scope for this slice).
  - [ ] Connecting an unrelated clue/suspect pair on the board is silently rejected (no false unlock, no error).

- [ ] **Step 7: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes Assets/_Project/Art
  git commit -m "feat: wire Day 1 vertical slice end-to-end"
  ```

---

## Self-Review Notes

- **Spec coverage:** player movement/camera (Task 9), dialogue + clue-gated choices (Tasks 3–5), clue pickups (Task 3, wired in Task 10), deduction board connect-and-unlock (Tasks 6–7), day-completion check (Task 8), environment reskin of the free kit (Task 10 Step 1), fictional-campus-name constraint (called out in Task 10 Step 1 and Global Constraints). `ChapterManager` multi-day gating beyond a single day and `AccusationSystem` are intentionally deferred — see Global Constraints.
- **Type consistency:** `ClueInventory`/`ClueData` (Task 3) → consumed identically in Tasks 4, 5, 7, 10. `DialogueFlags.Set`/`Get` (Task 4) → consumed identically in Tasks 7, 8, 10. `DeductionValidator.TryConnect` returning `ConnectionResult` (Task 6) → consumed identically in Task 7. `DayRequirements`/`DayCompletion.IsDayComplete` (Task 8) → consumed identically in Task 10.
- **No placeholders:** every code step above has full, runnable code; every manual/editor step gives concrete actions and a concrete checklist rather than "playtest and verify."

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-27-campus-mystery-vertical-slice.md`.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
