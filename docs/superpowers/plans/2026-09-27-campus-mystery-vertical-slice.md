# Campus Mystery — Day 1 Vertical Slice Implementation Plan

> **SUPERSEDED 2026-11-13.** The project no longer uses Unity. Follow [2026-11-13-campus-mystery-web-vertical-slice.md](2026-11-13-campus-mystery-web-vertical-slice.md) instead. This file is kept only as a record of the Unity approach.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Revised 2026-11-13 for side-view 2D.** The spec switched the game from 3rd-person 3D to side-view 2D pixel art. This revision changes Task 1 (new Step 3 converts the project to the URP 2D Renderer), Task 2 and Task 5 (assembly references, Input System UI module), Task 7 (deduction board is now a screen overlay), Task 9 (side-view 2D player and camera) and Task 10 (2D scene, pixel-art reskin). Tasks 3, 4, 6 and 8 are pure logic and did not change. The revision also fixes three problems the 3D version had that would have stopped it working: the project's input setting is "Input System Package (New)" only, so the old `Input.*` calls and `StandaloneInputModule` would throw at runtime; the runtime and editor assemblies did not reference `UnityEngine.UI`, so the dialogue code would not compile; and the board's drag used `OnPointerUp`, which Unity sends to the node where the drag *started*, so no connection could ever be made.

**Goal:** Build the Day-1 vertical slice of the campus murder-mystery game — a player can walk through one side-view 2D location, talk to one suspect, pick up clues, connect evidence on a deduction board, and see a correct connection unlock new content — proving the full core loop end-to-end before any other days/suspects are built.

**Architecture:** Unity 6.6 (6000.6.3f1) project, created from the URP 3D template and converted to the URP 2D Renderer in Task 1. All input goes through the Input System package (`Keyboard.current`, `InputSystemUIInputModule`), because the project's active input handling is the new Input System only. Game logic that can be pure C# (clue tracking, dialogue-choice gating, deduction-link validation, day-completion checking) is written as plain classes + ScriptableObject data and covered by Unity Test Framework EditMode (NUnit) tests, run headlessly via Unity's batchmode CLI (no Editor GUI needed). Scene wiring that requires Unity's runtime (player movement/camera, dialogue UI, deduction-board drag UI) is written as MonoBehaviours that call into the tested pure logic; the scenes themselves are assembled programmatically by Editor scripts (`Assets/_Project/Scripts/Editor/`, run via `-executeMethod` in batchmode) rather than built by hand in the Editor, so GameObject/component wiring is scripted and reproducible. Only final behavior verification — pressing Play and working through a checklist — stays manual, since that requires a human watching the result.

**Tech Stack:** Unity 6.6 (6000.6.3f1), Universal Render Pipeline (URP) with the 2D Renderer and 2D lights, Input System package, C#, Unity Test Framework (NUnit, EditMode), Unity's built-in UI (uGUI), 2D Sprite and 2D Tilemap packages. Placeholder sprites first, then a free pixel-art school/interior pack chosen at reskin time.

**Spec:** [2026-09-27-campus-mystery-game-design.md](../specs/2026-09-27-campus-mystery-game-design.md) (revised 2026-11-13 for side-view 2D).

## Global Constraints

- Camera/perspective: side-view 2D. Orthographic camera follows the player horizontally, clamped to the room's edges. The player moves left/right only in this slice (no jumping, no vertical movement).
- Art direction: pixel art, muted/desaturated night palette; mood comes from URP 2D lights (dim cool global light, warm spot lights). No stealth/chase/antagonist-AI layer of any kind.
- Tone: noir-lite. No graphic gore; crime-scene detail stays implied via props, never shown directly.
- Setting must use a fictional campus name/branding only — never real UPM names, buildings, or branding, anywhere in code, data, or UI text.
- Environment art: flat-colored placeholder sprites until Task 10's playtest passes; then a free pixel-art school/interior pack, redressed with fictional campus signage. All sprites import with Point filtering, no compression, 32 pixels per unit.
- Input: Input System package API only (`UnityEngine.InputSystem`). Never `UnityEngine.Input` or `StandaloneInputModule`. Keys: A/D or Left/Right to walk, E to interact, Tab to open/close the deduction board, Space for the Day-1 debug check.
- This plan implements **only** the Day-1 vertical slice: one location, one suspect, 2–3 clues, a partial deduction board, ending in at least one unlock. `ChapterManager` (multi-day gating) beyond a single day-completion check, `AccusationSystem` (final ending), the other two suspects, and the remaining locations are explicitly out of scope — they are follow-up plans once this slice is validated.

## Review Focus

- **Two interactables in range when E is pressed** (e.g. a clue lying next to the suspect): only the nearest one should respond. Pinned by `InteractionPickerTests` in Task 9.
- **Dragging on the board in the "wrong" direction** (suspect onto clue instead of clue onto suspect): it should connect exactly as the other direction does. Pinned by `DeductionBoardLogicTests` in Task 7.
- **Dropping a drag on empty board space, or back on the node it started from**: no connection, the preview line disappears, no error. Manual checklist in Task 7, Step 7.
- **Walking into the room's ends**: the player stops at the walls and the camera never shows past the room's edges. Pinned by `CameraBoundsTests` in Task 9, plus the Task 10 checklist.
- **Walking or interacting while the deduction board is open**: the player must not move or trigger E-interactions behind the open board. Manual checklist in Task 10, Step 5.

---

### Task 1: Unity Project Setup & Version Control

