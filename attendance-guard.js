(() => {
  const blockedNameKeys = ["thaivy"];
  const submitTimes = [];
  const spamWindowMs = 10000;
  const maxSubmitsInWindow = 3;
  const cooldownMs = 30000;
  let blockedUntil = 0;

  function normalizeName(name) {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function compactName(name) {
    return normalizeName(name).replace(/[^a-z]/g, "");
  }

  function showGuardNotice(message, title) {
    if (typeof window.showNotice === "function") {
      window.showNotice(message, title, "⚠️");
      return;
    }

    const statusMsg = document.getElementById("status-msg");
    if (statusMsg) {
      statusMsg.textContent = message;
    } else {
      alert(message);
    }
  }

  window.attendanceGuard = {
    canSubmit(name) {
      const now = Date.now();
      const normalizedName = compactName(name);

      if (blockedNameKeys.some((blockedName) => normalizedName.includes(blockedName))) {
        showGuardNotice(
          "Tên này không được phép xác nhận tham dự.",
          "Không thể gửi",
        );
        return false;
      }

      if (now < blockedUntil) {
        const secondsLeft = Math.ceil((blockedUntil - now) / 1000);
        showGuardNotice(
          `Bạn đang gửi quá nhanh. Vui lòng thử lại sau ${secondsLeft} giây.`,
          "Tạm chặn gửi liên tục",
        );
        return false;
      }

      while (submitTimes.length && now - submitTimes[0] > spamWindowMs) {
        submitTimes.shift();
      }

      if (submitTimes.length >= maxSubmitsInWindow) {
        blockedUntil = now + cooldownMs;
        showGuardNotice(
          "Bạn đã gửi liên tục quá nhiều lần. Vui lòng chờ một chút rồi thử lại.",
          "Tạm chặn gửi liên tục",
        );
        return false;
      }

      submitTimes.push(now);
      return true;
    },
  };
})();
