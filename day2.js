
/* ========================================
   LIFE UNKNOWN — DAY 2
   SCREEN NAVIGATION
   ======================================== */

document.addEventListener("DOMContentLoaded", function () {

  
  // ==========================================
  // DAY 2 — LOAD RESEARCHER PROFILES
  // ==========================================

  function loadDay1Profile(version) {
    const key = version === "a1"
      ? "alien-a1-v1"
      : "alien-a0-v1";

    try {
      const saved = JSON.parse(localStorage.getItem(key));

      if (!saved || !saved.nodes?.root) {
        return null;
      }

      return {
        version: version,
        name: String(saved.researcherName || "").trim()
      };

    } catch {
      return null;
    }
  }

  const a0Profile = loadDay1Profile("a0");
  const a1Profile = loadDay1Profile("a1");

  // ==========================================
  // DAY 2 — PERSISTENT RESEARCH RECORD
  // ==========================================

  const DAY2_RECORD_PREFIX = "alien-day2-record-v1";

  let day2ResearchRecord = null;

  function getDay2RecordKey(version, researcherName) {
    return `${DAY2_RECORD_PREFIX}:${version}:${encodeURIComponent(researcherName)}`;
  }

  function createDay2ResearchRecord(version, researcherName) {
    return {
      version: 1,
      researcher: {
        name: researcherName,
        day1Version: version
      },
      records: {
        "01": {
          stage: "initial",
          answers: {},
          initialAnswers: null,
          revisedAnswers: null,
          initialScore: null,
          finalScore: null,
          submitted: false
        },
        "02": { submitted: false },
        "03": { submitted: false },
        "04": { submitted: false }
      }
    };
  }

  function loadDay2ResearchRecord(version, researcherName) {
    const key = getDay2RecordKey(version, researcherName);

    try {
      const saved = JSON.parse(localStorage.getItem(key));

      if (
        saved?.version === 1 &&
        saved.researcher?.name === researcherName &&
        saved.researcher?.day1Version === version &&
        saved.records?.["01"]
      ) {
        return saved;
      }
    } catch (error) {
      console.warn("Could not load Day 2 research record.", error);
    }

    return createDay2ResearchRecord(version, researcherName);
  }

  function saveDay2ResearchRecord() {
    if (!day2ResearchRecord) return;

    try {
      const key = getDay2RecordKey(
        day2ResearchRecord.researcher.day1Version,
        day2ResearchRecord.researcher.name
      );

      localStorage.setItem(
        key,
        JSON.stringify(day2ResearchRecord)
      );
    } catch (error) {
      console.warn("Could not save Day 2 research record.", error);
    }
  }
// ==========================================
// DAY 2 — IDENTIFY ASTEROID REVIEW BANKS
// ==========================================

function getDay2ReviewBanks() {
  if (!day2ResearchRecord) return null;

  const records = day2ResearchRecord.records;
  const fileIds = ["01", "02", "03", "04"];

  // Wait until all four Earth files are submitted.
  const allSubmitted = fileIds.every(
    id => records[id]?.submitted === true
  );

  if (!allSubmitted) return null;

  // Select only banks associated with files
  // where the student did not demonstrate proficiency.
  const reviewBanks = fileIds.filter(
    id => records[id]?.proficient !== true
  );

  return {
    needsReview: reviewBanks.length > 0,
    banks: reviewBanks
  };
}

 // ==========================================
 // DAY 2 — RANDOMIZE ASTEROID POSITIONS & ART
 // ==========================================

 const asteroidPositions = [
   1, 2, 3, 4, 5, 6, 7, 8
 ];

 const asteroidImages = [
   "asteroid-1.png",
   "asteroid-2.png",
   "asteroid-3.png",
   "asteroid-4.png",
   "asteroid-5.png",
   "asteroid-6.png"
 ];

 // Shuffle a copy without changing the original array.
 function shuffleAsteroidOptions(items) {
   const shuffled = [...items];

   for (let i = shuffled.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     [shuffled[i], shuffled[j]] =
       [shuffled[j], shuffled[i]];
   }

   return shuffled;
 }

 function randomizeAsteroidTargets() {
   const targets = document.querySelectorAll(
     "#asteroidDefenseScreen .asteroid-answer"
   );

   if (targets.length !== 4) return;

   // Choose two positions from each row.
   // This keeps the asteroids distributed across the window.
   const topRow = shuffleAsteroidOptions([1, 2, 3, 4])
     .slice(0, 2);

   const bottomRow = shuffleAsteroidOptions([5, 6, 7, 8])
     .slice(0, 2);

   const selectedPositions = shuffleAsteroidOptions([
     ...topRow,
     ...bottomRow
   ]);

   // Choose four different asteroid illustrations.
   const selectedImages = shuffleAsteroidOptions(
     asteroidImages
   ).slice(0, 4);

   targets.forEach((target, index) => {
     // Remove any previous position.
     for (const position of asteroidPositions) {
       target.classList.remove(
         `asteroid-position-${position}`
       );
     }

     // Assign the new position.
     target.classList.add(
       `asteroid-position-${selectedPositions[index]}`
     );

     // Assign the new asteroid illustration.
     const image = target.querySelector(
       ".asteroid-answer-image"
     );

     if (image) {
       image.src = `assets/${selectedImages[index]}`;
     }
   });
 }

  // ==========================================
  // DAY 2 — LOAD ASTEROID QUESTION BANK
  // ==========================================

  let asteroidQuestionBank = [];
  let currentAsteroidQuestion = null;

  async function loadAsteroidQuestionBank() {
    try {
      const response = await fetch("asteroid-questions.json");

      if (!response.ok) {
        throw new Error("Question bank could not be loaded.");
      }

      const data = await response.json();

      if (!Array.isArray(data.questions)) {
        throw new Error("Invalid asteroid question bank.");
      }

      asteroidQuestionBank = data.questions;

      console.log(
        "Asteroid questions loaded:",
        asteroidQuestionBank.length
      );

      // Temporary test: display the first standard question.
      const testQuestion = asteroidQuestionBank.find(
        question =>
          question.record === "01" &&
          question.difficulty === "standard"
      );

      if (testQuestion) {
        displayAsteroidQuestion(testQuestion);
      }

    } catch (error) {
      console.error("Asteroid question loading failed:", error);

      const questionDisplay =
        document.getElementById("asteroidQuestionText");

      if (questionDisplay) {
        questionDisplay.textContent =
          "Unable to load scientific targeting data.";
      }
    }
  }

function createAsteroidAssignment(failedRecords) {
  const assignment = [];

  failedRecords.forEach((recordId) => {
    const availableQuestions = asteroidQuestionBank.filter(
      question =>
        question.record === recordId &&
        question.difficulty === "standard"
    );

    if (availableQuestions.length < 5) {
      throw new Error(
        `Not enough standard questions for Record ${recordId}`
      );
    }

    const shuffledBank = shuffleAsteroidOptions(
      availableQuestions
    );

    assignment.push(...shuffledBank.slice(0, 5));
  });

  // Mix questions from all failed records together.
  return shuffleAsteroidOptions(assignment);
}

function getOrCreateAsteroidAssignment() {
  if (!day2ResearchRecord) return [];

  const review = getDay2ReviewBanks();

  if (!review || !review.needsReview) return [];

  // Reuse an existing assignment after a refresh.
  if (Array.isArray(day2ResearchRecord.asteroidAssignment)) {
    return day2ResearchRecord.asteroidAssignment;
  }

  // Create five questions for each failed Earth Record.
  const assignment = createAsteroidAssignment(review.banks);

  // Save the assignment in the researcher's record.
  day2ResearchRecord.asteroidAssignment = assignment;
  saveDay2ResearchRecord();

  return assignment;
}

function advanceAsteroidQuestion() {
  const assignment = day2ResearchRecord.asteroidAssignment;
  const answers = day2ResearchRecord.asteroidAnswers || [];

  // Find the next unanswered question.
  const nextIndex = assignment.findIndex(
    (question, index) =>
      !answers.some(answer => answer.questionIndex === index)
  );

  // Check whether the mission is complete.
  if (nextIndex === -1) {
    asteroidShotInProgress = true;
    asteroidInstructions.textContent = "MISSION COMPLETE";
    console.log("Asteroid mission complete!");
    return;
  }

  // Restore all four asteroid targets.
  asteroidAnswerButtons.forEach(button => {
    button.style.visibility = "visible";
  });

  // Prepare the next question.
  displayAsteroidQuestion(assignment[nextIndex]);
  randomizeAsteroidTargets();

  asteroidInstructions.textContent =
    "SELECT THE CORRECT TARGET";

  asteroidShotInProgress = false;
}

  function displayAsteroidQuestion(question) {
    currentAsteroidQuestion = question;

    const questionDisplay =
      document.getElementById("asteroidQuestionText");

    if (questionDisplay) {
      questionDisplay.textContent = question.question;
    }

    const answerButtons = document.querySelectorAll(
      "#asteroidDefenseScreen .asteroid-answer"
    );

    answerButtons.forEach((button, index) => {
      const answerText = button.querySelector(
        ".asteroid-answer-text"
      );

      if (answerText) {
        answerText.textContent = question.answers[index];
      }
    });
  }

  loadAsteroidQuestionBank();

 // ==========================================
 // DAY 2 — ASTEROID TARGET SELECTION
 // ==========================================

 const asteroidAnswerButtons = document.querySelectorAll(
   "#asteroidDefenseScreen .asteroid-answer"
 );

 const asteroidInstructions = document.querySelector(
   "#asteroidDefenseScreen .asteroid-console-instructions"
 );

 // ==========================================
 // DAY 2 — ASTEROID EXPLOSION
 // ==========================================

 let asteroidShotInProgress = false;
 let asteroidExplosionTimer = null;

 function explodeAsteroid(target) {
   const cockpit = document.querySelector(
     "#asteroidDefenseScreen .asteroid-cockpit"
   );

   const explosion = document.getElementById(
     "asteroidExplosion"
   );

   if (!cockpit || !explosion) return;

   const cockpitRect = cockpit.getBoundingClientRect();
   const targetRect = target.getBoundingClientRect();

   // Find the center of the asteroid.
   const centerX =
     targetRect.left - cockpitRect.left +
     targetRect.width / 2;

   const centerY =
     targetRect.top - cockpitRect.top +
     targetRect.height / 2;

   // Position the explosion at the impact point.
   explosion.style.left = `${centerX}px`;
   explosion.style.top = `${centerY}px`;
   
 // Restart the GIF by loading a fresh image URL.
 explosion.hidden = true;
 explosion.removeAttribute("src");


explosion.onload = () => {
  // Show the explosion while the asteroid is still visible.
  explosion.hidden = false;

  // Allow the explosion to develop before hiding the asteroid.
  setTimeout(() => {
    target.style.visibility = "hidden";
  }, 180);
};

 explosion.src =
   `assets/asteroid-explosion.gif?shot=${Date.now()}`;


   // Remove the explosion after the impact sequence.
   clearTimeout(asteroidExplosionTimer);
 
asteroidExplosionTimer = setTimeout(() => {
  explosion.hidden = true;
  advanceAsteroidQuestion();
}, 1200);

 }


function approachAsteroid(target) {
  const cockpit = document.querySelector(
    "#asteroidDefenseScreen .asteroid-cockpit"
  );

  const collisionAsteroid = document.getElementById(
    "collisionAsteroid"
  );

  if (!cockpit || !collisionAsteroid) return;

  const cockpitRect = cockpit.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Match the image of the asteroid the student selected.
  const targetImage = target.querySelector(".asteroid-answer-image");

  if (targetImage) {
    collisionAsteroid.src = targetImage.src;
  }

  // Position the collision asteroid at the selected target.
  const centerX =
    targetRect.left - cockpitRect.left + targetRect.width / 2;

  const centerY =
    targetRect.top - cockpitRect.top + targetRect.height / 2;

  collisionAsteroid.style.left = `${centerX}px`;
  collisionAsteroid.style.top = `${centerY}px`;
  collisionAsteroid.style.transform = "translate(-50%, -50%)";


// Aim toward a point near the center of the windshield.
const destinationX = cockpitRect.width * 0.5;
const destinationY = cockpitRect.height * 0.45;

collisionAsteroid.style.setProperty(
  "--flight-x",
  `${destinationX - centerX}px`
);

collisionAsteroid.style.setProperty(
  "--flight-y",
  `${destinationY - centerY}px`
);

// Hide the original answer asteroid.
target.style.visibility = "hidden";

// Show and animate the separate collision asteroid.
collisionAsteroid.hidden = false;
collisionAsteroid.classList.remove("flying");
void collisionAsteroid.offsetWidth;
collisionAsteroid.classList.add("flying");


// Reveal windshield damage when the asteroid reaches the ship.
setTimeout(() => {
  const crack = document.getElementById("windshieldCrack");

  // Remove the incoming asteroid at the moment of impact.
  collisionAsteroid.hidden = true;
  collisionAsteroid.classList.remove("flying");

  if (!crack) return;

  // Restart the crack's appearance animation.
  crack.hidden = false;

// Shake the entire cockpit at the moment of impact.
cockpit.classList.remove("shaking");
void cockpit.offsetWidth;
cockpit.classList.add("shaking");


// Switch the center console to emergency feedback.
const impactWarning = document.getElementById("asteroidImpactWarning");
const targetingInstructions = document.querySelector(
  "#asteroidDefenseScreen .asteroid-console-instructions"
);


if (impactWarning && targetingInstructions) {
  // Hide the normal targeting console content.
  const consoleHeading = cockpit.querySelector(
    ".asteroid-console-heading"
  );

  const questionText = document.getElementById(
    "asteroidQuestionText"
  );

  if (consoleHeading) consoleHeading.hidden = true;
  if (questionText) questionText.hidden = true;

  targetingInstructions.hidden = true;
  
// Display the scientific explanation for this question.
document.getElementById(
  "asteroidImpactExplanation"
).textContent = currentAsteroidQuestion.explanation;

// Identify the correct answer.
const correctIndex = currentAsteroidQuestion.correctAnswer;
const correctLetter = ["A", "B", "C", "D"][correctIndex];
const correctText = currentAsteroidQuestion.answers[correctIndex];

document.getElementById(
  "asteroidImpactCorrect"
).textContent = `CORRECT ANSWER: ${correctLetter} — ${correctText}`;

// Display emergency feedback.
impactWarning.hidden = false;
}

  crack.classList.remove("appearing");
  void crack.offsetWidth;
  crack.classList.add("appearing");
}, 850);


}

function fireAsteroidLaser(target) {
  const cockpit = document.querySelector(
    "#asteroidDefenseScreen .asteroid-cockpit"
  );

  const laser = document.getElementById("asteroidLaser");

  if (!cockpit || !laser) return;

  const cockpitRect = cockpit.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Laser origin: lower center of cockpit window.
  const startX = cockpitRect.width * 0.5;
  const startY = cockpitRect.height * 0.60;

  // Destination: center of selected asteroid.
  const endX =
    targetRect.left - cockpitRect.left +
    targetRect.width / 2;

  const endY =
    targetRect.top - cockpitRect.top +
    targetRect.height / 2;

  const dx = endX - startX;
  const dy = endY - startY;

  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Position and aim the laser.
  laser.style.left = `${startX}px`;
  laser.style.top = `${startY}px`;
  laser.style.width = `${distance}px`;
  laser.style.transform = `rotate(${angle}deg)`;

  // Restart the animation for every shot.
  laser.classList.remove("firing");
  void laser.offsetWidth;
  laser.classList.add("firing");
}

  asteroidAnswerButtons.forEach((button, index) => {
    button.addEventListener("click", () => {

      // Prevent multiple answers to the same question.
      if (asteroidShotInProgress) return;
      if (!currentAsteroidQuestion) return;

      asteroidShotInProgress = true;

      const isCorrect =
        index === currentAsteroidQuestion.correctAnswer;

      // Initialize the researcher's asteroid answer history.
      if (!Array.isArray(day2ResearchRecord.asteroidAnswers)) {
        day2ResearchRecord.asteroidAnswers = [];
      }

      // Record each question only once.
      const questionIndex =
        day2ResearchRecord.asteroidAssignment.indexOf(
          currentAsteroidQuestion
        );

      if (questionIndex < 0) return;

      const alreadyAnswered =
        day2ResearchRecord.asteroidAnswers.some(
          answer => answer.questionIndex === questionIndex
        );

      if (!alreadyAnswered) {
        day2ResearchRecord.asteroidAnswers.push({
          questionIndex: questionIndex,
          record: currentAsteroidQuestion.record,
          selectedAnswer: index,
          correct: isCorrect
        });

        saveDay2ResearchRecord();
      }

      console.log(
        "Asteroid answer history:",
        day2ResearchRecord.asteroidAnswers
      );

      const selectedLetter = ["A", "B", "C", "D"][index];

      asteroidInstructions.textContent =
        `TARGET ${selectedLetter} LOCKED`;

      if (isCorrect) {

        // Correct answer: fire laser and destroy asteroid.
        fireAsteroidLaser(button);

        setTimeout(() => {
          explodeAsteroid(button);
        }, 350);

        console.log("Correct asteroid answer!");

      } else {

        // Incorrect answer: asteroid strikes the ship.
        approachAsteroid(button);

        console.log(
          "Incorrect asteroid answer:",
          currentAsteroidQuestion.explanation
        );

        // Remain locked until ship repairs are implemented.
      }

    });
  });

// ==========================================
// DAY 2 — OPEN ASTEROID DEFENSE WORKSPACE
// ==========================================

const asteroidContinueButton =
  document.getElementById("quibAsteroidContinue");

const asteroidDefenseScreen =
  document.getElementById("asteroidDefenseScreen");

if (asteroidContinueButton && asteroidDefenseScreen) {
  asteroidContinueButton.addEventListener("click", () => {

    document.getElementById("quibAsteroidScreen").hidden = true;

    asteroidDefenseScreen.hidden = false;

    // Retrieve this researcher's assigned review questions.
    const assignment = getOrCreateAsteroidAssignment();

    // Display the first assigned question.
    if (assignment.length > 0) {
      displayAsteroidQuestion(assignment[0]);
    }

    // Randomize asteroid locations and illustrations.
    randomizeAsteroidTargets();

    window.scrollTo(0, 0);

  });
}

// ==========================================
// DAY 2 — ARCHIVE REVIEW ROUTING CHECK
// ==========================================

const submitArchiveButton = document.getElementById("submitArchive");

if (submitArchiveButton) {
  submitArchiveButton.addEventListener("click", () => {
    const review = getDay2ReviewBanks();

    if (!review) {
      console.warn("Earth archive assessment is incomplete.");
      return;
    }

    
const earthArchive = document.getElementById("earthArchive");
const quibSuccessScreen = document.getElementById("quibSuccessScreen");
const quibAsteroidScreen = document.getElementById("quibAsteroidScreen");

earthArchive.hidden = true;

if (review.needsReview) {
  document.getElementById("quibAsteroidResearcherName").textContent =
  document.getElementById("day2ResearcherName").textContent;
document.getElementById("quibAsteroidResearcherName2").textContent =
  document.getElementById("day2ResearcherName").textContent;
  quibAsteroidScreen.hidden = false;
} else {
  document.getElementById("quibSuccessResearcherName").textContent =
  document.getElementById("day2ResearcherName").textContent;
  quibSuccessScreen.hidden = false;
}

window.scrollTo(0, 0);

  });
}
  const a0Option = document.getElementById("day2A0Option");
  const a1Option = document.getElementById("day2A1Option");

  const a0Name = document.getElementById("day2A0Name");
  const a1Name = document.getElementById("day2A1Name");

  // Display only available saved research records.
  a0Option.hidden = !a0Profile;
  a1Option.hidden = !a1Profile;

  if (a0Profile) {
    a0Name.textContent = a0Profile.name || "A0 Researcher";
  }

  if (a1Profile) {
    a1Name.textContent = a1Profile.name || "A1 Researcher";
  }

  // Reveal the name field for a new researcher.
  const researcherOptions = document.querySelectorAll(
    'input[name="day2Researcher"]'
  );

  const newResearcherFields = document.getElementById(
    "day2NewResearcherFields"
  );

  const dataSource = document.getElementById("day2DataSource");

  researcherOptions.forEach(function (option) {
    option.addEventListener("change", function () {

      newResearcherFields.hidden = option.value !== "new";

      if (option.value === "a0") {
        dataSource.textContent = "A0 saved investigation";
      } else if (option.value === "a1") {
        dataSource.textContent = "A1 saved investigation";
      } else {
        dataSource.textContent =
          "Expedition reference data — no Day 1 record required";
      }

    });
  });

  // ==========================================
  // DAY 2 — INTRODUCTION NAVIGATION
  // ==========================================

  // ==========================================
  // DAY 2 — RESEARCHER IDENTIFICATION
  // ==========================================

  const day2Identification = document.getElementById(
    "day2Identification"
  );

  const enterLaboratory = document.getElementById(
    "day2EnterLaboratory"
  );

  const identificationSkip = document.getElementById(
    "day2IdentificationSkip"
  );

  const identificationFeedback = document.getElementById(
    "day2IdentificationFeedback"
  );

  const newResearcherName = document.getElementById(
    "day2NewResearcherName"
  );

  function identifyResearcher(skipIntroduction) {

    const selected = document.querySelector(
      'input[name="day2Researcher"]:checked'
    );

    if (!selected) {
      identificationFeedback.textContent =
        "Please select a research record before continuing.";
      return;
    }

    const version = selected.value;
    let researcherName = "";

    if (version === "a0" || version === "a1") {

      const profile = version === "a0"
        ? a0Profile
        : a1Profile;

      if (!profile) {
        identificationFeedback.textContent =
          "This saved research record is unavailable.";
        return;
      }

      researcherName = profile.name;

    } else {

      researcherName = newResearcherName.value.trim();

    }

    if (!researcherName) {
      identificationFeedback.textContent =
        "Please enter a researcher name before continuing.";

      if (version === "new") {
        newResearcherName.focus();
      }

      return;
    }

    // Save the selected research identity for Day 2.
    localStorage.setItem(
      "alien-day2-selected-investigation",
      version
    );

    localStorage.setItem(
      "alien-day2-researcher-name",
      researcherName
    );

    // Load or create this researcher's Day 2 record.
    day2ResearchRecord = loadDay2ResearchRecord(
      version,
      researcherName
    );

initializeRecord03Identities();
renderRecord03FeedingTable();
restoreRecord03Progress();
restoreRecord04Progress();
saveDay2ResearchRecord();
    restoreRecord01Answers();
    restoreRecord02Arrows();
restoreRecord02Sequences();

    // Recalculate archive progress after restoring saved records.
    const completedArchiveRecords = document.querySelectorAll(
      ".archive-file.submitted"
    ).length;

    document.getElementById(
      "archiveProgressCount"
    ).textContent = `${completedArchiveRecords} / 4`;

    document.getElementById(
      "archiveProgressFill"
    ).style.width = `${completedArchiveRecords * 25}%`;

    // Restore the archive submission button.
    const archiveSubmitButton = document.getElementById(
      "submitArchive"
    );

    const allRecordsComplete = completedArchiveRecords === 4;

    archiveSubmitButton.disabled = !allRecordsComplete;

    archiveSubmitButton.textContent = allRecordsComplete
      ? "SUBMIT TO ARCHIVIST QUIB FOR REVIEW →"
      : "COMPLETE ALL FOUR RECORDS TO CONTINUE";

    // Personalize the crew welcome.
    document.getElementById(
      "day2ResearcherName"
    ).textContent = researcherName;

    identificationFeedback.textContent = "";
    day2Identification.hidden = true;

    if (skipIntroduction) {
      day2Welcome.hidden = true;
      quibIntroduction.hidden = true;
      earthArchive.hidden = false;
    } else {
      day2Welcome.hidden = false;
      quibIntroduction.hidden = true;
      earthArchive.hidden = true;
    }

    window.scrollTo(0, 0);
  }

  enterLaboratory.addEventListener("click", function () {
    identifyResearcher(false);
  });

  identificationSkip.addEventListener("click", function () {
    identifyResearcher(true);
  });

  const day2Welcome =
    document.getElementById("day2Welcome");

  const quibIntroduction =
    document.getElementById("quibIntroduction");

  const earthArchive =
    document.getElementById("earthArchive");

  const day2WelcomeContinue =
    document.getElementById("day2WelcomeContinue");

  const day2WelcomeSkip =
    document.getElementById("day2WelcomeSkip");

  const beginEarthAssessment =
    document.getElementById("beginEarthAssessment");

  // Scene 1 → Scene 2: Meet Archivist Quib.
  day2WelcomeContinue.addEventListener("click", () => {
    day2Welcome.hidden = true;
    quibIntroduction.hidden = false;
    window.scrollTo(0, 0);
  });

  // Skip both introduction scenes.
  day2WelcomeSkip.addEventListener("click", () => {
    day2Welcome.hidden = true;
    quibIntroduction.hidden = true;
    earthArchive.hidden = false;
    window.scrollTo(0, 0);
  });

  // Scene 2 → Earth Research Archive.
  beginEarthAssessment.addEventListener("click", () => {
    quibIntroduction.hidden = true;
    earthArchive.hidden = false;
    window.scrollTo(0, 0);
  });


  // Open Earth Record 01
  const record01Card = document.querySelector(
    '.archive-file[data-record="1"]'
  );

  const record01Screen = document.getElementById(
    "record01Screen"
  );

  if (record01Card && record01Screen) {
    record01Card.addEventListener("click", () => {
      document.getElementById("earthArchive").hidden = true;
      record01Screen.hidden = false;
      window.scrollTo(0, 0);
    });
  }


  // ==========================================
  // RECORD 02 — OPEN ENERGY TRANSFER FILE
  // ==========================================

  const record02Card = document.querySelector(
    '.archive-file[data-record="2"]'
  );

  const record02Screen = document.getElementById(
    "record02Screen"
  );

  
if (record02Card && record02Screen) {
  record02Card.addEventListener("click", () => {
    earthArchive.hidden = true;
    record02Screen.hidden = false;

    const saved = day2ResearchRecord?.records["02"];
    const activity1Submitted =
      saved?.stage === "activity2" ||
      saved?.stage === "complete";

    if (activity1Submitted) {
      // Skip the introduction and completed Activity 1.
      document.querySelector(
        "#record02Screen .hamburger-workspace"
      ).hidden = true;

      document.querySelector(
        "#record02Screen .record02-quib-transmission"
      ).hidden = true;

      document.getElementById(
        "record02Activity1"
      ).hidden = true;

      document.getElementById(
        "record02Activity2"
      ).hidden = false;

      document.getElementById(
        "record02Progress"
      ).textContent =
        "ACTIVITY 02 · RECONSTRUCT FOOD CHAINS";
    }

    window.scrollTo(0, 0);
  });
}



/* FILE 02 — Navigate from Hamburger Incident to Activity 1 */

const hamburgerContinue = document.getElementById("hamburgerContinue");
const record02Activity1 = document.getElementById("record02Activity1");
const hamburgerWorkspace = document.querySelector(
  "#record02Screen .hamburger-workspace"
);
const record02QuibTransmission = document.querySelector(
  "#record02Screen .record02-quib-transmission"
);


hamburgerContinue.addEventListener("click", () => {
  hamburgerWorkspace.hidden = true;
  record02QuibTransmission.hidden = true;
  record02Activity1.hidden = false;

  // Switch the file header to the current activity.
  document.getElementById("record02Progress").textContent =
    "ACTIVITY 01 · REPAIR THE RECORDS";

  // Move the page directly to the new activity.
  requestAnimationFrame(() => {
    record02Activity1.scrollIntoView({
      behavior: "instant",
      block: "start"
    });
  });
});


/* FILE 02 — Activity 1 arrow selection */

const record02ArrowGroups = document.querySelectorAll(
  "#record02Activity1 .record02-arrow-choice"
);

const record02ArrowProgress = document.getElementById(
  "record02ArrowProgress"
);

const record02SubmitArrows = document.getElementById(
  "record02SubmitArrows"
);

function restoreRecord02Arrows() {
  if (!day2ResearchRecord) return;

  const saved = day2ResearchRecord.records["02"];
  if (!saved) return;

  const answers = saved.arrowAnswers || {};
  const arrowsSubmitted = Boolean(
    saved.stage === "activity2" || saved.stage === "complete"

  );

  record02ArrowGroups.forEach((group) => {
    const key = `${group.dataset.chain}-${group.dataset.arrow}`;
    const savedDirection = answers[key];

    group.querySelectorAll("button").forEach((button) => {
      const selected = button.dataset.direction === savedDirection;

      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = arrowsSubmitted;
    });
  });

  const completed = Object.keys(answers).length;

  record02ArrowProgress.textContent =
    `${completed} / 6 RELATIONSHIPS ANALYZED`;

  record02SubmitArrows.disabled =
    arrowsSubmitted || completed !== 6;

  if (arrowsSubmitted) {
    record02SubmitArrows.textContent =
      "INITIAL ANALYSIS RECORDED ✓";
  }
}

record02ArrowGroups.forEach((group) => {
  const buttons = group.querySelectorAll("button");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {

      // Clear the previous choice for this relationship.
      buttons.forEach((otherButton) => {
        otherButton.classList.remove("selected");
        otherButton.setAttribute("aria-pressed", "false");
      });

      // Select the student's chosen direction.
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");

      // Count completed relationships.
      const completed = document.querySelectorAll(
        "#record02Activity1 .record02-arrow-choice button.selected"
      ).length;

      record02ArrowProgress.textContent =
        `${completed} / 6 RELATIONSHIPS ANALYZED`;

      // Enable submission only after all six choices.
      record02SubmitArrows.disabled = completed !== 6;
    });
  });
});