**Files:**
- Create: Unity project at `C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\` (Assets/, Packages/, ProjectSettings/) — a subfolder of the repo, sibling to `docs/`
- Create: `.gitignore` (extend existing repo-root `.gitignore`)
- Create: `CampusMystery/Assets/_Project/Scripts/Runtime/` (empty, folder placeholder)
- Create: `CampusMystery/Assets/_Project/Scripts/Tests/EditMode/` (empty, folder placeholder)
- Create: `CampusMystery/Assets/_Project/Art/`, `CampusMystery/Assets/_Project/Prefabs/`, `CampusMystery/Assets/_Project/Scenes/` (empty, folder placeholders)
- Create: `CampusMystery/Assets/_Project/Setup/Editor/ProjectSetup2D.cs` (one-off 3D-to-2D conversion; it sits in its own `Editor` folder, outside every `.asmdef`, so it compiles into `Assembly-CSharp-Editor`, which already sees all URP assemblies)
- Create (by the script): `CampusMystery/Assets/Settings/Renderer2D.asset`, `CampusMystery/Assets/Settings/URP_2D.asset`
- Delete (by the script): `CampusMystery/Assets/Settings/PC_RPAsset.asset`, `PC_Renderer.asset`, `Mobile_RPAsset.asset`, `Mobile_Renderer.asset` (the template's 3D pipeline assets)
- Modify: `CampusMystery/Packages/manifest.json`, and (by the script) `CampusMystery/ProjectSettings/GraphicsSettings.asset`, `QualitySettings.asset`, `EditorSettings.asset`

**Interfaces:**
- Produces: the Unity project itself, which every later task's files live inside. **Every `Assets/...` path in Tasks 2–10 is relative to this project folder** (`CampusMystery/Assets/...`, not the repo root) — run all later Unity-side file and git operations with `CampusMystery/` as the working directory.

- [x] **Step 1: Create the Unity project** — done. Unity Hub created it as `CampusMystery/` (a subfolder), since Hub's "Location" field is the parent directory and Project name becomes the subfolder — this is normal Unity Hub behavior, not an error. Using Unity **6.6 (6000.6.3f1)**, Universal 3D (URP) template. The project was created before the switch to 2D. Step 3 converts it, which is simpler than recreating it because nothing custom has been added yet.

- [x] **Step 2: Add Unity-specific ignores to `.gitignore`** — done. Folder rules were anchored to `/CampusMystery/` (so a folder named e.g. `Build` inside `Assets/` is never ignored by accident), and `.vs/` / `.idea/` were added for the Visual Studio and Rider packages. After the change, `git status` lists 71 untracked files under `CampusMystery/` (Assets, Packages, ProjectSettings, `.vsconfig`) instead of ~45,000.

  Originally planned rules (kept for reference):

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

- [ ] **Step 3: Convert the project to the URP 2D Renderer**

  Close the Unity Editor first (batchmode can't open a project the Editor has open).

  3a. Add the two built-in 2D packages to `CampusMystery/Packages/manifest.json` `dependencies` (both ship inside the 6000.6.3f1 editor at version `1.0.0`, so no download is needed):

  ```json
  "com.unity.2d.sprite": "1.0.0",
  "com.unity.2d.tilemap": "1.0.0",
  ```

  3b. Write `Assets/_Project/Setup/Editor/ProjectSetup2D.cs`, namespace `CampusMystery.Setup`, `public static class ProjectSetup2D` with `public static void Run()`. This mirrors what URP's own "Create > 2D Renderer" menu does (`Renderer2DMenus.CreateRendererAsset` in the URP package), using only public API:

  ```csharp
  const string UrpPackage = "Packages/com.unity.render-pipelines.universal";

  var rendererData = ScriptableObject.CreateInstance<Renderer2DData>();
  AssetDatabase.CreateAsset(rendererData, "Assets/Settings/Renderer2D.asset");
  ResourceReloader.ReloadAllNullIn(rendererData, UrpPackage);
  var rendererSO = new SerializedObject(rendererData);   // postProcessData's setter is internal
  rendererSO.FindProperty("m_PostProcessData").objectReferenceValue =
      AssetDatabase.LoadAssetAtPath<PostProcessData>(UrpPackage + "/Runtime/Data/PostProcessData.asset");
  rendererSO.ApplyModifiedPropertiesWithoutUndo();

  var pipeline = UniversalRenderPipelineAsset.Create(rendererData);
  AssetDatabase.CreateAsset(pipeline, "Assets/Settings/URP_2D.asset");

  GraphicsSettings.defaultRenderPipeline = pipeline;
  for (int i = 0; i < QualitySettings.names.Length; i++)
  {
      QualitySettings.SetQualityLevel(i, false);
      QualitySettings.renderPipeline = pipeline;
  }
  EditorSettings.defaultBehaviorMode = EditorBehaviorMode.Mode2D;

  foreach (var old in new[] { "PC_RPAsset", "PC_Renderer", "Mobile_RPAsset", "Mobile_Renderer" })
      AssetDatabase.DeleteAsset($"Assets/Settings/{old}.asset");

  AssetDatabase.SaveAssets();
  Debug.Log("ProjectSetup2D: converted to URP 2D Renderer.");
  ```

  Usings: `UnityEditor`, `UnityEngine`, `UnityEngine.Rendering`, `UnityEngine.Rendering.Universal`. Leave `SampleScene.unity` and `SampleSceneProfile.asset` alone. They're template leftovers that nothing in this plan uses.

  3c. Run it headlessly:

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -executeMethod CampusMystery.Setup.ProjectSetup2D.Run -quit -logFile "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\setup-2d.log"
  ```

  3d. Verify:

  ```bash
  grep -i "error\|ProjectSetup2D" "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\setup-2d.log"
  grep "m_DefaultBehaviorMode" CampusMystery/ProjectSettings/EditorSettings.asset
  grep "guid" CampusMystery/Assets/Settings/URP_2D.asset.meta
  grep "m_CustomRenderPipeline\|customRenderPipeline" CampusMystery/ProjectSettings/GraphicsSettings.asset CampusMystery/ProjectSettings/QualitySettings.asset
  ```

  Expected: the `ProjectSetup2D: converted to URP 2D Renderer.` line and no compile/`error` lines in the log; `m_DefaultBehaviorMode: 1`; the `URP_2D.asset.meta` guid appears as `m_CustomRenderPipeline` in GraphicsSettings and as `customRenderPipeline` for both quality levels (`Mobile`, `PC`); the four old `PC_*`/`Mobile_*` assets are gone from `Assets/Settings/`.

