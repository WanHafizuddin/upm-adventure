# Campus Mystery — Day 1 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Day-1 vertical slice of the campus murder-mystery game — a player can move through one 3D location, talk to one suspect, pick up clues, connect evidence on a deduction board, and see a correct connection unlock new content — proving the full core loop end-to-end before any other days/suspects are built.

**Architecture:** Unity 6.6 (6000.6.3f1) project (URP 3D template). Game logic that can be pure C# (clue tracking, dialogue-choice gating, deduction-link validation, day-completion checking) is written as plain classes + ScriptableObject data and covered by Unity Test Framework EditMode (NUnit) tests, run headlessly via Unity's batchmode CLI (no Editor GUI needed). Scene wiring that requires Unity's runtime (player movement/camera, dialogue UI, deduction-board drag UI) is written as MonoBehaviours that call into the tested pure logic; the scenes themselves are assembled programmatically by Editor scripts (`Assets/_Project/Scripts/Editor/`, run via `-executeMethod` in batchmode) rather than built by hand in the Editor, so GameObject/component wiring is scripted and reproducible. Only final behavior verification — pressing Play and working through a checklist — stays manual, since that requires a human watching the result.

**Tech Stack:** Unity 6.6 (6000.6.3f1), Universal Render Pipeline (URP), C#, Unity Test Framework (NUnit, EditMode), Unity's built-in UI (uGUI), [3D Free Modular Kit](https://assetstore.unity.com/packages/3d/environments/3d-free-modular-kit-85732) (free environment asset, reskinned).

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
- Create: Unity project at `C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\` (Assets/, Packages/, ProjectSettings/) — a subfolder of the repo, sibling to `docs/`
- Create: `.gitignore` (extend existing repo-root `.gitignore`)
- Create: `CampusMystery/Assets/_Project/Scripts/Runtime/` (empty, folder placeholder)
- Create: `CampusMystery/Assets/_Project/Scripts/Tests/EditMode/` (empty, folder placeholder)
- Create: `CampusMystery/Assets/_Project/Art/`, `CampusMystery/Assets/_Project/Prefabs/`, `CampusMystery/Assets/_Project/Scenes/` (empty, folder placeholders)

**Interfaces:**
- Produces: the Unity project itself, which every later task's files live inside. **Every `Assets/...` path in Tasks 2–10 is relative to this project folder** (`CampusMystery/Assets/...`, not the repo root) — run all later Unity-side file and git operations with `CampusMystery/` as the working directory.

- [x] **Step 1: Create the Unity project** — done. Unity Hub created it as `CampusMystery/` (a subfolder), since Hub's "Location" field is the parent directory and Project name becomes the subfolder — this is normal Unity Hub behavior, not an error. Using Unity **6.6 (6000.6.3f1)**, Universal 3D (URP) template.

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

  Run from the repo root (`C:\Users\My Pc\OneDrive\Desktop\upm-adventure`):

  ```bash
  git add .gitignore CampusMystery/Assets CampusMystery/ProjectSettings CampusMystery/Packages
  git commit -m "chore: scaffold Unity project (URP, Unity 6.6)"
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

  Unity 6.6 is installed at `C:\Program Files\Unity\Hub\Editor\6000.6.3f1\`. Run EditMode tests headlessly from a terminal — no Editor GUI needed:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Then check the results file for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```

  Expected: `SanityTest.Addition_Works` passes (1 test, no `Failed` results in the XML). Every later task's "run tests" step uses this same command against the same results file.

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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
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
- Create: `Assets/_Project/Scripts/Runtime/Dialogue/DialogueTestBootstrap.cs`
- Create: `Assets/_Project/Scripts/Editor/DialogueTestSceneBuilder.cs`
- Create: `Assets/_Project/Scripts/Editor/CampusMystery.Editor.asmdef`
- Create (by the script, not by hand): `Assets/_Project/Scenes/DialogueTest.unity` (temporary scratch scene for manual verification)

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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
  Expected: both pass.

- [ ] **Step 3: Write a runtime bootstrap for the test scene**

  `Assets/_Project/Scripts/Runtime/Dialogue/DialogueTestBootstrap.cs`:

  ```csharp
  using System.Collections.Generic;
  using UnityEngine;
  using CampusMystery.Clues;

  namespace CampusMystery.Dialogue
  {
      public class DialogueTestBootstrap : MonoBehaviour
      {
          [SerializeField] private DialogueRunner runner;
          [SerializeField] private DialogueNode startNode;
          [SerializeField] private DialogueNode[] allNodes;

          private void Start()
          {
              runner.StartDialogue(startNode, allNodes, new ClueInventory(), new DialogueFlags());
          }
      }
  }
  ```