/* ========================================
   FILE 02 — ACTIVITY 2: SWAP ORGANISMS
   ======================================== */

const record02Sequences = document.querySelectorAll(
  "#record02Activity2 .record02-sequence"
);

function restoreRecord02Sequences() {
  if (!day2ResearchRecord) return;

  const saved = day2ResearchRecord.records["02"];
  if (!saved) return;

  const completed = saved.stage === "complete";

  record02Sequences.forEach((sequence) => {
    const ecosystem = sequence.dataset.ecosystem;
    const savedOrder = saved.sequenceAnswers?.[ecosystem];

    if (!savedOrder) return;

    const cards = Array.from(
      sequence.querySelectorAll(".record02-sequence-organism")
    );

    // Remember each organism's original illustration and label.
    const organismContent = {};

    cards.forEach((card) => {
      organismContent[card.dataset.organism] = card.innerHTML;
    });

    // Restore the student's submitted arrangement.
    cards.forEach((card, index) => {
      const organism = savedOrder[index];

      card.dataset.organism = organism;
      card.innerHTML = organismContent[organism];
      card.classList.remove("selected");
      card.disabled = completed;
    });
  });

  if (completed) {

    // Mark File 02 complete only for researchers
    // whose saved record confirms submission.
    record02Card.classList.add("submitted");
    record02Card.setAttribute("data-status", "complete");

    record02Card.querySelector(
      ".archive-file-icon"
    ).textContent = "✓";

    record02Card.querySelector(
      ".archive-file-status"
    ).textContent = "✓ RECORD SUBMITTED";

    record02ResetAll.disabled = true;
    record02SubmitSequences.disabled = true;
    record02SubmitSequences.textContent =
      "INITIAL FOOD CHAIN ANALYSIS RECORDED ✓";

    document.getElementById(
      "record02SequenceProgress"
    ).textContent = "2 / 2 FOOD CHAINS SUBMITTED";
  }
}