- [ ] **Step 4: Create the project folder skeleton**

  Inside the Unity Editor's Project window, create:
  - `Assets/_Project/Scripts/Runtime/`
  - `Assets/_Project/Scripts/Tests/EditMode/`
  - `Assets/_Project/Art/`
  - `Assets/_Project/Prefabs/`
  - `Assets/_Project/Scenes/`

  (Unity ignores empty folders in git; each will get a `.gitkeep`-style file once a real asset lands in it during a later task — no action needed now if they stay empty.)

- [ ] **Step 5: Commit**

  Run from the repo root (`C:\Users\My Pc\OneDrive\Desktop\upm-adventure`):

  ```bash
  git add .gitignore CampusMystery/.vsconfig CampusMystery/Assets CampusMystery/ProjectSettings CampusMystery/Packages
  git commit -m "chore: scaffold Unity project (URP 2D Renderer, Unity 6.6)"
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
      "references": [
          "UnityEngine.UI",
          "Unity.InputSystem"
      ],
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
              new GameObject("EventSystem", typeof(UnityEngine.EventSystems.EventSystem), typeof(UnityEngine.InputSystem.UI.InputSystemUIInputModule));

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
          "CampusMystery.Runtime",
          "UnityEngine.UI",
          "Unity.InputSystem",
          "Unity.RenderPipelines.Universal.Runtime"
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

The board is a full-screen uGUI overlay, opened and closed with Tab. Nodes are UI `Image`s, so the canvas's `GraphicRaycaster` handles pointer events and no physics raycaster is needed.

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionBoardController.cs`
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionNodeView.cs` (its own file: Unity only serializes a `MonoBehaviour` in a scene if its class name matches its file name)
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionBoardToggle.cs`
- Create: `Assets/_Project/Scripts/Runtime/Deduction/DeductionBoardTestBootstrap.cs`
- Create: `Assets/_Project/Scripts/Tests/EditMode/DeductionBoardLogicTests.cs`
- Create: `Assets/_Project/Scripts/Editor/BoardUIBuilder.cs` (shared with Task 10)
- Create: `Assets/_Project/Scripts/Editor/DeductionBoardTestSceneBuilder.cs`
- Create (by the script, not by hand): `Assets/_Project/Scenes/DeductionBoardTest.unity`, `Assets/_Project/Art/Data/Test/DeductionBoardTest_Solution.asset`

**Interfaces:**
- Consumes: `DeductionValidator.TryConnect(string clueId, string targetId) : ConnectionResult` and `DeductionSolutionTable`/`DeductionLink` (Task 6); `DialogueFlags.Set(string flagId, bool value = true)` (Task 4).
- Produces:
  - `DeductionBoardController : MonoBehaviour` with `[SerializeField] RectTransform dragLine` and:
    - `void Initialize(DeductionValidator validator, DialogueFlags flags)`
    - `void BeginDrag(DeductionNodeView source)`
    - `void UpdateDrag(Vector2 screenPosition)`
    - `void CompleteDrop(DeductionNodeView target)`
    - `void EndDrag()`
    - `static ConnectionResult TryConnectEitherOrder(DeductionValidator validator, string nodeA, string nodeB)`
  - `DeductionNodeView : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler` with `public string NodeId`, `[SerializeField] DeductionBoardController board`, `[SerializeField] Image nodeImage`, `void MarkConnected()`.
  - `DeductionBoardToggle : MonoBehaviour` with `[SerializeField] GameObject boardPanel`, `[SerializeField] Behaviour[] disableWhileOpen`, `[SerializeField] bool startOpen`, `bool IsOpen { get; }`, `void SetOpen(bool open)`.
  - `BoardUIBuilder.Build(params BoardNodeSpec[] nodes) : DeductionBoardController` (Editor), where `public struct BoardNodeSpec { public string NodeId; public string Label; public Vector2 Position; }`. Task 10 reuses this.

- [ ] **Step 1: Write the failing tests**

  `Assets/_Project/Scripts/Tests/EditMode/DeductionBoardLogicTests.cs`, namespace `CampusMystery.Tests`. Shared setup: a `DeductionSolutionTable` with one link `{ clueId = "torn_note", targetId = "suspect_a", targetType = "Suspect", unlockFlags = { "linked_note_to_suspect_a" } }`, wrapped in a new `DeductionValidator`.

  ```csharp
  [Test]
  public void TryConnectEitherOrder_ClueOntoSuspect_Connects()
  {
      var result = DeductionBoardController.TryConnectEitherOrder(MakeValidator(), "torn_note", "suspect_a");
      Assert.IsTrue(result.IsValid);
      CollectionAssert.AreEqual(new[] { "linked_note_to_suspect_a" }, result.UnlockedFlags);
  }

  [Test]
  public void TryConnectEitherOrder_SuspectOntoClue_Connects()
  {
      var result = DeductionBoardController.TryConnectEitherOrder(MakeValidator(), "suspect_a", "torn_note");
      Assert.IsTrue(result.IsValid);
      CollectionAssert.AreEqual(new[] { "linked_note_to_suspect_a" }, result.UnlockedFlags);
  }

  [Test]
  public void TryConnectEitherOrder_UnrelatedPair_IsRejected()
  {
      var result = DeductionBoardController.TryConnectEitherOrder(MakeValidator(), "torn_note", "suspect_b");
      Assert.IsFalse(result.IsValid);
      Assert.IsEmpty(result.UnlockedFlags);
  }
  ```

- [ ] **Step 2: Run the tests to verify they fail**

  Run the EditMode test command from Task 2 Step 4. Expected: the run fails to compile, and the Unity log has a `CS0103` error saying the name `DeductionBoardController` does not exist.