- [ ] **Step 4: Write an Editor script that builds the test scene**

  `Assets/_Project/Scripts/Editor/DialogueTestSceneBuilder.cs`:

  ```csharp
  using System.Collections.Generic;
  using System.IO;
  using UnityEditor;
  using UnityEditor.SceneManagement;
  using UnityEngine;
  using UnityEngine.UI;
  using CampusMystery.Dialogue;

  namespace CampusMystery.EditorTools
  {
      public static class DialogueTestSceneBuilder
      {
          public static void Build()
          {
              var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

              Directory.CreateDirectory("Assets/_Project/Art/Data/Test");
              var n2 = ScriptableObject.CreateInstance<DialogueNode>();
              n2.nodeId = "n2";
              n2.bodyText = "You've told me everything you know. Thanks for your time.";
              AssetDatabase.CreateAsset(n2, "Assets/_Project/Art/Data/Test/DialogueTest_n2.asset");

              var n1 = ScriptableObject.CreateInstance<DialogueNode>();
              n1.nodeId = "n1";
              n1.bodyText = "I already told campus security everything I know.";
              n1.choices = new List<DialogueChoice> { new DialogueChoice { choiceText = "Continue", nextNodeId = "n2" } };
              AssetDatabase.CreateAsset(n1, "Assets/_Project/Art/Data/Test/DialogueTest_n1.asset");
              AssetDatabase.SaveAssets();

              var canvasGO = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
              canvasGO.GetComponent<Canvas>().renderMode = RenderMode.ScreenSpaceOverlay;
              new GameObject("EventSystem", typeof(UnityEngine.EventSystems.EventSystem), typeof(UnityEngine.EventSystems.StandaloneInputModule));

              var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

              var bodyGO = new GameObject("BodyText", typeof(Text));
              bodyGO.transform.SetParent(canvasGO.transform, false);
              var bodyText = bodyGO.GetComponent<Text>();
              bodyText.font = font;
              bodyText.rectTransform.anchoredPosition = new Vector2(0, 120);
              bodyText.rectTransform.sizeDelta = new Vector2(500, 100);

              var buttons = new Button[3];
              var labels = new Text[3];
              for (int i = 0; i < 3; i++)
              {
                  var btnGO = new GameObject($"ChoiceButton{i}", typeof(Image), typeof(Button));
                  btnGO.transform.SetParent(canvasGO.transform, false);
                  var rt = btnGO.GetComponent<RectTransform>();
                  rt.sizeDelta = new Vector2(320, 40);
                  rt.anchoredPosition = new Vector2(0, -i * 50);

                  var labelGO = new GameObject("Label", typeof(Text));
                  labelGO.transform.SetParent(btnGO.transform, false);
                  var label = labelGO.GetComponent<Text>();
                  label.font = font;
                  label.alignment = TextAnchor.MiddleCenter;
                  label.rectTransform.anchorMin = Vector2.zero;
                  label.rectTransform.anchorMax = Vector2.one;
                  label.rectTransform.offsetMin = Vector2.zero;
                  label.rectTransform.offsetMax = Vector2.zero;

                  buttons[i] = btnGO.GetComponent<Button>();
                  labels[i] = label;
              }

              var harnessGO = new GameObject("DialogueTestHarness", typeof(DialogueRunner));
              var runner = harnessGO.GetComponent<DialogueRunner>();
              var runnerSO = new SerializedObject(runner);
              runnerSO.FindProperty("bodyText").objectReferenceValue = bodyText;
              var buttonsProp = runnerSO.FindProperty("choiceButtons");
              buttonsProp.arraySize = 3;
              var labelsProp = runnerSO.FindProperty("choiceLabels");
              labelsProp.arraySize = 3;
              for (int i = 0; i < 3; i++)
              {
                  buttonsProp.GetArrayElementAtIndex(i).objectReferenceValue = buttons[i];
                  labelsProp.GetArrayElementAtIndex(i).objectReferenceValue = labels[i];
              }
              runnerSO.ApplyModifiedPropertiesWithoutUndo();

              var bootstrapGO = new GameObject("DialogueTestBootstrap", typeof(DialogueTestBootstrap));
              var bootstrapSO = new SerializedObject(bootstrapGO.GetComponent<DialogueTestBootstrap>());
              bootstrapSO.FindProperty("runner").objectReferenceValue = runner;
              bootstrapSO.FindProperty("startNode").objectReferenceValue = n1;
              var allNodesProp = bootstrapSO.FindProperty("allNodes");
              allNodesProp.arraySize = 2;
              allNodesProp.GetArrayElementAtIndex(0).objectReferenceValue = n1;
              allNodesProp.GetArrayElementAtIndex(1).objectReferenceValue = n2;
              bootstrapSO.ApplyModifiedPropertiesWithoutUndo();

              Directory.CreateDirectory("Assets/_Project/Scenes");
              EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/DialogueTest.unity");
              Debug.Log("DialogueTest.unity built successfully.");
          }
      }
  }
  ```

  This script must live under an Editor-only assembly so it never ships in a build. Create `Assets/_Project/Scripts/Editor/CampusMystery.Editor.asmdef`:

  ```json
  {
      "name": "CampusMystery.Editor",
      "rootNamespace": "CampusMystery.EditorTools",
      "references": [
          "CampusMystery.Runtime"
      ],
      "includePlatforms": [
          "Editor"
      ],
      "excludePlatforms": [],
      "allowUnsafeCode": false,
      "overrideReferences": false,
      "autoReferenced": true,
      "defineConstraints": [],
      "noEngineReferences": false
  }
  ```