record02Sequences.forEach((sequence) => {

  let selectedCard = null;

  sequence.addEventListener("click", (event) => {

    // Prevent changes to completed food-chain submissions.
    if (day2ResearchRecord?.records["02"]?.submitted) {
      return;
    }

    const clickedCard = event.target.closest(
      ".record02-sequence-organism"
    );

    if (!clickedCard || !sequence.contains(clickedCard)) {
      return;
    }

    // First click: select an organism.
    if (selectedCard === null) {
      selectedCard = clickedCard;
      selectedCard.classList.add("selected");
      return;
    }

    // Clicking the same organism cancels selection.
    if (selectedCard === clickedCard) {
      selectedCard.classList.remove("selected");
      selectedCard = null;
      return;
    }

    // Second click: exchange organism identities and images.
    const firstOrganism = selectedCard.dataset.organism;
    const firstContent = selectedCard.innerHTML;

    selectedCard.dataset.organism = clickedCard.dataset.organism;
    selectedCard.innerHTML = clickedCard.innerHTML;

    clickedCard.dataset.organism = firstOrganism;
    clickedCard.innerHTML = firstContent;

    // Clear selection.
    selectedCard.classList.remove("selected");
    selectedCard = null;

  });

});

/* ========================================
   FILE 02 — ACTIVITY 2: RESET FOOD CHAINS
   ======================================== */

const record02OriginalSequences = {
  desert: ["hawk", "grass", "snake", "mouse"],
  marine: ["tuna", "phytoplankton", "shark", "zooplankton"]
};


const record02ResetAll = document.getElementById(
  "record02ResetAll"
);

record02ResetAll.addEventListener("click", () => {
  // Do not allow changes after File 02 is submitted.
  if (day2ResearchRecord?.records["02"]?.submitted) {
    return;
  }

  // Reset both ecosystems to their original scrambled order.
  record02Sequences.forEach((sequence) => {
    const ecosystem = sequence.dataset.ecosystem;
    const originalOrder = record02OriginalSequences[ecosystem];

    const cards = Array.from(
      sequence.querySelectorAll(".record02-sequence-organism")
    );

    const organismContent = {};

    cards.forEach((card) => {
      organismContent[card.dataset.organism] = card.innerHTML;
    });

    cards.forEach((card, index) => {
      const organism = originalOrder[index];

      card.dataset.organism = organism;
      card.innerHTML = organismContent[organism];
      card.classList.remove("selected");
    });
  });
});

/* ========================================
   FILE 02 — ACTIVITY 2: SUBMIT FOOD CHAINS
   ======================================== */

const record02SubmitSequences = document.getElementById(
  "record02SubmitSequences"
);

let record02InitialSequenceScore = null;

record02SubmitSequences.addEventListener("click", () => {

  const correctSequences = {
    desert: ["grass", "mouse", "snake", "hawk"],
    marine: ["phytoplankton", "zooplankton", "tuna", "shark"]
  };

  const studentSequences = {};
  let score = 0;

  document.querySelectorAll(
    "#record02Activity2 .record02-sequence"
  ).forEach((sequence) => {

    const ecosystem = sequence.dataset.ecosystem;

    const studentOrder = Array.from(
      sequence.querySelectorAll(".record02-sequence-organism")
    ).map(card => card.dataset.organism);

    studentSequences[ecosystem] = studentOrder;

    // Award one point for each completely correct chain.
    if (
      JSON.stringify(studentOrder) ===
      JSON.stringify(correctSequences[ecosystem])
    ) {
      score++;
    }

  });

  // Preserve the first submitted score.
  if (record02InitialSequenceScore === null) {
    record02InitialSequenceScore = score;
  }

  console.log("File 02 initial sequence analysis:", {
    answers: studentSequences,
    score: record02InitialSequenceScore,
    total: 2
  });

  // Lock both food chains.
  document.querySelectorAll(
    "#record02Activity2 .record02-sequence-organism"
  ).forEach(card => {
    card.disabled = true;
    card.classList.remove("selected");
  });

record02ResetAll.disabled = true;

  // Update the submission button.
  record02SubmitSequences.disabled = true;
  record02SubmitSequences.textContent =
    "INITIAL FOOD CHAIN ANALYSIS RECORDED ✓";

  // Update progress.
  document.getElementById(
    "record02SequenceProgress"
  ).textContent = "2 / 2 FOOD CHAINS SUBMITTED";
 
  // Save the completed File 02 investigation.
  if (day2ResearchRecord) {
    const record = day2ResearchRecord.records["02"];

    record.sequenceAnswers = structuredClone(studentSequences);
    record.sequenceScore = record02InitialSequenceScore;
    // Combine both activities for a four-point assessment.
    record.totalScore =
      record.arrowScore + record.sequenceScore;

    // Proficiency requires at least three correct chains.
    record.proficient = record.totalScore >= 3;
    record.stage = "complete";
    record.submitted = true;

    saveDay2ResearchRecord();
  }

  // Mark File 02 complete in the archive.
  const record02Card = document.querySelector(
    '.archive-file[data-record="2"]'
  );

  record02Card.classList.add("submitted");
  record02Card.setAttribute("data-status", "complete");

  record02Card.querySelector(
    ".archive-file-icon"
  ).textContent = "✓";

  record02Card.querySelector(
    ".archive-file-status"
  ).textContent = "✓ RECORD SUBMITTED";

  // Update archive progress.
  const completedRecords = document.querySelectorAll(
    ".archive-file.submitted"
  ).length;

  document.getElementById(
    "archiveProgressCount"
  ).textContent = `${completedRecords} / 4`;

  document.getElementById(
    "archiveProgressFill"
  ).style.width = `${completedRecords * 25}%`;

  // Return to the Earth Research Archive.
  document.getElementById("record02Screen").hidden = true;
  document.getElementById("earthArchive").hidden = false;

  window.scrollTo(0, 0);

});

/* FILE 02 — Activity 1 initial submission */

let record02InitialArrowScore = null;