- [ ] **Step 3: Implement the board scripts**

  `DeductionBoardController` (namespace `CampusMystery.Deduction`):
  - `TryConnectEitherOrder`: call `validator.TryConnect(nodeA, nodeB)`; if that isn't valid, return `validator.TryConnect(nodeB, nodeA)`. The player can drag either way, but the solution table stores links clue-first.
  - `BeginDrag`: remember the source, show `dragLine`, call `UpdateDrag` with the source's position.
  - `UpdateDrag`: the canvas is Screen Space – Overlay, so a UI element's `transform.position` is already in screen pixels. Stretch the line from the source to the pointer:

    ```csharp
    Vector2 start = _dragSource.transform.position;
    Vector2 delta = screenPosition - start;
    dragLine.position = start + delta * 0.5f;
    dragLine.sizeDelta = new Vector2(delta.magnitude / dragLine.lossyScale.x, 4f);
    dragLine.rotation = Quaternion.Euler(0f, 0f, Mathf.Atan2(delta.y, delta.x) * Mathf.Rad2Deg);
    ```

  - `CompleteDrop(target)`: if there's no source, or `target == source`, do nothing. Otherwise call `TryConnectEitherOrder(_validator, source.NodeId, target.NodeId)`. If it's valid, `_flags.Set` each unlocked flag and `MarkConnected()` both nodes.
  - `EndDrag`: hide `dragLine` and clear the source. Unity's UI input module sends `OnDrop` to the node under the pointer *before* it sends `OnEndDrag` to the node the drag started on, so the connection is already decided by the time `EndDrag` runs.

  `DeductionNodeView`: `OnBeginDrag` → `board.BeginDrag(this)`, `OnDrag` → `board.UpdateDrag(eventData.position)`, `OnDrop` → `board.CompleteDrop(this)`, `OnEndDrag` → `board.EndDrag()`. `MarkConnected` sets `nodeImage.color = Color.green`.

  `DeductionBoardToggle`: in `Start`, call `SetOpen(startOpen)`. In `Update`, if `Keyboard.current != null && Keyboard.current.tabKey.wasPressedThisFrame`, call `SetOpen(!IsOpen)`. `SetOpen` activates/deactivates `boardPanel` and sets every entry in `disableWhileOpen` to `enabled = !open`. This component must live on an object that is always active, never on the panel itself.

  `DeductionBoardTestBootstrap`: unchanged from the original plan. It holds `[SerializeField] DeductionBoardController board` and `[SerializeField] DeductionSolutionTable solutionTable`, and in `Awake` calls `board.Initialize(new DeductionValidator(solutionTable), new DialogueFlags())`.

- [ ] **Step 4: Run the tests to verify they pass**

  Same command. Expected: all tests pass, including the 3 new ones.

- [ ] **Step 5: Write the shared board builder and the test-scene builder**

  `Assets/_Project/Scripts/Editor/BoardUIBuilder.cs`, `Build(params BoardNodeSpec[] nodes)` creates:

  | Object | Components / settings |
  |---|---|
  | `DeductionBoardCanvas` | `Canvas` (Screen Space – Overlay, `sortingOrder = 10` so it sits above the dialogue canvas), `CanvasScaler`, `GraphicRaycaster` |
  | `BoardPanel` (child) | `Image`, stretched to fill the canvas, color `(0.08, 0.08, 0.10, 0.92)`; `DeductionBoardController` |
  | one `Node_<NodeId>` per spec (child of panel) | `Image` 180×60, color `(0.35, 0.35, 0.4)`, `anchoredPosition = spec.Position`; `DeductionNodeView` with `NodeId`, `board`, `nodeImage` wired; child `Label` `Text` (`LegacyRuntime.ttf`, centered, white, `raycastTarget = false`) showing `spec.Label` |
  | `DragLine` (child of panel, created last so it draws on top) | `Image`, white, pivot `(0.5, 0.5)`, `raycastTarget = false` (otherwise the drop lands on the line instead of the node), inactive; wired to the controller's `dragLine` |

  It returns the `DeductionBoardController`. `controller.gameObject` is the panel that `DeductionBoardToggle.boardPanel` opens and closes.

  `Assets/_Project/Scripts/Editor/DeductionBoardTestSceneBuilder.cs`, `public static void Build()`:
  - New empty scene. Create and save the solution table asset at `Assets/_Project/Art/Data/Test/DeductionBoardTest_Solution.asset` with the same single link as the tests.
  - `Main Camera`: `Camera` (orthographic, background `(0.05, 0.05, 0.08)`), tag `MainCamera`, position `(0, 0, -10)`.
  - `EventSystem`: `EventSystem` + `UnityEngine.InputSystem.UI.InputSystemUIInputModule`.
  - `BoardUIBuilder.Build` with `torn_note`/"Torn Note" at `(-250, 0)`, `suspect_a`/"Suspect A" at `(250, 0)`, `suspect_b`/"Suspect B" at `(0, 200)`. The panel stays open (no toggle in this scene).
  - `DeductionBoardTestBootstrap` wired to the controller and the table.
  - Save to `Assets/_Project/Scenes/DeductionBoardTest.unity`; log `DeductionBoardTest.unity built successfully.`