- [ ] **Step 5: Run the builder headlessly**

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -executeMethod CampusMystery.EditorTools.DialogueTestSceneBuilder.Build -quit -logFile "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\dialogue-scene-build.log"
  ```

  Check the log for the success message and no `error` lines:

  ```bash
  grep -i "error\|built successfully" "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\dialogue-scene-build.log"
  ```

  Expected: `DialogueTest.unity built successfully.` present, no `error` lines. `Assets/_Project/Scenes/DialogueTest.unity` now exists on disk.

- [ ] **Step 6: Manual playtest checklist**

  Open `Assets/_Project/Scenes/DialogueTest.unity` in the Unity Editor and press Play:
  - [ ] Body text shows node `n1`'s text.
  - [ ] Clicking the wired choice button advances to node `n2`'s text.
  - [ ] Unused choice buttons/slots are hidden (not just blank) — not applicable here since all 3 buttons render, but the button beyond `n1.choices.Count` (buttons 1 and 2) should be inactive/hidden.

- [ ] **Step 7: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes Assets/_Project/Art
  git commit -m "feat: add DialogueRunner and scripted dialogue test scene"
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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
  Expected: all tests pass, including the 3 new ones.

- [ ] **Step 5: Commit**

  ```bash
  git add Assets/_Project/Scripts
  git commit -m "feat: add deduction solution table and validator"
  ```

---

### Task 7: Deduction Board UI (Scene Wiring)

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionBoardController.cs`
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionBoardTestBootstrap.cs`
- Create: `Assets/_Project/Scripts/Editor/DeductionBoardTestSceneBuilder.cs`
- Create (by the script, not by hand): `Assets/_Project/Scenes/DeductionBoardTest.unity` (temporary scratch scene for manual verification)

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

- [ ] **Step 2: Write a runtime bootstrap for the test scene**

  `Assets/_Project/Scripts/Runtime/Deduction/DeductionBoardTestBootstrap.cs`:

  ```csharp
  using UnityEngine;
  using CampusMystery.Dialogue;

  namespace CampusMystery.Deduction
  {
      public class DeductionBoardTestBootstrap : MonoBehaviour
      {
          [SerializeField] private DeductionBoardController board;
          [SerializeField] private DeductionSolutionTable solutionTable;

          private void Awake()
          {
              board.Initialize(new DeductionValidator(solutionTable), new DialogueFlags());
          }
      }
  }
  ```

- [ ] **Step 3: Write an Editor script that builds the test scene**

  This goes in the same `Assets/_Project/Scripts/Editor/` folder as Task 5's `DialogueTestSceneBuilder` — it's covered by the `CampusMystery.Editor.asmdef` Task 5 already created; no new asmdef needed.

  `Assets/_Project/Scripts/Editor/DeductionBoardTestSceneBuilder.cs`:

  ```csharp
  using System.Collections.Generic;
  using System.IO;
  using UnityEditor;
  using UnityEditor.SceneManagement;
  using UnityEngine;
  using UnityEngine.EventSystems;
  using CampusMystery.Deduction;

  namespace CampusMystery.EditorTools
  {
      public static class DeductionBoardTestSceneBuilder
      {
          public static void Build()
          {
              var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

              Directory.CreateDirectory("Assets/_Project/Art/Data/Test");
              var table = ScriptableObject.CreateInstance<DeductionSolutionTable>();
              table.validLinks = new List<DeductionLink>
              {
                  new DeductionLink
                  {
                      clueId = "torn_note",
                      targetId = "suspect_a",
                      targetType = "Suspect",
                      unlockFlags = new List<string> { "linked_note_to_suspect_a" }
                  }
              };
              AssetDatabase.CreateAsset(table, "Assets/_Project/Art/Data/Test/DeductionBoardTest_Solution.asset");
              AssetDatabase.SaveAssets();

              var cameraGO = new GameObject("Main Camera", typeof(Camera), typeof(PhysicsRaycaster));
              cameraGO.tag = "MainCamera";
              cameraGO.transform.position = new Vector3(0, 0, -10);
              new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));

              var boardGO = new GameObject("DeductionBoardController", typeof(DeductionBoardController));
              var lineGO = new GameObject("DragLinePreview", typeof(LineRenderer));
              lineGO.transform.SetParent(boardGO.transform);
              var board = boardGO.GetComponent<DeductionBoardController>();
              var boardSO = new SerializedObject(board);
              boardSO.FindProperty("dragLinePreview").objectReferenceValue = lineGO.GetComponent<LineRenderer>();
              boardSO.ApplyModifiedPropertiesWithoutUndo();

              CreateNode("torn_note", new Vector3(-2, 0, 0), board);
              CreateNode("suspect_a", new Vector3(2, 0, 0), board);
              CreateNode("suspect_b", new Vector3(0, 2, 0), board);

              var bootstrapGO = new GameObject("DeductionBoardTestBootstrap", typeof(DeductionBoardTestBootstrap));
              var bootstrapSO = new SerializedObject(bootstrapGO.GetComponent<DeductionBoardTestBootstrap>());
              bootstrapSO.FindProperty("board").objectReferenceValue = board;
              bootstrapSO.FindProperty("solutionTable").objectReferenceValue = table;
              bootstrapSO.ApplyModifiedPropertiesWithoutUndo();

              Directory.CreateDirectory("Assets/_Project/Scenes");
              EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/DeductionBoardTest.unity");
              Debug.Log("DeductionBoardTest.unity built successfully.");
          }

          private static void CreateNode(string nodeId, Vector3 position, DeductionBoardController board)
          {
              var nodeGO = GameObject.CreatePrimitive(PrimitiveType.Cube);
              nodeGO.name = $"Node_{nodeId}";
              nodeGO.transform.position = position;
              var view = nodeGO.AddComponent<DeductionNodeView>();
              view.NodeId = nodeId;
              var viewSO = new SerializedObject(view);
              viewSO.FindProperty("board").objectReferenceValue = board;
              viewSO.FindProperty("nodeRenderer").objectReferenceValue = nodeGO.GetComponent<Renderer>();
              viewSO.ApplyModifiedPropertiesWithoutUndo();
          }
      }
  }
  ```

  Note: `CreateNode`'s 3D cubes rely on their default `BoxCollider` (added automatically by `CreatePrimitive`) plus the scene's `PhysicsRaycaster`/`EventSystem` for `IPointerDownHandler`/`IPointerUpHandler` to fire — this is why both are created in `Build()` above.

- [ ] **Step 4: Run the builder headlessly**

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -executeMethod CampusMystery.EditorTools.DeductionBoardTestSceneBuilder.Build -quit -logFile "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\deduction-scene-build.log"
  ```

  Check the log:

  ```bash
  grep -i "error\|built successfully" "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\deduction-scene-build.log"
  ```

  Expected: `DeductionBoardTest.unity built successfully.` present, no `error` lines.