record02SubmitArrows.addEventListener("click", () => {

  // Correct energy directions for the six relationships.
  const correctDirections = {
    "1-1": "right",
    "1-2": "right",
    "1-3": "right",
    "2-1": "left",
    "2-2": "left",
    "2-3": "left"
  };

  const studentAnswers = {};
  let score = 0;

  record02ArrowGroups.forEach((group) => {
    const key = `${group.dataset.chain}-${group.dataset.arrow}`;
    const selected = group.querySelector("button.selected");

    if (!selected) return;

    studentAnswers[key] = selected.dataset.direction;

        // Individual arrow answers are recorded here.
    // Complete food chains will be scored below.
  });
  // Award one point for each entirely correct food chain.
  for (const chain of ["1", "2"]) {
    const chainCorrect = [1, 2, 3].every(arrow =>
      studentAnswers[`${chain}-${arrow}`] ===
      correctDirections[`${chain}-${arrow}`]
    );

    if (chainCorrect) {
      score++;
    }
  }

  // Preserve the student's first submitted score.
  if (record02InitialArrowScore === null) {
    record02InitialArrowScore = score;
  }

  // Lock the arrows after submission.
  record02ArrowGroups.forEach((group) => {
    group.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
    });
  });

  record02SubmitArrows.disabled = true;
  record02SubmitArrows.textContent = "INITIAL ANALYSIS RECORDED ✓";

  record02ArrowProgress.textContent =
    "6 / 6 RELATIONSHIPS ANALYZED";

    console.log("File 02 initial arrow analysis:", {
    answers: studentAnswers,
    score: record02InitialArrowScore,
    total: 6
  });

  // Save the student's original arrow-direction analysis.
  if (day2ResearchRecord) {
    const record = day2ResearchRecord.records["02"];

    record.arrowAnswers = structuredClone(studentAnswers);
    record.arrowScore = record02InitialArrowScore;
    record.stage = "activity2";
    record.submitted = false;

    saveDay2ResearchRecord();
  }

  // Advance to Activity 2: Reconstruct Food Chains.
  const record02Activity2 = document.getElementById(
    "record02Activity2"
  );

  record02Activity1.hidden = true;
  record02Activity2.hidden = false;

  document.getElementById("record02Progress").textContent =
    "ACTIVITY 02 · RECONSTRUCT FOOD CHAINS";

  window.scrollTo(0, 0);

});


  // ==========================================
  // RECORD 02 — HAMBURGER ARROW INTERACTION
  // ==========================================

  const hamburgerArrow = document.getElementById("hamburgerArrow");
  const hamburgerArrowSymbol = document.getElementById("hamburgerArrowSymbol");
  const hamburgerImage = document.getElementById("hamburgerImage");
  const hamburgerExplanation = document.getElementById("hamburgerExplanation");
  const hamburgerStatus = document.getElementById("hamburgerStatus");

  let hamburgerReversed = false;

  hamburgerArrow.addEventListener("click", () => {
    hamburgerReversed = !hamburgerReversed;

    hamburgerArrow.classList.toggle("reversed", hamburgerReversed);
    hamburgerExplanation.classList.toggle("reversed", hamburgerReversed);

    hamburgerArrowSymbol.textContent = hamburgerReversed ? "→" : "←";
    hamburgerArrow.setAttribute("aria-pressed", String(hamburgerReversed));

    hamburgerImage.src = hamburgerReversed
      ? "assets/hamburger-monster.png"
      : "assets/hamburger-person.png";

    hamburgerImage.alt = hamburgerReversed
      ? "A monstrous hamburger that eats people."
      : "A person who has eaten a hamburger.";

    hamburgerExplanation.textContent = hamburgerReversed
      ? "Energy transfers from the person to the hamburger!"
      : "Energy transfers from the hamburger to the person.";

    hamburgerStatus.textContent = hamburgerReversed
      ? "DIRECTION REVERSED"
      : "DIRECTION VERIFIED";

    hamburgerStatus.style.color = hamburgerReversed
      ? "#c43d3d"
      : "#168452";
  });


  // ==========================================
  // RECORD 03 — OPEN FOOD WEB RECONSTRUCTION
  // ==========================================

  const record03Card = document.querySelector(
    '.archive-file[data-record="3"]'
  );

  const record03Screen = document.getElementById(
    "record03Screen"
  );

  if (record03Card && record03Screen) {
    record03Card.addEventListener("click", () => {
      earthArchive.hidden = true;
      record03Screen.hidden = false;
      window.scrollTo(0, 0);
    });
  }

  // ==========================================
  // RECORD 03 — FIXED FOOD WEB ARROWS
  // ==========================================

  const record03Diagram = document.getElementById(
    "record03Diagram"
  );

  const record03Arrows = document.getElementById(
    "record03Arrows"
  );

  // Each connection is FOOD POSITION → CONSUMER POSITION.
  const record03Connections = [
    [8, 7], // Grasses → Insects
    [8, 4], // Grasses → Mouse
    [8, 5], // Grasses → Rabbit
    [8, 6], // Grasses → Deer
    [7, 3], // Insects → Shrew
    [7, 4], // Insects → Mouse
    [3, 1], // Shrew → Snake
    [4, 1], // Mouse → Snake
    [5, 1], // Rabbit → Snake
    [5, 2], // Rabbit → Cougar
    [6, 2]  // Deer → Cougar
  ];

  function drawRecord03Arrows() {
    if (!record03Diagram || !record03Arrows) return;

    const diagramRect = record03Diagram.getBoundingClientRect();

    if (!diagramRect.width || !diagramRect.height) return;

    const width = diagramRect.width;
    const height = diagramRect.height;

    record03Arrows.setAttribute(
      "viewBox",
      `0 0 ${width} ${height}`
    );

    record03Arrows.replaceChildren();

    const namespace = "http://www.w3.org/2000/svg";

    function getSlot(position) {
      const slot = record03Diagram.querySelector(
        `.record03-slot[data-position="${position}"]`
      );

      const rect = slot.getBoundingClientRect();

      return {
        x: rect.left - diagramRect.left + rect.width / 2,
        y: rect.top - diagramRect.top + rect.height / 2,
        halfWidth: rect.width / 2,
        halfHeight: rect.height / 2
      };
    }

    record03Connections.forEach(([food, consumer]) => {
      const start = getSlot(food);
      const end = getSlot(consumer);

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);

      if (!distance) return;

      const ux = dx / distance;
      const uy = dy / distance;

      function edgeDistance(node) {
        return Math.min(
          Math.abs(ux) > 0.0001
            ? node.halfWidth / Math.abs(ux)
            : Infinity,
          Math.abs(uy) > 0.0001
            ? node.halfHeight / Math.abs(uy)
            : Infinity
        );
      }

      const startOffset = edgeDistance(start) + 5;
      const endOffset = edgeDistance(end) + 9;

      const x1 = start.x + ux * startOffset;
      const y1 = start.y + uy * startOffset;

      const x2 = end.x - ux * endOffset;
      const y2 = end.y - uy * endOffset;

      const line = document.createElementNS(namespace, "line");

      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#247a96");
      line.setAttribute("stroke-width", "2.5");
      line.setAttribute("stroke-linecap", "round");

      record03Arrows.appendChild(line);

      // Arrowhead points toward the consumer.
      const arrowLength = 12;
      const arrowHalfWidth = 5;

      const baseX = x2 - ux * arrowLength;
      const baseY = y2 - uy * arrowLength;

      const perpendicularX = -uy;
      const perpendicularY = ux;

      const arrowhead = document.createElementNS(
        namespace,
        "polygon"
      );

      arrowhead.setAttribute(
        "points",
        [
          `${x2},${y2}`,
          `${baseX + perpendicularX * arrowHalfWidth},${baseY + perpendicularY * arrowHalfWidth}`,
          `${baseX - perpendicularX * arrowHalfWidth},${baseY - perpendicularY * arrowHalfWidth}`
        ].join(" ")
      );

      arrowhead.setAttribute("fill", "#247a96");

      record03Arrows.appendChild(arrowhead);
    });
  }

  // Draw after File 03 becomes visible.
  if (record03Card && record03Screen) {
    record03Card.addEventListener("click", () => {
      requestAnimationFrame(drawRecord03Arrows);
    });
  }

  // Keep arrows aligned if the diagram changes size.
  if (record03Diagram && "ResizeObserver" in window) {
    const record03Observer = new ResizeObserver(
      drawRecord03Arrows
    );

    record03Observer.observe(record03Diagram);
  }


  // ==========================================
  // RECORD 03 — ORGANISM CARD PLACEMENT
  // ==========================================

  const record03Cards = document.querySelectorAll(
    "#record03Cards .record03-organism-card"
  );

  const record03Slots = document.querySelectorAll(
    "#record03Diagram .record03-slot"
  );

  const record03Progress = document.getElementById(
    "record03Progress"
  );

  const record03Submit = document.getElementById(
    "record03Submit"
  );

  let record03SelectedCard = null;

  // Store the letter placed in each food-web position.
  const record03Placements = {};

  // ==========================================
  // RECORD 03 — RANDOMIZED ORGANISM IDENTITIES
  // ==========================================

  const record03Organisms = [
    "rabbit",
    "snake",
    "insects",
    "deer",
    "grasses",
    "cougar",
    "shrew",
    "mouse"
  ];

  const record03Letters = [
    "A", "B", "C", "D", "E", "F", "G", "H"
  ];

  let record03IdentityMap = {};

  function createRecord03IdentityMap() {
    const shuffled = [...record03Organisms];

    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] =
        [shuffled[j], shuffled[i]];
    }

    return Object.fromEntries(
      record03Letters.map((letter, index) => [
        letter,
        shuffled[index]
      ])
    );
  }

  function initializeRecord03Identities() {
    if (!day2ResearchRecord) return;

    const record = day2ResearchRecord.records["03"];

    if (!record.identityMap) {
      record.identityMap = createRecord03IdentityMap();
      saveDay2ResearchRecord();
    }

    record03IdentityMap = record.identityMap;
  }


  // ==========================================
  // RECORD 03 — RESTORED ORGANISM IDENTITIES
  // ==========================================

  let record03IdentitiesRevealed = false;

  function createRecord03OrganismContent(letter) {
    if (!record03IdentitiesRevealed) {
      return document.createTextNode(letter);
    }

    const organism = record03IdentityMap[letter];

    const container = document.createElement("span");
    container.className = "record03-restored-organism";

    const image = document.createElement("img");
    image.src = `assets/earth-${organism}.png`;
    image.alt = "";
    image.className = "record03-restored-image";

    const label = document.createElement("span");
    label.className = "record03-restored-label";
    label.textContent =
      `${letter}: ${organism.toUpperCase()}`;

    container.append(image, label);

    return container;
  }

  function updateRecord03Display() {
    let completed = 0;

    record03Slots.forEach((slot) => {
      const position = slot.dataset.position;
      const letter = record03Placements[position];

      slot.replaceChildren();

if (letter) {
  slot.appendChild(
    createRecord03OrganismContent(letter)
  );
}

      if (letter) {
        completed++;
        slot.classList.add("filled");
      } else {
        slot.classList.remove("filled");
      }
    });

    
record03Cards.forEach((card) => {
  const letter = card.dataset.organism;
  const isPlaced = Object.values(
    record03Placements
  ).includes(letter);

  // Show the letter before restoration.
  // Show its actual identity after restoration.
  card.replaceChildren(
    createRecord03OrganismContent(letter)
  );

  card.classList.toggle("placed", isPlaced);
  card.disabled = isPlaced;
});


    record03Progress.textContent =
      `${completed} / 8 ORGANISMS PLACED`;

    record03Submit.disabled = completed !== 8;
  }

  // Select a card from the organism bank.
  record03Cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (card.disabled) return;

      record03Cards.forEach((other) => {
        other.classList.remove("selected");
      });

      if (record03SelectedCard === card.dataset.organism) {
        record03SelectedCard = null;
      } else {
        record03SelectedCard = card.dataset.organism;
        card.classList.add("selected");
      }
    });
  });


  // ==========================================
  // RECORD 03 — RANDOMIZED FEEDING TABLE
  // ==========================================

  function renderRecord03FeedingTable() {
    const tableBody = document.querySelector(
      "#record03FeedingTable tbody"
    );

    if (!tableBody) return;

    // Original ecological relationships:
    // Each organism is followed by its consumers.
    const feedingRelationships = {
      rabbit: ["snake", "cougar"],
      snake: [],
      insects: ["shrew", "mouse"],
      deer: ["cougar"],
      grasses: ["rabbit", "insects", "deer", "mouse"],
      cougar: [],
      shrew: ["snake"],
      mouse: ["snake"]
    };

    // Reverse the randomized map so we can find
    // the correct letter for any organism.
    const organismToLetter = Object.fromEntries(
      Object.entries(record03IdentityMap).map(
        ([letter, organism]) => [organism, letter]
      )
    );

    tableBody.replaceChildren();

    record03Letters.forEach((letter) => {
      const organism = record03IdentityMap[letter];
      const consumers = feedingRelationships[organism];

      if (!consumers) return;

      const row = document.createElement("tr");
      const organismCell = document.createElement("td");
      const consumersCell = document.createElement("td");

      organismCell.textContent = letter;

      consumersCell.textContent = consumers.length
        ? consumers
            .map((consumer) => organismToLetter[consumer])
            .sort()
            .join(", ")
        : "Decomposers (not pictured)";

      row.append(organismCell, consumersCell);
      tableBody.appendChild(row);
    });
  }
 
  // ==========================================
  // RECORD 03 — MOVE AND SWAP ORGANISMS
  // ==========================================

  let record03SelectedPosition = null;

  function clearRecord03Selection() {
    record03SelectedCard = null;
    record03SelectedPosition = null;

    record03Cards.forEach((card) => {
      card.classList.remove("selected");
    });

    record03Slots.forEach((slot) => {
      slot.classList.remove("selected");
    });
  }

  record03Slots.forEach((slot) => {
    slot.addEventListener("click", () => {
// Prevent changes after final submission.
    if (record03Stage === "complete") return;
      const position = slot.dataset.position;
      const currentLetter = record03Placements[position];

      // The optional starting organism stays locked.
      if (record03HintUsed && position === "8") {
        return;
      }

      // CASE 1: A card was selected from the bank.
      if (record03SelectedCard) {
        record03Placements[position] = record03SelectedCard;

        clearRecord03Selection();
        updateRecord03Display();
        return;
      }

      // CASE 2: A card was selected from another slot.
      if (record03SelectedPosition !== null) {
        const sourcePosition = record03SelectedPosition;

        // Clicking the same slot cancels selection.
        if (sourcePosition === position) {
          clearRecord03Selection();
          return;
        }

        const movingLetter = record03Placements[sourcePosition];

        // Swap with the destination's occupant,
        // or move into an empty destination.
        if (currentLetter) {
          record03Placements[sourcePosition] = currentLetter;
        } else {
          delete record03Placements[sourcePosition];
        }

        record03Placements[position] = movingLetter;

        clearRecord03Selection();
        updateRecord03Display();
        return;
      }

      // CASE 3: Select an occupied slot for moving.
      if (currentLetter) {
        record03SelectedPosition = position;
        slot.classList.add("selected");
      }
    });
  });

  // ==========================================
  // RECORD 03 — OPTIONAL STARTING HINT
  // ==========================================

  const record03Hint = document.getElementById(
    "record03Hint"
  );

  const record03HintMessage = document.getElementById(
    "record03HintMessage"
  );

  let record03HintUsed = false;

  record03Hint.addEventListener("click", () => {
    if (record03HintUsed) return;

    
    // Find whichever letter represents grasses
    // in this researcher's randomized assignment.
    const startingLetter = Object.keys(
      record03IdentityMap
    ).find(
      (letter) => record03IdentityMap[letter] === "grasses"
    );

    // Grasses always belong in position 8.
    const startingPosition = "8";

    if (!startingLetter) {
      console.error(
        "Record 03: Grasses not found in identity map."
      );
      return;
    }

    // If the starting letter is already placed elsewhere, remove it.
    Object.keys(record03Placements).forEach((position) => {
      if (record03Placements[position] === startingLetter) {
        delete record03Placements[position];
      }
    });

    // If position 8 contains another letter, it returns
    // automatically to the card bank.
    record03Placements[startingPosition] = startingLetter;

    record03SelectedCard = null;
record03SelectedPosition = null;

    record03Cards.forEach((card) => {
      card.classList.remove("selected");
    });

    record03HintUsed = true;

    record03Hint.disabled = true;
    record03Hint.textContent = "✓ STARTING POINT PROVIDED";

    record03HintMessage.hidden = false;

    // Keep the starting card in place.
    updateRecord03Display();
  });

  updateRecord03Display();

  // ==========================================
  // RECORD 03 — INITIAL SUBMISSION
  // ==========================================

  let record03Stage = "initial";
  let record03InitialScore = null;

  // Restore File 03 progress for a returning researcher.
  function restoreRecord03Progress() {
    if (!day2ResearchRecord) return;

    const saved = day2ResearchRecord.records["03"];
    if (!saved) return;

    // Clear any placements from the previous researcher.
    Object.keys(record03Placements).forEach((position) => {
      delete record03Placements[position];
    });

    // Restore the original submitted arrangement.
    if (saved.initialPlacements) {
      Object.assign(
        record03Placements,
        structuredClone(saved.initialPlacements)
      );
    }

    record03InitialScore = saved.initialScore ?? null;
    record03HintUsed = Boolean(saved.hintUsed);

    // Restore the hint button.
    record03Hint.disabled = record03HintUsed;
    record03Hint.textContent = record03HintUsed
      ? "✓ STARTING POINT PROVIDED"
      : "NEED A STARTING POINT?";

    record03HintMessage.hidden = !record03HintUsed;

    // Restore the submission stage.
    


record03Stage = saved.stage === "complete"
  ? "complete"
  : saved.stage === "revised" ||
    saved.stage === "initial-submitted"
    ? "revised"
    : saved.stage === "restoring"
      ? "restoring"
      : "initial";

// Restore final placements when available.
if (record03Stage === "complete" && saved.finalPlacements) {
  Object.keys(record03Placements).forEach((position) => {
    delete record03Placements[position];
  });

  Object.assign(
    record03Placements,
    structuredClone(saved.finalPlacements)
  );
}

record03IdentitiesRevealed =
  record03Stage === "revised" ||
  record03Stage === "complete";

document.getElementById(
  "record03QuibTransmission"
).hidden = record03Stage !== "restoring";

    clearRecord03Selection();
    updateRecord03Display();

if (record03Stage === "complete") {
  record03Submit.disabled = true;
  record03Submit.textContent =
    "REVISED RECONSTRUCTION SUBMITTED ✓";
  record03Submit.classList.add("submitted");

  record03Card.classList.add("submitted");
  record03Card.setAttribute("data-status", "complete");
  record03Card.querySelector(".archive-file-icon").textContent = "✓";
  record03Card.querySelector(".archive-file-status").textContent =
    "✓ RECORD SUBMITTED";

  const completedRecords = document.querySelectorAll(
    ".archive-file.submitted"
  ).length;

  document.getElementById("archiveProgressCount").textContent =
    `${completedRecords} / 4`;

  document.getElementById("archiveProgressFill").style.width =
    `${completedRecords * 25}%`;

} else if (record03Stage === "restoring") {
  record03Submit.disabled = true;
  record03Submit.textContent =
    "INITIAL RECONSTRUCTION RECORDED ✓";
  record03Submit.classList.remove("submitted");

} else if (record03Stage === "revised") {
  record03Submit.disabled = false;
  record03Submit.textContent =
    "SUBMIT REVISED RECONSTRUCTION";
  record03Submit.classList.remove("submitted");
} else {
  record03Submit.textContent =
    "SUBMIT INITIAL RECONSTRUCTION";
  record03Submit.classList.remove("submitted");
}
  }


  const record03CorrectPositions = {
    "1": "snake",
    "2": "cougar",
    "3": "shrew",
    "4": "mouse",
    "5": "rabbit",
    "6": "deer",
    "7": "insects",
    "8": "grasses"
  };

  function scoreRecord03(placements) {
    let score = 0;

    Object.entries(record03CorrectPositions).forEach(
      ([position, correctOrganism]) => {
        const letter = placements[position];

        if (
          letter &&
          record03IdentityMap[letter] === correctOrganism
        ) {
          score++;
        }
      }
    );

    return score;
  }

  