- [ ] **Step 6: Run the builder headlessly**

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -executeMethod CampusMystery.EditorTools.DeductionBoardTestSceneBuilder.Build -quit -logFile "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\deduction-scene-build.log"
  ```

  ```bash
  grep -i "error\|built successfully" "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\deduction-scene-build.log"
  ```

  Expected: `DeductionBoardTest.unity built successfully.` present, no `error` lines.

- [ ] **Step 7: Manual playtest checklist**

  Open `Assets/_Project/Scenes/DeductionBoardTest.unity` in the Unity Editor and press Play:
  - [ ] While dragging from any node, a white line follows the pointer from that node.
  - [ ] Dragging from "Torn Note" and releasing on "Suspect A" turns both green.
  - [ ] Restart Play. Dragging from "Suspect A" and releasing on "Torn Note" also turns both green.
  - [ ] Dragging from "Torn Note" to "Suspect B" does **not** turn them green.
  - [ ] Releasing on empty board space, or back on the starting node, hides the line, connects nothing, and logs no error.
  - [ ] Repeating the valid drag a second time logs no error.

- [ ] **Step 8: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes Assets/_Project/Art
  git commit -m "feat: add deduction board overlay with drag-and-connect"
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

### Task 9: Side-View Player & Camera (Scene Wiring)

**Files:**
- Create: `Assets/_Project/Scripts/Runtime/Player/InteractionPicker.cs` (pure)
- Create: `Assets/_Project/Scripts/Runtime/Player/CameraFollow2D.cs`
- Create: `Assets/_Project/Scripts/Runtime/Player/PlayerController2D.cs`
- Create: `Assets/_Project/Scripts/Runtime/Player/InteractionTrigger.cs`
- Create: `Assets/_Project/Scripts/Runtime/Player/InteractLogger.cs`
- Create: `Assets/_Project/Scripts/Tests/EditMode/InteractionPickerTests.cs`
- Create: `Assets/_Project/Scripts/Tests/EditMode/CameraBoundsTests.cs`
- Create: `Assets/_Project/Scripts/Editor/PlaceholderSprites.cs` (shared with Task 10)
- Create: `Assets/_Project/Scripts/Editor/EditorLayers.cs` (shared with Task 10)
- Create: `Assets/_Project/Scripts/Editor/PlayerTestSceneBuilder.cs`
- Create (by the scripts, not by hand): `Assets/_Project/Art/Placeholder/WhiteSquare.png`, `Assets/_Project/Scenes/PlayerTest.unity`, and an "Interactable" layer in `ProjectSettings/TagManager.asset`

**Interfaces:**
- Produces:
  - `static class InteractionPicker` (namespace `CampusMystery.Player`): `static int PickNearest(Vector2 origin, IReadOnlyList<Vector2> candidates)`. Returns the index of the closest candidate, the first one on a tie, or `-1` for an empty list.
  - `CameraFollow2D : MonoBehaviour` with `[SerializeField] Transform target`, `[SerializeField] float minX`, `[SerializeField] float maxX`, and `static float ClampX(float targetX, float minX, float maxX, float halfViewWidth)`.
  - `PlayerController2D : MonoBehaviour`, `[RequireComponent(typeof(Rigidbody2D))]`, with `[SerializeField] float moveSpeed = 4f`, `[SerializeField] float interactRadius = 1.2f`, `[SerializeField] LayerMask interactableLayer`, `[SerializeField] SpriteRenderer bodySprite`.
  - `InteractionTrigger : MonoBehaviour` with `[SerializeField] UnityEvent onInteract`, `UnityEvent OnInteractEvent { get; }` and `void Interact()`. Same as the original plan. Task 10 wires these to `SuspectATrigger.Interact` and `CluePickup.Interact`.
  - `InteractLogger : MonoBehaviour` with `void LogInteracted()` that logs `Interacted!`. It's a test-only listener target, because `UnityEvent` persistent listeners need a method on a `MonoBehaviour`.
  - Editor: `PlaceholderSprites.WhiteSquare() : Sprite` and `EditorLayers.Ensure(string layerName) : int`.

- [ ] **Step 1: Write the failing tests**

  `Assets/_Project/Scripts/Tests/EditMode/InteractionPickerTests.cs`:

  ```csharp
  [Test]
  public void PickNearest_NoCandidates_ReturnsMinusOne()
  {
      Assert.AreEqual(-1, InteractionPicker.PickNearest(Vector2.zero, new List<Vector2>()));
  }

  [Test]
  public void PickNearest_TwoInRange_ReturnsCloserOne()
  {
      var candidates = new List<Vector2> { new Vector2(1.2f, 0f), new Vector2(0.5f, 0f) };
      Assert.AreEqual(1, InteractionPicker.PickNearest(Vector2.zero, candidates));
  }

  [Test]
  public void PickNearest_Tie_ReturnsFirst()
  {
      var candidates = new List<Vector2> { new Vector2(-1f, 0f), new Vector2(1f, 0f) };
      Assert.AreEqual(0, InteractionPicker.PickNearest(Vector2.zero, candidates));
  }
  ```

  `Assets/_Project/Scripts/Tests/EditMode/CameraBoundsTests.cs` (a room from x = -15 to 15, half view width 8.9, which is orthographic size 5 at 16:9):

  ```csharp
  [Test]
  public void ClampX_InsideRoom_FollowsTarget()
  {
      Assert.AreEqual(5f, CameraFollow2D.ClampX(5f, -15f, 15f, 8.9f), 0.001f);
  }

  [Test]
  public void ClampX_NearLeftWall_StopsAtRoomEdge()
  {
      Assert.AreEqual(-6.1f, CameraFollow2D.ClampX(-14f, -15f, 15f, 8.9f), 0.001f);
  }

  [Test]
  public void ClampX_NearRightWall_StopsAtRoomEdge()
  {
      Assert.AreEqual(6.1f, CameraFollow2D.ClampX(14f, -15f, 15f, 8.9f), 0.001f);
  }

  [Test]
  public void ClampX_RoomNarrowerThanView_CentersOnRoom()
  {
      Assert.AreEqual(1f, CameraFollow2D.ClampX(0f, -3f, 5f, 8.9f), 0.001f);
  }
  ```

- [ ] **Step 2: Run the tests to verify they fail**

  Run the EditMode test command from Task 2 Step 4. Expected: the run fails to compile, and the Unity log has `CS0103` errors for `InteractionPicker` and `CameraFollow2D`.

- [ ] **Step 3: Implement the player scripts**

  - `InteractionPicker.PickNearest`: compare squared distances. Only a strictly smaller distance replaces the current best, so a tie keeps the first.
  - `CameraFollow2D.ClampX`: if `maxX - minX <= 2 * halfViewWidth`, return `(minX + maxX) / 2`. Otherwise clamp `targetX` to `[minX + halfViewWidth, maxX - halfViewWidth]`. `LateUpdate` sets the camera's x to `ClampX(target.position.x, minX, maxX, cam.orthographicSize * cam.aspect)` and keeps its y and z.
  - `PlayerController2D`:
    - `Awake`: cache the `Rigidbody2D`.
    - `Update`: read `Keyboard.current`, and do nothing if it's `null`. Horizontal input is −1 for A/Left Arrow, +1 for D/Right Arrow, 0 for neither or both. When input ≠ 0, set `bodySprite.flipX = input < 0`. When `eKey.wasPressedThisFrame`, call `Physics2D.OverlapCircle(position, interactRadius, filter, results)`, where `filter` is a `ContactFilter2D` with `SetLayerMask(interactableLayer)` and `useTriggers = true` (interactables use trigger colliders, so the player walks through them). Collect the hits that have an `InteractionTrigger`, call `InteractionPicker.PickNearest` on their positions, and call `Interact()` on the winner only.
    - `FixedUpdate`: `rb.linearVelocity = new Vector2(input * moveSpeed, 0f)`.
    - `OnDisable`: `rb.linearVelocity = Vector2.zero`, so the player doesn't keep sliding when the deduction board disables this component.
  - `InteractionTrigger` and `InteractLogger`: as described in Interfaces.

- [ ] **Step 4: Run the tests to verify they pass**

  Same command. Expected: all tests pass, including the 7 new ones.

- [ ] **Step 5: Write the shared editor helpers**

  - `PlaceholderSprites.WhiteSquare()`: if `Assets/_Project/Art/Placeholder/WhiteSquare.png` doesn't exist, write a 32×32 all-white PNG there (`Texture2D.EncodeToPNG`) and import it. Then set its `TextureImporter` to `textureType = Sprite`, `spritePixelsPerUnit = 32` (so one sprite is 1×1 world unit), `filterMode = Point`, `textureCompression = Uncompressed`, and reimport. Return the `Sprite` loaded from that path. Every placeholder object uses this sprite, sized with `transform.localScale` and colored with `SpriteRenderer.color`.
  - `EditorLayers.Ensure(layerName)`: the same body as the original plan's `EnsureLayer`. Return the existing layer if there is one, otherwise write the name into the first empty user layer slot (8 and up) of `ProjectSettings/TagManager.asset` and return that index. Throw if there's no free slot.

- [ ] **Step 6: Write the test-scene builder**

  `Assets/_Project/Scripts/Editor/PlayerTestSceneBuilder.cs`, `public static void Build()`. New empty scene, then create:

  | Object | Position | Scale | Components / settings |
  |---|---|---|---|
  | `Floor` | (0, -2) | (30, 1) | `SpriteRenderer` (white square, color `(0.25, 0.25, 0.28)`), `BoxCollider2D` |
  | `Wall_Left` / `Wall_Right` | (∓15.5, 0.5) | (1, 6) | `SpriteRenderer` (color `(0.18, 0.18, 0.2)`), `BoxCollider2D` |
  | `Player` | (-8, -0.55) | (0.8, 1.8) | `SpriteRenderer` (color `(0.85, 0.85, 0.9)`, sorting order 10), `BoxCollider2D`, `Rigidbody2D` (Dynamic, `gravityScale = 0`, constraints `FreezeRotation \| FreezePositionY`, interpolation Interpolate), `PlayerController2D` (`interactableLayer` = the Interactable layer, `bodySprite` = own renderer) |
  | `InteractableBox` | (3, -1.2) | (0.6, 0.6) | layer Interactable; `SpriteRenderer` (color `(0.9, 0.75, 0.3)`); `BoxCollider2D` with `isTrigger = true`; `InteractionTrigger` with a persistent listener (`UnityEventTools.AddPersistentListener`) to `InteractLogger.LogInteracted` on a separate `InteractLogger` object |
  | `Main Camera` | (0, 1, -10) | — | tag `MainCamera`; `Camera` (orthographic, size 5, background `(0.05, 0.05, 0.08)`); `CameraFollow2D` (`target` = Player, `minX = -15`, `maxX = 15`) |
  | `Global Light 2D` | — | — | `Light2D` with `lightType = Global`, `intensity = 1`, white. Full brightness here; Task 10 sets the night mood. |

  Save to `Assets/_Project/Scenes/PlayerTest.unity` and log `PlayerTest.unity built successfully.`

- [ ] **Step 7: Run the builder headlessly**

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -executeMethod CampusMystery.EditorTools.PlayerTestSceneBuilder.Build -quit -logFile "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\player-scene-build.log"
  ```

  ```bash
  grep -i "error\|built successfully" "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\player-scene-build.log"
  ```

  Expected: `PlayerTest.unity built successfully.` present, no `error` lines. The "Interactable" layer now exists in **Edit → Project Settings → Tags and Layers**.

