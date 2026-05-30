(() => {
  const storageKey = "graduationAttendanceSubmission";
  let requestId = 0;

  function normalizeName(name) {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function readSubmission() {
    try {
      const rawSubmission = localStorage.getItem(storageKey);
      return rawSubmission ? JSON.parse(rawSubmission) : null;
    } catch (error) {
      console.warn("Could not read attendance state", error);
      return null;
    }
  }

  function saveSubmission(name) {
    try {
      const submission = {
        name,
        submittedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(submission));
      return submission;
    } catch (error) {
      console.warn("Could not save attendance state", error);
      return null;
    }
  }

  function submitRemote(scriptUrl, name) {
    return new Promise((resolve) => {
      const callbackName = `attendanceSubmitCallback${Date.now()}${requestId++}`;
      const script = document.createElement("script");
      const cleanup = () => {
        delete window[callbackName];
        script.remove();
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve({ ok: true, unchecked: true });
      }, 8000);

      window[callbackName] = (response) => {
        clearTimeout(timeout);
        cleanup();
        resolve(response || { ok: false });
      };

      script.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        resolve({ ok: true, unchecked: true });
      };

      const separator = scriptUrl.includes("?") ? "&" : "?";
      script.src = `${scriptUrl}${separator}action=submit&name=${encodeURIComponent(
        name,
      )}&callback=${encodeURIComponent(callbackName)}`;
      document.body.appendChild(script);
    });
  }

  function showSubmittedScreen(name) {
    const screenStart = document.getElementById("screen-start");
    const inputSection = document.getElementById("input-section");
    const successMsg = document.getElementById("success-msg");
    const displayName = document.getElementById("display-name");
    const externalPhotos = document.getElementById("external-photos");

    if (screenStart) {
      screenStart.classList.add("hidden");
    }

    if (inputSection) {
      inputSection.classList.add("hidden");
      inputSection.classList.remove("letter-in");
    }

    if (displayName) {
      displayName.innerText = name;
    }

    if (successMsg) {
      successMsg.classList.remove("hidden");
    }

    if (externalPhotos) {
      externalPhotos.classList.add("hidden");
      externalPhotos.classList.remove("fade-out");
    }
  }

  window.attendanceState = {
    hasSubmitted() {
      return Boolean(readSubmission());
    },
    hasSubmittedName(name) {
      const submission = readSubmission();
      return Boolean(
        submission && normalizeName(submission.name) === normalizeName(name),
      );
    },
    getSubmission: readSubmission,
    saveSubmission,
    submitRemote,
    showSubmittedScreen,
  };
})();