record03Submit.addEventListener("click", () => {

  // FINAL SUBMISSION — save the revised reconstruction.
  if (record03Stage === "revised") {
    const finalPlacements =
      structuredClone(record03Placements);

    const finalScore =
      scoreRecord03(finalPlacements);

    if (day2ResearchRecord) {
      const record = day2ResearchRecord.records["03"];

      record.finalPlacements = finalPlacements;
      record.finalScore = finalScore;
record.proficient = finalScore === 8;
record.hintUsed = record03HintUsed;
      record.stage = "complete";
      record.submitted = true;

      saveDay2ResearchRecord();
    }

    record03Stage = "complete";

    // Lock the completed submission button.
    record03Submit.disabled = true;
    record03Submit.textContent =
      "REVISED RECONSTRUCTION SUBMITTED ✓";
    record03Submit.classList.add("submitted");

    // Mark File 03 complete in the Earth Research Archive.
    record03Card.classList.add("submitted");
    record03Card.setAttribute("data-status", "complete");

    record03Card.querySelector(
      ".archive-file-icon"
    ).textContent = "✓";

    record03Card.querySelector(
      ".archive-file-status"
    ).textContent = "✓ RECORD SUBMITTED";

    // Update the archive completion counter.
    const completedRecords = document.querySelectorAll(
      ".archive-file.submitted"
    ).length;

    document.getElementById(
      "archiveProgressCount"
    ).textContent = `${completedRecords} / 4`;

    document.getElementById(
      "archiveProgressFill"
    ).style.width = `${completedRecords * 25}%`;

    // Return to the Earth Research Archive.
    record03Screen.hidden = true;
    earthArchive.hidden = false;
    window.scrollTo(0, 0);

    console.log("File 03 final submission saved:", {
      initialScore: record03InitialScore,
      finalScore: finalScore,
      total: 8,
      hintUsed: record03HintUsed
    });

    return;
  }

  if (record03Stage !== "initial") return;


    // Save the student's original reconstruction.
    const initialPlacements =
      structuredClone(record03Placements);

    record03InitialScore =
      scoreRecord03(initialPlacements);

    // Save results without revealing correctness.
    if (day2ResearchRecord) {
      const record = day2ResearchRecord.records["03"];

      record.initialPlacements = initialPlacements;
      record.initialScore = record03InitialScore;
      record.hintUsed = record03HintUsed;
      record.stage = "restoring";

      saveDay2ResearchRecord();
    }

record03Stage = "restoring";

// Keep organism identities hidden until the
// researcher initiates the restoration.
record03IdentitiesRevealed = false;

clearRecord03Selection();
updateRecord03Display();

// Prevent another submission during restoration.
record03Submit.disabled = true;
record03Submit.textContent =
  "INITIAL RECONSTRUCTION RECORDED ✓";

// Display Archivist Quib's transmission.
document.getElementById(
  "record03QuibTransmission"
).hidden = false;

// Bring Quib's message into view.
document.getElementById(
  "record03QuibTransmission"
).scrollIntoView({
  behavior: "smooth",
  block: "start"
});

    console.log("File 03 initial submission saved.");
  });

  // ==========================================
  // FILE 03 — RESTORE ORGANISM IDENTITIES
  // ==========================================

  const record03RestoreButton = document.getElementById(
    "record03RestoreButton"
  );

  const record03GlitchVideo = document.getElementById(
    "record03GlitchVideo"
  );

  record03RestoreButton.addEventListener("click", () => {

    if (record03Stage !== "restoring") return;

    // Prevent the restoration from starting twice.
    record03RestoreButton.disabled = true;
    record03RestoreButton.textContent =
      "RESTORATION IN PROGRESS...";

    // Bring the food-web diagram into view.
    record03Diagram.scrollIntoView({
      behavior: "instant",
      block: "center"
    });

    let restorationFinished = false;

    function finishRecord03Restoration() {
      if (restorationFinished) return;
      restorationFinished = true;

      // Restore organism names and illustrations
      // while the video still covers the diagram.
      record03IdentitiesRevealed = true;
      clearRecord03Selection();
      updateRecord03Display();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {

          record03GlitchVideo.pause();
          record03GlitchVideo.hidden = true;

          record03Stage = "revised";

          // Save the new stage without changing
          // the original reconstruction score.
          if (day2ResearchRecord) {
            day2ResearchRecord.records["03"].stage =
              "revised";
            saveDay2ResearchRecord();
          }

          // Allow students to revise their food web.
          record03Submit.disabled = false;
          record03Submit.textContent =
            "SUBMIT REVISED RECONSTRUCTION";
          record03Submit.classList.remove("submitted");

          // Hide Quib's restoration transmission.
          document.getElementById(
            "record03QuibTransmission"
          ).hidden = true;

        });
      });
    }

    // Play the restoration animation.
    record03GlitchVideo.hidden = false;
    record03GlitchVideo.currentTime = 0;

    record03GlitchVideo.addEventListener(
      "ended",
      finishRecord03Restoration,
      { once: true }
    );

    record03GlitchVideo.addEventListener(
      "error",
      finishRecord03Restoration,
      { once: true }
    );

    const playback = record03GlitchVideo.play();

    if (playback && typeof playback.catch === "function") {
      playback.catch(finishRecord03Restoration);
    }

  });

  // ==========================================
  // RECORD 01 — RESPONSIVE FOOD WEB ARROWS
  // ==========================================

  const organismMap = document.querySelector(".organism-map");
  const foodWebSVG = document.querySelector(".food-web-arrows");

  // Each pair represents FOOD → CONSUMER.
  const feedingRelationships = [
    ["A", "C"],
    ["A", "F"],
    ["B", "C"],
    ["B", "D"],
    ["C", "E"],
    ["C", "G"],
    ["D", "F"],
    ["E", "G"],
    ["F", "G"]
  ];

  const SVG_NS = "http://www.w3.org/2000/svg";

  function drawFoodWeb() {
    if (!organismMap || !foodWebSVG) return;

    const mapRect = organismMap.getBoundingClientRect();
    const width = mapRect.width;
    const height = mapRect.height;

    if (width === 0 || height === 0) return;

    foodWebSVG.setAttribute("viewBox", `0 0 ${width} ${height}`);
    foodWebSVG.replaceChildren();

    function getOrganism(id) {
      const button = organismMap.querySelector(
        `[data-organism="${id}"]`
      );

      const rect = button.getBoundingClientRect();

      return {
        x: rect.left - mapRect.left + rect.width / 2,
        y: rect.top - mapRect.top + rect.height / 2,
        halfWidth: rect.width / 2,
        halfHeight: rect.height / 2
      };
    }

    feedingRelationships.forEach(([food, consumer]) => {
      const start = getOrganism(food);
      const end = getOrganism(consumer);

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);

      if (distance === 0) return;

      const ux = dx / distance;
      const uy = dy / distance;

      // Find where the line meets each rectangular card.
      function edgeDistance(node) {
        const xDistance = Math.abs(ux) > 0.0001
          ? node.halfWidth / Math.abs(ux)
          : Infinity;

        const yDistance = Math.abs(uy) > 0.0001
          ? node.halfHeight / Math.abs(uy)
          : Infinity;

        return Math.min(xDistance, yDistance);
      }

      const startOffset = edgeDistance(start) + 4;
      const endOffset = edgeDistance(end) + 7;

      const x1 = start.x + ux * startOffset;
      const y1 = start.y + uy * startOffset;

      const x2 = end.x - ux * endOffset;
      const y2 = end.y - uy * endOffset;

      // Draw the feeding connection.
      const line = document.createElementNS(SVG_NS, "line");

      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#247A96");
      line.setAttribute("stroke-width", "2.5");

      foodWebSVG.appendChild(line);

      // Draw a triangle pointing toward the consumer.
      const arrowLength = 13;
      const arrowHalfWidth = 6;

      const baseX = x2 - ux * arrowLength;
      const baseY = y2 - uy * arrowLength;

      const perpendicularX = -uy;
      const perpendicularY = ux;

      const points = [
        `${x2},${y2}`,
        `${baseX + perpendicularX * arrowHalfWidth},
         ${baseY + perpendicularY * arrowHalfWidth}`,
        `${baseX - perpendicularX * arrowHalfWidth},
         ${baseY - perpendicularY * arrowHalfWidth}`
      ].join(" ");

      const arrowhead = document.createElementNS(
        SVG_NS,
        "polygon"
      );

      arrowhead.setAttribute("points", points);
      arrowhead.setAttribute("fill", "#247A96");

      foodWebSVG.appendChild(arrowhead);
    });
  }

  // Draw after Record 01 becomes visible.
  record01Card.addEventListener("click", () => {
    requestAnimationFrame(drawFoodWeb);
  });

  // Redraw if the diagram changes size.
  if (organismMap && "ResizeObserver" in window) {
    const observer = new ResizeObserver(drawFoodWeb);
    observer.observe(organismMap);
  }

  window.addEventListener("resize", drawFoodWeb);


  // ==========================================
  // RECORD 01 — ORGANISM CLASSIFICATION
  // All seven organisms
  // ==========================================

  const organismButtons =
    document.querySelectorAll(".organism-node");

  const classificationQuestions =
    document.getElementById("classificationQuestions");

  const selectedOrganismTitle =
    document.getElementById("selectedOrganismTitle");

  const record01PanelMessage =
    document.getElementById("record01PanelMessage");

  const saveClassification =
    document.getElementById("saveClassification");

  const classificationSavedMessage =
    document.getElementById("classificationSavedMessage");

  const heterotrophOptions =
    document.getElementById("heterotrophOptions");

  const feedingClassification =
    document.getElementById("feedingClassification");

  const roleInputs = document.querySelectorAll(
    'input[name="ecologicalRole"]'
  );

  const trophicInputs = document.querySelectorAll(
    'input[name="trophicLevel"]'
  );

  const record01Progress =
    document.getElementById("record01Progress");

  const record01Submit =
    document.getElementById("record01Submit");

  const record01Return =
    document.getElementById("record01Return");

  record01Return.addEventListener("click", () => {
    record01Screen.hidden = true;
    earthArchive.hidden = false;
    window.scrollTo(0, 0);
  });

  // ==========================================
  // RECORD 01 — INTERNAL ANSWER KEY
  // ==========================================

  const record01AnswerKey = {
    A: {
      identity: "Oak tree",
      role: "autotroph",
      feeding: null,
      levels: ["producer"]
    },
    B: {
      identity: "Wild grasses",
      role: "autotroph",
      feeding: null,
      levels: ["producer"]
    },
    C: {
      identity: "Mouse",
      role: "heterotroph",
      feeding: "herbivore",
      levels: ["primary"]
    },
    D: {
      identity: "Grasshopper",
      role: "heterotroph",
      feeding: "herbivore",
      levels: ["primary"]
    },
    E: {
      identity: "Snake",
      role: "heterotroph",
      feeding: "carnivore",
      levels: ["secondary"]
    },
    F: {
      identity: "Songbird",
      role: "heterotroph",
      feeding: "omnivore",
      levels: ["primary", "secondary"]
    },
    G: {
      identity: "Hawk",
      role: "heterotroph",
      feeding: "carnivore",
      levels: ["secondary", "tertiary"]
    }
  };


  // Score all seven organisms.
  // Maximum: 19 points.
  function scoreRecord01(answers) {
    let earned = 0;
    let possible = 0;

    for (const [id, correct] of Object.entries(record01AnswerKey)) {
      const response = answers[id];

      // Nutritional classification: 1 point
      possible++;
      if (response?.role === correct.role) {
        earned++;
      }

      // Feeding classification: 1 point for heterotrophs
      if (correct.feeding !== null) {
        possible++;
        if (
          response?.role === "heterotroph" &&
          response?.feeding === correct.feeding
        ) {
          earned++;
        }
      }

      // Complete trophic-level classification: 1 point
      possible++;
      const selected = response?.levels || [];

      if (
        selected.length === correct.levels.length &&
        correct.levels.every(level => selected.includes(level))
      ) {
        earned++;
      }
    }

    return {
      earned,
      possible,
      percentage: (earned / possible) * 100,
      passes: earned >= 16
    };
  }


  // Store each organism's answers separately.
  const organismAnswers = {};

  // Track which organism is currently selected.
  let activeOrganismId = null;

  // Show or hide the heterotroph dropdown.
  function updateHeterotrophOptions() {

    const selectedRole = document.querySelector(
      'input[name="ecologicalRole"]:checked'
    );

    const isHeterotroph =
      selectedRole?.value === "heterotroph";

    heterotrophOptions.hidden = !isHeterotroph;

    if (!isHeterotroph) {
      feedingClassification.value = "";
    }
  }

  roleInputs.forEach(input => {
    input.addEventListener(
      "change",
      updateHeterotrophOptions
    );
  });

  // Open the classification panel for any organism.
  organismButtons.forEach(button => {

    button.addEventListener("click", () => {

      activeOrganismId = button.dataset.organism;
organismButtons.forEach(node => {
  node.classList.toggle("selected", node === button);
});
      
      selectedOrganismTitle.textContent =
        record01Stage === "revised"
          ? `Organism ${activeOrganismId}: ${record01AnswerKey[activeOrganismId].identity}`
          : `Organism ${activeOrganismId}`;

      record01PanelMessage.hidden = true;
      classificationQuestions.hidden = false;
      classificationSavedMessage.textContent = "";

      const savedAnswers =
        organismAnswers[activeOrganismId];

      // Restore saved nutritional classification.
      roleInputs.forEach(input => {
        input.checked =
          savedAnswers?.role === input.value;
      });

      // Restore saved feeding classification.
      feedingClassification.value =
        savedAnswers?.feeding || "";

      // Restore saved trophic levels.
      trophicInputs.forEach(input => {
        input.checked =
          savedAnswers?.levels.includes(input.value) || false;
      });

      updateHeterotrophOptions();
    });
  });

  // Save the classification for the selected organism.
  saveClassification.addEventListener("click", () => {

    if (!activeOrganismId) return;

    const selectedRole = document.querySelector(
      'input[name="ecologicalRole"]:checked'
    );

    const selectedLevels = Array.from(
      document.querySelectorAll(
        'input[name="trophicLevel"]:checked'
      )
    ).map(input => input.value);

    if (!selectedRole || selectedLevels.length === 0) {
      classificationSavedMessage.textContent =
        "Please answer both questions before saving.";
      return;
    }

    if (
      selectedRole.value === "heterotroph" &&
      !feedingClassification.value
    ) {
      classificationSavedMessage.textContent =
        "Please classify this heterotroph before saving.";
      return;
    }

    organismAnswers[activeOrganismId] = {
      role: selectedRole.value,
      feeding: selectedRole.value === "heterotroph"
        ? feedingClassification.value
        : null,
      levels: selectedLevels
    };

    // Persist this organism's classification.
    if (day2ResearchRecord) {
      day2ResearchRecord.records["01"].answers =
        structuredClone(organismAnswers);

      saveDay2ResearchRecord();
    }


    // Mark this organism as classified.
    const activeButton = document.querySelector(
      `.organism-node[data-organism="${activeOrganismId}"]`
    );

    activeButton.classList.add("classified");

    classificationSavedMessage.textContent =
      "Classification saved. You may revise your answers.";

    // Count completed classifications.
    const completedCount =
      Object.keys(organismAnswers).length;

    record01Progress.textContent =
      `${completedCount} / 7 organisms classified`;

    // Enable submission only when all seven are classified.
    if (completedCount === 7) {
      record01Submit.disabled = false;
    }
  });


  // ==========================================
  // RECORD 01 — INITIAL SUBMISSION & REVEAL
  // ==========================================

  let initialRecord01Answers = null;
  let revisedRecord01Answers = null;
  let record01FinalScore = null;
  let record01Stage = "initial";

  // Restore saved classifications when a researcher enters Day 2.
  function restoreRecord01Answers() {
    if (!day2ResearchRecord) return;

    const savedRecord = day2ResearchRecord.records["01"];
    if (!savedRecord) return;

    // Restore previously saved organism classifications.
    Object.keys(organismAnswers).forEach(id => {
      delete organismAnswers[id];
    });

    Object.assign(
      organismAnswers,
      structuredClone(savedRecord.answers || {})
    );

    // Restore green backgrounds on classified organisms.
    organismButtons.forEach(button => {
      const id = button.dataset.organism;

      button.classList.toggle(
        "classified",
        Boolean(organismAnswers[id])
      );
    });

    // Restore the progress counter.
    const completedCount = Object.keys(organismAnswers).length;

    record01Progress.textContent =
      `${completedCount} / 7 organisms classified`;

    // Restore the submission button state.
    record01Submit.disabled = completedCount !== 7;

    // Restore the saved assessment stage.
    record01Stage = savedRecord.stage || "initial";

    initialRecord01Answers = savedRecord.initialAnswers
      ? structuredClone(savedRecord.initialAnswers)
      : null;

    revisedRecord01Answers = savedRecord.revisedAnswers
      ? structuredClone(savedRecord.revisedAnswers)
      : null;

    record01FinalScore = savedRecord.finalScore ?? null;

    if (record01Stage === "complete" ||
        record01Stage === "revised") {
      restoreOrganismIdentities();
    }

    if (record01Stage === "complete") {
      record01Submit.disabled = true;
      record01Submit.textContent = "RECORD 01 COMPLETE";
      record01Return.hidden = false;

      roleInputs.forEach(input => input.disabled = true);
      trophicInputs.forEach(input => input.disabled = true);
      feedingClassification.disabled = true;
      saveClassification.disabled = true;

      document.getElementById("record01Signal").textContent =
        "RECORD 01 — ANALYSIS COMPLETE";

      record01Progress.textContent =
        "Your initial and revised analyses have been recorded.";

      classificationQuestions.hidden = true;
      record01PanelMessage.hidden = false;
      record01PanelMessage.textContent =
        "Record 01 is complete. You may revisit the restored food web and review your classifications, but your submitted answers can no longer be changed.";

      record01Card.classList.add("submitted");
      record01Card.dataset.status = "complete";
      record01Card.querySelector(".archive-file-icon").textContent = "✓";
      record01Card.querySelector(".archive-file-status").textContent =
        "✓ RECORD SUBMITTED";

    } else if (record01Stage === "revised") {
      record01Submit.textContent = "SUBMIT REVISED ANALYSIS";

    } else if (record01Stage === "restoring") {
      record01Submit.disabled = true;
      document.getElementById("record01QuibTransmission").hidden = false;

      document.getElementById("record01Signal").textContent =
        "RESTORING ORGANISM IDENTITIES...";
    }

  }

  const earthGlitchVideo =
    document.getElementById("earthGlitchVideo");

  const earthImages = {
    A: "earth-oak.png",
    B: "earth-grasses.png",
    C: "earth-mouse.png",
    D: "earth-grasshopper.png",
    E: "earth-snake.png",
    F: "earth-songbird.png",
    G: "earth-hawk.png"
  };

  // Replace the lettered nodes with restored organism cards.
  function restoreOrganismIdentities() {
    organismButtons.forEach(button => {
      const id = button.dataset.organism;
      const identity = record01AnswerKey[id].identity;

      const picture = document.createElement("img");
      picture.src = `assets/${earthImages[id]}`;
      picture.alt = identity;
      picture.className = "earth-organism-image";

      const label = document.createElement("span");
      label.className = "earth-organism-label";
      label.textContent = `${id}: ${identity}`;

      button.replaceChildren(picture, label);
      button.classList.remove("restoring", "recovering-image");
      button.classList.add("identity-restored");
    });

    // Recalculate arrows for the larger illustrated cards.
    requestAnimationFrame(drawFoodWeb);
  }

  
  record01Submit.addEventListener("click", () => {

    // Save the revised analysis after organism identities are restored.
    if (record01Stage === "revised") {
      revisedRecord01Answers = structuredClone(organismAnswers);
      record01FinalScore = scoreRecord01(revisedRecord01Answers);

      console.log("Revised analysis:", record01FinalScore);


      // Preserve both submissions in the researcher's record.
      if (day2ResearchRecord) {
        const record = day2ResearchRecord.records["01"];

        record.initialAnswers = structuredClone(
          initialRecord01Answers
        );
        record.initialScore = scoreRecord01(
          initialRecord01Answers
        );

        record.revisedAnswers = structuredClone(
          revisedRecord01Answers
        );
        record.finalScore = record01FinalScore;

        record.answers = structuredClone(
          revisedRecord01Answers
        );

        record.stage = "complete";
        record.submitted = true;

        saveDay2ResearchRecord();
      }


      record01Stage = "complete";
      record01Submit.disabled = true;
      record01Submit.textContent = "RECORD 01 COMPLETE";
record01Return.hidden = false;

      // Lock all classification inputs after final submission.
      roleInputs.forEach(input => {
        input.disabled = true;
      });

      trophicInputs.forEach(input => {
        input.disabled = true;
      });

      feedingClassification.disabled = true;
      saveClassification.disabled = true;


      document.getElementById("record01Signal").textContent =
        "RECORD 01 — ANALYSIS COMPLETE";

      record01Progress.textContent =
        "Your initial and revised analyses have been recorded.";

      classificationQuestions.hidden = true;
      record01PanelMessage.hidden = false;
      record01PanelMessage.textContent =
  "Record 01 is complete. You may revisit the restored food web and review your classifications, but your submitted answers can no longer be changed.";

      
      // Mark Record 01 as submitted in the archive.
      record01Card.classList.add("submitted");
      record01Card.setAttribute("data-status", "complete");

      // Replace the gold diamond with a green check.
      const record01Icon =
        record01Card.querySelector(".archive-file-icon");

      record01Icon.textContent = "✓";

      // Update the submission status.
      const record01Status =
        record01Card.querySelector(".archive-file-status");

      record01Status.textContent = "✓ RECORD SUBMITTED";
      
      // Count all completed Earth Research Archive files.
      const completedRecords = document.querySelectorAll(
        ".archive-file.submitted"
      ).length;

      document.getElementById(
        "archiveProgressCount"
      ).textContent = `${completedRecords} / 4`;

      document.getElementById(
        "archiveProgressFill"
      ).style.width = `${completedRecords * 25}%`;

      // Return to the Earth Research Archive.
      record01Screen.hidden = true;
      earthArchive.hidden = false;
      window.scrollTo(0, 0);

      return;
    }

    if (record01Stage !== "initial") return;


    initialRecord01Answers =
      structuredClone(organismAnswers);

    const initialScore =
      scoreRecord01(initialRecord01Answers);

    console.log("Initial analysis:", initialScore);


    // Save the original analysis before restoration begins.
    if (day2ResearchRecord) {
      const record = day2ResearchRecord.records["01"];

      record.initialAnswers = structuredClone(
        initialRecord01Answers
      );
      record.initialScore = initialScore;
record.proficient = initialScore.passes;
      record.answers = structuredClone(
        initialRecord01Answers
      );
      record.stage = "restoring";
      record.submitted = false;

      saveDay2ResearchRecord();
    }


    record01Stage = "restoring";
    record01Submit.disabled = true;

    document.getElementById("record01Signal").textContent =
      "RESTORING ORGANISM IDENTITIES...";

    // Show Quib's restoration transmission above the workspace.
    classificationQuestions.hidden = true;
    record01PanelMessage.hidden = false;
    record01PanelMessage.textContent =
      "Initial classifications recorded. Awaiting organism restoration.";

    document.getElementById(
      "record01QuibTransmission"
    ).hidden = false;

document.getElementById(
  "record01QuibTransmission"
).scrollIntoView({
  behavior: "smooth",
  block: "start"
});

  });