- [ ] **Step 8: Manual playtest checklist**

  Open `Assets/_Project/Scenes/PlayerTest.unity` in the Unity Editor and press Play:
  - [ ] A/D and Left/Right walk the player left and right. Up/Down/W/S do nothing.
  - [ ] The player sprite flips to face the walking direction.
  - [ ] Walking into either wall stops the player. The player doesn't jitter or slide up/down.
  - [ ] The camera follows the player but stops before showing past either wall.
  - [ ] Standing next to the yellow box and pressing `E` logs `Interacted!` once. Pressing `E` far from it logs nothing.

- [ ] **Step 9: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes Assets/_Project/Art ProjectSettings/TagManager.asset
  git commit -m "feat: add side-view player, camera follow and interaction"
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
- Consumes: every system produced in Tasks 3–9, including `BoardUIBuilder.Build`/`BoardNodeSpec` and `DeductionBoardToggle` (Task 7), and `PlaceholderSprites.WhiteSquare`, `EditorLayers.Ensure`, `PlayerController2D`, `CameraFollow2D`, `InteractionTrigger` (Task 9).
- Produces: the playable Day-1 vertical slice scene — the deliverable this whole plan exists to build.

- [ ] **Step 1: Write the bootstrap and scene-glue runtime scripts**

  Unchanged from the original plan except for the input call in `Day1DebugHUD`:
  - `GameBootstrap` (namespace `CampusMystery`): `[SerializeField] DeductionSolutionTable solutionTable`, `[SerializeField] DayRequirements day1Requirements`, `[SerializeField] DeductionBoardController deductionBoard`. In `Awake` it creates one `ClueInventory`, one `DialogueFlags` and one `DeductionValidator(solutionTable)`, then calls `deductionBoard.Initialize(validator, flags)`. It exposes `ClueInventory ClueInventory`, `DialogueFlags Flags` and `bool IsDay1Complete()` (→ `DayCompletion.IsDayComplete(day1Requirements, Flags)`).
  - `SuspectATrigger`: `[SerializeField] DialogueRunner runner`, `DialogueNode startNode`, `DialogueNode[] allNodes`, `GameBootstrap bootstrap`. `Interact()` does `bootstrap.Flags.Set("met_suspect_a")`, then `runner.StartDialogue(startNode, allNodes, bootstrap.ClueInventory, bootstrap.Flags)`.
  - `CluePickup`: `[SerializeField] ClueData clue`, `GameBootstrap bootstrap`. `Interact()` does `bootstrap.ClueInventory.AddClue(clue)` and `Debug.Log($"Picked up {clue.displayName}")`.
  - `Day1DebugHUD`: `[SerializeField] GameBootstrap bootstrap`. When `Keyboard.current != null && Keyboard.current.spaceKey.wasPressedThisFrame`, log `"IsDay1Complete: " + bootstrap.IsDay1Complete()`. A real "Day 1 complete" transition is out of scope for this slice.