- [ ] **Step 5: Manual playtest checklist**

  Open `Assets/_Project/Scenes/DeductionBoardTest.unity` in the Unity Editor and press Play:
  - [ ] Clicking-and-dragging from the `torn_note` cube to the `suspect_a` cube turns both green (valid connection).
  - [ ] Dragging from `torn_note` to `suspect_b` does **not** turn them green (invalid connection, silently rejected).
  - [ ] Repeating the same valid drag a second time does not throw an error (idempotent, per `DeductionValidatorTests.TryConnect_SamePairTwice_SecondTimeReturnsInvalid`).

- [ ] **Step 6: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes Assets/_Project/Art
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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
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

  Run headlessly from a terminal:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -runTests -testPlatform EditMode -testResults "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml" -quit
  ```

  Check for failures (no output = zero failures = pass):

  ```bash
  grep 'result="Failed"' "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\TestResults\editmode-results.xml"
  ```
  Expected: all tests pass, including the 2 new ones.

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
- Create: `Assets/_Project/Scripts/Runtime/Player/InteractLogger.cs`
- Create: `Assets/_Project/Scripts/Editor/PlayerTestSceneBuilder.cs`
- Create (by the script, not by hand): `Assets/_Project/Scenes/PlayerTest.unity`, `ProjectSettings/TagManager.asset` update (adds the "Interactable" layer)

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

          public UnityEvent OnInteractEvent => onInteract;

          public void Interact()
          {
              onInteract?.Invoke();
          }
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Player/InteractLogger.cs` (a tiny test-only helper — `UnityEvent` persistent listeners need a target method on a `MonoBehaviour`, and `Debug.Log` isn't one):

  ```csharp
  using UnityEngine;

  namespace CampusMystery.Player
  {
      public class InteractLogger : MonoBehaviour
      {
          public void LogInteracted()
          {
              Debug.Log("Interacted!");
          }
      }
  }
  ```

- [ ] **Step 2: Write an Editor script that builds the test scene**

  This goes in the same `Assets/_Project/Scripts/Editor/` folder as Task 5's `DialogueTestSceneBuilder`, covered by the same `CampusMystery.Editor.asmdef`; no new asmdef needed.

  `Assets/_Project/Scripts/Editor/PlayerTestSceneBuilder.cs`:

  ```csharp
  using UnityEditor;
  using UnityEditor.Events;
  using UnityEditor.SceneManagement;
  using UnityEngine;
  using CampusMystery.Player;

  namespace CampusMystery.EditorTools
  {
      public static class PlayerTestSceneBuilder
      {
          public static void Build()
          {
              var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

              int interactableLayer = EnsureLayer("Interactable");

              var playerGO = GameObject.CreatePrimitive(PrimitiveType.Capsule);
              playerGO.name = "Player";
              Object.DestroyImmediate(playerGO.GetComponent<CapsuleCollider>());
              playerGO.AddComponent<CharacterController>();
              var playerController = playerGO.AddComponent<PlayerController>();

              var cameraGO = new GameObject("Main Camera", typeof(Camera));
              cameraGO.tag = "MainCamera";
              cameraGO.transform.SetParent(playerGO.transform);
              cameraGO.transform.localPosition = new Vector3(0f, 3f, -6f);
              cameraGO.transform.localRotation = Quaternion.Euler(25f, 0f, 0f);

              var playerSO = new SerializedObject(playerController);
              playerSO.FindProperty("cameraTransform").objectReferenceValue = cameraGO.transform;
              playerSO.FindProperty("interactableLayer").intValue = 1 << interactableLayer;
              playerSO.ApplyModifiedPropertiesWithoutUndo();

              var cubeGO = GameObject.CreatePrimitive(PrimitiveType.Cube);
              cubeGO.name = "InteractableCube";
              cubeGO.transform.position = new Vector3(3f, 0.5f, 3f);
              cubeGO.layer = interactableLayer;
              var trigger = cubeGO.AddComponent<InteractionTrigger>();

              var loggerGO = new GameObject("InteractLogger");
              var logger = loggerGO.AddComponent<InteractLogger>();
              UnityEventTools.AddPersistentListener(trigger.OnInteractEvent, logger.LogInteracted);

              Directory.CreateDirectory("Assets/_Project/Scenes");
              EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/PlayerTest.unity");
              Debug.Log("PlayerTest.unity built successfully.");
          }

          private static int EnsureLayer(string layerName)
          {
              var existing = LayerMask.NameToLayer(layerName);
              if (existing != -1) return existing;

              var tagManagerAsset = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset")[0];
              var tagManager = new SerializedObject(tagManagerAsset);
              var layersProp = tagManager.FindProperty("layers");
              for (int i = 8; i < layersProp.arraySize; i++)
              {
                  var layerProp = layersProp.GetArrayElementAtIndex(i);
                  if (string.IsNullOrEmpty(layerProp.stringValue))
                  {
                      layerProp.stringValue = layerName;
                      tagManager.ApplyModifiedProperties();
                      return i;
                  }
              }
              throw new System.Exception("No free layer slots available.");
          }
      }
  }
  ```

  Add `using System.IO;` to the top of this file alongside the other `using` statements (needed for `Directory.CreateDirectory`).

- [ ] **Step 3: Run the builder headlessly**

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -executeMethod CampusMystery.EditorTools.PlayerTestSceneBuilder.Build -quit -logFile "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\player-scene-build.log"
  ```

  Check the log:

  ```bash
  grep -i "error\|built successfully" "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\player-scene-build.log"
  ```

  Expected: `PlayerTest.unity built successfully.` present, no `error` lines. The "Interactable" layer now exists in **Edit → Project Settings → Tags and Layers**.

- [ ] **Step 4: Manual playtest checklist**

  Open `Assets/_Project/Scenes/PlayerTest.unity` in the Unity Editor and press Play:
  - [ ] WASD/arrow keys move the capsule relative to the camera's facing direction.
  - [ ] The capsule rotates to face its movement direction.
  - [ ] Standing near the cube and pressing `E` logs "Interacted!" in the Console.
  - [ ] Pressing `E` far from the cube does nothing.

- [ ] **Step 5: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes ProjectSettings/TagManager.asset
  git commit -m "feat: add 3rd-person player controller and interaction trigger"
  ```

---

### Task 10: Wire the Full Day-1 Vertical Slice

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/GameBootstrap.cs`
- Create: `Assets/_Project/Scripts/Runtime/SuspectATrigger.cs`
- Create: `Assets/_Project/Scripts/Runtime/CluePickup.cs`
- Create: `Assets/_Project/Scripts/Runtime/Day1DebugHUD.cs`
- Create: `Assets/_Project/Scripts/Editor/Day1SceneBuilder.cs`
- Create (by the script, not by hand): `Assets/_Project/Scenes/Day1.unity`, `Assets/_Project/Art/Data/Suspects/SuspectA_Node1.asset` + `SuspectA_Node2.asset`, `Assets/_Project/Art/Data/Clues/TornNote.asset` + `AlibiWitnessStatement.asset`, `Assets/_Project/Art/Data/DeductionSolution.asset`, `Assets/_Project/Art/Data/Day1Requirements.asset`

**Interfaces:**
- Consumes: every system produced in Tasks 3–9.
- Produces: the playable Day-1 vertical slice scene — the deliverable this whole plan exists to build.

- [ ] **Step 1: Write the bootstrap and scene-glue runtime scripts**

  `Assets/_Project/Scripts/Runtime/GameBootstrap.cs`:

  ```csharp
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

  `Assets/_Project/Scripts/Runtime/SuspectATrigger.cs` (glues an `InteractionTrigger` to starting suspect A's dialogue and marking `met_suspect_a`):

  ```csharp
  using UnityEngine;
  using CampusMystery.Dialogue;

  namespace CampusMystery
  {
      public class SuspectATrigger : MonoBehaviour
      {
          [SerializeField] private DialogueRunner runner;
          [SerializeField] private DialogueNode startNode;
          [SerializeField] private DialogueNode[] allNodes;
          [SerializeField] private GameBootstrap bootstrap;

          public void Interact()
          {
              bootstrap.Flags.Set("met_suspect_a");
              runner.StartDialogue(startNode, allNodes, bootstrap.ClueInventory, bootstrap.Flags);
          }
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/CluePickup.cs` (glues an `InteractionTrigger` to adding a clue to the shared inventory):

  ```csharp
  using UnityEngine;
  using CampusMystery.Clues;

  namespace CampusMystery
  {
      public class CluePickup : MonoBehaviour
      {
          [SerializeField] private ClueData clue;
          [SerializeField] private GameBootstrap bootstrap;

          public void Interact()
          {
              bootstrap.ClueInventory.AddClue(clue);
          }
      }
  }
  ```

  `Assets/_Project/Scripts/Runtime/Day1DebugHUD.cs` (press Space to check day-completion — a real "Day 1 complete" scene transition is out of scope for this slice, per Global Constraints):

  ```csharp
  using UnityEngine;

  namespace CampusMystery
  {
      public class Day1DebugHUD : MonoBehaviour
      {
          [SerializeField] private GameBootstrap bootstrap;

          private void Update()
          {
              if (Input.GetKeyDown(KeyCode.Space))
              {
                  Debug.Log("IsDay1Complete: " + bootstrap.IsDay1Complete());
              }
          }
      }
  }
  ```

- [ ] **Step 2: Write the Editor script that assembles Day 1**

  This script creates every data asset (suspect dialogue, clues, deduction solution, day requirements), builds a gray-box environment (placeholder floor/walls — swapped for the reskinned kit in Step 4 below), and wires the player, suspect, clue pickups, deduction board, and bootstrap together in one scene.

  This goes in the same `Assets/_Project/Scripts/Editor/` folder as Task 5's `DialogueTestSceneBuilder`, covered by the same `CampusMystery.Editor.asmdef`; no new asmdef needed.

  `Assets/_Project/Scripts/Editor/Day1SceneBuilder.cs`:

  ```csharp
  using System.Collections.Generic;
  using System.IO;
  using UnityEditor;
  using UnityEditor.Events;
  using UnityEditor.SceneManagement;
  using UnityEngine;
  using UnityEngine.EventSystems;
  using UnityEngine.UI;
  using CampusMystery.Clues;
  using CampusMystery.Dialogue;
  using CampusMystery.Deduction;
  using CampusMystery.Chapters;
  using CampusMystery.Player;

  namespace CampusMystery.EditorTools
  {
      public static class Day1SceneBuilder
      {
          public static void Build()
          {
              var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

              Directory.CreateDirectory("Assets/_Project/Art/Data/Suspects");
              Directory.CreateDirectory("Assets/_Project/Art/Data/Clues");

              var suspectANode2 = ScriptableObject.CreateInstance<DialogueNode>();
              suspectANode2.nodeId = "suspectA_2";
              suspectANode2.suspectId = "suspect_a";
              suspectANode2.bodyText = "...Okay. Fine. That note isn't what you think it is.";
              AssetDatabase.CreateAsset(suspectANode2, "Assets/_Project/Art/Data/Suspects/SuspectA_Node2.asset");

              var suspectANode1 = ScriptableObject.CreateInstance<DialogueNode>();
              suspectANode1.nodeId = "suspectA_1";
              suspectANode1.suspectId = "suspect_a";
              suspectANode1.bodyText = "I was in the library the whole evening. Ask anyone.";
              suspectANode1.choices = new List<DialogueChoice>
              {
                  new DialogueChoice { choiceText = "Ask something else", nextNodeId = "suspectA_1" },
                  new DialogueChoice { choiceText = "Ask about the note", nextNodeId = "suspectA_2", requiredClueId = "torn_note" }
              };
              AssetDatabase.CreateAsset(suspectANode1, "Assets/_Project/Art/Data/Suspects/SuspectA_Node1.asset");

              var tornNote = ScriptableObject.CreateInstance<ClueData>();
              tornNote.clueId = "torn_note";
              tornNote.displayName = "Torn Note";
              tornNote.description = "A half-burned note found near the scene, addressed to Suspect A.";
              AssetDatabase.CreateAsset(tornNote, "Assets/_Project/Art/Data/Clues/TornNote.asset");

              var alibiStatement = ScriptableObject.CreateInstance<ClueData>();
              alibiStatement.clueId = "alibi_witness_statement";
              alibiStatement.displayName = "Alibi Witness Statement";
              alibiStatement.description = "A librarian confirms someone matching Suspect A's description was in the library that night.";
              AssetDatabase.CreateAsset(alibiStatement, "Assets/_Project/Art/Data/Clues/AlibiWitnessStatement.asset");

              var solutionTable = ScriptableObject.CreateInstance<DeductionSolutionTable>();
              solutionTable.validLinks = new List<DeductionLink>
              {
                  new DeductionLink
                  {
                      clueId = "torn_note",
                      targetId = "suspect_a",
                      targetType = "Suspect",
                      unlockFlags = new List<string> { "linked_note_to_suspect_a" }
                  }
              };
              AssetDatabase.CreateAsset(solutionTable, "Assets/_Project/Art/Data/DeductionSolution.asset");

              var day1Requirements = ScriptableObject.CreateInstance<DayRequirements>();
              day1Requirements.requiredFlags = new List<string> { "met_suspect_a", "linked_note_to_suspect_a" };
              AssetDatabase.CreateAsset(day1Requirements, "Assets/_Project/Art/Data/Day1Requirements.asset");

              AssetDatabase.SaveAssets();

              var floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
              floor.name = "Floor_Blockout";
              floor.transform.localScale = new Vector3(3f, 1f, 3f);
              CreateWallBlockout("Wall_North", new Vector3(0, 1.5f, 15f), new Vector3(30f, 3f, 0.5f));
              CreateWallBlockout("Wall_South", new Vector3(0, 1.5f, -15f), new Vector3(30f, 3f, 0.5f));
              CreateWallBlockout("Wall_East", new Vector3(15f, 1.5f, 0), new Vector3(0.5f, 3f, 30f));
              CreateWallBlockout("Wall_West", new Vector3(-15f, 1.5f, 0), new Vector3(0.5f, 3f, 30f));

              var lightGO = new GameObject("Key Light", typeof(Light));
              var light = lightGO.GetComponent<Light>();
              light.type = LightType.Directional;
              light.color = new Color(1f, 0.92f, 0.75f);
              light.intensity = 0.6f;
              lightGO.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
              RenderSettings.ambientIntensity = 0.3f;

              int interactableLayer = EnsureLayer("Interactable");

              var playerGO = GameObject.CreatePrimitive(PrimitiveType.Capsule);
              playerGO.name = "Player";
              Object.DestroyImmediate(playerGO.GetComponent<CapsuleCollider>());
              playerGO.AddComponent<CharacterController>();
              var playerController = playerGO.AddComponent<PlayerController>();
              playerGO.transform.position = new Vector3(0f, 1f, -10f);

              var cameraGO = new GameObject("Main Camera", typeof(Camera));
              cameraGO.tag = "MainCamera";
              cameraGO.transform.SetParent(playerGO.transform);
              cameraGO.transform.localPosition = new Vector3(0f, 3f, -6f);
              cameraGO.transform.localRotation = Quaternion.Euler(25f, 0f, 0f);
              cameraGO.AddComponent<PhysicsRaycaster>();

              var playerSO = new SerializedObject(playerController);
              playerSO.FindProperty("cameraTransform").objectReferenceValue = cameraGO.transform;
              playerSO.FindProperty("interactableLayer").intValue = 1 << interactableLayer;
              playerSO.ApplyModifiedPropertiesWithoutUndo();

              new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));

              var boardGO = new GameObject("DeductionBoardController", typeof(DeductionBoardController));
              boardGO.transform.position = new Vector3(-10f, 0f, -10f);
              var lineGO = new GameObject("DragLinePreview", typeof(LineRenderer));
              lineGO.transform.SetParent(boardGO.transform);
              var board = boardGO.GetComponent<DeductionBoardController>();
              var boardSO = new SerializedObject(board);
              boardSO.FindProperty("dragLinePreview").objectReferenceValue = lineGO.GetComponent<LineRenderer>();
              boardSO.ApplyModifiedPropertiesWithoutUndo();

              CreateDeductionNode("torn_note", new Vector3(-12f, 0f, -10f), board);
              CreateDeductionNode("suspect_a", new Vector3(-8f, 0f, -10f), board);

              var bootstrapGO = new GameObject("GameBootstrap", typeof(GameBootstrap));
              var bootstrap = bootstrapGO.GetComponent<GameBootstrap>();
              var bootstrapSO = new SerializedObject(bootstrap);
              bootstrapSO.FindProperty("solutionTable").objectReferenceValue = solutionTable;
              bootstrapSO.FindProperty("day1Requirements").objectReferenceValue = day1Requirements;
              bootstrapSO.FindProperty("deductionBoard").objectReferenceValue = board;
              bootstrapSO.ApplyModifiedPropertiesWithoutUndo();

              var suspectGO = GameObject.CreatePrimitive(PrimitiveType.Capsule);
              suspectGO.name = "SuspectA";
              suspectGO.transform.position = new Vector3(5f, 1f, 5f);
              suspectGO.layer = interactableLayer;
              var suspectTrigger = suspectGO.AddComponent<InteractionTrigger>();
              var suspectRunner = suspectGO.AddComponent<DialogueRunner>();
              var suspectHandler = suspectGO.AddComponent<SuspectATrigger>();
              WireDialogueUI(suspectRunner);

              var suspectHandlerSO = new SerializedObject(suspectHandler);
              suspectHandlerSO.FindProperty("runner").objectReferenceValue = suspectRunner;
              suspectHandlerSO.FindProperty("startNode").objectReferenceValue = suspectANode1;
              var allNodesProp = suspectHandlerSO.FindProperty("allNodes");
              allNodesProp.arraySize = 2;
              allNodesProp.GetArrayElementAtIndex(0).objectReferenceValue = suspectANode1;
              allNodesProp.GetArrayElementAtIndex(1).objectReferenceValue = suspectANode2;
              suspectHandlerSO.FindProperty("bootstrap").objectReferenceValue = bootstrap;
              suspectHandlerSO.ApplyModifiedPropertiesWithoutUndo();
              UnityEventTools.AddPersistentListener(suspectTrigger.OnInteractEvent, suspectHandler.Interact);

              CreateCluePickup(tornNote, new Vector3(2f, 0.5f, -2f), interactableLayer, bootstrap);
              CreateCluePickup(alibiStatement, new Vector3(-2f, 0.5f, 6f), interactableLayer, bootstrap);

              var hudGO = new GameObject("Day1DebugHUD", typeof(Day1DebugHUD));
              var hudSO = new SerializedObject(hudGO.GetComponent<Day1DebugHUD>());
              hudSO.FindProperty("bootstrap").objectReferenceValue = bootstrap;
              hudSO.ApplyModifiedPropertiesWithoutUndo();

              Directory.CreateDirectory("Assets/_Project/Scenes");
              EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/Day1.unity");
              Debug.Log("Day1.unity built successfully.");
          }

          private static void CreateWallBlockout(string name, Vector3 position, Vector3 scale)
          {
              var wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
              wall.name = name;
              wall.transform.position = position;
              wall.transform.localScale = scale;
          }

          private static void CreateDeductionNode(string nodeId, Vector3 position, DeductionBoardController board)
          {
              var nodeGO = GameObject.CreatePrimitive(PrimitiveType.Cube);
              nodeGO.name = $"DeductionNode_{nodeId}";
              nodeGO.transform.position = position;
              var view = nodeGO.AddComponent<DeductionNodeView>();
              view.NodeId = nodeId;
              var viewSO = new SerializedObject(view);
              viewSO.FindProperty("board").objectReferenceValue = board;
              viewSO.FindProperty("nodeRenderer").objectReferenceValue = nodeGO.GetComponent<Renderer>();
              viewSO.ApplyModifiedPropertiesWithoutUndo();
          }

          private static void CreateCluePickup(ClueData clue, Vector3 position, int interactableLayer, GameBootstrap bootstrap)
          {
              var clueGO = GameObject.CreatePrimitive(PrimitiveType.Sphere);
              clueGO.name = $"Clue_{clue.clueId}";
              clueGO.transform.position = position;
              clueGO.transform.localScale = Vector3.one * 0.4f;
              clueGO.layer = interactableLayer;
              var trigger = clueGO.AddComponent<InteractionTrigger>();
              var pickup = clueGO.AddComponent<CluePickup>();

              var pickupSO = new SerializedObject(pickup);
              pickupSO.FindProperty("clue").objectReferenceValue = clue;
              pickupSO.FindProperty("bootstrap").objectReferenceValue = bootstrap;
              pickupSO.ApplyModifiedPropertiesWithoutUndo();

              UnityEventTools.AddPersistentListener(trigger.OnInteractEvent, pickup.Interact);
          }

          private static void WireDialogueUI(DialogueRunner runner)
          {
              var canvasGO = new GameObject("DialogueCanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
              canvasGO.GetComponent<Canvas>().renderMode = RenderMode.ScreenSpaceOverlay;
              var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

              var bodyGO = new GameObject("BodyText", typeof(Text));
              bodyGO.transform.SetParent(canvasGO.transform, false);
              var bodyText = bodyGO.GetComponent<Text>();
              bodyText.font = font;
              bodyText.rectTransform.anchoredPosition = new Vector2(0, 120);
              bodyText.rectTransform.sizeDelta = new Vector2(600, 100);

              var buttons = new Button[2];
              var labels = new Text[2];
              for (int i = 0; i < 2; i++)
              {
                  var btnGO = new GameObject($"ChoiceButton{i}", typeof(Image), typeof(Button));
                  btnGO.transform.SetParent(canvasGO.transform, false);
                  var rt = btnGO.GetComponent<RectTransform>();
                  rt.sizeDelta = new Vector2(400, 40);
                  rt.anchoredPosition = new Vector2(0, -i * 50);

                  var labelGO = new GameObject("Label", typeof(Text));
                  labelGO.transform.SetParent(btnGO.transform, false);
                  var label = labelGO.GetComponent<Text>();
                  label.font = font;
                  label.alignment = TextAnchor.MiddleCenter;
                  label.rectTransform.anchorMin = Vector2.zero;
                  label.rectTransform.anchorMax = Vector2.one;
                  label.rectTransform.offsetMin = Vector2.zero;
                  label.rectTransform.offsetMax = Vector2.zero;

                  buttons[i] = btnGO.GetComponent<Button>();
                  labels[i] = label;
              }

              var runnerSO = new SerializedObject(runner);
              runnerSO.FindProperty("bodyText").objectReferenceValue = bodyText;
              var buttonsProp = runnerSO.FindProperty("choiceButtons");
              buttonsProp.arraySize = 2;
              var labelsProp = runnerSO.FindProperty("choiceLabels");
              labelsProp.arraySize = 2;
              for (int i = 0; i < 2; i++)
              {
                  buttonsProp.GetArrayElementAtIndex(i).objectReferenceValue = buttons[i];
                  labelsProp.GetArrayElementAtIndex(i).objectReferenceValue = labels[i];
              }
              runnerSO.ApplyModifiedPropertiesWithoutUndo();
          }

          private static int EnsureLayer(string layerName)
          {
              var existing = LayerMask.NameToLayer(layerName);
              if (existing != -1) return existing;

              var tagManagerAsset = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset")[0];
              var tagManager = new SerializedObject(tagManagerAsset);
              var layersProp = tagManager.FindProperty("layers");
              for (int i = 8; i < layersProp.arraySize; i++)
              {
                  var layerProp = layersProp.GetArrayElementAtIndex(i);
                  if (string.IsNullOrEmpty(layerProp.stringValue))
                  {
                      layerProp.stringValue = layerName;
                      tagManager.ApplyModifiedProperties();
                      return i;
                  }
              }
              throw new System.Exception("No free layer slots available.");
          }
      }
  }
  ```

- [ ] **Step 3: Run the builder headlessly**

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -executeMethod CampusMystery.EditorTools.Day1SceneBuilder.Build -quit -logFile "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\day1-scene-build.log"
  ```

  Check the log:

  ```bash
  grep -i "error\|built successfully" "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\day1-scene-build.log"
  ```

  Expected: `Day1.unity built successfully.` present, no `error` lines.

- [ ] **Step 4: Reskin the environment (manual — after the gray-box slice plays correctly)**

  The scene above uses placeholder cube/plane geometry (`Floor_Blockout`, `Wall_North/South/East/West`) so the full loop is playable immediately. Once Step 5's playtest passes on the gray-box, import the [3D Free Modular Kit](https://assetstore.unity.com/packages/3d/environments/3d-free-modular-kit-85732) via the Unity Editor's Asset Store window (this step needs the Editor GUI — Asset Store downloads require a signed-in interactive session) and swap the blockout pieces for reskinned kit pieces: muted/desaturated materials, school-appropriate dressing (a bench, lockers or shelving, signage using the fictional campus name from the spec — never real UPM branding). Keep the `Key Light` directional light and ambient settings as a starting point for the moody stylized-realistic look, adjusting to taste.

- [ ] **Step 5: Full manual playtest checklist**

  Open `Assets/_Project/Scenes/Day1.unity` in the Unity Editor and press Play:
  - [ ] Player can walk from the entrance to every clue and to the suspect.
  - [ ] Picking up `TornNote` and `AlibiWitnessStatement` (walk up, press `E`) adds them to the inventory (add a temporary `Debug.Log` in `CluePickup.Interact` if you want on-screen confirmation).
  - [ ] Talking to suspect A (press `E`) before picking up `torn_note` does **not** show the "Ask about the note" choice; after picking it up, the choice appears.
  - [ ] Connecting `torn_note` → `suspect_a` on the deduction board (click-drag between the two cubes) turns both green and does not error.
  - [ ] Pressing Space logs `IsDay1Complete: True` only once both `met_suspect_a` (talked to the suspect) and `linked_note_to_suspect_a` (made the deduction-board connection) have happened.
  - [ ] Connecting an unrelated clue/suspect pair on the board is silently rejected (no false unlock, no error).

- [ ] **Step 6: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes Assets/_Project/Art
  git commit -m "feat: wire Day 1 vertical slice end-to-end"
  ```

---

## Self-Review Notes

- **Spec coverage:** player movement/camera (Task 9), dialogue + clue-gated choices (Tasks 3–5), clue pickups (Task 3, wired in Task 10), deduction board connect-and-unlock (Tasks 6–7), day-completion check (Task 8), environment reskin of the free kit (Task 10 Step 4), fictional-campus-name constraint (called out in Task 10 Step 4 and Global Constraints). `ChapterManager` multi-day gating beyond a single day and `AccusationSystem` are intentionally deferred — see Global Constraints.
- **Type consistency:** `ClueInventory`/`ClueData` (Task 3) → consumed identically in Tasks 4, 5, 7, 10. `DialogueFlags.Set`/`Get` (Task 4) → consumed identically in Tasks 7, 8, 10. `DeductionValidator.TryConnect` returning `ConnectionResult` (Task 6) → consumed identically in Task 7. `DayRequirements`/`DayCompletion.IsDayComplete` (Task 8) → consumed identically in Task 10. `InteractionTrigger.OnInteractEvent` (Task 9) → consumed identically by `UnityEventTools.AddPersistentListener` calls in Task 9's and Task 10's Editor scripts.
- **No placeholders:** every code step above has full, runnable code; every manual/editor step gives concrete actions and a concrete checklist rather than "playtest and verify."
- **Execution mode (per human partner's choice):** all scene/prefab construction is done by Editor scripts under `Assets/_Project/Scripts/Editor/`, run headlessly via `Unity.exe -batchmode -executeMethod ... -quit`, sharing one `CampusMystery.Editor.asmdef` created in Task 5. EditMode tests likewise run headlessly via `-runTests`. Only Task 10 Step 4 (importing and reskinning the free asset kit) requires the Editor GUI, since Asset Store downloads need an interactive signed-in session — everything else in this plan is achievable through Bash + Unity's CLI alone. Manual playtest checklists remain manual by nature (a human has to watch the result), but no task requires hand-clicking GameObjects together in the Editor.

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-27-campus-mystery-vertical-slice.md`.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