document.getElementById("record01RestoreButton")
  .addEventListener("click", () => {

    if (record01Stage !== "restoring") return;

document.querySelector(
  "#record01Screen .organism-map"
).scrollIntoView({
  behavior: "instant",
  block: "center"
});


    // Display the video over the lettered food web.

    earthGlitchVideo.hidden = false;
    earthGlitchVideo.currentTime = 0;

    let restorationFinished = false;

    function finishRestoration() {
      if (restorationFinished) return;
      restorationFinished = true;

      // The video still hides the diagram during the swap.
      restoreOrganismIdentities();

      // Reveal the completed food web on the next frame.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          earthGlitchVideo.pause();
          earthGlitchVideo.hidden = true;
document.getElementById(
  "record01QuibTransmission"
).hidden = true;

          document.getElementById("record01Signal").textContent =
            "IDENTITIES RESTORED";

          record01Progress.textContent =
            "Identity recovery complete. Review your classifications.";

          record01Submit.textContent =
            "SUBMIT REVISED ANALYSIS";

          record01Submit.disabled = false;
          record01Stage = "revised";

if (day2ResearchRecord) {
  day2ResearchRecord.records["01"].stage = "revised";
  saveDay2ResearchRecord();
}

          // Return the classification panel to its normal state.
          classificationQuestions.hidden = true;
          record01PanelMessage.hidden = false;
          record01PanelMessage.textContent =
            "The organism identities have been restored. Select an organism to review or revise your classification.";

        });
      });
    }

    // The normal transition ends when the video finishes.
    earthGlitchVideo.addEventListener(
      "ended",
      finishRestoration,
      { once: true }
    );

    // Recover gracefully if the video cannot load or play.
    earthGlitchVideo.addEventListener(
      "error",
      finishRestoration,
      { once: true }
    );

    const playback = earthGlitchVideo.play();

    if (playback && typeof playback.catch === "function") {
      playback.catch(finishRestoration);
    }
  });

  // ==========================================
  // FILE 04 — RESTORED FOOD WEB ARROWS
  // ==========================================

  const record04Diagram = document.getElementById(
    "record04FoodWeb"
  );

  const record04Arrows = document.getElementById(
    "record04Arrows"
  );

  const record04Connections = [
    [8, 7], // Grasses → Insects
    [8, 4], // Grasses → Mouse
    [8, 5], // Grasses → Rabbit
    [8, 6], // Grasses → Deer
    [7, 3], // Insects → Shrew
    [7, 4], // Insects → Mouse
    [3, 1], // Shrew → Snake
    [4, 1], // Mouse → Snake
    [5, 1], // Rabbit → Snake
    [5, 2], // Rabbit → Cougar
    [6, 2]  // Deer → Cougar
  ];

  function drawRecord04Arrows() {
    if (!record04Diagram || !record04Arrows) return;

    const diagramRect = record04Diagram.getBoundingClientRect();

    if (!diagramRect.width || !diagramRect.height) return;

    record04Arrows.setAttribute(
      "viewBox",
      `0 0 ${diagramRect.width} ${diagramRect.height}`
    );

    record04Arrows.replaceChildren();

    const namespace = "http://www.w3.org/2000/svg";

    function getOrganism(position) {
      const organism = record04Diagram.querySelector(
        `.record04-organism[data-position="${position}"]`
      );

      const rect = organism.getBoundingClientRect();

      return {
        x: rect.left - diagramRect.left + rect.width / 2,
        y: rect.top - diagramRect.top + rect.height / 2,
        halfWidth: rect.width / 2,
        halfHeight: rect.height / 2
      };
    }

    record04Connections.forEach(([food, consumer]) => {

      // Identify the organisms connected by this arrow.
      const foodName = record04Diagram.querySelector(
        `.record04-organism[data-position="${food}"] span`
      )?.textContent.trim();

      const consumerName = record04Diagram.querySelector(
        `.record04-organism[data-position="${consumer}"] span`
      )?.textContent.trim();

      // Highlight only consecutive organisms in the
      // student's selected food chain.
      const selectedConnection = record04SelectedChain.some(
        (name, index) =>
          name === foodName &&
          record04SelectedChain[index + 1] === consumerName
      );

      const arrowColor = selectedConnection
        ? "#238765"
        : "#247a96";

      const start = getOrganism(food);
      const end = getOrganism(consumer);

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);

      if (!distance) return;

      const ux = dx / distance;
      const uy = dy / distance;

      function edgeDistance(node) {
        return Math.min(
          Math.abs(ux) > 0.0001
            ? node.halfWidth / Math.abs(ux)
            : Infinity,
          Math.abs(uy) > 0.0001
            ? node.halfHeight / Math.abs(uy)
            : Infinity
        );
      }

      const startOffset = edgeDistance(start) + 5;
      const endOffset = edgeDistance(end) + 9;

      const x1 = start.x + ux * startOffset;
      const y1 = start.y + uy * startOffset;

      const x2 = end.x - ux * endOffset;
      const y2 = end.y - uy * endOffset;

      const line = document.createElementNS(namespace, "line");

      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", arrowColor);
      line.setAttribute("stroke-width", selectedConnection ? "4" : "2.5");
      line.setAttribute("stroke-linecap", "round");

      record04Arrows.appendChild(line);

      // Arrowhead points toward the consumer.
      const arrowLength = 12;
      const arrowHalfWidth = 5;

      const baseX = x2 - ux * arrowLength;
      const baseY = y2 - uy * arrowLength;

      const perpendicularX = -uy;
      const perpendicularY = ux;

      const arrowhead = document.createElementNS(
        namespace,
        "polygon"
      );

      arrowhead.setAttribute(
        "points",
        [
          `${x2},${y2}`,
          `${baseX + perpendicularX * arrowHalfWidth},${baseY + perpendicularY * arrowHalfWidth}`,
          `${baseX - perpendicularX * arrowHalfWidth},${baseY - perpendicularY * arrowHalfWidth}`
        ].join(" ")
      );

      arrowhead.setAttribute("fill", arrowColor);

      record04Arrows.appendChild(arrowhead);
    });
  }

  // ==========================================
  // FILE 04 — FOOD CHAIN SELECTION
  // ==========================================

  const record04ChainDisplay = document.getElementById(
    "record04ChainDisplay"
  );

  const record04ClearChain = document.getElementById(
    "record04ClearChain"
  );

  let record04SelectedChain = [];

  function renderRecord04Chain() {
    if (!record04ChainDisplay) return;

    record04ChainDisplay.replaceChildren();

    // Refresh arrow colors to match the selected food chain.
    drawRecord04Arrows();

    // Highlight organisms included in the current food chain.
    record04Diagram.querySelectorAll(
      ".record04-organism"
    ).forEach((card) => {
      const name = card.querySelector("span")?.textContent.trim();

      card.classList.toggle(
        "chain-selected",
        record04SelectedChain.includes(name)
      );
    });

    if (record04SelectedChain.length === 0) {
      const placeholder = document.createElement("span");
      placeholder.className = "record04-chain-placeholder";
      placeholder.textContent = "Select a producer to begin.";
      record04ChainDisplay.appendChild(placeholder);
      return;
    }

    record04SelectedChain.forEach((name, index) => {
      if (index > 0) {
        const arrow = document.createElement("span");
        arrow.textContent = "→";
        arrow.setAttribute("aria-label", "energy flows to");
        record04ChainDisplay.appendChild(arrow);
      }

      
      // Find the corresponding illustrated organism card.
      const sourceCard = Array.from(
        record04Diagram.querySelectorAll(".record04-organism")
      ).find((card) =>
        card.querySelector("span")?.textContent.trim() === name
      );

      // Create a miniature illustrated copy.
      const organism = document.createElement("div");
      organism.className = "record04-chain-mini-card";

      if (sourceCard) {
        const illustration = sourceCard.querySelector("img");

        if (illustration) {
          const image = illustration.cloneNode(true);
          organism.appendChild(image);
        }
      }

      const label = document.createElement("span");
      label.textContent = name;
      organism.appendChild(label);

      record04ChainDisplay.appendChild(organism);

    });
  }

  if (record04Diagram) {
    record04Diagram.querySelectorAll(
      ".record04-organism"
    ).forEach(button => {
      button.addEventListener("click", () => {
        const name = button.querySelector("span")?.textContent.trim();

        if (!name) return;

        record04SelectedChain.push(name);
        renderRecord04Chain();
      });
    });
  }

  if (record04ClearChain) {
    record04ClearChain.addEventListener("click", () => {
      record04SelectedChain = [];
      renderRecord04Chain();
    });
  }


  // ==========================================
  // FILE 04 — FOOD CHAIN ASSESSMENT
  // ==========================================

  const record04SubmitChain = document.getElementById(
    "record04SubmitChain"
  );

  const record04ChainFeedback = document.getElementById(
    "record04ChainFeedback"
  );