- [ ] **Step 2: Write the Editor script that assembles Day 1**

  `Assets/_Project/Scripts/Editor/Day1SceneBuilder.cs`, `public static void Build()`.

  **Data assets.** Create these exactly as the original plan did, with the same ids and copy:
  - `SuspectA_Node2`: `nodeId = "suspectA_2"`, `suspectId = "suspect_a"`, body `"...Okay. Fine. That note isn't what you think it is."`
  - `SuspectA_Node1`: `nodeId = "suspectA_1"`, `suspectId = "suspect_a"`, body `"I was in the library the whole evening. Ask anyone."`. Choices: `"Ask something else"` → `suspectA_1`; `"Ask about the note"` → `suspectA_2` with `requiredClueId = "torn_note"`.
  - `TornNote`: `clueId = "torn_note"`, `"Torn Note"`, `"A half-burned note found near the scene, addressed to Suspect A."`
  - `AlibiWitnessStatement`: `clueId = "alibi_witness_statement"`, `"Alibi Witness Statement"`, `"A librarian confirms someone matching Suspect A's description was in the library that night."`
  - `DeductionSolution`: one link `torn_note` → `suspect_a` (`targetType = "Suspect"`), unlocking `linked_note_to_suspect_a`.
  - `Day1Requirements`: `requiredFlags = { "met_suspect_a", "linked_note_to_suspect_a" }`.

  **Scene.** A gray-box faculty corridor from x = -15 to 15. Everything uses `PlaceholderSprites.WhiteSquare()` until the reskin in Step 4.

  | Object | Position | Scale | Components / settings |
  |---|---|---|---|
  | `Floor` | (0, -2) | (30, 1) | `SpriteRenderer` color `(0.22, 0.22, 0.25)`, `BoxCollider2D` |
  | `BackWall` | (0, 1.5) | (30, 6) | `SpriteRenderer` color `(0.14, 0.15, 0.18)`, sorting order -10, no collider |
  | `Wall_Left` / `Wall_Right` | (∓15.5, 0.5) | (1, 6) | `SpriteRenderer` color `(0.1, 0.1, 0.12)`, `BoxCollider2D` |
  | `Player` | (-12, -0.55) | (0.8, 1.8) | as in Task 9's `PlayerTest` scene |
  | `Clue_torn_note` | (-5, -1.3) | (0.4, 0.4) | layer Interactable; `SpriteRenderer` color `(0.95, 0.9, 0.7)`; trigger `BoxCollider2D`; `InteractionTrigger` → `CluePickup.Interact` (TornNote) |
  | `SuspectA` | (4, -0.55) | (0.8, 1.8) | layer Interactable; `SpriteRenderer` color `(0.6, 0.35, 0.35)`; trigger `BoxCollider2D`; `InteractionTrigger` → `SuspectATrigger.Interact`; `DialogueRunner` wired to the dialogue canvas |
  | `Clue_alibi_witness_statement` | (11, -1.3) | (0.4, 0.4) | as `Clue_torn_note`, for AlibiWitnessStatement |
  | `Main Camera` | (0, 1, -10) | — | as in Task 9, `CameraFollow2D` with `minX = -15`, `maxX = 15` |
  | `Global Light 2D` | — | — | `Light2D` Global, color `(0.55, 0.6, 0.8)`, `intensity = 0.35` (dim, cool night) |
  | `DeskLamp` | (4, 1.5) | — | `Light2D` with `lightType = Point`, color `(1, 0.85, 0.6)`, `intensity = 1.2`, `pointLightOuterRadius = 5` (warm pool of light over the suspect) |
  | `EventSystem` | — | — | `EventSystem` + `InputSystemUIInputModule` |
  | `DialogueCanvas` | — | — | built and wired to `SuspectA`'s `DialogueRunner` exactly like the original plan's `WireDialogueUI` helper: overlay canvas, `BodyText` at (0, 120) 600×100, two choice buttons 400×40 at y = 0 and -50, `LegacyRuntime.ttf` |
  | Deduction board | — | — | `BoardUIBuilder.Build` with `torn_note`/"Torn Note" at (-300, 80), `alibi_witness_statement`/"Alibi Statement" at (-300, -80), `suspect_a`/"Suspect A" at (300, 0). The alibi node gives the player a wrong pair to try. |
  | `BoardToggle` | — | — | `DeductionBoardToggle` with `boardPanel` = the board controller's GameObject, `disableWhileOpen = { PlayerController2D }`, `startOpen = false` |
  | `GameBootstrap` | — | — | wired to `DeductionSolution`, `Day1Requirements` and the board controller |
  | `Day1DebugHUD` | — | — | wired to `GameBootstrap` |

  The suspect and the two clues are at least 7 units apart, more than twice `interactRadius` (1.2), so in normal play only one interactable is ever in range. `InteractionPicker` still covers the case where they get moved closer during reskinning.

  Save to `Assets/_Project/Scenes/Day1.unity` and log `Day1.unity built successfully.`