const record04Continue = document.getElementById(
  "record04Continue"
);

  // Store submitted chains for later assessment.
  let record04SubmittedChains = [];
function isRecord04ChainCorrect(chain) {
  if (!Array.isArray(chain) || chain.length < 3) {
    return false;
  }

  // Translate organism names into food-web positions.
  const positions = chain.map(name => {
    const card = Array.from(
      record04Diagram.querySelectorAll(".record04-organism")
    ).find(card =>
      card.querySelector("span")?.textContent.trim() === name
    );

    return card ? Number(card.dataset.position) : null;
  });

  // Every organism must be recognized.
  if (positions.some(position => position === null)) {
    return false;
  }

  // A valid food chain begins with grasses.
  if (positions[0] !== 8) {
    return false;
  }

  // Organisms cannot repeat within a chain.
  if (new Set(positions).size !== positions.length) {
    return false;
  }

  // Check each food-to-consumer relationship.
  return positions.slice(0, -1).every((food, index) =>
    record04Connections.some(([source, consumer]) =>
      source === food &&
      consumer === positions[index + 1]
    )
  );
}
  if (record04SubmitChain) {
    record04SubmitChain.addEventListener("click", () => {
      if (!record04ChainFeedback) return;

      const chain = [...record04SelectedChain];

      // Check only that a response has been provided.
      // Do not evaluate scientific correctness here.
      if (chain.length < 3) {
        record04ChainFeedback.textContent =
          "Select at least three organisms before submitting.";
        return;
      }

      // Require two distinct submissions without
      // revealing whether either chain is correct.
      const alreadySubmitted = record04SubmittedChains.some(
        previous => JSON.stringify(previous) === JSON.stringify(chain)
      );

      if (alreadySubmitted) {
        record04ChainFeedback.textContent =
          "You have already submitted this sequence. Construct a different food chain.";
        return;
      }

      
      // Record the response exactly as submitted.
      record04SubmittedChains.push(chain);

      // Save the response to this researcher's record.
      if (day2ResearchRecord) {
        const record = day2ResearchRecord.records["04"];

        record.chains = structuredClone(
          record04SubmittedChains
        );
// Score each submitted food chain.
// Award one point for each scientifically valid chain.
record.chainScore = record04SubmittedChains.filter(
  chain => isRecord04ChainCorrect(chain)
).length;

        record.activity1Complete =
          record04SubmittedChains.length === 2;

        // File 04 is not complete until all activities
        // have been submitted.
        record.submitted = false;

        saveDay2ResearchRecord();
      }

      // Clear the selection for the next task.
      record04SelectedChain = [];
      renderRecord04Chain();


      if (record04SubmittedChains.length === 1) {
        record04ChainFeedback.textContent =
          "Food chain 1 recorded. Construct a second, different food chain.";
      } else {
        record04ChainFeedback.textContent =
          "Both food chains recorded. Continue to the next activity.";

document.getElementById("record04ChainBuilder")
  .classList.add("chains-complete");

        record04SubmitChain.disabled = true;
        record04SubmitChain.textContent =
          "Both Chains Submitted";
record04Continue.hidden = false;
      }
    });
  }

  // ==========================================
  // FILE 04 — RESTORE SAVED FOOD CHAINS
  // ==========================================

  function restoreRecord04Progress() {
    if (!day2ResearchRecord) return;

    const saved = day2ResearchRecord.records["04"];

    record04SubmittedChains = Array.isArray(saved?.chains)
      ? structuredClone(saved.chains).slice(0, 2)
      : [];

    // Start with an empty, unsubmitted selection.
    record04SelectedChain = [];
    renderRecord04Chain();

    const count = record04SubmittedChains.length;
record04Continue.hidden = count < 2;

    // Show the simplified completion screen
    // whenever both food chains have been submitted.
    document.getElementById("record04ChainBuilder")
      .classList.toggle("chains-complete", count >= 2);

    record04SubmitChain.disabled = count >= 2;

    record04SubmitChain.textContent = count >= 2
      ? "Both Chains Submitted"
      : "Submit Food Chain";

    // Lock organism selection after both submissions.
    record04Diagram.querySelectorAll(
      ".record04-organism"
    ).forEach(button => {
      button.disabled = count >= 2;
    });

    record04ClearChain.disabled = count >= 2;

    if (count === 0) {
      record04ChainFeedback.textContent = "";
    } else if (count === 1) {
      record04ChainFeedback.textContent =
        "Food chain 1 recorded. Construct a second, different food chain.";
    } else {
      record04ChainFeedback.textContent =
        "Both food chains recorded. Continue to the next activity.";
    }
  
    // Restore File 04's completed archive status.
    const file04Card = document.querySelector(
      '.archive-file[data-record="4"]'
    );

    const completed = saved?.submitted === true;

    file04Card.classList.toggle("submitted", completed);
    file04Card.dataset.status = completed
      ? "complete"
      : "pending";

    file04Card.querySelector(
      ".archive-file-icon"
    ).textContent = completed ? "✓" : "◇";

    file04Card.querySelector(
      ".archive-file-status"
    ).textContent = completed
      ? "✓ RECORD SUBMITTED"
      : "◦ VERIFICATION PENDING";

    // Restore saved population predictions.
    const savedPredictions = saved?.predictions || [];
    const predictionsComplete = saved?.activity2Complete === true;

    document.querySelectorAll(
      "#record04Activity2 .record04-prediction-row"
    ).forEach((row) => {
      const report = row.closest(
        ".record04-disturbance-report"
      ).dataset.report;

      const organism = row.dataset.organism;

      const previous = savedPredictions.find(
        response =>
          response.report === report &&
          response.organism === organism
      );

      const prediction = row.querySelector(
        ".record04-prediction"
      );

      const likelihood = row.querySelector(
        ".record04-likelihood"
      );

      prediction.value = previous?.prediction || "";
      likelihood.value = previous?.likelihood || "";

      prediction.disabled = predictionsComplete;
      likelihood.disabled = predictionsComplete;
    });

    const predictionSubmit = document.getElementById(
      "record04SubmitPredictions"
    );

    predictionSubmit.disabled = predictionsComplete;
    predictionSubmit.textContent = predictionsComplete
      ? "PREDICTIONS SUBMITTED ✓"
      : "SUBMIT POPULATION PREDICTIONS";
  }


// FILE 04 — Begin Population Analysis
const record04QuibIntroduction = document.getElementById(
  "record04QuibIntroduction"
);

const record04Activity1 = document.getElementById(
  "record04Activity1"
);

const record04Activity2 = document.getElementById(
  "record04Activity2"
);

if (record04Continue && record04Activity2) {
  record04Continue.addEventListener("click", () => {

    // Only advance after both food chains are submitted.
    if (record04SubmittedChains.length !== 2) return;

    // Create a noninteractive reference copy of the food web.
    const referencePanel = document.getElementById(
      "record04ReferenceWeb"
    );

    const originalWeb = document.getElementById(
      "record04FoodWeb"
    );

    if (referencePanel && originalWeb) {
      // Make sure the original arrows are up to date.
      drawRecord04Arrows();

      const referenceCopy = originalWeb.cloneNode(true);

      // Avoid duplicate IDs in the document.
      referenceCopy.removeAttribute("id");

      const copiedArrows = referenceCopy.querySelector(
        "#record04Arrows"
      );

      if (copiedArrows) {
        copiedArrows.removeAttribute("id");
      }

      // Keep the diagram visible but not interactive.
      referenceCopy.querySelectorAll("button").forEach(
        (button) => {
          button.disabled = true;
          button.tabIndex = -1;
        }
      );

      referencePanel.replaceChildren(referenceCopy);
    }

    // Hide Activity 1 and reveal Activity 2.
    record04Activity1.hidden = true;
    record04Activity2.hidden = false;

    window.scrollTo(0, 0);
  });
}


const record04BeginAssessment = document.getElementById(
  "record04BeginAssessment"
);
console.log("File 04 button check:", {
  introduction: !!record04QuibIntroduction,
  activity: !!record04Activity1,
  button: !!record04BeginAssessment
});
if (record04QuibIntroduction && record04Activity1 && record04BeginAssessment) {

  // Show Quib's introduction before Activity 1.
  record04Activity1.hidden = true;

  record04BeginAssessment.addEventListener("click", () => {

    // Hide Quib's message and reveal the investigation.
    record04QuibIntroduction.hidden = true;
    record04Activity1.hidden = false;

    // Draw the food-web arrows after the diagram becomes visible.
    requestAnimationFrame(drawRecord04Arrows);

    window.scrollTo(0, 0);
  });
}

  // Draw arrows when File 04 is opened.
  const record04Card = document.querySelector(
    '.archive-file[data-record="4"]'
  );

  const record04Screen = document.getElementById(
    "record04Screen"
  );

  if (record04Card && record04Screen) {
    record04Card.addEventListener("click", () => {
      earthArchive.hidden = true;
      record04Screen.hidden = false;

      requestAnimationFrame(drawRecord04Arrows);
      window.scrollTo(0, 0);
    });
  }

  // Redraw arrows if the diagram changes size.
  if (record04Diagram && "ResizeObserver" in window) {
    const record04Observer = new ResizeObserver(
      drawRecord04Arrows
    );

    record04Observer.observe(record04Diagram);
  }

  // ==========================================
  // FILE 04 — ACTIVITY 2: SCORING
  // ==========================================

  function scoreRecord04Predictions(responses) {

    const answerKey = {
      snake: {
        mouse: {
          directions: ["increase"],
        },
        shrew: {
          directions: ["increase"],
        },
        grasses: {
          directions: ["stable", "uncertain"],
        }
      },

      deer: {
        cougar: {
          directions: ["stable", "decrease", "uncertain"],
        },
        rabbit: {
          directions: ["decrease"],
        },
        grasses: {
          directions: ["increase"],
        }
      }
    };

    let score = 0;

    responses.forEach((response) => {
      const accepted =
        answerKey[response.report]?.[response.organism];

      if (!accepted) return;

      const directionCorrect =
        accepted.directions.includes(response.prediction);

      
if (directionCorrect) {
  score++;
}

    });

    return score;
  }

  // ==========================================
  // FILE 04 — ACTIVITY 2: SUBMISSION VALIDATION
  // ==========================================

  const record04SubmitPredictions = document.getElementById(
    "record04SubmitPredictions"
  );

  const record04PredictionFeedback = document.getElementById(
    "record04PredictionFeedback"
  );

  if (record04SubmitPredictions) {
    record04SubmitPredictions.addEventListener("click", () => {

      const predictionRows = document.querySelectorAll(
        "#record04Activity2 .record04-prediction-row"
      );

      let completed = 0;

      predictionRows.forEach((row) => {
        const prediction = row.querySelector(
          ".record04-prediction"
        );

        const likelihood = row.querySelector(
          ".record04-likelihood"
        );

        if (prediction?.value && likelihood?.value) {
          completed++;
        }
      });

      if (completed !== 6) {
        record04PredictionFeedback.textContent =
          `You have completed ${completed} of 6 predictions. ` +
          "Please complete both selections for every organism.";
        return;
      }

      record04PredictionFeedback.textContent =
        "All six population predictions are complete and ready for submission.";

      // Collect the six completed predictions.
      const responses = [];

      predictionRows.forEach((row) => {
        const report = row.closest(
          ".record04-disturbance-report"
        ).dataset.report;

        const organism = row.dataset.organism;

        const prediction = row.querySelector(
          ".record04-prediction"
        ).value;

        const likelihood = row.querySelector(
          ".record04-likelihood"
        ).value;

        responses.push({
          report,
          organism,
          prediction,
          likelihood
        });
      });

      // Calculate the assessment score.
      const score = scoreRecord04Predictions(responses);


      // Save the student's original answers and score.
      if (!day2ResearchRecord) {
        record04PredictionFeedback.textContent =
          "Research record unavailable. Please try again.";
        return;
      }

      const record = day2ResearchRecord.records["04"];

      record.predictions = structuredClone(responses);
      record.predictionScore = score;
// Combine food-chain and population-prediction scores.
record.totalScore =
  record.chainScore + record.predictionScore;

// Proficiency requires at least 7 of 8 points.
record.proficient = record.totalScore >= 7;
      record.activity2Complete = true;
      record.submitted = true;

      saveDay2ResearchRecord();

      // Lock the submitted answers.
      predictionRows.forEach((row) => {
        row.querySelectorAll("select").forEach((select) => {
          select.disabled = true;
        });
      });

      record04SubmitPredictions.disabled = true;
      record04SubmitPredictions.textContent =
        "PREDICTIONS SUBMITTED ✓";

      // Update File 04 on the archive home page.
      const file04Card = document.querySelector(
        '.archive-file[data-record="4"]'
      );

      file04Card.classList.add("submitted");
      file04Card.dataset.status = "complete";

      file04Card.querySelector(
        ".archive-file-icon"
      ).textContent = "✓";

      file04Card.querySelector(
        ".archive-file-status"
      ).textContent = "✓ RECORD SUBMITTED";

      // Update overall archive progress.
      const completedRecords = document.querySelectorAll(
        ".archive-file.submitted"
      ).length;

      document.getElementById(
        "archiveProgressCount"
      ).textContent = `${completedRecords} / 4`;

      document.getElementById(
        "archiveProgressFill"
      ).style.width = `${completedRecords * 25}%`;

      // Enable the next stage when all four files are complete.
      const submitArchive = document.getElementById(
        "submitArchive"
      );

      if (completedRecords === 4) {
        submitArchive.disabled = false;
        submitArchive.textContent =
          "SUBMIT TO ARCHIVIST QUIB FOR REVIEW →";
      }

      // Return to the Earth Research Archive.
      document.getElementById("record04Screen").hidden = true;
      document.getElementById("earthArchive").hidden = false;

      window.scrollTo(0, 0);


    });
  }

});