- [ ] **Step 3: Run the builder headlessly**

  ```bash
  "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -projectPath "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery" -executeMethod CampusMystery.EditorTools.Day1SceneBuilder.Build -quit -logFile "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\day1-scene-build.log"
  ```

  ```bash
  grep -i "error\|built successfully" "C:\Users\My Pc\OneDrive\Desktop\upm-adventure\CampusMystery\Logs\day1-scene-build.log"
  ```

  Expected: `Day1.unity built successfully.` present, no `error` lines.

- [ ] **Step 4: Reskin with pixel art (manual — after the gray-box slice plays correctly)**

  Once Step 5's playtest passes on the gray-box:
  1. Pick a free pixel-art pack with school/office interiors and side-view characters (itch.io or the Unity Asset Store). Check its license allows use in a free or commercial game, and record the pack name, URL and license in `docs/superpowers/specs/` next to the spec.
  2. Import it under `Assets/ThirdParty/<PackName>/`. Set every texture to `Sprite`, Point filtering, no compression, 32 pixels per unit (or the pack's native tile size, applied the same everywhere).
  3. Swap the placeholder `SpriteRenderer` sprites for real ones: corridor wall, floor, lockers or notice boards, a desk and lamp near the suspect, the two clue props, and the player and suspect characters. Keep every object's name, layer, collider and component wiring.
  4. Add the fictional campus name (from the spec) to at least one sign. Never use real UPM names, logos or building names.
  5. Optionally add URP's `PixelPerfectCamera` to `Main Camera` (assets PPU 32, reference resolution 640×360) for crisp pixels.
  6. Tune the two lights for a dim, muted night look, using the values above as a starting point.

- [ ] **Step 5: Full manual playtest checklist**

  Open `Assets/_Project/Scenes/Day1.unity` in the Unity Editor and press Play:
  - [ ] The player can walk from the left end of the corridor to both clues and the suspect. The walls stop them, and the camera never shows past either end.
  - [ ] Walking up to each clue and pressing `E` logs `Picked up Torn Note` / `Picked up Alibi Witness Statement`.
  - [ ] Talking to Suspect A (`E`) before picking up the torn note shows "Ask about the note" as not clickable. After picking it up, it becomes clickable and leads to the second line.
  - [ ] Tab opens the board. While it's open, A/D doesn't move the player and `E` triggers nothing. Tab closes it and movement works again.
  - [ ] On the board, dragging "Torn Note" onto "Suspect A" (or the reverse) turns both green with no error. Dragging "Alibi Statement" onto "Suspect A" does nothing.
  - [ ] Space logs `IsDay1Complete: False` until both talking to the suspect and the board connection have happened, then `IsDay1Complete: True`.
  - [ ] The scene reads as a dim corridor with a warm light over the suspect. It isn't uniformly bright and it isn't black.

- [ ] **Step 6: Commit**

  ```bash
  git add Assets/_Project/Scripts Assets/_Project/Scenes Assets/_Project/Art
  git commit -m "feat: wire Day 1 side-view vertical slice end-to-end"
  ```

  If Step 4's reskin is done in the same session, also `git add Assets/ThirdParty` and the license note, in a separate commit: `chore: add pixel-art pack and reskin Day 1`.

---

## Self-Review Notes

- **Spec coverage:** side-view 2D movement, camera clamped to the room, and 2D interaction (Task 9); dialogue + clue-gated choices (Tasks 3–5); clue pickups (Task 3, wired in Task 10); deduction board as a toggled overlay with connect-and-unlock (Tasks 6–7); day-completion check (Task 8); URP 2D Renderer conversion (Task 1 Step 3); pixel-art reskin with 2D lighting mood and the fictional-campus-name rule (Task 10 Step 4, Global Constraints). `ChapterManager` multi-day gating beyond a single day, `AccusationSystem`, doors between rooms, and the other locations are intentionally deferred — see Global Constraints.
- **Type consistency:** `ClueInventory`/`ClueData` (Task 3) → used the same way in Tasks 4, 5 and 10. `DialogueFlags.Set`/`Get` (Task 4) → Tasks 7, 8, 10. `DeductionValidator.TryConnect` → `ConnectionResult` (Task 6) → wrapped by `DeductionBoardController.TryConnectEitherOrder` (Task 7). `DayRequirements`/`DayCompletion.IsDayComplete` (Task 8) → Task 10. `InteractionTrigger.OnInteractEvent` (Task 9) → `UnityEventTools.AddPersistentListener` in Tasks 9 and 10. `BoardUIBuilder`, `PlaceholderSprites`, `EditorLayers` (Editor, Tasks 7 and 9) → reused by Task 10.
- **Known gap kept from the original plan:** the dialogue panel is always on screen and has no close button, and the player can still walk while it's showing. That's acceptable for proving the loop. Closing dialogue belongs in the follow-up plan for Days 2–5.
- **Input:** every runtime key read uses `Keyboard.current` with a null check, and every scene's EventSystem uses `InputSystemUIInputModule`. This matches the project's "Input System Package (New)" active input handling.
- **Execution mode (per human partner's choice):** all scene/prefab construction is done by Editor scripts under `Assets/_Project/Scripts/Editor/` (plus the one-off `Assets/_Project/Setup/Editor/ProjectSetup2D.cs`), run headlessly via `Unity.exe -batchmode -executeMethod ... -quit`. EditMode tests likewise run headlessly via `-runTests`. Only Task 10 Step 4 (picking, importing and applying a pixel-art pack) needs the Editor GUI. Manual playtest checklists remain manual by nature, but no task requires hand-clicking GameObjects together in the Editor.
